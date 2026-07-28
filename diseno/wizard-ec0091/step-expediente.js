// ─── wizard-ec0091/step-expediente.js — Paso 13: Expediente final / ZIP ──────

export function cargarExpediente91() {
  const raw = localStorage.getItem("ec0091_expediente");
  if (!raw) return;
  const d = JSON.parse(raw);
  const notasEl = document.getElementById("exp91Notas");
  if (notasEl && d.notas) notasEl.value = d.notas;
}

export function guardarExpediente91() {
  const datos = {
    notas:   document.getElementById("exp91Notas")?.value.trim() || "",
    revisado: true,
  };
  localStorage.setItem("ec0091_expediente", JSON.stringify(datos));
  window.ec0091Sync?.schedule();
}

export function initStepExpediente91() {
  window.cargarExpediente91  = cargarExpediente91;
  window.guardarExpediente91 = guardarExpediente91;
}

export function getTemplate() {
  return `
  <section id="sec91Expediente" class="wizard-section hidden">
    <p class="paso-titulo">Paso 13 de 13</p>
    <h1>Expediente Final — Revisión y Descarga</h1>
    <div class="card" style="max-width:860px;">

      <div class="card" style="background:#eff6ff;border:2px solid #1a4a6b;margin-bottom:20px;padding:20px;">
        <h3 style="color:#1a4a6b;margin-top:0;">🤖 Revisión global de consistencia</h3>
        <p style="font-size:13px;color:#555;">La IA revisará que los 5 documentos del expediente sean consistentes entre sí antes de generar el ZIP.</p>
        <button type="button" id="btn91RevGlobal" class="btn-ia" style="font-size:14px;padding:10px 20px;">🔍 Revisar expediente completo</button>
        <div id="loader91RevGlobal" style="display:none;margin-top:10px;font-size:13px;color:#1a4a6b;font-style:italic;">Analizando expediente...</div>
        <div id="revision91Global" style="margin-top:12px;display:none;"></div>
      </div>

      <h3 style="color:#1a4a6b;">📁 Documentos del expediente (5 archivos Word)</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:20px;">
        <div class="card" style="padding:12px;background:#f8fafc;">
          <div style="font-weight:700;font-size:13px;color:#1a4a6b;">01_Plan_Verificacion_Externa.docx</div>
          <div style="font-size:12px;color:#666;margin-top:2px;">Datos, objetivo, antecedentes, líneas, muestreo y cronograma</div>
        </div>
        <div class="card" style="padding:12px;background:#f8fafc;">
          <div style="font-weight:700;font-size:13px;color:#1a4a6b;">02_Lista_Verificacion.docx</div>
          <div style="font-size:12px;color:#666;margin-top:2px;">Criterios y preguntas por línea (antes de aplicar)</div>
        </div>
        <div class="card" style="padding:12px;background:#f8fafc;">
          <div style="font-weight:700;font-size:13px;color:#1a4a6b;">03_Lista_Verificacion_Aplicada.docx</div>
          <div style="font-size:12px;color:#666;margin-top:2px;">Resultados de campo: cumplimientos e incumplimientos</div>
        </div>
        <div class="card" style="padding:12px;background:#f8fafc;">
          <div style="font-weight:700;font-size:13px;color:#1a4a6b;">04_Reporte_Hallazgos.docx</div>
          <div style="font-size:12px;color:#666;margin-top:2px;">Hallazgos, causas raíz y acciones correctivas</div>
        </div>
        <div class="card" style="padding:12px;background:#f8fafc;">
          <div style="font-weight:700;font-size:13px;color:#1a4a6b;">05_Informe_Verificacion_Externa.docx</div>
          <div style="font-size:12px;color:#666;margin-top:2px;">Resumen ejecutivo, conclusiones y dictamen</div>
        </div>
      </div>

      <div class="form-group">
        <label for="exp91Notas">Notas adicionales para el expediente</label>
        <textarea id="exp91Notas" rows="3" placeholder="Cualquier observación final que quieras incluir..."></textarea>
      </div>

      <div id="msgExpediente91" style="display:none;margin-bottom:12px;font-size:14px;font-weight:600;"></div>
      <div id="loader91Expediente" style="display:none;font-size:13px;font-style:italic;color:#1a4a6b;margin-bottom:8px;">Generando documentos...</div>

      <button class="btn-siguiente" id="btn91DescargarZIP" style="background:#1a4a6b;font-size:16px;padding:14px 32px;">
        📦 Descargar expediente completo (.zip)
      </button>
      <p style="font-size:12px;color:#888;margin-top:8px;">Consuma 1 crédito · Genera 5 documentos Word en un archivo ZIP.</p>
    </div>
  </section>`;
}
