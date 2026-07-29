from fastapi import APIRouter, HTTPException, Request

from database import get_supabase
from models.gce_models import EstandarCreate, EstandarUpdate
from services.erp_helpers import _caller, _get_profile, _require_role

router = APIRouter(prefix="/gce", tags=["gce"])


@router.get("/estandares")
def listar_estandares(request: Request, todos: bool = False):
    sb = get_supabase()
    caller = _get_profile(sb, _caller(request))

    q = sb.table("estandares_competencia").select(
        "id, codigo, titulo, version, nivel_snc, vigencia_cert, activo"
    ).order("codigo")

    if not (todos and caller.get("rol") == "super_admin"):
        q = q.eq("activo", True)

    res = q.execute()
    return {"estandares": res.data or []}


@router.get("/estandares/{codigo}")
def obtener_estandar(codigo: str, request: Request):
    sb = get_supabase()
    _caller(request)  # requiere auth

    res = (
        sb.table("estandares_competencia")
        .select("*")
        .eq("codigo", codigo.upper())
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="Estándar no encontrado.")
    return res.data


@router.post("/estandares", status_code=201)
def crear_estandar(data: EstandarCreate, request: Request):
    sb = get_supabase()
    caller = _get_profile(sb, _caller(request))
    _require_role(caller, "super_admin")

    payload = data.model_dump()
    payload["codigo"] = payload["codigo"].upper()

    existente = (
        sb.table("estandares_competencia")
        .select("id")
        .eq("codigo", payload["codigo"])
        .execute()
    )
    if existente.data:
        raise HTTPException(status_code=409, detail="El código de EC ya existe.")

    res = sb.table("estandares_competencia").insert(payload).execute()
    return res.data[0] if res.data else {}


@router.put("/estandares/{ec_id}")
def actualizar_estandar(ec_id: str, data: EstandarUpdate, request: Request):
    sb = get_supabase()
    caller = _get_profile(sb, _caller(request))
    _require_role(caller, "super_admin")

    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    if not payload:
        raise HTTPException(status_code=400, detail="Sin campos a actualizar.")

    res = (
        sb.table("estandares_competencia")
        .update(payload)
        .eq("id", ec_id)
        .execute()
    )
    return res.data[0] if res.data else {}
