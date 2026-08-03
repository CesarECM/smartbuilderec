// ─── wizard-ec1375/state.js — Estado global del wizard EC1375 ────────────────

const PREFIJO = "ec1375_";

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
  window.ec1375Sync?.schedule();
}

export function limpiarTodo() {
  for (let i = localStorage.length - 1; i >= 0; i--) {
    const k = localStorage.key(i);
    if (k && k.startsWith(PREFIJO)) localStorage.removeItem(k);
  }
  localStorage.removeItem("sbe_ec1375_id");
}
