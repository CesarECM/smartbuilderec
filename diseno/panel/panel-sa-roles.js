    async function saConfirmarDegradaAdmin(adminId, nombre) {
      if (!confirm(`¿Degradar a "${nombre}" de Admin a Usuario? Perderá acceso al panel de administración.`)) return;
      const { error } = await _supabase.from('profiles').update({ rol: 'user' }).eq('id', adminId);
      if (error) { alert('Error: ' + error.message); return; }
      mostrarToast(`${nombre} degradado a Usuario`);
      await Promise.all([saCargarStats(), saCargarTablaUnificada()]);
    }

    async function saToggleRol(userId, rolActualPerfil, role, estaActivo) {
      try {
        // Roles extra (asesor / evaluador / normas) — vía ERP API
        if (['asesor', 'evaluador', 'norma_ec0091', 'norma_ec0616'].includes(role)) {
          if (estaActivo) {
            await apiFetch(`/erp/admin/roles/quitar?user_id=${userId}&role=${role}`, { method: 'DELETE' });
            _sa_extraMap[userId]?.delete(role);
          } else {
            await apiFetch('/erp/admin/roles/asignar', { method: 'POST', body: { user_id: userId, role } });
            if (!_sa_extraMap[userId]) _sa_extraMap[userId] = new Set();
            _sa_extraMap[userId].add(role);
          }
          mostrarToast(estaActivo ? `Rol ${role} eliminado` : `Rol ${role} asignado`);
          const u = _sa_unified_all.find(x => x.id === userId);
          if (u) sa_RefrescarFilaRoles(u);
          return;
        }

        // Admin — degradar o promover (abre modal de créditos)
        if (role === 'admin') {
          if (estaActivo) {
            if (!confirm('¿Quitar rol Admin? El usuario pasará a ser Alumno.')) return;
            const { error } = await _supabase.from('profiles').update({ rol: 'user' }).eq('id', userId);
            if (error) throw new Error(error.message);
            const u = _sa_unified_all.find(x => x.id === userId);
            if (u) { u.rol = 'user'; sa_RefrescarFilaRoles(u); }
            mostrarToast('Rol Admin eliminado');
          } else {
            // Abre modal de promover (reutiliza adm-modalPromover)
            _sa_promoverUserId = userId;
            const u = _sa_unified_all.find(x => x.id === userId);
            const nom = [u?.nombre, u?.apellido].filter(Boolean).join(' ') || u?.email || '';
            document.getElementById('adm-promoverNombreLabel').textContent = nom;
            document.getElementById('adm-promoverMsg').textContent = '';
            document.getElementById('adm-promoverCreditos').value  = '10';
            const hoy = new Date(); hoy.setFullYear(hoy.getFullYear() + 1);
            document.getElementById('adm-promoverVigencia').value  = hoy.toISOString().split('T')[0];
            const btn = document.getElementById('adm-btnConfirmarPromover');
            btn.onclick = sa_ConfirmarPromoverRolAdmin;
            btn.disabled = false; btn.textContent = 'Promover';
            document.getElementById('adm-modalPromover').classList.add('open');
          }
          return;
        }

      } catch(e) {
        alert('Error: ' + e.message);
      }
    }

    async function sa_ConfirmarPromoverRolAdmin() {
      const creditos = parseInt(document.getElementById('adm-promoverCreditos').value, 10) || 0;
      const vigencia = document.getElementById('adm-promoverVigencia').value;
      const msg      = document.getElementById('adm-promoverMsg');
      const btn      = document.getElementById('adm-btnConfirmarPromover');
      if (!vigencia) { msg.textContent = 'Selecciona una fecha de vigencia.'; msg.className = 'form-msg err'; return; }
      btn.disabled = true; btn.textContent = 'Promoviendo...'; msg.textContent = '';
      const { error } = await _supabase.from('profiles')
        .update({ rol: 'admin', credits: creditos, admin_id: null, vigencia_hasta: vigencia })
        .eq('id', _sa_promoverUserId);
      btn.disabled = false; btn.textContent = 'Promover';
      if (error) { msg.textContent = error.message; msg.className = 'form-msg err'; return; }
      const u = _sa_unified_all.find(x => x.id === _sa_promoverUserId);
      if (u) { u.rol = 'admin'; sa_RefrescarFilaRoles(u); }
      admCerrarModalPromover();
      document.getElementById('adm-btnConfirmarPromover').onclick = admConfirmarPromover;
      _sa_promoverUserId = null;
      mostrarToast('Usuario promovido a Admin');
      await Promise.all([saCargarStats(), saCargarTablaUnificada()]);
    }

    function sa_RefrescarFilaRoles(u) {
      const chipsWrap = document.getElementById('sa-chips-' + u.id);
      if (!chipsWrap) return;
      const rolesActivos  = _sa_getUserRoles(u);
      const rolesVisibles = _SA_ALL_ROLES.filter(r => !r.userOnly || u.rol === 'user');
      chipsWrap.innerHTML = rolesVisibles.map(r => {
        const on  = rolesActivos.has(r.id);
        const cls = r.locked ? 'rchip locked' : (on ? 'rchip on' : 'rchip off');
        const oc  = r.locked ? '' : `onclick="saToggleRol('${u.id}','${u.rol}','${r.id}',${on})"`;
        const tip = r.locked ? 'Rol base — siempre activo' : (on ? 'Clic para desactivar' : 'Clic para activar');
        return `<span class="${cls}" data-role="${r.id}" ${oc} title="${tip}">${r.label}</span>`;
      }).join('');
    }
