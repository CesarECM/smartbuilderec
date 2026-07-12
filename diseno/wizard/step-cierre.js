// ─── wizard/step-cierre.js — Paso 13: Cierre del Curso ───────────────────────

export function recolectarCierre() {
  const g = id => document.getElementById(id)?.value.trim() || "";
  const resumenVal = g("cierreResumen") || localStorage.getItem("ec0217_cierre_resumen") || "";
  return {
    texto:              g("cierreTexto"),
    resumen:            resumenVal,
    sugerencias:        g("sugerenciasContinuidad"),
    referencias:        g("referenciasBibliograficas"),
    compromisos:        g("compromisosTexto"),
    descripcionGeneral: g("descripcionGeneralEvaluacion"),
  };
}

export function guardarCierreTemporal() {
  localStorage.setItem("ec0217_cierre", JSON.stringify(recolectarCierre()));
}

export function cargarCierre() {
  const raw = localStorage.getItem("ec0217_cierre");
  if (raw) {
    try {
      const d = JSON.parse(raw);
      const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
      set("cierreTexto",              d.texto);
      set("descripcionGeneralEvaluacion", d.descripcionGeneral);
      set("sugerenciasContinuidad",   d.sugerencias);
      set("referenciasBibliograficas",d.referencias);
      set("compromisosTexto",         d.compromisos);

      const resumen = d.resumen || localStorage.getItem("ec0217_cierre_resumen") || "";
      if (resumen) {
        localStorage.setItem("ec0217_cierre_resumen", resumen);
        set("cierreResumen", resumen);
      }
    } catch (_) {}
  }
  if (localStorage.getItem("ec0217_cierre_completo") === "true") {
    document.getElementById("nav-cierre")?.classList.add("completed");
    document.getElementById("nav-evaluaciones")?.classList.remove("disabled");
  }
}

export function validarCierre() {
  const errEl = document.getElementById("err-cierre");
  if (errEl) errEl.style.display = "none";
  const d = recolectarCierre();
  if (!d.texto) {
    if (errEl) errEl.style.display = "block";
    return false;
  }
  return true;
}

export function guardarCierreFinal() {
  guardarCierreTemporal();
  localStorage.setItem("ec0217_cierre_completo", "true");
  document.getElementById("nav-cierre")?.classList.add("completed");
  document.getElementById("nav-evaluaciones")?.classList.remove("disabled");
}

export function initStepCierre() {
  window.recolectarCierre    = recolectarCierre;
  window.guardarCierreTemporal = guardarCierreTemporal;
  window.cargarCierre        = cargarCierre;
  window.validarCierre       = validarCierre;
  window.guardarCierreFinal  = guardarCierreFinal;
}
