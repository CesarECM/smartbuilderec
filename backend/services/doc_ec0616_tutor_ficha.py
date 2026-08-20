# ─── services/doc_ec0616_tutor_ficha.py — Ficha de Registro EC0616 Modo Tutor ──
# Clona la estructura y formato oficial OC0046: tabla header + tabla 12×8.

import io
import base64

from docx import Document
from docx.shared import Pt, Inches, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

# Fondos del original
_F_GRIS_OSC = "BFBFBF"   # labels tabla header + labels tabla 1
_F_GRIS_CLR = "F2F2F2"   # filas RENAP (intro, consent, nota pie)

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
    " (   ) doy mi consentimiento al CONOCER para que, en términos del artículo 21 de la Ley "
    "Federal de Transparencia y Acceso a la Información Pública Gubernamental, difunda, "
    "distribuya y publique la información contenida en el documento que se inscribe, para los "
    "propósitos del RENAP. Lo anterior, sin perjuicio de que estoy enterado de que en términos "
    "del artículo 22, fracción III de la misma Ley, no es necesario mi consentimiento respecto "
    "de información que se transmita entre sujetos obligados o entre dependencias y entidades, "
    "cuando los datos respectivos se utilicen para el ejercicio de facultades propias de los mismos."
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

# Anchos columnas tabla principal (8 cols, total ~18 cm con márgenes 1.2 cm)
_T1_W = [5.5, 2.5, 2.0, 2.0, 1.5, 1.5, 1.5, 1.5]


# ── Utilidades de formato ─────────────────────────────────────────────────────

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


def _shd(cell, fill: str) -> None:
    """Aplica fondo de color a una celda."""
    tcPr = cell._tc.get_or_add_tcPr()
    for old in tcPr.findall(qn("w:shd")):
        tcPr.remove(old)
    s = OxmlElement("w:shd")
    s.set(qn("w:val"),   "clear")
    s.set(qn("w:color"), "auto")
    s.set(qn("w:fill"),  fill)
    tcPr.append(s)


def _vcenter(cell) -> None:
    """Alineación vertical centrada en la celda."""
    tcPr = cell._tc.get_or_add_tcPr()
    for old in tcPr.findall(qn("w:vAlign")):
        tcPr.remove(old)
    v = OxmlElement("w:vAlign")
    v.set(qn("w:val"), "center")
    tcPr.append(v)


def _run(para, text: str, bold: bool = False, size: int = 9,
         italic: bool = False, font: str | None = None) -> None:
    r = para.add_run(text)
    r.font.size  = Pt(size)
    r.bold       = bold
    r.italic     = italic
    if font:
        r.font.name = font
        r._element.get_or_add_rPr().get_or_add_rFonts().set(qn("w:cs"), font)


def _w(cell, text: str, bold: bool = False, size: int = 9,
       align=None, italic: bool = False, font: str | None = None) -> None:
    """Escribe en el párrafo inicial de la celda."""
    p = cell.paragraphs[0]
    p.paragraph_format.space_after  = Pt(0)
    p.paragraph_format.space_before = Pt(0)
    if align is not None:
        p.alignment = align
    _run(p, text, bold=bold, size=size, italic=italic, font=font)


def _wa(cell, text: str, bold: bool = False, size: int = 9,
        align=None, italic: bool = False, font: str | None = None) -> None:
    """Agrega un párrafo adicional a la celda."""
    p = cell.add_paragraph()
    p.paragraph_format.space_after  = Pt(0)
    p.paragraph_format.space_before = Pt(0)
    if align is not None:
        p.alignment = align
    _run(p, text, bold=bold, size=size, italic=italic, font=font)


# ── Sección Información Confidencial ─────────────────────────────────────────

