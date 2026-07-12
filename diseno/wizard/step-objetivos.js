// ─── wizard/step-objetivos.js — Paso 2: Objetivos de Aprendizaje ─────────────
// Usa window.sbeEstadoObjetivos (expuesto por app.js) para compartir el objeto
// `estado` entre los event listeners de app.js y las funciones de este módulo.
// `modoEstricto` se lee de localStorage en cada llamada para evitar estado desincronizado.

const _estado = () => window.sbeEstadoObjetivos || {
  actual: "cognitiva",
  cognitiva: { texto: "", completa: false },
  psicomotriz: { texto: "", completa: false },
  afectiva: { texto: "", completa: false },
  general: { texto: "", completa: false },
};
const _modo = () => localStorage.getItem("ec0217_modo_estricto") || "on";

export function guardarObjetivos() {
  const e = _estado();
  localStorage.setItem("ec0217_objetivos", JSON.stringify({
    cognitiva:           e.cognitiva.texto,
    psicomotriz:         e.psicomotriz.texto,
    afectiva:            e.afectiva.texto,
    general:             e.general.texto,
    cognitivaCompleta:   e.cognitiva.completa,
    psicomotrizCompleta: e.psicomotriz.completa,
    afectivaCompleta:    e.afectiva.completa,
    generalCompleta:     e.general.completa,
  }));
}

export function habilitarBeneficios() {
  const e = _estado();
  document.getElementById("nav-objetivos")?.classList.add("completed");
  document.getElementById("nav-beneficios")?.classList.remove("disabled");
  localStorage.setItem("ec0217_objetivos_completo", "true");
  if (e.general.completa) {
    document.getElementById("btnIrBeneficios")?.style && (document.getElementById("btnIrBeneficios").style.display = "inline-block");
  }
}

export function aplicarModoObjetivos() {
  const modo = _modo();
  const e    = _estado();

  document.getElementById("btnModoEstrictoOn")?.classList.toggle("active",  modo === "on");
  document.getElementById("btnModoEstrictoOff")?.classList.toggle("active", modo === "off");

  const nav = (id) => document.getElementById(id);

  if (modo === "off") {
    ["nav-cognitiva","nav-psicomotriz","nav-afectiva","nav-general"].forEach(id => nav(id)?.classList.remove("disabled"));
  } else {
    nav("nav-cognitiva")?.classList.remove("disabled");
    nav("nav-psicomotriz")?.classList.toggle("disabled", !e.cognitiva.completa);
    nav("nav-afectiva")?.classList.toggle("disabled",    !e.psicomotriz.completa);
    nav("nav-general")?.classList.toggle("disabled",     !e.afectiva.completa && !e.general.completa);
  }
}

export function intentarGenerarGeneral() {
  const e = _estado();
  if (e.cognitiva.completa && e.psicomotriz.completa && e.afectiva.completa) {
    document.getElementById("nav-general")?.classList.remove("disabled");
  }
}

export function objetivosTienenTextoMinimo() {
  const e = _estado();
  return (
    e.cognitiva.texto.trim().length > 0 &&
    e.psicomotriz.texto.trim().length > 0 &&
    e.afectiva.texto.trim().length > 0 &&
    e.cognitiva.completa &&
    e.psicomotriz.completa &&
    e.afectiva.completa
  );
}

export function reiniciarAvanceObjetivosEstricto() {
  const e = _estado();
  e.cognitiva.completa = false;
  e.psicomotriz.completa = false;
  e.afectiva.completa = false;
  e.general.completa = false;
  e.general.texto = "";

  ["nav-cognitiva","nav-psicomotriz","nav-afectiva","nav-general"].forEach(id => {
    document.getElementById(id)?.classList.remove("completed");
  });
  document.getElementById("nav-cognitiva")?.classList.remove("disabled");
  ["nav-psicomotriz","nav-afectiva","nav-general"].forEach(id => {
    document.getElementById(id)?.classList.add("disabled");
  });

  localStorage.removeItem("ec0217_objetivos_completo");
  document.getElementById("nav-objetivos")?.classList.remove("completed");
  document.getElementById("nav-beneficios")?.classList.add("disabled");

  const btnIrBeneficios = document.getElementById("btnIrBeneficios");
  if (btnIrBeneficios) btnIrBeneficios.style.display = "none";
  const nextBtn = document.getElementById("nextBtn");
  if (nextBtn) nextBtn.style.display = "none";
  const summary = document.getElementById("summary");
  if (summary) summary.textContent = "";

  guardarObjetivos();
}

