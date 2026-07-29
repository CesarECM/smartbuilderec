// ─── gce/step-cedula.js — Cédula de Evaluación ────────────────────────────────

import { state, setDatos, getDatos, esCandidato, esEvaluador } from "./state.js";
import { BACKEND_URL } from "./config.js";
import { actualizarSidebar, mostrarPaso } from "./navigation.js";

const GV = id => document.getElementById("gce-ced-" + id)?.value?.trim() || "";

// ── Template ─────────────────────────────────────────────────────────────────

export function getTemplate() {
  return `<section id="gce-paso-cedula" class="gce-paso hidden">
  <div class="wizard-section-header">
    <h2>🏅 Cédula de Evaluación</h2>
    <p class="wizard-section-desc">Registro formal del resultado de la evaluación de competencia.</p>
  </div>
  <div id="gce-cedula-body"></div>
</section>`;
}

// ── Init ──────────────────────────────────────────────────────────────────────

export function initStepCedula() {
  _renderCedula();
}

function _renderCedula() {
  const body = document.getElementById("gce-cedula-body");
  if (!body) return;

  const d      = getDatos("cedula");
  const estado = state.proceso?.estado || "";
  const juicio = state.proceso?.juicio || d.juicio || null;
  const isCand = esCandidato();
  const editando = esEvaluador() && (estado === "juicio" || estado === "cierre");

  body.innerHTML = "";
  if (juicio) body.insertAdjacentHTML("beforeend", _bannerJuicio(juicio));

  // Candidato esperando que el evaluador emita la cédula
  if (isCand && estado === "juicio") {
    body.insertAdjacentHTML("beforeend", `
      <div style="padding:40px;text-align:center;color:var(--c-text-3)">
        <div style="font-size:40px;margin-bottom:16px">⏳</div>
        <p style="font-size:13px;font-weight:600">Tu evaluador está preparando la Cédula.<br>
        Recibirás los resultados completos en breve.</p>
      </div>`);
    return;
  }

  const noMarcados = _criteriosNoMarcados();
  body.insertAdjacentHTML("beforeend", _formCedula(d, editando, noMarcados));

  if (editando) {
    body.insertAdjacentHTML("beforeend", `
      <div style="text-align:right;margin-top:16px">
        <button id="gce-ced-btn-emitir" onclick="window.gceEmitirCedula()" class="btn-primary">
          Emitir Cédula y Notificar al Candidato
        </button>
      </div>`);
  }
  if (isCand && (estado === "cierre" || estado === "certificado")) {
    body.insertAdjacentHTML("beforeend", `
      <div style="text-align:right;margin-top:16px">
        <button onclick="window.gceIrEncuesta()" class="btn-primary">
          Ir a Encuesta de Satisfacción →
        </button>
      </div>`);
  }

  window.guardarCedula   = guardarCedula;
  window.gceEmitirCedula = emitirCedula;
  window.gceIrEncuesta   = () => mostrarPaso("encuesta");
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

function _bannerJuicio(juicio) {
  const esC  = juicio === "C";
  const bg   = esC ? "#ecfdf5" : "#fef2f2";
  const bord = esC ? "#6ee7b7"  : "#fca5a5";
  const col  = esC ? "#065f46"  : "#b91c1c";
  const txt  = esC ? "COMPETENTE" : "TODAVÍA NO COMPETENTE";
  return `<div style="background:${bg};border:1.5px solid ${bord};border-radius:10px;padding:16px 20px;margin-bottom:20px;display:flex;align-items:center;gap:14px">
    <span style="font-size:28px">${esC ? "✅" : "⚠️"}</span>
    <div>
      <div style="font-size:11px;color:${col};font-weight:700;letter-spacing:.5px">JUICIO DE EVALUACIÓN</div>
      <div style="font-size:22px;font-weight:800;color:${col}">${txt}</div>
    </div>
  </div>`;
}

function _criteriosNoMarcados() {
  const cfgReact = state.estandar?.config?.iec?.reactivos || [];
  return (getDatos("iec").reactivos || [])
    .filter(r => r.cumple === false)
    .map(r => {
      const cfg = cfgReact.find(c => c.codigo === r.codigo);
      return `<li style="margin-bottom:4px"><b>${r.codigo}:</b> ${cfg?.descripcion || r.codigo}</li>`;
    });
}

function _ta(id, lbl, ph, val, editable) {
  return `<div class="form-group">
    <label class="form-label">${lbl}</label>
    <textarea id="gce-ced-${id}" class="form-input" rows="3" placeholder="${ph}"
      ${editable ? "" : "disabled"} oninput="window.guardarCedula()">${val}</textarea>
  </div>`;
}

function _formCedula(d, editando, noMarcados) {
  const noMarcHTML = noMarcados.length
    ? `<div class="form-group">
        <label class="form-label">Criterios no cubiertos</label>
        <ul style="margin:4px 0;padding:0 0 0 16px;font-size:12px;color:var(--c-text-2)">${noMarcados.join("")}</ul>
      </div>` : "";
  return `<div class="gce-form">
    <div class="form-group">
      <label class="form-label">Fecha de la cédula</label>
      <input id="gce-ced-fecha" type="date" class="form-input" style="max-width:200px"
             value="${d.fecha || ''}" ${editando ? "" : "disabled"} oninput="window.guardarCedula()">
    </div>
    ${_ta("mejores",       "Mejores prácticas observadas",  "Describe los desempeños destacados del candidato…", d.mejores_practicas || "", editando)}
    ${_ta("areas",         "Áreas de oportunidad",          "Aspectos en los que el candidato puede mejorar…",  d.areas_oportunidad || "", editando)}
    ${noMarcHTML}
    ${_ta("recomendaciones","Recomendaciones",               "Sugerencias para el candidato o el CE…",           d.recomendaciones   || "", editando)}
  </div>`;
}

// ── Guardar / Emitir ──────────────────────────────────────────────────────────

export function guardarCedula() {
  setDatos("cedula", {
    fecha:             document.getElementById("gce-ced-fecha")?.value || "",
    mejores_practicas: GV("mejores"),
    areas_oportunidad: GV("areas"),
    recomendaciones:   GV("recomendaciones"),
    juicio:            state.proceso?.juicio || null,
  });
}

export async function emitirCedula() {
  guardarCedula();
  const btn = document.getElementById("gce-ced-btn-emitir");
  if (btn) { btn.disabled = true; btn.textContent = "Guardando…"; }
  try {
    const headers = await window.getAuthHeaders?.();
    if (!headers) return;
    const res = await fetch(`${BACKEND_URL}/gce/procesos/${state.procesoId}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ datos: state.datos, estado: "cierre" }),
    });
    if (!res.ok) throw new Error();
    if (state.proceso) state.proceso.estado = "cierre";
    actualizarSidebar();
    _renderCedula();
  } catch {
    if (btn) { btn.disabled = false; btn.textContent = "Emitir Cédula y Notificar al Candidato"; }
  }
}
