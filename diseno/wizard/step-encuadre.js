// ─── wizard/step-encuadre.js — Pasos 5-8: Encuadre del Curso ────────────────
// Usa window.sbeAcuerdosPersonalizados (expuesto por app.js) para compartir
// el array de acuerdos con los event listeners de app.js.

const _acuerdos = () => window.sbeAcuerdosPersonalizados || [];

export function obtenerChecksSeleccionados(selector) {
  return Array.from(document.querySelectorAll(selector))
    .filter(c => c.checked)
    .map(c => c.value);
}

export function copiarReglasSeleccionadasATextarea() {
  const reglasSeleccionadas = obtenerChecksSeleccionados(".regla-check");
  const otraRegla = document.getElementById("otraRegla");
  const reglaExtra = otraRegla ? otraRegla.value.trim() : "";
  if (reglaExtra) reglasSeleccionadas.push(reglaExtra);

  if (reglasSeleccionadas.length === 0) {
    if (typeof showAlert === "function") showAlert("Selecciona al menos una regla antes de copiar.");
    return;
  }
  const reglasCursoTexto = document.getElementById("reglasCursoTexto");
  if (reglasCursoTexto) {
    reglasCursoTexto.value = reglasSeleccionadas.map(r => `• ${r}`).join("\n");
  }
  guardarEncuadreTemporal();
}

export function inicializarContratoPorDefecto() {
  if (localStorage.getItem("ec0217_contrato_inicializado") === "true") return;
  document.querySelectorAll(".acuerdo-check").forEach(c => { c.checked = true; });
  localStorage.setItem("ec0217_contrato_inicializado", "true");
  guardarEncuadreTemporal();
}

export function renderAcuerdosPersonalizados() {
  const lista = document.getElementById("listaAcuerdosPersonalizados");
  if (!lista) return;
  const acuerdos = _acuerdos();
  lista.innerHTML = "";

  if (acuerdos.length === 0) {
    lista.innerHTML = `<p class="hint">Aún no has agregado compromisos personalizados.</p>`;
    return;
  }

  acuerdos.forEach((acuerdo, index) => {
    const div = document.createElement("div");
    div.className = "tema-item";
    div.innerHTML = `<span>${acuerdo}</span><button type="button" data-index="${index}">Eliminar</button>`;
    lista.appendChild(div);
  });

  lista.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      acuerdos.splice(parseInt(btn.dataset.index, 10), 1);
      guardarEncuadreTemporal();
      renderAcuerdosPersonalizados();
    });
  });
}

export function agregarAcuerdoPersonalizado() {
  const otroAcuerdo = document.getElementById("otroAcuerdo");
  if (!otroAcuerdo) return;
  const texto = otroAcuerdo.value.trim();
  if (!texto) { if (typeof showAlert === "function") showAlert("Escribe un compromiso antes de agregar."); return; }
  _acuerdos().push(texto);
  otroAcuerdo.value = "";
  guardarEncuadreTemporal();
  renderAcuerdosPersonalizados();
  const errContrato = document.getElementById("err-contrato");
  if (errContrato) errContrato.style.display = "none";
}

export function recolectarEncuadre() {
  const g = id => document.getElementById(id)?.value.trim() || "";
  const reglasSeleccionadas = obtenerChecksSeleccionados(".regla-check");
  const reglaExtra = g("otraRegla");
  if (reglaExtra) reglasSeleccionadas.push(reglaExtra);

  const reglasCursoTexto = document.getElementById("reglasCursoTexto");
  let reglasFinales = [];
  if (reglasCursoTexto && reglasCursoTexto.value.trim()) {
    reglasFinales = reglasCursoTexto.value.split(/\n+/).map(l => l.trim()).filter(Boolean).map(l => l.replace(/^•\s*/, ""));
  } else {
    reglasFinales = reglasSeleccionadas;
  }

  const acuerdos = _acuerdos();
  return {
    preguntas:              g("preguntasEncuadre"),
    reglasTexto:            reglasFinales,
    reglasSeleccionadas,
    otraRegla:              g("otraRegla"),
    acuerdosTexto:          [...obtenerChecksSeleccionados(".acuerdo-check"), ...acuerdos],
    otroAcuerdo:            "",
    acuerdosPersonalizados: acuerdos,
    reglas:                 [],
    acuerdos:               [],
  };
}

export function guardarEncuadreTemporal() {
  localStorage.setItem("ec0217_encuadre", JSON.stringify(recolectarEncuadre()));
}

export function validarPreguntas() {
  const errEl = document.getElementById("err-preguntas");
  if (errEl) errEl.style.display = "none";
  const texto = document.getElementById("preguntasEncuadre")?.value.trim() || "";
  if (!texto) { if (errEl) errEl.style.display = "block"; return false; }
  return true;
}

