// ─── wizard/video-config.js — Catálogo de videos EC0217.01 (Bunny Stream) ────

export const BUNNY_LIBRARY_ID = "136002";

/** Catálogo completo de videos alojados en Bunny Stream */
export const VIDEOS = {
  pasoAPaso1: {
    guid:     "fea26612-7c98-4d46-af42-50065b5c95ff",
    title:    "Paso a paso (Parte 1 de 2)",
    duration: "54 min",
  },
  pasoAPaso2: {
    guid:     "a691d1b5-47f2-4ad5-8f47-6acc784b3905",
    title:    "Paso a paso (Parte 2 de 2)",
    duration: "37 min",
  },
  tecnicas: {
    guid:     "513593eb-7491-436f-9cb4-6e1427fd3e5e",
    title:    "Técnicas Instruccionales",
    duration: "16 min",
  },
  motivacion: {
    guid:     "2fafe7eb-13b9-477a-a711-770d5f36895f",
    title:    "Motivación",
    duration: "45 min",
  },
  conducir: {
    guid:     "7bd87dd9-ad85-4a9a-8c09-37823911f390",
    title:    "Cómo Conducir la Sesión",
    duration: "4 min",
  },
  encuadre: {
    guid:     "6b819642-0467-4bcb-8881-6a46ae3df64c",
    title:    "Encuadre del Curso",
    duration: "18 min",
  },
  listaVerif: {
    guid:     "77959bb2-de20-4b9f-bb19-3d8e8ec02412",
    title:    "Lista de Verificación",
    duration: "18 min",
  },
  manualInst: {
    guid:     "721542c8-e0f7-448c-ac0b-5503323834d0",
    title:    "Manual del Instructor",
    duration: "22 min",
  },
  material: {
    guid:     "227e480e-abc2-4150-9a94-0231e56671b2",
    title:    "Material Didáctico",
    duration: "21 min",
  },
  desarrollo: {
    guid:     "5d0c791c-ca15-4bf5-8eaa-23b43c580cd8",
    title:    "Desarrollo del Contenido Temático",
    duration: "18 min",
  },
  manualPart: {
    guid:     "f8147c38-2f1b-4ac3-899b-85a84ad5badb",
    title:    "Manual del Participante",
    duration: "13 min",
  },
  evaluacion: {
    guid:     "af4dded6-35ac-43ba-8699-f20f31f6cba4",
    title:    "Instrumentos de Evaluación",
    duration: "67 min",
  },
};

/**
 * Mapeo sección del wizard → claves de VIDEOS en orden de aparición.
 * Regla: pasoAPaso1 y pasoAPaso2 siempre aparecen juntos y en ese orden.
 */
export const VIDEO_MAP = {
  seccionDatos:        ["pasoAPaso1", "pasoAPaso2"],
  seccionObjetivos:    ["pasoAPaso1", "pasoAPaso2"],
  seccionBeneficios:   ["motivacion", "pasoAPaso1", "pasoAPaso2"],
  seccionTemario:      ["pasoAPaso1", "pasoAPaso2", "desarrollo"],
  seccionIntegracion:  ["encuadre"],
  seccionPreguntas:    ["encuadre"],
  seccionReglas:       ["encuadre"],
  seccionContrato:     ["encuadre"],
  seccionExpositiva:   ["tecnicas", "desarrollo"],
  seccionDemostrativa: ["tecnicas", "desarrollo"],
  seccionEnergizante:  ["tecnicas", "motivacion"],
  seccionDialogo:      ["tecnicas", "pasoAPaso1", "pasoAPaso2"],
  seccionCierre:       ["conducir", "pasoAPaso1", "pasoAPaso2"],
  seccionEvaluaciones: ["evaluacion"],
  seccionTiempos:      ["listaVerif", "pasoAPaso1", "pasoAPaso2"],
  seccionMateriales:   ["material", "listaVerif"],
  seccionFormatos:     ["manualInst", "manualPart"],
};
