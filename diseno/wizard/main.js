// ─── wizard/main.js — Entry point ES Module del wizard EC0217 ────────────────
// Corre como <script type="module"> — diferido por el navegador, ejecuta
// después de parsear todo el HTML y después de los scripts clásicos.
//
// Orden de init:
//   sidebar → navigation → ui-helpers → sync        (Sprint 8)
//   step-datos → step-objetivos → … → step-formatos (Sprint 9)

import { state, setState, getSeccionCompleta, setSeccionCompleta, getDatos, setDatos } from "./state.js";
import { BACKEND_URL, FLUJO_SECCIONES, NAV_A_SECCION, DURACION_MINIMA_MIN, CATEGORIAS_MATERIALES, TECNICAS_MATERIALES } from "./config.js";
import { llamarIA, llamarIAStream } from "./api.js";
import { initSyncUI }               from "./ui-sync.js";
import { initSidebar }              from "./ui-sidebar.js";
import { initUIHelpers }            from "./ui-helpers.js";
import { escribirConDelay, escribirConDelayCancelable } from "./ui-writing.js";
import { mostrarSeccionPrincipal, desbloquear, initNavigation } from "./navigation.js";

// Sprint 9: Steps del wizard
import { initStepDatos }            from "./step-datos.js";
import { initStepObjetivos }        from "./step-objetivos.js";
import { initStepBeneficios }       from "./step-beneficios.js";
import { initStepTemario }          from "./step-temario.js";
import { initStepEncuadre }         from "./step-encuadre.js";
import { initStepDetalleTecnicas }  from "./step-detalle-tecnicas.js";
import { initStepTecnicas }         from "./step-tecnicas.js";
import { initStepExpositiva }       from "./step-expositiva.js";
import { initStepDemostrativa }     from "./step-demostrativa.js";
import { initStepDialogo }          from "./step-dialogo.js";
import { initStepCierre }           from "./step-cierre.js";
import { initStepEvaluaciones }     from "./step-evaluaciones.js";
import { initStepTiempos }          from "./step-tiempos.js";
import { initStepMateriales }       from "./step-materiales.js";
import { initStepFormatos }         from "./step-formatos.js";

// ─── Inicializar módulos de UI en orden ──────────────────────────────────────
initSidebar();     // Grupos colapsables + hamburguesa; expone window.abrirGrupoActivo
initNavigation();  // Modo libre + teclado; expone window.mostrarSeccionPrincipal, window.desbloquear
initUIHelpers();   // Progress bar, focus mode, toasts, botones copiar/regresar
initSyncUI();      // Indicadores sync (sbe:sync-*)

// ─── Inicializar steps (exponen sus funciones en window.*) ────────────────────
initStepDatos();
initStepObjetivos();
initStepBeneficios();
initStepTemario();
initStepEncuadre();
initStepDetalleTecnicas();
initStepTecnicas();
initStepExpositiva();
initStepDemostrativa();
initStepDialogo();
initStepCierre();
initStepEvaluaciones();
initStepTiempos();
initStepMateriales();
initStepFormatos();

// ─── Exponer API de módulos en window.* ──────────────────────────────────────
window.wizardState  = { state, setState, getSeccionCompleta, setSeccionCompleta, getDatos, setDatos };
window.wizardConfig = { BACKEND_URL, FLUJO_SECCIONES, NAV_A_SECCION, DURACION_MINIMA_MIN, CATEGORIAS_MATERIALES, TECNICAS_MATERIALES };
window.wizardAPI    = { llamarIA, llamarIAStream };
window.wizardUI     = { escribirConDelay, escribirConDelayCancelable };

// Señal para que otros scripts/tests detecten que la capa modular está lista
window.dispatchEvent(new CustomEvent("wizard:modules-ready"));
