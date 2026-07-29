from fastapi import APIRouter, HTTPException, Request

from database import get_supabase
from models.erp_models import AsignarRolRequest
from services.erp_helpers import _caller, _get_profile, _require_role

router = APIRouter(prefix="/erp", tags=["erp"])


@router.post("/admin/roles/asignar", status_code=201)
def asignar_rol(data: AsignarRolRequest, request: Request):
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    _require_role(caller, "super_admin")

    if data.role not in ("evaluador", "asesor", "norma_ec0091", "norma_ec0616", "oc_admin", "ce_admin"):
        raise HTTPException(status_code=400, detail="role no válido.")

    user_res = sb.table("profiles").select("id, nombre, email").eq("id", data.user_id).single().execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    try:
        sb.table("user_roles").upsert(
            {"user_id": data.user_id, "role": data.role, "assigned_by": caller_id},
            on_conflict="user_id,role"
        ).execute()
        return {"ok": True, "user": user_res.data, "role": data.role}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al asignar rol: {e}")


@router.delete("/admin/roles/quitar")
def quitar_rol(user_id: str, role: str, request: Request):
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    _require_role(caller, "super_admin")

    if role not in ("evaluador", "asesor", "norma_ec0091", "norma_ec0616", "oc_admin", "ce_admin"):
        raise HTTPException(status_code=400, detail="role no válido.")

    sb.table("user_roles").delete().eq("user_id", user_id).eq("role", role).execute()
    return {"ok": True, "user_id": user_id, "role_removed": role}


@router.get("/admin/roles")
def listar_roles(request: Request):
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    _require_role(caller, "super_admin")

    res = (
        sb.table("user_roles")
        .select("id, user_id, role, assigned_by, created_at, "
                "profiles!user_roles_user_id_fkey(nombre, apellido, email)")
        .order("created_at", desc=True)
        .execute()
    )
    return {"roles": res.data or []}


@router.get("/superadmin/resumen")
def resumen_global(request: Request):
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    _require_role(caller, "super_admin")

    total_alumnos = sb.table("profiles").select("id", count="exact", head=True).eq("rol", "user").execute().count or 0
    total_admins  = sb.table("profiles").select("id", count="exact", head=True).eq("rol", "admin").execute().count or 0
    total_asig    = sb.table("asignaciones").select("id", count="exact", head=True).execute().count or 0
    total_pagos   = sb.table("pagos").select("id", count="exact", head=True).execute().count or 0

    pagos_res = sb.table("pagos").select("monto, moneda").execute()
    monto_total_mxn = sum(p.get("monto", 0) for p in (pagos_res.data or []) if p.get("moneda") == "MXN")

    pendientes_lote = (
        sb.table("proceso_certificacion")
        .select("id", count="exact", head=True)
        .not_.is_("evaluado_at", "null")
        .is_("lote_enviado_at", "null")
        .execute()
        .count or 0
    )

    evaluadores = (
        sb.table("user_roles")
        .select("id", count="exact", head=True)
        .eq("role", "evaluador")
        .execute()
        .count or 0
    )
    asesores = (
        sb.table("user_roles")
        .select("id", count="exact", head=True)
        .eq("role", "asesor")
        .execute()
        .count or 0
    )

    return {
        "total_alumnos":     total_alumnos,
        "total_admins":      total_admins,
        "total_asignaciones": total_asig,
        "total_pagos":       total_pagos,
        "monto_total_mxn":   monto_total_mxn,
        "pendientes_lote":   pendientes_lote,
        "evaluadores":       evaluadores,
        "asesores":          asesores,
    }
