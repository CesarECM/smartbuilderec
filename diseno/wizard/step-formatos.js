// ─── wizard/step-formatos.js — Paso Final: Formatos y Descarga (W#9) ─────────
import { initPreview }       from "./preview-html.js";
import { hasUnsavedChanges } from "./download-tracker.js";

/** Valida que el expediente esté completo antes de descargar */
export function validarExpedienteCompleto() {
  const errores = [];

  const ev   = JSON.parse(localStorage.getItem("ec0217_evaluaciones") || "{}");
  const pctDiag = ev.pctDiagnostica ?? ev.pctDiag ?? 0;
  const pctForm = ev.pctFormativa   ?? ev.pctForm ?? 0;
  const pctSuma = ev.pctSumativa    ?? ev.pctSuma ?? 0;
  if (pctDiag + pctForm + pctSuma !== 100) {
    errores.push(`Los porcentajes de evaluación suman ${pctDiag + pctForm + pctSuma}% (deben sumar 100%) — Paso 14.`);
  }

  const datos    = JSON.parse(localStorage.getItem("ec0217_datos") || "{}");
  const tiempos  = JSON.parse(localStorage.getItem("ec0217_tiempos") || "[]");
  const duracion = parseInt(datos.duracion, 10) || 0;
  const totalMin = tiempos.reduce((a, b) =>
    a + (b.filas || []).reduce((s, f) => s + (parseInt(f.tiempo, 10) || 0), 0), 0);
  if (duracion > 0 && totalMin !== duracion) {
    errores.push(`La distribución de tiempos suma ${totalMin} min pero la duración del curso es ${duracion} min — Paso 15.`);
  }

  const temario   = JSON.parse(localStorage.getItem("ec0217_temario") || "{}");
  const totalTemas = (temario.u1?.length || 0) + (temario.u2?.length || 0) + (temario.u3?.length || 0);
  if (totalTemas === 0) errores.push("El temario no tiene ningún tema registrado — Paso 4.");

  return errores;
}

/** Rellena el panel de resumen del expediente (sección Formatos) */
export function poblarResumenExpediente() {
  const datos        = JSON.parse(localStorage.getItem("ec0217_datos")        || "{}");
  const evaluaciones = JSON.parse(localStorage.getItem("ec0217_evaluaciones") || "{}");
  const temario      = JSON.parse(localStorage.getItem("ec0217_temario")      || "{}");
  const tiempos      = JSON.parse(localStorage.getItem("ec0217_tiempos")      || "[]");

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? "—"; };

  set("res-nombre",        datos.nombreCurso   || "Sin nombre");
  set("res-instructor",    datos.instructor    || "—");
  set("res-duracion",      datos.duracion      || "—");
  set("res-participantes", datos.participantes || "—");

  const pctDiag = evaluaciones.pctDiagnostica ?? evaluaciones.pctDiag ?? 0;
  const pctForm = evaluaciones.pctFormativa   ?? evaluaciones.pctForm ?? 0;
  const pctSuma = evaluaciones.pctSumativa    ?? evaluaciones.pctSuma ?? 0;
  const totalPct = pctDiag + pctForm + pctSuma;
  set("res-pct-diag",  pctDiag);
  set("res-pct-form",  pctForm);
  set("res-pct-suma",  pctSuma);
  set("res-pct-total", totalPct);
  const totalWrap = document.getElementById("res-pct-total-wrap");
  if (totalWrap) totalWrap.style.color = totalPct === 100 ? "#16a34a" : "#dc2626";

  set("res-u1", temario.u1?.length ?? 0);
  set("res-u2", temario.u2?.length ?? 0);
  set("res-u3", temario.u3?.length ?? 0);

  const totalTMin = tiempos.reduce((a, b) =>
    a + (b.filas || []).reduce((s, f) => s + (parseInt(f.tiempo, 10) || 0), 0), 0);
  const duracion = parseInt(datos.duracion, 10) || 0;
  set("res-tiempos-total",    totalTMin);
  set("res-tiempos-duracion", duracion);
  const diffWrap = document.getElementById("res-tiempos-diff-wrap");
  if (diffWrap && duracion > 0) {
    const diff = totalTMin - duracion;
    diffWrap.textContent = diff === 0 ? "✅ Cuadra exactamente" : (diff > 0 ? `+${diff} min de más` : `${diff} min faltantes`);
    diffWrap.style.color = diff === 0 ? "#16a34a" : "#dc2626";
  }

  const errores = validarExpedienteCompleto();
  const alertasEl    = document.getElementById("res-alertas");
  const alertasLista = document.getElementById("res-alertas-lista");
  if (alertasEl && alertasLista) {
    alertasLista.innerHTML = errores.map(e => `<li>${e}</li>`).join("");
    alertasEl.style.display = errores.length > 0 ? "block" : "none";
  }

  _actualizarBadgeDescarga();
}

function _actualizarBadgeDescarga() {
  const badge = document.getElementById("badge-descarga-desactualizada");
  if (!badge) return;
  badge.style.display = hasUnsavedChanges() ? "flex" : "none";
}

export function initStepFormatos() {
  window.validarExpedienteCompleto = validarExpedienteCompleto;
  window.poblarResumenExpediente   = poblarResumenExpediente;
  initPreview();
}

