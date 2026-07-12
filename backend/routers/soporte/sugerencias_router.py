from datetime import datetime, timezone
from fastapi import APIRouter, HTTPException, Request

from database import get_supabase
from models.soporte_models import SugerenciaAction, _require_superadmin
from services.embeddings_service import generate_embedding, chunk_text

router = APIRouter()


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
            emb = generate_embedding(f"{preg} {resp}")
            sb.table("knowledge_faqs").insert({
                "pregunta": preg, "respuesta": resp, "categoria": "auto-generada",
                "contexto": ctx, "embedding": emb, "activo": True,
            }).execute()
            for fid in faq_ids:
                sb.table("knowledge_faqs").update({"activo": False}).eq("id", fid).execute()
            resultado["faqs_unidas"] = faq_ids

    elif tipo == "nuevo_recurso":
        titulo   = prop.get("titulo", "")
        contenido = prop.get("contenido", "")
        ctx      = prop.get("contexto", "general")
        tipo_rec = prop.get("tipo_recurso", "articulo")
        if titulo and contenido:
            title_emb = generate_embedding(titulo)
            r = sb.table("knowledge_recursos").insert({
                "titulo": titulo, "tipo": tipo_rec, "contenido": contenido,
                "contexto": ctx, "embedding": title_emb, "activo": True,
            }).execute()
            recurso_id = r.data[0]["id"]
            chunks = chunk_text(contenido)
            for i, chunk in enumerate(chunks):
                chunk_emb = generate_embedding(chunk)
                sb.table("knowledge_chunks").insert({
                    "recurso_id": recurso_id, "chunk_index": i,
                    "contenido": chunk, "embedding": chunk_emb,
                }).execute()
            resultado["recurso_creado"] = recurso_id
            resultado["chunks"] = len(chunks)

    sb.table("soporte_sugerencias").update({
        "estado": "aprobada", "aprobada_por": uid,
        "aplicada_en": datetime.now(timezone.utc).isoformat(),
    }).eq("id", sug_id).execute()
    return resultado
