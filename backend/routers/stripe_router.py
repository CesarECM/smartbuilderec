from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from database import get_supabase
from services.email_service import send_template
from datetime import datetime, timedelta, timezone
import stripe
import os

router = APIRouter()


def _test_mode() -> bool:
    return os.getenv("STRIPE_TEST_MODE", "false").strip().lower() == "true"


def _stripe():
    key = "STRIPE_SECRET_KEY_TEST" if _test_mode() else "STRIPE_SECRET_KEY"
    stripe.api_key = os.getenv(key)
    return stripe


# ─── Checkout (solo plan instructor) ──────────────────────────────────────────

class CheckoutRequest(BaseModel):
    email: str
    nombre: str
    success_url: str
    cancel_url: str


@router.post("/checkout/session")
def crear_checkout(data: CheckoutRequest):
    price_id = os.getenv("STRIPE_PRICE_INSTRUCTOR_TEST" if _test_mode() else "STRIPE_PRICE_INSTRUCTOR")
    if not price_id:
        raise HTTPException(status_code=500, detail="STRIPE_PRICE_INSTRUCTOR no configurado.")

    sc = _stripe()
    try:
        session = sc.checkout.Session.create(
            customer_email=data.email,
            payment_method_types=["card"],
            mode="payment",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=data.success_url,
            cancel_url=data.cancel_url,
            metadata={
                "email":  data.email,
                "nombre": data.nombre,
            },
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except stripe.StripeError as e:
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/checkout/verify")
def verificar_checkout(session_id: str):
    sc = _stripe()
    try:
        session = sc.checkout.Session.retrieve(session_id)
        status = getattr(session, "payment_status", None) or getattr(session, "status", None)
        cd = getattr(session, "customer_details", None)
        email = getattr(cd, "email", "") if cd else ""
        return {"status": status, "email": email}
    except Exception:
        raise HTTPException(status_code=404, detail="Sesión no encontrada.")


# ─── Portal de facturación ────────────────────────────────────────────────────

@router.post("/billing/portal")
def billing_portal(request: Request):
    caller_id = request.state.user.get("sub")
    sb = get_supabase()
    res = sb.table("profiles").select("stripe_customer_id").eq("id", caller_id).single().execute()
    customer_id = (res.data or {}).get("stripe_customer_id")
    if not customer_id:
        raise HTTPException(status_code=404, detail="No hay suscripción activa.")

    sc = _stripe()
    portal = sc.billing_portal.Session.create(
        customer=customer_id,
        return_url=os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app") + "/dashboard.html",
    )
    return {"portal_url": portal.url}


# ─── Webhook ──────────────────────────────────────────────────────────────────

@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    payload = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET_TEST" if _test_mode() else "STRIPE_WEBHOOK_SECRET", "").strip()

    if not webhook_secret:
        print("[webhook] ERROR: STRIPE_WEBHOOK_SECRET no configurado")
        return JSONResponse({"detail": "Webhook secret no configurado."}, status_code=500)

    sc = _stripe()
    try:
        event = sc.Webhook.construct_event(payload, sig_header, webhook_secret)
    except Exception as e:
        print(f"[webhook] Firma inválida: {type(e).__name__}: {e}")
        return JSONResponse({"detail": "Firma inválida."}, status_code=400)

    etype = event["type"]
    print(f"[webhook] Evento recibido: {etype}")

    try:
        if etype == "checkout.session.completed":
            _handle_checkout_completed(event["data"]["object"])
        elif etype in ("customer.subscription.deleted", "customer.subscription.paused"):
            _handle_subscription_ended(event["data"]["object"])
    except Exception as e:
        print(f"[webhook] Error procesando {etype}: {type(e).__name__}: {e}")

    return {"received": True}


@router.post("/admin/repair-checkout")
def repair_checkout(request: Request, session_id: str):
    """Activa manualmente una cuenta a partir de un Stripe session_id ya pagado.
    Solo superadmin. Úsalo cuando el webhook falló pero el pago fue exitoso."""
    from database import get_supabase as _gsb
    uid = request.state.user.get("sub") if hasattr(request.state, "user") and request.state.user else None
    if not uid:
        raise HTTPException(status_code=401, detail="Autenticación requerida.")
    sb = _gsb()
    prof = sb.table("profiles").select("rol").eq("id", uid).single().execute()
    if not prof.data or prof.data.get("rol") != "super_admin":
        raise HTTPException(status_code=403, detail="Solo superadmin.")

    sc = _stripe()
    try:
        session = sc.checkout.Session.retrieve(session_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Sesión no encontrada: {e}")

    data = _extract_session_data(session)
    if not data["email"]:
        raise HTTPException(status_code=400, detail="No se encontró email en la sesión de Stripe.")
    if data["pstatus"] != "paid":
        raise HTTPException(status_code=400, detail=f"El pago no está confirmado (status: {data['pstatus']}).")

    _handle_checkout_completed(data)
    print(f"[repair-checkout] Cuenta activada para {data['email']} — session {session_id}")
    return {"ok": True, "email": data["email"], "session_id": session_id}


def _extract_session_data(session) -> dict:
    """Convierte un objeto Session de Stripe (cualquier versión SDK) a dict plano.
    SDK >=8: objetos tipados sin .get() → usar getattr.
    SDK <8:  StripeObject dict-like → getattr también funciona."""
    meta = getattr(session, "metadata", None) or {}

    cd       = getattr(session, "customer_details", None)
    cd_email = getattr(cd, "email", None) if cd else None

    email  = meta.get("email") or cd_email or ""
    nombre = meta.get("nombre") or ""

    customer = getattr(session, "customer", None) or ""
    if customer and not isinstance(customer, str):
        customer = getattr(customer, "id", "") or ""

    print(f"[checkout] metadata extraída — nombre: '{nombre}', email: '{email}'")
    return {
        "email":  str(email),
        "nombre": str(nombre),
        "customer": str(customer),
        "amount":   getattr(session, "amount_total", None) or 179900,
        "pstatus":  getattr(session, "payment_status", None) or "",
    }


def _handle_checkout_completed(session):
    # Acepta tanto objeto Stripe como dict plano (desde repair-checkout)
    if isinstance(session, dict) and "email" in session:
        data = session  # ya es dict plano de _extract_session_data
    else:
        data = _extract_session_data(session)

    email    = data["email"]
    nombre   = data["nombre"]
    stripe_customer_id = data["customer"]
    monto_centavos     = data["amount"]

    if not email:
        print("[checkout] Sin email — no se puede crear usuario")
        return

    vigencia_hasta = (datetime.now(timezone.utc) + timedelta(days=90)).strftime("%Y-%m-%d")
    sb = get_supabase()

    try:
        result = sb.auth.admin.create_user({
            "email": email,
            "email_confirm": True,
            "user_metadata": {"nombre": nombre, "apellido": apellido},
        })
        user_id = result.user.id

        sb.table("profiles").update({
            "nombre":             nombre,
            "rol":                "user",
            "activo":             True,
            "admin_id":           None,
            "stripe_customer_id": stripe_customer_id,
            "vigencia_hasta":     vigencia_hasta,
        }).eq("id", user_id).execute()

        frontend_url = os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app")
        link_acceso = f"{frontend_url}/reset-password.html"
        try:
            link_res = sb.auth.admin.generate_link({
                "type": "recovery",
                "email": email,
                "options": {"redirect_to": f"{frontend_url}/reset-password.html"},
            })
            if hasattr(link_res, "properties") and link_res.properties:
                link_acceso = getattr(link_res.properties, "action_link", link_acceso) or link_acceso
            print(f"[checkout] link_acceso generado: {link_acceso[:80]}...")
        except Exception as le:
            print(f"[checkout] generate_link error: {le}")

        monto_str = f"${monto_centavos // 100:,.0f} MXN"
        send_template("bienvenida_user_stripe", email, {
            "nombre":      nombre or email,
            "email":       email,
            "monto":       monto_str,
            "link_acceso": link_acceso,
        })
        print(f"[checkout] Usuario creado: {email}")

    except Exception as e:
        err = str(e)
        if "already been registered" in err or "already exists" in err:
            try:
                sb.table("profiles").update({
                    "stripe_customer_id": stripe_customer_id,
                    "activo":             True,
                    "vigencia_hasta":     vigencia_hasta,
                }).eq("email", email).execute()
                print(f"[checkout] Usuario existente reactivado: {email}")
            except Exception:
                pass
        else:
            print(f"⚠️ checkout_completed error: {err}")


def _handle_subscription_ended(subscription: dict):
    stripe_customer_id = subscription.get("customer", "")
    if not stripe_customer_id:
        return
    sb = get_supabase()
    try:
        user_res = sb.table("profiles").select("nombre, email").eq("stripe_customer_id", stripe_customer_id).single().execute()
        sb.table("profiles").update({"activo": False}).eq("stripe_customer_id", stripe_customer_id).execute()
        if user_res.data and user_res.data.get("email"):
            send_template("suscripcion_cancelada", user_res.data["email"], {
                "nombre": user_res.data.get("nombre") or user_res.data["email"],
                "email": user_res.data["email"],
            })
    except Exception as e:
        print(f"⚠️ subscription_ended error: {e}")
