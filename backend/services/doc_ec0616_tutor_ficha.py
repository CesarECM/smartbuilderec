# ─── services/doc_ec0616_tutor_ficha.py — Ficha de Registro EC0616 Modo Tutor ──
# Clona la estructura oficial OC0046: tabla header + tabla principal 12×8.

import io
import base64

from docx import Document
from docx.shared import Pt, Inches, Cm
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

_EC = (
    "EC0616: PRESTACIÓN DE SERVICIOS AUXILIARES DE ENFERMERÍA EN CUIDADOS BÁSICOS "
    "Y ORIENTACIÓN A PERSONAS EN UNIDADES DE ATENCIÓN MÉDICA."
)

_RENAP_INTRO = (
    "El Consejo Nacional de Normalización y Certificación de Competencias Laborales (CONOCER) "
    "solicita al candidato la autorización para la publicación de los datos personales a fin de "
    "dar cumplimiento a lo dispuesto en el capítulo séptimo de las Reglas Generales y criterios "
    "para la integración del Sistema Nacional de Competencias, referente al \"Registro Nacional "
    "de Personas Con Competencias Certificadas\" (RENAP) por medio del cual las personas con "
    "competencias certificadas, pueden voluntariamente dar a conocer sus datos personales, para "
    "facilitar su localización, en caso de que organizaciones sindicales, empresas, sector "
    "académico, sector social o público, o alguna otra institución pública o privada, requieran "
    "personal con competencias certificadas en determinada función individual;"
)

_RENAP_CONS = (
    "doy mi consentimiento al CONOCER para que, en términos del artículo 21 de la Ley Federal "
    "de Transparencia y Acceso a la Información Pública Gubernamental, difunda, distribuya y "
    "publique la información contenida en el documento que se inscribe, para los propósitos del "
    "RENAP. Lo anterior, sin perjuicio de que estoy enterado de que en términos del artículo 22, "
    "fracción III de la misma Ley, no es necesario mi consentimiento respecto de información "
    "que se transmita entre sujetos obligados o entre dependencias y entidades, cuando los datos "
    "respectivos se utilicen para el ejercicio de facultades propias de los mismos."
)

_RENAP_NOTA = (
    "Los datos personales recabados serán protegidos y serán incorporados y tratados en el Sistema "
    "de datos personales RENAP con fundamento en las reglas generales y criterios para integración "
    "y operación del Sistema Nacional de Competencias y cuya finalidad es integrar una base de "
    "datos con información sobre las personas que han obtenido uno o más Certificados de "
    "Competencia, con base en Estándares de Competencia inscritos en el Registro Nacional de "
    "Estándares de Competencia, el cual fue registrado en el Listado de sistemas de Datos "
    "Personales ante el Instituto Federal de Acceso a la Información Pública (www.ifai.org.mx) "
    "y podrán ser trasmitidos a sujetos obligados o dependencias y entidades con la finalidad del "
    "uso en facultades propias de las mismas. Además de otras trasmisiones previstas en Ley. La "
    "Unidad Administrativa responsable del Sistema es el Consejo Nacional de Normalización y "
    "Certificación de Competencias Laborales."
)

# Anchos de columnas tabla principal (8 cols, total ~18 cm)
_T1_W = [5.5, 2.5, 2.0, 2.0, 1.5, 1.5, 1.5, 1.5]


# ── Utilidades internas ───────────────────────────────────────────────────────

def _docx_bytes(doc: Document) -> bytes:
    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf.read()


def _chk(val: bool) -> str:
    return "(X)" if val else "(   )"


def _foto_stream(b64: str | None):
    if not b64:
        return None
    try:
        data = b64.split(",", 1)[-1] if "," in b64 else b64
        return io.BytesIO(base64.b64decode(data))
    except Exception:
        return None


