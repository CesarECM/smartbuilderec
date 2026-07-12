// ─── wizard/ui-helpers.js — Helpers visuales del wizard (UX/UI) ───────────────

import { FLUJO_SECCIONES, DURACION_MINIMA_MIN } from "./config.js";

// ─── Progress bar ─────────────────────────────────────────────────────────────

const PROGRESS_STEPS = [
  { key: "ec0217_datos_completo",        label: "Datos del curso" },
  { key: "ec0217_objetivos_completo",    label: "Objetivos" },
  { key: "ec0217_beneficios_completo",   label: "Beneficios" },
  { key: "ec0217_temario_completo",      label: "Temario" },
  { key: "ec0217_encuadre_completo",     label: "Encuadre" },
  { key: "ec0217_tecnicas_completo",     label: "Técnicas grupales" },
  { key: "ec0217_expositiva_completo",   label: "Técnica expositiva" },
  { key: "ec0217_demostrativa_completo", label: "Técnica demostrativa" },
  { key: "ec0217_dialogo_completo",      label: "Técnica diálogo" },
  { key: "ec0217_cierre_completo",       label: "Cierre" },
  { key: "ec0217_evaluaciones_completo", label: "Evaluaciones" },
  { key: "ec0217_tiempos_completo",      label: "Tiempos" },
  { key: "ec0217_materiales_completo",   label: "Materiales" },
];

export function actualizarProgressBar(seccionActual) {
  const progressFill  = document.getElementById("progress-fill");
  const progressPct   = document.getElementById("progress-pct");
  const progressLabel = document.getElementById("progress-step-label");

  const total       = PROGRESS_STEPS.length;
  const completados = PROGRESS_STEPS.filter(s => localStorage.getItem(s.key) === "true").length;
  const pct         = Math.round((completados / total) * 100);

  if (progressFill) progressFill.style.width = pct + "%";
  if (progressPct)  progressPct.textContent  = pct + "%";

  if (progressLabel && seccionActual) {
    const paso   = PROGRESS_STEPS.findIndex(s => s.key.includes(seccionActual));
    const num    = paso >= 0 ? paso + 1 : "";
    const nombre = PROGRESS_STEPS.find(s => s.key.includes(seccionActual))?.label || seccionActual;
    progressLabel.textContent = num ? `Paso ${num} — ${nombre}` : nombre;
  }
}

// ─── Focus Mode ───────────────────────────────────────────────────────────────

export function setFocusMode(activo) {
  const layoutEl    = document.querySelector(".layout");
  const btnFocusMode = document.getElementById("btnFocusMode");
  if (!layoutEl) return;
  layoutEl.classList.toggle("focus-mode", activo);
  if (btnFocusMode) {
    btnFocusMode.textContent = activo ? "→ Mostrar sidebar" : "⬅ Modo Focus";
  }
  localStorage.setItem("ec0217_focus_mode", activo ? "1" : "0");
}

// ─── Sistema de Toasts ────────────────────────────────────────────────────────

export function showToast(mensaje, tipo = "default", duracion = 3000) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  const iconos = { success: "✅", error: "❌", warning: "⚠️", default: "ℹ️" };
  toast.textContent = (iconos[tipo] || "") + " " + mensaje;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("out");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, duracion);
}

// ─── Botones de copiar en textareas IA ───────────────────────────────────────

export function inyectarBotonesCopiar() {
  const TEXTAREAS_IA = [
    "beneficiosTexto", "cierreTexto", "cierreResumen", "compromisosTexto",
    "sugerenciasContinuidad", "referenciasBibliograficas",
    "preguntasEncuadre", "instDiagnostica", "instFormativa", "instSumativa",
  ];

  TEXTAREAS_IA.forEach(id => {
    const ta = document.getElementById(id);
    if (!ta) return;

    const padre = ta.closest(".form-group, .textarea-ia-row") || ta.parentElement;
    if (!padre || padre.querySelector(".btn-copiar-ia")) return;

    const computado = getComputedStyle(padre);
    if (computado.position === "static") padre.style.position = "relative";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-copiar-ia";
    btn.textContent = "📋 Copiar";
    btn.title = "Copiar al portapapeles";

    btn.addEventListener("click", async () => {
      const texto = ta.value.trim();
      if (!texto) return;
      try {
        await navigator.clipboard.writeText(texto);
        btn.textContent = "✓ Copiado";
        btn.classList.add("copiado");
        showToast("Copiado al portapapeles", "success", 2000);
        setTimeout(() => { btn.textContent = "📋 Copiar"; btn.classList.remove("copiado"); }, 2000);
      } catch (_) {
        showToast("No se pudo copiar", "error", 2500);
      }
    });

    padre.appendChild(btn);
  });
}

// ─── Celebración al descargar ─────────────────────────────────────────────────

export function mostrarCelebracion() {
  const overlay = document.getElementById("celebration-overlay");
  if (!overlay) return;
  overlay.classList.add("show");
  setTimeout(() => overlay.classList.remove("show"), 3200);
}

// ─── Campos de Datos del curso (para validación blur) ─────────────────────────
// Se duplica aquí temporalmente; migra a step-datos.js en Sprint 9

const CAMPOS_DATOS = [
  { id: "nombreCurso",   errId: "err-nombreCurso",   tipo: "texto" },
  { id: "instructor",    errId: "err-instructor",    tipo: "texto" },
  { id: "disenador",     errId: "err-disenador",     tipo: "texto" },
  { id: "lugar",         errId: "err-lugar",         tipo: "texto" },
  { id: "fecha",         errId: "err-fecha",         tipo: "texto" },
  { id: "duracion",      errId: "err-duracion",      tipo: "numero", min: DURACION_MINIMA_MIN },
  { id: "participantes", errId: "err-participantes", tipo: "numero", min: 4 },
  { id: "perfil",        errId: "err-perfil",        tipo: "texto" },
];

