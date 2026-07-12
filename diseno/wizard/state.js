// ─── wizard/state.js — Estado global del wizard EC0217 ───────────────────────
// Fuente de verdad en-memoria para flags de runtime. Los datos del curso
// se persisten en localStorage bajo las claves CLAVES_DATOS; este módulo
// provee helpers para leer/escribir esas claves de forma consistente.

const PREFIJO = "ec0217_";

export const CLAVES_DATOS = {
  datos:        "ec0217_datos",
  objetivos:    "ec0217_objetivos",
  beneficios:   "ec0217_beneficios",
  temario:      "ec0217_temario",
  encuadre:     "ec0217_encuadre",
  tecnicas:     "ec0217_tecnicas",
  expositiva:   "ec0217_expositiva",
  demostrativa: "ec0217_demostrativa",
  dialogo:      "ec0217_dialogo",
  cierre:       "ec0217_cierre",
  evaluaciones: "ec0217_evaluaciones",
  tiempos:      "ec0217_tiempos",
  materiales:   "ec0217_materiales",
};

export const CLAVES_FLAG = [
  "datos", "objetivos", "beneficios", "temario",
  "preguntas", "reglas", "contrato",
  "integracion", "energizante",
  "expositiva", "demostrativa", "dialogo", "cierre",
  "evaluaciones", "tiempos", "materiales",
];

// Estado en-memoria del wizard (no persiste entre recargas)
export const state = {
  /** "on" | "off" — modo estricto EC0217 */
  modoEstricto: localStorage.getItem("ec0217_modo_estricto") || "on",
  /** true cuando el usuario activa navegación libre */
  modoLibre: false,
  /** Perfil cacheado del usuario autenticado */
  perfil: null,
};

/** Actualiza una clave del estado; sincroniza modoEstricto a localStorage */
export function setState(key, value) {
  state[key] = value;
  if (key === "modoEstricto") {
    localStorage.setItem("ec0217_modo_estricto", value);
  }
}

/** Devuelve true si la sección ya fue completada */
export function getSeccionCompleta(seccion) {
  return localStorage.getItem(`${PREFIJO}${seccion}_completo`) === "true";
}

/** Marca o desmarca una sección como completa */
export function setSeccionCompleta(seccion, valor = true) {
  const key = `${PREFIJO}${seccion}_completo`;
  if (valor) {
    localStorage.setItem(key, "true");
  } else {
    localStorage.removeItem(key);
  }
}

/** Lee los datos JSON de una sección desde localStorage */
export function getDatos(seccion) {
  const raw = localStorage.getItem(CLAVES_DATOS[seccion] ?? `${PREFIJO}${seccion}`);
  return raw ? JSON.parse(raw) : null;
}

/** Persiste los datos JSON de una sección en localStorage */
export function setDatos(seccion, valor) {
  const key = CLAVES_DATOS[seccion] ?? `${PREFIJO}${seccion}`;
  localStorage.setItem(key, JSON.stringify(valor));
}
