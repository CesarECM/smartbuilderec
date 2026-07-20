from pydantic import BaseModel
from typing import Optional


class DatosInfo(BaseModel):
    nombreCurso: str = ""
    instructor: str = ""
    disenador: str = ""
    lugar: str = ""
    fecha: str = ""
    duracion: int | None = None
    participantes: int | None = None
    perfil: str = ""


class ObjetivosInfo(BaseModel):
    general: str = ""
    cognitiva: str = ""
    psicomotriz: str = ""
    afectiva: str = ""


class TemarioInfo(BaseModel):
    u1: list[str] = []
    u2: list[str] = []
    u3: list[str] = []


class EncuadreInfo(BaseModel):
    preguntas: str = ""
    reglas: list[int] = []
    reglasTexto: list[str] = []
    otraRegla: str = ""
    acuerdos: list[int] = []
    acuerdosTexto: list[str] = []
    otroAcuerdo: str = ""


class TecnicasInfo(BaseModel):
    rhIdx: int = 0
    rhNombre: str = ""
    rhObjetivo: str = ""
    rhInstrucciones: str = ""
    rhDetalle: str = ""
    rhDuracion: str = ""
    rhMateriales: str = ""
    rhCustom: str = ""
    rhSeleccion: str = ""
    enIdx: int = 0
    enNombre: str = ""
    enObjetivo: str = ""
    enInstrucciones: str = ""
    enDetalle: str = ""
    enDuracion: str = ""
    enMateriales: str = ""
    enCustom: str = ""
    enSeleccion: str = ""
    rompehielos: dict = {}
    energizante: dict = {}


class EvaluacionesInfo(BaseModel):
    pctDiag: int = 0
    pctDiagnostica: int = 0
    pctForm: int = 0
    pctFormativa: int = 0
    pctSuma: int = 0
    pctSumativa: int = 0
    instDiag: str = ""
    instDiagnostica: str = ""
    instForm: str = ""
    instFormativa: str = ""
    instSuma: str = ""
    instSumativa: str = ""
    instReac: str = ""
    descripcionGeneral: str = ""
    tipoInstrumentoFormativa: str = ""
    instDiagnosticaHeader: str = ""
    instDiagnosticaClave: str = ""
    instFormativaHeader: str = ""
    instFormativaClave: str = ""
    instSumativaHeader: str = ""
    instSumativaClave: str = ""
    notaFormativa: str = ""


class TiempoFila(BaseModel):
    titulo: str = ""
    tiempo: int = 0


class TiempoBloque(BaseModel):
    seccion: str = ""
    filas: list[TiempoFila] = []


class PlaneacionRequest(BaseModel):
    datos: DatosInfo = DatosInfo()
    objetivos: ObjetivosInfo = ObjetivosInfo()
    beneficios: str = ""
    temario: TemarioInfo = TemarioInfo()
    encuadre: EncuadreInfo = EncuadreInfo()
    tecnicas: TecnicasInfo = TecnicasInfo()
    evaluaciones: EvaluacionesInfo = EvaluacionesInfo()
    tiempos: list[TiempoBloque] = []
    expositiva: dict = {}
    demostrativa: dict = {}
    dialogo: dict = {}
    cierre: dict = {}
    materiales: dict = {}
    planeacion_id: Optional[str] = None
    confirm_new_course: bool = False


class ObjetivosRequest(BaseModel):
    general: str
    cognitiva: str
    psicomotriz: str
    afectiva: str


class TokenRequest(BaseModel):
    token: str
