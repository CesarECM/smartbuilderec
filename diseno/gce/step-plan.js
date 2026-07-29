// ─── gce/step-plan.js — Plan de Evaluación + Acuerdo ─────────────────────────

import { state, setDatos, getDatos, esCandidato } from "./state.js";
import { BACKEND_URL } from "./config.js";
import { actualizarSidebar } from "./navigation.js";

const PV = id => document.getElementById("gce-p-" + id)?.value?.trim() || "";

// ── Template ─────────────────────────────────────────────────────────────────

export function getTemplate() {
  return `<section id="gce-paso-plan" class="gce-paso hidden">
  <div class="wizard-section-header">
    <h2>📅 Plan de Evaluación</h2>
    <p class="wizard-section-desc">Establece las condiciones de la evaluación. Ambas partes deben confirmar antes de iniciar evidencias.</p>
  </div>

  <div class="form-group-title">Actividades del plan</div>
  <div id="gce-plan-acts" style="max-height:280px;overflow-y:auto;border:1px solid var(--c-border);border-radius:8px"></div>

  <div class="form-group-title" style="margin-top:18px">Recursos necesarios</div>
  <ul id="gce-plan-rec" style="margin:0 0 4px;padding:0 0 0 18px;font-size:13px;color:var(--c-text-2)"></ul>

  <div class="form-group-title" style="margin-top:18px">Criterios para el juicio (C / TNC)</div>
  <div id="gce-plan-crit" style="font-size:12px;color:var(--c-text-2)"></div>

  <div class="form-group-title" style="margin-top:18px">Datos logísticos</div>
  <form id="gce-form-plan" oninput="window.guardarPlan()" class="gce-form">
    <div class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Fecha de la evaluación</label>
        <input id="gce-p-fecha-eval" type="date" class="form-input">
      </div>
      <div class="form-group">
        <label class="form-label">Horario</label>
        <input id="gce-p-hora-eval" class="form-input" placeholder="09:00 – 13:00 hrs">
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label class="form-label">Lugar de la evaluación</label>
        <input id="gce-p-lugar-eval" class="form-input" placeholder="Nombre de la instalación o dirección">
      </div>
      <div class="form-group">
        <label class="form-label">Fecha de comunicación de resultados</label>
        <input id="gce-p-fecha-res" type="date" class="form-input">
      </div>
      <div class="form-group">
        <label class="form-label">Horario</label>
        <input id="gce-p-hora-res" class="form-input" placeholder="15:00 hrs">
      </div>
      <div class="form-group" style="grid-column:1/-1">
        <label class="form-label">Lugar de comunicación de resultados</label>
        <input id="gce-p-lugar-res" class="form-input" placeholder="Presencial o correo electrónico">
      </div>
    </div>
  </form>

  <div class="form-group-title" style="margin-top:18px">Confirmación del plan</div>
  <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px">
    <div id="gce-plan-box-ev"   style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:10px;padding:16px"></div>
    <div id="gce-plan-box-cand" style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:10px;padding:16px"></div>
  </div>
  <div id="gce-plan-acordado" style="margin-top:12px;display:none;padding:12px 16px;background:#ecfdf5;border-radius:8px;font-size:13px;font-weight:600;color:#065f46">
    ✅ Plan acordado — ambas partes confirmaron.
  </div>
</section>`;
}

// ── Init ─────────────────────────────────────────────────────────────────────

export function initStepPlan() {
  _renderInfoConfig();
  cargarPlan();
  _renderFirmas();
  if (esCandidato()) {
    document.querySelectorAll("#gce-form-plan input").forEach(el => el.setAttribute("disabled", "true"));
  }
}

// ── Render estático desde config ──────────────────────────────────────────────

function _renderInfoConfig() {
  const cfg = state.estandar?.config?.plan_evaluacion || {};

  const actsEl = document.getElementById("gce-plan-acts");
  if (actsEl) {
    const acts = cfg.actividades || [];
    actsEl.innerHTML = acts.length
      ? `<table style="width:100%;border-collapse:collapse">
          <thead><tr style="background:var(--c-surface)">
            <th style="padding:6px 8px;text-align:left;font-size:10px;font-weight:700;color:var(--c-text-3);border-bottom:1px solid var(--c-border)">#</th>
            <th style="padding:6px 8px;text-align:left;font-size:10px;font-weight:700;color:var(--c-text-3);border-bottom:1px solid var(--c-border)">Técnica</th>
            <th style="padding:6px 8px;text-align:left;font-size:10px;font-weight:700;color:var(--c-text-3);border-bottom:1px solid var(--c-border)">Descripción</th>
          </tr></thead>
          <tbody>${acts.map(a => `<tr style="border-bottom:1px solid var(--c-border)">
            <td style="padding:5px 8px;font-size:11px;font-weight:700;color:var(--c-text-4)">${a.num}</td>
            <td style="padding:5px 8px;font-size:11px;color:var(--c-text-3);white-space:nowrap">${a.tecnica || '—'}</td>
            <td style="padding:5px 8px;font-size:11px;color:var(--c-text-2)">${a.descripcion || ''}</td>
          </tr>`).join('')}</tbody>
        </table>`
      : '<p style="padding:12px;font-size:12px;color:var(--c-text-3)">Sin actividades configuradas.</p>';
  }

  const recEl = document.getElementById("gce-plan-rec");
  if (recEl) {
    const r = cfg.recursos || [];
    recEl.innerHTML = r.map(x => `<li style="margin-bottom:4px">${x}</li>`).join("") || "<li>Sin recursos especificados.</li>";
  }

  const critEl = document.getElementById("gce-plan-crit");
  if (critEl) {
    critEl.innerHTML = `<div style="padding:10px 14px;background:var(--c-surface);border-radius:8px;border:1px solid var(--c-border)">
      ${cfg.puntaje_minimo != null ? `<div style="margin-bottom:4px"><b>Puntaje mínimo:</b> ${cfg.puntaje_minimo}</div>` : ""}
      ${cfg.criterio_1 ? `<div style="margin-bottom:4px"><b>Criterio 1:</b> ${cfg.criterio_1}</div>` : ""}
      ${cfg.criterio_2 ? `<div><b>Criterio 2:</b> ${cfg.criterio_2}</div>` : ""}
    </div>`;
  }
}

