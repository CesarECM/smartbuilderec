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

MAX_TURNOS_SESION = 30

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

        # Persistir transcripción tras enviar todos los chunks
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
        transcript = transcript[-40:]  # máx 20 exchanges en DB
        sb.table("soporte_sesiones").update({
            "transcript":   transcript,
            "total_turnos": res.data.get("total_turnos", 0) + 1,
        }).eq("id", sesion_id).execute()
    except Exception as e:
        print(f"[soporte] Error persistiendo transcripción: {e}")

# ── Tickets ────────────────────────────────────────────────────────────────────

@router.post("/soporte/tickets")
async def crear_ticket(payload: TicketRequest):
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
    asyncio.create_task(_notificar_admin_ticket_async(sb, ticket))
    if payload.user_email:
        asyncio.create_task(_confirmar_ticket_usuario_async(ticket))
    return {"ticket_id": ticket["id"], "numero": ticket["numero"]}


@router.get("/soporte/tickets")
def listar_tickets(request: Request, estado: Optional[str] = None):
    user = _get_user(request)
    if not user:
        raise HTTPException(status_code=401, detail="Autenticación requerida.")
    sb = get_supabase()
    uid = user.get("sub")
    prof = sb.table("profiles").select("rol").eq("id", uid).single().execute()
    rol = prof.data.get("rol") if prof.data else None
    if rol not in ("admin", "super_admin"):
        raise HTTPException(status_code=403, detail="Sin permisos.")
    query = sb.table("soporte_tickets").select("id,numero,asunto,categoria,estado,prioridad,user_email,user_nombre,created_at,updated_at")
    if rol == "admin":
        usuarios = sb.table("profiles").select("id").eq("admin_id", uid).execute()
        uids = [u["id"] for u in (usuarios.data or [])]
        if not uids:
            return []
        query = query.in_("user_id", uids)
    if estado:
        query = query.eq("estado", estado)
    return query.order("created_at", desc=True).limit(100).execute().data or []


@router.get("/soporte/tickets/{ticket_id}")
def get_ticket(ticket_id: str, request: Request):
    _require_admin(request)
    sb = get_supabase()
    t = sb.table("soporte_tickets").select("*").eq("id", ticket_id).single().execute()
    if not t.data:
        raise HTTPException(status_code=404, detail="Ticket no encontrado.")
    ticket = dict(t.data)
    if ticket.get("sesion_id"):
        try:
            s = sb.table("soporte_sesiones").select("transcript,contexto,pagina_origen").eq("id", ticket["sesion_id"]).single().execute()
            if s.data:
                ticket["transcript"]    = s.data.get("transcript", [])
                ticket["pagina_origen"] = s.data.get("pagina_origen", "")
        except Exception:
            ticket["transcript"] = []
    return ticket


@router.patch("/soporte/tickets/{ticket_id}")
async def actualizar_ticket(ticket_id: str, payload: TicketUpdate, request: Request):
    _require_admin(request)
    sb = get_supabase()
    t = sb.table("soporte_tickets").select("*").eq("id", ticket_id).single().execute()
    if not t.data:
        raise HTTPException(status_code=404, detail="Ticket no encontrado.")
    ticket = t.data

    upd: dict = {"estado": payload.estado}
    if payload.resolucion:    upd["resolucion"]    = payload.resolucion
    if payload.notas_internas: upd["notas_internas"] = payload.notas_internas

    if payload.estado == "resuelto":
        from datetime import datetime, timezone
        created = datetime.fromisoformat(ticket["created_at"].replace("Z", "+00:00"))
        upd["tiempo_resolucion_mins"] = int((datetime.now(timezone.utc) - created).total_seconds() / 60)

    sb.table("soporte_tickets").update(upd).eq("id", ticket_id).execute()

    if payload.estado == "resuelto" and payload.resolucion:
        if ticket.get("user_email"):
            asyncio.create_task(_email_resolucion_async(ticket, payload.resolucion))
        asyncio.create_task(_analizar_resolucion_async(sb, ticket_id, ticket, payload.resolucion))

    return {"updated": ticket_id, "estado": payload.estado}


# ── Emails background ─────────────────────────────────────────────────────────

async def _confirmar_ticket_usuario_async(ticket: dict):
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, _confirmar_ticket_usuario_sync, ticket)

