from datetime import datetime, timezone, timedelta
from fastapi import APIRouter, HTTPException, Request

from database import get_supabase
from models.soporte_models import FAQCreate, FAQUpdate, RecursoCreate, VotoFAQs, _require_superadmin
from services.embeddings_service import generate_embedding, chunk_text

router = APIRouter()


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


@router.get("/recursos")
def listar_recursos_blog():
    sb = get_supabase()
    res = sb.table("knowledge_recursos") \
        .select("id, titulo, tipo, url, contexto, created_at") \
        .eq("activo", True) \
        .order("created_at", desc=True) \
        .execute()
    return res.data or []


@router.get("/recursos/{recurso_id}")
def get_recurso_blog(recurso_id: str):
    sb = get_supabase()
    res = sb.table("knowledge_recursos") \
        .select("id, titulo, tipo, contenido, url, contexto, created_at") \
        .eq("id", recurso_id).eq("activo", True) \
        .single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Recurso no encontrado.")
    return res.data


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

    chunks = []
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

    return {**recurso, "chunks_generados": len(chunks)}


@router.delete("/soporte/recursos/{recurso_id}")
def eliminar_recurso(recurso_id: str, request: Request):
    _require_superadmin(request)
    sb = get_supabase()
    sb.table("knowledge_recursos").update({"activo": False}).eq("id", recurso_id).execute()
    return {"deleted": recurso_id}
