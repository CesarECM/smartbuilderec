// ─── wizard/step-demostrativa.js — Paso 10: Técnica Demostrativa ─────────────

export function cargarObjetivoPsicomotrizDemostrativa() {
  const objetivos = JSON.parse(localStorage.getItem("ec0217_objetivos") || "{}");
  const el = document.getElementById("demoObjetivo");
  if (el) el.value = objetivos.psicomotriz || "";
}

export function recolectarDemostrativa() {
  const g = id => document.getElementById(id)?.value.trim() || "";
  return {
    objetivo:    g("demoObjetivo"),
    experiencia: g("demoExperiencia"),
    actividad:   g("demoActividad"),
    ejemplos:    g("demoEjemplos"),
    preguntas:   g("demoPreguntas"),
  };
}

export function guardarDemostrativaTemporal() {
  localStorage.setItem("ec0217_demostrativa", JSON.stringify(recolectarDemostrativa()));
}

export function cargarDemostrativa() {
  cargarObjetivoPsicomotrizDemostrativa();
  const raw = localStorage.getItem("ec0217_demostrativa");
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    ["experiencia","actividad","ejemplos","preguntas"].forEach(f => {
      const el = document.getElementById("demo" + f.charAt(0).toUpperCase() + f.slice(1));
      if (el && d[f] !== undefined) el.value = d[f];
    });
    if (localStorage.getItem("ec0217_demostrativa_completo") === "true") {
      document.getElementById("nav-demostrativa")?.classList.add("completed");
      document.getElementById("nav-energizante")?.classList.remove("disabled");
    }
  } catch (_) {}
}

export function validarDemostrativa() {
  const errEl = document.getElementById("err-demostrativa");
  if (errEl) errEl.style.display = "none";
  const d = recolectarDemostrativa();
  const ok = Object.values(d).every(v => v.length > 0);
  if (!ok && errEl) errEl.style.display = "block";
  return ok;
}

export function guardarDemostrativaFinal() {
  guardarDemostrativaTemporal();
  localStorage.setItem("ec0217_demostrativa_completo", "true");
  document.getElementById("nav-demostrativa")?.classList.add("completed");
  document.getElementById("nav-energizante")?.classList.remove("disabled");
}

export function initStepDemostrativa() {
  window.cargarObjetivoPsicomotrizDemostrativa = cargarObjetivoPsicomotrizDemostrativa;
  window.recolectarDemostrativa   = recolectarDemostrativa;
  window.guardarDemostrativaTemporal = guardarDemostrativaTemporal;
  window.cargarDemostrativa       = cargarDemostrativa;
  window.validarDemostrativa      = validarDemostrativa;
  window.guardarDemostrativaFinal = guardarDemostrativaFinal;
}
