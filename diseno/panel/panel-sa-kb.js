    // ── SA: KB — FAQs y Recursos ─────────────────────────────────────────────

    var _sa_faqs     = [];
    var _sa_recursos = [];

    function saToggleKBSection(bodyId) {
      const body    = document.getElementById(bodyId);
      const section = body?.parentElement;
      if (!section) return;
      section.classList.toggle('open');
      const arrow = section.querySelector('.arrow');
      if (arrow) arrow.textContent = section.classList.contains('open') ? '▼' : '▶';
    }

    function saFiltrarKB() {
      const q = (document.getElementById('sa-kbSearch')?.value || '').toLowerCase();
      sa_RenderFaqsFiltered(q);
      sa_RenderRecursosFiltered(q);
    }

    // ── FAQs ─────────────────────────────────────────────────────────────────

    async function saCargarFaqs() {
      const el = document.getElementById('sa-listaFaqs');
      el.innerHTML = '<p class="loading-txt">Cargando FAQs...</p>';
      try {
        _sa_faqs = await apiFetch('/soporte/faqs') || [];
        const countEl = document.getElementById('sa-faqCount');
        if (countEl) countEl.textContent = _sa_faqs.length || '';
        sa_RenderFaqsFiltered('');
      } catch(e) {
        el.innerHTML = `<p class="error-txt">Error al cargar FAQs: ${e.message}</p>`;
      }
    }

    function sa_RenderFaqsFiltered(q) {
      const el = document.getElementById('sa-listaFaqs');
      if (!el) return;
      const lista = q
        ? _sa_faqs.filter(f =>
            (f.pregunta   || '').toLowerCase().includes(q) ||
            (f.respuesta  || '').toLowerCase().includes(q) ||
            (f.categoria  || '').toLowerCase().includes(q) ||
            (f.contexto   || '').toLowerCase().includes(q))
        : _sa_faqs;

      if (!lista.length) {
        el.innerHTML = `<p class="empty-txt">${q ? 'Sin resultados.' : 'No hay FAQs.'}</p>`;
        return;
      }
      el.innerHTML = lista.map(f => {
        const util = f.votos_util     || 0;
        const neg  = f.votos_negativo || 0;
        const exp  = f.exposiciones   || 0;
        return `<div style="border:1px solid var(--c-border);border-radius:var(--r-lg);padding:14px 16px;margin-bottom:10px;background:var(--c-surface)">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap">
            <div style="flex:1;min-width:0">
              <div style="font-weight:700;font-size:13px;color:var(--c-text);margin-bottom:4px">${_esc(f.pregunta)}</div>
              <div style="font-size:12px;color:var(--c-text-3);margin-bottom:6px;line-height:1.5">${_esc(f.respuesta)}</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
                <span class="norma-badge" style="font-size:10px">${_esc(f.categoria || 'general')}</span>
                <span style="font-size:10px;color:var(--c-text-3)">ctx: ${_esc(f.contexto || 'general')}</span>
                <span style="font-size:10px;color:var(--c-text-3)">👍 ${util} | 👎 ${neg} | 👁 ${exp}</span>
              </div>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button class="btn-sm" onclick="saAbrirEditarFaq('${f.id}')">Editar</button>
              <button class="btn-sm" style="color:#dc2626;border-color:#fca5a5" onclick="saEliminarFaq('${f.id}')">Eliminar</button>
            </div>
          </div>
        </div>`;
      }).join('');
    }

    async function saGuardarFaq() {
      const pregunta  = (document.getElementById('sa-faqPregunta')?.value  || '').trim();
      const respuesta = (document.getElementById('sa-faqRespuesta')?.value || '').trim();
      const categoria = (document.getElementById('sa-faqCategoria')?.value || 'general').trim();
      const contexto  = (document.getElementById('sa-faqContexto')?.value  || 'general');
      const msg       = document.getElementById('sa-faqMsg');
      const btn       = document.getElementById('sa-btnGuardarFaq');

      if (!pregunta || !respuesta) {
        if (msg) { msg.textContent = 'Pregunta y respuesta son obligatorias.'; msg.className = 'form-msg err'; }
        return;
      }
      if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
      if (msg) msg.textContent = '';
      try {
        await apiFetch('/soporte/faqs', { method: 'POST', body: { pregunta, respuesta, categoria, contexto } });
        if (msg) { msg.textContent = '✓ FAQ guardada.'; msg.className = 'form-msg ok'; }
        // limpiar form
        ['sa-faqPregunta','sa-faqRespuesta'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        mostrarToast('FAQ guardada');
        await saCargarFaqs();
        // abrir sección si estaba cerrada
        const section = document.getElementById('sa-kbFaqsSection');
        if (section && !section.classList.contains('open')) saToggleKBSection('sa-kbFaqsBody');
      } catch(e) {
        if (msg) { msg.textContent = 'Error: ' + e.message; msg.className = 'form-msg err'; }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Guardar FAQ'; }
      }
    }

    function saAbrirEditarFaq(id) {
      const faq = _sa_faqs.find(f => f.id === id);
      if (!faq) return;
      document.getElementById('sa-editFaqId').value        = faq.id;
      document.getElementById('sa-editFaqPregunta').value  = faq.pregunta  || '';
      document.getElementById('sa-editFaqRespuesta').value = faq.respuesta || '';
      document.getElementById('sa-editFaqCategoria').value = faq.categoria || 'general';
      document.getElementById('sa-editFaqContexto').value  = faq.contexto  || 'general';
      document.getElementById('sa-editFaqMsg').textContent = '';
      document.getElementById('sa-modalEditarFaq').classList.add('open');
    }

    async function saGuardarEdicionFaq() {
      const id        = document.getElementById('sa-editFaqId').value;
      const pregunta  = (document.getElementById('sa-editFaqPregunta')?.value  || '').trim();
      const respuesta = (document.getElementById('sa-editFaqRespuesta')?.value || '').trim();
      const categoria = (document.getElementById('sa-editFaqCategoria')?.value || 'general').trim();
      const contexto  = (document.getElementById('sa-editFaqContexto')?.value  || 'general');
      const msg       = document.getElementById('sa-editFaqMsg');
      const btn       = document.getElementById('sa-btnGuardarEdicionFaq');

      if (!pregunta || !respuesta) {
        msg.textContent = 'Pregunta y respuesta son obligatorias.'; msg.className = 'form-msg err'; return;
      }
      btn.disabled = true; btn.textContent = 'Guardando...'; msg.textContent = '';
      try {
        await apiFetch(`/soporte/faqs/${id}`, { method: 'PATCH', body: { pregunta, respuesta, categoria, contexto } });
        mostrarToast('FAQ actualizada');
        saCerrarModalEditarFaq();
        await saCargarFaqs();
      } catch(e) {
        msg.textContent = 'Error: ' + e.message; msg.className = 'form-msg err';
      } finally {
        btn.disabled = false; btn.textContent = 'Guardar cambios';
      }
    }

    function saCerrarModalEditarFaq(e) {
      if (e && e.target !== document.getElementById('sa-modalEditarFaq')) return;
      document.getElementById('sa-modalEditarFaq').classList.remove('open');
    }

    async function saEliminarFaq(faqId) {
      const faq = _sa_faqs.find(f => f.id === faqId);
      const preg = faq ? `"${faq.pregunta.slice(0, 60)}..."` : 'esta FAQ';
      if (!confirm(`¿Eliminar ${preg}? Esta acción desactiva la FAQ del sistema.`)) return;
      try {
        await apiFetch(`/soporte/faqs/${faqId}`, { method: 'DELETE' });
        mostrarToast('FAQ eliminada');
        await saCargarFaqs();
      } catch(e) {
        alert('Error al eliminar: ' + e.message);
      }
    }

    // ── Recursos ─────────────────────────────────────────────────────────────

    async function saCargarRecursos() {
      const el = document.getElementById('sa-listaRecursos');
      el.innerHTML = '<p class="loading-txt">Cargando recursos...</p>';
      try {
        _sa_recursos = await apiFetch('/soporte/recursos') || [];
        const countEl = document.getElementById('sa-recursosCount');
        if (countEl) countEl.textContent = _sa_recursos.length || '';
        sa_RenderRecursosFiltered('');
      } catch(e) {
        el.innerHTML = `<p class="error-txt">Error al cargar recursos: ${e.message}</p>`;
      }
    }

    function sa_RenderRecursosFiltered(q) {
      const el = document.getElementById('sa-listaRecursos');
      if (!el) return;
      const lista = q
        ? _sa_recursos.filter(r =>
            (r.titulo   || '').toLowerCase().includes(q) ||
            (r.contexto || '').toLowerCase().includes(q) ||
            (r.tipo     || '').toLowerCase().includes(q))
        : _sa_recursos;

      if (!lista.length) {
        el.innerHTML = `<p class="empty-txt">${q ? 'Sin resultados.' : 'No hay recursos.'}</p>`;
        return;
      }
      const tipoLabel = { articulo: 'Artículo', video: 'Video', guia: 'Guía', plantilla: 'Plantilla' };
      el.innerHTML = lista.map(r => {
        const fecha = new Date(r.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
        const urlHtml = r.url
          ? `<a href="${_escAttr(r.url)}" target="_blank" rel="noopener" style="font-size:11px;color:var(--c-blue-600)">${_esc(r.url)}</a>`
          : '';
        return `<div style="border:1px solid var(--c-border);border-radius:var(--r-lg);padding:14px 16px;margin-bottom:10px;background:var(--c-surface);display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:13px;color:var(--c-text);margin-bottom:3px">${_esc(r.titulo)}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
              <span class="norma-badge" style="font-size:10px">${tipoLabel[r.tipo] || r.tipo}</span>
              <span style="font-size:10px;color:var(--c-text-3)">ctx: ${_esc(r.contexto || 'general')}</span>
              <span style="font-size:10px;color:var(--c-text-3)">${fecha}</span>
              ${urlHtml}
            </div>
          </div>
          <button class="btn-sm" style="flex-shrink:0;color:#dc2626;border-color:#fca5a5" onclick="saEliminarRecurso('${r.id}')">Eliminar</button>
        </div>`;
      }).join('');
    }

    async function saGuardarRecurso() {
      const titulo    = (document.getElementById('sa-recursoTitulo')?.value    || '').trim();
      const tipo      = (document.getElementById('sa-recursoTipo')?.value      || 'articulo');
      const url       = (document.getElementById('sa-recursoUrl')?.value       || '').trim();
      const contexto  = (document.getElementById('sa-recursoContexto')?.value  || 'general');
      const contenido = (document.getElementById('sa-recursoContenido')?.value || '').trim();
      const msg       = document.getElementById('sa-recursoMsg');
      const btn       = document.getElementById('sa-btnGuardarRecurso');

      if (!titulo) {
        if (msg) { msg.textContent = 'El título es obligatorio.'; msg.className = 'form-msg err'; }
        return;
      }
      if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
      if (msg) msg.textContent = '';
      try {
        const res = await apiFetch('/soporte/recursos', { method: 'POST', body: { titulo, tipo, url, contexto, contenido } });
        const chunks = res.chunks_generados || 0;
        if (msg) { msg.textContent = `✓ Recurso guardado${chunks ? ` (${chunks} chunks)` : ''}.`; msg.className = 'form-msg ok'; }
        ['sa-recursoTitulo','sa-recursoUrl','sa-recursoContenido'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        mostrarToast('Recurso guardado');
        await saCargarRecursos();
        const section = document.getElementById('sa-kbRecursosSection');
        if (section && !section.classList.contains('open')) saToggleKBSection('sa-kbRecursosBody');
      } catch(e) {
        if (msg) { msg.textContent = 'Error: ' + e.message; msg.className = 'form-msg err'; }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Guardar recurso'; }
      }
    }

    async function saEliminarRecurso(recursoId) {
      const recurso = _sa_recursos.find(r => r.id === recursoId);
      const tit = recurso ? `"${recurso.titulo}"` : 'este recurso';
      if (!confirm(`¿Eliminar ${tit}?`)) return;
      try {
        await apiFetch(`/soporte/recursos/${recursoId}`, { method: 'DELETE' });
        mostrarToast('Recurso eliminado');
        await saCargarRecursos();
      } catch(e) {
        alert('Error al eliminar: ' + e.message);
      }
    }
