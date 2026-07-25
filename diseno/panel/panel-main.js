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

      // Retorno desde Stripe checkout de planes
      const params = new URLSearchParams(window.location.search);
      const payment = params.get('payment');
      if (payment === 'success' || payment === 'extra_ok') {
        const msg = payment === 'extra_ok'
          ? '✓ Créditos extra añadidos a tu cuenta.'
          : '✓ ¡Suscripción activada! Ya puedes gestionar instructores.';
        setTimeout(() => mostrarToast(msg), 800);
        // Limpiar query param sin recargar
        const clean = window.location.pathname + window.location.hash;
        window.history.replaceState({}, '', clean);
      }
      // Abrir pestaña Mi Plan si viene de pagos
      if (window._admPlanOpenOnLoad && typeof admShowTab === 'function') {
        setTimeout(() => admShowTab('mi-plan'), 600);
        if (window._admPlanSuccessMsg) setTimeout(() => mostrarToast(window._admPlanSuccessMsg), 1000);
      }
    }

    init();
