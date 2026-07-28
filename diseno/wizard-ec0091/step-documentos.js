// ─── wizard-ec0091/step-documentos.js — Paso 6: Documentos de soporte ────────

export function cargarDocumentos91() {
  const raw = localStorage.getItem("ec0091_documentos");
  if (!raw) return;
  const d = JSON.parse(raw);
  const textEl = document.getElementById("docs91Lista");
  if (textEl && d.lista) textEl.value = d.lista;
}

export function guardarDocumentos91() {
  const datos = {
    lista: document.getElementById("docs91Lista")?.value.trim() || "",
  };
  localStorage.setItem("ec0091_documentos", JSON.stringify(datos));
  localStorage.setItem("ec0091_documentos_completo", "true");
  document.getElementById("nav91-documentos")?.classList.add("completed");
  document.getElementById("nav91-cronograma")?.classList.remove("disabled");
  window.ec0091Sync?.schedule();
}

export function initStepDocumentos91() {
  window.cargarDocumentos91  = cargarDocumentos91;
  window.guardarDocumentos91 = guardarDocumentos91;
}

export function getTemplate() {
  return `
  <section id="sec91Documentos" class="wizard-section hidden">
    <p class="paso-titulo">Paso 6 de 13</p>
    <h1>Documentos de Soporte Requeridos</h1>
    <div class="card" style="max-width:800px;">
      <p style="color:#555;font-size:14px;">Lista los documentos que debe presentar el CE/EI durante la verificación para cada línea seleccionada.</p>

      <div class="form-group">
        <label for="docs91Lista">Lista de documentos requeridos *</label>
        <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
          <button type="button" id="btn91GenDocumentos" class="btn-ia">✨ Sugerir con IA</button>
          <button type="button" id="btn91RevDocumentos" class="btn-ia">🔍 Revisar completitud</button>
        </div>
        <div id="loader91Docs" style="display:none;font-size:13px;color:#1a4a6b;font-style:italic;">Generando sugerencias...</div>
        <textarea id="docs91Lista" rows="12"
          placeholder="Ejemplo:&#10;• Manual de Operaciones del CE&#10;• Registro de Evaluadores acreditados&#10;• Instrumentos de evaluación por EC&#10;• Expedientes de candidatos evaluados&#10;• Bitácora de evaluaciones&#10;• Cartas de acreditación vigentes..."
          spellcheck="true" lang="es"></textarea>
      </div>

      <div id="revision91Documentos" class="revision-resultado" style="display:none;margin-bottom:12px;"></div>

      <button class="btn-siguiente" id="btn91SigDocumentos">Siguiente →</button>
    </div>
  </section>`;
}
