// ─── wizard/ia-tecnicas.js — IA para Técnicas Expositiva y Demostrativa ──────
// generarExpositivaIA:   genera un campo individual de la técnica expositiva
// generarDemostrativaIA: genera un campo individual de la técnica demostrativa

import { llamarIA } from "./api.js";

const IDS_EXPOSITIVA = {
  introduccion: "expIntroduccion",
  experiencia:  "expExperiencia",
  desarrollo:   "expDesarrollo",
  ejemplos:     "expEjemplos",
  sintesis:     "expSintesis",
  preguntas:    "expPreguntas",
  utilidad:     "expUtilidad",
};

const IDS_DEMOSTRATIVA = {
  experiencia: "demoExperiencia",
  actividad:   "demoActividad",
  ejemplos:    "demoEjemplos",
  preguntas:   "demoPreguntas",
};

export async function generarExpositivaIA(campo, boton) {
  const datos     = getData("ec0217_datos")     || {};
  const objetivos = getData("ec0217_objetivos") || {};
  const temario   = getData("ec0217_temario")   || {};

  const textareaDestino = document.getElementById(IDS_EXPOSITIVA[campo]);
  if (!textareaDestino) return;

  try {
    boton.disabled     = true;
    boton.textContent  = "Generando...";

    const data = await llamarIA("generate-expositiva", {
      campo,
      nombreCurso:        datos.nombreCurso     || "",
      perfil:             datos.perfil          || "",
      objetivoCognitivo:  objetivos.cognitiva   || "",
      objetivoGeneral:    objetivos.general     || "",
      temario,
    });

    textareaDestino.value = data.texto || "";
    if (typeof window.guardarExpositivaTemporal === "function") window.guardarExpositivaTemporal();

  } catch (err) {
    console.error("Error al generar técnica expositiva:", err);
    const msg = typeof mensajeAmigable === "function" ? mensajeAmigable(err) : err.message;
    if (typeof showAlert === "function") showAlert(`No se pudo generar el texto:\n\n${msg}`);
  } finally {
    boton.disabled    = false;
    boton.textContent = "Generar con IA";
  }
}

export async function generarDemostrativaIA(campo, boton) {
  const datos     = getData("ec0217_datos")     || {};
  const objetivos = getData("ec0217_objetivos") || {};
  const temario   = getData("ec0217_temario")   || {};

  const textareaDestino = document.getElementById(IDS_DEMOSTRATIVA[campo]);
  if (!textareaDestino) return;

  try {
    boton.disabled    = true;
    boton.textContent = "Generando...";

    const data = await llamarIA("generate-demostrativa", {
      campo,
      nombreCurso:         datos.nombreCurso      || "",
      perfil:              datos.perfil           || "",
      objetivoPsicomotriz: objetivos.psicomotriz  || "",
      objetivoGeneral:     objetivos.general      || "",
      temario,
    });

    const textoGenerado = data.texto || data.resultado || data.contenido || data.respuesta || "";
    if (!textoGenerado.trim()) {
      console.log("Respuesta recibida de demostrativa:", data);
      if (typeof showAlert === "function") showAlert("La IA respondió, pero no llegó texto en el campo esperado. Revisa la consola.");
      return;
    }

    textareaDestino.value = textoGenerado;
    if (typeof window.guardarDemostrativaTemporal === "function") window.guardarDemostrativaTemporal();

  } catch (err) {
    console.error("Error al generar técnica demostrativa:", err);
    const msg = typeof mensajeAmigable === "function" ? mensajeAmigable(err) : err.message;
    if (typeof showAlert === "function") showAlert(`No se pudo generar el texto:\n\n${msg}`);
  } finally {
    boton.disabled    = false;
    boton.textContent = "Generar con IA";
  }
}

export function initIATecnicas() {
  window.generarExpositivaIA   = generarExpositivaIA;
  window.generarDemostrativaIA = generarDemostrativaIA;
}
