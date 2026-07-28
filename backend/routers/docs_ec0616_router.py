import io

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from models.ec0616_models import EC0616GenerateDocRequest
from services.doc_ec0616_helpers import generar_zip_ec0616

router = APIRouter(prefix="/ec0616", tags=["docs-ec0616"])


def _canjear_credito_ec0616(registro_id: str, user_id: str) -> None:
    """Descuenta 1 crédito del admin si el portafolio no ha sido canjeado."""
    from database import get_supabase
    sb = get_supabase()

    rec = sb.table("ec0616_datos").select("credito_canjeado,admin_id") \
        .eq("id", registro_id).eq("user_id", user_id).maybe_single().execute()
    if not rec.data or rec.data.get("credito_canjeado"):
        return

    admin_id = rec.data.get("admin_id")
    if admin_id:
        adm = sb.table("profiles").select("credits").eq("id", admin_id).maybe_single().execute()
        creditos = (adm.data or {}).get("credits", 0) or 0
        if creditos <= 0:
            raise HTTPException(status_code=402,
                detail="El administrador no tiene créditos disponibles.")
        sb.table("profiles").update({"credits": creditos - 1}).eq("id", admin_id).execute()

    sb.table("ec0616_datos").update({"credito_canjeado": True}).eq("id", registro_id).execute()


@router.post("/generate-doc")
def generate_doc_ec0616(data: EC0616GenerateDocRequest, request: Request):
    try:
        user_id = getattr(getattr(request, "state", None), "user", {}).get("sub", "")
        if data.registro_id and user_id:
            _canjear_credito_ec0616(data.registro_id, user_id)

        payload = data.model_dump()
        zip_bytes = generar_zip_ec0616(payload)
        datos = data.datos or {}
        nombre = f"{datos.get('cand16Nombre', '')}_{datos.get('cand16Apellidos', '')}".strip("_").replace(" ", "_")[:40] or "EC0616"
        filename = f"Portafolio_{nombre}.zip"
        return StreamingResponse(
            io.BytesIO(zip_bytes),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
