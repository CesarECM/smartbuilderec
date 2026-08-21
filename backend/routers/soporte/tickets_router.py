import asyncio
import os
from typing import Optional
from fastapi import APIRouter, HTTPException, Request

from database import get_supabase
from models.soporte_models import TicketRequest, TicketUpdate, _get_user, _require_admin
from services.soporte_feedback import _analizar_resolucion_async

router = APIRouter()


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
    if rol not in ("ce", "super_admin"):
        raise HTTPException(status_code=403, detail="Sin permisos.")
    query = sb.table("soporte_tickets").select("id,numero,asunto,categoria,estado,prioridad,user_email,user_nombre,created_at,updated_at")
    if rol == "ce":
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
