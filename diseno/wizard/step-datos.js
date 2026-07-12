// ─── wizard/step-datos.js — Paso 1: Datos del Curso ──────────────────────────

import { DURACION_MINIMA_MIN } from "./config.js";

const CAMPOS = [
  { id: "nombreCurso",   errId: "err-nombreCurso",   tipo: "texto" },
  { id: "instructor",    errId: "err-instructor",    tipo: "texto" },
  { id: "disenador",     errId: "err-disenador",     tipo: "texto" },
  { id: "lugar",         errId: "err-lugar",         tipo: "texto" },
  { id: "fecha",         errId: "err-fecha",         tipo: "texto" },
  { id: "duracion",      errId: "err-duracion",      tipo: "numero", min: DURACION_MINIMA_MIN },
  { id: "participantes", errId: "err-participantes", tipo: "numero", min: 4 },
  { id: "perfil",        errId: "err-perfil",        tipo: "texto" },
];

export function limpiarErroresDatos() {
  CAMPOS.forEach(({ id, errId }) => {
    document.getElementById(id)?.classList.remove("error");
    const err = document.getElementById(errId);
    if (err) err.style.display = "none";
  });
}

export function mostrarErrorDatos(id, errId) {
  document.getElementById(id)?.classList.add("error");
  const err = document.getElementById(errId);
  if (err) err.style.display = "block";
}

export function validarDatosCurso() {
  limpiarErroresDatos();
  let valido = true;
  let primerError = null;

  for (const campo of CAMPOS) {
    const el = document.getElementById(campo.id);
    if (!el) continue;
    const valor = el.value.trim();
    if (!valor) {
      mostrarErrorDatos(campo.id, campo.errId);
      if (!primerError) primerError = campo.id;
      valido = false;
      continue;
    }
    if (campo.tipo === "numero") {
      const num = parseInt(valor, 10);
      if (isNaN(num) || num < campo.min) {
        mostrarErrorDatos(campo.id, campo.errId);
        if (!primerError) primerError = campo.id;
        valido = false;
      }
    }
  }

  if (primerError) {
    const el = document.getElementById(primerError);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    el?.focus();
  }
  return valido;
}

export function cargarDatosCurso() {
  const raw = localStorage.getItem("ec0217_datos");
  if (!raw) return;
  const d = JSON.parse(raw);
  ["nombreCurso","instructor","disenador","lugar","fecha","duracion","participantes","perfil"].forEach(id => {
    const el = document.getElementById(id);
    if (el && d[id] !== undefined) el.value = d[id];
  });
}

export function guardarDatosCurso() {
  const datos = {
    nombreCurso:   document.getElementById("nombreCurso")?.value.trim()   || "",
    instructor:    document.getElementById("instructor")?.value.trim()    || "",
    disenador:     document.getElementById("disenador")?.value.trim()     || "",
    lugar:         document.getElementById("lugar")?.value.trim()         || "",
    fecha:         document.getElementById("fecha")?.value                || "",
    duracion:      parseInt(document.getElementById("duracion")?.value    || "0", 10),
    participantes: parseInt(document.getElementById("participantes")?.value || "0", 10),
    perfil:        document.getElementById("perfil")?.value.trim()        || "",
  };
  localStorage.setItem("ec0217_datos", JSON.stringify(datos));
  localStorage.setItem("ec0217_datos_completo", "true");
  document.getElementById("nav-datos")?.classList.add("completed");
  document.getElementById("nav-objetivos")?.classList.remove("disabled");
}

export function initStepDatos() {
  window.limpiarErroresDatos = limpiarErroresDatos;
  window.mostrarErrorDatos   = mostrarErrorDatos;
  window.validarDatosCurso   = validarDatosCurso;
  window.cargarDatosCurso    = cargarDatosCurso;
  window.guardarDatosCurso   = guardarDatosCurso;
}
