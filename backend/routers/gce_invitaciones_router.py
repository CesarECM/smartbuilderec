import os
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, Request

from database import get_supabase
from models.gce_models import InvitacionCreate, InvitacionAceptar
from services.erp_helpers import _caller, _get_profile, _get_extra_roles
from services.email_service import send_template

router = APIRouter(prefix="/gce", tags=["gce-invitaciones"])


def _puede_gestionar(sb, uid: str, perfil: dict) -> bool:
    if perfil.get("rol") == "super_admin":
        return True
    return bool(_get_extra_roles(sb, uid) & {"ce_admin", "oc_admin"})


def _inv_expirada(expires_at: str) -> bool:
    return datetime.fromisoformat(expires_at.replace("Z", "+00:00")) < datetime.now(timezone.utc)


# ── S7: Crear invitación ─────────────────────────────────────────

@router.post("/invitaciones", status_code=201)
def crear_invitacion(data: InvitacionCreate, request: Request):
    sb = get_supabase()
    uid = _caller(request)
    perfil = _get_profile(sb, uid)
    if not _puede_gestionar(sb, uid, perfil):
        raise HTTPException(403, "Se requiere rol ce_admin.")

    email = data.email.strip().lower()
    if not email or "@" not in email:
        raise HTTPException(422, "Email inválido.")
    if data.tipo not in ("candidato", "evaluador"):
        raise HTTPException(422, "tipo debe ser 'candidato' o 'evaluador'.")
    if data.tipo == "candidato" and not data.estandar_ids:
        raise HTTPException(422, "Selecciona al menos un EC para el candidato.")
    if data.tipo == "candidato":
        n = len(data.estandar_ids)
        cr = sb.table("profiles").select("credits").eq("id", uid).maybe_single().execute()
        creditos = (cr.data or {}).get("credits", 0) or 0
        if creditos < n:
            raise HTTPException(402, f"Sin créditos suficientes ({creditos} disponibles, {n} requeridos). Recarga tu plan antes de invitar.")

    dup = sb.table("gce_invitaciones") \
        .select("id").eq("ce_id", uid).eq("candidato_email", email) \
        .eq("tipo", data.tipo).eq("estado", "pendiente").maybe_single().execute()
    if dup and dup.data:
        raise HTTPException(409, "Ya existe una invitación pendiente para este email.")

    payload = {
        "ce_id":           uid,
        "tipo":            data.tipo,
        "candidato_email": email,
        "estandar_ids":    data.estandar_ids if data.estandar_ids else None,
    }
    res = sb.table("gce_invitaciones").insert(payload).execute()
    inv = res.data[0] if res.data else {}

    ce_nombre = " ".join(filter(None, [perfil.get("nombre"), perfil.get("apellido")])) \
                or perfil.get("email", "")
    frontend_url = os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app")
    slug = "gce_invitacion_candidato" if data.tipo == "candidato" else "gce_invitacion_evaluador"
    send_template(slug, email, {
        "ce_nombre":       ce_nombre,
        "link_invitacion": f"{frontend_url}/gce-invitacion?token={inv.get('token','')}",
    })
    return inv


# ── S8: Verificar + Aceptar ──────────────────────────────────────

@router.get("/invitaciones/verificar")
def verificar_invitacion(token: str):
    """Público — la landing muestra info antes de que el usuario se loguée."""
    sb = get_supabase()
    inv = sb.table("gce_invitaciones") \
        .select("tipo, candidato_email, estado, expires_at, estandar_ids, ce_id") \
        .eq("token", token).maybe_single().execute()
    if not (inv and inv.data):
        raise HTTPException(404, "Invitación no encontrada.")
    d = inv.data
    if d["estado"] != "pendiente" or _inv_expirada(d["expires_at"]):
        return {"estado": d["estado"] if d["estado"] != "pendiente" else "expirada"}
    ce = sb.table("profiles").select("nombre, apellido, email") \
        .eq("id", d["ce_id"]).maybe_single().execute()
    ce_d = ce.data or {}
    ce_nombre = " ".join(filter(None, [ce_d.get("nombre"), ce_d.get("apellido")])) \
                or ce_d.get("email", "")
    estandares = []
    if d.get("estandar_ids"):
        r = sb.table("estandares_competencia").select("id, codigo, titulo") \
            .in_("id", d["estandar_ids"]).execute()
        estandares = r.data or []
    return {
        "tipo":            d["tipo"],
        "candidato_email": d["candidato_email"],
        "ce_nombre":       ce_nombre,
        "estandares":      estandares,
        "estado":          d["estado"],
        "expires_at":      d["expires_at"],
    }


