// ─── wizard-ec0616-tutor/step-diagnostico.js — Paso 3: Diagnóstico ────────────

import { getDatos, setDatos, setCompleto } from "./state.js";
import { fetchTutorConfig } from "./api.js";

const SEC = "diagnostico";

// ── Render de reactivos ───────────────────────────────────────────────────────

function _htmlOpcionMultiple(r) {
  const opts = r.opciones.map(op => {
    const val = op.trim().charAt(0).toLowerCase();
    return `<label style="display:flex;align-items:flex-start;gap:8px;padding:7px 10px;border-radius:6px;
      cursor:pointer;border:1px solid #e5e7eb;margin-bottom:5px;font-size:13px;">
      <input type="radio" name="td-${r.num}" value="${val}" style="margin-top:2px;flex-shrink:0;">
      <span>${op}</span>
    </label>`;
  }).join("");
  return `<div class="td-reactivo" data-num="${r.num}" data-tipo="opcion_multiple" data-correcta="${r.respuesta_correcta}">
    <p style="font-weight:600;font-size:13px;margin:0 0 8px;">${r.num}. ${r.pregunta}</p>
    <div>${opts}</div>
  </div>`;
}

function _htmlRelacion(r) {
  const pares = r.opciones.map(op =>
    `<div style="padding:5px 8px;border-radius:5px;background:#f9fafb;font-size:12px;color:#6b7280;margin-bottom:3px;">✦ ${op}</div>`
  ).join("");
  return `<div class="td-reactivo" data-num="${r.num}" data-tipo="relacion" data-correcta="${r.respuesta_correcta}">
    <p style="font-weight:600;font-size:13px;margin:0 0 8px;">${r.num}. ${r.pregunta}</p>
    <div style="margin-bottom:8px;">${pares}</div>
    <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;color:#6b7280;">
      <input type="checkbox" class="td-relacion-ok" data-num="${r.num}" style="width:15px;height:15px;">
      El candidato conoce estas relaciones
    </label>
  </div>`;
}

function _htmlRespuestaCorta(r) {
  return `<div class="td-reactivo" data-num="${r.num}" data-tipo="respuesta_corta">
    <p style="font-weight:600;font-size:13px;margin:0 0 8px;">${r.num}. ${r.pregunta}</p>
    <textarea id="td-corta-${r.num}" rows="3"
      style="width:100%;border:1px solid #e5e7eb;border-radius:6px;padding:8px;font-size:13px;resize:vertical;"
      placeholder="Registra la respuesta verbal del candidato…"></textarea>
    <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;color:#6b7280;margin-top:6px;">
      <input type="checkbox" class="td-corta-ok" data-num="${r.num}" style="width:15px;height:15px;">
      Respuesta satisfactoria
    </label>
  </div>`;
}

function _renderReactivos(reactivos) {
  const el = document.getElementById("td-reactivos");
  if (!el) return;
  el.innerHTML = reactivos.map(r => {
    if (r.tipo === "opcion_multiple") return _htmlOpcionMultiple(r);
    if (r.tipo === "relacion")        return _htmlRelacion(r);
    if (r.tipo === "respuesta_corta") return _htmlRespuestaCorta(r);
    return "";
  }).join('<hr style="border:none;border-top:1px solid #f3f4f6;margin:14px 0;">');
}

// ── Cálculo y resultado ───────────────────────────────────────────────────────

function _calcularResultado(reactivos, tabla) {
  let correctas = 0;
  reactivos.forEach(r => {
    if (r.tipo === "opcion_multiple") {
      const sel = document.querySelector(`input[name="td-${r.num}"]:checked`);
      if (sel?.value === r.respuesta_correcta) correctas++;
    } else if (r.tipo === "relacion") {
      if (document.querySelector(`.td-relacion-ok[data-num="${r.num}"]`)?.checked) correctas++;
    } else if (r.tipo === "respuesta_corta") {
      if (document.querySelector(`.td-corta-ok[data-num="${r.num}"]`)?.checked) correctas++;
    }
  });
  const total = reactivos.filter(r => ["opcion_multiple","relacion","respuesta_corta"].includes(r.tipo)).length;
  const entry = (tabla || []).find(t => correctas >= t.min && correctas <= t.max)
             || { posibilidad: "—", sugerencia: "Consulta con el evaluador." };
  return { correctas, total, posibilidad: entry.posibilidad, sugerencia: entry.sugerencia, fecha: new Date().toISOString() };
}

