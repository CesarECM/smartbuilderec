// ─── wizard-ec1375/navigation.js — Sidebar + navegación EC1375 ───────────────

import { FLUJO_SECCIONES, NAV_A_SECCION, NORMA, NORMA_NOMBRE, PROGRESS_STEPS } from "./config.js";

export function getSidebarHTML() {
  return `
    <div class="logo-container" style="padding:12px 14px;">
      <img src="img/ECM%20blanco%20sin%20fondo.png" alt="Logo" class="logo-img" style="max-height:36px;">
    </div>
    <div class="ec-badge">
      <span class="ec-badge-code">${NORMA}</span>
      <span class="ec-badge-name">${NORMA_NOMBRE}</span>
    </div>
    <div id="sbe-sidebar-status" style="padding:8px 14px;border-bottom:1px solid rgba(255,255,255,0.07);">
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
        <div style="flex:1;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;">
          <div id="sbe-progress-bar" style="height:100%;width:0%;border-radius:2px;transition:width .4s;"></div>
        </div>
        <span id="sbe-progress-label" style="font-size:10px;color:rgba(255,255,255,.4);white-space:nowrap;">0 / 7</span>
      </div>
      <div style="display:flex;align-items:center;justify-content:space-between;">
        <span style="font-size:10px;color:rgba(255,255,255,.35);">Navegación libre</span>
        <button id="btnModoLibre" style="font-size:10px;padding:2px 8px;border-radius:10px;border:1px solid rgba(255,255,255,.2);background:rgba(255,255,255,.05);color:rgba(255,255,255,.4);cursor:pointer;font-family:inherit;">OFF</button>
      </div>
    </div>
    <button id="btnFocusMode" title="Ocultar/mostrar barra lateral">⬅ Modo Focus</button>
    <nav class="menu">
      <ul class="nav-grupos">
        <li class="nav-grupo">
          <div class="nav-grupo-header" data-grupo="preparacion"><span>📋 Preparación</span><span class="nav-grupo-arrow">▾</span></div>
          <ul class="nav-grupo-items open">
            <li id="nav75-datos"   class="nav-item active">Datos del auxiliar</li>
            <li id="nav75-espacio" class="nav-item disabled" data-prereq="Completa los datos del auxiliar primero">Espacio y protocolos</li>
          </ul>
        </li>
        <li class="nav-grupo">
          <div class="nav-grupo-header" data-grupo="atencion"><span>👤 Atención al usuario</span><span class="nav-grupo-arrow">▾</span></div>
          <ul class="nav-grupo-items open">
            <li id="nav75-usuario"        class="nav-item disabled" data-prereq="Completa el espacio primero">Datos del usuario</li>
            <li id="nav75-signos"         class="nav-item disabled" data-prereq="Completa los datos del usuario primero">Signos vitales</li>
            <li id="nav75-consentimiento" class="nav-item disabled" data-prereq="Completa los signos vitales primero">Técnica y consentimiento</li>
            <li id="nav75-seguimiento"    class="nav-item disabled" data-prereq="Completa el consentimiento primero">Plan de seguimiento</li>
          </ul>
        </li>
        <li class="nav-grupo">
          <div class="nav-grupo-header" data-grupo="expediente"><span>📄 Expediente</span><span class="nav-grupo-arrow">▾</span></div>
          <ul class="nav-grupo-items open">
            <li id="nav75-expediente" class="nav-item disabled" data-prereq="Completa los 6 pasos anteriores primero">Revisión y descarga ZIP</li>
          </ul>
        </li>
      </ul>
    </nav>
  `;
}

export function actualizarProgressBar() {
  const completados = PROGRESS_STEPS.filter(s => localStorage.getItem(s.key) === "true").length;
  const total = PROGRESS_STEPS.length;
  const pct = Math.round(completados / total * 100);
  const bar  = document.getElementById("sbe-progress-bar");
  const lbl  = document.getElementById("sbe-progress-label");
  const fill = document.getElementById("progress-fill");
  const pctEl = document.getElementById("progress-pct");
  if (bar)  bar.style.width   = pct + "%";
  if (lbl)  lbl.textContent   = `${completados} / 7`;
  if (fill) fill.style.width  = pct + "%";
  if (pctEl) pctEl.textContent = pct + "%";
}

