// ─── wizard/ia-temario.js — IA para Temario del Curso ───────────────────────
// generarTemarioIA: sugiere temas para las 3 unidades con IA

import { llamarIA } from "./api.js";

const _temario = () => window.sbeTemario || { u1: [], u2: [], u3: [] };

export async function generarTemarioIA() {
  if (typeof window.temarioTieneDatos === "function" && window.temarioTieneDatos()) {
    if (typeof showConfirm === "function") {
      const ok = await showConfirm(
        "Ya tienes temas escritos. Si generas temas con IA, los temas actuales se eliminarán y serán reemplazados por nuevas sugerencias. ¿Deseas continuar?",
        { title: "Reemplazar temario", icon: "⚠️", confirmText: "Sí, reemplazar", danger: true }
      );
      if (!ok) return;
    }
  }

  const datos     = getData("ec0217_datos")     || {};
  const objetivos = getData("ec0217_objetivos") || {};
  const beneficios = getData("ec0217_beneficios") || {};
  const beneficiosTexto = typeof beneficios === "string"
    ? beneficios
    : (beneficios.lista || beneficios.texto || "");

  if (!objetivos.general) {
    if (typeof showAlert === "function") showAlert("Primero necesitas tener generado el objetivo general para poder sugerir el temario.");
    return;
  }

  const loaderTemario   = document.getElementById("loaderTemario");
  const btnGenerarTemario = document.getElementById("btnGenerarTemario");

  try {
    if (loaderTemario) loaderTemario.style.display = "block";
    if (btnGenerarTemario) btnGenerarTemario.disabled = true;

    const data = await llamarIA("generate-temario", {
      nombre:      datos.nombreCurso || "",
      general:     objetivos.general     || "",
      cognitiva:   objetivos.cognitiva   || "",
      psicomotriz: objetivos.psicomotriz || "",
      afectiva:    objetivos.afectiva    || "",
      beneficios:  beneficiosTexto,
    });

    const t = _temario();
    t.u1 = Array.isArray(data.u1) ? data.u1 : [];
    t.u2 = Array.isArray(data.u2) ? data.u2 : [];
    t.u3 = Array.isArray(data.u3) ? data.u3 : [];

    if (typeof window.guardarTemarioTemporal  === "function") window.guardarTemarioTemporal();
    if (typeof window.renderTemario           === "function") window.renderTemario();
    if (typeof window.limpiarErroresTemario   === "function") window.limpiarErroresTemario();

  } catch (err) {
    console.error("Error al generar temario:", err);
    const msg = typeof mensajeAmigable === "function" ? mensajeAmigable(err) : err.message;
    if (typeof showAlert === "function") showAlert(`No se pudo generar el temario:\n\n${msg}`);
  } finally {
    if (loaderTemario) loaderTemario.style.display = "none";
    if (btnGenerarTemario) btnGenerarTemario.disabled = false;
  }
}

export function initIATemario() {
  window.generarTemarioIA = generarTemarioIA;
}
