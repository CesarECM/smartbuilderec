"""
MPS #009 — Gestión de créditos extra (packs one-time).
Plan credits se manejan en subscription_service.py vía webhooks.
"""
from datetime import datetime, timedelta, timezone

from database import get_supabase


def get_credits_summary(user_id: str, sb=None) -> dict:
    sb = sb or get_supabase()
    now_iso = datetime.now(timezone.utc).isoformat()

    sub_res = sb.table("admin_subscriptions") \
        .select("plan, plan_credits_remaining, plan_credits_total, plan_period_end, status") \
        .eq("user_id", user_id).maybe_single().execute()
    sub = (sub_res.data if sub_res else None) or {}

    packs_res = sb.table("credit_packs") \
        .select("credits_remaining, expires_at") \
        .eq("user_id", user_id).gt("credits_remaining", 0) \
        .gt("expires_at", now_iso).execute()
    packs = packs_res.data or []

    extra_credits = sum(p["credits_remaining"] for p in packs)
    plan_credits  = sub.get("plan_credits_remaining", 0)

    return {
        "plan":           sub.get("plan"),
        "plan_credits":   plan_credits,
        "plan_total":     sub.get("plan_credits_total", 0),
        "extra_credits":  extra_credits,
        "total_credits":  plan_credits + extra_credits,
        "renewal_date":   sub.get("plan_period_end"),
        "status":         sub.get("status"),
        "extra_packs":    [{"remaining": p["credits_remaining"], "expires_at": p["expires_at"]}
                           for p in packs],
    }


def add_extra_pack(user_id: str, payment_intent_id: str, credits: int = 10, sb=None) -> None:
    sb = sb or get_supabase()
    now = datetime.now(timezone.utc)
    expires = (now + timedelta(days=30)).isoformat()

    sb.table("credit_packs").insert({
        "user_id": user_id,
        "stripe_payment_intent_id": payment_intent_id,
        "credits_purchased": credits,
        "credits_remaining": credits,
        "purchased_at": now.isoformat(),
        "expires_at": expires,
    }).execute()

    res = sb.table("profiles").select("credits").eq("id", user_id).single().execute()
    current = (res.data or {}).get("credits", 0)
    sb.table("profiles").update({"credits": current + credits}).eq("id", user_id).execute()

    sb.table("credit_transactions").insert({
        "user_id": user_id, "type": "extra_purchase", "amount": credits,
        "source": f"pack:{payment_intent_id}",
        "description": f"+{credits} créditos extra (vencen {expires[:10]})",
    }).execute()
    print(f"[credits] Pack extra user={user_id} +{credits} créditos")


def expire_stale_packs(sb=None) -> dict:
    sb = sb or get_supabase()
    now_iso = datetime.now(timezone.utc).isoformat()

    res = sb.table("credit_packs") \
        .select("id, user_id, credits_remaining") \
        .lt("expires_at", now_iso) \
        .gt("credits_remaining", 0).execute()
    packs = res.data or []

    expired_count = 0
    for pack in packs:
        user_id  = pack["user_id"]
        lost     = pack["credits_remaining"]

        sb.table("credit_packs").update({"credits_remaining": 0}) \
            .eq("id", pack["id"]).execute()

        prof = sb.table("profiles").select("credits").eq("id", user_id).single().execute()
        current = (prof.data or {}).get("credits", 0)
        sb.table("profiles").update({"credits": max(0, current - lost)}) \
            .eq("id", user_id).execute()

        sb.table("credit_transactions").insert({
            "user_id": user_id, "type": "expired", "amount": -lost,
            "source": f"pack:{pack['id']}",
            "description": f"{lost} créditos extra vencidos",
        }).execute()
        expired_count += 1

    print(f"[credits] Packs expirados procesados: {expired_count}")
    return {"expired_packs": expired_count, "total_packs_checked": len(packs)}
