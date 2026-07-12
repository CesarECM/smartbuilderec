import json as _json
import os
from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Request

from database import get_supabase

router = APIRouter()


@router.post("/soporte/cron/analizar-patrones")
def cron_analizar_patrones(request: Request):
    cron_secret = os.getenv("CRON_SECRET", "")
    provided = request.headers.get("x-cron-secret", "")
    if not cron_secret or provided != cron_secret:
        raise HTTPException(status_code=401, detail="Unauthorized.")

    import anthropic as _ant
    sb = get_supabase()

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

    resumen = "\n".join(
        f"{i+1}. ID:{t['id']} | [{t['categoria']}] {t['asunto']}"
        + (f" → {t['resolucion'][:150]}" if t.get("resolucion") else "")
        for i, t in enumerate(tickets)
    )

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
