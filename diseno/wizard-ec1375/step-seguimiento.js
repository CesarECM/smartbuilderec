// ─── wizard-ec1375/step-seguimiento.js — Paso 6: Plan de seguimiento (E4326) ──

const CAMPOS = [
  "seg75ContactoVia", "seg75Contacto", "seg75NumSesiones",
  "seg75Frecuencia",  "seg75Duracion", "seg75ObjetivoSesion",
  "seg75TareasEnCasa", "seg75Recomendaciones",
];

export function cargarSeguimiento75() {
  const raw = localStorage.getItem("ec1375_seguimiento");
  if (!raw) return;
  const d = JSON.parse(raw);
  CAMPOS.forEach(id => {
    const el = document.getElementById(id);
    if (el && d[id] !== undefined) el.value = d[id];
  });
}

export function guardarSeguimiento75() {
  const datos = {};
  CAMPOS.forEach(id => { datos[id] = document.getElementById(id)?.value.trim() || ""; });
  localStorage.setItem("ec1375_seguimiento", JSON.stringify(datos));
  localStorage.setItem("ec1375_seguimiento_completo", "true");
  document.getElementById("nav75-seguimiento")?.classList.add("completed");
  document.getElementById("nav75-expediente")?.classList.remove("disabled");
  window.ec1375Sync?.schedule();
}

export function initStepSeguimiento75() {
  window.cargarSeguimiento75  = cargarSeguimiento75;
  window.guardarSeguimiento75 = guardarSeguimiento75;
}

export function getTemplate() {
  return `
  <section id="sec75Seguimiento" class="wizard-section hidden">
    <p class="paso-titulo">Paso 6 de 7 — Elemento E4326</p>
    <h1>Plan de Seguimiento</h1>
    <div class="card" style="max-width:860px;">
      <p style="color:#555;font-size:14px;">
        Acuerda con el usuario el programa de seguimiento, las vías de contacto y las
        actividades en casa para reforzar la atención recibida.
      </p>

      <h3 style="font-size:14px;font-weight:700;margin-bottom:12px;">Datos del plan</h3>
      <div class="form-grid">
        <div class="form-group">
          <label for="seg75NumSesiones">Número total de sesiones programadas</label>
          <input type="number" id="seg75NumSesiones" min="1" max="100" placeholder="Ej. 8">
        </div>
        <div class="form-group">
          <label for="seg75Frecuencia">Frecuencia de sesiones</label>
          <input type="text" id="seg75Frecuencia" placeholder="Ej. 1 vez por semana">
        </div>
        <div class="form-group">
          <label for="seg75Duracion">Duración por sesión (minutos)</label>
          <input type="number" id="seg75Duracion" min="10" max="240" placeholder="Ej. 60">
        </div>
        <div class="form-group">
          <label for="seg75ContactoVia">Vía de contacto preferida</label>
          <select id="seg75ContactoVia">
            <option value="">Seleccionar…</option>
            <option value="presencial">Encuentro presencial</option>
            <option value="telefono">Llamada telefónica</option>
            <option value="correo">Correo electrónico</option>
            <option value="mensaje">Mensaje de texto / WhatsApp</option>
            <option value="plataforma">Plataforma digital</option>
          </select>
        </div>
        <div class="form-group" style="grid-column:1/-1">
          <label for="seg75Contacto">Teléfono / correo / datos de contacto del usuario</label>
          <input type="text" id="seg75Contacto" placeholder="Ej. 555-123-4567 / usuario@correo.com">
        </div>
      </div>

      <h3 style="font-size:14px;font-weight:700;margin:20px 0 12px;">Contenido del plan</h3>
      <div class="form-group">
        <label for="seg75ObjetivoSesion">Objetivo por sesión y efectos generales</label>
        <textarea id="seg75ObjetivoSesion" rows="3"
          placeholder="Ej. Reducir inflamación en la sesión 1-2, restaurar movilidad en sesión 3-5…"></textarea>
      </div>

      <div class="ia-box-75" style="margin-top:4px;">
        <div class="ia-header">✨ Sugerencia IA — Plan de seguimiento</div>
        <p style="font-size:12px;color:#555;margin-bottom:12px;">
          Genera una propuesta de plan de seguimiento basada en los datos del usuario,
          la técnica aplicada y los objetivos definidos.
        </p>
        <button class="btn-secondary" id="btn75IAplan">✨ Generar plan con IA</button>
        <div id="seg75IARespuesta" style="display:none;margin-top:12px;padding:12px;background:#f0fdf4;border-radius:8px;font-size:13px;color:#14532d;line-height:1.7;"></div>
      </div>

      <div class="form-group" style="margin-top:20px;">
        <label for="seg75TareasEnCasa">Actividades / ejercicios en casa</label>
        <textarea id="seg75TareasEnCasa" rows="3"
          placeholder="Ej. Estiramientos de 10 min cada mañana, baño de agua tibia post-sesión, técnicas de respiración…"></textarea>
      </div>
      <div class="form-group">
        <label for="seg75Recomendaciones">Recomendaciones adicionales del especialista</label>
        <textarea id="seg75Recomendaciones" rows="2"
          placeholder="Ej. Hidratación abundante, evitar esfuerzos intensos 24 hrs post-sesión…"></textarea>
      </div>

      <button class="btn-siguiente" id="btn75SigSeguimiento">Siguiente →</button>
    </div>
  </section>`;
}
