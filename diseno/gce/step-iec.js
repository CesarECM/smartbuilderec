// ─── gce/step-iec.js — IEC digital con auto-cálculo y juicio ─────────────────

import { state, setDatos, getDatos, esCandidato } from "./state.js";
import { BACKEND_URL } from "./config.js";
import { actualizarSidebar } from "./navigation.js";

// Mapa local de marcas C/NC por código de reactivo
let _marcas = {};

// ── Template shell ────────────────────────────────────────────────────────────

export function getTemplate() {
  return `<section id="gce-paso-iec" class="gce-paso hidden">
  <div class="wizard-section-header">
    <h2>✅ IEC Aplicado</h2>
    <p class="wizard-section-desc">
      Instrumento de Evaluación de la Competencia. Marca C (Cumple) o NC (No cumple) por reactivo.
      El sistema calcula el puntaje ponderado y determina el juicio preliminar.
    </p>
  </div>
  <div id="gce-iec-body"></div>
</section>`;
}

// ── Init ──────────────────────────────────────────────────────────────────────

export function initStepIEC() {
  const cfg      = state.estandar?.config?.iec || {};
  const reactivos = cfg.reactivos || [];
  const body     = document.getElementById("gce-iec-body");
  if (!body) return;

  if (!reactivos.length) {
    body.innerHTML = `<div style="padding:32px;text-align:center;color:var(--c-text-3)">
      <div style="font-size:36px;margin-bottom:12px">📋</div>
      <p style="font-size:13px">Los criterios del IEC no han sido cargados para este estándar.<br>
      El responsable del CE debe actualizar la configuración.</p>
    </div>`;
    return;
  }

  const esEditor = !esCandidato();
  const d        = getDatos("iec");
  const puntajeMin = cfg.puntaje_minimo ?? 0;

  // Pre-cargar marcas desde datos guardados
  _marcas = {};
  (d.reactivos || []).forEach(r => { _marcas[r.codigo] = r.cumple; });

  body.innerHTML = _htmlFecha(d.fecha_aplicacion, esEditor)
                 + _htmlTabla(reactivos, esEditor)
                 + _htmlScoreboard(puntajeMin)
                 + (esEditor ? _htmlBtnEmitir() : "");

  window.gceIECMarcar   = _marcarReactivo;
  window.gceEmitirJuicio = emitirJuicio;

  _actualizarScore();
}

// ── Generadores HTML ──────────────────────────────────────────────────────────

function _htmlFecha(fechaActual, esEditor) {
  return `<div style="margin-bottom:16px;display:flex;align-items:center;gap:12px">
    <label class="form-label" style="white-space:nowrap">Fecha de aplicación</label>
    <input id="gce-iec-fecha" type="date" class="form-input" style="max-width:200px"
           value="${fechaActual || ''}" ${!esEditor ? "disabled" : ""}
           oninput="window.guardarIEC()">
  </div>`;
}

