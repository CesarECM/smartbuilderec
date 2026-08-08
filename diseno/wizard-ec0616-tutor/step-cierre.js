// ─── wizard-ec0616-tutor/step-cierre.js — Paso 12: Cédula y Encuesta ────────

import { getDatos, setDatos, setCompleto } from "./state.js";
import { fetchTutorIEC } from "./api.js";
import { calcularJuicioFinal } from "./step-iec.js";

const ENCUESTA = [
  { id: "atencion_evaluador",     label: "Atención del evaluador" },
  { id: "claridad_instrucciones", label: "Claridad de las instrucciones" },
  { id: "instalaciones",          label: "Condiciones de las instalaciones" },
  { id: "tiempo_adecuado",        label: "Tiempo de evaluación adecuado" },
];

function _encBtnStyle(sel) {
  const base = "padding:5px 12px;border-radius:4px;font-weight:700;font-size:13px;cursor:pointer;min-width:38px;";
  return sel
    ? base + "border:1px solid #3b82f6;background:#eff6ff;color:#1d4ed8;"
    : base + "border:1px solid #e5e7eb;background:none;color:#9ca3af;";
}

function _htmlEncItem(item) {
  const btns = [1, 2, 3, 4, 5].map(n =>
    `<button class="enc-btn" data-item="${item.id}" data-val="${n}" style="${_encBtnStyle(false)}">${n}</button>`
  ).join("");
  return `<div style="display:flex;align-items:center;justify-content:space-between;padding:10px 0;border-bottom:1px solid #f3f4f6;gap:12px;flex-wrap:wrap;">
    <span style="font-size:13px;color:#374151;">${item.label}</span>
    <div style="display:flex;gap:4px;">${btns}</div>
  </div>`;
}

// ── Template ──────────────────────────────────────────────────────────────────

export function getTemplate() {
  return `
  <section id="secTCierre" class="wizard-section hidden">
    <p class="paso-titulo">Paso 12 de 12</p>
    <h1>Cédula y Encuesta</h1>

    <div class="card" style="max-width:760px;margin-bottom:20px;">
      <h2 style="font-size:16px;font-weight:700;color:#1f2937;margin:0 0 14px;">📋 Cédula de Evaluación</h2>
      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap;">
          <div>
            <span style="font-size:11px;color:#6b7280;display:block;margin-bottom:2px;">Puntaje IEC total</span>
            <span id="cierre-ptj" style="font-size:22px;font-weight:800;color:#1f2937;">—</span>
          </div>
          <div id="cierre-juicio" style="font-size:14px;font-weight:700;color:#92400e;">Calculando…</div>
        </div>
        <p style="font-size:11px;color:#9ca3af;margin:8px 0 0;">Calculado automáticamente del IEC aplicado. No editable.</p>
      </div>

      <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:4px;">Observaciones del evaluador</label>
      <textarea id="cierre-obs" rows="4" placeholder="Observaciones, evidencias adicionales, comentarios del proceso…"
        style="width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;resize:vertical;box-sizing:border-box;"></textarea>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-top:12px;">
        <div>
          <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:4px;">Nombre del evaluador</label>
          <input id="cierre-evaluador" type="text" placeholder="Nombre completo"
            style="width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;">
        </div>
        <div>
          <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin-bottom:4px;">Fecha de evaluación</label>
          <input id="cierre-fecha" type="date"
            style="width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;box-sizing:border-box;">
        </div>
      </div>
    </div>

    <div class="card" style="max-width:760px;">
      <h2 style="font-size:16px;font-weight:700;color:#1f2937;margin:0 0 4px;">⭐ Encuesta de Satisfacción</h2>
      <p style="font-size:12px;color:#6b7280;margin:0 0 12px;">Candidato: califica del <strong>1</strong> (deficiente) al <strong>5</strong> (excelente).</p>
      <div id="cierre-encuesta">${ENCUESTA.map(_htmlEncItem).join("")}</div>
      <label style="font-size:12px;font-weight:600;color:#374151;display:block;margin:16px 0 4px;">Comentarios libres</label>
      <textarea id="cierre-comentarios" rows="3" placeholder="El candidato puede escribir sus comentarios aquí…"
        style="width:100%;padding:8px 10px;border:1px solid #d1d5db;border-radius:6px;font-size:13px;resize:vertical;box-sizing:border-box;"></textarea>

      <button class="btn-siguiente" id="btn-cierre-finalizar" style="margin-top:20px;">✅ Finalizar evaluación</button>
      <div id="cierre-zip-area" style="display:none;margin-top:16px;padding:16px;background:#ecfdf5;border:1px solid #6ee7b7;border-radius:8px;text-align:center;">
        <p style="font-size:13px;color:#065f46;font-weight:600;margin:0 0 10px;">✅ Evaluación registrada — descarga el portafolio completo</p>
        <button id="btn-cierre-generar-zip"
          style="padding:10px 20px;background:#065f46;color:#fff;border:none;border-radius:6px;font-size:13px;font-weight:700;cursor:pointer;">
          📦 Generar portafolio (.zip)
        </button>
        <div id="cierre-zip-loader" style="display:none;font-size:12px;color:#6b7280;margin-top:8px;">⏳ Generando documentos, por favor espera…</div>
        <div id="cierre-zip-msg"    style="display:none;font-size:12px;margin-top:8px;"></div>
      </div>
    </div>
  </section>`;
}

