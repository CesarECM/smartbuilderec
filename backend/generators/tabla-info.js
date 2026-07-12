const { Table, TableRow, TableCell, Paragraph, WidthType, ShadingType, TableLayoutType } = require('docx');
const { AZUL_CLARO, AMARILLO_SUAVE, TW, cellPad, bordesAzul } = require('./constants');
const { txt, linesToParas } = require('./text-helpers');
const { headerCell, labelCell, valueCell } = require('./cell-helpers');

function tablaInfoGeneral(d) {
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

      new TableRow({ children: [
        labelCell("Nombre del Curso / Sesión:", C1),
        new TableCell({
          borders: bordesAzul(), margins: cellPad, columnSpan: 3,
          children: [new Paragraph({ children: [txt(d.datos?.nombreCurso || '', { bold: true, size: 24 })], spacing: { before: 20, after: 20 } })]
        })
      ]}),

      new TableRow({ children: [
        labelCell("Nombre del Diseñador:", C1),
        multiVal(d.datos?.disenador || '', 3)
      ]}),

      new TableRow({ children: [
        labelCell("Nombre del Instructor / Facilitador:", C1),
        multiVal(d.datos?.instructor || '', 3)
      ]}),

      new TableRow({ children: [
        labelCell("Lugar de Instrucción:", C1),
        valueCell(d.datos?.lugar || '', C2),
        labelCell("Duración:", C3),
        valueCell(require('./text-helpers').formatDuracion(d.datos?.duracion || 0), C4),
      ]}),

      new TableRow({ children: [
        labelCell("Fecha(s):", C1),
        valueCell(d.datos?.fecha || '', C2),
        labelCell("Nº de participantes:", C3),
        valueCell(d.datos?.participantes ? `${d.datos.participantes} participantes` : '', C4),
      ]}),

      new TableRow({ children: [
        labelCell("Perfil del participante:", C1),
        multiVal(d.datos?.perfil || '', 3)
      ]}),

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

module.exports = { tablaInfoGeneral };
