from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from datetime import datetime, timezone
from database import get_supabase
from services.email_service import send_template
import os

router = APIRouter()


def _require_super_admin(caller_id: str, sb) -> None:
    res = sb.table("profiles").select("rol").eq("id", caller_id).single().execute()
    if (res.data or {}).get("rol") != "super_admin":
        raise HTTPException(status_code=403, detail="Solo el super_admin puede realizar esta acción.")


# ─── Crear admin ──────────────────────────────────────────────────────────────

class CreateAdminRequest(BaseModel):
    email: str
    nombre: str
    apellido: str
    credits: int = 10
    vigencia_hasta: str


@router.post("/admin/create-admin", status_code=201)
def create_admin(data: CreateAdminRequest, request: Request):
    caller_id = request.state.user.get("sub")
    sb = get_supabase()
    _require_super_admin(caller_id, sb)

    try:
        vigencia_dt = datetime.fromisoformat(data.vigencia_hasta.replace("Z", "+00:00"))
    except Exception:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Usa YYYY-MM-DD.")

    frontend_url = os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app")

    try:
        result = sb.auth.admin.create_user({
            "email": data.email,
            "email_confirm": True,
            "user_metadata": {"nombre": data.nombre, "apellido": data.apellido},
        })
        user_id = result.user.id

        sb.table("profiles").update({
            "nombre": data.nombre,
            "apellido": data.apellido,
            "rol": "admin",
            "credits": data.credits,
            "activo": True,
            "vigencia_hasta": data.vigencia_hasta,
            "admin_id": None,
        }).eq("id", user_id).execute()

        link_acceso = f"{frontend_url}/reset-password.html"
        try:
            link_res = sb.auth.admin.generate_link({
                "type": "recovery",
                "email": data.email,
                "options": {"redirect_to": f"{frontend_url}/reset-password.html"},
            })
            if hasattr(link_res, "properties") and link_res.properties:
                link_acceso = getattr(link_res.properties, "action_link", link_acceso) or link_acceso
        except Exception as le:
            print(f"⚠️ generate_link error: {le}")

        vigencia_str = vigencia_dt.strftime("%d/%m/%Y")
        send_template("bienvenida_admin", data.email, {
            "nombre": data.nombre,
            "email": data.email,
            "creditos": str(data.credits),
            "vigencia_hasta": vigencia_str,
            "link_acceso": link_acceso,
        })

        return {"id": user_id, "email": data.email}

    except Exception as e:
        err = str(e)
        if "already been registered" in err or "already exists" in err:
            raise HTTPException(status_code=409, detail="El correo ya está registrado.")
        raise HTTPException(status_code=500, detail=f"Error al crear admin: {err}")


# ─── Renovar admin (vigencia / créditos) ──────────────────────────────────────

class RenewAdminRequest(BaseModel):
    admin_id: str
    credits: Optional[int] = None
    vigencia_hasta: Optional[str] = None


@router.patch("/admin/renew-admin", status_code=200)
def renew_admin(data: RenewAdminRequest, request: Request):
    caller_id = request.state.user.get("sub")
    sb = get_supabase()
    _require_super_admin(caller_id, sb)

    updates: dict = {}
    if data.credits is not None:
        if data.credits < 0:
            raise HTTPException(status_code=400, detail="Los créditos no pueden ser negativos.")
        updates["credits"] = data.credits
    if data.vigencia_hasta is not None:
        try:
            datetime.fromisoformat(data.vigencia_hasta.replace("Z", "+00:00"))
        except Exception:
            raise HTTPException(status_code=400, detail="Formato de fecha inválido.")
        updates["vigencia_hasta"] = data.vigencia_hasta
        updates["activo"] = True

    if not updates:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar.")

    res = sb.table("profiles").update(updates).eq("id", data.admin_id).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Admin no encontrado.")

    # Notificar al admin que su cuenta fue renovada
    try:
        admin_res = sb.table("profiles").select("nombre, email, credits").eq("id", data.admin_id).single().execute()
        admin = admin_res.data or {}
        if admin.get("email"):
            vigencia_str = ""
            if data.vigencia_hasta:
                try:
                    from datetime import datetime as _dt
                    _v = _dt.fromisoformat(data.vigencia_hasta.replace("Z", "+00:00"))
                    vigencia_str = _v.strftime("%d/%m/%Y")
                except Exception:
                    vigencia_str = data.vigencia_hasta
            send_template("renovacion_admin", admin["email"], {
                "nombre": admin.get("nombre") or admin["email"],
                "email": admin["email"],
                "creditos": str(admin.get("credits", data.credits or 0)),
                "vigencia_hasta": vigencia_str,
            })
    except Exception:
        pass

    return {"updated": data.admin_id, **updates}


