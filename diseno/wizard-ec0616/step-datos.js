// ─── wizard-ec0616/step-datos.js — Paso 1: Datos del candidato ───────────────

const CAMPOS = [
  { id: "cand16CURP",        err: "err16-curp" },
  { id: "cand16Nombre",      err: "err16-nombre" },
  { id: "cand16Apellidos",   err: "err16-apellidos" },
  { id: "cand16UnidadMedica",err: "err16-unidad" },
  { id: "cand16CE",          err: "err16-ce" },
  { id: "cand16Evaluador",   err: "err16-evaluador" },
  { id: "cand16Fecha",       err: "err16-fecha" },
];

export function validarDatos16() {
  let ok = true; let primero = null;
  CAMPOS.forEach(({ id, err }) => {
    const el = document.getElementById(id);
    const errEl = document.getElementById(err);
    const vacio = !el?.value.trim();
    el?.classList.toggle("error", vacio);
    if (errEl) errEl.style.display = vacio ? "block" : "none";
    if (vacio && !primero) primero = id;
    if (vacio) ok = false;
  });
  if (primero) document.getElementById(primero)?.focus();
  return ok;
}

export function cargarDatos16() {
  const raw = localStorage.getItem("ec0616_datos");
  if (!raw) return;
  const d = JSON.parse(raw);
  CAMPOS.forEach(({ id }) => { const el = document.getElementById(id); if (el && d[id] !== undefined) el.value = d[id]; });
  const navCurso = document.getElementById("wiz-nav-curso");
  if (navCurso && (d.cand16Nombre || d.cand16Apellidos)) {
    navCurso.textContent = [d.cand16Nombre, d.cand16Apellidos].filter(Boolean).join(" ");
  }
}

export function guardarDatos16() {
  const datos = {};
  CAMPOS.forEach(({ id }) => { datos[id] = document.getElementById(id)?.value.trim() || ""; });
  localStorage.setItem("ec0616_datos", JSON.stringify(datos));
  localStorage.setItem("ec0616_datos_completo", "true");
  document.getElementById("nav16-datos")?.classList.add("completed");
  document.getElementById("nav16-oxigenacion")?.classList.remove("disabled");
  const navCurso = document.getElementById("wiz-nav-curso");
  if (navCurso) navCurso.textContent = [datos.cand16Nombre, datos.cand16Apellidos].filter(Boolean).join(" ");
  window.ec0616Sync?.schedule();
}

export function initStepDatos16() {
  window.validarDatos16 = validarDatos16;
  window.cargarDatos16  = cargarDatos16;
  window.guardarDatos16 = guardarDatos16;
}

export function getTemplate() {
  return `
  <section id="sec16Datos" class="wizard-section">
    <p class="paso-titulo">Paso 1 de 9</p>
    <h1>Datos del Candidato</h1>
    <div class="card" style="max-width:800px;">
      <p style="color:#555;font-size:14px;">Captura la información del auxiliar de enfermería que busca certificarse mediante el EC0616.</p>

      <div class="form-grid">
        <div class="form-group">
          <label for="cand16CURP">CURP del candidato *</label>
          <input type="text" id="cand16CURP" placeholder="18 caracteres" maxlength="18" style="text-transform:uppercase;">
          <span class="error-msg" id="err16-curp">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="cand16Nombre">Nombre(s) *</label>
          <input type="text" id="cand16Nombre" placeholder="Nombre(s) del candidato">
          <span class="error-msg" id="err16-nombre">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="cand16Apellidos">Apellidos *</label>
          <input type="text" id="cand16Apellidos" placeholder="Apellido paterno y materno">
          <span class="error-msg" id="err16-apellidos">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="cand16UnidadMedica">Unidad médica / institución *</label>
          <input type="text" id="cand16UnidadMedica" placeholder="Ej. Hospital General de Zona No. 1, IMSS">
          <span class="error-msg" id="err16-unidad">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="cand16CE">Centro de Evaluación asignado *</label>
          <input type="text" id="cand16CE" placeholder="Nombre del CE que evaluará al candidato">
          <span class="error-msg" id="err16-ce">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="cand16Evaluador">Nombre del evaluador *</label>
          <input type="text" id="cand16Evaluador" placeholder="Evaluador del CE asignado">
          <span class="error-msg" id="err16-evaluador">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="cand16Fecha">Fecha de evaluación *</label>
          <input type="date" id="cand16Fecha">
          <span class="error-msg" id="err16-fecha">Campo requerido.</span>
        </div>
      </div>

      <button class="btn-siguiente" id="btn16SigDatos">Siguiente →</button>
    </div>
  </section>`;
}
