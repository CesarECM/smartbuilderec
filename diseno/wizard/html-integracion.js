// ─── wizard/html-integracion.js — Template HTML: Paso 8 Técnica de Integración ─

export function getTemplate() {
  return `
      <section id="seccionIntegracion" class="wizard-section hidden">
        <p class="paso-titulo">Paso 8 de 16</p>
        <h1>Técnica de Integración</h1>

        <div class="card" style="max-width: 950px;">
          <p>
            Selecciona una técnica integracion para facilitar la integración inicial del grupo.
          </p>

          <h3>Técnica de integración</h3>

          <div class="radio-card-group">
            <div id="detalleIntegracion" class="tecnica-detalle">
              <input type="text" id="detalleIntegracionNombre" class="tecnica-nombre-editable"
                placeholder="Nombre de la técnica" />
              <div class="form-group full-width">
                <label for="detalleIntegracionObjetivo">a) Explicará objetivo de la técnica:</label>
                <textarea spellcheck="true" lang="es" id="detalleIntegracionObjetivo" rows="4"></textarea>
              </div>
              <div class="form-group full-width">
                <label for="detalleIntegracionInstrucciones">b) Dará las instrucciones de la técnica:</label>
                <textarea spellcheck="true" lang="es" id="detalleIntegracionInstrucciones" rows="10"></textarea>
              </div>
            </div>

            <div class="radio-card-group tecnica-nombres">
              <label class="radio-card tecnica-nombre-card">
                <input type="radio" name="tecnicaIntegracion" value="bingo">
                <div><h4>El Bingo de Presentación</h4></div>
              </label>
              <label class="radio-card tecnica-nombre-card">
                <input type="radio" name="tecnicaIntegracion" value="dos-verdades">
                <div><h4>Dos Verdades y Una Mentira</h4></div>
              </label>
              <label class="radio-card tecnica-nombre-card">
                <input type="radio" name="tecnicaIntegracion" value="objetos-historia">
                <div><h4>Objetos con Historia (Secreto)</h4></div>
              </label>
              <label class="radio-card tecnica-nombre-card">
                <input type="radio" name="tecnicaIntegracion" value="tombola">
                <div><h4>La Tómbola de Preguntas</h4></div>
              </label>
              <label class="radio-card tecnica-nombre-card">
                <input type="radio" name="tecnicaIntegracion" value="red-similitudes">
                <div><h4>La Red de Similitudes (Round Robin)</h4></div>
              </label>
              <label class="radio-card tecnica-nombre-card">
                <input type="radio" name="tecnicaIntegracion" value="circulo-cumpleanos">
                <div><h4>El Círculo de Cumpleaños (Mudo)</h4></div>
              </label>
              <label class="radio-card tecnica-nombre-card">
                <input type="radio" name="tecnicaIntegracion" value="isla-desierta">
                <div><h4>La Isla Desierta</h4></div>
              </label>
              <label class="radio-card tecnica-nombre-card">
                <input type="radio" name="tecnicaIntegracion" value="mapa-ficticio">
                <div><h4>El Mapa Ficticio</h4></div>
              </label>
              <label class="radio-card tecnica-nombre-card">
                <input type="radio" name="tecnicaIntegracion" value="linea-tiempo">
                <div><h4>La Línea del Tiempo Compartida</h4></div>
              </label>
              <label class="radio-card tecnica-nombre-card">
                <input type="radio" name="tecnicaIntegracion" value="telegrama">
                <div><h4>El Telegrama de 10 Palabras</h4></div>
              </label>
              <label class="radio-card tecnica-nombre-card">
                <input type="radio" name="tecnicaIntegracion" value="personalizada">
                <div><h4>Personalizada</h4></div>
              </label>
            </div>
          </div>

          <span class="error-msg" id="err-integracion">
            Selecciona una técnica integracion para continuar.
          </span>

          <button class="btn-siguiente" id="btnGuardarIntegracion">
            Siguiente
          </button>
        </div>
      </section>
  `;
}
