import asyncio
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from anthropic import AsyncAnthropic

from database import get_supabase
from models.soporte_models import SesionInitRequest, ChatRequest
from services.rag_service import retrieve_knowledge, build_system_prompt

router = APIRouter()

_anthropic = AsyncAnthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

MAX_TURNOS_SESION = 30


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


@router.post("/soporte/chat")
async def soporte_chat(payload: ChatRequest):
    sb = get_supabase()
    sesion_id = payload.sesion_id

    sesion_res = sb.table("soporte_sesiones") \
        .select("id, total_turnos") \
        .eq("id", sesion_id) \
        .single() \
        .execute()
    if not sesion_res.data:
        raise HTTPException(status_code=404, detail="Sesión no encontrada.")
    if (sesion_res.data.get("total_turnos") or 0) >= MAX_TURNOS_SESION:
        raise HTTPException(status_code=429, detail="Límite de conversación alcanzado. Abre una nueva sesión.")

    docs = retrieve_knowledge(payload.mensaje, sb, payload.contexto)
    system_prompt = build_system_prompt(payload.contexto, docs, payload.user_info)
    messages = payload.historial + [{"role": "user", "content": payload.mensaje}]
    faq_ids_list = [d["id"] for d in docs if d.get("tipo") == "faq"]
    faq_ids = ",".join(faq_ids_list)
    if faq_ids_list:
        asyncio.create_task(_track_exposiciones(sb, faq_ids_list))

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

        full_text = "".join(collected)
        asyncio.create_task(_persist_transcript(sb, sesion_id, payload.mensaje, full_text))

    return StreamingResponse(
        stream_response(),
        media_type="text/plain; charset=utf-8",
        headers={"x-sesion-id": str(sesion_id), "x-faq-ids": faq_ids},
    )


async def _track_exposiciones(sb, faq_ids: list[str]):
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, _track_exposiciones_sync, sb, faq_ids)


def _track_exposiciones_sync(sb, faq_ids: list[str]):
    for faq_id in faq_ids[:5]:
        try:
            res = sb.table("knowledge_faqs").select("exposiciones").eq("id", faq_id).single().execute()
            if res.data:
                sb.table("knowledge_faqs").update(
                    {"exposiciones": (res.data.get("exposiciones") or 0) + 1}
                ).eq("id", faq_id).execute()
        except Exception:
            pass


async def _persist_transcript(sb, sesion_id: str, user_msg: str, assistant_msg: str):
    loop = asyncio.get_running_loop()
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
        transcript = transcript[-40:]
        sb.table("soporte_sesiones").update({
            "transcript":   transcript,
            "total_turnos": res.data.get("total_turnos", 0) + 1,
        }).eq("id", sesion_id).execute()
    except Exception as e:
        print(f"[soporte] Error persistiendo transcripción: {e}")
