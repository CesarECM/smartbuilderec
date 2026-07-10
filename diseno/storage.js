// ─── storage.js — Sincronización localStorage ↔ Supabase ─────────────────────
// Requiere: supabase-client.js y auth.js cargados ANTES en el HTML.
//
// ARQUITECTURA:
//   Los datos del wizard (ec0217_*) NUNCA se guardan en localStorage real.
//   Viven en un _cache en memoria (un objeto JS por pestaña).
//   localStorage solo conserva sbe_planeacion_id (puntero al curso activo).
//
//   Ventajas:
//   - Cero contaminación entre pestañas (cada tab tiene su propio _cache)
//   - Cero datos obsoletos: en cada carga de página se fetcha Supabase
//   - Los interceptores de localStorage son transparentes para app.js/shared.js
//
// MODO ADMIN-EDIT (?planeacion_id=XXX):
//   sbe_planeacion_id también va al _cache (no a localStorage),
//   así que el localStorage del admin nunca se toca.
// ─────────────────────────────────────────────────────────────────────────────

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

  // Modo admin: se edita la planeación de otro usuario
  let _adminMode = false;

  // Cache en memoria: reemplaza localStorage para ec0217_* y sbe_planeacion_id
  // Cada pestaña tiene el suyo. Se vacía al cerrar/refrescar la pestaña.
  const _cache = {};

  const _origSetItem    = localStorage.setItem.bind(localStorage);
  const _origGetItem    = localStorage.getItem.bind(localStorage);
  const _origRemoveItem = localStorage.removeItem.bind(localStorage);

  // ── ¿Va al cache esta clave? ─────────────────────────────────────────────
  // ec0217_* → siempre al cache (nunca a localStorage real)
  // sbe_planeacion_id → al cache solo en admin mode (en normal va a localStorage)
  function _esClaveCache(key) {
    if (key.startsWith("ec0217_")) return true;
    if (key === "sbe_planeacion_id" && _adminMode) return true;
    return false;
  }

  // ── Interceptores de localStorage ────────────────────────────────────────
  // app.js y shared.js siguen usando localStorage normalmente.
  // Los interceptores redirigen silenciosamente al cache.

  localStorage.setItem = function (key, value) {
    if (_esClaveCache(key)) {
      _cache[key] = value;
      if (!_initializing && key.startsWith("ec0217_")) scheduleSyncToSupabase();
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

  // ── Recolectar / restaurar estado del wizard ─────────────────────────────

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

  // ── Toast de estado de guardado ──────────────────────────────────────────
  // Elemento fijo en esquina inferior-derecha; no usa el modal para no bloquear al usuario.

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

  // ── Sincronización a Supabase ─────────────────────────────────────────────

  function scheduleSyncToSupabase() {
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(syncToSupabase, DEBOUNCE_MS);
  }

  async function syncToSupabase() {
    // Si ya hay una sync en vuelo, reprogramar para no perder los últimos cambios
    if (_syncing) {
      _syncTimer = setTimeout(syncToSupabase, DEBOUNCE_MS);
      return;
    }
    _syncing = true;
    _toastSync("saving");
    try {
      const session = await getSession();
      if (!session) {
        _toastSync("error", "⚠️ Sesión expirada — vuelve a iniciar sesión");
        return;
      }

      const estado = recolectarEstado();
      if (!estado.datos || typeof estado.datos !== "object") {
        // Aún no hay datos del curso; no es un error, simplemente no hay nada que guardar
        _toastSync("ok");
        return;
      }

      const nombreCurso  = estado.datos?.nombreCurso || "Sin título";
      const pasoActual   = calcularPasoActual(estado);
      const planeacionId = localStorage.getItem("sbe_planeacion_id");

      if (planeacionId) {
        // UPDATE — RLS aplica permisos (propio, admin del usuario, o superadmin)
        const { error } = await _supabase
          .from("planeaciones")
          .update({ datos: estado, nombre_curso: nombreCurso, paso_actual: pasoActual })
          .eq("id", planeacionId);
        if (error) {
          console.warn("[storage] Error al actualizar:", error.message);
          _toastSync("error", "⚠️ No se pudo guardar. Revisa tu conexión.");
          return;
        }

      } else if (!_adminMode) {
        // INSERT solo en modo normal (nunca crear planeación en modo admin-edit)
        const { data: perfil } = await _supabase
          .from("profiles").select("rol").eq("id", session.user.id).single();

        if (!perfil || perfil.rol === "user") {
          const { count: total } = await _supabase
            .from("planeaciones")
            .select("id", { count: "exact", head: true })
            .eq("user_id", session.user.id);
          if (total >= 5) {
            _toastSync("error", "⚠️ Límite de 5 cursos alcanzado — elimina uno desde tu panel");
            if (typeof showAlert === "function") {
              showAlert(
                "Has alcanzado el límite de 5 cursos activos.\n\nPara guardar este nuevo curso, elimina uno desde tu panel de alumno.",
                { title: "Límite de cursos", icon: "⚠️" }
              );
            }
            return;
          }
        }

        const { data, error } = await _supabase
          .from("planeaciones")
          .insert({ user_id: session.user.id, nombre_curso: nombreCurso, datos: estado, paso_actual: pasoActual })
          .select("id").single();

        if (error) {
          console.warn("[storage] Error al crear:", error.message);
          _toastSync("error", "⚠️ No se pudo crear el curso. Intenta de nuevo.");
          return;
        }
        if (data?.id) localStorage.setItem("sbe_planeacion_id", data.id);
      }

      _toastSync("ok");
    } finally {
      _syncing = false;
    }
  }

  // ── Inicialización: fuente de verdad = Supabase ──────────────────────────

  async function init() {
    const params = new URLSearchParams(window.location.search);

    // ?new=1 → nuevo curso
    if (params.get("new") === "1") {
      limpiar();
      const url = new URL(window.location.href);
      url.searchParams.delete("new");
      window.history.replaceState({}, "", url.toString());
      return;
    }

    const session = await getSession();
    if (!session) return;

    // ?planeacion_id=XXX → modo edición admin (cargar planeación específica)
    const targetId = params.get("planeacion_id");
    if (targetId) {
      _initializing = true;
      try {
        const { data, error } = await _supabase
          .from("planeaciones")
          .select("datos, user_id, profiles!user_id(nombre, apellido, email)")
          .eq("id", targetId)
          .single();

        if (error || !data) {
          alert("No tienes acceso a esta planeación o no existe.");
          window.location.href = "dashboard";
          return;
        }

        _limpiarCache();

        if (data.user_id !== session.user.id) {
          // Planeación de otro usuario: sbe_planeacion_id va al cache (no a localStorage)
          _adminMode = true;
          _cache["sbe_planeacion_id"] = targetId;
          const owner = data["profiles"];
          const ownerName = owner
            ? ([owner.nombre, owner.apellido].filter(Boolean).join(" ") || owner.email)
            : "otro usuario";
          _origSetItem("sbe_admin_editing", ownerName);
        } else {
          // Planeación propia vía URL: va a localStorage normalmente
          _adminMode = false;
          _origSetItem("sbe_planeacion_id", targetId);
          _origRemoveItem("sbe_admin_editing");
        }

        restaurarEstado(data.datos || {});

        const url = new URL(window.location.href);
        url.searchParams.delete("planeacion_id");
        window.history.replaceState({}, "", url.toString());
      } finally {
        _initializing = false;
      }
      return;
    }

    // Flujo normal: cargar por sbe_planeacion_id
    const planeacionId = _origGetItem("sbe_planeacion_id"); // lee localStorage real
    if (!planeacionId) return;

    _initializing = true;
    try {
      const { data, error } = await _supabase
        .from("planeaciones")
        .select("datos, user_id")
        .eq("id", planeacionId)
        .single();

      if (error || !data) {
        console.warn("[storage] Planeación no encontrada. Limpiando.");
        _origRemoveItem("sbe_planeacion_id");
        _origRemoveItem("sbe_admin_editing");
        _limpiarCache();
        return;
      }

      _limpiarCache();
      restaurarEstado(data.datos || {});
    } finally {
      _initializing = false;
    }
  }

  // ── Limpiar estado del wizard ─────────────────────────────────────────────

  function limpiar() {
    clearTimeout(_syncTimer);
    _limpiarCache();
    _adminMode = false;
    _origRemoveItem("sbe_planeacion_id");
    _origRemoveItem("sbe_admin_editing");
    // Por si quedaron datos de ec0217_* en localStorage de versiones anteriores
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("ec0217_")) _origRemoveItem(k);
    }
  }

  // ── API pública ───────────────────────────────────────────────────────────
  window.storageSync = {
    init,
    syncNow: syncToSupabase,
    limpiar,
  };

})();