def _gen_confidencial(doc: Document, ficha: dict, conf: dict) -> None:
    h = doc.add_heading("", level=2)
    h.add_run("Información Confidencial:").font.size = Pt(11)

    def _row(text: str, bold: bool = False):
        p = doc.add_paragraph(text)
        p.runs[0].font.size = Pt(9)
        p.runs[0].bold = bold
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
    _row("Experiencia Laboral:", bold=True)
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

    # ── Tabla 0: Encabezado (Estándar de Competencia + Fecha) ─────────────────
    t0 = doc.add_table(rows=1, cols=5)
    t0.style = "Table Grid"
    _set_tbl_grid(t0, [3.3, 8.5, 0.5, 2.5, 3.2])
    c = t0.rows[0].cells

    # C0 — label gris, texto RIGHT
    _shd(c[0], _F_GRIS_OSC)
    _w(c[0], "Estándar de Competencia:", bold=True, align=WD_ALIGN_PARAGRAPH.RIGHT)

    # C1 — EC name, 10pt, no negrita
    _w(c[1], _EC, size=10)

    # C2 — separador vacío

    # C3 — "Fecha:" gris, RIGHT
    _shd(c[3], _F_GRIS_OSC)
    _w(c[3], "Fecha:", bold=True, align=WD_ALIGN_PARAGRAPH.RIGHT)

    # C4 — valor fecha
    _w(c[4], ficha.get("fecha_evaluacion") or "—")

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

    # ── R0: Intro CONOCER — gris claro, 9pt, JUSTIFY, valign CENTER ──────────
    t1.cell(0, 0).merge(t1.cell(0, 7))
    _shd(t1.cell(0, 0), _F_GRIS_CLR)
    _vcenter(t1.cell(0, 0))
    _w(t1.cell(0, 0), _RENAP_INTRO, size=9, align=WD_ALIGN_PARAGRAPH.JUSTIFY)

    # ── R1: separador vacío ───────────────────────────────────────────────────
    t1.cell(1, 1).merge(t1.cell(1, 7))

    # ── R2-R10 C0: Consentimiento RENAP (fusión vertical) ────────────────────
    # El original repite el texto en cada fila (sin fusión real). Usamos fusión
    # vertical para mantener un solo bloque limpio visualmente.
    t1.cell(2, 0).merge(t1.cell(10, 0))
    cc = t1.cell(2, 0)
    _shd(cc, _F_GRIS_CLR)

    # Párrafo 1: "SI (X) NO (   ) doy mi consentimiento..." — JUSTIFY
    # "SI" y "NO" en negrita, resto en normal, todo 8pt
    cons = ficha.get("consentimiento_renap", "no") == "si"
    p0 = cc.paragraphs[0]
    p0.alignment = WD_ALIGN_PARAGRAPH.JUSTIFY
    p0.paragraph_format.space_after = Pt(0)
    _run(p0, "SI ",  bold=True,  size=8)
    _run(p0, _chk(cons),  bold=False, size=8)
    _run(p0, "  NO", bold=True,  size=8)
    _run(p0, _RENAP_CONS, bold=False, size=8)

    # Párrafo 2: línea firma — CENTER, 8pt
    _wa(cc, "_____________________________", size=8, align=WD_ALIGN_PARAGRAPH.CENTER)
    _wa(cc, "Nombre y Firma",               size=8, align=WD_ALIGN_PARAGRAPH.CENTER)

    # ── R2-R6 C1: Celda fotografía (fusión vertical) ─────────────────────────
    t1.cell(2, 1).merge(t1.cell(6, 1))
    fc = t1.cell(2, 1)
    _shd(fc, _F_GRIS_OSC)
    _vcenter(fc)
    # "Fotografía Digital " bold + "(Reciente)" no bold — 10pt, CENTER
    p_foto_label = fc.paragraphs[0]
    p_foto_label.alignment = WD_ALIGN_PARAGRAPH.CENTER
    p_foto_label.paragraph_format.space_after = Pt(4)
    _run(p_foto_label, "Fotografía Digital ", bold=True,  size=10)
    _run(p_foto_label, "(Reciente)",          bold=False, size=10)
    # Foto del candidato (si existe)
    foto = _foto_stream(ficha.get("foto_base64"))
    if foto:
        p_img = fc.add_paragraph()
        p_img.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_img.paragraph_format.space_after = Pt(0)
        p_img.add_run().add_picture(foto, width=Inches(0.9), height=Inches(1.2))

    # ── Helper local: celda label gris (C2-C3) ───────────────────────────────
    def _label(row, text, align=WD_ALIGN_PARAGRAPH.RIGHT):
        t1.cell(row, 2).merge(t1.cell(row, 3))
        lc = t1.cell(row, 2)
        _shd(lc, _F_GRIS_OSC)
        _vcenter(lc)
        _w(lc, text, bold=True, size=10, align=align)

    def _value(row):
        t1.cell(row, 4).merge(t1.cell(row, 7))
        vc = t1.cell(row, 4)
        _vcenter(vc)
        return vc

    # ── R2: Nombre Completo ───────────────────────────────────────────────────
    _label(2, "Nombre Completo:")
    nombre = f"{ficha.get('nombre_candidato', '')} {ficha.get('apellidos_candidato', '')}".strip()
    _w(_value(2), nombre or "—", size=10)

    # ── R3: Lugar de Nacimiento ───────────────────────────────────────────────
    _label(3, "Lugar de Nacimiento:")
    _w(_value(3), ficha.get("lugar_nacimiento") or "—", size=10)

    # ── R4: Nacionalidad ──────────────────────────────────────────────────────
    _label(4, "Nacionalidad:")
    _w(_value(4), ficha.get("nacionalidad") or "Mexicana", size=10)

    # ── R5: CURP ─────────────────────────────────────────────────────────────
    _label(5, "CURP:")
    _w(_value(5), ficha.get("curp") or "—", size=10)

    # ── R6: Género + Fecha de Nacimiento ──────────────────────────────────────
    _label(6, "Género:")
    genero = ficha.get("genero", "")
    gc = t1.cell(6, 4)
    _vcenter(gc)
    _w(gc, f"{_chk(genero == 'H')} H   {_chk(genero == 'M')} M", size=10)

    t1.cell(6, 5).merge(t1.cell(6, 6))
    fc6 = t1.cell(6, 5)
    _shd(fc6, _F_GRIS_OSC)
    _vcenter(fc6)
    _w(fc6, "Fecha de Nacimiento:", bold=True, size=10, align=WD_ALIGN_PARAGRAPH.CENTER)

    vc7 = t1.cell(6, 7)
    _vcenter(vc7)
    _w(vc7, ficha.get("fecha_nacimiento") or "—", size=10)

    # ── R7: Header Domicilio ──────────────────────────────────────────────────
    t1.cell(7, 1).merge(t1.cell(7, 7))
    dc = t1.cell(7, 1)
    _shd(dc, _F_GRIS_OSC)
    _vcenter(dc)
    _w(dc, "Domicilio Particular", bold=True, size=10, align=WD_ALIGN_PARAGRAPH.CENTER)

    # ── R8: Calle / Núm / CP / Colonia ───────────────────────────────────────
    t1.cell(8, 1).merge(t1.cell(8, 7))
    _vcenter(t1.cell(8, 1))
    _w(t1.cell(8, 1),
       f"Calle: {ficha.get('domicilio_calle') or '—'}   "
       f"Núm: {ficha.get('domicilio_numero') or '—'}   "
       f"C.P.: {ficha.get('domicilio_cp') or '—'}   "
       f"Colonia: {ficha.get('domicilio_colonia') or '—'}",
       size=10)

    # ── R9: Municipio / Entidad ───────────────────────────────────────────────
    t1.cell(9, 1).merge(t1.cell(9, 2))
    t1.cell(9, 3).merge(t1.cell(9, 5))
    t1.cell(9, 6).merge(t1.cell(9, 7))
    _vcenter(t1.cell(9, 1))
    _vcenter(t1.cell(9, 3))
    _w(t1.cell(9, 1), f"Municipio: {ficha.get('domicilio_ciudad') or '—'}",       size=10)
    _w(t1.cell(9, 3), f"Entidad Federativa: {ficha.get('domicilio_entidad') or '—'}", size=10)

    # ── R10: E-mail / Teléfono / Celular (labels grises + valores) ───────────
    t1.cell(10, 1).merge(t1.cell(10, 2))
    t1.cell(10, 3).merge(t1.cell(10, 5))
    t1.cell(10, 6).merge(t1.cell(10, 7))

    ec = t1.cell(10, 1)
    _shd(ec, _F_GRIS_OSC)
    _vcenter(ec)
    _w(ec, f"E-mail: {ficha.get('email') or '—'}", bold=True, size=10, align=WD_ALIGN_PARAGRAPH.CENTER)

    tc = t1.cell(10, 3)
    _shd(tc, _F_GRIS_OSC)
    _vcenter(tc)
    _w(tc, f"Teléfono: {ficha.get('telefono') or '—'}", bold=True, size=10, align=WD_ALIGN_PARAGRAPH.CENTER)

    cc6 = t1.cell(10, 6)
    _shd(cc6, _F_GRIS_OSC)
    _vcenter(cc6)
    _w(cc6, "Teléfono Celular:", bold=True, size=10, align=WD_ALIGN_PARAGRAPH.CENTER)

    # ── R11: Nota RENAP pie — gris claro, Arial 8pt, sin itálica ─────────────
    t1.cell(11, 0).merge(t1.cell(11, 7))
    nc = t1.cell(11, 0)
    _shd(nc, _F_GRIS_CLR)
    _w(nc, _RENAP_NOTA, size=8, italic=False, font="Arial")

    # ── Información Confidencial (página 2) ───────────────────────────────────
    doc.add_page_break()
    _gen_confidencial(doc, ficha, conf)

    return _docx_bytes(doc)
