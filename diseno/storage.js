// ─── storage.js — Sincronización transparente localStorage ↔ Supabase ────────
// Requiere: supabase-client.js y auth.js cargados ANTES en el HTML.
//
// MODO NORMAL (usuario propio):
//   ec0217_* y sbe_planeacion_id viven en localStorage (compartido entre tabs).
//
// MODO EDICIÓN ADMIN (admin editando planeación de otro usuario):
//   ec0217_* y sbe_planeacion_id se redirigen automáticamente a sessionStorage,
//   que es POR-PESTAÑA. El localStorage del admin queda completamente intacto.
//   app.js y shared.js no saben que están en modo admin — la redirección es
//   transparente gracias a los interceptores de localStorage.
//
// Flags de estado:
//   sessionStorage["sbe_admin_mode"]    = "1"         (activo en esta pestaña)
//   sessionStorage["sbe_planeacion_id"] = "<uuid>"    (planeación editada)
//   localStorage  ["sbe_admin_editing"] = "<nombre>"  (para el banner en app.js)
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

  // Inicializar _adminMode desde sessionStorage para sobrevivir refreshes
  let _adminMode = sessionStorage.getItem("sbe_admin_mode") === "1";

  const _origSetItem    = localStorage.setItem.bind(localStorage);
  const _origGetItem    = localStorage.getItem.bind(localStorage);
  const _origRemoveItem = localStorage.removeItem.bind(localStorage);

  // ── Interceptores de localStorage ───────────────────────────────────────
  // Redirigen ec0217_* y sbe_planeacion_id a sessionStorage cuando _adminMode.
  // app.js y shared.js usan localStorage sin cambios; la redirección es opaca.

  localStorage.setItem = function (key, value) {
    if (_adminMode && _esClaveWizard(key)) {
      sessionStorage.setItem(key, value);
      if (!_initializing && key.startsWith("ec0217_")) scheduleSyncToSupabase();
      return;
    }
    _origSetItem(key, value);
    if (!_initializing && key.startsWith("ec0217_")) scheduleSyncToSupabase();
  };

  localStorage.getItem = function (key) {
    if (_adminMode && _esClaveWizard(key)) return sessionStorage.getItem(key);
    return _origGetItem(key);
  };

  localStorage.removeItem = function (key) {
    if (_adminMode && _esClaveWizard(key)) { sessionStorage.removeItem(key); return; }
    _origRemoveItem(key);
  };

  function _esClaveWizard(key) {
    return key.startsWith("ec0217_") || key === "sbe_planeacion_id";
  }

  // ── Store activo según modo ───────────────────────────────────────────────
  // Devuelve sessionStorage en admin mode, localStorage en modo normal.
  // Usado por recolectarEstado() y restaurarEstado() que iteran directamente.
  function _store() { return _adminMode ? sessionStorage : localStorage; }

  // ── Activar / desactivar modo admin ─────────────────────────────────────

  function _activarAdminMode(planeacionId, ownerName) {
    _adminMode = true;
    sessionStorage.setItem("sbe_admin_mode",     "1");
    sessionStorage.setItem("sbe_planeacion_id",  planeacionId);
    _origSetItem("sbe_admin_editing", ownerName); // localStorage: persiste el banner
  }

  function _desactivarAdminMode() {
    _adminMode = false;
    sessionStorage.removeItem("sbe_admin_mode");
    _limpiarEc0217(sessionStorage);
    sessionStorage.removeItem("sbe_planeacion_id");
    _origRemoveItem("sbe_admin_editing");
  }

  function _limpiarEc0217(store) {
    for (let i = store.length - 1; i >= 0; i--) {
      const k = store.key(i);
      if (k && k.startsWith("ec0217_")) store.removeItem(k);
    }
  }

  // ── Recolectar / restaurar estado del wizard ─────────────────────────────

  function recolectarEstado() {
    const store  = _store();
    const estado = {};
    for (let i = 0; i < store.length; i++) {
      const key = store.key(i);
      if (!key || !key.startsWith("ec0217_")) continue;
      const shortKey = key.slice(7);
      const raw = store.getItem(key);
      try   { estado[shortKey] = JSON.parse(raw); }
      catch { estado[shortKey] = raw; }
    }
    return estado;
  }

  function restaurarEstado(datos) {
    if (!datos || typeof datos !== "object") return;
    // Escribir directamente al store correcto, sin pasar por el interceptor
    // (que no existe en sessionStorage y causaría doble sync en localStorage).
    const escribir = _adminMode
      ? (k, v) => sessionStorage.setItem(k, v)
      : (k, v) => _origSetItem(k, v);

    Object.entries(datos).forEach(([shortKey, val]) => {
      escribir(`ec0217_${shortKey}`, typeof val === "string" ? val : JSON.stringify(val));
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

  // ── Sincronización a Supabase ─────────────────────────────────────────────

  function scheduleSyncToSupabase() {
    clearTimeout(_syncTimer);
    _syncTimer = setTimeout(syncToSupabase, DEBOUNCE_MS);
  }

  async function syncToSupabase() {
    if (_syncing) return;
    _syncing = true;
    try {
      const session = await getSession();
      if (!session) return;

      const estado = recolectarEstado();
      if (!estado.datos || typeof estado.datos !== "object") return;

      const nombreCurso  = estado.datos?.nombreCurso || "Sin título";
      const pasoActual   = calcularPasoActual(estado);
      // localStorage.getItem está interceptado: devuelve sessionStorage en admin mode
      const planeacionId = localStorage.getItem("sbe_planeacion_id");

      if (planeacionId) {
        // UPDATE — sin filtro user_id; la RLS aplica permisos correctos
        const { error } = await _supabase
          .from("planeaciones")
          .update({ datos: estado, nombre_curso: nombreCurso, paso_actual: pasoActual })
          .eq("id", planeacionId);
        if (error) console.warn("[storage] Error al actualizar:", error.message);
      } else {
        // INSERT: nueva planeación propia del usuario. Límite solo para rol=user.
        const { data: perfil } = await _supabase
          .from("profiles").select("rol").eq("id", session.user.id).single();

        if (!perfil || perfil.rol === "user") {
          const { count: total } = await _supabase
            .from("planeaciones")
            .select("id", { count: "exact", head: true })
            .eq("user_id", session.user.id);
          if (total >= 3) { console.warn("[storage] Límite de 3 cursos alcanzado."); return; }
        }

        const { data, error } = await _supabase
          .from("planeaciones")
          .insert({ user_id: session.user.id, nombre_curso: nombreCurso, datos: estado, paso_actual: pasoActual })
          .select("id").single();
        if (error) console.warn("[storage] Error al crear:", error.message);
        if (data?.id) _origSetItem("sbe_planeacion_id", data.id);
      }
    } finally {
      _syncing = false;
    }
  }

  // ── Inicialización ────────────────────────────────────────────────────────

  async function init() {
    const params = new URLSearchParams(window.location.search);

    // ?new=1 → nuevo curso propio (sale de admin mode si estaba activo)
    if (params.get("new") === "1") {
      if (_adminMode) _desactivarAdminMode();
      limpiar();
      const url = new URL(window.location.href);
      url.searchParams.delete("new");
      window.history.replaceState({}, "", url.toString());
      return;
    }

    const session = await getSession();
    if (!session) return;

    // ?planeacion_id=XXX → cargar planeación específica
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

        if (data.user_id !== session.user.id) {
          // ── Planeación de OTRO usuario: activar admin mode ───────────────
          // Los datos van a sessionStorage; localStorage del admin NO se toca.
          const owner = data["profiles"];
          const ownerName = owner
            ? ([owner.nombre, owner.apellido].filter(Boolean).join(" ") || owner.email)
            : "otro usuario";
          _activarAdminMode(targetId, ownerName);
          _limpiarEc0217(sessionStorage);           // limpiar sesión anterior
          sessionStorage.setItem("sbe_planeacion_id", targetId); // restaurar tras limpiar
          restaurarEstado(data.datos || {});
        } else {
          // ── Planeación propia vía URL param ──────────────────────────────
          if (_adminMode) _desactivarAdminMode();   // salir de admin mode si estaba
          _origRemoveItem("sbe_admin_editing");
          _limpiarEc0217(localStorage);
          _origSetItem("sbe_planeacion_id", targetId);
          restaurarEstado(data.datos || {});
        }

        const url = new URL(window.location.href);
        url.searchParams.delete("planeacion_id");
        window.history.replaceState({}, "", url.toString());
      } finally {
        _initializing = false;
      }
      return;
    }

    // Flujo normal: cargar desde el store activo (localStorage o sessionStorage)
    const planeacionId = _store().getItem("sbe_planeacion_id");
    if (!planeacionId) return;

    _initializing = true;
    try {
      const { data, error } = await _supabase
        .from("planeaciones")
        .select("datos, user_id")
        .eq("id", planeacionId)
        .single();

      if (error || !data) {
        console.warn("[storage] Planeación no encontrada. Limpiando estado.");
        if (_adminMode) _desactivarAdminMode();
        else { _origRemoveItem("sbe_planeacion_id"); _origRemoveItem("sbe_admin_editing"); }
        return;
      }

      // Limpiar ec0217_* del store activo antes de restaurar (evita mezcla de datos)
      _limpiarEc0217(_store());
      restaurarEstado(data.datos || {});
    } finally {
      _initializing = false;
    }
  }

  // ── Limpiar estado del wizard ─────────────────────────────────────────────

  function limpiar() {
    clearTimeout(_syncTimer);
    if (_adminMode) {
      _desactivarAdminMode();
    } else {
      _origRemoveItem("sbe_planeacion_id");
      _origRemoveItem("sbe_admin_editing");
      _limpiarEc0217(localStorage);
    }
  }

  // ── API pública ───────────────────────────────────────────────────────────
  window.storageSync = {
    init,
    syncNow: syncToSupabase,
    limpiar,
  };

})();
