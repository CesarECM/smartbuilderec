// ─── wizard/step-demostrativa.js — Paso 10: Técnica Demostrativa ─────────────

export function cargarObjetivoPsicomotrizDemostrativa() {
  const objetivos = JSON.parse(localStorage.getItem("ec0217_objetivos") || "{}");
  const el = document.getElementById("demoObjetivo");
  if (el) el.value = objetivos.psicomotriz || "";
}

export function recolectarDemostrativa() {
  const g = id => document.getElementById(id)?.value.trim() || "";
  return {
    objetivo:    g("demoObjetivo"),
    experiencia: g("demoExperiencia"),
    actividad:   g("demoActividad"),
    ejemplos:    g("demoEjemplos"),
    preguntas:   g("demoPreguntas"),
  };
}

export function guardarDemostrativaTemporal() {
  localStorage.setItem("ec0217_demostrativa", JSON.stringify(recolectarDemostrativa()));
}

export function cargarDemostrativa() {
  cargarObjetivoPsicomotrizDemostrativa();
  const raw = localStorage.getItem("ec0217_demostrativa");
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    ["experiencia","actividad","ejemplos","preguntas"].forEach(f => {
      const el = document.getElementById("demo" + f.charAt(0).toUpperCase() + f.slice(1));
      if (el && d[f] !== undefined) el.value = d[f];
    });
    if (localStorage.getItem("ec0217_demostrativa_completo") === "true") {
      document.getElementById("nav-demostrativa")?.classList.add("completed");
      document.getElementById("nav-energizante")?.classList.remove("disabled");
    }
  } catch (_) {}
}

export function validarDemostrativa() {
  const errEl = document.getElementById("err-demostrativa");
  if (errEl) errEl.style.display = "none";
  const d = recolectarDemostrativa();
  const ok = Object.values(d).every(v => v.length > 0);
  if (!ok && errEl) errEl.style.display = "block";
  return ok;
}

export function guardarDemostrativaFinal() {
  guardarDemostrativaTemporal();
  localStorage.setItem("ec0217_demostrativa_completo", "true");
  document.getElementById("nav-demostrativa")?.classList.add("completed");
  document.getElementById("nav-energizante")?.classList.remove("disabled");
}

export function initStepDemostrativa() {
  window.cargarObjetivoPsicomotrizDemostrativa = cargarObjetivoPsicomotrizDemostrativa;
  window.recolectarDemostrativa   = recolectarDemostrativa;
  window.guardarDemostrativaTemporal = guardarDemostrativaTemporal;
  window.cargarDemostrativa       = cargarDemostrativa;
  window.validarDemostrativa      = validarDemostrativa;
  window.guardarDemostrativaFinal = guardarDemostrativaFinal;
}

export function getTemplate() {
  return `
      <section id="seccionDemostrativa" class="wizard-section hidden">
        <p class="paso-titulo">Paso 11 de 16</p>
        <h1>Técnica Demostrativa</h1>
        <button type="button" id="btnGenerarTodoDemostrativa" class="btn-ia" style="margin-bottom:8px;">✨ Generar todo con IA</button>
        <p style="font-size:13px;color:#666;margin:0 0 20px;">Solo rellena los campos vacíos. Si alguno ya tiene contenido te preguntará antes de continuar.</p>

        <div class="card" style="max-width: 950px;">
          <p>
            Completa la estructura de la técnica demostrativa. Puedes generar sugerencias con IA y editarlas manualmente.
          </p>

          <h3>El instructor aplicará la técnica demostrativa:</h3>

          <div class="form-group full-width">
            <label for="demoObjetivo">
              a) Presentará objetivo de la actividad a desarrollar:
            </label>
            <textarea spellcheck="true" lang="es" id="demoObjetivo" rows="4" readonly
              placeholder="Aquí aparecerá automáticamente el objetivo psicomotriz."></textarea>
            <small>Este campo se toma del objetivo psicomotriz y no se puede editar aquí.</small>
          </div>

          <div class="form-group full-width">
            <label for="demoExperiencia">
              b) Recuperará la experiencia previa de los participantes.
            </label>
            <div class="textarea-ia-row">
              <textarea spellcheck="true" lang="es" id="demoExperiencia" rows="5"></textarea>
              <button type="button" class="btn-ia-demostrativa" data-campo="experiencia">✨ Generar con IA</button>
            </div>
          </div>

          <div class="form-group full-width">
            <label for="demoActividad">
              c) Presentará la actividad a desarrollar y mencionará el propósito de la misma.
            </label>
            <div class="textarea-ia-row">
              <textarea spellcheck="true" lang="es" id="demoActividad" rows="5"></textarea>
              <button type="button" class="btn-ia-demostrativa" data-campo="actividad">✨ Generar con IA</button>
            </div>
          </div>

          <div class="form-group full-width">
            <label for="demoEjemplos">
              h) Usará ejemplos relacionados con los temas y situaciones cotidianas.
            </label>
            <div class="textarea-ia-row">
              <textarea spellcheck="true" lang="es" id="demoEjemplos" rows="5"></textarea>
              <button type="button" class="btn-ia-demostrativa" data-campo="ejemplos">✨ Generar con IA</button>
            </div>
          </div>

          <div class="form-group full-width">
            <label for="demoPreguntas">
              i) Preguntará por los conocimientos adquiridos y la utilidad de lo aprendido en su actividad.
            </label>
            <div class="textarea-ia-row">
              <textarea spellcheck="true" lang="es" id="demoPreguntas" rows="5"></textarea>
              <button type="button" class="btn-ia-demostrativa" data-campo="preguntas">✨ Generar con IA</button>
            </div>
          </div>

          <span class="error-msg" id="err-demostrativa">
            Completa todos los apartados de la técnica demostrativa para continuar.
          </span>

          <button class="btn-siguiente" id="btnGuardarDemostrativa">
            Siguiente
          </button>
        </div>
      </section>
  `;
}
