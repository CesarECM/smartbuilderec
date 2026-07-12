const { Document, Packer, Paragraph, AlignmentType, PageOrientation } = require('docx');
const { AZUL } = require('./constants');
const { txt } = require('./text-helpers');
const { tablaInfoGeneral }    = require('./tabla-info');
const { tablaObjetivos }      = require('./tabla-objetivos');
const { tablaRequerimientos } = require('./tabla-requerimientos');
const { tablaEvaluaciones }   = require('./tabla-evaluaciones');
const { tablaSeccion, tablaDesarrollo } = require('./tabla-secciones');
const { buildFilasContenido } = require('./doc-content');

function generarDoc(d) {
  const curso = d.datos?.nombreCurso || 'Curso';
  const { filasPrevio, filasApertura, filasDesarrollo, filasCierre } = buildFilasContenido(d);

  const pageProps = {
    size: { width: 12240, height: 15840, orientation: PageOrientation.PORTRAIT },
    margin: { top: 720, right: 720, bottom: 720, left: 720 }
  };
  const espacio = new Paragraph({ spacing: { before: 200, after: 100 }, children: [] });

  const doc = new Document({
    styles: { default: { document: { run: { font: "Arial", size: 20 } } } },
    sections: [
      {
        properties: { page: pageProps },
        children: [
          new Paragraph({
            alignment: AlignmentType.CENTER,
            spacing: { before: 0, after: 240 },
            children: [txt("DOCUMENTO DE PLANEACIÓN DEL CURSO / CARTA DESCRIPTIVA", { bold: true, size: 28, color: AZUL })]
          }),
          tablaInfoGeneral(d),    espacio,
          tablaObjetivos(d),      espacio,
          tablaRequerimientos(d), espacio,
          new Paragraph({
            spacing: { before: 80, after: 80 },
            children: [txt("Formas, momentos y criterios de evaluación: La evaluación se llevará a cabo durante la Apertura, el Desarrollo y el Cierre del Curso/sesión.", { bold: true, color: AZUL, size: 22 })]
          }),
          tablaEvaluaciones(d),
        ]
      },
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
            children: [txt(`SmartBuilder EC  •  Centro ECM  •  ${curso}  •  ${d.datos?.fecha || ''}`, { size: 16, color: "999999" })]
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

module.exports = { generarDoc };
