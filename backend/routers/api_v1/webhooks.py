from fastapi import APIRouter, Depends
from pydantic import BaseModel, HttpUrl
from typing import Optional
from database import get_supabase
from .auth import require_api_key, _ok, _err
import httpx
import os
import logging

router = APIRouter(prefix="/api/v1/webhooks", tags=["ecmatic-webhooks"])
logger = logging.getLogger("ecmatic.webhooks")

_VALID_EVENTS = {
    "user.created",
    "user.plan_changed",
    "payment.completed",
    "payment.failed",
    "course.created",
    "course.completed",
    "document.generated",
}


class WebhookSubscribe(BaseModel):
    url: HttpUrl
    eventos: list[str] = list(_VALID_EVENTS)
    descripcion: Optional[str] = None


@router.post("/subscribe", status_code=201, dependencies=[Depends(require_api_key)])
def subscribe_webhook(data: WebhookSubscribe):
    invalidos = [e for e in data.eventos if e not in _VALID_EVENTS]
    if invalidos:
        _err(f"Eventos inválidos: {invalidos}. Válidos: {sorted(_VALID_EVENTS)}", 422)

    sb = get_supabase()
    res = sb.table("ecmatic_webhooks").insert({
        "url": str(data.url),
        "eventos": data.eventos,
        "descripcion": data.descripcion,
        "activo": True,
    }).execute()

    if not res.data:
        _err("Error al registrar el webhook.", 500)

    return _ok(res.data[0])


@router.get("", dependencies=[Depends(require_api_key)])
def list_webhooks():
    sb = get_supabase()
    res = sb.table("ecmatic_webhooks").select("*").order("created_at", desc=True).execute()
    return _ok(res.data or [])


@router.delete("/{webhook_id}", dependencies=[Depends(require_api_key)])
def delete_webhook(webhook_id: str):
    sb = get_supabase()

    existing = sb.table("ecmatic_webhooks").select("id").eq("id", webhook_id).single().execute()
    if not existing.data:
        _err("Webhook no encontrado.", 404)

    sb.table("ecmatic_webhooks").delete().eq("id", webhook_id).execute()
    return _ok({"deleted": webhook_id})


@router.patch("/{webhook_id}/toggle", dependencies=[Depends(require_api_key)])
def toggle_webhook(webhook_id: str):
    sb = get_supabase()
    existing = sb.table("ecmatic_webhooks").select("id, activo").eq("id", webhook_id).single().execute()
    if not existing.data:
        _err("Webhook no encontrado.", 404)

    new_state = not existing.data["activo"]
    sb.table("ecmatic_webhooks").update({"activo": new_state}).eq("id", webhook_id).execute()
    return _ok({"webhook_id": webhook_id, "activo": new_state})


# ─── Dispatcher interno ───────────────────────────────────────────────────────

def dispatch_event(evento: str, payload: dict) -> None:
    """
    Dispara el evento a todos los webhooks registrados para ese evento.
    Incluye también ECMATIC_WEBHOOK_URL si está definida en env.
    Llamar desde BackgroundTasks para no bloquear la respuesta.
    """
    urls: list[str] = []

    env_url = os.getenv("ECMATIC_WEBHOOK_URL", "").strip()
    if env_url:
        urls.append(env_url)

    try:
        sb = get_supabase()
        res = sb.table("ecmatic_webhooks").select("url, eventos") \
            .eq("activo", True).execute()
        for row in (res.data or []):
            if evento in (row.get("eventos") or []):
                url = row.get("url", "")
                if url and url not in urls:
                    urls.append(url)
    except Exception as e:
        logger.warning(f"[webhooks] Error leyendo tabla: {e}")

    if not urls:
        return

    body = {"evento": evento, "data": payload}

    for url in urls:
        try:
            with httpx.Client(timeout=5.0) as client:
                client.post(url, json=body)
        except Exception as e:
            logger.warning(f"[webhooks] Fallo entregando {evento} a {url}: {e}")
