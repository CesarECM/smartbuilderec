// ─── wizard-ec0091/step-lineas.js — Paso 4: Líneas de verificación ───────────

import { TIPOS_LINEA } from "./config.js";

let _lineasSeleccionadas = {};

export function cargarLineas91() {
  const raw = localStorage.getItem("ec0091_lineas");
  if (!raw) return;
  const d = JSON.parse(raw);
  _lineasSeleccionadas = d.lineas || {};
  Object.entries(_lineasSeleccionadas).forEach(([tipo, datos]) => {
    const card = document.querySelector(`.linea-card[data-tipo="${tipo}"]`);
    if (card) card.classList.toggle("selected", !!datos.seleccionada);
    const actEl = document.getElementById(`linea91-actividades-${tipo}`);
    if (actEl && datos.actividades) actEl.value = datos.actividades;
    if (datos.seleccionada) _mostrarActividades(tipo);
  });
  _actualizarValidacion();
}

export function guardarLineas91() {
  TIPOS_LINEA.forEach(t => {
    if (!_lineasSeleccionadas[t.id]) _lineasSeleccionadas[t.id] = { seleccionada: false, actividades: "" };
    const actEl = document.getElementById(`linea91-actividades-${t.id}`);
    if (actEl) _lineasSeleccionadas[t.id].actividades = actEl.value.trim();
  });
  localStorage.setItem("ec0091_lineas", JSON.stringify({ lineas: _lineasSeleccionadas }));
  localStorage.setItem("ec0091_lineas_completo", "true");
  document.getElementById("nav91-lineas")?.classList.add("completed");
  document.getElementById("nav91-muestreo")?.classList.remove("disabled");
  window.ec0091Sync?.schedule();
}

export function validarLineas91() {
  const tipos = TIPOS_LINEA.map(t => t.id);
  const seleccionadas = tipos.filter(t => _lineasSeleccionadas[t]?.seleccionada);
  const tieneProc = seleccionadas.includes("proceso");
  const tieneProd = seleccionadas.includes("producto");
  const tienePers = seleccionadas.includes("persona");
  const errEl = document.getElementById("err91-lineas");
  if (!tieneProc || !tieneProd || !tienePers) {
    if (errEl) { errEl.style.display = "block"; errEl.textContent = "⚠️ El EC0091 requiere mínimo una línea de Proceso, una de Producto y una de Persona."; }
    return false;
  }
  if (errEl) errEl.style.display = "none";
  return true;
}

function _mostrarActividades(tipo) {
  const det = document.getElementById(`linea91-det-${tipo}`);
  if (det) det.style.display = "block";
}

function _ocultarActividades(tipo) {
  const det = document.getElementById(`linea91-det-${tipo}`);
  if (det) det.style.display = "none";
}

function _actualizarValidacion() {
  const seleccionadas = TIPOS_LINEA.filter(t => _lineasSeleccionadas[t.id]?.seleccionada);
  const tieneAll = seleccionadas.length >= 3 && ["proceso","producto","persona"].every(t => _lineasSeleccionadas[t]?.seleccionada);
  const errEl = document.getElementById("err91-lineas");
  if (errEl) errEl.style.display = tieneAll ? "none" : "block";
  const revBtn = document.getElementById("btn91RevLineas");
  if (revBtn) revBtn.style.display = seleccionadas.length > 0 ? "inline-block" : "none";
}

export function initStepLineas91() {
  window.cargarLineas91  = cargarLineas91;
  window.guardarLineas91 = guardarLineas91;
  window.validarLineas91 = validarLineas91;

  document.querySelectorAll(".linea-card[data-tipo]").forEach(card => {
    card.addEventListener("click", () => {
      const tipo = card.dataset.tipo;
      if (!_lineasSeleccionadas[tipo]) _lineasSeleccionadas[tipo] = { seleccionada: false, actividades: "" };
      const nuevaSeleccion = !_lineasSeleccionadas[tipo].seleccionada;
      _lineasSeleccionadas[tipo].seleccionada = nuevaSeleccion;
      card.classList.toggle("selected", nuevaSeleccion);
      if (nuevaSeleccion) _mostrarActividades(tipo); else _ocultarActividades(tipo);
      _actualizarValidacion();
    });
  });
}

export function getTemplate() {
  const cards = TIPOS_LINEA.map(t => `
    <div class="linea-card" data-tipo="${t.id}">
      <h4>${t.label}</h4>
      <p>${t.desc}</p>
    </div>
    <div id="linea91-det-${t.id}" style="display:none;grid-column:1/-1;margin-bottom:8px;">
      <label style="font-size:13px;font-weight:600;color:#1a4a6b;">Actividades a verificar — ${t.label}</label>
      <textarea id="linea91-actividades-${t.id}" rows="3" style="width:100%;margin-top:6px;font-size:13px;" placeholder="Describe las actividades, documentos o personas a verificar en esta línea..."></textarea>
    </div>`).join("");

  return `
  <section id="sec91Lineas" class="wizard-section hidden">
    <p class="paso-titulo">Paso 4 de 13</p>
    <h1>Líneas de Verificación</h1>
    <div class="card" style="max-width:860px;">
      <p style="color:#555;font-size:14px;">Selecciona las líneas de verificación que aplicarás. <strong>El EC0091 requiere mínimo una de cada tipo.</strong></p>

      <div style="display:flex;gap:8px;margin-bottom:16px;flex-wrap:wrap;">
        <button type="button" id="btn91RevLineas" class="btn-ia" style="display:none;">🔍 Verificar cobertura con IA</button>
      </div>

      <div class="lineas-grid" style="grid-template-columns:repeat(3,1fr);">
        ${cards}
      </div>

      <span class="error-msg" id="err91-lineas" style="display:block;">⚠️ Selecciona al menos una línea de Proceso, una de Producto y una de Persona.</span>

      <div id="revision91Lineas" class="revision-resultado" style="display:none;margin-top:12px;"></div>

      <button class="btn-siguiente" id="btn91SigLineas" style="margin-top:16px;">Siguiente →</button>
    </div>
  </section>`;
}
