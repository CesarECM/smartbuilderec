from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel

from database import get_supabase
from services.erp_helpers import _caller, _get_profile, _get_extra_roles

router = APIRouter(prefix="/gce/oc", tags=["gce-oc"])


def _require_oc(sb, uid: str, perfil: dict):
    if perfil.get("rol") == "super_admin":
        return
    if "oc_admin" not in _get_extra_roles(sb, uid):
        raise HTTPException(403, "Se requiere rol oc_admin.")


# ── S2: OC gestiona CEs ───────────────────────────────────────

@router.get("/ces")
def listar_ces(request: Request):
    """Lista los CEs bajo este OC con sus ECs autorizados."""
    sb = get_supabase()
    uid = _caller(request)
    _require_oc(sb, uid, _get_profile(sb, uid))

    relaciones = sb.table("oc_ce_relaciones").select("ce_id").eq("oc_id", uid).execute()
    ce_ids = [r["ce_id"] for r in (relaciones.data or [])]
    if not ce_ids:
        return {"ces": []}

    perfiles = sb.table("profiles").select("id, nombre, apellido, email") \
        .in_("id", ce_ids).order("nombre").execute()

    estandares = sb.table("ce_estandares_autorizados") \
        .select("ce_id, estandar_id, estandares_competencia(codigo, titulo)") \
        .in_("ce_id", ce_ids).execute()

    ec_por_ce: dict = {}
    for e in (estandares.data or []):
        ec_por_ce.setdefault(e["ce_id"], []).append({
            "id":     e["estandar_id"],
            "codigo": (e.get("estandares_competencia") or {}).get("codigo"),
            "titulo": (e.get("estandares_competencia") or {}).get("titulo"),
        })

    ces = [
        {**p, "estandares": ec_por_ce.get(p["id"], [])}
        for p in (perfiles.data or [])
    ]
    return {"ces": ces}


class AgregarCEBody(BaseModel):
    email: str


@router.post("/ces", status_code=201)
def agregar_ce(data: AgregarCEBody, request: Request):
    """Busca un usuario con rol ce_admin por email y lo incorpora al OC."""
    sb = get_supabase()
    uid = _caller(request)
    _require_oc(sb, uid, _get_profile(sb, uid))

    perfil_ce = sb.table("profiles").select("id, nombre, apellido, email") \
        .eq("email", data.email.strip().lower()).maybe_single().execute()
    if not (perfil_ce and perfil_ce.data):
        raise HTTPException(404, "Usuario no encontrado.")

    ce_id = perfil_ce.data["id"]
    roles_ce = _get_extra_roles(sb, ce_id)
    if "ce_admin" not in roles_ce:
        raise HTTPException(422, "El usuario no tiene rol ce_admin.")

    existente = sb.table("oc_ce_relaciones") \
        .select("id").eq("oc_id", uid).eq("ce_id", ce_id).maybe_single().execute()
    if existente and existente.data:
        raise HTTPException(409, "Este CE ya está bajo tu organismo.")

    sb.table("oc_ce_relaciones").insert({"oc_id": uid, "ce_id": ce_id}).execute()
    return {"ce": perfil_ce.data}


@router.delete("/ces/{ce_id}", status_code=204)
def quitar_ce(ce_id: str, request: Request):
    """Elimina la relación OC→CE."""
    sb = get_supabase()
    uid = _caller(request)
    _require_oc(sb, uid, _get_profile(sb, uid))
    sb.table("oc_ce_relaciones").delete().eq("oc_id", uid).eq("ce_id", ce_id).execute()
    sb.table("ce_estandares_autorizados").delete().eq("oc_id", uid).eq("ce_id", ce_id).execute()


# ── S3: OC gestiona ECs por CE ────────────────────────────────

class SetEstandaresBody(BaseModel):
    estandar_ids: list[str]


@router.put("/ces/{ce_id}/estandares")
def set_estandares_ce(ce_id: str, data: SetEstandaresBody, request: Request):
    """Reemplaza la lista de ECs autorizados para un CE."""
    sb = get_supabase()
    uid = _caller(request)
    _require_oc(sb, uid, _get_profile(sb, uid))

    # Verificar que el CE pertenece a este OC
    rel = sb.table("oc_ce_relaciones").select("id") \
        .eq("oc_id", uid).eq("ce_id", ce_id).maybe_single().execute()
    if not (rel and rel.data):
        raise HTTPException(403, "Este CE no pertenece a tu organismo.")

    # Reemplazar: borrar existentes e insertar nuevos
    sb.table("ce_estandares_autorizados").delete().eq("oc_id", uid).eq("ce_id", ce_id).execute()
    if data.estandar_ids:
        rows = [{"oc_id": uid, "ce_id": ce_id, "estandar_id": eid} for eid in data.estandar_ids]
        sb.table("ce_estandares_autorizados").insert(rows).execute()

    res = sb.table("ce_estandares_autorizados") \
        .select("estandar_id, estandares_competencia(codigo, titulo)") \
        .eq("ce_id", ce_id).execute()
    return {"estandares": res.data or []}


@router.get("/ces/{ce_id}/estandares")
def get_estandares_ce(ce_id: str, request: Request):
    """Devuelve los ECs autorizados para un CE específico."""
    sb = get_supabase()
    uid = _caller(request)
    _require_oc(sb, uid, _get_profile(sb, uid))

    res = sb.table("ce_estandares_autorizados") \
        .select("estandar_id, estandares_competencia(codigo, titulo)") \
        .eq("ce_id", ce_id).execute()
    return {"estandares": res.data or []}
