# ─── services/doc_ec0616_tutor_ficha.py — Ficha de Registro EC0616 Modo Tutor ──

import io
import base64

from docx import Document
from docx.shared import Pt, Inches, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.oxml.ns import qn
from docx.oxml import OxmlElement

_VERDE = RGBColor(0x06, 0x5F, 0x46)

_EC = (
    "EC0616: PRESTACIÓN DE SERVICIOS AUXILIARES DE ENFERMERÍA EN CUIDADOS BÁSICOS "
    "Y ORIENTACIÓN A PERSONAS EN UNIDADES DE ATENCIÓN MÉDICA."
)

_RENAP_INTRO = (
    "El Consejo Nacional de Normalización y Certificación de Competencias Laborales (CONOCER) "
    "solicita al candidato la autorización para la publicación de los datos personales a fin de "
    "dar cumplimiento a lo dispuesto en el capítulo séptimo de las Reglas Generales y criterios "
    "para la integración del Sistema Nacional de Competencias, referente al \"Registro Nacional "
    "de Personas Con Competencias Certificadas\" (RENAP)(1) por medio del cual las personas con "
    "competencias certificadas, pueden voluntariamente dar a conocer sus datos personales, para "
    "facilitar su localización, en caso de que organizaciones sindicales, empresas, sector "
    "académico, sector social o público, o alguna otra institución pública o privada, requieran "
    "personal con competencias certificadas en determinada función individual;"
)

_RENAP_CONS = (
    "doy mi consentimiento al CONOCER para que, en términos del artículo 21(2) de la Ley Federal "
    "de Transparencia y Acceso a la Información Pública Gubernamental, difunda, distribuya y "
    "publique la información contenida en el documento que se inscribe, para los propósitos del "
    "RENAP. Lo anterior, sin perjuicio de que estoy enterado de que en términos del artículo 22, "
    "fracción III(3) de la misma Ley, no es necesario mi consentimiento respecto de información "
    "que se transmita entre sujetos obligados o entre dependencias y entidades, cuando los datos "
    "respectivos se utilicen para el ejercicio de facultades propias de los mismos."
)

_RENAP_NOTA = (
    "Los datos personales recabados serán protegidos y serán incorporados y tratados en el Sistema "
    "de datos personales RENAP con fundamento en las reglas generales y criterios para integración "
    "y operación del Sistema Nacional de Competencias y cuya finalidad es integrar una base de datos "
    "con información sobre las personas que han obtenido uno o más Certificados de Competencia, con "
    "base en Estándares de Competencia inscritos en el Registro Nacional de Estándares de "
    "Competencia, el cual fue registrado en el Listado de sistemas de Datos Personales ante el "
    "Instituto Federal de Acceso a la Información Pública (www.ifai.org.mx) y podrán ser "
    "trasmitidos a sujetos obligados o dependencias y entidades con la finalidad del uso en "
    "facultades propias de las mismas. Además de otras trasmisiones previstas en Ley. La Unidad "
    "Administrativa responsable del Sistema es el Consejo Nacional de Normalización y Certificación "
    "de Competencias Laborales."
)


# ── Utilidades ────────────────────────────────────────────────────────────────

def _docx_bytes(doc: Document) -> bytes:
    buf = io.BytesIO()
    doc.save(buf)
    buf.seek(0)
    return buf.read()


def _titulo(doc: Document, texto: str, size: int = 12) -> None:
    h = doc.add_heading("", level=1)
    h.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r = h.add_run(texto)
    r.font.color.rgb = _VERDE
    r.font.size = Pt(size)


def _foto_stream(b64: str | None):
    if not b64:
        return None
    try:
        data = b64.split(",", 1)[-1] if "," in b64 else b64
        return io.BytesIO(base64.b64decode(data))
    except Exception:
        return None


def _cell_p(cell, text: str = "", bold: bool = False, size: int = 9, space_after: int = 2):
    p = cell.add_paragraph()
    p.paragraph_format.space_after = Pt(space_after)
    if text:
        r = p.add_run(text)
        r.font.size = Pt(size)
        r.bold = bold
    return p


def _campo(cell, label: str, value, size: int = 9) -> None:
    p = cell.add_paragraph()
    p.paragraph_format.space_after = Pt(2)
    lb = p.add_run(f"{label}: ")
    lb.font.size = Pt(size)
    lb.bold = True
    vr = p.add_run(str(value) if value else "—")
    vr.font.size = Pt(size)


def _chk(val: bool) -> str:
    return "(X)" if val else "( )"


def _set_cell_w(cell, cm: float) -> None:
    tc = cell._tc
    tcPr = tc.get_or_add_tcPr()
    for old in tcPr.findall(qn("w:tcW")):
        tcPr.remove(old)
    tcW = OxmlElement("w:tcW")
    tcW.set(qn("w:w"), str(int(Cm(cm).pt * 20)))
    tcW.set(qn("w:type"), "dxa")
    tcPr.append(tcW)


# ── Sección Información Confidencial ─────────────────────────────────────────