export function getTemplate() {
  return `
      <section id="seccionFormatos" class="wizard-section hidden">
        <p class="paso-titulo">Paso 16 de 16</p>
        <h1>Resumen y descarga</h1>

        <div class="card" style="max-width: 950px;">

          <h3 style="margin-top:0;margin-bottom:16px;color:var(--c-primary);">Resumen del expediente</h3>

          <div id="resumen-expediente" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px;">

            <div style="background:var(--c-bg-soft,#f8fafc);border-radius:8px;padding:14px;">
              <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;font-weight:600;">Datos del curso</p>
              <p style="margin:2px 0;font-size:13px;"><strong id="res-nombre">—</strong></p>
              <p style="margin:2px 0;font-size:12px;color:#64748b;">Instructor: <span id="res-instructor">—</span></p>
              <p style="margin:2px 0;font-size:12px;color:#64748b;">Duración: <span id="res-duracion">—</span> min</p>
              <p style="margin:2px 0;font-size:12px;color:#64748b;">Participantes: <span id="res-participantes">—</span></p>
            </div>

            <div style="background:var(--c-bg-soft,#f8fafc);border-radius:8px;padding:14px;">
              <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;font-weight:600;">Evaluación</p>
              <p style="margin:2px 0;font-size:12px;color:#64748b;">Diagnóstica: <strong id="res-pct-diag">0</strong>%</p>
              <p style="margin:2px 0;font-size:12px;color:#64748b;">Formativa: <strong id="res-pct-form">0</strong>%</p>
              <p style="margin:2px 0;font-size:12px;color:#64748b;">Sumativa: <strong id="res-pct-suma">0</strong>%</p>
              <p style="margin:4px 0 0;font-size:12px;" id="res-pct-total-wrap">
                Total: <strong id="res-pct-total">0</strong>%
              </p>
            </div>

            <div style="background:var(--c-bg-soft,#f8fafc);border-radius:8px;padding:14px;">
              <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;font-weight:600;">Temario</p>
              <p style="margin:2px 0;font-size:12px;color:#64748b;">Unidad 1: <strong id="res-u1">0</strong> temas</p>
              <p style="margin:2px 0;font-size:12px;color:#64748b;">Unidad 2: <strong id="res-u2">0</strong> temas</p>
              <p style="margin:2px 0;font-size:12px;color:#64748b;">Unidad 3: <strong id="res-u3">0</strong> temas</p>
            </div>

            <div style="background:var(--c-bg-soft,#f8fafc);border-radius:8px;padding:14px;">
              <p style="margin:0 0 8px;font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#64748b;font-weight:600;">Distribución de tiempos</p>
              <p style="margin:2px 0;font-size:12px;color:#64748b;">Registrados: <strong id="res-tiempos-total">0</strong> min</p>
              <p style="margin:2px 0;font-size:12px;color:#64748b;">Duración del curso: <strong id="res-tiempos-duracion">0</strong> min</p>
              <p style="margin:4px 0 0;font-size:12px;" id="res-tiempos-diff-wrap"></p>
            </div>

          </div>

          <div id="res-alertas" style="display:none;background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:12px 14px;margin-bottom:16px;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:600;color:#854d0e;">⚠️ Inconsistencias detectadas</p>
            <ul id="res-alertas-lista" style="margin:0;padding-left:16px;font-size:12px;color:#854d0e;"></ul>
          </div>

          <button type="button" id="btnVistaPrevia" class="btn-ia" style="width:100%;font-size:14px;padding:11px 16px;margin-bottom:14px;">
            👁 Vista previa del expediente
          </button>

          <hr style="margin:0 0 16px;border:none;border-top:1px solid #e2e8f0;">

          <p style="font-size:12px;color:#64748b;margin-bottom:16px;">
            Se generarán <strong>10 documentos</strong> en formato Word y PowerPoint empaquetados en un archivo ZIP.
          </p>

          <div id="badge-descarga-desactualizada" style="display:none;align-items:center;gap:10px;background:#fff7ed;border:1px solid #fdba74;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:13px;color:#9a3412;">
            <span style="font-size:16px;">⚠️</span>
            <span>El expediente fue modificado desde la última descarga. Los documentos anteriores <strong>no reflejan los cambios recientes</strong>.</span>
          </div>

          <button type="button" id="btnDescargarPlaneacionFinal" class="btn-siguiente">
            ⬇ Descargar expediente completo
          </button>

          <div id="loaderFormatos" style="display:none;margin-top:15px;">
            Generando formatos...
          </div>
          <p id="mensajeFormatos" style="display:none;margin-top:15px;"></p>

          <hr style="margin:24px 0 16px;">
          <h3 style="margin:0 0 6px;font-size:14px;">Descargar documentos individuales</h3>
          <p style="font-size:12px;color:#64748b;margin:0 0 14px;">Descarga un solo documento con los datos actuales, sin regenerar el paquete completo.</p>
          <div style="display:flex;flex-direction:column;gap:6px;">
            ${[
              ["planeacion",     "📄", "Documento de Planeación EC0217"],
              ["diagnostica",    "📝", "Evaluación Diagnóstica"],
              ["formativa",      "📋", "Evaluación Formativa"],
              ["sumativa",       "📝", "Evaluación Sumativa"],
              ["reaccion",       "😊", "Evaluación de Reacción"],
              ["asistencia",     "👥", "Lista de Asistencia"],
              ["contrato",       "🤝", "Contrato de Aprendizaje"],
              ["requerimientos", "📦", "Lista de Requerimientos"],
              ["presentacion",   "🎯", "Guía de Presentación (PPT)"],
            ].map(([doc, ico, label]) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 12px;background:var(--c-bg-soft,#f8fafc);border-radius:6px;">
                <span style="font-size:13px;">${ico} ${label}</span>
                <button type="button" class="btn-doc-individual btn-ia" data-doc="${doc}" style="font-size:12px;padding:5px 12px;">⬇ Descargar</button>
              </div>`).join("")}
          </div>
        </div>
      </section>
  `;
}
