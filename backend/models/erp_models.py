from typing import Optional
from pydantic import BaseModel


class NormaUpsert(BaseModel):
    codigo: str
    nombre: str
    descripcion: str = ""
    dias_estimados_certificado: int = 45
    tiene_wizard: bool = False
    activo: bool = True


class AsignacionRequest(BaseModel):
    alumno_id: str
    norma_id: str
    asesor_id: Optional[str] = None
    evaluador_id: Optional[str] = None


class PagoManualRequest(BaseModel):
    alumno_id: str
    norma_id: str
    concepto: str  # alineacion | evaluacion | certificacion
    monto: int = 0
    moneda: str = "MXN"
    referencia: Optional[str] = None
    notas: Optional[str] = None
    pagado_at: Optional[str] = None


class EvaluadoRequest(BaseModel):
    alumno_id: str
    norma_id: str
    evaluacion_notas: Optional[str] = None
    evaluado_at: Optional[str] = None


class LoteEnviadoRequest(BaseModel):
    alumno_id: str
    norma_id: str
    notas: Optional[str] = None
    lote_enviado_at: Optional[str] = None


class CertificadoRecibidoRequest(BaseModel):
    alumno_id: str
    norma_id: str
    certificado_recibido_at: Optional[str] = None


class AsignarRolRequest(BaseModel):
    user_id: str
    role: str  # evaluador | asesor
