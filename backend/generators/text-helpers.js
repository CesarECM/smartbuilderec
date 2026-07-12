const { TextRun, Paragraph } = require('docx');
const { NEGRO, AZUL } = require('./constants');

function txt(text, opts = {}) {
  return new TextRun({ text: String(text || ''), font: "Arial", size: 20, ...opts });
}

function txtS(text, opts = {}) {
  return new TextRun({ text: String(text || ''), font: "Arial", size: 18, ...opts });
}

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

function actParas(text) {
  const lines = String(text || '').split('\n');
  return lines.map((line, idx) => new Paragraph({
    children: [txtS(line, idx === 0 && line.trim().length > 0 ? { bold: true, color: AZUL } : {})],
    spacing: { before: idx === 0 ? 16 : 6, after: 6 }
  }));
}

function formatDuracion(minutos) {
  const m = parseInt(minutos) || 0;
  if (m >= 60) {
    const h = Math.floor(m / 60);
    const min = m % 60;
    return min > 0 ? `${h} h ${min} min` : `${h} hrs`;
  }
  return `${m} min`;
}

module.exports = { txt, txtS, linesToParas, linesToParasS, actParas, formatDuracion };