function _mostrarResultado(res) {
  const C = { Altas: "#065f46", Medias: "#92400e", Bajas: "#7f1d1d" };
  const B = { Altas: "#ecfdf5", Medias: "#fffbeb", Bajas: "#fef2f2" };
  const c = C[res.posibilidad] || "#374151", bg = B[res.posibilidad] || "#f9fafb";
  const el = document.getElementById("td-resultado");
  if (!el) return;
  el.style.cssText = `display:block;margin-top:20px;padding:18px;border-radius:10px;border:2px solid ${c};background:${bg};`;
  el.innerHTML = `
    <div style="font-size:15px;font-weight:700;color:${c};margin-bottom:4px;">Posibilidad de éxito: ${res.posibilidad}</div>
    <div style="font-size:13px;color:${c};margin-bottom:4px;">${res.correctas} de ${res.total} reactivos correctos</div>
    <div style="font-size:12px;color:${c};opacity:.85;">${res.sugerencia}</div>`;
  document.getElementById("td-reactivos").style.display = "none";
  document.getElementById("td-footer")?.remove();
}

// ── Init ─────────────────────────────────────────────────────────────────────

export async function initStepDiagnostico() {
  const guardado = getDatos(SEC);
  if (guardado.fecha) { _mostrarResultadoGuardado(guardado); return; }

  const cfg = await fetchTutorConfig();
  const diag = cfg?.diagnostico;
  if (!diag?.reactivos?.length) {
    document.getElementById("td-reactivos").innerHTML =
      '<p style="color:#9ca3af;font-size:13px;">Diagnóstico no configurado para EC0616.</p>';
    return;
  }

  const instrEl = document.getElementById("td-instrucciones");
  if (instrEl) instrEl.textContent = diag.instrucciones || "";

  _renderReactivos(diag.reactivos);
  document.getElementById("td-footer").style.display = "block";

  document.getElementById("btn-td-finalizar")?.addEventListener("click", async () => {
    const btn = document.getElementById("btn-td-finalizar");
    if (btn) { btn.disabled = true; btn.textContent = "Guardando…"; }
    const resultado = _calcularResultado(diag.reactivos, diag.tabla_interpretacion);
    setDatos(SEC, resultado);
    setCompleto(SEC);
    document.getElementById("navT-diagnostico")?.classList.add("completed");
    window.desbloquearT?.("navT-plan");
    _mostrarResultado(resultado);
  });
}

function _mostrarResultadoGuardado(res) {
  _mostrarResultado(res);
  document.getElementById("navT-diagnostico")?.classList.add("completed");
  window.desbloquearT?.("navT-plan");
}

// ── Template ─────────────────────────────────────────────────────────────────

export function getTemplate() {
  return `
  <section id="secTDiagnostico" class="wizard-section hidden">
    <p class="paso-titulo">Paso 3 de 12</p>
    <h1>Diagnóstico</h1>
    <div class="card" style="max-width:860px;">
      <p id="td-instrucciones" style="font-size:13px;color:#6b7280;margin:0 0 16px;font-style:italic;"></p>
      <div id="td-reactivos" style="display:flex;flex-direction:column;gap:0;"></div>
      <div id="td-resultado" style="display:none;"></div>
      <div id="td-footer" style="display:none;margin-top:20px;">
        <button class="btn-siguiente" id="btn-td-finalizar">✓ Finalizar diagnóstico</button>
      </div>
    </div>
  </section>`;
}