def _confirmar_ticket_usuario_sync(ticket: dict):
    try:
        from services.email_service import send_template
        email = ticket.get("user_email", "")
        if not email:
            return
        send_template("ticket_soporte_creado", email, {
            "nombre": ticket.get("user_nombre") or email,
            "email": email,
            "asunto_ticket": ticket.get("asunto", ""),
            "numero_ticket": str(ticket.get("numero", "")),
        })
    except Exception as e:
        print(f"[soporte] Error confirmando ticket al usuario: {e}")

async def _notificar_admin_ticket_async(sb, ticket: dict):
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, _notificar_admin_ticket_sync, sb, ticket)

def _notificar_admin_ticket_sync(sb, ticket: dict):
    try:
        from services.email_service import send_email
        admin_email = None
        if ticket.get("user_id"):
            p = sb.table("profiles").select("admin_id").eq("id", ticket["user_id"]).single().execute()
            if p.data and p.data.get("admin_id"):
                a = sb.table("profiles").select("email").eq("id", p.data["admin_id"]).single().execute()
                admin_email = a.data.get("email") if a.data else None
        if not admin_email:
            return
        frontend_url = os.getenv("FRONTEND_URL", "https://www.smartbuilderec.com")
        n = ticket.get("numero", "?")
        asunto = ticket.get("asunto", "Sin asunto")
        nombre = ticket.get("user_nombre") or ticket.get("user_email") or "Anónimo"
        html = f"""<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px">
<h2 style="color:#1F3B6D">Nuevo ticket de soporte #{n}</h2>
<p><strong>Asunto:</strong> {asunto}</p>
<p><strong>De:</strong> {nombre}</p>
<p style="margin-top:20px"><a href="{frontend_url}/admin.html" style="background:#1F3B6D;color:white;padding:10px 20px;border-radius:8px;text-decoration:none;font-weight:600">Ver en panel admin</a></p>
</div>"""
        send_email(admin_email, f"Ticket #{n}: {asunto}", html)
    except Exception as e:
        print(f"[soporte] Error notificando admin: {e}")


async def _email_resolucion_async(ticket: dict, resolucion: str):
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, _email_resolucion_sync, ticket, resolucion)

def _email_resolucion_sync(ticket: dict, resolucion: str):
    try:
        from services.email_service import send_template
        email = ticket.get("user_email", "")
        if not email:
            return
        send_template("ticket_soporte_resuelto", email, {
            "nombre": ticket.get("user_nombre") or email,
            "email": email,
            "asunto_ticket": ticket.get("asunto", ""),
            "numero_ticket": str(ticket.get("numero", "")),
            "resolucion": resolucion,
        })
    except Exception as e:
        print(f"[soporte] Error enviando resolución: {e}")



# ── Feedback loop — Capa 3 ────────────────────────────────────────────────────

async def _analizar_resolucion_async(sb, ticket_id: str, ticket: dict, resolucion: str):
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, _analizar_resolucion_sync, sb, ticket_id, ticket, resolucion)

