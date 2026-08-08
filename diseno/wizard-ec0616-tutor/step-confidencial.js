// ─── wizard-ec0616-tutor/step-confidencial.js — Paso 2: Info Confidencial ──────

import { getDatos, setDatos, setCompleto } from "./state.js";

const SEC = "confidencial";
const _g  = id   => document.getElementById(id)?.value.trim() || "";
const _r  = name => document.querySelector(`input[name="${name}"]:checked`)?.value || "";
const _sh = (id, v) => { const e = document.getElementById(id); if (e) e.style.display = v; };

function _tog(radioName, contId) {
  _sh(contId, _r(radioName) === "si" ? "block" : "none");
}

export function cargarConfidencial() {
  const d = getDatos(SEC);
  const sv = (id, v) => { const e = document.getElementById(id); if (e && v != null) e.value = v; };
  const setR = (name, val) => {
    if (!val) return;
    const r = document.querySelector(`input[name="${name}"][value="${val}"]`);
    if (r) r.checked = true;
  };

  setR("cfLeerEscribir",  d.leer_escribir);
  setR("cfEstudios",      d.tiene_estudios);
  _tog("cfEstudios",      "cfEstudiosCont");
  sv("cfEstudiosCuales",  d.estudios_cuales);
  sv("cfUltimoGrado",     d.ultimo_grado);

  setR("cfDiscapacidad",  d.tiene_discapacidad);
  _tog("cfDiscapacidad",  "cfDiscapacidadCont");
  if (Array.isArray(d.discapacidad_tipo)) {
    d.discapacidad_tipo.forEach(t => {
      const cb = document.querySelector(`input[name="cfDiscTipo"][value="${t}"]`);
      if (cb) cb.checked = true;
    });
  }

  sv("cfIdiomas",          d.idiomas);

  setR("cfTrabaja",        d.trabaja_actualmente);
  _tog("cfTrabaja",        "cfTrabajaCont");
  sv("cfPuesto",           d.puesto_trabajo);
  sv("cfEmpresaTrabajo",   d.empresa_trabajo);
  sv("cfDireccionTrabajo", d.direccion_trabajo);
  sv("cfTelTrabajo",       d.telefono_trabajo);

  sv("cfEmp1", d.exp1_empresa); sv("cfPer1", d.exp1_periodo); sv("cfAct1", d.exp1_actividades);
  sv("cfEmp2", d.exp2_empresa); sv("cfPer2", d.exp2_periodo); sv("cfAct2", d.exp2_actividades);
  sv("cfEmp3", d.exp3_empresa); sv("cfPer3", d.exp3_periodo); sv("cfAct3", d.exp3_actividades);

  sv("cfObservaciones",     d.observaciones);
  setR("cfCertificacion",   d.tiene_certificacion);
  _tog("cfCertificacion",   "cfCertCont");
  sv("cfCertCuales",        d.certificacion_cuales);
}

export function guardarConfidencial() {
  const discTipos = [...document.querySelectorAll('input[name="cfDiscTipo"]:checked')].map(cb => cb.value);
  setDatos(SEC, {
    leer_escribir:        _r("cfLeerEscribir"),
    tiene_estudios:       _r("cfEstudios"),
    estudios_cuales:      _g("cfEstudiosCuales"),
    ultimo_grado:         _g("cfUltimoGrado"),
    tiene_discapacidad:   _r("cfDiscapacidad"),
    discapacidad_tipo:    discTipos,
    idiomas:              _g("cfIdiomas"),
    trabaja_actualmente:  _r("cfTrabaja"),
    puesto_trabajo:       _g("cfPuesto"),
    empresa_trabajo:      _g("cfEmpresaTrabajo"),
    direccion_trabajo:    _g("cfDireccionTrabajo"),
    telefono_trabajo:     _g("cfTelTrabajo"),
    exp1_empresa: _g("cfEmp1"), exp1_periodo: _g("cfPer1"), exp1_actividades: _g("cfAct1"),
    exp2_empresa: _g("cfEmp2"), exp2_periodo: _g("cfPer2"), exp2_actividades: _g("cfAct2"),
    exp3_empresa: _g("cfEmp3"), exp3_periodo: _g("cfPer3"), exp3_actividades: _g("cfAct3"),
    observaciones:        _g("cfObservaciones"),
    tiene_certificacion:  _r("cfCertificacion"),
    certificacion_cuales: _g("cfCertCuales"),
  });
  setCompleto(SEC);
  document.getElementById("navT-confidencial")?.classList.add("completed");
  window.desbloquearT?.("navT-diagnostico");
  window.mostrarSeccionT?.("secTDiagnostico");
}

