// ─── wizard/step-tecnicas.js — Pasos 5/11: Técnicas Grupales ────────────────

import { mostrarDetalleIntegracion, mostrarDetalleEnergizante } from "./step-detalle-tecnicas.js";
import { tecnicasRompehielos, tecnicasEnergizantes } from "./tecnicas-data.js";

let _cargando = false;

const _rh  = () => window.sbeTecnicasRompehielos  || tecnicasRompehielos;
const _en  = () => window.sbeTecnicasEnergizantes || tecnicasEnergizantes;

export function obtenerRadioSeleccionado(name) {
  return document.querySelector(`input[name="${name}"]:checked`);
}

export function buscarTecnica(lista, id) {
  return lista.find(item => item.id === id);
}

export function recolectarTecnicas() {
  const rhSel = obtenerRadioSeleccionado("tecnicaIntegracion");
  const enSel = obtenerRadioSeleccionado("tecnicaEnergizante");
  const g = id => document.getElementById(id)?.value.trim() || "";

  let rompehielos = null;
  if (rhSel) {
    if (rhSel.value === "personalizada") {
      rompehielos = { id: "personalizada", nombre: "Técnica personalizada", objetivo: g("detalleIntegracionObjetivo"), instrucciones: g("detalleIntegracionInstrucciones"), duracion: "", participacion: "", integracion: "", controlTiempo: "" };
    } else {
      const base = buscarTecnica(_rh(), rhSel.value);
      rompehielos = base ? { id: base.id, nombre: base.nombre, objetivo: g("detalleIntegracionObjetivo"), instrucciones: g("detalleIntegracionInstrucciones"), duracion: "", participacion: "", integracion: "", controlTiempo: "" } : null;
    }
  }

  let energizante = null;
  if (enSel) {
    if (enSel.value === "personalizada") {
      energizante = { id: "personalizada", nombre: "Técnica personalizada", objetivo: g("detalleEnergizanteObjetivo"), instrucciones: g("detalleEnergizanteInstrucciones") };
    } else {
      const base = buscarTecnica(_en(), enSel.value);
      energizante = base ? { id: base.id, nombre: base.nombre, objetivo: g("detalleEnergizanteObjetivo"), instrucciones: g("detalleEnergizanteInstrucciones") } : null;
    }
  }

  const rhNombre = g("detalleIntegracionNombre") || (rompehielos?.nombre ?? "");
  const enNombre = g("detalleEnergizanteNombre")  || (energizante?.nombre  ?? "");

  return {
    rhNombre,
    rhObjetivo:      rompehielos ? rompehielos.objetivo      : "",
    rhInstrucciones: rompehielos ? rompehielos.instrucciones : "",
    rhDetalle:       rompehielos
      ? `a) Explicará objetivo de la técnica:\n${rompehielos.objetivo}\n\nb) Dará las instrucciones de la técnica:\n${rompehielos.instrucciones}\n\nc) Mencionará el tiempo para realizarla:\n${rompehielos.duracion}\n\nd) ${rompehielos.participacion}\n\ne) ${rompehielos.integracion}\n\nf) ${rompehielos.controlTiempo}`
      : "",
    rhDuracion:      rompehielos ? rompehielos.duracion : "",
    rhMateriales:    rompehielos ? rompehielos.materiales ?? "" : "",
    enNombre,
    enObjetivo:      energizante ? energizante.objetivo      : "",
    enInstrucciones: energizante ? energizante.instrucciones : "",
    enDetalle:       energizante
      ? `a) Explicará objetivo de la técnica:\n${energizante.objetivo}\n\nb) Dará las instrucciones de la técnica:\n${energizante.instrucciones}`
      : "",
    enDuracion:  "",
    enMateriales: "",
    rompehielos,
    energizante,
  };
}

export function guardarTecnicasTemporal() {
  if (_cargando) return;
  const data = recolectarTecnicas();
  const rhSel = obtenerRadioSeleccionado("tecnicaIntegracion");
  const enSel = obtenerRadioSeleccionado("tecnicaEnergizante");
  data.rhSeleccion = rhSel ? rhSel.value : "";
  data.enSeleccion = enSel ? enSel.value : "";
  localStorage.setItem("ec0217_tecnicas", JSON.stringify(data));
}

