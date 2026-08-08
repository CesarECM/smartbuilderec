// ─── wizard-ec0616-tutor/step-iec.js — Pasos 5-11: IEC E1-E7 (factory) ────────

import { getDatos, setDatos, setCompleto } from "./state.js";
import { fetchTutorIEC } from "./api.js";
import { PASOS } from "./config.js";

const PUNTAJE_MIN = 99.62;
const _marcas = {}; // _marcas[elemNum][codigo] = true | false | undefined

// ── Helpers de cálculo ────────────────────────────────────────────────────────

function _elemReactivos(all, n) {
  return (all || []).filter(r => { const m = r.codigo?.match(/E(\d)/); return m && +m[1] === n; });
}

function _calcularTotal(allReactivos) {
  let p = 0;
  (allReactivos || []).forEach(r => {
    const m = r.codigo?.match(/E(\d)/);
    if (!m) return;
    const cumple = (_marcas[+m[1]] || {})[r.codigo];
    if (r.es_ahv) { if (cumple === false) p -= (r.peso_negativo ?? r.peso_relativo ?? 0); }
    else          { if (cumple === true)  p += (r.peso_relativo ?? 0); }
  });
  return p;
}

function _actualizarScore(allReactivos, elemNum) {
  const total = _calcularTotal(allReactivos);
  const pct   = Math.min(100, Math.max(0, (total / PUNTAJE_MIN) * 100));
  const comp  = total >= PUNTAJE_MIN;
  const barEl = document.getElementById(`iec-bar-${elemNum}`);
  const ptjEl = document.getElementById(`iec-ptj-${elemNum}`);
  const jEl   = document.getElementById(`iec-jui-${elemNum}`);
  if (barEl) { barEl.style.width = pct + "%"; barEl.style.background = comp ? "#065f46" : "#3b82f6"; }
  if (ptjEl) ptjEl.textContent = total.toFixed(2);
  if (jEl)   { jEl.textContent = comp ? "✅ Competente" : "⏳ En proceso"; jEl.style.color = comp ? "#065f46" : "#92400e"; }
}

// ── Renderizado de tabla ──────────────────────────────────────────────────────

function _btnStyle(active, isC) {
  if (!active) return "border:1px solid #e5e7eb;background:none;color:#9ca3af;";
  return isC ? "border:1px solid #065f46;background:#ecfdf5;color:#065f46;"
             : "border:1px solid #b91c1c;background:#fef2f2;color:#b91c1c;";
}

function _htmlFila(r, elemNum) {
  const cumple = (_marcas[elemNum] || {})[r.codigo];
  const rowId  = `iec-r-${r.codigo.replace(/[^a-zA-Z0-9]/g, "_")}`;
  const ahv    = r.es_ahv
    ? `<span style="font-size:9px;font-weight:700;background:#fef9c3;color:#92400e;padding:1px 4px;border-radius:3px;margin-left:4px;">AHV</span>`
    : "";
  const btnC  = `<button data-cod="${r.codigo}" data-val="true"
    style="padding:3px 10px;border-radius:4px;font-weight:700;font-size:11px;cursor:pointer;${_btnStyle(cumple===true,true)}">C</button>`;
  const btnNC = `<button data-cod="${r.codigo}" data-val="false"
    style="padding:3px 10px;border-radius:4px;font-weight:700;font-size:11px;cursor:pointer;${_btnStyle(cumple===false,false)}">NC</button>`;
  return `<tr id="${rowId}">
    <td style="padding:5px 8px;font-size:10px;font-weight:700;color:#9ca3af;white-space:nowrap;">${r.codigo}${ahv}</td>
    <td style="padding:5px 8px;font-size:10px;color:#6b7280;white-space:nowrap;">${r.tipo || "—"}</td>
    <td style="padding:5px 8px;font-size:12px;color:#374151;">${r.descripcion || ""}</td>
    <td style="padding:5px 8px;text-align:center;">
      <div style="display:flex;gap:4px;justify-content:center;">${btnC}${btnNC}</div>
    </td>
    <td style="padding:5px 8px;text-align:right;font-size:11px;color:#9ca3af;">${r.peso_relativo ?? "—"}</td>
  </tr>`;
}

function _actualizarFila(codigo, cumple, elemNum) {
  const row = document.getElementById(`iec-r-${codigo.replace(/[^a-zA-Z0-9]/g, "_")}`);
  if (!row) return;
  row.querySelectorAll("button[data-val]").forEach(b => {
    const isC = b.dataset.val === "true";
    const act = isC ? cumple === true : cumple === false;
    b.style.cssText = `padding:3px 10px;border-radius:4px;font-weight:700;font-size:11px;cursor:pointer;${_btnStyle(act, isC)}`;
  });
}

// ── Guardar ───────────────────────────────────────────────────────────────────

function _guardarElem(elemNum, elemReactivos) {
  setDatos(`iec${elemNum}`, {
    reactivos: elemReactivos.map(r => ({
      codigo: r.codigo,
      cumple: (_marcas[elemNum] || {})[r.codigo] ?? null,
    })),
    fecha_guardado: new Date().toISOString(),
  });
}

// ── Init (factory) ────────────────────────────────────────────────────────────

