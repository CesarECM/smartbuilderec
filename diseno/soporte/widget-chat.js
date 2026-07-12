/* ── soporte/widget-chat.js — Chat SSE, mensajes y votación de FAQs ──────────
   Requiere: widget-main.js y widget-ui.js cargados antes.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';
  const _w = window._sbeW;

  // ── Mensajes ──────────────────────────────────────────────────────────────────
  function _addMsg(role, text) {
    const log  = document.getElementById('sbe-chat-messages');
    const wrap = document.createElement('div');
    const bub  = document.createElement('div');
    wrap.className = `sbe-msg sbe-msg--${role}`;
    bub.className  = 'sbe-bubble';
    if (role === 'assistant') {
      bub.innerHTML = _w.md(text);
    } else {
      bub.textContent = text;
    }
    wrap.appendChild(bub);
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
    return bub;
  }

  function _showTyping() {
    if (document.getElementById('sbe-typing')) return;
    const log  = document.getElementById('sbe-chat-messages');
    const wrap = document.createElement('div');
    wrap.id = 'sbe-typing';
    wrap.className = 'sbe-msg sbe-msg--assistant';
    wrap.innerHTML = '<div class="sbe-bubble sbe-typing-dots"><span></span><span></span><span></span></div>';
    log.appendChild(wrap);
    log.scrollTop = log.scrollHeight;
  }

  function _hideTyping() {
    document.getElementById('sbe-typing')?.remove();
  }

  function setSendDisabled(v) {
    const btn = document.getElementById('sbe-send-btn');
    if (btn) btn.disabled = v;
  }

  // ── Enviar mensaje ────────────────────────────────────────────────────────────
  async function sendMsg() {
    if (_w.isBusy) return;
    const input = document.getElementById('sbe-chat-input');
    const texto = input.value.trim();
    if (!texto) return;
    input.value = '';
    input.style.height = 'auto';
    setSendDisabled(true);

    _addMsg('user', texto);
    _w.historial.push({ role: 'user', content: texto });
    _w.turnos++;

    _w.isBusy = true;
    _showTyping();

    let userInfo = {};
    try {
      if (window._supabase) {
        const { data } = await window._supabase.auth.getSession();
        if (data?.session?.user?.id) {
          const { data: p } = await window._supabase
            .from('profiles').select('nombre, rol')
            .eq('id', data.session.user.id).single();
          if (p) userInfo = p;
        }
      }
    } catch {}

    try {
      const res = await fetch(`${_w.BACKEND}/soporte/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sesion_id: _w.sesionId,
          mensaje:   texto,
          historial: _w.historial.slice(0, -1).slice(-20),
          contexto:  _w.contexto,
          user_info: userInfo,
        }),
      });

      _hideTyping();
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const faqIds = (res.headers.get('x-faq-ids') || '')
        .split(',').map(s => s.trim()).filter(Boolean);

      const bub    = _addMsg('assistant', '');
      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let full     = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += dec.decode(value, { stream: true });
        bub.innerHTML = _w.md(full);
        document.getElementById('sbe-chat-messages').scrollTop =
          document.getElementById('sbe-chat-messages').scrollHeight;
      }

      if (full.includes('[TICKET_CTA]')) {
        full = full.replace(/\s*\[TICKET_CTA\]\s*/g, '').trim();
        bub.innerHTML = _w.md(full);
        setTimeout(() => _w._offerTicket(), 500);
      }

      _w.historial.push({ role: 'assistant', content: full });
      _addVoteRow(bub, faqIds);

      if (_w.turnos >= 5 && _w.turnos % 4 === 1) _w._offerTicket();

    } catch (e) {
      _hideTyping();
      _addMsg('assistant', 'Lo siento, ocurrió un error al procesar tu solicitud. Por favor intenta de nuevo o crea un ticket de soporte.');
      console.warn('[SBE Widget] Error en chat:', e);
    } finally {
      _w.isBusy = false;
      setSendDisabled(false);
    }
  }

  // ── Votación de FAQs ──────────────────────────────────────────────────────────
  function _addVoteRow(bub, faqIds) {
    const row = document.createElement('div');
    row.className = 'sbe-vote';
    const idsJson = JSON.stringify(faqIds);
    row.innerHTML = `<span>¿Fue útil?</span>
      <button class="sbe-vote-btn" onclick="window._sbVote(this,${idsJson},true)">👍</button>
      <button class="sbe-vote-btn" onclick="window._sbVote(this,${idsJson},false)">👎</button>`;
    bub.appendChild(row);
    document.getElementById('sbe-chat-messages').scrollTop =
      document.getElementById('sbe-chat-messages').scrollHeight;
  }

  window._sbVote = async function (btn, faqIds, util) {
    const row = btn.closest('.sbe-vote');
    if (!row) return;
    row.innerHTML = `<span class="sbe-vote-thanks">${util ? '¡Gracias! 👍' : 'Gracias por el feedback.'}</span>`;
    if (faqIds.length) {
      const endpoint = util ? 'votos' : 'votos-negativos';
      try {
        await fetch(`${_w.BACKEND}/soporte/faqs/${endpoint}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ids: faqIds }),
        });
      } catch {}
    }
  };

  _w.sendMsg  = sendMsg;
  _w._addMsg  = _addMsg;
})();
