// ─── wizard/main.js — Entry point ES Module del wizard EC0217 ────────────────
// Corre como <script type="module"> — diferido por el navegador, ejecuta
// después de parsear todo el HTML.
//
// Orden de init:
//   (Sprint 17) inyectar HTML de secciones → sidebar
//   sidebar → navigation → ui-helpers → sync              (Sprint 8)
//   step-datos → step-objetivos → … → step-formatos       (Sprint 9)
//   ia-objetivos → ia-temario → … → ia-materiales         (Sprint 10)
//   export → validators                                    (Sprint 11)
//   initWizardApp() — bootstrap: auth, storage, cargar secciones

// ─── Imports principales ─────────────────────────────────────────────────────
import { state, setState, getSeccionCompleta, setSeccionCompleta, getDatos, setDatos } from "./state.js";
import { BACKEND_URL, FLUJO_SECCIONES, NAV_A_SECCION, DURACION_MINIMA_MIN, CATEGORIAS_MATERIALES, TECNICAS_MATERIALES } from "./config.js";
import { llamarIA, llamarIAStream }  from "./api.js";
import { initSyncUI }                from "./ui-sync.js";
import { initSidebar, getSidebarHTML, abrirGrupoActivo } from "./ui-sidebar.js";
import { initUIHelpers }             from "./ui-helpers.js";
import { escribirConDelay, escribirConDelayCancelable } from "./ui-writing.js";
import { mostrarSeccionPrincipal, desbloquear, initNavigation } from "./navigation.js";

// Sprint 11: Export y validadores normativos
import { initExport }           from "./export.js";
import { initDownloadTracker }  from "./download-tracker.js";
import { validarTiempos, validarTaxonomia, validarCategoriasMateriales } from "./validators.js";

// Sprint 10: Módulos de IA
import { initUndo }          from "./undo.js";
import { initIAObjetivos }   from "./ia-objetivos.js";
import { initIABeneficios }  from "./ia-beneficios.js";
import { initIATemario }     from "./ia-temario.js";
import { initIAEncuadre }    from "./ia-encuadre.js";
import { initIATecnicas }    from "./ia-tecnicas.js";
import { initIADialogo }     from "./ia-dialogo.js";
import { initIACierre }      from "./ia-cierre.js";
import { initIAResumen }     from "./ia-resumen.js";
import { initIAEvaluacion }  from "./ia-evaluacion.js";
import { initIAMateriales }  from "./ia-materiales.js";

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

// Sprint 17: Templates HTML de secciones del wizard
import { getTemplate as getTplDatos }        from "./step-datos.js";
import { getTemplate as getTplObjetivos }    from "./step-objetivos.js";
import { getTemplate as getTplBeneficios }   from "./step-beneficios.js";
import { getTemplate as getTplTemario }      from "./step-temario.js";
import { getTemplate as getTplPreguntas }    from "./step-encuadre.js";
import { getTemplate as getTplReglas }       from "./html-reglas.js";
import { getTemplate as getTplContrato }     from "./html-contrato.js";
import { getTemplate as getTplIntegracion }  from "./html-integracion.js";
import { getTemplate as getTplEnergizante }  from "./step-detalle-tecnicas.js";
import { getTemplate as getTplExpositiva }   from "./step-expositiva.js";
import { getTemplate as getTplDemostrativa } from "./step-demostrativa.js";
import { getTemplate as getTplDialogo }      from "./step-dialogo.js";
import { getTemplate as getTplCierre }       from "./step-cierre.js";
import { getTemplate as getTplEvaluaciones } from "./step-evaluaciones.js";
import { getTemplate as getTplTiempos }      from "./step-tiempos.js";
import { getTemplate as getTplMateriales }   from "./step-materiales.js";
import { getTemplate as getTplFormatos }     from "./step-formatos.js";

// ─── Sprint 17: Inyectar HTML estructural antes de inicializar ────────────────
const _sidebar = document.getElementById("sidebar");
if (_sidebar) _sidebar.innerHTML = getSidebarHTML();

const _main = document.querySelector("main.main");
if (_main) {
  _main.insertAdjacentHTML("beforeend", getTplDatos());
  _main.insertAdjacentHTML("beforeend", getTplObjetivos());
  _main.insertAdjacentHTML("beforeend", getTplBeneficios());
  _main.insertAdjacentHTML("beforeend", getTplTemario());
  _main.insertAdjacentHTML("beforeend", getTplPreguntas());
  _main.insertAdjacentHTML("beforeend", getTplReglas());
  _main.insertAdjacentHTML("beforeend", getTplContrato());
  _main.insertAdjacentHTML("beforeend", getTplIntegracion());
  _main.insertAdjacentHTML("beforeend", getTplEnergizante());
  _main.insertAdjacentHTML("beforeend", getTplExpositiva());
  _main.insertAdjacentHTML("beforeend", getTplDemostrativa());
  _main.insertAdjacentHTML("beforeend", getTplDialogo());
  _main.insertAdjacentHTML("beforeend", getTplCierre());
  _main.insertAdjacentHTML("beforeend", getTplEvaluaciones());
  _main.insertAdjacentHTML("beforeend", getTplTiempos());
  _main.insertAdjacentHTML("beforeend", getTplMateriales());
  _main.insertAdjacentHTML("beforeend", getTplFormatos());
}

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

