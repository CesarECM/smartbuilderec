// ─── wizard-ec1375/step-espacio.js — Paso 2: Espacio y protocolos (E4323) ─────

import { CHECKLIST_ESPACIO, CHECKLIST_SANITARIO } from "./config.js";

export function cargarEspacio75() {
  const raw = localStorage.getItem("ec1375_espacio");
  if (!raw) return;
  const d = JSON.parse(raw);
  [...CHECKLIST_ESPACIO, ...CHECKLIST_SANITARIO].forEach(({ id }) => {
    const el = document.getElementById(`chk75_${id}`);
    if (el) el.checked = !!d[id];
  });
  const obs = document.getElementById("esp75Observaciones");
  if (obs && d.observaciones !== undefined) obs.value = d.observaciones;
}

export function guardarEspacio75() {
  const datos = {};
  [...CHECKLIST_ESPACIO, ...CHECKLIST_SANITARIO].forEach(({ id }) => {
    datos[id] = !!(document.getElementById(`chk75_${id}`)?.checked);
  });
  const obs = document.getElementById("esp75Observaciones");
  datos.observaciones = obs?.value.trim() || "";
  localStorage.setItem("ec1375_espacio", JSON.stringify(datos));
  localStorage.setItem("ec1375_espacio_completo", "true");
  document.getElementById("nav75-espacio")?.classList.add("completed");
  document.getElementById("nav75-usuario")?.classList.remove("disabled");
  window.ec1375Sync?.schedule();
}

export function initStepEspacio75() {
  window.cargarEspacio75  = cargarEspacio75;
  window.guardarEspacio75 = guardarEspacio75;
}

function _checklistHTML(items) {
  return items.map(({ id, label }) =>
    `<label class="checklist-ec1375">
      <input type="checkbox" id="chk75_${id}">
      <span>${label}</span>
    </label>`
  ).join("\n");
}

export function getTemplate() {
  return `
  <section id="sec75Espacio" class="wizard-section hidden">
    <p class="paso-titulo">Paso 2 de 7 — Elemento E4323</p>
    <h1>Espacio y Protocolos Sanitarios</h1>
    <div class="card" style="max-width:860px;">
      <p style="color:#555;font-size:14px;">
        Verifica que el espacio de atención y los protocolos de seguridad sanitaria estén
        en orden antes de recibir al usuario.
      </p>

      <h3 style="font-size:15px;font-weight:700;margin-bottom:10px;">Protocolos de seguridad sanitaria</h3>
      <div class="checklist-ec1375">
        ${_checklistHTML(CHECKLIST_SANITARIO)}
      </div>

      <h3 style="font-size:15px;font-weight:700;margin:20px 0 10px;">Condiciones del espacio de atención</h3>
      <div class="checklist-ec1375">
        ${_checklistHTML(CHECKLIST_ESPACIO)}
      </div>

      <div class="form-group" style="margin-top:20px;">
        <label for="esp75Observaciones">Observaciones adicionales del espacio</label>
        <textarea id="esp75Observaciones" rows="3"
          placeholder="Ej. Temperatura ambiental adecuada, música de relajación encendida, aromaterapia preparada…"></textarea>
      </div>

      <button class="btn-siguiente" id="btn75SigEspacio">Siguiente →</button>
    </div>
  </section>`;
}
