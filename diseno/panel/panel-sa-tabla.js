    // ── SA: Gestión de roles ──────────────────────────────────────

    var _sa_unified_all    = [];
    var _sa_extraMap       = {};
    var _sa_planMap        = {};
    var _sa_promoverUserId = null;

    const _SA_ALL_ROLES = [
      { id: 'alumno',    label: '🎓 Alumno',    locked: true  },
      { id: 'asesor',    label: '🤝 Asesor',    locked: false },
      { id: 'evaluador', label: '📋 Evaluador', locked: false },
      { id: 'admin',     label: '👑 Admin',     locked: false },
      // super_admin excluido — no asignable desde UI
    ];

    // ── SA: Tabla unificada ───────────────────────────────────────

    async function saCargarTablaUnificada() {
      const lista = document.getElementById('sa-listaUnificada');
      if (lista) lista.innerHTML = '<p class="loading-txt">Cargando...</p>';

      const [profRes, extraRes] = await Promise.all([
        _supabase.from('profiles')
          .select('id,nombre,apellido,email,telefono,activo,rol,credits,vigencia_hasta,admin_id,created_at,profiles!admin_id(nombre,apellido,email)')
          .neq('id', _perfil.id)
          .order('nombre', { ascending: true })
          .limit(500),
        _supabase.from('user_roles').select('user_id,role'),
      ]);

      let perfiles = [];
      if (profRes.error) {
        const { data: simple } = await _supabase.from('profiles')
          .select('id,nombre,apellido,email,telefono,activo,rol,credits,vigencia_hasta,admin_id,created_at')
          .neq('id', _perfil.id).order('nombre', { ascending: true }).limit(500);
        perfiles = (simple || []).map(u => ({ ...u, adminNombre: '' }));
      } else {
        perfiles = (profRes.data || []).map(u => {
          const a = u['profiles'] || null;
          return { ...u, adminNombre: a ? ([a.nombre, a.apellido].filter(Boolean).join(' ') || a.email) : '' };
        });
      }

      _sa_extraMap = {};
      (extraRes.data || []).forEach(r => {
        if (!_sa_extraMap[r.user_id]) _sa_extraMap[r.user_id] = new Set();
        _sa_extraMap[r.user_id].add(r.role);
      });

      _sa_unified_all = perfiles;
      _sa_admins = perfiles.filter(u => u.rol === 'admin');

      // Cargar planeaciones de todos los alumnos en paralelo con la tabla
      _sa_planMap = {};
      const _userIds = perfiles.filter(u => u.rol === 'user').map(u => u.id);
      if (_userIds.length) {
        const { data: planes } = await _supabase
          .from('planeaciones')
          .select('id,user_id,nombre_curso,paso_actual,status,updated_at')
          .in('user_id', _userIds)
          .order('updated_at', { ascending: false });
        (planes || []).forEach(p => {
          if (!_sa_planMap[p.user_id]) _sa_planMap[p.user_id] = [];
          _sa_planMap[p.user_id].push(p);
        });
      }

      saPopulateAdminSelects();
      saRenderTablaUnificada(_sa_unified_all);
    }

    function saFiltrarUnificada(q) {
      if (!q.trim()) { saRenderTablaUnificada(_sa_unified_all); return; }
      const lq = q.toLowerCase();
      saRenderTablaUnificada(_sa_unified_all.filter(u =>
        ([u.nombre, u.apellido].filter(Boolean).join(' ')).toLowerCase().includes(lq) ||
        u.email.toLowerCase().includes(lq)
      ));
    }

    function _sa_getUserRoles(u) {
      const set = new Set(['alumno']);
      if (_sa_extraMap[u.id]?.has('asesor'))    set.add('asesor');
      if (_sa_extraMap[u.id]?.has('evaluador')) set.add('evaluador');
      if (u.rol === 'admin' || u.rol === 'super_admin') set.add('admin');
      return set;
    }

    function _buildMenuItems(u, nombre) {
      const id  = u.id;
      const ns  = nombre.replace(/'/g, "\\'");
      const vig = u.vigencia_hasta || '';
      if (u.rol === 'admin') {
        return `
          <button onclick="saToggleMenuFila(event,'${id}');saVerDetalleAdmin('${id}')">📋 Ver detalle</button>
          <button onclick="saToggleMenuFila(event,'${id}');saAbrirModalRenovar('${id}','${ns}',${u.credits??0},'${vig}')">💳 Créditos &amp; vigencia</button>
          <button onclick="saToggleMenuFila(event,'${id}');saResetPassword('${u.email}','${ns}')">🔑 Reset contraseña</button>
          <hr>
          <button onclick="saToggleMenuFila(event,'${id}');saToggleAdmin('${id}',${u.activo})">${u.activo ? '⏸ Desactivar' : '▶ Activar'}</button>
          <button onclick="saToggleMenuFila(event,'${id}');saConfirmarDegradaAdmin('${id}','${ns}')">⬇️ Degradar a usuario</button>
          <button class="danger" onclick="saToggleMenuFila(event,'${id}');saEliminarAdmin('${id}','${ns}',0)">🗑 Eliminar</button>`;
      } else {
        return `
          <button onclick="saToggleMenuFila(event,'${id}');saVerDetalleAlumno('${id}')">📋 Ver detalle</button>
          <button onclick="saToggleMenuFila(event,'${id}');saResetPassword('${u.email}','${ns}')">🔑 Reset contraseña</button>
          <button onclick="saToggleMenuFila(event,'${id}');saAbrirEditVigenciaUser('${id}','${ns}','${vig}')">📅 Vigencia</button>
          <button onclick="saToggleMenuFila(event,'${id}');saAbrirReasignar('${id}','${ns}','${u.admin_id||''}')">🔄 Reasignar admin</button>
          <hr>
          <button onclick="saToggleMenuFila(event,'${id}');saToggleUsuarioSA('${id}',${u.activo})">${u.activo ? '⏸ Desactivar' : '▶ Activar'}</button>
          <button class="danger" onclick="saToggleMenuFila(event,'${id}');saAbrirEliminarUsuario('${id}','${ns}')">🗑 Eliminar</button>`;
      }
    }

    function saToggleMenuFila(evt, userId) {
      evt.stopPropagation();
      const menu = document.getElementById('sa-menu-' + userId);
      if (!menu) return;
      const isOpen = menu.classList.contains('open');
      document.querySelectorAll('.row-dropdown.open').forEach(m => {
        m.classList.remove('open');
        m.style.cssText = '';
      });
      if (!isOpen) {
        // position:fixed escapa el overflow:hidden del table-wrap
        const btn  = evt.target.closest('button') || evt.target;
        const rect = btn.getBoundingClientRect();
        menu.style.cssText = `position:fixed;top:${rect.bottom + 4}px;right:${window.innerWidth - rect.right}px;left:auto;z-index:9999`;
        menu.classList.add('open');
      }
    }

    document.addEventListener('click', function() {
      document.querySelectorAll('.row-dropdown.open').forEach(m => {
        m.classList.remove('open');
        m.style.cssText = '';
      });
    });
    document.addEventListener('scroll', function() {
      document.querySelectorAll('.row-dropdown.open').forEach(m => {
        m.classList.remove('open');
        m.style.cssText = '';
      });
    }, true);

    function saRenderTablaUnificada(usuarios) {
      const ct = document.getElementById('sa-countUnificado');
      if (ct) ct.textContent = `${usuarios.length} usuario${usuarios.length !== 1 ? 's' : ''}`;
      const lista = document.getElementById('sa-listaUnificada');
      if (!lista) return;
      if (!usuarios.length) { lista.innerHTML = '<p class="empty-txt">No hay usuarios que coincidan.</p>'; return; }
      lista.innerHTML = `<div class="table-wrap"><table class="data-table">
        <thead><tr>
          <th>Usuario</th>
          <th>Roles</th>
          <th>Avance</th>
          <th>Estado</th>
          <th style="width:44px"></th>
        </tr></thead>
        <tbody>${usuarios.map(u => {
          const nombre = [u.nombre, u.apellido].filter(Boolean).join(' ') || '(Sin nombre)';
          const ini    = ((u.nombre?.[0]||'')+(u.apellido?.[0]||'')).toUpperCase() || '?';
          _contactoSA[u.id] = { nombre, email: u.email, tel: u.telefono || '' };
          const rolesActivos = _sa_getUserRoles(u);
          const chips = _SA_ALL_ROLES.map(r => {
            const on  = rolesActivos.has(r.id);
            const cls = r.locked ? 'rchip locked' : (on ? 'rchip on' : 'rchip off');
            const oc  = r.locked ? '' : `onclick="saToggleRol('${u.id}','${u.rol}','${r.id}',${on})"`;
            const tip = r.locked ? 'Rol base — siempre activo' : (on ? 'Clic para desactivar' : 'Clic para activar');
            return `<span class="${cls}" data-role="${r.id}" ${oc} title="${tip}">${r.label}</span>`;
          }).join('');
          const avatarStyle = u.rol === 'admin'
            ? 'background:#fef3c7;color:#92400e'
            : 'background:#ede9fe;color:#5b21b6;font-size:13px';
          const credLine  = u.rol === 'admin'
            ? `<div style="font-size:11px;color:var(--c-text-3);margin-top:3px" id="sa-credline-${u.id}">💳 <span id="sa-creditDisplay-${u.id}">${u.credits??0}</span> créditos</div>`
            : '';
          const adminLine = u.rol !== 'admin' && u.adminNombre
            ? `<div style="font-size:11px;color:var(--c-text-3);margin-top:1px">👑 ${u.adminNombre}</div>`
            : '';
          const vigBadge  = u.rol === 'admin'
            ? `<span style="margin-left:4px">${renderVigenciaBadge(u.vigencia_hasta, u.activo)}</span>`
            : '';

          // ── Columna Avance ──────────────────────────────────────
          let avanceCell;
          if (u.rol !== 'user') {
            avanceCell = `<td style="color:var(--c-text-3);font-size:12px;text-align:center">—</td>`;
          } else {
            const planes    = _sa_planMap[u.id] || [];
            if (!planes.length) {
              avanceCell = `<td style="color:var(--c-text-3);font-size:12px">Sin cursos</td>`;
            } else {
              const activas   = planes.filter(p => p.status !== 'completa').length;
              const completas = planes.filter(p => p.status === 'completa').length;
              const rec       = planes[0];
              const paso      = rec.paso_actual || 1;
              const pct       = Math.min(100, Math.round(((paso - 1) / 15) * 100));
              const completa  = rec.status === 'completa';
              const titulo    = rec.nombre_curso || '';
              const tituloCorto = titulo.length > 26 ? titulo.slice(0, 26) + '…' : titulo;
              avanceCell = `<td style="min-width:160px">
                <div style="font-size:11px;font-weight:700;margin-bottom:3px">
                  ${activas   > 0 ? `<span style="color:var(--c-blue-600)">${activas} activa${activas!==1?'s':''}</span>` : ''}
                  ${activas > 0 && completas > 0 ? `<span style="color:var(--c-text-3)"> · </span>` : ''}
                  ${completas > 0 ? `<span style="color:#059669">${completas} completa${completas!==1?'s':''}</span>` : ''}
                </div>
                ${tituloCorto ? `<div style="font-size:11px;color:var(--c-text-3);margin-bottom:4px;white-space:nowrap">${tituloCorto}</div>` : ''}
                <div style="display:flex;align-items:center;gap:6px">
                  <div class="sa-plan-bar" style="width:72px"><div class="sa-plan-bar-fill${completa?' completa':''}" style="width:${pct}%"></div></div>
                  <span style="font-size:11px;color:var(--c-text-3);white-space:nowrap">Paso ${paso}/16</span>
                </div>
              </td>`;
            }
          }

          return `<tr id="sa-urow-${u.id}">
            <td>
              <div style="display:flex;align-items:center;gap:10px">
                <div class="admin-avatar" style="${avatarStyle}">${ini}</div>
                <div>
                  <div style="font-weight:600;color:var(--c-text)">${nombre}</div>
                  <div style="font-size:12px;color:var(--c-text-3)">${u.email}${u.telefono ? ' · ' + u.telefono : ''}</div>
                  ${adminLine}
                </div>
              </div>
            </td>
            <td><div class="role-chips" id="sa-chips-${u.id}">${chips}</div></td>
            ${avanceCell}
            <td>
              <div style="display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                <span class="status-badge ${u.activo ? 'badge-activo' : 'badge-inactivo'}" id="sa-ubadge-${u.id}">${u.activo ? 'Activo' : 'Inactivo'}</span>
                ${vigBadge}
              </div>
              ${credLine}
            </td>
            <td>
              <div class="row-dropdown-wrap">
                <button class="row-menu-btn" onclick="saToggleMenuFila(event,'${u.id}')">⋮</button>
                <div class="row-dropdown" id="sa-menu-${u.id}">
                  ${_buildMenuItems(u, nombre)}
                </div>
              </div>
            </td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>`;
    }

