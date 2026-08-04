// ── panel-notificaciones.js — Campana de notificaciones GCE ──────────────────
// Notificaciones derivadas: calculadas del estado de procesos, sin tabla propia.
// Se refresca cada 60s o al abrir el panel. Badge muestra urgentes+alertas.

(function () {
  var _timer = null;

  // ── Estilos ──────────────────────────────────────────────────────────────────
  var _css = [
    ".notif-card{padding:10px 12px;border-radius:8px;margin-bottom:8px;border-left:3px solid}",
    ".notif-card.alerta{border-color:#f87171;background:#fef2f2}",
    ".notif-card.urgente{border-color:#fb923c;background:#fff7ed}",
    ".notif-card.en_espera{border-color:#86efac;background:#f0fdf4}",
    ".notif-grupo-titulo{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#9ca3af;margin:10px 0 6px;padding:0 4px}",
    ".notif-ec{display:flex;align-items:center;gap:6px;margin-bottom:4px}",
    ".notif-candidato{font-size:12px;font-weight:600;color:#374151}",
    ".notif-horas{font-size:10px;color:#b45b09;margin-left:auto}",
    ".notif-msg{font-size:12px;color:#374151;line-height:1.4;margin-bottom:8px}",
    ".notif-btn{display:inline-block;padding:5px 12px;border-radius:6px;font-size:11px;font-weight:700;cursor:pointer;border:none;text-decoration:none}",
    ".notif-btn.link{background:#4c1d95;color:#fff}",
    ".notif-btn.copiar{background:none;border:1px solid #d1d5db;color:#374151}",
    ".notif-empty{text-align:center;padding:32px 16px;font-size:13px;color:#9ca3af}",
  ].join("");

  function _injectStyles() {
    if (document.getElementById("notif-styles")) return;
    var s = document.createElement("style");
    s.id = "notif-styles";
    s.textContent = _css;
    document.head.appendChild(s);
  }

  // ── Render ───────────────────────────────────────────────────────────────────
  function _renderCard(n) {
    var hLabel = n.horas_sin_cambio > 0
      ? ('<span class="notif-horas">' + Math.round(n.horas_sin_cambio) + 'h</span>')
      : "";
    var btnClass = n.accion_tipo === "copiar" ? "copiar" : "link";
    var btnAttr  = n.accion_tipo === "copiar"
      ? ('onclick="notifCopiarLink(\'' + n.accion_link + '\')" ')
      : ('href="' + n.accion_link + '" target="_blank" ');
    return '<div class="notif-card ' + n.tipo + '">' +
      '<div class="notif-ec">' +
        '<span class="notif-candidato">' + (n.candidato_nombre || "") + '</span>' +
        '<span style="font-size:10px;color:#6b7280;background:#f3f4f6;border-radius:4px;padding:1px 6px">' + (n.ec_codigo || "") + '</span>' +
        hLabel +
      '</div>' +
      '<div class="notif-msg">' + n.mensaje + '</div>' +
      '<' + (n.accion_tipo === "copiar" ? "button" : "a") +
        ' class="notif-btn ' + btnClass + '" ' + btnAttr + '>' +
        n.accion_label +
      '</' + (n.accion_tipo === "copiar" ? "button" : "a") + '>' +
    '</div>';
  }

  function renderNotificaciones(notifs, urgentes) {
    var badge = document.getElementById("notif-badge");
    var body  = document.getElementById("notif-panel-body");
    if (!badge || !body) return;

    if (urgentes > 0) {
      badge.textContent = urgentes > 9 ? "9+" : String(urgentes);
      badge.style.display = "flex";
    } else {
      badge.style.display = "none";
    }

    if (!notifs.length) {
      body.innerHTML = '<div class="notif-empty">Sin notificaciones pendientes</div>';
      return;
    }

    var grupos = { alerta: [], urgente: [], en_espera: [] };
    notifs.forEach(function (n) { (grupos[n.tipo] || grupos.en_espera).push(n); });

    var labels = { alerta: "Requiere atención urgente", urgente: "Acción requerida", en_espera: "En espera" };
    var html = "";
    ["alerta", "urgente", "en_espera"].forEach(function (tipo) {
      if (!grupos[tipo].length) return;
      html += '<div class="notif-grupo-titulo">' + labels[tipo] + '</div>';
      grupos[tipo].forEach(function (n) { html += _renderCard(n); });
    });
    body.innerHTML = html;
  }

  // ── Fetch ────────────────────────────────────────────────────────────────────
  async function cargarNotificaciones() {
    try {
      var data = await apiFetch("/gce/notificaciones");
      renderNotificaciones(data.notificaciones || [], data.urgentes || 0);
    } catch (e) {
      // Error silencioso — no romper el panel si el endpoint falla
    }
  }

  // ── Público ──────────────────────────────────────────────────────────────────
  window.initNotificaciones = function () {
    _injectStyles();
    cargarNotificaciones();
    if (_timer) clearInterval(_timer);
    _timer = setInterval(cargarNotificaciones, 60000);

    document.addEventListener("click", function (e) {
      var panel = document.getElementById("notif-panel");
      var btn   = document.getElementById("notif-btn");
      if (panel && btn && !panel.contains(e.target) && !btn.contains(e.target)) {
        panel.style.display = "none";
      }
    });
  };

  window.toggleNotifPanel = function () {
    var panel = document.getElementById("notif-panel");
    if (!panel) return;
    var visible = panel.style.display !== "none";
    panel.style.display = visible ? "none" : "block";
    if (!visible) cargarNotificaciones();
  };

  window.notifCopiarLink = function (link) {
    navigator.clipboard.writeText(link).then(function () {
      mostrarToast("Enlace copiado al portapapeles");
    }).catch(function () {
      mostrarToast("No se pudo copiar el enlace");
    });
  };
})();
