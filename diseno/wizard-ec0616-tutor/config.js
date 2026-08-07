// ─── wizard-ec0616-tutor/config.js — Constantes del Modo Tutor EC0616 ─────────

export const BACKEND_URL  = "https://smartbuilderec.onrender.com";
export const NORMA        = "EC0616";
export const NORMA_NOMBRE = "Portafolio de Evidencias — Modo Tutor";
export const PREFIJO      = "ec0616t_";
export const ID_KEY       = "sbe_ec0616t_id";
export const TABLA        = "ec0616_tutor_datos";

export const PASOS = [
  { id:"ficha",        nav:"navT-ficha",       sec:"secTFicha",       label:"Ficha de Registro",      grupo:"candidato",  paso:1  },
  { id:"confidencial", nav:"navT-confidencial", sec:"secTConfidencial",label:"Info Confidencial",       grupo:"candidato",  paso:2  },
  { id:"diagnostico",  nav:"navT-diagnostico",  sec:"secTDiagnostico", label:"Diagnóstico",             grupo:"candidato",  paso:3  },
  { id:"plan",         nav:"navT-plan",         sec:"secTPlan",        label:"Plan de Evaluación",      grupo:"evaluacion", paso:4  },
  { id:"iec1",         nav:"navT-iec1",         sec:"secTIEC1",        label:"IEC E1 — Oxigenación",    grupo:"iec",        paso:5  },
  { id:"iec2",         nav:"navT-iec2",         sec:"secTIEC2",        label:"IEC E2 — Alimentación",   grupo:"iec",        paso:6  },
  { id:"iec3",         nav:"navT-iec3",         sec:"secTIEC3",        label:"IEC E3 — Eliminación",    grupo:"iec",        paso:7  },
  { id:"iec4",         nav:"navT-iec4",         sec:"secTIEC4",        label:"IEC E4 — Confort",        grupo:"iec",        paso:8  },
  { id:"iec5",         nav:"navT-iec5",         sec:"secTIEC5",        label:"IEC E5 — Seguridad",      grupo:"iec",        paso:9  },
  { id:"iec6",         nav:"navT-iec6",         sec:"secTIEC6",        label:"IEC E6 — Post Mortem",    grupo:"iec",        paso:10 },
  { id:"iec7",         nav:"navT-iec7",         sec:"secTIEC7",        label:"IEC E7 — Autocuidado",    grupo:"iec",        paso:11 },
  { id:"cierre",       nav:"navT-cierre",       sec:"secTCierre",      label:"Cédula y Encuesta",       grupo:"cierre",     paso:12 },
];

export const FLUJO_SECCIONES = PASOS.map(p => p.sec);
export const NAV_A_SECCION   = Object.fromEntries(PASOS.map(p => [p.nav, p.sec]));
export const PROGRESS_CLAVES = PASOS.map(p => ({ key: `${PREFIJO}${p.id}_completo`, label: p.label }));
