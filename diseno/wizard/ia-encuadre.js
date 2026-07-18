// ─── wizard/ia-encuadre.js — IA para Encuadre del Curso ─────────────────────
// generarPreguntasEncuadreIA: genera preguntas de experiencia previa con IA

import { llamarIA } from "./api.js";
import { guardarUndo, mostrarUndo } from "./undo.js";

export async function generarPreguntasEncuadreIA() {
  const datos = getData("ec0217_datos") || {};

  if (!datos.nombreCurso || !datos.perfil) {
    if (typeof showAlert === "function") showAlert("Primero completa el nombre del curso y el perfil del participante en Datos del Curso.");
    if (typeof window.mostrarSeccionPrincipal === "function") window.mostrarSeccionPrincipal("seccionDatos");
    return;
  }

  const preguntasEncuadre = document.getElementById("preguntasEncuadre");
  const yaTienePreguntas  = preguntasEncuadre && preguntasEncuadre.value.trim().length > 0;

  if (yaTienePreguntas && typeof showConfirm === "function") {
    const ok = await showConfirm(
      "Ya tienes preguntas escritas. Si generas preguntas con IA, las preguntas actuales se eliminarán y serán reemplazadas. ¿Deseas continuar?",
      { title: "Reemplazar preguntas", icon: "⚠️", confirmText: "Sí, reemplazar", danger: true }
    );
    if (!ok) return;
  }

  const loaderPreguntas   = document.getElementById("loaderPreguntas");
  const btnGenerarPreguntas = document.getElementById("btnGenerarPreguntas");

  guardarUndo("ec0217_encuadre", "cargarEncuadre");
  try {
    if (loaderPreguntas) loaderPreguntas.style.display = "block";
    if (btnGenerarPreguntas) btnGenerarPreguntas.disabled = true;

    const data = await llamarIA("generate-preguntas", {
      nombre: datos.nombreCurso || "",
      perfil: datos.perfil      || "",
    });

    let preguntas = [];
    if (Array.isArray(data.preguntas)) {
      preguntas = data.preguntas;
    } else if (typeof data.preguntas === "string") {
      preguntas = data.preguntas.split(/\n+/).filter(Boolean);
    }

    if (preguntasEncuadre) {
      preguntasEncuadre.value = preguntas
        .slice(0, 4)
        .map((p, i) => `${i + 1}. ${p.replace(/^\d+[\).\s-]*/, "")}`)
        .join("\n");
    }

    if (typeof window.guardarEncuadreTemporal === "function") window.guardarEncuadreTemporal();
    mostrarUndo("Preguntas de encuadre", "preguntasEncuadre");

  } catch (err) {
    console.error("Error al generar preguntas:", err);
    const msg = typeof mensajeAmigable === "function" ? mensajeAmigable(err) : err.message;
    if (typeof showAlert === "function") showAlert(`No se pudieron generar las preguntas:\n\n${msg}`);
  } finally {
    if (loaderPreguntas) loaderPreguntas.style.display = "none";
    if (btnGenerarPreguntas) btnGenerarPreguntas.disabled = false;
  }
}

export function initIAEncuadre() {
  window.generarPreguntasEncuadreIA = generarPreguntasEncuadreIA;
  document.getElementById("btnGenerarPreguntas")?.addEventListener("click", () => generarPreguntasEncuadreIA());
}