export async function initStepIEC(elemNum) {
  const saved = getDatos(`iec${elemNum}`);
  _marcas[elemNum] = {};
  (saved.reactivos || []).forEach(r => {
    if (r.cumple !== null && r.cumple !== undefined) _marcas[elemNum][r.codigo] = r.cumple;
  });

  const iecData      = await fetchTutorIEC();
  const allReactivos = iecData?.reactivos || [];
  const elemReact    = _elemReactivos(allReactivos, elemNum);

  const tablaEl = document.getElementById(`iec-tabla-${elemNum}`);
  if (tablaEl) {
    if (!elemReact.length) {
      tablaEl.innerHTML = `<p style="color:#9ca3af;font-size:13px;padding:20px;text-align:center;">
        No se encontraron reactivos para este elemento.</p>`;
    } else {
      tablaEl.innerHTML = `
        <div style="overflow-x:auto;border:1px solid #e5e7eb;border-radius:8px;">
          <table style="width:100%;border-collapse:collapse;">
            <thead style="background:#f9fafb;"><tr>
              <th style="padding:6px 8px;text-align:left;font-size:10px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Código</th>
              <th style="padding:6px 8px;text-align:left;font-size:10px;color:#6b7280;border-bottom:1px solid #e5e7eb;">Tipo</th>
              <th style="padding:6px 8px;text-align:left;font-size:10px;color:#6b7280;border-bottom:1px solid #e5e7eb;min-width:220px;">Descripción</th>
              <th style="padding:6px 8px;text-align:center;font-size:10px;color:#6b7280;border-bottom:1px solid #e5e7eb;width:96px;">Resultado</th>
              <th style="padding:6px 8px;text-align:right;font-size:10px;color:#6b7280;border-bottom:1px solid #e5e7eb;width:60px;">Peso %</th>
            </tr></thead>
            <tbody>${elemReact.map(r => _htmlFila(r, elemNum)).join("")}</tbody>
          </table>
        </div>`;
    }
  }

  _actualizarScore(allReactivos, elemNum);

  tablaEl?.addEventListener("click", e => {
    const btn = e.target.closest("button[data-cod][data-val]");
    if (!btn) return;
    const codigo = btn.dataset.cod;
    const cumple = btn.dataset.val === "true";
    _marcas[elemNum][codigo] = cumple;
    _actualizarFila(codigo, cumple, elemNum);
    _actualizarScore(allReactivos, elemNum);
    _guardarElem(elemNum, elemReact);
  });

  const isLast = elemNum === 7;
  const nextSec  = isLast ? "secTCierre"     : `secTIEC${elemNum + 1}`;
  const nextNav  = isLast ? "navT-cierre"    : `navT-iec${elemNum + 1}`;
  document.getElementById(`btn-iec${elemNum}-sig`)?.addEventListener("click", () => {
    _guardarElem(elemNum, elemReact);
    setCompleto(`iec${elemNum}`);
    document.getElementById(`navT-iec${elemNum}`)?.classList.add("completed");
    window.desbloquearT?.(nextNav);
    window.mostrarSeccionT?.(nextSec);
  });
}

// ── Juicio final exportable (usado por step-cierre.js) ───────────────────────

export function calcularJuicioFinal(allReactivos) {
  const total = _calcularTotal(allReactivos);
  return { total, competente: total >= PUNTAJE_MIN };
}

// ── Template (factory) ────────────────────────────────────────────────────────

export function getTemplate(elemNum) {
  const paso  = PASOS.find(p => p.id === `iec${elemNum}`);
  const label = paso?.label || `IEC E${elemNum}`;
  const pasoN = paso?.paso  || (4 + elemNum);
  const sigLabel = elemNum < 7
    ? `Siguiente → E${elemNum + 1}`
    : "Siguiente → Cédula y Encuesta";

  return `
  <section id="secTIEC${elemNum}" class="wizard-section hidden">
    <p class="paso-titulo">Paso ${pasoN} de 12</p>
    <h1>${label}</h1>
    <div class="card" style="max-width:960px;">

      <div style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;padding:14px 16px;margin-bottom:16px;">
        <div style="display:flex;align-items:center;gap:16px;flex-wrap:wrap;">
          <div>
            <span style="font-size:11px;color:#6b7280;display:block;margin-bottom:2px;">Puntaje total (todos los elementos)</span>
            <span id="iec-ptj-${elemNum}" style="font-size:22px;font-weight:800;color:#1f2937;">0.00</span>
            <span style="font-size:11px;color:#9ca3af;"> / ${PUNTAJE_MIN} mín.</span>
          </div>
          <div style="flex:1;min-width:140px;">
            <div style="height:8px;background:#e5e7eb;border-radius:4px;overflow:hidden;">
              <div id="iec-bar-${elemNum}"
                style="height:100%;width:0%;background:#3b82f6;border-radius:4px;transition:width .3s;"></div>
            </div>
          </div>
          <div id="iec-jui-${elemNum}" style="font-size:13px;font-weight:700;color:#92400e;">⏳ En proceso</div>
        </div>
      </div>

      <p style="font-size:12px;color:#9ca3af;margin:0 0 12px;">
        Marca <strong>C</strong> (Cumple) o <strong>NC</strong> (No cumple) por cada reactivo.
        Los reactivos <span style="background:#fef9c3;color:#92400e;padding:0 4px;border-radius:3px;font-size:10px;font-weight:700;">AHV</span>
        restan puntaje si no se cumplen.
      </p>

      <div id="iec-tabla-${elemNum}">
        <div style="padding:20px;text-align:center;color:#9ca3af;font-size:13px;">Cargando reactivos…</div>
      </div>

      <button class="btn-siguiente" id="btn-iec${elemNum}-sig" style="margin-top:16px;">${sigLabel}</button>
    </div>
  </section>`;
}
