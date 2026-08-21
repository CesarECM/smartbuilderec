"""
MPS #009 — Endpoints de suscripciones y créditos para admins (CE/EI).
"""
import os
from datetime import datetime, timezone
from typing import Optional

import stripe
from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from database import get_supabase
from services.credits_service import (
    add_extra_pack, expire_stale_packs, get_credits_summary,
)
from services.subscription_service import PLAN_CREDITS

router = APIRouter(prefix="/planes", tags=["planes"])


def _stripe():
    key = "STRIPE_SECRET_KEY_TEST" if os.getenv("STRIPE_TEST_MODE", "false").lower() == "true" \
          else "STRIPE_SECRET_KEY"
    stripe.api_key = os.getenv(key)
    return stripe


def _price_id(plan_key: str) -> str:
    suffix = "_TEST" if os.getenv("STRIPE_TEST_MODE", "false").lower() == "true" else ""
    pid = os.getenv(f"STRIPE_PRICE_{plan_key.upper()}{suffix}", "")
    if not pid:
        raise HTTPException(
            status_code=500, detail=f"STRIPE_PRICE_{plan_key.upper()}{suffix} no configurado."
        )
    return pid


def _require_admin(request: Request) -> str:
    user = getattr(request.state, "user", None) or {}
    uid  = user.get("sub", "")
    if not uid:
        raise HTTPException(status_code=401, detail="Autenticación requerida.")
    return uid


def _get_admin_profile(caller_id: str, sb):
    res = sb.table("profiles").select("id, rol, email, nombre, credits, stripe_customer_id") \
        .eq("id", caller_id).single().execute()
    profile = res.data or {}
    if profile.get("rol") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Solo admins pueden gestionar suscripciones.")
    return profile


# ── Crear Checkout Session para suscripción ────────────────────────────────────

class CheckoutSubRequest(BaseModel):
    plan: str
    success_url: Optional[str] = None
    cancel_url:  Optional[str] = None


@router.post("/checkout-subscription")
def checkout_subscription(data: CheckoutSubRequest, request: Request):
    if data.plan not in PLAN_CREDITS:
        raise HTTPException(status_code=400, detail=f"Plan inválido: {data.plan}")
    caller_id = _require_admin(request)
    sb = get_supabase()
    profile = _get_admin_profile(caller_id, sb)
    frontend = os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app")

    sc = _stripe()
    params: dict = {
        "payment_method_types": ["card"],
        "mode": "subscription",
        "line_items": [{"price": _price_id(data.plan), "quantity": 1}],
        "success_url": data.success_url or f"{frontend}/panel.html?payment=success",
        "cancel_url":  data.cancel_url  or f"{frontend}/pagos.html",
        "metadata":    {"user_id": caller_id, "plan": data.plan},
    }

    customer_id = profile.get("stripe_customer_id") or ""
    if customer_id:
        params["customer"] = customer_id
    else:
        params["customer_email"] = profile.get("email", "")

    try:
        session = sc.checkout.Session.create(**params)
        return {"checkout_url": session.url, "session_id": session.id}
    except stripe.StripeError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Crear Checkout Session para créditos extra (one-time) ─────────────────────

class CheckoutExtraRequest(BaseModel):
    success_url: Optional[str] = None
    cancel_url:  Optional[str] = None


@router.post("/checkout-creditos-extra")
def checkout_creditos_extra(data: CheckoutExtraRequest, request: Request):
    caller_id = _require_admin(request)
    sb = get_supabase()
    profile = _get_admin_profile(caller_id, sb)
    frontend = os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app")

    sc = _stripe()
    params: dict = {
        "payment_method_types": ["card"],
        "mode": "payment",
        "line_items": [{"price": _price_id("creditos_extra"), "quantity": 1}],
        "success_url": data.success_url or f"{frontend}/panel.html?payment=extra_ok",
        "cancel_url":  data.cancel_url  or f"{frontend}/panel.html?tab=mi-plan",
        "metadata":    {"user_id": caller_id, "type": "creditos_extra"},
    }

    customer_id = profile.get("stripe_customer_id") or ""
    if customer_id:
        params["customer"] = customer_id
    else:
        params["customer_email"] = profile.get("email", "")

    try:
        session = sc.checkout.Session.create(**params)
        return {"checkout_url": session.url, "session_id": session.id}
    except stripe.StripeError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Estado de suscripción + créditos ──────────────────────────────────────────

