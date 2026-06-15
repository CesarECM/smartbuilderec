from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone, timedelta, date as date_type
from database import get_supabase

router = APIRouter(prefix="/erp", tags=["erp"])


# ─── Helpers de autorización ──────────────────────────────────────────────────

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
    """Verifica que el admin sea dueño del alumno. Super_admin siempre puede."""
    if caller.get("rol") == "super_admin":
        return True
    if caller.get("rol") == "admin":
        res = sb.table("profiles").select("admin_id").eq("id", alumno_id).single().execute()
        return (res.data or {}).get("admin_id") == caller["id"]
    return False


def _is_assigned_as(sb, user_id: str, alumno_id: str, role_col: str) -> bool:
    """Verifica que el usuario esté asignado a ese alumno como evaluador o asesor."""
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
    """Construye el objeto de estado de certificación con días restantes."""
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


# ─── Catálogo de normas ───────────────────────────────────────────────────────

@router.get("/normas")
def listar_normas(request: Request, todas: bool = False):
    """Lista normas activas. Con ?todas=true el superadmin ve las inactivas también."""
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)

    q = sb.table("normas").select("*").order("codigo")
    if not (todas and caller.get("rol") == "super_admin"):
        q = q.eq("activo", True)

    res = q.execute()
    return {"normas": res.data or []}


# ─── Modelos ──────────────────────────────────────────────────────────────────

class NormaUpsert(BaseModel):
    codigo: str
    nombre: str
    descripcion: str = ""
    dias_estimados_certificado: int = 45
    tiene_wizard: bool = False
    activo: bool = True


class AsignacionRequest(BaseModel):
    alumno_id: str
    norma_id: str
    asesor_id: Optional[str] = None
    evaluador_id: Optional[str] = None


class PagoManualRequest(BaseModel):
    alumno_id: str
    norma_id: str
    concepto: str  # alineacion | evaluacion | certificacion
    monto: int = 0
    moneda: str = "MXN"
    referencia: Optional[str] = None
    notas: Optional[str] = None
    pagado_at: Optional[str] = None


class EvaluadoRequest(BaseModel):
    alumno_id: str
    norma_id: str
    evaluacion_notas: Optional[str] = None
    evaluado_at: Optional[str] = None


class LoteEnviadoRequest(BaseModel):
    alumno_id: str
    norma_id: str
    notas: Optional[str] = None
    lote_enviado_at: Optional[str] = None


class CertificadoRecibidoRequest(BaseModel):
    alumno_id: str
    norma_id: str
    certificado_recibido_at: Optional[str] = None


class AsignarRolRequest(BaseModel):
    user_id: str
    role: str  # evaluador | asesor


# ─── Superadmin: CRUD normas ──────────────────────────────────────────────────

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


# ─── Dashboard del alumno ─────────────────────────────────────────────────────

@router.get("/mis-servicios")
def mis_servicios(request: Request):
    """
    Vista completa del alumno: sus normas, pagos y estado de certificación.
    También accesible por evaluadores y asesores (ven los alumnos que tienen asignados).
    """
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    extra_roles = _get_extra_roles(sb, caller_id)

    # Si el caller es alumno, muestra sus propias asignaciones
    # Si es evaluador/asesor, muestra las de sus alumnos asignados
    if caller.get("rol") in ("admin", "super_admin"):
        raise HTTPException(
            status_code=400,
            detail="Los administradores usan /erp/admin/alumnos para ver servicios."
        )

    asig_q = sb.table("asignaciones").select(
        "id, norma_id, asesor_id, evaluador_id, admin_id, created_at, "
        "normas(id, codigo, nombre, descripcion, dias_estimados_certificado, tiene_wizard)"
    )

    if extra_roles and caller.get("rol") in ("user",):
        # Usuario con roles de evaluador/asesor también puede ver sus alumnos asignados
        # pero /mis-servicios es solo para ver los propios
        asig_q = asig_q.eq("alumno_id", caller_id)
    else:
        asig_q = asig_q.eq("alumno_id", caller_id)

    asig_res = asig_q.execute()
    asignaciones = asig_res.data or []

    if not asignaciones:
        return {"alumno": caller, "servicios": [], "extra_roles": list(extra_roles)}

    norma_ids = [a["norma_id"] for a in asignaciones]

    # Pagos del alumno
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

    # Procesos de certificación del alumno
    proceso_res = (
        sb.table("proceso_certificacion")
        .select("*")
        .eq("alumno_id", caller_id)
        .in_("norma_id", norma_ids)
        .execute()
    )
    proceso_por_norma = {p["norma_id"]: p for p in (proceso_res.data or [])}

    # Resolver nombres de asesores y evaluadores
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


# ─── Admin / Superadmin: gestión de alumnos ───────────────────────────────────

@router.get("/admin/alumnos")
def listar_alumnos(request: Request, sin_pagos: bool = False):
    """
    Lista alumnos del admin con resumen de pagos y normas.
    Super admin ve todos los alumnos de la plataforma.
    Con ?sin_pagos=true filtra solo alumnos sin ningún pago registrado.
    """
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

    if not alumnos:
        return {"alumnos": []}

    alumno_ids = [a["id"] for a in alumnos]

    # Asignaciones de estos alumnos
    asig_res = (
        sb.table("asignaciones")
        .select("alumno_id, norma_id, normas(codigo, nombre)")
        .in_("alumno_id", alumno_ids)
        .execute()
    )
    asig_por_alumno: dict[str, list] = {}
    for a in (asig_res.data or []):
        asig_por_alumno.setdefault(a["alumno_id"], []).append(a)

    # Pagos de estos alumnos
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

        # Normas en que está enrolado
        normas_alumno = [
            {"norma_id": x["norma_id"], "codigo": (x.get("normas") or {}).get("codigo"), "nombre": (x.get("normas") or {}).get("nombre")}
            for x in asigs
        ]

        # Normas con al menos un pago
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