@router.post("/invitaciones/aceptar")
def aceptar_invitacion(data: InvitacionAceptar, request: Request):
    sb = get_supabase()
    try:
        uid = _caller(request)
        inv = sb.table("gce_invitaciones").select("*") \
            .eq("token", data.token).eq("estado", "pendiente").maybe_single().execute()
        if not (inv and inv.data):
            raise HTTPException(404, "Invitación no encontrada o ya procesada.")
        d = inv.data
        if _inv_expirada(d["expires_at"]):
            sb.table("gce_invitaciones").update({"estado": "expirada"}).eq("id", d["id"]).execute()
            raise HTTPException(410, "La invitación ha expirado.")

        if d["tipo"] == "candidato":
            ec_ids = d.get("estandar_ids") or []
            if not ec_ids:
                raise HTTPException(422, "Invitación sin ECs asignados.")
            adm = sb.table("profiles").select("credits").eq("id", d["ce_id"]).maybe_single().execute()
            creditos = (adm.data or {}).get("credits", 0) or 0
            n = len(ec_ids)
            if creditos < n:
                raise HTTPException(402, f"Sin créditos suficientes ({creditos} disponibles, {n} requeridos).")
            for eid in ec_ids:
                sb.table("procesos_evaluacion").insert(
                    {"ce_id": d["ce_id"], "candidato_id": uid, "estandar_id": eid}
                ).execute()
            sb.table("profiles").update({"credits": creditos - n}).eq("id", d["ce_id"]).execute()
            try:
                sb.table("credit_transactions").insert({
                    "user_id":     d["ce_id"],
                    "type":        "consumed",
                    "amount":      -n,
                    "source":      f"gce_invitacion:{d['id']}",
                    "description": f"Candidato aceptó invitación GCE ({n} EC{'s' if n > 1 else ''})",
                }).execute()
            except Exception as e:
                print(f"[credits] Warn: log fallido en aceptar_invitacion: {e}")
        else:
            sb.table("user_roles").upsert(
                {"user_id": uid, "role": "evaluador", "assigned_by": d["ce_id"]},
                on_conflict="user_id,role"
            ).execute()
            sb.table("ce_evaluador_relaciones").upsert(
                {"ce_id": d["ce_id"], "evaluador_id": uid},
                on_conflict="ce_id,evaluador_id"
            ).execute()

        sb.table("gce_invitaciones").update({
            "estado":       "aceptada",
            "candidato_id": uid,
            "aceptada_at":  datetime.now(timezone.utc).isoformat(),
        }).eq("id", d["id"]).execute()
        return {"ok": True, "tipo": d["tipo"]}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error al procesar la invitación: {str(e)}")


# ── S9: Listar invitaciones ──────────────────────────────────────

@router.get("/invitaciones")
def listar_invitaciones(request: Request):
    sb = get_supabase()
    uid = _caller(request)
    perfil = _get_profile(sb, uid)

    q = sb.table("gce_invitaciones") \
        .select("id, tipo, candidato_email, estado, estandar_ids, created_at, expires_at, aceptada_at") \
        .order("created_at", desc=True)

    if perfil.get("rol") != "super_admin":
        q = q.eq("ce_id", uid)

    return {"invitaciones": q.execute().data or []}


@router.delete("/invitaciones/{inv_id}", status_code=204)
def eliminar_invitacion(inv_id: str, request: Request):
    sb = get_supabase()
    uid = _caller(request)
    perfil = _get_profile(sb, uid)

    inv = sb.table("gce_invitaciones").select("id, ce_id, estado") \
        .eq("id", inv_id).maybe_single().execute()
    if not (inv and inv.data):
        raise HTTPException(404, "Invitación no encontrada.")
    d = inv.data
    if perfil.get("rol") != "super_admin" and d["ce_id"] != uid:
        raise HTTPException(403, "Sin permiso para eliminar esta invitación.")
    if d["estado"] != "pendiente":
        raise HTTPException(409, "Solo se pueden eliminar invitaciones pendientes.")

    sb.table("gce_invitaciones").delete().eq("id", inv_id).execute()
