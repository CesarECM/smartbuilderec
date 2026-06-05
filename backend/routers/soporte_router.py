import os
import asyncio
from typing import Optional
from fastapi import APIRouter, Request, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from anthropic import AsyncAnthropic

from database import get_supabase
from services.rag_service import retrieve_knowledge, build_system_prompt
from services.embeddings_service import generate_embedding, chunk_text

router = APIRouter()

_anthropic = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

# ── Modelos ────────────────────────────────────────────────────────────────────

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

class RecursoCreate(BaseModel):
    titulo: str
    tipo: str = "articulo"
    contenido: str = ""
    url: str = ""
    contexto: str = "general"

# ── Helpers de autorización ───────────────────────────────────────────────────

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

# ── Sesiones ───────────────────────────────────────────────────────────────────

@router.post("/soporte/sesiones/init")
def init_sesion(payload: SesionInitRequest):
    sb = get_supabase()
    res = sb.table("soporte_sesiones").insert({
        "pagina_origen": payload.pagina_origen,
        "contexto": payload.contexto,
        "user_id": payload.user_id,
        "transcript": [],
        "total_turnos": 0,
        "resolucion": "en_curso",
    }).execute()
    return {"sesion_id": res.data[0]["id"]}

# ── Chat (RAG + Streaming) ─────────────────────────────────────────────────────

@router.post("/soporte/chat")
async def soporte_chat(payload: ChatRequest):
    sb = get_supabase()
    sesion_id = payload.sesion_id

    docs = retrieve_knowledge(payload.mensaje, sb, payload.contexto)
    system_prompt = build_system_prompt(payload.contexto, docs, payload.user_info)
    messages = payload.historial + [{"role": "user", "content": payload.mensaje}]

    collected: list[str] = []

    async def stream_response():
        try:
            async with _anthropic.messages.stream(
                model="claude-sonnet-4-6",
                max_tokens=1024,
                system=system_prompt,
                messages=messages,
            ) as stream:
                async for text in stream.text_stream:
                    collected.append(text)
                    yield text.encode("utf-8")
        except Exception as e:
            yield f"\n[Error al generar respuesta: {str(e)}]".encode("utf-8")
            return

        # Persistir transcripción tras enviar todos los chunks
        full_text = "".join(collected)
        asyncio.create_task(_persist_transcript(sb, sesion_id, payload.mensaje, full_text))

    return StreamingResponse(
        stream_response(),
        media_type="text/plain; charset=utf-8",
        headers={"x-sesion-id": str(sesion_id)},
    )


async def _persist_transcript(sb, sesion_id: str, user_msg: str, assistant_msg: str):
    loop = asyncio.get_event_loop()
    await loop.run_in_executor(
        None, _persist_transcript_sync, sb, sesion_id, user_msg, assistant_msg
    )


def _persist_transcript_sync(sb, sesion_id: str, user_msg: str, assistant_msg: str):
    try:
        res = sb.table("soporte_sesiones").select("transcript, total_turnos").eq("id", sesion_id).single().execute()
        if not res.data:
            return
        transcript = res.data.get("transcript") or []
        transcript.append({"role": "user",      "content": user_msg})
        transcript.append({"role": "assistant",  "content": assistant_msg})
        sb.table("soporte_sesiones").update({
            "transcript":   transcript,
            "total_turnos": res.data.get("total_turnos", 0) + 1,
        }).eq("id", sesion_id).execute()
    except Exception as e:
        print(f"[soporte] Error persistiendo transcripción: {e}")

# ── Tickets ────────────────────────────────────────────────────────────────────

@router.post("/soporte/tickets")
def crear_ticket(payload: TicketRequest):
    sb = get_supabase()
    sb.table("soporte_sesiones").update({"resolucion": "escalada"}).eq("id", payload.sesion_id).execute()

    res = sb.table("soporte_tickets").insert({
        "sesion_id":    payload.sesion_id,
        "asunto":       payload.asunto,
        "categoria":    payload.categoria,
        "user_email":   payload.user_email,
        "user_nombre":  payload.user_nombre,
        "estado":       "nuevo",
        "prioridad":    "normal",
    }).execute()

    ticket = res.data[0]
    sb.table("soporte_sesiones").update({"ticket_id": ticket["id"]}).eq("id", payload.sesion_id).execute()
    return {"ticket_id": ticket["id"], "numero": ticket["numero"]}


