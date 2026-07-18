// ─── wizard/ia-resumen.js — IA para Resumen y Compromisos ───────────────────
// generarResumenIA:     genera el resumen general del curso
// generarCompromisosIA: genera compromisos de aplicación del aprendizaje

import { llamarIA } from "./api.js";
import { guardarUndo, mostrarUndo, iniciarBatch, finalizarBatch } from "./undo.js";

export async function generarResumenIA() {
  const expositiva   = getData("ec0217_expositiva")   || {};
  const demostrativa = getData("ec0217_demostrativa") || {};
  const dialogo      = getData("ec0217_dialogo")      || {};
  const objetivos    = getData("ec0217_objetivos")    || {};
  const datos        = getData("ec0217_datos")        || {};

  const loaderResumen             = document.getElementById("loaderResumen");
  const btnGenerarResumen         = document.getElementById("btnGenerarResumen");
  const cierreResumen             = document.getElementById("cierreResumen");
  const sugerenciasContinuidad    = document.getElementById("sugerenciasContinuidad");
  const referenciasBibliograficas = document.getElementById("referenciasBibliograficas");
  const compromisosTexto          = document.getElementById("compromisosTexto");

  guardarUndo("ec0217_cierre", "cargarCierre");
  try {
    if (loaderResumen)     loaderResumen.style.display   = "block";
    if (btnGenerarResumen) btnGenerarResumen.disabled    = true;

    const data = await llamarIA("generate-resumen", {
      nombreCurso:               datos.nombreCurso          || "",
      objetivoGeneral:           objetivos.general          || "",
      objetivoCognitivo:         objetivos.cognitiva        || "",
      objetivoPsicomotriz:       objetivos.psicomotriz      || "",
      objetivoAfectivo:          objetivos.afectiva         || "",
      desarrolloExpositiva:      expositiva.desarrollo      || "",
      actividadDemostrativa:     demostrativa.actividad     || "",
      instruccionesDialogo:      dialogo.instrucciones      || "",
      sugerenciasContinuidad:    sugerenciasContinuidad    ? sugerenciasContinuidad.value.trim()    : "",
      referenciasBibliograficas: referenciasBibliograficas ? referenciasBibliograficas.value.trim() : "",
      compromisos:               compromisosTexto          ? compromisosTexto.value.trim()          : "",
    });

    const texto = data.texto || data.resumen || "";
    if (texto) {
      if (cierreResumen) cierreResumen.value = texto;
      localStorage.setItem("ec0217_cierre_resumen", texto);
      if (typeof window.guardarCierreTemporal === "function") window.guardarCierreTemporal();
      mostrarUndo("Resumen", "cierreResumen");
    }
  } catch (err) {
    const msg = typeof mensajeAmigable === "function" ? mensajeAmigable(err) : err.message;
    if (typeof showAlert === "function") showAlert(`⚠️ No se pudo generar el resumen:\n\n${msg}`);
    console.error("Error generando resumen:", err);
  } finally {
    if (loaderResumen)     loaderResumen.style.display  = "none";
    if (btnGenerarResumen) btnGenerarResumen.disabled   = false;
  }
}

export async function generarCompromisosIA() {
  const objetivos = getData("ec0217_objetivos") || {};
  const datos     = getData("ec0217_datos")     || {};

  const loaderCompromisos   = document.getElementById("loaderCompromisos");
  const btnGenerarCompromisos = document.getElementById("btnGenerarCompromisos");
  const compromisosTexto    = document.getElementById("compromisosTexto");

  guardarUndo("ec0217_cierre", "cargarCierre");
  try {
    if (loaderCompromisos)     loaderCompromisos.style.display  = "block";
    if (btnGenerarCompromisos) btnGenerarCompromisos.disabled   = true;

    const data = await llamarIA("generate-compromisos", {
      nombreCurso:         datos.nombreCurso      || "",
      objetivoGeneral:     objetivos.general      || "",
      objetivoCognitivo:   objetivos.cognitiva    || "",
      objetivoPsicomotriz: objetivos.psicomotriz  || "",
      objetivoAfectivo:    objetivos.afectiva     || "",
    });

    const texto = data.texto || data.compromisos || "";
    if (texto && compromisosTexto) {
      compromisosTexto.value = texto;
      if (typeof window.guardarCierreTemporal === "function") window.guardarCierreTemporal();
      mostrarUndo("Compromisos", "compromisosTexto");
    }
  } catch (err) {
    const msg = typeof mensajeAmigable === "function" ? mensajeAmigable(err) : err.message;
    if (typeof showAlert === "function") showAlert(`⚠️ No se pudieron generar los compromisos:\n\n${msg}`);
    console.error("Error generando compromisos:", err);
  } finally {
    if (loaderCompromisos)     loaderCompromisos.style.display = "none";
    if (btnGenerarCompromisos) btnGenerarCompromisos.disabled  = false;
  }
}

async function _generarTodoCierre(btnTodo) {
  const compromisos        = document.getElementById("compromisosTexto");
  const cierreTexto        = document.getElementById("cierreTexto");
  const cierreResumen      = document.getElementById("cierreResumen");
  const descripcionGeneral = document.getElementById("descripcionGeneralEvaluacion");

  iniciarBatch("ec0217_cierre", "cargarCierre");
  const tareas = [];
  if (!compromisos?.value.trim())  tareas.push({ fn: generarCompromisosIA });
  const cierreVacio = !cierreTexto?.value.trim();
  if (cierreVacio) {
    tareas.push({ fn: () => window.generarCierreIA?.() });
  } else if (!cierreResumen?.value.trim()) {
    tareas.push({ fn: generarResumenIA });
  }
  if (!descripcionGeneral?.value.trim()) tareas.push({ fn: () => window.generarDescripcionGeneralIA?.() });

  if (tareas.length === 0) {
    if (typeof showAlert === "function") showAlert("Todos los campos ya tienen contenido.");
    return;
  }

  const hayLlenos = !!(compromisos?.value.trim() || cierreTexto?.value.trim() || cierreResumen?.value.trim());
  if (hayLlenos) {
    const ok = typeof showConfirm === "function"
      ? await showConfirm("Algunos campos ya tienen contenido. ¿Generar solo los vacíos?",
          { title: "Generar todo", confirmText: "Sí, solo los vacíos" })
      : confirm("Algunos campos ya tienen contenido. ¿Generar solo los vacíos?");
    if (!ok) return;
  }

  btnTodo.disabled = true;
  const original = btnTodo.textContent;
  try {
    for (let i = 0; i < tareas.length; i++) {
      btnTodo.textContent = `⏳ Generando ${i + 1}/${tareas.length}…`;
      await tareas[i].fn();
    }
    btnTodo.textContent = "✅ ¡Todo generado!";
    finalizarBatch("Cierre completo");
    setTimeout(() => { btnTodo.textContent = original; }, 2500);
  } catch (_) {
    btnTodo.textContent = original;
  } finally {
    btnTodo.disabled = false;
  }
}

export function initIAResumen() {
  window.generarResumenIA     = generarResumenIA;
  window.generarCompromisosIA = generarCompromisosIA;

  const btnTodo = document.getElementById("btnGenerarTodoCierre");
  if (btnTodo) btnTodo.addEventListener("click", () => _generarTodoCierre(btnTodo));

  document.getElementById("btnGenerarResumen")?.addEventListener("click", () => generarResumenIA());
  document.getElementById("btnGenerarCompromisos")?.addEventListener("click", () => generarCompromisosIA());
}
