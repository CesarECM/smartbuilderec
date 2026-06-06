// ─── storage.js — Sincronización transparente localStorage ↔ Supabase ────────
// Requiere: supabase-client.js y auth.js cargados ANTES en el HTML.
//
// Funcionamiento no-invasivo:
//  - Intercepta localStorage.setItem para cualquier clave ec0217_*
//  - Programa una sincronización a Supabase 2.5 s después del último cambio
//  - Al inicializar, carga el estado desde Supabase (fuente de verdad)
//  - Si hay ?new=1 en la URL, limpia el estado para empezar un curso nuevo
//  - Si hay ?planeacion_id=XXX, entra en modo edición admin (carga planeación
//    de otro usuario si RLS lo permite; muestra banner en app.js)
//
// app.js y shared.js no requieren modificaciones para el flujo normal.
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

  const _origSetItem    = localStorage.setItem.bind(localStorage);
  const _origRemoveItem = localStorage.removeItem.bind(localStorage);

  // ── Interceptar localStorage.setItem ─────────────────────────────────────
  localStorage.setItem = function (key, value) {
    _origSetItem(key, value);
    if (!_initializing && key.startsWith("ec0217_")) {
      scheduleSyncToSupabase();
    }
  };

  // ── Recolectar estado completo del wizard ─────────────────────────────────
  function recolectarEstado() {
    const estado = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("ec0217_")) continue;
      const shortKey = key.slice(7);
      const raw = localStorage.getItem(key);
      try   { estado[shortKey] = JSON.parse(raw); }
      catch { estado[shortKey] = raw; }
    }
    return estado;
  }

  // Restaura un estado en localStorage sin disparar sync.
  function restaurarEstado(datos) {
    if (!datos || typeof datos !== "object") return;
    Object.entries(datos).forEach(([shortKey, val]) => {
      _origSetItem(
        `ec0217_${shortKey}`,
        typeof val === "string" ? val : JSON.stringify(val)
      );
    });
  }

  // Calcula el paso actual a partir de los flags _completo.
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
      const planeacionId = localStorage.getItem("sbe_planeacion_id");

      if (planeacionId) {
        // UPDATE — sin filtro user_id: la RLS aplica los permisos correctos
        // (dueño, admin del usuario, o superadmin).
        const { error } = await _supabase
          .from("planeaciones")
          .update({ datos: estado, nombre_curso: nombreCurso, paso_actual: pasoActual })
          .eq("id", planeacionId);
        if (error) console.warn("[storage] Error al actualizar:", error.message);
      } else {
        // INSERT: nueva planeación propia. Verificar límite solo para rol=user.
        const { data: perfil } = await _supabase
          .from("profiles").select("rol").eq("id", session.user.id).single();

        if (!perfil || perfil.rol === "user") {
          const { count: totalCursos } = await _supabase
            .from("planeaciones")
            .select("id", { count: "exact", head: true })
            .eq("user_id", session.user.id);
          if (totalCursos >= 3) {
            console.warn("[storage] Límite de 3 cursos alcanzado.");
            return;
          }
        }

        const { data, error } = await _supabase
          .from("planeaciones")
          .insert({ user_id: session.user.id, nombre_curso: nombreCurso, datos: estado, paso_actual: pasoActual })
          .select("id")
          .single();
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

    // ?new=1 → empezar curso completamente nuevo
    if (params.get("new") === "1") {
      limpiar();
      const url = new URL(window.location.href);
      url.searchParams.delete("new");
      window.history.replaceState({}, "", url.toString());
      return;
    }

    const session = await getSession();
    if (!session) return;

    // ?planeacion_id=XXX → modo edición admin/superadmin
    const targetId = params.get("planeacion_id");
    if (targetId) {
      _initializing = true;
      try {
        const { data, error } = await _supabase
          .from("planeaciones")
          .select("datos, paso_actual, nombre_curso, user_id, profiles!user_id(nombre, apellido, email)")
          .eq("id", targetId)
          .single();

        if (error || !data) {
          alert("No tienes acceso a esta planeación o no existe.");
          window.location.href = "dashboard.html";
          return;
        }

        // Limpiar estado anterior antes de cargar el nuevo
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith("ec0217_")) _origRemoveItem(k);
        }
        _origSetItem("sbe_planeacion_id", targetId);

        // Si es planeación de OTRO usuario: activar banner de modo edición
        if (data.user_id !== session.user.id) {
          const owner = data["profiles"];
          const ownerName = owner
            ? ([owner.nombre, owner.apellido].filter(Boolean).join(" ") || owner.email)
            : "otro usuario";
          _origSetItem("sbe_admin_editing", ownerName);
        } else {
          _origRemoveItem("sbe_admin_editing");
        }

        restaurarEstado(data.datos || {});

        // Limpiar param de la URL sin recargar la página
        const url = new URL(window.location.href);
        url.searchParams.delete("planeacion_id");
        window.history.replaceState({}, "", url.toString());
      } finally {
        _initializing = false;
      }
      return;
    }

    // Flujo normal: cargar planeación activa desde sbe_planeacion_id
    const planeacionId = localStorage.getItem("sbe_planeacion_id");
    if (!planeacionId) return;

    _initializing = true;
    try {
      const { data, error } = await _supabase
        .from("planeaciones")
        .select("datos, paso_actual, nombre_curso, user_id")
        .eq("id", planeacionId)
        .single();

      if (error || !data) {
        console.warn("[storage] Planeación no encontrada. Limpiando referencia local.");
        _origRemoveItem("sbe_planeacion_id");
        _origRemoveItem("sbe_admin_editing");
        return;
      }

      restaurarEstado(data.datos || {});
    } finally {
      _initializing = false;
    }
  }

  // ── Limpiar estado del wizard ─────────────────────────────────────────────
  function limpiar() {
    clearTimeout(_syncTimer);
    _origRemoveItem("sbe_planeacion_id");
    _origRemoveItem("sbe_admin_editing");
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
