from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Request

from database import get_supabase
from models.erp_models import EvaluadoRequest, LoteEnviadoRequest, CertificadoRecibidoRequest
from services.erp_helpers import (
    _caller, _get_profile, _require_role, _get_extra_roles,
    _can_manage_alumno, _is_assigned_as, _build_cert_status,
)

router = APIRouter(prefix="/erp", tags=["erp"])


def _upsert_proceso(sb, alumno_id: str, norma_id: str, updates: dict) -> dict:
    existing = (
        sb.table("proceso_certificacion")
        .select("id")
        .eq("alumno_id", alumno_id)
        .eq("norma_id", norma_id)
        .limit(1)
        .execute()
    )
    if existing.data:
        res = (
            sb.table("proceso_certificacion")
            .update(updates)
            .eq("alumno_id", alumno_id)
            .eq("norma_id", norma_id)
            .execute()
        )
    else:
        res = (
            sb.table("proceso_certificacion")
            .insert({"alumno_id": alumno_id, "norma_id": norma_id, **updates})
            .execute()
        )
    return res.data[0] if res.data else {}


@router.post("/certificacion/evaluado", status_code=200)
def registrar_evaluado(data: EvaluadoRequest, request: Request):
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    extra_roles = _get_extra_roles(sb, caller_id)

    puede = (
        caller.get("rol") in ("admin", "super_admin")
        and _can_manage_alumno(sb, caller, data.alumno_id)
    ) or (
        "evaluador" in extra_roles
        and _is_assigned_as(sb, caller_id, data.alumno_id, "evaluador_id")
    )

    if not puede:
        raise HTTPException(status_code=403, detail="No tienes permisos para registrar esta evaluación.")

    evaluado_at = data.evaluado_at or datetime.now(timezone.utc).isoformat()

    resultado = _upsert_proceso(sb, data.alumno_id, data.norma_id, {
        "evaluado_at":      evaluado_at,
        "evaluado_por":     caller_id,
        "evaluacion_notas": data.evaluacion_notas or None,
    })
    return {"ok": True, "proceso": resultado}


@router.post("/certificacion/lote-enviado", status_code=200)
def registrar_lote_enviado(data: LoteEnviadoRequest, request: Request):
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    _require_role(caller, "admin", "super_admin")

    if not _can_manage_alumno(sb, caller, data.alumno_id):
        raise HTTPException(status_code=403, detail="No puedes gestionar a este alumno.")

    norma_res = sb.table("normas").select("dias_estimados_certificado").eq("id", data.norma_id).single().execute()
    if not norma_res.data:
        raise HTTPException(status_code=404, detail="Norma no encontrada.")

    dias = norma_res.data.get("dias_estimados_certificado", 45)
    lote_at_str = data.lote_enviado_at or datetime.now(timezone.utc).isoformat()
    lote_at = datetime.fromisoformat(lote_at_str.replace("Z", "+00:00"))
    cert_esperado = (lote_at + timedelta(days=dias)).date().isoformat()

    resultado = _upsert_proceso(sb, data.alumno_id, data.norma_id, {
        "lote_enviado_at":         lote_at_str,
        "lote_enviado_por":        caller_id,
        "certificado_esperado_at": cert_esperado,
        "notas":                   data.notas or None,
    })
    return {"ok": True, "certificado_esperado_at": cert_esperado, "proceso": resultado}


@router.post("/certificacion/recibido", status_code=200)
def registrar_certificado_recibido(data: CertificadoRecibidoRequest, request: Request):
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    _require_role(caller, "admin", "super_admin")

    if not _can_manage_alumno(sb, caller, data.alumno_id):
        raise HTTPException(status_code=403, detail="No puedes gestionar a este alumno.")

    recibido_at = data.certificado_recibido_at or datetime.now(timezone.utc).date().isoformat()

    resultado = _upsert_proceso(sb, data.alumno_id, data.norma_id, {
        "certificado_recibido_at": recibido_at,
    })
    return {"ok": True, "certificado_recibido_at": recibido_at, "proceso": resultado}


@router.get("/certificacion/status/{alumno_id}")
def status_certificacion(alumno_id: str, request: Request):
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    extra_roles = _get_extra_roles(sb, caller_id)

    es_propio = alumno_id == caller_id
    puede = (
        es_propio
        or (caller.get("rol") in ("admin", "super_admin") and _can_manage_alumno(sb, caller, alumno_id))
        or ("evaluador" in extra_roles and _is_assigned_as(sb, caller_id, alumno_id, "evaluador_id"))
        or ("asesor"    in extra_roles and _is_assigned_as(sb, caller_id, alumno_id, "asesor_id"))
    )
    if not puede:
        raise HTTPException(status_code=403, detail="Sin acceso a este alumno.")

    proceso_res = (
        sb.table("proceso_certificacion")
        .select("*, normas(codigo, nombre, dias_estimados_certificado)")
        .eq("alumno_id", alumno_id)
        .execute()
    )

    resultados = []
    for p in (proceso_res.data or []):
        norma = p.get("normas") or {}
        resultados.append({
            "norma_codigo": norma.get("codigo"),
            "norma_nombre": norma.get("nombre"),
            **_build_cert_status(p, norma),
        })

    return {"alumno_id": alumno_id, "procesos": resultados}
