// ─── gce/banner.js — Banner contextual de acción por actor y estado ────────────

import { state, getDatos, esCandidato, esEvaluador, esCE } from "./state.js";

function _renderBanner(tipo, icono, titulo, msg) {
  return `<div class="gce-banner gce-banner-${tipo}">
    <span class="gce-banner-icono">${icono}</span>
    <div class="gce-banner-texto">
      <div class="gce-banner-titulo">${titulo}</div>
      <div class="gce-banner-msg">${msg}</div>
    </div>
  </div>`;
}

function _calcularBanner() {
  const estado   = state.proceso?.estado || "";
  const esCand   = esCandidato();
  const esCentro = esCE();
  const esEval   = esEvaluador();

  const plan      = getDatos("plan_evaluacion");
  const firma_ev  = plan.firma_evaluador;
  const firma_ca  = plan.firma_candidato;

  if (estado === "registro") {
    if (esCand)   return _renderBanner("urgente", "📋", "Completa tu Ficha de Registro", "Llena todos tus datos personales y pulsa «Siguiente → Diagnóstico» para comenzar el proceso.");
    if (esCentro) return _renderBanner("alerta",  "🔗", "El candidato aún no ha llenado su Ficha", "Comparte el enlace del portal con el candidato para que registre sus datos.");
    if (esEval)   return _renderBanner("espera",  "⏳", "Esperando que el candidato llene su Ficha", "No se requiere acción de tu parte en este momento.");
  }

  if (estado === "diagnostico") {
    if (esCand)   return _renderBanner("urgente", "🧠", "Completa el Diagnóstico de competencias", "Responde todas las preguntas del diagnóstico (~30 min). Puedes pausar y continuar después.");
    if (esCentro) return _renderBanner("espera",  "⏳", "El candidato está realizando el Diagnóstico", "No se requiere acción de tu parte. Recibirás una notificación al terminar.");
    if (esEval)   return _renderBanner("espera",  "⏳", "El candidato está realizando el Diagnóstico", "No se requiere acción de tu parte en este momento.");
  }

  if (estado === "plan_acordado") {
    if (!firma_ev) {
      if (esEval)   return _renderBanner("urgente", "📝", "Elabora el Plan de Evaluación", "El candidato terminó el Diagnóstico. Llena el Plan de Evaluación con fechas, técnicas y evidencias requeridas.");
      if (esCand)   return _renderBanner("espera",  "⏳", "El evaluador está preparando el Plan", "Recibirás una notificación cuando el Plan esté listo para que lo revises.");
      if (esCentro) return _renderBanner("info",    "ℹ️", "Esperando al evaluador", "El evaluador debe llenar el Plan de Evaluación antes de continuar.");
    } else if (!firma_ca) {
      if (esCand)   return _renderBanner("urgente", "✍️", "Revisa y confirma el Plan de Evaluación", "El evaluador preparó el Plan. Léelo con atención y, si estás de acuerdo, firma para continuar.");
      if (esEval)   return _renderBanner("espera",  "⏳", "Esperando confirmación del candidato", "El Plan está listo. El candidato debe revisarlo y firmarlo para continuar.");
      if (esCentro) return _renderBanner("alerta",  "🔗", "El candidato debe confirmar el Plan", "Comparte el enlace del portal si el candidato aún no ha accedido a revisar el Plan.");
    } else {
      if (esEval)   return _renderBanner("urgente", "📊", "Plan acordado — Aplica el IEC", "Ambas partes firmaron el Plan. Procede a aplicar el Instrumento de Evaluación de Competencias.");
      if (esCand)   return _renderBanner("espera",  "⏳", "El evaluador aplica el IEC", "El Plan fue confirmado. Recibirás una notificación con el resultado de la evaluación.");
      if (esCentro) return _renderBanner("espera",  "⏳", "Plan acordado — El evaluador aplica el IEC", "No se requiere acción de tu parte en este momento.");
    }
  }

  if (estado === "juicio") {
    if (esEval)   return _renderBanner("urgente", "⚖️", "Emite la Cédula de Evaluación", "Has completado la evaluación. Emite ahora la Cédula con el juicio de competencia para el candidato.");
    if (esCand)   return _renderBanner("espera",  "⏳", "El evaluador prepara tu Cédula", "La evaluación finalizó. Recibirás una notificación cuando la Cédula esté disponible.");
    if (esCentro) return _renderBanner("espera",  "⏳", "El evaluador está emitiendo la Cédula", "No se requiere acción de tu parte en este momento.");
  }

  if (estado === "cierre") {
    if (esCand)   return _renderBanner("urgente", "📋", "Completa la Encuesta de Satisfacción", "Tu Cédula de Evaluación está disponible. Llena la encuesta para cerrar el proceso.");
    if (esEval)   return _renderBanner("espera",  "⏳", "Esperando encuesta del candidato", "El proceso está casi completo. El candidato debe llenar la Encuesta de Satisfacción.");
    if (esCentro) return _renderBanner("espera",  "⏳", "Esperando encuesta del candidato", "No se requiere acción de tu parte. El proceso cierra al completar la encuesta.");
  }

  if (estado === "certificado") {
    return _renderBanner("espera", "✅", "Proceso completado", "El proceso de evaluación ha concluido. Descarga el expediente completo desde este portal.");
  }

  return null;
}

export function actualizarBanner() {
  const el  = document.getElementById("gce-action-banner");
  if (!el) return;
  const html = _calcularBanner();
  if (html) {
    el.innerHTML = html;
    el.style.display = "block";
  } else {
    el.innerHTML = "";
    el.style.display = "none";
  }
}