def _analizar_resolucion_sync(sb, ticket_id: str, ticket: dict, resolucion: str):
    try:
        import anthropic as _ant, json as _json
        client = _ant.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

        # Transcript
        transcript_text = ""
        if ticket.get("sesion_id"):
            try:
                s = sb.table("soporte_sesiones").select("transcript").eq("id", ticket["sesion_id"]).single().execute()
                msgs = s.data.get("transcript", []) if s.data else []
                transcript_text = "\n".join(
                    f"{m['role'].upper()}: {str(m.get('content',''))[:300]}" for m in msgs[:20]
                )
            except Exception:
                pass

        # FAQs existentes — búsqueda semántica por relevancia al ticket
        ctx = ticket.get("categoria", "general")
        faqs_existentes = []

        # 1. Intentar búsqueda semántica: las N FAQs más parecidas al ticket
        query_parts = [ticket.get("asunto", ""), resolucion, transcript_text[:600]]
        query_text = " ".join(p for p in query_parts if p).strip()
        if query_text:
            try:
                query_emb = generate_embedding(query_text)
                sem_res = sb.rpc("match_knowledge", {
                    "query_embedding": query_emb,
                    "similarity_threshold": 0.20,  # bajo para cobertura, no precisión
                    "match_count": 60,
                    "filtro_contexto": ctx,
                }).execute().data or []
                faqs_existentes = [
                    {"id": r["id"], "pregunta": r["titulo"],
                     "respuesta": r["contenido"], "contexto": ctx}
                    for r in sem_res if r.get("tipo") == "faq"
                ][:25]
            except Exception as e:
                print(f"[feedback] semantic FAQ search failed: {e}")

        # 2. Fallback si el KB está vacío o la búsqueda falló: top-votadas del contexto
        if len(faqs_existentes) < 8:
            try:
                faq_res = sb.table("knowledge_faqs") \
                    .select("id,pregunta,respuesta,contexto").eq("activo", True) \
                    .or_(f"contexto.eq.{ctx},contexto.eq.general") \
                    .order("votos_util", desc=True).limit(25).execute()
                faqs_existentes = faq_res.data or []
            except Exception:
                faqs_existentes = []

        faqs_text = "\n".join(
            f'ID:{f["id"]} | [{f["contexto"]}] P: {f["pregunta"][:150]} → R: {f.get("respuesta","")[:200]}'
            for f in faqs_existentes
        ) or "(ninguna)"

        resp = client.messages.create(
            model="claude-haiku-4-5-20251001",
            max_tokens=1500,
            messages=[{"role": "user", "content": f"""Eres el optimizador del knowledge base de SmartBuilderEC (plataforma EC0217.01 CONOCER México).

TICKET RESUELTO:
Asunto: {ticket.get('asunto','')}
Contexto: {ctx}

Conversación con IA:
{transcript_text or "(sin transcripción)"}

Resolución del agente humano:
{resolucion}

FAQS ACTUALES EN EL KNOWLEDGE BASE (contexto {ctx} + general):
{faqs_text}

Analiza y sugiere hasta 3 mejoras. Puedes proponer 4 tipos de acción:

1. nueva_faq — crear FAQ que no existe
2. editar_faq — mejorar una FAQ existente incompleta o imprecisa (requiere faq_id del listado)
3. eliminar_faq — eliminar FAQ obsoleta, incorrecta o redundante (requiere faq_id)
4. unir_faqs — fusionar 2+ FAQs muy similares en una sola (requiere faq_ids como array)

Solo sugiere si mejora genuinamente el knowledge base. Si la IA resolvió bien, devuelve sugerencias vacías.

Responde SOLO JSON válido (sin markdown, sin texto extra):
{{
  "ia_podia_resolverlo": true,
  "por_que_no": null,
  "sugerencias": [
    {{
      "tipo": "nueva_faq",
      "pregunta": "pregunta completa",
      "respuesta": "respuesta completa",
      "contexto": "ventas|checkout|onboarding|acceso|wizard_ec0217|navegacion|admin|general",
      "causa_raiz": "qué gap cubre"
    }},
    {{
      "tipo": "editar_faq",
      "faq_id": "uuid-exacto-del-listado",
      "pregunta_original": "texto actual de la FAQ",
      "respuesta_original": "respuesta actual",
      "pregunta": "pregunta mejorada",
      "respuesta": "respuesta mejorada",
      "contexto": "contexto",
      "causa_raiz": "qué se mejoró y por qué"
    }},
    {{
      "tipo": "eliminar_faq",
      "faq_id": "uuid-exacto-del-listado",
      "pregunta_original": "texto de la FAQ a eliminar",
      "razon": "por qué debe eliminarse"
    }},
    {{
      "tipo": "unir_faqs",
      "faq_ids": ["uuid1", "uuid2"],
      "preguntas_originales": ["pregunta 1", "pregunta 2"],
      "pregunta": "nueva pregunta unificada",
      "respuesta": "respuesta combinada y completa",
      "contexto": "contexto",
      "causa_raiz": "por qué unirlas"
    }}
  ]
}}"""}]
        )
        content = resp.content[0].text.strip()
        if content.startswith("```"):
            content = content.split("```")[1]
            if content.startswith("json"): content = content[4:]
            content = content.split("```")[0].strip()
        analisis = _json.loads(content)

        sugerencias = analisis.get("sugerencias", [])
        guardadas = 0
        for sug in sugerencias:
            tipo = sug.get("tipo", "nueva_faq")
            # Construir propuesta según tipo
            if tipo == "nueva_faq":
                propuesta = {
                    "pregunta": sug.get("pregunta",""), "respuesta": sug.get("respuesta",""),
                    "contexto": sug.get("contexto","general"), "causa_raiz": sug.get("causa_raiz",""),
                    "por_que_no": analisis.get("por_que_no",""),
                }
            elif tipo == "editar_faq":
                propuesta = {
                    "faq_id": sug.get("faq_id",""),
                    "pregunta_original": sug.get("pregunta_original",""), "respuesta_original": sug.get("respuesta_original",""),
                    "pregunta": sug.get("pregunta",""), "respuesta": sug.get("respuesta",""),
                    "contexto": sug.get("contexto","general"), "causa_raiz": sug.get("causa_raiz",""),
                }
                if not propuesta["faq_id"]: continue
            elif tipo == "eliminar_faq":
                propuesta = {
                    "faq_id": sug.get("faq_id",""),
                    "pregunta_original": sug.get("pregunta_original",""),
                    "razon": sug.get("razon",""),
                }
                if not propuesta["faq_id"]: continue
            elif tipo == "unir_faqs":
                propuesta = {
                    "faq_ids": sug.get("faq_ids",[]),
                    "preguntas_originales": sug.get("preguntas_originales",[]),
                    "pregunta": sug.get("pregunta",""), "respuesta": sug.get("respuesta",""),
                    "contexto": sug.get("contexto","general"), "causa_raiz": sug.get("causa_raiz",""),
                }
                if not propuesta["faq_ids"]: continue
            else:
                continue

            sb.table("soporte_sugerencias").insert({
                "tipo": tipo, "ticket_ids": [ticket_id],
                "propuesta": propuesta, "estado": "pendiente",
            }).execute()
            guardadas += 1

        print(f"[feedback] {guardadas} sugerencias para ticket {ticket_id}")
    except Exception as e:
        print(f"[feedback] Error en ticket {ticket_id}: {e}")


