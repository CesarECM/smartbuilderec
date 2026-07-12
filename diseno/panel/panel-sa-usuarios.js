    async function saCrearUsuario() {
      const nombre   = document.getElementById('sa-saNombre').value.trim();
      const apellido = document.getElementById('sa-saApellido').value.trim();
      const email    = document.getElementById('sa-saEmail').value.trim();
      const adminId  = document.getElementById('sa-saAdminId').value;
      const msg      = document.getElementById('sa-crearSAMsg');
      const btn      = document.getElementById('sa-btnCrearSA');
      msg.textContent = ''; msg.className = 'crear-msg';
      if (!nombre || !apellido || !email) { msg.textContent = 'Completa todos los campos.'; msg.className = 'crear-msg error'; return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { msg.textContent = 'Ingresa un correo válido.'; msg.className = 'crear-msg error'; return; }
      btn.disabled = true; btn.textContent = 'Creando...';
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${BACKEND_URL}/admin/create-user`, {
          method: 'POST',
          headers: { ...headers, 'Content-Type': 'application/json' },
          body: JSON.stringify({ nombre, apellido, email, admin_id: adminId || null }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.detail || 'Error al crear usuario.');
        msg.textContent = `✓ Usuario creado. Se envió invitación a ${email}.`;
        msg.className = 'crear-msg ok';
        ['sa-saNombre','sa-saApellido','sa-saEmail'].forEach(id => { document.getElementById(id).value = ''; });
        document.getElementById('sa-saAdminId').value = '';
        await Promise.all([saCargarTablaUnificada(), saCargarStats()]);
      } catch(e) {
        msg.textContent = e.message; msg.className = 'crear-msg error';
      } finally {
        btn.disabled = false; btn.textContent = 'Crear y enviar invitación';
      }
    }

    async function saToggleUsuarioSA(userId, estaActivo) {
      const nuevo = !estaActivo;
      const { error } = await _supabase.from('profiles').update({ activo: nuevo }).eq('id', userId);
      if (error) { alert('Error al actualizar el usuario.'); return; }
      const badge = document.getElementById('sa-ubadge-' + userId);
      if (badge) {
        badge.textContent = nuevo ? 'Activo' : 'Inactivo';
        badge.className   = `status-badge ${nuevo ? 'badge-activo' : 'badge-inactivo'}`;
      }
      const u = _sa_unified_all.find(x => x.id === userId);
      if (u) {
        u.activo = nuevo;
        const nom  = [u.nombre, u.apellido].filter(Boolean).join(' ') || '(Sin nombre)';
        const menu = document.getElementById('sa-menu-' + userId);
        if (menu) menu.innerHTML = _buildMenuItems(u, nom);
      }
      mostrarToast(nuevo ? 'Usuario activado' : 'Usuario desactivado');
    }

    function saAbrirReasignar(userId, nombre, adminActualId) {
      _sa_reasignarUserId = userId;
      document.getElementById('sa-reasignarNombre').textContent = `Reasignar a: ${nombre}`;
      document.getElementById('sa-selectAdminReasignar').value = adminActualId || '';
      document.getElementById('sa-modalReasignar').classList.add('open');
    }

    async function saConfirmarReasignar() {
      const btn     = document.getElementById('sa-btnConfirmarReasignar');
      const adminId = document.getElementById('sa-selectAdminReasignar').value || null;
      btn.disabled  = true;
      const { error } = await _supabase.from('profiles').update({ admin_id: adminId }).eq('id', _sa_reasignarUserId);
      btn.disabled = false;
      if (error) { alert('Error: ' + error.message); return; }
      saCerrarModalReasignar();
      mostrarToast('Usuario reasignado');
      await saCargarTablaUnificada();
    }

    function saCerrarModalReasignar(e) {
      if (!e || e.target === document.getElementById('sa-modalReasignar')) {
        document.getElementById('sa-modalReasignar').classList.remove('open');
        _sa_reasignarUserId = null;
      }
    }

    async function saAbrirSinPlan() {
      document.getElementById('sa-modalSinPlan').classList.add('open');
      const lista = document.getElementById('sa-sinPlanLista');
      lista.innerHTML = '<p class="loading-txt">Cargando...</p>';
      const hace7 = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const { data: usuarios } = await _supabase.from('profiles')
        .select('id,nombre,apellido,email,created_at,admin_id,profiles!admin_id(nombre,apellido,email)')
        .eq('rol', 'user').eq('activo', true).lt('created_at', hace7)
        .order('created_at', { ascending: false }).limit(300);
      if (!usuarios?.length) { lista.innerHTML = '<p class="empty-txt">No hay usuarios en esta condición.</p>'; return; }
      const ids = usuarios.map(u => u.id);
      const { data: conPlan } = await _supabase.from('planeaciones').select('user_id').in('user_id', ids);
      const conPlanIds = new Set((conPlan || []).map(p => p.user_id));
      const sinPlan = usuarios.filter(u => !conPlanIds.has(u.id));
      if (!sinPlan.length) { lista.innerHTML = '<p class="empty-txt">Todos los usuarios ya tienen al menos una planeación. ✓</p>'; return; }
      lista.innerHTML = `
        <p style="font-size:12px;color:var(--c-text-3);margin-bottom:12px">${sinPlan.length} usuario${sinPlan.length !== 1 ? 's' : ''} encontrado${sinPlan.length !== 1 ? 's' : ''}</p>
        <div class="table-wrap"><table class="data-table">
          <thead><tr><th>Nombre</th><th>Email</th><th>Admin</th><th>Registro</th><th></th></tr></thead>
          <tbody>${sinPlan.map(u => {
            const nombre = [u.nombre, u.apellido].filter(Boolean).join(' ') || '(Sin nombre)';
            const a = u['profiles'] || null;
            const adminNombre = a ? ([a.nombre, a.apellido].filter(Boolean).join(' ') || a.email) : 'Sin admin';
            const fecha = new Date(u.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
            return `<tr>
              <td style="font-weight:600;color:var(--c-text)">${nombre}</td>
              <td style="color:var(--c-text-3);font-size:12px">${u.email}</td>
              <td style="color:var(--c-text-3);font-size:12px">${adminNombre}</td>
              <td style="color:var(--c-text-3);font-size:12px">${fecha}</td>
              <td><button class="btn-sm" onclick="saVerEnUsuarios('${u.email}')">Ver perfil →</button></td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>`;
    }

    function saCerrarModalSinPlan(e) {
      if (!e || e.target === document.getElementById('sa-modalSinPlan'))
        document.getElementById('sa-modalSinPlan').classList.remove('open');
    }

    function saVerEnUsuarios(email) {
      document.getElementById('sa-modalSinPlan').classList.remove('open');
      saShowTab('usuarios');
      const intentar = async () => {
        if (!_sa_tabsLoaded.usuarios) await saCargarTablaUnificada();
        const input = document.getElementById('sa-searchUnificado');
        if (input) {
          input.value = email;
          saFiltrarUnificada(email);
          setTimeout(() => {
            const fila = [...document.querySelectorAll('#sa-listaUnificada td')]
              .find(td => td.textContent.trim() === email)?.closest('tr');
            if (fila) {
              fila.style.transition = 'background 0.3s';
              fila.style.background = '#ede9fe';
              fila.scrollIntoView({ behavior: 'smooth', block: 'center' });
              setTimeout(() => { fila.style.background = ''; }, 2200);
            }
          }, 300);
        }
      };
      intentar();
    }

    var _sa_eliminarUserId = null;
    var _sa_eliminarOpA = 0, _sa_eliminarOpB = 0;

    function saAbrirEliminarUsuario(userId, nombre) {
      _sa_eliminarUserId = userId;
      _sa_eliminarOpA = Math.floor(Math.random() * 9) + 1;
      _sa_eliminarOpB = Math.floor(Math.random() * 9) + 1;
      document.getElementById('sa-eliminarUsuarioNombre').textContent = `Usuario: ${nombre}`;
      document.getElementById('sa-eliminarOpTexto').textContent = `${_sa_eliminarOpA} + ${_sa_eliminarOpB} = ?`;
      document.getElementById('sa-eliminarOpRespuesta').value   = '';
      document.getElementById('sa-eliminarConfirmTexto').value  = '';
      document.getElementById('sa-eliminarUsuarioMsg').textContent = '';
      document.getElementById('sa-eliminarUsuarioMsg').className  = 'crear-msg';
      document.getElementById('sa-modalEliminarUsuario').classList.add('open');
    }

    function saCerrarModalEliminarUsuario(e) {
      if (!e || e.target === document.getElementById('sa-modalEliminarUsuario')) {
        document.getElementById('sa-modalEliminarUsuario').classList.remove('open');
        _sa_eliminarUserId = null;
      }
    }

    async function saConfirmarEliminarUsuario() {
      const msg      = document.getElementById('sa-eliminarUsuarioMsg');
      const respuesta = parseInt(document.getElementById('sa-eliminarOpRespuesta').value, 10);
      const texto    = document.getElementById('sa-eliminarConfirmTexto').value.trim();
      msg.className  = 'crear-msg error';
      if (isNaN(respuesta) || respuesta !== (_sa_eliminarOpA + _sa_eliminarOpB)) {
        msg.textContent = `La respuesta a ${_sa_eliminarOpA} + ${_sa_eliminarOpB} es incorrecta.`; return;
      }
      if (texto !== 'BORRAR') {
        msg.textContent = 'Debes escribir exactamente la palabra BORRAR en mayúsculas.'; return;
      }
      const btn = document.getElementById('sa-btnConfirmarEliminarUsuario');
      btn.disabled = true; btn.textContent = 'Eliminando...';
      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${BACKEND_URL}/admin/users/${_sa_eliminarUserId}`, { method: 'DELETE', headers });
        if (!res.ok) { const d = await res.json().catch(() => ({})); throw new Error(d.detail || 'Error al eliminar usuario.'); }
        saCerrarModalEliminarUsuario();
        mostrarToast('Usuario eliminado permanentemente');
        await Promise.all([saCargarTablaUnificada(), saCargarStats()]);
      } catch(e) {
        msg.textContent = e.message;
      } finally {
        btn.disabled = false; btn.textContent = 'Eliminar permanentemente';
      }
    }

    function saAbrirEditVigenciaUser(userId, nombre, vigenciaActual) {
      _sa_reasignarUserId = userId; // reuse slot for vigencia target
      document.getElementById('sa-vigenciaUserNombre').textContent = nombre;
      document.getElementById('sa-inputVigenciaUser').value        = vigenciaActual || '';
      document.getElementById('sa-vigenciaUserMsg').textContent    = '';
      document.getElementById('sa-vigenciaUserMsg').className      = 'crear-msg';
      document.getElementById('sa-btnConfirmarVigenciaUser').disabled = false;
      document.getElementById('sa-modalVigenciaUser').classList.add('open');
    }

    async function saConfirmarVigenciaUser() {
      const vigencia = document.getElementById('sa-inputVigenciaUser').value;
      const msg      = document.getElementById('sa-vigenciaUserMsg');
      const btn      = document.getElementById('sa-btnConfirmarVigenciaUser');
      if (!vigencia) { msg.textContent = 'Selecciona una fecha.'; msg.className = 'crear-msg error'; return; }
      btn.disabled = true; btn.textContent = 'Guardando...';
      const { error } = await _supabase.from('profiles')
        .update({ vigencia_hasta: vigencia }).eq('id', _sa_reasignarUserId);
      btn.disabled = false; btn.textContent = 'Guardar vigencia';
      if (error) { msg.textContent = 'Error: ' + error.message; msg.className = 'crear-msg error'; return; }
      saCerrarModalVigenciaUser();
      mostrarToast('Vigencia actualizada correctamente');
      await saCargarTablaUnificada();
    }

    function saCerrarModalVigenciaUser(e) {
      if (!e || e.target === document.getElementById('sa-modalVigenciaUser'))
        document.getElementById('sa-modalVigenciaUser').classList.remove('open');
    }

    async function saResetPassword(email, nombre) {
      if (!confirm(`¿Enviar correo de recuperación de contraseña a ${nombre} (${email})?`)) return;
      const { error } = await _supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) { alert('Error: ' + error.message); return; }
      mostrarToast(`Correo de recuperación enviado a ${email}`);
    }
