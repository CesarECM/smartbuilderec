import io

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse
from pydantic import BaseModel

from database import get_supabase
from services.erp_helpers import _caller
from services.doc_gce_helpers import generar_zip_portafolio

router = APIRouter(prefix="/gce", tags=["docs-gce"])

_ESTADOS_CIERRE = {"cierre", "certificado"}


class GCEPortafolioRequest(BaseModel):
    proceso_id: str


def _canjear_credito_gce(sb, proceso_id: str) -> None:
    """Descuenta 1 crédito del ce_admin si el portafolio aún no fue canjeado."""
    proc = (
        sb.table("procesos_evaluacion")
        .select("credito_canjeado, ce_id")
        .eq("id", proceso_id)
        .maybe_single()
        .execute()
    )
    if not proc.data or proc.data.get("credito_canjeado"):
        return

    ce_id = proc.data.get("ce_id")
    if ce_id:
        adm = (
            sb.table("profiles")
            .select("credits")
            .eq("id", ce_id)
            .maybe_single()
            .execute()
        )
        creditos = (adm.data or {}).get("credits", 0) or 0
        if creditos <= 0:
            raise HTTPException(status_code=402, detail="Sin créditos disponibles.")
        sb.table("profiles").update({"credits": creditos - 1}).eq("id", ce_id).execute()

    sb.table("procesos_evaluacion") \
        .update({"credito_canjeado": True}) \
        .eq("id", proceso_id) \
        .execute()


@router.post("/generate-portafolio")
def generate_portafolio_gce(data: GCEPortafolioRequest, request: Request):
    sb  = get_supabase()
    _caller(request)  # requiere auth

    res = (
        sb.table("procesos_evaluacion")
        .select("*, estandares_competencia(*)")
        .eq("id", data.proceso_id)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(404, "Proceso no encontrado.")

    proceso = res.data
    ec      = proceso.get("estandares_competencia") or {}
    datos   = proceso.get("datos") or {}

    if proceso.get("estado") not in _ESTADOS_CIERRE:
        raise HTTPException(400, "El proceso debe estar en estado 'cierre' o 'certificado'.")

    try:
        _canjear_credito_gce(sb, data.proceso_id)
        zip_bytes = generar_zip_portafolio(datos, ec)
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(500, str(e))

    ficha    = datos.get("ficha_registro", {})
    nombre   = (ficha.get("nombre_completo", "") or "").replace(" ", "_")[:40] or "candidato"
    codigo   = ec.get("codigo", "GCE")
    filename = f"Portafolio_{codigo}_{nombre}.zip"

    return StreamingResponse(
        io.BytesIO(zip_bytes),
        media_type="application/zip",
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
