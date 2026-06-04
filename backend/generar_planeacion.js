const {
  Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell,
  AlignmentType, BorderStyle, WidthType, ShadingType, VerticalAlign,
  HeadingLevel, LevelFormat, PageOrientation, TableLayoutType
} = require('docx');
const fs = require('fs');

// ─── Recibe los datos como JSON por stdin ───────────────────────────────────
let raw = '';
process.stdin.on('data', chunk => raw += chunk);
process.stdin.on('end', () => {
  const d = JSON.parse(raw);
  generarDoc(d);
});

// ─── Constantes ───────────────────────────────────────────────────────────────
const AZUL       = "1F3B6D";
const AZUL_MED   = "314E7A";
const AZUL_CLARO = "D6E4F0";
const GRIS_CLARO = "F2F2F2";
const AMARILLO_SUAVE = "FFF9E6";
const NARANJA    = "E64A19";
const BLANCO     = "FFFFFF";
const NEGRO      = "000000";

const CM = (cm) => Math.round(cm * 567);
// Página carta portrait: 12240 - (720*2) márgenes = 10800 útiles
const TW = 10800;

const borde = (color = "1F3B6D") => ({ style: BorderStyle.SINGLE, size: 4, color });
const bordesAzul = () => {
  const b = borde();
  return { top: b, bottom: b, left: b, right: b };
};

const cellPad  = { top: 80,  bottom: 80,  left: 120, right: 120 };
const cellPadS = { top: 60,  bottom: 60,  left: 80,  right: 80  };
const cellPadXS = { top: 40, bottom: 40,  left: 60,  right: 60  };

// ─── Helpers de texto ────────────────────────────────────────────────────────
function txt(text, opts = {}) {
  return new TextRun({ text: String(text || ''), font: "Arial", size: 20, ...opts });
}
function txtS(text, opts = {}) {
  return new TextRun({ text: String(text || ''), font: "Arial", size: 18, ...opts });
}

// Párrafos a partir de texto multilínea
function linesToParas(text, opts = {}) {
  const { size = 20, bold = false, color } = opts;
  return String(text || '').split('\n').map(line =>
    new Paragraph({
      children: [new TextRun({ text: line, font: "Arial", size, bold, color: color || NEGRO })],
      spacing: { before: 16, after: 16 }
    })
  );
}
function linesToParasS(text, opts = {}) {
  return linesToParas(text, { size: 18, ...opts });
}

// ─── Celdas básicas ──────────────────────────────────────────────────────────
function headerCell(text, colSpan, width) {
  return new TableCell({
    borders: bordesAzul(),
    margins: cellPad,
    columnSpan: colSpan,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: { fill: AZUL, type: ShadingType.CLEAR },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [txt(text, { bold: true, color: BLANCO })],
      spacing: { before: 24, after: 24 }
    })]
  });
}

function subHeaderCell(text, width, colSpan) {
  return new TableCell({
    borders: bordesAzul(),
    margins: cellPad,
    columnSpan: colSpan,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    shading: { fill: AZUL_CLARO, type: ShadingType.CLEAR },
    children: [new Paragraph({
      alignment: AlignmentType.CENTER,
      children: [txt(text, { bold: true, color: AZUL })],
      spacing: { before: 20, after: 20 }
    })]
  });
}

function labelCell(text, width, colSpan) {
  return new TableCell({
    borders: bordesAzul(),
    margins: cellPad,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    columnSpan: colSpan,
    shading: { fill: AZUL_CLARO, type: ShadingType.CLEAR },
    children: [new Paragraph({
      children: [txt(text, { bold: true, color: AZUL })],
      spacing: { before: 20, after: 20 }
    })]
  });
}

function valueCell(text, width, colSpan) {
  return new TableCell({
    borders: bordesAzul(),
    margins: cellPad,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    columnSpan: colSpan,
    children: linesToParas(text)
  });
}

function valueCellS(text, width, colSpan) {
  return new TableCell({
    borders: bordesAzul(),
    margins: cellPadS,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    columnSpan: colSpan,
    children: linesToParasS(text)
  });
}

// ─── Utilidades ───────────────────────────────────────────────────────────────
function formatDuracion(minutos) {
  const m = parseInt(minutos) || 0;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return min > 0 ? `${h} h ${min} min` : `${h} hrs`;
  }
  return `${m} min`;
}

function obtenerTiempo(d, titulo) {
  const bloques = Array.isArray(d.tiempos) ? d.tiempos : [];
  const norm = s => String(s || '').toLowerCase().trim().replace(/\s+/g, ' ');
  for (const bloque of bloques) {
    const fila = (bloque.filas || []).find(f => norm(f.titulo) === norm(titulo));
    if (fila) return `${fila.tiempo} min`;
  }
  return "";
}

function obtenerSubtotalTiempo(d, nombreSeccion) {
  const bloques = Array.isArray(d.tiempos) ? d.tiempos : [];
  const bloque = bloques.find(b => b.seccion === nombreSeccion);
  if (!bloque) return "—";
  const total = (bloque.filas || []).reduce((acc, f) => acc + Number(f.tiempo || 0), 0);
  return `${total} min`;
}

function extraerNombreInstrumento(texto, fallback) {
  if (!texto) return fallback;
  const lineas = String(texto).split('\n').map(l => l.trim()).filter(Boolean);
  if (lineas.length > 0 && lineas[0].length <= 120 && !/^\d+\./.test(lineas[0])) return lineas[0];
  if (texto.length <= 120) return texto.trim();
  return fallback;
}