export function marcarCompleta(seccion) {
  const e = _estado();
  e[seccion].completa = true;
  document.getElementById(`nav-${seccion}`)?.classList.add("completed");
  guardarObjetivos();

  if (_modo() === "on") {
    if (seccion === "cognitiva")   document.getElementById("nav-psicomotriz")?.classList.remove("disabled");
    if (seccion === "psicomotriz") document.getElementById("nav-afectiva")?.classList.remove("disabled");
    intentarGenerarGeneral();
  }
  aplicarModoObjetivos();
}

export function guardarObjetivoLibre() {
  if (_modo() !== "off") return;
  const e       = _estado();
  const textarea = document.getElementById("objectiveInput");
  const summary  = document.getElementById("summary");
  if (e.actual === "general" || !textarea) return;

  const texto = textarea.value.trim();
  if (!texto) { if (typeof showAlert === "function") showAlert("Escribe algo en el objetivo antes de guardarlo."); return; }

  e[e.actual].texto = texto;
  e[e.actual].completa = true;
  document.getElementById(`nav-${e.actual}`)?.classList.add("completed");

  guardarObjetivos();
  aplicarModoObjetivos();

  if (summary) { summary.style.display = "block"; summary.textContent = "✅ Objetivo guardado en modo no estricto."; }
}

export function cargarObjetivos() {
  const raw = localStorage.getItem("ec0217_objetivos");
  if (!raw) return;

  const obj = JSON.parse(raw);
  const e   = _estado();
  const textarea = document.getElementById("objectiveInput");

  e.cognitiva.texto    = obj.cognitiva    || "";
  e.psicomotriz.texto  = obj.psicomotriz  || "";
  e.afectiva.texto     = obj.afectiva     || "";
  e.general.texto      = obj.general      || "";

  if (obj.cognitivaCompleta) {
    e.cognitiva.completa = true;
    document.getElementById("nav-cognitiva")?.classList.add("completed");
    document.getElementById("nav-psicomotriz")?.classList.remove("disabled");
  }
  if (obj.psicomotrizCompleta) {
    e.psicomotriz.completa = true;
    document.getElementById("nav-psicomotriz")?.classList.add("completed");
    document.getElementById("nav-afectiva")?.classList.remove("disabled");
  }
  if (obj.afectivaCompleta) {
    e.afectiva.completa = true;
    document.getElementById("nav-afectiva")?.classList.add("completed");
    document.getElementById("nav-general")?.classList.remove("disabled");
  }
  if (obj.generalCompleta) {
    e.general.completa = true;
    document.getElementById("nav-general")?.classList.add("completed");
    habilitarBeneficios();
  }

  if (textarea) textarea.value = e[e.actual].texto || "";
  aplicarModoObjetivos();
}

export function initStepObjetivos() {
  window.guardarObjetivos                 = guardarObjetivos;
  window.habilitarBeneficios              = habilitarBeneficios;
  window.aplicarModoObjetivos             = aplicarModoObjetivos;
  window.intentarGenerarGeneral           = intentarGenerarGeneral;
  window.objetivosTienenTextoMinimo       = objetivosTienenTextoMinimo;
  window.reiniciarAvanceObjetivosEstricto = reiniciarAvanceObjetivosEstricto;
  window.marcarCompleta                   = marcarCompleta;
  window.guardarObjetivoLibre             = guardarObjetivoLibre;
  window.cargarObjetivos                  = cargarObjetivos;
}
