// ─── wizard-ec1375/step-datos.js — Paso 1: Datos del auxiliar ────────────────

const CAMPOS = [
  { id: "aux75Nombre",    err: "err75-nombre" },
  { id: "aux75Apellidos", err: "err75-apellidos" },
  { id: "aux75CURP",      err: "err75-curp" },
  { id: "aux75Centro",    err: "err75-centro" },
  { id: "aux75Tecnicas",  err: "err75-tecnicas" },
  { id: "aux75Fecha",     err: "err75-fecha" },
];

export function validarDatos75() {
  let ok = true; let primero = null;
  CAMPOS.forEach(({ id, err }) => {
    const el    = document.getElementById(id);
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

export function cargarDatos75() {
  const raw = localStorage.getItem("ec1375_datos");
  if (!raw) return;
  const d = JSON.parse(raw);
  CAMPOS.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (el && d[id] !== undefined) el.value = d[id];
  });
  const navCurso = document.getElementById("wiz-nav-curso");
  if (navCurso && (d.aux75Nombre || d.aux75Apellidos)) {
    navCurso.textContent = [d.aux75Nombre, d.aux75Apellidos].filter(Boolean).join(" ");
  }
}

export function guardarDatos75() {
  const datos = {};
  CAMPOS.forEach(({ id }) => { datos[id] = document.getElementById(id)?.value.trim() || ""; });
  localStorage.setItem("ec1375_datos", JSON.stringify(datos));
  localStorage.setItem("ec1375_datos_completo", "true");
  document.getElementById("nav75-datos")?.classList.add("completed");
  document.getElementById("nav75-espacio")?.classList.remove("disabled");
  const navCurso = document.getElementById("wiz-nav-curso");
  if (navCurso) navCurso.textContent = [datos.aux75Nombre, datos.aux75Apellidos].filter(Boolean).join(" ");
  window.ec1375Sync?.schedule();
}

export function initStepDatos75() {
  window.validarDatos75 = validarDatos75;
  window.cargarDatos75  = cargarDatos75;
  window.guardarDatos75 = guardarDatos75;
}

export function getTemplate() {
  return `
  <section id="sec75Datos" class="wizard-section">
    <p class="paso-titulo">Paso 1 de 7</p>
    <h1>Datos del Auxiliar</h1>
    <div class="card" style="max-width:800px;">
      <p style="color:#555;font-size:14px;">
        Captura la información del auxiliar que presta servicios en la contribución tradicional
        y complementaria (EC1375).
      </p>
      <div class="form-grid">
        <div class="form-group">
          <label for="aux75Nombre">Nombre(s) del auxiliar *</label>
          <input type="text" id="aux75Nombre" placeholder="Nombre(s)">
          <span class="error-msg" id="err75-nombre">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="aux75Apellidos">Apellidos del auxiliar *</label>
          <input type="text" id="aux75Apellidos" placeholder="Apellido paterno y materno">
          <span class="error-msg" id="err75-apellidos">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="aux75CURP">CURP del auxiliar *</label>
          <input type="text" id="aux75CURP" placeholder="18 caracteres" maxlength="18" style="text-transform:uppercase;">
          <span class="error-msg" id="err75-curp">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="aux75Centro">Centro / empresa donde labora *</label>
          <input type="text" id="aux75Centro" placeholder="Ej. Centro de Bienestar Integral Xochitl">
          <span class="error-msg" id="err75-centro">Campo requerido.</span>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label for="aux75Tecnicas">Técnicas tradicionales y complementarias que aplica *</label>
          <textarea id="aux75Tecnicas" rows="3" placeholder="Ej. Masaje holístico, temazcal, reflexología, aromaterapia…"></textarea>
          <span class="error-msg" id="err75-tecnicas">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="aux75Fecha">Fecha de la sesión de atención *</label>
          <input type="date" id="aux75Fecha">
          <span class="error-msg" id="err75-fecha">Campo requerido.</span>
        </div>
      </div>
      <button class="btn-siguiente" id="btn75SigDatos">Siguiente →</button>
    </div>
  </section>`;
}
