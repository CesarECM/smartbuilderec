// ─── wizard/download-tracker.js — Fingerprint de última descarga ─────────────
// Detecta si el wizard cambió desde la última descarga del ZIP.

const _KEY_HASH = "ec0217_last_download_hash";
const _KEY_PID  = "ec0217_last_download_pid";

function _fingerprint(payload) {
  const s = JSON.stringify(payload);
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return `${s.length}_${h >>> 0}`;
}

export function saveDownloadSnapshot() {
  const payload      = typeof window.recolectarPayload === "function" ? window.recolectarPayload() : {};
  const planeacionId = localStorage.getItem("sbe_planeacion_id") || "";
  localStorage.setItem(_KEY_HASH, _fingerprint(payload));
  localStorage.setItem(_KEY_PID,  planeacionId);
}

export function clearDownloadSnapshot() {
  localStorage.removeItem(_KEY_HASH);
  localStorage.removeItem(_KEY_PID);
}

export function hasUnsavedChanges() {
  const saved = localStorage.getItem(_KEY_HASH);
  if (!saved) return false;
  if (window._sbeCore?.adminMode) return false;
  const savedPid   = localStorage.getItem(_KEY_PID) || "";
  const currentPid = localStorage.getItem("sbe_planeacion_id") || "";
  if (savedPid !== currentPid) return false;
  const payload = typeof window.recolectarPayload === "function" ? window.recolectarPayload() : {};
  return _fingerprint(payload) !== saved;
}

export function initDownloadTracker() {
  window.addEventListener("sbe:sync-ok", () => {
    const badge = document.getElementById("badge-descarga-desactualizada");
    if (!badge) return;
    badge.style.display = hasUnsavedChanges() ? "flex" : "none";
  });
}
