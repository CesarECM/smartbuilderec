from typing import Optional
from fastapi import HTTPException, Request
from pydantic import BaseModel

from database import get_supabase


class SesionInitRequest(BaseModel):
    pagina_origen: str = ""
    contexto: str = "general"
    user_id: Optional[str] = None


class ChatRequest(BaseModel):
    sesion_id: str
    mensaje: str
    historial: list = []
    contexto: str = "general"
    user_info: dict = {}


class TicketRequest(BaseModel):
    sesion_id: str
    asunto: str
    categoria: str = "general"
    user_email: str = ""
    user_nombre: str = ""


class FAQCreate(BaseModel):
    pregunta: str
    respuesta: str
    categoria: str = "general"
    contexto: str = "general"


class FAQUpdate(BaseModel):
    pregunta: str
    respuesta: str
    categoria: str = "general"
    contexto: str = "general"


class RecursoCreate(BaseModel):
    titulo: str
    tipo: str = "articulo"
    contenido: str = ""
    url: str = ""
    contexto: str = "general"


class TicketUpdate(BaseModel):
    estado: str
    resolucion: str = ""
    notas_internas: str = ""


class SugerenciaAction(BaseModel):
    accion: str  # 'aprobar' | 'rechazar'
    propuesta: Optional[dict] = None


class VotoFAQs(BaseModel):
    ids: list[str]


def _get_user(request: Request) -> Optional[dict]:
    return getattr(request.state, "user", None)


def _require_superadmin(request: Request) -> str:
    user = _get_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Autenticación requerida.")
    sb = get_supabase()
    user_id = user.get("sub")
    res = sb.table("profiles").select("rol").eq("id", user_id).single().execute()
    if not res.data or res.data.get("rol") != "super_admin":
        raise HTTPException(status_code=403, detail="Solo superadmin puede realizar esta acción.")
    return user_id


def _require_admin(request: Request) -> str:
    user = _get_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Autenticación requerida.")
    sb = get_supabase()
    user_id = user.get("sub")
    res = sb.table("profiles").select("rol").eq("id", user_id).single().execute()
    if not res.data or res.data.get("rol") not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Sin permisos.")
    return user_id
