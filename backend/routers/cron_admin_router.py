import os
from datetime import datetime, timezone

import pyotp
from fastapi import APIRouter, HTTPException, Request

from models.wizard_models import TokenRequest
from models.admin_models import CreateUserRequest
from services.email_service import send_template

router = APIRouter()


@router.get("/perfil")
def get_perfil(request: Request):
    from database import get_supabase
    user_id = request.state.user.get("sub")
    sb = get_supabase()
    res = sb.table("profiles").select(
        "id, nombre, apellido, rol, credits, activo, "
        "branding_logo_url, branding_empresa, branding_color_primario, branding_color_acento, "
        "branding_color_oscuro, branding_color_profundo, branding_color_fondo, branding_color_borde"
    ).eq("id", user_id).single().execute()
    return res.data or {}


@router.post("/validate-token")
def validate_token(data: TokenRequest):
    SECRET_KEY = os.getenv("TOTP_SECRET", "JBSWY3DPEHPK3PXP")
    totp = pyotp.TOTP(SECRET_KEY, interval=30)
    if totp.verify(data.token):
        return {"status": "valid"}
    return {"status": "invalid"}


@router.post("/admin/create-user", status_code=201)
def admin_create_user(data: CreateUserRequest, request: Request):
    from database import get_supabase

    caller_id = request.state.user.get("sub")
    sb = get_supabase()

    caller_res = sb.table("profiles").select("rol, id, nombre").eq("id", caller_id).single().execute()
    caller = caller_res.data or {}
    if caller.get("rol") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Solo admins pueden crear usuarios.")
    if caller.get("rol") == "admin" and caller.get("id") != data.admin_id:
        raise HTTPException(status_code=403, detail="No puedes crear usuarios para otro admin.")

    try:
        result = sb.auth.admin.create_user({
            "email": data.email,
            "email_confirm": True,
            "user_metadata": {
                "nombre": data.nombre,
                "apellido": data.apellido,
                "admin_id": data.admin_id,
            },
        })
        user_id = result.user.id

        sb.table("profiles").update({
            "nombre": data.nombre,
            "apellido": data.apellido,
            "admin_id": data.admin_id,
            "rol": "user",
            "activo": True,
        }).eq("id", user_id).execute()

        frontend_url = os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app")
        try:
            sb.auth.admin.generate_link({
                "type": "recovery",
                "email": data.email,
                "options": {"redirect_to": f"{frontend_url}/reset-password.html"},
            })
        except Exception:
            pass

        try:
            from services.email_service import send_template as _send_tpl
            admin_nombre = caller.get("nombre") or "Tu administrador"
            if data.admin_id and caller.get("rol") == "super_admin":
                _ar = sb.table("profiles").select("nombre").eq("id", data.admin_id).single().execute()
                admin_nombre = (_ar.data or {}).get("nombre") or admin_nombre
            _send_tpl("bienvenida_user_codigo", data.email, {
                "nombre": data.nombre,
                "email": data.email,
                "nombre_admin": admin_nombre,
            })
        except Exception:
            pass

        try:
            if data.admin_id:
                from services.email_service import send_template as _send_tpl
                _cr = sb.table("profiles").select("nombre, email, credits").eq("id", data.admin_id).single().execute()
                if _cr.data and _cr.data.get("credits") == 1 and _cr.data.get("email"):
                    _send_tpl("creditos_bajos_admin", _cr.data["email"], {
                        "nombre": _cr.data.get("nombre") or _cr.data["email"],
                        "email": _cr.data["email"],
                        "creditos_restantes": "1",
                    })
        except Exception:
            pass

        return {"id": user_id, "email": data.email}

    except Exception as e:
        err = str(e)
        try:
            sb.table("audit_logs").insert({
                "actor_id":    caller_id,
                "actor_email": (sb.table("profiles").select("email").eq("id", caller_id).single().execute().data or {}).get("email", ""),
                "action":      "user_creation_failed",
                "target_email": data.email,
                "details":     {"error": err[:300]},
            }).execute()
        except Exception:
            pass
        if "already been registered" in err or "already exists" in err:
            raise HTTPException(status_code=409, detail="El correo ya está registrado.")
        raise HTTPException(status_code=500, detail=f"Error al crear usuario: {err}")