# ── Sugerencias ───────────────────────────────────────────────────────────────

@router.get("/soporte/sugerencias")
def listar_sugerencias(request: Request, estado: str = "pendiente"):
    _require_superadmin(request)
    sb = get_supabase()
    return sb.table("soporte_sugerencias").select("*").eq("estado", estado).order("created_at", desc=True).limit(50).execute().data or []


@router.patch("/soporte/sugerencias/{sug_id}")
def gestionar_sugerencia(sug_id: str, payload: SugerenciaAction, request: Request):
    uid = _require_superadmin(request)
    sb = get_supabase()
    if payload.accion not in ("aprobar", "rechazar"):
        raise HTTPException(status_code=400, detail="accion debe ser 'aprobar' o 'rechazar'.")
    if payload.propuesta is not None:
        sb.table("soporte_sugerencias").update({"propuesta": payload.propuesta}).eq("id", sug_id).execute()
    if payload.accion == "rechazar":
        sb.table("soporte_sugerencias").update({"estado": "rechazada", "aprobada_por": uid}).eq("id", sug_id).execute()
        return {"accion": "rechazada"}
    sug = sb.table("soporte_sugerencias").select("*").eq("id", sug_id).single().execute()
    if not sug.data:
        raise HTTPException(status_code=404, detail="Sugerencia no encontrada.")
    prop = payload.propuesta if payload.propuesta is not None else sug.data.get("propuesta", {})
    tipo = sug.data.get("tipo", "nueva_faq")
    resultado = {"accion": "aprobada", "tipo": tipo}

    if tipo == "nueva_faq":
        preg = prop.get("pregunta",""); resp = prop.get("respuesta",""); ctx = prop.get("contexto","general")
        if preg and resp:
            emb = generate_embedding(f"{preg} {resp}")
            sb.table("knowledge_faqs").insert({
                "pregunta": preg, "respuesta": resp, "categoria": "auto-generada",
                "contexto": ctx, "embedding": emb, "activo": True,
            }).execute()
            resultado["faq_creada"] = True

    elif tipo == "editar_faq":
        faq_id = prop.get("faq_id",""); preg = prop.get("pregunta","")
        resp   = prop.get("respuesta",""); ctx = prop.get("contexto","general")
        if faq_id and preg and resp:
            emb = generate_embedding(f"{preg} {resp}")
            sb.table("knowledge_faqs").update({
                "pregunta": preg, "respuesta": resp, "contexto": ctx, "embedding": emb,
            }).eq("id", faq_id).execute()
            resultado["faq_editada"] = faq_id

    elif tipo == "eliminar_faq":
        faq_id = prop.get("faq_id","")
        if faq_id:
            sb.table("knowledge_faqs").update({"activo": False}).eq("id", faq_id).execute()
            resultado["faq_eliminada"] = faq_id

    elif tipo == "unir_faqs":
        faq_ids = prop.get("faq_ids", []); preg = prop.get("pregunta","")
        resp    = prop.get("respuesta",""); ctx = prop.get("contexto","general")
        if faq_ids and preg and resp:
            # Crear FAQ unificada
            emb = generate_embedding(f"{preg} {resp}")
            sb.table("knowledge_faqs").insert({
                "pregunta": preg, "respuesta": resp, "categoria": "auto-generada",
                "contexto": ctx, "embedding": emb, "activo": True,
            }).execute()
            # Desactivar las originales
            for fid in faq_ids:
                sb.table("knowledge_faqs").update({"activo": False}).eq("id", fid).execute()
            resultado["faqs_unidas"] = faq_ids

    from datetime import datetime, timezone
    sb.table("soporte_sugerencias").update({
        "estado": "aprobada", "aprobada_por": uid,
        "aplicada_en": datetime.now(timezone.utc).isoformat(),
    }).eq("id", sug_id).execute()
    return resultado

