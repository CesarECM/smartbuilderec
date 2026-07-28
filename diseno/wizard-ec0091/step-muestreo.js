// ─── wizard-ec0091/step-muestreo.js — Paso 5: Calculadora MAS ────────────────
// Fórmula estándar ANSI Z1.4 (Muestreo Aleatorio Simple):
// Muestra = N / (1 + N * e²)  donde e = margen de error (0.05 típico)
// Aceptación = muestra * 0.90 (umbral EC0091: 90% cumplimiento)
// Rechazo = muestra - aceptación

function _calcularMAS(N, e = 0.05) {
  if (!N || N < 1) return null;
  const muestra     = Math.ceil(N / (1 + N * e * e));
  const aceptacion  = Math.floor(muestra * 0.90);
  const rechazo     = muestra - aceptacion;
  return { N, muestra, aceptacion, rechazo };
}

export function calcularMAS91() {
  const nEl = document.getElementById("mas91TotalInst");
  const N   = parseInt(nEl?.value, 10);
  if (isNaN(N) || N < 1) {
    document.getElementById("mas91Resultado")?.style && (document.getElementById("mas91Resultado").style.display = "none");
    return;
  }
  const res = _calcularMAS(N);
  const rEl = document.getElementById("mas91Resultado");
  if (!rEl || !res) return;
  rEl.style.display = "grid";
  document.getElementById("mas91ValMuestra")    && (document.getElementById("mas91ValMuestra").textContent    = res.muestra);
  document.getElementById("mas91ValAceptacion") && (document.getElementById("mas91ValAceptacion").textContent = res.aceptacion);
  document.getElementById("mas91ValRechazo")    && (document.getElementById("mas91ValRechazo").textContent    = res.rechazo);
  _guardarCalculo(res);
}

function _guardarCalculo(res) {
  const prev = JSON.parse(localStorage.getItem("ec0091_muestreo") || "{}");
  localStorage.setItem("ec0091_muestreo", JSON.stringify({ ...prev, ...res }));
  window.ec0091Sync?.schedule();
}

export function cargarMuestreo91() {
  const raw = localStorage.getItem("ec0091_muestreo");
  if (!raw) return;
  const d = JSON.parse(raw);
  const nEl = document.getElementById("mas91TotalInst");
  if (nEl && d.N) { nEl.value = d.N; calcularMAS91(); }
  const expEl = document.getElementById("mas91Explicacion");
  if (expEl && d.explicacion) expEl.value = d.explicacion;
}

export function guardarMuestreo91() {
  const raw  = localStorage.getItem("ec0091_muestreo");
  const prev = raw ? JSON.parse(raw) : {};
  const exp  = document.getElementById("mas91Explicacion")?.value.trim() || "";
  localStorage.setItem("ec0091_muestreo", JSON.stringify({ ...prev, explicacion: exp }));
  localStorage.setItem("ec0091_muestreo_completo", "true");
  document.getElementById("nav91-muestreo")?.classList.add("completed");
  document.getElementById("nav91-documentos")?.classList.remove("disabled");
  window.ec0091Sync?.schedule();
}

export function initStepMuestreo91() {
  window.calcularMAS91   = calcularMAS91;
  window.cargarMuestreo91  = cargarMuestreo91;
  window.guardarMuestreo91 = guardarMuestreo91;

  document.getElementById("mas91TotalInst")?.addEventListener("input", calcularMAS91);
}

export function getTemplate() {
  return `
  <section id="sec91Muestreo" class="wizard-section hidden">
    <p class="paso-titulo">Paso 5 de 13</p>
    <h1>Calculadora de Muestreo Aleatorio Simple</h1>
    <div class="card" style="max-width:700px;">
      <p style="color:#555;font-size:14px;">Ingresa el total de instrumentos o evaluadores del CE/EI para calcular el tamaño de muestra según la norma ANSI Z1.4 con un margen de error del 5%.</p>

      <div class="form-group" style="max-width:320px;">
        <label for="mas91TotalInst">Total de instrumentos / evaluadores (N) *</label>
        <input type="number" id="mas91TotalInst" placeholder="Ej. 50" min="1" style="font-size:18px;font-weight:700;">
      </div>

      <div id="mas91Resultado" style="display:none;grid-template-columns:repeat(3,1fr);gap:16px;margin:20px 0;">
        <div class="mas-result-box" style="text-align:center;">
          <div class="mas-value" id="mas91ValMuestra">—</div>
          <div class="mas-label">Tamaño de muestra</div>
        </div>
        <div class="mas-result-box" style="text-align:center;">
          <div class="mas-value" id="mas91ValAceptacion" style="color:#065f46;">—</div>
          <div class="mas-label">Máx. aceptación (90%)</div>
        </div>
        <div class="mas-result-box" style="text-align:center;">
          <div class="mas-value" id="mas91ValRechazo" style="color:#991b1b;">—</div>
          <div class="mas-label">Núm. rechazo (10%)</div>
        </div>
      </div>

      <div class="form-group" style="margin-top:16px;">
        <label for="mas91Explicacion">Interpretación / notas del muestreo</label>
        <div style="display:flex;gap:8px;margin-bottom:8px;">
          <button type="button" id="btn91ExplicarMAS" class="btn-ia">🤖 Explicar en lenguaje natural</button>
        </div>
        <div id="loader91MAS" style="display:none;font-size:13px;color:#1a4a6b;font-style:italic;">Generando explicación...</div>
        <textarea id="mas91Explicacion" rows="4" placeholder="Aquí aparecerá la explicación en lenguaje natural o puedes escribir tus propias notas..."></textarea>
      </div>

      <button class="btn-siguiente" id="btn91SigMuestreo">Siguiente →</button>
    </div>
  </section>`;
}
