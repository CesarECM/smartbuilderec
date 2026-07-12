    // ── Mis Cursos (Admin) ────────────────────────────────────────
    async function admCargarMisCursos() {
      const el = document.getElementById('adm-listaMisCursos');
      el.innerHTML = '<p class="loading-txt">Cargando...</p>';
      const { data: cursos, error } = await _supabase
        .from('planeaciones')
        .select('id, nombre_curso, paso_actual, status, updated_at')
        .eq('user_id', _perfil.id)
        .order('updated_at', { ascending: false });

      const ct = document.getElementById('adm-countMisCursos');
      if (ct) ct.textContent = `(${cursos?.length || 0})`;
      if (error) { el.innerHTML = '<p class="error-txt">Error al cargar cursos.</p>'; return; }

      if (!cursos?.length) {
        el.innerHTML = `<div class="empty-state">
          <div class="empty-state-icon">📚</div>
          <h3>Aún no tienes cursos creados</h3>
          <p>Crea un curso, llénalo en el wizard y transfíérelo a uno de tus alumnos cuando esté listo.</p>
          <a href="index?new=1" class="btn-primary" style="text-decoration:none">+ Crear primer curso</a>
        </div>`;
        return;
      }

      el.innerHTML = `<div class="table-wrap"><table class="data-table">
        <thead><tr><th>Curso</th><th>Progreso</th><th>Estado</th><th>Actualizado</th><th>Acciones</th></tr></thead>
        <tbody>${cursos.map(c => {
          const pct      = Math.round(((c.paso_actual - 1) / 15) * 100);
          const completa = c.status === 'completa';
          const fecha    = new Date(c.updated_at).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
          const nomEsc   = (c.nombre_curso || '').replace(/'/g, "\\'");
          return `<tr id="adm-mc-${c.id}">
            <td style="font-weight:600;color:var(--c-text)">${c.nombre_curso || '(Sin título)'}</td>
            <td>
              <div style="display:flex;align-items:center;gap:8px">
                <div class="prog-bar-wrap"><div class="prog-bar-fill ${completa ? 'completa' : ''}" style="width:${pct}%"></div></div>
                <span style="font-size:11px;color:var(--c-text-3)">${pct}%</span>
              </div>
              <div style="font-size:11px;color:var(--c-text-4)">Paso ${c.paso_actual}/16</div>
            </td>
            <td><span class="status-badge ${completa ? 'badge-completa' : 'badge-borrador'}">${completa ? 'Completo' : 'Borrador'}</span></td>
            <td style="color:var(--c-text-4);font-size:12px">${fecha}</td>
            <td><div style="display:flex;gap:6px;flex-wrap:wrap">
              <button class="btn-sm" onclick="window.open('index?planeacion_id=${c.id}','_blank')">Editar wizard</button>
              <button class="btn-sm success" onclick="admAbrirTransferir('${c.id}','${nomEsc}')">Transferir</button>
              <button class="btn-sm danger" onclick="admEliminarMiCurso('${c.id}',this)">Eliminar</button>
            </div></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>`;
    }

    async function admEliminarMiCurso(planeacionId, btn) {
      if (!confirm('¿Eliminar este curso? Esta acción no se puede deshacer.')) return;
      btn.disabled = true; btn.textContent = '...';
      const { error } = await _supabase
        .from('planeaciones').delete().eq('id', planeacionId).eq('user_id', _perfil.id);
      if (error) { alert('Error: ' + error.message); btn.disabled = false; btn.textContent = 'Eliminar'; return; }
      document.getElementById('adm-mc-' + planeacionId)?.remove();
      mostrarToast('✓ Curso eliminado.');
      admCargarStats();
      const ct = document.getElementById('adm-countMisCursos');
      if (ct) { const n = parseInt(ct.textContent.replace(/[()]/g,'')) - 1; ct.textContent = `(${Math.max(0,n)})`; }
    }

    // ── Modal Transferir (Admin) ──────────────────────────────────
    function admAbrirTransferir(planeacionId, nombreCurso) {
      _adm_transferirPlaneacionId = planeacionId;
      document.getElementById('adm-transferirCursoNombre').textContent = `"${nombreCurso}"`;
      document.getElementById('adm-transferirMsg').textContent = '';
      const btn = document.getElementById('adm-btnConfirmarTransferir');
      btn.disabled = false; btn.textContent = 'Transferir';
      const select = document.getElementById('adm-selectAlumno');
      select.innerHTML = '<option value="">— Selecciona un alumno —</option>';
      _adm_todosUsuarios.filter(u => u.activo).forEach(u => {
        const opt = document.createElement('option');
        opt.value = u.id;
        opt.textContent = `${[u.nombre,u.apellido].filter(Boolean).join(' ')||u.email} (${u.email})`;
        select.appendChild(opt);
      });
      document.getElementById('adm-modalTransferir').classList.add('open');
    }

    async function admConfirmarTransferir() {
      const alumnoId = document.getElementById('adm-selectAlumno').value;
      const msg = document.getElementById('adm-transferirMsg');
      const btn = document.getElementById('adm-btnConfirmarTransferir');
      if (!alumnoId) { msg.textContent = 'Selecciona un alumno.'; msg.className = 'crear-msg error'; return; }
      btn.disabled = true; btn.textContent = 'Transfiriendo...'; msg.textContent = '';
      const { error } = await _supabase.rpc('transferir_planeacion', {
        p_planeacion_id: _adm_transferirPlaneacionId, p_alumno_id: alumnoId
      });
      btn.disabled = false; btn.textContent = 'Transferir';
      if (error) { msg.textContent = error.message; msg.className = 'crear-msg error'; return; }
      admCerrarModalTransferir();
      mostrarToast('✓ Curso transferido correctamente.');
      admCargarMisCursos();
      admCargarUsuarios();
      admCargarStats();
    }

    function admCerrarModalTransferir(e) {
      if (!e || e.target === document.getElementById('adm-modalTransferir'))
        document.getElementById('adm-modalTransferir').classList.remove('open');
    }

    // ── Modal User Cursos (Admin) ─────────────────────────────────
    async function admAbrirModalUserCursos(userId, userName) {
      document.getElementById('adm-userCursosNombre').textContent = 'Planeaciones de ' + userName;
      document.getElementById('adm-userCursosLista').innerHTML = '<p class="loading-txt">Cargando...</p>';
      document.getElementById('adm-modalUserCursos').classList.add('open');

      const { data: cursos, error } = await _supabase
        .from('planeaciones')
        .select('id, nombre_curso, paso_actual, status, updated_at')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (error || !cursos?.length) {
        document.getElementById('adm-userCursosLista').innerHTML =
          '<p class="empty-txt">Este usuario no tiene planeaciones todavía.</p>';
        return;
      }

      document.getElementById('adm-userCursosLista').innerHTML =
        `<div class="table-wrap"><table class="data-table">
          <thead><tr><th>Curso</th><th>Progreso</th><th>Estado</th><th>Actualizado</th><th></th></tr></thead>
          <tbody>${cursos.map(c => {
            const pct      = Math.round(((c.paso_actual - 1) / 15) * 100);
            const completa = c.status === 'completa';
            const fecha    = new Date(c.updated_at).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
            return `<tr>
              <td style="font-weight:600;color:var(--c-text)">${c.nombre_curso || '(Sin título)'}</td>
              <td>
                <div style="display:flex;align-items:center;gap:8px">
                  <div class="prog-bar-wrap"><div class="prog-bar-fill ${completa ? 'completa' : ''}" style="width:${pct}%"></div></div>
                  <span style="font-size:11px;color:var(--c-text-3)">${pct}%</span>
                </div>
              </td>
              <td><span class="status-badge ${completa ? 'badge-completa' : 'badge-borrador'}">${completa ? 'Completo' : 'Borrador'}</span></td>
              <td style="color:var(--c-text-4);font-size:12px">${fecha}</td>
              <td><button class="btn-sm" onclick="window.open('index?planeacion_id=${c.id}','_blank')">Editar wizard</button></td>
            </tr>`;
          }).join('')}</tbody>
        </table></div>`;
    }

    function admCerrarModalUserCursos(e) {
      if (!e || e.target === document.getElementById('adm-modalUserCursos'))
        document.getElementById('adm-modalUserCursos').classList.remove('open');
    }

    // ── Modal Promover a Admin ────────────────────────────────────
    var _adm_promoverUserId = null;

    function admAbrirModalPromover(userId, nombre) {
      _adm_promoverUserId = userId;
      document.getElementById('adm-promoverNombreLabel').textContent = nombre;
      document.getElementById('adm-promoverMsg').textContent = '';
      const btn = document.getElementById('adm-btnConfirmarPromover');
      btn.disabled = false; btn.textContent = 'Promover';
      const hoy = new Date(); hoy.setFullYear(hoy.getFullYear() + 1);
      document.getElementById('adm-promoverVigencia').value = hoy.toISOString().split('T')[0];
      document.getElementById('adm-modalPromover').classList.add('open');
    }

    async function admConfirmarPromover() {
      const creditos = parseInt(document.getElementById('adm-promoverCreditos').value) || 0;
      const vigencia = document.getElementById('adm-promoverVigencia').value;
      const msg = document.getElementById('adm-promoverMsg');
      const btn = document.getElementById('adm-btnConfirmarPromover');
      if (!vigencia) { msg.textContent = 'Selecciona una fecha de vigencia.'; msg.className = 'form-msg err'; return; }
      btn.disabled = true; btn.textContent = 'Promoviendo...'; msg.textContent = '';
      const { error } = await _supabase.from('profiles')
        .update({ rol: 'admin', credits: creditos, admin_id: null, vigencia_hasta: vigencia })
        .eq('id', _adm_promoverUserId);
      btn.disabled = false; btn.textContent = 'Promover';
      if (error) { msg.textContent = error.message; msg.className = 'form-msg err'; return; }
      admCerrarModalPromover();
      mostrarToast('✓ Usuario promovido a Admin.');
      admCargarUsuarios();
    }

    function admCerrarModalPromover(e) {
      if (!e || e.target === document.getElementById('adm-modalPromover'))
        document.getElementById('adm-modalPromover').classList.remove('open');
    }

    // ── Ficha de contacto (compartida Admin + SA) ─────────────────
    var _contactoSA = {};

    function abrirFichaContacto(id, store) {
      const u = (store === 'admin' ? _contactoAdmin : _contactoSA)[id];
      if (!u) return;
      document.getElementById('fichaShowNombre').textContent = u.nombre || '—';
      document.getElementById('fichaShowEmail').textContent  = u.email  || '—';
      document.getElementById('fichaShowTel').textContent    = u.tel    || 'Sin teléfono registrado';
      document.getElementById('btnCopiarTodo').textContent   = '📋 Copiar ficha completa';
      document.getElementById('modalContacto').style.display = 'flex';
    }

    function cerrarFichaContacto() {
      document.getElementById('modalContacto').style.display = 'none';
    }

    function copiarCampoFicha(id, btn) {
      const texto = document.getElementById(id).textContent;
      if (!texto || texto === '—' || texto === 'Sin teléfono registrado') return;
      navigator.clipboard.writeText(texto).then(() => {
        const orig = btn.textContent;
        btn.textContent = '✓'; btn.style.color = '#059669';
        setTimeout(() => { btn.textContent = orig; btn.style.color = ''; }, 1800);
      });
    }

    function copiarFichaCompleta() {
      const nombre = document.getElementById('fichaShowNombre').textContent;
      const email  = document.getElementById('fichaShowEmail').textContent;
      const tel    = document.getElementById('fichaShowTel').textContent;
      navigator.clipboard.writeText(`Nombre: ${nombre}\nEmail: ${email}\nTeléfono: ${tel}`).then(() => {
        const btn = document.getElementById('btnCopiarTodo');
        btn.textContent = '✓ Copiado';
        setTimeout(() => { btn.textContent = '📋 Copiar ficha completa'; }, 1800);
      });
    }
