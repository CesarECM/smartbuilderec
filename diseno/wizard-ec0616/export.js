// ─── wizard-ec0616/export.js — Descarga ZIP EC0616 ───────────────────────────

import { BACKEND_URL } from "./config.js";
import { ELEMENTOS }   from "./config.js";

function _recolectarPayload() {
  const leer = key => { const r = localStorage.getItem(key); return r ? JSON.parse(r) : {}; };
  const payload = { datos: leer("ec0616_datos"), portafolio: leer("ec0616_portafolio") };
  ELEMENTOS.forEach(e => { payload[e.id] = leer(e.clave); });
  return payload;
}

export async function descargarZipEC0616() {
  const btn    = document.getElementById("btn16DescargarZIP");
  const msg    = document.getElementById("msgPortafolio16");
  const loader = document.getElementById("loader16ZIP");

  if (btn) { btn.disabled = true; btn.textContent = "Generando documentos..."; }
  if (loader) loader.style.display = "block";
  if (msg) msg.style.display = "none";

  try {
    const payload    = _recolectarPayload();
    const session    = typeof getSession === "function" ? await getSession() : null;
    const authHeader = session?.access_token ? { "Authorization": `Bearer ${session.access_token}` } : {};
    const recordId   = localStorage.getItem("sbe_ec0616_id");
    if (recordId) payload.registro_id = recordId;

    const response = await fetch(`${BACKEND_URL}/ec0616/generate-doc`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      let det = `HTTP ${response.status}`;
      try { const j = await response.json(); det = j.detail || det; } catch (_) {}
      throw new Error(det);
    }

    const blob   = await response.blob();
    const nombre = [payload.datos?.cand16Nombre, payload.datos?.cand16Apellidos].filter(Boolean).join("_").replace(/\s+/g, "_") || "EC0616";
    const url    = URL.createObjectURL(blob);
    const a      = document.createElement("a");
    a.href = url; a.download = `Portafolio_${nombre}.zip`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);

    // credito_canjeado lo marca el backend; no duplicar aquí

    const overlay = document.getElementById("celebration-overlay");
    if (overlay) { overlay.classList.add("show"); setTimeout(() => overlay.classList.remove("show"), 3200); }

    if (msg) { msg.style.display = "block"; msg.style.color = "green"; msg.textContent = "✅ Descarga iniciada correctamente."; }

    if (typeof window.logEvento === "function")
      window.logEvento("ec0616.descarga.ok", { nombre_candidato: nombre });

  } catch (err) {
    console.error("Error descarga EC0616:", err);
    if (msg) { msg.style.display = "block"; msg.style.color = "red"; msg.textContent = `⚠️ Error: ${err.message}`; }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "📦 Descargar portafolio completo (.zip)"; }
    if (loader) loader.style.display = "none";
  }
}

export function initExport16() {
  window.descargarZipEC0616 = descargarZipEC0616;
  document.getElementById("btn16DescargarZIP")?.addEventListener("click", descargarZipEC0616);
}
