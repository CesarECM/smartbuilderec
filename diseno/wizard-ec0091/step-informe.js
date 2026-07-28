// ─── wizard-ec0091/step-informe.js — Paso 11: Informe de verificación ────────

export function cargarInforme91() {
  const raw = localStorage.getItem("ec0091_informe");
  if (!raw) return;
  const d = JSON.parse(raw);
  ["inf91Resumen", "inf91Conclusiones", "inf91ResultadoFinal"].forEach(id => {
    const el = document.getElementById(id);
    if (el && d[id] !== undefined) el.value = d[id];
  });
  const selectEl = document.getElementById("inf91Dictamen");
  if (selectEl && d.inf91Dictamen) selectEl.value = d.inf91Dictamen;
}

export function guardarInforme91() {
  const datos = {
    inf91Resumen:       document.getElementById("inf91Resumen")?.value.trim()       || "",
    inf91Conclusiones:  document.getElementById("inf91Conclusiones")?.value.trim()  || "",
    inf91ResultadoFinal:document.getElementById("inf91ResultadoFinal")?.value.trim()|| "",
    inf91Dictamen:      document.getElementById("inf91Dictamen")?.value             || "pendiente",
  };
  localStorage.setItem("ec0091_informe", JSON.stringify(datos));
  localStorage.setItem("ec0091_informe_completo", "true");
  document.getElementById("nav91-informe")?.classList.add("completed");
  document.getElementById("nav91-cierre")?.classList.remove("disabled");
  window.ec0091Sync?.schedule();
}

export function initStepInforme91() {
  window.cargarInforme91  = cargarInforme91;
  window.guardarInforme91 = guardarInforme91;
}

export function getTemplate() {
  return `
  <section id="sec91Informe" class="wizard-section hidden">
    <p class="paso-titulo">Paso 11 de 13</p>
    <h1>Informe de Verificación Externa</h1>
    <div class="card" style="max-width:800px;">
      <p style="color:#555;font-size:14px;">Redacta el informe oficial. El EC0091 requiere: resumen ejecutivo, hallazgos, conclusiones, resultado final y dictamen.</p>

      <div class="form-group">
        <label for="inf91Resumen">Resumen ejecutivo *</label>
        <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
          <button type="button" id="btn91GenInforme" class="btn-ia">✨ Generar con IA</button>
          <button type="button" id="btn91RevInforme" class="btn-ia">🔍 Revisar 6 elementos</button>
        </div>
        <div id="loader91Informe" style="display:none;font-size:13px;color:#1a4a6b;font-style:italic;">Generando resumen...</div>
        <textarea id="inf91Resumen" rows="7" spellcheck="true" lang="es"
          placeholder="Describe el contexto de la verificación, las áreas revisadas, el número de hallazgos encontrados y el estado general de cumplimiento del CE/EI..."></textarea>
      </div>

      <div class="form-group" style="margin-top:16px;">
        <label for="inf91Conclusiones">Conclusiones *</label>
        <textarea id="inf91Conclusiones" rows="5" spellcheck="true" lang="es"
          placeholder="Con base en los hallazgos, describe las conclusiones generales sobre el desempeño del CE/EI..."></textarea>
      </div>

      <div class="form-group" style="margin-top:16px;">
        <label for="inf91ResultadoFinal">Resultado cuantitativo final</label>
        <textarea id="inf91ResultadoFinal" rows="3" spellcheck="true" lang="es"
          placeholder="Ej. Total de criterios verificados: 45. Cumplidos: 38 (84%). No cumplidos: 7 (16%). Observaciones: 3."></textarea>
      </div>

      <div class="form-group" style="margin-top:16px;">
        <label for="inf91Dictamen">Dictamen de la verificación *</label>
        <select id="inf91Dictamen">
          <option value="pendiente">Pendiente de dictamen</option>
          <option value="aprobado">Aprobado — cumple requisitos</option>
          <option value="condicionado">Condicionado — requiere acciones correctivas</option>
          <option value="no_aprobado">No aprobado — incumplimientos críticos</option>
        </select>
      </div>

      <div id="revision91Informe" class="revision-resultado" style="display:none;margin-bottom:12px;"></div>

      <button class="btn-siguiente" id="btn91SigInforme">Siguiente →</button>
    </div>
  </section>`;
}
