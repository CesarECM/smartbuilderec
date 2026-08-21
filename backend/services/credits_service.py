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


def enrich_transactions(raw: list, sb) -> list:
    """Agrega candidato_nombre, candidato_email y estandar_codigo a transacciones GCE."""
    inv_ids, proceso_ids, direct_cand_ids = [], [], []
    direct_estandar_ids: set = set()

    for t in raw:
        src = t.get("source") or ""
        if src.startswith("gce_invitacion:"):
            inv_ids.append(src.split(":", 1)[1])
        elif src.startswith("gce_proceso_manual:"):
            parts = src.split(":")
            if len(parts) >= 2 and parts[1]:
                direct_cand_ids.append(parts[1])
            if len(parts) >= 3 and parts[2]:
                direct_estandar_ids.add(parts[2])
        elif src.startswith("proceso:"):
            proceso_ids.append(src.split(":", 1)[1])

    inv_map: dict = {}
    if inv_ids:
        res = sb.table("gce_invitaciones") \
            .select("id, candidato_id, candidato_email, estandar_ids").in_("id", inv_ids).execute()
        for row in (res.data or []):
            inv_map[row["id"]] = row
            for eid in (row.get("estandar_ids") or []):
                direct_estandar_ids.add(eid)

    proc_map: dict = {}
    if proceso_ids:
        res = sb.table("procesos_evaluacion") \
            .select("id, candidato_id, estandar_id").in_("id", proceso_ids).execute()
        for row in (res.data or []):
            proc_map[row["id"]] = row
            if row.get("estandar_id"):
                direct_estandar_ids.add(row["estandar_id"])

    estandar_map: dict = {}
    if direct_estandar_ids:
        res = sb.table("estandares_competencia") \
            .select("id, codigo").in_("id", list(direct_estandar_ids)).execute()
        for row in (res.data or []):
            estandar_map[row["id"]] = row["codigo"]

    cand_ids = set(direct_cand_ids)
    for inv in inv_map.values():
        if inv.get("candidato_id"):
            cand_ids.add(inv["candidato_id"])
    for proc in proc_map.values():
        if proc.get("candidato_id"):
            cand_ids.add(proc["candidato_id"])

    profile_map: dict = {}
    if cand_ids:
        res = sb.table("profiles") \
            .select("id, nombre, apellido, email").in_("id", list(cand_ids)).execute()
        for row in (res.data or []):
            profile_map[row["id"]] = row

    for t in raw:
        src = t.get("source") or ""
        cand_id, fallback_email = None, None
        estandar_ids_tx: list = []

        if src.startswith("gce_invitacion:"):
            inv = inv_map.get(src.split(":", 1)[1], {})
            cand_id, fallback_email = inv.get("candidato_id"), inv.get("candidato_email")
            estandar_ids_tx = inv.get("estandar_ids") or []
        elif src.startswith("gce_proceso_manual:"):
            parts = src.split(":")
            cand_id = parts[1] if len(parts) >= 2 else None
            if len(parts) >= 3 and parts[2]:
                estandar_ids_tx = [parts[2]]
        elif src.startswith("proceso:"):
            proc = proc_map.get(src.split(":", 1)[1], {})
            cand_id = proc.get("candidato_id")
            if proc.get("estandar_id"):
                estandar_ids_tx = [proc["estandar_id"]]

        codigos = [estandar_map[e] for e in estandar_ids_tx if e in estandar_map]
        if codigos:
            t["estandar_codigos"] = codigos

        prof = profile_map.get(cand_id) if cand_id else None
        if prof:
            nombre = " ".join(filter(None, [prof.get("nombre"), prof.get("apellido")])) or prof.get("email", "")
            t["candidato_nombre"] = nombre
            t["candidato_email"]  = prof.get("email", "")
        elif fallback_email:
            t["candidato_email"] = fallback_email

    return raw


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