export function mostrarSeccion(id) {
  document.querySelectorAll(".wizard-section").forEach(s => s.classList.add("hidden"));
  const sec = document.getElementById(id);
  if (!sec) return;
  sec.classList.remove("hidden");
  document.querySelectorAll(".sidebar .nav-item").forEach(i => i.classList.remove("active"));
  const navId = Object.entries(NAV_A_SECCION).find(([, v]) => v === id)?.[0];
  if (navId) document.getElementById(navId)?.classList.add("active");
  _abrirGrupoActivo();
  actualizarProgressBar();
  if (id === "sec75Expediente") window.cargarExpediente75?.();
}

function _abrirGrupoActivo() {
  const activo = document.querySelector(".nav-item.active");
  if (!activo) return;
  const grupo = activo.closest(".nav-grupo-items");
  if (grupo) {
    grupo.classList.add("open");
    grupo.classList.remove("closed");
    const a = grupo.previousElementSibling?.querySelector(".nav-grupo-arrow");
    if (a) a.textContent = "▾";
  }
}

export function desbloquear(navId) {
  document.getElementById(navId)?.classList.remove("disabled");
}

export function initNavigation() {
  document.querySelectorAll(".nav-grupo-header").forEach(h => {
    h.addEventListener("click", () => {
      const items = h.nextElementSibling;
      const arrow = h.querySelector(".nav-grupo-arrow");
      const isOpen = items.classList.contains("open");
      items.classList.toggle("open", !isOpen);
      items.classList.toggle("closed", isOpen);
      arrow.textContent = isOpen ? "▸" : "▾";
    });
  });

  const menuToggle = document.getElementById("menuToggle");
  const sidebar    = document.getElementById("sidebar");
  if (menuToggle && sidebar) menuToggle.addEventListener("click", () => sidebar.classList.toggle("active"));

  const btnLibre = document.getElementById("btnModoLibre");
  if (btnLibre) {
    let activo = false;
    const upd = () => {
      btnLibre.textContent    = activo ? "ON" : "OFF";
      btnLibre.style.background = activo ? "rgba(74,222,128,.2)" : "rgba(255,255,255,.05)";
      btnLibre.style.color      = activo ? "#4ade80" : "rgba(255,255,255,.4)";
    };
    btnLibre.addEventListener("click", () => { activo = !activo; upd(); });
    document.querySelector(".nav-grupos")?.addEventListener("click", e => {
      if (!activo) return;
      const item = e.target.closest(".nav-item");
      if (!item || !item.classList.contains("disabled")) return;
      const sec = NAV_A_SECCION[item.id];
      if (sec) { e.stopPropagation(); mostrarSeccion(sec); }
    }, true);
  }

  document.addEventListener("keydown", e => {
    if (!e.altKey || !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(document.activeElement?.tagName)) return;
    const visible = FLUJO_SECCIONES.find(id => {
      const el = document.getElementById(id);
      return el && !el.classList.contains("hidden");
    });
    const idx = FLUJO_SECCIONES.indexOf(visible);
    if (idx === -1) return;
    e.preventDefault();
    const dest = e.key === "ArrowRight" ? FLUJO_SECCIONES[idx + 1] : FLUJO_SECCIONES[idx - 1];
    if (dest) mostrarSeccion(dest);
  });

  document.querySelector(".nav-grupos")?.addEventListener("click", ev => {
    const item = ev.target.closest(".nav-item");
    if (!item || item.classList.contains("disabled")) return;
    const sec = NAV_A_SECCION[item.id];
    if (sec) mostrarSeccion(sec);
  });

  window.mostrarSeccion75 = mostrarSeccion;
  window.desbloquear75    = desbloquear;
}
