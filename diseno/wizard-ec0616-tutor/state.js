// ─── wizard-ec0616-tutor/state.js — Estado del Modo Tutor EC0616 ─────────────

import { PREFIJO, ID_KEY } from "./config.js";

export const state = { perfil: null, iecData: null, tutor_config: null };

export function getDatos(seccion) {
  const raw = localStorage.getItem(`${PREFIJO}${seccion}`);
  return raw ? JSON.parse(raw) : {};
}

export function setDatos(seccion, valor) {
  localStorage.setItem(`${PREFIJO}${seccion}`, JSON.stringify(valor));
  window.ec0616tSync?.schedule();
}

export function isCompleto(seccion) {
  return localStorage.getItem(`${PREFIJO}${seccion}_completo`) === "true";
}

export function setCompleto(seccion, val = true) {
  const key = `${PREFIJO}${seccion}_completo`;
  if (val) localStorage.setItem(key, "true");
  else localStorage.removeItem(key);
}

export function limpiarTodo() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k?.startsWith(PREFIJO)) localStorage.removeItem(k);
  }
  localStorage.removeItem(ID_KEY);
}
