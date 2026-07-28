// ─── wizard-ec0091/step-hallazgos.js — Paso 10: Hallazgos ───────────────────

let _hallazgos = [];

function _crearTarjeta(datos = {}, idx) {
  const div = document.createElement("div");
  div.className = "hallazgo-card";
  div.dataset.idx = idx;
  div.innerHTML = `
    <div class="hallazgo-num">Hallazgo #${idx + 1}</div>
    <div class="form-group"><label>Descripción del hallazgo *</label>
      <textarea class="hcDescripcion" rows="2" placeholder="Describe el incumplimiento encontrado...">${datos.descripcion || ""}</textarea>
    </div>
    <div class="form-group"><label>Causa raíz probable</label>
      <textarea class="hcCausa" rows="2" placeholder="¿Por qué ocurre este incumplimiento?">${datos.causa || ""}</textarea>
    </div>
    <div class="form-group"><label>Acción correctiva propuesta</label>
      <textarea class="hcAccion" rows="2" placeholder="¿Qué debe hacer el CE/EI para corregirlo?">${datos.accion || ""}</textarea>
    </div>
    <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
      <button type="button" class="btn-ia btn91-gen-hallazgo">✨ Generar causa raíz</button>
      <button type="button" class="btn-ia btn91-ref-hallazgo">✏️ Mejorar redacción</button>
      <button type="button" class="btn-ia btn91-rev-hallazgo">🔍 Revisar 6 campos</button>
      <button type="button" class="btn-elim-hallazgo" style="margin-left:auto;background:none;border:1.5px solid #991b1b;color:#991b1b;border-radius:6px;padding:4px 10px;cursor:pointer;font-size:12px;">✕ Eliminar</button>
    </div>
    <div class="form-group" style="display:grid;grid-template-columns:1fr 1fr;gap:12px;">
      <div><label>Indicador de seguimiento</label>
        <input type="text" class="hcIndicador" placeholder="Ej. % cumplimiento a 30 días" value="${datos.indicador || ""}">
      </div>
      <div><label>Plazo para corrección</label>
        <input type="text" class="hcPlazo" placeholder="Ej. 30 días naturales" value="${datos.plazo || ""}">
      </div>
    </div>
    <div id="revision91-hallazgo-${idx}" class="revision-resultado" style="display:none;"></div>`;
  return div;
}

function _leerTarjetas() {
  return Array.from(document.querySelectorAll(".hallazgo-card")).map(card => ({
    descripcion: card.querySelector(".hcDescripcion")?.value.trim() || "",
    causa:       card.querySelector(".hcCausa")?.value.trim()       || "",
    accion:      card.querySelector(".hcAccion")?.value.trim()      || "",
    indicador:   card.querySelector(".hcIndicador")?.value.trim()   || "",
    plazo:       card.querySelector(".hcPlazo")?.value.trim()       || "",
  }));
}

export function cargarHallazgos91() {
  const raw = localStorage.getItem("ec0091_hallazgos");
  if (!raw) return;
  const d = JSON.parse(raw);
  _hallazgos = d.hallazgos || [];
  const cont = document.getElementById("hallazgos91Container");
  if (!cont) return;
  cont.innerHTML = "";
  if (_hallazgos.length === 0) {
    cont.appendChild(_crearTarjeta({}, 0));
  } else {
    _hallazgos.forEach((h, i) => cont.appendChild(_crearTarjeta(h, i)));
  }
}

export function guardarHallazgos91() {
  _hallazgos = _leerTarjetas();
  localStorage.setItem("ec0091_hallazgos", JSON.stringify({ hallazgos: _hallazgos }));
  localStorage.setItem("ec0091_hallazgos_completo", "true");
  document.getElementById("nav91-hallazgos")?.classList.add("completed");
  document.getElementById("nav91-informe")?.classList.remove("disabled");
  window.ec0091Sync?.schedule();
}

export function initStepHallazgos91() {
  window.cargarHallazgos91  = cargarHallazgos91;
  window.guardarHallazgos91 = guardarHallazgos91;
  window.leerHallazgosTarjetas = _leerTarjetas;

  document.getElementById("btn91AgregarHallazgo")?.addEventListener("click", () => {
    const cont = document.getElementById("hallazgos91Container");
    const idx = cont?.querySelectorAll(".hallazgo-card").length || 0;
    cont?.appendChild(_crearTarjeta({}, idx));
  });

  document.getElementById("hallazgos91Container")?.addEventListener("click", e => {
    if (e.target.closest(".btn-elim-hallazgo")) e.target.closest(".hallazgo-card")?.remove();
  });
}

export function getTemplate() {
  return `
  <section id="sec91Hallazgos" class="wizard-section hidden">
    <p class="paso-titulo">Paso 10 de 13</p>
    <h1>Hallazgos y Acciones Correctivas</h1>
    <div class="card" style="max-width:860px;">
      <p style="color:#555;font-size:14px;">Documenta cada hallazgo con los 6 campos obligatorios del EC0091: descripción, causa raíz, acción correctiva, indicador, plazo y firma (la firma se recopila en el paso 12).</p>
      <div style="display:flex;gap:8px;margin-bottom:16px;">
        <button type="button" id="btn91AgregarHallazgo" class="btn-siguiente" style="padding:8px 16px;font-size:13px;margin:0;">+ Agregar hallazgo</button>
      </div>
      <div id="hallazgos91Container"></div>
      <button class="btn-siguiente" id="btn91SigHallazgos" style="margin-top:8px;">Siguiente →</button>
    </div>
  </section>`;
}
