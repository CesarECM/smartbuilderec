/* ── soporte/widget-tickets.js — Escalación a ticket humano + init ───────────
   Requiere: widget-main.js, widget-ui.js y widget-chat.js cargados antes.
   Último módulo en cargarse: dispara la construcción del widget al final.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  const _w = window._sbeW;

  // ── Escalación a ticket ───────────────────────────────────────────────────────
  function _offerTicket() {
    const log  = document.getElementById('sbe-chat-messages');
    const wrap = document.createElement('div');
    wrap.className = 'sbe-msg sbe-msg--assistant';
    wrap.innerHTML = `<div class="sbe-bubble">
      ¿No logramos resolver tu problema? Puedo conectarte con nuestro equipo de soporte humano.
      <br/>
      <button class="sbe-ticket-btn" onclick="window._sbeOpenTicket()">Crear ticket de soporte</button>
    </div>`;
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
  }

  window._sbeOpenTicket = function () {
    document.getElementById('sbe-ticket-form').style.display = 'flex';
    document.getElementById('sbe-input-area').style.display  = 'none';
    try {
      if (window._supabase) {
        window._supabase.auth.getSession().then(({ data }) => {
          const email = data?.session?.user?.email;
          if (email) document.getElementById('sbe-t-email').value = email;
        });
      }
    } catch {}
    document.getElementById('sbe-t-asunto').focus();
  };

  function closeTicketForm() {
    document.getElementById('sbe-ticket-form').style.display = 'none';
    document.getElementById('sbe-input-area').style.display  = 'flex';
  }

  async function submitTicket() {
    const nombre = document.getElementById('sbe-t-nombre').value.trim();
    const email  = document.getElementById('sbe-t-email').value.trim();
    const asunto = document.getElementById('sbe-t-asunto').value.trim();
    const btn    = document.getElementById('sbe-ticket-submit');

    if (!asunto) { document.getElementById('sbe-t-asunto').focus(); return; }

    // Advertencia soft de email vacío: bloquea solo la primera vez
    const emailWarn = document.getElementById('sbe-email-warn');
    if (!email && emailWarn && emailWarn.style.display === 'none') {
      emailWarn.style.display = 'block';
      document.getElementById('sbe-t-email').focus();
      return;
    }

    btn.disabled    = true;
    btn.textContent = 'Enviando...';

    try {
      const res = await fetch(`${_w.BACKEND}/soporte/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sesion_id:   _w.sesionId,
          asunto,
          categoria:   _w.contexto,
          user_email:  email,
          user_nombre: nombre,
        }),
      });
      const json = await res.json();
      closeTicketForm();
      _w._addMsg('assistant',
        `Tu ticket #${json.numero} fue creado exitosamente. Nuestro equipo lo revisará pronto` +
        (email ? ` y te responderá a ${email}` : '') + '.'
      );
    } catch {
      _w._addMsg('assistant', 'Error al crear el ticket. Por favor intenta de nuevo.');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Enviar ticket';
    }
  }

  _w._offerTicket    = _offerTicket;
  _w.closeTicketForm = closeTicketForm;
  _w.submitTicket    = submitTicket;

  // ── Init — todos los módulos están cargados, construir el widget ──────────────
  const _currentPage = (window.location.pathname.split('/').filter(Boolean).pop() || '').replace(/\.html$/, '');
  if (_currentPage !== 'superadmin') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', _w.buildWidget);
    } else {
      _w.buildWidget();
    }
  }
})();