// ─── initUIHelpers — llamado desde main.js ─────────────────────────────────────

export function initUIHelpers() {
  // 1. Marcar botones de IA con clase btn-ia
  document.querySelectorAll("button").forEach(btn => {
    const txt = btn.textContent || "";
    if (txt.includes("✨") && (txt.includes("IA") || txt.includes("Generar"))) {
      btn.classList.add("btn-ia");
    }
  });

  // 2. Progress bar inicial
  actualizarProgressBar("datos");

  // 3. Focus mode
  const btnFocusMode = document.getElementById("btnFocusMode");
  const btnFocusExit = document.getElementById("btnFocusExit");
  const layoutEl     = document.querySelector(".layout");

  if (btnFocusMode) {
    btnFocusMode.addEventListener("click", () => {
      setFocusMode(!layoutEl?.classList.contains("focus-mode"));
    });
  }
  if (btnFocusExit) {
    btnFocusExit.addEventListener("click", () => setFocusMode(false));
  }
  document.addEventListener("keydown", e => {
    if (e.key === "Escape" && layoutEl?.classList.contains("focus-mode")) setFocusMode(false);
  });
  if (localStorage.getItem("ec0217_focus_mode") === "1") {
    requestAnimationFrame(() => setFocusMode(true));
  }

  // 4. Toasts — exponer en window
  window.showToast = showToast;
  window.inyectarBotonesCopiar = inyectarBotonesCopiar;
  window.actualizarProgressBar = actualizarProgressBar;
  window.mostrarCelebracion    = mostrarCelebracion;
  window.setFocusMode          = setFocusMode;

  // 5. Inyectar botones copiar en sección inicial
  inyectarBotonesCopiar();

  // 6. Parchear descargarPlaneacionFinal para mostrar celebración
  const _descargarOriginal = window.descargarPlaneacionFinal;
  if (typeof _descargarOriginal === "function") {
    window.descargarPlaneacionFinal = async function() {
      await _descargarOriginal.apply(this, arguments);
      mostrarCelebracion();
    };
  }
  const btnDescargarFinal = document.getElementById("btnDescargarPlaneacionFinal");
  if (btnDescargarFinal) {
    btnDescargarFinal.addEventListener("click", () => setTimeout(mostrarCelebracion, 800));
  }

  // 7. Toast de autoguardado (parcha localStorage.setItem una sola vez)
  if (!localStorage._sbeParcheado) {
    let _toastGuardadoTimer = null;
    const _origSetItem = localStorage.setItem.bind(localStorage);
    localStorage.setItem = function(key, value) {
      _origSetItem(key, value);
      if (key.startsWith("ec0217_") && !key.endsWith("_completo") && !key.endsWith("_resumen")) {
        clearTimeout(_toastGuardadoTimer);
        _toastGuardadoTimer = setTimeout(() => {
          const label = document.getElementById("progress-step-label");
          if (label) {
            const original = label.textContent;
            label.textContent = "✓ Guardado automáticamente";
            label.style.color = "var(--c-success)";
            setTimeout(() => { label.textContent = original; label.style.color = ""; }, 1800);
          }
        }, 600);
      }
    };
    localStorage._sbeParcheado = true;
  }

  // 8. Botones Regresar
  for (let i = 1; i < FLUJO_SECCIONES.length; i++) {
    const seccionId  = FLUJO_SECCIONES[i];
    const anteriorId = FLUJO_SECCIONES[i - 1];
    if (seccionId === "seccionObjetivos") continue;

    const seccion = document.getElementById(seccionId);
    if (!seccion) continue;

    const btns = [...seccion.querySelectorAll(".btn-siguiente")];
    const btnSiguiente = btns[btns.length - 1];
    if (!btnSiguiente || seccion.querySelector(".btn-regresar")) continue;

    const btnRegresar = document.createElement("button");
    btnRegresar.type = "button";
    btnRegresar.className = "btn-regresar";
    btnRegresar.textContent = "← Regresar";
    btnRegresar.setAttribute("aria-label", "Ir a la sección anterior");
    btnRegresar.addEventListener("click", () => {
      if (typeof window.mostrarSeccionPrincipal === "function") {
        window.mostrarSeccionPrincipal(anteriorId);
      }
    });
    btnSiguiente.parentNode.insertBefore(btnRegresar, btnSiguiente);
  }

  // 9. Validación blur en sección Datos
  CAMPOS_DATOS.forEach(({ id, errId, tipo, min }) => {
    const el  = document.getElementById(id);
    const err = document.getElementById(errId);
    if (!el || !err) return;

    el.addEventListener("blur", () => {
      const valor = el.value.trim();
      if (!valor) {
        el.classList.add("error"); err.style.display = "block";
      } else if (tipo === "numero") {
        const num = parseInt(valor, 10);
        if (isNaN(num) || num < min) {
          el.classList.add("error"); err.style.display = "block";
        } else {
          el.classList.remove("error"); err.style.display = "none";
        }
      } else {
        el.classList.remove("error"); err.style.display = "none";
      }
    });

    el.addEventListener("input", () => {
      if (el.classList.contains("error") && el.value.trim()) {
        el.classList.remove("error"); err.style.display = "none";
      }
    });
  });
}
