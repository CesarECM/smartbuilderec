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

export function getTemplate() {
  return `
      <section id="seccionEvaluaciones" class="wizard-section hidden">
        <p class="paso-titulo">Paso 14 de 16</p>
        <h1>Evaluaciones</h1>
        <button type="button" id="btnGenerarTodoEvaluaciones" class="btn-ia" style="margin-bottom:8px;">✨ Generar todo con IA</button>
        <p style="font-size:13px;color:#666;margin:0 0 20px;">Solo rellena los campos vacíos. Si alguno ya tiene contenido te preguntará antes de continuar.</p>

        <div class="card" style="max-width: 950px;">
          <p>
            Define los instrumentos y porcentajes de evaluación que se utilizarán durante el curso.
          </p>

          <h3>Porcentajes de evaluación</h3>

          <div class="evaluacion-porcentajes-card">
            <div class="evaluacion-diagnostica-card">
              <span>Evaluación diagnóstica</span>
              <strong id="pctDiagnosticaLabel">0%</strong>
              <small>La evaluación diagnóstica no tiene valor ponderado.</small>
            </div>
            <div class="evaluacion-valores">
              <div class="evaluacion-valor-card">
                <span class="evaluacion-label">Formativa</span>
                <strong id="pctFormativaValor">50%</strong>
              </div>
              <div class="evaluacion-valor-card">
                <span class="evaluacion-label">Sumativa</span>
                <strong id="pctSumativaValor">50%</strong>
              </div>
            </div>
            <div class="slider-contenedor">
              <label for="sliderEvaluaciones">
                Ajusta la distribución entre evaluación formativa y sumativa
              </label>
              <input type="range" id="sliderEvaluaciones" min="0" max="100" step="5" value="50">
              <div class="slider-extremos">
                <span>Formativa</span>
                <span>Equilibrado</span>
                <span>Sumativa</span>
              </div>
            </div>
            <input type="hidden" id="pctDiagnostica" value="0">
            <input type="hidden" id="pctFormativa" value="50">
            <input type="hidden" id="pctSumativa" value="50">
          </div>

          <span class="hint">
            La suma de evaluación formativa y sumativa debe ser 100%. La diagnóstica puede ser 0% porque normalmente solo identifica conocimientos previos.
          </span>

          <hr>

          <h3>Instrumentos de evaluación</h3>

          <div class="form-group full-width">
            <label for="instDiagnostica">Evaluación diagnóstica</label>
            <button type="button" id="btnGenerarDiagnostica" class="btn-siguiente">
              ✨ Generar evaluación diagnóstica con IA
            </button>
            <div id="loaderDiagnostica" style="display:none; margin-top:15px;">
              Generando evaluación diagnóstica...
            </div>
            <textarea spellcheck="true" lang="es" id="instDiagnostica" rows="12"
              placeholder="Aquí aparecerán 5 preguntas de opción múltiple."></textarea>
          </div><br>

          <div class="form-group full-width">
            <label for="instFormativa">Instrumento de evaluación formativa</label>
            <button type="button" id="btnGenerarFormativa" class="btn-siguiente">
              ✨ Generar evaluación formativa con IA
            </button>
            <div id="loaderFormativa" style="display:none; margin-top:15px;">
              Generando evaluación formativa...
            </div>
            <textarea spellcheck="true" lang="es" id="instFormativa" rows="12"
              placeholder="Aquí aparecerá una lista de cotejo o guía de observación generada con IA."></textarea>
          </div>

          <br>
          <div class="form-group full-width">
            <label for="instSumativa">Evaluación sumativa</label>
            <button type="button" id="btnGenerarSumativa" class="btn-siguiente">
              ✨ Generar evaluación sumativa con IA
            </button>
            <div id="loaderSumativa" style="display:none; margin-top:15px;">
              Generando evaluación sumativa...
            </div>
            <textarea spellcheck="true" lang="es" id="instSumativa" rows="12"
              placeholder="Aquí aparecerán 5 preguntas de opción múltiple."></textarea>
          </div>

          <div class="form-group full-width">
            <label for="instReac">Preguntas adicionales de evaluación de reacción <span class="hint">(opcional)</span></label>
            <span class="hint">Agrega preguntas personalizadas que aparecerán al final de la encuesta de satisfacción.</span>
            <textarea spellcheck="true" lang="es" id="instReac" rows="5"
              placeholder="Escribe aquí preguntas adicionales para la evaluación de reacción, una por línea."></textarea>
          </div>

          <span class="error-msg" id="err-evaluaciones">
            Completa los porcentajes e instrumentos de evaluación. La suma de formativa y sumativa debe ser 100%.
          </span>

          <button class="btn-siguiente" id="btnGuardarEvaluaciones">
            Siguiente
          </button>
        </div>
      </section>
  `;
}
