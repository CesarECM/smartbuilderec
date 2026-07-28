// ─── wizard-ec0616/step-portafolio.js — Paso 9: Portafolio y descarga ────────

import { ELEMENTOS } from "./config.js";

export function cargarPortafolio16() {
  const raw = localStorage.getItem("ec0616_portafolio");
  if (!raw) return;
  const d = JSON.parse(raw);
  const notasEl = document.getElementById("port16Notas");
  if (notasEl && d.notas) notasEl.value = d.notas;
}

export function guardarPortafolio16() {
  const datos = { notas: document.getElementById("port16Notas")?.value.trim() || "" };
  localStorage.setItem("ec0616_portafolio", JSON.stringify(datos));
  window.ec0616Sync?.schedule();
}

export function initStepPortafolio16() {
  window.cargarPortafolio16  = cargarPortafolio16;
  window.guardarPortafolio16 = guardarPortafolio16;
}

export function getTemplate() {
  const itemsScorecard = ELEMENTOS.map(e => `
    <div class="scorecard-elem" id="sc16-${e.id}">
      <h4>${e.titulo}</h4>
      <div class="sc-status" id="sc16-status-${e.id}">—</div>
      <div class="sc-desc" id="sc16-desc-${e.id}">Sin evaluar</div>
    </div>`).join("");

  return `
  <section id="sec16Portafolio" class="wizard-section hidden">
    <p class="paso-titulo">Paso 9 de 9</p>
    <h1>Portafolio de Evidencias — Revisión y Descarga</h1>
    <div class="card" style="max-width:900px;">

      <div class="card" style="background:#f0fdf4;border:2px solid #059669;margin-bottom:20px;padding:20px;">
        <h3 style="color:#065f46;margin-top:0;">🔍 Análisis de brechas del portafolio</h3>
        <p style="font-size:13px;color:#555;">La IA revisará cada elemento y detectará qué desempeños tienen cobertura completa y cuáles necesitan más evidencia.</p>
        <button type="button" id="btn16Scorecard" class="btn-ia" style="font-size:14px;padding:10px 20px;">🤖 Analizar portafolio completo</button>
        <div id="loader16Scorecard" style="display:none;margin-top:10px;font-size:13px;color:#065f46;font-style:italic;">Analizando...</div>
      </div>

      <h3 style="color:#065f46;">Estado del portafolio</h3>
      <div class="scorecard-grid">
        ${itemsScorecard}
      </div>

      <div id="scorecard16Brechas" style="display:none;margin:16px 0;padding:16px;background:#fffbeb;border:1.5px solid #f59e0b;border-radius:8px;font-size:13px;"></div>

      <h3 style="color:#065f46;margin-top:24px;">📁 Documentos del portafolio (9 archivos Word)</h3>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;margin-bottom:20px;font-size:12px;">
        <div class="card" style="padding:10px;background:#f8fafc;"><strong>00_Portada_Portafolio.docx</strong><br>Datos del candidato</div>
        <div class="card" style="padding:10px;background:#f8fafc;"><strong>01_Evidencia_Oxigenacion.docx</strong></div>
        <div class="card" style="padding:10px;background:#f8fafc;"><strong>02_Evidencia_Alimentacion.docx</strong></div>
        <div class="card" style="padding:10px;background:#f8fafc;"><strong>03_Evidencia_Eliminacion.docx</strong></div>
        <div class="card" style="padding:10px;background:#f8fafc;"><strong>04_Evidencia_Confort.docx</strong></div>
        <div class="card" style="padding:10px;background:#f8fafc;"><strong>05_Evidencia_Seguridad.docx</strong></div>
        <div class="card" style="padding:10px;background:#f8fafc;"><strong>06_Evidencia_Post_Mortem.docx</strong></div>
        <div class="card" style="padding:10px;background:#f8fafc;"><strong>07_Evidencia_Autocuidado.docx</strong></div>
        <div class="card" style="padding:10px;background:#f8fafc;"><strong>08_Declaratoria_Candidato.docx</strong></div>
      </div>

      <div class="form-group">
        <label for="port16Notas">Notas adicionales del portafolio</label>
        <textarea id="port16Notas" rows="3" placeholder="Observaciones o información complementaria..."></textarea>
      </div>

      <div id="msgPortafolio16" style="display:none;margin-bottom:12px;font-size:14px;font-weight:600;"></div>
      <div id="loader16ZIP" style="display:none;font-size:13px;font-style:italic;color:#065f46;margin-bottom:8px;">Generando documentos...</div>

      <button class="btn-siguiente" id="btn16DescargarZIP" style="background:#065f46;font-size:16px;padding:14px 32px;">
        📦 Descargar portafolio completo (.zip)
      </button>
      <p style="font-size:12px;color:#888;margin-top:8px;">Consume 1 crédito · Genera 9 documentos Word en un archivo ZIP.</p>
    </div>
  </section>`;
}
