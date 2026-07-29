import os

from fastapi import APIRouter, HTTPException, Request

from database import get_supabase
from models.gce_models import ProcesoCreate, ProcesoUpdate, ESTADOS_VALIDOS
from services.erp_helpers import _caller, _get_profile, _get_extra_roles
from services.email_service import send_template

router = APIRouter(prefix="/gce", tags=["gce"])


def _puede_gestionar(sb, uid: str, perfil: dict) -> bool:
    if perfil.get("rol") == "super_admin":
        return True
    return bool(_get_extra_roles(sb, uid) & {"ce_admin", "oc_admin"})


@router.post("/procesos", status_code=201)
def crear_proceso(data: ProcesoCreate, request: Request):
    sb = get_supabase()
    uid = _caller(request)
    caller = _get_profile(sb, uid)
    if not _puede_gestionar(sb, uid, caller):
        raise HTTPException(403, "Se requiere rol ce_admin.")

    payload = data.model_dump()
    payload["ce_id"] = uid

    res = sb.table("procesos_evaluacion").insert(payload).execute()
    return res.data[0] if res.data else {}


@router.get("/procesos")
def listar_procesos(request: Request):
    sb = get_supabase()
    uid = _caller(request)
    caller = _get_profile(sb, uid)

    q = (
        sb.table("procesos_evaluacion")
        .select(
            "id, estado, juicio, credito_canjeado, created_at, "
            "candidato_id, evaluador_id, estandar_id, ce_id"
        )
        .order("created_at", desc=True)
    )

    if caller.get("rol") == "super_admin":
        pass
    elif "oc_admin" in _get_extra_roles(sb, uid):
        q = q.eq("oc_id", uid)
    else:
        q = q.eq("ce_id", uid)

    res = q.execute()
    return {"procesos": res.data or []}


@router.get("/procesos/{proceso_id}")
def obtener_proceso(proceso_id: str, request: Request):
    sb = get_supabase()
    _caller(request)

    res = (
        sb.table("procesos_evaluacion")
        .select("*")
        .eq("id", proceso_id)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(404, "Proceso no encontrado.")
    return res.data


_ESTADOS_NOTIFICAR = {"juicio", "cierre"}
_LABELS_ESTADO = {
    "juicio": "Juicio de evaluación emitido",
    "cierre": "Cédula de Evaluación disponible",
}


def _notificar_candidato(sb, proceso_id: str, nuevo_estado: str) -> None:
    if nuevo_estado not in _ESTADOS_NOTIFICAR:
        return
    try:
        proc = sb.table("procesos_evaluacion") \
            .select("candidato_id, estandar_id") \
            .eq("id", proceso_id).maybe_single().execute()
        if not proc.data:
            return
        cand = sb.table("profiles").select("nombre, email") \
            .eq("id", proc.data["candidato_id"]).maybe_single().execute()
        ec = sb.table("estandares_competencia").select("codigo") \
            .eq("id", proc.data["estandar_id"]).maybe_single().execute()
        if not cand.data or not cand.data.get("email"):
            return
        frontend_url = os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app")
        send_template("gce_avance_proceso", cand.data["email"], {
            "nombre":         cand.data.get("nombre", cand.data["email"]),
            "ec_codigo":      (ec.data or {}).get("codigo", "GCE"),
            "estado_label":   _LABELS_ESTADO[nuevo_estado],
            "link_portafolio": f"{frontend_url}/gce?proceso_id={proceso_id}",
        })
    except Exception as e:
        print(f"⚠️ gce notify error: {e}")


@router.patch("/procesos/{proceso_id}")
def actualizar_proceso(proceso_id: str, data: ProcesoUpdate, request: Request):
    sb = get_supabase()
    _caller(request)

    payload = data.model_dump(exclude_unset=True)
    if not payload:
        raise HTTPException(400, "Sin campos a actualizar.")
    if "estado" in payload and payload["estado"] not in ESTADOS_VALIDOS:
        raise HTTPException(400, f"Estado inválido: {payload['estado']}")

    res = (
        sb.table("procesos_evaluacion")
        .update(payload)
        .eq("id", proceso_id)
        .execute()
    )
    if "estado" in payload:
        _notificar_candidato(sb, proceso_id, payload["estado"])
    return res.data[0] if res.data else {}


@router.get("/candidatos/buscar")
def buscar_candidatos(q: str, request: Request):
    """Busca candidatos del CE (admin_id = ce_uid) por nombre o email."""
    sb = get_supabase()
    uid = _caller(request)
    perfil = _get_profile(sb, uid)
    if not _puede_gestionar(sb, uid, perfil):
        raise HTTPException(403, "Se requiere rol ce_admin u oc_admin.")
    if not q or len(q.strip()) < 2:
        return {"candidatos": []}
    lq = q.strip().lower()
    # super_admin ve todos; ce_admin/oc_admin solo ven sus usuarios
    query = sb.table("profiles").select("id, nombre, apellido, email")
    if perfil.get("rol") != "super_admin":
        query = query.eq("admin_id", uid)
    res = (
        query
        .or_(f"nombre.ilike.%{lq}%,apellido.ilike.%{lq}%,email.ilike.%{lq}%")
        .limit(10)
        .execute()
    )
    return {"candidatos": res.data or []}
