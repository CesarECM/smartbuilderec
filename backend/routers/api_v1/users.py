from fastapi import APIRouter, Depends, Query
from fastapi.background import BackgroundTasks
from pydantic import BaseModel
from typing import Optional
from database import get_supabase
from .auth import require_api_key, _ok, _err
from .webhooks import dispatch_event
import os

router = APIRouter(prefix="/api/v1/users", tags=["ecmatic-users"])


class UserCreate(BaseModel):
    email: str
    nombre: str
    apellido: str
    rol: str = "user"
    admin_id: Optional[str] = None
    credits: int = 0


class UserUpdate(BaseModel):
    nombre: Optional[str] = None
    apellido: Optional[str] = None
    telefono: Optional[str] = None
    curp: Optional[str] = None
    rol: Optional[str] = None
    activo: Optional[bool] = None
    credits: Optional[int] = None
    vigencia_hasta: Optional[str] = None
    admin_id: Optional[str] = None


_PROFILE_FIELDS = (
    "id, nombre, apellido, email, rol, activo, credits, "
    "admin_id, vigencia_hasta, stripe_customer_id, telefono, curp, created_at"
)


@router.get("", dependencies=[Depends(require_api_key)])
def list_users(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    rol: Optional[str] = None,
    activo: Optional[bool] = None,
    admin_id: Optional[str] = None,
    q: Optional[str] = None,
):
    sb = get_supabase()
    offset = (page - 1) * per_page

    query = sb.table("profiles").select(_PROFILE_FIELDS, count="exact")

    if rol:
        query = query.eq("rol", rol)
    if activo is not None:
        query = query.eq("activo", activo)
    if admin_id:
        query = query.eq("admin_id", admin_id)
    if q:
        query = query.or_(f"nombre.ilike.%{q}%,apellido.ilike.%{q}%,email.ilike.%{q}%")

    res = query.order("created_at", desc=True).range(offset, offset + per_page - 1).execute()

    return _ok(
        res.data or [],
        {"total": res.count or 0, "page": page, "per_page": per_page},
    )


@router.get("/{user_id}", dependencies=[Depends(require_api_key)])
def get_user(user_id: str):
    sb = get_supabase()
    res = sb.table("profiles").select(_PROFILE_FIELDS).eq("id", user_id).single().execute()
    if not res.data:
        _err("Usuario no encontrado.", 404)
    return _ok(res.data)


@router.post("", status_code=201, dependencies=[Depends(require_api_key)])
def create_user(data: UserCreate, background_tasks: BackgroundTasks):
    sb = get_supabase()
    frontend_url = os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app")

    try:
        result = sb.auth.admin.create_user({
            "email": data.email,
            "email_confirm": True,
            "user_metadata": {"nombre": data.nombre, "apellido": data.apellido},
        })
        user_id = result.user.id
    except Exception as e:
        err_str = str(e)
        if "already" in err_str.lower():
            _err("El correo ya está registrado.", 409)
        _err(f"Error al crear usuario en Supabase Auth: {err_str}", 500)

    update_payload = {
        "nombre": data.nombre,
        "apellido": data.apellido,
        "rol": data.rol,
        "activo": True,
        "credits": data.credits,
    }
    if data.admin_id:
        update_payload["admin_id"] = data.admin_id

    sb.table("profiles").update(update_payload).eq("id", user_id).execute()

    try:
        sb.auth.admin.generate_link({
            "type": "recovery",
            "email": data.email,
            "options": {"redirect_to": f"{frontend_url}/reset-password.html"},
        })
    except Exception:
        pass

    profile_res = sb.table("profiles").select(_PROFILE_FIELDS).eq("id", user_id).single().execute()
    profile = profile_res.data or {"id": user_id, "email": data.email}

    background_tasks.add_task(dispatch_event, "user.created", profile)
    return _ok(profile)


@router.patch("/{user_id}", dependencies=[Depends(require_api_key)])
def update_user(user_id: str, data: UserUpdate, background_tasks: BackgroundTasks):
    sb = get_supabase()

    existing = sb.table("profiles").select("id").eq("id", user_id).single().execute()
    if not existing.data:
        _err("Usuario no encontrado.", 404)

    payload = {k: v for k, v in data.model_dump().items() if v is not None}
    if not payload:
        _err("No se enviaron campos a actualizar.", 400)

    sb.table("profiles").update(payload).eq("id", user_id).execute()

    updated = sb.table("profiles").select(_PROFILE_FIELDS).eq("id", user_id).single().execute()

    if "activo" in payload or "rol" in payload or "credits" in payload:
        background_tasks.add_task(dispatch_event, "user.plan_changed", updated.data or {})

    return _ok(updated.data or {})


@router.delete("/{user_id}", dependencies=[Depends(require_api_key)])
def deactivate_user(user_id: str):
    sb = get_supabase()

    existing = sb.table("profiles").select("id").eq("id", user_id).single().execute()
    if not existing.data:
        _err("Usuario no encontrado.", 404)

    sb.table("profiles").update({"activo": False}).eq("id", user_id).execute()
    return _ok({"deactivated": user_id})


@router.get("/{user_id}/summary", dependencies=[Depends(require_api_key)])
def get_user_summary(user_id: str):
    sb = get_supabase()

    profile_res = sb.table("profiles").select(_PROFILE_FIELDS).eq("id", user_id).single().execute()
    if not profile_res.data:
        _err("Usuario no encontrado.", 404)

    courses_res = sb.table("planeaciones").select(
        "id, created_at", count="exact"
    ).eq("user_id", user_id).execute()

    downloads_res = sb.table("descargas").select(
        "id", count="exact"
    ).eq("user_id", user_id).eq("es_slot", True).execute()

    pagos_res = sb.table("pagos").select(
        "concepto, monto, moneda, pagado_at"
    ).eq("alumno_id", user_id).execute()

    asig_res = sb.table("asignaciones").select(
        "norma_id, normas(codigo, nombre)"
    ).eq("alumno_id", user_id).execute()

    last_course = None
    if courses_res.data:
        last = sorted(courses_res.data, key=lambda x: x["created_at"], reverse=True)[0]
        last_course = last["created_at"]

    return _ok({
        "profile": profile_res.data,
        "courses_total": courses_res.count or 0,
        "downloads_used": downloads_res.count or 0,
        "downloads_max": 5,
        "last_course_at": last_course,
        "pagos": pagos_res.data or [],
        "normas_asignadas": asig_res.data or [],
    })