function _htmlTabla(reactivos, esEditor) {
  const filas = reactivos.map(r => {
    const cumple = _marcas[r.codigo];
    const cBtn = (v, lbl, color, bg, bord) =>
      `<button type="button" data-cod="${r.codigo}" data-val="${v}"
         onclick="gceIECMarcar(this)"
         style="padding:3px 10px;border-radius:4px;border:1px solid ${bord};background:${bg};color:${color};font-weight:700;font-size:11px;cursor:pointer">${lbl}</button>`;
    const btnC  = cBtn("true",  "C",  cumple===true?"#065f46":"var(--c-text-3)", cumple===true?"#ecfdf5":"none", cumple===true?"#065f46":"var(--c-border)");
    const btnNC = cBtn("false", "NC", cumple===false?"#b91c1c":"var(--c-text-3)", cumple===false?"#fef2f2":"none", cumple===false?"#b91c1c":"var(--c-border)");

    return `<tr id="gce-iec-row-${r.codigo.replace(/\./g,'_')}" style="border-bottom:1px solid var(--c-border)">
      <td style="padding:6px 8px;font-weight:700;color:var(--c-text-3);font-size:11px;white-space:nowrap">${r.codigo}</td>
      <td style="padding:6px 8px;font-size:11px;color:var(--c-text-4);white-space:nowrap">${r.tipo || '—'}</td>
      <td style="padding:6px 8px;font-size:11px;color:var(--c-text-2)">${r.descripcion || ''}</td>
      <td style="padding:6px 8px;text-align:center">
        ${esEditor
          ? `<div style="display:flex;gap:4px;justify-content:center">${btnC}${btnNC}</div>`
          : `<span style="font-weight:700;font-size:12px;color:${cumple===true?'#065f46':cumple===false?'#b91c1c':'var(--c-text-4)'}">
               ${cumple===true?'C':cumple===false?'NC':'—'}</span>`
        }
      </td>
      <td style="padding:6px 8px;text-align:right;font-size:11px;color:var(--c-text-3);font-variant-numeric:tabular-nums">${r.peso_relativo ?? '—'}</td>
    </tr>`;
  }).join("");

  return `<div style="overflow-x:auto;border:1px solid var(--c-border);border-radius:8px;margin-bottom:16px">
    <table style="width:100%;border-collapse:collapse;font-size:12px">
      <thead style="background:var(--c-surface)"><tr>
        <th style="padding:7px 8px;text-align:left;border-bottom:1px solid var(--c-border);color:var(--c-text-3);font-size:10px">Código</th>
        <th style="padding:7px 8px;text-align:left;border-bottom:1px solid var(--c-border);color:var(--c-text-3);font-size:10px">Tipo</th>
        <th style="padding:7px 8px;text-align:left;border-bottom:1px solid var(--c-border);color:var(--c-text-3);font-size:10px;min-width:220px">Descripción</th>
        <th style="padding:7px 8px;text-align:center;border-bottom:1px solid var(--c-border);color:var(--c-text-3);font-size:10px;width:96px">Resultado</th>
        <th style="padding:7px 8px;text-align:right;border-bottom:1px solid var(--c-border);color:var(--c-text-3);font-size:10px;width:70px">Peso %</th>
      </tr></thead>
      <tbody>${filas}</tbody>
    </table>
  </div>`;
}

function _htmlScoreboard(puntajeMin) {
  return `<div id="gce-iec-score" style="background:var(--c-surface);border-radius:10px;border:1px solid var(--c-border);padding:16px;margin-bottom:16px">
    <div style="font-size:12px;font-weight:700;color:var(--c-text);margin-bottom:12px">Puntaje acumulado</div>
    <div style="display:flex;gap:28px;flex-wrap:wrap;align-items:flex-start">
      <div>
        <span id="gce-iec-ptj" style="font-size:26px;font-weight:800;color:var(--c-text)">0.00</span>
        <span style="font-size:11px;color:var(--c-text-3)"> / ${puntajeMin} mínimo</span>
      </div>
      <div style="display:flex;flex-direction:column;gap:5px">
        <span id="gce-iec-c1" style="font-size:13px;font-weight:600">— Criterio 1</span>
        <span id="gce-iec-c2" style="font-size:13px;font-weight:600">— Criterio 2</span>
      </div>
      <div>
        <div style="font-size:11px;color:var(--c-text-3);margin-bottom:4px">Juicio preliminar</div>
        <div id="gce-iec-juicio" style="font-size:22px;font-weight:800;color:var(--c-text)">—</div>
      </div>
    </div>
  </div>`;
}

function _htmlBtnEmitir() {
  return `<div style="text-align:right">
    <button id="gce-iec-btn-emitir" onclick="window.gceEmitirJuicio()" class="btn-primary">
      Emitir juicio
    </button>
  </div>`;
}

// ── Marcar reactivo ───────────────────────────────────────────────────────────

function _marcarReactivo(btn) {
  const codigo = btn.dataset.cod;
  const cumple = btn.dataset.val === "true";
  _marcas[codigo] = cumple;
  guardarIEC();
  _actualizarBotonesRow(codigo, cumple);
  _actualizarScore();
}

