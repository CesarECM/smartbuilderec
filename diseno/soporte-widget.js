/* ── SmartBuilderEC — Soporte Widget Universal ──────────────────────────────
   Se incluye en todas las páginas con: <script src="soporte-widget.js"></script>
   Auto-detecta el contexto de la página y ajusta el comportamiento del agente.
   ─────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  // ── Markdown → HTML (solo para mensajes del asistente) ──────────────────────
  function md(raw) {
    if (!raw) return '';
    let s = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    // Bold **texto**
    s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    // Código inline `texto`
    s = s.replace(/`([^`\n]+)`/g, '<code class="sbe-code">$1</code>');
    // Listas: procesar línea por línea
    const lines = s.split('\n');
    let html = '';
    let inList = false;
    lines.forEach((line, i) => {
      if (/^[-•]\s/.test(line) || /^\d+\.\s/.test(line)) {
        if (!inList) { html += '<ul class="sbe-list">'; inList = true; }
        html += '<li>' + line.replace(/^[-•]\s+/, '').replace(/^\d+\.\s+/, '') + '</li>';
      } else {
        if (inList) { html += '</ul>'; inList = false; }
        if (i > 0) html += '<br>';
        html += line;
      }
    });
    if (inList) html += '</ul>';
    return html;
  }

  const BACKEND = 'https://smartbuilderec.onrender.com';
  const SESSION_KEY = 'sbe_soporte_sesion_v1';
  const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 h

  // ── Detección de contexto por página ────────────────────────────────────────
  const PAGE_MAP = {
    'landing.html':          { contexto: 'ventas',        greeting: '¡Hola! ¿Tienes dudas sobre SmartBuilderEC? Puedo ayudarte a conocer la plataforma y orientarte en el proceso de registro.' },
    'pago.html':             { contexto: 'checkout',      greeting: '¿Tienes preguntas sobre los planes o el pago? Estoy aquí para ayudarte.' },
    'registro.html':         { contexto: 'onboarding',    greeting: '¡Bienvenido! ¿Tienes un código de acceso de tu empresa? Te guío en el registro paso a paso.' },
    'login.html':            { contexto: 'acceso',        greeting: '¿Problemas para ingresar? Puedo ayudarte a recuperar tu acceso.' },
    'index.html':            { contexto: 'wizard_ec0217', greeting: '¡Hola, instructor! Soy tu guía para el expediente EC0217.01. ¿En qué paso del wizard necesitas ayuda?' },
    'dashboard.html':        { contexto: 'navegacion',    greeting: '¿Cómo puedo ayudarte? Puedo orientarte sobre cómo crear o abrir un curso.' },
    'admin.html':            { contexto: 'admin',         greeting: '¿Necesitas ayuda con la gestión de usuarios o códigos de acceso?' },
    'superadmin.html':       { contexto: 'superadmin',    greeting: '¿En qué puedo ayudarte con la gestión de la plataforma?' },
    'checkout-success.html': { contexto: 'onboarding',    greeting: '¡Pago procesado! ¿Necesitas ayuda para comenzar a usar la plataforma?' },
  };

  const DEFAULT_CTX = { contexto: 'general', greeting: '¿En qué puedo ayudarte?' };

  function getPageCtx() {
    const file = window.location.pathname.split('/').pop() || 'landing.html';
    return PAGE_MAP[file] || DEFAULT_CTX;
  }

  // ── Gestión de sesión (localStorage) ────────────────────────────────────────
  function loadSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (Date.now() - s.ts > SESSION_TTL) { localStorage.removeItem(SESSION_KEY); return null; }
      return s;
    } catch { return null; }
  }

  function saveSession(id) {
    localStorage.setItem(SESSION_KEY, JSON.stringify({ id, ts: Date.now() }));
  }

  async function ensureSession(contexto, paginaOrigen) {
    const stored = loadSession();
    if (stored) return stored.id;
    let userId = null;
    try {
      if (window._supabase) {
        const { data } = await window._supabase.auth.getSession();
        userId = data?.session?.user?.id || null;
      }
    } catch {}
    try {
      const res = await fetch(`${BACKEND}/soporte/sesiones/init`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pagina_origen: paginaOrigen, contexto, user_id: userId }),
      });
      const json = await res.json();
      saveSession(json.sesion_id);
      return json.sesion_id;
    } catch (e) {
      console.warn('[SBE Widget] Error iniciando sesión de soporte:', e);
      return null;
    }
  }

  // ── Estado global del widget ─────────────────────────────────────────────────
  const { contexto, greeting } = getPageCtx();
  let sesionId   = null;
  let historial  = [];
  let turnos     = 0;
  let isOpen     = false;
  let isBusy     = false;

  // ── Construcción del DOM ─────────────────────────────────────────────────────
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

    // Event listeners
    panel.querySelector('#sbe-chat-close').addEventListener('click', toggleWidget);
    panel.querySelector('#sbe-send-btn').addEventListener('click', sendMsg);
    panel.querySelector('#sbe-ticket-cancel').addEventListener('click', closeTicketForm);
    panel.querySelector('#sbe-ticket-submit').addEventListener('click', submitTicket);
    panel.querySelector('#sbe-chat-input').addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMsg(); }
    });
    panel.querySelector('#sbe-chat-input').addEventListener('input', function () {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
  }

  // ── Toggle ───────────────────────────────────────────────────────────────────
  function toggleWidget() {
    isOpen = !isOpen;
    const panel = document.getElementById('sbe-chat-panel');
    const btn   = document.getElementById('sbe-chat-btn');
    panel.classList.toggle('open', isOpen);
    panel.setAttribute('aria-hidden', String(!isOpen));
    btn.classList.toggle('active', isOpen);
    if (isOpen && historial.length === 0) _startConversation();
    if (isOpen) setTimeout(() => document.getElementById('sbe-chat-input')?.focus(), 280);
  }

  async function _startConversation() {
    sesionId = await ensureSession(contexto, window.location.href);
    _addMsg('assistant', greeting);
  }

  // ── Mensajes ──────────────────────────────────────────────────────────────────
  function _addMsg(role, text) {
    const log  = document.getElementById('sbe-chat-messages');
    const wrap = document.createElement('div');
    const bub  = document.createElement('div');
    wrap.className = `sbe-msg sbe-msg--${role}`;
    bub.className  = 'sbe-bubble';
    if (role === 'assistant') {
      bub.innerHTML = md(text);
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

  // ── Enviar mensaje ────────────────────────────────────────────────────────────
  async function sendMsg() {
    if (isBusy) return;
    const input = document.getElementById('sbe-chat-input');
    const texto = input.value.trim();
    if (!texto) return;
    input.value = '';
    input.style.height = 'auto';
    setSendDisabled(true);

    _addMsg('user', texto);
    historial.push({ role: 'user', content: texto });
    turnos++;

    isBusy = true;
    _showTyping();

    // Obtener info de usuario si está logueado
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
      const res = await fetch(`${BACKEND}/soporte/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sesion_id: sesionId,
          mensaje:   texto,
          historial: historial.slice(0, -1),
          contexto,
          user_info: userInfo,
        }),
      });

      _hideTyping();
      if (!res.ok || !res.body) throw new Error(`HTTP ${res.status}`);

      const bub    = _addMsg('assistant', '');
      const reader = res.body.getReader();
      const dec    = new TextDecoder();
      let full     = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        full += dec.decode(value, { stream: true });
        bub.innerHTML = md(full);
        document.getElementById('sbe-chat-messages').scrollTop =
          document.getElementById('sbe-chat-messages').scrollHeight;
      }

      // Detectar si la IA sugiere escalación
      if (full.includes('[TICKET_CTA]')) {
        full = full.replace(/\s*\[TICKET_CTA\]\s*/g, '').trim();
        bub.innerHTML = md(full);
        setTimeout(_offerTicket, 500);
      }

      historial.push({ role: 'assistant', content: full });

      // Sugerir ticket tras 5 turnos sin resolver
      if (turnos >= 5 && turnos % 4 === 1) _offerTicket();

    } catch (e) {
      _hideTyping();
      _addMsg('assistant', 'Lo siento, ocurrió un error al procesar tu solicitud. Por favor intenta de nuevo o crea un ticket de soporte.');
      console.warn('[SBE Widget] Error en chat:', e);
    } finally {
      isBusy = false;
      setSendDisabled(false);
    }
  }

  function setSendDisabled(v) {
    const btn = document.getElementById('sbe-send-btn');
    if (btn) btn.disabled = v;
  }

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
    // Pre-rellenar email si está logueado
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

    if (!asunto) {
      document.getElementById('sbe-t-asunto').focus();
      return;
    }

    btn.disabled    = true;
    btn.textContent = 'Enviando...';

    try {
      const res = await fetch(`${BACKEND}/soporte/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sesion_id:    sesionId,
          asunto,
          categoria:    contexto,
          user_email:   email,
          user_nombre:  nombre,
        }),
      });
      const json = await res.json();
      closeTicketForm();
      _addMsg('assistant',
        `Tu ticket #${json.numero} fue creado exitosamente. Nuestro equipo lo revisará pronto` +
        (email ? ` y te responderá a ${email}` : '') + '.'
      );
    } catch {
      _addMsg('assistant', 'Error al crear el ticket. Por favor intenta de nuevo.');
    } finally {
      btn.disabled    = false;
      btn.textContent = 'Enviar ticket';
    }
  }

  // ── Init ──────────────────────────────────────────────────────────────────────
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', buildWidget);
  } else {
    buildWidget();
  }
})();