def _gen_confidencial(doc: Document, ficha: dict, conf: dict) -> None:
    _titulo(doc, "Información Confidencial:", size=11)
    def _row(text: str):
        p = doc.add_paragraph(text)
        p.runs[0].font.size = Pt(9)
        p.paragraph_format.space_after = Pt(3)

    doc.add_paragraph("Marca con una \"x\" en el recuadro de la respuesta elegida.").runs[0].font.size = Pt(9)

    lee     = conf.get("leer_escribir")     == "si"
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
            f"Dirección: {conf.get('direccion_trabajo') or '—'}     "
            f"Tel: {conf.get('telefono_trabajo') or '—'}"
        )

    doc.add_paragraph("Experiencia Laboral:").runs[0].font.size = Pt(9)
    for n in range(1, 4):
        emp = conf.get(f"exp{n}_empresa")
        per = conf.get(f"exp{n}_periodo")
        act = conf.get(f"exp{n}_actividades")
        _row(f"  {n}. {emp or '—'} | {per or '—'} | {act or '—'}")

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
    sec.left_margin  = Cm(2)
    sec.right_margin = Cm(2)
    sec.top_margin   = Cm(2)
    sec.bottom_margin = Cm(2)

    # ── Encabezado ──
    _titulo(doc, "FICHA DE REGISTRO")
    p_ec = doc.add_paragraph()
    p_ec.paragraph_format.space_after = Pt(4)
    p_ec.add_run(f"Estándar de Competencia: {_EC}").font.size = Pt(8)
    p_ec.add_run(f"   Fecha: {ficha.get('fecha_evaluacion', '')}").font.size = Pt(8)

    p_dp = doc.add_paragraph("Datos Personales:")
    p_dp.runs[0].bold = True
    p_dp.runs[0].font.size = Pt(10)

    # ── Texto introductorio RENAP ──
    p_intro = doc.add_paragraph(_RENAP_INTRO)
    p_intro.runs[0].font.size = Pt(8)
    p_intro.paragraph_format.space_after = Pt(4)

    # ── Tabla 2 columnas ──────────────────────────────────────────────────────
    table = doc.add_table(rows=1, cols=2)
    _set_cell_w(table.cell(0, 0), 10.0)
    _set_cell_w(table.cell(0, 1),  7.0)

    # Celda izquierda: consentimiento RENAP
    left = table.cell(0, 0)
    cons = ficha.get("consentimiento_renap", "no") == "si"
    p_left = left.paragraphs[0]
    p_left.paragraph_format.space_after = Pt(12)
    r_si = p_left.add_run(f"SI {_chk(cons)}  NO {_chk(not cons)}  ")
    r_si.font.size = Pt(9)
    r_si.bold = True
    p_left.add_run(_RENAP_CONS).font.size = Pt(8)

    _cell_p(left, "_____________________________", size=9, space_after=0)
    _cell_p(left, "Nombre y Firma", size=8)

    # Celda derecha: datos personales + foto
    right = table.cell(0, 1)
    _campo(right, "Nombre(s)",       ficha.get("nombre_candidato"))
    _campo(right, "Primer Apellido", ficha.get("apellido_paterno"))
    _campo(right, "Segundo Apellido",ficha.get("apellido_materno"))

    foto = _foto_stream(ficha.get("foto_base64"))
    if foto:
        p_foto = right.add_paragraph()
        p_foto.paragraph_format.space_after = Pt(4)
        p_foto.add_run().add_picture(foto, width=Inches(1.0), height=Inches(1.25))

    _campo(right, "Lugar de Nacimiento", ficha.get("lugar_nacimiento"))
    _campo(right, "Nacionalidad",        ficha.get("nacionalidad"))
    _campo(right, "CURP",               ficha.get("curp"))

    genero = ficha.get("genero", "")
    p_gen = right.add_paragraph()
    p_gen.paragraph_format.space_after = Pt(2)
    p_gen.add_run(
        f"Género: {_chk(genero == 'H')} Hombre  {_chk(genero == 'M')} Mujer     "
        f"Fecha de Nacimiento: {ficha.get('fecha_nacimiento', '')}"
    ).font.size = Pt(9)

    p_dom_h = right.add_paragraph("Domicilio Particular")
    p_dom_h.runs[0].bold = True
    p_dom_h.runs[0].font.size = Pt(9)
    p_dom_h.paragraph_format.space_after = Pt(2)

    p_dom1 = right.add_paragraph()
    p_dom1.paragraph_format.space_after = Pt(2)
    p_dom1.add_run(
        f"Calle: {ficha.get('domicilio_calle') or '—'}   "
        f"Número: {ficha.get('domicilio_numero') or '—'}   "
        f"C.P.: {ficha.get('domicilio_cp') or '—'}   "
        f"Colonia: {ficha.get('domicilio_colonia') or '—'}"
    ).font.size = Pt(8)

    p_dom2 = right.add_paragraph()
    p_dom2.paragraph_format.space_after = Pt(2)
    p_dom2.add_run(
        f"Ciudad: {ficha.get('domicilio_ciudad') or '—'}     "
        f"Entidad Federativa: {ficha.get('domicilio_entidad') or '—'}"
    ).font.size = Pt(8)

    p_cont = right.add_paragraph()
    p_cont.paragraph_format.space_after = Pt(2)
    p_cont.add_run(
        f"E-mail: {ficha.get('email') or '—'}     "
        f"Teléfono: {ficha.get('telefono') or '—'}"
    ).font.size = Pt(8)

    # ── Nota RENAP al pie ──
    p_nota = doc.add_paragraph(_RENAP_NOTA)
    p_nota.runs[0].font.size = Pt(7)
    p_nota.paragraph_format.space_before = Pt(6)

    # ── Información Confidencial (página 2) ──
    doc.add_page_break()
    _gen_confidencial(doc, ficha, conf)

    return _docx_bytes(doc)
