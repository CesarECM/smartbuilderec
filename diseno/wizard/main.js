// ─── wizard/main.js — Entry point ES Module del wizard EC0217 ────────────────
// Corre como <script type="module"> — diferido por el navegador, ejecuta
// después de parsear todo el HTML y después de los scripts clásicos.
//
// Orden de init: sidebar → navigation → ui-helpers → sync
// (navigation depende de ui-sidebar; ui-helpers expone window.* que navigation llama)

import { state, setState, getSeccionCompleta, setSeccionCompleta, getDatos, setDatos } from "./state.js";
import { BACKEND_URL, FLUJO_SECCIONES, NAV_A_SECCION, DURACION_MINIMA_MIN, CATEGORIAS_MATERIALES, TECNICAS_MATERIALES } from "./config.js";
import { llamarIA, llamarIAStream } from "./api.js";
import { initSyncUI }               from "./ui-sync.js";
import { initSidebar }              from "./ui-sidebar.js";
import { initUIHelpers }            from "./ui-helpers.js";
import { escribirConDelay, escribirConDelayCancelable } from "./ui-writing.js";
import { mostrarSeccionPrincipal, desbloquear, initNavigation } from "./navigation.js";

// ─── Inicializar módulos de UI en orden ──────────────────────────────────────
initSidebar();     // Grupos colapsables + hamburguesa; expone window.abrirGrupoActivo
initNavigation();  // Modo libre + teclado; expone window.mostrarSeccionPrincipal, window.desbloquear
initUIHelpers();   // Progress bar, focus mode, toasts, botones copiar/regresar
initSyncUI();      // Indicadores sync (sbe:sync-*)

// ─── Exponer API de módulos en window.* ──────────────────────────────────────
window.wizardState  = { state, setState, getSeccionCompleta, setSeccionCompleta, getDatos, setDatos };
window.wizardConfig = { BACKEND_URL, FLUJO_SECCIONES, NAV_A_SECCION, DURACION_MINIMA_MIN, CATEGORIAS_MATERIALES, TECNICAS_MATERIALES };
window.wizardAPI    = { llamarIA, llamarIAStream };
window.wizardUI     = { escribirConDelay, escribirConDelayCancelable };

// Señal para que otros scripts/tests detecten que la capa modular está lista
window.dispatchEvent(new CustomEvent("wizard:modules-ready"));
