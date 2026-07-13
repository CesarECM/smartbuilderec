// ─── wizard/export.js — Descarga del paquete final EC0217 ─────────────────────
// Depende de fetchConTimeout (shared.js clásico) y recolectarPayload (shared.js),
// que se cargan antes de este módulo.

import { BACKEND_URL }               from "./config.js";
import { mostrarCelebracion }        from "./ui-helpers.js";
import { validarExpedienteCompleto } from "./step-formatos.js";
import { saveDownloadSnapshot }      from "./download-tracker.js";

function _mensajeError(err) {
  if (!err) return "Error desconocido";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || err.toString();
  if (typeof err === "object") return JSON.stringify(err);
  return String(err);
}

export async function descargarPlaneacionFinal() {
  const payload = (typeof window.recolectarPayload === "function")
    ? window.recolectarPayload()
    : {};

  const erroresValidacion = validarExpedienteCompleto();
  if (erroresValidacion.length > 0) {
    const lista = erroresValidacion.map(e => `• ${e}`).join("\n");
    const continuar = await showConfirm(
      `Se encontraron inconsistencias en el expediente:\n\n${lista}\n\nPuedes corregirlas o descargar de todas formas (los documentos se generarán con los datos actuales).`,
      { title: "Revisar antes de descargar", icon: "⚠️", confirmText: "Descargar de todas formas", cancelText: "Ir a corregir" }
    );
    if (!continuar) return;
  }

  const loaderFormatos              = document.getElementById("loaderFormatos");
  const mensajeFormatos             = document.getElementById("mensajeFormatos");
  const btnDescargarPlaneacionFinal = document.getElementById("btnDescargarPlaneacionFinal");

  try {
    if (loaderFormatos) loaderFormatos.style.display = "block";
    if (mensajeFormatos) {
      mensajeFormatos.style.display = "none";
      mensajeFormatos.textContent = "";
    }
    if (btnDescargarPlaneacionFinal) {
      btnDescargarPlaneacionFinal.disabled = true;
      btnDescargarPlaneacionFinal.textContent = "Generando...";
    }

    const fetchFn = typeof fetchConTimeout === "function" ? fetchConTimeout : fetch;
    const response = await fetchFn(`${BACKEND_URL}/generate-doc/planeacion`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let detalle = `HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        const d = errJson.detail;
        detalle = d ? (typeof d === "object" ? JSON.stringify(d) : String(d)) : JSON.stringify(errJson);
      } catch (_) {}
      throw new Error(detalle);
    }

    const blob = await response.blob();
    const url  = URL.createObjectURL(blob);
    const nombreCurso = payload.datos?.nombreCurso || "EC0217";

    const a = document.createElement("a");
    a.href     = url;
    a.download = `Planeacion_${nombreCurso.replace(/\s+/g, "_")}.zip`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    if (typeof logEvento === "function")
      logEvento("wizard.descarga.ok", { nombre_curso: payload.datos?.nombreCurso || "" });

    saveDownloadSnapshot();
    const _badge = document.getElementById("badge-descarga-desactualizada");
    if (_badge) _badge.style.display = "none";

    mostrarCelebracion();

    if (mensajeFormatos) {
      mensajeFormatos.style.display = "block";
      mensajeFormatos.style.color   = "green";
      mensajeFormatos.textContent   = "✅ Descarga iniciada correctamente.";
    }

  } catch (err) {
    if (typeof logEvento === "function")
      logEvento("wizard.descarga.error", { error: String(err?.message || err) });
    console.error("Error al generar formatos:", err);

    if (mensajeFormatos) {
      mensajeFormatos.style.display = "block";
      mensajeFormatos.style.color   = "red";
      mensajeFormatos.textContent   = `⚠️ Error al generar formatos: ${_mensajeError(err)}`;
    }

  } finally {
    if (loaderFormatos) loaderFormatos.style.display = "none";
    if (btnDescargarPlaneacionFinal) {
      btnDescargarPlaneacionFinal.disabled    = false;
      btnDescargarPlaneacionFinal.textContent = "Descargar paquete hasta ahora";
    }
  }
}

export async function descargarDocumentoIndividual(docId, btnEl) {
  const payload  = typeof window.recolectarPayload === "function" ? window.recolectarPayload() : {};
  const original = btnEl?.textContent;
  if (btnEl) { btnEl.disabled = true; btnEl.textContent = "⏳"; }

  try {
    const fetchFn  = typeof fetchConTimeout === "function" ? fetchConTimeout : fetch;
    const response = await fetchFn(`${BACKEND_URL}/generate-doc/individual/${docId}`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify(payload),
    });

    if (!response.ok) {
      let det = `HTTP ${response.status}`;
      try { const j = await response.json(); det = j.detail || det; } catch (_) {}
      throw new Error(det);
    }

    const blob        = await response.blob();
    const disposition = response.headers.get("Content-Disposition") || "";
    const match       = disposition.match(/filename=(.+)/);
    const filename    = match ? match[1].trim() : `${docId}_EC0217.docx`;

    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);

    if (btnEl) { btnEl.textContent = "✅"; setTimeout(() => { btnEl.textContent = original; btnEl.disabled = false; }, 2000); return; }
  } catch (err) {
    if (typeof showAlert === "function") showAlert(`⚠️ Error al descargar: ${_mensajeError(err)}`);
    if (btnEl) btnEl.textContent = original;
  } finally {
    if (btnEl) btnEl.disabled = false;
  }
}

export function initExport() {
  window.descargarPlaneacionFinal      = descargarPlaneacionFinal;
  window.descargarDocumentoIndividual  = descargarDocumentoIndividual;

  const btn = document.getElementById("btnDescargarPlaneacionFinal");
  if (btn) btn.addEventListener("click", descargarPlaneacionFinal);

  document.querySelectorAll(".btn-doc-individual").forEach(b => {
    b.addEventListener("click", () => descargarDocumentoIndividual(b.dataset.doc, b));
  });
}
