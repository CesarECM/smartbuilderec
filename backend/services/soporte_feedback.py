import asyncio
import os

from services.embeddings_service import generate_embedding


async def _analizar_resolucion_async(sb, ticket_id: str, ticket: dict, resolucion: str):
    loop = asyncio.get_running_loop()
    await loop.run_in_executor(None, _analizar_resolucion_sync, sb, ticket_id, ticket, resolucion)


def _analizar_resolucion_sync(sb, ticket_id: str, ticket: dict, resolucion: str):
    try:
        import anthropic as _ant, json as _json
        client = _ant.Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))

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

        ctx = ticket.get("categoria", "general")
        faqs_existentes = []

        query_parts = [ticket.get("asunto", ""), resolucion, transcript_text[:600]]
        query_text = " ".join(p for p in query_parts if p).strip()
        if query_text:
            try:
                query_emb = generate_embedding(query_text)
                sem_res = sb.rpc("match_knowledge", {
                    "query_embedding": query_emb,
                    "similarity_threshold": 0.20,
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

Analiza y sugiere hasta 3 mejoras. Puedes proponer 5 tipos de acción:

1. nueva_faq — crear FAQ que no existe
2. editar_faq — mejorar una FAQ existente incompleta o imprecisa (requiere faq_id del listado)
3. eliminar_faq — eliminar FAQ obsoleta, incorrecta o redundante (requiere faq_id)
4. unir_faqs — fusionar 2+ FAQs muy similares en una sola (requiere faq_ids como array)
5. nuevo_recurso — crear un artículo de blog completo cuando el tema requiere guía paso a paso,
   tutorial extenso o documentación detallada que no cabe en una FAQ

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
    }},
    {{
      "tipo": "nuevo_recurso",
      "titulo": "Título del artículo",
      "contenido": "Contenido completo en markdown: puede incluir # encabezados, listas, pasos numerados",
      "tipo_recurso": "articulo|tutorial|guia",
      "contexto": "ventas|checkout|onboarding|acceso|wizard_ec0217|navegacion|admin|general",
      "causa_raiz": "por qué se necesita un artículo completo y no solo una FAQ"
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
            elif tipo == "nuevo_recurso":
                titulo    = sug.get("titulo","")
                contenido = sug.get("contenido","")
                if not titulo or not contenido: continue
                propuesta = {
                    "titulo":       titulo,
                    "contenido":    contenido,
                    "tipo_recurso": sug.get("tipo_recurso","articulo"),
                    "contexto":     sug.get("contexto","general"),
                    "causa_raiz":   sug.get("causa_raiz",""),
                    "por_que_no":   analisis.get("por_que_no",""),
                }
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