// ── Init ──────────────────────────────────────────────────────────────────────

export async function initStepCierre() {
  const iecData  = await fetchTutorIEC();
  const allReact = iecData?.reactivos || [];
  const { total, competente } = calcularJuicioFinal(allReact);

  const ptjEl = document.getElementById("cierre-ptj");
  const juiEl = document.getElementById("cierre-juicio");
  if (ptjEl) ptjEl.textContent = total.toFixed(2);
  if (juiEl) {
    juiEl.textContent = competente ? "✅ Competente (C)" : "❌ Todavía No Competente (TNC)";
    juiEl.style.color = competente ? "#065f46" : "#b91c1c";
  }

  const saved  = getDatos("cierre");
  const _enc   = { ...(saved.encuesta || {}) };
  const campos = { obs: "cierre-obs", evaluador: "cierre-evaluador", fecha: "cierre-fecha", comentarios: "cierre-comentarios" };

  Object.entries(campos).forEach(([k, id]) => {
    const el = document.getElementById(id);
    if (el && saved[k]) el.value = saved[k];
  });
  ENCUESTA.forEach(item => { if (_enc[item.id] != null) _seleccionar(item.id, _enc[item.id]); });

  document.getElementById("secTCierre")?.addEventListener("click", e => {
    const btn = e.target.closest(".enc-btn[data-item][data-val]");
    if (!btn) return;
    const { item } = btn.dataset;
    const val = +btn.dataset.val;
    _seleccionar(item, val);
    _enc[item] = val;
    _guardar(total, competente, _enc);
  });

  Object.values(campos).forEach(id => {
    document.getElementById(id)?.addEventListener("input", () => _guardar(total, competente, _enc));
  });

  document.getElementById("btn-cierre-finalizar")?.addEventListener("click", () => {
    _guardar(total, competente, _enc);
    setCompleto("cierre");
    document.getElementById("navT-cierre")?.classList.add("completed");
    const finBtn = document.getElementById("btn-cierre-finalizar");
    if (finBtn) { finBtn.disabled = true; finBtn.textContent = "✅ Evaluación finalizada"; }
    const zipArea = document.getElementById("cierre-zip-area");
    if (zipArea) zipArea.style.display = "block";
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function _seleccionar(itemId, val) {
  document.querySelectorAll(`.enc-btn[data-item="${itemId}"]`).forEach(b => {
    b.style.cssText = _encBtnStyle(+b.dataset.val === val);
  });
}

function _guardar(total, competente, encuesta) {
  setDatos("cierre", {
    obs:          document.getElementById("cierre-obs")?.value          || "",
    evaluador:    document.getElementById("cierre-evaluador")?.value    || "",
    fecha:        document.getElementById("cierre-fecha")?.value        || "",
    comentarios:  document.getElementById("cierre-comentarios")?.value  || "",
    encuesta,
    puntaje_total: +total.toFixed(2),
    juicio:        competente ? "C" : "TNC",
    guardado:      new Date().toISOString(),
  });
}
