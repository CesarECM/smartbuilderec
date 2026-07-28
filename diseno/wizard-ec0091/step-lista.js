// ─── wizard-ec0091/step-lista.js — Paso 8: Lista de verificación ─────────────

export function cargarLista91() {
  const raw = localStorage.getItem("ec0091_lista");
  if (!raw) return;
  const d = JSON.parse(raw);
  const textEl = document.getElementById("lista91Preguntas");
  if (textEl && d.preguntas) textEl.value = d.preguntas;
}

export function guardarLista91() {
  const datos = {
    preguntas: document.getElementById("lista91Preguntas")?.value.trim() || "",
  };
  localStorage.setItem("ec0091_lista", JSON.stringify(datos));
  localStorage.setItem("ec0091_lista_completo", "true");
  document.getElementById("nav91-lista")?.classList.add("completed");
  document.getElementById("nav91-ejecucion")?.classList.remove("disabled");
  window.ec0091Sync?.schedule();
}

export function initStepLista91() {
  window.cargarLista91  = cargarLista91;
  window.guardarLista91 = guardarLista91;
}

export function getTemplate() {
  return `
  <section id="sec91Lista" class="wizard-section hidden">
    <p class="paso-titulo">Paso 8 de 13</p>
    <h1>Lista de Verificación</h1>
    <div class="card" style="max-width:800px;">
      <p style="color:#555;font-size:14px;">Elabora las preguntas o criterios de verificación para cada línea. La IA generará preguntas que inducen la evaluación de <em>"detalles y aspectos críticos"</em> según el criterio literal del EC0091.</p>

      <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
        <button type="button" id="btn91GenLista" class="btn-ia">✨ Generar preguntas con IA</button>
        <button type="button" id="btn91RevLista" class="btn-ia">🔍 Revisar calidad con IA</button>
      </div>
      <div id="loader91Lista" style="display:none;font-size:13px;color:#1a4a6b;font-style:italic;">Generando lista de verificación...</div>

      <div class="form-group">
        <label for="lista91Preguntas">Preguntas / criterios de verificación *</label>
        <textarea id="lista91Preguntas" rows="18"
          placeholder="Formato sugerido por línea:&#10;&#10;LÍNEA DE PROCESO:&#10;1. ¿El CE cuenta con un procedimiento documentado para la aplicación de instrumentos?&#10;2. ¿El evaluador sigue los pasos establecidos en el manual de evaluación?&#10;...&#10;&#10;LÍNEA DE PRODUCTO:&#10;1. ¿Los instrumentos de evaluación están validados y actualizados?&#10;..."
          spellcheck="true" lang="es"></textarea>
      </div>

      <div id="revision91Lista" class="revision-resultado" style="display:none;margin-bottom:12px;"></div>

      <button class="btn-siguiente" id="btn91SigLista">Siguiente →</button>
    </div>
  </section>`;
}
