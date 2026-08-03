// ─── wizard-ec1375/export.js — Descarga del ZIP EC1375 ────────────────────────

import { BACKEND_URL } from "./config.js";

export function initExport75() {
  const btn = document.getElementById("btn75Descargar");
  if (btn) btn.addEventListener("click", descargarZipEC1375);
  window.descargarZipEC1375 = descargarZipEC1375;
}

async function descargarZipEC1375() {
  const btn = document.getElementById("btn75Descargar");
  if (btn) { btn.disabled = true; btn.textContent = "⏳ Generando expediente…"; }

  try {
    const payload = _armarPayload();
    const headers = await getAuthHeaders?.() || {};
    headers["Content-Type"] = "application/json";

    const res = await fetch(`${BACKEND_URL}/ec1375/generate-doc`, {
      method:  "POST",
      headers,
      body:    JSON.stringify(payload),
    });

    if (res.status === 402) throw new Error("El administrador no tiene créditos disponibles.");
    if (!res.ok) {
      const e = await res.json().catch(() => ({}));
      throw new Error(e.detail || `Error ${res.status}`);
    }

    const blob    = await res.blob();
    const url     = URL.createObjectURL(blob);
    const nombre  = payload.nombre_auxiliar?.replace(/\s+/g, "_") || "EC1375";
    const a       = document.createElement("a");
    a.href        = url;
    a.download    = `Expediente_EC1375_${nombre}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    _celebrar();
    window.cargarExpediente75?.();

  } catch (err) {
    const toast = document.getElementById("toast-container");
    if (toast) {
      toast.innerHTML = `<div class="toast toast-error">${err.message || "Error al generar el expediente."}</div>`;
      setTimeout(() => { toast.innerHTML = ""; }, 6000);
    }
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "⬇ Generar y descargar expediente EC1375"; }
  }
}

function _armarPayload() {
  const registro_id = localStorage.getItem("sbe_ec1375_id") || null;
  const estado = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (!key || !key.startsWith("ec1375_")) continue;
    const raw = localStorage.getItem(key);
    try   { estado[key.slice(7)] = JSON.parse(raw); }
    catch { estado[key.slice(7)] = raw; }
  }
  const ax = estado.datos || {};
  return {
    registro_id,
    nombre_auxiliar: [ax.aux75Nombre, ax.aux75Apellidos].filter(Boolean).join(" "),
    ...estado,
  };
}

function _celebrar() {
  const overlay = document.getElementById("celebration-overlay");
  if (!overlay) return;
  overlay.style.display = "flex";
  const bar = overlay.querySelector(".celebration-bar-fill");
  if (bar) { bar.style.width = "0"; setTimeout(() => { bar.style.transition = "width 2.5s"; bar.style.width = "100%"; }, 50); }
  setTimeout(() => { overlay.style.display = "none"; }, 3500);
}
