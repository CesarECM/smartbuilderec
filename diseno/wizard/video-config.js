// ─── wizard/video-config.js — Catálogo de videos EC0217.01 (Bunny Stream) ────

export const BUNNY_LIBRARY_ID = "136002";

export const VIDEOS = {
  // ── Módulo 1: Introducción ─────────────────────────────────────────────────
  introduccion: {
    guid:        "15088e59-b23e-46f2-8df4-fb1462d41e30",
    title:       "Introducción",
    duration:    "8 min",
    description: "Presentación del curso y visión general del proceso de certificación como instructor bajo la norma EC0217.01 del CONOCER.",
  },
  snc: {
    guid:        "2ddfe8ab-ad17-41bf-8a1a-03a5a54a8bc8",
    title:       "Sistema Nacional de Competencias",
    duration:    "29 min",
    description: "Qué es el CONOCER, cómo funciona el Sistema Nacional de Competencias y el rol del instructor certificado dentro del esquema.",
  },

  // ── Módulo 2: Planeación del Curso ─────────────────────────────────────────
  fichaEC0217: {
    guid:        "6aec9b2c-6a75-4401-be0b-4697e27af7f7",
    title:       "Ficha del Estándar EC0217.01",
    duration:    "62 min",
    description: "Análisis detallado de la ficha técnica del estándar: elementos de competencia, criterios de desempeño y productos esperados por el CONOCER.",
  },
  deteccionNec: {
    guid:        "b840cb9c-3f11-4da4-9bd3-58b404f4e4bd",
    title:       "Detección de Necesidades",
    duration:    "26 min",
    description: "Cómo identificar y documentar las necesidades de capacitación que justifican el diseño del curso.",
    links: [
      { label: "→ Datos del curso", seccion: "seccionDatos" },
    ],
  },
  redaccionObj: {
    guid:        "76cb0cdb-570e-41f4-b39a-ec6d35064471",
    title:       "Redacción de Objetivos",
    duration:    "12 min",
    description: "Técnica para redactar objetivos de aprendizaje cognitivos, psicomotrices y afectivos con verbos de acción correctos según la taxonomía.",
    links: [
      { label: "→ Objetivos de aprendizaje", seccion: "seccionObjetivos" },
    ],
  },
  pasoAPaso1: {
    guid:        "fea26612-7c98-4d46-af42-50065b5c95ff",
    title:       "Documento de Planeación (Parte 1 de 2)",
    duration:    "54 min",
    description: "Recorrido completo del proceso de construcción del expediente didáctico EC0217.01: datos del curso, objetivos de aprendizaje, beneficios y estructura general del temario.",
    links: [
      { label: "→ Datos del curso",           seccion: "seccionDatos"     },
      { label: "→ Objetivos de aprendizaje",  seccion: "seccionObjetivos" },
    ],
  },
  pasoAPaso2: {
    guid:        "a691d1b5-47f2-4ad5-8f47-6acc784b3905",
    title:       "Documento de Planeación (Parte 2 de 2)",
    duration:    "37 min",
    description: "Continuación: cómo estructurar los temas en tres unidades didácticas con sus tipos de objetivo cognitivo, psicomotriz y afectivo/relacional-social.",
    links: [
      { label: "→ Objetivos de aprendizaje", seccion: "seccionObjetivos" },
      { label: "→ Temario",                  seccion: "seccionTemario"   },
    ],
  },
  evaluacion: {
    guid:        "af4dded6-35ac-43ba-8699-f20f31f6cba4",
    title:       "Instrumentos de Evaluación",
    duration:    "67 min",
    description: "Diseño detallado de los tres instrumentos: evaluación diagnóstica, formativa y sumativa, con criterios de desempeño y ponderaciones.",
    links: [
      { label: "→ Evaluaciones", seccion: "seccionEvaluaciones" },
    ],
  },
  desarrollo: {
    guid:        "5d0c791c-ca15-4bf5-8eaa-23b43c580cd8",
    title:       "Desarrollo del Contenido Temático",
    duration:    "18 min",
    description: "Cómo desarrollar el contenido temático con estructura pedagógica usando las técnicas expositiva y demostrativa.",
    links: [
      { label: "→ Técnica expositiva",   seccion: "seccionExpositiva"   },
      { label: "→ Técnica demostrativa", seccion: "seccionDemostrativa" },
    ],
  },
  material: {
    guid:        "227e480e-abc2-4150-9a94-0231e56671b2",
    title:       "Material Didáctico",
    duration:    "21 min",
    description: "Clasificación y selección del material didáctico en las 6 categorías obligatorias: instalaciones, equipo, materiales, humanos, otros y seguridad.",
    links: [
      { label: "→ Lista de materiales", seccion: "seccionMateriales" },
    ],
  },
  manualPart: {
    guid:        "f8147c38-2f1b-4ac3-899b-85a84ad5badb",
    title:       "Manual del Participante",
    duration:    "13 min",
    description: "Elaboración del Manual del Participante como documento de apoyo entregado al grupo de capacitación.",
    links: [
      { label: "→ Formatos adicionales", seccion: "seccionFormatos" },
    ],
  },
  manualInst: {
    guid:        "721542c8-e0f7-448c-ac0b-5503323834d0",
    title:       "Manual del Instructor",
    duration:    "22 min",
    description: "Estructura y contenido del Manual del Instructor para documentar la conducción e impartición del curso.",
    links: [
      { label: "→ Formatos adicionales", seccion: "seccionFormatos" },
    ],
  },

  // ── Módulo 3: Impartición del Curso ────────────────────────────────────────
  listaVerif: {
    guid:        "77959bb2-de20-4b9f-bb19-3d8e8ec02412",
    title:       "Lista de Verificación de Requerimientos",
    duration:    "18 min",
    description: "Uso de la lista de verificación para validar la distribución de tiempos y el cumplimiento de los 120 minutos mínimos que exige la norma.",
    links: [
      { label: "→ Tiempos del curso", seccion: "seccionTiempos" },
    ],
  },
  conducir: {
    guid:        "7bd87dd9-ad85-4a9a-8c09-37823911f390",
    title:       "Cómo Conducir la Sesión",
    duration:    "4 min",
    description: "Pautas para conducir y cerrar correctamente la sesión de capacitación según los criterios de la norma EC0217.01.",
    links: [
      { label: "→ Cierre del curso", seccion: "seccionCierre" },
    ],
  },
  motivacion: {
    guid:        "2fafe7eb-13b9-477a-a711-770d5f36895f",
    title:       "Motivación",
    duration:    "45 min",
    description: "Cómo despertar el interés y sostener la motivación del grupo a lo largo de toda la sesión de capacitación.",
    links: [
      { label: "→ Técnica energizante", seccion: "seccionEnergizante" },
    ],
  },
  encuadre: {
    guid:        "6b819642-0467-4bcb-8881-6a46ae3df64c",
    title:       "Encuadre del Curso",
    duration:    "18 min",
    description: "Estructura y aplicación del encuadre: técnica de integración grupal, preguntas de experiencia, reglas del curso y contrato de aprendizaje.",
    links: [
      { label: "→ Integración grupal",       seccion: "seccionIntegracion" },
      { label: "→ Preguntas de experiencia", seccion: "seccionPreguntas"   },
      { label: "→ Reglas del curso",         seccion: "seccionReglas"      },
      { label: "→ Contrato de aprendizaje",  seccion: "seccionContrato"    },
    ],
  },
  tecnicas: {
    guid:        "513593eb-7491-436f-9cb4-6e1427fd3e5e",
    title:       "Técnicas Instruccionales",
    duration:    "16 min",
    description: "Panorama de las cuatro técnicas instruccionales del EC0217.01: expositiva, demostrativa, energizante y diálogo/discusión.",
    links: [
      { label: "→ Técnica expositiva",   seccion: "seccionExpositiva"   },
      { label: "→ Técnica demostrativa", seccion: "seccionDemostrativa" },
      { label: "→ Técnica energizante",  seccion: "seccionEnergizante"  },
      { label: "→ Técnica de diálogo",   seccion: "seccionDialogo"      },
    ],
  },
};

/** Agrupación por módulo — define orden y separadores del acordeón */
export const MODULE_GROUPS = [
  {
    label: "Módulo 1 — Introducción",
    keys:  ["introduccion", "snc"],
  },
  {
    label: "Módulo 2 — Planeación del Curso",
    keys:  ["fichaEC0217", "deteccionNec", "redaccionObj", "pasoAPaso1", "pasoAPaso2",
            "evaluacion", "desarrollo", "material", "manualPart", "manualInst"],
  },
  {
    label: "Módulo 3 — Impartición del Curso",
    keys:  ["listaVerif", "conducir", "motivacion", "encuadre", "tecnicas"],
  },
];
