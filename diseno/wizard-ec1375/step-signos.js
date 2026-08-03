// ─── wizard-ec1375/step-signos.js — Paso 4: Signos vitales (E4324) ────────────

const CAMPOS = [
  "sig75SpO2", "sig75Pulso", "sig75PAS", "sig75PAD", "sig75FrecResp", "sig75Postura",
];

export function cargarSignos75() {
  const raw = localStorage.getItem("ec1375_signos");
  if (!raw) return;
  const d = JSON.parse(raw);
  CAMPOS.forEach(id => {
    const el = document.getElementById(id);
    if (el && d[id] !== undefined) el.value = d[id];
  });
}

export function guardarSignos75() {
  const datos = {};
  CAMPOS.forEach(id => { datos[id] = document.getElementById(id)?.value.trim() || ""; });
  localStorage.setItem("ec1375_signos", JSON.stringify(datos));
  localStorage.setItem("ec1375_signos_completo", "true");
  document.getElementById("nav75-signos")?.classList.add("completed");
  document.getElementById("nav75-consentimiento")?.classList.remove("disabled");
  window.ec1375Sync?.schedule();
}

export function initStepSignos75() {
  window.cargarSignos75  = cargarSignos75;
  window.guardarSignos75 = guardarSignos75;
}

export function getTemplate() {
  return `
  <section id="sec75Signos" class="wizard-section hidden">
    <p class="paso-titulo">Paso 4 de 7 — Elemento E4324</p>
    <h1>Signos Vitales y Exploración Física</h1>
    <div class="card" style="max-width:860px;">
      <p style="color:#555;font-size:14px;">
        Registra los valores obtenidos durante la toma de signos vitales y las observaciones
        de postura del usuario conforme al protocolo EC1375.
      </p>

      <div class="signos-grid">
        <div class="form-group">
          <label for="sig75SpO2">Saturación de oxígeno — SpO₂ (%)</label>
          <input type="number" id="sig75SpO2" min="70" max="100" step="0.1"
            placeholder="Ej. 98">
          <small style="color:#888;font-size:11px;">Rango normal adultos: 95–100%</small>
        </div>
        <div class="form-group">
          <label for="sig75Pulso">Pulso (lpm)</label>
          <input type="number" id="sig75Pulso" min="30" max="220"
            placeholder="Ej. 72">
          <small style="color:#888;font-size:11px;">Rango normal adultos: 60–100 lpm</small>
        </div>
        <div class="form-group">
          <label for="sig75PAS">Presión arterial sistólica (mmHg)</label>
          <input type="number" id="sig75PAS" min="60" max="250"
            placeholder="Ej. 120">
        </div>
        <div class="form-group">
          <label for="sig75PAD">Presión arterial diastólica (mmHg)</label>
          <input type="number" id="sig75PAD" min="40" max="150"
            placeholder="Ej. 80">
          <small style="color:#888;font-size:11px;">Normal: &lt; 120/80 mmHg</small>
        </div>
        <div class="form-group">
          <label for="sig75FrecResp">Frecuencia respiratoria (rpm)</label>
          <input type="number" id="sig75FrecResp" min="8" max="60"
            placeholder="Ej. 16">
          <small style="color:#888;font-size:11px;">Rango normal adultos: 12–20 rpm</small>
        </div>
      </div>

      <div class="form-group" style="margin-top:20px;">
        <label for="sig75Postura">Observaciones de postura física</label>
        <textarea id="sig75Postura" rows="4"
          placeholder="Describe la postura observada: cabeza, cuello, tórax, extremidades y pelvis.&#10;Ej. Hombros en antepulsión moderada, leve escoliosis dorsal, pelvis en anteversión…"></textarea>
        <small style="color:#888;font-size:11px;">
          Revisión visual de: cabeza, cuello, tórax, extremidades y pelvis (conforme E4324).
        </small>
      </div>

      <button class="btn-siguiente" id="btn75SigSignos">Siguiente →</button>
    </div>
  </section>`;
}
