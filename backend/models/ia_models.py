from pydantic import BaseModel


class EvaluationRequest(BaseModel):
    texto: str
    tipo: str
    objetivo_cognitivo: str = ""
    objetivo_psicomotriz: str = ""


class GeneralRequest(BaseModel):
    cognitiva: str
    psicomotriz: str
    afectiva: str


class BeneficiosRequest(BaseModel):
    general: str
    nombre: str = ""


class TemarioRequest(BaseModel):
    nombre: str = ""
    general: str = ""
    cognitiva: str = ""
    psicomotriz: str = ""
    afectiva: str = ""
    beneficios: str = ""


class PreguntasRequest(BaseModel):
    nombre: str = ""
    perfil: str = ""


class ExpositivaRequest(BaseModel):
    campo: str
    nombreCurso: str = ""
    perfil: str = ""
    objetivoCognitivo: str = ""
    objetivoGeneral: str = ""
    temario: dict = {}


class DemostrativaRequest(BaseModel):
    campo: str
    nombreCurso: str = ""
    perfil: str = ""
    objetivoPsicomotriz: str = ""
    objetivoGeneral: str = ""
    temario: dict = {}


class DialogoRequest(BaseModel):
    campo: str
    nombreCurso: str = ""
    perfil: str = ""
    objetivoAfectivo: str = ""
    objetivoGeneral: str = ""
    temario: dict = {}


class CierreRequest(BaseModel):
    nombreCurso: str = ""
    objetivoGeneral: str = ""
    objetivoCognitivo: str = ""
    objetivoPsicomotriz: str = ""
    objetivoAfectivo: str = ""
    desarrolloExpositiva: str = ""
    actividadDemostrativa: str = ""
    instruccionesDialogo: str = ""


class DescripcionGeneralRequest(BaseModel):
    cierre: str = ""


class EvaluacionIARequest(BaseModel):
    nombreCurso: str = ""
    objetivoGeneral: str = ""
    objetivoCognitivo: str = ""
    objetivoPsicomotriz: str = ""
    objetivoAfectivo: str = ""


class MaterialesRequest(BaseModel):
    tecnica: str = ""
    nombreCurso: str = ""
    perfil: str = ""
    objetivoGeneral: str = ""
    objetivos: dict = {}
    temario: dict = {}
    tecnicas: dict = {}
    expositiva: dict = {}
    demostrativa: dict = {}
    dialogo: dict = {}


class ResumenRequest(BaseModel):
    nombreCurso: str = ""
    objetivoGeneral: str = ""
    objetivoCognitivo: str = ""
    objetivoPsicomotriz: str = ""
    objetivoAfectivo: str = ""
    desarrolloExpositiva: str = ""
    actividadDemostrativa: str = ""
    instruccionesDialogo: str = ""
    sugerenciasContinuidad: str = ""
    referenciasBibliograficas: str = ""
    compromisos: str = ""


class CompromisosRequest(BaseModel):
    nombreCurso: str = ""
    objetivoGeneral: str = ""
    objetivoCognitivo: str = ""
    objetivoPsicomotriz: str = ""
    objetivoAfectivo: str = ""


class PerfilRequest(BaseModel):
    nombre: str = ""
