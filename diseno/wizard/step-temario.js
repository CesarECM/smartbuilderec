// ─── wizard/step-temario.js — Paso 4: Temario del Curso ──────────────────────
// Usa window.sbeTemario (expuesto por app.js) para compartir el array `temario`
// con los event listeners de app.js.

const _temario = () => window.sbeTemario || { u1: [], u2: [], u3: [] };

export function temarioTieneDatos() {
  const t = _temario();
  return t.u1.length > 0 || t.u2.length > 0 || t.u3.length > 0;
}

export function guardarTemarioTemporal() {
  localStorage.setItem("ec0217_temario", JSON.stringify(_temario()));
}

export function renderListaTemas(unidad, contenedor) {
  if (!contenedor) return;
  const t = _temario();
  contenedor.innerHTML = "";

  if (!t[unidad] || t[unidad].length === 0) {
    contenedor.innerHTML = `<p class="hint">Aún no has agregado temas.</p>`;
    return;
  }

  t[unidad].forEach((tema, index) => {
    const div = document.createElement("div");
    div.className = "tema-item";
    div.innerHTML = `<span>${tema}</span><button type="button" data-unidad="${unidad}" data-index="${index}">Eliminar</button>`;
    contenedor.appendChild(div);
  });

  contenedor.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      const u = btn.dataset.unidad;
      const i = parseInt(btn.dataset.index, 10);
      _temario()[u].splice(i, 1);
      guardarTemarioTemporal();
      renderTemario();
    });
  });
}

export function renderTemario() {
  renderListaTemas("u1", document.getElementById("listaTemasU1"));
  renderListaTemas("u2", document.getElementById("listaTemasU2"));
  renderListaTemas("u3", document.getElementById("listaTemasU3"));
}

export function agregarTema(unidad, input) {
  if (!input) return;
  const texto = input.value.trim();
  if (!texto) { if (typeof showAlert === "function") showAlert("Escribe un tema antes de agregar."); return; }
  _temario()[unidad].push(texto);
  input.value = "";
  guardarTemarioTemporal();
  renderTemario();
  limpiarErroresTemario();
}

export function limpiarErroresTemario() {
  ["err-u1","err-u2","err-u3"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}

export function validarTemario() {
  limpiarErroresTemario();
  const t = _temario();
  let valido = true;
  ["u1","u2","u3"].forEach(u => {
    if (t[u].length === 0) {
      const errEl = document.getElementById(`err-${u}`);
      if (errEl) errEl.style.display = "block";
      valido = false;
    }
  });
  return valido;
}

export function guardarTemarioFinal() {
  localStorage.setItem("ec0217_temario", JSON.stringify(_temario()));
  localStorage.setItem("ec0217_temario_completo", "true");
  document.getElementById("nav-temario")?.classList.add("completed");
  document.getElementById("nav-integracion")?.classList.remove("disabled");
}

export function cargarTemario() {
  const raw = localStorage.getItem("ec0217_temario");
  if (!raw) return;
  try {
    const data = JSON.parse(raw);
    const t = _temario();
    t.u1 = Array.isArray(data.u1) ? data.u1 : [];
    t.u2 = Array.isArray(data.u2) ? data.u2 : [];
    t.u3 = Array.isArray(data.u3) ? data.u3 : [];
    renderTemario();
    if (localStorage.getItem("ec0217_temario_completo") === "true") {
      document.getElementById("nav-temario")?.classList.add("completed");
      document.getElementById("nav-integracion")?.classList.remove("disabled");
    }
  } catch (_) {}
}

export function initStepTemario() {
  if (!window.sbeTemario) window.sbeTemario = { u1: [], u2: [], u3: [] };

  window.temarioTieneDatos    = temarioTieneDatos;
  window.guardarTemarioTemporal = guardarTemarioTemporal;
  window.renderListaTemas     = renderListaTemas;
  window.renderTemario        = renderTemario;
  window.agregarTema          = agregarTema;
  window.limpiarErroresTemario = limpiarErroresTemario;
  window.validarTemario       = validarTemario;
  window.guardarTemarioFinal  = guardarTemarioFinal;
  window.cargarTemario        = cargarTemario;
}
