// ─── shared/debug-panel.js — Panel de depuración para betatesting ─────────────
(function () {
  "use strict";

  const _logs = [];

  window._sbeDebug = {
    log(category, phase, url, data) {
      _logs.push({
        t:        new Date().toISOString().slice(11, 23),
        category, phase, url,
        data:     typeof data === "string" ? data : JSON.stringify(data, null, 2),
      });
      _renderLogs();
      _updateBadge();
    },
  };

  // ── UI ──────────────────────────────────────────────────────────
  const _css = `
    #_dbg-btn{position:fixed;bottom:72px;left:12px;z-index:99998;
      background:#1e293b;color:#94a3b8;border:1px solid #334155;
      border-radius:8px;padding:5px 11px;font-size:11px;font-family:monospace;
      cursor:pointer;box-shadow:0 2px 8px rgba(0,0,0,.4)}
    #_dbg-btn.has-error{color:#f87171;border-color:#f87171}
    #_dbg-panel{position:fixed;bottom:108px;left:12px;z-index:99999;
      width:min(560px,92vw);max-height:420px;overflow-y:auto;
      background:#0f172a;border:1px solid #334155;border-radius:12px;
      padding:12px;font-size:11px;font-family:monospace;color:#94a3b8;
      display:none;box-shadow:0 8px 32px rgba(0,0,0,.6)}
    #_dbg-panel .dbg-hdr{display:flex;justify-content:space-between;
      align-items:center;margin-bottom:10px}
    #_dbg-panel .dbg-hdr span{color:#f8fafc;font-weight:700;font-size:13px}
    #_dbg-panel .dbg-actions{display:flex;gap:6px}
    #_dbg-panel button{border:none;border-radius:6px;padding:4px 10px;
      font-size:11px;cursor:pointer;font-family:monospace}
    #_dbg-copy{background:#1d4ed8;color:#fff}
    #_dbg-clear{background:#374151;color:#9ca3af}
    .dbg-entry{border-bottom:1px solid #1e293b;padding:6px 0;margin-bottom:2px}
    .dbg-entry .dbg-meta{font-weight:600;margin-bottom:2px}
    .dbg-entry .dbg-url{color:#64748b;font-size:10px;margin:1px 0;word-break:break-all}
    .dbg-entry pre{color:#94a3b8;font-size:10px;white-space:pre-wrap;
      margin:3px 0;max-height:130px;overflow-y:auto;background:#1e293b;
      border-radius:4px;padding:4px 6px}
    .ph-error,.ph-net-error{color:#f87171}
    .ph-ok{color:#4ade80}
    .ph-req{color:#60a5fa}
    .ph-warn{color:#facc15}
  `;
  const _style = document.createElement("style");
  _style.textContent = _css;
  document.head.appendChild(_style);

  const _btn = document.createElement("button");
  _btn.id = "_dbg-btn";
  _btn.textContent = "🐛 Debug (0)";

  const _panel = document.createElement("div");
  _panel.id = "_dbg-panel";
  _panel.innerHTML = `
    <div class="dbg-hdr">
      <span>🐛 Debug Log</span>
      <div class="dbg-actions">
        <button id="_dbg-copy">📋 Copiar todo</button>
        <button id="_dbg-clear">Limpiar</button>
      </div>
    </div>
    <div id="_dbg-entries"></div>`;

  document.body.appendChild(_btn);
  document.body.appendChild(_panel);

  _btn.addEventListener("click", () => {
    _panel.style.display = _panel.style.display === "none" ? "block" : "none";
  });

  document.getElementById("_dbg-copy").addEventListener("click", () => {
    const text = _logs.map(e =>
      `[${e.t}] ${e.category} | ${e.phase.toUpperCase()} | ${e.url}\n${e.data}`
    ).join("\n\n" + "─".repeat(60) + "\n\n");
    navigator.clipboard.writeText(text).then(() => {
      const b = document.getElementById("_dbg-copy");
      const orig = b.textContent;
      b.textContent = "✓ Copiado";
      setTimeout(() => { b.textContent = orig; }, 2200);
    }).catch(() => {
      prompt("Copia el log manualmente (Ctrl+A, Ctrl+C):", text);
    });
  });

  document.getElementById("_dbg-clear").addEventListener("click", () => {
    _logs.length = 0;
    _renderLogs();
    _updateBadge();
  });

  function _updateBadge() {
    _btn.textContent = `🐛 Debug (${_logs.length})`;
    const hasErr = _logs.some(e => e.phase === "error" || e.phase === "net-error");
    _btn.classList.toggle("has-error", hasErr);
  }

  function _renderLogs() {
    const ct = document.getElementById("_dbg-entries");
    if (!ct) return;
    const shown = _logs.slice(-40).reverse();
    ct.innerHTML = shown.map(e => {
      const cls = `ph-${e.phase.replace(/[^a-z-]/g, "")}`;
      return `<div class="dbg-entry">
        <div class="dbg-meta ${cls}">[${e.t}] ${e.category} · ${e.phase}</div>
        <div class="dbg-url">${e.url}</div>
        <pre>${_esc(e.data)}</pre>
      </div>`;
    }).join("");
  }

  function _esc(s) {
    return String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
  }

  // ── Capturar errores globales ─────────────────────────────────
  window.addEventListener("error", ev => {
    window._sbeDebug?.log("JS", "error", ev.filename || location.pathname,
      { message: ev.message, line: ev.lineno, col: ev.colno });
  });
  window.addEventListener("unhandledrejection", ev => {
    window._sbeDebug?.log("Promise", "error", location.pathname,
      { reason: String(ev.reason) });
  });
})();
