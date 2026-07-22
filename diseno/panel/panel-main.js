    // ── Init ─────────────────────────────────────────────────────
    async function init() {
      const session = await authGuard();
      if (!session) return;

      _perfil = await getUserProfile();
      if (!_perfil) { window.location.href = 'login'; return; }

      if (typeof inyectarBranding === 'function') inyectarBranding(_perfil);

      const nom = [_perfil.nombre, _perfil.apellido].filter(Boolean).join(' ') || _perfil.email;
      document.getElementById('headerNombre').textContent = nom;

      const { data: erData } = await _supabase.from('user_roles').select('role').eq('user_id', _perfil.id);
      _extraRoles = (erData || []).map(r => r.role);

      _rolesDisp = determinarRoles(_perfil, _extraRoles);
      renderRoleSwitcher(_rolesDisp);

      const guardado   = localStorage.getItem('sbe_active_role');
      const rolesIds   = _rolesDisp.map(r => r.id);
      const rolDefecto = (guardado && rolesIds.includes(guardado))
        ? guardado
        : rolesIds[rolesIds.length - 1];

      switchRol(rolDefecto);
    }

    init();
