// ─── wizard-ec0091/step-objetivo.js — Paso 2: Objetivo y alcance ─────────────

export function cargarObjetivo91() {
  const raw = localStorage.getItem("ec0091_objetivo");
  if (!raw) return;
  const d = JSON.parse(raw);
  const objEl  = document.getElementById("obj91Objetivo");
  const alcEl  = document.getElementById("obj91Alcance");
  if (objEl && d.objetivo)  objEl.value = d.objetivo;
  if (alcEl && d.alcance)   alcEl.value = d.alcance;
}

export function guardarObjetivo91() {
  const datos = {
    objetivo: document.getElementById("obj91Objetivo")?.value.trim() || "",
    alcance:  document.getElementById("obj91Alcance")?.value.trim()  || "",
  };
  localStorage.setItem("ec0091_objetivo", JSON.stringify(datos));
  localStorage.setItem("ec0091_objetivo_completo", "true");
  document.getElementById("nav91-objetivo")?.classList.add("completed");
  document.getElementById("nav91-antecedentes")?.classList.remove("disabled");
  window.ec0091Sync?.schedule();
}

export function validarObjetivo91() {
  const objEl = document.getElementById("obj91Objetivo");
  const alcEl = document.getElementById("obj91Alcance");
  let ok = true;
  if (!objEl?.value.trim()) { objEl?.classList.add("error"); document.getElementById("err91-objetivo")?.style && (document.getElementById("err91-objetivo").style.display = "block"); ok = false; }
  else { objEl?.classList.remove("error"); if (document.getElementById("err91-objetivo")) document.getElementById("err91-objetivo").style.display = "none"; }
  if (!alcEl?.value.trim()) { alcEl?.classList.add("error"); document.getElementById("err91-alcance")?.style && (document.getElementById("err91-alcance").style.display = "block"); ok = false; }
  else { alcEl?.classList.remove("error"); if (document.getElementById("err91-alcance")) document.getElementById("err91-alcance").style.display = "none"; }
  return ok;
}

export function initStepObjetivo91() {
  window.cargarObjetivo91  = cargarObjetivo91;
  window.guardarObjetivo91 = guardarObjetivo91;
  window.validarObjetivo91 = validarObjetivo91;
}

export function getTemplate() {
  return `
  <section id="sec91Objetivo" class="wizard-section hidden">
    <p class="paso-titulo">Paso 2 de 13</p>
    <h1>Objetivo y Alcance de la Verificación</h1>
    <div class="card" style="max-width:800px;">
      <p style="color:#555;font-size:14px;">Define el propósito de esta verificación externa y las áreas o estándares que serán evaluados.</p>

      <div class="form-group">
        <label for="obj91Objetivo">Objetivo de la verificación *</label>
        <div style="display:flex;gap:8px;margin-bottom:8px;flex-wrap:wrap;">
          <button type="button" id="btn91GenObjetivo" class="btn-ia">✨ Generar con IA</button>
          <button type="button" id="btn91RevObjetivo" class="btn-ia">🔍 Revisar cumplimiento</button>
        </div>
        <div id="loader91Objetivo" style="display:none;font-size:13px;color:#1a4a6b;font-style:italic;">Generando...</div>
        <textarea id="obj91Objetivo" rows="5" placeholder="Describe el objetivo general de esta verificación externa (quién verifica, qué se verifica, con qué propósito)..." spellcheck="true" lang="es"></textarea>
        <span class="error-msg" id="err91-objetivo">Campo requerido.</span>
      </div>

      <div id="revision91Objetivo" class="revision-resultado" style="display:none;"></div>

      <div class="form-group" style="margin-top:16px;">
        <label for="obj91Alcance">Alcance de la verificación *</label>
        <textarea id="obj91Alcance" rows="4" placeholder="Especifica las normas, estándares, áreas, procesos o personal que serán verificados..." spellcheck="true" lang="es"></textarea>
        <span class="error-msg" id="err91-alcance">Campo requerido.</span>
      </div>

      <button class="btn-siguiente" id="btn91SigObjetivo">Siguiente →</button>
    </div>
  </section>`;
}
