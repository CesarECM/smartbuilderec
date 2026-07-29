// ─── gce/config.js — Constantes del portal GCE ────────────────────────────────

export const BACKEND_URL = "https://smartbuilderec.onrender.com";

export const PASOS = [
  { id: "ficha",       label: "Ficha de Registro",       icono: "📋" },
  { id: "diagnostico", label: "Diagnóstico",              icono: "📝" },
  { id: "plan",        label: "Plan de Evaluación",       icono: "📅" },
  { id: "iec",         label: "IEC Aplicado",             icono: "✅" },
  { id: "cedula",      label: "Cédula de Evaluación",     icono: "🏅" },
  { id: "encuesta",    label: "Encuesta de Satisfacción", icono: "⭐" },
];

/** Estado del proceso → paso que debe mostrarse */
export const ESTADO_A_PASO = {
  registro:      "ficha",
  diagnostico:   "diagnostico",
  plan_acordado: "plan",
  evidencias:    "iec",
  juicio:        "iec",
  cierre:        "cedula",
  certificado:   "encuesta",
};

/** Pasos que el candidato puede editar */
export const PASOS_CANDIDATO = ["ficha", "diagnostico", "encuesta"];

/** Pasos que el evaluador puede editar */
export const PASOS_EVALUADOR = ["plan", "iec", "cedula"];
