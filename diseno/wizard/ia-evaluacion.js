// ─── wizard/ia-evaluacion.js — IA para Evaluaciones ─────────────────────────
// generarEvaluacionIA: genera evaluación diagnóstica o sumativa (tipo=diagnostica|sumativa)
// generarFormativaIA:  genera el instrumento de evaluación formativa

import { llamarIA } from "./api.js";

let tipoInstrumentoFormativa = "";

export async function generarEvaluacionIA(tipo) {
  const objetivos = getData("ec0217_objetivos") || {};
  const datos     = getData("ec0217_datos")     || {};

  const esDiagnostica = tipo === "diagnostica";
  const boton   = document.getElementById(esDiagnostica ? "btnGenerarDiagnostica" : "btnGenerarSumativa");
  const loader  = document.getElementById(esDiagnostica ? "loaderDiagnostica"     : "loaderSumativa");
  const destino = document.getElementById(esDiagnostica ? "instDiagnostica"       : "instSumativa");

  try {
    if (loader) loader.style.display = "block";
    if (boton)  boton.disabled       = true;

    const data = await llamarIA(`generate-evaluacion-${tipo}`, {
      nombreCurso:         datos.nombreCurso      || "",
      objetivoGeneral:     objetivos.general      || "",
      objetivoCognitivo:   objetivos.cognitiva    || "",
      objetivoPsicomotriz: objetivos.psicomotriz  || "",
      objetivoAfectivo:    objetivos.afectiva     || "",
    });

    if (destino) {
      const resultado = data.preguntas || data.texto || data;
      if (Array.isArray(resultado)) {
        destino.value = resultado.map((p, i) =>
          `${i + 1}. ${p.pregunta || ""}\n      A) ${p.opciones?.A || ""}\n      B) ${p.opciones?.B || ""}\n      C) ${p.opciones?.C || ""}\n      D) ${p.opciones?.D || ""}\n      Respuesta correcta: ${p.respuesta_correcta || p.respuesta || ""}\n      Dificultad: ${p.dificultad || p.nivel || p.nivel_dificultad || ""}`
        ).join("\n\n");
      } else {
        destino.value = resultado || "";
      }
    }

    if (typeof window.guardarEvaluacionesTemporal === "function") window.guardarEvaluacionesTemporal();

  } catch (err) {
    const msg = typeof mensajeAmigable === "function" ? mensajeAmigable(err) : err.message;
    if (typeof showAlert === "function") showAlert(`No se pudo generar la evaluación:\n\n${msg}`);
  } finally {
    if (loader) loader.style.display = "none";
    if (boton)  boton.disabled       = false;
  }
}

