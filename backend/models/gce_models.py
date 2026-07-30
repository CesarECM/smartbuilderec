from typing import Any, Optional
from pydantic import BaseModel


class EstandarCreate(BaseModel):
    codigo: str
    titulo: str
    version: str = ""
    nivel_snc: Optional[int] = None
    vigencia_cert: int = 3          # años de vigencia del certificado
    config: dict[str, Any] = {}
    activo: bool = True


class EstandarUpdate(BaseModel):
    titulo: Optional[str] = None
    version: Optional[str] = None
    nivel_snc: Optional[int] = None
    vigencia_cert: Optional[int] = None
    config: Optional[dict[str, Any]] = None
    activo: Optional[bool] = None


class ProcesoCreate(BaseModel):
    candidato_id: str
    estandar_id: str
    evaluador_id: Optional[str] = None
    oc_id: Optional[str] = None


class ProcesoUpdate(BaseModel):
    evaluador_id: Optional[str] = None
    estado: Optional[str] = None
    datos: Optional[dict[str, Any]] = None
    juicio: Optional[str] = None    # C | TNC


ESTADOS_VALIDOS = (
    "registro", "diagnostico", "plan_acordado",
    "evidencias", "juicio", "cierre", "certificado",
)


class InvitacionCreate(BaseModel):
    email: str
    tipo: str                  # 'candidato' | 'evaluador'
    estandar_ids: list[str] = []
