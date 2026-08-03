// ─── wizard-ec1375/step-usuario.js — Paso 3: Datos del usuario (E4324) ────────

const CAMPOS = [
  { id: "usr75Nombre",    err: "err75-usr-nombre" },
  { id: "usr75FechaNac",  err: "err75-usr-fechanac" },
  { id: "usr75Edad",      err: "err75-usr-edad" },
  { id: "usr75Direccion", err: "err75-usr-dir" },
  { id: "usr75Motivo",    err: "err75-usr-motivo" },
];

const CAMPOS_OPC = ["usr75Medico", "usr75Antecedentes", "usr75Enfermedades", "usr75Habitos"];

export function validarUsuario75() {
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

export function cargarUsuario75() {
  const raw = localStorage.getItem("ec1375_usuario");
  if (!raw) return;
  const d = JSON.parse(raw);
  [...CAMPOS.map(c => c.id), ...CAMPOS_OPC].forEach(id => {
    const el = document.getElementById(id);
    if (el && d[id] !== undefined) el.value = d[id];
  });
}

export function guardarUsuario75() {
  const datos = {};
  [...CAMPOS.map(c => c.id), ...CAMPOS_OPC].forEach(id => {
    datos[id] = document.getElementById(id)?.value.trim() || "";
  });
  localStorage.setItem("ec1375_usuario", JSON.stringify(datos));
  localStorage.setItem("ec1375_usuario_completo", "true");
  document.getElementById("nav75-usuario")?.classList.add("completed");
  document.getElementById("nav75-signos")?.classList.remove("disabled");
  window.ec1375Sync?.schedule();
}

export function initStepUsuario75() {
  window.validarUsuario75 = validarUsuario75;
  window.cargarUsuario75  = cargarUsuario75;
  window.guardarUsuario75 = guardarUsuario75;
}

export function getTemplate() {
  return `
  <section id="sec75Usuario" class="wizard-section hidden">
    <p class="paso-titulo">Paso 3 de 7 — Elemento E4324</p>
    <h1>Datos del Usuario</h1>
    <div class="card" style="max-width:860px;">
      <p style="color:#555;font-size:14px;">
        Registra la información general del usuario para integrar la ficha de atención
        conforme a la Ley Federal de Protección de Datos Personales.
      </p>

      <h3 style="font-size:14px;font-weight:700;margin-bottom:12px;">Datos generales</h3>
      <div class="form-grid">
        <div class="form-group" style="grid-column:1/-1">
          <label for="usr75Nombre">Nombre completo del usuario *</label>
          <input type="text" id="usr75Nombre" placeholder="Nombre(s) y apellidos">
          <span class="error-msg" id="err75-usr-nombre">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="usr75FechaNac">Fecha de nacimiento *</label>
          <input type="date" id="usr75FechaNac">
          <span class="error-msg" id="err75-usr-fechanac">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="usr75Edad">Edad *</label>
          <input type="number" id="usr75Edad" min="1" max="120" placeholder="Años">
          <span class="error-msg" id="err75-usr-edad">Campo requerido.</span>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label for="usr75Direccion">Dirección *</label>
          <input type="text" id="usr75Direccion" placeholder="Calle, número, colonia, municipio, estado">
          <span class="error-msg" id="err75-usr-dir">Campo requerido.</span>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label for="usr75Medico">Nombre del médico tratante / profesional de la salud</label>
          <input type="text" id="usr75Medico" placeholder="Nombre del médico (si aplica)">
        </div>
      </div>

      <h3 style="font-size:14px;font-weight:700;margin:20px 0 12px;">Antecedentes y condición de salud</h3>
      <div class="form-grid">
        <div class="form-group" style="grid-column:1/-1">
          <label for="usr75Antecedentes">Antecedentes físicos, fisiológicos y socioemocionales</label>
          <textarea id="usr75Antecedentes" rows="3"
            placeholder="Describe antecedentes relevantes: lesiones previas, cirugías, condición emocional actual…"></textarea>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label for="usr75Enfermedades">Enfermedades crónicas, degenerativas y alergias</label>
          <textarea id="usr75Enfermedades" rows="2"
            placeholder="Ej. Diabetes tipo 2, hipertensión, alergia al látex…"></textarea>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label for="usr75Habitos">Hábitos de alimentación, sueño y actividad física</label>
          <textarea id="usr75Habitos" rows="2"
            placeholder="Ej. Alimentación equilibrada, duerme 6-7 hrs, camina 30 min diarios…"></textarea>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label for="usr75Motivo">Interés / necesidad / motivo para recibir el servicio *</label>
          <textarea id="usr75Motivo" rows="3"
            placeholder="Ej. Dolor lumbar crónico, estrés laboral, recuperación post-quirúrgica…"></textarea>
          <span class="error-msg" id="err75-usr-motivo">Campo requerido.</span>
        </div>
      </div>

      <button class="btn-siguiente" id="btn75SigUsuario">Siguiente →</button>
    </div>
  </section>`;
}
