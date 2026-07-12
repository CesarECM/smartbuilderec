// ─── storage/core.js — Cache en memoria + interceptores de localStorage ──────
// Arquitectura: Los datos ec0217_* NUNCA van a localStorage real.
// Viven en _cache (objeto en memoria por pestaña).
// localStorage solo guarda sbe_planeacion_id (puntero al curso activo).
//
// Expone window._sbeCore para que storage/sync.js acceda al estado compartido.
// Los interceptores llaman window._sbeSync.schedule() (definido en sync.js).

(function () {
  "use strict";

  const DEBOUNCE_MS = 2500;

  const PASOS = [
    "datos", "objetivos", "beneficios", "temario",
    "integracion", "preguntas", "reglas", "contrato",
    "energizante", "expositiva", "demostrativa", "dialogo",
    "cierre", "evaluaciones", "tiempos", "materiales"
  ];

  let _syncTimer    = null;
  let _syncing      = false;
  let _initializing = false;
  let _adminMode    = false;

  const _cache = {};

  const _origSetItem    = localStorage.setItem.bind(localStorage);
  const _origGetItem    = localStorage.getItem.bind(localStorage);
  const _origRemoveItem = localStorage.removeItem.bind(localStorage);

  // ── ¿Va al cache esta clave? ──────────────────────────────────────────────
  function _esClaveCache(key) {
    if (key.startsWith("ec0217_")) return true;
    if (key === "sbe_planeacion_id" && _adminMode) return true;
    return false;
  }

  // ── Interceptores de localStorage ─────────────────────────────────────────

  localStorage.setItem = function (key, value) {
    if (_esClaveCache(key)) {
      const yaCompleto = _cache[key] === 'true';
      _cache[key] = value;
      if (!_initializing && key.startsWith("ec0217_")) {
        if (window._sbeSync) window._sbeSync.schedule();
      }
      if (!_initializing && !yaCompleto && key.endsWith('_completo') && value === 'true') {
        const paso = key.slice(7, -9); // "ec0217_datos_completo" → "datos"
        if (typeof window.logEvento === 'function')
          window.logEvento('wizard.paso.completado', { paso });
      }
      return;
    }
    _origSetItem(key, value);
  };

  localStorage.getItem = function (key) {
    if (_esClaveCache(key)) {
      return Object.prototype.hasOwnProperty.call(_cache, key) ? _cache[key] : null;
    }
    return _origGetItem(key);
  };

  localStorage.removeItem = function (key) {
    if (_esClaveCache(key)) { delete _cache[key]; return; }
    _origRemoveItem(key);
  };

  // ── Helpers de estado ─────────────────────────────────────────────────────

  function recolectarEstado() {
    const estado = {};
    Object.keys(_cache).forEach(key => {
      if (!key.startsWith("ec0217_")) return;
      const shortKey = key.slice(7);
      const raw = _cache[key];
      try   { estado[shortKey] = JSON.parse(raw); }
      catch { estado[shortKey] = raw; }
    });
    return estado;
  }

  function restaurarEstado(datos) {
    if (!datos || typeof datos !== "object") return;
    Object.entries(datos).forEach(([shortKey, val]) => {
      _cache[`ec0217_${shortKey}`] = typeof val === "string" ? val : JSON.stringify(val);
    });
  }

  function calcularPasoActual(estado) {
    let ultimo = 0;
    PASOS.forEach((paso, i) => {
      const val = estado[`${paso}_completo`];
      if (val === "true" || val === true) ultimo = i + 1;
    });
    return Math.min(ultimo + 1, 16);
  }

  function _limpiarCache() {
    Object.keys(_cache).forEach(key => {
      if (key.startsWith("ec0217_") || key === "sbe_planeacion_id") delete _cache[key];
    });
  }

  // ── Toast de estado de guardado ───────────────────────────────────────────

  function _toastSync(tipo, mensaje) {
    let el = document.getElementById("_sbe-save-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "_sbe-save-toast";
      el.style.cssText = [
        "position:fixed", "bottom:24px", "right:80px", "z-index:8000",
        "padding:7px 14px", "border-radius:8px", "font-size:12px",
        "font-weight:600", "color:#fff", "pointer-events:none",
        "box-shadow:0 2px 8px rgba(0,0,0,0.20)", "transition:opacity 0.35s",
        "opacity:0"
      ].join(";");
      document.body.appendChild(el);
    }
    clearTimeout(el._t);
    el.style.opacity = "1";
    if (tipo === "saving") {
      el.style.background = "#374151";
      el.textContent = "⏳ Guardando...";
    } else if (tipo === "ok") {
      el.style.background = "#2e7d32";
      el.textContent = "✓ Guardado";
      el._t = setTimeout(() => { el.style.opacity = "0"; }, 2500);
    } else if (tipo === "error") {
      el.style.background = "#b91c1c";
      el.textContent = mensaje || "⚠️ Error al guardar";
      el._t = setTimeout(() => { el.style.opacity = "0"; }, 7000);
    }
  }

  function _emitir(nombre, detalle) {
    window.dispatchEvent(new CustomEvent(nombre, { detail: detalle }));
  }

  // ── API interna — accedida por storage/sync.js ────────────────────────────
  window._sbeCore = {
    DEBOUNCE_MS,
    cache:          _cache,          // objeto por referencia
    origSetItem:    _origSetItem,
    origGetItem:    _origGetItem,
    origRemoveItem: _origRemoveItem,
    recolectarEstado,
    restaurarEstado,
    calcularPasoActual,
    limpiarCache:   _limpiarCache,
    toastSync:      _toastSync,
    emitir:         _emitir,
    get syncTimer()     { return _syncTimer; },
    set syncTimer(v)    { _syncTimer = v; },
    get syncing()       { return _syncing; },
    set syncing(v)      { _syncing = v; },
    get initializing()  { return _initializing; },
    set initializing(v) { _initializing = v; },
    get adminMode()     { return _adminMode; },
    set adminMode(v)    { _adminMode = v; },
  };
})();
