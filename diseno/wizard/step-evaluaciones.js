// ─── wizard/step-evaluaciones.js — Paso 14: Evaluaciones ────────────────────

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
    instFormativa:            g("instFormativa"),
    instSumativa:             g("instSumativa"),
    instReac:                 g("instReac"),
    tipoInstrumentoFormativa: _tipoInstrumentoFormativa,
    descripcionGeneral:       g("descripcionGeneralEvaluacion"),
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

    set("instDiagnostica",          d.instDiagnostica  || "");
    set("instFormativa",            d.instFormativa    || "");
    set("instSumativa",             d.instSumativa     || "");
    set("instReac",                 d.instReac         || "");
    set("descripcionGeneralEvaluacion", d.descripcionGeneral || "");

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
  window.actualizarPorcentajesEvaluacion  = actualizarPorcentajesEvaluacion;
  window.recolectarEvaluaciones           = recolectarEvaluaciones;
  window.guardarEvaluacionesTemporal      = guardarEvaluacionesTemporal;
  window.cargarEvaluaciones               = cargarEvaluaciones;
  window.validarEvaluaciones              = validarEvaluaciones;
  window.guardarEvaluacionesFinal         = guardarEvaluacionesFinal;
  window.actualizarBotonDescripcionGeneral = actualizarBotonDescripcionGeneral;
}
