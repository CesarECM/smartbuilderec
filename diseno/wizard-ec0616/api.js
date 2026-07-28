// ─── wizard-ec0616/api.js — fetch autenticado con debug logging ───────────────
import { BACKEND_URL } from "./config.js";

export async function llamarIA(endpoint, payload) {
  let token = "";
  try {
    const session = typeof getSession === "function" ? await getSession() : null;
    token = session?.access_token || "";
  } catch (_) {}

  const url = `${BACKEND_URL}/${endpoint}`;
  const headers = {
    "Content-Type": "application/json",
    ...(token ? { "Authorization": `Bearer ${token}` } : {}),
  };

  window._sbeDebug?.log("IA", "req", url, { endpoint, payload });

  let res;
  try {
    res = await fetch(url, { method: "POST", headers, body: JSON.stringify(payload) });
  } catch (netErr) {
    window._sbeDebug?.log("IA", "net-error", url, { error: netErr.message });
    throw new Error(`Red: ${netErr.message}`);
  }

  let body;
  try { body = await res.json(); } catch (_) { body = {}; }
  window._sbeDebug?.log("IA", res.ok ? "ok" : "error", url, { status: res.status, body });

  if (!res.ok) throw new Error(`HTTP ${res.status} — ${body?.detail || JSON.stringify(body)}`);
  return body;
}
