    // ══════════════════════════════════════════════════════════════
    // PANEL ALUMNO — Norma EC1375
    // Servicios auxiliares en contribución tradicional y complementaria.
    // Habilitado por superadmin: user_roles.role = 'norma_ec1375'
    // ══════════════════════════════════════════════════════════════

    async function _cargarEC1375() {
      const el = document.getElementById('alumno-ec1375-lista');
      if (!el) return;
      const { data, error } = await _supabase
        .from('ec1375_datos')
        .select('id,nombre_auxiliar,updated_at,credito_canjeado')
        .eq('user_id', _perfil.id)
        .order('updated_at', { ascending: false });

      if (error || !data?.length) {
        el.innerHTML = `<div style="text-align:center;padding:32px;background:var(--c-surface);border:2px dashed var(--c-border);border-radius:var(--r-xl)">
          <div style="font-size:36px;margin-bottom:10px">🌿</div>
          <h3 style="font-size:15px;font-weight:700;margin-bottom:6px">Sin expedientes aún</h3>
          <p style="font-size:13px;color:var(--c-text-3);margin-bottom:14px">Crea tu primer expediente EC1375.</p>
          <a href="ec1375?new=1" class="btn-primary">+ Crear primer expediente</a>
        </div>`;
        return;
      }

      el.innerHTML = data.map(v => {
        const titulo  = v.nombre_auxiliar || '(Sin nombre)';
        const tiempo  = _tiempoRel(v.updated_at);
        const tituloE = titulo.replace(/'/g, "\\'");
        return `<div class="alm-plan-card">
          <div class="alm-plan-top">
            <div class="alm-plan-info">
              <div class="alm-plan-title">${titulo}</div>
              <div class="alm-plan-meta">Editado ${tiempo}${v.credito_canjeado ? ' · ✓ Canjeado' : ''}</div>
            </div>
            <div class="alm-plan-actions">
              <a href="ec1375?ec1375_id=${v.id}" class="btn-sm">Continuar</a>
              <button id="ec1375-btn-dl-${v.id}" class="btn-sm success"
                onclick="alumnoDescargarEC1375('${v.id}','${tituloE}')">⬇ Descargar</button>
              <button class="btn-sm danger"
                onclick="alumnoEliminarEC1375('${v.id}','${tituloE}')">🗑</button>
            </div>
          </div>
        </div>`;
      }).join('');
    }

    async function alumnoDescargarEC1375(registroId, nombre) {
      const btn = document.getElementById('ec1375-btn-dl-' + registroId);
      if (btn) { btn.disabled = true; btn.textContent = 'Generando…'; }
      try {
        const { data: row, error } = await _supabase
          .from('ec1375_datos').select('datos').eq('id', registroId).single();
        if (error || !row?.datos) throw new Error('No se pudieron obtener los datos.');

        const payload = { ...row.datos, registro_id: registroId };
        const headers = await getAuthHeaders();
        headers['Content-Type'] = 'application/json';
        const res = await fetch(BACKEND_URL + '/ec1375/generate-doc',
          { method: 'POST', headers, body: JSON.stringify(payload) });

        if (res.status === 402) throw new Error('El administrador no tiene créditos disponibles.');
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Error ${res.status}`); }

        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = `Expediente_EC1375_${(nombre || 'EC1375').replace(/\s+/g, '_')}.zip`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        mostrarToast('Expediente EC1375 descargado.');
        await _cargarEC1375();
      } catch (e) {
        mostrarToast(e.message || 'Error al descargar.');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '⬇ Descargar'; }
      }
    }

    async function alumnoEliminarEC1375(id, nombre) {
      if (!confirm(`¿Eliminar "${nombre}"?\nEsta acción no se puede deshacer.`)) return;
      const { error } = await _supabase.from('ec1375_datos')
        .delete().eq('id', id).eq('user_id', _perfil.id);
      if (error) { mostrarToast('Error al eliminar.'); return; }
      mostrarToast('Expediente EC1375 eliminado.');
      await _cargarEC1375();
    }
