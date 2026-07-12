/* ── soporte/widget-ui.js — DOM del widget, toggle y CSS ─────────────────────
   Requiere: widget-main.js cargado antes.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  const _w = window._sbeW;

  function injectCSS() {
    if (document.getElementById('sbe-widget-css')) return;
    const link = document.createElement('link');
    link.id   = 'sbe-widget-css';
    link.rel  = 'stylesheet';
    link.href = 'soporte-widget.css';
    document.head.appendChild(link);
  }

  function buildWidget() {
    injectCSS();

    // Botón flotante
    const btn = document.createElement('button');
    btn.id = 'sbe-chat-btn';
    btn.setAttribute('aria-label', 'Soporte IA');
    btn.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>`;
    btn.addEventListener('click', toggleWidget);

    // Panel
    const panel = document.createElement('div');
    panel.id = 'sbe-chat-panel';
    panel.setAttribute('aria-hidden', 'true');
    panel.innerHTML = `
      <div id="sbe-chat-header">
        <div id="sbe-header-info">
          <div id="sbe-chat-avatar">SBE</div>
          <div>
            <div id="sbe-chat-title">SBE Assistant</div>
            <div id="sbe-chat-status">Asistente IA · SmartBuilderEC</div>
          </div>
        </div>
        <button id="sbe-chat-close" aria-label="Cerrar">&times;</button>
      </div>
      <div id="sbe-chat-messages" role="log" aria-live="polite"></div>
      <div id="sbe-ticket-form">
        <p>Conectar con soporte humano</p>
        <input type="text"  id="sbe-t-nombre"  placeholder="Tu nombre (opcional)" />
        <input type="email" id="sbe-t-email"   placeholder="Tu email (opcional)"  />
        <p id="sbe-email-warn" style="display:none;font-size:11px;color:#dc2626;margin:-4px 0 0">Sin email no podrás recibir la respuesta del equipo.</p>
        <textarea           id="sbe-t-asunto"  placeholder="Describe tu problema con detalle..." rows="3"></textarea>
        <div id="sbe-ticket-actions">
          <button id="sbe-ticket-cancel">Cancelar</button>
          <button id="sbe-ticket-submit">Enviar ticket</button>
        </div>
      </div>
      <div id="sbe-input-area">
        <textarea id="sbe-chat-input" rows="1"
          placeholder="Escribe tu pregunta..." aria-label="Mensaje"></textarea>
        <button id="sbe-send-btn" aria-label="Enviar">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
            <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
          </svg>
        </button>
      </div>`;

    document.body.appendChild(btn);
    document.body.appendChild(panel);

    // Event listeners — usan _w.* para cross-file late binding
    panel.querySelector('#sbe-chat-close').addEventListener('click', toggleWidget);
    panel.querySelector('#sbe-send-btn').addEventListener('click', () => _w.sendMsg());
    panel.querySelector('#sbe-ticket-cancel').addEventListener('click', () => _w.closeTicketForm());
    panel.querySelector('#sbe-ticket-submit').addEventListener('click', () => _w.submitTicket());
    panel.querySelector('#sbe-t-email').addEventListener('input', function () {
      if (this.value.trim()) document.getElementById('sbe-email-warn').style.display = 'none';
    });
    panel.querySelector('#sbe-chat-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); _w.sendMsg(); }
    });
    panel.querySelector('#sbe-chat-input').addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  }

  function toggleWidget() {
    _w.isOpen = !_w.isOpen;
    const panel = document.getElementById('sbe-chat-panel');
    const btn   = document.getElementById('sbe-chat-btn');
    panel.classList.toggle('open', _w.isOpen);
    panel.setAttribute('aria-hidden', String(!_w.isOpen));
    btn.classList.toggle('active', _w.isOpen);
    if (_w.isOpen && _w.historial.length === 0) _startConversation();
    if (_w.isOpen) setTimeout(() => document.getElementById('sbe-chat-input')?.focus(), 280);
  }

  async function _startConversation() {
    _w.sesionId = await _w.ensureSession(_w.contexto, window.location.href);
    _w._addMsg('assistant', _w.greeting);
  }

  _w.buildWidget  = buildWidget;
  _w.toggleWidget = toggleWidget;
})();
