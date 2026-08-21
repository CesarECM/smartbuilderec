/* ── soporte/widget-main.js — Constantes, utilidades y estado compartido ──────
   Cargado PRIMERO. Define window._sbeW que usan los demás módulos del widget.
   ────────────────────────────────────────────────────────────────────────── */
(function () {
  'use strict';

  const BACKEND     = 'https://smartbuilderec.onrender.com';
  const SESSION_TTL = 24 * 60 * 60 * 1000; // 24 h

  // ── Markdown → HTML (solo para mensajes del asistente) ──────────────────────
  function md(raw) {
    if (!raw) return '';
    let s = raw
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
    s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/`([^`\n]+)`/g, '<code class="sbe-code">$1</code>');
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

  // ── Detección de contexto por página ────────────────────────────────────────
  const PAGE_MAP = {
    'landing':          { contexto: 'ventas',        greeting: '¡Hola! ¿Tienes dudas sobre SmartBuilderEC? Puedo ayudarte a conocer la plataforma y orientarte en el proceso de registro.' },
    'pago':             { contexto: 'checkout',      greeting: '¿Tienes preguntas sobre los planes o el pago? Estoy aquí para ayudarte.' },
    'registro':         { contexto: 'onboarding',    greeting: '¡Bienvenido! ¿Tienes un código de acceso de tu empresa? Te guío en el registro paso a paso.' },
    'login':            { contexto: 'acceso',        greeting: '¿Problemas para ingresar? Puedo ayudarte a recuperar tu acceso.' },
    'index':            { contexto: 'wizard_ec0217', greeting: '¡Hola, instructor! Soy tu guía para el expediente EC0217.01. ¿En qué paso del wizard necesitas ayuda?' },
    'dashboard':        { contexto: 'navegacion',    greeting: '¿Cómo puedo ayudarte? Puedo orientarte sobre cómo crear o abrir un curso.' },
    'ce':               { contexto: 'ce',         greeting: '¿Necesitas ayuda con la gestión de usuarios o códigos de acceso?' },
    'superadmin':       { contexto: 'superadmin',    greeting: '¿En qué puedo ayudarte con la gestión de la plataforma?' },
    'checkout-success': { contexto: 'onboarding',    greeting: '¡Pago procesado! ¿Necesitas ayuda para comenzar a usar la plataforma?' },
  };
  const DEFAULT_CTX = { contexto: 'general', greeting: '¿En qué puedo ayudarte?' };

  function getPageCtx() {
    const seg = window.location.pathname.split('/').filter(Boolean).pop() || 'landing';
    return PAGE_MAP[seg.replace(/\.html$/, '')] || DEFAULT_CTX;
  }

  // ── Gestión de sesión ────────────────────────────────────────────────────────
  const _sessionKey = () => `sbe_soporte_sesion_v1_${window._sbeW.contexto}`;

  function loadSession() {
    try {
      const raw = localStorage.getItem(_sessionKey());
      if (!raw) return null;
      const s = JSON.parse(raw);
      if (Date.now() - s.ts > SESSION_TTL) { localStorage.removeItem(_sessionKey()); return null; }
      return s;
    } catch { return null; }
  }

  function saveSession(id) {
    localStorage.setItem(_sessionKey(), JSON.stringify({ id, ts: Date.now() }));
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

  // ── Estado compartido + utilidades ──────────────────────────────────────────
  const { contexto, greeting } = getPageCtx();
  window._sbeW = {
    BACKEND, SESSION_TTL,
    contexto, greeting,
    sesionId:    null,
    historial:   [],
    turnos:      0,
    isOpen:      false,
    isBusy:      false,
    md, ensureSession,
    // buildWidget, toggleWidget, sendMsg, closeTicketForm, submitTicket,
    // _addMsg, _offerTicket — definidos por los módulos siguientes
  };
})();