@router.get("/admin/alumnos/{alumno_id}/detalle")
def detalle_alumno(alumno_id: str, request: Request):
    """Perfil completo del alumno: normas, pagos, asignaciones y proceso de certificación."""
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    extra_roles = _get_extra_roles(sb, caller_id)

    # Verificar acceso
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


# ─── Asignaciones ─────────────────────────────────────────────────────────────

@router.post("/admin/asignaciones", status_code=201)
def crear_asignacion(data: AsignacionRequest, request: Request):
    """Inscribe a un alumno en una norma y opcionalmente asigna asesor/evaluador."""
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    _require_role(caller, "admin", "super_admin")

    if not _can_manage_alumno(sb, caller, data.alumno_id):
        raise HTTPException(status_code=403, detail="No puedes gestionar a este alumno.")

    norma_res = sb.table("normas").select("id").eq("id", data.norma_id).eq("activo", True).single().execute()
    if not norma_res.data:
        raise HTTPException(status_code=404, detail="Norma no encontrada o inactiva.")

    # Validar que asesor/evaluador existan si se proporcionan
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
    """Lista asignaciones del admin (o todas para super_admin)."""
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


# ─── Pagos ────────────────────────────────────────────────────────────────────

@router.post("/admin/pagos/manual", status_code=201)
def registrar_pago_manual(data: PagoManualRequest, request: Request):
    """Registra un pago manual (transferencia, depósito, efectivo)."""
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    _require_role(caller, "admin", "super_admin")

    if not _can_manage_alumno(sb, caller, data.alumno_id):
        raise HTTPException(status_code=403, detail="No puedes registrar pagos para este alumno.")

    if data.concepto not in ("alineacion", "evaluacion", "certificacion"):
        raise HTTPException(status_code=400, detail="concepto debe ser: alineacion, evaluacion o certificacion.")

    # Verificar que exista asignacion previa para este alumno+norma
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
    """Elimina un pago (solo super_admin o el admin que lo registró)."""
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
    """Devuelve alumnos que tienen asignaciones pero al menos una norma sin pago."""
    return listar_alumnos(request, sin_pagos=True)


# ─── Proceso de certificación ─────────────────────────────────────────────────

def _upsert_proceso(sb, alumno_id: str, norma_id: str, updates: dict) -> dict:
    """Crea o actualiza el registro de proceso_certificacion."""
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
    """
    El evaluador asignado registra que el alumno fue evaluado exitosamente.
    También accesible por admin/super_admin.
    """
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
    """
    Admin o superadmin registra que se envió el lote al CONOCER.
    Calcula automáticamente certificado_esperado_at con base en norma.dias_estimados_certificado.
    """
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
    """Admin o superadmin registra que el alumno recibió su certificado."""
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
    """Estado del proceso de certificación de un alumno en todas sus normas."""
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    extra_roles = _get_extra_roles(sb, caller_id)

    # El propio alumno puede ver su estado
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


# ─── Superadmin: gestión de roles adicionales ─────────────────────────────────

@router.post("/admin/roles/asignar", status_code=201)
def asignar_rol(data: AsignarRolRequest, request: Request):
    """Superadmin asigna rol evaluador o asesor a un usuario."""
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    _require_role(caller, "super_admin")

    if data.role not in ("evaluador", "asesor"):
        raise HTTPException(status_code=400, detail="role debe ser 'evaluador' o 'asesor'.")

    user_res = sb.table("profiles").select("id, nombre, email").eq("id", data.user_id).single().execute()
    if not user_res.data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado.")

    try:
        res = (
            sb.table("user_roles")
            .upsert({"user_id": data.user_id, "role": data.role, "assigned_by": caller_id},
                    on_conflict="user_id,role")
            .execute()
        )
        return {"ok": True, "user": user_res.data, "role": data.role}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al asignar rol: {e}")


@router.delete("/admin/roles/quitar")
def quitar_rol(user_id: str, role: str, request: Request):
    """Superadmin quita un rol adicional a un usuario."""
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    _require_role(caller, "super_admin")

    if role not in ("evaluador", "asesor"):
        raise HTTPException(status_code=400, detail="role debe ser 'evaluador' o 'asesor'.")

    sb.table("user_roles").delete().eq("user_id", user_id).eq("role", role).execute()
    return {"ok": True, "user_id": user_id, "role_removed": role}


@router.get("/admin/roles")
def listar_roles(request: Request):
    """Superadmin lista todos los roles adicionales asignados."""
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


# ─── Vista global superadmin ──────────────────────────────────────────────────

@router.get("/superadmin/resumen")
def resumen_global(request: Request):
    """
    Superadmin: totales globales del ERP para el dashboard.
    """
    sb = get_supabase()
    caller_id = _caller(request)
    caller = _get_profile(sb, caller_id)
    _require_role(caller, "super_admin")

    total_alumnos = sb.table("profiles").select("id", count="exact", head=True).eq("rol", "user").execute().count or 0
    total_admins  = sb.table("profiles").select("id", count="exact", head=True).eq("rol", "admin").execute().count or 0
    total_asig    = sb.table("asignaciones").select("id", count="exact", head=True).execute().count or 0
    total_pagos   = sb.table("pagos").select("id", count="exact", head=True).execute().count or 0

    # Sumar montos de pagos
    pagos_res = sb.table("pagos").select("monto, moneda").execute()
    monto_total_mxn = sum(p.get("monto", 0) for p in (pagos_res.data or []) if p.get("moneda") == "MXN")

    # Alumnos con proceso evaluado pero sin lote enviado (pendientes de acción del admin)
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
