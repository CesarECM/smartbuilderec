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