// ─── Sprint 11: Export y validadores ─────────────────────────────────────────
initExport();
initDownloadTracker();
window.wizardValidators = { validarTiempos, validarTaxonomia, validarCategoriasMateriales };

// ─── Sprint 10: Módulos de IA ─────────────────────────────────────────────────
initUndo();
initIAObjetivos();
initIABeneficios();
initIATemario();
initIAEncuadre();
initIATecnicas();
initIADialogo();
initIACierre();
initIAResumen();
initIAEvaluacion();
initIAMateriales();

// ─── Exponer API de módulos en window.* ──────────────────────────────────────
window.wizardState  = { state, setState, getSeccionCompleta, setSeccionCompleta, getDatos, setDatos };
window.wizardConfig = { BACKEND_URL, FLUJO_SECCIONES, NAV_A_SECCION, DURACION_MINIMA_MIN, CATEGORIAS_MATERIALES, TECNICAS_MATERIALES };
window.wizardAPI    = { llamarIA, llamarIAStream };
window.wizardUI     = { escribirConDelay, escribirConDelayCancelable };

// Señal para que otros scripts/tests detecten que la capa modular está lista
window.dispatchEvent(new CustomEvent("wizard:modules-ready"));

// ─── Bootstrap: auth, storage y carga inicial de secciones ───────────────────
(async () => {
  if (window.location.pathname === "/" && !window.location.search) {
    const _s = await getSession();
    if (_s) { window.location.replace("/panel"); return; }
  }
  if (!await authGuard()) return;
  await storageSync.init();

  const adminEditing = localStorage.getItem("sbe_admin_editing");
  if (adminEditing) {
    const banner = document.createElement("div");
    banner.id = "admin-edit-banner";
    banner.style.cssText = [
      "position:fixed;top:0;left:0;right:0;z-index:9999",
      "background:#1e40af;color:white;text-align:center",
      "padding:9px 48px 9px 16px;font-size:13px;font-weight:600",
      "box-shadow:0 2px 8px rgba(0,0,0,0.3)"
    ].join(";");
    banner.textContent = "✏️ Editando planeación de: " + adminEditing + ". Los cambios se guardan automáticamente.";
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.style.cssText = "position:absolute;right:14px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.2);border:none;color:white;padding:3px 9px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:700;";
    closeBtn.onclick = () => { banner.remove(); document.body.style.paddingTop = ""; };
    banner.appendChild(closeBtn);
    document.body.prepend(banner);
    document.body.style.paddingTop = "42px";
  }

  // W#7: Autocompletar datos del instructor desde el perfil en cursos nuevos
  const esNuevoCurso = localStorage.getItem("ec0217_datos_completo") !== "true"
                    && !getData("ec0217_datos")?.nombreCurso;
  if (esNuevoCurso && typeof getUserProfile === "function") {
    try {
      const perfil = await getUserProfile();
      if (perfil) {
        const nombreCompleto = [perfil.nombre, perfil.apellido].filter(Boolean).join(" ");
        const datosActuales = getData("ec0217_datos") || {};
        if (!datosActuales.instructor && nombreCompleto) {
          saveData("ec0217_datos", { ...datosActuales, instructor: nombreCompleto, disenador: nombreCompleto });
        }
      }
    } catch (_) {}
  }

  // Recargar todas las secciones con datos frescos de Supabase
  window.cargarDatosCurso?.();
  window.cargarObjetivos?.();
  window.cargarBeneficios?.();
  window.cargarTemario?.();
  window.cargarEncuadre?.();
  window.cargarTecnicas?.();
  window.cargarExpositiva?.();
  window.cargarDemostrativa?.();
  window.cargarDialogo?.();
  window.cargarCierre?.();
  window.cargarEvaluaciones?.();
  window.cargarTiempos?.();
  window.actualizarBotonDescripcionGeneral?.();

  if (localStorage.getItem("ec0217_datos_completo") === "true") {
    document.getElementById("nav-datos")?.classList.add("completed");
    document.getElementById("nav-objetivos")?.classList.remove("disabled");
    mostrarSeccionPrincipal("seccionObjetivos");
  } else {
    mostrarSeccionPrincipal("seccionDatos");
  }

  abrirGrupoActivo();
})();