@router.delete("/admin/users/{user_id}", status_code=200)
def admin_delete_user(user_id: str, request: Request):
    from database import get_supabase

    caller_id = request.state.user.get("sub")
    sb = get_supabase()

    caller_res = sb.table("profiles").select("rol, id, email").eq("id", caller_id).single().execute()
    caller = caller_res.data or {}
    if caller.get("rol") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Sin permisos para eliminar usuarios.")

    target_res = sb.table("profiles").select("admin_id, rol, email").eq("id", user_id).single().execute()
    target = target_res.data or {}

    if caller.get("rol") == "admin":
        if target.get("admin_id") != caller_id:
            raise HTTPException(status_code=403, detail="No puedes eliminar usuarios de otro admin.")
        if target.get("rol") != "user":
            raise HTTPException(status_code=403, detail="Solo puedes eliminar usuarios regulares.")

    try:
        sb.auth.admin.delete_user(user_id)

        try:
            sb.table("audit_logs").insert({
                "actor_id":    caller_id,
                "actor_email": caller.get("email", ""),
                "action":      "user_deleted",
                "target_id":   user_id,
                "target_email": target.get("email", ""),
                "details":     {},
            }).execute()
        except Exception:
            pass

        return {"deleted": user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al eliminar usuario: {str(e)}")


_CRON_SECRET = os.getenv("CRON_SECRET", "")

_RECORDATORIOS = [
    {"estados": ["registro"],                  "horas": 24, "slug": "gce_recordatorio_ficha",        "check_firma": None},
    {"estados": ["diagnostico"],               "horas": 24, "slug": "gce_recordatorio_diagnostico",   "check_firma": None},
    {"estados": ["plan_acordado"],             "horas": 48, "slug": "gce_recordatorio_plan_ev",       "check_firma": "falta_ev"},
    {"estados": ["plan_acordado"],             "horas": 24, "slug": "gce_recordatorio_plan_cand",     "check_firma": "falta_cand"},
    {"estados": ["cierre"],                    "horas": 48, "slug": "gce_recordatorio_encuesta",      "check_firma": None},
]


@router.post("/cron/gce-recordatorios")
def cron_gce_recordatorios(request: Request):
    secret = request.headers.get("X-Cron-Secret", "")
    if _CRON_SECRET and secret != _CRON_SECRET:
        raise HTTPException(403, "Cron secret inválido.")

    from database import get_supabase
    sb = get_supabase()
    frontend_url = os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app")
    ahora = datetime.now(timezone.utc)
    enviados, omitidos = 0, 0

    procesos = sb.table("procesos_evaluacion") \
        .select("id, estado, datos, updated_at, ce_id, candidato_id, estandar_id") \
        .not_.in_("estado", ["certificado"]) \
        .execute().data or []

    for p in procesos:
        ts = p.get("updated_at", "")
        try:
            dt = datetime.fromisoformat(ts.replace("Z", "+00:00"))
            horas_sin_cambio = (ahora - dt).total_seconds() / 3600
        except Exception:
            continue

        datos = p.get("datos") or {}
        plan  = datos.get("plan_evaluacion", {})

        for rec in _RECORDATORIOS:
            if p["estado"] not in rec["estados"]:
                continue
            umbral = rec["horas"]
            if not (umbral <= horas_sin_cambio < umbral + 6):
                continue

            check = rec.get("check_firma")
            if check == "falta_ev"   and plan.get("firma_evaluador"):
                continue
            if check == "falta_cand" and (not plan.get("firma_evaluador") or plan.get("firma_candidato")):
                continue

            try:
                ce = sb.table("profiles").select("nombre, email").eq("id", p["ce_id"]).maybe_single().execute().data or {}
                ca = sb.table("profiles").select("nombre, apellido").eq("id", p["candidato_id"]).maybe_single().execute().data or {}
                ec = sb.table("estandares_competencia").select("codigo").eq("id", p["estandar_id"]).maybe_single().execute().data or {}
                if not ce.get("email"):
                    omitidos += 1; continue
                cand_n = " ".join(filter(None, [ca.get("nombre"), ca.get("apellido")])) or "el candidato"
                send_template(rec["slug"], ce["email"], {
                    "nombre":           ce.get("nombre", ce["email"]),
                    "candidato_nombre": cand_n,
                    "ec_codigo":        ec.get("codigo", "EC"),
                    "link_portafolio":  f"{frontend_url}/gce?proceso_id={p['id']}",
                })
                enviados += 1
            except Exception as e:
                print(f"⚠ cron recordatorio error {p['id']}: {e}")
                omitidos += 1

    return {"enviados": enviados, "omitidos": omitidos}
