// ─── wizard/video-panel.js — Panel lateral de videos guía EC0217.01 ──────────

import { BUNNY_LIBRARY_ID, VIDEOS, MODULE_GROUPS } from "./video-config.js";

const WATCHED_KEY = "sbe_videos_watched";
const ALL_KEYS    = MODULE_GROUPS.flatMap(g => g.keys);

// Información de cada sección: nav-id, nombre legible y prerrequisito inmediato
const SECTION_INFO = {
  seccionDatos:        { nav: "nav-datos",        label: "Datos del curso",           prereq: null },
  seccionObjetivos:    { nav: "nav-objetivos",    label: "Objetivos de aprendizaje",  prereq: "Datos del curso" },
  seccionBeneficios:   { nav: "nav-beneficios",   label: "Beneficios",                prereq: "Objetivos de aprendizaje" },
  seccionTemario:      { nav: "nav-temario",       label: "Temario",                   prereq: "Beneficios" },
  seccionIntegracion:  { nav: "nav-integracion",  label: "Integración grupal",        prereq: "Temario" },
  seccionPreguntas:    { nav: "nav-preguntas",    label: "Preguntas de experiencia",  prereq: "Integración grupal" },
  seccionReglas:       { nav: "nav-reglas",       label: "Reglas del curso",          prereq: "Preguntas de experiencia" },
  seccionContrato:     { nav: "nav-contrato",     label: "Contrato de aprendizaje",   prereq: "Reglas del curso" },
  seccionExpositiva:   { nav: "nav-expositiva",   label: "Técnica expositiva",        prereq: "Contrato de aprendizaje" },
  seccionDemostrativa: { nav: "nav-demostrativa", label: "Técnica demostrativa",      prereq: "Técnica expositiva" },
  seccionEnergizante:  { nav: "nav-energizante",  label: "Técnica energizante",       prereq: "Técnica demostrativa" },
  seccionDialogo:      { nav: "nav-dialogo",       label: "Técnica de diálogo",        prereq: "Técnica energizante" },
  seccionCierre:       { nav: "nav-cierre",       label: "Cierre del curso",          prereq: "Técnica de diálogo" },
  seccionEvaluaciones: { nav: "nav-evaluaciones", label: "Evaluaciones",              prereq: "Cierre del curso" },
  seccionTiempos:      { nav: "nav-tiempos",      label: "Tiempos del curso",         prereq: "Evaluaciones" },
  seccionMateriales:   { nav: "nav-materiales",   label: "Lista de materiales",       prereq: "Tiempos del curso" },
  seccionFormatos:     { nav: "nav-formatos",      label: "Formatos adicionales",      prereq: "Lista de materiales" },
};

function getWatched() {
  try { return new Set(JSON.parse(localStorage.getItem(WATCHED_KEY) || "[]")); }
  catch (_) { return new Set(); }
}

