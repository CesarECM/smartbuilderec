// ─── wizard-ec1375/config.js — Constantes del wizard EC1375 ──────────────────

export const BACKEND_URL = "https://smartbuilderec.onrender.com";

export const NORMA       = "EC1375";
export const NORMA_NOMBRE = "Servicios Auxiliares en Contribución Tradicional y Complementaria";

export const FLUJO_SECCIONES = [
  "sec75Datos",
  "sec75Espacio",
  "sec75Usuario",
  "sec75Signos",
  "sec75Consentimiento",
  "sec75Seguimiento",
  "sec75Expediente",
];

export const NAV_A_SECCION = {
  "nav75-datos":          "sec75Datos",
  "nav75-espacio":        "sec75Espacio",
  "nav75-usuario":        "sec75Usuario",
  "nav75-signos":         "sec75Signos",
  "nav75-consentimiento": "sec75Consentimiento",
  "nav75-seguimiento":    "sec75Seguimiento",
  "nav75-expediente":     "sec75Expediente",
};

/** Claves localStorage (prefijo ec1375_) */
export const CLAVES = {
  datos:          "ec1375_datos",
  espacio:        "ec1375_espacio",
  usuario:        "ec1375_usuario",
  signos:         "ec1375_signos",
  consentimiento: "ec1375_consentimiento",
  seguimiento:    "ec1375_seguimiento",
};

/** Pasos para la barra de progreso */
export const PROGRESS_STEPS = [
  { key: "ec1375_datos_completo",          label: "Datos del auxiliar" },
  { key: "ec1375_espacio_completo",        label: "Espacio y protocolos" },
  { key: "ec1375_usuario_completo",        label: "Datos del usuario" },
  { key: "ec1375_signos_completo",         label: "Signos vitales" },
  { key: "ec1375_consentimiento_completo", label: "Técnica y consentimiento" },
  { key: "ec1375_seguimiento_completo",    label: "Plan de seguimiento" },
];

/** Ítems del checklist E4323 — condiciones del espacio */
export const CHECKLIST_ESPACIO = [
  { id: "esp_materiales",   label: "Dispone de material, herramientas, mobiliario y equipo suficientes para el servicio" },
  { id: "esp_desplazamiento", label: "Cuenta con espacio suficiente para desplazamiento libre y distancia con el usuario" },
  { id: "esp_archivo",      label: "Cuenta con archivero/medio digital para resguardo de documentación del usuario" },
  { id: "esp_ventilacion",  label: "Está ventilado y sin corrientes de aire" },
  { id: "esp_iluminacion",  label: "Cuenta con energía eléctrica e iluminación natural" },
  { id: "esp_colores",      label: "Presenta colores claros en paredes y techo" },
  { id: "esp_basura",       label: "Dispone de depósitos para desechar basura orgánica e inorgánica" },
  { id: "esp_residuos",     label: "Dispone de depósitos para residuos peligrosos biológico-infecciosos (NOM-087-ECOL-SSA1-2002)" },
  { id: "esp_pertenencias", label: "Cuenta con lugar específico para que los usuarios coloquen sus pertenencias" },
];

/** Ítems del checklist E4323 — protocolos sanitarios */
export const CHECKLIST_SANITARIO = [
  { id: "san_manos",    label: "Lavado de manos conforme al protocolo OMS (antes de recibir al usuario)" },
  { id: "san_cubrebocas", label: "Cubrebocas quirúrgico de triple capa colocado correctamente" },
  { id: "san_tapete",   label: "Tapete sanitizante con solución desinfectante en ingreso del inmueble" },
  { id: "san_gel",      label: "Gel antibacterial disponible en el ingreso" },
  { id: "san_termometro", label: "Termómetro digital disponible para toma de temperatura en ingreso" },
];
