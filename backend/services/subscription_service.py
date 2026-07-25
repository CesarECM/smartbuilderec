"""
MPS #009 — Lógica de suscripciones Stripe para admins (CE/EI).
Maneja webhooks: invoice.paid, subscription.updated, subscription.deleted, payment_failed.
"""
import os
import stripe
from datetime import datetime, timezone

from database import get_supabase

PLAN_CREDITS: dict[str, int] = {
    "basico": 10,
    "profesional": 25,
    "partner": 60,
}

PRICE_TO_PLAN: dict[str, str] = {}


def _price_to_plan_map() -> dict[str, str]:
    if PRICE_TO_PLAN:
        return PRICE_TO_PLAN
    suffix = "_TEST" if os.getenv("STRIPE_TEST_MODE", "false").lower() == "true" else ""
    for plan in ("basico", "profesional", "partner"):
        pid = os.getenv(f"STRIPE_PRICE_{plan.upper()}{suffix}", "")
        if pid:
            PRICE_TO_PLAN[pid] = plan
    return PRICE_TO_PLAN


def _get_plan_from_subscription(sub) -> str:
    mapping = _price_to_plan_map()
    items = sub.get("items", {}).get("data", []) if isinstance(sub, dict) else []
    if not items and hasattr(sub, "items"):
        items = sub.items.data or []
    for item in items:
        pid = (item.get("price", {}).get("id", "") if isinstance(item, dict)
               else getattr(getattr(item, "price", None), "id", ""))
        if pid in mapping:
            return mapping[pid]
    return ""


def _active_extra_credits(user_id: str, sb) -> int:
    now_iso = datetime.now(timezone.utc).isoformat()
    res = sb.table("credit_packs") \
        .select("credits_remaining") \
        .eq("user_id", user_id) \
        .gt("credits_remaining", 0) \
        .gt("expires_at", now_iso) \
        .execute()
    return sum(r["credits_remaining"] for r in (res.data or []))


def handle_checkout_subscription(session, sb=None) -> None:
    sb = sb or get_supabase()
    user_id   = (session.get("metadata") or {}).get("user_id", "") \
                if isinstance(session, dict) else (session.metadata or {}).get("user_id", "")
    plan      = (session.get("metadata") or {}).get("plan", "") \
                if isinstance(session, dict) else (session.metadata or {}).get("plan", "")
    sub_id    = session.get("subscription", "") if isinstance(session, dict) \
                else getattr(session, "subscription", "")
    customer  = session.get("customer", "") if isinstance(session, dict) \
                else getattr(session, "customer", "")

    if not user_id or not sub_id:
        print(f"[sub] checkout_subscription sin user_id o sub_id")
        return

    credits_total = PLAN_CREDITS.get(plan, 0)
    if not credits_total:
        print(f"[sub] plan desconocido: {plan}")
        return

    try:
        key = "STRIPE_SECRET_KEY_TEST" if os.getenv("STRIPE_TEST_MODE", "false").lower() == "true" \
              else "STRIPE_SECRET_KEY"
        stripe.api_key = os.getenv(key)
        sub = stripe.Subscription.retrieve(sub_id)
        item_id       = sub.items.data[0].id if sub.items.data else ""
        period_start  = datetime.fromtimestamp(sub.current_period_start, tz=timezone.utc).isoformat()
        period_end    = datetime.fromtimestamp(sub.current_period_end,   tz=timezone.utc).isoformat()
    except Exception as e:
        print(f"[sub] Error recuperando subscription: {e}")
        item_id, period_start, period_end = "", None, None

    extra = _active_extra_credits(user_id, sb)
    total_credits = credits_total + extra

    sb.table("admin_subscriptions").upsert({
        "user_id": user_id, "stripe_customer_id": customer,
        "stripe_subscription_id": sub_id, "stripe_subscription_item_id": item_id,
        "plan": plan, "plan_credits_total": credits_total,
        "plan_credits_remaining": credits_total,
        "plan_period_start": period_start, "plan_period_end": period_end,
        "status": "active", "updated_at": datetime.now(timezone.utc).isoformat(),
    }, on_conflict="user_id").execute()

    sb.table("profiles").update({"credits": total_credits, "stripe_customer_id": customer}) \
        .eq("id", user_id).execute()

    sb.table("credit_transactions").insert({
        "user_id": user_id, "type": "plan_reset", "amount": credits_total,
        "source": "subscription", "description": f"Activación plan {plan}",
    }).execute()
    print(f"[sub] Suscripción activada user={user_id} plan={plan} credits={credits_total}")


