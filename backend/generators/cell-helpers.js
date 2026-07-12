const { TableCell, Paragraph, AlignmentType, WidthType, ShadingType } = require('docx');
const { AZUL, AZUL_CLARO, BLANCO, cellPad, bordesAzul } = require('./constants');
const { txt, txtS, linesToParas, linesToParasS } = require('./text-helpers');

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
    margins: cellPad,
    width: width ? { size: width, type: WidthType.DXA } : undefined,
    columnSpan: colSpan,
    children: linesToParasS(text)
  });
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

module.exports = {
  headerCell, subHeaderCell, labelCell, valueCell, valueCellS,
  obtenerTiempo, obtenerSubtotalTiempo, extraerNombreInstrumento,
};