@router.get("/soporte/tickets")
def listar_tickets(request: Request):
    _require_admin(request)
    sb = get_supabase()
    res = sb.table("soporte_tickets").select("*").order("created_at", desc=True).limit(100).execute()
    return res.data or []

# ── FAQs ───────────────────────────────────────────────────────────────────────

@router.get("/soporte/faqs")
def listar_faqs():
    sb = get_supabase()
    res = (
        sb.table("knowledge_faqs")
        .select("id, pregunta, respuesta, categoria, contexto, votos_util, created_at")
        .eq("activo", True)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


@router.post("/soporte/faqs")
def crear_faq(payload: FAQCreate, request: Request):
    _require_superadmin(request)
    sb = get_supabase()
    texto = f"{payload.pregunta} {payload.respuesta}"
    embedding = generate_embedding(texto)
    res = sb.table("knowledge_faqs").insert({
        "pregunta":   payload.pregunta,
        "respuesta":  payload.respuesta,
        "categoria":  payload.categoria,
        "contexto":   payload.contexto,
        "embedding":  embedding,
        "activo":     True,
    }).execute()
    return res.data[0]


@router.delete("/soporte/faqs/{faq_id}")
def eliminar_faq(faq_id: str, request: Request):
    _require_superadmin(request)
    sb = get_supabase()
    sb.table("knowledge_faqs").update({"activo": False}).eq("id", faq_id).execute()
    return {"deleted": faq_id}

# ── Recursos ───────────────────────────────────────────────────────────────────

@router.get("/soporte/recursos")
def listar_recursos(request: Request):
    _require_superadmin(request)
    sb = get_supabase()
    res = (
        sb.table("knowledge_recursos")
        .select("id, titulo, tipo, url, contexto, activo, created_at")
        .eq("activo", True)
        .order("created_at", desc=True)
        .execute()
    )
    return res.data or []


@router.post("/soporte/recursos")
def crear_recurso(payload: RecursoCreate, request: Request):
    _require_superadmin(request)
    sb = get_supabase()

    title_embedding = generate_embedding(payload.titulo)
    res = sb.table("knowledge_recursos").insert({
        "titulo":    payload.titulo,
        "tipo":      payload.tipo,
        "contenido": payload.contenido,
        "url":       payload.url,
        "contexto":  payload.contexto,
        "embedding": title_embedding,
        "activo":    True,
    }).execute()

    recurso = res.data[0]
    recurso_id = recurso["id"]

    if payload.contenido:
        chunks = chunk_text(payload.contenido)
        for i, chunk in enumerate(chunks):
            chunk_embedding = generate_embedding(chunk)
            sb.table("knowledge_chunks").insert({
                "recurso_id":  recurso_id,
                "chunk_index": i,
                "contenido":   chunk,
                "embedding":   chunk_embedding,
            }).execute()

    return {**recurso, "chunks_generados": len(chunks) if payload.contenido else 0}


@router.delete("/soporte/recursos/{recurso_id}")
def eliminar_recurso(recurso_id: str, request: Request):
    _require_superadmin(request)
    sb = get_supabase()
    sb.table("knowledge_recursos").update({"activo": False}).eq("id", recurso_id).execute()
    return {"deleted": recurso_id}

# ── Cron (Fase 3) ──────────────────────────────────────────────────────────────

@router.post("/soporte/cron/analizar-patrones")
def cron_analizar_patrones(request: Request):
    cron_secret = os.getenv("CRON_SECRET", "")
    provided = request.headers.get("x-cron-secret", "")
    if not cron_secret or provided != cron_secret:
        raise HTTPException(status_code=401, detail="Unauthorized.")
    # Fase 3: lógica de detección de patrones irá aquí
    return {"status": "not_implemented_yet", "fase": 3}
