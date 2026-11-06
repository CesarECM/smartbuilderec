import io
import zipfile

from docx import Document
from docx.shared import Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH

_TEAL = RGBColor(0x0F, 0x76, 0x6E)


def _titulo(doc: Document, texto: str, size: int = 15) -> None:
    h = doc.add_heading("", level=1)
    h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = h.add_run(texto)
    r.font.color.rgb = _TEAL
    r.font.size = Pt(size)


def _subtitulo(doc: Document, texto: str) -> None:
    h = doc.add_heading("", level=2)
    r = h.add_run(texto)
    r.font.color.rgb = _TEAL
    r.font.size = Pt(12)


def _docx_bytes(doc: Document) -> bytes:
    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf.read()


# Secciones del "Documento de información general del curso" (EC0366 · E1).
_SECCIONES = [
    ("objetivo_general",        "Objetivo general"),
    ("temario",                 "Temario"),
    ("objetivos_particulares",  "Objetivos particulares"),
    ("introduccion",            "Introducción"),
    ("guia_visual",             "Guía visual"),
    ("metodologia",             "Metodología de trabajo"),
    ("perfil_ingreso",          "Perfil de ingreso"),
    ("requisitos_tecnologicos", "Requisitos tecnológicos"),
    ("requisitos_materiales",   "Requisitos de materiales"),
    ("forma_evaluacion",        "Forma de evaluación"),
]


def _doc_info_general(payload: dict) -> bytes:
    doc = Document()
    _titulo(doc, "Documento de información general del curso")

    sub = doc.add_paragraph()
    sub.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = sub.add_run(payload.get("titulo") or "Curso en línea")
    r.bold = True
    r.font.size = Pt(12)

    dur = doc.add_paragraph()
    dur.alignment = WD_ALIGN_PARAGRAPH.CENTER
    horas = payload.get("duracion_horas") or "—"
    semanas = payload.get("duracion_semanas") or "—"
    dur.add_run(f"Duración: {horas} horas · {semanas} semanas")
    doc.add_paragraph()

    for campo, etiqueta in _SECCIONES:
        _subtitulo(doc, etiqueta)
        doc.add_paragraph(payload.get(campo) or "—")
        doc.add_paragraph()

    return _docx_bytes(doc)


def generar_zip_ec0366(payload: dict) -> bytes:
    """Arma el ZIP con los documentos EC0366 generados (prototipo: información general)."""
    docx_bytes = _doc_info_general(payload)
    titulo = (payload.get("titulo") or "Curso").strip().replace(" ", "_")[:40] or "Curso"
    zip_buffer = io.BytesIO()
    with zipfile.ZipFile(zip_buffer, mode="w", compression=zipfile.ZIP_DEFLATED) as zf:
        zf.writestr(f"Informacion_general_{titulo}.docx", docx_bytes)
    zip_buffer.seek(0)
    return zip_buffer.read()
