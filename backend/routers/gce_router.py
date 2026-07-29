from fastapi import APIRouter, HTTPException, Request

from database import get_supabase
from models.gce_models import ProcesoCreate, ProcesoUpdate, ESTADOS_VALIDOS
from services.erp_helpers import _caller, _get_profile, _get_extra_roles

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
    return res.data[0] if res.data else {}