export function initStepConfidencial() {
  cargarConfidencial();

  const onRadio = (name, contId) =>
    document.querySelectorAll(`input[name="${name}"]`).forEach(r =>
      r.addEventListener("change", () => _tog(name, contId))
    );

  onRadio("cfEstudios",      "cfEstudiosCont");
  onRadio("cfDiscapacidad",  "cfDiscapacidadCont");
  onRadio("cfTrabaja",       "cfTrabajaCont");
  onRadio("cfCertificacion", "cfCertCont");

  document.getElementById("btnCFSig")?.addEventListener("click", guardarConfidencial);
  window.guardarConfidencial = guardarConfidencial;
}

export function getTemplate() {
  const radioSiNo = name => `
    <div style="display:flex;gap:20px;margin-top:6px;">
      <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;">
        <input type="radio" name="${name}" value="si"> Sí
      </label>
      <label style="display:flex;align-items:center;gap:6px;font-size:13px;cursor:pointer;">
        <input type="radio" name="${name}" value="no"> No
      </label>
    </div>`;

  const empleo = n => `
    <div style="border:1px solid #e5e7eb;border-radius:8px;padding:12px;margin-bottom:10px;">
      <p style="font-size:12px;font-weight:700;color:#6b7280;margin:0 0 8px;">Empleo ${n}</p>
      <div class="form-grid">
        <div class="form-group">
          <label for="cfEmp${n}">Empresa</label>
          <input type="text" id="cfEmp${n}" placeholder="Nombre de la empresa">
        </div>
        <div class="form-group">
          <label for="cfPer${n}">Periodo</label>
          <input type="text" id="cfPer${n}" placeholder="Ej. 2020–2022">
        </div>
        <div class="form-group full-width">
          <label for="cfAct${n}">Actividades realizadas</label>
          <textarea id="cfAct${n}" rows="2" placeholder="Describe brevemente las actividades…"></textarea>
        </div>
      </div>
    </div>`;

  return `
  <section id="secTConfidencial" class="wizard-section hidden">
    <p class="paso-titulo">Paso 2 de 12</p>
    <h1>Información Confidencial</h1>
    <div class="card" style="max-width:860px;">
      <p style="font-size:13px;color:#6b7280;margin:0 0 16px;">Datos confidenciales del candidato. Solo el evaluador y el CE tienen acceso a esta sección.</p>

      <div class="form-group" style="margin-bottom:14px;">
        <label style="font-size:13px;font-weight:600;">¿Sabe leer y escribir?</label>
        ${radioSiNo("cfLeerEscribir")}
      </div>

      <div class="form-group" style="margin-bottom:6px;">
        <label style="font-size:13px;font-weight:600;">¿Cuenta con estudios?</label>
        ${radioSiNo("cfEstudios")}
      </div>
      <div id="cfEstudiosCont" style="display:none;margin:8px 0 14px 16px;">
        <div class="form-grid">
          <div class="form-group">
            <label for="cfEstudiosCuales">¿Cuáles estudios?</label>
            <input type="text" id="cfEstudiosCuales" placeholder="Ej. Enfermería técnica">
          </div>
          <div class="form-group">
            <label for="cfUltimoGrado">Último grado cursado</label>
            <select id="cfUltimoGrado">
              <option value="">— Seleccionar —</option>
              <option>Primaria</option><option>Secundaria</option>
              <option>Preparatoria / Bachillerato</option><option>Técnico</option>
              <option>Licenciatura</option><option>Especialidad</option>
              <option>Maestría</option><option>Doctorado</option>
            </select>
          </div>
        </div>
      </div>

      <div class="form-group" style="margin-bottom:6px;">
        <label style="font-size:13px;font-weight:600;">¿Tiene algún tipo de discapacidad?</label>
        ${radioSiNo("cfDiscapacidad")}
      </div>
      <div id="cfDiscapacidadCont" style="display:none;margin:8px 0 14px 16px;">
        <label style="font-size:13px;font-weight:600;display:block;margin-bottom:6px;">Tipo de discapacidad</label>
        <div style="display:flex;flex-wrap:wrap;gap:10px;">
          ${["motriz","visual","auditiva","lenguaje","intelectual","otras"].map(t =>
            `<label style="display:flex;align-items:center;gap:5px;font-size:13px;cursor:pointer;">
              <input type="checkbox" name="cfDiscTipo" value="${t}">
              ${t.charAt(0).toUpperCase() + t.slice(1)}
            </label>`).join("")}
        </div>
      </div>

      <div class="form-group" style="margin-bottom:14px;">
        <label for="cfIdiomas" style="font-size:13px;font-weight:600;">¿Qué idiomas o lenguas habla?</label>
        <input type="text" id="cfIdiomas" placeholder="Ej. Español, Inglés, Náhuatl" style="margin-top:6px;">
      </div>

      <div class="form-group" style="margin-bottom:6px;">
        <label style="font-size:13px;font-weight:600;">¿Trabaja actualmente?</label>
        ${radioSiNo("cfTrabaja")}
      </div>
      <div id="cfTrabajaCont" style="display:none;margin:8px 0 14px 16px;">
        <div class="form-grid">
          <div class="form-group">
            <label for="cfPuesto">Puesto de trabajo</label>
            <input type="text" id="cfPuesto" placeholder="Ej. Auxiliar de Enfermería">
          </div>
          <div class="form-group">
            <label for="cfEmpresaTrabajo">Empresa / Institución</label>
            <input type="text" id="cfEmpresaTrabajo" placeholder="Nombre del empleador">
          </div>
          <div class="form-group">
            <label for="cfDireccionTrabajo">Dirección del centro de trabajo</label>
            <input type="text" id="cfDireccionTrabajo" placeholder="Dirección completa">
          </div>
          <div class="form-group">
            <label for="cfTelTrabajo">Teléfono del centro de trabajo</label>
            <input type="tel" id="cfTelTrabajo" placeholder="Teléfono">
          </div>
        </div>
      </div>

      <h3 style="font-size:14px;color:#374151;margin:4px 0 10px;">Experiencia Laboral (últimos 3 empleos)</h3>
      ${empleo(1)}${empleo(2)}${empleo(3)}

      <div class="form-group" style="margin:14px 0;">
        <label for="cfObservaciones">Observaciones generales</label>
        <textarea id="cfObservaciones" rows="3" placeholder="Observaciones adicionales sobre el candidato…"></textarea>
      </div>

      <div class="form-group" style="margin-bottom:6px;">
        <label style="font-size:13px;font-weight:600;">¿Cuenta con alguna certificación previa?</label>
        ${radioSiNo("cfCertificacion")}
      </div>
      <div id="cfCertCont" style="display:none;margin:8px 0 14px 16px;">
        <div class="form-group">
          <label for="cfCertCuales">¿Cuáles certificaciones?</label>
          <textarea id="cfCertCuales" rows="2" placeholder="Nombre(s) de la(s) certificación(es) obtenida(s)…"></textarea>
        </div>
      </div>

      <button class="btn-siguiente" id="btnCFSig" style="margin-top:4px;">Siguiente →</button>
    </div>
  </section>`;
}
