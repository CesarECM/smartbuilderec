// ─── storage/guard.js — Protección contra pérdida de datos ───────────────────
// Requiere: storage/core.js y storage/sync.js cargados antes.
// Cubre: beforeunload, banner "sin guardar", limpieza al cerrar sesión.

(function () {
  "use strict";

  // ── beforeunload: advertir si hay datos sin persistir en Supabase ─────────
  // Solo aplica cuando: hay datos en cache Y no existe planeacionId (curso nuevo)
  window.addEventListener("beforeunload", (e) => {
    const _c = window._sbeCore;
    if (!_c) return;
    const hayDatosPendientes = (_c.syncTimer !== null || _c.syncing)
                            && !localStorage.getItem("sbe_planeacion_id")
                            && !!_c.cache["ec0217_datos"];
    if (hayDatosPendientes) {
      e.preventDefault();
      return (e.returnValue = "Tu curso aún no se guardó en el servidor. ¿Salir de todas formas?");
    }
  });

  // ── Banner "Sin guardar" — aparece cuando el curso nuevo no tiene ID ──────
  let _bannerTimer = null;

  function _mostrarBannerSinGuardar() {
    if (localStorage.getItem("sbe_planeacion_id")) return;
    if (document.getElementById("_sbe-sin-guardar")) return;
    const el = document.createElement("div");
    el.id = "_sbe-sin-guardar";
    el.style.cssText = [
      "position:fixed;top:0;left:0;right:0;z-index:9997",
      "background:#92400e;color:#fef3c7;text-align:center",
      "padding:7px 40px;font-size:12px;font-weight:600",
      "box-shadow:0 2px 6px rgba(0,0,0,.35)"
    ].join(";");
    el.textContent =
      "⚠️ Tu curso aún no está guardado — escribe el nombre del curso en el Paso 1 para guardarlo.";
    const btn = document.createElement("button");
    btn.textContent = "✕";
    btn.style.cssText =
      "position:absolute;right:12px;top:50%;transform:translateY(-50%);" +
      "background:rgba(255,255,255,.2);border:none;color:#fef3c7;" +
      "padding:2px 8px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:700;";
    btn.onclick = () => el.remove();
    el.appendChild(btn);
    document.body.prepend(el);
  }

  function _ocultarBannerSinGuardar() {
    clearTimeout(_bannerTimer);
    document.getElementById("_sbe-sin-guardar")?.remove();
  }

  // Mostrar banner 4s después del primer aviso de "sin guardar"
  window.addEventListener("sbe:sync-noguardado", () => {
    clearTimeout(_bannerTimer);
    _bannerTimer = setTimeout(_mostrarBannerSinGuardar, 4000);
  });

  // Ocultar cuando el curso se guarda exitosamente
  window.addEventListener("sbe:sync-ok", _ocultarBannerSinGuardar);

  // ── Botón "Salir": flush garantizado antes de navegar ─────────────────────
  // El botón ejecuta logout(); añadimos un flush previo silencioso.
  document.addEventListener("DOMContentLoaded", () => {
    const btnSalir = document.querySelector(".wiz-nav-logout");
    if (!btnSalir) return;
    btnSalir.addEventListener("click", async (e) => {
      const _c = window._sbeCore;
      if (!_c || (!_c.syncTimer && !_c.syncing)) return;
      e.preventDefault();
      e.stopImmediatePropagation();
      btnSalir.disabled = true;
      btnSalir.textContent = "Guardando...";
      try { await window.storageSync?.flushSync(); } catch (_) {}
      btnSalir.disabled = false;
      btnSalir.textContent = "Salir";
      if (typeof logout === "function") logout();
    }, true); // capture=true para ejecutar antes del onclick inline
  });

  // ── SIGNED_OUT: limpiar cache al cerrar sesión ────────────────────────────
  document.addEventListener("DOMContentLoaded", () => {
    if (typeof _supabase === "undefined") return;
    _supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_OUT" && window.storageSync) {
        window.storageSync.limpiar();
        window._sbeDebug?.log("sync", "ok", "auth-signout", "cache limpiado por SIGNED_OUT");
      }
    });
  });

})();