export function guardarPreguntasFinal() {
  guardarEncuadreTemporal();
  localStorage.setItem("ec0217_preguntas_completo", "true");
  document.getElementById("nav-preguntas")?.classList.add("completed");
  document.getElementById("nav-reglas")?.classList.remove("disabled");
}

export function validarReglas() {
  const errEl = document.getElementById("err-reglas");
  if (errEl) errEl.style.display = "none";
  const data = recolectarEncuadre();
  if (data.reglasTexto.length === 0) { if (errEl) errEl.style.display = "block"; return false; }
  return true;
}

export function validarContrato() {
  const errEl   = document.getElementById("err-contrato");
  const otroAcuerdo = document.getElementById("otroAcuerdo");
  if (errEl) errEl.style.display = "none";
  const seleccionados = obtenerChecksSeleccionados(".acuerdo-check");
  const personalizados = _acuerdos();
  const textoSinAgregar = otroAcuerdo ? otroAcuerdo.value.trim() : "";

  if (!seleccionados.length && !personalizados.length && !textoSinAgregar) {
    if (errEl) errEl.style.display = "block";
    return false;
  }
  if (textoSinAgregar) {
    personalizados.push(textoSinAgregar);
    if (otroAcuerdo) otroAcuerdo.value = "";
    renderAcuerdosPersonalizados();
    guardarEncuadreTemporal();
  }
  return true;
}

export function guardarEncuadreFinal() {
  const data = recolectarEncuadre();
  localStorage.setItem("ec0217_encuadre", JSON.stringify(data));
  localStorage.setItem("ec0217_encuadre_completo", "true");
  document.getElementById("nav-contrato")?.classList.add("completed");
  document.getElementById("nav-expositiva")?.classList.remove("disabled");
}

export function cargarEncuadre() {
  const raw = localStorage.getItem("ec0217_encuadre");
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    const set = (id, val) => { const el = document.getElementById(id); if (el && val !== undefined) el.value = val; };
    set("preguntasEncuadre", data.preguntas);
    set("otraRegla",         data.otraRegla);
    set("otroAcuerdo",       data.otroAcuerdo || "");

    const acuerdos = _acuerdos();
    acuerdos.length = 0;
    if (Array.isArray(data.acuerdosPersonalizados)) acuerdos.push(...data.acuerdosPersonalizados);
    renderAcuerdosPersonalizados();

    document.querySelectorAll(".regla-check").forEach(check => {
      const reglasParaRestaurar = Array.isArray(data.reglasSeleccionadas) ? data.reglasSeleccionadas : data.reglasTexto;
      check.checked = Array.isArray(reglasParaRestaurar) ? reglasParaRestaurar.includes(check.value) : false;
    });
    set("reglasCursoTexto", Array.isArray(data.reglasTexto) ? data.reglasTexto.map(r => `• ${r}`).join("\n") : "");
    document.querySelectorAll(".acuerdo-check").forEach(check => {
      check.checked = Array.isArray(data.acuerdosTexto) ? data.acuerdosTexto.includes(check.value) : false;
    });

    if (localStorage.getItem("ec0217_reglas_completo") === "true") {
      document.getElementById("nav-reglas")?.classList.add("completed");
      document.getElementById("nav-contrato")?.classList.remove("disabled");
    }
    if (localStorage.getItem("ec0217_contrato_completo") === "true") {
      document.getElementById("nav-contrato")?.classList.add("completed");
      document.getElementById("nav-expositiva")?.classList.remove("disabled");
    }
  } catch (_) {}
}

export function initStepEncuadre() {
  window.obtenerChecksSeleccionados       = obtenerChecksSeleccionados;
  window.copiarReglasSeleccionadasATextarea = copiarReglasSeleccionadasATextarea;
  window.inicializarContratoPorDefecto    = inicializarContratoPorDefecto;
  window.renderAcuerdosPersonalizados     = renderAcuerdosPersonalizados;
  window.agregarAcuerdoPersonalizado      = agregarAcuerdoPersonalizado;
  window.recolectarEncuadre               = recolectarEncuadre;
  window.guardarEncuadreTemporal          = guardarEncuadreTemporal;
  window.validarPreguntas                 = validarPreguntas;
  window.guardarPreguntasFinal            = guardarPreguntasFinal;
  window.validarReglas                    = validarReglas;
  window.validarContrato                  = validarContrato;
  window.guardarEncuadreFinal             = guardarEncuadreFinal;
  window.cargarEncuadre                   = cargarEncuadre;
}
