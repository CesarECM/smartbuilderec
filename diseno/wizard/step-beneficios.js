// ─── wizard/step-beneficios.js — Paso 3: Beneficios del Curso ────────────────

export function cargarBeneficios() {
  const raw = localStorage.getItem("ec0217_beneficios");
  const ta  = document.getElementById("beneficiosTexto");
  if (!raw || !ta) return;

  const data = JSON.parse(raw);
  ta.value = typeof data === "string" ? data : (data.lista || data.texto || "");

  if (localStorage.getItem("ec0217_beneficios_completo") === "true") {
    document.getElementById("nav-beneficios")?.classList.add("completed");
    document.getElementById("nav-temario")?.classList.remove("disabled");
  }
}

export function validarBeneficios() {
  const ta      = document.getElementById("beneficiosTexto");
  const errEl   = document.getElementById("err-beneficiosTexto");
  if (!ta) return false;

  const lineas = ta.value.trim().split(/\n+/).map(l => l.trim()).filter(Boolean);
  if (lineas.length < 3) {
    ta.classList.add("error");
    if (errEl) errEl.style.display = "block";
    return false;
  }
  ta.classList.remove("error");
  if (errEl) errEl.style.display = "none";
  return true;
}

export function guardarBeneficios() {
  const ta = document.getElementById("beneficiosTexto");
  if (!ta) return;
  localStorage.setItem("ec0217_beneficios", JSON.stringify({ lista: ta.value.trim() }));
  localStorage.setItem("ec0217_beneficios_completo", "true");
  document.getElementById("nav-beneficios")?.classList.add("completed");
  document.getElementById("nav-temario")?.classList.remove("disabled");
}

export function initStepBeneficios() {
  window.cargarBeneficios  = cargarBeneficios;
  window.validarBeneficios = validarBeneficios;
  window.guardarBeneficios = guardarBeneficios;
}
