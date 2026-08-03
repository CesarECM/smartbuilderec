from pydantic import BaseModel
from typing import Any, Optional


class EC1375IaSeguimientoRequest(BaseModel):
    accion: str = "generar"           # "generar"
    nombre_usuario:  str = ""
    edad:            str = ""
    motivo:          str = ""
    antecedentes:    str = ""
    enfermedades:    str = ""
    tecnica:         str = ""
    objetivo_sesion: str = ""
    num_sesiones:    str = ""
    frecuencia:      str = ""
    duracion:        str = ""
    spo2:            str = ""
    presion:         str = ""


class EC1375GenerateDocRequest(BaseModel):
    datos:          dict[str, Any] = {}
    espacio:        dict[str, Any] = {}
    usuario:        dict[str, Any] = {}
    signos:         dict[str, Any] = {}
    consentimiento: dict[str, Any] = {}
    seguimiento:    dict[str, Any] = {}
    nombre_auxiliar: str = ""
    registro_id:    Optional[str] = None
