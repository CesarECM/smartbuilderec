// diseno/wizard/html-evaluaciones.js — Template HTML del Paso 14: Evaluaciones

export function getEvaluacionesTemplate() {
  return `
      <section id="seccionEvaluaciones" class="wizard-section hidden">
        <p class="paso-titulo">Paso 14 de 16</p>
        <h1>Evaluaciones</h1>
        <button type="button" id="btnGenerarTodoEvaluaciones" class="btn-ia" style="margin-bottom:8px;">✨ Generar todo con IA</button>
        <p style="font-size:13px;color:#666;margin:0 0 20px;">Solo rellena los campos vacíos. Si alguno ya tiene contenido te preguntará antes de continuar.</p>

        <div class="card" style="max-width: 950px;">
          <p>Define los instrumentos y porcentajes de evaluación que se utilizarán durante el curso.</p>

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
              <label for="sliderEvaluaciones">Ajusta la distribución entre evaluación formativa y sumativa</label>
              <input type="range" id="sliderEvaluaciones" min="0" max="100" step="5" value="50">
              <div class="slider-extremos">
                <span>Formativa</span><span>Equilibrado</span><span>Sumativa</span>
              </div>
            </div>
            <input type="hidden" id="pctDiagnostica" value="0">
            <input type="hidden" id="pctFormativa" value="50">
            <input type="hidden" id="pctSumativa" value="50">
          </div>

          <span class="hint">La suma de evaluación formativa y sumativa debe ser 100%. La diagnóstica puede ser 0% porque normalmente solo identifica conocimientos previos.</span>

          <hr>
          <h3>Instrumentos de evaluación</h3>

          <div class="form-group full-width">
            <label for="instDiagnostica">Evaluación diagnóstica</label>
            <button type="button" id="btnGenerarDiagnostica" class="btn-siguiente">✨ Generar evaluación diagnóstica con IA</button>
            <div id="loaderDiagnostica" style="display:none; margin-top:15px;">Generando evaluación diagnóstica...</div>
            <textarea spellcheck="true" lang="es" id="instDiagnostica" rows="12"
              placeholder="Aquí aparecerán 5 preguntas de opción múltiple."></textarea>
          </div>
          <div class="form-group full-width" style="margin-top:12px;">
            <label for="instDiagnosticaHeader">Instrucciones / Propósito / Alcance / Tiempo</label>
            <span class="hint">Encabezado del instrumento entregado al participante.</span>
            <textarea spellcheck="true" lang="es" id="instDiagnosticaHeader" rows="4"
              placeholder="Ej. Instrucciones: Lee cada pregunta y selecciona la respuesta correcta. Tiempo: 10 min."></textarea>
            <p class="hint" style="margin-top:4px;"><strong>Distribución:</strong> 5 reactivos × 20% = 100%</p>
          </div>
          <div class="form-group full-width" style="margin-top:12px;">
            <label for="instDiagnosticaClave">Clave de respuestas <span class="hint">(solo manual del instructor)</span></label>
            <textarea spellcheck="true" lang="es" id="instDiagnosticaClave" rows="3"
              placeholder="1. A  2. B  3. C  4. D  5. E"></textarea>
          </div>
          <div class="form-group full-width" style="margin-top:12px;">
            <label for="apfDiagnostica">Alcance / Propósito / Finalidad <span class="hint">(texto para el Documento de Planeación)</span></label>
            <button type="button" id="btnGenerarAPFDiagnostica" class="btn-siguiente">✨ Generar con IA (basado en el objetivo general del curso)</button>
            <textarea spellcheck="true" lang="es" id="apfDiagnostica" rows="4"
              placeholder="Alcance: ...&#10;Propósito: ...&#10;Finalidad: ..."></textarea>
          </div><br>

          <div class="form-group full-width">
            <label for="instFormativa">Instrumento de evaluación formativa</label>
            <button type="button" id="btnGenerarFormativa" class="btn-siguiente">✨ Generar evaluación formativa con IA</button>
            <div id="loaderFormativa" style="display:none; margin-top:15px;">Generando evaluación formativa...</div>
            <textarea spellcheck="true" lang="es" id="instFormativa" rows="12"
              placeholder="Aquí aparecerá una lista de cotejo o guía de observación generada con IA."></textarea>
          </div>
          <div class="form-group full-width" style="margin-top:12px;">
            <label for="instFormativaHeader">Instrucciones / Propósito / Alcance / Tiempo</label>
            <span class="hint">Encabezado del instrumento entregado al participante.</span>
            <textarea spellcheck="true" lang="es" id="instFormativaHeader" rows="4"
              placeholder="Se llenará automáticamente al generar con IA."></textarea>
            <p id="notaFormativaPct" class="hint" style="margin-top:4px;"><em>Distribución de porcentajes: se calculará al generar con IA.</em></p>
          </div>
          <div class="form-group full-width" style="margin-top:12px;">
            <label for="instFormativaClave">Clave de respuestas <span class="hint">(solo manual del instructor)</span></label>
            <textarea spellcheck="true" lang="es" id="instFormativaClave" rows="3"
              placeholder="Se llenará automáticamente al generar con IA."></textarea>
          </div>
          <div class="form-group full-width" style="margin-top:12px;">
            <label for="apfFormativa">Alcance / Propósito / Finalidad <span class="hint">(texto para el Documento de Planeación)</span></label>
            <button type="button" id="btnGenerarAPFFormativa" class="btn-siguiente">✨ Generar con IA (basado en el objetivo general del curso)</button>
            <textarea spellcheck="true" lang="es" id="apfFormativa" rows="4"
              placeholder="Alcance: ...&#10;Propósito: ...&#10;Finalidad: ..."></textarea>
          </div>

          <br>
          <div class="form-group full-width">
            <label for="instSumativa">Evaluación sumativa</label>
            <button type="button" id="btnGenerarSumativa" class="btn-siguiente">✨ Generar evaluación sumativa con IA</button>
            <div id="loaderSumativa" style="display:none; margin-top:15px;">Generando evaluación sumativa...</div>
            <textarea spellcheck="true" lang="es" id="instSumativa" rows="12"
              placeholder="Aquí aparecerán 5 preguntas de opción múltiple."></textarea>
          </div>
          <div class="form-group full-width" style="margin-top:12px;">
            <label for="instSumativaHeader">Instrucciones / Propósito / Alcance / Tiempo</label>
            <span class="hint">Encabezado del instrumento entregado al participante.</span>
            <textarea spellcheck="true" lang="es" id="instSumativaHeader" rows="4"
              placeholder="Ej. Instrucciones: Lee cada pregunta y selecciona la respuesta correcta. Tiempo: 10 min."></textarea>
            <p class="hint" style="margin-top:4px;"><strong>Distribución:</strong> 5 reactivos × 20% = 100%</p>
          </div>
          <div class="form-group full-width" style="margin-top:12px;">
            <label for="instSumativaClave">Clave de respuestas <span class="hint">(solo manual del instructor)</span></label>
            <textarea spellcheck="true" lang="es" id="instSumativaClave" rows="3"
              placeholder="1. A  2. B  3. C  4. D  5. E"></textarea>
          </div>
          <div class="form-group full-width" style="margin-top:12px;">
            <label for="apfSumativa">Alcance / Propósito / Finalidad <span class="hint">(texto para el Documento de Planeación)</span></label>
            <button type="button" id="btnGenerarAPFSumativa" class="btn-siguiente">✨ Generar con IA (basado en el objetivo general del curso)</button>
            <textarea spellcheck="true" lang="es" id="apfSumativa" rows="4"
              placeholder="Alcance: ...&#10;Propósito: ...&#10;Finalidad: ..."></textarea>
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

          <button class="btn-siguiente" id="btnGuardarEvaluaciones">Siguiente</button>
        </div>
      </section>
  `;
}
