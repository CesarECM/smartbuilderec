from fastapi import APIRouter, Depends, Query
from fastapi.background import BackgroundTasks
from pydantic import BaseModel
from typing import Optional, Any
from database import get_supabase
from .auth import require_api_key, _ok, _err
from .webhooks import dispatch_event

router = APIRouter(prefix="/api/v1/courses", tags=["ecmatic-courses"])

_COURSE_FIELDS = "id, user_id, created_at, updated_at"
_COURSE_FULL = "id, user_id, created_at, updated_at, datos"


class CourseCreate(BaseModel):
    user_id: str
    datos: Optional[Any] = None


class CourseUpdate(BaseModel):
    datos: Optional[Any] = None


@router.get("", dependencies=[Depends(require_api_key)])
def list_courses(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user_id: Optional[str] = None,
    desde: Optional[str] = None,
    hasta: Optional[str] = None,
):
    sb = get_supabase()
    offset = (page - 1) * per_page

    query = sb.table("planeaciones").select(_COURSE_FIELDS, count="exact")

    if user_id:
        query = query.eq("user_id", user_id)
    if desde:
        query = query.gte("created_at", desde)
    if hasta:
        query = query.lte("created_at", hasta)

    res = query.order("created_at", desc=True).range(offset, offset + per_page - 1).execute()

    return _ok(
        res.data or [],
        {"total": res.count or 0, "page": page, "per_page": per_page},
    )


@router.get("/{course_id}", dependencies=[Depends(require_api_key)])
def get_course(course_id: str):
    sb = get_supabase()
    res = sb.table("planeaciones").select(_COURSE_FULL).eq("id", course_id).single().execute()
    if not res.data:
        _err("Planeación no encontrada.", 404)
    return _ok(res.data)


@router.post("", status_code=201, dependencies=[Depends(require_api_key)])
def create_course(data: CourseCreate, background_tasks: BackgroundTasks):
    sb = get_supabase()

    user_check = sb.table("profiles").select("id").eq("id", data.user_id).single().execute()
    if not user_check.data:
        _err("El user_id no existe en profiles.", 422)

    payload = {"user_id": data.user_id}
    if data.datos is not None:
        payload["datos"] = data.datos

    res = sb.table("planeaciones").insert(payload).execute()
    if not res.data:
        _err("Error al crear la planeación.", 500)

    course = res.data[0]
    background_tasks.add_task(dispatch_event, "course.created", course)
    return _ok(course)


@router.patch("/{course_id}", dependencies=[Depends(require_api_key)])
def update_course(course_id: str, data: CourseUpdate):
    sb = get_supabase()

    existing = sb.table("planeaciones").select("id").eq("id", course_id).single().execute()
    if not existing.data:
        _err("Planeación no encontrada.", 404)

    payload = {}
    if data.datos is not None:
        payload["datos"] = data.datos

    if not payload:
        _err("No se enviaron campos a actualizar.", 400)

    sb.table("planeaciones").update(payload).eq("id", course_id).execute()
    updated = sb.table("planeaciones").select(_COURSE_FULL).eq("id", course_id).single().execute()
    return _ok(updated.data or {})


@router.delete("/{course_id}", dependencies=[Depends(require_api_key)])
def delete_course(course_id: str):
    sb = get_supabase()

    existing = sb.table("planeaciones").select("id").eq("id", course_id).single().execute()
    if not existing.data:
        _err("Planeación no encontrada.", 404)

    sb.table("planeaciones").delete().eq("id", course_id).execute()
    return _ok({"deleted": course_id})


@router.get("/by-user/{user_id}", dependencies=[Depends(require_api_key)])
def list_courses_by_user(
    user_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    sb = get_supabase()
    offset = (page - 1) * per_page

    res = sb.table("planeaciones").select(_COURSE_FULL, count="exact") \
        .eq("user_id", user_id) \
        .order("created_at", desc=True) \
        .range(offset, offset + per_page - 1) \
        .execute()

    return _ok(
        res.data or [],
        {"total": res.count or 0, "page": page, "per_page": per_page, "user_id": user_id},
    )
