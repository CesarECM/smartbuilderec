// ─── storage/sync.js — Sincronización wizard ↔ Supabase ──────────────────────
// Requiere: supabase-client.js, auth.js y storage/core.js cargados antes.
// Usa window._sbeCore (estado compartido de core.js).
// Expone window.storageSync (API pública) y window._sbeSync (puente interno).

(function () {
  "use strict";
  const _c = window._sbeCore;

  function scheduleSyncToSupabase() {
    clearTimeout(_c.syncTimer);
    _c.emitir("sbe:sync-pending");
    _c.syncTimer = setTimeout(syncToSupabase, _c.DEBOUNCE_MS);
  }

  async function syncToSupabase() {
    if (_c.syncing) {
      _c.syncTimer = setTimeout(syncToSupabase, _c.DEBOUNCE_MS);
      return;
    }
    _c.syncing = true;
    _c.emitir("sbe:sync-start");
    _c.toastSync("saving");
    try {
      const session = await getSession();
      window._sbeDebug?.log("sync", session ? "ok" : "error", "session", { uid: session?.user?.id?.slice(0, 8) || "null", adminMode: _c.adminMode });
      if (!session) {
        _c.toastSync("error", "⚠️ Sesión expirada — vuelve a iniciar sesión");
        return;
      }

      const estado = _c.recolectarEstado();
      window._sbeDebug?.log("sync", "req", "estado", { tieneDatos: !!estado.datos, nombreCurso: estado.datos?.nombreCurso || "(vacío)", claves: Object.keys(estado).join(",") || "(ninguno)" });
      if (!estado.datos || typeof estado.datos !== "object") {
        window._sbeDebug?.log("sync", "warn", "estado-vacio", "Sin ec0217_datos en cache — guardado cancelado");
        _c.toastSync("ok");
        return;
      }

      const nombreCurso = estado.datos?.nombreCurso || "Sin título";
      const pasoActual  = _c.calcularPasoActual(estado);
      _c.emitir("sbe:progress", { paso: pasoActual, total: 16 });
      const planeacionId = localStorage.getItem("sbe_planeacion_id");
      window._sbeDebug?.log("sync", "req", "ruta", { planeacionId: planeacionId || "(ninguno)", nombreCurso, paso: pasoActual, ruta: planeacionId ? "UPDATE" : (_c.adminMode ? "admin-skip" : "INSERT") });

      if (planeacionId) {
        // UPDATE
        window._sbeDebug?.log("sync", "req", "update", { id: planeacionId, nombre: nombreCurso, paso: pasoActual });
        const { data: updated, error } = await _supabase
          .from("planeaciones")
          .update({ datos: estado, nombre_curso: nombreCurso, paso_actual: pasoActual })
          .eq("id", planeacionId)
          .select("id");
        window._sbeDebug?.log("sync", error ? "error" : (updated?.length ? "ok" : "warn"), "update-result", { rows: updated?.length ?? 0, error: error?.message || null });
        if (error) {
          console.warn("[storage] Error al actualizar:", error.message);
          _c.emitir("sbe:sync-error");
          _c.toastSync("error", "⚠️ No se pudo guardar. Revisa tu conexión.");
          if (typeof window.logEvento === 'function')
            window.logEvento('wizard.sync.error', { tipo: 'update', error: error.message, planeacion_id: planeacionId });
          return;
        }
        if (!updated?.length) {
          if (_c.adminMode) {
            _c.toastSync("error", "⚠️ La planeación ya no existe. Cierra esta ventana.");
            return;
          }
          console.warn("[storage] Planeación eliminada externamente. Limpiando ID stale.");
          _c.origRemoveItem("sbe_planeacion_id");
          scheduleSyncToSupabase();
          return;
        }

      } else if (!_c.adminMode) {
        // INSERT solo en modo normal — requiere nombre del curso
        if (!estado.datos?.nombreCurso) {
          window._sbeDebug?.log("sync", "warn", "insert-bloqueado", "nombreCurso vacío — INSERT cancelado");
          _c.emitir("sbe:sync-noguardado");
          _c.toastSync("warn", "⚠️ Escribe el nombre del curso para guardar");
          return;
        }
        const { data: perfil } = await _supabase
          .from("profiles").select("rol").eq("id", session.user.id).single();

        if (!perfil || perfil.rol === "user") {
          const { count: total } = await _supabase
            .from("planeaciones")
            .select("id", { count: "exact", head: true })
            .eq("user_id", session.user.id);
          window._sbeDebug?.log("sync", total >= 5 ? "warn" : "ok", "limite", { total, max: 5 });
          if (total >= 5) {
            _c.toastSync("error", "⚠️ Límite de 5 cursos alcanzado — elimina uno desde tu panel");
            if (typeof showAlert === "function") {
              showAlert(
                "Has alcanzado el límite de 5 cursos activos.\n\nPara guardar este nuevo curso, elimina uno desde tu panel de alumno.",
                { title: "Límite de cursos", icon: "⚠️" }
              );
            }
            return;
          }
        }

        window._sbeDebug?.log("sync", "req", "insert", { nombre: nombreCurso, paso: pasoActual, uid: session.user.id.slice(0, 8) });
        const { data, error } = await _supabase
          .from("planeaciones")
          .insert({ user_id: session.user.id, nombre_curso: nombreCurso, datos: estado, paso_actual: pasoActual })
          .select("id").single();
        window._sbeDebug?.log("sync", error ? "error" : "ok", "insert-result", { id: data?.id || null, error: error?.message || null });
        if (error) {
          console.warn("[storage] Error al crear:", error.message);
          _c.emitir("sbe:sync-error");
          _c.toastSync("error", "⚠️ No se pudo crear el curso. Intenta de nuevo.");
          if (typeof window.logEvento === 'function')
            window.logEvento('wizard.sync.error', { tipo: 'insert', error: error.message });
          if (!sessionStorage.getItem("sbe_fallback_sent"))
            _enviarRespaldoAdmin(session, nombreCurso, estado, error.message);
          return;
        }
        if (data?.id) {
          localStorage.setItem("sbe_planeacion_id", data.id);
          if (typeof window.logEvento === 'function')
            window.logEvento('wizard.curso.creado', { planeacion_id: data.id, nombre_curso: nombreCurso });
        }
      }

      _c.emitir("sbe:sync-ok");
      _c.toastSync("ok");
    } finally {
      _c.syncing = false;
    }
  }

  // ── Respaldo por email cuando INSERT falla ────────────────────────────────

  async function _enviarRespaldoAdmin(session, nombreCurso, estado, errorMsg) {
    sessionStorage.setItem("sbe_fallback_sent", "1");
    try {
      const _url = (typeof BACKEND_URL !== "undefined" ? BACKEND_URL : "https://smartbuilderec.onrender.com");
      const headers = { "Content-Type": "application/json" };
      if (session?.access_token) headers["Authorization"] = `Bearer ${session.access_token}`;
      await fetch(`${_url}/wizard/sync-fallback`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          user_email:   session?.user?.email || "",
          user_name:    session?.user?.user_metadata?.full_name || "",
          nombre_curso: nombreCurso,
          datos:        estado,
          error:        errorMsg,
        }),
      });
    } catch (_) {}
  }

  // ── Inicialización: fuente de verdad = Supabase ───────────────────────────

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

    // ?planeacion_id=XXX → modo edición admin
    const targetId = params.get("planeacion_id");
    if (targetId) {
      _c.initializing = true;
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

        _c.limpiarCache();

        if (data.user_id !== session.user.id) {
          // Planeación de otro usuario: sbe_planeacion_id va al cache (no a localStorage)
          _c.adminMode = true;
          _c.cache["sbe_planeacion_id"] = targetId;
          const owner = data["profiles"];
          const ownerName = owner
            ? ([owner.nombre, owner.apellido].filter(Boolean).join(" ") || owner.email)
            : "otro usuario";
          _c.origSetItem("sbe_admin_editing", ownerName);
        } else {
          // Planeación propia vía URL: va a localStorage normalmente
          _c.adminMode = false;
          _c.origSetItem("sbe_planeacion_id", targetId);
          _c.origRemoveItem("sbe_admin_editing");
        }

        _c.restaurarEstado(data.datos || {});

        const url = new URL(window.location.href);
        url.searchParams.delete("planeacion_id");
        window.history.replaceState({}, "", url.toString());
      } finally {
        _c.initializing = false;
      }
      return;
    }

    // Flujo normal: cargar por sbe_planeacion_id del localStorage real
    const planeacionId = _c.origGetItem("sbe_planeacion_id");
    if (!planeacionId) return;

    _c.initializing = true;
    try {
      const { data, error } = await _supabase
        .from("planeaciones")
        .select("datos, user_id")
        .eq("id", planeacionId)
        .single();

      if (error || !data) {
        console.warn("[storage] Planeación no encontrada. Limpiando.");
        _c.origRemoveItem("sbe_planeacion_id");
        _c.origRemoveItem("sbe_admin_editing");
        _c.limpiarCache();
        return;
      }
      if (data.user_id !== session.user.id) {
        window._sbeDebug?.log("sync", "warn", "init-uid-mismatch", { planeacionId: planeacionId?.slice(0, 8) });
        _c.origRemoveItem("sbe_planeacion_id");
        _c.limpiarCache();
        return;
      }

      _c.limpiarCache();
      _c.restaurarEstado(data.datos || {});
    } finally {
      _c.initializing = false;
    }
  }

  // ── Limpiar estado del wizard ─────────────────────────────────────────────

  function limpiar() {
    clearTimeout(_c.syncTimer);
    _c.limpiarCache();
    _c.adminMode = false;
    _c.origRemoveItem("sbe_planeacion_id");
    _c.origRemoveItem("sbe_admin_editing");
    // Por si quedaron datos de ec0217_* en localStorage de versiones anteriores
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("ec0217_")) _c.origRemoveItem(k);
    }
  }

  // ── Flush garantizado: cancela timer, espera sync en vuelo, guarda ────────

  async function flushSync() {
    clearTimeout(_c.syncTimer);
    _c.syncTimer = null;
    if (_c.syncing) {
      await new Promise(resolve => {
        const id = setInterval(() => { if (!_c.syncing) { clearInterval(id); resolve(); } }, 50);
      });
    }
    await syncToSupabase();
  }

  // ── Flush al ocultar/cerrar la pestaña ────────────────────────────────────
  // visibilitychange:hidden cubre cierre de tab, cambio de tab y foco perdido.
  // pagehide es el fallback para navegaciones directas al cerrar.
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && _c.syncTimer !== null) {
      window._sbeDebug?.log("sync", "req", "flush-trigger", { via: "visibilitychange" });
      flushSync();
    }
  });
  window.addEventListener("pagehide", () => {
    if (_c.syncTimer !== null) {
      window._sbeDebug?.log("sync", "req", "flush-trigger", { via: "pagehide" });
      clearTimeout(_c.syncTimer); _c.syncTimer = null; syncToSupabase();
    }
  });

  // ── Puente para core.js (localStorage.setItem llama window._sbeSync.schedule)
  window._sbeSync = { schedule: scheduleSyncToSupabase };

  // ── API pública ────────────────────────────────────────────────────────────
  window.storageSync = { init, syncNow: syncToSupabase, flushSync, limpiar };
})();
