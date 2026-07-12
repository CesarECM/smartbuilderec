const { Table, TableRow, TableCell, Paragraph, WidthType, TableLayoutType } = require('docx');
const { AZUL, AZUL_CLARO, TW, cellPadS, bordesAzul } = require('./constants');
const { txtS, linesToParasS, actParas } = require('./text-helpers');
const { headerCell, subHeaderCell } = require('./cell-helpers');

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
      rows.push(new TableRow({ children: [
        new TableCell({
          borders: bordesAzul(), margins: cellPadS, columnSpan: 5,
          shading: { fill: AZUL_CLARO },
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
          shading: { fill: AZUL_CLARO },
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

module.exports = { tablaSeccion, tablaDesarrollo };
