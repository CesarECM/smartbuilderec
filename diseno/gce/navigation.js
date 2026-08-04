// ─── gce/navigation.js — Sidebar timeline + navegación ────────────────────────

import { PASOS, ESTADO_A_PASO } from "./config.js";
import { state, getDatos } from "./state.js";
import { actualizarBanner } from "./banner.js";

// ── Sidebar HTML ─────────────────────────────────────────────────────────────

export function getSidebarHTML() {
  const ec     = state.estandar?.codigo || "GCE";
  const titulo = (state.estandar?.titulo || "Portafolio de Evidencias")
    .split(" ").slice(0, 5).join(" ") + "…";

  const items = PASOS.map((p, i) => `
    <li id="gce-nav-${p.id}" onclick="window.gceMostrarPaso('${p.id}')"
        style="display:flex;align-items:center;gap:10px;padding:9px 10px;border-radius:8px;cursor:pointer;transition:background .15s;margin-bottom:2px">
      <div id="gce-dot-${p.id}"
           style="width:26px;height:26px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:11px;font-weight:700;flex-shrink:0;background:rgba(255,255,255,.08);color:rgba(255,255,255,.3)">
        ${i + 1}
      </div>
      <div style="min-width:0">
        <div class="gce-nav-label" style="font-size:12px;color:rgba(255,255,255,.45);white-space:nowrap;overflow:hidden;text-overflow:ellipsis">
          ${p.icono} ${p.label}
        </div>
      </div>
    </li>`).join("");

  return `
    <div style="padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.07)">
      <img src="img/ECM%20blanco%20sin%20fondo.png" alt="Logo" style="max-height:36px">
    </div>
    <div class="ec-badge">
      <span class="ec-badge-code">${ec}</span>
      <span class="ec-badge-name">${titulo}</span>
    </div>
    <div id="gce-candidato-info"
         style="padding:10px 14px;border-bottom:1px solid rgba(255,255,255,.07);font-size:11px;color:rgba(255,255,255,.4)">
      Portafolio de Evidencias
    </div>
    <button id="menuToggleGce" style="display:none"
      onclick="document.getElementById('sidebar').classList.toggle('active')">☰</button>
    <nav style="padding:10px 8px">
      <ul style="list-style:none;margin:0;padding:0" id="gce-nav-list">${items}</ul>
    </nav>`;
}

// ── Mostrar paso ─────────────────────────────────────────────────────────────

export function mostrarPaso(id) {
  document.querySelectorAll(".gce-paso").forEach(s => s.classList.add("hidden"));
  const el = document.getElementById("gce-paso-" + id);
  if (el) el.classList.remove("hidden");

  state.pasoActivo = id;
  actualizarSidebar();
  actualizarBanner();

  const menuToggle = document.getElementById("menuToggle");
  if (menuToggle && window.innerWidth <= 768) {
    document.getElementById("sidebar")?.classList.remove("active");
  }
}

// ── Actualizar indicadores del sidebar ───────────────────────────────────────

export function actualizarSidebar() {
  _renderTimelineCandidato();
  const est       = state.proceso?.estado || "";
  const fichaOk   = !!(getDatos("ficha_registro").nombre_completo);
  const diagOk    = !!(getDatos("diagnostico").fecha);
  const planOk    = ["plan_acordado","evidencias","juicio","cierre","certificado"].includes(est);
  const iecOk     = ["juicio","cierre","certificado"].includes(est);
  const ceduOk    = est === "cierre" || est === "certificado";
  const encOk     = est === "certificado";

  const completados = { ficha: fichaOk, diagnostico: diagOk, plan: planOk, iec: iecOk, cedula: ceduOk, encuesta: encOk };

  PASOS.forEach((p, i) => {
    const nav = document.getElementById("gce-nav-" + p.id);
    const dot = document.getElementById("gce-dot-" + p.id);
    if (!nav || !dot) return;

    const esActivo = state.pasoActivo === p.id;
    const completo = completados[p.id] || false;

    nav.style.background = esActivo ? "rgba(139,92,246,.3)" : "transparent";
    const label = nav.querySelector(".gce-nav-label");
    if (label) label.style.color = esActivo ? "#c4b5fd" : "rgba(255,255,255,.45)";

    if (completo) {
      dot.style.background = "#4ade80";
      dot.style.color = "#fff";
      dot.textContent = "✓";
    } else if (esActivo) {
      dot.style.background = "#8b5cf6";
      dot.style.color = "#fff";
      dot.textContent = String(i + 1);
    } else {
      dot.style.background = "rgba(255,255,255,.08)";
      dot.style.color = "rgba(255,255,255,.3)";
      dot.textContent = String(i + 1);
    }
  });
}

// ── Timeline del candidato ────────────────────────────────────────────────────

function _renderTimelineCandidato() {
  const el = document.getElementById("gce-candidato-info");
  if (!el) return;

  const ficha   = state.datos?.ficha_registro || {};
  const nombre  = ficha.nombre_completo || state.perfil?.email || "Candidato";
  const estado  = state.proceso?.estado || "";
  const juicio  = state.proceso?.juicio;

  const pasoActualId = ESTADO_A_PASO[estado] || "ficha";
  const pasoIdx      = PASOS.findIndex(p => p.id === pasoActualId);
  const progreso     = Math.max(0, pasoIdx);
  const pct          = Math.round((progreso / (PASOS.length - 1)) * 100);

  let juicioHtml = "";
  if (juicio) {
    const col = juicio === "C" ? "#4ade80" : "#f87171";
    const lbl = juicio === "C" ? "COMPETENTE" : "TODAVÍA NO COMPETENTE";
    juicioHtml = `<div style="margin-top:7px;font-size:10px;font-weight:700;color:${col};letter-spacing:.3px">${lbl}</div>`;
  }

  el.innerHTML = `
    <div style="font-size:11px;font-weight:600;color:rgba(255,255,255,.65);margin-bottom:5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${nombre}</div>
    <div style="font-size:10px;color:rgba(255,255,255,.35);margin-bottom:6px">Paso ${progreso + 1} de ${PASOS.length}</div>
    <div style="height:5px;background:rgba(255,255,255,.1);border-radius:3px;overflow:hidden">
      <div style="height:100%;width:${pct}%;background:#8b5cf6;border-radius:3px;transition:width .4s"></div>
    </div>
    ${juicioHtml}`;
}

// ── Init ─────────────────────────────────────────────────────────────────────

export function initNavigation() {
  document.getElementById("menuToggle")?.addEventListener("click", () => {
    document.getElementById("sidebar")?.classList.toggle("active");
  });

  window.gceMostrarPaso = mostrarPaso;
}
