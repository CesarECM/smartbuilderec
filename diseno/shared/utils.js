// ─── shared/utils.js — Constantes, fetch, auth stub, localStorage ────────────

const BACKEND_URL = "https://smartbuilderec.onrender.com";

// ─── Timeout y mensajes amigables de error ────────────────────────────────────
const FETCH_TIMEOUT_MS = 45000; // 45 segundos

function mensajeAmigable(err) {
  const msg = String(err?.message || "");
  if (err?.name === "AbortError" || msg.includes("timeout"))
    return "La solicitud tardó demasiado. El servidor puede estar ocupado. Intenta de nuevo en unos momentos.";
  if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("Load failed"))
    return "No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo.";
  if (msg.includes("502"))
    return "El servidor está reiniciando. Espera 30 segundos e intenta de nuevo.";
  if (msg.includes("503"))
    return "El servidor está temporalmente no disponible. Intenta de nuevo en unos momentos.";
  if (msg.includes("500"))
    return "Ocurrió un error interno en el servidor. Si el problema persiste, contacta a soporte.";
  if (msg.includes("429"))
    return "Demasiadas solicitudes. Espera un momento e intenta de nuevo.";
  if (msg.includes("401") || msg.includes("403"))
    return "Sesión expirada. Vuelve a iniciar sesión.";
  return msg || "Ocurrió un error inesperado. Intenta de nuevo.";
}

async function fetchConTimeout(url, opciones = {}, timeoutMs = FETCH_TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    let headers = { ...(opciones.headers || {}) };
    if (url.startsWith(BACKEND_URL) && typeof getAuthHeaders === "function") {
      const authHeaders = await getAuthHeaders();
      headers = { ...authHeaders, ...headers };
    }
    const response = await fetch(url, { ...opciones, headers, signal: controller.signal });
    clearTimeout(id);
    return response;
  } catch (err) {
    clearTimeout(id);
    if (err.name === "AbortError") throw new Error("timeout");
    throw err;
  }
}

// authGuard real viene de auth.js — solo define el stub si no está cargado
if (typeof window.authGuard !== "function") {
  window.authGuard = async function() { return null; };
}

// ─── Migración única: mueve datos ec0217_* de sessionStorage a localStorage ──
(function migrarALocalStorage() {
  const PREFIX = "ec0217_";
  try {
    for (let i = 0; i < sessionStorage.length; i++) {
      const key = sessionStorage.key(i);
      if (key && key.startsWith(PREFIX) && !localStorage.getItem(key)) {
        localStorage.setItem(key, sessionStorage.getItem(key));
      }
    }
  } catch (_) {}
})();

// ─── getData / saveData (usan localStorage para que los datos persistan) ──────
function getData(key) {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : null;
}
function saveData(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

// ─── Recolectar todo el estado del wizard ─────────────────────────────────────
function recolectarPayload() {
  const datos        = getData("ec0217_datos")        || {};
  const objetivos    = getData("ec0217_objetivos")    || {};
  const temario      = getData("ec0217_temario")      || {};
  const encuadre     = getData("ec0217_encuadre")     || {};
  const tecnicas     = getData("ec0217_tecnicas")     || {};
  const expositiva   = getData("ec0217_expositiva")   || {};
  const demostrativa = getData("ec0217_demostrativa") || {};
  const dialogo      = getData("ec0217_dialogo")      || {};
  const cierre       = getData("ec0217_cierre")       || {};
  const evaluaciones = getData("ec0217_evaluaciones") || {};
  const tiempos      = getData("ec0217_tiempos")      || [];
  const materiales   = getData("ec0217_materiales")   || {};
  const beneficios   = getData("ec0217_beneficios");
  let beneficiosStr = "";
  if (typeof beneficios === "string") {
    beneficiosStr = beneficios;
  } else if (beneficios && typeof beneficios === "object") {
    beneficiosStr = beneficios.lista || beneficios.texto || JSON.stringify(beneficios);
  }
  return { datos, objetivos, beneficios: beneficiosStr, temario, encuadre, tecnicas, expositiva, demostrativa, dialogo, cierre, evaluaciones, tiempos, materiales };
}
