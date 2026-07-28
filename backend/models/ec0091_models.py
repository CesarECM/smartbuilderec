from pydantic import BaseModel
from typing import Any, Optional


class EC0091IaObjetivoRequest(BaseModel):
    accion: str  # "generar" | "revisar"
    organismo_certificador: str = ""
    tipo_entidad: str = "CE"
    nombre_entidad: str = ""
    objetivo: str = ""
    alcance: str = ""


class EC0091IaListaRequest(BaseModel):
    accion: str  # "generar" | "revisar"
    lineas_activas: list[str] = []
    objetivo: str = ""
    alcance: str = ""
    preguntas: str = ""


class EC0091IaHallazgosRequest(BaseModel):
    accion: str  # "generar_causa" | "refinar" | "revisar"
    descripcion: str = ""
    causa: str = ""
    accion_propuesta: str = ""


class EC0091IaInformeRequest(BaseModel):
    accion: str  # "generar" | "revisar"
    organismo_certificador: str = ""
    nombre_entidad: str = ""
    tipo_entidad: str = "CE"
    num_hallazgos: int = 0
    dictamen: str = ""
    resumen: str = ""
    conclusiones: str = ""
    resultado: str = ""


class EC0091IaRevisionGlobalRequest(BaseModel):
    expediente: dict[str, Any] = {}


class EC0091GenerateDocRequest(BaseModel):
    datos: dict[str, Any] = {}
    objetivo: dict[str, Any] = {}
    antecedentes: dict[str, Any] = {}
    lineas: dict[str, Any] = {}
    muestreo: dict[str, Any] = {}
    documentos: dict[str, Any] = {}
    cronograma: dict[str, Any] = {}
    lista: dict[str, Any] = {}
    ejecucion: dict[str, Any] = {}
    hallazgos: dict[str, Any] = {}
    informe: dict[str, Any] = {}
    cierre: dict[str, Any] = {}
    expediente: dict[str, Any] = {}
    registro_id: Optional[str] = None
