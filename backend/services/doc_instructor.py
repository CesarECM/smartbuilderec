import re

from docx import Document

from services.doc_helpers import tabla_encabezado, _docx_bytes, _titulo


def _tabla_clave_opcion_multiple(doc, clave_texto: str):
    pares = re.findall(r'(\d+)\.\s*([A-Da-d])', clave_texto)
    if not pares:
        doc.add_paragraph(clave_texto or "—")
        return
    t = doc.add_table(rows=len(pares) + 1, cols=3)
    t.style = "Table Grid"
    for j, enc in enumerate(["Reactivo", "Respuesta correcta", "Valor"]):
        t.rows[0].cells[j].paragraphs[0].add_run(enc).bold = True
    for i, (num, resp) in enumerate(pares, 1):
        t.rows[i].cells[0].text = num
        t.rows[i].cells[1].text = resp.upper()
        t.rows[i].cells[2].text = "20%"


def generar_manual_instructor(data) -> bytes:
    doc = Document()
    _titulo(doc, "MANUAL DEL INSTRUCTOR", "CLAVES Y CRITERIOS DE EVALUACIÓN")
    tabla_encabezado(doc, data.datos, sin_participante=True)

    ev = data.evaluaciones

    # ── Evaluación Diagnóstica ──────────────────────────────────────────────
    doc.add_heading("EVALUACIÓN DIAGNÓSTICA", level=2)
    header_d = (getattr(ev, "instDiagnosticaHeader", "") or "").strip()
    if header_d:
        p = doc.add_paragraph()
        p.add_run("Instrucciones entregadas al participante: ").bold = True
        p.add_run(header_d)
    clave_d = (getattr(ev, "instDiagnosticaClave", "") or "").strip()
    doc.add_heading("Clave de respuestas", level=3)
    _tabla_clave_opcion_multiple(doc, clave_d)
    doc.add_paragraph()

    # ── Evaluación Formativa ────────────────────────────────────────────────
    doc.add_heading("EVALUACIÓN FORMATIVA", level=2)
    header_f = (getattr(ev, "instFormativaHeader", "") or "").strip()
    if header_f:
        p = doc.add_paragraph()
        p.add_run("Instrucciones entregadas al participante: ").bold = True
        p.add_run(header_f)
    nota_f = (getattr(ev, "notaFormativa", "") or "").strip()
    if nota_f:
        p = doc.add_paragraph()
        p.add_run("Distribución: ").bold = True
        p.add_run(nota_f)
    clave_f = (getattr(ev, "instFormativaClave", "") or "").strip()
    doc.add_heading("Clave / Criterios de aprobación", level=3)
    doc.add_paragraph(clave_f or "Ver criterios en el instrumento formativo.")
    doc.add_paragraph()

    # ── Evaluación Sumativa ─────────────────────────────────────────────────
    doc.add_heading("EVALUACIÓN SUMATIVA", level=2)
    header_s = (getattr(ev, "instSumativaHeader", "") or "").strip()
    if header_s:
        p = doc.add_paragraph()
        p.add_run("Instrucciones entregadas al participante: ").bold = True
        p.add_run(header_s)
    clave_s = (getattr(ev, "instSumativaClave", "") or "").strip()
    doc.add_heading("Clave de respuestas", level=3)
    _tabla_clave_opcion_multiple(doc, clave_s)

    return _docx_bytes(doc)
