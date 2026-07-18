// ─── wizard/ia-beneficios.js — IA para Beneficios del Curso ──────────────────
// generarBeneficiosIA: sugiere beneficios del curso a partir del objetivo general

import { llamarIA } from "./api.js";
import { guardarUndo, mostrarUndo } from "./undo.js";

export async function generarBeneficiosIA() {
  const datos    = getData("ec0217_datos")     || {};
  const objetivos = getData("ec0217_objetivos") || {};

  if (!objetivos.general) {
    if (typeof showAlert === "function")
      showAlert("Primero necesitas tener generado el objetivo general para sugerir los beneficios.");
    return;
  }

  const ta = document.getElementById("beneficiosTexto");
  if (ta && ta.value.trim()) {
    if (typeof showConfirm === "function") {
      const ok = await showConfirm(
        "Ya tienes beneficios escritos. Si generas con IA, se reemplazarán. ¿Deseas continuar?",
        { title: "Reemplazar beneficios", icon: "⚠️", confirmText: "Sí, reemplazar", danger: true }
      );
      if (!ok) return;
    }
  }

  const loader = document.getElementById("loaderBeneficios");
  const btn    = document.getElementById("btnGenerarBeneficios");

  guardarUndo("ec0217_beneficios", "cargarBeneficios");
  try {
    if (loader) loader.style.display = "block";
    if (btn) { btn.disabled = true; btn.textContent = "Generando..."; }

    const data = await llamarIA("generate-beneficios", {
      general: objetivos.general || "",
      nombre:  datos.nombreCurso || "",
    });

    if (ta) {
      ta.value = data.beneficios || "";
      localStorage.setItem("ec0217_beneficios", JSON.stringify({ lista: ta.value.trim() }));
    }
    mostrarUndo("Beneficios", "btnGenerarBeneficios");

  } catch (err) {
    console.error("Error al generar beneficios:", err);
    const msg = typeof mensajeAmigable === "function" ? mensajeAmigable(err) : err.message;
    if (typeof showAlert === "function") showAlert(`No se pudieron generar los beneficios:\n\n${msg}`);
  } finally {
    if (loader) loader.style.display = "none";
    if (btn) { btn.disabled = false; btn.textContent = "✨ Generar beneficios con IA"; }
  }
}

export function initIABeneficios() {
  window.generarBeneficiosIA = generarBeneficiosIA;
  document.getElementById("btnGenerarBeneficios")?.addEventListener("click", () => generarBeneficiosIA());
}
