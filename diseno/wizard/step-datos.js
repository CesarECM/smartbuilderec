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
  document.getElementById("denominacionOtro")?.classList.remove("error");
  const errDen = document.getElementById("err-denominacion");
  if (errDen) errDen.style.display = "none";
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

  if (document.getElementById("denominacionParticipante")?.value === "otro") {
    const otroEl = document.getElementById("denominacionOtro");
    const errEl  = document.getElementById("err-denominacion");
    if (!otroEl?.value.trim()) {
      otroEl?.classList.add("error");
      if (errEl) errEl.style.display = "block";
      if (!primerError) primerError = "denominacionOtro";
      valido = false;
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
  const PRESETS = ["participante","estudiante","alumno","ciudadano","trabajador","servidor público","operario técnico"];
  const selEl  = document.getElementById("denominacionParticipante");
  const otroEl = document.getElementById("denominacionOtro");
  if (selEl && d.denominacion !== undefined) {
    if (PRESETS.includes(d.denominacion)) {
      selEl.value = d.denominacion;
    } else {
      selEl.value = "otro";
      if (otroEl) { otroEl.value = d.denominacion; otroEl.style.display = "block"; }
    }
  }
}

export function guardarDatosCurso() {
  const denSel  = document.getElementById("denominacionParticipante")?.value || "participante";
  const denOtro = document.getElementById("denominacionOtro")?.value.trim()  || "";
  const datos = {
    nombreCurso:   document.getElementById("nombreCurso")?.value.trim()   || "",
    instructor:    document.getElementById("instructor")?.value.trim()    || "",
    disenador:     document.getElementById("disenador")?.value.trim()     || "",
    lugar:         document.getElementById("lugar")?.value.trim()         || "",
    fecha:         document.getElementById("fecha")?.value                || "",
    duracion:      parseInt(document.getElementById("duracion")?.value    || "0", 10),
    participantes: parseInt(document.getElementById("participantes")?.value || "0", 10),
    perfil:        document.getElementById("perfil")?.value.trim()        || "",
    denominacion:  denSel === "otro" ? denOtro || "participante" : denSel,
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

  document.getElementById("btnCopiarInstructor")?.addEventListener("click", () => {
    const inst = document.getElementById("instructor")?.value.trim();
    const dis  = document.getElementById("disenador");
    if (inst && dis) dis.value = inst;
  });

  document.getElementById("denominacionParticipante")?.addEventListener("change", ({ target }) => {
    const otroEl = document.getElementById("denominacionOtro");
    if (otroEl) otroEl.style.display = target.value === "otro" ? "block" : "none";
  });
}

export function getTemplate() {
  return `
      <section id="seccionDatos" class="wizard-section">
        <p class="paso-titulo">Paso 1 de 16</p>
        <h1>Datos del Curso</h1>

        <div class="card" style="max-width:800px; margin-bottom:20px; border: 2px dashed #1F3B6D; background:#f0f4fb;">
          <div style="display:flex; align-items:flex-start; gap:16px;">
            <span style="font-size:36px; line-height:1;">📂</span>
            <div style="flex:1;">
              <h3 style="margin:0 0 6px 0; color:#1F3B6D;">¿Ya tienes una planeación guardada?</h3>
              <p style="margin:0 0 14px 0; color:#444; font-size:14px;">
                Si descargaste anteriormente el paquete completo, puedes importar el archivo
                <strong>datos_planeacion_*.json</strong> que viene dentro del ZIP para
                rellenar automáticamente todos los campos del sistema.
              </p>
              <label for="inputImportarJSON" class="btn-siguiente" style="display:inline-block; cursor:pointer; margin:0;">
                📂 Importar planeación (.json)
              </label>
              <input type="file" id="inputImportarJSON" accept=".json" style="display:none;">
              <span id="importarStatus" style="display:none; margin-left:14px; font-size:13px; color:#2e7d32; font-weight:600;"></span>
            </div>
          </div>
        </div>

        <div class="card" style="max-width: 800px;">
          <div class="form-grid">

            <div class="form-group full-width">
              <label for="nombreCurso">Nombre del curso *</label>
              <input type="text" id="nombreCurso" placeholder="Ej. Manejo de Extintores">
              <span class="error-msg" id="err-nombreCurso">Este campo es requerido.</span>
            </div>

            <div class="form-group">
              <label for="instructor">Instructor *</label>
              <input type="text" id="instructor" placeholder="Nombre completo del instructor">
              <span class="error-msg" id="err-instructor">Este campo es requerido.</span>
            </div>

            <div class="form-group">
              <label for="disenador" style="display:flex; align-items:center; gap:8px;">
                Diseñador *
                <button type="button" id="btnCopiarInstructor" title="Copiar nombre del instructor"
                  style="background:none; border:1.5px solid #1f3b6d; border-radius:6px; padding:2px 8px; font-size:11px; color:#1f3b6d; cursor:pointer; line-height:1.6;">
                  <i class="fa fa-copy"></i> Usar el mismo nombre de instructor
                </button>
              </label>
              <input type="text" id="disenador" placeholder="Nombre completo del diseñador">
              <span class="error-msg" id="err-disenador">Este campo es requerido.</span>
            </div>

            <div class="form-group">
              <label for="lugar">Lugar *</label>
              <input type="text" id="lugar" placeholder="Ciudad o instalación">
              <span class="error-msg" id="err-lugar">Este campo es requerido.</span>
            </div>

            <div class="form-group">
              <label for="fecha">Fecha *</label>
              <input type="date" id="fecha">
              <span class="error-msg" id="err-fecha">Este campo es requerido.</span>
            </div>

            <div class="form-group">
              <label for="duracion">Duración (minutos) *</label>
              <input type="number" id="duracion" placeholder="Mínimo 120" min="120">
              <span class="hint">Mínimo 120 minutos según EC0217.01</span>
              <span class="error-msg" id="err-duracion">Mínimo 120 minutos.</span>
            </div>

            <div class="form-group">
              <label for="participantes">Número de participantes *</label>
              <input type="number" id="participantes" placeholder="Mínimo 4" min="4">
              <span class="hint">Mínimo 4 participantes según EC0217.01</span>
              <span class="error-msg" id="err-participantes">Mínimo 4 participantes.</span>
            </div>

            <div class="form-group full-width">
              <label for="denominacionParticipante">¿Cómo llamarás a los participantes de tu curso? *</label>
              <select id="denominacionParticipante">
                <option value="participante">El participante</option>
                <option value="estudiante">El estudiante</option>
                <option value="alumno">El alumno</option>
                <option value="ciudadano">El ciudadano</option>
                <option value="trabajador">El trabajador</option>
                <option value="servidor público">El servidor público</option>
                <option value="operario técnico">El operario técnico</option>
                <option value="otro">Otro — escribir...</option>
              </select>
              <input type="text" id="denominacionOtro" placeholder="Ej. el becario, el voluntario..."
                style="display:none; margin-top:8px;">
              <span class="hint">Se usará como prefijo en los objetivos y documentos generados.</span>
              <span class="error-msg" id="err-denominacion">Escribe cómo llamarás al participante.</span>
            </div>

            <div class="form-group full-width">
              <label for="perfil">Perfil del participante / Requisitos de ingreso *</label>
              <button type="button" id="btnGenerarPerfil" class="btn-ia" style="margin-bottom:8px;">✨ Completar con IA</button>
              <div id="loaderPerfil" style="display:none; margin-bottom:8px;">Generando perfil...</div>
              <textarea spellcheck="true" lang="es" id="perfil"
                placeholder="Describe el perfil del participante y los requisitos de ingreso al curso...">Perfil del participante:
  Conocimientos:
  AHV:
  Habilidades:
  Valores:

Requisitos de ingreso:
</textarea>
              <span class="error-msg" id="err-perfil">Este campo es requerido.</span>
            </div>

          </div>

          <button class="btn-siguiente" id="btnSiguienteDatos">
            Siguiente
          </button>
        </div>
      </section>
  `;
}