export function restaurarDetalleIntegracionGuardado(data) {
  if (!data) return;
  const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
  set("detalleIntegracionNombre",        data.rhNombre        || data.rompehielos?.nombre        || "");
  set("detalleIntegracionObjetivo",      data.rhObjetivo      || data.rompehielos?.objetivo      || "");
  set("detalleIntegracionInstrucciones", data.rhInstrucciones || data.rompehielos?.instrucciones || "");
}

export function restaurarNavegacionTecnicas() {
  const flags = [
    ["ec0217_temario_completo",      "nav-temario",      "nav-integracion"],
    ["ec0217_integracion_completo",  "nav-integracion",  "nav-preguntas"],
    ["ec0217_preguntas_completo",    "nav-preguntas",    "nav-reglas"],
    ["ec0217_reglas_completo",       "nav-reglas",       "nav-contrato"],
    ["ec0217_contrato_completo",     "nav-contrato",     "nav-expositiva"],
    ["ec0217_expositiva_completo",   "nav-expositiva",   "nav-demostrativa"],
    ["ec0217_demostrativa_completo", "nav-demostrativa", "nav-energizante"],
    ["ec0217_energizante_completo",  "nav-energizante",  "nav-dialogo"],
    ["ec0217_dialogo_completo",      "nav-dialogo",      "nav-cierre"],
    ["ec0217_cierre_completo",       "nav-cierre",       "nav-evaluaciones"],
  ];
  flags.forEach(([key, completed, unlocked]) => {
    if (localStorage.getItem(key) === "true") {
      document.getElementById(completed)?.classList.add("completed");
      document.getElementById(unlocked)?.classList.remove("disabled");
    }
  });
}

export function actualizarCamposPersonalizadosTecnicas() {
  const rhSel = obtenerRadioSeleccionado("tecnicaIntegracion");
  const enSel = obtenerRadioSeleccionado("tecnicaEnergizante");
  document.getElementById("camposIntegracionPersonalizada")?.classList.toggle("hidden", !rhSel || rhSel.value !== "personalizada");
  document.getElementById("camposEnergizantePersonalizada")?.classList.toggle("hidden",  !enSel || enSel.value !== "personalizada");
  mostrarDetalleIntegracion();
  mostrarDetalleEnergizante();
}

export function inicializarTecnicasPersonalizadasPorDefecto() {
  if (localStorage.getItem("ec0217_tecnicas")) return;
  const rh = document.querySelector('input[name="tecnicaIntegracion"][value="personalizada"]');
  const en = document.querySelector('input[name="tecnicaEnergizante"][value="personalizada"]');
  if (rh) rh.checked = true;
  if (en) en.checked = true;
  actualizarCamposPersonalizadosTecnicas();
  guardarTecnicasTemporal();
}

export function validarIntegracion() {
  const errEl = document.getElementById("err-integracion");
  if (errEl) errEl.style.display = "none";
  const data = recolectarTecnicas();
  if (!data.rhNombre || !data.rhObjetivo || !data.rhInstrucciones) {
    if (errEl) errEl.style.display = "block";
    return false;
  }
  return true;
}

export function validarEnergizante() {
  const errEl = document.getElementById("err-energizante");
  if (errEl) errEl.style.display = "none";
  const data = recolectarTecnicas();
  if (!data.enNombre || !data.enObjetivo || !data.enInstrucciones) {
    if (errEl) errEl.style.display = "block";
    return false;
  }
  return true;
}

export function guardarIntegracionFinal() {
  guardarTecnicasTemporal();
  localStorage.setItem("ec0217_integracion_completo", "true");
  document.getElementById("nav-integracion")?.classList.add("completed");
  document.getElementById("nav-preguntas")?.classList.remove("disabled");
}

export function guardarEnergizanteFinal() {
  guardarTecnicasTemporal();
  localStorage.setItem("ec0217_energizante_completo", "true");
  document.getElementById("nav-energizante")?.classList.add("completed");
  document.getElementById("nav-dialogo")?.classList.remove("disabled");
}

