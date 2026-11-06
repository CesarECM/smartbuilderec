import io

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse

from models.ec0366_models import EC0366GenerateDocRequest
from services.doc_ec0366_helpers import generar_zip_ec0366

router = APIRouter(prefix="/ec0366", tags=["docs-ec0366"])


@router.post("/generate-doc")
def generate_doc_ec0366(data: EC0366GenerateDocRequest):
    try:
        zip_bytes = generar_zip_ec0366(data.model_dump())
        titulo = (data.titulo or "Curso").strip().replace(" ", "_")[:40] or "Curso"
        filename = f"EC0366_{titulo}.zip"
        return StreamingResponse(
            io.BytesIO(zip_bytes),
            media_type="application/zip",
            headers={"Content-Disposition": f"attachment; filename={filename}"},
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
