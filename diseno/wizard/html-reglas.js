// ─── wizard/html-reglas.js — Template HTML: Paso 6 Reglas del Curso ──────────
// Nota: este archivo tiene 320 líneas por ser HTML declarativo estático (excepción documentada).

export function getTemplate() {
  return `
      <section id="seccionReglas" class="wizard-section hidden">
        <p class="paso-titulo">Paso 6 de 16</p>
        <h1>Reglas del Curso</h1>

        <div class="card" style="max-width: 950px;">
          <p>
            Las reglas de operación se acuerdan con el grupo al inicio del encuadre para garantizar
            un ambiente de aprendizaje respetuoso y organizado. Se mencionan en el contrato de aprendizaje.
          </p>
          <p class="hint">
            💡 Selecciona las que apliquen a tu contexto. Puedes agregar una regla personalizada al final
            si ninguna de las opciones cubre tu situación específica.
          </p>

          <hr>

          <h3>Reglas del curso</h3>

          <div class="checkbox-list">
            <div class="regla-apartado">
              <h4>Puntualidad</h4>
              <label>
                <input type="radio" name="reglaPuntualidad" class="regla-check"
                  value="Puntualidad: Entrada libre en cualquier momento.">
                Entrada libre en cualquier momento.
              </label>
              <label>
                <input type="radio" name="reglaPuntualidad" class="regla-check"
                  value="Puntualidad: Tolerancia amplia; se puede entrar tarde si es una excepción justificada.">
                Tolerancia amplia; se puede entrar tarde si es una excepción justificada.
              </label>
              <label>
                <input type="radio" name="reglaPuntualidad" class="regla-check"
                  value="Puntualidad: Tolerancia de 5-10 min; después se registra como retardo o falta.">
                Tolerancia de 5-10 min; después se registra como retardo o falta.
              </label>
              <label>
                <input type="radio" name="reglaPuntualidad" class="regla-check"
                  value="Puntualidad: No hay acceso tras el inicio de la sesión.">
                No hay acceso tras el inicio de la sesión.
              </label>
            </div>

            <div class="regla-apartado">
              <h4>Limpieza / Espacio</h4>
              <label>
                <input type="radio" name="reglaLimpiezaEspacio" class="regla-check"
                  value="Limpieza / Espacio: Cada quien decide su orden.">
                Cada quien decide su orden.
              </label>
              <label>
                <input type="radio" name="reglaLimpiezaEspacio" class="regla-check"
                  value="Limpieza / Espacio: El grupo es responsable de dejar el salón decente al final del día.">
                El grupo es responsable de dejar el salón decente al final del día.
              </label>
              <label>
                <input type="radio" name="reglaLimpiezaEspacio" class="regla-check"
                  value="Limpieza / Espacio: Cada alumno debe limpiar su sitio específico antes de retirarse.">
                Cada alumno debe limpiar su sitio específico antes de retirarse.
              </label>
              <label>
                <input type="radio" name="reglaLimpiezaEspacio" class="regla-check"
                  value="Limpieza / Espacio: Inspección de bancos y piso antes de permitir la salida del grupo.">
                Inspección de bancos y piso antes de permitir la salida del grupo.
              </label>
            </div>

            <div class="regla-apartado">
              <h4>Uso del Celular</h4>
              <label>
                <input type="radio" name="reglaCelular" class="regla-check"
                  value="Uso del Celular: Uso libre y constante.">
                Uso libre y constante.
              </label>
              <label>
                <input type="radio" name="reglaCelular" class="regla-check"
                  value="Uso del Celular: Permitido sobre la mesa para consultas rápidas o si esperan una llamada.">
                Permitido sobre la mesa para consultas rápidas o si esperan una llamada.
              </label>
              <label>
                <input type="radio" name="reglaCelular" class="regla-check"
                  value="Uso del Celular: Guardado en la mochila; solo se saca si el instructor lo pide para una actividad.">
                Guardado en la mochila; solo se saca si el instructor lo pide para una actividad.
              </label>
              <label>
                <input type="radio" name="reglaCelular" class="regla-check"
                  value="Uso del Celular: Prohibido y guardado. Uso conlleva sanción o retiro del equipo.">
                Prohibido y guardado. Uso conlleva sanción o retiro del equipo.
              </label>
            </div>

            <div class="regla-apartado">
              <h4>Alimentos / Bebidas</h4>
              <label>
                <input type="radio" name="reglaAlimentosBebidas" class="regla-check"
                  value="Alimentos / Bebidas: Comida completa en el escritorio.">
                Comida completa en el escritorio.
              </label>
              <label>
                <input type="radio" name="reglaAlimentosBebidas" class="regla-check"
                  value="Alimentos / Bebidas: Snacks y bebidas permitidas siempre que no generen ruido o basura.">
                Snacks y bebidas permitidas siempre que no generen ruido o basura.
              </label>
              <label>
                <input type="radio" name="reglaAlimentosBebidas" class="regla-check"
                  value="Alimentos / Bebidas: Solo bebidas con tapa. Comida permitida únicamente en el receso.">
                Solo bebidas con tapa. Comida permitida únicamente en el receso.
              </label>
              <label>
                <input type="radio" name="reglaAlimentosBebidas" class="regla-check"
                  value="Alimentos / Bebidas: Prohibido cualquier tipo de consumo, incluido chicle o agua.">
                Prohibido cualquier tipo de consumo, incluido chicle o agua.
              </label>
            </div>

            <div class="regla-apartado">
              <h4>Salidas del Aula</h4>
              <label>
                <input type="radio" name="reglaSalidasAula" class="regla-check"
                  value="Salidas del Aula: Flujo constante de personas.">
                Flujo constante de personas.
              </label>
              <label>
                <input type="radio" name="reglaSalidasAula" class="regla-check"
                  value="Salidas del Aula: Salidas libres uno a la vez sin interrumpir la explicación.">
                Salidas libres "uno a la vez" sin interrumpir la explicación.
              </label>
              <label>
                <input type="radio" name="reglaSalidasAula" class="regla-check"
                  value="Salidas del Aula: Se debe pedir permiso visual o verbal antes de salir de la sesión.">
                Se debe pedir permiso visual o verbal antes de salir de la sesión.
              </label>
              <label>
                <input type="radio" name="reglaSalidasAula" class="regla-check"
                  value="Salidas del Aula: Salidas restringidas exclusivamente a los minutos de descanso.">
                Salidas restringidas exclusivamente a los minutos de descanso.
              </label>
            </div>

            <div class="regla-apartado">
              <h4>Solicitar la Palabra</h4>
              <label>
                <input type="radio" name="reglaSolicitarPalabra" class="regla-check"
                  value="Solicitar la Palabra: Charla abierta, estilo café.">
                Charla abierta, estilo café.
              </label>
              <label>
                <input type="radio" name="reglaSolicitarPalabra" class="regla-check"
                  value="Solicitar la Palabra: Se puede interrumpir educadamente para aportar al hilo de la idea.">
                Se puede interrumpir educadamente para aportar al hilo de la idea.
              </label>
              <label>
                <input type="radio" name="reglaSolicitarPalabra" class="regla-check"
                  value="Solicitar la Palabra: Obligatorio levantar la mano y esperar a que el instructor ceda el turno.">
                Obligatorio levantar la mano y esperar a que el instructor ceda el turno.
              </label>
              <label>
                <input type="radio" name="reglaSolicitarPalabra" class="regla-check"
                  value="Solicitar la Palabra: Solo se habla cuando el instructor lanza una pregunta directa.">
                Solo se habla cuando el instructor lanza una pregunta directa.
              </label>
            </div>
          </div>

          <div class="form-group full-width">
            <label for="otraRegla">Otra regla</label>
            <input type="text" id="otraRegla" placeholder="Escribe otra regla si aplica">
          </div>

          <button type="button" id="btnCopiarReglas" class="btn-siguiente">
            Añadir las opciones seleccionadas
          </button><br>

          <br><div class="form-group full-width">
            <label for="reglasCursoTexto">Reglas del curso seleccionadas</label>
            <strong>Las reglas que aparecen en este recuadro, seran las que aparecerán en los documentos finales</strong>
            <textarea spellcheck="true" lang="es" id="reglasCursoTexto" rows="7"
              placeholder="Aquí aparecerán las reglas seleccionadas. Puedes editarlas antes de continuar."></textarea>
          </div>

          <hr>

          <span id="err-reglas" class="error-msg">Agrega preguntas de experiencia o reglas del curso para continuar.</span>

          <button class="btn-siguiente" id="btnGuardarReglas">
            Siguiente
          </button>
        </div>
      </section>
  `;
}