// ─── Tabla: Información General ──────────────────────────────────────────────
function tablaInfoGeneral(d) {
  // 4 columnas: [etiqueta ancha | valor | etiqueta estrecha | valor]
  const C1 = Math.round(TW * 0.20);
  const C2 = Math.round(TW * 0.30);
  const C3 = Math.round(TW * 0.18);
  const C4 = TW - C1 - C2 - C3;

  const multiVal = (text, colSpan, shade) => new TableCell({
    borders: bordesAzul(), margins: cellPad,
    columnSpan: colSpan,
    shading: shade ? { fill: shade, type: ShadingType.CLEAR } : undefined,
    children: linesToParas(text)
  });

  return new Table({
    width: { size: TW, type: WidthType.DXA },
    layout: { type: TableLayoutType.FIXED },
    columnWidths: [C1, C2, C3, C4],
    rows: [
      new TableRow({ children: [headerCell("INFORMACIÓN GENERAL", 4, TW)] }),

      // Nombre del Curso (fila completa, nombre en negrita y más grande)
      new TableRow({ children: [
        labelCell("Nombre del Curso / Sesión:", C1),
        new TableCell({
          borders: bordesAzul(), margins: cellPad, columnSpan: 3,
          children: [new Paragraph({ children: [txt(d.datos?.nombreCurso || '', { bold: true, size: 24 })], spacing: { before: 20, after: 20 } })]
        })
      ]}),

      // Diseñador
      new TableRow({ children: [
        labelCell("Nombre del Diseñador:", C1),
        multiVal(d.datos?.disenador || '', 3)
      ]}),

      // Instructor
      new TableRow({ children: [
        labelCell("Nombre del Instructor / Facilitador:", C1),
        multiVal(d.datos?.instructor || '', 3)
      ]}),

      // Lugar | Duración
      new TableRow({ children: [
        labelCell("Lugar de Instrucción:", C1),
        valueCell(d.datos?.lugar || '', C2),
        labelCell("Duración:", C3),
        valueCell(formatDuracion(d.datos?.duracion || 0), C4),
      ]}),

      // Fecha | Participantes
      new TableRow({ children: [
        labelCell("Fecha(s):", C1),
        valueCell(d.datos?.fecha || '', C2),
        labelCell("Nº de participantes:", C3),
        valueCell(d.datos?.participantes ? `${d.datos.participantes} participantes` : '', C4),
      ]}),

      // Perfil del participante (ancho completo)
      new TableRow({ children: [
        labelCell("Perfil del participante:", C1),
        multiVal(d.datos?.perfil || '', 3)
      ]}),

      // Beneficios del curso (resaltado)
      new TableRow({ children: [
        labelCell("Beneficios del curso:", C1),
        new TableCell({
          borders: bordesAzul(), margins: cellPad, columnSpan: 3,
          shading: { fill: AMARILLO_SUAVE, type: ShadingType.CLEAR },
          children: linesToParas(d.beneficios || '')
        })
      ]}),
    ]
  });
}

// ─── Tabla: Objetivos ─────────────────────────────────────────────────────────
function tablaObjetivos(d) {
  const obj = d.objetivos || {};
  const tem = d.temario || {};

  // 2 columnas: [objetivo] | [temas]
  const C_OBJ = Math.round(TW * 0.65);
  const C_TEM = TW - C_OBJ;

  const DESCRIP_OG = "describe la demostración de un conocimiento, desempeño o producto, resultado del aprendizaje del participante, así como el dominio de aprendizaje cognitivo, psicomotriz, afectivo y relacional-social en los que impactará el Curso/sesión";
  const DESCRIP_OP = "describen la demostración de un conocimiento, desempeño o producto, resultado del aprendizaje del participante, así como el dominio de aprendizaje cognitivo, psicomotriz y/o afectivo en los que impactará el curso/sesión";

  function seccionHeader(titulo, desc) {
    return new TableRow({ children: [
      new TableCell({
        borders: bordesAzul(), margins: cellPad, columnSpan: 2,
        shading: { fill: AZUL_CLARO, type: ShadingType.CLEAR },
        children: [new Paragraph({
          children: [
            txt(`${titulo} `, { bold: true, color: AZUL }),
            txt(`(${desc})`, { color: NEGRO, size: 18 })
          ],
          spacing: { before: 20, after: 20 }
        })]
      })
    ]});
  }

  function opCell(num, tipo, textoObj) {
    return new TableCell({
      borders: bordesAzul(), margins: cellPad,
      width: { size: C_OBJ, type: WidthType.DXA },
      children: [
        new Paragraph({ children: [txt(`${num}. `, { bold: true }), txt(tipo, { bold: true, color: AZUL })], spacing: { before: 16, after: 8 } }),
        new Paragraph({ children: [txt(textoObj)], spacing: { before: 8, after: 16 } }),
      ]
    });
  }

  return new Table({
    width: { size: TW, type: WidthType.DXA },
    layout: { type: TableLayoutType.FIXED },
    columnWidths: [C_OBJ, C_TEM],
    rows: [
      // ── OBJETIVO GENERAL ─────────────────────────────────────────
      seccionHeader("Objetivo General", DESCRIP_OG),

      // Datos OG: texto completo, sin fila de sub-encabezados
      new TableRow({ children: [
        new TableCell({
          borders: bordesAzul(), margins: cellPad, columnSpan: 2,
          children: [new Paragraph({ children: [txt(obj.general || '')], spacing: { before: 20, after: 20 } })]
        })
      ]}),

      // ── OBJETIVOS PARTICULARES ────────────────────────────────────
      // Encabezados: 2 columnas (Objetivos Particulares | Temas)
      new TableRow({ children: [
        subHeaderCell("Objetivos Particulares", C_OBJ),
        subHeaderCell("Temas:", C_TEM),
      ]}),

      // OP 1 – Cognitivo
      new TableRow({ children: [
        opCell("1", "(Cognitivo)", obj.cognitiva || ''),
        valueCell((tem.u1 || []).join('\n'), C_TEM),
      ]}),

      // OP 2 – Psicomotriz
      new TableRow({ children: [
        opCell("2", "(Psicomotriz)", obj.psicomotriz || ''),
        valueCell((tem.u2 || []).join('\n'), C_TEM),
      ]}),

      // OP 3 – Afectivo / Relacional-social
      new TableRow({ children: [
        opCell("3", "(Afectivo / Relacional-social)", obj.afectiva || ''),
        valueCell((tem.u3 || []).join('\n'), C_TEM),
      ]}),
    ]
  });
}

