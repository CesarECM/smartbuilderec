// ─── wizard/step-expositiva.js — Paso 9: Técnica Expositiva ──────────────────

const CAMPOS_EXP = ["introduccion","experiencia","desarrollo","ejemplos","sintesis","preguntas","utilidad"];

export function cargarObjetivoCognitivoExpositiva() {
  const objetivos = JSON.parse(localStorage.getItem("ec0217_objetivos") || "{}");
  const el = document.getElementById("expObjetivo");
  if (el) el.value = objetivos.cognitiva || "";
}

export function recolectarExpositiva() {
  const g = id => document.getElementById(id)?.value.trim() || "";
  return {
    objetivo:      g("expObjetivo"),
    introduccion:  g("expIntroduccion"),
    experiencia:   g("expExperiencia"),
    desarrollo:    g("expDesarrollo"),
    ejemplos:      g("expEjemplos"),
    sintesis:      g("expSintesis"),
    preguntas:     g("expPreguntas"),
    utilidad:      g("expUtilidad"),
  };
}

export function guardarExpositivaTemporal() {
  localStorage.setItem("ec0217_expositiva", JSON.stringify(recolectarExpositiva()));
}

export function cargarExpositiva() {
  cargarObjetivoCognitivoExpositiva();
  const raw = localStorage.getItem("ec0217_expositiva");
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    CAMPOS_EXP.forEach(f => {
      const el = document.getElementById("exp" + f.charAt(0).toUpperCase() + f.slice(1));
      if (el && d[f] !== undefined) el.value = d[f];
    });
    if (localStorage.getItem("ec0217_expositiva_completo") === "true") {
      document.getElementById("nav-expositiva")?.classList.add("completed");
      document.getElementById("nav-demostrativa")?.classList.remove("disabled");
    }
  } catch (_) {}
}

export function validarExpositiva() {
  const errEl = document.getElementById("err-expositiva");
  if (errEl) errEl.style.display = "none";
  const d = recolectarExpositiva();
  const ok = Object.values(d).every(v => v.length > 0);
  if (!ok && errEl) errEl.style.display = "block";
  return ok;
}

export function guardarExpositivaFinal() {
  guardarExpositivaTemporal();
  localStorage.setItem("ec0217_expositiva_completo", "true");
  document.getElementById("nav-expositiva")?.classList.add("completed");
  document.getElementById("nav-demostrativa")?.classList.remove("disabled");
}

export function initStepExpositiva() {
  window.cargarObjetivoCognitivoExpositiva = cargarObjetivoCognitivoExpositiva;
  window.recolectarExpositiva  = recolectarExpositiva;
  window.guardarExpositivaTemporal = guardarExpositivaTemporal;
  window.cargarExpositiva      = cargarExpositiva;
  window.validarExpositiva     = validarExpositiva;
  window.guardarExpositivaFinal = guardarExpositivaFinal;
}
