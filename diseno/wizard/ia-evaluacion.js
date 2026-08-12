// ─── wizard/ia-evaluacion.js — IA para Evaluaciones ─────────────────────────
// generarEvaluacionIA: genera evaluación diagnóstica o sumativa (tipo=diagnostica|sumativa)
// generarFormativaIA:  genera el instrumento de evaluación formativa

import { llamarIA } from "./api.js";
import { guardarUndo, mostrarUndo, iniciarBatch, finalizarBatch } from "./undo.js";

const _PESOS_DIFICULTAD = {
  "muy fácil": 10, "muy facil": 10,
  "fácil": 15,     "facil": 15,
  "intermedia": 20, "intermedio": 20,
  "difícil": 25,   "dificil": 25,
  "muy difícil": 30, "muy dificil": 30,
};

function _formatearPts(nivel) {
  const pts    = _PESOS_DIFICULTAD[nivel] ?? 20;
  const fmt    = document.querySelector('input[name="estiloPuntaje"]:checked')?.value || "A";
  if (fmt === "B") return `${pts} pts (${pts}%)`;
  if (fmt === "C") return `${pts} / 100 pts`;
  return `${pts} pts`;
}

function _construirClaveConPesos(preguntas) {
  if (!Array.isArray(preguntas)) return "";
  return preguntas.map((p, i) => {
    const letra = p.respuesta_correcta || "—";
    const nivel = (p.nivel_dificultad || p.dificultad || p.nivel || "").toLowerCase().trim();
    return `${i + 1}. ${letra}  (${_formatearPts(nivel)})`;
  }).join("\n");
}

let tipoInstrumentoFormativa = "";

