// ─── wizard/step-expositiva.js — Paso 9: Técnica Expositiva ──────────────────

const CAMPOS_EXP = ["introduccion","experiencia","desarrollo","ejemplos","sintesis","preguntas","utilidad"];

export function cargarObjetivoCognitivoExpositiva() {
  const objetivos = JSON.parse(localStorage.getItem("ec0217_objetivos") || "{}");
  const el = document.getElementById("expObjetivo");
  if (el) el.value = objetivos.cognitiva || "";
}

export function recolectarExpositiva() {
  const g = id => document.getElementById(id)?.value.trim() || "";
  return {
    objetivo:      g("expObjetivo"),
    introduccion:  g("expIntroduccion"),
    experiencia:   g("expExperiencia"),
    desarrollo:    g("expDesarrollo"),
    ejemplos:      g("expEjemplos"),
    sintesis:      g("expSintesis"),
    preguntas:     g("expPreguntas"),
    utilidad:      g("expUtilidad"),
  };
}

export function guardarExpositivaTemporal() {
  localStorage.setItem("ec0217_expositiva", JSON.stringify(recolectarExpositiva()));
}

export function cargarExpositiva() {
  cargarObjetivoCognitivoExpositiva();
  const raw = localStorage.getItem("ec0217_expositiva");
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    CAMPOS_EXP.forEach(f => {
      const el = document.getElementById("exp" + f.charAt(0).toUpperCase() + f.slice(1));
      if (el && d[f] !== undefined) el.value = d[f];
    });
    if (localStorage.getItem("ec0217_expositiva_completo") === "true") {
      document.getElementById("nav-expositiva")?.classList.add("completed");
      document.getElementById("nav-demostrativa")?.classList.remove("disabled");
    }
  } catch (_) {}
}

export function validarExpositiva() {
  const errEl = document.getElementById("err-expositiva");
  if (errEl) errEl.style.display = "none";
  const d = recolectarExpositiva();
  const ok = Object.values(d).every(v => v.length > 0);
  if (!ok && errEl) errEl.style.display = "block";
  return ok;
}

export function guardarExpositivaFinal() {
  guardarExpositivaTemporal();
  localStorage.setItem("ec0217_expositiva_completo", "true");
  document.getElementById("nav-expositiva")?.classList.add("completed");
  document.getElementById("nav-demostrativa")?.classList.remove("disabled");
}

export function initStepExpositiva() {
  window.cargarObjetivoCognitivoExpositiva = cargarObjetivoCognitivoExpositiva;
  window.recolectarExpositiva  = recolectarExpositiva;
  window.guardarExpositivaTemporal = guardarExpositivaTemporal;
  window.cargarExpositiva      = cargarExpositiva;
  window.validarExpositiva     = validarExpositiva;
  window.guardarExpositivaFinal = guardarExpositivaFinal;
}

export function getTemplate() {
  return `
      <section id="seccionExpositiva" class="wizard-section hidden">
        <p class="paso-titulo">Paso 10 de 16</p>
        <h1>Técnica Expositiva</h1>
        <button type="button" id="btnGenerarTodoExpositiva" class="btn-ia" style="margin-bottom:8px;">✨ Generar todo con IA</button>
        <p style="font-size:13px;color:#666;margin:0 0 20px;">Solo rellena los campos vacíos. Si alguno ya tiene contenido te preguntará antes de continuar.</p>

        <div class="card" style="max-width: 950px;">
          <p>
            Completa la estructura de la técnica expositiva. Puedes generar sugerencias con IA y editarlas manualmente.
          </p>

          <h3>El instructor aplicará la técnica expositiva:</h3>

          <div class="form-group full-width">
            <label for="expObjetivo">a) Presentará el objetivo del tema:</label>
            <textarea spellcheck="true" lang="es" id="expObjetivo" rows="4" readonly
              placeholder="Aquí aparecerá automáticamente el objetivo cognitivo."></textarea>
            <small>Este campo se toma del objetivo cognitivo y no se puede editar aquí.</small>
          </div>

          <div class="form-group full-width">
            <label for="expIntroduccion">b) Realizará una introducción general al contenido temático.</label>
            <div class="textarea-ia-row">
              <textarea spellcheck="true" lang="es" id="expIntroduccion" rows="5"></textarea>
              <button type="button" class="btn-ia-expositiva" data-campo="introduccion">✨ Generar con IA</button>
            </div>
          </div>

          <div class="form-group full-width">
            <label for="expExperiencia">c) Recuperará la experiencia previa de los participantes, preguntando sobre sus conocimientos previos del contenido temático:</label>
            <div class="textarea-ia-row">
              <textarea spellcheck="true" lang="es" id="expExperiencia" rows="5"></textarea>
              <button type="button" class="btn-ia-expositiva" data-campo="experiencia">✨ Generar con IA</button>
            </div>
          </div>

          <div class="form-group full-width">
            <label for="expDesarrollo">d) Desarrollará el contenido.</label>
            <div class="textarea-ia-row">
              <textarea spellcheck="true" lang="es" id="expDesarrollo" rows="6"></textarea>
              <button type="button" class="btn-ia-expositiva" data-campo="desarrollo">✨ Generar con IA</button>
            </div>
          </div>

          <div class="form-group full-width">
            <label for="expEjemplos">e) Utilizará ejemplos relacionados con los temas y las situaciones cotidianas.</label>
            <div class="textarea-ia-row">
              <textarea spellcheck="true" lang="es" id="expEjemplos" rows="5"></textarea>
              <button type="button" class="btn-ia-expositiva" data-campo="ejemplos">✨ Generar con IA</button>
            </div>
          </div>

          <div class="form-group full-width">
            <label for="expSintesis">f) Realizará la síntesis haciendo énfasis en los aspectos sobresalientes, invitando a los participantes a participar.</label>
            <div class="textarea-ia-row">
              <textarea spellcheck="true" lang="es" id="expSintesis" rows="5"></textarea>
              <button type="button" class="btn-ia-expositiva" data-campo="sintesis">✨ Generar con IA</button>
            </div>
          </div>

          <div class="form-group full-width">
            <label for="expPreguntas">g) Planteará preguntas dirigidas que verifiquen la comprensión del tema.</label>
            <div class="textarea-ia-row">
              <textarea spellcheck="true" lang="es" id="expPreguntas" rows="5"></textarea>
              <button type="button" class="btn-ia-expositiva" data-campo="preguntas">✨ Generar con IA</button>
            </div>
          </div>

          <div class="form-group full-width">
            <label for="expUtilidad">h) Promoverá comentarios sobre la utilidad y aplicación de los temas en su vida profesional y personal.</label>
            <div class="textarea-ia-row">
              <textarea spellcheck="true" lang="es" id="expUtilidad" rows="5"></textarea>
              <button type="button" class="btn-ia-expositiva" data-campo="utilidad">✨ Generar con IA</button>
            </div>
          </div>

          <span class="error-msg" id="err-expositiva">
            Completa todos los apartados de la técnica expositiva para continuar.
          </span>

          <button class="btn-siguiente" id="btnGuardarExpositiva">
            Siguiente
          </button>
        </div>
      </section>
  `;
}
