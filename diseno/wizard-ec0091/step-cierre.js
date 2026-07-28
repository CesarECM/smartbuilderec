// ─── wizard-ec0091/step-cierre.js — Paso 12: Cierre y firmas ────────────────

export function cargarCierre91() {
  const raw = localStorage.getItem("ec0091_cierre");
  if (!raw) return;
  const d = JSON.parse(raw);
  ["cierre91FechaEntrega", "cierre91Observaciones"].forEach(id => {
    const el = document.getElementById(id);
    if (el && d[id] !== undefined) el.value = d[id];
  });
  ["cierre91FirmaVE", "cierre91FirmaResp"].forEach(id => {
    const el = document.getElementById(id);
    if (el && d[id] !== undefined) el.checked = d[id];
  });
}

export function guardarCierre91() {
  const datos = {
    cierre91FechaEntrega:  document.getElementById("cierre91FechaEntrega")?.value  || "",
    cierre91FirmaVE:       document.getElementById("cierre91FirmaVE")?.checked     || false,
    cierre91FirmaResp:     document.getElementById("cierre91FirmaResp")?.checked   || false,
    cierre91Observaciones: document.getElementById("cierre91Observaciones")?.value.trim() || "",
  };
  localStorage.setItem("ec0091_cierre", JSON.stringify(datos));
  localStorage.setItem("ec0091_cierre_completo", "true");
  document.getElementById("nav91-cierre")?.classList.add("completed");
  document.getElementById("nav91-expediente")?.classList.remove("disabled");
  window.ec0091Sync?.schedule();
}

export function initStepCierre91() {
  window.cargarCierre91  = cargarCierre91;
  window.guardarCierre91 = guardarCierre91;
}

export function getTemplate() {
  return `
  <section id="sec91Cierre" class="wizard-section hidden">
    <p class="paso-titulo">Paso 12 de 13</p>
    <h1>Cierre y Firmas</h1>
    <div class="card" style="max-width:700px;">
      <p style="color:#555;font-size:14px;">Confirma la entrega del informe y el acuerdo de firmas entre el Verificador Externo y el responsable de la entidad verificada.</p>

      <div class="form-group">
        <label for="cierre91FechaEntrega">Fecha de entrega del informe *</label>
        <input type="date" id="cierre91FechaEntrega">
      </div>

      <div class="card" style="background:#f8fafc;border:1.5px solid #e2e8f0;margin-top:16px;padding:20px;">
        <h3 style="margin-top:0;color:#1a4a6b;">Confirmación de firmas</h3>
        <p style="font-size:13px;color:#555;">Indica que las partes han revisado y firmado el informe de verificación (las firmas físicas o electrónicas se adjuntan al expediente).</p>

        <label style="display:flex;align-items:center;gap:10px;margin-bottom:12px;cursor:pointer;">
          <input type="checkbox" id="cierre91FirmaVE" style="width:18px;height:18px;">
          <span style="font-size:14px;font-weight:600;">Firma del Verificador Externo — confirmado</span>
        </label>

        <label style="display:flex;align-items:center;gap:10px;cursor:pointer;">
          <input type="checkbox" id="cierre91FirmaResp" style="width:18px;height:18px;">
          <span style="font-size:14px;font-weight:600;">Firma del Responsable de la Entidad — confirmado</span>
        </label>
      </div>

      <div class="form-group" style="margin-top:16px;">
        <label for="cierre91Observaciones">Observaciones finales del cierre</label>
        <textarea id="cierre91Observaciones" rows="4" placeholder="Cualquier acuerdo, compromiso o nota relevante del momento de cierre..."></textarea>
      </div>

      <button class="btn-siguiente" id="btn91SigCierre">Continuar al expediente final →</button>
    </div>
  </section>`;
}
