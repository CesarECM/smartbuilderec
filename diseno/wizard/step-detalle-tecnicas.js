// ─── wizard/step-detalle-tecnicas.js — Renderizado de detalles de técnicas ───

import { tecnicasRompehielos, tecnicasEnergizantes } from "./tecnicas-data.js";

const _tecRH  = () => window.sbeTecnicasRompehielos  || tecnicasRompehielos;
const _tecEN  = () => window.sbeTecnicasEnergizantes || tecnicasEnergizantes;
const _cargando = () => window.cargandoTecnicas;

function _buscarTecnica(lista, id) {
  return lista.find(item => item.id === id);
}

export function mostrarDetalleIntegracion() {
  const seleccionada = document.querySelector('input[name="tecnicaIntegracion"]:checked');
  const nombre       = document.getElementById("detalleIntegracionNombre");
  const objetivo     = document.getElementById("detalleIntegracionObjetivo");
  const instrucciones = document.getElementById("detalleIntegracionInstrucciones");

  if (!seleccionada) {
    if (nombre) nombre.value = "Información de la técnica de integración";
    if (objetivo) objetivo.value = "";
    if (instrucciones) instrucciones.value = "";
    return;
  }

  if (seleccionada.value === "personalizada") {
    if (nombre && !nombre.value) nombre.value = "Técnica personalizada";
    if (!_cargando() && typeof window.guardarTecnicasTemporal === "function") window.guardarTecnicasTemporal();
    return;
  }

  const tecnica = _buscarTecnica(_tecRH(), seleccionada.value);
  if (!tecnica) return;
  if (nombre) nombre.value = tecnica.nombre;
  if (objetivo) objetivo.value = tecnica.objetivo || "";
  if (instrucciones) instrucciones.value = tecnica.instrucciones || "";
  if (!_cargando() && typeof window.guardarTecnicasTemporal === "function") window.guardarTecnicasTemporal();
}

export function mostrarDetalleEnergizante() {
  const seleccionada  = document.querySelector('input[name="tecnicaEnergizante"]:checked');
  const nombre        = document.getElementById("detalleEnergizanteNombre");
  const objetivo      = document.getElementById("detalleEnergizanteObjetivo");
  const instrucciones = document.getElementById("detalleEnergizanteInstrucciones");

  if (!seleccionada) {
    if (nombre) nombre.value = "Información de la técnica energizante";
    if (objetivo) objetivo.value = "";
    if (instrucciones) instrucciones.value = "";
    return;
  }

  if (seleccionada.value === "personalizada") {
    if (nombre && !nombre.value) nombre.value = "Técnica personalizada";
    if (!_cargando() && typeof window.guardarTecnicasTemporal === "function") window.guardarTecnicasTemporal();
    return;
  }

  const tecnica = _buscarTecnica(_tecEN(), seleccionada.value);
  if (!tecnica) return;
  if (nombre) nombre.value = tecnica.nombre;
  if (objetivo) objetivo.value = tecnica.objetivo || "";
  if (instrucciones) instrucciones.value = tecnica.instrucciones || "";
  if (!_cargando() && typeof window.guardarTecnicasTemporal === "function") window.guardarTecnicasTemporal();
}

export function initStepDetalleTecnicas() {
  window.mostrarDetalleIntegracion = mostrarDetalleIntegracion;
  window.mostrarDetalleEnergizante = mostrarDetalleEnergizante;
}
