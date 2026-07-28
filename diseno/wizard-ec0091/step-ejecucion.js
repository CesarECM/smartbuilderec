// ─── wizard-ec0091/step-ejecucion.js — Paso 9: Registro de campo ─────────────

export function cargarEjecucion91() {
  const raw = localStorage.getItem("ec0091_ejecucion");
  if (!raw) return;
  const d = JSON.parse(raw);
  const textEl = document.getElementById("ejec91Registro");
  if (textEl && d.registro) textEl.value = d.registro;
  const clasEl = document.getElementById("ejec91Clasificacion");
  if (clasEl && d.clasificacion) clasEl.value = d.clasificacion;
}

export function guardarEjecucion91() {
  const datos = {
    registro:       document.getElementById("ejec91Registro")?.value.trim()       || "",
    clasificacion:  document.getElementById("ejec91Clasificacion")?.value.trim()  || "",
  };
  localStorage.setItem("ec0091_ejecucion", JSON.stringify(datos));
  localStorage.setItem("ec0091_ejecucion_completo", "true");
  document.getElementById("nav91-ejecucion")?.classList.add("completed");
  document.getElementById("nav91-hallazgos")?.classList.remove("disabled");
  window.ec0091Sync?.schedule();
}

export function initStepEjecucion91() {
  window.cargarEjecucion91  = cargarEjecucion91;
  window.guardarEjecucion91 = guardarEjecucion91;
}

export function getTemplate() {
  return `
  <section id="sec91Ejecucion" class="wizard-section hidden">
    <p class="paso-titulo">Paso 9 de 13</p>
    <h1>Registro de Cumplimientos en Campo</h1>
    <div class="card" style="max-width:800px;">
      <p style="color:#555;font-size:14px;">Registra los resultados observados en campo: qué cumplió y qué no cumplió el CE/EI para cada criterio de la lista de verificación.</p>

      <div class="form-group">
        <label for="ejec91Registro">Registro de observaciones en campo *</label>
        <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
          <button type="button" id="btn91RevEjecucion" class="btn-ia">🔍 Revisar con IA</button>
        </div>
        <div id="loader91Ejec" style="display:none;font-size:13px;color:#1a4a6b;font-style:italic;">Revisando...</div>
        <textarea id="ejec91Registro" rows="12"
          placeholder="Por cada criterio de la lista, registra:&#10;✅ CUMPLE: [descripción de lo observado]&#10;❌ NO CUMPLE: [descripción del incumplimiento]&#10;⚠️ CUMPLE PARCIALMENTE: [descripción]..."
          spellcheck="true" lang="es"></textarea>
      </div>

      <div class="form-group" style="margin-top:16px;">
        <label for="ejec91Clasificacion">Clasificación de incumplimientos por tipo</label>
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <button type="button" id="btn91ClasEjecucion" class="btn-ia">🗂️ Clasificar con IA</button>
        </div>
        <textarea id="ejec91Clasificacion" rows="6"
          placeholder="Clasifica los incumplimientos en:&#10;• Incumplimientos críticos (afectan la validez de evaluaciones)&#10;• Incumplimientos menores (afectan procesos pero no invalidez)&#10;• Observaciones de mejora..."
          spellcheck="true" lang="es"></textarea>
      </div>

      <div id="revision91Ejecucion" class="revision-resultado" style="display:none;margin-bottom:12px;"></div>

      <button class="btn-siguiente" id="btn91SigEjecucion">Siguiente →</button>
    </div>
  </section>`;
}