// ─── Tabla: Requerimientos ────────────────────────────────────────────────────
function tablaRequerimientos(d) {
  const CW = Math.round(TW / 6);
  const CW6 = TW - CW * 5;

  const mat = d.materiales || {};
  const instInstalaciones = mat.instalaciones        || mat.integracion  || "Aula iluminada, ventilada, mesas y sillas suficientes.";
  const instEquipo        = mat.equipo               || mat.expositiva   || "Laptop, proyector, extensión eléctrica y presentación.";
  const instMateriales    = mat.materialesDidacticos || mat.demostrativa || "Manual del participante, hojas, bolígrafos y materiales de apoyo.";
  const instHumanos       = mat.humanos              || mat.dialogo      || "Instructor y participantes registrados.";
  const instOtros         = mat.otros                || mat.energizante  || "Material extra requerido para las actividades.";
  const instSeguridad     = mat.seguridad            || "Botiquín, señalización de salida, medidas de higiene y protección civil.";

  function reqLabel(text, w) {
    return new TableCell({
      borders: bordesAzul(), margins: cellPadS,
      width: { size: w, type: WidthType.DXA },
      shading: { fill: AZUL_CLARO, type: ShadingType.CLEAR },
      children: [new Paragraph({ children: [txtS(text, { bold: true, color: AZUL })], spacing: { before: 16, after: 16 } })]
    });
  }

  function reqVal(text, w) {
    return new TableCell({
      borders: bordesAzul(), margins: cellPadS,
      width: { size: w, type: WidthType.DXA },
      children: String(text || '').split('\n').map(l =>
        new Paragraph({ children: [txtS(l)], spacing: { before: 12, after: 12 } })
      )
    });
  }

  return new Table({
    width: { size: TW, type: WidthType.DXA },
    layout: { type: TableLayoutType.FIXED },
    columnWidths: [CW, CW, CW, CW, CW, CW6],
    rows: [
      new TableRow({ children: [headerCell("REQUERIMIENTOS PARA EL DESARROLLO DEL CURSO", 6, TW)] }),
      new TableRow({ children: [
        reqLabel("Instalaciones, mobiliario y distribución:", CW),
        reqLabel("Equipo de apoyo y distribución:", CW),
        reqLabel("Materiales didácticos de apoyo:", CW),
        reqLabel("Requerimientos humanos:", CW),
        reqLabel("Otros:", CW),
        reqLabel("Salud / Seguridad / Higiene / Protección civil:", CW6),
      ]}),
      new TableRow({ children: [
        reqVal(instInstalaciones, CW),
        reqVal(instEquipo, CW),
        reqVal(instMateriales, CW),
        reqVal(instHumanos, CW),
        reqVal(instOtros, CW),
        reqVal(instSeguridad, CW6),
      ]}),
    ]
  });
}

// ─── Tabla: Evaluaciones ──────────────────────────────────────────────────────
function tablaEvaluaciones(d) {
  const ev = d.evaluaciones || {};

  const instDiag = extraerNombreInstrumento(ev.instDiagnostica, 'Cuestionario diagnóstico');
  const instForm = extraerNombreInstrumento(ev.instFormativa,   'Lista de cotejo / Guía de observación');
  const instSuma = extraerNombreInstrumento(ev.instSumativa,    'Cuestionario final');

  function aspectoCell(tipo, finalidad, width) {
    return new TableCell({
      borders: bordesAzul(), margins: cellPad,
      width: { size: width, type: WidthType.DXA },
      children: [
        new Paragraph({ children: [txt(tipo, { bold: true })],  spacing: { before: 20, after: 8 } }),
        new Paragraph({ children: [txtS(`Finalidad: ${finalidad}`)], spacing: { before: 8, after: 20 } }),
      ]
    });
  }

  const C1 = Math.round(TW * 0.35);
  const C2 = Math.round(TW * 0.08);
  const C3 = Math.round(TW * 0.37);
  const C4 = TW - C1 - C2 - C3;

  return new Table({
    width: { size: TW, type: WidthType.DXA },
    layout: { type: TableLayoutType.FIXED },
    columnWidths: [C1, C2, C3, C4],
    rows: [
      new TableRow({ children: [
        subHeaderCell("Aspecto a Evaluar / Finalidad", C1),
        subHeaderCell("%", C2),
        subHeaderCell("Instrumento de Evaluación", C3),
        subHeaderCell("Momento de Aplicación", C4),
      ]}),

      new TableRow({ children: [
        aspectoCell("1. Evaluación Diagnóstica", "Identificar el nivel de conocimientos previos de los participantes como punto de partida del curso.", C1),
        valueCell(`${ev.pctDiagnostica || 0}%`, C2),
        valueCell(instDiag, C3),
        valueCell("Al inicio\n(solo referencial)", C4),
      ]}),

      new TableRow({ children: [
        aspectoCell("2. Evaluación Formativa", "Identificar la comprensión y avance logrado por los participantes durante el curso.", C1),
        valueCell(`${ev.pctFormativa || 0}%`, C2),
        valueCell(instForm, C3),
        valueCell("Intermedia", C4),
      ]}),

      new TableRow({ children: [
        aspectoCell("3. Evaluación Final (Sumativa)", "Acreditar los aprendizajes adquiridos por los participantes en el proceso de enseñanza-aprendizaje.", C1),
        valueCell(`${ev.pctSumativa || 0}%`, C2),
        valueCell(instSuma, C3),
        valueCell("Al final del curso", C4),
      ]}),

      new TableRow({ children: [
        new TableCell({
          borders: bordesAzul(), margins: cellPad, columnSpan: 4,
          shading: { fill: GRIS_CLARO, type: ShadingType.CLEAR },
          children: [
            new Paragraph({ children: [txt("d) Criterios de evaluación:", { bold: true })], spacing: { before: 20, after: 8 } }),
            new Paragraph({ children: [txtS("- Conocimientos Teóricos: Comprende los temas del curso, identifica conceptos clave y los relaciona con su práctica laboral.")], spacing: { before: 6, after: 6 } }),
            new Paragraph({ children: [txtS("- Actitud y comportamiento: Participación activa, respeto a sus compañeros y al instructor.")], spacing: { before: 6, after: 6 } }),
            new Paragraph({ children: [txtS("- Evaluaciones aplicadas: Comprensión de los temas explicados y puntaje aprobatorio en las evaluaciones efectuadas.")], spacing: { before: 6, after: 20 } }),
          ]
        })
      ]}),
    ]
  });
}