# ─── Cron automático de vigencias (protegido por CRON_SECRET, sin JWT) ───────

@router.post("/admin/cron/vigencias", status_code=200)
def cron_vigencias(request: Request):
    cron_secret = request.headers.get("x-cron-secret", "")
    if not cron_secret or cron_secret != os.getenv("CRON_SECRET", ""):
        raise HTTPException(status_code=403, detail="Cron secret inválido.")
    return _procesar_vigencias(get_supabase())


# ─── Enviar alertas de vigencia manualmente (trigger desde superadmin) ─────────

def _procesar_vigencias(sb) -> dict:
    now = datetime.now(timezone.utc)
    res = sb.table("profiles").select(
        "id, nombre, email, vigencia_hasta, activo"
    ).eq("rol", "admin").execute()

    admins = res.data or []
    enviados = []

    for admin in admins:
        if not admin.get("vigencia_hasta") or not admin.get("email"):
            continue
        try:
            vigencia = datetime.fromisoformat(admin["vigencia_hasta"].replace("Z", "+00:00"))
        except Exception:
            continue

        delta = vigencia - now
        dias = delta.days

        if dias < 0 and admin.get("activo"):
            sb.table("profiles").update({"activo": False}).eq("id", admin["id"]).execute()
            send_template("vigencia_admin_expirada", admin["email"], {
                "nombre": admin["nombre"] or admin["email"],
                "email": admin["email"],
                "vigencia_hasta": vigencia.strftime("%d/%m/%Y"),
            })
            enviados.append({"email": admin["email"], "tipo": "expirada"})
        elif 0 <= dias <= 7:
            send_template("vigencia_admin_por_vencer", admin["email"], {
                "nombre": admin["nombre"] or admin["email"],
                "email": admin["email"],
                "vigencia_hasta": vigencia.strftime("%d/%m/%Y"),
                "dias_restantes": str(dias),
            })
            enviados.append({"email": admin["email"], "tipo": "por_vencer", "dias": dias})

    return {"procesados": len(admins), "enviados": enviados}


@router.post("/admin/check-vigencias", status_code=200)
def check_vigencias(request: Request):
    caller_id = request.state.user.get("sub")
    sb = get_supabase()
    _require_super_admin(caller_id, sb)
    return _procesar_vigencias(sb)


# ─── Gestión de editores ───────────────────────────────────────────────────────

@router.get("/admin/editores", status_code=200)
def list_editores(request: Request):
    caller_id = request.state.user.get("sub")
    sb = get_supabase()
    _require_super_admin(caller_id, sb)
    res = (
        sb.table("profiles")
        .select("id, nombre, apellido, email, created_at, activo")
        .eq("rol", "editor")
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


class AssignEditorRequest(BaseModel):
    email: str


@router.post("/admin/assign-editor", status_code=200)
def assign_editor(data: AssignEditorRequest, request: Request):
    """Asigna rol 'editor' a un usuario ya registrado, buscado por email."""
    caller_id = request.state.user.get("sub")
    sb = get_supabase()
    _require_super_admin(caller_id, sb)

    res = sb.table("profiles").select("id, nombre, rol").eq("email", data.email).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Usuario no encontrado con ese correo.")

    perfil = res.data
    if perfil["rol"] == "super_admin":
        raise HTTPException(status_code=400, detail="No se puede cambiar el rol de un super_admin.")

    sb.table("profiles").update({"rol": "editor"}).eq("id", perfil["id"]).execute()
    return {"ok": True, "id": perfil["id"], "nombre": perfil.get("nombre", "")}


@router.delete("/admin/editores/{editor_id}", status_code=200)
def remove_editor(editor_id: str, request: Request):
    """Revoca el rol editor y lo regresa a 'user'."""
    caller_id = request.state.user.get("sub")
    sb = get_supabase()
    _require_super_admin(caller_id, sb)

    res = sb.table("profiles").select("rol").eq("id", editor_id).single().execute()
    if not res.data or res.data.get("rol") != "editor":
        raise HTTPException(status_code=404, detail="Editor no encontrado.")

    sb.table("profiles").update({"rol": "user"}).eq("id", editor_id).execute()
    return {"ok": True}
