import os

from fastapi import APIRouter, HTTPException, Request

from database import get_supabase
from models.gce_models import ProcesoCreate, ProcesoUpdate, ESTADOS_VALIDOS
from services.erp_helpers import _caller, _get_profile, _get_extra_roles
from services.email_service import send_template

router = APIRouter(prefix="/gce", tags=["gce"])


def _puede_gestionar(sb, uid: str, perfil: dict) -> bool:
    if perfil.get("rol") == "super_admin":
        return True
    return bool(_get_extra_roles(sb, uid) & {"ce_admin", "oc_admin"})


@router.post("/procesos", status_code=201)
def crear_proceso(data: ProcesoCreate, request: Request):
    sb = get_supabase()
    try:
        uid = _caller(request)
        caller = _get_profile(sb, uid)
        if not _puede_gestionar(sb, uid, caller):
            raise HTTPException(403, "Se requiere rol ce_admin.")

        # Verificar duplicado antes de descontar créditos
        dup = sb.table("procesos_evaluacion").select("id") \
            .eq("candidato_id", data.candidato_id) \
            .eq("estandar_id", data.estandar_id) \
            .limit(1).execute()
        if dup and dup.data:
            raise HTTPException(409, "Este candidato ya tiene un proceso activo para ese estándar.")

        credito_canjeado = False
        if caller.get("rol") != "super_admin":
            adm = sb.table("profiles").select("credits").eq("id", uid).maybe_single().execute()
            creditos = (adm.data or {}).get("credits", 0) or 0
            if creditos < 1:
                raise HTTPException(402, "Sin créditos suficientes. Recarga tu plan para continuar.")
            sb.table("profiles").update({"credits": creditos - 1}).eq("id", uid).execute()
            try:
                sb.table("credit_transactions").insert({
                    "user_id":     uid,
                    "type":        "gce_proceso_manual",
                    "amount":      -1,
                    "source":      f"proceso_manual:{data.candidato_id}:{data.estandar_id}",
                    "description": "Proceso de evaluación creado manualmente",
                }).execute()
            except Exception:
                pass
            credito_canjeado = True

        payload = data.model_dump()
        payload["ce_id"]            = uid
        payload["credito_canjeado"] = credito_canjeado

        res = sb.table("procesos_evaluacion").insert(payload).execute()
        return res.data[0] if res.data else {}
    except HTTPException:
        raise
    except Exception as e:
        msg = str(e)
        if "23505" in msg or "unique" in msg.lower():
            raise HTTPException(409, "Este candidato ya tiene un proceso activo para ese estándar.")
        raise HTTPException(500, f"Error al crear proceso: {msg}")


@router.get("/procesos")
def listar_procesos(request: Request):
    sb = get_supabase()
    try:
        uid = _caller(request)
        caller = _get_profile(sb, uid)

        q = (
            sb.table("procesos_evaluacion")
            .select(
                "id, estado, juicio, credito_canjeado, created_at, "
                "candidato_id, evaluador_id, estandar_id, ce_id"
            )
            .order("created_at", desc=True)
        )

        if caller.get("rol") == "super_admin":
            pass
        elif "oc_admin" in _get_extra_roles(sb, uid):
            q = q.eq("oc_id", uid)
        else:
            q = q.eq("ce_id", uid)

        res = q.execute()
        return {"procesos": res.data or []}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, f"Error al listar procesos: {str(e)}")


