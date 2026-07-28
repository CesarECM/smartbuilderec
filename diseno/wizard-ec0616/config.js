// ─── wizard-ec0616/config.js — Constantes del wizard EC0616 ──────────────────

export const BACKEND_URL = "https://smartbuilderec.onrender.com";

export const NORMA = "EC0616";
export const NORMA_NOMBRE = "Portafolio de Evidencias — Auxiliar de Enfermería";

export const FLUJO_SECCIONES = [
  "sec16Datos",
  "sec16Oxigenacion",
  "sec16Alimentacion",
  "sec16Eliminacion",
  "sec16Confort",
  "sec16Seguridad",
  "sec16Postmortem",
  "sec16Autocuidado",
  "sec16Portafolio",
];

export const NAV_A_SECCION = {
  "nav16-datos":        "sec16Datos",
  "nav16-oxigenacion":  "sec16Oxigenacion",
  "nav16-alimentacion": "sec16Alimentacion",
  "nav16-eliminacion":  "sec16Eliminacion",
  "nav16-confort":      "sec16Confort",
  "nav16-seguridad":    "sec16Seguridad",
  "nav16-postmortem":   "sec16Postmortem",
  "nav16-autocuidado":  "sec16Autocuidado",
  "nav16-portafolio":   "sec16Portafolio",
};

export const CLAVES = {
  datos:        "ec0616_datos",
  oxigenacion:  "ec0616_oxigenacion",
  alimentacion: "ec0616_alimentacion",
  eliminacion:  "ec0616_eliminacion",
  confort:      "ec0616_confort",
  seguridad:    "ec0616_seguridad",
  postmortem:   "ec0616_postmortem",
  autocuidado:  "ec0616_autocuidado",
  portafolio:   "ec0616_portafolio",
};

export const PROGRESS_STEPS = [
  { key: "ec0616_datos_completo",        label: "Datos del candidato" },
  { key: "ec0616_oxigenacion_completo",  label: "Elemento 1 — Oxigenación" },
  { key: "ec0616_alimentacion_completo", label: "Elemento 2 — Alimentación" },
  { key: "ec0616_eliminacion_completo",  label: "Elemento 3 — Eliminación" },
  { key: "ec0616_confort_completo",      label: "Elemento 4 — Confort" },
  { key: "ec0616_seguridad_completo",    label: "Elemento 5 — Seguridad" },
  { key: "ec0616_postmortem_completo",   label: "Elemento 6 — Post Mortem" },
  { key: "ec0616_autocuidado_completo",  label: "Elemento 7 — Autocuidado" },
];

/** Definición de los 7 elementos del EC0616 */
export const ELEMENTOS = [
  {
    id:    "oxigenacion",
    num:   1,
    nav:   "nav16-oxigenacion",
    sec:   "sec16Oxigenacion",
    clave: "ec0616_oxigenacion",
    titulo: "Apoyo para la oxigenación del paciente",
    desc:   "Desempeños relacionados con la administración de oxígeno y posicionamiento.",
    desempenos: [
      "Verifica la prescripción médica de oxigenoterapia",
      "Instala y ajusta el sistema de administración de oxígeno",
      "Monitorea la saturación de oxígeno y signos vitales",
      "Registra la administración de oxigenoterapia en el expediente",
      "Identifica y reporta signos de deterioro respiratorio",
    ],
  },
  {
    id:    "alimentacion",
    num:   2,
    nav:   "nav16-alimentacion",
    sec:   "sec16Alimentacion",
    clave: "ec0616_alimentacion",
    titulo: "Apoyo para la alimentación del paciente",
    desc:   "Técnicas de alimentación oral, enteral y asistida.",
    desempenos: [
      "Verifica dieta prescrita y alergias del paciente",
      "Prepara el entorno para la alimentación segura",
      "Asiste al paciente en la alimentación oral según capacidades",
      "Instala y verifica sonda nasogástrica para alimentación enteral",
      "Registra la ingesta y el estado nutricional del paciente",
    ],
  },
  {
    id:    "eliminacion",
    num:   3,
    nav:   "nav16-eliminacion",
    sec:   "sec16Eliminacion",
    clave: "ec0616_eliminacion",
    titulo: "Apoyo para la eliminación del paciente",
    desc:   "Cuidados de eliminación urinaria e intestinal.",
    desempenos: [
      "Realiza sondeo vesical con técnica aséptica",
      "Lleva control de ingresos y egresos urinarios",
      "Proporciona medidas de higiene íntima",
      "Identifica y reporta alteraciones en la eliminación",
      "Retira la sonda vesical según prescripción médica",
    ],
  },
  {
    id:    "confort",
    num:   4,
    nav:   "nav16-confort",
    sec:   "sec16Confort",
    clave: "ec0616_confort",
    titulo: "Apoyo para el confort, higiene y descanso",
    desc:   "Baño, higiene bucal, posicionamiento y descanso.",
    desempenos: [
      "Realiza baño integral en cama con técnica correcta",
      "Efectúa higiene bucal y corporal del paciente encamado",
      "Posiciona al paciente para prevenir úlceras por presión",
      "Promueve el descanso y sueño del paciente",
      "Registra el estado de la piel y las medidas de confort aplicadas",
    ],
  },
  {
    id:    "seguridad",
    num:   5,
    nav:   "nav16-seguridad",
    sec:   "sec16Seguridad",
    clave: "ec0616_seguridad",
    titulo: "Medidas de seguridad y protección del paciente",
    desc:   "Higiene de manos, EPP, prevención de caídas y protocolos OMS.",
    desempenos: [
      "Aplica los 5 momentos de higiene de manos según OMS",
      "Usa el equipo de protección personal adecuado",
      "Aplica protocolos de identificación del paciente",
      "Previene caídas mediante barandales y comunicación",
      "Aplica técnicas de aislamiento según tipo de infección",
    ],
  },
  {
    id:    "postmortem",
    num:   6,
    nav:   "nav16-postmortem",
    sec:   "sec16Postmortem",
    clave: "ec0616_postmortem",
    titulo: "Cuidados post mortem",
    desc:   "Preparación del cuerpo con respeto y dignidad.",
    desempenos: [
      "Verifica el fallecimiento con el médico tratante",
      "Realiza el aseo y preparación del cuerpo con respeto",
      "Retira catéteres, sondas y dispositivos según protocolo",
      "Identifica el cuerpo correctamente",
      "Brinda apoyo emocional a los familiares",
    ],
  },
  {
    id:    "autocuidado",
    num:   7,
    nav:   "nav16-autocuidado",
    sec:   "sec16Autocuidado",
    clave: "ec0616_autocuidado",
    titulo: "Orientación para el autocuidado del paciente",
    desc:   "Educación al paciente y familia para el cuidado en casa.",
    desempenos: [
      "Identifica las necesidades de educación del paciente y familia",
      "Proporciona orientación sobre el tratamiento en casa",
      "Enseña técnicas de higiene y cuidado personal",
      "Evalúa la comprensión de las instrucciones proporcionadas",
      "Registra la educación brindada en el expediente clínico",
    ],
  },
];
