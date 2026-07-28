// ─── wizard-ec0091/config.js — Constantes del wizard EC0091 ──────────────────

export const BACKEND_URL = "https://smartbuilderec.onrender.com";

export const NORMA = "EC0091";
export const NORMA_NOMBRE = "Verificación Externa de Centros de Evaluación";

export const FLUJO_SECCIONES = [
  "sec91Datos",
  "sec91Objetivo",
  "sec91Antecedentes",
  "sec91Lineas",
  "sec91Muestreo",
  "sec91Documentos",
  "sec91Cronograma",
  "sec91Lista",
  "sec91Ejecucion",
  "sec91Hallazgos",
  "sec91Informe",
  "sec91Cierre",
  "sec91Expediente",
];

export const NAV_A_SECCION = {
  "nav91-datos":        "sec91Datos",
  "nav91-objetivo":     "sec91Objetivo",
  "nav91-antecedentes": "sec91Antecedentes",
  "nav91-lineas":       "sec91Lineas",
  "nav91-muestreo":     "sec91Muestreo",
  "nav91-documentos":   "sec91Documentos",
  "nav91-cronograma":   "sec91Cronograma",
  "nav91-lista":        "sec91Lista",
  "nav91-ejecucion":    "sec91Ejecucion",
  "nav91-hallazgos":    "sec91Hallazgos",
  "nav91-informe":      "sec91Informe",
  "nav91-cierre":       "sec91Cierre",
  "nav91-expediente":   "sec91Expediente",
};

/** Claves localStorage (prefijo ec0091_) */
export const CLAVES = {
  datos:        "ec0091_datos",
  objetivo:     "ec0091_objetivo",
  antecedentes: "ec0091_antecedentes",
  lineas:       "ec0091_lineas",
  muestreo:     "ec0091_muestreo",
  documentos:   "ec0091_documentos",
  cronograma:   "ec0091_cronograma",
  lista:        "ec0091_lista",
  ejecucion:    "ec0091_ejecucion",
  hallazgos:    "ec0091_hallazgos",
  informe:      "ec0091_informe",
  cierre:       "ec0091_cierre",
  expediente:   "ec0091_expediente",
};

/** Pasos para la barra de progreso */
export const PROGRESS_STEPS = [
  { key: "ec0091_datos_completo",        label: "Datos" },
  { key: "ec0091_objetivo_completo",     label: "Objetivo" },
  { key: "ec0091_antecedentes_completo", label: "Antecedentes" },
  { key: "ec0091_lineas_completo",       label: "Líneas" },
  { key: "ec0091_muestreo_completo",     label: "Muestreo" },
  { key: "ec0091_documentos_completo",   label: "Documentos" },
  { key: "ec0091_cronograma_completo",   label: "Cronograma" },
  { key: "ec0091_lista_completo",        label: "Lista de Verificación" },
  { key: "ec0091_ejecucion_completo",    label: "Ejecución" },
  { key: "ec0091_hallazgos_completo",    label: "Hallazgos" },
  { key: "ec0091_informe_completo",      label: "Informe" },
  { key: "ec0091_cierre_completo",       label: "Cierre" },
];

/** Tres tipos de líneas obligatorias para la verificación EC0091 */
export const TIPOS_LINEA = [
  { id: "proceso",   label: "Línea de Proceso",   desc: "Observación de actividades y procedimientos" },
  { id: "producto",  label: "Línea de Producto",  desc: "Revisión de productos y evidencias generadas" },
  { id: "persona",   label: "Línea de Persona",   desc: "Entrevistas y prueba de conocimientos" },
];
