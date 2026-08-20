// ─── wizard-ec0616-tutor/step-ficha.js — Paso 1: Ficha de Registro ────────────

import { getDatos, setDatos, setCompleto } from "./state.js";

const SEC = "ficha";
const _g  = id   => document.getElementById(id)?.value.trim() || "";
const _r  = name => document.querySelector(`input[name="${name}"]:checked`)?.value || "";
const _sh = (id, v) => { const e = document.getElementById(id); if (e) e.style.display = v; };

const _ENT = ["Aguascalientes","Baja California","Baja California Sur","Campeche","Chiapas",
  "Chihuahua","Ciudad de México","Coahuila","Colima","Durango","Estado de México",
  "Guanajuato","Guerrero","Hidalgo","Jalisco","Michoacán","Morelos","Nayarit",
  "Nuevo León","Oaxaca","Puebla","Querétaro","Quintana Roo","San Luis Potosí",
  "Sinaloa","Sonora","Tabasco","Tamaulipas","Tlaxcala","Veracruz","Yucatán","Zacatecas"];

const _REQ = [
  { id: "ftNombre",    err: "err-ft-nombre" },
  { id: "ftApellidoP", err: "err-ft-apellido" },
  { id: "ftCURP",      err: "err-ft-curp" },
  { id: "ftFechaNac",  err: "err-ft-fechanac" },
  { id: "ftLugarNac",  err: "err-ft-lugar" },
  { id: "ftEmail",     err: "err-ft-email" },
  { id: "ftTelefono",  err: "err-ft-tel" },
  { id: "ftEvaluador", err: "err-ft-evaluador" },
  { id: "ftCE",        err: "err-ft-ce" },
  { id: "ftFechaEval", err: "err-ft-fechaeval" },
];

export function validarFicha() {
  let ok = true;
  _REQ.forEach(({ id, err }) => {
    const vacio = !document.getElementById(id)?.value.trim();
    document.getElementById(id)?.classList.toggle("error", vacio);
    _sh(err, vacio ? "block" : "none");
    if (vacio) ok = false;
  });
  if (!_r("ftGenero"))         { _sh("err-ft-genero", "block"); ok = false; }
  else                         { _sh("err-ft-genero", "none"); }
  if (!_r("ftConsentimiento")) { _sh("err-ft-cons", "block"); ok = false; }
  else                         { _sh("err-ft-cons", "none"); }
  return ok;
}

export function cargarFicha() {
  const d = getDatos(SEC);
  const sv = (id, v) => { const e = document.getElementById(id); if (e && v != null) e.value = v; };
  sv("ftNombre",       d.nombre_candidato);
  sv("ftApellidoP",    d.apellido_paterno);
  sv("ftApellidoM",    d.apellido_materno);
  sv("ftCURP",         d.curp);
  sv("ftFechaNac",     d.fecha_nacimiento);
  sv("ftLugarNac",     d.lugar_nacimiento);
  sv("ftNacionalidad", d.nacionalidad || "Mexicana");
  sv("ftCalle",        d.domicilio_calle);
  sv("ftNumero",       d.domicilio_numero);
  sv("ftCP",           d.domicilio_cp);
  sv("ftColonia",      d.domicilio_colonia);
  sv("ftCiudad",       d.domicilio_ciudad);
  sv("ftEntidad",      d.domicilio_entidad);
  sv("ftEmail",        d.email);
  sv("ftTelefono",     d.telefono);
  sv("ftEvaluador",    d.nombre_evaluador);
  sv("ftCE",           d.nombre_ce);
  sv("ftFechaEval",    d.fecha_evaluacion);
  if (d.genero) {
    const r = document.querySelector(`input[name="ftGenero"][value="${d.genero}"]`);
    if (r) r.checked = true;
  }
  if (d.consentimiento_renap) {
    const r = document.querySelector(`input[name="ftConsentimiento"][value="${d.consentimiento_renap}"]`);
    if (r) r.checked = true;
  }
  if (d.foto_base64) _mostrarFotoPreview(d.foto_base64);
}

