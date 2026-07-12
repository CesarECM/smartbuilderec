from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request
from typing import Optional

from database import get_supabase
from models.erp_models import AsignacionRequest, PagoManualRequest
from services.erp_helpers import _caller, _get_profile, _require_role, _can_manage_alumno

router = APIRouter(prefix="/erp", tags=["erp"])


@router.post("/admin/asignaciones", status_code=201)
def crear_asignacion(data: AsignacionRequest, request: Request):
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    _require_role(caller, "admin", "super_admin")

    if not _can_manage_alumno(sb, caller, data.alumno_id):
        raise HTTPException(status_code=403, detail="No puedes gestionar a este alumno.")

    norma_res = sb.table("normas").select("id").eq("id", data.norma_id).eq("activo", True).single().execute()
    if not norma_res.data:
        raise HTTPException(status_code=404, detail="Norma no encontrada o inactiva.")

    for fk, nombre in [(data.asesor_id, "asesor"), (data.evaluador_id, "evaluador")]:
        if fk:
            r = sb.table("profiles").select("id").eq("id", fk).execute()
            if not r.data:
                raise HTTPException(status_code=404, detail=f"El {nombre} con id {fk} no existe.")

    payload = {
        "alumno_id":    data.alumno_id,
        "norma_id":     data.norma_id,
        "admin_id":     caller_id,
        "asesor_id":    data.asesor_id or None,
        "evaluador_id": data.evaluador_id or None,
    }

    try:
        res = (
            sb.table("asignaciones")
            .upsert(payload, on_conflict="alumno_id,norma_id")
            .execute()
        )
        return res.data[0] if res.data else payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al crear asignación: {e}")


@router.get("/admin/asignaciones")
def listar_asignaciones(request: Request, norma_id: Optional[str] = None):
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    _require_role(caller, "admin", "super_admin")

    q = sb.table("asignaciones").select(
        "id, alumno_id, norma_id, asesor_id, evaluador_id, admin_id, created_at, "
        "normas(codigo, nombre), "
        "profiles!asignaciones_alumno_id_fkey(nombre, apellido, email)"
    )

    if caller.get("rol") == "admin":
        q = q.eq("admin_id", caller_id)
    if norma_id:
        q = q.eq("norma_id", norma_id)

    res = q.order("created_at", desc=True).execute()
    return {"asignaciones": res.data or []}


@router.delete("/admin/asignaciones/{asignacion_id}", status_code=200)
def eliminar_asignacion(asignacion_id: str, request: Request):
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    _require_role(caller, "admin", "super_admin")

    asig_res = sb.table("asignaciones").select("alumno_id, admin_id").eq("id", asignacion_id).single().execute()
    if not asig_res.data:
        raise HTTPException(status_code=404, detail="Asignación no encontrada.")

    if caller.get("rol") == "admin" and asig_res.data.get("admin_id") != caller_id:
        raise HTTPException(status_code=403, detail="No puedes eliminar asignaciones de otro admin.")

    sb.table("asignaciones").delete().eq("id", asignacion_id).execute()
    return {"deleted": asignacion_id}


@router.post("/admin/pagos/manual", status_code=201)
def registrar_pago_manual(data: PagoManualRequest, request: Request):
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    _require_role(caller, "admin", "super_admin")

    if not _can_manage_alumno(sb, caller, data.alumno_id):
        raise HTTPException(status_code=403, detail="No puedes registrar pagos para este alumno.")

    if data.concepto not in ("alineacion", "evaluacion", "certificacion"):
        raise HTTPException(status_code=400, detail="concepto debe ser: alineacion, evaluacion o certificacion.")

    asig = (
        sb.table("asignaciones")
        .select("id")
        .eq("alumno_id", data.alumno_id)
        .eq("norma_id", data.norma_id)
        .limit(1)
        .execute()
    )
    if not asig.data:
        raise HTTPException(
            status_code=400,
            detail="El alumno no está inscrito en esta norma. Crea primero la asignación."
        )

    pagado_at = data.pagado_at or datetime.now(timezone.utc).isoformat()

    payload = {
        "alumno_id":      data.alumno_id,
        "norma_id":       data.norma_id,
        "concepto":       data.concepto,
        "tipo":           "manual",
        "monto":          data.monto,
        "moneda":         data.moneda,
        "referencia":     data.referencia or None,
        "notas":          data.notas or None,
        "registrado_por": caller_id,
        "pagado_at":      pagado_at,
    }

    try:
        res = (
            sb.table("pagos")
            .upsert(payload, on_conflict="alumno_id,norma_id,concepto")
            .execute()
        )
        return res.data[0] if res.data else payload
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al registrar pago: {e}")


@router.delete("/admin/pagos/{pago_id}", status_code=200)
def eliminar_pago(pago_id: str, request: Request):
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    _require_role(caller, "admin", "super_admin")

    pago_res = sb.table("pagos").select("alumno_id, registrado_por").eq("id", pago_id).single().execute()
    if not pago_res.data:
        raise HTTPException(status_code=404, detail="Pago no encontrado.")

    if caller.get("rol") == "admin":
        if pago_res.data.get("registrado_por") != caller_id:
            raise HTTPException(status_code=403, detail="Solo puedes eliminar pagos que tú registraste.")

    sb.table("pagos").delete().eq("id", pago_id).execute()
    return {"deleted": pago_id}


@router.get("/admin/pagos/pendientes")
def pagos_pendientes(request: Request):
    from routers.erp.alumnos_lista import listar_alumnos
    return listar_alumnos(request, sin_pagos=True)
