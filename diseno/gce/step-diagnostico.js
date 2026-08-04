// ─── gce/step-diagnostico.js — Diagnóstico interactivo por EC ────────────────

import { state, setDatos, getDatos, esCandidato } from "./state.js";
import { BACKEND_URL } from "./config.js";

let _siNoState = {};

// ── Template shell (los reactivos se inyectan en initStepDiagnostico) ─────────

export function getTemplate() {
  return `<section id="gce-paso-diagnostico" class="gce-paso hidden">
  <div class="wizard-section-header">
    <h2>📝 Diagnóstico</h2>
    <p class="wizard-section-desc">
      Evalúa tus conocimientos previos. El resultado identifica tus posibilidades de éxito en el proceso de evaluación.
    </p>
  </div>
  <div id="gce-diag-instrucciones" style="background:var(--c-surface);border-radius:10px;padding:14px 16px;margin-bottom:20px;font-size:13px;color:var(--c-text-2)"></div>
  <div id="gce-diag-reactivos"></div>
  <div id="gce-diag-resultado" style="display:none;margin-top:24px;padding:20px;border-radius:12px;border:2px solid"></div>
  <div class="wizard-nav-btns" id="gce-diag-footer" style="display:none">
    <button id="gce-btn-finalizar-diag" class="btn-primary">✓ Finalizar diagnóstico</button>
  </div>
</section>`;
}

// ── Init ─────────────────────────────────────────────────────────────────────

export function initStepDiagnostico() {
  const cfg = state.estandar?.config?.diagnostico;
  if (!cfg) {
    document.getElementById("gce-diag-reactivos").innerHTML =
      '<p style="color:var(--c-text-3);font-size:13px">Diagnóstico no configurado para este estándar.</p>';
    return;
  }

  // Instrucciones
  const instrEl = document.getElementById("gce-diag-instrucciones");
  if (instrEl) instrEl.textContent = cfg.instrucciones || "";

  // Ver si ya hay diagnóstico completado
  const guardado = getDatos("diagnostico");
  if (guardado.fecha) {
    _mostrarResultado(guardado);
    return;
  }

  if (!esCandidato()) {
    document.getElementById("gce-diag-reactivos").innerHTML =
      '<p style="color:var(--c-text-3);font-size:13px">El candidato aún no ha realizado el diagnóstico.</p>';
    return;
  }

  _siNoState = {};
  _todosSI   = false;
  window.gceSiNoMarcar      = _siNoMarcar;
  window.gceDiagMarcarTodos = _marcarTodos;
  _renderToolbar(cfg.reactivos || []);
  _renderReactivos(cfg.reactivos || []);

  const footer = document.getElementById("gce-diag-footer");
  if (footer) footer.style.display = "flex";

  document.getElementById("gce-btn-finalizar-diag")
    ?.addEventListener("click", finalizarDiagnostico);
}

// ── Toolbar marcar / desmarcar todos ─────────────────────────────────────────

function _renderToolbar(reactivos) {
  const siNos = reactivos.filter(r => r.tipo === "si_no");
  if (!siNos.length) return;
  const el = document.getElementById("gce-diag-reactivos");
  if (!el) return;
  el.insertAdjacentHTML("beforebegin", `
    <div id="gce-diag-toolbar" style="display:flex;justify-content:flex-end;margin-bottom:10px">
      <button id="gce-btn-marcar-todos" onclick="gceDiagMarcarTodos()"
        class="btn-sm"
        style="font-size:12px;padding:5px 14px;border-radius:6px;border:1px solid var(--c-border);
               background:var(--c-surface);color:var(--c-text-2);cursor:pointer">
        ✅ Marcar todos SI
      </button>
    </div>`);
}

let _todosSI = false;

function _marcarTodos() {
  const cfg   = state.estandar?.config?.diagnostico;
  const nuevo = !_todosSI;
  (cfg?.reactivos || []).filter(r => r.tipo === "si_no").forEach(r => _siNoMarcar(r.num, nuevo));
  _todosSI = nuevo;
  const btn = document.getElementById("gce-btn-marcar-todos");
  if (btn) btn.textContent = nuevo ? "⬜ Desmarcar todos" : "✅ Marcar todos SI";
}