export function guardarFicha() {
  if (!validarFicha()) return;
  const apP = _g("ftApellidoP"), apM = _g("ftApellidoM");
  const fotoPrev = getDatos(SEC).foto_base64 || "";
  setDatos(SEC, {
    nombre_candidato:    _g("ftNombre"),
    apellido_paterno:    apP,
    apellido_materno:    apM,
    apellidos_candidato: [apP, apM].filter(Boolean).join(" "),
    curp:                _g("ftCURP").toUpperCase(),
    fecha_nacimiento:    _g("ftFechaNac"),
    genero:              _r("ftGenero"),
    lugar_nacimiento:    _g("ftLugarNac"),
    nacionalidad:        _g("ftNacionalidad") || "Mexicana",
    domicilio_calle:     _g("ftCalle"),
    domicilio_numero:    _g("ftNumero"),
    domicilio_cp:        _g("ftCP"),
    domicilio_colonia:   _g("ftColonia"),
    domicilio_ciudad:    _g("ftCiudad"),
    domicilio_entidad:   _g("ftEntidad"),
    email:               _g("ftEmail"),
    telefono:            _g("ftTelefono"),
    nombre_evaluador:    _g("ftEvaluador"),
    nombre_ce:           _g("ftCE"),
    fecha_evaluacion:    _g("ftFechaEval"),
    consentimiento_renap:_r("ftConsentimiento"),
    foto_base64:         fotoPrev,
  });
  setCompleto(SEC);
  document.getElementById("navT-ficha")?.classList.add("completed");
  window.desbloquearT?.("navT-confidencial");
  window.mostrarSeccionT?.("secTConfidencial");
}

function _mostrarFotoPreview(b64) {
  const el = document.getElementById("ft-foto-preview");
  if (el) el.innerHTML = `<img src="${b64}" style="width:100%;height:100%;object-fit:cover;">`;
}

function _redimensionarFoto(file, cb) {
  const reader = new FileReader();
  reader.onload = ev => {
    const img = new Image();
    img.onload = () => {
      const MAX_W = 400, MAX_H = 500;
      let [w, h] = [img.width, img.height];
      if (w / h > MAX_W / MAX_H) { w = MAX_W; h = Math.round(img.height * MAX_W / img.width); }
      else { h = MAX_H; w = Math.round(img.width * MAX_H / img.height); }
      const c = document.createElement("canvas");
      c.width = w; c.height = h;
      c.getContext("2d").drawImage(img, 0, 0, w, h);
      cb(c.toDataURL("image/jpeg", 0.85));
    };
    img.src = ev.target.result;
  };
  reader.readAsDataURL(file);
}

export function initStepFicha() {
  cargarFicha();
  document.getElementById("ftCURP")?.addEventListener("input", e => {
    e.target.value = e.target.value.toUpperCase();
  });
  document.getElementById("btnFTSig")?.addEventListener("click", guardarFicha);
  window.guardarFicha = guardarFicha;
  document.getElementById("ftFoto")?.addEventListener("change", e => {
    const file = e.target.files[0];
    if (file) _redimensionarFoto(file, b64 => {
      const d = getDatos(SEC); d.foto_base64 = b64; setDatos(SEC, d);
      _mostrarFotoPreview(b64);
    });
  });
}

