// ─── wizard-ec0091/ia-lista.js — IA para Paso 8: Lista de verificación ───────

import { BACKEND_URL } from "./config.js";

async function _llamar(endpoint, payload) {
  const res = await fetch(`${BACKEND_URL}/${endpoint}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function _getLineas() {
  const raw = localStorage.getItem("ec0091_lineas");
  return raw ? JSON.parse(raw) : {};
}

function _getObjetivo() {
  const raw = localStorage.getItem("ec0091_objetivo");
  return raw ? JSON.parse(raw) : {};
}

export async function generarLista91() {
  const btn    = document.getElementById("btn91GenLista");
  const loader = document.getElementById("loader91Lista");
  const ta     = document.getElementById("lista91Preguntas");
  if (!btn || !ta) return;
  btn.disabled = true; btn.textContent = "Generando...";
  if (loader) loader.style.display = "block";
  try {
    const lineas  = _getLineas();
    const objetivo = _getObjetivo();
    const data = await _llamar("ec0091/ia/lista", {
      accion:           "generar",
      lineas_activas:   Object.entries(lineas.lineas || {}).filter(([, v]) => v.seleccionada).map(([k]) => k),
      objetivo:         objetivo.objetivo || "",
      alcance:          objetivo.alcance  || "",
    });
    if (data.preguntas) ta.value = data.preguntas;
    else if (data.texto) ta.value = data.texto;
  } catch (err) {
    console.error("IA lista EC0091:", err);
  } finally {
    btn.disabled = false; btn.textContent = "✨ Generar preguntas con IA";
    if (loader) loader.style.display = "none";
  }
}

export async function revisarLista91() {
  const btn    = document.getElementById("btn91RevLista");
  const divRev = document.getElementById("revision91Lista");
  const ta     = document.getElementById("lista91Preguntas");
  if (!btn || !ta) return;
  const texto = ta.value.trim();
  if (!texto) return;
  btn.disabled = true; btn.textContent = "Revisando...";
  try {
    const data = await _llamar("ec0091/ia/lista", {
      accion:    "revisar",
      preguntas: texto,
    });
    if (divRev) {
      divRev.style.display = "block";
      divRev.innerHTML = data.resultado || data.texto || JSON.stringify(data);
    }
  } catch (err) {
    if (divRev) { divRev.style.display = "block"; divRev.textContent = `⚠️ Error: ${err.message}`; }
  } finally {
    btn.disabled = false; btn.textContent = "🔍 Revisar calidad con IA";
  }
}

export function initIALista91() {
  window.generarLista91 = generarLista91;
  window.revisarLista91 = revisarLista91;
  document.getElementById("btn91GenLista")?.addEventListener("click", generarLista91);
  document.getElementById("btn91RevLista")?.addEventListener("click", revisarLista91);
}
