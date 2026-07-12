// ─── wizard/navigation.js — Navegación principal del wizard ──────────────────
// W#4: Modo libre | W#8: Teclado Alt+←/→

import { FLUJO_SECCIONES, NAV_A_SECCION } from "./config.js";
import { abrirGrupoActivo }               from "./ui-sidebar.js";

// Llama una función global definida en app.js si existe (durante la transición)
function _call(name, ...args) {
  if (typeof window[name] === "function") window[name](...args);
}

/**
 * Muestra la sección wizard indicada y actualiza el estado del sidebar.
 * Versión canónica que reemplaza la de app.js al cargarse el módulo.
 */
export function mostrarSeccionPrincipal(id) {
  document.querySelectorAll(".wizard-section").forEach(s => s.classList.add("hidden"));

  const seccion = document.getElementById(id);
  if (!seccion) { console.error(`No existe la sección: ${id}`); return; }
  seccion.classList.remove("hidden");

  document.querySelectorAll(".sidebar .nav-item").forEach(item => item.classList.remove("active"));

  // Activar el nav-item correspondiente e invocar el init específico de la sección
  const sideCalls = {
    seccionDatos:        ["nav-datos"],
    seccionObjetivos:    ["nav-objetivos"],
    seccionBeneficios:   ["nav-beneficios"],
    seccionTemario:      ["nav-temario"],
    seccionPreguntas:    ["nav-preguntas"],
    seccionReglas:       ["nav-reglas"],
    seccionContrato:     ["nav-contrato",     "inicializarContratoPorDefecto"],
    seccionIntegracion:  ["nav-integracion",  "inicializarTecnicasPersonalizadasPorDefecto"],
    seccionEnergizante:  ["nav-energizante",  "inicializarTecnicasPersonalizadasPorDefecto"],
    seccionExpositiva:   ["nav-expositiva",   "cargarObjetivoCognitivoExpositiva"],
    seccionDemostrativa: ["nav-demostrativa", "cargarObjetivoPsicomotrizDemostrativa"],
    seccionDialogo:      ["nav-dialogo",      "cargarObjetivoAfectivoDialogo"],
    seccionCierre:       ["nav-cierre"],
    seccionEvaluaciones: ["nav-evaluaciones", "actualizarBotonDescripcionGeneral"],
    seccionTiempos:      ["nav-tiempos"],
    seccionMateriales:   ["nav-materiales",   "cargarMateriales"],
    seccionFormatos:     ["nav-formatos",      "poblarResumenExpediente"],
  };

  const [navId, initFn] = sideCalls[id] ?? [];
  if (navId) document.getElementById(navId)?.classList.add("active");
  if (initFn) _call(initFn);

  abrirGrupoActivo();

  // Actualizar progress bar (definido en ui-helpers.js; expuesto en window por initUIHelpers)
  const seccionKey = id.replace("seccion", "").toLowerCase();
  _call("actualizarProgressBar", seccionKey);

  // Inyectar botones copiar tras navegar
  setTimeout(() => _call("inyectarBotonesCopiar"), 100);
}

/** Quita la clase "disabled" del nav-item de una sección */
export function desbloquear(seccion) {
  document.getElementById(`nav-${seccion}`)?.classList.remove("disabled");
}

/** Registra listeners de navegación; expone mostrarSeccionPrincipal y desbloquear en window */
export function initNavigation() {
  // W#4: Modo libre — permite navegar a secciones deshabilitadas
  const btn = document.getElementById("btnModoLibre");
  if (btn) {
    let activo = false;
    const actualizar = () => {
      btn.textContent   = activo ? "ON" : "OFF";
      btn.style.background  = activo ? "rgba(74,222,128,0.2)" : "rgba(255,255,255,0.05)";
      btn.style.color       = activo ? "#4ade80" : "rgba(255,255,255,0.4)";
      btn.style.borderColor = activo ? "rgba(74,222,128,0.4)" : "rgba(255,255,255,0.2)";
    };
    btn.addEventListener("click", () => { activo = !activo; actualizar(); });

    document.querySelector(".nav-grupos")?.addEventListener("click", (e) => {
      if (!activo) return;
      const item = e.target.closest(".nav-item");
      if (!item || !item.classList.contains("disabled")) return;
      const seccion = NAV_A_SECCION[item.id];
      if (seccion) { e.stopPropagation(); mostrarSeccionPrincipal(seccion); }
    }, true);
  }

  // W#8: Navegación con teclado Alt+← / Alt+→
  document.addEventListener("keydown", e => {
    if (!e.altKey || !["ArrowLeft", "ArrowRight"].includes(e.key)) return;
    const tag = document.activeElement?.tagName;
    if (["INPUT", "TEXTAREA", "SELECT"].includes(tag)) return;

    const visible = FLUJO_SECCIONES.find(id => {
      const el = document.getElementById(id);
      return el && !el.classList.contains("hidden");
    });
    const idx = FLUJO_SECCIONES.indexOf(visible);
    if (idx === -1) return;

    e.preventDefault();
    const destino = e.key === "ArrowRight"
      ? FLUJO_SECCIONES[idx + 1]
      : FLUJO_SECCIONES[idx - 1];
    if (destino) mostrarSeccionPrincipal(destino);
  });

  // Exponer en window para que app.js y scripts clásicos puedan llamarlos
  window.mostrarSeccionPrincipal = mostrarSeccionPrincipal;
  window.desbloquear             = desbloquear;
}
