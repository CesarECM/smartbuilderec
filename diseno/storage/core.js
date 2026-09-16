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

  const _SOPORTE_EMAIL = "soporte@smartbuilderec.com";

  function _toastSync(tipo, mensaje, opciones) {
    const { code, action, soporte } = opciones || {};
    let el = document.getElementById("_sbe-save-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "_sbe-save-toast";
      el.style.cssText = [
        "position:fixed", "bottom:24px", "right:80px", "z-index:8000",
        "padding:7px 14px", "border-radius:8px", "font-size:12px",
        "font-weight:600", "color:#fff",
        "box-shadow:0 2px 8px rgba(0,0,0,0.20)", "transition:opacity 0.35s",
        "opacity:0"
      ].join(";");
      document.body.appendChild(el);
    }
    clearTimeout(el._t);
    el.style.opacity = "1";
    el.style.pointerEvents = "none";
    el.style.minWidth = "";
    el.style.maxWidth = "";
    if (tipo === "saving") {
      el.style.background = "#374151";
      el.textContent = "⏳ Guardando...";
    } else if (tipo === "ok") {
      el.style.background = "#2e7d32";
      el.textContent = "✓ Guardado";
      el._t = setTimeout(() => { el.style.opacity = "0"; }, 2500);
    } else if (tipo === "warn") {
      el.style.background = "#92400e";
      el.textContent = mensaje || "⚠️ Pendiente de guardar";
      el._t = setTimeout(() => { el.style.opacity = "0"; }, 6000);
    } else if (tipo === "error") {
      el.style.background = "#7f1d1d";
      el.style.pointerEvents = "auto";
      el.style.minWidth = "240px";
      el.style.maxWidth = "320px";
      // Línea 1: mensaje + botón cerrar
      let html = `<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px">`;
      html += `<span style="flex:1;line-height:1.5">⚠️ ${mensaje || "Error al guardar"}</span>`;
      html += `<button data-sbe-close style="background:none;border:none;color:rgba(255,255,255,0.7);cursor:pointer;font-size:13px;padding:0 2px;flex-shrink:0;line-height:1">✕</button>`;
      html += `</div>`;
      // Línea 2: código + acciones (si aplica)
      if (code || action || soporte) {
        html += `<div style="display:flex;align-items:center;gap:6px;margin-top:7px;flex-wrap:wrap">`;
        if (code) {
          html += `<span style="font-family:monospace;background:rgba(0,0,0,0.35);padding:2px 6px;border-radius:3px;font-size:10px;letter-spacing:.5px">${code}</span>`;
        }
        if (action?.label && action.fn) {
          html += `<button data-sbe-action style="background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.35);color:#fff;cursor:pointer;padding:3px 9px;border-radius:4px;font-size:11px;font-weight:600">${action.label}</button>`;
        } else if (action?.label && action.href) {
          html += `<a href="${action.href}" style="background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.35);color:#fff;padding:3px 9px;border-radius:4px;font-size:11px;font-weight:600;text-decoration:none">${action.label}</a>`;
        }
        if (soporte) {
          const _asunto = encodeURIComponent(`Error wizard — ${code || "?"}`);
          const _cuerpo = encodeURIComponent(`Hola, tuve un problema al guardar mi curso.\nCódigo de error: ${code || "?"}\nFecha: ${new Date().toLocaleString("es-MX")}`);
          html += `<a href="mailto:${_SOPORTE_EMAIL}?subject=${_asunto}&body=${_cuerpo}" style="color:rgba(255,255,255,0.65);font-size:10px;text-decoration:underline">Contactar soporte</a>`;
        }
        html += `</div>`;
      }
      el.innerHTML = html;
      el.querySelector("[data-sbe-close]")?.addEventListener("click", () => {
        el.style.opacity = "0"; clearTimeout(el._t);
      });
      if (action?.fn) {
        el.querySelector("[data-sbe-action]")?.addEventListener("click", () => {
          el.style.opacity = "0"; clearTimeout(el._t); action.fn();
        });
      }
      el._t = setTimeout(() => { el.style.opacity = "0"; }, 15000);
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
