    // ── Integraciones ─────────────────────────────────────────────

    const _SA_INTEG_META = {
      claude:              { extraFn: d => d.note  || 'OK' },
      openai:              { extraFn: d => d.model || 'OK' },
      supabase:            { extraFn: d => d.perfiles  != null ? `${d.perfiles} perfiles`  : 'OK' },
      pgvector:            { extraFn: d => d.faqs_activas != null ? `${d.faqs_activas} FAQs` : 'OK' },
      resend:              { extraFn: d => d.from   || 'OK' },
      stripe:              { extraFn: d => d.mode   ? d.mode.toUpperCase() : 'OK' },
      docs:                { extraFn: _ => 'DOCX + PPTX' },
      stripe_pagos:        { extraFn: d => d.monto  ? `${d.monto} · ${d.hace}` : (d.ultimo || 'OK') },
      tokens_ia:           { extraFn: d => d.tokens ? `${d.tokens} tok · ${d.costo}` : 'OK' },
      tickets_kb:          { extraFn: _ => 'al día' },
      sugerencias_kb:      { extraFn: _ => 'al día' },
      vigencias_proximas:  { extraFn: _ => 'al día' },
      admins_sin_creditos: { extraFn: _ => 'todos con créditos' },
      usuarios_sin_plan:   { extraFn: _ => 'todos activos' },
    };

    function _sa_classifyError(key, msg) {
      if (!msg) return { tag: 'SIN_DETALLE', desc: 'El servicio no retornó información de error.' };
      const m = msg.toLowerCase();
      if (m.includes('sin resolver') || m.includes('sin aplicar') || m.includes('pendiente'))
        return { tag: 'PENDIENTES', desc: msg };
      if (m.includes('no configurada') || m.includes('not configured') || m.includes('missing'))
        return { tag: 'VAR_FALTANTE', desc: msg };
      if (m.includes('invalid api key') || m.includes('authentication') || m.includes('unauthorized') || m.includes('api key') || m.includes('401'))
        return { tag: 'CLAVE_INVÁLIDA', desc: msg };
      if (m.includes('rate limit') || m.includes('429') || m.includes('too many'))
        return { tag: 'RATE_LIMIT', desc: msg };
      if (m.includes('timeout') || m.includes('timed out') || m.includes('connection') || m.includes('network'))
        return { tag: 'RED/TIMEOUT', desc: msg };
      if (m.includes('permission') || m.includes('403') || m.includes('forbidden') || m.includes('access denied'))
        return { tag: 'SIN_PERMISO', desc: msg };
      if (m.includes('500') || m.includes('server error') || m.includes('internal'))
        return { tag: 'ERROR_SERVIDOR', desc: msg };
      if (m.includes('http '))
        return { tag: 'HTTP_ERROR', desc: msg };
      return { tag: 'ERROR_API', desc: msg };
    }

    async function verificarIntegraciones() {
      const btn = document.getElementById('sa-btnVerificar');
      if (btn) { btn.disabled = true; btn.textContent = 'Verificando...'; }

      Object.keys(_SA_INTEG_META).forEach(key => {
        const led   = document.getElementById('sa-led-'   + key);
        const badge = document.getElementById('sa-badge-' + key);
        const card  = document.getElementById('sa-integ-' + key);
        if (led)   led.className      = 'led led-yellow';
        if (badge) { badge.textContent = '…'; badge.className = 'integ-badge gray'; }
        if (card)  { card.querySelector('.integ-error-detail')?.remove(); card.querySelector('.integ-warn-detail')?.remove(); }
      });

      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${BACKEND_URL}/health/integraciones`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        Object.entries(data.integraciones).forEach(([key, info]) => {
          const led   = document.getElementById('sa-led-'   + key);
          const badge = document.getElementById('sa-badge-' + key);
          const card  = document.getElementById('sa-integ-' + key);
          if (!led) return;
          const meta = _SA_INTEG_META[key] || {};

          if (info.status === 'ok') {
            led.className     = 'led led-green';
            card.className    = 'integ-card';
            const txt = (info.latency_ms != null ? `${info.latency_ms} ms` : '')
                      + (meta.extraFn ? ' · ' + meta.extraFn(info) : '');
            badge.textContent = txt.replace(/^ · /, '');
            badge.className   = 'integ-badge ok';

          } else if (info.status === 'warning') {
            led.className     = 'led led-yellow';
            card.className    = 'integ-card';
            badge.textContent = info.pendientes + (info.pendientes === 1 ? ' pendiente' : ' pendientes');
            badge.className   = 'integ-badge warn';
            const warnDiv = document.createElement('div');
            warnDiv.className = 'integ-warn-detail';
            warnDiv.textContent = info.message || '';
            badge.parentNode.appendChild(warnDiv);

          } else {
            const err = _sa_classifyError(key, info.error);
            led.className     = 'led led-red';
            card.className    = 'integ-card';
            badge.textContent = err.tag;
            badge.className   = 'integ-badge err';

            const detail  = document.createElement('div');  detail.className  = 'integ-error-detail';
            const tagEl   = document.createElement('div');  tagEl.className   = 'integ-error-tag';   tagEl.textContent  = err.tag;
            const msgEl   = document.createElement('div');  msgEl.className   = 'integ-error-msg';   msgEl.textContent  = err.desc;
            const copyBtn = document.createElement('button'); copyBtn.className = 'integ-copy-btn'; copyBtn.textContent = '⎘ Copiar error';
            const clipText = `INTEGRACIÓN: ${key.toUpperCase()}\nCLASIFICACIÓN: ${err.tag}\nERROR: ${err.desc}`;
            copyBtn.addEventListener('click', () => {
              navigator.clipboard.writeText(clipText).then(() => {
                copyBtn.textContent = '✓ Copiado';
                setTimeout(() => { copyBtn.textContent = '⎘ Copiar error'; }, 1400);
              });
            });
            detail.appendChild(tagEl); detail.appendChild(msgEl); detail.appendChild(copyBtn);
            badge.parentNode.appendChild(detail);
          }
        });

        // Ordenar: error → warning → ok
        const grid = document.querySelector('#sa-panel-resumen .integ-grid');
        if (grid) {
          const _orden = c => c.querySelector('.integ-badge.err') ? 0 : c.querySelector('.integ-badge.warn') ? 1 : 2;
          Array.from(grid.querySelectorAll('.integ-card'))
            .sort((a, b) => _orden(a) - _orden(b))
            .forEach(c => grid.appendChild(c));
        }

        const ts = document.getElementById('sa-integLastCheck');
        if (ts) {
          const hora = new Date(data.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          ts.textContent = `· verificado ${hora}`;
        }

      } catch(e) {
        Object.keys(_SA_INTEG_META).forEach(key => {
          const led = document.getElementById('sa-led-' + key);
          if (led) led.className = 'led led-gray';
        });
        const ts = document.getElementById('sa-integLastCheck');
        if (ts) ts.textContent = '· no se pudo conectar al servidor';
        console.error('verificarIntegraciones:', e);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '↺ Verificar'; }
      }
    }