export function guardarTecnicasFinal() {
  const data = recolectarTecnicas();
  const rhSel = obtenerRadioSeleccionado("tecnicaIntegracion");
  const enSel = obtenerRadioSeleccionado("tecnicaEnergizante");
  data.rhSeleccion = rhSel ? rhSel.value : "";
  data.enSeleccion = enSel ? enSel.value : "";
  localStorage.setItem("ec0217_tecnicas", JSON.stringify(data));
  localStorage.setItem("ec0217_tecnicas_completo", "true");
  document.getElementById("nav-energizante")?.classList.add("completed");
  document.getElementById("nav-dialogo")?.classList.remove("disabled");
}

export function cargarTecnicas() {
  const raw = localStorage.getItem("ec0217_tecnicas");
  if (!raw) return;
  _cargando = true;
  try {
    const data = JSON.parse(raw);
    const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };

    const checkRadio = (name, val) => {
      if (!val) return;
      const r = document.querySelector(`input[name="${name}"][value="${val}"]`);
      if (r) r.checked = true;
    };
    checkRadio("tecnicaIntegracion", data.rhSeleccion);
    checkRadio("tecnicaEnergizante",  data.enSeleccion);

    set("detalleIntegracionNombre",        data.rhNombre        || data.rompehielos?.nombre        || "");
    set("detalleIntegracionObjetivo",      data.rhObjetivo      || data.rompehielos?.objetivo      || "");
    set("detalleIntegracionInstrucciones", data.rhInstrucciones || data.rompehielos?.instrucciones || "");
    set("detalleEnergizanteNombre",        data.enNombre        || data.energizante?.nombre        || "");
    set("detalleEnergizanteObjetivo",      data.enObjetivo      || data.energizante?.objetivo      || "");
    set("detalleEnergizanteInstrucciones", data.enInstrucciones || data.energizante?.instrucciones || "");

    document.getElementById("camposEnergizantePersonalizada")?.classList.toggle("hidden", data.enSeleccion !== "personalizada");

    if (localStorage.getItem("ec0217_integracion_completo") === "true") {
      document.getElementById("nav-integracion")?.classList.add("completed");
      document.getElementById("nav-preguntas")?.classList.remove("disabled");
    }
    if (localStorage.getItem("ec0217_energizante_completo") === "true") {
      document.getElementById("nav-energizante")?.classList.add("completed");
      document.getElementById("nav-dialogo")?.classList.remove("disabled");
    }
  } catch (_) {}
  finally { _cargando = false; }
}

export function initStepTecnicas() {
  // Inicializar globals compartidos
  window.sbeTecnicasRompehielos  = tecnicasRompehielos;
  window.sbeTecnicasEnergizantes = tecnicasEnergizantes;
  window.cargandoTecnicas        = false;

  window.obtenerRadioSeleccionado             = obtenerRadioSeleccionado;
  window.buscarTecnica                        = buscarTecnica;
  window.recolectarTecnicas                   = recolectarTecnicas;
  window.guardarTecnicasTemporal              = guardarTecnicasTemporal;
  window.restaurarDetalleIntegracionGuardado  = restaurarDetalleIntegracionGuardado;
  window.restaurarNavegacionTecnicas          = restaurarNavegacionTecnicas;
  window.actualizarCamposPersonalizadosTecnicas = actualizarCamposPersonalizadosTecnicas;
  window.inicializarTecnicasPersonalizadasPorDefecto = inicializarTecnicasPersonalizadasPorDefecto;
  window.validarIntegracion                   = validarIntegracion;
  window.validarEnergizante                   = validarEnergizante;
  window.guardarIntegracionFinal              = guardarIntegracionFinal;
  window.guardarEnergizanteFinal              = guardarEnergizanteFinal;
  window.guardarTecnicasFinal                 = guardarTecnicasFinal;
  window.cargarTecnicas                       = cargarTecnicas;

  // Poblar textareas al elegir una técnica (sin este listener, los campos
  // quedan vacíos y la validación falla aunque el radio esté seleccionado)
  document.querySelectorAll('input[name="tecnicaIntegracion"]').forEach(r =>
    r.addEventListener("change", actualizarCamposPersonalizadosTecnicas)
  );
  document.querySelectorAll('input[name="tecnicaEnergizante"]').forEach(r =>
    r.addEventListener("change", actualizarCamposPersonalizadosTecnicas)
  );
}
