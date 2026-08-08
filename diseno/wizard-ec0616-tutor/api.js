// ─── wizard-ec0616-tutor/api.js — Fetch autenticado al backend ───────────────

import { BACKEND_URL } from "./config.js";
import { state } from "./state.js";

async function _headers() {
  return (await window.getAuthHeaders?.()) || {};
}

export async function fetchTutorConfig() {
  if (state.tutor_config) return state.tutor_config;
  try {
    const res = await fetch(`${BACKEND_URL}/ec0616-tutor/config`, { headers: await _headers() });
    if (!res.ok) return null;
    state.tutor_config = await res.json();
    return state.tutor_config;
  } catch { return null; }
}

export async function fetchTutorIEC() {
  if (state.iecData) return state.iecData;
  try {
    const res = await fetch(`${BACKEND_URL}/ec0616-tutor/iec`, { headers: await _headers() });
    if (!res.ok) return null;
    state.iecData = await res.json();
    return state.iecData;
  } catch { return null; }
}
