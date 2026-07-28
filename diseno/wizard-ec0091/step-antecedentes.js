// ─── wizard-ec0091/step-antecedentes.js — Paso 3: Antecedentes ───────────────

export function cargarAntecedentes91() {
  const raw = localStorage.getItem("ec0091_antecedentes");
  if (!raw) return;
  const d = JSON.parse(raw);
  const fields = ["ant91Previas", "ant91AccCorrectivas", "ant91Observaciones"];
  fields.forEach(id => { const el = document.getElementById(id); if (el && d[id] !== undefined) el.value = d[id]; });
  if (d.ant91TieneAntecedentes !== undefined) {
    const sel = document.getElementById("ant91TieneAnt");
    if (sel) sel.value = d.ant91TieneAntecedentes;
    _toggleAntecedentes(d.ant91TieneAntecedentes === "si");
  }
}

export function guardarAntecedentes91() {
  const datos = {
    ant91TieneAntecedentes: document.getElementById("ant91TieneAnt")?.value || "no",
    ant91Previas:           document.getElementById("ant91Previas")?.value.trim() || "",
    ant91AccCorrectivas:    document.getElementById("ant91AccCorrectivas")?.value.trim() || "",
    ant91Observaciones:     document.getElementById("ant91Observaciones")?.value.trim() || "",
  };
  localStorage.setItem("ec0091_antecedentes", JSON.stringify(datos));
  localStorage.setItem("ec0091_antecedentes_completo", "true");
  document.getElementById("nav91-antecedentes")?.classList.add("completed");
  document.getElementById("nav91-lineas")?.classList.remove("disabled");
  window.ec0091Sync?.schedule();
}

function _toggleAntecedentes(tiene) {
  const detalle = document.getElementById("ant91Detalle");
  if (detalle) detalle.style.display = tiene ? "block" : "none";
}

export function initStepAntecedentes91() {
  window.cargarAntecedentes91  = cargarAntecedentes91;
  window.guardarAntecedentes91 = guardarAntecedentes91;

  document.getElementById("ant91TieneAnt")?.addEventListener("change", e => {
    _toggleAntecedentes(e.target.value === "si");
  });
}

export function getTemplate() {
  return `
  <section id="sec91Antecedentes" class="wizard-section hidden">
    <p class="paso-titulo">Paso 3 de 13</p>
    <h1>Antecedentes de Verificación</h1>
    <div class="card" style="max-width:800px;">
      <p style="color:#555;font-size:14px;">Registra si el CE/EI ha sido verificado anteriormente y las acciones correctivas que se tomaron.</p>

      <div class="form-group">
        <label for="ant91TieneAnt">¿Existen verificaciones previas de esta entidad? *</label>
        <select id="ant91TieneAnt">
          <option value="no">No — primera verificación</option>
          <option value="si">Sí — existen verificaciones anteriores</option>
        </select>
      </div>

      <div id="ant91Detalle" style="display:none;">
        <div class="form-group">
          <label for="ant91Previas">Descripción de verificaciones previas</label>
          <div style="display:flex;gap:8px;margin-bottom:8px;">
            <button type="button" id="btn91RevAntecedentes" class="btn-ia">🔍 Revisar con IA</button>
          </div>
          <textarea id="ant91Previas" rows="4" placeholder="Describe las verificaciones anteriores: fechas, resultados, organismo que verificó..."></textarea>
        </div>
        <div class="form-group">
          <label for="ant91AccCorrectivas">Acciones correctivas implementadas</label>
          <textarea id="ant91AccCorrectivas" rows="4" placeholder="Describe las acciones correctivas que el CE/EI implementó tras las verificaciones anteriores..."></textarea>
        </div>
      </div>

      <div class="form-group">
        <label for="ant91Observaciones">Observaciones adicionales (opcional)</label>
        <textarea id="ant91Observaciones" rows="3" placeholder="Cualquier contexto adicional relevante para esta verificación..."></textarea>
      </div>

      <div id="revision91Antecedentes" class="revision-resultado" style="display:none;margin-bottom:12px;"></div>

      <button class="btn-siguiente" id="btn91SigAntecedentes">Siguiente →</button>
    </div>
  </section>`;
}
