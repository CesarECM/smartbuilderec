    // ── SA: Tickets ──────────────────────────────────────────────────────────

    async function saCargarTicketsSA() {
      const el = document.getElementById('sa-listaTicketsSA');
      el.innerHTML = '<p class="loading-txt">Cargando tickets...</p>';
      try {
        const data = await apiFetch('/soporte/tickets');
        _sa_tickets = data || [];
        sa_RenderTablaTicketsSA(_sa_tickets);
      } catch(e) {
        el.innerHTML = `<p class="error-txt">Error: ${e.message}</p>`;
      }
    }

    function saFiltrarTicketsSA(q) {
      if (!q.trim()) { sa_RenderTablaTicketsSA(_sa_tickets); return; }
      const lq = q.toLowerCase();
      sa_RenderTablaTicketsSA(_sa_tickets.filter(t =>
        (t.asunto       || '').toLowerCase().includes(lq) ||
        (t.user_email   || '').toLowerCase().includes(lq) ||
        (t.user_nombre  || '').toLowerCase().includes(lq) ||
        (t.categoria    || '').toLowerCase().includes(lq) ||
        String(t.numero || '').includes(lq)
      ));
    }

    function sa_RenderTablaTicketsSA(tickets) {
      const el = document.getElementById('sa-listaTicketsSA');
      if (!tickets.length) { el.innerHTML = '<p class="empty-txt">No hay tickets.</p>'; return; }
      el.innerHTML = `<div class="table-wrap"><table class="data-table">
        <thead><tr>
          <th>#</th><th>Asunto</th><th>Usuario</th><th>Categoría</th><th>Estado</th><th>Fecha</th><th></th>
        </tr></thead>
        <tbody>${tickets.map(t => {
          const fecha = new Date(t.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
          const cls   = `status-badge badge-${t.estado}`;
          const label = t.estado === 'nuevo' ? 'Nuevo' : t.estado === 'en_revision' ? 'En revisión' : 'Resuelto';
          const nom   = t.user_nombre || t.user_email || '—';
          return `<tr>
            <td style="font-weight:700;color:var(--c-text-3)">#${t.numero || '—'}</td>
            <td style="font-weight:600;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.asunto || '(Sin asunto)'}</td>
            <td style="font-size:12px;color:var(--c-text-3)">${nom}</td>
            <td><span style="font-size:11px">${t.categoria || '—'}</span></td>
            <td><span class="${cls}">${label}</span></td>
            <td style="font-size:12px;color:var(--c-text-3);white-space:nowrap">${fecha}</td>
            <td><button class="btn-sm" onclick="saAbrirTicketSA('${t.id}')">Ver</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>`;
    }

    async function saAbrirTicketSA(ticketId) {
      _sa_ticketIdActivo = ticketId;
      const modal = document.getElementById('sa-modalTicketSA');
      const body  = document.getElementById('sa-modalTicketBody');
      body.innerHTML = '<p class="loading-txt" style="padding:20px">Cargando ticket...</p>';
      modal.classList.add('open');
      try {
        const t = await apiFetch(`/soporte/tickets/${ticketId}`);
        const fecha = new Date(t.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
        const estadoCls = `status-badge badge-${t.estado}`;
        const estadoLabel = t.estado === 'nuevo' ? 'Nuevo' : t.estado === 'en_revision' ? 'En revisión' : 'Resuelto';

        // Transcript
        let transcriptHtml = '';
        if (Array.isArray(t.transcript) && t.transcript.length) {
          const msgs = t.transcript.map(m => {
            const isUser = m.role === 'user';
            return `<div class="ct-msg ${isUser ? 'ct-msg--user' : 'ct-msg--assistant'}">
              <div>
                <div class="ct-role-label">${isUser ? '👤 Usuario' : '🤖 IA'}</div>
                <div class="ct-bubble">${_esc(m.content || '')}</div>
              </div>
            </div>`;
          }).join('');
          transcriptHtml = `
            <div class="sa-modal-section" style="margin-bottom:14px">
              <div class="tk-label">Conversación IA</div>
              <div class="chat-transcript">${msgs}</div>
            </div>`;
        }

        // Estado actual y acciones
        const resuelto = t.estado === 'resuelto';
        const resolucionActual = resuelto && t.resolucion
          ? `<div class="sa-modal-section" style="margin-bottom:14px">
              <div class="tk-label">Resolución aplicada</div>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:var(--r-md);padding:12px 14px;font-size:13px;color:#166534">${_esc(t.resolucion)}</div>
            </div>`
          : '';

        const notasInternas = t.notas_internas
          ? `<div class="sa-modal-section" style="margin-bottom:14px">
              <div class="tk-label">Notas internas</div>
              <div style="font-size:13px;color:var(--c-text-3)">${_esc(t.notas_internas)}</div>
            </div>`
          : '';

        const formResolucion = !resuelto ? `
          <div class="sa-modal-section" style="margin-bottom:14px">
            <label class="tk-label" for="sa-ticketResolucion">Resolución</label>
            <textarea class="tk-textarea" id="sa-ticketResolucion" rows="4"
              placeholder="Describe la solución para el usuario...">${_esc(t.resolucion || '')}</textarea>
          </div>
          <p class="form-msg" id="sa-ticketMsg"></p>
          <div class="modal-btns" style="margin-top:8px">
            ${t.estado === 'nuevo'
              ? `<button class="btn-sm" id="sa-btnEnRevision" onclick="saCambiarEstadoTicketSA('${t.id}','en_revision')">Poner en revisión</button>`
              : ''}
            <button class="btn-primary" id="sa-btnResolver" onclick="saResolverTicketSA('${t.id}')">✓ Marcar resuelto</button>
          </div>` : '';

        body.innerHTML = `
          <div class="sa-modal-title" style="margin-bottom:4px">#${t.numero || ''} ${_esc(t.asunto || '(Sin asunto)')}</div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:18px">
            <span class="${estadoCls}">${estadoLabel}</span>
            ${t.prioridad ? `<span style="font-size:11px;color:var(--c-text-3)">Prioridad: ${t.prioridad}</span>` : ''}
            <span style="font-size:11px;color:var(--c-text-3)">${t.user_nombre || ''} &lt;${t.user_email || ''}&gt;</span>
            <span style="font-size:11px;color:var(--c-text-3)">${fecha}</span>
            ${t.pagina_origen ? `<span style="font-size:11px;color:var(--c-text-3)">Página: ${_esc(t.pagina_origen)}</span>` : ''}
          </div>
          ${transcriptHtml}
          ${notasInternas}
          ${resolucionActual}
          ${formResolucion}`;
      } catch(e) {
        body.innerHTML = `<p class="error-txt" style="padding:20px">Error: ${e.message}</p>`;
      }
    }

    async function saCambiarEstadoTicketSA(ticketId, estado) {
      const btn = document.getElementById('sa-btnEnRevision');
      if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
      try {
        await apiFetch(`/soporte/tickets/${ticketId}`, { method: 'PATCH', body: { estado } });
        mostrarToast(`Ticket marcado: ${estado === 'en_revision' ? 'en revisión' : estado}`);
        saCerrarTicketModalSA();
        saCargarTicketsSA();
        sa_CargarBadges();
      } catch(e) {
        const msg = document.getElementById('sa-ticketMsg');
        if (msg) { msg.textContent = 'Error: ' + e.message; msg.className = 'form-msg err'; }
        if (btn) { btn.disabled = false; btn.textContent = 'Poner en revisión'; }
      }
    }

    async function saResolverTicketSA(ticketId) {
      const resolucion = (document.getElementById('sa-ticketResolucion')?.value || '').trim();
      if (!resolucion) {
        const msg = document.getElementById('sa-ticketMsg');
        if (msg) { msg.textContent = 'Escribe una resolución antes de cerrar el ticket.'; msg.className = 'form-msg err'; }
        return;
      }
      const btn = document.getElementById('sa-btnResolver');
      if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
      try {
        await apiFetch(`/soporte/tickets/${ticketId}`, {
          method: 'PATCH',
          body:   { estado: 'resuelto', resolucion },
        });
        mostrarToast('Ticket resuelto');
        saCerrarTicketModalSA();
        saCargarTicketsSA();
        sa_CargarBadges();
      } catch(e) {
        const msg = document.getElementById('sa-ticketMsg');
        if (msg) { msg.textContent = 'Error: ' + e.message; msg.className = 'form-msg err'; }
        if (btn) { btn.disabled = false; btn.textContent = '✓ Marcar resuelto'; }
      }
    }

    function saCerrarTicketModalSA(e) {
      if (e && e.target !== document.getElementById('sa-modalTicketSA')) return;
      document.getElementById('sa-modalTicketSA').classList.remove('open');
      _sa_ticketIdActivo = null;
    }
