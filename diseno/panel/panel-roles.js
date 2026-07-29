    // ── Panel Asesor ──────────────────────────────────────────────
    async function cargarPanelAsesor() {
      const el = document.getElementById('asesor-lista');
      const { data, error } = await _supabase
        .from('asignaciones')
        .select('id, norma_id, created_at, profiles!asignaciones_alumno_id_fkey(nombre, apellido, email), normas(codigo, nombre)')
        .eq('asesor_id', _perfil.id)
        .order('created_at', { ascending: false });

      if (error || !data?.length) {
        el.innerHTML = '<p class="empty-txt">No tienes alumnos asignados para asesorar todavía.</p>';
        return;
      }
      el.innerHTML = _renderAsignadosTable(data);
    }

    // ── Panel Evaluador ───────────────────────────────────────────

    function evShowTab(name) {
      document.querySelectorAll('#rp-evaluador .role-tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('#rp-evaluador .role-tab-btn').forEach(b => b.classList.remove('active'));
      document.getElementById('ev-panel-' + name)?.classList.add('active');
      document.getElementById('ev-tab-'   + name)?.classList.add('active');
      if (name === 'gce') _cargarGCEEvaluador();
    }

    async function _cargarGCEEvaluador() {
      const el = document.getElementById('evaluador-gce-lista');
      if (!el) return;
      const { data, error } = await _supabase
        .from('procesos_evaluacion')
        .select('id, estado, juicio, candidato_id, created_at, estandares_competencia(codigo)')
        .eq('evaluador_id', _perfil.id)
        .order('created_at', { ascending: false });

      if (error || !data?.length) {
        el.innerHTML = '<p class="empty-txt">Sin candidatos GCE asignados aún.</p>'; return;
      }

      const ids = [...new Set(data.map(p => p.candidato_id).filter(Boolean))];
      const byId = {};
      if (ids.length) {
        const { data: profs } = await _supabase
          .from('profiles').select('id,nombre,apellido,email').in('id', ids);
        (profs || []).forEach(p => { byId[p.id] = p; });
      }

      const _GCE_EST = { registro:'#94a3b8',diagnostico:'#60a5fa',plan_acordado:'#fbbf24',
        evidencias:'#fb923c',juicio:'#a78bfa',cierre:'#2dd4bf',certificado:'#4ade80' };
      const _GCE_LBL = { registro:'Registro',diagnostico:'Diagnóstico',plan_acordado:'Plan acordado',
        evidencias:'Evidencias',juicio:'Juicio',cierre:'Cierre',certificado:'Certificado' };

      el.innerHTML = `<div class="table-wrap"><table class="data-table">
        <thead><tr><th>Candidato</th><th>EC</th><th>Estado</th><th></th></tr></thead>
        <tbody>${data.map(p => {
          const cand = byId[p.candidato_id] || {};
          const nom  = [cand.nombre, cand.apellido].filter(Boolean).join(' ') || cand.email || '—';
          const ec   = p.estandares_competencia || {};
          const col  = _GCE_EST[p.estado] || '#94a3b8';
          const lbl  = _GCE_LBL[p.estado] || p.estado;
          return `<tr>
            <td>
              <div style="font-weight:600;color:var(--c-text)">${nom}</div>
              <div style="font-size:11px;color:var(--c-text-3)">${cand.email || ''}</div>
            </td>
            <td><span class="norma-badge" style="font-size:9px">${ec.codigo || '—'}</span></td>
            <td><span style="display:inline-block;padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700;color:#fff;background:${col}">${lbl}</span></td>
            <td><a href="gce?proceso_id=${p.id}" class="btn-primary" style="text-decoration:none;font-size:11px">Ver portafolio →</a></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>`;
    }

    async function cargarPanelEvaluador() {
      const el = document.getElementById('evaluador-lista');
      const { data, error } = await _supabase
        .from('asignaciones')
        .select('id, norma_id, created_at, profiles!asignaciones_alumno_id_fkey(nombre, apellido, email), normas(codigo, nombre)')
        .eq('evaluador_id', _perfil.id)
        .order('created_at', { ascending: false });

      if (error || !data?.length) {
        el.innerHTML = '<p class="empty-txt">No tienes alumnos asignados para evaluar todavía.</p>';
        return;
      }
      el.innerHTML = _renderAsignadosTable(data);
    }

    function _renderAsignadosTable(rows) {
      return `<div class="table-wrap"><table class="data-table">
        <thead><tr><th>Alumno</th><th>Email</th><th>Norma</th><th>Inscrito</th><th>Acciones</th></tr></thead>
        <tbody>${rows.map(a => {
          const p   = a['profiles!asignaciones_alumno_id_fkey'] || a.profiles || {};
          const n   = a.normas || {};
          const nom = [p.nombre, p.apellido].filter(Boolean).join(' ') || '(Sin nombre)';
          const fec = new Date(a.created_at).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
          return `<tr>
            <td style="font-weight:600;color:var(--c-text)">${nom}</td>
            <td style="color:var(--c-text-3)">${p.email || '—'}</td>
            <td><span class="norma-badge" style="font-size:9px">${n.codigo || '—'}</span></td>
            <td style="color:var(--c-text-4);font-size:12px">${fec}</td>
            <td><a href="erp-admin" class="btn-sm">Ver ERP →</a></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>`;
    }
