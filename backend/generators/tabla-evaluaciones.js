const { Table, TableRow, TableCell, Paragraph, WidthType, ShadingType, TableLayoutType } = require('docx');
const { GRIS_CLARO, TW, cellPad, bordesAzul } = require('./constants');
const { txt, txtS } = require('./text-helpers');
const { subHeaderCell, valueCell } = require('./cell-helpers');
const { extraerNombreInstrumento } = require('./cell-helpers');

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

module.exports = { tablaEvaluaciones };