@router.get("/status")
def get_status(request: Request, as_user_id: str = ""):
    try:
        caller_id = _require_admin(request)
        sb = get_supabase()
        caller_profile = _get_admin_profile(caller_id, sb)

        target_id = caller_id
        if as_user_id and caller_profile.get("rol") == "super_admin":
            target_id = as_user_id

        summary = get_credits_summary(target_id, sb)
        txs = sb.table("credit_transactions") \
            .select("type, amount, description, created_at") \
            .eq("user_id", target_id).order("created_at", desc=True).limit(20).execute()
        summary["transactions"] = txs.data or []
        return summary
    except HTTPException:
        raise
    except Exception as e:
        print(f"[planes/status] Error inesperado as_user_id={as_user_id!r}: {e}")
        raise HTTPException(status_code=500, detail=f"Error interno: {str(e)}")


# ── Upgrade de plan (inmediato, mid-cycle) ────────────────────────────────────

class UpgradeRequest(BaseModel):
    new_plan: str


@router.post("/upgrade")
def upgrade_plan(data: UpgradeRequest, request: Request):
    if data.new_plan not in PLAN_CREDITS:
        raise HTTPException(status_code=400, detail=f"Plan inválido: {data.new_plan}")

    caller_id = _require_admin(request)
    sb = get_supabase()
    _get_admin_profile(caller_id, sb)

    sub_res = sb.table("admin_subscriptions") \
        .select("stripe_subscription_id, stripe_subscription_item_id, plan, plan_credits_total, plan_credits_remaining") \
        .eq("user_id", caller_id).maybe_single().execute()
    if not sub_res.data:
        raise HTTPException(status_code=404, detail="Sin suscripción activa.")

    sub_data   = sub_res.data
    if sub_data["plan"] == data.new_plan:
        raise HTTPException(status_code=400, detail="Ya estás en ese plan.")

    sc = _stripe()
    try:
        sc.Subscription.modify(
            sub_data["stripe_subscription_id"],
            items=[{"id": sub_data["stripe_subscription_item_id"], "price": _price_id(data.new_plan)}],
            proration_behavior="always_invoice",
        )
    except stripe.StripeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    return {"ok": True, "new_plan": data.new_plan, "message": "Upgrade procesado. Créditos se actualizarán vía webhook."}


# ── Cancelar suscripción al final del período ──────────────────────────────────

@router.post("/cancel")
def cancel_subscription(request: Request):
    caller_id = _require_admin(request)
    sb = get_supabase()
    _get_admin_profile(caller_id, sb)

    sub_res = sb.table("admin_subscriptions") \
        .select("stripe_subscription_id") \
        .eq("user_id", caller_id).maybe_single().execute()
    if not sub_res.data:
        raise HTTPException(status_code=404, detail="Sin suscripción activa.")

    sc = _stripe()
    try:
        sc.Subscription.modify(
            sub_res.data["stripe_subscription_id"],
            cancel_at_period_end=True,
        )
    except stripe.StripeError as e:
        raise HTTPException(status_code=500, detail=str(e))

    sb.table("admin_subscriptions").update({
        "status": "canceled", "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("user_id", caller_id).execute()

    return {"ok": True, "message": "Suscripción cancelada al fin del período actual."}


# ── Checkout público para clientes nuevos (sin cuenta) ───────────────────────

class CheckoutPublicoRequest(BaseModel):
    plan: str
    success_url: Optional[str] = None
    cancel_url:  Optional[str] = None


@router.post("/checkout-publico")
def checkout_publico(data: CheckoutPublicoRequest):
    """Endpoint sin autenticación. Stripe recolecta email+tarjeta. El webhook crea la cuenta."""
    if data.plan not in PLAN_CREDITS:
        raise HTTPException(status_code=400, detail=f"Plan inválido: {data.plan}")
    frontend = os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app")
    sc = _stripe()
    try:
        session = sc.checkout.Session.create(
            payment_method_types=["card"],
            mode="subscription",
            line_items=[{"price": _price_id(data.plan), "quantity": 1}],
            success_url=data.success_url or f"{frontend}/checkout-success.html?plan={data.plan}&nuevo=1",
            cancel_url=data.cancel_url or f"{frontend}/pagos.html",
            metadata={"plan": data.plan},
            billing_address_collection="auto",
        )
        return {"checkout_url": session.url, "session_id": session.id}
    except stripe.StripeError as e:
        raise HTTPException(status_code=500, detail=str(e))


# ── Cron: expirar packs vencidos ───────────────────────────────────────────────

@router.post("/cron/expire-packs")
def cron_expire_packs(request: Request):
    secret = request.headers.get("x-cron-secret", "")
    if not secret or secret != os.getenv("CRON_SECRET", ""):
        raise HTTPException(status_code=403, detail="Cron secret inválido.")
    return expire_stale_packs(get_supabase())
