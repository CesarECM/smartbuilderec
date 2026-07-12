// ─── wizard/step-formatos.js — Paso Final: Formatos y Descarga (W#9) ─────────

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
}

export function initStepFormatos() {
  window.validarExpedienteCompleto = validarExpedienteCompleto;
  window.poblarResumenExpediente   = poblarResumenExpediente;
}
