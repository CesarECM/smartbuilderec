// ─── wizard-ec0091/ia-informe.js — IA para Paso 11: Informe ─────────────────

import { BACKEND_URL } from "./config.js";

async function _llamar(endpoint, payload) {
  const res = await fetch(`${BACKEND_URL}/${endpoint}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function _getContexto() {
  const raw91Datos    = localStorage.getItem("ec0091_datos");
  const raw91Hallazgos = localStorage.getItem("ec0091_hallazgos");
  const datos         = raw91Datos    ? JSON.parse(raw91Datos)    : {};
  const hallazgos     = raw91Hallazgos ? JSON.parse(raw91Hallazgos) : {};
  return { datos, hallazgos: hallazgos.hallazgos || [] };
}

export async function generarInforme91() {
  const btn    = document.getElementById("btn91GenInforme");
  const loader = document.getElementById("loader91Informe");
  const ta     = document.getElementById("inf91Resumen");
  if (!btn || !ta) return;
  btn.disabled = true; btn.textContent = "Generando...";
  if (loader) loader.style.display = "block";
  try {
    const { datos, hallazgos } = _getContexto();
    const data = await _llamar("ec0091/ia/informe", {
      accion:                 "generar",
      organismo_certificador: datos.oc91NombreOrganismo || "",
      nombre_entidad:         datos.ent91Nombre         || "",
      tipo_entidad:           datos.ent91Tipo            || "CE",
      num_hallazgos:          hallazgos.length,
      dictamen:               document.getElementById("inf91Dictamen")?.value || "",
    });
    if (data.resumen) ta.value = data.resumen;
    if (data.conclusiones) {
      const concEl = document.getElementById("inf91Conclusiones");
      if (concEl && !concEl.value.trim()) concEl.value = data.conclusiones;
    }
  } catch (err) {
    console.error("IA informe EC0091:", err);
  } finally {
    btn.disabled = false; btn.textContent = "✨ Generar con IA";
    if (loader) loader.style.display = "none";
  }
}

export async function revisarInforme91() {
  const btn    = document.getElementById("btn91RevInforme");
  const divRev = document.getElementById("revision91Informe");
  if (!btn) return;
  btn.disabled = true; btn.textContent = "Revisando...";
  try {
    const data = await _llamar("ec0091/ia/informe", {
      accion:       "revisar",
      resumen:      document.getElementById("inf91Resumen")?.value.trim()       || "",
      conclusiones: document.getElementById("inf91Conclusiones")?.value.trim()  || "",
      resultado:    document.getElementById("inf91ResultadoFinal")?.value.trim()|| "",
      dictamen:     document.getElementById("inf91Dictamen")?.value             || "",
    });
    if (divRev) { divRev.style.display = "block"; divRev.innerHTML = data.resultado || data.texto || JSON.stringify(data); }
  } catch (err) {
    if (divRev) { divRev.style.display = "block"; divRev.textContent = `⚠️ Error: ${err.message}`; }
  } finally {
    btn.disabled = false; btn.textContent = "🔍 Revisar 6 elementos";
  }
}

export function initIAInforme91() {
  window.generarInforme91 = generarInforme91;
  window.revisarInforme91 = revisarInforme91;
  document.getElementById("btn91GenInforme")?.addEventListener("click", generarInforme91);
  document.getElementById("btn91RevInforme")?.addEventListener("click", revisarInforme91);
}
