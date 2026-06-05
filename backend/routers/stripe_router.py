from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from database import get_supabase
from services.email_service import send_template
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
    webhook_secret = os.getenv("STRIPE_WEBHOOK_SECRET", "")

    sc = _stripe()
    try:
        event = sc.Webhook.construct_event(payload, sig_header, webhook_secret)
    except Exception:
        return JSONResponse({"detail": "Firma inválida."}, status_code=400)

    etype = event["type"]

    if etype == "checkout.session.completed":
        _handle_checkout_completed(event["data"]["object"])
    elif etype in ("customer.subscription.deleted", "customer.subscription.paused"):
        _handle_subscription_ended(event["data"]["object"])

    return {"received": True}


def _handle_checkout_completed(session: dict):
    meta = session.get("metadata") or {}
    email    = meta.get("email") or (session.get("customer_details") or {}).get("email", "")
    nombre   = meta.get("nombre", "")
    apellido = meta.get("apellido", "")

    if not email:
        return

    stripe_customer_id = session.get("customer") or ""
    frontend_url = os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app")
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
        sb.table("profiles").update({"activo": False}).eq("stripe_customer_id", stripe_customer_id).execute()
    except Exception as e:
        print(f"⚠️ subscription_ended error: {e}")
