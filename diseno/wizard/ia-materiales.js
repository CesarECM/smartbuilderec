// ─── wizard/ia-materiales.js — IA para Materiales y Clasificación ────────────
// generarMaterialesIA:   genera los materiales para una técnica individual
// generarClasificacionIA: clasifica el texto de las 5 técnicas en 6 categorías EC0217

import { llamarIA } from "./api.js";
import { BACKEND_URL } from "./config.js";

// fetchConTimeout con fallback a fetch nativo (igual que api.js)
function _fetchIA() {
  return typeof fetchConTimeout === "function" ? fetchConTimeout : fetch;
}

const TECNICAS_MAT = ["integracion", "expositiva", "demostrativa", "energizante", "dialogo"];

const MAP_REQ = {
  instalaciones:        "req-instalaciones",
  equipo:               "req-equipo",
  materialesDidacticos: "req-materiales-didacticos",
  humanos:              "req-humanos",
  otros:                "req-otros",
  seguridad:            "req-seguridad",
};

export async function generarMaterialesIA(tecnica) {
  const loader     = document.getElementById(`loaderMat-${tecnica}`);
  const textareaEl = document.getElementById(`mat-${tecnica}`);
  if (!loader || !textareaEl) return;

  const btn = document.querySelector(`.btn-generar-materiales[data-tecnica="${tecnica}"]`);

  const datos        = getData("ec0217_datos")        || {};
  const objetivos    = getData("ec0217_objetivos")    || {};
  const temario      = getData("ec0217_temario")      || {};
  const tecnicas     = getData("ec0217_tecnicas")     || {};
  const expositiva   = getData("ec0217_expositiva")   || {};
  const demostrativa = getData("ec0217_demostrativa") || {};
  const dialogo      = getData("ec0217_dialogo")      || {};

  if (btn) { btn.disabled = true; btn.textContent = "Generando…"; }
  loader.style.display = "block";

  try {
    const data = await llamarIA("generate-materiales", {
      tecnica,
      nombreCurso:     datos.nombreCurso || "",
      perfil:          datos.perfil      || "",
      objetivoGeneral: objetivos.general || "",
      objetivos,
      temario,
      tecnicas,
      expositiva,
      demostrativa,
      dialogo,
    });

    textareaEl.value = data.texto || "";
    if (typeof window.guardarMateriales === "function") window.guardarMateriales();

  } catch (err) {
    const msg = typeof mensajeAmigable === "function" ? mensajeAmigable(err) : err.message;
    if (typeof showAlert === "function") showAlert(`⚠️ Error al generar materiales para ${tecnica}:\n\n${msg}`);
    console.error(`Error al generar materiales para ${tecnica}:`, err);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "✨ Generar con IA"; }
    loader.style.display = "none";
  }
}

export async function generarClasificacionIA() {
  const btnClas    = document.getElementById("btnGenerarClasificacion");
  const loaderClas = document.getElementById("loaderClasificacion");

  const payload = {};
  TECNICAS_MAT.forEach(t => { payload[t] = document.getElementById(`mat-${t}`)?.value.trim() || ""; });

  const hayContenido = Object.values(payload).some(v => v.length > 0);
  if (!hayContenido) {
    if (typeof showAlert === "function") showAlert(
      "Primero genera los materiales de cada técnica usando el botón de arriba antes de clasificar.",
      { title: "Sin contenido para clasificar" }
    );
    return;
  }

  if (btnClas) { btnClas.disabled = true; btnClas.textContent = "⏳ Clasificando…"; }
  if (loaderClas) loaderClas.style.display = "block";

  try {
    const fetchFn  = _fetchIA();
    const response = await fetchFn(`${BACKEND_URL}/generate-materiales-clasificados`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    }, 60000);

    if (!response.ok) {
      let det = `HTTP ${response.status}`;
      try { const e = await response.json(); det = e.detail || det; } catch (_) {}
      throw new Error(det);
    }

    const data = await response.json();

    Object.entries(MAP_REQ).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (el) el.value = data[key] || "";
    });

    if (typeof window.guardarMateriales === "function") window.guardarMateriales();
    if (typeof showToast === "function") showToast("Materiales clasificados correctamente", "success");

  } catch (err) {
    const msg = typeof mensajeAmigable === "function" ? mensajeAmigable(err) : err.message;
    if (typeof showAlert === "function") showAlert(`⚠️ No se pudo clasificar:\n\n${msg}`);
    console.error("Error clasificando materiales:", err);
  } finally {
    if (btnClas)    { btnClas.disabled = false; btnClas.textContent = "✨ Clasificar materiales por categoría"; }
    if (loaderClas) loaderClas.style.display = "none";
  }
}

export function initIAMateriales() {
  window.generarMaterialesIA    = generarMaterialesIA;
  window.generarClasificacionIA = generarClasificacionIA;
}
