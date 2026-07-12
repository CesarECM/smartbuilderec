from datetime import datetime, timezone
from datetime import date as date_type
from fastapi import HTTPException, Request


def _caller(request: Request) -> str:
    return request.state.user.get("sub")


def _get_profile(sb, user_id: str) -> dict:
    res = sb.table("profiles").select("id, rol, admin_id, nombre, email, activo").eq("id", user_id).single().execute()
    return res.data or {}


def _require_role(profile: dict, *roles: str) -> None:
    if profile.get("rol") not in roles:
        raise HTTPException(status_code=403, detail="Sin permisos para esta acción.")


def _get_extra_roles(sb, user_id: str) -> set:
    res = sb.table("user_roles").select("role").eq("user_id", user_id).execute()
    return {r["role"] for r in (res.data or [])}


def _is_evaluador(sb, user_id: str) -> bool:
    return "evaluador" in _get_extra_roles(sb, user_id)


def _is_asesor(sb, user_id: str) -> bool:
    return "asesor" in _get_extra_roles(sb, user_id)


def _can_manage_alumno(sb, caller: dict, alumno_id: str) -> bool:
    if caller.get("rol") == "super_admin":
        return True
    if caller.get("rol") == "admin":
        res = sb.table("profiles").select("admin_id").eq("id", alumno_id).single().execute()
        return (res.data or {}).get("admin_id") == caller["id"]
    return False


def _is_assigned_as(sb, user_id: str, alumno_id: str, role_col: str) -> bool:
    res = (
        sb.table("asignaciones")
        .select("id")
        .eq("alumno_id", alumno_id)
        .eq(role_col, user_id)
        .limit(1)
        .execute()
    )
    return bool(res.data)


def _build_cert_status(proceso: dict | None, norma: dict) -> dict:
    if not proceso:
        return {
            "evaluado_at": None,
            "evaluado_por_nombre": None,
            "lote_enviado_at": None,
            "certificado_esperado_at": None,
            "certificado_recibido_at": None,
            "dias_restantes": None,
            "etapa": "pendiente",
        }

    dias_restantes = None
    etapa = "pendiente"

    if proceso.get("certificado_recibido_at"):
        etapa = "certificado_recibido"
    elif proceso.get("certificado_esperado_at"):
        etapa = "lote_enviado"
        esperado = date_type.fromisoformat(str(proceso["certificado_esperado_at"])[:10])
        hoy = datetime.now(timezone.utc).date()
        dias_restantes = max(0, (esperado - hoy).days)
    elif proceso.get("lote_enviado_at"):
        etapa = "lote_enviado"
    elif proceso.get("evaluado_at"):
        etapa = "evaluado"

    return {
        "evaluado_at": proceso.get("evaluado_at"),
        "evaluacion_notas": proceso.get("evaluacion_notas"),
        "lote_enviado_at": proceso.get("lote_enviado_at"),
        "certificado_esperado_at": proceso.get("certificado_esperado_at"),
        "certificado_recibido_at": proceso.get("certificado_recibido_at"),
        "dias_restantes": dias_restantes,
        "etapa": etapa,
        "dias_estimados_norma": norma.get("dias_estimados_certificado"),
    }