function _actualizarBotonesRow(codigo, cumple) {
  const rowId = "gce-iec-row-" + codigo.replace(/\./g, "_");
  const row   = document.getElementById(rowId);
  if (!row) return;
  row.querySelectorAll("button[data-val]").forEach(b => {
    const esEste = (b.dataset.val === "true") === cumple;
    const [color, bg, bord] = esEste
      ? (cumple ? ["#065f46","#ecfdf5","#065f46"] : ["#b91c1c","#fef2f2","#b91c1c"])
      : ["var(--c-text-3)","none","var(--c-border)"];
    b.style.color = color; b.style.background = bg; b.style.border = `1px solid ${bord}`;
  });
}

// ── Cálculo ───────────────────────────────────────────────────────────────────

function _calcular() {
  const cfg      = state.estandar?.config?.iec || {};
  const reactivos = cfg.reactivos || [];
  const puntajeMin = cfg.puntaje_minimo ?? 0;

  let puntaje = 0;
  const cumplidosPorTipo = {};

  reactivos.forEach(r => {
    if (r.tipo && !(r.tipo in cumplidosPorTipo)) cumplidosPorTipo[r.tipo] = false;
    if (_marcas[r.codigo] === true) {
      puntaje += r.peso_relativo ?? 0;
      if (r.tipo) cumplidosPorTipo[r.tipo] = true;
    }
  });

  const tipos  = Object.keys(cumplidosPorTipo);
  const crit1  = puntaje >= puntajeMin;
  const crit2  = tipos.length === 0 || tipos.every(t => cumplidosPorTipo[t]);
  const juicio = crit1 && crit2 ? "C" : "TNC";
  return { puntaje: puntaje.toFixed(2), crit1, crit2, juicio };
}

function _actualizarScore() {
  const { puntaje, crit1, crit2, juicio } = _calcular();
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set("gce-iec-ptj", puntaje);
  const c1El = document.getElementById("gce-iec-c1");
  const c2El = document.getElementById("gce-iec-c2");
  const jEl  = document.getElementById("gce-iec-juicio");
  if (c1El) { c1El.textContent = (crit1 ? "✅" : "❌") + " Criterio 1 (puntaje)";   c1El.style.color = crit1 ? "#065f46" : "#b91c1c"; }
  if (c2El) { c2El.textContent = (crit2 ? "✅" : "❌") + " Criterio 2 (categorías)"; c2El.style.color = crit2 ? "#065f46" : "#b91c1c"; }
  if (jEl)  { jEl.textContent = juicio; jEl.style.color = juicio === "C" ? "#065f46" : "#b91c1c"; }
}

// ── Guardar ───────────────────────────────────────────────────────────────────

export function guardarIEC() {
  const cfg      = state.estandar?.config?.iec || {};
  const reactivos = cfg.reactivos || [];
  const { puntaje, juicio } = _calcular();
  setDatos("iec", {
    fecha_aplicacion: document.getElementById("gce-iec-fecha")?.value || "",
    reactivos: reactivos.map(r => ({ codigo: r.codigo, cumple: _marcas[r.codigo] ?? null })),
    puntaje_obtenido: parseFloat(puntaje),
    juicio_preliminar: juicio,
  });
}

// ── Emitir juicio ─────────────────────────────────────────────────────────────

export async function emitirJuicio() {
  guardarIEC();
  const { juicio } = _calcular();
  const btn = document.getElementById("gce-iec-btn-emitir");
  if (btn) { btn.disabled = true; btn.textContent = "Guardando…"; }
  try {
    const headers = await window.getAuthHeaders?.();
    if (!headers) return;
    await fetch(`${BACKEND_URL}/gce/procesos/${state.procesoId}`, {
      method: "PATCH",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ datos: state.datos, estado: "juicio", juicio }),
    });
    if (state.proceso) { state.proceso.estado = "juicio"; state.proceso.juicio = juicio; }
    actualizarSidebar();
    if (btn) { btn.textContent = "✓ Juicio emitido"; }
  } catch {
    if (btn) { btn.disabled = false; btn.textContent = "Emitir juicio"; }
  }
}
