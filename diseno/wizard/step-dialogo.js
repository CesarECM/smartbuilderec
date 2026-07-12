// ─── wizard/step-dialogo.js — Paso 12: Técnica Diálogo/Discusión ─────────────

export function cargarObjetivoAfectivoDialogo() {
  const objetivos = JSON.parse(localStorage.getItem("ec0217_objetivos") || "{}");
  const el = document.getElementById("dialogoObjetivo");
  if (el) el.value = objetivos.afectiva || "";
}

export function recolectarDialogo() {
  const g = id => document.getElementById(id)?.value.trim() || "";
  return {
    objetivo:      g("dialogoObjetivo"),
    actividad:     g("dialogoActividad"),
    instrucciones: g("dialogoInstrucciones"),
    ejemplos:      g("dialogoEjemplos"),
    conclusion:    g("dialogoConclusion"),
  };
}

export function guardarDialogoTemporal() {
  localStorage.setItem("ec0217_dialogo", JSON.stringify(recolectarDialogo()));
}

export function cargarDialogo() {
  cargarObjetivoAfectivoDialogo();
  const raw = localStorage.getItem("ec0217_dialogo");
  if (!raw) return;
  try {
    const d = JSON.parse(raw);
    ["actividad","instrucciones","ejemplos","conclusion"].forEach(f => {
      const el = document.getElementById("dialogo" + f.charAt(0).toUpperCase() + f.slice(1));
      if (el && d[f] !== undefined) el.value = d[f];
    });
    if (localStorage.getItem("ec0217_dialogo_completo") === "true") {
      document.getElementById("nav-dialogo")?.classList.add("completed");
      document.getElementById("nav-cierre")?.classList.remove("disabled");
    }
  } catch (_) {}
}

export function validarDialogo() {
  const errEl = document.getElementById("err-dialogo");
  if (errEl) errEl.style.display = "none";
  const d = recolectarDialogo();
  const ok = Object.values(d).every(v => v.length > 0);
  if (!ok && errEl) errEl.style.display = "block";
  return ok;
}

export function guardarDialogoFinal() {
  guardarDialogoTemporal();
  localStorage.setItem("ec0217_dialogo_completo", "true");
  document.getElementById("nav-dialogo")?.classList.add("completed");
  document.getElementById("nav-cierre")?.classList.remove("disabled");
}

export function initStepDialogo() {
  window.cargarObjetivoAfectivoDialogo = cargarObjetivoAfectivoDialogo;
  window.recolectarDialogo   = recolectarDialogo;
  window.guardarDialogoTemporal = guardarDialogoTemporal;
  window.cargarDialogo       = cargarDialogo;
  window.validarDialogo      = validarDialogo;
  window.guardarDialogoFinal = guardarDialogoFinal;
}
