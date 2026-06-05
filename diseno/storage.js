// ─── storage.js — Sincronización transparente localStorage ↔ Supabase ────────
// Requiere: supabase-client.js y auth.js cargados ANTES en el HTML.
//
// Funcionamiento no-invasivo:
//  - Intercepta localStorage.setItem para cualquier clave ec0217_*
//  - Programa una sincronización a Supabase 2.5 s después del último cambio
//  - Al inicializar, carga el estado desde Supabase (fuente de verdad)
//  - Si hay ?new=1 en la URL, limpia el estado para empezar un curso nuevo
//
// app.js y shared.js no requieren modificaciones para que funcione.
// ─────────────────────────────────────────────────────────────────────────────

(function () {
  "use strict";

  const DEBOUNCE_MS = 2500;

  // Orden de los 16 pasos para calcular el paso actual
  const PASOS = [
    "datos", "objetivos", "beneficios", "temario",
    "integracion", "preguntas", "reglas", "contrato",
    "energizante", "expositiva", "demostrativa", "dialogo",
    "cierre", "evaluaciones", "tiempos", "materiales"
  ];

  let _syncTimer    = null;
  let _syncing      = false;
  let _initializing = false; // suprime el sync mientras se restaura desde Supabase

  // Referencias al método original ANTES de sobreescribir
  const _origSetItem    = localStorage.setItem.bind(localStorage);
  const _origRemoveItem = localStorage.removeItem.bind(localStorage);

  // ── Interceptar localStorage.setItem ─────────────────────────────────────
  // Cualquier escritura de ec0217_* programa automáticamente un sync a Supabase.
  localStorage.setItem = function (key, value) {
    _origSetItem(key, value);
    if (!_initializing && key.startsWith("ec0217_")) {
      scheduleSyncToSupabase();
    }
  };

  // ── Recolectar estado completo del wizard ─────────────────────────────────
  // Devuelve un objeto con todas las claves ec0217_* sin el prefijo.
  // Ejemplo: { datos: {...}, datos_completo: "true", objetivos: {...}, ... }
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

  // Restaura un estado en localStorage usando _origSetItem para NO disparar sync.
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
      // No sincronizar si no hay datos reales del curso
      if (!estado.datos || typeof estado.datos !== "object") return;

      const nombreCurso  = estado.datos?.nombreCurso || "Sin título";
      const pasoActual   = calcularPasoActual(estado);
      const planeacionId = localStorage.getItem("sbe_planeacion_id");

      if (planeacionId) {
        // Actualizar planeación existente
        const { error } = await _supabase
          .from("planeaciones")
          .update({ datos: estado, nombre_curso: nombreCurso, paso_actual: pasoActual })
          .eq("id", planeacionId)
          .eq("user_id", session.user.id);
        if (error) console.warn("[storage] Error al actualizar:", error.message);
      } else {
        // Verificar límite antes de crear (seguridad server-side)
        const { count: totalCursos } = await _supabase
          .from("planeaciones")
          .select("id", { count: "exact", head: true })
          .eq("user_id", session.user.id);
        if (totalCursos >= 3) {
          console.warn("[storage] Límite de 3 cursos alcanzado.");
          return;
        }
        // Crear nueva planeación y guardar su ID
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

  // ── Inicialización: cargar desde Supabase al abrir index.html ─────────────
  async function init() {
    // ?new=1 en la URL = el usuario quiere empezar un curso nuevo
    if (new URLSearchParams(window.location.search).get("new") === "1") {
      limpiar();
      const url = new URL(window.location.href);
      url.searchParams.delete("new");
      window.history.replaceState({}, "", url.toString());
      return;
    }

    const session = await getSession();
    if (!session) return;

    const planeacionId = localStorage.getItem("sbe_planeacion_id");
    if (!planeacionId) return; // sin planeación activa — se creará al primer guardado

    _initializing = true;
    try {
      const { data, error } = await _supabase
        .from("planeaciones")
        .select("datos, paso_actual, nombre_curso")
        .eq("id", planeacionId)
        .eq("user_id", session.user.id)
        .single();

      if (error || !data) {
        // ID inválido o pertenece a otro usuario
        console.warn("[storage] Planeación no encontrada. Limpiando referencia local.");
        _origRemoveItem("sbe_planeacion_id");
        return;
      }

      // Supabase es la fuente de verdad: restaurar en localStorage sin disparar sync
      restaurarEstado(data.datos || {});
    } finally {
      _initializing = false;
    }
  }

  // ── Limpiar estado del wizard (nuevo curso, logout, import) ───────────────
  function limpiar() {
    clearTimeout(_syncTimer);
    _origRemoveItem("sbe_planeacion_id");
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
