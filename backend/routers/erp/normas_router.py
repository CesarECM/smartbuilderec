from fastapi import APIRouter, Request

from database import get_supabase
from models.erp_models import NormaUpsert
from services.erp_helpers import _caller, _get_profile, _require_role

router = APIRouter(prefix="/erp", tags=["erp"])


@router.get("/normas")
def listar_normas(request: Request, todas: bool = False):
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)

    q = sb.table("normas").select("*").order("codigo")
    if not (todas and caller.get("rol") == "super_admin"):
        q = q.eq("activo", True)

    res = q.execute()
    return {"normas": res.data or []}


@router.post("/normas", status_code=201)
def crear_norma(data: NormaUpsert, request: Request):
    sb = get_supabase()
    caller = _get_profile(sb, _caller(request))
    _require_role(caller, "super_admin")

    res = sb.table("normas").insert(data.model_dump()).execute()
    return res.data[0] if res.data else {}


@router.put("/normas/{norma_id}")
def actualizar_norma(norma_id: str, data: NormaUpsert, request: Request):
    sb = get_supabase()
    caller = _get_profile(sb, _caller(request))
    _require_role(caller, "super_admin")

    res = sb.table("normas").update(data.model_dump()).eq("id", norma_id).execute()
    return res.data[0] if res.data else {}