# ── FAQs ───────────────────────────────────────────────────────────────────────

@router.post("/soporte/faqs/votos")
def votar_faqs(payload: VotoFAQs):
    if not payload.ids:
        return {"ok": True}
    sb = get_supabase()
    for faq_id in payload.ids[:5]:
        try:
            res = sb.table("knowledge_faqs").select("votos_util") \
                .eq("id", faq_id).eq("activo", True).single().execute()
            if res.data:
                sb.table("knowledge_faqs").update(
                    {"votos_util": (res.data.get("votos_util") or 0) + 1}
                ).eq("id", faq_id).execute()
        except Exception:
            pass
    return {"ok": True}


@router.post("/soporte/faqs/votos-negativos")
def votar_faqs_negativo(payload: VotoFAQs):
    if not payload.ids:
        return {"ok": True}
    sb = get_supabase()
    for faq_id in payload.ids[:5]:
        try:
            res = sb.table("knowledge_faqs").select("votos_negativo") \
                .eq("id", faq_id).eq("activo", True).single().execute()
            if res.data:
                sb.table("knowledge_faqs").update(
                    {"votos_negativo": (res.data.get("votos_negativo") or 0) + 1}
                ).eq("id", faq_id).execute()
        except Exception:
            pass
    return {"ok": True}


@router.get("/soporte/faqs/bajo-rendimiento")
def faqs_bajo_rendimiento(request: Request):
    _require_superadmin(request)
    sb = get_supabase()
    from datetime import datetime, timezone, timedelta
    cutoff = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()
    res = sb.table("knowledge_faqs") \
        .select("id, pregunta, respuesta, categoria, contexto, votos_util, votos_negativo, exposiciones, created_at") \
        .eq("activo", True) \
        .lt("created_at", cutoff) \
        .gte("exposiciones", 20) \
        .execute()
    faqs = res.data or []

    candidatas = []
    for f in faqs:
        util = f.get("votos_util") or 0
        neg  = f.get("votos_negativo") or 0
        exp  = f.get("exposiciones") or 0
        es_candidata = (
            (util == 0 and exp >= 50) or
            (neg > util and neg > 0)  or
            (util == 0 and neg >= 3)
        )
        if es_candidata:
            f["score_neto"]      = util - neg
            f["ratio_negativo"]  = round(neg / (util + neg), 2) if (util + neg) > 0 else 0
            candidatas.append(f)

    candidatas.sort(key=lambda x: x["score_neto"])
    return candidatas


