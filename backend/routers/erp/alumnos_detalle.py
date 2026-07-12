from fastapi import APIRouter, HTTPException, Request

from database import get_supabase
from services.erp_helpers import (
    _caller, _get_profile, _get_extra_roles,
    _can_manage_alumno, _is_assigned_as, _build_cert_status,
)

router = APIRouter(prefix="/erp", tags=["erp"])


@router.get("/mis-servicios")
def mis_servicios(request: Request):
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    extra_roles = _get_extra_roles(sb, caller_id)

    if caller.get("rol") == "admin":
        raise HTTPException(
            status_code=400,
            detail="Los administradores usan /erp/admin/alumnos para ver servicios."
        )

    asig_res = (
        sb.table("asignaciones")
        .select(
            "id, norma_id, asesor_id, evaluador_id, admin_id, created_at, "
            "normas(id, codigo, nombre, descripcion, dias_estimados_certificado, tiene_wizard)"
        )
        .eq("alumno_id", caller_id)
        .execute()
    )
    asignaciones = asig_res.data or []

    if not asignaciones:
        return {"alumno": caller, "servicios": [], "extra_roles": list(extra_roles)}

    norma_ids = [a["norma_id"] for a in asignaciones]

    pagos_res = (
        sb.table("pagos")
        .select("norma_id, concepto, tipo, monto, moneda, pagado_at, referencia")
        .eq("alumno_id", caller_id)
        .in_("norma_id", norma_ids)
        .execute()
    )
    pagos_por_norma: dict[str, dict] = {}
    for p in (pagos_res.data or []):
        pagos_por_norma.setdefault(p["norma_id"], {})[p["concepto"]] = p

    proceso_res = (
        sb.table("proceso_certificacion")
        .select("*")
        .eq("alumno_id", caller_id)
        .in_("norma_id", norma_ids)
        .execute()
    )
    proceso_por_norma = {p["norma_id"]: p for p in (proceso_res.data or [])}

    people_ids = set()
    for a in asignaciones:
        if a.get("asesor_id"):
            people_ids.add(a["asesor_id"])
        if a.get("evaluador_id"):
            people_ids.add(a["evaluador_id"])
    people = {}
    if people_ids:
        ppl_res = (
            sb.table("profiles")
            .select("id, nombre, apellido, email")
            .in_("id", list(people_ids))
            .execute()
        )
        people = {p["id"]: p for p in (ppl_res.data or [])}

    servicios = []
    for a in asignaciones:
        norma = a.get("normas") or {}
        pagos_norma = pagos_por_norma.get(a["norma_id"], {})
        proceso = proceso_por_norma.get(a["norma_id"])

        servicios.append({
            "asignacion_id": a["id"],
            "norma": {
                "id": norma.get("id"),
                "codigo": norma.get("codigo"),
                "nombre": norma.get("nombre"),
                "descripcion": norma.get("descripcion"),
                "tiene_wizard": norma.get("tiene_wizard"),
            },
            "asesor": people.get(a.get("asesor_id") or ""),
            "evaluador": people.get(a.get("evaluador_id") or ""),
            "pagos": {
                "alineacion":   pagos_norma.get("alineacion"),
                "evaluacion":   pagos_norma.get("evaluacion"),
                "certificacion": pagos_norma.get("certificacion"),
            },
            "certificacion": _build_cert_status(proceso, norma),
            "inscrito_at": a["created_at"],
        })

    return {
        "alumno": {
            "id": caller["id"],
            "nombre": caller.get("nombre"),
            "email": caller.get("email"),
        },
        "servicios": servicios,
        "extra_roles": list(extra_roles),
    }


@router.get("/admin/alumnos/{alumno_id}/detalle")
def detalle_alumno(alumno_id: str, request: Request):
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    extra_roles = _get_extra_roles(sb, caller_id)

    tiene_acceso = (
        caller.get("rol") in ("admin", "super_admin")
        and _can_manage_alumno(sb, caller, alumno_id)
    ) or (
        "evaluador" in extra_roles and _is_assigned_as(sb, caller_id, alumno_id, "evaluador_id")
    ) or (
        "asesor" in extra_roles and _is_assigned_as(sb, caller_id, alumno_id, "asesor_id")
    )

    if not tiene_acceso:
        raise HTTPException(status_code=403, detail="Sin acceso a este alumno.")

    alumno_res = (
        sb.table("profiles")
        .select("id, nombre, apellido, email, activo, created_at, vigencia_hasta, admin_id")
        .eq("id", alumno_id)
        .single()
        .execute()
    )
    if not alumno_res.data:
        raise HTTPException(status_code=404, detail="Alumno no encontrado.")
    alumno = alumno_res.data

    asig_res = (
        sb.table("asignaciones")
        .select("id, norma_id, asesor_id, evaluador_id, admin_id, created_at, "
                "normas(id, codigo, nombre, descripcion, dias_estimados_certificado, tiene_wizard)")
        .eq("alumno_id", alumno_id)
        .execute()
    )
    asignaciones = asig_res.data or []

    norma_ids = [a["norma_id"] for a in asignaciones]

    pagos_res = (
        sb.table("pagos")
        .select("id, norma_id, concepto, tipo, monto, moneda, referencia, notas, pagado_at, registrado_por")
        .eq("alumno_id", alumno_id)
        .execute()
    )
    pagos_por_norma: dict[str, dict] = {}
    for p in (pagos_res.data or []):
        pagos_por_norma.setdefault(p["norma_id"], {})[p["concepto"]] = p

    proceso_res = (
        sb.table("proceso_certificacion")
        .select("*")
        .eq("alumno_id", alumno_id)
        .execute()
    )
    proceso_por_norma = {p["norma_id"]: p for p in (proceso_res.data or [])}

    people_ids = set()
    for a in asignaciones:
        if a.get("asesor_id"):
            people_ids.add(a["asesor_id"])
        if a.get("evaluador_id"):
            people_ids.add(a["evaluador_id"])
    people = {}
    if people_ids:
        ppl_res = (
            sb.table("profiles")
            .select("id, nombre, apellido, email")
            .in_("id", list(people_ids))
            .execute()
        )
        people = {p["id"]: p for p in (ppl_res.data or [])}

    servicios = []
    for a in asignaciones:
        norma = a.get("normas") or {}
        nid = a["norma_id"]
        pagos_norma = pagos_por_norma.get(nid, {})
        proceso = proceso_por_norma.get(nid)

        servicios.append({
            "asignacion_id": a["id"],
            "norma": norma,
            "asesor": people.get(a.get("asesor_id") or ""),
            "evaluador": people.get(a.get("evaluador_id") or ""),
            "pagos": {
                "alineacion":    pagos_norma.get("alineacion"),
                "evaluacion":    pagos_norma.get("evaluacion"),
                "certificacion": pagos_norma.get("certificacion"),
            },
            "certificacion": _build_cert_status(proceso, norma),
            "inscrito_at": a["created_at"],
        })

    return {"alumno": alumno, "servicios": servicios}
