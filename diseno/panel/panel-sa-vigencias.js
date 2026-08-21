    // ── SA: detalle de alumno ──────────────────────────────────────

    function saVerDetalleAlumno(userId) {
      const u = _sa_unified_all.find(x => x.id === userId);
      if (!u) return;
      const nombre = [u.nombre, u.apellido].filter(Boolean).join(' ') || '(Sin nombre)';
      const ini    = ((u.nombre?.[0]||'')+(u.apellido?.[0]||'')).toUpperCase() || '?';
      const planes = _sa_planMap[userId] || [];
      const activas   = planes.filter(p => p.status !== 'completa').length;
      const completas = planes.filter(p => p.status === 'completa').length;
      const ns  = nombre.replace(/'/g, "\\'");
      const vig = u.vigencia_hasta || '';

      const adminBadge = u.adminNombre
        ? `<span style="display:inline-block;background:#ede9fe;color:#5b21b6;border:1px solid #c4b5fd;border-radius:6px;font-size:11px;font-weight:700;padding:2px 8px">👑 ${u.adminNombre}</span>`
        : `<span style="display:inline-block;background:var(--c-surface-2);color:var(--c-text-3);border:1px solid var(--c-border);border-radius:6px;font-size:11px;font-weight:600;padding:2px 8px">Sin admin</span>`;

      const planesHtml = !planes.length
        ? `<p style="color:var(--c-text-3);font-size:13px;padding:4px 0">No tiene planeaciones aún.</p>`
        : planes.map(p => {
            const paso     = p.paso_actual || 1;
            const pct      = Math.min(100, Math.round(((paso - 1) / 15) * 100));
            const completa = p.status === 'completa';
            const fecha    = new Date(p.updated_at).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
            const titulo   = p.nombre_curso || '(Sin título)';
            return `
              <div class="sa-alumno-plan-card">
                <div style="flex:1;min-width:0">
                  <div style="font-weight:600;font-size:13px;color:var(--c-text);overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${titulo}</div>
                  <div style="display:flex;align-items:center;gap:8px;margin-top:6px">
                    <div class="sa-plan-bar" style="flex:1;max-width:140px"><div class="sa-plan-bar-fill${completa?' completa':''}" style="width:${pct}%"></div></div>
                    <span style="font-size:11px;color:var(--c-text-3);white-space:nowrap">Paso ${paso}/16 · ${pct}%</span>
                  </div>
                  <div style="margin-top:5px;display:flex;align-items:center;gap:6px;flex-wrap:wrap">
                    <span class="status-badge ${completa?'badge-completa':'badge-borrador'}">${completa?'Completa':'Borrador'}</span>
                    <span style="font-size:11px;color:var(--c-text-4)">Editado ${fecha}</span>
                  </div>
                </div>
                <a href="/index?planeacion_id=${p.id}" target="_blank"
                   style="display:inline-flex;align-items:center;gap:4px;padding:6px 12px;background:var(--c-blue-600);color:#fff;border-radius:var(--r-sm);font-size:12px;font-weight:600;text-decoration:none;white-space:nowrap;flex-shrink:0"
                   title="Abrir wizard de este alumno en nueva pestaña">✏️ Abrir wizard</a>
              </div>`;
          }).join('');

      document.getElementById('sa-modalAlumnoBody').innerHTML = `
        <div style="display:flex;align-items:flex-start;gap:14px;margin-bottom:18px">
          <div class="admin-avatar" style="width:48px;height:48px;font-size:18px;flex-shrink:0">${ini}</div>
          <div style="min-width:0">
            <div style="font-size:17px;font-weight:700;color:var(--c-text);margin-bottom:2px">${nombre}</div>
            <div style="font-size:13px;color:var(--c-text-3);margin-bottom:6px">${u.email}${u.telefono ? ' · ' + u.telefono : ''}</div>
            ${adminBadge}
          </div>
        </div>

        <div class="sa-modal-section">
          <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px">
            <h4 style="font-size:13px;font-weight:700;margin:0">Planeaciones EC0217</h4>
            <div style="font-size:12px;color:var(--c-text-3)">
              <strong style="color:var(--c-blue-600)">${activas}</strong> activa${activas!==1?'s':''} ·
              <strong style="color:#059669">${completas}</strong> completa${completas!==1?'s':''}
            </div>
          </div>
          <div style="display:flex;flex-direction:column;gap:10px">${planesHtml}</div>
        </div>

        <div class="sa-modal-section">
          <h4 style="font-size:13px;font-weight:700;margin:0 0 12px">Acciones</h4>
          <div style="display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn-sm" onclick="saCerrarModalAlumno();saResetPassword('${u.email}','${ns}')">🔑 Reset contraseña</button>
            <button class="btn-sm" onclick="saCerrarModalAlumno();saAbrirReasignar('${userId}','${ns}','${u.admin_id||''}')">🔄 Reasignar admin</button>
            <button class="btn-sm" onclick="saCerrarModalAlumno();saAbrirEditVigenciaUser('${userId}','${ns}','${vig}')">📅 Vigencia</button>
            <button class="btn-sm" onclick="saCerrarModalAlumno();saToggleUsuarioSA('${userId}',${u.activo})">${u.activo?'⏸ Desactivar':'▶ Activar'}</button>
            <button class="btn-sm danger" onclick="saCerrarModalAlumno();saAbrirEliminarUsuario('${userId}','${ns}')">🗑 Eliminar</button>
          </div>
        </div>`;

      document.getElementById('sa-modalAlumno').classList.add('open');
    }

    function saCerrarModalAlumno(e) {
      if (!e || e.target === document.getElementById('sa-modalAlumno'))
        document.getElementById('sa-modalAlumno').classList.remove('open');
    }

    async function saBuscarUsuario() {
      const email    = document.getElementById('sa-buscarEmail').value.trim().toLowerCase();
      const creditos = parseInt(document.getElementById('sa-creditosAsignar').value, 10);
      const vigencia = document.getElementById('sa-vigenciaAsignar').value;
      const res      = document.getElementById('sa-resultadoBusqueda');
      const btn      = document.getElementById('sa-btnBuscar');
      if (!email)   { mostrarToast('Ingresa un correo electrónico'); return; }
      if (isNaN(creditos) || creditos < 0 || creditos > 9999) { mostrarToast('Créditos entre 0 y 9999'); return; }
      if (!vigencia) { mostrarToast('Selecciona una fecha de vigencia'); return; }
      btn.disabled = true; btn.textContent = 'Buscando...';
      res.className = 'resultado-busqueda'; res.textContent = '';
      const { data: usuario, error } = await _supabase.from('profiles')
        .select('id,nombre,apellido,email,rol').eq('email', email).single();
      btn.disabled = false; btn.textContent = 'Buscar';
      res.classList.add('visible');
      if (error || !usuario) { res.classList.add('err'); res.innerHTML = `No se encontró ningún usuario con el correo <strong>${email}</strong>.`; return; }
      if (usuario.rol === 'ce')          { res.classList.add('warn'); res.innerHTML = `<strong>${usuario.nombre||usuario.email}</strong> ya es Centro de Evaluación.`; return; }
      if (usuario.rol === 'super_admin') { res.classList.add('warn'); res.innerHTML = `<strong>${usuario.nombre||usuario.email}</strong> es Super Admin.`; return; }
      const nombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || usuario.email;
      res.classList.add('ok');
      res.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <div><strong>${nombre}</strong> · ${usuario.email}</div>
        <button class="btn-primary" onclick="saPromoverAAdmin('${usuario.id}','${nombre.replace(/'/g,"\\'")}',${creditos})">Promover a CE con ${creditos} créditos</button>
      </div>`;
    }

    async function saPromoverAAdmin(userId, nombre, creditos) {
      const vigencia = document.getElementById('sa-vigenciaAsignar').value;
      if (!vigencia) { mostrarToast('Selecciona una fecha de vigencia'); return; }
      const btn = document.querySelector('#sa-resultadoBusqueda .btn-primary');
      if (btn) btn.disabled = true;
      const { error } = await _supabase.from('profiles')
        .update({ rol: 'ce', credits: creditos, admin_id: null, vigencia_hasta: vigencia })
        .eq('id', userId);
      if (error) { alert('Error al promover: ' + error.message); if (btn) btn.disabled = false; return; }
      const res = document.getElementById('sa-resultadoBusqueda');
      res.className = 'resultado-busqueda visible ok';
      res.innerHTML = `✓ <strong>${nombre}</strong> ahora es Centro de Evaluación con ${creditos} créditos.`;
      document.getElementById('sa-buscarEmail').value    = '';
      document.getElementById('sa-vigenciaAsignar').value = '';
      mostrarToast('CE promovido correctamente');
      _sa_vigenciaLoaded = false;
      await Promise.all([saCargarStats(), saCargarTablaUnificada()]);
    }

    async function saCargarVigencia() {
      const cont = document.getElementById('sa-vigenciaContent');
      cont.innerHTML = '<p class="loading-txt">Cargando...</p>';
      const { data: admins, error } = await _supabase.from('profiles')
        .select('id,nombre,apellido,email,credits,activo,vigencia_hasta')
        .eq('rol', 'ce').order('vigencia_hasta', { ascending: true, nullsFirst: false });
      if (error) { cont.innerHTML = `<p class="error-txt">Error: ${error.message}</p>`; return; }
      if (!admins?.length) { cont.innerHTML = '<p class="empty-txt">No hay CEs registrados.</p>'; return; }

      const rojos     = admins.filter(a => _claseVigencia(a.vigencia_hasta, a.activo) === 'vb-rojo');
      const amarillos = admins.filter(a => _claseVigencia(a.vigencia_hasta, a.activo) === 'vb-amarillo');
      const verdes    = admins.filter(a => _claseVigencia(a.vigencia_hasta, a.activo) === 'vb-verde');
      document.getElementById('sa-semRojo').textContent     = rojos.length;
      document.getElementById('sa-semAmarillo').textContent = amarillos.length;
      document.getElementById('sa-semVerde').textContent    = verdes.length;

      cont.innerHTML = `<div class="table-wrap"><table class="data-table">
        <thead><tr><th>Administrador</th><th>Créditos</th><th>Vigencia</th><th>Estado</th><th>Acciones</th></tr></thead>
        <tbody>${[...rojos, ...amarillos, ...verdes].map(a => {
          const nom = [a.nombre,a.apellido].filter(Boolean).join(' ') || '(Sin nombre)';
          const ini = ((a.nombre?.[0]||'')+(a.apellido?.[0]||'')).toUpperCase() || 'A';
          const credLow = (a.credits||0) <= 3;
          return `<tr>
            <td><div style="display:flex;align-items:center;gap:10px">
              <div class="admin-avatar">${ini}</div>
              <div><div class="admin-nombre">${nom}</div><div class="admin-email">${a.email}</div></div>
            </div></td>
            <td><span class="credits-display" style="${credLow?'color:#dc2626':''}">${a.credits??0}</span>${credLow?'<span style="font-size:11px;color:#dc2626;display:block">⚠️ Bajos</span>':''}</td>
            <td>${renderVigenciaBadge(a.vigencia_hasta, a.activo)}</td>
            <td><span class="status-badge ${a.activo?'badge-activo':'badge-inactivo'}">${a.activo?'Activo':'Inactivo'}</span></td>
            <td><button class="btn-sm" onclick="saAbrirModalRenovar('${a.id}','${nom.replace(/'/g,"\\'")}',${a.credits??0},'${a.vigencia_hasta||''}')">Renovar</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>`;
    }

    async function saEnviarAlertasVigencia() {
      const btn = document.getElementById('sa-btnCheckVigencias');
      btn.disabled = true; btn.textContent = 'Procesando...';
      try {
        const headers = await getAuthHeaders();
        const res  = await fetch(`${BACKEND_URL}/admin/check-vigencias`, { method: 'POST', headers });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Error al procesar.');
        mostrarToast(`Procesados ${data.procesados} admins, ${data.enviados.length} emails enviados`);
        await saCargarVigencia();
      } catch(e) {
        alert('Error: ' + e.message);
      } finally {
        btn.disabled = false; btn.textContent = '📧 Enviar alertas';
      }
    }

    function saAbrirModalRenovar(adminId, nombre, creditos, vigenciaActual) {
      _sa_renovarAdminId = adminId;
      document.getElementById('sa-renovarNombre').textContent   = nombre;
      document.getElementById('sa-renovarCreditos').value       = creditos;
      document.getElementById('sa-renovarVigencia').value       = vigenciaActual || '';
      document.getElementById('sa-renovarMsg').textContent      = '';
      document.getElementById('sa-renovarMsg').className        = 'crear-msg';
      document.getElementById('sa-modalRenovar').classList.add('open');
    }

    async function saConfirmarRenovar() {
      const creditos = parseInt(document.getElementById('sa-renovarCreditos').value, 10);
      const vigencia = document.getElementById('sa-renovarVigencia').value;
      const msg      = document.getElementById('sa-renovarMsg');
      const btn      = document.getElementById('sa-btnConfirmarRenovar');
      if (!vigencia)                    { msg.textContent = 'Selecciona una fecha de vigencia.'; msg.className = 'crear-msg error'; return; }
      if (isNaN(creditos) || creditos < 0) { msg.textContent = 'Ingresa créditos válidos.'; msg.className = 'crear-msg error'; return; }
      btn.disabled = true;
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${BACKEND_URL}/admin/renew-admin`, {
          method: 'PATCH',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ admin_id: _sa_renovarAdminId, credits: creditos, vigencia_hasta: vigencia }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Error al renovar.');
        saCerrarModalRenovar();
        mostrarToast('Admin renovado correctamente');
        _sa_vigenciaLoaded = false;
        await Promise.all([saCargarTablaUnificada(), saCargarVigencia()]);
      } catch(e) {
        msg.textContent = e.message; msg.className = 'crear-msg error';
      } finally {
        btn.disabled = false;
      }
    }

    function saCerrarModalRenovar(e) {
      if (!e || e.target === document.getElementById('sa-modalRenovar')) {
        document.getElementById('sa-modalRenovar').classList.remove('open');
        _sa_renovarAdminId = null;
      }
    }

    function saAbrirModalCrearAdmin() {
      ['sa-caEmail_nombre','sa-caEmail_apellido','sa-caEmail_email','sa-caEmail_vigencia']
        .forEach(id => { document.getElementById(id).value = ''; });
      document.getElementById('sa-caEmail_creditos').value   = '10';
      document.getElementById('sa-crearAdminMsg').textContent = '';
      document.getElementById('sa-crearAdminMsg').className   = 'crear-msg';
      document.getElementById('sa-modalCrearAdmin').classList.add('open');
      document.getElementById('sa-caEmail_nombre').focus();
    }

    async function saConfirmarCrearAdmin() {
      const nombre   = document.getElementById('sa-caEmail_nombre').value.trim();
      const apellido = document.getElementById('sa-caEmail_apellido').value.trim();
      const email    = document.getElementById('sa-caEmail_email').value.trim();
      const creditos = parseInt(document.getElementById('sa-caEmail_creditos').value, 10);
      const vigencia = document.getElementById('sa-caEmail_vigencia').value;
      const msg      = document.getElementById('sa-crearAdminMsg');
      const btn      = document.getElementById('sa-btnConfirmarCrearAdmin');
      if (!nombre || !apellido)              { msg.textContent = 'Ingresa nombre y apellido.';       msg.className = 'crear-msg error'; return; }
      if (!email || !/\S+@\S+\.\S+/.test(email)) { msg.textContent = 'Correo inválido.';            msg.className = 'crear-msg error'; return; }
      if (!vigencia)                         { msg.textContent = 'Selecciona la fecha de vigencia.'; msg.className = 'crear-msg error'; return; }
      if (isNaN(creditos) || creditos < 0)   { msg.textContent = 'Créditos inválidos.';             msg.className = 'crear-msg error'; return; }
      btn.disabled = true; btn.textContent = 'Creando...';
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${BACKEND_URL}/admin/create-admin`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, apellido, email, credits: creditos, vigencia_hasta: vigencia }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Error al crear admin.');
        msg.textContent = `✓ Admin creado. Se envió email de bienvenida a ${email}.`;
        msg.className   = 'crear-msg ok';
        _sa_vigenciaLoaded = false;
        await Promise.all([saCargarTablaUnificada(), saCargarStats()]);
      } catch(e) {
        msg.textContent = e.message; msg.className = 'crear-msg error';
      } finally {
        btn.disabled = false; btn.textContent = 'Crear y enviar email';
      }
    }

    function saCerrarModalCrearAdmin(e) {
      if (!e || e.target === document.getElementById('sa-modalCrearAdmin'))
        document.getElementById('sa-modalCrearAdmin').classList.remove('open');
    }