export async function generarFormativaIA() {
  const demostrativa = getData("ec0217_demostrativa") || {};
  const datos        = getData("ec0217_datos")        || {};

  const actividad =
    demostrativa.actividad     ||
    demostrativa.demoActividad ||
    document.getElementById("demoActividad")?.value?.trim() ||
    "";

  if (!actividad.trim()) {
    if (typeof showAlert === "function") showAlert(
      "Primero completa el apartado c) de Técnica Demostrativa: Presentará la actividad a desarrollar y mencionará el propósito de la misma."
    );
    if (typeof window.mostrarSeccionPrincipal === "function") window.mostrarSeccionPrincipal("seccionDemostrativa");
    return;
  }

  const instFormativa = document.getElementById("instFormativa");
  const yaTieneTexto  = instFormativa && instFormativa.value.trim().length > 0;

  if (yaTieneTexto && typeof showConfirm === "function") {
    const ok = await showConfirm(
      "Ya tienes texto en la evaluación formativa. Si generas con IA, el contenido actual será reemplazado. ¿Deseas continuar?",
      { title: "Reemplazar contenido", icon: "⚠️", confirmText: "Sí, reemplazar", danger: true }
    );
    if (!ok) return;
  }

  const loaderFormativa   = document.getElementById("loaderFormativa");
  const btnGenerarFormativa = document.getElementById("btnGenerarFormativa");

  try {
    if (loaderFormativa)     loaderFormativa.style.display = "block";
    if (btnGenerarFormativa) { btnGenerarFormativa.disabled = true; btnGenerarFormativa.textContent = "Generando..."; }

    const data = await llamarIA("generate-formativa", {
      nombreCurso: datos.nombreCurso || "",
      actividad,
    });

    let textoGenerado = "";
    let tipoGenerado  = "";

    if (Array.isArray(data.reactivos)) {
      tipoGenerado  = data.tipoInstrumento || "";
      textoGenerado = data.reactivos.map((r, i) => `${i + 1}. ${r}`).join("\n");
    } else {
      textoGenerado = data.texto || data.instrumento || data.resultado || data.respuesta || "";
      tipoGenerado  = data.tipoInstrumento || "";

      if (typeof textoGenerado === "string" && textoGenerado.trim().startsWith("{")) {
        try {
          const inner = JSON.parse(textoGenerado);
          tipoGenerado  = inner.tipoInstrumento || tipoGenerado;
          if (Array.isArray(inner.reactivos)) textoGenerado = inner.reactivos.map((r, i) => `${i + 1}. ${r}`).join("\n");
        } catch (_) {}
      }
    }

    tipoInstrumentoFormativa        = tipoGenerado;
    window.tipoInstrumentoFormativa = tipoInstrumentoFormativa;

    if (!textoGenerado.trim()) {
      console.log("Respuesta evaluación formativa:", data);
      if (typeof showAlert === "function") showAlert("La IA respondió, pero no llegó texto para la evaluación formativa.");
      return;
    }

    if (instFormativa) instFormativa.value = textoGenerado;
    if (typeof window.guardarEvaluacionesTemporal === "function") window.guardarEvaluacionesTemporal();

  } catch (err) {
    console.error("Error al generar evaluación formativa:", err);
    const msg = typeof mensajeAmigable === "function" ? mensajeAmigable(err) : err.message;
    if (typeof showAlert === "function") showAlert(`No se pudo generar la evaluación formativa:\n\n${msg}`);
  } finally {
    if (loaderFormativa)     loaderFormativa.style.display   = "none";
    if (btnGenerarFormativa) {
      btnGenerarFormativa.disabled    = false;
      btnGenerarFormativa.textContent = "Generar evaluación formativa con IA";
    }
  }
}

async function _generarTodoEvaluaciones(btnTodo) {
  const campos = [
    { id: "instDiagnostica", fn: () => generarEvaluacionIA("diagnostica") },
    { id: "instFormativa",   fn: generarFormativaIA },
    { id: "instSumativa",    fn: () => generarEvaluacionIA("sumativa") },
  ];

  const vacios  = campos.filter(c => !document.getElementById(c.id)?.value.trim());
  if (vacios.length === 0) {
    if (typeof showAlert === "function") showAlert("Todos los instrumentos ya tienen contenido.");
    return;
  }

  if (vacios.length < campos.length) {
    const ok = typeof showConfirm === "function"
      ? await showConfirm("Algunos instrumentos ya tienen contenido. ¿Generar solo los vacíos?",
          { title: "Generar todo", confirmText: "Sí, solo los vacíos" })
      : confirm("Algunos instrumentos ya tienen contenido. ¿Generar solo los vacíos?");
    if (!ok) return;
  }

  btnTodo.disabled = true;
  const original = btnTodo.textContent;
  try {
    for (let i = 0; i < vacios.length; i++) {
      btnTodo.textContent = `⏳ Generando ${i + 1}/${vacios.length}…`;
      await vacios[i].fn();
    }
    btnTodo.textContent = "✅ ¡Todo generado!";
    setTimeout(() => { btnTodo.textContent = original; }, 2500);
  } catch (_) {
    btnTodo.textContent = original;
  } finally {
    btnTodo.disabled = false;
  }
}

export function initIAEvaluacion() {
  window.generarEvaluacionIA      = generarEvaluacionIA;
  window.generarFormativaIA       = generarFormativaIA;
  window.tipoInstrumentoFormativa = tipoInstrumentoFormativa;

  const btnTodo = document.getElementById("btnGenerarTodoEvaluaciones");
  if (btnTodo) btnTodo.addEventListener("click", () => _generarTodoEvaluaciones(btnTodo));
}
