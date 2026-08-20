# ─── services/pdf_ec0616_tutor_helpers.py — PDF Portafolio Modo Tutor EC0616 ──

import io
import base64 as _b64lib

from reportlab.platypus import (
    SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, HRFlowable,
    Image as RLImage,
)
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.pagesizes import letter
from reportlab.lib import colors
from reportlab.lib.units import inch

_VERDE    = colors.HexColor("#065f46")
_VERDE_LT = colors.HexColor("#ecfdf5")
_ROJO     = colors.HexColor("#b91c1c")
_ROJO_LT  = colors.HexColor("#fef2f2")
_GRIS_LT  = colors.HexColor("#f9fafb")
_BORDE    = colors.HexColor("#e5e7eb")

_ELEM_LABELS = [
    (1, "Apoyo para la oxigenación del paciente"),
    (2, "Apoyo para la alimentación del paciente"),
    (3, "Apoyo para la eliminación del paciente"),
    (4, "Apoyo para el confort, higiene y descanso"),
    (5, "Medidas de seguridad y protección del paciente"),
    (6, "Cuidados post mortem"),
    (7, "Orientación para el autocuidado del paciente"),
]

_ENCUESTA_LABELS = {
    "atencion_evaluador":     "Atención del evaluador",
    "claridad_instrucciones": "Claridad de las instrucciones",
    "instalaciones":          "Condiciones de las instalaciones",
    "tiempo_adecuado":        "Tiempo de evaluación adecuado",
}

# ── Helpers ───────────────────────────────────────────────────────────────────

def _foto_rl(b64: str | None, w_inch: float = 1.2, h_inch: float = 1.5):
    if not b64:
        return None
    try:
        data = b64.split(",", 1)[-1] if "," in b64 else b64
        return RLImage(io.BytesIO(_b64lib.b64decode(data)), width=w_inch * inch, height=h_inch * inch)
    except Exception:
        return None


# ── Helpers de estilo ─────────────────────────────────────────────────────────

def _estilos():
    s   = getSampleStyleSheet()
    t   = ParagraphStyle("t",   parent=s["Title"],   textColor=_VERDE, fontSize=16, spaceAfter=4)
    st  = ParagraphStyle("st",  parent=s["Title"],   textColor=_VERDE, fontSize=12, spaceAfter=10)
    sec = ParagraphStyle("sec", parent=s["Heading2"],textColor=_VERDE, fontSize=11, spaceBefore=12, spaceAfter=4)
    nm  = ParagraphStyle("nm",  parent=s["Normal"],  fontSize=10, spaceAfter=3)
    peq = ParagraphStyle("peq", parent=s["Normal"],  fontSize=9, textColor=colors.HexColor("#6b7280"))
    return t, st, sec, nm, peq


def _hr():
    return HRFlowable(width="100%", thickness=1, color=_BORDE, spaceAfter=6)


