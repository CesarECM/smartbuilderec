    // ══════════════════════════════════════════════════════════════
    // PANEL ALUMNO — Portafolio Tutor EC0616 (Modo Tutor)
    // Se carga desde panel.html. Solo visible con norma_ec0616_tutor.
    // ══════════════════════════════════════════════════════════════

    async function _cargarEC0616Tutor() {
      const el = document.getElementById('alumno-ec0616t-lista');
      if (!el) return;

      const { data, error } = await _supabase
        .from('ec0616_tutor_datos')
        .select('id,nombre_candidato,updated_at,credito_canjeado')
        .eq('user_id', _perfil.id)
        .order('updated_at', { ascending: false });

      if (error || !data?.length) {
        el.innerHTML = `
          <div style="text-align:center;padding:32px;background:var(--c-surface);
                      border:2px dashed var(--c-border);border-radius:var(--r-xl)">
            <div style="font-size:36px;margin-bottom:10px">🗂️</div>
            <h3 style="font-size:15px;font-weight:700;margin-bottom:6px">Sin portafolios PE aún</h3>
            <p style="font-size:13px;color:var(--c-text-3);margin-bottom:14px">
              Crea el portafolio de evidencias completo en una sola sesión.
            </p>
            <a href="ec0616-tutor?new=1" class="btn-primary">+ Nuevo portafolio tutor</a>
          </div>`;
        return;
      }

      el.innerHTML = data.map(v => {
        const titulo  = v.nombre_candidato || '(Sin nombre)';
        const tiempo  = _tiempoRel(v.updated_at);
        const tituloE = titulo.replace(/'/g, "\\'");
        return `<div class="alm-plan-card">
          <div class="alm-plan-top">
            <div class="alm-plan-info">
              <div class="alm-plan-title">${titulo}</div>
              <div class="alm-plan-meta">
                Editado ${tiempo}${v.credito_canjeado ? ' · ✓ Canjeado' : ''}
              </div>
            </div>
            <div class="alm-plan-actions">
              <a href="ec0616-tutor?ec0616t_id=${v.id}" class="btn-sm">Continuar</a>
              <button id="ec0616t-btn-dl-${v.id}" class="btn-sm success"
                onclick="alumnoDescargarEC0616Tutor('${v.id}','${tituloE}')">⬇ Descargar PE</button>
              <button class="btn-sm danger"
                onclick="alumnoEliminarEC0616Tutor('${v.id}','${tituloE}')">🗑</button>
            </div>
          </div>
        </div>`;
      }).join('');
    }

    async function alumnoDescargarEC0616Tutor(registroId, nombre) {
      const btn = document.getElementById('ec0616t-btn-dl-' + registroId);
      if (btn) { btn.disabled = true; btn.textContent = 'Generando…'; }
      try {
        const { data: row, error } = await _supabase
          .from('ec0616_tutor_datos')
          .select('datos')
          .eq('id', registroId)
          .single();
        if (error || !row?.datos) throw new Error('No se pudieron obtener los datos.');

        const payload = { ...row.datos, registro_id: registroId };
        const headers = await getAuthHeaders();
        headers['Content-Type'] = 'application/json';

        const res = await fetch(BACKEND_URL + '/ec0616-tutor/generate-doc', {
          method: 'POST', headers, body: JSON.stringify(payload),
        });

        if (res.status === 402) throw new Error('El administrador no tiene créditos disponibles.');
        if (!res.ok) {
          const e = await res.json().catch(() => ({}));
          throw new Error(e.detail || `Error ${res.status}`);
        }

        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url;
        a.download = `PE_EC0616_${(nombre || 'Candidato').replace(/\s+/g, '_')}.zip`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        mostrarToast('Portafolio de evidencias descargado.');
        await _cargarEC0616Tutor();
      } catch (e) {
        mostrarToast(e.message || 'Error al descargar.');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '⬇ Descargar PE'; }
      }
    }

    async function alumnoEliminarEC0616Tutor(id, nombre) {
      if (!confirm(`¿Eliminar portafolio de "${nombre}"?\nEsta acción no se puede deshacer.`)) return;
      const { error } = await _supabase
        .from('ec0616_tutor_datos')
        .delete()
        .eq('id', id)
        .eq('user_id', _perfil.id);
      if (error) { mostrarToast('Error al eliminar.'); return; }
      mostrarToast('Portafolio eliminado.');
      await _cargarEC0616Tutor();
    }