export function getTemplate() {
  const entOpts = _ENT.map(e => `<option>${e}</option>`).join("");
  const radio2 = (name, v1, l1, v2, l2) => `
    <div style="display:flex;gap:20px;margin-top:6px;">
      <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;">
        <input type="radio" name="${name}" value="${v1}"> ${l1}
      </label>
      <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;">
        <input type="radio" name="${name}" value="${v2}"> ${l2}
      </label>
    </div>`;
  return `
  <section id="secTFicha" class="wizard-section hidden">
    <p class="paso-titulo">Paso 1 de 12</p>
    <h1>Ficha de Registro</h1>
    <div class="card" style="max-width:860px;">
      <p style="font-size:13px;color:#6b7280;margin:0 0 14px;">Datos del candidato a certificarse en EC0616.</p>

      <h3 style="font-size:14px;color:#374151;margin:0 0 10px;">Consentimiento RENAP</h3>
      <div class="form-group" style="margin-bottom:16px;">
        <label style="font-size:13px;font-weight:600;">¿Otorga consentimiento para el tratamiento de datos personales? *</label>
        ${radio2("ftConsentimiento","si","Sí","no","No")}
        <span class="error-msg" id="err-ft-cons">Campo requerido.</span>
      </div>

      <h3 style="font-size:14px;color:#374151;margin:16px 0 10px;">Fotografía del Candidato</h3>
      <div class="form-group" style="margin-bottom:16px;">
        <label style="font-size:13px;font-weight:600;">Foto reciente (obligatoria para generar el portafolio)</label>
        <div style="display:flex;gap:16px;align-items:flex-start;margin-top:8px;">
          <div id="ft-foto-preview" style="width:100px;height:130px;border:2px dashed #d1d5db;
               border-radius:6px;display:flex;align-items:center;justify-content:center;
               background:#f9fafb;overflow:hidden;flex-shrink:0;">
            <span style="font-size:11px;color:#9ca3af;text-align:center;line-height:1.4;">Sin<br>foto</span>
          </div>
          <div>
            <input type="file" id="ftFoto" accept="image/*" style="font-size:13px;">
            <p style="font-size:11px;color:#9ca3af;margin-top:6px;line-height:1.4;">
              Formatos: JPG, PNG, WEBP. Se redimensionará a 400×500 px.
            </p>
          </div>
        </div>
      </div>

      <h3 style="font-size:14px;color:#374151;margin:0 0 10px;">Datos Personales</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="ftNombre">Nombre(s) *</label>
          <input type="text" id="ftNombre" placeholder="Nombre(s) del candidato">
          <span class="error-msg" id="err-ft-nombre">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="ftApellidoP">Apellido paterno *</label>
          <input type="text" id="ftApellidoP" placeholder="Primer apellido">
          <span class="error-msg" id="err-ft-apellido">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="ftApellidoM">Apellido materno</label>
          <input type="text" id="ftApellidoM" placeholder="Segundo apellido (opcional)">
        </div>
        <div class="form-group">
          <label for="ftCURP">CURP *</label>
          <input type="text" id="ftCURP" placeholder="18 caracteres" maxlength="18" style="text-transform:uppercase">
          <span class="error-msg" id="err-ft-curp">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="ftFechaNac">Fecha de nacimiento *</label>
          <input type="date" id="ftFechaNac">
          <span class="error-msg" id="err-ft-fechanac">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label>Género *</label>
          ${radio2("ftGenero","H","Hombre","M","Mujer")}
          <span class="error-msg" id="err-ft-genero">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="ftLugarNac">Lugar de nacimiento *</label>
          <input type="text" id="ftLugarNac" placeholder="Ciudad, Estado, País">
          <span class="error-msg" id="err-ft-lugar">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="ftNacionalidad">Nacionalidad</label>
          <input type="text" id="ftNacionalidad" value="Mexicana">
        </div>
      </div>

      <h3 style="font-size:14px;color:#374151;margin:16px 0 10px;">Domicilio</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="ftCalle">Calle</label>
          <input type="text" id="ftCalle" placeholder="Nombre de la calle">
        </div>
        <div class="form-group">
          <label for="ftNumero">Número</label>
          <input type="text" id="ftNumero" placeholder="Ext. / Int.">
        </div>
        <div class="form-group">
          <label for="ftCP">Código postal</label>
          <input type="text" id="ftCP" placeholder="5 dígitos" maxlength="5">
        </div>
        <div class="form-group">
          <label for="ftColonia">Colonia</label>
          <input type="text" id="ftColonia" placeholder="Colonia o fraccionamiento">
        </div>
        <div class="form-group">
          <label for="ftCiudad">Municipio / Ciudad</label>
          <input type="text" id="ftCiudad" placeholder="Municipio o alcaldía">
        </div>
        <div class="form-group">
          <label for="ftEntidad">Entidad federativa</label>
          <select id="ftEntidad"><option value="">— Seleccionar —</option>${entOpts}</select>
        </div>
      </div>

      <h3 style="font-size:14px;color:#374151;margin:16px 0 10px;">Contacto</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="ftEmail">Correo electrónico *</label>
          <input type="email" id="ftEmail" placeholder="correo@ejemplo.com">
          <span class="error-msg" id="err-ft-email">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="ftTelefono">Teléfono celular *</label>
          <input type="tel" id="ftTelefono" placeholder="10 dígitos" maxlength="10">
          <span class="error-msg" id="err-ft-tel">Campo requerido.</span>
        </div>
      </div>

      <h3 style="font-size:14px;color:#374151;margin:16px 0 10px;">Datos de Evaluación</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="ftEvaluador">Nombre del evaluador *</label>
          <input type="text" id="ftEvaluador" placeholder="Nombre completo del evaluador">
          <span class="error-msg" id="err-ft-evaluador">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="ftCE">Centro de Evaluación *</label>
          <input type="text" id="ftCE" placeholder="Nombre del CE">
          <span class="error-msg" id="err-ft-ce">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="ftFechaEval">Fecha de evaluación *</label>
          <input type="date" id="ftFechaEval">
          <span class="error-msg" id="err-ft-fechaeval">Campo requerido.</span>
        </div>
      </div>

      <button class="btn-siguiente" id="btnFTSig" style="margin-top:20px;">Siguiente →</button>
    </div>
  </section>`;
}