@router.get("/soporte/faqs")
def listar_faqs():
    sb = get_supabase()
    res = (
        sb.table("knowledge_faqs")
        .select("id, pregunta, respuesta, categoria, contexto, votos_util, votos_negativo, exposiciones, created_at")
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


@router.patch("/soporte/faqs/{faq_id}")
def actualizar_faq(faq_id: str, payload: FAQUpdate, request: Request):
    _require_superadmin(request)
    sb = get_supabase()
    texto = f"{payload.pregunta} {payload.respuesta}"
    embedding = generate_embedding(texto)
    res = sb.table("knowledge_faqs").update({
        "pregunta":  payload.pregunta,
        "respuesta": payload.respuesta,
        "categoria": payload.categoria,
        "contexto":  payload.contexto,
        "embedding": embedding,
    }).eq("id", faq_id).execute()
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

    from datetime import datetime, timezone, timedelta
    import anthropic as _ant, json as _json

    sb = get_supabase()

    # 1. Tickets resueltos en los últimos 7 días (máx. 50)
    cutoff = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    res = sb.table("soporte_tickets") \
        .select("id, asunto, categoria, resolucion") \
        .eq("estado", "resuelto") \
        .gte("updated_at", cutoff) \
        .order("updated_at", desc=True) \
        .limit(50) \
        .execute()
    tickets = res.data or []

    if len(tickets) < 3:
        return {"status": "ok", "motivo": "insuficientes_tickets", "tickets_analizados": len(tickets)}

    # 2. Resumen compacto para el LLM
    resumen = "\n".join(
        f"{i+1}. ID:{t['id']} | [{t['categoria']}] {t['asunto']}"
        + (f" → {t['resolucion'][:150]}" if t.get("resolucion") else "")
        for i, t in enumerate(tickets)
    )

    # 3. Claude Haiku detecta temas recurrentes y genera FAQs
    client = _ant.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    resp = client.messages.create(
        model="claude-haiku-4-5-20251001",
        max_tokens=2000,
        messages=[{"role": "user", "content": f"""Eres el optimizador del knowledge base de SmartBuilderEC (plataforma EC0217.01 CONOCER México).

Analiza estos {len(tickets)} tickets de soporte resueltos de los últimos 7 días:

{resumen}

Identifica grupos de tickets que preguntan sobre el mismo tema o problema recurrente.
Solo incluye grupos con 2 o más tickets.
Para cada grupo, genera una FAQ que hubiera evitado esos tickets.

Responde SOLO JSON válido (sin markdown):
{{
  "patrones": [
    {{
      "tema": "descripción corta del patrón",
      "ticket_ids": ["id1", "id2"],
      "pregunta": "pregunta FAQ completa",
      "respuesta": "respuesta FAQ completa y útil",
      "contexto": "ventas|checkout|onboarding|acceso|wizard_ec0217|navegacion|admin|general",
      "causa_raiz": "por qué se repite este problema"
    }}
  ]
}}"""}],
    )

    content = resp.content[0].text.strip()
    if content.startswith("```"):
        content = content.split("```")[1]
        if content.startswith("json"):
            content = content[4:]
        content = content.split("```")[0].strip()
    patrones = _json.loads(content).get("patrones", [])

    # 4. Deduplicar: no crear sugerencia si ≥50% de sus ticket_ids ya están en una pendiente
    existentes = sb.table("soporte_sugerencias") \
        .select("ticket_ids").eq("estado", "pendiente").execute().data or []
    ids_pendientes = [set(e.get("ticket_ids") or []) for e in existentes]

    guardadas = 0
    for patron in patrones:
        tids = patron.get("ticket_ids", [])
        if len(tids) < 2:
            continue
        tids_set = set(tids)
        if any(len(tids_set & prev) / len(tids_set) >= 0.5 for prev in ids_pendientes if prev):
            continue

        sb.table("soporte_sugerencias").insert({
            "tipo": "nueva_faq",
            "ticket_ids": tids,
            "propuesta": {
                "pregunta":    patron.get("pregunta", ""),
                "respuesta":   patron.get("respuesta", ""),
                "contexto":    patron.get("contexto", "general"),
                "causa_raiz":  patron.get("causa_raiz", ""),
                "tema":        patron.get("tema", ""),
                "fuente":      "cron_patrones",
            },
            "estado": "pendiente",
        }).execute()
        guardadas += 1

    return {
        "status": "ok",
        "tickets_analizados": len(tickets),
        "patrones_detectados": len(patrones),
        "sugerencias_guardadas": guardadas,
    }


# ── Cron: Calidad de FAQs ──────────────────────────────────────────────────────

@router.post("/soporte/cron/analizar-calidad-faqs")
def cron_analizar_calidad_faqs(request: Request):
    cron_secret = os.getenv("CRON_SECRET", "")
    provided    = request.headers.get("x-cron-secret", "")
    # Acepta cron secret O superadmin autenticado (para disparar manualmente desde el panel)
    es_cron = cron_secret and provided == cron_secret
    if not es_cron:
        _require_superadmin(request)

    from datetime import datetime, timezone, timedelta
    import anthropic as _ant, json as _json

    sb = get_supabase()
    cutoff = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()

    # 1. FAQs evaluables y de bajo rendimiento (máx. 15 para no exceder timeout)
    res = sb.table("knowledge_faqs") \
        .select("id, pregunta, respuesta, contexto, votos_util, votos_negativo, exposiciones, created_at") \
        .eq("activo", True) \
        .lt("created_at", cutoff) \
        .gte("exposiciones", 20) \
        .execute()
    faqs_all = res.data or []

    candidatas = []
    for f in faqs_all:
        util = f.get("votos_util") or 0
        neg  = f.get("votos_negativo") or 0
        exp  = f.get("exposiciones") or 0
        if (util == 0 and exp >= 50) or (neg > util and neg > 0) or (util == 0 and neg >= 3):
            f["score_neto"] = util - neg
            candidatas.append(f)

    candidatas.sort(key=lambda x: x["score_neto"])
    candidatas = candidatas[:15]

    if not candidatas:
        return {"status": "ok", "motivo": "sin_candidatas", "faqs_analizadas": 0}

    # 2. IDs de FAQs ya con sugerencia pendiente para evitar duplicados
    pend = sb.table("soporte_sugerencias").select("propuesta").eq("estado", "pendiente").execute().data or []
    ids_con_sugerencia = set()
    for p in pend:
        prop = p.get("propuesta") or {}
        if prop.get("faq_id"):
            ids_con_sugerencia.add(prop["faq_id"])
        for fid in (prop.get("faq_ids") or []):
            ids_con_sugerencia.add(fid)

    client = _ant.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))
    guardadas = 0

    for faq in candidatas:
        faq_id = faq["id"]
        if faq_id in ids_con_sugerencia:
            continue

        # 3. FAQs similares en el KB (para recomendar unir)
        faqs_similares = []
        try:
            emb = generate_embedding(f"{faq['pregunta']} {faq['respuesta']}")
            sim = sb.rpc("match_knowledge", {
                "query_embedding": emb,
                "similarity_threshold": 0.55,
                "match_count": 8,
                "filtro_contexto": faq.get("contexto"),
            }).execute().data or []
            faqs_similares = [
                {"id": r["id"], "pregunta": r["titulo"], "respuesta": r["contenido"]}
                for r in sim
                if r.get("tipo") == "faq" and r["id"] != faq_id
            ][:5]
        except Exception:
            pass

        similares_txt = "\n".join(
            f'  ID:{s["id"]} | P: {s["pregunta"][:120]} → R: {s["respuesta"][:150]}'
            for s in faqs_similares
        ) or "  (ninguna similar encontrada)"

        util = faq.get("votos_util") or 0
        neg  = faq.get("votos_negativo") or 0
        exp  = faq.get("exposiciones") or 0

        # 4. Claude Haiku analiza y recomienda acción
        try:
            resp = client.messages.create(
                model="claude-haiku-4-5-20251001",
                max_tokens=800,
                messages=[{"role": "user", "content": f"""Eres el curador del knowledge base de SmartBuilderEC (plataforma EC0217.01, México).

FAQ DE BAJO RENDIMIENTO:
ID: {faq_id}
Pregunta: {faq['pregunta']}
Respuesta: {faq['respuesta']}
Contexto: {faq.get('contexto','general')}
Métricas: {exp} exposiciones | {util} 👍 | {neg} 👎

FAQs similares en el KB:
{similares_txt}

Esta FAQ no está siendo útil para los usuarios. Analiza y elige UNA acción:

1. editar_faq — el tema es válido pero la respuesta es pobre o incompleta. Propón una versión mejorada.
2. eliminar_faq — es obsoleta, incorrecta o ya cubierta completamente por otra FAQ. Solo si hay cobertura alternativa.
3. unir_faqs — es muy similar a otra(s) del listado. Propón fusionarlas. Requiere al menos 1 ID similar del listado.

IMPORTANTE: Si eliges eliminar_faq y no hay cobertura alternativa, elige editar_faq en su lugar.

Responde SOLO JSON válido (sin markdown):
{{
  "tipo": "editar_faq|eliminar_faq|unir_faqs",
  "causa_raiz": "por qué tiene bajo rendimiento",
  "faq_id": "{faq_id}",
  "pregunta_original": "{faq['pregunta'][:100]}",
  "pregunta": "pregunta mejorada (solo para editar_faq)",
  "respuesta": "respuesta mejorada (solo para editar_faq)",
  "contexto": "{faq.get('contexto','general')}",
  "razon": "por qué eliminar (solo para eliminar_faq)",
  "faq_ids": ["{faq_id}", "id-similar-del-listado"] ,
  "preguntas_originales": ["pregunta actual", "pregunta similar"],
  "respuesta_unificada": "respuesta fusionada (solo para unir_faqs)"
}}"""}]
            )
            content = resp.content[0].text.strip()
            if content.startswith("```"):
                content = content.split("```")[1]
                if content.startswith("json"):
                    content = content[4:]
                content = content.split("```")[0].strip()
            analisis = _json.loads(content)
        except Exception as e:
            print(f"[calidad_faqs] Error analizando {faq_id}: {e}")
            continue

        tipo = analisis.get("tipo", "")
        if tipo not in ("editar_faq", "eliminar_faq", "unir_faqs"):
            continue

        # 5. Construir propuesta
        if tipo == "editar_faq":
            preg = analisis.get("pregunta", "")
            resp_txt = analisis.get("respuesta", "")
            if not preg or not resp_txt:
                continue
            propuesta = {
                "faq_id":             faq_id,
                "pregunta_original":  faq["pregunta"],
                "respuesta_original": faq["respuesta"],
                "pregunta":           preg,
                "respuesta":          resp_txt,
                "contexto":           analisis.get("contexto", faq.get("contexto", "general")),
                "causa_raiz":         analisis.get("causa_raiz", ""),
                "fuente":             "cron_calidad",
                "metricas":           {"exposiciones": exp, "votos_util": util, "votos_negativo": neg},
            }
        elif tipo == "eliminar_faq":
            propuesta = {
                "faq_id":            faq_id,
                "pregunta_original": faq["pregunta"],
                "razon":             analisis.get("razon", analisis.get("causa_raiz", "")),
                "fuente":            "cron_calidad",
                "metricas":          {"exposiciones": exp, "votos_util": util, "votos_negativo": neg},
            }
        elif tipo == "unir_faqs":
            faq_ids_union = analisis.get("faq_ids", [faq_id])
            if len(faq_ids_union) < 2:
                continue
            preg_uni  = analisis.get("pregunta", "")
            resp_uni  = analisis.get("respuesta_unificada", "")
            if not preg_uni or not resp_uni:
                continue
            propuesta = {
                "faq_ids":             faq_ids_union,
                "preguntas_originales": analisis.get("preguntas_originales", [faq["pregunta"]]),
                "pregunta":            preg_uni,
                "respuesta":           resp_uni,
                "contexto":            analisis.get("contexto", faq.get("contexto", "general")),
                "causa_raiz":          analisis.get("causa_raiz", ""),
                "fuente":              "cron_calidad",
                "metricas":            {"exposiciones": exp, "votos_util": util, "votos_negativo": neg},
            }
        else:
            continue

        sb.table("soporte_sugerencias").insert({
            "tipo":       tipo,
            "ticket_ids": [],
            "propuesta":  propuesta,
            "estado":     "pendiente",
        }).execute()
        ids_con_sugerencia.add(faq_id)
        guardadas += 1

    return {
        "status":         "ok",
        "candidatas":     len(candidatas),
        "faqs_analizadas": len(candidatas),
        "sugerencias_guardadas": guardadas,
    }
