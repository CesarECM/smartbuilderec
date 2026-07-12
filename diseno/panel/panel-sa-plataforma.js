    // ── SA: Plataforma ────────────────────────────────────────────

    var _sa_transferirPlaneacionId = null;

    async function saCargarCursos() {
      const el = document.getElementById('sa-misCursos');
      el.innerHTML = '<p class="loading-txt">Cargando...</p>';

      const { data: misCursos } = await _supabase.from('planeaciones')
        .select('id,nombre_curso,paso_actual,status,updated_at')
        .eq('user_id', _perfil.id).order('updated_at', { ascending: false });

      if (!misCursos?.length) {
        el.innerHTML = '<p class="empty-txt">Aún no tienes planeaciones creadas.<br>Usa el botón "+ Nueva planeación" para comenzar.</p>';
      } else {
        el.innerHTML = `<div class="table-wrap"><table class="data-table">
          <thead><tr><th>Curso</th><th>Progreso</th><th>Estado</th><th>Actualizado</th><th>Acciones</th></tr></thead>
          <tbody>${misCursos.map(p => {
            const pct     = Math.round(((p.paso_actual - 1) / 15) * 100);
            const fecha   = new Date(p.updated_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
            const completa = p.status === 'completa';
            const nom     = (p.nombre_curso || '(Sin título)').replace(/'/g, "\\'");
            return `<tr id="sa-mc-${p.id}">
              <td style="font-weight:600;color:var(--c-text)">${p.nombre_curso || '(Sin título)'}</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="prog-bar-wrap"><div class="prog-bar-fill ${completa ? 'completa' : ''}" style="width:${pct}%"></div></div>
                  <span style="font-size:11px;color:var(--c-text-3)">${pct}%</span>
                </div>
                <div style="font-size:11px;color:var(--c-text-3)">Paso ${p.paso_actual}/16</div>
              </td>
              <td><span class="status-badge ${completa ? 'badge-completa' : 'badge-borrador'}">${completa ? 'Completo' : 'Borrador'}</span></td>
              <td style="color:var(--c-text-3);font-size:12px">${fecha}</td>
              <td><div style="display:flex;gap:6px;flex-wrap:wrap">
                <button class="btn-sm" onclick="window.open('index?planeacion_id=${p.id}','_blank')">Editar wizard</button>
                <button class="btn-sm success" onclick="saAbrirTransferirSA('${p.id}','${nom}')">Transferir</button>
                <button class="btn-sm danger" id="sa-mc-del-${p.id}" onclick="saEliminarMiCursoSA('${p.id}',this)">Eliminar</button>
              </div></td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>`;
      }

      await saCargarCursosPorAdmin();
      await saCargarWizardInstanciasAdmin();
    }

    async function saCargarCursosPorAdmin() {
      const cont = document.getElementById('sa-cursosPorAdmin');
      cont.innerHTML = '<p class="loading-txt">Cargando...</p>';

      const { data: planeaciones, error } = await _supabase.from('planeaciones')
        .select('id,nombre_curso,paso_actual,status,updated_at,user_id,profiles!user_id(id,nombre,apellido,email,admin_id)')
        .neq('user_id', _perfil.id)
        .order('updated_at', { ascending: false }).limit(500);

      if (error || !planeaciones?.length) {
        cont.innerHTML = '<p class="empty-txt">No hay cursos de usuarios registrados aún.</p>';
        return;
      }

      const byAdmin = {};
      planeaciones.forEach(p => {
        const user = p['profiles'] || null;
        const aid  = user?.admin_id || '__sin_admin__';
        if (!byAdmin[aid]) byAdmin[aid] = [];
        byAdmin[aid].push({ ...p, user });
      });

      const adminMap = {};
      _sa_admins.forEach(a => { adminMap[a.id] = [a.nombre, a.apellido].filter(Boolean).join(' ') || a.email; });
      const orden = [..._sa_admins.map(a => a.id), '__sin_admin__'].filter(id => byAdmin[id]);

      cont.innerHTML = orden.map(aid => {
        const plans    = byAdmin[aid];
        const adminNom = aid === '__sin_admin__' ? 'Sin admin asignado' : (adminMap[aid] || aid.substring(0, 8) + '…');
        const nUsr     = new Set(plans.map(p => p.user_id)).size;
        return `<div class="curso-group">
          <div class="curso-group-header" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('open')">
            <div>
              <strong>${adminNom}</strong>
              <span style="font-size:12px;color:var(--c-text-3);margin-left:10px">${nUsr} usuario${nUsr !== 1 ? 's' : ''} · ${plans.length} curso${plans.length !== 1 ? 's' : ''}</span>
            </div>
            <span class="arrow">▾</span>
          </div>
          <div class="curso-group-body">
            <div class="table-wrap" style="border-radius:0;border:none">
              <table class="data-table">
                <thead><tr><th>Usuario</th><th>Curso</th><th>Progreso</th><th>Estado</th><th>Actualizado</th><th>Acciones</th></tr></thead>
                <tbody>${plans.map(p => {
                  const u       = p['profiles'];
                  const uNom    = u ? [u.nombre, u.apellido].filter(Boolean).join(' ') || u.email : '—';
                  const pct     = Math.round(((p.paso_actual - 1) / 15) * 100);
                  const completa = p.status === 'completa';
                  const fecha   = new Date(p.updated_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
                  return `<tr>
                    <td>${uNom}</td>
                    <td style="font-weight:600;color:var(--c-text)">${p.nombre_curso || '(Sin título)'}</td>
                    <td>
                      <div style="display:flex;align-items:center;gap:6px">
                        <div class="prog-bar-wrap"><div class="prog-bar-fill ${completa ? 'completa' : ''}" style="width:${pct}%"></div></div>
                        <span style="font-size:11px;color:var(--c-text-3)">${pct}%</span>
                      </div>
                    </td>
                    <td><span class="status-badge ${completa ? 'badge-completa' : 'badge-borrador'}">${completa ? 'Completo' : 'Borrador'}</span></td>
                    <td style="color:var(--c-text-3);font-size:12px">${fecha}</td>
                    <td><button class="btn-sm" onclick="window.open('index?planeacion_id=${p.id}','_blank')">Editar wizard</button></td>
                  </tr>`;
                }).join('')}</tbody>
              </table>
            </div>
          </div>
        </div>`;
      }).join('') || '<p class="empty-txt">No hay cursos de usuarios aún.</p>';
    }

    async function saCargarWizardInstanciasAdmin() {
      const cont = document.getElementById('sa-wizardInstanciasAdmin');
      cont.innerHTML = '<p class="loading-txt">Cargando...</p>';

      const { data, error } = await _supabase.from('wizard_instancias')
        .select('id,norma_id,nombre,status,paso_actual,updated_at,user_id,profiles!user_id(id,nombre,apellido,email)')
        .order('updated_at', { ascending: false }).limit(500);

      if (error || !data?.length) {
        cont.innerHTML = '<p class="empty-txt">No hay instancias de wizard registradas aún.</p>';
        return;
      }

      const byUser = {};
      data.forEach(inst => {
        const uid = inst.user_id;
        if (!byUser[uid]) byUser[uid] = { perfil: inst['profiles'], instancias: [] };
        byUser[uid].instancias.push(inst);
      });

      cont.innerHTML = Object.values(byUser).map(({ perfil, instancias }) => {
        const uNom   = perfil ? [perfil.nombre, perfil.apellido].filter(Boolean).join(' ') || perfil.email : '—';
        const uEmail = perfil?.email || '';
        return `<div class="curso-group">
          <div class="curso-group-header" onclick="this.classList.toggle('open');this.nextElementSibling.classList.toggle('open')">
            <div>
              <strong>${uNom}</strong>
              <span style="font-size:11px;color:var(--c-text-3);margin-left:8px">${uEmail}</span>
              <span style="font-size:12px;color:var(--c-text-3);margin-left:10px">${instancias.length} instancia${instancias.length !== 1 ? 's' : ''}</span>
            </div>
            <span class="arrow">▾</span>
          </div>
          <div class="curso-group-body">
            <div class="table-wrap" style="border-radius:0;border:none">
              <table class="data-table">
                <thead><tr><th>Norma</th><th>Nombre</th><th>Estado</th><th>Actualizado</th><th>Acciones</th></tr></thead>
                <tbody>${instancias.map(inst => {
                  const completa = inst.status === 'completa';
                  const fecha = new Date(inst.updated_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
                  return `<tr>
                    <td style="font-weight:700;text-transform:uppercase;font-size:12px">${inst.norma_id}</td>
                    <td style="font-weight:600;color:var(--c-text)">${inst.nombre || '(Sin título)'}</td>
                    <td><span class="status-badge ${completa ? 'badge-completa' : 'badge-borrador'}">${completa ? 'Completa' : 'Borrador'}</span></td>
                    <td style="color:var(--c-text-3);font-size:12px">${fecha}</td>
                    <td><button class="btn-sm" onclick="window.open('wizard-engine?norma=${inst.norma_id}&instancia=${inst.id}','_blank')">Ver wizard</button></td>
                  </tr>`;
                }).join('')}</tbody>
              </table>
            </div>
          </div>
        </div>`;
      }).join('') || '<p class="empty-txt">No hay instancias wizard aún.</p>';
    }

    async function saEliminarMiCursoSA(planeacionId, btn) {
      if (!confirm('¿Eliminar esta planeación? Esta acción no se puede deshacer.')) return;
      btn.disabled = true; btn.textContent = '...';
      const { error } = await _supabase.from('planeaciones')
        .delete().eq('id', planeacionId).eq('user_id', _perfil.id);
      if (error) { alert('Error al eliminar: ' + error.message); btn.disabled = false; btn.textContent = 'Eliminar'; return; }
      document.getElementById('sa-mc-' + planeacionId)?.remove();
      mostrarToast('Planeación eliminada.');
    }

    async function saAbrirTransferirSA(planeacionId, nombreCurso) {
      _sa_transferirPlaneacionId = planeacionId;
      document.getElementById('sa-tranCursoNombre').textContent = `"${nombreCurso}"`;
      document.getElementById('sa-tranMsg').textContent = '';
      const btn = document.getElementById('sa-btnConfirmarTransferirSA');
      btn.disabled = false; btn.textContent = 'Transferir';
      const select = document.getElementById('sa-selectAlumnoSA');
      select.innerHTML = '<option value="">Cargando participantes...</option>';
      document.getElementById('sa-modalTransferirSA').classList.add('open');

      const { data: usuarios, error } = await _supabase.from('profiles')
        .select('id,nombre,apellido,email').eq('rol', 'user').eq('activo', true).order('nombre');
      select.innerHTML = '<option value="">— Selecciona un participante —</option>';
      if (error || !usuarios?.length) {
        select.innerHTML = '<option value="">No hay participantes activos</option>'; return;
      }
      usuarios.forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = `${[u.nombre, u.apellido].filter(Boolean).join(' ') || u.email} (${u.email})`;
        select.appendChild(opt);
      });
    }

    async function saConfirmarTransferirSA() {
      const alumnoId = document.getElementById('sa-selectAlumnoSA').value;
      const msg      = document.getElementById('sa-tranMsg');
      const btn      = document.getElementById('sa-btnConfirmarTransferirSA');
      if (!alumnoId) { msg.textContent = 'Selecciona un participante.'; msg.className = 'crear-msg error'; return; }
      btn.disabled = true; btn.textContent = 'Transfiriendo...'; msg.textContent = '';
      const { error } = await _supabase.rpc('transferir_planeacion', {
        p_planeacion_id: _sa_transferirPlaneacionId,
        p_alumno_id: alumnoId,
      });
      btn.disabled = false; btn.textContent = 'Transferir';
      if (error) { msg.textContent = error.message; msg.className = 'crear-msg error'; return; }
      saCerrarModalTransferirSA();
      mostrarToast('Planeación transferida correctamente.');
      document.getElementById(`sa-mc-${_sa_transferirPlaneacionId}`)?.remove();
    }

    function saCerrarModalTransferirSA(e) {
      if (!e || e.target === document.getElementById('sa-modalTransferirSA'))
        document.getElementById('sa-modalTransferirSA').classList.remove('open');
    }

    // ── SA: Audit log ─────────────────────────────────────────────

    const SA_AUDIT_LABELS = {
      user_created:         { label: 'Usuario creado',         cls: 'audit-created' },
      user_deleted:         { label: 'Usuario eliminado',      cls: 'audit-deleted' },
      user_activated:       { label: 'Usuario activado',       cls: 'audit-activated' },
      user_deactivated:     { label: 'Usuario desactivado',    cls: 'audit-deactivated' },
      credits_updated:      { label: 'Créditos editados',      cls: 'audit-credits' },
      role_changed:         { label: 'Rol cambiado',           cls: 'audit-role' },
      user_creation_failed: { label: 'Error al crear usuario', cls: 'audit-deleted' },
    };

    function saFormatAuditDate(iso) {
      const d = new Date(iso);
      return d.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
           + ' ' + d.toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit' });
    }

    function saFormatAuditDetails(action, details) {
      if (!details || !Object.keys(details).length) return '—';
      if (action === 'credits_updated') return `${details.old_credits} → ${details.new_credits}`;
      if (action === 'role_changed')    return `${details.old_rol} → ${details.new_rol}`;
      if (action === 'user_created' && details.rol) return `rol: ${details.rol}`;
      return '—';
    }

    async function saCargarAuditLog() {
      const cont = document.getElementById('sa-auditContent');
      cont.innerHTML = '<p class="loading-txt">Cargando historial...</p>';
      const { data, error } = await _supabase.from('audit_logs')
        .select('id,created_at,actor_email,action,target_email,details')
        .order('created_at', { ascending: false }).limit(50);
      if (error) { cont.innerHTML = `<p class="error-txt">Error: ${error.message}</p>`; return; }
      if (!data?.length) { cont.innerHTML = '<p class="empty-txt">No hay eventos registrados aún.</p>'; return; }
      cont.innerHTML = `<div class="table-wrap"><table class="data-table">
        <thead><tr><th>Fecha</th><th>Actor</th><th>Acción</th><th>Usuario afectado</th><th>Detalle</th></tr></thead>
        <tbody>${data.map(e => {
          const meta = SA_AUDIT_LABELS[e.action] || { label: e.action, cls: '' };
          return `<tr>
            <td style="white-space:nowrap;font-size:12px">${saFormatAuditDate(e.created_at)}</td>
            <td><span class="audit-email-chip">${e.actor_email || 'sistema'}</span></td>
            <td><span class="audit-action ${meta.cls}">${meta.label}</span></td>
            <td><span class="audit-email-chip">${e.target_email || '—'}</span></td>
            <td style="font-size:12px;color:var(--c-text-3)">${saFormatAuditDetails(e.action, e.details)}</td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>`;
    }
