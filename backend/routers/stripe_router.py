import os
import time

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import JSONResponse
from pydantic import BaseModel

import stripe
from database import get_supabase
from services.stripe_checkout_service import (
    extract_session_data,
    handle_checkout_completed,
    handle_subscription_ended,
)
from services.subscription_service import (
    handle_checkout_subscription,
    handle_invoice_paid,
    handle_invoice_payment_failed,
    handle_subscription_updated,
)
from services.credits_service import add_extra_pack

router = APIRouter()


def _test_mode() -> bool:
    return os.getenv("STRIPE_TEST_MODE", "false").strip().lower() == "true"


def _stripe():
    key = "STRIPE_SECRET_KEY_TEST" if _test_mode() else "STRIPE_SECRET_KEY"
    stripe.api_key = os.getenv(key)
    return stripe


# ─── Checkout instructor (plan único original) ────────────────────────────────

class CheckoutRequest(BaseModel):
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
            payment_method_types=["card"],
            mode="payment",
            line_items=[{"price": price_id, "quantity": 1}],
            success_url=data.success_url,
            cancel_url=data.cancel_url,
            billing_address_collection="auto",
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
    frontend = os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app")
    portal = sc.billing_portal.Session.create(
        customer=customer_id,
        return_url=f"{frontend}/panel.html",
    )
    return {"portal_url": portal.url}


# ─── Webhook ──────────────────────────────────────────────────────────────────

@router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    payload    = await request.body()
    sig_header = request.headers.get("stripe-signature", "")
    secret_key = "STRIPE_WEBHOOK_SECRET_TEST" if _test_mode() else "STRIPE_WEBHOOK_SECRET"
    webhook_secret = os.getenv(secret_key, "").strip()

    if not webhook_secret:
        return JSONResponse({"detail": "Webhook secret no configurado."}, status_code=500)

    sc = _stripe()
    try:
        event = sc.Webhook.construct_event(payload, sig_header, webhook_secret)
    except Exception as e:
        print(f"[webhook] Firma inválida: {e}")
        return JSONResponse({"detail": "Firma inválida."}, status_code=400)

    etype = event["type"]
    obj   = event["data"]["object"]
    print(f"[webhook] {etype}")

    try:
        if etype == "checkout.session.completed":
            mode = obj.get("mode") if isinstance(obj, dict) else getattr(obj, "mode", "")
            meta = obj.get("metadata") or {} if isinstance(obj, dict) else dict(obj.metadata or {})
            if mode == "subscription":
                handle_checkout_subscription(obj)
            elif mode == "payment" and meta.get("type") == "creditos_extra":
                user_id = meta.get("user_id", "")
                pi_id   = obj.get("payment_intent", "") if isinstance(obj, dict) \
                          else getattr(obj, "payment_intent", "")
                if user_id and pi_id:
                    add_extra_pack(user_id, pi_id)
            else:
                handle_checkout_completed(obj)

        elif etype == "invoice.paid":
            handle_invoice_paid(obj)

        elif etype == "customer.subscription.updated":
            handle_subscription_updated(obj)

        elif etype in ("customer.subscription.deleted", "customer.subscription.paused"):
            handle_subscription_ended(obj if isinstance(obj, dict) else obj.to_dict())

        elif etype == "invoice.payment_failed":
            handle_invoice_payment_failed(obj)

    except Exception as e:
        print(f"[webhook] Error en {etype}: {type(e).__name__}: {e}")

    return {"received": True}


# ─── Repair checkout (superadmin) ─────────────────────────────────────────────

@router.post("/admin/repair-checkout")
def repair_checkout(request: Request, session_id: str):
    uid = request.state.user.get("sub") if hasattr(request.state, "user") and request.state.user else None
    if not uid:
        raise HTTPException(status_code=401, detail="Autenticación requerida.")
    sb = get_supabase()
    prof = sb.table("profiles").select("rol").eq("id", uid).single().execute()
    if not prof.data or prof.data.get("rol") != "super_admin":
        raise HTTPException(status_code=403, detail="Solo superadmin.")

    sc = _stripe()
    try:
        session = sc.checkout.Session.retrieve(session_id)
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Sesión no encontrada: {e}")

    data = extract_session_data(session)
    if not data["email"]:
        raise HTTPException(status_code=400, detail="No se encontró email en la sesión.")
    if data["pstatus"] != "paid":
        raise HTTPException(status_code=400, detail=f"El pago no está confirmado ({data['pstatus']}).")

    handle_checkout_completed(data)
    return {"ok": True, "email": data["email"], "session_id": session_id}