def _set_tbl_grid(table, widths_cm: list) -> None:
    """Define los anchos de columna en el w:tblGrid de la tabla."""
    tbl = table._tbl
    tblGrid = tbl.find(qn("w:tblGrid"))
    if tblGrid is None:
        tblGrid = OxmlElement("w:tblGrid")
        tbl.insert(0, tblGrid)
    for old in tblGrid.findall(qn("w:gridCol")):
        tblGrid.remove(old)
    for w in widths_cm:
        gc = OxmlElement("w:gridCol")
        gc.set(qn("w:w"), str(int(Cm(w).pt * 20)))
        tblGrid.append(gc)


def _w(cell, text: str, bold: bool = False, size: int = 9, italic: bool = False) -> None:
    """Escribe en el párrafo inicial de la celda."""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after  = Pt(2)
    p.paragraph_format.space_before = Pt(2)
    r = p.add_run(text)
    r.font.size = Pt(size)
    r.bold   = bold
    r.italic = italic


def _wa(cell, text: str, bold: bool = False, size: int = 9, italic: bool = False) -> None:
    """Agrega un párrafo adicional a la celda."""
    p = cell.add_paragraph()
    p.paragraph_format.space_after  = Pt(2)
    p.paragraph_format.space_before = Pt(0)
    r = p.add_run(text)
    r.font.size = Pt(size)
    r.bold   = bold
    r.italic = italic


# ── Sección Información Confidencial ─────────────────────────────────────────

def _gen_confidencial(doc: Document, ficha: dict, conf: dict) -> None:
    h = doc.add_heading("", level=2)
    h.add_run("Información Confidencial:").font.size = Pt(11)

    def _row(text: str, italic: bool = False):
        p = doc.add_paragraph(text)
        p.runs[0].font.size = Pt(9)
        p.runs[0].italic = italic
        p.paragraph_format.space_after = Pt(3)

    p_inst = doc.add_paragraph('Marca con una "x" en el recuadro de la respuesta elegida.')
    p_inst.runs[0].font.size = Pt(9)

    lee      = conf.get("leer_escribir")    == "si"
    estudios = conf.get("tiene_estudios")   == "si"
    _row(
        f"¿Sabe Leer y Escribir? {_chk(lee)} Sí {_chk(not lee)} No     "
        f"¿Cuenta con Estudios? {_chk(estudios)} Sí {_chk(not estudios)} No     "
        f"Cuáles: {conf.get('estudios_cuales') or '—'}     "
        f"Último grado: {conf.get('ultimo_grado') or '—'}"
    )

    disc  = conf.get("tiene_discapacidad") == "si"
    tipos = conf.get("discapacidad_tipo") or []
    _row(f"¿Tiene algún tipo de Discapacidad? {_chk(disc)} Sí {_chk(not disc)} No")
    _row("Cual: " + "  ".join(
        f"{_chk(t in tipos)} {t.capitalize()}"
        for t in ["motriz", "visual", "auditiva", "lenguaje", "intelectual", "otras"]
    ))
    _row(f"¿Qué Idioma(s) o lengua(s) habla? {conf.get('idiomas') or '—'}")

    trabaja = conf.get("trabaja_actualmente") == "si"
    _row(
        f"¿Trabaja Actualmente? {_chk(trabaja)} Sí {_chk(not trabaja)} No     "
        f"Puesto de Trabajo: {conf.get('puesto_trabajo') or '—'}"
    )
    if trabaja:
        _row(
            f"Empresa/Institución: {conf.get('empresa_trabajo') or '—'}     "
            f"Tel: {conf.get('telefono_trabajo') or '—'}"
        )

    _row("Experiencia Laboral:")
    doc.paragraphs[-1].runs[0].bold = True
    for n in range(1, 4):
        _row(
            f"  {n}. {conf.get(f'exp{n}_empresa') or '—'} | "
            f"{conf.get(f'exp{n}_periodo') or '—'} | "
            f"{conf.get(f'exp{n}_actividades') or '—'}"
        )

    _row(f"Observaciones: {conf.get('observaciones') or '—'}")

    cert = conf.get("tiene_certificacion") == "si"
    _row(
        f"¿Cuenta con alguna Certificación? {_chk(cert)} Sí {_chk(not cert)} No     "
        f"Cuáles: {conf.get('certificacion_cuales') or '—'}"
    )

    doc.add_paragraph()
    p_decl = doc.add_paragraph(
        "DECLARO BAJO PROTESTA DE DECIR VERDAD QUE LOS DATOS ASENTADOS EN ESTE "
        "DOCUMENTO SON CORRECTOS Y VERDADEROS."
    )
    p_decl.runs[0].bold = True
    p_decl.runs[0].font.size = Pt(9)
    doc.add_paragraph()
    doc.add_paragraph("Atentamente").runs[0].font.size = Pt(9)
    doc.add_paragraph()
    nombre_c = f"{ficha.get('nombre_candidato', '')} {ficha.get('apellidos_candidato', '')}".strip()
    doc.add_paragraph(f"({nombre_c or 'Nombre y firma del Candidato'})").runs[0].font.size = Pt(9)
    doc.add_paragraph()
    nota_p = doc.add_paragraph(
        "Nota: Esta información se debe mantener en el portafolio de evidencias del candidato"
    )
    nota_p.runs[0].font.size = Pt(8)
    nota_p.runs[0].italic = True