// ─── Tabla genérica de sección (Apertura / Previo / Cierre) ──────────────────
function tablaSeccion(titulo, filas) {
  const C_ETAPA = Math.round(TW * 0.16);
  const C_ACT   = Math.round(TW * 0.46);
  const C_DUR   = Math.round(TW * 0.07);
  const C_TEC   = Math.round(TW * 0.15);
  const C_MAT   = TW - C_ETAPA - C_ACT - C_DUR - C_TEC;

  const esActividad = a => {
    const t = String(a || '').trim();
    return t.length > 0 && !/^[a-z]\)$/.test(t);
  };

  const rows = [
    new TableRow({ children: [headerCell(titulo, 5, TW)] }),
    new TableRow({ children: [
      subHeaderCell("Etapa",                              C_ETAPA),
      subHeaderCell("Actividades",                        C_ACT),
      subHeaderCell("Duración",                           C_DUR),
      subHeaderCell("Técnicas Grupales / Instruccionales",C_TEC),
      subHeaderCell("Material y Equipo de Apoyo",         C_MAT),
    ]}),
  ];

  for (const fila of filas) {
    const esSuma = (fila.etapa || '').toLowerCase().includes('suma de los tiempos');
    const acts = (fila.actividades || []).filter(esActividad);

    if (esSuma) {
      // Fila de totales: span completo, fondo azul claro, texto en negrita
      rows.push(new TableRow({ children: [
        new TableCell({
          borders: bordesAzul(), margins: cellPadS, columnSpan: 5,
          shading: { fill: AZUL_CLARO, type: ShadingType.CLEAR },
          children: acts.map(a => new Paragraph({
            children: [txtS(a, { bold: true, color: AZUL })],
            spacing: { before: 20, after: 20 }
          }))
        })
      ]}));
    } else {
      rows.push(new TableRow({ children: [
        new TableCell({ borders: bordesAzul(), margins: cellPadS, width: { size: C_ETAPA, type: WidthType.DXA }, children: linesToParasS(fila.etapa || '') }),
        new TableCell({ borders: bordesAzul(), margins: cellPadS, width: { size: C_ACT,   type: WidthType.DXA }, children: acts.length ? acts.flatMap(a => actParas(a)) : linesToParasS('') }),
        new TableCell({ borders: bordesAzul(), margins: cellPadS, width: { size: C_DUR,   type: WidthType.DXA }, children: linesToParasS(fila.duracion || '') }),
        new TableCell({ borders: bordesAzul(), margins: cellPadS, width: { size: C_TEC,   type: WidthType.DXA }, children: linesToParasS(fila.tecnica || '') }),
        new TableCell({ borders: bordesAzul(), margins: cellPadS, width: { size: C_MAT,   type: WidthType.DXA }, children: linesToParasS(fila.material || '') }),
      ]}));
    }
  }

  return new Table({ width: { size: TW, type: WidthType.DXA }, layout: { type: TableLayoutType.FIXED }, columnWidths: [C_ETAPA, C_ACT, C_DUR, C_TEC, C_MAT], rows });
}

// ─── Tabla de Desarrollo (primera columna = Temas/Subtemas) ──────────────────
function tablaDesarrollo(titulo, filas) {
  const C_TEMA = Math.round(TW * 0.18);
  const C_ACT  = Math.round(TW * 0.44);
  const C_DUR  = Math.round(TW * 0.07);
  const C_TEC  = Math.round(TW * 0.15);
  const C_MAT  = TW - C_TEMA - C_ACT - C_DUR - C_TEC;

  const esActividad = a => {
    const t = String(a || '').trim();
    return t.length > 0 && !/^[a-z]\)$/.test(t);
  };

  const rows = [
    new TableRow({ children: [headerCell(titulo, 5, TW)] }),
    new TableRow({ children: [
      subHeaderCell("Temas / Subtemas",                   C_TEMA),
      subHeaderCell("Actividades",                        C_ACT),
      subHeaderCell("Duración",                           C_DUR),
      subHeaderCell("Técnicas Grupales / Instruccionales",C_TEC),
      subHeaderCell("Material y Equipo de Apoyo",         C_MAT),
    ]}),
  ];

  for (const fila of filas) {
    const esSuma = (fila.etapa || '').toLowerCase().includes('suma de los tiempos');
    const acts = (fila.actividades || []).filter(esActividad);

    if (esSuma) {
      rows.push(new TableRow({ children: [
        new TableCell({
          borders: bordesAzul(), margins: cellPadS, columnSpan: 5,
          shading: { fill: AZUL_CLARO, type: ShadingType.CLEAR },
          children: acts.map(a => new Paragraph({
            children: [txtS(a, { bold: true, color: AZUL })],
            spacing: { before: 20, after: 20 }
          }))
        })
      ]}));
    } else {
      rows.push(new TableRow({ children: [
        new TableCell({ borders: bordesAzul(), margins: cellPadS, width: { size: C_TEMA, type: WidthType.DXA }, children: linesToParasS(fila.etapa || '') }),
        new TableCell({ borders: bordesAzul(), margins: cellPadS, width: { size: C_ACT,  type: WidthType.DXA }, children: acts.length ? acts.flatMap(a => actParas(a)) : linesToParasS('') }),
        new TableCell({ borders: bordesAzul(), margins: cellPadS, width: { size: C_DUR,  type: WidthType.DXA }, children: linesToParasS(fila.duracion || '') }),
        new TableCell({ borders: bordesAzul(), margins: cellPadS, width: { size: C_TEC,  type: WidthType.DXA }, children: linesToParasS(fila.tecnica || '') }),
        new TableCell({ borders: bordesAzul(), margins: cellPadS, width: { size: C_MAT,  type: WidthType.DXA }, children: linesToParasS(fila.material || '') }),
      ]}));
    }
  }

  return new Table({ width: { size: TW, type: WidthType.DXA }, layout: { type: TableLayoutType.FIXED }, columnWidths: [C_TEMA, C_ACT, C_DUR, C_TEC, C_MAT], rows });
}