function embedUrl(guid) {
  return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${guid}` +
    `?autoplay=true&preload=true&responsive=true`;
}

function markWatched(guid) {
  const set = getWatched();
  set.add(guid);
  localStorage.setItem(WATCHED_KEY, JSON.stringify([...set]));
  const dot = document.querySelector(`.vp-acc-item[data-guid="${guid}"] .vp-dot`);
  if (dot) { dot.classList.add("vp-dot--done"); dot.title = "Visto"; }
  updateBadge();
}

function updateBadge() {
  const watched = getWatched();
  const done    = ALL_KEYS.filter(k => watched.has(VIDEOS[k]?.guid)).length;
  const badge   = document.getElementById("vp-badge");
  if (!badge) return;
  if (done === 0) { badge.style.display = "none"; return; }
  badge.style.display = "block";
  badge.textContent   = done === ALL_KEYS.length ? "✓" : done;
}

// Navega a una sección o muestra mensaje de restricción si está bloqueada
function navigateOrBlock(seccion) {
  const info = SECTION_INFO[seccion];
  if (!info) return;
  const navEl = document.getElementById(info.nav);
  const isLocked = navEl?.classList.contains("disabled");
  if (!isLocked) {
    closeDrawer();
    window.mostrarSeccionPrincipal?.(seccion);
    return;
  }
  // Encontrar el primer paso bloqueado en el camino hacia el destino
  const flujo = window.wizardConfig?.FLUJO_SECCIONES ?? Object.keys(SECTION_INFO);
  const destIdx = flujo.indexOf(seccion);
  let firstBlocked = info.prereq;
  for (let i = 0; i < destIdx; i++) {
    const si = SECTION_INFO[flujo[i]];
    if (si && document.getElementById(si.nav)?.classList.contains("disabled")) {
      firstBlocked = si.label;
      break;
    }
  }
  window.showToast?.(
    `Antes de «${info.label}», completa «${firstBlocked}» primero`,
    "default", 4000
  );
}

function closeAll() {
  document.querySelectorAll(".vp-acc-item.vp-open").forEach(item => {
    item.classList.remove("vp-open");
    const iframe = item.querySelector("iframe");
    if (iframe) iframe.src = "";
  });
}

function toggleItem(item) {
  const isOpen = item.classList.contains("vp-open");
  closeAll();
  if (isOpen) return;
  item.classList.add("vp-open");
  const guid   = item.dataset.guid;
  const iframe = item.querySelector("iframe");
  if (iframe && guid) { iframe.src = embedUrl(guid); markWatched(guid); }
  setTimeout(() => item.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
}

function buildLinks(links) {
  if (!links?.length) return "";
  const btns = links.map(l =>
    `<button class="vp-step-link" data-seccion="${l.seccion}" type="button">${l.label}</button>`
  ).join("");
  return `<div class="vp-step-links">${btns}</div>`;
}

function buildAccordion() {
  const watched = getWatched();
  return MODULE_GROUPS.map(group => {
    const items = group.keys.map(key => {
      const v = VIDEOS[key];
      if (!v) return "";
      const done = watched.has(v.guid);
      const dur  = v.duration !== "—" ? `· ${v.duration}` : "";
      return `
      <div class="vp-acc-item" data-guid="${v.guid}">
        <button class="vp-acc-trigger" type="button">
          <span class="vp-dot${done ? " vp-dot--done" : ""}" title="${done ? "Visto" : ""}">●</span>
          <span class="vp-acc-info">
            <span class="vp-acc-title">${v.title}</span>
            <span class="vp-acc-dur">${dur}</span>
          </span>
          <span class="vp-acc-arrow">▾</span>
        </button>
        <div class="vp-acc-body">
          <p class="vp-acc-desc">${v.description}</p>
          ${buildLinks(v.links)}
          <div class="vp-acc-player">
            <iframe allowfullscreen
              allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen">
            </iframe>
          </div>
        </div>
      </div>`;
    }).join("");
    return `<div class="vp-module-header">${group.label}</div>${items}`;
  }).join("");
}

function getHTML() {
  return `
  <button id="vp-tab" title="Ver videos guía EC0217.01">
    <span id="vp-badge"></span>
    <span class="vp-tab-icon">▶</span>
    <span class="vp-tab-label">Guía<br>EC0217</span>
  </button>
  <div id="vp-overlay"></div>
  <aside id="vp-drawer">
    <div id="vp-header">
      <span id="vp-header-title">📹 Guía EC0217.01 <small>(${ALL_KEYS.length} videos)</small></span>
      <button id="vp-close" title="Cerrar">✕</button>
    </div>
    <div id="vp-accordion">${buildAccordion()}</div>
  </aside>`;
}

function openDrawer() {
  document.getElementById("vp-drawer")?.classList.add("vp-open");
  document.getElementById("vp-overlay")?.classList.add("vp-overlay--on");
}

function closeDrawer() {
  closeAll();
  document.getElementById("vp-drawer")?.classList.remove("vp-open");
  document.getElementById("vp-overlay")?.classList.remove("vp-overlay--on");
}

export function initVideoPanel() {
  document.body.insertAdjacentHTML("beforeend", getHTML());
  document.getElementById("vp-tab")?.addEventListener("click", openDrawer);
  document.getElementById("vp-close")?.addEventListener("click", closeDrawer);
  document.getElementById("vp-overlay")?.addEventListener("click", closeDrawer);
  document.getElementById("vp-accordion")?.addEventListener("click", e => {
    if (e.target.closest(".vp-step-link")) {
      navigateOrBlock(e.target.closest(".vp-step-link").dataset.seccion);
      return;
    }
    const trigger = e.target.closest(".vp-acc-trigger");
    if (trigger) toggleItem(trigger.closest(".vp-acc-item"));
  });
  updateBadge();
}
