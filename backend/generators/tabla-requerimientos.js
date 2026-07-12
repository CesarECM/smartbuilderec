const { Table, TableRow, TableCell, Paragraph, WidthType, ShadingType, TableLayoutType } = require('docx');
const { AZUL, AZUL_CLARO, TW, cellPadS, bordesAzul } = require('./constants');
const { txtS } = require('./text-helpers');
const { headerCell } = require('./cell-helpers');

function tablaRequerimientos(d) {
  const CW  = Math.round(TW / 6);
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

module.exports = { tablaRequerimientos };
