// ─── wizard/ui-sync.js — W#1 Indicador guardado | W#2 Progreso global ─────────

/** Registra los listeners de eventos sbe:sync-* para actualizar el indicador de guardado */
export function initSyncUI() {
  const icon  = document.getElementById("sbe-sync-icon");
  const text  = document.getElementById("sbe-sync-text");
  const bar   = document.getElementById("sbe-progress-bar");
  const label = document.getElementById("sbe-progress-label");
  if (!icon) return;

  let _okTimer = null;

  window.addEventListener("sbe:sync-pending", () => {
    icon.textContent = "🔄"; text.textContent = "Guardando...";
    text.style.color = "rgba(255,255,255,0.5)";
  });
  window.addEventListener("sbe:sync-start", () => {
    icon.textContent = "🔄"; text.textContent = "Guardando...";
  });
  window.addEventListener("sbe:sync-ok", () => {
    clearTimeout(_okTimer);
    icon.textContent = "☁️"; text.textContent = "Guardado";
    text.style.color = "rgba(255,255,255,0.5)";
    _okTimer = setTimeout(() => { text.textContent = "Sincronizado"; }, 3000);
  });
  window.addEventListener("sbe:sync-error", () => {
    icon.textContent = "⚠️"; text.textContent = "Error al guardar";
    text.style.color = "#f87171";
  });
  window.addEventListener("sbe:progress", (e) => {
    const { paso, total } = e.detail;
    const pct = Math.round((paso / total) * 100);
    if (bar)   bar.style.width   = pct + "%";
    if (label) label.textContent = `${paso} / ${total}`;
  });
}
