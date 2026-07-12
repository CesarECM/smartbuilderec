// ─── wizard/html-contrato.js — Template HTML: Paso 7 Contrato de Aprendizaje ──

export function getTemplate() {
  return `
      <section id="seccionContrato" class="wizard-section hidden">
        <p class="paso-titulo">Paso 7 de 16</p>
        <h1>Contrato de Aprendizaje</h1>

        <div class="card" style="max-width: 950px;">
          <p>
            Selecciona los compromisos que formarán parte del contrato de aprendizaje.
          </p>

          <h3>Contrato de aprendizaje</h3>

          <div class="checkbox-list">
            <label>
              <input type="checkbox" class="acuerdo-check" value="Me comprometo a participar activamente durante el curso">
              Me comprometo a participar activamente durante el curso
            </label>
            <label>
              <input type="checkbox" class="acuerdo-check" value="Me comprometo a realizar las actividades solicitadas">
              Me comprometo a realizar las actividades solicitadas
            </label>
            <label>
              <input type="checkbox" class="acuerdo-check" value="Me comprometo a respetar las opiniones de mis compañeros">
              Me comprometo a respetar las opiniones de mis compañeros
            </label>
            <label>
              <input type="checkbox" class="acuerdo-check" value="Me comprometo a cumplir con los tiempos establecidos">
              Me comprometo a cumplir con los tiempos establecidos
            </label>
            <label>
              <input type="checkbox" class="acuerdo-check" value="Me comprometo a aplicar los conocimientos adquiridos">
              Me comprometo a aplicar los conocimientos adquiridos
            </label>
            <label>
              <input type="checkbox" class="acuerdo-check" value="Me comprometo a mantener una actitud de respeto y colaboración">
              Me comprometo a mantener una actitud de respeto y colaboración
            </label>
          </div>

          <div class="form-group full-width">
            <label for="otroAcuerdo">Otro compromiso del contrato de aprendizaje</label>
            <div class="tema-input-row">
              <input type="text" id="otroAcuerdo" placeholder="Escribe otro compromiso si aplica">
              <button type="button" id="btnAgregarAcuerdo" class="btn-siguiente">Agregar compromiso</button>
            </div>
            <div id="listaAcuerdosPersonalizados" class="temas-lista"></div>
          </div>

          <span id="err-contrato" class="error-msg">Selecciona al menos un compromiso o escribe uno personalizado.</span>

          <button class="btn-siguiente" id="btnGuardarContrato">
            Siguiente
          </button>
        </div>
      </section>
  `;
}