# ── Función principal ─────────────────────────────────────────────────────────

def generar_ficha(ficha: dict, conf: dict) -> bytes:
    doc = Document()
    sec = doc.sections[0]
    sec.left_margin = sec.right_margin = sec.top_margin = sec.bottom_margin = Cm(1.2)

    # ── Tabla 0: Encabezado (Estándar + Fecha) ────────────────────────────────
    t0 = doc.add_table(rows=1, cols=5)
    t0.style = "Table Grid"
    _set_tbl_grid(t0, [3.3, 8.5, 0.5, 2.5, 3.2])
    c = t0.rows[0].cells
    _w(c[0], "Estándar de Competencia:", bold=True, size=8)
    _w(c[1], _EC, size=8)
    _w(c[3], "Fecha:", bold=True, size=8)
    _w(c[4], ficha.get("fecha_evaluacion") or "—", size=8)

    # ── Párrafo "Datos Personales:" ───────────────────────────────────────────
    p_dp = doc.add_paragraph()
    r_dp = p_dp.add_run("Datos Personales:")
    r_dp.bold = True
    r_dp.font.size = Pt(10)
    p_dp.paragraph_format.space_before = Pt(4)
    p_dp.paragraph_format.space_after  = Pt(2)

    # ── Tabla 1: Principal (12 filas × 8 cols) ────────────────────────────────
    t1 = doc.add_table(rows=12, cols=8)
    t1.style = "Table Grid"
    _set_tbl_grid(t1, _T1_W)

    # R0 — Intro CONOCER (ancho completo)
    t1.cell(0, 0).merge(t1.cell(0, 7))
    _w(t1.cell(0, 0), _RENAP_INTRO, size=8)

    # R1 — separador vacío
    t1.cell(1, 1).merge(t1.cell(1, 7))

    # R2-R10 col 0 — Consentimiento RENAP (fusión vertical)
    t1.cell(2, 0).merge(t1.cell(10, 0))
    cons = ficha.get("consentimiento_renap", "no") == "si"
    _w(t1.cell(2, 0), f"SI {_chk(cons)}  NO {_chk(not cons)}", bold=True, size=9)
    _wa(t1.cell(2, 0), _RENAP_CONS, size=8)
    _wa(t1.cell(2, 0), "")
    _wa(t1.cell(2, 0), "_____________________________", size=9)
    _wa(t1.cell(2, 0), "Nombre y Firma", size=8)

    # R2-R6 col 1 — Foto (fusión vertical)
    t1.cell(2, 1).merge(t1.cell(6, 1))
    foto_cell = t1.cell(2, 1)
    _w(foto_cell, "Fotografía Digital\n(Reciente)", size=8, bold=True)
    foto = _foto_stream(ficha.get("foto_base64"))
    if foto:
        p_foto = foto_cell.add_paragraph()
        p_foto.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_foto.paragraph_format.space_after = Pt(2)
        p_foto.add_run().add_picture(foto, width=Inches(0.9), height=Inches(1.2))

    # R2 — Nombre Completo
    t1.cell(2, 2).merge(t1.cell(2, 3))
    _w(t1.cell(2, 2), "Nombre Completo:", bold=True, size=9)
    t1.cell(2, 4).merge(t1.cell(2, 7))
    nombre = f"{ficha.get('nombre_candidato', '')} {ficha.get('apellidos_candidato', '')}".strip()
    _w(t1.cell(2, 4), nombre or "—", size=9)

    # R3 — Lugar de Nacimiento
    t1.cell(3, 2).merge(t1.cell(3, 3))
    _w(t1.cell(3, 2), "Lugar de Nacimiento:", bold=True, size=9)
    t1.cell(3, 4).merge(t1.cell(3, 7))
    _w(t1.cell(3, 4), ficha.get("lugar_nacimiento") or "—", size=9)

    # R4 — Nacionalidad
    t1.cell(4, 2).merge(t1.cell(4, 3))
    _w(t1.cell(4, 2), "Nacionalidad:", bold=True, size=9)
    t1.cell(4, 4).merge(t1.cell(4, 7))
    _w(t1.cell(4, 4), ficha.get("nacionalidad") or "Mexicana", size=9)

    # R5 — CURP
    t1.cell(5, 2).merge(t1.cell(5, 3))
    _w(t1.cell(5, 2), "CURP:", bold=True, size=9)
    t1.cell(5, 4).merge(t1.cell(5, 7))
    _w(t1.cell(5, 4), ficha.get("curp") or "—", size=9)

    # R6 — Género + Fecha de Nacimiento
    t1.cell(6, 2).merge(t1.cell(6, 3))
    _w(t1.cell(6, 2), "Género:", bold=True, size=9)
    genero = ficha.get("genero", "")
    _w(t1.cell(6, 4), f"{_chk(genero == 'H')} H   {_chk(genero == 'M')} M", size=9)
    t1.cell(6, 5).merge(t1.cell(6, 6))
    _w(t1.cell(6, 5), "Fecha de Nacimiento:", bold=True, size=9)
    _w(t1.cell(6, 7), ficha.get("fecha_nacimiento") or "—", size=9)

    # R7 — Header Domicilio
    t1.cell(7, 1).merge(t1.cell(7, 7))
    _w(t1.cell(7, 1), "Domicilio Particular", bold=True, size=9)

    # R8 — Calle / Núm / CP / Colonia
    t1.cell(8, 1).merge(t1.cell(8, 7))
    _w(t1.cell(8, 1),
       f"Calle: {ficha.get('domicilio_calle') or '—'}   "
       f"Núm: {ficha.get('domicilio_numero') or '—'}   "
       f"C.P.: {ficha.get('domicilio_cp') or '—'}   "
       f"Colonia: {ficha.get('domicilio_colonia') or '—'}",
       size=9)

    # R9 — Municipio / Entidad
    t1.cell(9, 1).merge(t1.cell(9, 2))
    t1.cell(9, 3).merge(t1.cell(9, 5))
    t1.cell(9, 6).merge(t1.cell(9, 7))
    _w(t1.cell(9, 1), f"Municipio: {ficha.get('domicilio_ciudad') or '—'}", size=9)
    _w(t1.cell(9, 3), f"Entidad Federativa: {ficha.get('domicilio_entidad') or '—'}", size=9)

    # R10 — E-mail / Teléfono / Celular
    t1.cell(10, 1).merge(t1.cell(10, 2))
    t1.cell(10, 3).merge(t1.cell(10, 5))
    t1.cell(10, 6).merge(t1.cell(10, 7))
    _w(t1.cell(10, 1), f"E-mail: {ficha.get('email') or '—'}", size=9)
    _w(t1.cell(10, 3), f"Teléfono: {ficha.get('telefono') or '—'}", size=9)

    # R11 — Nota RENAP (ancho completo)
    t1.cell(11, 0).merge(t1.cell(11, 7))
    _w(t1.cell(11, 0), _RENAP_NOTA, size=7, italic=True)

    # ── Información Confidencial (página 2) ───────────────────────────────────
    doc.add_page_break()
    _gen_confidencial(doc, ficha, conf)

    return _docx_bytes(doc)
