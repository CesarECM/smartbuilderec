// ─── wizard/ia-resumen.js — IA para Resumen y Compromisos ───────────────────
// generarResumenIA:     genera el resumen general del curso
// generarCompromisosIA: genera compromisos de aplicación del aprendizaje

import { llamarIA } from "./api.js";

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

export function initIAResumen() {
  window.generarResumenIA     = generarResumenIA;
  window.generarCompromisosIA = generarCompromisosIA;
}
