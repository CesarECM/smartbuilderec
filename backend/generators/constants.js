const { BorderStyle } = require('docx');

const AZUL        = "1F3B6D";
const AZUL_MED    = "314E7A";
const AZUL_CLARO  = "D6E4F0";
const GRIS_CLARO  = "F2F2F2";
const AMARILLO_SUAVE = "FFF9E6";
const NARANJA     = "E64A19";
const BLANCO      = "FFFFFF";
const NEGRO       = "000000";

const CM = (cm) => Math.round(cm * 567);
const TW = 10800; // carta portrait: 12240 - 720*2 márgenes

const borde = (color = "1F3B6D") => ({ style: BorderStyle.SINGLE, size: 4, color });
const bordesAzul = () => { const b = borde(); return { top: b, bottom: b, left: b, right: b }; };

const cellPad   = { top: 80,  bottom: 80,  left: 120, right: 120 };
const cellPadS  = { top: 60,  bottom: 60,  left: 80,  right: 80  };
const cellPadXS = { top: 40,  bottom: 40,  left: 60,  right: 60  };

module.exports = {
  AZUL, AZUL_MED, AZUL_CLARO, GRIS_CLARO, AMARILLO_SUAVE, NARANJA, BLANCO, NEGRO,
  CM, TW, borde, bordesAzul, cellPad, cellPadS, cellPadXS,
};
