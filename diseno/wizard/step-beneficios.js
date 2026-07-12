// ─── wizard/step-beneficios.js — Paso 3: Beneficios del Curso ────────────────

export function cargarBeneficios() {
  const raw = localStorage.getItem("ec0217_beneficios");
  const ta  = document.getElementById("beneficiosTexto");
  if (!raw || !ta) return;

  const data = JSON.parse(raw);
  ta.value = typeof data === "string" ? data : (data.lista || data.texto || "");

  if (localStorage.getItem("ec0217_beneficios_completo") === "true") {
    document.getElementById("nav-beneficios")?.classList.add("completed");
    document.getElementById("nav-temario")?.classList.remove("disabled");
  }
}

export function validarBeneficios() {
  const ta      = document.getElementById("beneficiosTexto");
  const errEl   = document.getElementById("err-beneficiosTexto");
  if (!ta) return false;

  const lineas = ta.value.trim().split(/\n+/).map(l => l.trim()).filter(Boolean);
  if (lineas.length < 3) {
    ta.classList.add("error");
    if (errEl) errEl.style.display = "block";
    return false;
  }
  ta.classList.remove("error");
  if (errEl) errEl.style.display = "none";
  return true;
}

export function guardarBeneficios() {
  const ta = document.getElementById("beneficiosTexto");
  if (!ta) return;
  localStorage.setItem("ec0217_beneficios", JSON.stringify({ lista: ta.value.trim() }));
  localStorage.setItem("ec0217_beneficios_completo", "true");
  document.getElementById("nav-beneficios")?.classList.add("completed");
  document.getElementById("nav-temario")?.classList.remove("disabled");
}

export function initStepBeneficios() {
  window.cargarBeneficios  = cargarBeneficios;
  window.validarBeneficios = validarBeneficios;
  window.guardarBeneficios = guardarBeneficios;
}

export function getTemplate() {
  return `
      <section id="seccionBeneficios" class="wizard-section hidden">
        <p class="paso-titulo">Paso 3 de 16</p>
        <h1>Beneficios del Curso</h1>

        <div class="card" style="max-width: 900px;">
          <p>
            Los beneficios describen el valor práctico que obtendrán los participantes al terminar el curso.
            Se presentan al grupo durante el encuadre para motivar su participación.
          </p>
          <p class="hint">
            💡 <strong>Ejemplo:</strong> "Aplicarás técnicas seguras de operación de montacargas que reducen el riesgo de accidentes en el almacén."
            Usa lenguaje directo y orientado a resultados concretos del trabajo diario.
          </p>

          <button class="btn-siguiente" id="btnGenerarBeneficios">
            ✨ Generar beneficios con IA
          </button>

          <div id="loaderBeneficios" style="display:none; margin-top:15px;">
            Generando beneficios...
          </div>

          <div class="form-group full-width" style="margin-top:20px;">
            <label for="beneficiosTexto">Beneficios del curso *</label>
            <textarea spellcheck="true" lang="es" id="beneficiosTexto" rows="12"
              placeholder="Aquí aparecerán los beneficios generados. También puedes escribirlos manualmente."></textarea>
            <span class="error-msg" id="err-beneficiosTexto">
              Escribe al menos 3 beneficios.
            </span>
          </div>

          <button class="btn-siguiente" id="btnGuardarBeneficios">
            Siguiente
          </button>
        </div>
      </section>
  `;
}
