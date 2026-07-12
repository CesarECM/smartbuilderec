// ─── wizard/step-dialogo.js — Paso 12: Técnica Diálogo/Discusión ─────────────

export function cargarObjetivoAfectivoDialogo() {
  const objetivos = JSON.parse(localStorage.getItem("ec0217_objetivos") || "{}");
  const el = document.getElementById("dialogoObjetivo");
  if (el) el.value = objetivos.afectiva || "";
}

export function recolectarDialogo() {
  const g = id => document.getElementById(id)?.value.trim() || "";
  return {
    objetivo:      g("dialogoObjetivo"),
    actividad:     g("dialogoActividad"),
    instrucciones: g("dialogoInstrucciones"),
    ejemplos:      g("dialogoEjemplos"),
    conclusion:    g("dialogoConclusion"),
  };
}

export function guardarDialogoTemporal() {
  localStorage.setItem("ec0217_dialogo", JSON.stringify(recolectarDialogo()));
}

export function cargarDialogo() {
  cargarObjetivoAfectivoDialogo();
  const raw = localStorage.getItem("ec0217_dialogo");
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    ["actividad","instrucciones","ejemplos","conclusion"].forEach(f => {
      const el = document.getElementById("dialogo" + f.charAt(0).toUpperCase() + f.slice(1));
      if (el && d[f] !== undefined) el.value = d[f];
    });
    if (localStorage.getItem("ec0217_dialogo_completo") === "true") {
      document.getElementById("nav-dialogo")?.classList.add("completed");
      document.getElementById("nav-cierre")?.classList.remove("disabled");
    }
  } catch (_) {}
}

export function validarDialogo() {
  const errEl = document.getElementById("err-dialogo");
  if (errEl) errEl.style.display = "none";
  const d = recolectarDialogo();
  const ok = Object.values(d).every(v => v.length > 0);
  if (!ok && errEl) errEl.style.display = "block";
  return ok;
}

export function guardarDialogoFinal() {
  guardarDialogoTemporal();
  localStorage.setItem("ec0217_dialogo_completo", "true");
  document.getElementById("nav-dialogo")?.classList.add("completed");
  document.getElementById("nav-cierre")?.classList.remove("disabled");
}

export function initStepDialogo() {
  window.cargarObjetivoAfectivoDialogo = cargarObjetivoAfectivoDialogo;
  window.recolectarDialogo   = recolectarDialogo;
  window.guardarDialogoTemporal = guardarDialogoTemporal;
  window.cargarDialogo       = cargarDialogo;
  window.validarDialogo      = validarDialogo;
  window.guardarDialogoFinal = guardarDialogoFinal;
}

export function getTemplate() {
  return `
      <section id="seccionDialogo" class="wizard-section hidden">
        <p class="paso-titulo">Paso 12 de 16</p>
        <h1>Técnica Diálogo/Discusión</h1>
        <button type="button" id="btnGenerarTodoDialogo" class="btn-ia" style="margin-bottom:8px;">✨ Generar todo con IA</button>
        <p style="font-size:13px;color:#666;margin:0 0 20px;">Solo rellena los campos vacíos. Si alguno ya tiene contenido te preguntará antes de continuar.</p>

        <div class="card" style="max-width: 950px;">
          <p>
            Completa la estructura de la técnica diálogo/discusión. Puedes generar sugerencias con IA y editarlas manualmente.
          </p>

          <h3>El instructor aplicará la técnica diálogo/discusión:</h3>

          <div class="form-group full-width">
            <label for="dialogoObjetivo">
              a) Mencionará el objetivo de la técnica.
            </label>
            <textarea spellcheck="true" lang="es" id="dialogoObjetivo" rows="4" readonly
              placeholder="Aquí aparecerá automáticamente el objetivo afectivo."></textarea>
            <small>Este campo se toma del objetivo afectivo y no se puede editar aquí.</small>
          </div>

          <div class="form-group full-width">
            <label for="dialogoActividad">
              b) Presentará la actividad a desarrollar.
            </label>
            <div class="textarea-ia-row">
              <textarea spellcheck="true" lang="es" id="dialogoActividad" rows="5" placeholder="Redactar beneficio/propósito."></textarea>
              <button type="button" class="btn-ia-dialogo" data-campo="actividad">✨ Generar con IA</button>
            </div>
          </div>

          <div class="form-group full-width">
            <label for="dialogoInstrucciones">
              d) Indicará las instrucciones de la actividad.
            </label>
            <div class="textarea-ia-row">
              <textarea spellcheck="true" lang="es" id="dialogoInstrucciones" rows="6" placeholder="Redactar las instrucciones."></textarea>
              <button type="button" class="btn-ia-dialogo" data-campo="instrucciones">✨ Generar con IA</button>
            </div>
          </div>

          <div class="form-group full-width">
            <label for="dialogoEjemplos">
              h) Utilizará ejemplos relacionados con los temas y las situaciones cotidianas.
            </label>
            <div class="textarea-ia-row">
              <textarea spellcheck="true" lang="es" id="dialogoEjemplos" rows="5" placeholder="Redactar aquí 2 ejemplos relacionados con las situaciones cotidianas."></textarea>
              <button type="button" class="btn-ia-dialogo" data-campo="ejemplos">✨ Generar con IA</button>
            </div>
          </div>

          <div class="form-group full-width">
            <label for="dialogoConclusion">
              i) Desarrollará junto con el grupo las conclusiones acerca del tema discutido y su utilidad.
            </label>
            <div class="textarea-ia-row">
              <textarea spellcheck="true" lang="es" id="dialogoConclusion" rows="5" placeholder="Redactar una breve conclusión del tema."></textarea>
              <button type="button" class="btn-ia-dialogo" data-campo="conclusion">✨ Generar con IA</button>
            </div>
          </div>

          <span class="error-msg" id="err-dialogo">
            Completa todos los apartados de la técnica diálogo/discusión para continuar.
          </span>

          <button class="btn-siguiente" id="btnGuardarDialogo">
            Siguiente
          </button>
        </div>
      </section>
  `;
}
