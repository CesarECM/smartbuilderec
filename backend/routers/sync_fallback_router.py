import base64
import json
import os
from datetime import datetime
from typing import Optional

import httpx
from fastapi import APIRouter
from pydantic import BaseModel

router = APIRouter()

_ADMIN_EMAIL = os.getenv("ADMIN_FALLBACK_EMAIL", "cesar@ceecm.mx")


class FallbackPayload(BaseModel):
    user_email: str = ""
    user_name: Optional[str] = ""
    nombre_curso: str = "Sin título"
    datos: dict = {}
    error: str = ""


@router.post("/wizard/sync-fallback", status_code=200)
async def sync_fallback(payload: FallbackPayload):
    api_key = os.getenv("RESEND_API_KEY")
    if not api_key:
        return {"ok": False}

    ts = datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")
    nombre = (payload.user_name or "").strip() or payload.user_email or "Desconocido"

    html = f"""
    <h2 style="color:#d97706;font-family:sans-serif">⚠️ Respaldo automático — Fallo de sincronización</h2>
    <table style="border-collapse:collapse;font-family:sans-serif;font-size:14px">
      <tr><td style="padding:4px 16px 4px 0;color:#6b7280">Fecha</td>
          <td><strong>{ts}</strong></td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#6b7280">Usuario</td>
          <td><strong>{nombre}</strong> ({payload.user_email})</td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#6b7280">Curso</td>
          <td><strong>{payload.nombre_curso}</strong></td></tr>
      <tr><td style="padding:4px 16px 4px 0;color:#6b7280">Error</td>
          <td style="color:#ef4444">{payload.error}</td></tr>
    </table>
    <p style="font-family:sans-serif;color:#374151;margin-top:16px">
      El wizard no pudo guardar esta planeación en Supabase.<br>
      El JSON con todos los datos del curso se adjunta a este correo para recuperación manual.
    </p>
    """

    safe_name = "".join(c if c.isalnum() or c in " _-" else "_" for c in payload.nombre_curso)[:50].strip()
    filename = f"respaldo_{safe_name}_{datetime.utcnow().strftime('%Y%m%d_%H%M')}.json"
    json_b64 = base64.b64encode(
        json.dumps(payload.datos, ensure_ascii=False, indent=2).encode("utf-8")
    ).decode()

    from_addr = f"SmartBuilderEC EC0217.01 <{os.getenv('RESEND_FROM_EMAIL', 'noreply@smartbuilderec.com')}>"
    try:
        with httpx.Client(timeout=10) as client:
            res = client.post(
                "https://api.resend.com/emails",
                headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"},
                json={
                    "from": from_addr,
                    "to": [_ADMIN_EMAIL],
                    "subject": f"⚠️ Respaldo wizard | {payload.user_email} | {payload.nombre_curso}",
                    "html": html,
                    "attachments": [{"filename": filename, "content": json_b64}],
                },
            )
        return {"ok": res.status_code in (200, 201)}
    except Exception as e:
        print(f"[sync-fallback] email error: {e}")
        return {"ok": False}
