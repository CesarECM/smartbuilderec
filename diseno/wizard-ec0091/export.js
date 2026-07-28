// ─── wizard-ec0091/export.js — Descarga ZIP EC0091 ───────────────────────────

import { BACKEND_URL } from "./config.js";

function _recolectarPayload() {
  const leer = key => { const r = localStorage.getItem(key); return r ? JSON.parse(r) : {}; };
  return {
    datos:        leer("ec0091_datos"),
    objetivo:     leer("ec0091_objetivo"),
    antecedentes: leer("ec0091_antecedentes"),
    lineas:       leer("ec0091_lineas"),
    muestreo:     leer("ec0091_muestreo"),
    documentos:   leer("ec0091_documentos"),
    cronograma:   leer("ec0091_cronograma"),
    lista:        leer("ec0091_lista"),
    ejecucion:    leer("ec0091_ejecucion"),
    hallazgos:    leer("ec0091_hallazgos"),
    informe:      leer("ec0091_informe"),
    cierre:       leer("ec0091_cierre"),
    expediente:   leer("ec0091_expediente"),
  };
}

export async function descargarZipEC0091() {
  const btn    = document.getElementById("btn91DescargarZIP");
  const msg    = document.getElementById("msgExpediente91");
  const loader = document.getElementById("loader91Expediente");

  if (btn) { btn.disabled = true; btn.textContent = "Generando documentos..."; }
  if (loader) loader.style.display = "block";
  if (msg)   { msg.style.display = "none"; }

  try {
    const payload    = _recolectarPayload();
    const session    = typeof getSession === "function" ? await getSession() : null;
    const authHeader = session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {};
    const recordId   = localStorage.getItem("sbe_ec0091_id");
    if (recordId) payload.registro_id = recordId;

    const response = await fetch(`${BACKEND_URL}/ec0091/generate-doc`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let det = `HTTP ${response.status}`;
      try { const j = await response.json(); det = j.detail || det; } catch (_) {}
      throw new Error(det);
    }

    const blob = await response.blob();
    const oc   = payload.datos?.oc91NombreOrganismo?.replace(/\s+/g, "_") || "EC0091";
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href = url; a.download = `Verificacion_${oc}.zip`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);

    // credito_canjeado lo marca el backend; no duplicar aquí

    // Celebración
    const overlay = document.getElementById("celebration-overlay");
    if (overlay) { overlay.classList.add("show"); setTimeout(() => overlay.classList.remove("show"), 3200); }

    if (msg) { msg.style.display = "block"; msg.style.color = "green"; msg.textContent = "✅ Descarga iniciada correctamente."; }

    if (typeof window.logEvento === "function")
      window.logEvento("ec0091.descarga.ok", { nombre_oc: payload.datos?.oc91NombreOrganismo || "" });

  } catch (err) {
    console.error("Error descarga EC0091:", err);
    if (msg) { msg.style.display = "block"; msg.style.color = "red"; msg.textContent = `⚠️ Error: ${err.message}`; }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "📦 Descargar expediente completo (.zip)"; }
    if (loader) loader.style.display = "none";
  }
}

export function initExport91() {
  window.descargarZipEC0091 = descargarZipEC0091;
  document.getElementById("btn91DescargarZIP")?.addEventListener("click", descargarZipEC0091);
}
