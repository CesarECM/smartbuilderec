// ─── wizard/ia-perfil.js — IA para Perfil del Participante / Requisitos de Ingreso ──
// Genera perfil del participante y requisitos de ingreso cubriendo EC0217.01 y EC0301

import { llamarIA } from "./api.js";
import { guardarUndo, mostrarUndo } from "./undo.js";

export async function generarPerfilIA() {
  // Leer del DOM primero: el usuario puede no haber guardado aún los datos del paso 1
  const nombreCurso = document.getElementById("nombreCurso")?.value.trim()
                   || (getData("ec0217_datos") || {}).nombreCurso || "";

  if (!nombreCurso) {
    if (typeof showAlert === "function")
      showAlert("Primero escribe el nombre del curso para generar el perfil.");
    return;
  }

  const ta = document.getElementById("perfil");
  if (ta && ta.value.trim()) {
    if (typeof showConfirm === "function") {
      const ok = await showConfirm(
        "Ya tienes un perfil escrito. Si generas con IA, se reemplazará. ¿Deseas continuar?",
        { title: "Reemplazar perfil", icon: "⚠️", confirmText: "Sí, reemplazar", danger: true }
      );
      if (!ok) return;
    }
  }

  const loader = document.getElementById("loaderPerfil");
  const btn    = document.getElementById("btnGenerarPerfil");

  guardarUndo("ec0217_datos", "cargarDatosCurso");
  try {
    if (loader) loader.style.display = "block";
    if (btn) { btn.disabled = true; btn.textContent = "Generando..."; }

    const data = await llamarIA("generate-perfil", {
      nombre: nombreCurso,
    });

    if (ta) ta.value = data.perfil || "";
    mostrarUndo("Perfil", "btnGenerarPerfil");

  } catch (err) {
    console.error("Error al generar perfil:", err);
    const msg = typeof mensajeAmigable === "function" ? mensajeAmigable(err) : err.message;
    if (typeof showAlert === "function") showAlert(`No se pudo generar el perfil:\n\n${msg}`);
  } finally {
    if (loader) loader.style.display = "none";
    if (btn) { btn.disabled = false; btn.textContent = "✨ Completar con IA"; }
  }
}

export function initIAPerfil() {
  window.generarPerfilIA = generarPerfilIA;
  document.getElementById("btnGenerarPerfil")?.addEventListener("click", () => generarPerfilIA());
}
