// ─── wizard-ec0616/ia-scorecard.js — Detectora de brechas global Paso 9 ──────

import { BACKEND_URL } from "./config.js";
import { ELEMENTOS }   from "./config.js";

async function _llamar(endpoint, payload) {
  const res = await fetch(`${BACKEND_URL}/${endpoint}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function _recolectarPortafolio() {
  const leer = key => { const r = localStorage.getItem(key); return r ? JSON.parse(r) : {}; };
  const datos = leer("ec0616_datos");
  const elementos = {};
  ELEMENTOS.forEach(e => { elementos[e.id] = leer(e.clave); });
  return { datos, elementos };
}

function _actualizarScorecard(resultados) {
  if (!Array.isArray(resultados)) return;
  resultados.forEach(res => {
    const elem      = ELEMENTOS.find(e => e.num === res.elemento_num || e.id === res.elemento_id);
    if (!elem) return;
    const statusEl  = document.getElementById(`sc16-status-${elem.id}`);
    const descEl    = document.getElementById(`sc16-desc-${elem.id}`);
    const cardEl    = document.getElementById(`sc16-${elem.id}`);
    const completo  = res.completo === true;
    if (statusEl) statusEl.textContent = completo ? "✅" : "⚠️";
    if (descEl)   descEl.textContent   = res.descripcion || (completo ? "Cobertura completa" : "Requiere más evidencia");
    if (cardEl) {
      cardEl.classList.toggle("completo",   completo);
      cardEl.classList.toggle("incompleto", !completo);
    }
  });
}

export async function analizarScorecard16() {
  const btn    = document.getElementById("btn16Scorecard");
  const loader = document.getElementById("loader16Scorecard");
  const divBrechas = document.getElementById("scorecard16Brechas");
  if (!btn) return;
  btn.disabled = true; btn.textContent = "Analizando...";
  if (loader) loader.style.display = "block";
  try {
    const payload = _recolectarPortafolio();
    const data = await _llamar("ec0616/ia/scorecard", payload);
    if (data.resultados) _actualizarScorecard(data.resultados);
    if (divBrechas && data.brechas_resumen) {
      divBrechas.style.display = "block";
      divBrechas.innerHTML = `<strong>⚠️ Brechas detectadas:</strong><br>${data.brechas_resumen}`;
    }
  } catch (err) {
    console.error("Scorecard EC0616:", err);
  } finally {
    btn.disabled = false; btn.textContent = "🤖 Analizar portafolio completo";
    if (loader) loader.style.display = "none";
  }
}

export function initIAScorecard16() {
  window.analizarScorecard16 = analizarScorecard16;
  document.getElementById("btn16Scorecard")?.addEventListener("click", analizarScorecard16);
}