@router.get("/procesos/{proceso_id}")
def obtener_proceso(proceso_id: str, request: Request):
    sb = get_supabase()
    _caller(request)

    res = (
        sb.table("procesos_evaluacion")
        .select("*")
        .eq("id", proceso_id)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(404, "Proceso no encontrado.")
    return res.data


_ESTADOS_NOTIFICAR = {"juicio", "cierre"}
_LABELS_ESTADO = {
    "juicio": "Juicio de evaluación emitido",
    "cierre": "Cédula de Evaluación disponible",
}


def _notificar_candidato(sb, proceso_id: str, nuevo_estado: str) -> None:
    if nuevo_estado not in _ESTADOS_NOTIFICAR:
        return
    try:
        proc = sb.table("procesos_evaluacion") \
            .select("candidato_id, estandar_id") \
            .eq("id", proceso_id).maybe_single().execute()
        if not proc.data:
            return
        cand = sb.table("profiles").select("nombre, email") \
            .eq("id", proc.data["candidato_id"]).maybe_single().execute()
        ec = sb.table("estandares_competencia").select("codigo") \
            .eq("id", proc.data["estandar_id"]).maybe_single().execute()
        if not cand.data or not cand.data.get("email"):
            return
        frontend_url = os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app")
        send_template("gce_avance_proceso", cand.data["email"], {
            "nombre":          cand.data.get("nombre", cand.data["email"]),
            "ec_codigo":       (ec.data or {}).get("codigo", "GCE"),
            "estado_label":    _LABELS_ESTADO[nuevo_estado],
            "link_portafolio": f"{frontend_url}/gce?proceso_id={proceso_id}",
        })
    except Exception as e:
        print(f"⚠️ gce notify error: {e}")


@router.patch("/procesos/{proceso_id}")
def actualizar_proceso(proceso_id: str, data: ProcesoUpdate, request: Request):
    sb = get_supabase()
    _caller(request)

    payload = data.model_dump(exclude_unset=True)
    if not payload:
        raise HTTPException(400, "Sin campos a actualizar.")
    if "estado" in payload and payload["estado"] not in ESTADOS_VALIDOS:
        raise HTTPException(400, f"Estado inválido: {payload['estado']}")

    res = (
        sb.table("procesos_evaluacion")
        .update(payload)
        .eq("id", proceso_id)
        .execute()
    )
    if "estado" in payload:
        _notificar_candidato(sb, proceso_id, payload["estado"])
    return res.data[0] if res.data else {}


@router.get("/mis-estandares")
def mis_estandares(request: Request):
    """ECs autorizados para el CE logueado; todos los activos si no tiene OC."""
    sb = get_supabase()
    uid = _caller(request)
    perfil = _get_profile(sb, uid)

    if perfil.get("rol") == "super_admin":
        res = sb.table("estandares_competencia") \
            .select("id, codigo, titulo").eq("activo", True).order("codigo").execute()
        return {"estandares": res.data or [], "filtrado": False}

    tiene_oc = bool(
        sb.table("oc_ce_relaciones").select("oc_id").eq("ce_id", uid).execute().data
    )
    if not tiene_oc:
        res = sb.table("estandares_competencia") \
            .select("id, codigo, titulo").eq("activo", True).order("codigo").execute()
        return {"estandares": res.data or [], "filtrado": False}

    autorizados = sb.table("ce_estandares_autorizados") \
        .select("estandar_id, estandares_competencia(id, codigo, titulo)") \
        .eq("ce_id", uid).execute()
    estandares = [
        {
            "id":     row["estandar_id"],
            "codigo": (row.get("estandares_competencia") or {}).get("codigo"),
            "titulo": (row.get("estandares_competencia") or {}).get("titulo"),
        }
        for row in (autorizados.data or [])
    ]
    return {"estandares": estandares, "filtrado": True}


@router.get("/equipo")
def mi_equipo(request: Request):
    """Evaluadores + candidatos activos del CE logueado."""
    sb = get_supabase()
    uid = _caller(request)
    perfil = _get_profile(sb, uid)
    if not _puede_gestionar(sb, uid, perfil):
        raise HTTPException(403, "Se requiere rol ce_admin.")

    # 1. Evaluadores del CE
    ev_rows = sb.table("ce_evaluador_relaciones") \
        .select("evaluador_id").eq("ce_id", uid).execute()
    ev_ids = [r["evaluador_id"] for r in (ev_rows.data or [])]
    evaluadores = []
    if ev_ids:
        prof_res = sb.table("profiles") \
            .select("id, nombre, apellido, email").in_("id", ev_ids).execute()
        evaluadores = prof_res.data or []

    # 2. Candidatos con procesos activos (estado != certificado)
    proc_rows = sb.table("procesos_evaluacion") \
        .select("candidato_id, estandar_id, estado, evaluador_id, "
                "estandares_competencia(id, codigo, titulo)") \
        .eq("ce_id", uid).neq("estado", "certificado").execute()

    cand_ids = list({r["candidato_id"] for r in (proc_rows.data or []) if r.get("candidato_id")})
    cand_profiles: dict = {}
    if cand_ids:
        cp = sb.table("profiles").select("id, nombre, apellido, email").in_("id", cand_ids).execute()
        cand_profiles = {p["id"]: p for p in (cp.data or [])}

    candidatos_map: dict = {}
    for row in (proc_rows.data or []):
        cid = row["candidato_id"]
        if cid not in candidatos_map:
            prof = cand_profiles.get(cid, {})
            candidatos_map[cid] = {
                "id":       cid,
                "nombre":   prof.get("nombre"),
                "apellido": prof.get("apellido"),
                "email":    prof.get("email"),
                "procesos": [],
            }
        ec = row.get("estandares_competencia") or {}
        candidatos_map[cid]["procesos"].append({
            "estandar_id":     row["estandar_id"],
            "estandar_codigo": ec.get("codigo"),
            "estandar_titulo": ec.get("titulo"),
            "estado":          row["estado"],
            "evaluador_id":    row.get("evaluador_id"),
        })

    return {
        "evaluadores":        evaluadores,
        "candidatos_activos": list(candidatos_map.values()),
    }


@router.get("/candidatos/buscar")
def buscar_candidatos(q: str, request: Request):
    """Busca candidatos del CE (admin_id = ce_uid) por nombre o email."""
    sb = get_supabase()
    uid = _caller(request)
    perfil = _get_profile(sb, uid)
    if not _puede_gestionar(sb, uid, perfil):
        raise HTTPException(403, "Se requiere rol ce_admin u oc_admin.")
    if not q or len(q.strip()) < 2:
        return {"candidatos": []}
    lq = q.strip().lower()
    if perfil.get("rol") == "super_admin":
        res = (
            sb.table("profiles").select("id, nombre, apellido, email")
            .or_(f"nombre.ilike.%{lq}%,apellido.ilike.%{lq}%,email.ilike.%{lq}%")
            .limit(10).execute()
        )
        return {"candidatos": res.data or []}

    # CE: buscar entre candidatos con admin_id + candidatos que aceptaron invitación
    inv_rows = sb.table("gce_invitaciones") \
        .select("candidato_id").eq("ce_id", uid) \
        .eq("tipo", "candidato").eq("estado", "aceptada").execute()
    inv_ids = [r["candidato_id"] for r in (inv_rows.data or []) if r.get("candidato_id")]

    seen, candidatos = set(), []
    # 1. usuarios registrados bajo este admin
    r1 = (
        sb.table("profiles").select("id, nombre, apellido, email")
        .eq("admin_id", uid)
        .or_(f"nombre.ilike.%{lq}%,apellido.ilike.%{lq}%,email.ilike.%{lq}%")
        .limit(10).execute()
    )
    for p in (r1.data or []):
        seen.add(p["id"]); candidatos.append(p)

    # 2. candidatos GCE (por invitación)
    if inv_ids:
        r2 = (
            sb.table("profiles").select("id, nombre, apellido, email")
            .in_("id", inv_ids)
            .or_(f"nombre.ilike.%{lq}%,apellido.ilike.%{lq}%,email.ilike.%{lq}%")
            .limit(10).execute()
        )
        for p in (r2.data or []):
            if p["id"] not in seen:
                candidatos.append(p)

    return {"candidatos": candidatos[:10]}
