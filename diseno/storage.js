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

  // ── Sincronización a Supabase ─────────────────────────────────────────────

  function _emitir(nombre, detalle) {
    window.dispatchEvent(new CustomEvent(nombre, { detail: detalle }));
  }

  function scheduleSyncToSupabase() {
    clearTimeout(_syncTimer);
    _emitir("sbe:sync-pending");
    _syncTimer = setTimeout(syncToSupabase, DEBOUNCE_MS);
  }

  async function syncToSupabase() {
    if (_syncing) return;
    _syncing = true;
    _emitir("sbe:sync-start");
    try {
      const session = await getSession();
      if (!session) return;

      const estado = recolectarEstado();
      if (!estado.datos || typeof estado.datos !== "object") return;

      const nombreCurso  = estado.datos?.nombreCurso || "Sin título";
      const pasoActual   = calcularPasoActual(estado);
      _emitir("sbe:progress", { paso: pasoActual, total: 16 });
      // getItem ya va al cache cuando corresponde
      const planeacionId = localStorage.getItem("sbe_planeacion_id");

      if (planeacionId) {
        // UPDATE — RLS aplica permisos (propio, admin del usuario, o superadmin)
        const { error } = await _supabase
          .from("planeaciones")
          .update({ datos: estado, nombre_curso: nombreCurso, paso_actual: pasoActual })
          .eq("id", planeacionId);
        if (error) {
          console.warn("[storage] Error al actualizar:", error.message);
          _emitir("sbe:sync-error");
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
          if (total >= 3) {
            if (!window._limiteAlertaMostrada) {
              window._limiteAlertaMostrada = true;
              showConfirm(
                "Has alcanzado el límite de 3 cursos guardados.\n\nTus datos no se están guardando en la nube. Para continuar, ve al dashboard y elimina un curso anterior.",
                { title: "Límite de cursos alcanzado", icon: "⚠️", confirmText: "Ir al dashboard", cancelText: "Cerrar" }
              ).then(ir => { if (ir) window.location.href = "dashboard.html"; });
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
          _emitir("sbe:sync-error");
        }
        // Guardar el nuevo ID: en cache (admin) o localStorage (normal)
        if (data?.id) localStorage.setItem("sbe_planeacion_id", data.id);
      }
      _emitir("sbe:sync-ok");
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
          window.location.href = "dashboard.html";
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
