import io

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from models.ec1375_models import EC1375GenerateDocRequest
from services.doc_ec1375_helpers import generar_zip_ec1375

router = APIRouter(prefix="/ec1375", tags=["docs-ec1375"])


def _canjear_credito_ec1375(registro_id: str, user_id: str) -> None:
    """Descuenta 1 crédito del admin si el registro no ha sido canjeado."""
    from database import get_supabase
    sb = get_supabase()

    rec = sb.table("ec1375_datos").select("credito_canjeado,admin_id") \
        .eq("id", registro_id).eq("user_id", user_id).maybe_single().execute()
    if not rec.data or rec.data.get("credito_canjeado"):
        return

    admin_id = rec.data.get("admin_id")
    if admin_id:
        adm = sb.table("profiles").select("credits").eq("id", admin_id).maybe_single().execute()
        creditos = (adm.data or {}).get("credits", 0) or 0
        if creditos <= 0:
            raise HTTPException(
                status_code=402,
                detail="El administrador no tiene créditos disponibles.",
            )
        sb.table("profiles").update({"credits": creditos - 1}).eq("id", admin_id).execute()

    sb.table("ec1375_datos").update({"credito_canjeado": True}).eq("id", registro_id).execute()


@router.post("/generate-doc")
def generate_doc_ec1375(data: EC1375GenerateDocRequest, request: Request):
    try:
        user_id = getattr(getattr(request, "state", None), "user", {}).get("sub", "")
        if data.registro_id and user_id:
            _canjear_credito_ec1375(data.registro_id, user_id)

        payload  = data.model_dump()
        zip_bytes = generar_zip_ec1375(payload)
        nombre_aux = (data.nombre_auxiliar or "EC1375").replace(" ", "_")[:40]
        filename   = f"Expediente_{nombre_aux}.zip"
        return StreamingResponse(
            io.BytesIO(zip_bytes),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
