from fastapi import APIRouter, Request

from database import get_supabase
from services.erp_helpers import _caller, _get_profile, _require_role

router = APIRouter(prefix="/erp", tags=["erp"])


@router.get("/admin/alumnos")
def listar_alumnos(request: Request, sin_pagos: bool = False):
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    _require_role(caller, "admin", "super_admin")

    q = sb.table("profiles").select(
        "id, nombre, apellido, email, activo, created_at, vigencia_hasta"
    ).eq("rol", "user")

    if caller.get("rol") == "admin":
        q = q.eq("admin_id", caller_id)

    q = q.order("created_at", desc=True)
    alumnos_res = q.execute()
    alumnos = alumnos_res.data or []

    if caller.get("rol") == "super_admin":
        sa_asig = (
            sb.table("asignaciones")
            .select("id")
            .eq("alumno_id", caller_id)
            .limit(1)
            .execute()
        )
        if sa_asig.data:
            sa_prof = (
                sb.table("profiles")
                .select("id, nombre, apellido, email, activo, created_at, vigencia_hasta")
                .eq("id", caller_id)
                .single()
                .execute()
            )
            if sa_prof.data:
                alumnos = [sa_prof.data] + alumnos

    if not alumnos:
        return {"alumnos": []}

    alumno_ids = [a["id"] for a in alumnos]

    asig_res = (
        sb.table("asignaciones")
        .select("alumno_id, norma_id, normas(codigo, nombre)")
        .in_("alumno_id", alumno_ids)
        .execute()
    )
    asig_por_alumno: dict[str, list] = {}
    for a in (asig_res.data or []):
        asig_por_alumno.setdefault(a["alumno_id"], []).append(a)

    pagos_res = (
        sb.table("pagos")
        .select("alumno_id, norma_id, concepto, monto, tipo, pagado_at")
        .in_("alumno_id", alumno_ids)
        .execute()
    )
    pagos_por_alumno: dict[str, list] = {}
    for p in (pagos_res.data or []):
        pagos_por_alumno.setdefault(p["alumno_id"], []).append(p)

    resultado = []
    for a in alumnos:
        aid = a["id"]
        asigs = asig_por_alumno.get(aid, [])
        pagos = pagos_por_alumno.get(aid, [])

        normas_alumno = [
            {"norma_id": x["norma_id"], "codigo": (x.get("normas") or {}).get("codigo"), "nombre": (x.get("normas") or {}).get("nombre")}
            for x in asigs
        ]

        normas_con_pago = {p["norma_id"] for p in pagos}
        normas_sin_pago = [n for n in normas_alumno if n["norma_id"] not in normas_con_pago]
        tiene_pendientes = bool(asigs) and bool(normas_sin_pago)

        if sin_pagos and not tiene_pendientes:
            continue

        resultado.append({
            **a,
            "normas": normas_alumno,
            "pagos_count": len(pagos),
            "normas_sin_pago": normas_sin_pago,
            "tiene_pendientes": tiene_pendientes,
        })

    return {"alumnos": resultado}
