# ─── routers/ec0616_tutor_router.py — Endpoints Modo Tutor EC0616 ─────────────

import io

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from database import get_supabase
from services.erp_helpers import _caller
from models.ec0616_models import EC0616TutorGenerateDocRequest
from services.doc_ec0616_tutor_helpers import generar_zip_ec0616_tutor

router = APIRouter(prefix="/ec0616-tutor", tags=["ec0616-tutor"])

_CODIGO = "EC0616"


def _get_config(sb):
    res = (
        sb.table("estandares_competencia")
        .select("config")
        .eq("codigo", _CODIGO)
        .single()
        .execute()
    )
    if not res.data:
        raise HTTPException(status_code=404, detail="EC0616 no encontrado en Supabase.")
    return res.data.get("config") or {}


@router.get("/config")
def obtener_config(request: Request):
    """Devuelve config.diagnostico + config.plan_evaluacion + puntaje_minimo del IEC."""
    _caller(request)
    cfg = _get_config(get_supabase())
    return {
        "diagnostico":    cfg.get("diagnostico", {}),
        "plan_evaluacion": cfg.get("plan_evaluacion", {}),
        "puntaje_minimo": cfg.get("iec", {}).get("puntaje_minimo", 99.62),
    }


@router.get("/iec")
def obtener_iec(request: Request):
    """Devuelve los 273 reactivos del IEC con pesos. Usado en Pasos 5-11."""
    _caller(request)
    cfg = _get_config(get_supabase())
    iec = cfg.get("iec", {})
    return {
        "reactivos":      iec.get("reactivos", []),
        "puntaje_minimo": iec.get("puntaje_minimo", 99.62),
    }


@router.post("/generate-doc")
def generate_doc_tutor(data: EC0616TutorGenerateDocRequest, request: Request):
    """Genera ZIP con 6 documentos DOCX del Portafolio Modo Tutor EC0616."""
    try:
        sb  = get_supabase()
        cfg = _get_config(sb)
        iec_reactivos = cfg.get("iec", {}).get("reactivos", [])
        plan_config   = cfg.get("plan_evaluacion", {})

        payload   = data.model_dump()
        zip_bytes = generar_zip_ec0616_tutor(payload, iec_reactivos, plan_config)

        ficha    = data.ficha or {}
        nombre   = f"{ficha.get('nombre_candidato', '')}_{ficha.get('apellidos_candidato', '')}".strip("_").replace(" ", "_")[:40] or "EC0616_Tutor"
        filename = f"Portafolio_Tutor_{nombre}.zip"

        return StreamingResponse(
            io.BytesIO(zip_bytes),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
