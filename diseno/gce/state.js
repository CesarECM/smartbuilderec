// ─── gce/state.js — Estado global del portal GCE ──────────────────────────────

export const state = {
  procesoId: null,
  proceso:   null,   // fila de procesos_evaluacion
  estandar:  null,   // fila de estandares_competencia (con config JSONB completo)
  perfil:    null,   // profile del usuario autenticado
  datos:     {},     // proceso.datos mutable — se sincroniza al backend
  pasoActivo: null,
};

/** Actualiza una sección del portafolio y agenda sincronización */
export function setDatos(seccion, campos) {
  state.datos[seccion] = { ...(state.datos[seccion] || {}), ...campos };
  window.gceSync?.schedule();
}

/** Lee una sección del portafolio */
export function getDatos(seccion) {
  return state.datos[seccion] || {};
}

/** ¿El usuario activo es el candidato del proceso? */
export function esCandidato() {
  return state.perfil?.id === state.proceso?.candidato_id;
}

/** ¿El usuario activo es el evaluador del proceso? */
export function esEvaluador() {
  return state.perfil?.id === state.proceso?.evaluador_id;
}

/** ¿El usuario activo es el Centro de Evaluación del proceso? */
export function esCE() {
  return state.perfil?.id === state.proceso?.ce_id;
}

/**
 * ¿El usuario activo puede editar el paso dado?
 * pasos 3-5 (plan, iec, cedula): solo evaluador y CE
 * pasos 1-2 y 6 (ficha, diagnostico, encuesta): todos
 */
export function puedeEditar(paso) {
  if (["plan", "iec", "cedula"].includes(paso)) return esEvaluador() || esCE();
  return true;
}
