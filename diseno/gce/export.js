// ─── gce/export.js — Descarga del portafolio completo en ZIP ─────────────────

import { state } from "./state.js";
import { BACKEND_URL } from "./config.js";

export async function descargarPortafolioZip() {
  const btn = document.getElementById("gce-btn-descarga");
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Generando ZIP…"; }

  try {
    const headers = await window.getAuthHeaders?.();
    if (!headers) return;

    const res = await fetch(`${BACKEND_URL}/gce/generate-portafolio`, {
      method: "POST",
      headers: { ...headers, "Content-Type": "application/json" },
      body: JSON.stringify({ proceso_id: state.procesoId }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      if (res.status === 402) {
        alert("Sin créditos disponibles. Contacta al administrador de tu Centro de Evaluación.");
      } else {
        alert(`Error al generar el portafolio: ${err.detail || res.status}`);
      }
      if (btn) { btn.disabled = false; btn.textContent = "📥 Descargar Portafolio completo (ZIP)"; }
      return;
    }

    const blob = await res.blob();
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    const cd   = res.headers.get("Content-Disposition") || "";
    const match = cd.match(/filename=([^;\s]+)/);
    a.href     = url;
    a.download = match ? match[1].trim() : "Portafolio_GCE.zip";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    if (btn) { btn.textContent = "✓ Descargado"; }
  } catch {
    if (btn) { btn.disabled = false; btn.textContent = "📥 Descargar Portafolio completo (ZIP)"; }
  }
}
