from pydantic import BaseModel
from typing import Any, Optional


class EC0616IaElementoRequest(BaseModel):
    accion: str  # "generar" | "refinar" | "revisar"
    elemento_num: int
    elemento_titulo: str = ""
    desempenos_ec: list[str] = []
    texto_actual: str = ""
    unidad_medica: str = ""


class EC0616IaScorecardRequest(BaseModel):
    datos: dict[str, Any] = {}
    elementos: dict[str, Any] = {}


class EC0616GenerateDocRequest(BaseModel):
    datos: dict[str, Any] = {}
    portafolio: dict[str, Any] = {}
    oxigenacion: dict[str, Any] = {}
    alimentacion: dict[str, Any] = {}
    eliminacion: dict[str, Any] = {}
    confort: dict[str, Any] = {}
    seguridad: dict[str, Any] = {}
    postmortem: dict[str, Any] = {}
    autocuidado: dict[str, Any] = {}
    registro_id: Optional[str] = None


class EC0616TutorGenerateDocRequest(BaseModel):
    ficha: dict[str, Any] = {}
    confidencial: dict[str, Any] = {}
    diagnostico: dict[str, Any] = {}
    plan: dict[str, Any] = {}
    iec1: dict[str, Any] = {}
    iec2: dict[str, Any] = {}
    iec3: dict[str, Any] = {}
    iec4: dict[str, Any] = {}
    iec5: dict[str, Any] = {}
    iec6: dict[str, Any] = {}
    iec7: dict[str, Any] = {}
    cierre: dict[str, Any] = {}
    registro_id: Optional[str] = None
