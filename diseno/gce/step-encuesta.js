// ─── gce/step-encuesta.js — Encuesta de Satisfacción del candidato ────────────

import { state, setDatos, getDatos, esCandidato } from "./state.js";
import { BACKEND_URL } from "./config.js";
import { actualizarSidebar } from "./navigation.js";

const PREGUNTAS = [
  "¿La evaluación se realizó conforme a lo acordado en el Plan de Evaluación?",
  "¿El evaluador le explicó claramente el proceso de evaluación?",
  "¿Las instalaciones y condiciones donde se realizó la evaluación fueron adecuadas?",
  "¿Los instrumentos de evaluación fueron claros y comprensibles?",
  "¿El tiempo asignado para la evaluación fue suficiente?",
  "¿El evaluador le trató con respeto y profesionalismo?",
  "¿Recibió información clara sobre el resultado de su evaluación?",
  "En general, ¿quedó satisfecho con el proceso de evaluación?",
];

const ESCALA = [
  "1 – Muy insatisfecho",
  "2 – Insatisfecho",
  "3 – Satisfecho",
  "4 – Muy satisfecho",
];

// ── Template ─────────────────────────────────────────────────────────────────

export function getTemplate() {
  return `<section id="gce-paso-encuesta" class="gce-paso hidden">
  <div class="wizard-section-header">
    <h2>⭐ Encuesta de Satisfacción</h2>
    <p class="wizard-section-desc">Tu opinión sobre el proceso de evaluación es muy importante. Esta información es confidencial.</p>
  </div>
  <div id="gce-encuesta-body"></div>
</section>`;
}

// ── Init ──────────────────────────────────────────────────────────────────────

export function initStepEncuesta() {
  _renderEncuesta();
}

function _renderEncuesta() {
  const body = document.getElementById("gce-encuesta-body");
  if (!body) return;

  const d      = getDatos("encuesta");
  const cedula = getDatos("cedula");
  const estado = state.proceso?.estado || "";
  const juicio = state.proceso?.juicio || cedula.juicio || null;
  const isCand = esCandidato();

  body.innerHTML = "";

  if (juicio) body.insertAdjacentHTML("beforeend", _bannerResultado(juicio));

  // Solo el candidato puede responder
  if (!isCand) {
    body.insertAdjacentHTML("beforeend", `
      <div style="padding:32px;text-align:center;color:var(--c-text-3)">
        <div style="font-size:32px;margin-bottom:12px">🔒</div>
        <p style="font-size:13px">La encuesta es completada exclusivamente por el candidato.</p>
      </div>`);
    return;
  }

  // Encuesta no habilitada aún
  if (estado !== "cierre" && estado !== "certificado") {
    body.insertAdjacentHTML("beforeend", `
      <div style="padding:32px;text-align:center;color:var(--c-text-3)">
        <div style="font-size:32px;margin-bottom:12px">⏳</div>
        <p style="font-size:13px">La encuesta se habilitará cuando el evaluador emita la Cédula de Evaluación.</p>
      </div>`);
    return;
  }

  const cerrado  = estado === "certificado";
  const editando = !cerrado;
  const respuestas = d.respuestas?.length ? d.respuestas : Array(PREGUNTAS.length).fill(null);

  body.insertAdjacentHTML("beforeend", _formEncuesta(respuestas, d.observaciones || "", editando));

  if (cerrado) {
    body.insertAdjacentHTML("beforeend", _panelDescarga());
  } else {
    body.insertAdjacentHTML("beforeend", `
      <div style="text-align:right;margin-top:20px">
        <button id="gce-enc-btn-cerrar" onclick="window.gceCerrarProceso()" class="btn-primary">
          Enviar encuesta y cerrar proceso ✓
        </button>
      </div>`);
  }

  window.guardarEncuesta  = guardarEncuesta;
  window.gceCerrarProceso = cerrarProceso;
}

// ── HTML helpers ──────────────────────────────────────────────────────────────

