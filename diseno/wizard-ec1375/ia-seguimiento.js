// ─── wizard-ec1375/ia-seguimiento.js — IA Plan de seguimiento (E4326) ─────────

import { BACKEND_URL } from "./config.js";

export function initIASeguimiento75() {
  const btn = document.getElementById("btn75IAplan");
  if (btn) btn.addEventListener("click", _generarPlanIA);

  window.btn75IAplan_click = _generarPlanIA;
}

async function _generarPlanIA() {
  const btn = document.getElementById("btn75IAplan");
  const out  = document.getElementById("seg75IARespuesta");
  if (!btn || !out) return;

  btn.disabled = true;
  btn.textContent = "⏳ Generando…";
  out.style.display = "none";

  try {
    const rawUs  = localStorage.getItem("ec1375_usuario")        || "{}";
    const rawCon = localStorage.getItem("ec1375_consentimiento") || "{}";
    const rawSig = localStorage.getItem("ec1375_signos")         || "{}";
    const us  = JSON.parse(rawUs);
    const con = JSON.parse(rawCon);
    const sig = JSON.parse(rawSig);

    const payload = {
      nombre_usuario:   us.usr75Nombre    || "",
      edad:             us.usr75Edad      || "",
      motivo:           us.usr75Motivo    || "",
      antecedentes:     us.usr75Antecedentes || "",
      enfermedades:     us.usr75Enfermedades || "",
      tecnica:          con.con75Tecnica  || "",
      objetivo_sesion:  con.con75Objetivo || "",
      num_sesiones:     document.getElementById("seg75NumSesiones")?.value || "",
      frecuencia:       document.getElementById("seg75Frecuencia")?.value  || "",
      duracion:         document.getElementById("seg75Duracion")?.value    || "",
      spo2:             sig.sig75SpO2     || "",
      presion:          `${sig.sig75PAS || ""}/${sig.sig75PAD || ""}`,
    };

    const headers = await getAuthHeaders?.() || {};
    headers["Content-Type"] = "application/json";

    const res = await fetch(`${BACKEND_URL}/ec1375/ia/seguimiento`, {
      method:  "POST",
      headers,
      body:    JSON.stringify({ accion: "generar", ...payload }),
    });

    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.detail || `Error ${res.status}`);
    }

    const data = await res.json();
    out.innerHTML = (data.plan || "").replace(/\n/g, "<br>");
    out.style.display = "block";

    // Copiar sugerencia en el campo si está vacío
    const campo = document.getElementById("seg75ObjetivoSesion");
    if (campo && !campo.value.trim() && data.objetivos) campo.value = data.objetivos;

  } catch (err) {
    out.innerHTML = `<span style="color:#b91c1c;">Error: ${err.message}</span>`;
    out.style.display = "block";
  } finally {
    btn.disabled = false;
    btn.textContent = "✨ Generar plan con IA";
  }
}
