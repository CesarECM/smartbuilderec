    // ── SA: Soporte — helpers de escape ─────────────────────────────────────

    function _esc(t)     { return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function _escAttr(t) { return _esc(t).replace(/"/g,'&quot;'); }

    // ── SA: Soporte — inner tabs ─────────────────────────────────────────────

    var _sa_tickets          = [];
    var _sa_ticketIdActivo   = null;
    var _sa_soporteLoaded    = { tickets: false, sugerencias: false, kb: false, 'bajo-rendimiento': false };

    function saShowSoporteTab(name) {
      document.querySelectorAll('#sa-panel-soporte .sp-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#sa-panel-soporte .sp-panel').forEach(p => p.classList.remove('active'));
      const btn   = document.getElementById('sa-sptab-'   + name);
      const panel = document.getElementById('sa-sppanel-' + name);
      if (btn)   btn.classList.add('active');
      if (panel) panel.classList.add('active');
      if (name === 'tickets'          && !_sa_soporteLoaded.tickets)          { _sa_soporteLoaded.tickets          = true; saCargarTicketsSA(); }
      if (name === 'sugerencias'      && !_sa_soporteLoaded.sugerencias)      { _sa_soporteLoaded.sugerencias      = true; saCargarSugerencias('pendiente'); }
      if (name === 'kb'               && !_sa_soporteLoaded.kb)               { _sa_soporteLoaded.kb               = true; saCargarFaqs(); saCargarRecursos(); }
      if (name === 'bajo-rendimiento' && !_sa_soporteLoaded['bajo-rendimiento']) { _sa_soporteLoaded['bajo-rendimiento'] = true; saCargarBajoRendimiento(); }
    }

    // ── Logs de actividad ─────────────────────────────────────────────────────

    const _LOG_BADGES = {
      'wizard.curso.creado':    ['#15803d', '🆕 Curso creado'],
      'wizard.paso.completado': ['#1d4ed8', '✅ Paso completado'],
      'wizard.sync.error':      ['#b45309', '⚠️ Error sync'],
      'wizard.descarga.ok':     ['#0f766e', '⬇️ Descarga OK'],
      'wizard.descarga.error':  ['#b91c1c', '❌ Error descarga'],
    };

    function _saLogBadge(eventType) {
      const [color, label] = _LOG_BADGES[eventType] || ['#6b7280', eventType];
      return `<span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;color:#fff;background:${color}">${label}</span>`;
    }

    function _saLogMeta(metadata) {
      if (!metadata || !Object.keys(metadata).length) return '—';
      return Object.entries(metadata)
        .map(([k, v]) => `<span style="color:var(--c-text-3)">${k}:</span> ${String(v).slice(0, 80)}`)
        .join(' &nbsp;·&nbsp; ');
    }

    async function saCargarLogs() {
      const el    = document.getElementById('sa-logs-tabla');
      const tipo  = document.getElementById('sa-logs-filtro-tipo')?.value  || '';
      const desde = document.getElementById('sa-logs-filtro-desde')?.value || '';
      const hasta = document.getElementById('sa-logs-filtro-hasta')?.value || '';
      const usFilt = (document.getElementById('sa-logs-filtro-usuario')?.value || '').trim().toLowerCase();

      el.innerHTML = '<p class="loading-txt">Cargando...</p>';

      let q = _supabase
        .from('event_logs')
        .select('id, event_type, metadata, created_at, profiles(nombre, apellido, email)')
        .order('created_at', { ascending: false })
        .limit(500);

      if (tipo)  q = q.eq('event_type', tipo);
      if (desde) q = q.gte('created_at', desde + 'T00:00:00');
      if (hasta) q = q.lte('created_at', hasta + 'T23:59:59');

      const { data, error } = await q;
      if (error) { el.innerHTML = `<p class="error-txt">Error: ${error.message}</p>`; return; }

      let rows = data || [];
      if (usFilt) {
        rows = rows.filter(r => {
          const p = r.profiles;
          return p && (
            (p.nombre   || '').toLowerCase().includes(usFilt) ||
            (p.apellido || '').toLowerCase().includes(usFilt) ||
            (p.email    || '').toLowerCase().includes(usFilt)
          );
        });
      }

      if (!rows.length) {
        el.innerHTML = '<p class="empty-txt" style="padding:24px 0">Sin registros con estos filtros.</p>';
        return;
      }

      el.innerHTML = `<div class="table-wrap"><table class="data-table">
        <thead><tr>
          <th>Fecha</th><th>Usuario</th><th>Evento</th><th>Detalle</th>
        </tr></thead>
        <tbody>${rows.map(r => {
          const p      = r.profiles;
          const nombre = p
            ? ([p.nombre, p.apellido].filter(Boolean).join(' ') || p.email || '—')
            : '<span style="color:var(--c-text-3);font-size:11px">(usuario eliminado)</span>';
          const fecha  = new Date(r.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
          return `<tr>
            <td style="white-space:nowrap;font-size:11px;color:var(--c-text-3)">${fecha}</td>
            <td style="font-size:12px">${nombre}</td>
            <td>${_saLogBadge(r.event_type)}</td>
            <td style="font-size:11px">${_saLogMeta(r.metadata)}</td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>
      <p style="font-size:11px;color:var(--c-text-3);margin-top:8px;text-align:right">
        ${rows.length} registro${rows.length !== 1 ? 's' : ''}
      </p>`;
    }

    // ─────────────────────────────────────────────────────────────────────────

    async function saCargarKB() {
      // Carga inicial al abrir el tab Soporte: tickets + badges
      saCargarTicketsSA();
      _sa_soporteLoaded.tickets = true;
      sa_CargarBadges();
    }

    async function sa_CargarBadges() {
      try {
        const tickets = await apiFetch('/soporte/tickets');
        const abiertos = (tickets || []).filter(t => t.estado !== 'resuelto').length;
        const badgeT = document.getElementById('sa-sp-badge-tickets');
        if (badgeT) badgeT.textContent = abiertos || '';

        const sugs = await apiFetch('/soporte/sugerencias?estado=pendiente');
        const badgeS = document.getElementById('sa-sp-badge-sugerencias');
        if (badgeS) badgeS.textContent = (sugs || []).length || '';
      } catch(_) { /* badges son decorativos */ }
    }
