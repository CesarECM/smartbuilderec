// ─── wizard/ia-dialogo.js — IA para Técnica Diálogo/Discusión ───────────────
// generarDialogoIA: genera un campo individual de la técnica diálogo/discusión

import { llamarIA } from "./api.js";

const IDS_DIALOGO = {
  actividad:     "dialogoActividad",
  instrucciones: "dialogoInstrucciones",
  ejemplos:      "dialogoEjemplos",
  conclusion:    "dialogoConclusion",
};

export async function generarDialogoIA(campo, boton) {
  const datos     = getData("ec0217_datos")     || {};
  const objetivos = getData("ec0217_objetivos") || {};
  const temario   = getData("ec0217_temario")   || {};

  const textareaDestino = document.getElementById(IDS_DIALOGO[campo]);
  if (!textareaDestino) return;

  try {
    boton.disabled    = true;
    boton.textContent = "Generando...";

    const data = await llamarIA("generate-dialogo", {
      campo,
      nombreCurso:      datos.nombreCurso    || "",
      perfil:           datos.perfil         || "",
      objetivoAfectivo: objetivos.afectiva   || "",
      objetivoGeneral:  objetivos.general    || "",
      temario,
    });

    textareaDestino.value = data.texto || "";
    if (typeof window.guardarDialogoTemporal === "function") window.guardarDialogoTemporal();

  } catch (err) {
    console.error("Error al generar técnica diálogo/discusión:", err);
    const msg = typeof mensajeAmigable === "function" ? mensajeAmigable(err) : err.message;
    if (typeof showAlert === "function") showAlert(`No se pudo generar el texto:\n\n${msg}`);
  } finally {
    boton.disabled    = false;
    boton.textContent = "Generar con IA";
  }
}

export function initIADialogo() {
  window.generarDialogoIA = generarDialogoIA;
}
