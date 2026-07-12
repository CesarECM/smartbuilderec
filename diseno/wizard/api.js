// ─── wizard/api.js — Capa de comunicación con el backend FastAPI ─────────────
// Depende de fetchConTimeout (shared.js) y getAuthHeaders (auth.js),
// que se cargan como scripts clásicos antes del módulo.

import { BACKEND_URL } from "./config.js";

function _getFetch() {
  return typeof fetchConTimeout === "function" ? fetchConTimeout : fetch;
}

function _parsearErrorRespuesta(json) {
  const d = json.detail;
  return d ? (typeof d === "object" ? JSON.stringify(d) : String(d)) : JSON.stringify(json);
}

/**
 * Llama a un endpoint POST del backend y devuelve la respuesta JSON.
 * @param {string} endpoint  — ruta relativa, p.ej. "generate-beneficios"
 * @param {object} payload   — body JSON
 */
export async function llamarIA(endpoint, payload) {
  const fetchFn = _getFetch();
  const response = await fetchFn(`${BACKEND_URL}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detalle = `HTTP ${response.status}`;
    try {
      detalle = _parsearErrorRespuesta(await response.json());
    } catch (_) {}
    throw new Error(detalle);
  }

  return response.json();
}

/**
 * Llama a un endpoint POST con respuesta en streaming (ReadableStream).
 * @param {string}   endpoint  — ruta relativa del backend
 * @param {object}   payload   — body JSON
 * @param {Function} onChunk   — callback(string) invocado por cada chunk de texto
 */
export async function llamarIAStream(endpoint, payload, onChunk) {
  const fetchFn = _getFetch();
  const response = await fetchFn(`${BACKEND_URL}/${endpoint}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    let detalle = `HTTP ${response.status}`;
    try {
      detalle = _parsearErrorRespuesta(await response.json());
    } catch (_) {}
    throw new Error(detalle);
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      onChunk(decoder.decode(value, { stream: true }));
    }
  } finally {
    reader.releaseLock();
  }
}
