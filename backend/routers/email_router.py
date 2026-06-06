from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
import os
from database import get_supabase
from services.email_service import send_email, send_template

router = APIRouter()


def _require_super_admin(caller_id: str, sb) -> None:
    res = sb.table("profiles").select("rol").eq("id", caller_id).single().execute()
    if (res.data or {}).get("rol") != "super_admin":
        raise HTTPException(status_code=403, detail="Acceso denegado.")


# ─── Listar todos los templates ───────────────────────────────────────────────

@router.get("/email/templates")
def list_templates(request: Request):
    caller_id = request.state.user.get("sub")
    sb = get_supabase()
    _require_super_admin(caller_id, sb)
    res = (
        sb.table("email_templates")
        .select("slug, nombre, subject, variables, updated_at")
        .order("slug")
        .execute()
    )
    return res.data or []


# ─── Obtener un template ──────────────────────────────────────────────────────

@router.get("/email/templates/{slug}")
def get_template(slug: str, request: Request):
    caller_id = request.state.user.get("sub")
    sb = get_supabase()
    _require_super_admin(caller_id, sb)
    res = sb.table("email_templates").select("*").eq("slug", slug).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Template no encontrado.")
    return res.data


# ─── Actualizar template ──────────────────────────────────────────────────────

class TemplateUpdateRequest(BaseModel):
    subject: Optional[str] = None
    body_html: Optional[str] = None
    nombre: Optional[str] = None


@router.put("/email/templates/{slug}")
def update_template(slug: str, data: TemplateUpdateRequest, request: Request):
    caller_id = request.state.user.get("sub")
    sb = get_supabase()
    _require_super_admin(caller_id, sb)

    updates: dict = {}
    if data.subject is not None:
        updates["subject"] = data.subject
    if data.body_html is not None:
        updates["body_html"] = data.body_html
    if data.nombre is not None:
        updates["nombre"] = data.nombre

    if not updates:
        raise HTTPException(status_code=400, detail="No hay campos para actualizar.")

    res = sb.table("email_templates").update(updates).eq("slug", slug).execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Template no encontrado.")
    return res.data[0]


# ─── Enviar email de prueba ───────────────────────────────────────────────────

class TestEmailRequest(BaseModel):
    slug: str
    to: str


# ─── Reset de contraseña con template propio ─────────────────────────────────
# Endpoint público (sin JWT). Genera el link de Supabase y envía nuestro template.
# El frontend debe llamar a este endpoint en lugar de supabase.auth.resetPasswordForEmail().

class ResetPasswordRequest(BaseModel):
    email: str


@router.post("/auth/reset-password", status_code=200)
def request_reset_password(data: ResetPasswordRequest):
    sb = get_supabase()
    frontend_url = os.getenv("FRONTEND_URL", "https://smartbuilderec.vercel.app")

    nombre = data.email.split("@")[0]
    try:
        prof = sb.table("profiles").select("nombre").eq("email", data.email).maybeSingle().execute()
        if prof.data and prof.data.get("nombre"):
            nombre = prof.data["nombre"]
    except Exception:
        pass

    link_reset = f"{frontend_url}/reset-password.html"
    try:
        link_res = sb.auth.admin.generate_link({
            "type": "recovery",
            "email": data.email,
            "options": {"redirect_to": f"{frontend_url}/reset-password.html"},
        })
        if hasattr(link_res, "properties") and link_res.properties:
            link_reset = getattr(link_res.properties, "action_link", link_reset) or link_reset
    except Exception as le:
        print(f"⚠️ reset_password generate_link error: {le}")

    send_template("reset_password", data.email, {
        "nombre": nombre,
        "email": data.email,
        "link_reset": link_reset,
    })
    return {"sent": True}


# ─── Enviar email de prueba ───────────────────────────────────────────────────

@router.post("/email/test")
def test_email(data: TestEmailRequest, request: Request):
    caller_id = request.state.user.get("sub")
    sb = get_supabase()
    _require_super_admin(caller_id, sb)

    res = sb.table("email_templates").select("subject, body_html").eq("slug", data.slug).single().execute()
    if not res.data:
        raise HTTPException(status_code=404, detail="Template no encontrado.")

    # Reemplazar variables con valores de ejemplo
    ejemplos = {
        "nombre": "Juan Pérez",
        "email": data.to,
        "creditos": "10",
        "creditos_restantes": "1",
        "vigencia_hasta": "31/12/2025",
        "link_acceso": "https://smartbuilderec.vercel.app",
        "link_reset": "https://smartbuilderec.vercel.app/reset-password.html",
        "nombre_admin": "Centro de Evaluación",
        "monto": "$1,799 MXN",
        "dias_restantes": "5",
        "asunto_ticket": "No puedo descargar mi planeación",
        "numero_ticket": "42",
        "resolucion": "Hemos revisado tu caso. El problema se debe a un bloqueo del navegador en las descargas automáticas. Intenta habilitarlas en la configuración de Chrome o usa Firefox.",
    }
    subject = res.data["subject"]
    html = res.data["body_html"]
    for key, val in ejemplos.items():
        subject = subject.replace(f"{{{{{key}}}}}", val)
        html = html.replace(f"{{{{{key}}}}}", val)

    ok = send_email(data.to, f"[PRUEBA] {subject}", html)
    if not ok:
        raise HTTPException(status_code=500, detail="Error al enviar el email. Verifica RESEND_API_KEY.")
    return {"sent": True, "to": data.to}