export async function generarEvaluacionIA(tipo) {
  const objetivos = getData("ec0217_objetivos") || {};
  const datos     = getData("ec0217_datos")     || {};

  const esDiagnostica = tipo === "diagnostica";
  const boton   = document.getElementById(esDiagnostica ? "btnGenerarDiagnostica" : "btnGenerarSumativa");
  const loader  = document.getElementById(esDiagnostica ? "loaderDiagnostica"     : "loaderSumativa");
  const destino = document.getElementById(esDiagnostica ? "instDiagnostica"       : "instSumativa");

  guardarUndo("ec0217_evaluaciones", "cargarEvaluaciones");
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

    const resultado = data.preguntas || data.texto || data;
    if (destino) {
      if (Array.isArray(resultado)) {
        destino.value = resultado.map((p, i) => {
          const nivel = (p.nivel_dificultad || p.dificultad || p.nivel || "").toLowerCase().trim();
          return `${i + 1}. ${p.pregunta || ""}  (${_formatearPts(nivel)})\n   A) ${p.opciones?.A || ""}\n   B) ${p.opciones?.B || ""}\n   C) ${p.opciones?.C || ""}\n   D) ${p.opciones?.D || ""}`;
        }).join("\n\n");
      } else {
        destino.value = resultado || "";
      }
    }

    const headerField = document.getElementById(esDiagnostica ? "instDiagnosticaHeader" : "instSumativaHeader");
    const claveField  = document.getElementById(esDiagnostica ? "instDiagnosticaClave"  : "instSumativaClave");
    if (headerField && data.header) headerField.value = data.header;
    if (claveField) {
      claveField.value = Array.isArray(resultado)
        ? _construirClaveConPesos(resultado)
        : (data.clave || "");
    }

    if (typeof window.guardarEvaluacionesTemporal === "function") window.guardarEvaluacionesTemporal();
    mostrarUndo(`Evaluación ${tipo}`, esDiagnostica ? "instDiagnostica" : "instSumativa");

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

  guardarUndo("ec0217_evaluaciones", "cargarEvaluaciones");
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

    const instFormativaHeader = document.getElementById("instFormativaHeader");
    const instFormativaClave  = document.getElementById("instFormativaClave");
    const notaFormativaPct    = document.getElementById("notaFormativaPct");
    if (instFormativaHeader && data.header) instFormativaHeader.value = data.header;
    if (instFormativaClave  && data.clave)  instFormativaClave.value  = data.clave;
    if (notaFormativaPct && data.n_criterios && data.pct_por_criterio) {
      notaFormativaPct.textContent = `${data.n_criterios} criterios × ${data.pct_por_criterio}% = 100%`;
    }

    if (typeof window.guardarEvaluacionesTemporal === "function") window.guardarEvaluacionesTemporal();
    mostrarUndo("Evaluación formativa", "instFormativa");

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

export async function generarAPFIA(tipo) {
  const objetivos = getData("ec0217_objetivos") || {};
  const datos     = getData("ec0217_datos")     || {};
  const idMap = {
    diagnostica: { btn: "btnGenerarAPFDiagnostica", campo: "apfDiagnostica" },
    formativa:   { btn: "btnGenerarAPFFormativa",   campo: "apfFormativa"   },
    sumativa:    { btn: "btnGenerarAPFSumativa",     campo: "apfSumativa"    },
  };
  const { btn: btnId, campo: campoId } = idMap[tipo] || {};
  const boton   = document.getElementById(btnId);
  const destino = document.getElementById(campoId);

  guardarUndo("ec0217_evaluaciones", "cargarEvaluaciones");
  try {
    if (boton) { boton.disabled = true; boton.textContent = "Generando..."; }
    const data = await llamarIA("generate-alcance-proposito-finalidad", {
      nombreCurso:         datos.nombreCurso      || "",
      objetivoGeneral:     objetivos.general      || "",
      objetivoCognitivo:   objetivos.cognitiva    || "",
      objetivoPsicomotriz: objetivos.psicomotriz  || "",
      objetivoAfectivo:    objetivos.afectiva     || "",
      tipoEvaluacion:      tipo,
    });
    if (destino && data.texto) destino.value = data.texto;
    if (typeof window.guardarEvaluacionesTemporal === "function") window.guardarEvaluacionesTemporal();
    mostrarUndo(`APF ${tipo}`, campoId);
  } catch (err) {
    const msg = typeof mensajeAmigable === "function" ? mensajeAmigable(err) : err.message;
    if (typeof showAlert === "function") showAlert(`No se pudo generar el alcance/propósito/finalidad:\n\n${msg}`);
  } finally {
    if (boton) { boton.disabled = false; boton.textContent = "✨ Generar con IA (basado en el objetivo general del curso)"; }
  }
}

const _incompleto = (idMain, idHeader, idClave) =>
  !document.getElementById(idMain)?.value.trim() ||
  !document.getElementById(idHeader)?.value.trim() ||
  !document.getElementById(idClave)?.value.trim();

async function _generarTodoEvaluaciones(btnTodo) {
  iniciarBatch("ec0217_evaluaciones", "cargarEvaluaciones");
  const campos = [
    { fn: () => generarEvaluacionIA("diagnostica"), vacio: _incompleto("instDiagnostica", "instDiagnosticaHeader", "instDiagnosticaClave") },
    { fn: generarFormativaIA,                       vacio: _incompleto("instFormativa", "instFormativaHeader", "instFormativaClave") },
    { fn: () => generarEvaluacionIA("sumativa"),    vacio: _incompleto("instSumativa", "instSumativaHeader", "instSumativaClave") },
  ];

  const vacios  = campos.filter(c => c.vacio);
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
    finalizarBatch("Evaluaciones completas");
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
  window.generarAPFIA             = generarAPFIA;
  window.tipoInstrumentoFormativa = tipoInstrumentoFormativa;

  const btnTodo = document.getElementById("btnGenerarTodoEvaluaciones");
  if (btnTodo) btnTodo.addEventListener("click", () => _generarTodoEvaluaciones(btnTodo));

  document.getElementById("btnGenerarDiagnostica")?.addEventListener("click", () => generarEvaluacionIA("diagnostica"));
  document.getElementById("btnGenerarFormativa")?.addEventListener("click",   generarFormativaIA);
  document.getElementById("btnGenerarSumativa")?.addEventListener("click",    () => generarEvaluacionIA("sumativa"));

  document.getElementById("btnGenerarAPFDiagnostica")?.addEventListener("click", () => generarAPFIA("diagnostica"));
  document.getElementById("btnGenerarAPFFormativa")?.addEventListener("click",   () => generarAPFIA("formativa"));
  document.getElementById("btnGenerarAPFSumativa")?.addEventListener("click",    () => generarAPFIA("sumativa"));
}
