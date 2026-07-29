// ─── gce/step-ficha.js — Ficha de Registro del Candidato ─────────────────────

import { state, setDatos, getDatos, esCandidato } from "./state.js";

const FID = id => document.getElementById("gce-f-" + id);
const FVAL = id => FID(id)?.value?.trim() || "";
const FCHK = id => FID(id)?.checked || false;

// ── Template ─────────────────────────────────────────────────────────────────

export function getTemplate() {
  return `<section id="gce-paso-ficha" class="gce-paso hidden">
  <div class="wizard-section-header">
    <h2>📋 Ficha de Registro del Candidato</h2>
    <p class="wizard-section-desc">Información personal para el portafolio de evidencias ante el CONOCER.</p>
  </div>

  <form id="gce-form-ficha" oninput="window.guardarFicha()" class="gce-form" autocomplete="off">

    <div class="form-group-title">Datos personales</div>
    <div class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Nombre(s) *</label>
        <input id="gce-f-nombre" class="form-input" placeholder="Nombre(s)" maxlength="120">
      </div>
      <div class="form-group">
        <label class="form-label">Apellidos *</label>
        <input id="gce-f-apellidos" class="form-input" placeholder="Apellido paterno y materno" maxlength="120">
      </div>
      <div class="form-group">
        <label class="form-label">CURP *</label>
        <input id="gce-f-curp" class="form-input" placeholder="18 caracteres" maxlength="18" style="text-transform:uppercase">
      </div>
      <div class="form-group">
        <label class="form-label">Fecha de nacimiento</label>
        <input id="gce-f-nacimiento" type="date" class="form-input">
      </div>
      <div class="form-group">
        <label class="form-label">Género</label>
        <select id="gce-f-genero" class="form-input">
          <option value="">— Selecciona —</option>
          <option value="M">Masculino</option>
          <option value="F">Femenino</option>
          <option value="NB">No binario</option>
          <option value="NE">Prefiero no especificar</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Lugar de nacimiento</label>
        <input id="gce-f-lugar-nacimiento" class="form-input" placeholder="Ciudad, Estado">
      </div>
    </div>

    <div class="form-group-title">Contacto</div>
    <div class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Correo electrónico</label>
        <input id="gce-f-email" type="email" class="form-input" placeholder="correo@ejemplo.com">
      </div>
      <div class="form-group">
        <label class="form-label">Teléfono</label>
        <input id="gce-f-telefono" class="form-input" placeholder="10 dígitos">
      </div>
    </div>

    <div class="form-group-title">Domicilio</div>
    <div class="form-grid-2">
      <div class="form-group" style="grid-column:1/-1">
        <label class="form-label">Calle y número</label>
        <input id="gce-f-calle" class="form-input" placeholder="Av. Ejemplo 123, Int. 4">
      </div>
      <div class="form-group">
        <label class="form-label">Colonia</label>
        <input id="gce-f-colonia" class="form-input" placeholder="Colonia">
      </div>
      <div class="form-group">
        <label class="form-label">Municipio / Alcaldía</label>
        <input id="gce-f-municipio" class="form-input" placeholder="Municipio">
      </div>
      <div class="form-group">
        <label class="form-label">Estado</label>
        <input id="gce-f-estado" class="form-input" placeholder="Estado de la República">
      </div>
      <div class="form-group">
        <label class="form-label">Código postal</label>
        <input id="gce-f-cp" class="form-input" placeholder="00000" maxlength="5">
      </div>
    </div>

    <div class="form-group-title">Formación y experiencia</div>
    <div class="form-grid-2">
      <div class="form-group">
        <label class="form-label">Escolaridad</label>
        <select id="gce-f-estudios" class="form-input">
          <option value="">— Selecciona —</option>
          <option value="Primaria">Primaria</option>
          <option value="Secundaria">Secundaria</option>
          <option value="Preparatoria / Bachillerato">Preparatoria / Bachillerato</option>
          <option value="Técnico">Técnico</option>
          <option value="Licenciatura">Licenciatura</option>
          <option value="Posgrado">Posgrado</option>
        </select>
      </div>
      <div class="form-group">
        <label class="form-label">Puesto actual</label>
        <input id="gce-f-puesto" class="form-input" placeholder="Puesto o cargo que desempeña">
      </div>
      <div class="form-group">
        <label class="form-label">Años de experiencia en el área</label>
        <input id="gce-f-experiencia" class="form-input" placeholder="Ej. 3 años">
      </div>
      <div class="form-group">
        <label class="form-label">Certificaciones previas</label>
        <input id="gce-f-cert-previas" class="form-input" placeholder="Ninguna, o nombre del certificado">
      </div>
    </div>
    <div class="form-group" style="margin-top:4px">
      <label style="display:flex;align-items:center;gap:8px;cursor:pointer;font-size:13px">
        <input id="gce-f-trabaja" type="checkbox" style="width:16px;height:16px">
        Trabaja actualmente en el área de la norma
      </label>
    </div>

    <div class="form-group-title" style="margin-top:16px">Notas adicionales</div>
    <div class="form-group">
      <label class="form-label">Discapacidad (si aplica)</label>
      <input id="gce-f-discapacidad" class="form-input" placeholder="Ninguna, o descripción breve">
    </div>
    <div class="form-group">
      <label class="form-label">Observaciones</label>
      <textarea id="gce-f-observaciones" class="form-input" rows="2" placeholder="Observaciones generales…"></textarea>
    </div>
    <div class="form-group">
      <label style="display:flex;align-items:flex-start;gap:8px;cursor:pointer;font-size:13px">
        <input id="gce-f-renap" type="checkbox" style="width:16px;height:16px;margin-top:2px">
        <span>Otorgo mi consentimiento para el tratamiento de mis datos personales conforme a la legislación aplicable y al aviso de privacidad del CONOCER.</span>
      </label>
    </div>
  </form>

  <div class="wizard-nav-btns">
    <button onclick="window.gceMostrarPaso('diagnostico')" class="btn-primary">
      Siguiente → Diagnóstico
    </button>
  </div>
</section>`;
}