// ── Render de reactivos ───────────────────────────────────────────────────────

function _renderReactivos(reactivos) {
  const el = document.getElementById("gce-diag-reactivos");
  if (!el) return;
  el.innerHTML = reactivos.map(r => {
    if (r.tipo === "grupo_header")    return _htmlGrupoHeader(r);
    if (r.tipo === "seccion_header")  return _htmlSeccionHeader(r);
    if (r.tipo === "si_no")           return _htmlSiNo(r);
    if (r.tipo === "opcion_multiple") return _htmlOpcionMultiple(r);
    if (r.tipo === "relacion")        return _htmlRelacion(r);
    return "";
  }).join("");
}

function _htmlOpcionMultiple(r) {
  const opts = r.opciones.map(op => {
    const val = op.trim().charAt(0).toLowerCase();
    return `<label style="display:flex;align-items:flex-start;gap:8px;padding:8px 10px;border-radius:6px;cursor:pointer;border:1px solid var(--c-border);margin-bottom:6px;font-size:13px">
      <input type="radio" name="gce-diag-${r.num}" value="${val}" style="margin-top:2px;flex-shrink:0">
      <span>${op}</span>
    </label>`;
  }).join("");
  return `<div class="gce-reactivo" data-num="${r.num}" data-tipo="opcion_multiple" data-correcta="${r.respuesta_correcta}">
    <p style="font-weight:600;font-size:13px;margin-bottom:10px">${r.num}. ${r.pregunta}</p>
    <div>${opts}</div>
  </div>`;
}

function _htmlRelacion(r) {
  const pares = r.opciones.map(op =>
    `<div style="padding:6px 10px;border-radius:6px;background:var(--c-surface);font-size:12px;color:var(--c-text-2);margin-bottom:4px">✦ ${op}</div>`
  ).join("");
  return `<div class="gce-reactivo" data-num="${r.num}" data-tipo="relacion" data-correcta="${r.respuesta_correcta}">
    <p style="font-weight:600;font-size:13px;margin-bottom:8px">${r.num}. ${r.pregunta}</p>
    <div style="margin-bottom:8px">${pares}</div>
    <label style="display:flex;align-items:center;gap:8px;font-size:12px;cursor:pointer;color:var(--c-text-3)">
      <input type="checkbox" class="gce-relacion-confirm" data-num="${r.num}" style="width:15px;height:15px">
      Confirmo que conozco estas relaciones
    </label>
  </div>`;
}

function _htmlGrupoHeader(r) {
  return `<div style="margin:20px 0 6px;padding:8px 12px;background:#ecfdf5;border-left:3px solid #065f46;border-radius:4px">
    <span style="font-size:12px;font-weight:700;color:#065f46">${r.texto}</span>
  </div>`;
}

function _htmlSeccionHeader(r) {
  return `<div style="margin:10px 0 4px;font-size:10px;font-weight:700;color:var(--c-text-3);letter-spacing:.08em">${r.texto}</div>`;
}

function _htmlSiNo(r) {
  const val   = _siNoState[r.num];
  const siAct = val === true;
  const noAct = val === false;
  const _btn  = (lbl, isTrue) => {
    const act   = isTrue ? siAct : noAct;
    const color = isTrue ? "#065f46" : "#b91c1c";
    const bg    = isTrue ? "#ecfdf5" : "#fef2f2";
    return `<button type="button" data-sino-val="${isTrue}"
      onclick="gceSiNoMarcar(${r.num},${isTrue})"
      style="padding:3px 10px;border-radius:4px;font-weight:700;font-size:11px;cursor:pointer;
             border:1px solid ${act ? color : "var(--c-border)"};
             background:${act ? bg : "none"};color:${act ? color : "var(--c-text-3)"}">${lbl}</button>`;
  };
  return `<div id="gce-sino-${r.num}" style="display:flex;align-items:center;gap:8px;padding:5px 4px;border-bottom:1px solid var(--c-border)">
    <span style="flex:1;font-size:12px;color:var(--c-text-2)">${r.num}. ${r.descripcion}</span>
    <div style="display:flex;gap:4px;flex-shrink:0">${_btn("SI", true)}${_btn("NO", false)}</div>
  </div>`;
}

