from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel
from typing import Optional
from database import get_supabase
from services.email_service import send_email

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
        "vigencia_hasta": "31/12/2025",
        "link_acceso": "https://smartbuilderec.vercel.app",
        "link_reset": "https://smartbuilderec.vercel.app/reset-password.html",
        "nombre_admin": "Centro de Evaluación",
        "monto": "$1,799 MXN",
        "dias_restantes": "5",
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
