// ─── wizard-ec1375/step-consentimiento.js — Paso 5: Técnica y consentimiento ──

const CAMPOS = [
  { id: "con75Tecnica",      err: "err75-con-tecnica" },
  { id: "con75Descripcion",  err: "err75-con-desc" },
  { id: "con75Reacciones",   err: "err75-con-reac" },
  { id: "con75Objetivo",     err: "err75-con-obj" },
  { id: "con75Vestimenta",   err: null },
  { id: "con75NumSesiones",  err: null },
  { id: "con75Duracion",     err: null },
];

export function validarConsentimiento75() {
  const reqs = CAMPOS.filter(c => c.err);
  let ok = true; let primero = null;
  reqs.forEach(({ id, err }) => {
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

export function cargarConsentimiento75() {
  const raw = localStorage.getItem("ec1375_consentimiento");
  if (!raw) return;
  const d = JSON.parse(raw);
  CAMPOS.forEach(({ id }) => {
    const el = document.getElementById(id);
    if (el && d[id] !== undefined) el.value = d[id];
  });
  _actualizarPreview();
}

export function guardarConsentimiento75() {
  const datos = {};
  CAMPOS.forEach(({ id }) => { datos[id] = document.getElementById(id)?.value.trim() || ""; });
  localStorage.setItem("ec1375_consentimiento", JSON.stringify(datos));
  localStorage.setItem("ec1375_consentimiento_completo", "true");
  document.getElementById("nav75-consentimiento")?.classList.add("completed");
  document.getElementById("nav75-seguimiento")?.classList.remove("disabled");
  window.ec1375Sync?.schedule();
}

function _actualizarPreview() {
  const tecnica  = document.getElementById("con75Tecnica")?.value  || "[Técnica]";
  const desc     = document.getElementById("con75Descripcion")?.value || "[Descripción]";
  const obj      = document.getElementById("con75Objetivo")?.value  || "[Objetivo]";
  const reac     = document.getElementById("con75Reacciones")?.value || "[Reacciones]";
  const vest     = document.getElementById("con75Vestimenta")?.value || "[Vestimenta]";
  const nsesiones = document.getElementById("con75NumSesiones")?.value || "—";
  const dur      = document.getElementById("con75Duracion")?.value  || "—";

  const rawUs = localStorage.getItem("ec1375_usuario");
  const us    = rawUs ? JSON.parse(rawUs) : {};
  const rawAx = localStorage.getItem("ec1375_datos");
  const ax    = rawAx ? JSON.parse(rawAx) : {};
  const rawFe = localStorage.getItem("ec1375_datos");
  const fecha = ax.aux75Fecha || new Date().toLocaleDateString("es-MX");

  const preview = document.getElementById("con75Preview");
  if (!preview) return;
  preview.innerHTML = `
    <p style="font-size:12px;color:#555;margin-bottom:12px;"><strong>Vista previa — Carta de Consentimiento Informado</strong></p>
    <div style="font-size:12px;line-height:1.8;color:#333;">
      <p>Fecha: <strong>${fecha}</strong></p>
      <p>Yo, <strong>${us.usr75Nombre || "[Nombre del usuario]"}</strong>, manifiesto haber recibido
      información clara sobre el servicio de <strong>${tecnica}</strong>, el cual consiste en:
      <em>${desc}</em></p>
      <p><strong>Objetivo de la sesión:</strong> ${obj}</p>
      <p><strong>Posibles reacciones / sensaciones:</strong> ${reac}</p>
      <p><strong>Vestimenta recomendada:</strong> ${vest}</p>
      <p><strong>Plan de sesiones:</strong> ${nsesiones} sesiones de ${dur} minutos c/u.</p>
      <p>Entiendo que los servicios tradicionales y complementarios no cubren ni sustituyen las
      indicaciones del médico tratante/profesional de la salud.</p>
      <p>Autorizo la realización del servicio y la toma de mis datos conforme a la Ley Federal
      de Protección de Datos Personales en Posesión de Particulares.</p>
      <p style="margin-top:16px;">_________________________<br>Firma del usuario</p>
      <p>Auxiliar: <strong>${[ax.aux75Nombre, ax.aux75Apellidos].filter(Boolean).join(" ") || "[Auxiliar]"}</strong></p>
    </div>`;
}

export function initStepConsentimiento75() {
  window.validarConsentimiento75 = validarConsentimiento75;
  window.cargarConsentimiento75  = cargarConsentimiento75;
  window.guardarConsentimiento75 = guardarConsentimiento75;

  document.addEventListener("input", e => {
    if (CAMPOS.some(c => c.id === e.target?.id)) _actualizarPreview();
  });
}

export function getTemplate() {
  return `
  <section id="sec75Consentimiento" class="wizard-section hidden">
    <p class="paso-titulo">Paso 5 de 7 — Elemento E4325</p>
    <h1>Técnica y Consentimiento Informado</h1>
    <div class="card" style="max-width:900px;">
      <p style="color:#555;font-size:14px;">
        Registra la técnica que aplicará el especialista y el contenido del consentimiento
        informado. La carta se generará automáticamente con los datos capturados.
      </p>

      <div class="form-grid">
        <div class="form-group">
          <label for="con75Tecnica">Técnica designada *</label>
          <input type="text" id="con75Tecnica"
            placeholder="Ej. Masaje holístico, terapia de puntos de presión, temazcal…">
          <span class="error-msg" id="err75-con-tecnica">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="con75Vestimenta">Vestimenta recomendada</label>
          <input type="text" id="con75Vestimenta"
            placeholder="Ej. Ropa cómoda y holgada, sin accesorios metálicos">
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label for="con75Descripcion">Descripción de la técnica y sus bondades *</label>
          <textarea id="con75Descripcion" rows="3"
            placeholder="Describe en qué consiste la técnica, sus beneficios y alcance…"></textarea>
          <span class="error-msg" id="err75-con-desc">Campo requerido.</span>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label for="con75Objetivo">Objetivo a alcanzar *</label>
          <textarea id="con75Objetivo" rows="2"
            placeholder="Ej. Reducir la tensión muscular lumbar y mejorar la movilidad articular…"></textarea>
          <span class="error-msg" id="err75-con-obj">Campo requerido.</span>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label for="con75Reacciones">Posibles reacciones / sensaciones durante y después *</label>
          <textarea id="con75Reacciones" rows="2"
            placeholder="Ej. Leve sensación de calor, somnolencia, ligera molestia en zonas de tensión…"></textarea>
          <span class="error-msg" id="err75-con-reac">Campo requerido.</span>
        </div>
        <div class="form-group">
          <label for="con75NumSesiones">Número de sesiones recomendadas</label>
          <input type="number" id="con75NumSesiones" min="1" max="100" placeholder="Ej. 6">
        </div>
        <div class="form-group">
          <label for="con75Duracion">Duración por sesión (minutos)</label>
          <input type="number" id="con75Duracion" min="10" max="240" placeholder="Ej. 60">
        </div>
      </div>

      <div class="ia-box-75" style="margin-top:24px;">
        <div class="ia-header">📄 Vista previa — Carta de Consentimiento Informado</div>
        <div id="con75Preview" style="padding:12px;background:#f9fafb;border-radius:8px;min-height:120px;font-size:12px;color:#555;line-height:1.7;">
          <em>Completa los campos arriba para ver la vista previa del consentimiento…</em>
        </div>
      </div>

      <button class="btn-siguiente" id="btn75SigConsentimiento" style="margin-top:20px;">Siguiente →</button>
    </div>
  </section>`;
}
