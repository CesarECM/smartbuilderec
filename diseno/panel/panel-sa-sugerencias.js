    // ── SA: Bajo rendimiento ─────────────────────────────────────────────────

    var _sa_br = [];

    async function saCargarBajoRendimiento() {
      const el = document.getElementById('sa-listaBR');
      el.innerHTML = '<p class="loading-txt">Cargando FAQs de bajo rendimiento...</p>';
      try {
        _sa_br = await apiFetch('/soporte/faqs/bajo-rendimiento') || [];
        if (!_sa_br.length) { el.innerHTML = '<p class="empty-txt">¡Todo bien! No hay FAQs con bajo rendimiento.</p>'; return; }
        el.innerHTML = _sa_br.map(f => {
          const util = f.votos_util     || 0;
          const neg  = f.votos_negativo || 0;
          const exp  = f.exposiciones   || 0;
          const pct  = (util + neg) > 0 ? Math.round(neg / (util + neg) * 100) : 0;
          return `<div style="border:1.5px solid #fecaca;border-radius:var(--r-lg);padding:14px 16px;margin-bottom:10px;background:#fff7f7">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap">
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:13px;color:var(--c-text);margin-bottom:4px">${_esc(f.pregunta)}</div>
                <div style="font-size:12px;color:var(--c-text-3);margin-bottom:6px;line-height:1.5">${_esc(f.respuesta)}</div>
                <div style="display:flex;gap:10px;flex-wrap:wrap">
                  <span style="font-size:11px;color:#b91c1c;font-weight:700">👎 ${neg} negativos (${pct}%)</span>
                  <span style="font-size:11px;color:var(--c-text-3)">👍 ${util} útiles · 👁 ${exp} exposiciones</span>
                  <span style="font-size:10px;color:var(--c-text-3)">ctx: ${_esc(f.contexto || 'general')} · cat: ${_esc(f.categoria || '—')}</span>
                </div>
              </div>
              <button class="btn-sm" id="sa-br-btn-${f.id}" onclick="saAnalizarFaqCalidadSingle('${f.id}', this)">🤖 Analizar</button>
            </div>
          </div>`;
        }).join('');
      } catch(e) {
        el.innerHTML = `<p class="error-txt">Error: ${e.message}</p>`;
      }
    }

    async function saAnalizarFaqCalidadSingle(faqId, btn) {
      // No hay endpoint individual — llama el batch que procesa todas las candidatas
      if (!confirm('Se analizarán todas las FAQs de bajo rendimiento con IA y se crearán sugerencias. ¿Continuar?')) return;
      await saAnalizarLoteBR(btn);
    }

    async function saAnalizarLoteBR(triggerBtn) {
      const btn = triggerBtn || document.querySelector('[onclick="saAnalizarLoteBR()"]');
      const orig = btn?.textContent || '';
      if (btn) { btn.disabled = true; btn.textContent = '⏳ Analizando...'; }
      try {
        const res = await apiFetch('/soporte/cron/analizar-calidad-faqs', { method: 'POST' });
        const guardadas = res.guardadas ?? res.faqs_analizadas ?? '?';
        mostrarToast(`Análisis completo — ${guardadas} sugerencia(s) creadas`);
        await saCargarBajoRendimiento();
        // Refrescar badges de sugerencias
        sa_CargarBadges();
      } catch(e) {
        alert('Error al analizar: ' + e.message);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = orig || '🤖 Analizar todas'; }
      }
    }

    // ── SA: Sugerencias IA ───────────────────────────────────────────────────

    const SA_SUG_META = {
      nueva_faq:     { label: '✨ Nueva FAQ',     color: '#059669', bg: '#f0fdf4' },
      editar_faq:    { label: '✏️ Editar FAQ',    color: '#2563eb', bg: '#eff6ff' },
      eliminar_faq:  { label: '🗑️ Eliminar FAQ', color: '#dc2626', bg: '#fff7f7' },
      unir_faqs:     { label: '🔗 Unir FAQs',    color: '#7c3aed', bg: '#faf5ff' },
      nuevo_recurso: { label: '📄 Nuevo recurso', color: '#d97706', bg: '#fffbeb' },
    };

    var _sa_sugerencias    = [];
    var _sa_sugEditMode    = {};   // {sugId: true/false}

    async function saCargarSugerencias(estado = 'pendiente') {
      const el = document.getElementById('sa-listaSugerencias');
      el.innerHTML = '<p class="loading-txt">Cargando sugerencias...</p>';
      try {
        _sa_sugerencias = await apiFetch(`/soporte/sugerencias?estado=${estado}`) || [];
        _sa_sugEditMode = {};
        sa_RenderSugerencias(_sa_sugerencias);
      } catch(e) {
        el.innerHTML = `<p class="error-txt">Error: ${e.message}</p>`;
      }
    }

    function saFiltrarSugerenciasTipo() {
      const tipo = document.getElementById('sa-filtroSugTipo')?.value || '';
      const lista = tipo ? _sa_sugerencias.filter(s => s.tipo === tipo) : _sa_sugerencias;
      sa_RenderSugerencias(lista);
    }

    function sa_RenderSugerencias(sugs) {
      const el = document.getElementById('sa-listaSugerencias');
      if (!sugs.length) { el.innerHTML = '<p class="empty-txt">No hay sugerencias pendientes.</p>'; return; }
      el.innerHTML = sugs.map(s => {
        const meta  = SA_SUG_META[s.tipo] || { label: s.tipo, color: '#6b7280', bg: 'var(--c-surface)' };
        const fecha = new Date(s.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
        const enEdicion = _sa_sugEditMode[s.id];
        const body  = enEdicion
          ? sa_RenderSugBodyEdit(s.tipo, s.propuesta || {}, s.id)
          : sa_RenderSugBody(s.tipo, s.propuesta || {});
        return `<div id="sa-sug-card-${s.id}" style="border:1.5px solid ${meta.color}33;border-radius:var(--r-xl);padding:16px 18px;margin-bottom:12px;background:${meta.bg}">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">
            <span style="font-size:11px;font-weight:700;color:${meta.color};background:${meta.color}18;padding:3px 10px;border-radius:20px">${meta.label}</span>
            <span style="font-size:11px;color:var(--c-text-3)">${fecha}</span>
          </div>
          <div id="sa-sug-body-${s.id}">${body}</div>
          <div id="sa-sug-actions-${s.id}" style="margin-top:12px">${sa_RenderSugActions(s.id, s.tipo, enEdicion)}</div>
        </div>`;
      }).join('');
    }

    function sa_RenderSugBody(tipo, prop) {
      if (tipo === 'nueva_faq') return `
        <div style="margin-bottom:6px"><span class="tk-label">Pregunta</span><div style="font-size:13px;font-weight:600">${_esc(prop.pregunta || '')}</div></div>
        <div style="margin-bottom:6px"><span class="tk-label">Respuesta</span><div style="font-size:13px;color:var(--c-text-2);line-height:1.5">${_esc(prop.respuesta || '')}</div></div>
        <div style="font-size:11px;color:var(--c-text-3)">Contexto: ${_esc(prop.contexto || 'general')}</div>`;

      if (tipo === 'editar_faq') return `
        ${prop.causa_raiz ? `<div style="font-size:12px;color:#92400e;background:#fef9c3;border-radius:var(--r-sm);padding:6px 10px;margin-bottom:10px">🔍 ${_esc(prop.causa_raiz)}</div>` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <div class="tk-label" style="color:#dc2626">Original</div>
            <div style="font-size:12px;font-weight:600;margin-bottom:3px">${_esc(prop.pregunta_original || '')}</div>
            <div style="font-size:12px;color:var(--c-text-3);line-height:1.4">${_esc(prop.respuesta_original || '')}</div>
          </div>
          <div>
            <div class="tk-label" style="color:#059669">Propuesta</div>
            <div style="font-size:12px;font-weight:600;margin-bottom:3px">${_esc(prop.pregunta || '')}</div>
            <div style="font-size:12px;color:var(--c-text-2);line-height:1.4">${_esc(prop.respuesta || '')}</div>
          </div>
        </div>`;

      if (tipo === 'eliminar_faq') return `
        <div style="font-size:13px;font-weight:600;margin-bottom:6px">${_esc(prop.pregunta_original || '')}</div>
        ${prop.razon ? `<div style="font-size:12px;color:var(--c-text-3)">Razón: ${_esc(prop.razon)}</div>` : ''}
        ${prop.metricas ? `<div style="font-size:11px;color:var(--c-text-3)">👁 ${prop.metricas.exposiciones || 0} exp · 👍 ${prop.metricas.votos_util || 0} · 👎 ${prop.metricas.votos_negativo || 0}</div>` : ''}`;

      if (tipo === 'unir_faqs') {
        const orig = (prop.preguntas_originales || []).map(p => `<li style="font-size:12px;color:var(--c-text-3)">${_esc(p)}</li>`).join('');
        return `
          <div style="margin-bottom:8px"><div class="tk-label">Preguntas a unir</div><ul style="margin:4px 0;padding-left:18px">${orig || '<li style="font-size:12px;color:var(--c-text-3)">—</li>'}</ul></div>
          <div><div class="tk-label" style="color:#7c3aed">FAQ unificada</div>
          <div style="font-size:12px;font-weight:600;margin-bottom:3px">${_esc(prop.pregunta || '')}</div>
          <div style="font-size:12px;color:var(--c-text-2);line-height:1.4">${_esc(prop.respuesta || '')}</div></div>`;
      }

      if (tipo === 'nuevo_recurso') return `
        <div style="font-weight:700;font-size:13px;margin-bottom:4px">${_esc(prop.titulo || '')}</div>
        ${prop.contenido ? `<div style="font-size:12px;color:var(--c-text-3);line-height:1.4;max-height:80px;overflow:hidden">${_esc(prop.contenido.slice(0, 300))}${prop.contenido.length > 300 ? '…' : ''}</div>` : ''}
        <div style="font-size:11px;color:var(--c-text-3);margin-top:4px">Tipo: ${_esc(prop.tipo_recurso || 'articulo')} · Contexto: ${_esc(prop.contexto || 'general')}</div>`;

      return `<pre style="font-size:11px;overflow:auto">${_esc(JSON.stringify(prop, null, 2))}</pre>`;
    }

    function sa_RenderSugBodyEdit(tipo, prop, sugId) {
      const ctx = (c) => `<option value="general"${c==='general'?' selected':''}>general</option>
        <option value="wizard"${c==='wizard'?' selected':''}>wizard</option>
        <option value="erp"${c==='erp'?' selected':''}>erp</option>
        <option value="pagos"${c==='pagos'?' selected':''}>pagos</option>`;

      if (tipo === 'nueva_faq' || tipo === 'editar_faq') return `
        <div class="form-field" style="margin-bottom:10px">
          <label>Pregunta</label>
          <input type="text" id="sa-sug-${sugId}-pregunta" value="${_escAttr(prop.pregunta || '')}" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;background:var(--c-surface)">
        </div>
        <div class="form-field" style="margin-bottom:10px">
          <label>Respuesta</label>
          <textarea id="sa-sug-${sugId}-respuesta" rows="4" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;font-family:inherit;background:var(--c-surface);resize:vertical">${_esc(prop.respuesta || '')}</textarea>
        </div>
        <div class="form-field" style="margin-bottom:4px">
          <label>Contexto</label>
          <select id="sa-sug-${sugId}-contexto" style="width:100%;padding:8px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;background:var(--c-surface)">${ctx(prop.contexto || 'general')}</select>
        </div>`;

      if (tipo === 'unir_faqs') return `
        <div style="margin-bottom:8px;font-size:12px;color:var(--c-text-3)">FAQs a unir: ${(prop.faq_ids||[]).join(', ')}</div>
        <div class="form-field" style="margin-bottom:10px">
          <label>Pregunta unificada</label>
          <input type="text" id="sa-sug-${sugId}-pregunta" value="${_escAttr(prop.pregunta || '')}" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;background:var(--c-surface)">
        </div>
        <div class="form-field" style="margin-bottom:10px">
          <label>Respuesta unificada</label>
          <textarea id="sa-sug-${sugId}-respuesta_unificada" rows="4" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;font-family:inherit;background:var(--c-surface);resize:vertical">${_esc(prop.respuesta || '')}</textarea>
        </div>
        <div class="form-field">
          <label>Contexto</label>
          <select id="sa-sug-${sugId}-contexto" style="width:100%;padding:8px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;background:var(--c-surface)">${ctx(prop.contexto || 'general')}</select>
        </div>`;

      if (tipo === 'nuevo_recurso') return `
        <div class="form-field" style="margin-bottom:10px">
          <label>Título</label>
          <input type="text" id="sa-sug-${sugId}-titulo" value="${_escAttr(prop.titulo || '')}" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;background:var(--c-surface)">
        </div>
        <div class="form-field" style="margin-bottom:10px">
          <label>Contenido</label>
          <textarea id="sa-sug-${sugId}-contenido" rows="4" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;font-family:inherit;background:var(--c-surface);resize:vertical">${_esc(prop.contenido || '')}</textarea>
        </div>
        <div class="form-field">
          <label>Contexto</label>
          <select id="sa-sug-${sugId}-contexto" style="width:100%;padding:8px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;background:var(--c-surface)">${ctx(prop.contexto || 'general')}</select>
        </div>`;

      // eliminar_faq — no hay campos editables significativos
      return sa_RenderSugBody(tipo, prop);
    }

    function sa_RenderSugActions(sugId, tipo, enEdicion) {
      if (enEdicion) return `
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-primary" style="font-size:13px;padding:7px 14px" onclick="saAccionSugerencia('${sugId}','aprobar')">✓ Aprobar con cambios</button>
          <button class="btn-sm" onclick="saToggleEditarSugerencia('${sugId}')">Cancelar</button>
        </div>`;
      return `
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${tipo !== 'eliminar_faq' ? `<button class="btn-sm" onclick="saToggleEditarSugerencia('${sugId}')">✏️ Editar antes de aprobar</button>` : ''}
          <button class="btn-primary" style="font-size:13px;padding:7px 14px" onclick="saAccionSugerencia('${sugId}','aprobar')">✓ Aprobar</button>
          <button class="btn-sm" style="color:#dc2626;border-color:#fca5a5" onclick="saAccionSugerencia('${sugId}','rechazar')">✗ Rechazar</button>
        </div>`;
    }

    function saToggleEditarSugerencia(sugId) {
      _sa_sugEditMode[sugId] = !_sa_sugEditMode[sugId];
      const sug = _sa_sugerencias.find(s => s.id === sugId);
      if (!sug) return;
      const bodyEl    = document.getElementById(`sa-sug-body-${sugId}`);
      const actionsEl = document.getElementById(`sa-sug-actions-${sugId}`);
      const enEdicion = _sa_sugEditMode[sugId];
      if (bodyEl)    bodyEl.innerHTML    = enEdicion ? sa_RenderSugBodyEdit(sug.tipo, sug.propuesta || {}, sugId) : sa_RenderSugBody(sug.tipo, sug.propuesta || {});
      if (actionsEl) actionsEl.innerHTML = sa_RenderSugActions(sugId, sug.tipo, enEdicion);
    }

    function sa_GetEditedPropuesta(sugId, tipo, propOriginal) {
      const v = (id) => document.getElementById(`sa-sug-${sugId}-${id}`)?.value?.trim() || '';
      if (tipo === 'nueva_faq')  return { ...propOriginal, pregunta: v('pregunta'), respuesta: v('respuesta'), contexto: v('contexto') };
      if (tipo === 'editar_faq') return { ...propOriginal, pregunta: v('pregunta'), respuesta: v('respuesta'), contexto: v('contexto') };
      if (tipo === 'unir_faqs')  return { ...propOriginal, pregunta: v('pregunta'), respuesta: v('respuesta_unificada'), contexto: v('contexto') };
      if (tipo === 'nuevo_recurso') return { ...propOriginal, titulo: v('titulo'), contenido: v('contenido'), contexto: v('contexto') };
      return propOriginal;
    }

    async function saAccionSugerencia(sugId, accion) {
      const sug = _sa_sugerencias.find(s => s.id === sugId);
      if (!sug) return;
      const enEdicion = _sa_sugEditMode[sugId];
      const propuesta = enEdicion ? sa_GetEditedPropuesta(sugId, sug.tipo, sug.propuesta || {}) : null;

      if (accion === 'rechazar' && !confirm('¿Rechazar esta sugerencia de la IA?')) return;

      const actionsEl = document.getElementById(`sa-sug-actions-${sugId}`);
      if (actionsEl) actionsEl.innerHTML = '<p class="loading-txt" style="margin:0">Procesando...</p>';

      try {
        await apiFetch(`/soporte/sugerencias/${sugId}`, {
          method: 'PATCH',
          body:   { accion, ...(propuesta ? { propuesta } : {}) },
        });
        mostrarToast(accion === 'aprobar' ? '✓ Sugerencia aprobada y aplicada' : 'Sugerencia rechazada');
        // Refrescar lista y badges
        _sa_sugerencias = _sa_sugerencias.filter(s => s.id !== sugId);
        sa_RenderSugerencias(_sa_sugerencias);
        sa_CargarBadges();
        // Si era nueva FAQ, refrescar lista de FAQs en background
        if (accion === 'aprobar' && ['nueva_faq','editar_faq','eliminar_faq','unir_faqs'].includes(sug.tipo)) {
          saCargarFaqs().catch(() => {});
        }
      } catch(e) {
        if (actionsEl) actionsEl.innerHTML = `<p class="error-txt" style="margin:0">Error: ${e.message}</p>`;
      }
    }