// ── Firma boxes ───────────────────────────────────────────────────────────────

function _firmaBox(tipo, firmaActual, esRol) {
  const titulo  = tipo === "ev" ? "✍️ Evaluador" : "✍️ Candidato";
  const accion  = tipo === "ev" ? "confirmarPlanEvaluador" : "confirmarPlanCandidato";
  const textoBtn = tipo === "ev" ? "Confirmar como evaluador" : "Confirmar como candidato";

  if (firmaActual) {
    return `<div style="font-size:12px;font-weight:700;color:var(--c-text);margin-bottom:6px">${titulo}</div>
      <div style="display:flex;align-items:center;gap:8px;color:#065f46;font-size:13px;font-weight:600">
        <span style="font-size:18px">✅</span>${firmaActual} — confirmado
      </div>`;
  }
  if (esRol) {
    return `<div style="font-size:12px;font-weight:700;color:var(--c-text);margin-bottom:10px">${titulo}</div>
      <div class="form-group"><label class="form-label">Tu nombre</label>
        <input id="gce-p-firma-${tipo}-nom" class="form-input" placeholder="Nombre completo">
      </div>
      <label style="display:flex;align-items:center;gap:8px;font-size:12px;margin:10px 0;cursor:pointer">
        <input id="gce-p-firma-${tipo}-ok" type="checkbox" style="width:15px;height:15px">
        Acepto el Plan de Evaluación tal como está presentado.
      </label>
      <button onclick="window.${accion}()" class="btn-primary" style="width:100%;margin-top:4px">${textoBtn}</button>`;
  }
  return `<div style="font-size:12px;font-weight:700;color:var(--c-text);margin-bottom:6px">${titulo}</div>
    <div style="font-size:12px;color:var(--c-text-3)">Pendiente de confirmación.</div>`;
}

function _renderFirmas() {
  const d    = getDatos("plan_evaluacion");
  const isCand = esCandidato();
  const isEval = !isCand;

  document.getElementById("gce-plan-box-ev")?.innerHTML !== undefined &&
    (document.getElementById("gce-plan-box-ev").innerHTML = _firmaBox("ev", d.firma_evaluador, isEval));
  document.getElementById("gce-plan-box-cand")?.innerHTML !== undefined &&
    (document.getElementById("gce-plan-box-cand").innerHTML = _firmaBox("cand", d.firma_candidato, isCand));

  if (d.firma_evaluador && d.firma_candidato) {
    const el = document.getElementById("gce-plan-acordado");
    if (el) el.style.display = "block";
  }
}

// ── Carga / Guardado ──────────────────────────────────────────────────────────

export function cargarPlan() {
  const d = getDatos("plan_evaluacion");
  const set = (id, v) => { const el = document.getElementById("gce-p-" + id); if (el) el.value = v || ""; };
  set("fecha-eval", d.fecha_evaluacion);    set("hora-eval",  d.horario_evaluacion);
  set("lugar-eval", d.lugar_evaluacion);    set("fecha-res",  d.fecha_resultados);
  set("hora-res",   d.horario_resultados);  set("lugar-res",  d.lugar_resultados);
}

export function guardarPlan() {
  setDatos("plan_evaluacion", {
    fecha_evaluacion: PV("fecha-eval"), horario_evaluacion: PV("hora-eval"),
    lugar_evaluacion: PV("lugar-eval"), fecha_resultados:  PV("fecha-res"),
    horario_resultados: PV("hora-res"), lugar_resultados:  PV("lugar-res"),
  });
}

// ── Confirmaciones ────────────────────────────────────────────────────────────

export async function confirmarPlanEvaluador() {
  const nom = document.getElementById("gce-p-firma-ev-nom")?.value?.trim();
  const ok  = document.getElementById("gce-p-firma-ev-ok")?.checked;
  if (!nom || !ok) { alert("Escribe tu nombre y acepta el plan."); return; }
  guardarPlan();
  setDatos("plan_evaluacion", { firma_evaluador: nom });
  await _checkAcuerdo();
  _renderFirmas();
}

export async function confirmarPlanCandidato() {
  const nom = document.getElementById("gce-p-firma-cand-nom")?.value?.trim();
  const ok  = document.getElementById("gce-p-firma-cand-ok")?.checked;
  if (!nom || !ok) { alert("Escribe tu nombre y acepta el plan."); return; }
  setDatos("plan_evaluacion", { firma_candidato: nom });
  await _checkAcuerdo();
  _renderFirmas();
}

async function _checkAcuerdo() {
  const d = getDatos("plan_evaluacion");
  if (!d.firma_evaluador || !d.firma_candidato) return;
  try {
    const headers = await window.getAuthHeaders?.();
    if (!headers) return;
    await fetch(`${BACKEND_URL}/gce/procesos/${state.procesoId}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ datos: state.datos, estado: "plan_acordado" }),
    });
    if (state.proceso) state.proceso.estado = "plan_acordado";
    actualizarSidebar();
  } catch { /* sync reintentará */ }
}