function _siNoMarcar(num, val) {
  _siNoState[num] = val;
  const row = document.getElementById(`gce-sino-${num}`);
  if (!row) return;
  row.querySelectorAll("button[data-sino-val]").forEach(btn => {
    const isSI  = btn.dataset.sinoVal === "true";
    const act   = isSI ? val === true : val === false;
    const color = isSI ? "#065f46" : "#b91c1c";
    const bg    = isSI ? "#ecfdf5" : "#fef2f2";
    btn.style.borderColor = act ? color : "var(--c-border)";
    btn.style.background  = act ? bg    : "none";
    btn.style.color       = act ? color : "var(--c-text-3)";
  });
}

// ── Cálculo de resultado ──────────────────────────────────────────────────────

function _calcularResultado() {
  const cfg      = state.estandar.config.diagnostico;
  const reactivos = cfg.reactivos || [];
  let correctas  = 0;

  reactivos.forEach(r => {
    if (r.tipo === "opcion_multiple") {
      const sel = document.querySelector(`input[name="gce-diag-${r.num}"]:checked`);
      if (sel && sel.value === r.respuesta_correcta) correctas++;
    } else if (r.tipo === "relacion") {
      const chk = document.querySelector(`.gce-relacion-confirm[data-num="${r.num}"]`);
      if (chk?.checked) correctas++;
    } else if (r.tipo === "si_no") {
      if (_siNoState[r.num] === true) correctas++;
    }
  });

  const _HEADERS = new Set(["grupo_header", "seccion_header"]);
  const total = reactivos.filter(r => !_HEADERS.has(r.tipo)).length;
  const tabla = cfg.tabla_interpretacion || [];
  const entry = tabla.find(t => correctas >= t.min && correctas <= t.max)
             || tabla[tabla.length - 1]
             || { posibilidad: "—", sugerencia: "Consulta con tu evaluador." };

  return {
    correctas,
    total,
    posibilidad: entry.posibilidad,
    sugerencia:  entry.sugerencia,
    fecha:       new Date().toISOString(),
  };
}

function _mostrarResultado(res) {
  const colores = { Altas: "#065f46", Medias: "#92400e", Bajas: "#7f1d1d" };
  const fondo   = { Altas: "#ecfdf5", Medias: "#fffbeb", Bajas: "#fef2f2" };
  const c = colores[res.posibilidad] || "#374151";
  const f = fondo[res.posibilidad]   || "#f9fafb";

  const resEl = document.getElementById("gce-diag-resultado");
  if (!resEl) return;
  resEl.style.display  = "block";
  resEl.style.borderColor = c;
  resEl.style.background  = f;
  resEl.innerHTML = `
    <div style="font-size:15px;font-weight:700;color:${c};margin-bottom:6px">
      Posibilidad de éxito: ${res.posibilidad}
    </div>
    <div style="font-size:13px;color:${c};margin-bottom:4px">
      ${res.correctas} de ${res.total} reactivos correctos
    </div>
    <div style="font-size:12px;color:${c};opacity:.8">${res.sugerencia}</div>`;

  document.getElementById("gce-diag-reactivos").style.display = "none";
}

// ── Finalizar ─────────────────────────────────────────────────────────────────

export async function finalizarDiagnostico() {
  const btn = document.getElementById("gce-btn-finalizar-diag");
  if (btn) { btn.disabled = true; btn.textContent = "Guardando…"; }

  const resultado = _calcularResultado();
  setDatos("diagnostico", resultado);

  try {
    const headers = await window.getAuthHeaders?.();
    if (headers) {
      await fetch(`${BACKEND_URL}/gce/procesos/${state.procesoId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ datos: state.datos, estado: "diagnostico" }),
      });
      if (state.proceso) state.proceso.estado = "diagnostico";
    }
  } catch { /* sync reintentará */ }

  _mostrarResultado(resultado);
  document.getElementById("gce-diag-footer")?.remove();
  window.actualizarSidebar?.();
}