function _bannerResultado(juicio) {
  const esC = juicio === "C";
  const col = esC ? "#065f46" : "#b91c1c";
  const bg  = esC ? "#ecfdf5" : "#fef2f2";
  const brd = esC ? "#6ee7b7" : "#fca5a5";
  return `<div style="background:${bg};border:1.5px solid ${brd};border-radius:10px;padding:14px 20px;margin-bottom:20px;display:flex;align-items:center;gap:12px">
    <span style="font-size:24px">${esC ? "✅" : "⚠️"}</span>
    <div style="font-size:13px;color:${col}">
      <span style="font-weight:700">Resultado del proceso: </span>
      ${esC ? "COMPETENTE" : "TODAVÍA NO COMPETENTE"}
    </div>
  </div>`;
}

function _formEncuesta(respuestas, observaciones, editable) {
  const pregs = PREGUNTAS.map((p, i) => {
    const val    = respuestas[i] ?? null;
    const dis    = editable ? "" : "disabled";
    const radios = ESCALA.map((e, j) => {
      const v = j + 1;
      return `<label style="display:flex;align-items:center;gap:6px;font-size:12px;cursor:${editable ? "pointer" : "default"};color:var(--c-text-2)">
        <input type="radio" name="gce-enc-${i}" value="${v}" ${val === v ? "checked" : ""} ${dis} onchange="window.guardarEncuesta()">
        ${e}
      </label>`;
    }).join("");
    return `<div style="padding:14px 0;border-bottom:1px solid var(--c-border)">
      <div style="font-size:13px;color:var(--c-text);margin-bottom:8px;font-weight:600">${i + 1}. ${p}</div>
      <div style="display:flex;flex-wrap:wrap;gap:10px 24px">${radios}</div>
    </div>`;
  }).join("");

  return `<div class="gce-form">
    ${pregs}
    <div class="form-group" style="margin-top:14px">
      <label class="form-label">Observaciones adicionales (opcional)</label>
      <textarea id="gce-enc-obs" class="form-input" rows="3"
        placeholder="Comentarios sobre el proceso de evaluación…"
        ${editable ? "" : "disabled"} oninput="window.guardarEncuesta()">${observaciones}</textarea>
    </div>
  </div>`;
}

function _panelDescarga() {
  return `<div style="margin-top:24px;background:var(--c-surface);border:1px solid var(--c-border);border-radius:10px;padding:24px;text-align:center">
    <div style="font-size:32px;margin-bottom:8px">🎉</div>
    <div style="font-size:15px;font-weight:700;color:var(--c-text);margin-bottom:6px">¡Proceso concluido!</div>
    <p style="font-size:12px;color:var(--c-text-3);margin-bottom:18px">Tu portafolio de evidencias está listo para su descarga oficial.</p>
    <button id="gce-btn-descarga" onclick="window.descargarPortafolioZip?.()" class="btn-primary">
      📥 Descargar Portafolio completo (ZIP)
    </button>
  </div>`;
}

// ── Guardar / Cerrar ──────────────────────────────────────────────────────────

export function guardarEncuesta() {
  const respuestas = PREGUNTAS.map((_, i) => {
    const sel = document.querySelector(`input[name="gce-enc-${i}"]:checked`);
    return sel ? parseInt(sel.value, 10) : null;
  });
  setDatos("encuesta", {
    respuestas,
    observaciones: document.getElementById("gce-enc-obs")?.value?.trim() || "",
    fecha: new Date().toISOString().slice(0, 10),
  });
}

export async function cerrarProceso() {
  const resp = PREGUNTAS.map((_, i) => {
    const sel = document.querySelector(`input[name="gce-enc-${i}"]:checked`);
    return sel ? parseInt(sel.value, 10) : null;
  });
  if (resp.includes(null)) {
    alert("Por favor responde todas las preguntas de la encuesta antes de enviar."); return;
  }
  guardarEncuesta();
  const btn = document.getElementById("gce-enc-btn-cerrar");
  if (btn) { btn.disabled = true; btn.textContent = "Enviando…"; }
  try {
    const headers = await window.getAuthHeaders?.();
    if (!headers) return;
    const res = await fetch(`${BACKEND_URL}/gce/procesos/${state.procesoId}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ datos: state.datos, estado: "certificado" }),
    });
    if (!res.ok) throw new Error();
    if (state.proceso) state.proceso.estado = "certificado";
    actualizarSidebar();
    _renderEncuesta();
  } catch {
    if (btn) { btn.disabled = false; btn.textContent = "Enviar encuesta y cerrar proceso ✓"; }
  }
}
