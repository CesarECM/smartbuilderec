// ─── wizard-ec0091/ia-objetivo.js — IA para Paso 2: Objetivo y alcance ───────

import { BACKEND_URL } from "./config.js";

async function _llamar(endpoint, payload) {
  const res = await fetch(`${BACKEND_URL}/${endpoint}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function _getDatosContexto() {
  const raw = localStorage.getItem("ec0091_datos");
  return raw ? JSON.parse(raw) : {};
}

export async function generarObjetivo91() {
  const btn    = document.getElementById("btn91GenObjetivo");
  const loader = document.getElementById("loader91Objetivo");
  const ta     = document.getElementById("obj91Objetivo");
  if (!btn || !ta) return;
  btn.disabled = true; btn.textContent = "Generando...";
  if (loader) loader.style.display = "block";
  try {
    const ctx = _getDatosContexto();
    const data = await _llamar("ec0091/ia/objetivo", {
      accion: "generar",
      organismo_certificador: ctx.oc91NombreOrganismo || "",
      tipo_entidad:           ctx.ent91Tipo           || "CE",
      nombre_entidad:         ctx.ent91Nombre         || "",
    });
    if (data.texto) ta.value = data.texto;
  } catch (err) {
    console.error("IA objetivo EC0091:", err);
  } finally {
    btn.disabled = false; btn.textContent = "✨ Generar con IA";
    if (loader) loader.style.display = "none";
  }
}

export async function revisarObjetivo91() {
  const btn    = document.getElementById("btn91RevObjetivo");
  const divRev = document.getElementById("revision91Objetivo");
  const ta     = document.getElementById("obj91Objetivo");
  if (!btn || !ta) return;
  const texto = ta.value.trim();
  if (!texto) return;
  btn.disabled = true; btn.textContent = "Revisando...";
  try {
    const data = await _llamar("ec0091/ia/objetivo", {
      accion:  "revisar",
      objetivo: texto,
      alcance:  document.getElementById("obj91Alcance")?.value.trim() || "",
    });
    if (divRev) {
      divRev.style.display = "block";
      divRev.innerHTML = data.resultado || data.texto || JSON.stringify(data);
    }
  } catch (err) {
    if (divRev) { divRev.style.display = "block"; divRev.textContent = `⚠️ Error: ${err.message}`; }
  } finally {
    btn.disabled = false; btn.textContent = "🔍 Revisar cumplimiento";
  }
}

export function initIAObjetivo91() {
  window.generarObjetivo91 = generarObjetivo91;
  window.revisarObjetivo91 = revisarObjetivo91;
  document.getElementById("btn91GenObjetivo")?.addEventListener("click", generarObjetivo91);
  document.getElementById("btn91RevObjetivo")?.addEventListener("click", revisarObjetivo91);
}
