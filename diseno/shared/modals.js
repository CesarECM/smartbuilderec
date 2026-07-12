// ─── shared/modals.js — Sistema de Modales Personalizados ────────────────────

(function initCustomModals() {
  if (document.getElementById("cmOverlay")) return;
  const el = document.createElement("div");
  el.id = "cmOverlay";
  el.className = "cm-overlay";
  el.style.display = "none";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.innerHTML = `
    <div class="cm-box">
      <div class="cm-header">
        <span class="cm-icon" id="cmIcon">ℹ️</span>
        <h3 class="cm-title" id="cmTitle">Aviso</h3>
      </div>
      <div class="cm-body">
        <p id="cmMessage"></p>
      </div>
      <div class="cm-footer" id="cmFooter"></div>
    </div>
  `;
  if (document.body) {
    document.body.appendChild(el);
  } else {
    document.addEventListener("DOMContentLoaded", () => document.body.appendChild(el));
  }
})();

function _cmGetModal() {
  let overlay = document.getElementById("cmOverlay");
  if (!overlay) {
    overlay = document.createElement("div");
    overlay.id = "cmOverlay";
    overlay.className = "cm-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = `
      <div class="cm-box">
        <div class="cm-header">
          <span class="cm-icon" id="cmIcon">ℹ️</span>
          <h3 class="cm-title" id="cmTitle">Aviso</h3>
        </div>
        <div class="cm-body">
          <p id="cmMessage"></p>
        </div>
        <div class="cm-footer" id="cmFooter"></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  return overlay;
}

function _cmSetContent(message, icon, title) {
  const modal = _cmGetModal();
  document.getElementById("cmIcon").textContent = icon;
  document.getElementById("cmTitle").textContent = title;
  const safe = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  document.getElementById("cmMessage").innerHTML = safe;
  return modal;
}

/**
 * showAlert(message, opts?)
 * opts: { title, icon }
 * Returns Promise<void>
 */
function showAlert(message, opts = {}) {
  return new Promise(resolve => {
    const title = opts.title || _cmDetectTitle(message);
    const icon  = opts.icon  || _cmDetectIcon(message);
    const modal = _cmSetContent(message, icon, title);

    const footer = document.getElementById("cmFooter");
    footer.innerHTML = "";
    const okBtn = document.createElement("button");
    okBtn.className = "cm-btn-ok";
    okBtn.textContent = "Entendido";
    okBtn.addEventListener("click", () => {
      modal.style.display = "none";
      resolve();
    });
    footer.appendChild(okBtn);

    modal.style.display = "flex";
    setTimeout(() => okBtn.focus(), 50);
  });
}

/**
 * showConfirm(message, opts?)
 * opts: { title, icon, confirmText, cancelText, danger }
 * Returns Promise<boolean>
 */
function showConfirm(message, opts = {}) {
  return new Promise(resolve => {
    const title       = opts.title       || "Confirmar";
    const icon        = opts.icon        || "❓";
    const confirmText = opts.confirmText || "Confirmar";
    const cancelText  = opts.cancelText  || "Cancelar";
    const modal = _cmSetContent(message, icon, title);

    const footer = document.getElementById("cmFooter");
    footer.innerHTML = "";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "cm-btn-cancel";
    cancelBtn.textContent = cancelText;
    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none";
      resolve(false);
    });

    const confirmBtn = document.createElement("button");
    confirmBtn.className = opts.danger ? "cm-btn-confirm danger" : "cm-btn-confirm";
    confirmBtn.textContent = confirmText;
    confirmBtn.addEventListener("click", () => {
      modal.style.display = "none";
      resolve(true);
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    modal.style.display = "flex";
    setTimeout(() => confirmBtn.focus(), 50);
  });
}

function _cmDetectIcon(msg) {
  if (msg.includes("⚠️") || msg.toLowerCase().includes("error") || msg.toLowerCase().includes("no se pudo")) return "⚠️";
  if (msg.includes("✅") || msg.toLowerCase().includes("correcto") || msg.toLowerCase().includes("éxito")) return "✅";
  return "ℹ️";
}

function _cmDetectTitle(msg) {
  if (msg.includes("⚠️") || msg.toLowerCase().includes("error") || msg.toLowerCase().includes("no se pudo")) return "Atención";
  if (msg.includes("Primero") || msg.includes("necesitas") || msg.includes("completa")) return "Paso requerido";
  return "Aviso";
}
