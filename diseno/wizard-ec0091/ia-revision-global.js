// ─── wizard-ec0091/ia-revision-global.js — Revisora cruzada Paso 13 ──────────

import { BACKEND_URL } from "./config.js";

async function _llamar(endpoint, payload) {
  const res = await fetch(`${BACKEND_URL}/${endpoint}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function _recolectarExpediente() {
  const leer = key => { const r = localStorage.getItem(key); return r ? JSON.parse(r) : {}; };
  return {
    datos:        leer("ec0091_datos"),
    objetivo:     leer("ec0091_objetivo"),
    lineas:       leer("ec0091_lineas"),
    muestreo:     leer("ec0091_muestreo"),
    documentos:   leer("ec0091_documentos"),
    cronograma:   leer("ec0091_cronograma"),
    lista:        leer("ec0091_lista"),
    ejecucion:    leer("ec0091_ejecucion"),
    hallazgos:    leer("ec0091_hallazgos"),
    informe:      leer("ec0091_informe"),
    cierre:       leer("ec0091_cierre"),
  };
}

export async function revisarExpedienteGlobal91() {
  const btn    = document.getElementById("btn91RevGlobal");
  const loader = document.getElementById("loader91RevGlobal");
  const divRev = document.getElementById("revision91Global");
  if (!btn) return;
  btn.disabled = true; btn.textContent = "Analizando...";
  if (loader) loader.style.display = "block";
  try {
    const expediente = _recolectarExpediente();
    const data = await _llamar("ec0091/ia/revision-global", { expediente });
    if (divRev) {
      divRev.style.display = "block";
      divRev.innerHTML = data.resultado || data.texto || JSON.stringify(data);
    }
  } catch (err) {
    if (divRev) { divRev.style.display = "block"; divRev.textContent = `⚠️ Error: ${err.message}`; }
  } finally {
    btn.disabled = false; btn.textContent = "🔍 Revisar expediente completo";
    if (loader) loader.style.display = "none";
  }
}

export function initIARevisionGlobal91() {
  window.revisarExpedienteGlobal91 = revisarExpedienteGlobal91;
  document.getElementById("btn91RevGlobal")?.addEventListener("click", revisarExpedienteGlobal91);
}
