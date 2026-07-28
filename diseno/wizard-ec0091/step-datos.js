// ─── wizard-ec0091/step-datos.js — Paso 1: Datos de la verificación ──────────

const CAMPOS = [
  { id: "oc91NombreOrganismo",   err: "err91-oc-nombre" },
  { id: "oc91Clave",             err: "err91-oc-clave" },
  { id: "ve91Nombre",            err: "err91-ve-nombre" },
  { id: "ve91NoCert",            err: "err91-ve-cert" },
  { id: "ent91Nombre",           err: "err91-ent-nombre" },
  { id: "ent91Clave",            err: "err91-ent-clave" },
  { id: "resp91Nombre",          err: "err91-resp-nombre" },
  { id: "resp91Cargo",           err: "err91-resp-cargo" },
  { id: "fecha91Verificacion",   err: "err91-fecha" },
];

export function validarDatos91() {
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

export function cargarDatos91() {
  const raw = localStorage.getItem("ec0091_datos");
  if (!raw) return;
  const d = JSON.parse(raw);
  CAMPOS.forEach(({ id }) => { const el = document.getElementById(id); if (el && d[id] !== undefined) el.value = d[id]; });
  const tipoEl = document.getElementById("ent91Tipo");
  if (tipoEl && d.ent91Tipo) tipoEl.value = d.ent91Tipo;
}

export function guardarDatos91() {
  const datos = {};
  CAMPOS.forEach(({ id }) => { datos[id] = document.getElementById(id)?.value.trim() || ""; });
  datos.ent91Tipo = document.getElementById("ent91Tipo")?.value || "CE";
  localStorage.setItem("ec0091_datos", JSON.stringify(datos));
  localStorage.setItem("ec0091_datos_completo", "true");
  document.getElementById("nav91-datos")?.classList.add("completed");
  document.getElementById("nav91-objetivo")?.classList.remove("disabled");
  document.getElementById("wiz-nav-curso")?.textContent !== undefined &&
    (document.getElementById("wiz-nav-curso").textContent = datos.oc91NombreOrganismo || "");
  window.ec0091Sync?.schedule();
}

export function initStepDatos91() {
  window.validarDatos91 = validarDatos91;
  window.cargarDatos91  = cargarDatos91;
  window.guardarDatos91 = guardarDatos91;
}

export function getTemplate() {
  return `
  <section id="sec91Datos" class="wizard-section">
    <p class="paso-titulo">Paso 1 de 13</p>
    <h1>Datos de la Verificación</h1>
    <div class="card" style="max-width:800px;">

      <h3 style="color:#1a4a6b;margin-top:0;">Organismo Certificador (OC)</h3>
      <div class="form-grid">
        <div class="form-group full-width">
          <label for="oc91NombreOrganismo">Nombre del Organismo Certificador *</label>
          <input type="text" id="oc91NombreOrganismo" placeholder="Ej. CONOCER — Consejo Nacional de Normalización">
          <span class="error-msg" id="err91-oc-nombre">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="oc91Clave">Clave del OC *</label>
          <input type="text" id="oc91Clave" placeholder="Ej. OC-001">
          <span class="error-msg" id="err91-oc-clave">Campo requerido.</span>
        </div>
      </div>

      <h3 style="color:#1a4a6b;margin-top:20px;">Verificador Externo (VE)</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="ve91Nombre">Nombre completo del VE *</label>
          <input type="text" id="ve91Nombre" placeholder="Nombre y apellidos">
          <span class="error-msg" id="err91-ve-nombre">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="ve91NoCert">No. de certificación del VE *</label>
          <input type="text" id="ve91NoCert" placeholder="Ej. VE-2024-001">
          <span class="error-msg" id="err91-ve-cert">Campo requerido.</span>
        </div>
      </div>

      <h3 style="color:#1a4a6b;margin-top:20px;">Entidad a Verificar</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="ent91Tipo">Tipo de entidad *</label>
          <select id="ent91Tipo">
            <option value="CE">Centro de Evaluación (CE)</option>
            <option value="EI">Evaluador Independiente (EI)</option>
          </select>
        </div>
        <div class="form-group">
          <label for="ent91Nombre">Nombre de la entidad *</label>
          <input type="text" id="ent91Nombre" placeholder="Nombre del CE o EI">
          <span class="error-msg" id="err91-ent-nombre">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="ent91Clave">Clave del CE/EI *</label>
          <input type="text" id="ent91Clave" placeholder="Ej. CE-0001">
          <span class="error-msg" id="err91-ent-clave">Campo requerido.</span>
        </div>
      </div>

      <h3 style="color:#1a4a6b;margin-top:20px;">Responsable que Recibe</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="resp91Nombre">Nombre del responsable *</label>
          <input type="text" id="resp91Nombre" placeholder="Quien recibe al VE">
          <span class="error-msg" id="err91-resp-nombre">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="resp91Cargo">Cargo *</label>
          <input type="text" id="resp91Cargo" placeholder="Ej. Director del Centro">
          <span class="error-msg" id="err91-resp-cargo">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="fecha91Verificacion">Fecha de la verificación *</label>
          <input type="date" id="fecha91Verificacion">
          <span class="error-msg" id="err91-fecha">Campo requerido.</span>
        </div>
      </div>

      <button class="btn-siguiente" id="btn91SigDatos">Siguiente →</button>
    </div>
  </section>`;
}
