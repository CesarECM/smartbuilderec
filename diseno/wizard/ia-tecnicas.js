// ─── wizard/ia-tecnicas.js — IA para Técnicas Expositiva y Demostrativa ──────
// generarExpositivaIA:   genera un campo individual de la técnica expositiva
// generarDemostrativaIA: genera un campo individual de la técnica demostrativa

import { llamarIA } from "./api.js";
import { guardarUndo, mostrarUndo, iniciarBatch, finalizarBatch } from "./undo.js";

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

  guardarUndo("ec0217_expositiva", "cargarExpositiva");
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
    mostrarUndo("Técnica Expositiva", IDS_EXPOSITIVA[campo]);

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

  guardarUndo("ec0217_demostrativa", "cargarDemostrativa");
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
    mostrarUndo("Técnica Demostrativa", IDS_DEMOSTRATIVA[campo]);

  } catch (err) {
    console.error("Error al generar técnica demostrativa:", err);
    const msg = typeof mensajeAmigable === "function" ? mensajeAmigable(err) : err.message;
    if (typeof showAlert === "function") showAlert(`No se pudo generar el texto:\n\n${msg}`);
  } finally {
    boton.disabled    = false;
    boton.textContent = "Generar con IA";
  }
}

async function _generarSeccionCompleta(campos, generadorFn, btnTodo, guardarFn, onComplete) {
  btnTodo.disabled = true;
  const original = btnTodo.textContent;
  let completados = 0;
  btnTodo.textContent = `Generando 0/${campos.length}...`;
  try {
    await Promise.all(campos.map(async campo => {
      await generadorFn(campo);
      completados++;
      btnTodo.textContent = `Generando ${completados}/${campos.length}...`;
    }));
    guardarFn();
    onComplete?.();
  } catch (err) {
    const msg = typeof mensajeAmigable === "function" ? mensajeAmigable(err) : err.message;
    if (typeof showAlert === "function") showAlert(`⚠️ Error al generar:\n${msg}`);
  } finally {
    btnTodo.disabled = false;
    btnTodo.textContent = original;
  }
}

export function initIATecnicas() {
  window.generarExpositivaIA   = generarExpositivaIA;
  window.generarDemostrativaIA = generarDemostrativaIA;

  // ── Expositiva: botones individuales ─────────────────────────────────────
  document.querySelectorAll(".btn-ia-expositiva").forEach(btn => {
    btn.addEventListener("click", () => generarExpositivaIA(btn.dataset.campo, btn));
  });

  // ── Expositiva: botón Generar todo ────────────────────────────────────────
  const btnTodoExp = document.getElementById("btnGenerarTodoExpositiva");
  if (btnTodoExp) {
    btnTodoExp.addEventListener("click", () => {
      const vacios = Object.entries(IDS_EXPOSITIVA)
        .filter(([, id]) => !document.getElementById(id)?.value.trim())
        .map(([campo]) => campo);
      if (!vacios.length) {
        if (typeof showAlert === "function") showAlert("Todos los campos ya tienen contenido.");
        return;
      }
      if (vacios.length < Object.keys(IDS_EXPOSITIVA).length &&
          !confirm("Algunos campos ya tienen contenido. ¿Generar solo los vacíos?")) return;
      iniciarBatch("ec0217_expositiva", "cargarExpositiva");
      _generarSeccionCompleta(
        vacios,
        async campo => { const fb = { disabled: false, textContent: "" }; await generarExpositivaIA(campo, fb); },
        btnTodoExp,
        () => window.guardarExpositivaFinal?.(),
        () => finalizarBatch("Técnica Expositiva completa")
      );
    });
  }

  // ── Demostrativa: botones individuales ────────────────────────────────────
  document.querySelectorAll(".btn-ia-demostrativa").forEach(btn => {
    btn.addEventListener("click", () => generarDemostrativaIA(btn.dataset.campo, btn));
  });

  // ── Demostrativa: botón Generar todo ─────────────────────────────────────
  const btnTodoDem = document.getElementById("btnGenerarTodoDemostrativa");
  if (btnTodoDem) {
    btnTodoDem.addEventListener("click", () => {
      const vacios = Object.entries(IDS_DEMOSTRATIVA)
        .filter(([, id]) => !document.getElementById(id)?.value.trim())
        .map(([campo]) => campo);
      if (!vacios.length) {
        if (typeof showAlert === "function") showAlert("Todos los campos ya tienen contenido.");
        return;
      }
      if (vacios.length < Object.keys(IDS_DEMOSTRATIVA).length &&
          !confirm("Algunos campos ya tienen contenido. ¿Generar solo los vacíos?")) return;
      iniciarBatch("ec0217_demostrativa", "cargarDemostrativa");
      _generarSeccionCompleta(
        vacios,
        async campo => { const fb = { disabled: false, textContent: "" }; await generarDemostrativaIA(campo, fb); },
        btnTodoDem,
        () => window.guardarDemostrativaFinal?.(),
        () => finalizarBatch("Técnica Demostrativa completa")
      );
    });
  }
}
