// ─── wizard/step-detalle-tecnicas.js — Renderizado de detalles de técnicas ───

import { tecnicasRompehielos, tecnicasEnergizantes } from "./tecnicas-data.js";

const _tecRH  = () => window.sbeTecnicasRompehielos  || tecnicasRompehielos;
const _tecEN  = () => window.sbeTecnicasEnergizantes || tecnicasEnergizantes;
const _cargando = () => window.cargandoTecnicas;

function _buscarTecnica(lista, id) {
  return lista.find(item => item.id === id);
}

export function mostrarDetalleIntegracion() {
  const seleccionada = document.querySelector('input[name="tecnicaIntegracion"]:checked');
  const nombre       = document.getElementById("detalleIntegracionNombre");
  const objetivo     = document.getElementById("detalleIntegracionObjetivo");
  const instrucciones = document.getElementById("detalleIntegracionInstrucciones");

  if (!seleccionada) {
    if (nombre) nombre.value = "Información de la técnica de integración";
    if (objetivo) objetivo.value = "";
    if (instrucciones) instrucciones.value = "";
    return;
  }

  if (seleccionada.value === "personalizada") {
    if (nombre && !nombre.value) nombre.value = "Técnica personalizada";
    if (!_cargando() && typeof window.guardarTecnicasTemporal === "function") window.guardarTecnicasTemporal();
    return;
  }

  const tecnica = _buscarTecnica(_tecRH(), seleccionada.value);
  if (!tecnica) return;
  if (nombre) nombre.value = tecnica.nombre;
  if (objetivo) objetivo.value = tecnica.objetivo || "";
  if (instrucciones) instrucciones.value = tecnica.instrucciones || "";
  if (!_cargando() && typeof window.guardarTecnicasTemporal === "function") window.guardarTecnicasTemporal();
}

export function mostrarDetalleEnergizante() {
  const seleccionada  = document.querySelector('input[name="tecnicaEnergizante"]:checked');
  const nombre        = document.getElementById("detalleEnergizanteNombre");
  const objetivo      = document.getElementById("detalleEnergizanteObjetivo");
  const instrucciones = document.getElementById("detalleEnergizanteInstrucciones");

  if (!seleccionada) {
    if (nombre) nombre.value = "Información de la técnica energizante";
    if (objetivo) objetivo.value = "";
    if (instrucciones) instrucciones.value = "";
    return;
  }

  if (seleccionada.value === "personalizada") {
    if (nombre && !nombre.value) nombre.value = "Técnica personalizada";
    if (!_cargando() && typeof window.guardarTecnicasTemporal === "function") window.guardarTecnicasTemporal();
    return;
  }

  const tecnica = _buscarTecnica(_tecEN(), seleccionada.value);
  if (!tecnica) return;
  if (nombre) nombre.value = tecnica.nombre;
  if (objetivo) objetivo.value = tecnica.objetivo || "";
  if (instrucciones) instrucciones.value = tecnica.instrucciones || "";
  if (!_cargando() && typeof window.guardarTecnicasTemporal === "function") window.guardarTecnicasTemporal();
}

export function initStepDetalleTecnicas() {
  window.mostrarDetalleIntegracion = mostrarDetalleIntegracion;
  window.mostrarDetalleEnergizante = mostrarDetalleEnergizante;
}

export function getTemplate() {
  return `
      <section id="seccionEnergizante" class="wizard-section hidden">
        <p class="paso-titulo">Paso 9 de 16</p>
        <h1>Técnica Energizante</h1>

        <div class="card" style="max-width: 950px;">
          <p>
            Selecciona una técnica energizante para recuperar la atención, movimiento y participación del grupo.
          </p>

          <div id="detalleEnergizante" class="tecnica-detalle">
            <input type="text" id="detalleEnergizanteNombre" class="tecnica-nombre-editable"
              placeholder="Nombre de la técnica" />
            <div class="form-group full-width">
              <label for="detalleEnergizanteObjetivo">a) Explicará objetivo de la técnica:</label>
              <textarea spellcheck="true" lang="es" id="detalleEnergizanteObjetivo" rows="4"
                placeholder="Aquí aparecerá o podrás escribir el objetivo de la técnica energizante."></textarea>
            </div>
            <div class="form-group full-width">
              <label for="detalleEnergizanteInstrucciones">b) Dará las instrucciones de la técnica:</label>
              <textarea spellcheck="true" lang="es" id="detalleEnergizanteInstrucciones" rows="10"
                placeholder="Aquí aparecerán o podrás escribir las instrucciones de la técnica energizante."></textarea>
            </div>
          </div>

          <h3>Técnica energizante</h3>

          <div class="radio-card-group">
            <label class="radio-card"><input type="radio" name="tecnicaEnergizante" value="memorama"><div><h4>Memorama</h4></div></label>
            <label class="radio-card"><input type="radio" name="tecnicaEnergizante" value="nudo-humano"><div><h4>El Nudo Humano</h4></div></label>
            <label class="radio-card"><input type="radio" name="tecnicaEnergizante" value="zip-zap-boing"><div><h4>Zip Zap Boing</h4></div></label>
            <label class="radio-card"><input type="radio" name="tecnicaEnergizante" value="respiracion-478"><div><h4>Respiración 4-7-8</h4></div></label>
            <label class="radio-card"><input type="radio" name="tecnicaEnergizante" value="espejo"><div><h4>El Espejo</h4></div></label>
            <label class="radio-card"><input type="radio" name="tecnicaEnergizante" value="palabras-encadenadas"><div><h4>Palabras Encadenadas por Categoría</h4></div></label>
            <label class="radio-card"><input type="radio" name="tecnicaEnergizante" value="palmadas-ritmo"><div><h4>Palmadas con Ritmo (Body Percussion)</h4></div></label>
            <label class="radio-card"><input type="radio" name="tecnicaEnergizante" value="secuencia-simon"><div><h4>La Secuencia Simón</h4></div></label>
            <label class="radio-card"><input type="radio" name="tecnicaEnergizante" value="numero-prohibido"><div><h4>El Número Prohibido</h4></div></label>
            <label class="radio-card"><input type="radio" name="tecnicaEnergizante" value="caminata-intenciones"><div><h4>Caminata de Intenciones</h4></div></label>
            <label class="radio-card"><input type="radio" name="tecnicaEnergizante" value="personalizada"><div><h4>Personalizada</h4></div></label>
          </div>

          <span class="error-msg" id="err-energizante">
            Selecciona una técnica energizante y completa el objetivo e instrucciones para continuar.
          </span>

          <button class="btn-siguiente" id="btnGuardarEnergizante">
            Siguiente
          </button>
        </div>
      </section>
  `;
}
