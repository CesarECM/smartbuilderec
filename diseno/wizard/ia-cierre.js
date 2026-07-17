// ─── wizard/ia-cierre.js — IA para Cierre del Curso ─────────────────────────
// generarCierreIA:            genera el texto de cierre + resumen automático
// generarDescripcionGeneralIA: genera la descripción general a partir del cierre

import { llamarIA } from "./api.js";
import { guardarUndo, mostrarUndo } from "./undo.js";

export async function generarCierreIA() {
  const datos        = getData("ec0217_datos")        || {};
  const objetivos    = getData("ec0217_objetivos")    || {};
  const expositiva   = getData("ec0217_expositiva")   || {};
  const demostrativa = getData("ec0217_demostrativa") || {};
  const dialogo      = getData("ec0217_dialogo")      || {};

  const desarrolloExpositiva  = expositiva.desarrollo      || "";
  const actividadDemostrativa = demostrativa.actividad     || "";
  const instruccionesDialogo  = dialogo.instrucciones      || "";

  if (!desarrolloExpositiva || !actividadDemostrativa || !instruccionesDialogo) {
    if (typeof showAlert === "function") showAlert(
      "Para generar el cierre necesitas tener información en: inciso d) de técnica expositiva, inciso c) de técnica demostrativa e inciso d) de técnica diálogo/discusión.",
      { title: "Pasos requeridos" }
    );
    return;
  }

  const loaderCierre            = document.getElementById("loaderCierre");
  const btnGenerarCierre        = document.getElementById("btnGenerarCierre");
  const cierreTexto             = document.getElementById("cierreTexto");
  const sugerenciasContinuidad  = document.getElementById("sugerenciasContinuidad");
  const referenciasBibliograficas = document.getElementById("referenciasBibliograficas");
  const compromisosTexto        = document.getElementById("compromisosTexto");
  const cierreResumen           = document.getElementById("cierreResumen");

  guardarUndo("ec0217_cierre", "cargarCierre");
  try {
    if (loaderCierre)     loaderCierre.style.display  = "block";
    if (btnGenerarCierre) btnGenerarCierre.disabled   = true;

    const data = await llamarIA("generate-cierre", {
      nombreCurso:         datos.nombreCurso       || "",
      objetivoGeneral:     objetivos.general       || "",
      objetivoCognitivo:   objetivos.cognitiva     || "",
      objetivoPsicomotriz: objetivos.psicomotriz   || "",
      objetivoAfectivo:    objetivos.afectiva      || "",
      desarrolloExpositiva,
      actividadDemostrativa,
      instruccionesDialogo,
    });

    if (cierreTexto) cierreTexto.value = data.texto || "";
    if (typeof window.guardarCierreTemporal === "function") window.guardarCierreTemporal();
    mostrarUndo("Cierre", "cierreTexto");

    // Generar resumen automáticamente junto al cierre
    try {
      const resumenData = await llamarIA("generate-resumen", {
        nombreCurso:               datos.nombreCurso              || "",
        objetivoGeneral:           objetivos.general              || "",
        objetivoCognitivo:         objetivos.cognitiva            || "",
        objetivoPsicomotriz:       objetivos.psicomotriz          || "",
        objetivoAfectivo:          objetivos.afectiva             || "",
        desarrolloExpositiva,
        actividadDemostrativa,
        instruccionesDialogo,
        sugerenciasContinuidad:    sugerenciasContinuidad    ? sugerenciasContinuidad.value.trim()    : "",
        referenciasBibliograficas: referenciasBibliograficas ? referenciasBibliograficas.value.trim() : "",
        compromisos:               compromisosTexto          ? compromisosTexto.value.trim()          : "",
      });
      const textoResumen = resumenData.texto || resumenData.resumen || "";
      if (textoResumen) {
        if (cierreResumen) cierreResumen.value = textoResumen;
        localStorage.setItem("ec0217_cierre_resumen", textoResumen);
        if (typeof window.guardarCierreTemporal === "function") window.guardarCierreTemporal();
      }
    } catch (errResumen) {
      console.warn("No se pudo generar el resumen automático:", errResumen);
    }

  } catch (err) {
    console.error("Error al generar cierre:", err);
    const msg = typeof mensajeAmigable === "function" ? mensajeAmigable(err) : err.message;
    if (typeof showAlert === "function") showAlert(`No se pudo generar el cierre:\n\n${msg}`);
  } finally {
    if (loaderCierre)     loaderCierre.style.display = "none";
    if (btnGenerarCierre) btnGenerarCierre.disabled  = false;
  }
}

export async function generarDescripcionGeneralIA() {
  const cierre     = getData("ec0217_cierre") || {};
  const textoCierre = cierre.texto || "";

  if (!textoCierre.trim()) {
    if (typeof showAlert === "function") showAlert("Primero escribe o genera el texto de cierre.");
    if (typeof window.actualizarBotonDescripcionGeneral === "function") window.actualizarBotonDescripcionGeneral();
    return;
  }

  const loaderDescripcionGeneral    = document.getElementById("loaderDescripcionGeneral");
  const btnGenerarDescripcionGeneral = document.getElementById("btnGenerarDescripcionGeneral");
  const descripcionGeneralEvaluacion = document.getElementById("descripcionGeneralEvaluacion");

  guardarUndo("ec0217_evaluaciones", "cargarEvaluaciones");
  try {
    if (loaderDescripcionGeneral)    loaderDescripcionGeneral.style.display   = "block";
    if (btnGenerarDescripcionGeneral) btnGenerarDescripcionGeneral.disabled   = true;

    const data = await llamarIA("generate-descripcion-general", { cierre: textoCierre });

    if (descripcionGeneralEvaluacion) descripcionGeneralEvaluacion.value = data.texto || "";
    if (typeof window.guardarEvaluacionesTemporal === "function") window.guardarEvaluacionesTemporal();
    mostrarUndo("Descripción general", "descripcionGeneralEvaluacion");

  } catch (err) {
    console.error("Error al generar descripción general:", err);
    const msg = typeof mensajeAmigable === "function" ? mensajeAmigable(err) : err.message;
    if (typeof showAlert === "function") showAlert(`No se pudo generar la descripción general:\n\n${msg}`);
  } finally {
    if (loaderDescripcionGeneral) loaderDescripcionGeneral.style.display = "none";
    if (typeof window.actualizarBotonDescripcionGeneral === "function") window.actualizarBotonDescripcionGeneral();
  }
}

export function initIACierre() {
  window.generarCierreIA             = generarCierreIA;
  window.generarDescripcionGeneralIA = generarDescripcionGeneralIA;
}
