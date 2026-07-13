// ─── wizard/undo.js — Deshacer la última generación con IA ───────────────────
// guardarUndo(lsKey, cargarFn)  → guarda snapshot (no-op si hay batch activo)
// mostrarUndo(desc)             → muestra barra (no-op si hay batch activo)
// iniciarBatch(lsKey, cargarFn) → guarda snapshot y activa modo batch
// finalizarBatch(desc)          → desactiva batch y muestra barra
// limpiarUndo()                 → oculta barra y descarta snapshot
// aplicarUndo()                 → restaura LS y llama window[cargarFn]()

let _snapshot    = null;  // { lsKey, valorPrevio, cargarFn }
let _batchActivo = false;

function _getBar() {
  let bar = document.getElementById("sbe-undo-bar");
  if (!bar) {
    bar = document.createElement("div");
    bar.id = "sbe-undo-bar";
    bar.style.cssText = [
      "position:fixed;bottom:0;left:0;right:0;z-index:9999",
      "background:#1e293b;color:#f1f5f9",
      "display:none;align-items:center;justify-content:space-between",
      "padding:10px 20px;font-size:13px;gap:12px",
      "box-shadow:0 -2px 8px rgba(0,0,0,0.25)",
    ].join(";");
    bar.innerHTML = `
      <span id="sbe-undo-desc" style="flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">
        Generación con IA aplicada
      </span>
      <div style="display:flex;gap:8px;flex-shrink:0;">
        <button id="sbe-undo-btn"
          style="background:#3b82f6;color:#fff;border:none;padding:6px 16px;border-radius:5px;cursor:pointer;font-size:12px;font-weight:600;">
          ↩ Deshacer
        </button>
        <button id="sbe-undo-close"
          style="background:transparent;color:#94a3b8;border:none;padding:4px 8px;cursor:pointer;font-size:16px;line-height:1;">
          ✕
        </button>
      </div>`;
    document.body.appendChild(bar);
    document.getElementById("sbe-undo-btn").addEventListener("click", aplicarUndo);
    document.getElementById("sbe-undo-close").addEventListener("click", limpiarUndo);
  }
  return bar;
}

export function guardarUndo(lsKey, cargarFn) {
  if (_batchActivo) return;
  _snapshot = { lsKey, valorPrevio: localStorage.getItem(lsKey), cargarFn };
}

export function mostrarUndo(descripcion) {
  if (_batchActivo || !_snapshot) return;
  const bar  = _getBar();
  const desc = document.getElementById("sbe-undo-desc");
  if (desc) desc.textContent = `↩ Generado con IA: ${descripcion}`;
  bar.style.display = "flex";
}

export function iniciarBatch(lsKey, cargarFn) {
  _batchActivo = true;
  _snapshot    = { lsKey, valorPrevio: localStorage.getItem(lsKey), cargarFn };
}

export function finalizarBatch(descripcion) {
  _batchActivo = false;
  mostrarUndo(descripcion);
}

export function limpiarUndo() {
  _snapshot    = null;
  _batchActivo = false;
  const bar = document.getElementById("sbe-undo-bar");
  if (bar) bar.style.display = "none";
}

export function aplicarUndo() {
  if (!_snapshot) return;
  const { lsKey, valorPrevio, cargarFn } = _snapshot;
  if (valorPrevio !== null) {
    localStorage.setItem(lsKey, valorPrevio);
  } else {
    localStorage.removeItem(lsKey);
  }
  limpiarUndo();
  if (typeof window[cargarFn] === "function") window[cargarFn]();
  if (typeof showToast === "function") showToast("Generación deshecha", "success");
}

export function initUndo() {
  window.guardarUndo   = guardarUndo;
  window.mostrarUndo   = mostrarUndo;
  window.iniciarBatch  = iniciarBatch;
  window.finalizarBatch = finalizarBatch;
  window.limpiarUndo   = limpiarUndo;
  window.aplicarUndo   = aplicarUndo;
}