// ── Init / Carga / Guardado ───────────────────────────────────────────────────

export function initStepFicha() {
  cargarFicha();
  if (!esCandidato()) {
    document.querySelectorAll("#gce-form-ficha input, #gce-form-ficha select, #gce-form-ficha textarea")
      .forEach(el => el.setAttribute("disabled", "true"));
    document.querySelector("#gce-paso-ficha .wizard-nav-btns")?.remove();
  }
}

export function cargarFicha() {
  const d = getDatos("ficha_registro");
  const set  = (id, v) => { const el = FID(id); if (el) el.value = v || ""; };
  const setb = (id, v) => { const el = FID(id); if (el) el.checked = !!v; };
  set("nombre", d.nombre); set("apellidos", d.apellidos); set("curp", d.curp);
  set("nacimiento", d.fecha_nacimiento); set("genero", d.genero);
  set("lugar-nacimiento", d.lugar_nacimiento); set("email", d.email);
  set("telefono", d.telefono); set("calle", d.domicilio?.calle);
  set("colonia", d.domicilio?.colonia); set("municipio", d.domicilio?.municipio);
  set("estado", d.domicilio?.estado); set("cp", d.domicilio?.cp);
  set("estudios", d.estudios); set("puesto", d.puesto);
  set("experiencia", d.experiencia); set("cert-previas", d.certificaciones_previas);
  set("discapacidad", d.discapacidad); set("observaciones", d.observaciones);
  setb("trabaja", d.trabaja_actualmente); setb("renap", d.consentimiento_renap);
}

export function guardarFicha() {
  setDatos("ficha_registro", {
    nombre:           FVAL("nombre"),
    apellidos:        FVAL("apellidos"),
    nombre_completo:  [FVAL("nombre"), FVAL("apellidos")].filter(Boolean).join(" "),
    curp:             FVAL("curp").toUpperCase(),
    fecha_nacimiento: FVAL("nacimiento"),
    genero:           FVAL("genero"),
    lugar_nacimiento: FVAL("lugar-nacimiento"),
    email:            FVAL("email"),
    telefono:         FVAL("telefono"),
    domicilio: {
      calle: FVAL("calle"), colonia: FVAL("colonia"),
      municipio: FVAL("municipio"), estado: FVAL("estado"), cp: FVAL("cp"),
    },
    estudios:               FVAL("estudios"),
    puesto:                 FVAL("puesto"),
    experiencia:            FVAL("experiencia"),
    certificaciones_previas: FVAL("cert-previas"),
    trabaja_actualmente:    FCHK("trabaja"),
    discapacidad:           FVAL("discapacidad"),
    observaciones:          FVAL("observaciones"),
    consentimiento_renap:   FCHK("renap"),
  });
}
