// ─── gce/main.js — Bootstrap del portal GCE ───────────────────────────────────
// Tipo: ES Module (cargado con type="module" en gce.html)

import { BACKEND_URL, ESTADO_A_PASO } from "./config.js";
import { state }                        from "./state.js";
import { getSidebarHTML, initNavigation, mostrarPaso, actualizarSidebar } from "./navigation.js";
import { getTemplate as tplFicha,  initStepFicha,       cargarFicha, guardarFicha }     from "./step-ficha.js";
import { getTemplate as tplDiag,   initStepDiagnostico, finalizarDiagnostico }           from "./step-diagnostico.js";
import { getTemplate as tplPlan,   initStepPlan, cargarPlan, guardarPlan,
         confirmarPlanEvaluador, confirmarPlanCandidato }                                   from "./step-plan.js";
import { getTemplate as tplIEC,     initStepIEC, guardarIEC, emitirJuicio }                 from "./step-iec.js";
import { getTemplate as tplCedula,  initStepCedula, guardarCedula, emitirCedula }           from "./step-cedula.js";
import { getTemplate as tplEncuesta, initStepEncuesta, guardarEncuesta, cerrarProceso }      from "./step-encuesta.js";

// ── Bootstrap ─────────────────────────────────────────────────────────────────

(async () => {
  if (!await window.authGuard?.()) return;

  const params     = new URLSearchParams(window.location.search);
  const procesoId  = params.get("proceso_id");

  if (!procesoId) {
    window.location.href = "panel";
    return;
  }

  // Obtener proceso + estándar (join vía Supabase JS RLS)
  const { data: proceso, error } = await window._supabase
    .from("procesos_evaluacion")
    .select("*, estandares_competencia(*)")
    .eq("id", procesoId)
    .single();

  if (error || !proceso) {
    document.body.innerHTML =
      '<p style="padding:40px;font-size:14px;color:#ef4444">Proceso no encontrado o sin acceso.</p>';
    return;
  }

  // Poblar estado global
  state.procesoId = procesoId;
  state.proceso   = proceso;
  state.estandar  = proceso.estandares_competencia;
  state.datos     = proceso.datos || {};
  state.perfil    = await window.getUserProfile?.();

  // Exponer en window para sync.js (script no-módulo)
  window._gceState   = state;
  window._gceBACKEND = BACKEND_URL;

  // Exponer funciones de pasos que los templates invocan por nombre
  window.guardarFicha              = guardarFicha;
  window.finalizarDiagnostico      = finalizarDiagnostico;
  window.guardarPlan               = guardarPlan;
  window.confirmarPlanEvaluador    = confirmarPlanEvaluador;
  window.confirmarPlanCandidato    = confirmarPlanCandidato;
  window.guardarIEC                = guardarIEC;
  window.guardarCedula             = guardarCedula;
  window.gceEmitirCedula           = emitirCedula;
  window.guardarEncuesta           = guardarEncuesta;
  window.gceCerrarProceso          = cerrarProceso;
  window.actualizarSidebar         = actualizarSidebar;

  // ── Inyectar sidebar ──────────────────────────────────────────────────────
  const sidebar = document.getElementById("sidebar");
  if (sidebar) sidebar.innerHTML = getSidebarHTML();

  // ── Inyectar pasos en el main ─────────────────────────────────────────────
  const mainEl = document.getElementById("gce-main");
  if (mainEl) {
    mainEl.insertAdjacentHTML("beforeend", tplFicha());
    mainEl.insertAdjacentHTML("beforeend", tplDiag());
    mainEl.insertAdjacentHTML("beforeend", tplPlan());
    mainEl.insertAdjacentHTML("beforeend", tplIEC());
    mainEl.insertAdjacentHTML("beforeend", tplCedula());
    mainEl.insertAdjacentHTML("beforeend", tplEncuesta());
  }

  // ── Inicializar módulos ───────────────────────────────────────────────────
  initNavigation();
  initStepFicha();
  initStepDiagnostico();
  initStepPlan();
  initStepIEC();
  initStepCedula();
  initStepEncuesta();

  // ── Actualizar header ─────────────────────────────────────────────────────
  const nombre = [state.perfil?.nombre, state.perfil?.apellido].filter(Boolean).join(" ")
              || state.perfil?.email || "";
  const navNom = document.getElementById("wiz-nav-nombre");
  if (navNom) navNom.textContent = nombre;

  const navCurso = document.getElementById("wiz-nav-curso");
  if (navCurso) navCurso.textContent = state.estandar?.codigo
    ? `${state.estandar.codigo} — Portafolio de Evidencias`
    : "Portafolio de Evidencias";

  if (typeof window.inyectarBranding === "function") window.inyectarBranding(state.perfil);

  // ── Mostrar paso según estado del proceso ─────────────────────────────────
  const pasoInicial = ESTADO_A_PASO[proceso.estado] || "ficha";
  mostrarPaso(pasoInicial);

})();
