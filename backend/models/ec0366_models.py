from pydantic import BaseModel


class EC0366InfoGeneralIaRequest(BaseModel):
    """Entradas mínimas del cliente; la IA redacta la información general del curso."""
    titulo:           str = ""
    tema:             str = ""   # de qué trata el curso
    publico_objetivo: str = ""   # a quién va dirigido
    duracion_horas:   str = ""
    notas:            str = ""   # cualquier detalle extra


class EC0366GenerateDocRequest(BaseModel):
    """Campos del 'Documento de información general del curso' (EC0366 · Elemento 1)."""
    titulo:                  str = ""
    objetivo_general:        str = ""
    temario:                 str = ""
    objetivos_particulares:  str = ""
    introduccion:            str = ""
    guia_visual:             str = ""
    metodologia:             str = ""
    perfil_ingreso:          str = ""
    requisitos_tecnologicos: str = ""
    requisitos_materiales:   str = ""
    forma_evaluacion:        str = ""
    duracion_horas:          str = ""
    duracion_semanas:        str = ""
