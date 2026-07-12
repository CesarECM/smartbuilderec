import json as _json
import os
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, Request

from database import get_supabase
from models.soporte_models import _require_superadmin
from services.embeddings_service import generate_embedding

router = APIRouter()


@router.post("/soporte/cron/analizar-calidad-faqs")
def cron_analizar_calidad_faqs(request: Request):
    cron_secret = os.getenv("CRON_SECRET", "")
    provided    = request.headers.get("x-cron-secret", "")
    es_cron = cron_secret and provided == cron_secret
    if not es_cron:
        _require_superadmin(request)

    import anthropic as _ant
    sb = get_supabase()
    cutoff = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()

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
