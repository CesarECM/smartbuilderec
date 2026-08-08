// ─── wizard-ec0616-tutor/export.js — Descarga ZIP Modo Tutor EC0616 ─────────

import { BACKEND_URL, PREFIJO, ID_KEY } from "./config.js";

const _SECCIONES = [
  "ficha", "confidencial", "diagnostico", "plan",
  "iec1", "iec2", "iec3", "iec4", "iec5", "iec6", "iec7",
  "cierre",
];

function _recolectarPayload() {
  const leer = key => {
    const raw = localStorage.getItem(`${PREFIJO}${key}`);
    return raw ? JSON.parse(raw) : {};
  };
  const payload = {};
  _SECCIONES.forEach(k => { payload[k] = leer(k); });
  return payload;
}

export async function descargarZipTutor() {
  const btn    = document.getElementById("btn-cierre-generar-zip");
  const loader = document.getElementById("cierre-zip-loader");
  const msg    = document.getElementById("cierre-zip-msg");

  if (btn)    { btn.disabled = true; btn.textContent = "Generando documentos…"; }
  if (loader) { loader.style.display = "block"; }
  if (msg)    { msg.style.display = "none"; }

  try {
    const payload    = _recolectarPayload();
    const session    = typeof getSession === "function" ? await getSession() : null;
    const authHeader = session?.access_token
      ? { "Authorization": `Bearer ${session.access_token}` } : {};
    const recordId   = localStorage.getItem(ID_KEY);
    if (recordId) payload.registro_id = recordId;

    const response = await fetch(`${BACKEND_URL}/ec0616-tutor/generate-doc`, {
      method:  "POST",
      headers: { "Content-Type": "application/json", ...authHeader },
      body:    JSON.stringify(payload),
    });

    if (!response.ok) {
      let det = `HTTP ${response.status}`;
      try { const j = await response.json(); det = j.detail || det; } catch (_) {}
      throw new Error(det);
    }

    const blob  = await response.blob();
    const ficha = payload.ficha || {};
    const nombre = [ficha.nombre_candidato, ficha.apellidos_candidato]
      .filter(Boolean).join("_").replace(/\s+/g, "_") || "EC0616_Tutor";
    const url = URL.createObjectURL(blob);
    const a   = document.createElement("a");
    a.href = url; a.download = `Portafolio_Tutor_${nombre}.zip`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);

    const overlay = document.getElementById("celebration-overlay");
    if (overlay) { overlay.classList.add("show"); setTimeout(() => overlay.classList.remove("show"), 3200); }

    if (msg) {
      msg.style.display = "block";
      msg.style.color   = "#065f46";
      msg.textContent   = "✅ Descarga iniciada correctamente.";
    }

    if (typeof window.logEvento === "function")
      window.logEvento("ec0616_tutor.descarga.ok", { nombre_candidato: nombre });

  } catch (err) {
    console.error("Error descarga Tutor EC0616:", err);
    if (msg) {
      msg.style.display = "block";
      msg.style.color   = "#b91c1c";
      msg.textContent   = `⚠️ Error: ${err.message}`;
    }
  } finally {
    if (btn)    { btn.disabled = false; btn.textContent = "📦 Generar portafolio (.zip)"; }
    if (loader) { loader.style.display = "none"; }
  }
}

export function initExportTutor() {
  window.descargarZipTutor = descargarZipTutor;
  document.getElementById("btn-cierre-generar-zip")
    ?.addEventListener("click", descargarZipTutor);
}
