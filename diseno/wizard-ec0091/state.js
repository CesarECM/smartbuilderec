// ─── wizard-ec0091/state.js — Estado global del wizard EC0091 ────────────────

const PREFIJO = "ec0091_";

export const state = {
  modoLibre: false,
  perfil:    null,
};

export function getSeccionCompleta(seccion) {
  return localStorage.getItem(`${PREFIJO}${seccion}_completo`) === "true";
}

export function setSeccionCompleta(seccion, valor = true) {
  const key = `${PREFIJO}${seccion}_completo`;
  if (valor) {
    localStorage.setItem(key, "true");
  } else {
    localStorage.removeItem(key);
  }
}

export function getDatos(seccion) {
  const raw = localStorage.getItem(`${PREFIJO}${seccion}`);
  return raw ? JSON.parse(raw) : null;
}

export function setDatos(seccion, valor) {
  localStorage.setItem(`${PREFIJO}${seccion}`, JSON.stringify(valor));
  window.ec0091Sync?.schedule();
}

export function limpiarTodo() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIJO)) localStorage.removeItem(k);
  }
  localStorage.removeItem("sbe_ec0091_id");
}
