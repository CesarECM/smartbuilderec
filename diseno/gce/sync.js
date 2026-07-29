// ─── gce/sync.js — Sincronización portafolio GCE ↔ Supabase ──────────────────
// Script regular (no módulo): se carga antes que main.js para registrar
// visibilitychange/pagehide. Accede a window._gceState y window._gceBACKEND.

(function () {
  "use strict";

  const DEBOUNCE_MS = 2500;
  let _timer   = null;
  let _syncing = false;

  function toast(tipo, msg) {
    let el = document.getElementById("_gce-sync-toast");
    if (!el) {
      el = document.createElement("div");
      el.id = "_gce-sync-toast";
      el.style.cssText = [
        "position:fixed;bottom:24px;right:24px;z-index:8000",
        "padding:7px 14px;border-radius:8px;font-size:12px;font-weight:600",
        "color:#fff;pointer-events:none;box-shadow:0 2px 8px rgba(0,0,0,.25)",
        "transition:opacity .35s;opacity:0",
      ].join(";");
      document.body.appendChild(el);
    }
    clearTimeout(el._t);
    el.style.opacity = "1";
    if (tipo === "saving") {
      el.style.background = "#374151";
      el.textContent = "⏳ Guardando...";
    } else if (tipo === "ok") {
      el.style.background = "#065f46";
      el.textContent = "✓ Guardado";
      el._t = setTimeout(() => { el.style.opacity = "0"; }, 2500);
    } else {
      el.style.background = "#b91c1c";
      el.textContent = msg || "⚠️ Error al guardar";
      el._t = setTimeout(() => { el.style.opacity = "0"; }, 7000);
    }
  }

  function schedule() {
    clearTimeout(_timer);
    _timer = setTimeout(syncNow, DEBOUNCE_MS);
  }

  async function syncNow() {
    if (_syncing) { _timer = setTimeout(syncNow, DEBOUNCE_MS); return; }
    const gceState  = window._gceState;
    const backendUrl = window._gceBACKEND;
    if (!gceState?.procesoId || !backendUrl) return;

    _syncing = true;
    toast("saving");
    try {
      const session = await window.getSession?.();
      if (!session) { toast("error", "⚠️ Sesión expirada"); return; }

      const headers = await window.getAuthHeaders?.();
      if (!headers) { toast("error"); return; }

      const res = await fetch(`${backendUrl}/gce/procesos/${gceState.procesoId}`, {
        method: "PATCH",
        headers: { ...headers, "Content-Type": "application/json" },
        body: JSON.stringify({ datos: gceState.datos }),
      });

      if (!res.ok) { toast("error", "⚠️ No se pudo guardar"); return; }
      toast("ok");
    } catch {
      toast("error");
    } finally {
      _syncing = false;
    }
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden" && _timer !== null) {
      clearTimeout(_timer); _timer = null; syncNow();
    }
  });
  window.addEventListener("pagehide", () => {
    if (_timer !== null) { clearTimeout(_timer); _timer = null; syncNow(); }
  });

  window.gceSync = { schedule, syncNow };
})();
