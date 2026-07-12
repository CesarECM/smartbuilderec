const { Table, TableRow, TableCell, Paragraph, WidthType, ShadingType, TableLayoutType } = require('docx');
const { AZUL, AZUL_CLARO, NEGRO, TW, cellPad, bordesAzul } = require('./constants');
const { txt, linesToParas } = require('./text-helpers');
const { subHeaderCell, valueCell } = require('./cell-helpers');

function tablaObjetivos(d) {
  const obj = d.objetivos || {};
  const tem = d.temario || {};

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
      seccionHeader("Objetivo General", DESCRIP_OG),

      new TableRow({ children: [
        new TableCell({
          borders: bordesAzul(), margins: cellPad, columnSpan: 2,
          children: [new Paragraph({ children: [txt(obj.general || '')], spacing: { before: 20, after: 20 } })]
        })
      ]}),

      new TableRow({ children: [
        subHeaderCell("Objetivos Particulares", C_OBJ),
        subHeaderCell("Temas:", C_TEM),
      ]}),

      new TableRow({ children: [
        opCell("1", "(Cognitivo)", obj.cognitiva || ''),
        valueCell((tem.u1 || []).join('\n'), C_TEM),
      ]}),

      new TableRow({ children: [
        opCell("2", "(Psicomotriz)", obj.psicomotriz || ''),
        valueCell((tem.u2 || []).join('\n'), C_TEM),
      ]}),

      new TableRow({ children: [
        opCell("3", "(Afectivo / Relacional-social)", obj.afectiva || ''),
        valueCell((tem.u3 || []).join('\n'), C_TEM),
      ]}),
    ]
  });
}

module.exports = { tablaObjetivos };