def handle_invoice_paid(invoice, sb=None) -> None:
    sb = sb or get_supabase()
    customer = invoice.get("customer", "") if isinstance(invoice, dict) \
               else getattr(invoice, "customer", "")
    sub_id   = invoice.get("subscription", "") if isinstance(invoice, dict) \
               else getattr(invoice, "subscription", "")
    if not customer or not sub_id:
        return

    res = sb.table("admin_subscriptions") \
        .select("user_id, plan, plan_credits_total") \
        .eq("stripe_subscription_id", sub_id).single().execute()
    if not res.data:
        return

    user_id       = res.data["user_id"]
    plan          = res.data["plan"]
    credits_total = PLAN_CREDITS.get(plan, res.data.get("plan_credits_total", 0))
    extra         = _active_extra_credits(user_id, sb)

    sb.table("admin_subscriptions").update({
        "plan_credits_remaining": credits_total, "status": "active",
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("stripe_subscription_id", sub_id).execute()

    sb.table("profiles").update({"credits": credits_total + extra}).eq("id", user_id).execute()
    sb.table("credit_transactions").insert({
        "user_id": user_id, "type": "plan_reset", "amount": credits_total,
        "source": "subscription", "description": f"Renovación mensual plan {plan}",
    }).execute()
    print(f"[sub] Renovación mensual user={user_id} plan={plan}")


def handle_subscription_updated(subscription, sb=None) -> None:
    sb = sb or get_supabase()
    sub_id   = subscription.get("id", "") if isinstance(subscription, dict) \
               else getattr(subscription, "id", "")
    status   = subscription.get("status", "") if isinstance(subscription, dict) \
               else getattr(subscription, "status", "")
    new_plan = _get_plan_from_subscription(subscription)

    res = sb.table("admin_subscriptions") \
        .select("user_id, plan, plan_credits_total, plan_credits_remaining") \
        .eq("stripe_subscription_id", sub_id).single().execute()
    if not res.data or not new_plan:
        return

    user_id        = res.data["user_id"]
    old_total      = res.data["plan_credits_total"]
    old_remaining  = res.data["plan_credits_remaining"]
    new_total      = PLAN_CREDITS.get(new_plan, old_total)
    consumed       = old_total - old_remaining
    new_remaining  = max(0, new_total - consumed)
    delta          = new_remaining - old_remaining
    extra          = _active_extra_credits(user_id, sb)

    sb.table("admin_subscriptions").update({
        "plan": new_plan, "plan_credits_total": new_total,
        "plan_credits_remaining": new_remaining, "status": status,
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("stripe_subscription_id", sub_id).execute()

    sb.table("profiles").update({"credits": new_remaining + extra}).eq("id", user_id).execute()

    if delta != 0:
        sb.table("credit_transactions").insert({
            "user_id": user_id, "type": "plan_upgrade", "amount": delta,
            "source": "subscription", "description": f"Cambio a plan {new_plan}",
        }).execute()
    print(f"[sub] Actualización plan user={user_id} → {new_plan} (delta={delta:+d})")


def handle_invoice_payment_failed(invoice, sb=None) -> None:
    sb = sb or get_supabase()
    sub_id = invoice.get("subscription", "") if isinstance(invoice, dict) \
             else getattr(invoice, "subscription", "")
    if not sub_id:
        return
    sb.table("admin_subscriptions").update({
        "status": "past_due", "updated_at": datetime.now(timezone.utc).isoformat(),
    }).eq("stripe_subscription_id", sub_id).execute()
    print(f"[sub] Pago fallido sub={sub_id}")
