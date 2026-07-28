import io

from fastapi import APIRouter, HTTPException, Request
from fastapi.responses import StreamingResponse

from models.ec0091_models import EC0091GenerateDocRequest
from services.doc_ec0091_helpers import generar_zip_ec0091

router = APIRouter(prefix="/ec0091", tags=["docs-ec0091"])


def _canjear_credito_ec0091(registro_id: str, user_id: str) -> None:
    """Descuenta 1 crédito del admin si el registro no ha sido canjeado."""
    from database import get_supabase
    sb = get_supabase()

    rec = sb.table("ec0091_datos").select("credito_canjeado,admin_id") \
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

    sb.table("ec0091_datos").update({"credito_canjeado": True}).eq("id", registro_id).execute()


@router.post("/generate-doc")
def generate_doc_ec0091(data: EC0091GenerateDocRequest, request: Request):
    try:
        user_id = getattr(getattr(request, "state", None), "user", {}).get("sub", "")
        if data.registro_id and user_id:
            _canjear_credito_ec0091(data.registro_id, user_id)

        payload = data.model_dump()
        zip_bytes = generar_zip_ec0091(payload)
        oc = (data.datos.get("oc91NombreOrganismo") or "EC0091").replace(" ", "_")[:40]
        filename = f"Verificacion_{oc}.zip"
        return StreamingResponse(
            io.BytesIO(zip_bytes),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
