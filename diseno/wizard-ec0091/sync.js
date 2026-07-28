// ─── wizard-ec0091/sync.js — Sincronización EC0091 ↔ Supabase ────────────────
// Independiente de _sbeCore. Lee ec0091_* de localStorage real y guarda
// en la tabla ec0091_datos. Expone window.ec0091Sync.

(function () {
  "use strict";

  const DEBOUNCE_MS = 2500;
  const TABLA       = "ec0091_datos";
  const ID_KEY      = "sbe_ec0091_id";

  let _timer   = null;
  let _syncing = false;

  function _toast(tipo, msg) {
    let el = document.getElementById("_ec0091-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "_ec0091-toast";
      el.style.cssText = "position:fixed;bottom:24px;right:80px;z-index:8000;padding:7px 14px;border-radius:8px;font-size:12px;font-weight:600;color:#fff;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.2);transition:opacity .35s;opacity:0";
      document.body.appendChild(el);
    }
    clearTimeout(el._t);
    el.style.opacity = "1";
    if (tipo === "saving") { el.style.background = "#374151"; el.textContent = "⏳ Guardando..."; }
    else if (tipo === "ok") { el.style.background = "#1a4a6b"; el.textContent = "✓ Guardado"; el._t = setTimeout(() => { el.style.opacity = "0"; }, 2500); }
    else { el.style.background = "#b91c1c"; el.textContent = msg || "⚠️ Error al guardar"; el._t = setTimeout(() => { el.style.opacity = "0"; }, 7000); }
  }

  function _recolectar() {
    const estado = {};
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (!key || !key.startsWith("ec0091_")) continue;
      const shortKey = key.slice(7);
      const raw = localStorage.getItem(key);
      try   { estado[shortKey] = JSON.parse(raw); }
      catch { estado[shortKey] = raw; }
    }
    return estado;
  }

  function _restaurar(datos) {
    if (!datos || typeof datos !== "object") return;
    Object.entries(datos).forEach(([shortKey, val]) => {
      localStorage.setItem(`ec0091_${shortKey}`, typeof val === "string" ? val : JSON.stringify(val));
    });
  }

  function schedule() {
    clearTimeout(_timer);
    _timer = setTimeout(syncToSupabase, DEBOUNCE_MS);
  }

  async function syncToSupabase() {
    if (_syncing) { _timer = setTimeout(syncToSupabase, DEBOUNCE_MS); return; }
    _syncing = true;
    _toast("saving");
    try {
      const session = await getSession();
      if (!session) { _toast("error", "⚠️ Sesión expirada"); return; }

      const estado = _recolectar();
      if (!estado.datos || !estado.datos.organismo_certificador) { _toast("ok"); return; }

      const nombreVer  = estado.datos.organismo_certificador || "Sin título";
      const recordId   = localStorage.getItem(ID_KEY);

      if (recordId) {
        const { error } = await _supabase.from(TABLA)
          .update({ datos: estado, nombre_verificacion: nombreVer })
          .eq("id", recordId);
        if (error) { _toast("error", "⚠️ No se pudo guardar"); return; }
      } else {
        const { data, error } = await _supabase.from(TABLA)
          .insert({ user_id: session.user.id, nombre_verificacion: nombreVer, datos: estado })
          .select("id").single();
        if (error) { _toast("error", "⚠️ No se pudo crear"); return; }
        if (data?.id) localStorage.setItem(ID_KEY, data.id);
      }
      _toast("ok");
    } finally {
      _syncing = false;
    }
  }

  async function init() {
    const params   = new URLSearchParams(window.location.search);

    if (params.get("new") === "1") {
      limpiar();
      const url = new URL(window.location.href);
      url.searchParams.delete("new");
      window.history.replaceState({}, "", url.toString());
      return;
    }

    const session = await getSession();
    if (!session) return;

    const targetId = params.get("ec0091_id") || localStorage.getItem(ID_KEY);
    if (!targetId) return;

    const { data, error } = await _supabase.from(TABLA)
      .select("datos, user_id").eq("id", targetId).single();

    if (error || !data) { localStorage.removeItem(ID_KEY); return; }

    localStorage.setItem(ID_KEY, targetId);
    _restaurar(data.datos || {});

    const url = new URL(window.location.href);
    url.searchParams.delete("ec0091_id");
    window.history.replaceState({}, "", url.toString());
  }

  function limpiar() {
    clearTimeout(_timer);
    for (let i = localStorage.length - 1; i >= 0; i--) {
      const k = localStorage.key(i);
      if (k && k.startsWith("ec0091_")) localStorage.removeItem(k);
    }
    localStorage.removeItem(ID_KEY);
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && _timer !== null) {
      clearTimeout(_timer); _timer = null; syncToSupabase();
    }
  });
  window.addEventListener("pagehide", () => {
    if (_timer !== null) { clearTimeout(_timer); _timer = null; syncToSupabase(); }
  });

  window.ec0091Sync = { init, syncNow: syncToSupabase, limpiar, schedule };
})();
