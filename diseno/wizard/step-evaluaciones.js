// ─── wizard/step-evaluaciones.js — Paso 14: Evaluaciones ────────────────────
import { getEvaluacionesTemplate } from "./html-evaluaciones.js";

// Tipo de instrumento formativa (estado local, compartido vía window)
let _tipoInstrumentoFormativa = "";

export function actualizarPorcentajesEvaluacion(valorFormativa) {
  const formativa = parseInt(valorFormativa, 10);
  const sumativa  = 100 - formativa;

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
  const txt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = `${val}%`; };

  set("pctDiagnostica", 0);
  set("pctFormativa",   formativa);
  set("pctSumativa",    sumativa);
  txt("pctFormativaValor", formativa);
  txt("pctSumativaValor",  sumativa);

  guardarEvaluacionesTemporal();
}

export function recolectarEvaluaciones() {
  const g  = id => document.getElementById(id)?.value.trim() || "";
  const gi = id => parseInt(document.getElementById(id)?.value || "50", 10);
  return {
    pctDiagnostica:           0,
    pctFormativa:             gi("pctFormativa"),
    pctSumativa:              gi("pctSumativa"),
    instDiagnostica:          g("instDiagnostica"),
    instDiagnosticaHeader:    g("instDiagnosticaHeader"),
    instDiagnosticaClave:     g("instDiagnosticaClave"),
    instFormativa:            g("instFormativa"),
    instFormativaHeader:      g("instFormativaHeader"),
    instFormativaClave:       g("instFormativaClave"),
    instSumativa:             g("instSumativa"),
    instSumativaHeader:       g("instSumativaHeader"),
    instSumativaClave:        g("instSumativaClave"),
    notaFormativa:            document.getElementById("notaFormativaPct")?.textContent.trim() || "",
    instReac:                 g("instReac"),
    tipoInstrumentoFormativa: _tipoInstrumentoFormativa,
    estiloPuntaje:            document.querySelector('input[name="estiloPuntaje"]:checked')?.value || "B",
    descripcionGeneral:       g("descripcionGeneralEvaluacion"),
    apfDiagnostica:           g("apfDiagnostica"),
    apfFormativa:             g("apfFormativa"),
    apfSumativa:              g("apfSumativa"),
  };
}

export function guardarEvaluacionesTemporal() {
  localStorage.setItem("ec0217_evaluaciones", JSON.stringify(recolectarEvaluaciones()));
}

export function cargarEvaluaciones() {
  const raw = localStorage.getItem("ec0217_evaluaciones");
  if (!raw) { actualizarPorcentajesEvaluacion(50); return; }

  try {
    const d = JSON.parse(raw);
    _tipoInstrumentoFormativa = d.tipoInstrumentoFormativa || "";
    window.sbetipoInstrumentoFormativa = _tipoInstrumentoFormativa;

    if (d.estiloPuntaje) {
      const radio = document.querySelector(`input[name="estiloPuntaje"][value="${d.estiloPuntaje}"]`);
      if (radio) radio.checked = true;
    }

    const formativa = d.pctFormativa !== undefined ? parseInt(d.pctFormativa, 10) : 50;
    const sumativa  = 100 - formativa;

    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val; };
    const txt = (id, v)   => { const el = document.getElementById(id); if (el) el.textContent = `${v}%`; };

    set("pctDiagnostica", 0);
    set("pctFormativa",   formativa);
    set("pctSumativa",    sumativa);
    set("sliderEvaluaciones", formativa);
    txt("pctFormativaValor", formativa);
    txt("pctSumativaValor",  sumativa);

    set("instDiagnostica",          d.instDiagnostica       || "");
    set("instDiagnosticaHeader",    d.instDiagnosticaHeader || "");
    set("instDiagnosticaClave",     d.instDiagnosticaClave  || "");
    set("instFormativa",            d.instFormativa         || "");
    set("instFormativaHeader",      d.instFormativaHeader   || "");
    set("instFormativaClave",       d.instFormativaClave    || "");
    set("instSumativa",             d.instSumativa          || "");
    set("instSumativaHeader",       d.instSumativaHeader    || "");
    set("instSumativaClave",        d.instSumativaClave     || "");
    set("instReac",                 d.instReac              || "");
    set("descripcionGeneralEvaluacion", d.descripcionGeneral || "");
    set("apfDiagnostica", d.apfDiagnostica || "");
    set("apfFormativa",   d.apfFormativa   || "");
    set("apfSumativa",    d.apfSumativa    || "");
    if (d.notaFormativa) {
      const elNota = document.getElementById("notaFormativaPct");
      if (elNota) elNota.textContent = d.notaFormativa;
    }

    if (localStorage.getItem("ec0217_evaluaciones_completo") === "true") {
      document.getElementById("nav-evaluaciones")?.classList.add("completed");
      document.getElementById("nav-tiempos")?.classList.remove("disabled");
    }
  } catch (_) { actualizarPorcentajesEvaluacion(50); }
}

export function validarEvaluaciones() {
  const pctFormativa = parseInt(document.getElementById("pctFormativa")?.value || "0", 10);
  const pctSumativa  = parseInt(document.getElementById("pctSumativa")?.value  || "0", 10);
  const errEl = document.getElementById("err-evaluaciones");
  const validoPct  = pctFormativa + pctSumativa === 100;
  const validoInst = !!(
    document.getElementById("instDiagnostica")?.value.trim() &&
    document.getElementById("instFormativa")?.value.trim() &&
    document.getElementById("instSumativa")?.value.trim()
  );
  if (errEl) errEl.style.display = (validoPct && validoInst) ? "none" : "block";
  return validoPct && validoInst;
}

export function guardarEvaluacionesFinal() {
  guardarEvaluacionesTemporal();
  localStorage.setItem("ec0217_evaluaciones_completo", "true");
  document.getElementById("nav-evaluaciones")?.classList.add("completed");
  document.getElementById("nav-tiempos")?.classList.remove("disabled");
}

export function actualizarBotonDescripcionGeneral() {
  const cierre = JSON.parse(localStorage.getItem("ec0217_cierre") || "{}");
  const btn = document.getElementById("btnGenerarDescripcionGeneral");
  if (btn) btn.disabled = !(cierre.texto?.trim());
}

export function initStepEvaluaciones() {
  document.getElementById("sliderEvaluaciones")
    ?.addEventListener("input", e => actualizarPorcentajesEvaluacion(e.target.value));

  window.actualizarPorcentajesEvaluacion  = actualizarPorcentajesEvaluacion;
  window.recolectarEvaluaciones           = recolectarEvaluaciones;
  window.guardarEvaluacionesTemporal      = guardarEvaluacionesTemporal;
  window.cargarEvaluaciones               = cargarEvaluaciones;
  window.validarEvaluaciones              = validarEvaluaciones;
  window.guardarEvaluacionesFinal         = guardarEvaluacionesFinal;
  window.actualizarBotonDescripcionGeneral = actualizarBotonDescripcionGeneral;
}

export function getTemplate() {
  return getEvaluacionesTemplate();
}
