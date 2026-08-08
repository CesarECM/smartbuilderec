// ─── wizard-ec0616-tutor/step-plan.js — Paso 4: Plan de Evaluación ────────────

import { getDatos, setDatos, setCompleto } from "./state.js";
import { fetchTutorConfig } from "./api.js";

const SEC = "plan";
const _g  = id => document.getElementById(id)?.value.trim() || "";

function _renderActividades(actividades) {
  const el = document.getElementById("plan-acts");
  if (!el || !actividades?.length) return;
  el.innerHTML = actividades.map(a => `
    <div style="display:flex;gap:10px;padding:8px 10px;border-bottom:1px solid #f3f4f6;align-items:flex-start;">
      <span style="font-size:11px;font-weight:700;color:#9ca3af;min-width:24px;padding-top:1px;">${a.num}</span>
      <div style="flex:1;">
        <span style="font-size:11px;font-weight:600;color:#6b7280;display:block;margin-bottom:2px;">${a.tecnica}</span>
        <span style="font-size:12px;color:#374151;">${a.descripcion}</span>
      </div>
    </div>`).join("");
}

export function cargarPlan() {
  const d    = getDatos(SEC);
  const ficha = getDatos("ficha");
  const sv   = (id, v) => { const e = document.getElementById(id); if (e && v) e.value = v; };
  sv("plan-fecha-eval",  d.fecha_eval  || ficha.fecha_evaluacion);
  sv("plan-hora",        d.hora);
  sv("plan-lugar",       d.lugar);
  sv("plan-sesiones",    d.sesiones);
  sv("plan-fecha-res",   d.fecha_resultados);
  sv("plan-lugar-res",   d.lugar_resultados);
  sv("plan-obs",         d.observaciones);
}

export function guardarPlan() {
  setDatos(SEC, {
    fecha_eval:       _g("plan-fecha-eval"),
    hora:             _g("plan-hora"),
    lugar:            _g("plan-lugar"),
    sesiones:         _g("plan-sesiones"),
    fecha_resultados: _g("plan-fecha-res"),
    lugar_resultados: _g("plan-lugar-res"),
    observaciones:    _g("plan-obs"),
    fecha_guardado:   new Date().toISOString(),
  });
  setCompleto(SEC);
  document.getElementById("navT-plan")?.classList.add("completed");
  window.desbloquearT?.("navT-iec1");
  window.mostrarSeccionT?.("secTIEC1");
}

export async function initStepPlan() {
  const cfg = await fetchTutorConfig();
  _renderActividades(cfg?.plan_evaluacion?.actividades);
  cargarPlan();
  document.getElementById("btn-plan-sig")?.addEventListener("click", guardarPlan);
  window.guardarPlan = guardarPlan;
}

export function getTemplate() {
  return `
  <section id="secTPlan" class="wizard-section hidden">
    <p class="paso-titulo">Paso 4 de 12</p>
    <h1>Plan de Evaluación</h1>
    <div class="card" style="max-width:860px;">

      <h3 style="font-size:14px;color:#374151;margin:0 0 8px;">Actividades a evaluar</h3>
      <p style="font-size:12px;color:#9ca3af;margin:0 0 10px;">38 actividades del plan EC0616. Se verificarán durante la aplicación del IEC (Pasos 5-11).</p>
      <div id="plan-acts"
        style="max-height:220px;overflow-y:auto;border:1px solid #e5e7eb;border-radius:8px;margin-bottom:20px;">
        <div style="padding:20px;text-align:center;color:#9ca3af;font-size:13px;">Cargando actividades…</div>
      </div>

      <h3 style="font-size:14px;color:#374151;margin:0 0 12px;">Logística de la evaluación</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="plan-fecha-eval">Fecha de evaluación *</label>
          <input type="date" id="plan-fecha-eval">
        </div>
        <div class="form-group">
          <label for="plan-hora">Horario</label>
          <input type="text" id="plan-hora" placeholder="Ej. 09:00 – 13:00 hrs">
        </div>
        <div class="form-group full-width">
          <label for="plan-lugar">Lugar de la evaluación</label>
          <input type="text" id="plan-lugar" placeholder="Institución, servicio o área donde se realizará">
        </div>
        <div class="form-group">
          <label for="plan-sesiones">Número de sesiones planeadas</label>
          <input type="number" id="plan-sesiones" placeholder="Ej. 2" min="1" max="10" style="max-width:120px;">
        </div>
      </div>

      <h3 style="font-size:14px;color:#374151;margin:16px 0 12px;">Comunicación de resultados</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="plan-fecha-res">Fecha de resultados</label>
          <input type="date" id="plan-fecha-res">
        </div>
        <div class="form-group">
          <label for="plan-lugar-res">Medio / lugar</label>
          <input type="text" id="plan-lugar-res" placeholder="Presencial o correo electrónico">
        </div>
      </div>

      <div class="form-group" style="margin-top:14px;">
        <label for="plan-obs">Observaciones y condiciones especiales</label>
        <textarea id="plan-obs" rows="3"
          placeholder="Condiciones del entorno, ajustes razonables, materiales especiales…"></textarea>
      </div>

      <button class="btn-siguiente" id="btn-plan-sig" style="margin-top:20px;">
        Siguiente → Iniciar IEC
      </button>
    </div>
  </section>`;
}
