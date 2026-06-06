from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from database import get_supabase
from services.email_service import send_template
from datetime import datetime, timedelta, timezone
import stripe
import os

router = APIRouter()


def _stripe():
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    return stripe


# ─── Checkout (solo plan instructor) ──────────────────────────────────────────

class CheckoutRequest(BaseModel):
    email: str
    nombre: str
    apellido: str
    success_url: str
    cancel_url: str


@router.post("/checkout/session")
def crear_checkout(data: CheckoutRequest):
    price_id = os.getenv("STRIPE_PRICE_INSTRUCTOR")
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
                "email": data.email,
                "nombre": data.nombre,
                "apellido": data.apellido,
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
        return {
            "status": session.get("payment_status") or session.get("status"),
            "email": (session.get("customer_details") or {}).get("email", ""),
        }
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
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "").strip()

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

    pstatus = session["payment_status"] if "payment_status" in session else ""
    if pstatus != "paid":
        raise HTTPException(status_code=400, detail=f"El pago no está confirmado (status: {pstatus}).")

    # Extraer datos como dict plano para evitar problemas con objetos Stripe anidados
    meta = session["metadata"] or {} if "metadata" in session else {}
    cd   = session["customer_details"] if "customer_details" in session else None
    email    = str(meta.get("email") or (cd["email"] if cd and "email" in cd else "") or "")
    nombre   = str(meta.get("nombre", ""))
    apellido = str(meta.get("apellido", ""))
    customer = session["customer"] if "customer" in session else ""
    if customer and not isinstance(customer, str):
        customer = getattr(customer, "id", str(customer))
    amount = session["amount_total"] if "amount_total" in session else 179900

    if not email:
        raise HTTPException(status_code=400, detail="No se encontró email en la sesión de Stripe.")

    session_plain = {
        "metadata":         {"email": email, "nombre": nombre, "apellido": apellido},
        "customer_details": {"email": email},
        "customer":         customer or "",
        "amount_total":     amount,
    }
    _handle_checkout_completed(session_plain)
    print(f"[repair-checkout] Cuenta activada para {email} — session {session_id}")
    return {"ok": True, "email": email, "session_id": session_id}


def _handle_checkout_completed(session: dict):
    meta = session.get("metadata") or {}
    email    = meta.get("email") or (session.get("customer_details") or {}).get("email", "")
    nombre   = meta.get("nombre", "")
    apellido = meta.get("apellido", "")

    if not email:
        return

    stripe_customer_id = session.get("customer") or ""
    frontend_url = os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app")
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
            "nombre": nombre,
            "apellido": apellido,
            "rol": "user",
            "activo": True,
            "admin_id": None,
            "stripe_customer_id": stripe_customer_id,
            "vigencia_hasta": vigencia_hasta,
        }).eq("id", user_id).execute()

        # Monto del pago (en centavos → pesos)
        monto_centavos = session.get("amount_total") or 179900
        monto_str = f"${monto_centavos // 100:,.0f} MXN"

        send_template("bienvenida_user_stripe", email, {
            "nombre": nombre or email,
            "email": email,
            "monto": monto_str,
        })

    except Exception as e:
        err = str(e)
        if "already been registered" in err or "already exists" in err:
            try:
                sb.table("profiles").update({
                    "stripe_customer_id": stripe_customer_id,
                    "activo": True,
                    "vigencia_hasta": vigencia_hasta,
                }).eq("email", email).execute()
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
