    // ══════════════════════════════════════════════════════════════
    // PANEL ALUMNO — Normas extras EC0091 / EC0616 / EC1375
    // Muestra secciones solo si el usuario tiene la norma habilitada.
    // ══════════════════════════════════════════════════════════════

    async function cargarPanelNormasExtras() {
      const tiene91   = _extraRoles.includes('norma_ec0091');
      const tiene616  = _extraRoles.includes('norma_ec0616');
      const tiene616t = _extraRoles.includes('norma_ec0616_tutor');
      const tiene1375 = _extraRoles.includes('norma_ec1375');

      const sec91   = document.getElementById('alumno-ec0091-section');
      const sec616  = document.getElementById('alumno-ec0616-section');
      const sec616t = document.getElementById('alumno-ec0616t-section');
      const sec1375 = document.getElementById('alumno-ec1375-section');
      if (sec91)   sec91.style.display   = tiene91   ? '' : 'none';
      if (sec616)  sec616.style.display  = tiene616  ? '' : 'none';
      if (sec616t) sec616t.style.display = tiene616t ? '' : 'none';
      if (sec1375) sec1375.style.display = tiene1375 ? '' : 'none';

      await Promise.all([
        tiene91   ? _cargarEC0091()        : Promise.resolve(),
        tiene616  ? _cargarEC0616()        : Promise.resolve(),
        tiene616t ? _cargarEC0616Tutor()   : Promise.resolve(),
        tiene1375 ? _cargarEC1375()        : Promise.resolve(),
        _cargarGCECandidato(),
      ]);
    }

    // ── GCE — portafolio del candidato ───────────────────────────

    const _GCE_ESTADOS = {
      registro:      { label: 'Registro',       color: '#94a3b8' },
      diagnostico:   { label: 'Diagnóstico',    color: '#60a5fa' },
      plan_acordado: { label: 'Plan acordado',  color: '#fbbf24' },
      evidencias:    { label: 'Evidencias',     color: '#fb923c' },
      juicio:        { label: 'Juicio',         color: '#a78bfa' },
      cierre:        { label: 'Cierre',         color: '#2dd4bf' },
      certificado:   { label: 'Certificado',    color: '#4ade80' },
    };

    async function _cargarGCECandidato() {
      const { data, error } = await _supabase
        .from('procesos_evaluacion')
        .select('id, estado, juicio, created_at, estandares_competencia(codigo, titulo)')
        .eq('candidato_id', _perfil.id)
        .order('created_at', { ascending: false });

      const sec = document.getElementById('alumno-gce-section');
      const el  = document.getElementById('alumno-gce-lista');
      if (!data?.length) return;  // oculto si no hay procesos

      if (sec) sec.style.display = '';
      const ct = document.getElementById('alumno-gce-ec');
      if (ct && data.length) ct.textContent = data[0].estandares_competencia?.codigo || 'GCE';

      if (error || !data.length) {
        if (el) el.innerHTML = '<p class="empty-txt">Sin procesos de evaluación registrados.</p>';
        return;
      }

      if (el) el.innerHTML = data.map(p => {
        const ec  = p.estandares_competencia || {};
        const est = _GCE_ESTADOS[p.estado] || { label: p.estado, color: '#94a3b8' };
        const jui = p.juicio === 'C' ? ' · <b style="color:#065f46">COMPETENTE</b>'
                  : p.juicio === 'TNC' ? ' · <b style="color:#b91c1c">TODAVÍA NO COMPETENTE</b>' : '';
        return `<div class="alm-plan-card">
          <div class="alm-plan-top">
            <div class="alm-plan-info">
              <div class="alm-plan-title">${ec.codigo || '—'} — ${ec.titulo || 'Portafolio de Evidencias'}</div>
              <div class="alm-plan-meta">
                <span style="display:inline-block;padding:2px 8px;border-radius:12px;font-size:10px;font-weight:700;color:#fff;background:${est.color}">${est.label}</span>${jui}
              </div>
            </div>
            <div class="alm-plan-actions">
              <a href="gce?proceso_id=${p.id}" class="btn-primary" style="text-decoration:none">Continuar portafolio →</a>
            </div>
          </div>
        </div>`;
      }).join('');
    }

    // ── EC0091 ───────────────────────────────────────────────────

    async function _cargarEC0091() {
      const el = document.getElementById('alumno-ec0091-lista');
      if (!el) return;
      const { data, error } = await _supabase
        .from('ec0091_datos')
        .select('id,nombre_verificacion,updated_at,credito_canjeado')
        .eq('user_id', _perfil.id)
        .order('updated_at', { ascending: false });

      if (error || !data?.length) {
        el.innerHTML = `<div style="text-align:center;padding:32px;background:var(--c-surface);border:2px dashed var(--c-border);border-radius:var(--r-xl)">
          <div style="font-size:36px;margin-bottom:10px">🔬</div>
          <h3 style="font-size:15px;font-weight:700;margin-bottom:6px">Sin verificaciones aún</h3>
          <p style="font-size:13px;color:var(--c-text-3);margin-bottom:14px">Crea tu primera verificación EC0091.</p>
          <a href="ec0091?new=1" class="btn-primary">+ Crear primera verificación</a>
        </div>`;
        return;
      }

      el.innerHTML = data.map(v => {
        const titulo  = v.nombre_verificacion || '(Sin título)';
        const tiempo  = _tiempoRel(v.updated_at);
        const tituloE = titulo.replace(/'/g, "\\'");
        return `<div class="alm-plan-card">
          <div class="alm-plan-top">
            <div class="alm-plan-info">
              <div class="alm-plan-title">${titulo}</div>
              <div class="alm-plan-meta">Editado ${tiempo}${v.credito_canjeado ? ' · ✓ Canjeado' : ''}</div>
            </div>
            <div class="alm-plan-actions">
              <a href="ec0091?ec0091_id=${v.id}" class="btn-sm">Continuar</a>
              <button id="ec0091-btn-dl-${v.id}" class="btn-sm success"
                onclick="alumnoDescargarEC0091('${v.id}','${tituloE}')">⬇ Descargar</button>
              <button class="btn-sm danger"
                onclick="alumnoEliminarEC0091('${v.id}','${tituloE}')">🗑</button>
            </div>
          </div>
        </div>`;
      }).join('');
    }

    async function alumnoDescargarEC0091(registroId, nombre) {
      const btn = document.getElementById('ec0091-btn-dl-' + registroId);
      if (btn) { btn.disabled = true; btn.textContent = 'Generando…'; }
      try {
        const { data: row, error } = await _supabase
          .from('ec0091_datos').select('datos').eq('id', registroId).single();
        if (error || !row?.datos) throw new Error('No se pudieron obtener los datos.');

        const payload = { ...row.datos, registro_id: registroId };
        const headers = await getAuthHeaders();
        headers['Content-Type'] = 'application/json';
        const res = await fetch(BACKEND_URL + '/ec0091/generate-doc',
          { method: 'POST', headers, body: JSON.stringify(payload) });

        if (res.status === 402) throw new Error('El administrador no tiene créditos disponibles.');
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Error ${res.status}`); }

        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = `Verificacion_${(nombre || 'EC0091').replace(/\s+/g, '_')}.zip`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        mostrarToast('Verificación descargada.');
        await _cargarEC0091();
      } catch (e) {
        mostrarToast(e.message || 'Error al descargar.');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '⬇ Descargar'; }
      }
    }

    async function alumnoEliminarEC0091(id, nombre) {
      if (!confirm(`¿Eliminar "${nombre}"?\nEsta acción no se puede deshacer.`)) return;
      const { error } = await _supabase.from('ec0091_datos')
        .delete().eq('id', id).eq('user_id', _perfil.id);
      if (error) { mostrarToast('Error al eliminar.'); return; }
      mostrarToast('Verificación eliminada.');
      await _cargarEC0091();
    }

    // ── EC0616 ───────────────────────────────────────────────────

    async function _cargarEC0616() {
      const el = document.getElementById('alumno-ec0616-lista');
      if (!el) return;
      const { data, error } = await _supabase
        .from('ec0616_datos')
        .select('id,nombre_candidato,updated_at,credito_canjeado')
        .eq('user_id', _perfil.id)
        .order('updated_at', { ascending: false });

      if (error || !data?.length) {
        el.innerHTML = `<div style="text-align:center;padding:32px;background:var(--c-surface);border:2px dashed var(--c-border);border-radius:var(--r-xl)">
          <div style="font-size:36px;margin-bottom:10px">🏥</div>
          <h3 style="font-size:15px;font-weight:700;margin-bottom:6px">Sin portafolios aún</h3>
          <p style="font-size:13px;color:var(--c-text-3);margin-bottom:14px">Crea tu primer portafolio EC0616.</p>
          <a href="ec0616?new=1" class="btn-primary">+ Crear primer portafolio</a>
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
              <div class="alm-plan-meta">Editado ${tiempo}${v.credito_canjeado ? ' · ✓ Canjeado' : ''}</div>
            </div>
            <div class="alm-plan-actions">
              <a href="ec0616?ec0616_id=${v.id}" class="btn-sm">Continuar</a>
              <button id="ec0616-btn-dl-${v.id}" class="btn-sm success"
                onclick="alumnoDescargarEC0616('${v.id}','${tituloE}')">⬇ Descargar</button>
              <button class="btn-sm danger"
                onclick="alumnoEliminarEC0616('${v.id}','${tituloE}')">🗑</button>
            </div>
          </div>
        </div>`;
      }).join('');
    }

    async function alumnoDescargarEC0616(registroId, nombre) {
      const btn = document.getElementById('ec0616-btn-dl-' + registroId);
      if (btn) { btn.disabled = true; btn.textContent = 'Generando…'; }
      try {
        const { data: row, error } = await _supabase
          .from('ec0616_datos').select('datos').eq('id', registroId).single();
        if (error || !row?.datos) throw new Error('No se pudieron obtener los datos.');

        const payload = { ...row.datos, registro_id: registroId };
        const headers = await getAuthHeaders();
        headers['Content-Type'] = 'application/json';
        const res = await fetch(BACKEND_URL + '/ec0616/generate-doc',
          { method: 'POST', headers, body: JSON.stringify(payload) });

        if (res.status === 402) throw new Error('El administrador no tiene créditos disponibles.');
        if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || `Error ${res.status}`); }

        const blob = await res.blob();
        const url  = URL.createObjectURL(blob);
        const a    = document.createElement('a');
        a.href = url; a.download = `Portafolio_${(nombre || 'EC0616').replace(/\s+/g, '_')}.zip`;
        document.body.appendChild(a); a.click(); document.body.removeChild(a);
        URL.revokeObjectURL(url);
        mostrarToast('Portafolio descargado.');
        await _cargarEC0616();
      } catch (e) {
        mostrarToast(e.message || 'Error al descargar.');
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '⬇ Descargar'; }
      }
    }

    async function alumnoEliminarEC0616(id, nombre) {
      if (!confirm(`¿Eliminar "${nombre}"?\nEsta acción no se puede deshacer.`)) return;
      const { error } = await _supabase.from('ec0616_datos')
        .delete().eq('id', id).eq('user_id', _perfil.id);
      if (error) { mostrarToast('Error al eliminar.'); return; }
      mostrarToast('Portafolio eliminado.');
      await _cargarEC0616();
    }
