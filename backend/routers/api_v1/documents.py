from fastapi import APIRouter, Depends, Query
from typing import Optional
from database import get_supabase
from .auth import require_api_key, _ok, _err

router = APIRouter(prefix="/api/v1", tags=["ecmatic-documents"])

_DOC_FIELDS = (
    "id, planeacion_id, user_id, es_slot, created_at, "
    "snapshot_instructor, snapshot_nombre_curso, snapshot_content_len"
)


@router.get("/documents", dependencies=[Depends(require_api_key)])
def list_documents(
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    user_id: Optional[str] = None,
    course_id: Optional[str] = None,
    desde: Optional[str] = None,
    hasta: Optional[str] = None,
):
    sb = get_supabase()
    offset = (page - 1) * per_page

    query = sb.table("descargas").select(_DOC_FIELDS, count="exact")

    if user_id:
        query = query.eq("user_id", user_id)
    if course_id:
        query = query.eq("planeacion_id", course_id)
    if desde:
        query = query.gte("created_at", desde)
    if hasta:
        query = query.lte("created_at", hasta)

    res = query.order("created_at", desc=True).range(offset, offset + per_page - 1).execute()

    return _ok(
        res.data or [],
        {"total": res.count or 0, "page": page, "per_page": per_page},
    )


@router.get("/documents/{doc_id}", dependencies=[Depends(require_api_key)])
def get_document(doc_id: str):
    sb = get_supabase()
    res = sb.table("descargas").select(_DOC_FIELDS).eq("id", doc_id).single().execute()
    if not res.data:
        _err("Documento no encontrado.", 404)
    return _ok(res.data)


@router.get("/users/{user_id}/documents", dependencies=[Depends(require_api_key)])
def list_documents_by_user(
    user_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
):
    sb = get_supabase()
    offset = (page - 1) * per_page

    res = sb.table("descargas").select(_DOC_FIELDS, count="exact") \
        .eq("user_id", user_id) \
        .eq("es_slot", True) \
        .order("created_at", desc=True) \
        .range(offset, offset + per_page - 1) \
        .execute()

    slots_used = res.count or 0

    return _ok(
        res.data or [],
        {
            "total": slots_used,
            "slots_max": 5,
            "slots_disponibles": max(0, 5 - slots_used),
            "page": page,
            "per_page": per_page,
        },
    )
