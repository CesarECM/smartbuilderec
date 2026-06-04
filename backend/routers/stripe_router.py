from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from database import get_supabase
import stripe
import os

router = APIRouter()

CREDITS_ADMIN_MENSUAL = 2


def _stripe():
    stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
    return stripe


# ─── Checkout ─────────────────────────────────────────────────────────────────

class CheckoutRequest(BaseModel):
    email: str
    nombre: str
    apellido: str
    plan: str          # "instructor" | "admin"
    success_url: str
    cancel_url: str


@router.post("/checkout/session")
def crear_checkout(data: CheckoutRequest):
    plan = data.plan.lower()
    if plan == "instructor":
        price_id = os.getenv("STRIPE_PRICE_INSTRUCTOR")
        mode = "payment"
        if not price_id:
            raise HTTPException(status_code=500, detail="STRIPE_PRICE_INSTRUCTOR no configurado.")
    elif plan == "admin":
        price_id = os.getenv("STRIPE_PRICE_ADMIN")
        mode = "subscription"
        if not price_id:
            raise HTTPException(status_code=500, detail="STRIPE_PRICE_ADMIN no configurado.")
    else:
        raise HTTPException(status_code=400, detail="Plan no válido. Usa 'instructor' o 'admin'.")

    sc = _stripe()
    try:
        session = sc.checkout.Session.create(
            customer_email=data.email,
            payment_method_types=["card"],
            mode=mode,
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=data.success_url,
            cancel_url=data.cancel_url,
            metadata={
                "email": data.email,
                "nombre": data.nombre,
                "apellido": data.apellido,
                "plan": plan,
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
            "plan": (session.get("metadata") or {}).get("plan", "instructor"),
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
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    sc = _stripe()
    try:
        event = sc.Webhook.construct_event(payload, sig_header, webhook_secret)
    except Exception:
        return JSONResponse({"detail": "Firma inválida."}, status_code=400)

    etype = event["type"]

    if etype == "checkout.session.completed":
        _handle_checkout_completed(event["data"]["object"])

    elif etype == "invoice.paid":
        _handle_invoice_paid(event["data"]["object"])

    elif etype in ("customer.subscription.deleted", "customer.subscription.paused"):
        _handle_subscription_ended(event["data"]["object"])

    return {"received": True}


def _handle_checkout_completed(session: dict):
    meta = session.get("metadata") or {}
    email    = meta.get("email") or (session.get("customer_details") or {}).get("email", "")
    nombre   = meta.get("nombre", "")
    apellido = meta.get("apellido", "")
    plan     = meta.get("plan", "instructor")

    if not email:
        return

    stripe_customer_id     = session.get("customer") or ""
    stripe_subscription_id = session.get("subscription") or ""
    rol = "admin" if plan == "admin" else "user"
    credits_iniciales = CREDITS_ADMIN_MENSUAL if rol == "admin" else 0

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
            "rol": rol,
            "activo": True,
            "credits": credits_iniciales,
            "stripe_customer_id": stripe_customer_id,
            "stripe_subscription_id": stripe_subscription_id or None,
        }).eq("id", user_id).execute()
    except Exception as e:
        err = str(e)
        if "already been registered" in err or "already exists" in err:
            # El usuario ya existe — actualizar stripe info
            try:
                sb.table("profiles").update({
                    "stripe_customer_id": stripe_customer_id,
                    "stripe_subscription_id": stripe_subscription_id or None,
                    "activo": True,
                }).eq("email", email).execute()
            except Exception:
                pass
        else:
            print(f"⚠️ checkout_completed create_user error: {err}")


def _handle_invoice_paid(invoice: dict):
    # Solo renovaciones mensuales (no la factura inicial de creación)
    if invoice.get("billing_reason") != "subscription_cycle":
        return

    stripe_customer_id = invoice.get("customer", "")
    if not stripe_customer_id:
        return

    sb = get_supabase()
    try:
        res = sb.table("profiles").select("id, credits, rol").eq("stripe_customer_id", stripe_customer_id).single().execute()
        perfil = res.data or {}
        if perfil.get("rol") == "admin":
            nuevos = (perfil.get("credits") or 0) + CREDITS_ADMIN_MENSUAL
            sb.table("profiles").update({"credits": nuevos}).eq("id", perfil["id"]).execute()
    except Exception as e:
        print(f"⚠️ invoice.paid error: {e}")


def _handle_subscription_ended(subscription: dict):
    stripe_customer_id = subscription.get("customer", "")
    if not stripe_customer_id:
        return
    sb = get_supabase()
    try:
        sb.table("profiles").update({"activo": False}).eq("stripe_customer_id", stripe_customer_id).execute()
    except Exception as e:
        print(f"⚠️ subscription_ended error: {e}")
