    // ══════════════════════════════════════════════════════════════
    // ── MÓDULO ADMIN ──────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════

    var _adm_todosUsuarios        = [];
    var _adm_misCursosLoaded      = false;
    var _adm_perfilTabLoaded      = false;
    var _adm_transferirPlaneacionId = null;
    var _contactoAdmin            = {};
    var _adm_tabsLoaded = { resumen: true, 'mis-cursos': false, usuarios: false, 'mi-perfil': false, branding: false };

    async function admInit() {
      document.getElementById('adm-btnGenerarCodigo')
        ?.addEventListener('click', admGenerarCodigo);
      await Promise.all([admCargarStats(), admCargarUsuarios(), admCargarCodigos()]);
      const faltantes = typeof _camposFaltantesPerfil === 'function' ? _camposFaltantesPerfil(_perfil) : [];
      if (faltantes.length) {
        typeof renderCardPI === 'function' && renderCardPI(
          document.getElementById('adm-panel-resumen'), _perfil, () => admShowTab('mi-perfil')
        );
      }
    }

    function admShowTab(name) {
      document.querySelectorAll('#rp-admin .role-tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('#rp-admin .role-tab-btn').forEach(b => b.classList.remove('active'));
      const panel = document.getElementById('adm-panel-' + name);
      const btn   = document.getElementById('adm-tab-'   + name);
      if (panel) panel.classList.add('active');
      if (btn)   btn.classList.add('active');

      if (name === 'mis-cursos' && !_adm_tabsLoaded['mis-cursos']) {
        _adm_tabsLoaded['mis-cursos'] = true;
        admCargarMisCursos();
      }
      if (name === 'mi-perfil' && !_adm_tabsLoaded['mi-perfil']) {
        _adm_tabsLoaded['mi-perfil'] = true;
        const container = document.getElementById('adm-perfilFormContainer');
        if (typeof _htmlPerfilForm === 'function') {
          container.innerHTML = _htmlPerfilForm(_perfil);
          if (_perfil.curp) typeof validarCurpInput === 'function' && validarCurpInput();
        }
      }
      if (name === 'branding' && !_adm_tabsLoaded['branding']) {
        _adm_tabsLoaded['branding'] = true;
        const container = document.getElementById('adm-brandingContainer');
        if (container && typeof _htmlBrandingPanel === 'function') {
          container.innerHTML = _htmlBrandingPanel(_perfil);
        }
      }
    }

    function admShowInnerTab(name) {
      document.querySelectorAll('#adm-panel-usuarios .inner-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('#adm-panel-usuarios .inner-tab-btn').forEach(b => b.classList.remove('active'));
      const panel = document.getElementById('adm-ipanel-' + name);
      const btn   = document.getElementById('adm-itab-'   + name);
      if (panel) panel.classList.add('active');
      if (btn)   btn.classList.add('active');
    }

    async function admCargarStats() {
      const esSA = _perfil.rol === 'super_admin';
      const [resUsr, resCod, resMisCursos, resCreds] = await Promise.all([
        _supabase.from('profiles').select('id').eq('admin_id', _perfil.id),
        _supabase.from('access_codes').select('id').eq('admin_id', _perfil.id)
          .is('used_at', null).gt('expires_at', new Date().toISOString()),
        _supabase.from('planeaciones').select('id', { count: 'exact', head: true }).eq('user_id', _perfil.id),
        esSA ? Promise.resolve({ data: { credits: Infinity } })
             : _supabase.from('profiles').select('credits').eq('id', _perfil.id).single(),
      ]);

      const totalUsuarios  = resUsr.data?.length ?? 0;
      const codigosActivos = resCod.data?.length ?? 0;
      const creditos       = esSA ? Infinity : (resCreds.data?.credits ?? _perfil.credits ?? 0);
      const misCursos      = resMisCursos.count ?? 0;

      document.getElementById('adm-statUsuarios').textContent  = totalUsuarios;
      document.getElementById('adm-statCreditos').textContent  = esSA ? '∞' : creditos;
      document.getElementById('adm-statCodigos').textContent   = codigosActivos;
      document.getElementById('adm-statMisCursos').textContent = misCursos;

      if (resUsr.data?.length) {
        const ids = resUsr.data.map(u => u.id);
        const { count: cursosAlumnos } = await _supabase
          .from('planeaciones').select('id', { count: 'exact', head: true }).in('user_id', ids);
        document.getElementById('adm-statCursosAlumnos').textContent = cursosAlumnos ?? 0;
      } else {
        document.getElementById('adm-statCursosAlumnos').textContent = 0;
      }

      if (!esSA && creditos <= 2) document.getElementById('adm-creditAlert').classList.add('visible');
      _adm_actualizarEstadoBtnCodigo(creditos, codigosActivos);
    }

    async function admCargarUsuarios() {
      const lista = document.getElementById('adm-listaUsuarios');
      lista.innerHTML = '<p class="loading-txt">Cargando usuarios...</p>';
      const { data: usuarios, error } = await _supabase
        .from('profiles')
        .select('id, nombre, apellido, email, telefono, activo, created_at, vigencia_hasta')
        .eq('admin_id', _perfil.id)
        .order('created_at', { ascending: false });

      if (error) { lista.innerHTML = '<p class="error-txt">Error al cargar usuarios.</p>'; return; }

      if (!usuarios?.length) {
        lista.innerHTML = `<div class="empty-state">
          <div class="empty-state-icon">👤</div>
          <h3>Aún no tienes usuarios registrados</h3>
          <p>Genera un código de acceso y compártelo con tu usuario para que active su cuenta.</p>
          <button class="btn-primary" onclick="admShowInnerTab('codigos')">🔑 Ir a Códigos de acceso</button>
        </div>`;
        _adm_todosUsuarios = [];
        const ct = document.getElementById('adm-countUsuarios');
        if (ct) ct.textContent = '';
        return;
      }

      const ids = usuarios.map(u => u.id);
      const { data: planes } = await _supabase
        .from('planeaciones').select('user_id, status').in('user_id', ids);
      const planCount = {};
      planes?.forEach(p => { planCount[p.user_id] = (planCount[p.user_id] || 0) + 1; });

      _adm_todosUsuarios = usuarios.map(u => ({ ...u, planCount: planCount[u.id] || 0 }));
      admRenderTablaUsuarios(_adm_todosUsuarios);
    }

    function admFiltrarUsuarios(q) {
      if (!q.trim()) { admRenderTablaUsuarios(_adm_todosUsuarios); return; }
      const lq = q.toLowerCase();
      admRenderTablaUsuarios(_adm_todosUsuarios.filter(u =>
        ([u.nombre, u.apellido].filter(Boolean).join(' ')).toLowerCase().includes(lq) ||
        u.email.toLowerCase().includes(lq)
      ));
    }

    function admRenderTablaUsuarios(usuarios) {
      const ct = document.getElementById('adm-countUsuarios');
      if (ct) ct.textContent = `(${usuarios.length})`;
      const lista = document.getElementById('adm-listaUsuarios');
      if (!usuarios.length) {
        lista.innerHTML = '<p class="empty-txt">No hay usuarios que coincidan con la búsqueda.</p>';
        return;
      }
      _contactoAdmin = {};
      lista.innerHTML = `<div class="table-wrap"><table class="data-table">
        <thead><tr><th>Usuario</th><th>Email</th><th>Planeaciones</th><th>Estado</th><th>Vigencia</th><th>Registrado</th><th>Acciones</th></tr></thead>
        <tbody>${usuarios.map(u => {
          const ini     = ((u.nombre?.[0] || '') + (u.apellido?.[0] || '')).toUpperCase() || 'U';
          const nombre  = [u.nombre, u.apellido].filter(Boolean).join(' ') || '(Sin nombre)';
          const fecha   = new Date(u.created_at).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
          const nomEsc  = nombre.replace(/'/g, "\\'");
          _contactoAdmin[u.id] = { nombre, email: u.email, tel: u.telefono || '' };
          return `<tr id="adm-urow-${u.id}">
            <td><div style="display:flex;align-items:center;gap:10px">
              <div class="user-avatar">${ini}</div>
              <span style="font-weight:600;color:var(--c-text)">${nombre}</span>
            </div></td>
            <td style="color:var(--c-text-3)">${u.email}</td>
            <td style="text-align:center">
              ${u.planCount > 0
                ? `<button class="btn-sm" onclick="admAbrirModalUserCursos('${u.id}','${nomEsc}')">${u.planCount} curso${u.planCount !== 1 ? 's' : ''}</button>`
                : `<span style="color:var(--c-text-4);font-size:12px">0</span>`}
            </td>
            <td><span class="status-badge ${u.activo ? 'badge-activo' : 'badge-inactivo'}" id="adm-badge-${u.id}">${u.activo ? 'Activo' : 'Inactivo'}</span></td>
            <td>${_adm_vigenciaBadge(u.vigencia_hasta)}</td>
            <td style="color:var(--c-text-4);font-size:12px">${fecha}</td>
            <td><div style="display:flex;gap:5px;flex-wrap:wrap">
              <button class="btn-sm" onclick="abrirFichaContacto('${u.id}','admin')">Contacto</button>
              <button class="btn-sm ${u.activo ? '' : 'success'}" id="adm-toggle-${u.id}"
                onclick="admToggleUsuario('${u.id}',${u.activo})">${u.activo ? 'Desactivar' : 'Activar'}</button>
              <button class="btn-sm danger" id="adm-del-${u.id}"
                onclick="admEliminarUsuario('${u.id}','${nomEsc}')">Eliminar</button>
            </div></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>`;
    }

    function _adm_vigenciaBadge(vigencia_hasta) {
      if (!vigencia_hasta) return '<span style="font-size:11px;color:var(--c-text-4)">—</span>';
      const dias  = Math.ceil((new Date(vigencia_hasta) - new Date()) / 86400000);
      const fecha = new Date(vigencia_hasta).toLocaleDateString('es-MX', { day:'2-digit', month:'short' });
      if (dias < 0)   return `<div style="font-size:11px;font-weight:700;color:#991b1b">Expirado<br><span style="font-weight:400">${fecha}</span></div>`;
      if (dias <= 15) return `<div style="font-size:11px;font-weight:700;color:#92400e">${dias}d restantes<br><span style="font-weight:400">${fecha}</span></div>`;
      return `<div style="font-size:11px;color:var(--c-text-2)">${dias}d<br><span style="color:var(--c-text-4)">${fecha}</span></div>`;
    }

    async function admToggleUsuario(userId, estaActivo) {
      const btn   = document.getElementById('adm-toggle-' + userId);
      const badge = document.getElementById('adm-badge-'  + userId);
      btn.disabled = true;
      const nuevo = !estaActivo;
      const { error } = await _supabase.from('profiles')
        .update({ activo: nuevo }).eq('id', userId).eq('admin_id', _perfil.id);
      if (error) { alert('Error al actualizar el usuario.'); btn.disabled = false; return; }
      badge.textContent = nuevo ? 'Activo' : 'Inactivo';
      badge.className   = `status-badge ${nuevo ? 'badge-activo' : 'badge-inactivo'}`;
      btn.textContent   = nuevo ? 'Desactivar' : 'Activar';
      btn.className     = `btn-sm ${nuevo ? '' : 'success'}`;
      btn.onclick       = () => admToggleUsuario(userId, nuevo);
      btn.disabled      = false;
      const u = _adm_todosUsuarios.find(x => x.id === userId);
      if (u) u.activo = nuevo;
    }

    async function admEliminarUsuario(userId, nombre) {
      if (!confirm(`¿Eliminar a ${nombre}? Se restaurará 1 crédito a tu cuenta. Esta acción no se puede deshacer.`)) return;
      const btn = document.getElementById('adm-del-' + userId);
      btn.disabled = true; btn.textContent = '...';
      try {
        const res = await fetch(`${BACKEND_URL}/admin/users/${userId}`, {
          method: 'DELETE', headers: await getAuthHeaders()
        });
        if (!res.ok) { const e = await res.json().catch(()=>({})); throw new Error(e.detail || 'Error al eliminar.'); }
        const row = document.getElementById('adm-urow-' + userId);
        if (row) { row.style.transition = 'opacity 0.3s'; row.style.opacity = '0'; setTimeout(() => row.remove(), 320); }
        mostrarToast('✓ Usuario eliminado. Crédito restaurado.');
        admCargarStats();
      } catch(e) { alert(e.message); btn.disabled = false; btn.textContent = 'Eliminar'; }
    }
