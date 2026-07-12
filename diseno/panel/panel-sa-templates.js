    // ── SA: Plantillas de email ──────────────────────────────────────────────

    var _sa_tpls = [];

    async function saCargarPlantillas() {
      const list = document.getElementById('sa-tplList');
      list.innerHTML = '<p class="loading-txt">Cargando plantillas...</p>';
      try {
        const data = await apiFetch('/email/templates');
        _sa_tpls = data;
        if (!data.length) {
          list.innerHTML = '<p class="empty-txt">No hay plantillas configuradas.</p>';
          return;
        }
        list.innerHTML = data.map(t => {
          const upd = t.updated_at
            ? new Date(t.updated_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—';
          const vars = (t.variables || [])
            .map(v => `<span class="tpl-var-chip" style="cursor:default" title="{{${v}}}">${v}</span>`)
            .join('');
          return `<div class="tpl-card" id="sa-tpl-card-${t.slug}" onclick="saEditarTemplate('${t.slug}')">
            <div class="tpl-slug">${t.slug}</div>
            <div class="tpl-nombre">${t.nombre || t.slug}</div>
            <div class="tpl-updated">Actualizado: ${upd}</div>
            ${vars ? `<div class="tpl-vars" style="margin-top:8px">${vars}</div>` : ''}
          </div>`;
        }).join('');
      } catch(e) {
        list.innerHTML = `<p class="error-txt">Error al cargar plantillas: ${e.message}</p>`;
      }
    }

    async function saEditarTemplate(slug) {
      _sa_tplSlugActivo = slug;

      document.querySelectorAll('.tpl-card').forEach(c => c.classList.remove('active'));
      const card = document.getElementById(`sa-tpl-card-${slug}`);
      if (card) card.classList.add('active');

      const editor = document.getElementById('sa-tplEditor');
      editor.classList.add('visible');
      editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      document.getElementById('sa-tplEditorTitle').textContent = 'Cargando...';
      document.getElementById('sa-tplMsg').textContent = '';
      document.getElementById('sa-tplSubject').value = '';
      document.getElementById('sa-tplBodyHtml').value = '';
      document.getElementById('sa-tplVarsChips').innerHTML = '';
      document.getElementById('sa-tplPreviewFrame').srcdoc = '';

      try {
        const tpl = await apiFetch(`/email/templates/${slug}`);
        document.getElementById('sa-tplEditorTitle').textContent = `Editando: ${tpl.nombre || slug}`;
        document.getElementById('sa-tplSubject').value  = tpl.subject   || '';
        document.getElementById('sa-tplBodyHtml').value = tpl.body_html || '';

        const vars = tpl.variables || [];
        document.getElementById('sa-tplVarsChips').innerHTML = vars.length
          ? vars.map(v =>
              `<button class="tpl-var-chip" type="button" onclick="saInsertarVariable('${v}')" title="Insertar {{${v}}}">${v}</button>`
            ).join('')
          : '<span style="font-size:12px;color:var(--c-text-3)">Sin variables definidas</span>';

        saActualizarPreview();
      } catch(e) {
        document.getElementById('sa-tplEditorTitle').textContent = 'Error al cargar plantilla';
        document.getElementById('sa-tplMsg').textContent = 'Error: ' + e.message;
        document.getElementById('sa-tplMsg').className = 'crear-msg err';
      }
    }

    function saInsertarVariable(varName) {
      const ta    = document.getElementById('sa-tplBodyHtml');
      const texto = `{{${varName}}}`;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      ta.value = ta.value.slice(0, start) + texto + ta.value.slice(end);
      ta.selectionStart = ta.selectionEnd = start + texto.length;
      ta.focus();
      saActualizarPreview();
    }

    function saActualizarPreview() {
      const html  = document.getElementById('sa-tplBodyHtml').value;
      const frame = document.getElementById('sa-tplPreviewFrame');
      frame.srcdoc = html || '<p style="color:#aaa;padding:16px;font-family:sans-serif">El HTML del email aparecerá aquí.</p>';
    }

    async function saGuardarTemplate() {
      if (!_sa_tplSlugActivo) return;
      const btn  = document.getElementById('sa-btnTplSave');
      const msg  = document.getElementById('sa-tplMsg');
      const subj = document.getElementById('sa-tplSubject').value.trim();
      const html = document.getElementById('sa-tplBodyHtml').value;

      if (!subj) {
        msg.textContent = 'El asunto no puede estar vacío.';
        msg.className   = 'crear-msg err';
        return;
      }

      btn.disabled = true; btn.textContent = 'Guardando...'; msg.textContent = '';
      try {
        await apiFetch(`/email/templates/${_sa_tplSlugActivo}`, {
          method: 'PUT',
          body:   { subject: subj, body_html: html },
        });
        msg.textContent = '✓ Plantilla guardada correctamente.';
        msg.className   = 'crear-msg ok';
        mostrarToast('Plantilla guardada');
        await saCargarPlantillas();
        document.querySelectorAll('.tpl-card').forEach(c => c.classList.remove('active'));
        const c = document.getElementById(`sa-tpl-card-${_sa_tplSlugActivo}`);
        if (c) c.classList.add('active');
      } catch(e) {
        msg.textContent = 'Error al guardar: ' + e.message;
        msg.className   = 'crear-msg err';
      } finally {
        btn.disabled = false; btn.textContent = 'Guardar cambios';
      }
    }

    async function saTestearTemplate() {
      if (!_sa_tplSlugActivo) return;
      const correo = (_perfil && _perfil.email)
        ? _perfil.email
        : prompt('¿A qué correo enviar la prueba?');
      if (!correo) return;
      const btn = document.getElementById('sa-btnTplTest');
      const msg = document.getElementById('sa-tplMsg');
      btn.disabled = true; btn.textContent = 'Enviando...'; msg.textContent = '';
      try {
        await apiFetch('/email/test', { method: 'POST', body: { slug: _sa_tplSlugActivo, to: correo } });
        msg.textContent = `✓ Email de prueba enviado a ${correo}.`;
        msg.className   = 'crear-msg ok';
      } catch(e) {
        msg.textContent = 'Error al enviar prueba: ' + e.message;
        msg.className   = 'crear-msg err';
      } finally {
        btn.disabled = false; btn.textContent = 'Enviar prueba';
      }
    }