// Renderiza un item de actividad: primera línea en negrita azul, resto normal
function actParas(text) {
  const lines = String(text || '').split('\n');
  return lines.map((line, idx) => new Paragraph({
    children: [txtS(line, idx === 0 && line.trim().length > 0 ? { bold: true, color: AZUL } : {})],
    spacing: { before: idx === 0 ? 16 : 6, after: 6 }
  }));
}

// ─── Generador principal ──────────────────────────────────────────────────────
function generarDoc(d) {
  const curso      = d.datos?.nombreCurso || 'Curso';
  const tecnicas   = d.tecnicas   || {};
  const enc        = d.encuadre   || {};
  const obj        = d.objetivos  || {};
  const tem        = d.temario    || {};
  const ev         = d.evaluaciones || {};
  const expositiva  = d.expositiva  || {};
  const demostrativa = d.demostrativa || {};
  const dialogo    = d.dialogo    || {};
  const cierre     = d.cierre     || {};
  const descripcionGeneral = ev.descripcionGeneral || "";

  const preguntas    = enc.preguntas  || '';
  const reglasTexto  = enc.reglasTexto || [];
  const otraRegla    = enc.otraRegla  || '';
  const acuerdosTexto = enc.acuerdosTexto || [];

  const rhNombre = tecnicas.rhNombre || 'Técnica Rompe Hielo';
  const enNombre = tecnicas.enNombre || 'Técnica Energizante';
  const enDetalle = tecnicas.enDetalle || '';

  // Adaptar rhDetalle: insertar duración en c) y eliminar incisos d/e/f sin contenido propio
  const rhDetalle = (() => {
    const raw = tecnicas.rhDetalle || '';
    if (!raw) return '';
    const rhTiempo = obtenerTiempo(d, "Presentación del Instructor");
    const partes = raw.split('\n\n');
    return partes
      .filter(p => !/^[def]\)/.test(p.trim()))
      .map(p => {
        if (/^c\)/.test(p.trim()) && rhTiempo) {
          return p.replace(/c\) Mencionará el tiempo para realizarla\.?/,
            `c) Mencionará el tiempo para realizarla: ${rhTiempo}`);
        }
        return p;
      })
      .join('\n\n');
  })();

  // ── PREVIO AL INICIO ──────────────────────────────────────────────────────
  const filasPrevio = [
    {
      etapa: "Comprobación de la existencia y funcionamiento de los recursos requeridos",
      actividades: [
        "El instructor aplicará la Lista de verificación de requerimientos.",
        "El instructor realizará pruebas de funcionamiento del equipo.",
        "El instructor verificará la distribución del mobiliario y equipo.",
        "El instructor verificará la suficiencia de los materiales conforme al número de participantes."
      ],
      duracion: "10 min previos al inicio",
      tecnica: "",
      material: "Lista de verificación de requerimientos"
    }
  ];

  // ── APERTURA ──────────────────────────────────────────────────────────────
  const filasApertura = [
    {
      etapa: "1. Presentación del instructor / facilitador y de los participantes",
      actividades: [
        "El instructor se presentará ante el grupo.",
        "El instructor pedirá que se anoten en la lista de asistencia.",
        "El instructor propiciará la presentación de los participantes.",
        `El instructor aplicará la Técnica Rompe Hielo / Integración: "${rhNombre}".\n${rhDetalle}`
      ],
      duracion: obtenerTiempo(d, "Presentación del Instructor"),
      tecnica: `Técnica grupal:\n${rhNombre}`,
      material: "Lista de asistencia\nMateriales de la técnica"
    },
    {
      etapa: "2. Presentación del curso",
      actividades: [
        `El instructor presentará los objetivos del curso/sesión.\n\nOBJETIVO GENERAL:\n${obj.general || ''}\n\nOBJETIVOS PARTICULARES:\n1. (Cognitivo) ${obj.cognitiva || ''}\n\n2. (Psicomotriz) ${obj.psicomotriz || ''}\n\n3. (Afectivo) ${obj.afectiva || ''}`,
        `El instructor presentará la descripción general del desarrollo del curso/sesión.\n${descripcionGeneral}`,
        `El instructor mencionará el temario del curso/sesión.\n\nUnidad 1:\n${(tem.u1 || []).join('\n')}\n\nUnidad 2:\n${(tem.u2 || []).join('\n')}\n\nUnidad 3:\n${(tem.u3 || []).join('\n')}`,
        `El instructor creará un ambiente participativo mediante preguntas relacionadas con el contexto o experiencia de los participantes.\n${preguntas}`,
        `El instructor explicará los beneficios del curso/sesión y su relación con la experiencia laboral y personal.\n${d.beneficios || ''}`,
        `El instructor especificará el tipo de evaluaciones a realizar, los instrumentos a utilizar, el momento de aplicarlos y los criterios a utilizar.\n\na) Evaluación Diagnóstica (${extraerNombreInstrumento(ev.instDiagnostica, 'Cuestionario')}) — Al inicio. ${ev.pctDiagnostica || 0}% solo referencial.\nFinalidad: Identificar el nivel de conocimientos previos de los participantes como punto de partida del curso.\n\nb) Evaluación Formativa (${extraerNombreInstrumento(ev.instFormativa, 'Lista de cotejo / Guía de observación')}) — Intermedia. ${ev.pctFormativa || 0}%.\nFinalidad: Identificar la comprensión y avance logrado por los participantes durante el curso.\n\nc) Evaluación Sumativa (${extraerNombreInstrumento(ev.instSumativa, 'Cuestionario')}) — Al final. ${ev.pctSumativa || 0}%.\nFinalidad: Acreditar los aprendizajes adquiridos por los participantes en el proceso de enseñanza-aprendizaje.\n\nd) Criterios de evaluación:\n- Conocimientos Teóricos.\n- Actitud y comportamiento.\n- Evaluaciones aplicadas.`
      ],
      duracion: obtenerTiempo(d, "Objetivos del curso/sesión"),
      tecnica: "",
      material: "Laptop, proyector, PowerPoint"
    },
    {
      etapa: "3. Acuerdos y compromisos",
      actividades: [
        "El instructor acordará con el grupo las expectativas del curso/sesión.\nEl instructor clarificará el alcance del curso de acuerdo con las expectativas planteadas.",
        `El instructor acordará con el grupo las reglas de operación del curso/sesión.\n${[...reglasTexto, ...(otraRegla ? [otraRegla] : [])].join('\n')}`,
        "El instructor realizará el contrato de aprendizaje con los participantes.\nAlcance: El contrato establece los compromisos mutuos entre el instructor y los participantes para garantizar el logro de los objetivos.\nInstrucciones: Ambas partes leen, acuerdan y firman el contrato como compromiso de participación y aprovechamiento del curso."
      ],
      duracion: obtenerTiempo(d, "Reglas de operación del curso"),
      tecnica: "",
      material: "Hojas blancas\nFormatos de contrato de aprendizaje"
    },
    {
      etapa: "4. Evaluación diagnóstica",
      actividades: [
        "El instructor realizará la evaluación diagnóstica.",
        `Instrumento: ${extraerNombreInstrumento(ev.instDiagnostica, 'Cuestionario diagnóstico')}`,
        "Indicará alcance, propósito y finalidad de la evaluación:\nFinalidad: Identificar el nivel de conocimientos previos de los participantes como punto de partida del curso.",
        "Indicará las instrucciones y el tiempo para realizarla.",
        "Aclarará las dudas que se presenten.",
        "Mencionará que los errores son oportunidades para fortalecer el aprendizaje."
      ],
      duracion: obtenerTiempo(d, "Evaluación diagnóstica"),
      tecnica: "",
      material: "Instrumentos diagnósticos\nBolígrafos"
    },
    {
      etapa: "Suma de los tiempos",
      actividades: [
        `Subtotal Apertura / Encuadre: ${obtenerSubtotalTiempo(d, "Inicio / Encuadre del curso")}`
      ],
      duracion: obtenerSubtotalTiempo(d, "Inicio / Encuadre del curso"),
      tecnica: "",
      material: ""
    }
  ];

  // ── DESARROLLO ────────────────────────────────────────────────────────────
  const filasDesarrollo = [
    {
      etapa: `Unidad 1 — Cognitivo\n\n${(tem.u1 || []).join('\n')}`,
      actividades: [
        "El instructor aplicará la técnica expositiva:",
        `a) Presentará el objetivo del tema:\n${obj.cognitiva || ''}`,
        `b) Realizará una introducción general al contenido temático:\n${expositiva.introduccion || ''}`,
        `c) Recuperará la experiencia previa de los participantes:\n${expositiva.experiencia || ''}`,
        `d) Desarrollará el contenido:\n${expositiva.desarrollo || ''}`,
        `e) Utilizará ejemplos relacionados con los temas y situaciones cotidianas:\n${expositiva.ejemplos || ''}`,
        `g) Realizará la síntesis haciendo énfasis en los aspectos sobresalientes:\n${expositiva.sintesis || ''}`,
        `h) Planteará preguntas dirigidas que verifiquen la comprensión del tema:\n${expositiva.preguntas || ''}`,
        `i) Promoverá comentarios sobre la utilidad y aplicación de los temas:\n${expositiva.utilidad || ''}`
      ],
      duracion: obtenerTiempo(d, "Técnica expositiva"),
      tecnica: "Expositiva",
      material: "Laptop, proyector, PowerPoint"
    },
    {
      etapa: `Unidad 2 — Psicomotriz\n\n${(tem.u2 || []).join('\n')}`,
      actividades: [
        "El instructor aplicará la técnica demostrativa:",
        `a) Presentará objetivo de la actividad a desarrollar:\n${obj.psicomotriz || ''}`,
        `b) Recuperará la experiencia previa de los participantes:\n${demostrativa.experiencia || ''}`,
        `c) Presentará la actividad a desarrollar y mencionará el propósito de la misma:\n${demostrativa.actividad || ''}`,
        "d) Ejemplificará la actividad a desarrollar.",
        "e) Resolverá dudas sobre la demostración realizada.",
        "f) Permitirá que los participantes realicen la práctica.",
        "g) Retroalimentará sobre la práctica.",
        `h) Usará ejemplos relacionados con los temas y situaciones cotidianas:\n${demostrativa.ejemplos || ''}`,
        `i) Preguntará por los conocimientos adquiridos y la utilidad de lo aprendido:\n${demostrativa.preguntas || ''}`,
        "j) Recordará al grupo las reglas de operación acordadas.",
        "k) Mencionará al grupo los logros alcanzados y lo que falta por abordar."
      ],
      duracion: obtenerTiempo(d, "Técnica demostrativa"),
      tecnica: "Demostrativa",
      material: "Laptop, proyector, PowerPoint"
    },
    {
      etapa: "Evaluación Formativa",
      actividades: [
        "El instructor realizará la evaluación formativa.",
        `Instrumento: ${extraerNombreInstrumento(ev.instFormativa, 'Lista de cotejo / Guía de observación')}`,
        "Indicará alcance, propósito y finalidad de la evaluación:\nFinalidad: Identificar la comprensión y avance logrado por los participantes durante el curso.",
        "Indicará las instrucciones y el tiempo para realizarla.",
        "Aclarará las dudas que se presenten."
      ],
      duracion: obtenerTiempo(d, "Evaluación formativa"),
      tecnica: "",
      material: "Formatos de evaluación formativa\nBolígrafos"
    },
    {
      etapa: "Descanso",
      actividades: ["Descanso"],
      duracion: obtenerTiempo(d, "Descanso"),
      tecnica: "",
      material: "Servicio de café"
    },
    {
      etapa: `Técnica Energizante\n\n${enNombre}`,
      actividades: [
        `El instructor aplicará la Técnica Energizante: "${enNombre}".`,
        `a) Explicará objetivo de la técnica:\n${tecnicas.enObjetivo || ''}`,
        `b) Dará las instrucciones de la técnica:\n${enDetalle}`,
        "c) Mencionará el tiempo para realizarla.",
        "d) Participará con el grupo en la técnica.",
        "e) Controlará el tiempo para realizar la técnica."
      ],
      duracion: obtenerTiempo(d, "Técnica Energizante"),
      tecnica: `Técnica grupal:\n${enNombre}`,
      material: "Materiales de la técnica"
    },
    {
      etapa: `Unidad 3 — Afectivo / Relacional-social\n\n${(tem.u3 || []).join('\n')}`,
      actividades: [
        "El instructor aplicará la técnica diálogo-discusión:",
        `a) Mencionará el objetivo de la técnica:\n${obj.afectiva || ''}`,
        `b) Presentará la actividad a desarrollar:\n${dialogo.actividad || ''}`,
        `c) Mencionará el tema/planteamiento/reto a discutir:\n${dialogo.tema || ''}`,
        `d) Indicará las instrucciones de la actividad:\n${dialogo.instrucciones || ''}`,
        `e) Indicará el tiempo asignado a la actividad:\n${dialogo.tiempo || ''}`,
        "f) Dividirá al grupo en subgrupos.",
        `g) Establecerá reglas de operación con la participación del grupo:\n${dialogo.reglas || ''}`,
        `h) Abrirá la discusión recordando el tema a ser discutido:\n${dialogo.introduccion || ''}`,
        "i) Propiciará la discusión de los equipos.",
        "j) Moderará la discusión.",
        `k) Utilizará ejemplos relacionados con los temas y las situaciones cotidianas:\n${dialogo.ejemplos || ''}`,
        `l) Desarrollará junto con el grupo las conclusiones acerca del tema discutido y su utilidad:\n${dialogo.conclusion || ''}`
      ],
      duracion: obtenerTiempo(d, "Técnica diálogo-discusión"),
      tecnica: "Diálogo-discusión",
      material: "Laptop, proyector, PowerPoint"
    },
    {
      etapa: "Evaluación Final",
      actividades: [
        "El instructor realizará la evaluación final.",
        `Instrumento: ${extraerNombreInstrumento(ev.instSumativa, 'Cuestionario final')}`,
        "Indicará alcances, estrategias e instrucciones de la evaluación:\nFinalidad: Acreditar los aprendizajes adquiridos por los participantes en el proceso de enseñanza-aprendizaje.",
        "Indicará el tiempo para realizar la evaluación.",
        "Aclarará las dudas que se presenten."
      ],
      duracion: obtenerTiempo(d, "Evaluación final"),
      tecnica: "",
      material: "Formatos de evaluación final\nBolígrafos"
    },
    {
      etapa: "Suma de los tiempos",
      actividades: [
        `Subtotal Desarrollo: ${obtenerSubtotalTiempo(d, "Desarrollo del curso")}`
      ],
      duracion: obtenerSubtotalTiempo(d, "Desarrollo del curso"),
      tecnica: "",
      material: ""
    }
  ];

  // ── CIERRE ────────────────────────────────────────────────────────────────
  const filasCierre = [
    {
      etapa: "1. Conclusiones",
      actividades: [
        "El instructor realizará la conclusión de los contenidos temáticos desarrollados con apoyo del grupo.",
        "Mencionará los logros alcanzados.",
        "Preguntará la opinión de los participantes sobre la aplicación de los temas tratados.",
        cierre.texto || ""
      ].filter(Boolean),
      duracion: obtenerTiempo(d, "Conclusión"),
      tecnica: "Técnica grupal de cierre",
      material: "Laptop, proyector, PowerPoint"
    },
    {
      etapa: "2. Resumen general del curso",
      actividades: [
        "El instructor mencionará el resumen general del curso, invitando a los participantes a resumir los contenidos.",
        cierre.resumen || ""
      ].filter(Boolean),
      duracion: obtenerTiempo(d, "Resumen general del curso"),
      tecnica: "",
      material: ""
    },
    {
      etapa: "3. Logro de expectativas",
      actividades: [
        "El instructor retomará las expectativas escritas por los participantes al inicio del curso y analizará en grupo si se cumplieron."
      ],
      duracion: obtenerTiempo(d, "Logro de expectativas del curso"),
      tecnica: "",
      material: "Pintarrón"
    },
    {
      etapa: "4. Logro de objetivos",
      actividades: [
        `El instructor preguntará a los participantes acerca del logro de los objetivos.\n\nOBJETIVO GENERAL:\n${obj.general || ''}\n\n¿Se cumplió el objetivo general del curso?`
      ],
      duracion: obtenerTiempo(d, "Logro de los objetivos"),
      tecnica: "",
      material: "Laptop, proyector, PowerPoint"
    },
    {
      etapa: "5. Sugerencias de continuidad",
      actividades: [
        "El instructor sugerirá acciones que permitan la continuidad en el aprendizaje.",
        cierre.sugerencias || ""
      ].filter(Boolean),
      duracion: obtenerTiempo(d, "Sugerencias de continuidad del aprendizaje"),
      tecnica: "",
      material: ""
    },
    {
      etapa: "6. Referencia(s) bibliográfica(s)",
      actividades: [
        "El instructor indicará las referencias bibliográficas o fuentes de información del aprendizaje del curso/sesión.",
        cierre.referencias || ""
      ].filter(Boolean),
      duracion: obtenerTiempo(d, "Referencia(s) bibliográfica"),
      tecnica: "",
      material: ""
    },
    {
      etapa: "7. Compromisos de aplicación",
      actividades: [
        "El instructor conducirá al grupo a la formulación de compromisos de aplicación del aprendizaje.",
        cierre.compromisos || ""
      ].filter(Boolean),
      duracion: obtenerTiempo(d, "Compromisos de aplicación del aprendizaje"),
      tecnica: "",
      material: ""
    },
    {
      etapa: "8. Evaluación de satisfacción",
      actividades: [
        "El instructor aplicará la evaluación de satisfacción.",
        "Indicará alcances e instrucciones de la evaluación:\nFinalidad: Conocer el nivel de satisfacción de los participantes respecto al curso, el instructor y las instalaciones.",
        "Indicará el tiempo para realizarla.",
        "Aclarará las dudas que se presenten."
      ],
      duracion: obtenerTiempo(d, "Evaluación de satisfacción"),
      tecnica: "",
      material: "Instrumentos de evaluación de satisfacción\nBolígrafos"
    },
    {
      etapa: "9. Cierre",
      actividades: [
        "El instructor empleará una técnica de cierre.",
        "El instructor dará las gracias."
      ],
      duracion: obtenerTiempo(d, "Cierre"),
      tecnica: "",
      material: ""
    },
    {
      etapa: "Suma de los tiempos",
      actividades: [
        `Subtotal Cierre: ${obtenerSubtotalTiempo(d, "Cierre del curso")}`,
        `TOTAL GENERAL: ${
          (() => {
            const bloques = Array.isArray(d.tiempos) ? d.tiempos : [];
            const total = bloques.reduce((acc, b) =>
              acc + (b.filas || []).reduce((s, f) => s + Number(f.tiempo || 0), 0), 0);
            return `${total} min`;
          })()
        }`
      ],
      duracion: obtenerSubtotalTiempo(d, "Cierre del curso"),
      tecnica: "",
      material: ""
    }
  ];

  // ── DOCUMENTO ─────────────────────────────────────────────────────────────
  const pageProps = {
    size: { width: 12240, height: 15840, orientation: PageOrientation.PORTRAIT },
    margin: { top: 720, right: 720, bottom: 720, left: 720 }
  };

  const espacio = new Paragraph({ spacing: { before: 200, after: 100 }, children: [] });

  const doc = new Document({
    styles: {
      default: { document: { run: { font: "Arial", size: 20 } } }
    },
    sections: [
      // ── Sección 1: Info general, objetivos, requerimientos, evaluaciones ──
      {
        properties: { page: pageProps },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 240 },
            children: [txt("DOCUMENTO DE PLANEACIÓN DEL CURSO / CARTA DESCRIPTIVA", {
              bold: true, size: 28, color: AZUL
            })]
          }),

          tablaInfoGeneral(d),
          espacio,

          tablaObjetivos(d),
          espacio,

          tablaRequerimientos(d),
          espacio,

          new Paragraph({
            spacing: { before: 80, after: 80 },
            children: [txt("Formas, momentos y criterios de evaluación: La evaluación se llevará a cabo durante la Apertura, el Desarrollo y el Cierre del Curso/sesión.", { bold: true, color: AZUL, size: 22 })]
          }),
          tablaEvaluaciones(d),
        ]
      },

      // ── Sección 2: Apertura, Desarrollo, Cierre ──
      {
        properties: { page: pageProps },
        children: [
          tablaSeccion("PREVIO AL INICIO DEL CURSO — Comprobación de Recursos", filasPrevio),
          espacio,

          tablaSeccion("INICIO DEL CURSO — APERTURA O ENCUADRE", filasApertura),
          new Paragraph({ pageBreakBefore: true }),

          tablaDesarrollo("DESARROLLO", filasDesarrollo),
          new Paragraph({ pageBreakBefore: true }),

          tablaSeccion("CIERRE", filasCierre),

          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 320, after: 0 },
            children: [txt(`SmartBuilder EC  •  Centro ECM  •  ${curso}  •  ${d.datos?.fecha || ''}`, {
              size: 16, color: "999999"
            })]
          }),
        ]
      }
    ]
  });

  Packer.toBuffer(doc).then(buf => {
    process.stdout.write(buf.toString('base64'));
  }).catch(err => {
    process.stderr.write('ERROR: ' + err.message);
    process.exit(1);
  });
}