def _tabla_kv(filas: list, nm) -> Table:
    """Tabla 2 columnas etiqueta|valor con fondo alternado."""
    v = lambda val: str(val) if (val is not None and str(val).strip()) else "—"
    data = [[Paragraph(f"<b>{k}</b>", nm), Paragraph(v(val), nm)] for k, val in filas]
    tbl = Table(data, colWidths=[2.2 * inch, 4.3 * inch])
    tbl.setStyle(TableStyle([
        ("ROWBACKGROUNDS", (0, 0), (-1, -1), [_GRIS_LT, colors.white]),
        ("TOPPADDING",     (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING",  (0, 0), (-1, -1), 4),
        ("LEFTPADDING",    (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",   (0, 0), (-1, -1), 6),
        ("VALIGN",         (0, 0), (-1, -1), "TOP"),
    ]))
    return tbl

# ── Generador principal ───────────────────────────────────────────────────────

def generar_pdf_ec0616_tutor(payload: dict, iec_reactivos: list) -> bytes:
    ficha  = payload.get("ficha", {})
    conf   = payload.get("confidencial", {})
    diag   = payload.get("diagnostico", {})
    plan   = payload.get("plan", {})
    cierre = payload.get("cierre", {})
    iec_sections = {f"iec{i}": payload.get(f"iec{i}", {}) for i in range(1, 8)}

    buf = io.BytesIO()
    doc = SimpleDocTemplate(
        buf, pagesize=letter,
        leftMargin=0.9 * inch, rightMargin=0.9 * inch,
        topMargin=0.9 * inch,  bottomMargin=0.9 * inch,
        title="Portafolio EC0616 — Modo Tutor",
    )
    t, st, sec, nm, peq = _estilos()
    story = []

    # ── 0. Portada ─────────────────────────────────────────────────────────────
    nombre = f"{ficha.get('nombre_candidato', '')} {ficha.get('apellidos_candidato', '')}".strip()
    story += [
        Spacer(1, 0.3 * inch),
        Paragraph("Portafolio de Evidencias", t),
        Paragraph("Norma EC0616 — Auxiliar de Enfermería", st),
        Paragraph("Registro de Evaluación de Competencias — Modo Tutor", peq),
        Spacer(1, 0.15 * inch),
        _hr(),
    ]

    # ── 1. Ficha de Registro ───────────────────────────────────────────────────
    story.append(Paragraph("1. Ficha de Registro del Candidato", sec))
    foto_elem = _foto_rl(ficha.get("foto_base64"))
    if foto_elem:
        story.append(foto_elem)
        story.append(Spacer(1, 0.1 * inch))
    story.append(_tabla_kv([
        ("Nombre completo",      nombre or None),
        ("CURP",                 ficha.get("curp")),
        ("Fecha de nacimiento",  ficha.get("fecha_nacimiento")),
        ("Género",               ficha.get("genero")),
        ("Correo electrónico",   ficha.get("email")),
        ("Teléfono",             ficha.get("telefono")),
        ("Centro de Evaluación", ficha.get("nombre_ce")),
        ("Evaluador",            ficha.get("nombre_evaluador")),
        ("Fecha de evaluación",  ficha.get("fecha_evaluacion")),
        ("Sabe leer y escribir", conf.get("leer_escribir")),
        ("Trabaja actualmente",  conf.get("trabaja_actualmente")),
        ("Idiomas",              conf.get("idiomas")),
        ("Certificación previa", conf.get("tiene_certificacion")),
    ], nm))
    story.append(_hr())

    # ── 2. Resultado del Diagnóstico ───────────────────────────────────────────
    story.append(Paragraph("2. Resultado del Diagnóstico", sec))
    story.append(_tabla_kv([
        ("Reactivos correctos",  f"{diag.get('correctas', 0)} de {diag.get('total', 0)}"),
        ("Posibilidad de éxito", diag.get("posibilidad")),
        ("Sugerencia",           diag.get("sugerencia")),
        ("Fecha",                (diag.get("fecha") or "")[:10] or None),
    ], nm))
    story.append(_hr())

    # ── 3. Plan de Evaluación ──────────────────────────────────────────────────
    story.append(Paragraph("3. Plan de Evaluación — Logística", sec))
    story.append(_tabla_kv([
        ("Fecha de evaluación",   plan.get("fecha_eval") or ficha.get("fecha_evaluacion")),
        ("Horario",               plan.get("hora")),
        ("Lugar",                 plan.get("lugar")),
        ("Número de sesiones",    plan.get("sesiones")),
        ("Fecha de resultados",   plan.get("fecha_resultados")),
        ("Medio de comunicación", plan.get("lugar_resultados")),
        ("Observaciones",         plan.get("observaciones")),
    ], nm))
    story.append(_hr())

    # ── 4. Resumen IEC Aplicado ────────────────────────────────────────────────
    story.append(Paragraph("4. Resumen del IEC Aplicado (por Elemento)", sec))

    marcas: dict = {}
    for i in range(1, 8):
        for r in (iec_sections.get(f"iec{i}", {}).get("reactivos") or []):
            marcas[r["codigo"]] = r.get("cumple")

    hdr_style = ParagraphStyle("h", parent=nm, textColor=colors.white, fontName="Helvetica-Bold")
    iec_data = [[
        Paragraph("Elem.", hdr_style), Paragraph("Descripción", hdr_style),
        Paragraph("Total", hdr_style), Paragraph("C", hdr_style),
        Paragraph("NC",    hdr_style), Paragraph("Sin marca", hdr_style),
    ]]
    for num, largo in _ELEM_LABELS:
        elem = [r for r in iec_reactivos if (r.get("codigo") or "").startswith(f"E{num}")]
        c    = sum(1 for r in elem if marcas.get(r["codigo"]) is True)
        nc   = sum(1 for r in elem if marcas.get(r["codigo"]) is False)
        sin  = len(elem) - c - nc
        iec_data.append([
            Paragraph(f"E{num}", nm), Paragraph(largo, nm),
            Paragraph(str(len(elem)), nm), Paragraph(str(c), nm),
            Paragraph(str(nc), nm), Paragraph(str(sin), nm),
        ])
    iec_tbl = Table(iec_data, colWidths=[0.45*inch, 3.1*inch, 0.55*inch, 0.45*inch, 0.45*inch, 0.75*inch])
    iec_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, 0),  _VERDE),
        ("ROWBACKGROUNDS",(0, 1), (-1, -1), [_GRIS_LT, colors.white]),
        ("GRID",          (0, 0), (-1, -1), 0.5, _BORDE),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        ("TOPPADDING",    (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
        ("LEFTPADDING",   (0, 0), (-1, -1), 4),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 4),
    ]))
    story += [iec_tbl, Spacer(1, 0.1 * inch)]

    ptj = cierre.get("puntaje_total") or 0
    jui = cierre.get("juicio", "—")
    jui_label = "✓ Competente (C)" if jui == "C" else ("✗ Todavía No Competente (TNC)" if jui == "TNC" else jui)
    jui_color = _VERDE if jui == "C" else (_ROJO if jui == "TNC" else colors.black)
    bg_res    = _VERDE_LT if jui == "C" else (_ROJO_LT if jui == "TNC" else _GRIS_LT)
    jui_style = ParagraphStyle("jui", parent=nm, textColor=jui_color, fontName="Helvetica-Bold")
    res_tbl = Table([[
        Paragraph(f"<b>Puntaje IEC total: {ptj}</b>", nm),
        Paragraph(f"Juicio: {jui_label}", jui_style),
    ]], colWidths=[2.5 * inch, 4.3 * inch])
    res_tbl.setStyle(TableStyle([
        ("BACKGROUND",    (0, 0), (-1, -1), bg_res),
        ("BOX",           (0, 0), (-1, -1), 1.5, jui_color),
        ("TOPPADDING",    (0, 0), (-1, -1), 8),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 8),
        ("LEFTPADDING",   (0, 0), (-1, -1), 10),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
    ]))
    story += [res_tbl, _hr()]

    # ── 5. Cédula de Evaluación ────────────────────────────────────────────────
    story.append(Paragraph("5. Cédula de Evaluación", sec))
    story.append(_tabla_kv([
        ("Juicio de evaluación",   jui_label),
        ("Puntaje IEC total",      str(ptj)),
        ("Observaciones",          cierre.get("obs")),
        ("Nombre del evaluador",   cierre.get("evaluador") or ficha.get("nombre_evaluador")),
        ("Fecha",                  cierre.get("fecha") or ficha.get("fecha_evaluacion")),
    ], nm))
    story += [
        Spacer(1, 0.2 * inch),
        Paragraph("Firma del evaluador: _________________________    Fecha: ___________", nm),
        Spacer(1, 0.1 * inch),
        Paragraph("Firma del candidato: _________________________    Fecha: ___________", nm),
        _hr(),
    ]

    # ── 6. Encuesta de Satisfacción ────────────────────────────────────────────
    story.append(Paragraph("6. Encuesta de Satisfacción del Candidato", sec))
    enc = cierre.get("encuesta") or {}
    enc_filas = [
        (label, str(enc.get(key)) if enc.get(key) is not None else None)
        for key, label in _ENCUESTA_LABELS.items()
    ]
    enc_filas.append(("Comentarios libres", cierre.get("comentarios")))
    story.append(_tabla_kv(enc_filas, nm))

    doc.build(story)
    buf.seek(0)
    return buf.read()
