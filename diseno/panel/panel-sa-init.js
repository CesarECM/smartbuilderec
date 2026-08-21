    // ── MÓDULO SUPER ADMIN ────────────────────────────────────────

    var _sa_admins          = [];
    var _sa_reasignarUserId = null;
    var _sa_renovarAdminId  = null;
    var _sa_tabsLoaded = {
      resumen: true, usuarios: false,
      plataforma: false, config: false, soporte: false, logs: false, 'mi-plan': false, 'mi-perfil': false
    };
    var _sa_vigenciaLoaded = false;
    var _sa_tplSlugActivo  = null;

    function saInit() {
      Promise.all([saCargarStats(), saCargarTablaUnificada()]);
      const faltantes = typeof _camposFaltantesPerfil === 'function' ? _camposFaltantesPerfil(_perfil) : [];
      if (faltantes.length) {
        typeof renderCardPI === 'function' && renderCardPI(document.getElementById('sa-panel-resumen'), _perfil, () => saShowTab('mi-perfil'));
      }
      setTimeout(verificarIntegraciones, 800);
    }

    function saShowTab(name) {
      document.querySelectorAll('#rp-super_admin .role-tab-panel').forEach(p => p.classList.remove('active'));
      document.querySelectorAll('#rp-super_admin .role-tab-btn').forEach(b => b.classList.remove('active'));
      const panel = document.getElementById('sa-panel-' + name);
      const btn   = document.getElementById('sa-tab-'   + name);
      if (panel) panel.classList.add('active');
      if (btn)   btn.classList.add('active');
      if (name === 'usuarios'  && !_sa_tabsLoaded.usuarios)  { _sa_tabsLoaded.usuarios  = true; saCargarTablaUnificada(); }
      if (name === 'plataforma'&& !_sa_tabsLoaded.plataforma){ _sa_tabsLoaded.plataforma = true; saCargarCursos(); saCargarAuditLog(); }
      if (name === 'config'    && !_sa_tabsLoaded.config)    { _sa_tabsLoaded.config    = true; saCargarPlantillas(); }
      if (name === 'soporte'   && !_sa_tabsLoaded.soporte)   { _sa_tabsLoaded.soporte   = true; saCargarKB(); }
      if (name === 'logs'      && !_sa_tabsLoaded.logs)      { _sa_tabsLoaded.logs      = true; saCargarLogs(); }
      if (name === 'mi-plan' && !_sa_tabsLoaded['mi-plan']) {
        _sa_tabsLoaded['mi-plan'] = true;
        _saPoblarPlanSelect();
        typeof admPlanInit === 'function' && admPlanInit();
      }
      if (name === 'mi-perfil' && !_sa_tabsLoaded['mi-perfil']) {
        _sa_tabsLoaded['mi-perfil'] = true;
        const saPerfilContainer = document.getElementById('sa-perfilFormContainer');
        if (saPerfilContainer && typeof _htmlPerfilForm === 'function') {
          saPerfilContainer.innerHTML = _htmlPerfilForm(_perfil);
          if (_perfil.curp) typeof validarCurpInput === 'function' && validarCurpInput();
        }
      }
    }

    function saPlanVerComo(userId) {
      typeof admPlanInit === 'function' && admPlanInit(userId);
    }

    function _saPoblarPlanSelect() {
      const sel = document.getElementById('sa-plan-user-select');
      if (!sel || sel.dataset.poblado) return;
      if (!_sa_admins.length) { setTimeout(_saPoblarPlanSelect, 400); return; }
      _sa_admins.forEach(a => {
        const opt = document.createElement('option');
        opt.value = a.id;
        opt.textContent = `${[a.nombre, a.apellido].filter(Boolean).join(' ')} (${a.email})`;
        sel.appendChild(opt);
      });
      sel.dataset.poblado = '1';
    }

    function saToggleVigenciaSection() {
      const section = document.getElementById('sa-vigenciaSection');
      const body    = document.getElementById('sa-vigenciaInnerBody');
      section.classList.toggle('open');
      if (section.classList.contains('open') && !_sa_vigenciaLoaded) {
        _sa_vigenciaLoaded = true;
        saCargarVigencia();
      }
    }

    async function saCargarStats() {
      const [rAdmins, rUsuarios, rPlan, rCreditos] = await Promise.all([
        _supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('rol', 'admin'),
        _supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('rol', 'user'),
        _supabase.from('planeaciones').select('id', { count: 'exact', head: true }),
        _supabase.from('profiles').select('credits').eq('rol', 'admin'),
      ]);
      const totalCreditos = (rCreditos.data || []).reduce((s, a) => s + (a.credits || 0), 0);
      document.getElementById('sa-statAdmins').textContent       = rAdmins.count   ?? '—';
      document.getElementById('sa-statUsuarios').textContent     = rUsuarios.count ?? '—';
      document.getElementById('sa-statPlaneaciones').textContent = rPlan.count     ?? '—';
      document.getElementById('sa-statCreditos').textContent     = totalCreditos;
    }

    function saPopulateAdminSelects() {
      const options = _sa_admins.map(a =>
        `<option value="${a.id}">${[a.nombre,a.apellido].filter(Boolean).join(' ')||a.email}</option>`
      ).join('');
      const selReasignar = document.getElementById('sa-selectAdminReasignar');
      const selCrear     = document.getElementById('sa-saAdminId');
      if (selReasignar) selReasignar.innerHTML = `<option value="">Sin admin</option>${options}`;
      if (selCrear)     selCrear.innerHTML     = `<option value="">Sin admin (usuario independiente)</option>${options}`;
    }

    function renderVigenciaBadge(vigencia_hasta, activo) {
      if (!activo) return '<span class="vigencia-badge vb-rojo">Inactivo</span>';
      if (!vigencia_hasta) return '<span class="vigencia-badge vb-amarillo">Sin fecha</span>';
      const dias = _diasVigencia(vigencia_hasta);
      const cls  = _claseVigencia(vigencia_hasta, activo);
      const label = dias < 0 ? 'Expirado' : dias === 0 ? 'Hoy' : `${dias}d`;
      return `<span class="vigencia-badge ${cls}">${label}</span>`;
    }

    function _diasVigencia(vigencia_hasta) {
      if (!vigencia_hasta) return null;
      const hoy = new Date(); hoy.setHours(0,0,0,0);
      const fin  = new Date(vigencia_hasta + 'T00:00:00');
      return Math.round((fin - hoy) / 86400000);
    }

    function _claseVigencia(vigencia_hasta, activo) {
      if (!activo) return 'vb-rojo';
      const dias = _diasVigencia(vigencia_hasta);
      if (dias === null || dias < 0) return 'vb-rojo';
      if (dias <= 15)  return 'vb-amarillo';
      return 'vb-verde';
    }

    async function saToggleAdmin(adminId, estaActivo) {
      const nuevo = !estaActivo;
      const { error } = await _supabase.from('profiles').update({ activo: nuevo }).eq('id', adminId);
      if (error) { alert('Error: ' + error.message); return; }
      const badge = document.getElementById('sa-ubadge-' + adminId);
      if (badge) {
        badge.textContent = nuevo ? 'Activo' : 'Inactivo';
        badge.className   = `status-badge ${nuevo ? 'badge-activo' : 'badge-inactivo'}`;
      }
      const u = _sa_unified_all.find(x => x.id === adminId);
      if (u) {
        u.activo = nuevo;
        const nom  = [u.nombre, u.apellido].filter(Boolean).join(' ') || '(Sin nombre)';
        const menu = document.getElementById('sa-menu-' + adminId);
        if (menu) menu.innerHTML = _buildMenuItems(u, nom);
      }
      mostrarToast(nuevo ? 'Admin activado' : 'Admin desactivado');
    }

    async function saEliminarAdmin(adminId, nombre, nUsuarios) {
      const usersCount = nUsuarios || _sa_unified_all.filter(u => u.admin_id === adminId).length;
      if (usersCount > 0) {
        alert(`No puedes eliminar a "${nombre}" porque tiene ${usersCount} usuario${usersCount !== 1 ? 's' : ''} asignado${usersCount !== 1 ? 's' : ''}.\nReasígnalos o elimínalos primero.`);
        return;
      }
      if (!confirm(`¿Eliminar al admin "${nombre}"?\nEsta acción es permanente y no se puede deshacer.`)) return;
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${BACKEND_URL}/admin/users/${adminId}`, { method: 'DELETE', headers });
        if (!res.ok) { const d = await res.json().catch(() => {}); throw new Error(d?.detail || 'Error al eliminar.'); }
        document.getElementById(`sa-urow-${adminId}`)?.remove();
        _sa_unified_all = _sa_unified_all.filter(u => u.id !== adminId);
        _sa_admins = _sa_admins.filter(a => a.id !== adminId);
        saPopulateAdminSelects();
        const ct = document.getElementById('sa-countUnificado');
        if (ct) ct.textContent = `${_sa_unified_all.length} usuario${_sa_unified_all.length !== 1 ? 's' : ''}`;
        mostrarToast('Admin eliminado');
        await saCargarStats();
      } catch(e) {
        alert(e.message);
      }
    }

    function saEditarCreditos(adminId, creditosActuales) {
      const display = document.getElementById('sa-creditDisplay-' + adminId);
      if (display.tagName === 'INPUT') return;
      const input = document.createElement('input');
      input.type = 'number'; input.min = '0'; input.max = '9999';
      input.value = creditosActuales; input.className = 'credits-input';
      const btnG = document.createElement('button'); btnG.textContent = 'Guardar'; btnG.className = 'btn-sm'; btnG.style.cssText = 'background:#059669;color:white;border-color:#059669';
      const btnC = document.createElement('button'); btnC.textContent = 'Cancelar'; btnC.className = 'btn-sm';
      display.replaceWith(input);
      const wrap = input.nextElementSibling;
      wrap?.insertAdjacentElement('afterend', btnC);
      wrap?.insertAdjacentElement('afterend', btnG);
      input.focus(); input.select();
      async function guardar() {
        const nuevos = parseInt(input.value, 10);
        if (isNaN(nuevos) || nuevos < 0 || nuevos > 9999) { alert('Ingresa un número entre 0 y 9999.'); return; }
        btnG.disabled = true;
        const { error } = await _supabase.from('profiles').update({ credits: nuevos }).eq('id', adminId);
        if (error) { alert('Error: ' + error.message); btnG.disabled = false; return; }
        const span = document.createElement('span'); span.className = 'credits-display';
        span.id = 'sa-creditDisplay-' + adminId; span.textContent = nuevos;
        input.replaceWith(span); btnG.remove(); btnC.remove();
        mostrarToast('Créditos actualizados a ' + nuevos);
        await saCargarStats();
      }
      btnG.onclick = guardar;
      btnC.onclick = () => {
        const span = document.createElement('span'); span.className = 'credits-display';
        span.id = 'sa-creditDisplay-' + adminId; span.textContent = creditosActuales;
        input.replaceWith(span); btnG.remove(); btnC.remove();
      };
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter')  { e.preventDefault(); guardar(); }
        if (e.key === 'Escape') { e.preventDefault(); btnC.onclick(); }
      });
    }

    async function saVerDetalleAdmin(adminId) {
      const admin = _sa_admins.find(a => a.id === adminId);
      if (!admin) return;
      const nombre = [admin.nombre, admin.apellido].filter(Boolean).join(' ') || admin.email;
      const body   = document.getElementById('sa-modalDetalleBody');
      body.innerHTML = `<div class="sa-modal-title">👑 ${nombre}</div><div class="sa-modal-subtitle">${admin.email} · ${admin.credits} créditos disponibles</div><p class="loading-txt" style="padding:16px 0">Cargando usuarios...</p>`;
      document.getElementById('sa-modalDetalle').classList.add('open');

      const { data: usuarios } = await _supabase.from('profiles')
        .select('id,nombre,apellido,email,activo').eq('admin_id', adminId).eq('rol', 'user')
        .order('created_at', { ascending: false });
      const ids = (usuarios || []).map(u => u.id);
      const planRes = ids.length
        ? await _supabase.from('planeaciones').select('user_id,status').in('user_id', ids)
        : { data: [] };
      const planCount = {};
      (planRes.data || []).forEach(p => { planCount[p.user_id] = (planCount[p.user_id] || 0) + 1; });
      const totalCursos = (planRes.data || []).length;

      body.innerHTML = `
        <div class="sa-modal-title">👑 ${nombre}</div>
        <div class="sa-modal-subtitle">${admin.email}</div>
        <div style="display:flex;gap:16px;flex-wrap:wrap;margin-bottom:16px">
          <div><span style="font-size:22px;font-weight:800;color:#7c3aed">${(usuarios||[]).length}</span><div style="font-size:11px;color:var(--c-text-3)">Usuarios</div></div>
          <div><span style="font-size:22px;font-weight:800;color:var(--c-blue-600)">${admin.credits}</span><div style="font-size:11px;color:var(--c-text-3)">Créditos disp.</div></div>
          <div><span style="font-size:22px;font-weight:800;color:var(--c-text)">${totalCursos}</span><div style="font-size:11px;color:var(--c-text-3)">Cursos totales</div></div>
        </div>
        <div class="sa-modal-section">
          <h4 style="font-size:13px;font-weight:700;margin-bottom:10px">Usuarios y cursos</h4>
          ${!(usuarios||[]).length
            ? '<p style="color:var(--c-text-3);font-size:13px">Este admin aún no tiene usuarios asignados.</p>'
            : `<div class="table-wrap"><table class="data-table" style="font-size:12px">
                <thead><tr><th>Usuario</th><th>Email</th><th>Cursos</th><th>Estado</th></tr></thead>
                <tbody>${(usuarios||[]).map(u => {
                  const n = [u.nombre,u.apellido].filter(Boolean).join(' ') || '(Sin nombre)';
                  return `<tr><td>${n}</td><td style="color:var(--c-text-3)">${u.email}</td>
                    <td style="text-align:center">${planCount[u.id]||0}</td>
                    <td><span class="status-badge ${u.activo?'badge-activo':'badge-inactivo'}">${u.activo?'Activo':'Inactivo'}</span></td></tr>`;
                }).join('')}</tbody>
              </table></div>`
          }
        </div>`;
    }

    function saCerrarModalDetalle(e) {
      if (!e || e.target === document.getElementById('sa-modalDetalle'))
        document.getElementById('sa-modalDetalle').classList.remove('open');
    }
