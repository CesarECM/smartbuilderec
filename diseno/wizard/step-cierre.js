// ─── wizard/step-cierre.js — Paso 13: Cierre del Curso ───────────────────────

export function recolectarCierre() {
  const g = id => document.getElementById(id)?.value.trim() || "";
  const resumenVal = g("cierreResumen") || localStorage.getItem("ec0217_cierre_resumen") || "";
  return {
    texto:              g("cierreTexto"),
    resumen:            resumenVal,
    sugerencias:        g("sugerenciasContinuidad"),
    referencias:        g("referenciasBibliograficas"),
    compromisos:        g("compromisosTexto"),
    descripcionGeneral: g("descripcionGeneralEvaluacion"),
  };
}

export function guardarCierreTemporal() {
  localStorage.setItem("ec0217_cierre", JSON.stringify(recolectarCierre()));
}

export function cargarCierre() {
  const raw = localStorage.getItem("ec0217_cierre");
  if (raw) {
    try {
      const d = JSON.parse(raw);
      const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
      set("cierreTexto",              d.texto);
      set("descripcionGeneralEvaluacion", d.descripcionGeneral);
      set("sugerenciasContinuidad",   d.sugerencias);
      set("referenciasBibliograficas",d.referencias);
      set("compromisosTexto",         d.compromisos);

      const resumen = d.resumen || localStorage.getItem("ec0217_cierre_resumen") || "";
      if (resumen) {
        localStorage.setItem("ec0217_cierre_resumen", resumen);
        set("cierreResumen", resumen);
      }
    } catch (_) {}
  }
  if (localStorage.getItem("ec0217_cierre_completo") === "true") {
    document.getElementById("nav-cierre")?.classList.add("completed");
    document.getElementById("nav-evaluaciones")?.classList.remove("disabled");
  }
}

export function validarCierre() {
  const errEl = document.getElementById("err-cierre");
  if (errEl) errEl.style.display = "none";
  const d = recolectarCierre();
  if (!d.texto) {
    if (errEl) errEl.style.display = "block";
    return false;
  }
  return true;
}

export function guardarCierreFinal() {
  guardarCierreTemporal();
  localStorage.setItem("ec0217_cierre_completo", "true");
  document.getElementById("nav-cierre")?.classList.add("completed");
  document.getElementById("nav-evaluaciones")?.classList.remove("disabled");
}

export function initStepCierre() {
  window.recolectarCierre    = recolectarCierre;
  window.guardarCierreTemporal = guardarCierreTemporal;
  window.cargarCierre        = cargarCierre;
  window.validarCierre       = validarCierre;
  window.guardarCierreFinal  = guardarCierreFinal;
}

export function getTemplate() {
  return `
      <section id="seccionCierre" class="wizard-section hidden">
        <p class="paso-titulo">Paso 13 de 16</p>
        <h1>Cierre</h1>

        <div class="card" style="max-width: 950px;">
          <p>
            El cierre es la etapa final del curso donde el instructor refuerza lo aprendido,
            motiva a los participantes a aplicar sus nuevos conocimientos y concluye la sesión.
          </p>
          <p class="hint">
            💡 Primero genera o escribe el <strong>texto de cierre</strong> (la conclusión que leerás al grupo),
            luego el sistema generará automáticamente el <strong>resumen</strong> para el documento de planeación.
            Puedes editar ambos textos antes de continuar.
          </p>

          <div class="form-group full-width">
            <label for="cierreResumen">Resumen</label>
            <button type="button" id="btnGenerarResumen" class="btn-siguiente">
              ✨ Generar resumen con IA
            </button>
            <div id="loaderResumen" style="display:none; margin-top:15px;">Generando resumen...</div>
            <textarea spellcheck="true" lang="es" id="cierreResumen" rows="8"
              placeholder="Aquí aparecerá el resumen generado con IA. También puedes escribirlo manualmente."></textarea>
          </div>

          <hr>

          <div class="form-group full-width">
            <label for="sugerenciasContinuidad">Sugerencias de continuidad de aprendizaje</label>
            <textarea spellcheck="true" lang="es" id="sugerenciasContinuidad" rows="6"
              placeholder="Escribe las sugerencias de continuidad de aprendizaje que se darán a los participantes."></textarea>
          </div>

          <hr>

          <div class="form-group full-width">
            <label for="referenciasBibliograficas">Referencias bibliográficas</label>
            <textarea spellcheck="true" lang="es" id="referenciasBibliograficas" rows="6"
              placeholder="Enlista las referencias bibliográficas, fuentes de consulta o materiales recomendados."></textarea>
          </div>

          <hr>

          <div class="form-group full-width">
            <label for="compromisosTexto">Compromisos de aplicación del aprendizaje</label>
            <button type="button" id="btnGenerarCompromisos" class="btn-siguiente">
              ✨ Generar compromisos con IA
            </button>
            <div id="loaderCompromisos" style="display:none; margin-top:15px;">Generando compromisos...</div>
            <textarea spellcheck="true" lang="es" id="compromisosTexto" rows="8"
              placeholder="Aquí aparecerán los compromisos generados con IA. También puedes escribirlos manualmente."></textarea>
          </div>

          <hr>

          <div class="form-group full-width">
            <label for="cierreTexto">Cierre</label>
            <button type="button" id="btnGenerarCierre" class="btn-siguiente">
              ✨ Generar cierre con IA
            </button>
            <div id="loaderCierre" style="display:none; margin-top:15px;">Generando cierre...</div>
            <textarea spellcheck="true" lang="es" id="cierreTexto" rows="10"
              placeholder="Aquí aparecerá el cierre generado con IA. También puedes escribirlo manualmente."></textarea>
          </div>

          <hr>

          <h3>Descripción general</h3>
          <button type="button" id="btnGenerarDescripcionGeneral" class="btn-siguiente" disabled>
            Crear descripción general
          </button>
          <div id="loaderDescripcionGeneral" style="display:none; margin-top:15px;">
            Creando descripción general...
          </div>
          <div class="form-group full-width" style="margin-top:20px;">
            <label for="descripcionGeneralEvaluacion">Descripción general</label>
            <textarea spellcheck="true" lang="es" id="descripcionGeneralEvaluacion" rows="8"
              placeholder="Aquí aparecerá la descripción general."></textarea>
          </div>

          <span class="error-msg" id="err-cierre">
            Escribe o genera el cierre para continuar.
          </span>

          <button class="btn-siguiente" id="btnGuardarCierre">
            Siguiente
          </button>
        </div>
      </section>
  `;
}
