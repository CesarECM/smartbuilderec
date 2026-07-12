    const BACKEND_URL = "https://smartbuilderec.onrender.com";

    let _perfil     = null;
    let _extraRoles = [];
    let _rolesDisp  = [];
    let _rolActivo  = null;

    // ── API helper ───────────────────────────────────────────────
    async function apiFetch(path, opts = {}) {
      const headers = await getAuthHeaders();
      if (opts.body && typeof opts.body !== 'string') {
        opts.body = JSON.stringify(opts.body);
        headers['Content-Type'] = 'application/json';
      }
      const res = await fetch(BACKEND_URL + path, { ...opts, headers });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Error ${res.status}`);
      }
      return res.json().catch(() => ({}));
    }

    // ── Toast ────────────────────────────────────────────────────
    function mostrarToast(msg, ms = 2500) {
      const t = document.getElementById('toast');
      t.textContent = msg;
      t.classList.add('visible');
      setTimeout(() => t.classList.remove('visible'), ms);
    }

    // ── Role switcher ────────────────────────────────────────────
    function determinarRoles(perfil, extraRoles) {
      const roles = [{ id: 'alumno', label: '🎓 Alumno' }];
      if (extraRoles.includes('asesor'))    roles.push({ id: 'asesor',     label: '🤝 Asesor' });
      if (extraRoles.includes('evaluador')) roles.push({ id: 'evaluador',  label: '📋 Evaluador' });
      if (perfil.rol === 'admin' || perfil.rol === 'super_admin')
        roles.push({ id: 'admin', label: '👑 Admin' });
      if (perfil.rol === 'super_admin')
        roles.push({ id: 'super_admin', label: '🛡️ Super Admin' });
      return roles;
    }

    function renderRoleSwitcher(roles) {
      const nav = document.getElementById('roleSwitcher');
      nav.innerHTML = roles.map(r =>
        `<button class="role-pill" data-role="${r.id}" onclick="switchRol('${r.id}')">${r.label}</button>`
      ).join('');
    }

    function switchRol(rol) {
      if (_rolActivo === rol) return;
      _rolActivo = rol;
      localStorage.setItem('sbe_active_role', rol);
      document.querySelectorAll('.role-pill').forEach(p =>
        p.classList.toggle('active', p.dataset.role === rol)
      );
      document.querySelectorAll('.role-panel').forEach(p => p.classList.remove('active'));
      document.getElementById('rp-' + rol)?.classList.add('active');
      cargarPanel(rol);
    }

    const _panelLoaded = {};

    async function cargarPanel(rol) {
      if (_panelLoaded[rol]) return;
      _panelLoaded[rol] = true;
      switch (rol) {
        case 'alumno':      typeof cargarPanelAlumno    === 'function' && await cargarPanelAlumno();    break;
        case 'asesor':      typeof cargarPanelAsesor    === 'function' && await cargarPanelAsesor();    break;
        case 'evaluador':   typeof cargarPanelEvaluador === 'function' && await cargarPanelEvaluador(); break;
        case 'admin':       typeof admInit              === 'function' && await admInit();              break;
        case 'super_admin': typeof saInit               === 'function' && await saInit();               break;
      }
    }

    // ══════════════════════════════════════════════════════════════
    // PANEL ALUMNO
    // ══════════════════════════════════════════════════════════════
    let _alumnoEstado = null;

    async function cargarPanelAlumno() {
      await Promise.all([
        cargarAlumnoDatos(),
        cargarAlumnoEstadoYPlaneaciones(),
      ]);
    }

    // ── Estado de límites ────────────────────────────────────────
    async function cargarAlumnoEstadoYPlaneaciones() {
      try {
        _alumnoEstado = await apiFetch('/alumno/estado');
      } catch (e) {
        _alumnoEstado = { planeaciones_count: 0, slots_usados: 0, slots_disponibles: 5, modo_degradado: false };
      }
      _renderSlotCounter();
      await cargarMisPlaneaciones();
    }

    function _renderSlotCounter() {
      const el = document.getElementById('alumno-slots-counter');
      if (!el || !_alumnoEstado) return;
      const { slots_usados, slots_max } = _alumnoEstado;
      el.style.display = '';
      el.textContent = `${slots_usados} / ${slots_max} descargas usadas`;
      el.className = 'alm-slots-counter' +
        (slots_usados >= slots_max ? ' full' : slots_usados >= 4 ? ' warn' : '');

      const banner = document.getElementById('alumno-degradado-banner');
      if (banner) banner.style.display = _alumnoEstado.modo_degradado ? '' : 'none';
    }

    // ── Mis datos personales ─────────────────────────────────────
    async function cargarAlumnoDatos() {
      const el = document.getElementById('alumno-datos-view');
      const p  = _perfil;
      if (!p) return;

      const curp  = p.curp       || '';
      const tel   = p.telefono   || '';
      const curric = p.curriculum || '';

      el.innerHTML = `<div class="alm-datos-card">
        <div class="alm-dato">
          <span class="alm-dato-label">Nombre completo</span>
          <span class="alm-dato-val">${[p.nombre, p.apellido].filter(Boolean).join(' ') || '<span class="alm-dato-empty">Sin registrar</span>'}</span>
        </div>
        <div class="alm-dato">
          <span class="alm-dato-label">CURP</span>
          <span class="alm-dato-val ${curp ? '' : 'alm-dato-empty'}">${curp || 'Sin registrar'}</span>
        </div>
        <div class="alm-dato">
          <span class="alm-dato-label">Teléfono</span>
          <span class="alm-dato-val ${tel ? '' : 'alm-dato-empty'}">${tel || 'Sin registrar'}</span>
        </div>
        <div class="alm-dato">
          <span class="alm-dato-label">Correo</span>
          <span class="alm-dato-val">${p.email || '—'}</span>
        </div>
        <div class="alm-dato alm-dato-curric">
          <span class="alm-dato-label">Currículum</span>
          <span class="alm-dato-val ${curric ? '' : 'alm-dato-empty'}">${curric || 'Sin registrar'}</span>
        </div>
      </div>`;
    }

    function alumnoEditarDatos() {
      const p = _perfil;
      document.getElementById('fd-nombre').value     = p.nombre    || '';
      document.getElementById('fd-apellido').value   = p.apellido  || '';
      document.getElementById('fd-curp').value       = p.curp      || '';
      document.getElementById('fd-telefono').value   = p.telefono  || '';
      document.getElementById('fd-email').value      = p.email     || '';
      document.getElementById('fd-curriculum').value = p.curriculum || '';

      document.getElementById('alumno-datos-view').style.display  = 'none';
      document.getElementById('alumno-datos-form').style.display  = '';
      document.getElementById('alumno-datos-actions').style.display = 'none';
    }

    function alumnoCancelarEdicion() {
      document.getElementById('alumno-datos-view').style.display  = '';
      document.getElementById('alumno-datos-form').style.display  = 'none';
      document.getElementById('alumno-datos-actions').style.display = '';
    }

    async function alumnoGuardarDatos(e) {
      e.preventDefault();
      const btn = document.getElementById('alumno-save-btn');
      btn.disabled = true; btn.textContent = 'Guardando…';

      const updates = {
        nombre:     document.getElementById('fd-nombre').value.trim(),
        apellido:   document.getElementById('fd-apellido').value.trim(),
        curp:       document.getElementById('fd-curp').value.trim().toUpperCase(),
        telefono:   document.getElementById('fd-telefono').value.trim(),
        curriculum: document.getElementById('fd-curriculum').value.trim(),
      };

      const { error } = await _supabase
        .from('profiles')
        .update(updates)
        .eq('id', _perfil.id);

      btn.disabled = false; btn.textContent = 'Guardar cambios';

      if (error) { mostrarToast('Error al guardar. Intenta de nuevo.'); return; }

      Object.assign(_perfil, updates);
      alumnoCancelarEdicion();
      cargarAlumnoDatos();
      document.getElementById('headerNombre').textContent =
        [_perfil.nombre, _perfil.apellido].filter(Boolean).join(' ') || _perfil.email;
      mostrarToast('Datos guardados correctamente.');
    }

    // ── Mis planeaciones ─────────────────────────────────────────
    async function cargarMisPlaneaciones() {
      const el = document.getElementById('alumno-planeaciones');
      const { data, error } = await _supabase
        .from('planeaciones')
        .select('id, nombre_curso, paso_actual, status, updated_at')
        .eq('user_id', _perfil.id)
        .order('updated_at', { ascending: false });

      const count = data?.length || 0;
      const cTag = document.getElementById('alumno-plan-count');
      if (cTag) cTag.textContent = count;

      if (error || !count) {
        el.innerHTML = `<div style="text-align:center;padding:32px;background:var(--c-surface);border:2px dashed var(--c-border);border-radius:var(--r-xl)">
          <div style="font-size:36px;margin-bottom:10px">📋</div>
          <h3 style="font-size:15px;font-weight:700;margin-bottom:6px">Aún no tienes cursos</h3>
          <p style="font-size:13px;color:var(--c-text-3);margin-bottom:14px">Crea tu primer expediente didáctico EC0217.01.</p>
          <button class="btn-primary" onclick="alumnoNuevaPlaneacion()">+ Crear primer curso</button>
        </div>`;
        return;
      }

      const degradado = _alumnoEstado?.modo_degradado;
      const sinSlots  = (_alumnoEstado?.slots_disponibles ?? 1) <= 0;

      el.innerHTML = data.map(p => {
        const pct      = Math.min(100, Math.round(((p.paso_actual - 1) / 15) * 100));
        const completa = p.status === 'completa';
        const tiempo   = _tiempoRel(p.updated_at);
        const titulo   = p.nombre_curso || '(Sin título)';

        const btnDescargar = completa
          ? (degradado
              ? `<button class="btn-sm" disabled title="Elimina una planeación para descargar">⬇ Descargar</button>`
              : sinSlots
                ? `<button class="btn-sm" disabled title="Límite de descargas alcanzado">⬇ Descargar</button>`
                : `<button class="btn-sm success" onclick="alumnoDescargar('${p.id}','${titulo.replace(/'/g, "\\'")}')">⬇ Descargar</button>`)
          : '';

        return `<div class="alm-plan-card">
          <div class="alm-plan-top">
            <div class="alm-plan-info">
              <div class="alm-plan-title">${titulo}</div>
              <div class="alm-plan-meta">Editado ${tiempo} · Paso ${p.paso_actual}/16</div>
            </div>
            <div class="alm-plan-actions">
              <span class="status-badge ${completa ? 'badge-completa' : 'badge-borrador'}">${completa ? 'Completa' : 'Borrador'}</span>
              ${btnDescargar}
              <a href="index?planeacion_id=${p.id}" class="btn-sm">${completa ? 'Ver' : 'Continuar'}</a>
              <button class="btn-sm danger" onclick="alumnoEliminarPlaneacion('${p.id}','${titulo.replace(/'/g, "\\'")}')">🗑</button>
            </div>
          </div>
          <div class="alm-prog-wrap">
            <div class="alm-prog-fill ${completa ? 'completa' : ''}" style="width:${pct}%"></div>
          </div>
        </div>`;
      }).join('');
    }

    // ── Nueva planeación ─────────────────────────────────────────
    function alumnoNuevaPlaneacion() {
      const count = parseInt(document.getElementById('alumno-plan-count')?.textContent) || 0;
      if (count >= 5) {
        const ok = confirm(
          `Tienes ${count} planeaciones activas (límite recomendado: 5).\n\n` +
          `Tendrás acceso reducido (sin descargas ni IA) hasta que elimines una.\n\n` +
          `¿Crear de todas formas?`
        );
        if (!ok) return;
      }
      window.location.href = 'index?new=1';
    }

    // ── Eliminar planeación ──────────────────────────────────────
    async function alumnoEliminarPlaneacion(id, nombre) {
      if (!confirm(`¿Eliminar "${nombre}"?\n\nEsta acción no se puede deshacer.`)) return;

      const { error } = await _supabase
        .from('planeaciones')
        .delete()
        .eq('id', id)
        .eq('user_id', _perfil.id);

      if (error) { mostrarToast('Error al eliminar. Intenta de nuevo.'); return; }

      mostrarToast('Planeación eliminada.');
      _panelLoaded['alumno'] = false;
      await cargarAlumnoEstadoYPlaneaciones();
    }

    // ── Descargar ZIP ────────────────────────────────────────────
    async function alumnoDescargar(planeacionId, nombreCurso) {
      await _alumnoTriggerDescarga(planeacionId, nombreCurso, false);
    }

    async function _alumnoTriggerDescarga(planeacionId, nombreCurso, confirmNewCourse) {
      // Obtener datos completos del wizard desde Supabase
      const { data: row, error } = await _supabase
        .from('planeaciones')
        .select('datos, nombre_curso')
        .eq('id', planeacionId)
        .single();

      if (error || !row?.datos) {
        mostrarToast('No se pudieron obtener los datos del curso.'); return;
      }

      const payload = {
        ...row.datos,
        planeacion_id:      planeacionId,
        confirm_new_course: confirmNewCourse,
      };

      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';

      let res;
      try {
        res = await fetch(BACKEND_URL + '/generate-doc/planeacion', {
          method: 'POST', headers, body: JSON.stringify(payload),
        });
      } catch (e) {
        mostrarToast('Error de conexión al generar el expediente.'); return;
      }

      if (res.status === 409) {
        const slotsDisp = res.headers.get('X-Slots-Disponibles') || '?';
        const ok = confirm(
          `Se detectaron cambios significativos.\n\n` +
          `Esto se registrará como un nuevo curso y usará 1 de tus ${slotsDisp} descargas disponibles.\n\n` +
          `¿Continuar?`
        );
        if (ok) await _alumnoTriggerDescarga(planeacionId, nombreCurso, true);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        mostrarToast(err.detail || `Error ${res.status} al generar el expediente.`);
        return;
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `Expediente_${(row.nombre_curso || 'EC0217').replace(/\s+/g, '_')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      mostrarToast('Expediente descargado.');
      // Refrescar contador de slots
      try { _alumnoEstado = await apiFetch('/alumno/estado'); _renderSlotCounter(); } catch (_) {}
    }

    // ── Panel Asesor ──────────────────────────────────────────────
    async function cargarPanelAsesor() {
      const el = document.getElementById('asesor-lista');
      const { data, error } = await _supabase
        .from('asignaciones')
        .select('id, norma_id, created_at, profiles!asignaciones_alumno_id_fkey(nombre, apellido, email), normas(codigo, nombre)')
        .eq('asesor_id', _perfil.id)
        .order('created_at', { ascending: false });

      if (error || !data?.length) {
        el.innerHTML = '<p class="empty-txt">No tienes alumnos asignados para asesorar todavía.</p>';
        return;
      }
      el.innerHTML = _renderAsignadosTable(data);
    }

    // ── Panel Evaluador ───────────────────────────────────────────
    async function cargarPanelEvaluador() {
      const el = document.getElementById('evaluador-lista');
      const { data, error } = await _supabase
        .from('asignaciones')
        .select('id, norma_id, created_at, profiles!asignaciones_alumno_id_fkey(nombre, apellido, email), normas(codigo, nombre)')
        .eq('evaluador_id', _perfil.id)
        .order('created_at', { ascending: false });

      if (error || !data?.length) {
        el.innerHTML = '<p class="empty-txt">No tienes alumnos asignados para evaluar todavía.</p>';
        return;
      }
      el.innerHTML = _renderAsignadosTable(data);
    }

    function _renderAsignadosTable(rows) {
      return `<div class="table-wrap"><table class="data-table">
        <thead><tr><th>Alumno</th><th>Email</th><th>Norma</th><th>Inscrito</th><th>Acciones</th></tr></thead>
        <tbody>${rows.map(a => {
          const p   = a['profiles!asignaciones_alumno_id_fkey'] || a.profiles || {};
          const n   = a.normas || {};
          const nom = [p.nombre, p.apellido].filter(Boolean).join(' ') || '(Sin nombre)';
          const fec = new Date(a.created_at).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
          return `<tr>
            <td style="font-weight:600;color:var(--c-text)">${nom}</td>
            <td style="color:var(--c-text-3)">${p.email || '—'}</td>
            <td><span class="norma-badge" style="font-size:9px">${n.codigo || '—'}</span></td>
            <td style="color:var(--c-text-4);font-size:12px">${fec}</td>
            <td><a href="erp-admin" class="btn-sm">Ver ERP →</a></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>`;
    }

    // ── Utilidad: tiempo relativo ─────────────────────────────────
    function _tiempoRel(dateStr) {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      const hs   = Math.floor(mins / 60);
      const dias = Math.floor(hs / 24);
      if (mins < 2)   return 'Ahora mismo';
      if (mins < 60)  return `Hace ${mins} min`;
      if (hs  < 24)   return `Hace ${hs} h`;
      if (dias === 1) return 'Ayer';
      if (dias < 7)   return `Hace ${dias} días`;
      return new Date(dateStr).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
    }

    // ══════════════════════════════════════════════════════════════
    // ── MÓDULO ADMIN ──────────────────────────────────────────────
    // ══════════════════════════════════════════════════════════════

    let _adm_todosUsuarios        = [];
    let _adm_misCursosLoaded      = false;
    let _adm_perfilTabLoaded      = false;
    let _adm_transferirPlaneacionId = null;
    let _contactoAdmin            = {};
    let _adm_tabsLoaded = { resumen: true, 'mis-cursos': false, usuarios: false, 'mi-perfil': false };

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

    // ── Códigos de acceso ─────────────────────────────────────────
    async function admCargarCodigos() {
      const lista = document.getElementById('adm-listaCodigos');
      lista.innerHTML = '<p class="loading-txt">Cargando códigos...</p>';
      const { data: codigos, error } = await _supabase
        .from('access_codes')
        .select('id, code, used_at, expires_at, created_at, used_by')
        .eq('admin_id', _perfil.id)
        .order('created_at', { ascending: false });

      if (error) { lista.innerHTML = '<p class="error-txt">Error al cargar códigos.</p>'; return; }

      if (!codigos?.length) {
        lista.innerHTML = `<div class="empty-state">
          <div class="empty-state-icon">🔑</div>
          <h3>Aún no has generado ningún código</h3>
          <p>Los códigos permiten que tus usuarios se registren sin pago.</p>
          <button class="btn-primary" onclick="admGenerarCodigo()">🔑 Generar primer código</button>
        </div>`;
        return;
      }

      const usedByIds = [...new Set(codigos.filter(c => c.used_by).map(c => c.used_by))];
      const perfilesMap = {};
      if (usedByIds.length) {
        const { data: perfiles } = await _supabase
          .from('profiles').select('id, nombre, apellido, email').in('id', usedByIds);
        perfiles?.forEach(p => { perfilesMap[p.id] = p; });
      }

      const ahora    = new Date();
      const activos  = codigos.filter(c => !c.used_at && new Date(c.expires_at) > ahora);
      const historial= codigos.filter(c =>  !!c.used_at || new Date(c.expires_at) <= ahora);

      let html = activos.length
        ? `<div class="code-grid">${activos.map(c => _adm_renderCodeCard(c, perfilesMap, ahora)).join('')}</div>`
        : `<p class="empty-txt" style="margin-bottom:16px">No hay códigos activos. Genera uno nuevo arriba.</p>`;

      html += `<details class="historial-section" ${historial.length ? 'open' : ''}>
        <summary class="historial-summary">
          Historial de códigos <span class="count-tag">${historial.length} registro${historial.length !== 1 ? 's' : ''}</span>
        </summary>
        ${historial.length
          ? `<div class="code-grid" style="margin-top:12px">${historial.map(c => _adm_renderCodeCard(c, perfilesMap, ahora)).join('')}</div>`
          : `<p class="empty-txt" style="margin:12px 0 4px">Ningún código ha sido usado o expirado aún.</p>`
        }
      </details>`;

      lista.innerHTML = html;
    }

    function _adm_renderCodeCard(c, perfilesMap, ahora) {
      const expirado   = new Date(c.expires_at) <= ahora;
      const usado      = !!c.used_at;
      const disponible = !usado && !expirado;
      const badgeCls   = usado ? 'badge-usado' : expirado ? 'badge-expirado' : 'badge-disponible';
      const badgeTxt   = usado ? 'Usado' : expirado ? 'Expirado' : 'Disponible';
      const fechaExp   = new Date(c.expires_at).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
      const fechaCrea  = new Date(c.created_at).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });

      let metaExtra = '';
      if (usado && c.used_by && perfilesMap[c.used_by]) {
        const p   = perfilesMap[c.used_by];
        const nom = [p.nombre, p.apellido].filter(Boolean).join(' ') || p.email;
        metaExtra = `<br>Canjeado por: <strong style="color:var(--c-text)">${nom}</strong> <span style="color:var(--c-text-4)">(${p.email})</span>`;
      } else if (usado) {
        metaExtra = '<br>Canjeado';
      }

      return `<div class="code-card" id="adm-ccard-${c.id}">
        <div class="code-card-top">
          <span class="code-text">${c.code}</span>
          <span class="${badgeCls}">${badgeTxt}</span>
        </div>
        <div class="code-meta">Creado: ${fechaCrea}<br>Expira: ${fechaExp}${metaExtra}</div>
        <div class="code-actions">
          ${disponible ? `<button class="btn-sm" onclick="admCopiarCodigo('${c.code}')">Copiar</button>` : ''}
          ${disponible ? `<button class="btn-sm danger" onclick="admEliminarCodigo('${c.id}',this)">Eliminar</button>` : ''}
        </div>
      </div>`;
    }

    function _adm_generarCodigoAleatorio() {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        if (i === 4) code += '-';
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      return code;
    }

    async function admGenerarCodigo() {
      const btn = document.getElementById('adm-btnGenerarCodigo');
      btn.disabled = true; btn.textContent = 'Generando...';

      const [{ data: perfil }, { data: codsActivos }] = await Promise.all([
        _supabase.from('profiles').select('credits').eq('id', _perfil.id).single(),
        _supabase.from('access_codes').select('id')
          .eq('admin_id', _perfil.id).is('used_at', null)
          .gt('expires_at', new Date().toISOString()),
      ]);
      const codigosActivos = codsActivos?.length ?? 0;

      if (_perfil.rol !== 'super_admin' && (!perfil || perfil.credits <= codigosActivos)) {
        btn.disabled = false; btn.textContent = '+ Generar código';
        const msg = !perfil || perfil.credits <= 0
          ? 'No tienes créditos disponibles. Contacta al administrador de la plataforma.'
          : `Tus ${perfil.credits} crédito${perfil.credits !== 1 ? 's' : ''} ya están comprometidos por ${codigosActivos} código${codigosActivos !== 1 ? 's' : ''} activo${codigosActivos !== 1 ? 's' : ''}.`;
        alert(msg);
        return;
      }

      let code, intentos = 0;
      while (intentos < 10) {
        code = _adm_generarCodigoAleatorio();
        const { data } = await _supabase.from('access_codes').select('id').eq('code', code).single();
        if (!data) break;
        intentos++;
      }

      const dias    = parseInt(document.getElementById('adm-selectVigencia')?.value || '30');
      const expires = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await _supabase.from('access_codes')
        .insert({ code, admin_id: _perfil.id, expires_at: expires }).select().single();

      btn.disabled = false; btn.textContent = '+ Generar código';
      if (error) { alert('Error al generar código: ' + error.message); return; }
      await Promise.all([admCargarCodigos(), admCargarStats()]);
      admCopiarCodigo(data.code);
    }

    async function admEliminarCodigo(codeId, btn) {
      if (!confirm('¿Eliminar este código?')) return;
      btn.disabled = true;
      const { error } = await _supabase.from('access_codes').delete().eq('id', codeId);
      if (!error) {
        document.getElementById('adm-ccard-' + codeId)?.remove();
        admCargarStats();
      } else {
        btn.disabled = false;
      }
    }

    function admCopiarCodigo(code) {
      navigator.clipboard.writeText(code).catch(() => {
        const t = document.createElement('textarea');
        t.value = code; document.body.appendChild(t); t.select();
        document.execCommand('copy'); t.remove();
      });
      mostrarToast(`✓ Código ${code} copiado`);
    }

    function _adm_actualizarEstadoBtnCodigo(creditos, codigosActivos) {
      const btn = document.getElementById('adm-btnGenerarCodigo');
      if (!btn) return;
      if (_perfil.rol === 'super_admin') { btn.disabled = false; return; }
      const disponibles = creditos - codigosActivos;
      if (disponibles <= 0) {
        btn.disabled = true;
        btn.title = creditos <= 0
          ? 'Sin créditos — contacta al administrador de la plataforma'
          : `Tus ${creditos} crédito${creditos !== 1 ? 's' : ''} ya están comprometidos por ${codigosActivos} código${codigosActivos !== 1 ? 's' : ''} activo${codigosActivos !== 1 ? 's' : ''}`;
      } else {
        btn.disabled = false;
        btn.title = `Puedes generar ${disponibles} código${disponibles !== 1 ? 's' : ''} más`;
      }
    }

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
    let _adm_promoverUserId = null;

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
    let _contactoSA = {};

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

    // ── Init ─────────────────────────────────────────────────────
    async function init() {
      const session = await authGuard();
      if (!session) return;

      _perfil = await getUserProfile();
      if (!_perfil) { window.location.href = 'login'; return; }

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

    // ── MÓDULO SUPER ADMIN ────────────────────────────────────────

    let _sa_admins          = [];
    let _sa_reasignarUserId = null;
    let _sa_renovarAdminId  = null;
    let _sa_tabsLoaded = {
      resumen: true, usuarios: false,
      plataforma: false, config: false, soporte: false, logs: false, 'mi-perfil': false
    };
    let _sa_vigenciaLoaded = false;
    let _sa_tplSlugActivo  = null;

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
      if (name === 'mi-perfil' && !_sa_tabsLoaded['mi-perfil']) {
        _sa_tabsLoaded['mi-perfil'] = true;
        const saPerfilContainer = document.getElementById('sa-perfilFormContainer');
        if (saPerfilContainer && typeof _htmlPerfilForm === 'function') {
          saPerfilContainer.innerHTML = _htmlPerfilForm(_perfil);
          if (_perfil.curp) typeof validarCurpInput === 'function' && validarCurpInput();
        }
      }
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
      if (usuario.rol === 'admin')       { res.classList.add('warn'); res.innerHTML = `<strong>${usuario.nombre||usuario.email}</strong> ya es administrador.`; return; }
      if (usuario.rol === 'super_admin') { res.classList.add('warn'); res.innerHTML = `<strong>${usuario.nombre||usuario.email}</strong> es Super Admin.`; return; }
      const nombre = [usuario.nombre, usuario.apellido].filter(Boolean).join(' ') || usuario.email;
      res.classList.add('ok');
      res.innerHTML = `<div style="display:flex;align-items:center;justify-content:space-between;gap:16px;flex-wrap:wrap">
        <div><strong>${nombre}</strong> · ${usuario.email}</div>
        <button class="btn-primary" onclick="saPromoverAAdmin('${usuario.id}','${nombre.replace(/'/g,"\\'")}',${creditos})">Promover con ${creditos} créditos</button>
      </div>`;
    }

    async function saPromoverAAdmin(userId, nombre, creditos) {
      const vigencia = document.getElementById('sa-vigenciaAsignar').value;
      if (!vigencia) { mostrarToast('Selecciona una fecha de vigencia'); return; }
      const btn = document.querySelector('#sa-resultadoBusqueda .btn-primary');
      if (btn) btn.disabled = true;
      const { error } = await _supabase.from('profiles')
        .update({ rol: 'admin', credits: creditos, admin_id: null, vigencia_hasta: vigencia })
        .eq('id', userId);
      if (error) { alert('Error al promover: ' + error.message); if (btn) btn.disabled = false; return; }
      const res = document.getElementById('sa-resultadoBusqueda');
      res.className = 'resultado-busqueda visible ok';
      res.innerHTML = `✓ <strong>${nombre}</strong> ahora es administrador con ${creditos} créditos.`;
      document.getElementById('sa-buscarEmail').value    = '';
      document.getElementById('sa-vigenciaAsignar').value = '';
      mostrarToast('Admin promovido correctamente');
      _sa_vigenciaLoaded = false;
      await Promise.all([saCargarStats(), saCargarTablaUnificada()]);
    }

    async function saCargarVigencia() {
      const cont = document.getElementById('sa-vigenciaContent');
      cont.innerHTML = '<p class="loading-txt">Cargando...</p>';
      const { data: admins, error } = await _supabase.from('profiles')
        .select('id,nombre,apellido,email,credits,activo,vigencia_hasta')
        .eq('rol', 'admin').order('vigencia_hasta', { ascending: true, nullsFirst: false });
      if (error) { cont.innerHTML = `<p class="error-txt">Error: ${error.message}</p>`; return; }
      if (!admins?.length) { cont.innerHTML = '<p class="empty-txt">No hay admins registrados.</p>'; return; }

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

    // ── Integraciones ─────────────────────────────────────────────

    const _SA_INTEG_META = {
      claude:              { extraFn: d => d.note  || 'OK' },
      openai:              { extraFn: d => d.model || 'OK' },
      supabase:            { extraFn: d => d.perfiles  != null ? `${d.perfiles} perfiles`  : 'OK' },
      pgvector:            { extraFn: d => d.faqs_activas != null ? `${d.faqs_activas} FAQs` : 'OK' },
      resend:              { extraFn: d => d.from   || 'OK' },
      stripe:              { extraFn: d => d.mode   ? d.mode.toUpperCase() : 'OK' },
      docs:                { extraFn: _ => 'DOCX + PPTX' },
      stripe_pagos:        { extraFn: d => d.monto  ? `${d.monto} · ${d.hace}` : (d.ultimo || 'OK') },
      tokens_ia:           { extraFn: d => d.tokens ? `${d.tokens} tok · ${d.costo}` : 'OK' },
      tickets_kb:          { extraFn: _ => 'al día' },
      sugerencias_kb:      { extraFn: _ => 'al día' },
      vigencias_proximas:  { extraFn: _ => 'al día' },
      admins_sin_creditos: { extraFn: _ => 'todos con créditos' },
      usuarios_sin_plan:   { extraFn: _ => 'todos activos' },
    };

    function _sa_classifyError(key, msg) {
      if (!msg) return { tag: 'SIN_DETALLE', desc: 'El servicio no retornó información de error.' };
      const m = msg.toLowerCase();
      if (m.includes('sin resolver') || m.includes('sin aplicar') || m.includes('pendiente'))
        return { tag: 'PENDIENTES', desc: msg };
      if (m.includes('no configurada') || m.includes('not configured') || m.includes('missing'))
        return { tag: 'VAR_FALTANTE', desc: msg };
      if (m.includes('invalid api key') || m.includes('authentication') || m.includes('unauthorized') || m.includes('api key') || m.includes('401'))
        return { tag: 'CLAVE_INVÁLIDA', desc: msg };
      if (m.includes('rate limit') || m.includes('429') || m.includes('too many'))
        return { tag: 'RATE_LIMIT', desc: msg };
      if (m.includes('timeout') || m.includes('timed out') || m.includes('connection') || m.includes('network'))
        return { tag: 'RED/TIMEOUT', desc: msg };
      if (m.includes('permission') || m.includes('403') || m.includes('forbidden') || m.includes('access denied'))
        return { tag: 'SIN_PERMISO', desc: msg };
      if (m.includes('500') || m.includes('server error') || m.includes('internal'))
        return { tag: 'ERROR_SERVIDOR', desc: msg };
      if (m.includes('http '))
        return { tag: 'HTTP_ERROR', desc: msg };
      return { tag: 'ERROR_API', desc: msg };
    }

    async function verificarIntegraciones() {
      const btn = document.getElementById('sa-btnVerificar');
      if (btn) { btn.disabled = true; btn.textContent = 'Verificando...'; }

      Object.keys(_SA_INTEG_META).forEach(key => {
        const led   = document.getElementById('sa-led-'   + key);
        const badge = document.getElementById('sa-badge-' + key);
        const card  = document.getElementById('sa-integ-' + key);
        if (led)   led.className      = 'led led-yellow';
        if (badge) { badge.textContent = '…'; badge.className = 'integ-badge gray'; }
        if (card)  { card.querySelector('.integ-error-detail')?.remove(); card.querySelector('.integ-warn-detail')?.remove(); }
      });

      try {
        const headers = await getAuthHeaders();
        const res = await fetch(`${BACKEND_URL}/health/integraciones`, { headers });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        Object.entries(data.integraciones).forEach(([key, info]) => {
          const led   = document.getElementById('sa-led-'   + key);
          const badge = document.getElementById('sa-badge-' + key);
          const card  = document.getElementById('sa-integ-' + key);
          if (!led) return;
          const meta = _SA_INTEG_META[key] || {};

          if (info.status === 'ok') {
            led.className     = 'led led-green';
            card.className    = 'integ-card';
            const txt = (info.latency_ms != null ? `${info.latency_ms} ms` : '')
                      + (meta.extraFn ? ' · ' + meta.extraFn(info) : '');
            badge.textContent = txt.replace(/^ · /, '');
            badge.className   = 'integ-badge ok';

          } else if (info.status === 'warning') {
            led.className     = 'led led-yellow';
            card.className    = 'integ-card';
            badge.textContent = info.pendientes + (info.pendientes === 1 ? ' pendiente' : ' pendientes');
            badge.className   = 'integ-badge warn';
            const warnDiv = document.createElement('div');
            warnDiv.className = 'integ-warn-detail';
            warnDiv.textContent = info.message || '';
            badge.parentNode.appendChild(warnDiv);

          } else {
            const err = _sa_classifyError(key, info.error);
            led.className     = 'led led-red';
            card.className    = 'integ-card';
            badge.textContent = err.tag;
            badge.className   = 'integ-badge err';

            const detail  = document.createElement('div');  detail.className  = 'integ-error-detail';
            const tagEl   = document.createElement('div');  tagEl.className   = 'integ-error-tag';   tagEl.textContent  = err.tag;
            const msgEl   = document.createElement('div');  msgEl.className   = 'integ-error-msg';   msgEl.textContent  = err.desc;
            const copyBtn = document.createElement('button'); copyBtn.className = 'integ-copy-btn'; copyBtn.textContent = '⎘ Copiar error';
            const clipText = `INTEGRACIÓN: ${key.toUpperCase()}\nCLASIFICACIÓN: ${err.tag}\nERROR: ${err.desc}`;
            copyBtn.addEventListener('click', () => {
              navigator.clipboard.writeText(clipText).then(() => {
                copyBtn.textContent = '✓ Copiado';
                setTimeout(() => { copyBtn.textContent = '⎘ Copiar error'; }, 1400);
              });
            });
            detail.appendChild(tagEl); detail.appendChild(msgEl); detail.appendChild(copyBtn);
            badge.parentNode.appendChild(detail);
          }
        });

        // Ordenar: error → warning → ok
        const grid = document.querySelector('#sa-panel-resumen .integ-grid');
        if (grid) {
          const _orden = c => c.querySelector('.integ-badge.err') ? 0 : c.querySelector('.integ-badge.warn') ? 1 : 2;
          Array.from(grid.querySelectorAll('.integ-card'))
            .sort((a, b) => _orden(a) - _orden(b))
            .forEach(c => grid.appendChild(c));
        }

        const ts = document.getElementById('sa-integLastCheck');
        if (ts) {
          const hora = new Date(data.timestamp).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
          ts.textContent = `· verificado ${hora}`;
        }

      } catch(e) {
        Object.keys(_SA_INTEG_META).forEach(key => {
          const led = document.getElementById('sa-led-' + key);
          if (led) led.className = 'led led-gray';
        });
        const ts = document.getElementById('sa-integLastCheck');
        if (ts) ts.textContent = '· no se pudo conectar al servidor';
        console.error('verificarIntegraciones:', e);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = '↺ Verificar'; }
      }
    }

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

    let _sa_eliminarUserId = null;
    let _sa_eliminarOpA = 0, _sa_eliminarOpB = 0;

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

    // ── SA: Plataforma ────────────────────────────────────────────

    let _sa_transferirPlaneacionId = null;

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

    // ── SA: Gestión de roles ──────────────────────────────────────

    let _sa_unified_all    = [];
    let _sa_extraMap       = {};
    let _sa_planMap        = {};
    let _sa_promoverUserId = null;

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

    async function saConfirmarDegradaAdmin(adminId, nombre) {
      if (!confirm(`¿Degradar a "${nombre}" de Admin a Usuario? Perderá acceso al panel de administración.`)) return;
      const { error } = await _supabase.from('profiles').update({ rol: 'user' }).eq('id', adminId);
      if (error) { alert('Error: ' + error.message); return; }
      mostrarToast(`${nombre} degradado a Usuario`);
      await Promise.all([saCargarStats(), saCargarTablaUnificada()]);
    }

    async function saToggleRol(userId, rolActualPerfil, role, estaActivo) {
      try {
        // Roles extra (asesor / evaluador) — vía ERP API
        if (role === 'asesor' || role === 'evaluador') {
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
            // Override confirm button para contexto SA
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
      const rolesActivos = _sa_getUserRoles(u);
      chipsWrap.innerHTML = _SA_ALL_ROLES.map(r => {
        const on  = rolesActivos.has(r.id);
        const cls = r.locked ? 'rchip locked' : (on ? 'rchip on' : 'rchip off');
        const oc  = r.locked ? '' : `onclick="saToggleRol('${u.id}','${u.rol}','${r.id}',${on})"`;
        const tip = r.locked ? 'Rol base — siempre activo' : (on ? 'Clic para desactivar' : 'Clic para activar');
        return `<span class="${cls}" data-role="${r.id}" ${oc} title="${tip}">${r.label}</span>`;
      }).join('');
    }

    // ── SA: Plantillas de email ──────────────────────────────────────────────

    let _sa_tpls = [];

    async function saCargarPlantillas() {
      const list = document.getElementById('sa-tplList');
      list.innerHTML = '<p class="loading-txt">Cargando plantillas...</p>';
      try {
        const data = await apiFetch('/email/templates');
        _sa_tpls = data;
        if (!data.length) {
          list.innerHTML = '<p class="empty-txt">No hay plantillas configuradas.</p>';
          return;
        }
        list.innerHTML = data.map(t => {
          const upd = t.updated_at
            ? new Date(t.updated_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })
            : '—';
          const vars = (t.variables || [])
            .map(v => `<span class="tpl-var-chip" style="cursor:default" title="{{${v}}}">${v}</span>`)
            .join('');
          return `<div class="tpl-card" id="sa-tpl-card-${t.slug}" onclick="saEditarTemplate('${t.slug}')">
            <div class="tpl-slug">${t.slug}</div>
            <div class="tpl-nombre">${t.nombre || t.slug}</div>
            <div class="tpl-updated">Actualizado: ${upd}</div>
            ${vars ? `<div class="tpl-vars" style="margin-top:8px">${vars}</div>` : ''}
          </div>`;
        }).join('');
      } catch(e) {
        list.innerHTML = `<p class="error-txt">Error al cargar plantillas: ${e.message}</p>`;
      }
    }

    async function saEditarTemplate(slug) {
      _sa_tplSlugActivo = slug;

      document.querySelectorAll('.tpl-card').forEach(c => c.classList.remove('active'));
      const card = document.getElementById(`sa-tpl-card-${slug}`);
      if (card) card.classList.add('active');

      const editor = document.getElementById('sa-tplEditor');
      editor.classList.add('visible');
      editor.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

      document.getElementById('sa-tplEditorTitle').textContent = 'Cargando...';
      document.getElementById('sa-tplMsg').textContent = '';
      document.getElementById('sa-tplSubject').value = '';
      document.getElementById('sa-tplBodyHtml').value = '';
      document.getElementById('sa-tplVarsChips').innerHTML = '';
      document.getElementById('sa-tplPreviewFrame').srcdoc = '';

      try {
        const tpl = await apiFetch(`/email/templates/${slug}`);
        document.getElementById('sa-tplEditorTitle').textContent = `Editando: ${tpl.nombre || slug}`;
        document.getElementById('sa-tplSubject').value  = tpl.subject   || '';
        document.getElementById('sa-tplBodyHtml').value = tpl.body_html || '';

        const vars = tpl.variables || [];
        document.getElementById('sa-tplVarsChips').innerHTML = vars.length
          ? vars.map(v =>
              `<button class="tpl-var-chip" type="button" onclick="saInsertarVariable('${v}')" title="Insertar {{${v}}}">${v}</button>`
            ).join('')
          : '<span style="font-size:12px;color:var(--c-text-3)">Sin variables definidas</span>';

        saActualizarPreview();
      } catch(e) {
        document.getElementById('sa-tplEditorTitle').textContent = 'Error al cargar plantilla';
        document.getElementById('sa-tplMsg').textContent = 'Error: ' + e.message;
        document.getElementById('sa-tplMsg').className = 'crear-msg err';
      }
    }

    function saInsertarVariable(varName) {
      const ta    = document.getElementById('sa-tplBodyHtml');
      const texto = `{{${varName}}}`;
      const start = ta.selectionStart;
      const end   = ta.selectionEnd;
      ta.value = ta.value.slice(0, start) + texto + ta.value.slice(end);
      ta.selectionStart = ta.selectionEnd = start + texto.length;
      ta.focus();
      saActualizarPreview();
    }

    function saActualizarPreview() {
      const html  = document.getElementById('sa-tplBodyHtml').value;
      const frame = document.getElementById('sa-tplPreviewFrame');
      frame.srcdoc = html || '<p style="color:#aaa;padding:16px;font-family:sans-serif">El HTML del email aparecerá aquí.</p>';
    }

    async function saGuardarTemplate() {
      if (!_sa_tplSlugActivo) return;
      const btn  = document.getElementById('sa-btnTplSave');
      const msg  = document.getElementById('sa-tplMsg');
      const subj = document.getElementById('sa-tplSubject').value.trim();
      const html = document.getElementById('sa-tplBodyHtml').value;

      if (!subj) {
        msg.textContent = 'El asunto no puede estar vacío.';
        msg.className   = 'crear-msg err';
        return;
      }

      btn.disabled = true; btn.textContent = 'Guardando...'; msg.textContent = '';
      try {
        await apiFetch(`/email/templates/${_sa_tplSlugActivo}`, {
          method: 'PUT',
          body:   { subject: subj, body_html: html },
        });
        msg.textContent = '✓ Plantilla guardada correctamente.';
        msg.className   = 'crear-msg ok';
        mostrarToast('Plantilla guardada');
        await saCargarPlantillas();
        document.querySelectorAll('.tpl-card').forEach(c => c.classList.remove('active'));
        const c = document.getElementById(`sa-tpl-card-${_sa_tplSlugActivo}`);
        if (c) c.classList.add('active');
      } catch(e) {
        msg.textContent = 'Error al guardar: ' + e.message;
        msg.className   = 'crear-msg err';
      } finally {
        btn.disabled = false; btn.textContent = 'Guardar cambios';
      }
    }

    async function saTestearTemplate() {
      if (!_sa_tplSlugActivo) return;
      const correo = (_perfil && _perfil.email)
        ? _perfil.email
        : prompt('¿A qué correo enviar la prueba?');
      if (!correo) return;
      const btn = document.getElementById('sa-btnTplTest');
      const msg = document.getElementById('sa-tplMsg');
      btn.disabled = true; btn.textContent = 'Enviando...'; msg.textContent = '';
      try {
        await apiFetch('/email/test', { method: 'POST', body: { slug: _sa_tplSlugActivo, to: correo } });
        msg.textContent = `✓ Email de prueba enviado a ${correo}.`;
        msg.className   = 'crear-msg ok';
      } catch(e) {
        msg.textContent = 'Error al enviar prueba: ' + e.message;
        msg.className   = 'crear-msg err';
      } finally {
        btn.disabled = false; btn.textContent = 'Enviar prueba';
      }
    }

    // ── SA: Soporte — helpers de escape ─────────────────────────────────────

    function _esc(t)     { return String(t).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
    function _escAttr(t) { return _esc(t).replace(/"/g,'&quot;'); }

    // ── SA: Soporte — inner tabs ─────────────────────────────────────────────

    let _sa_tickets          = [];
    let _sa_ticketIdActivo   = null;
    let _sa_soporteLoaded    = { tickets: false, sugerencias: false, kb: false, 'bajo-rendimiento': false };

    function saShowSoporteTab(name) {
      document.querySelectorAll('#sa-panel-soporte .sp-tab-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('#sa-panel-soporte .sp-panel').forEach(p => p.classList.remove('active'));
      const btn   = document.getElementById('sa-sptab-'   + name);
      const panel = document.getElementById('sa-sppanel-' + name);
      if (btn)   btn.classList.add('active');
      if (panel) panel.classList.add('active');
      if (name === 'tickets'          && !_sa_soporteLoaded.tickets)          { _sa_soporteLoaded.tickets          = true; saCargarTicketsSA(); }
      if (name === 'sugerencias'      && !_sa_soporteLoaded.sugerencias)      { _sa_soporteLoaded.sugerencias      = true; saCargarSugerencias('pendiente'); }
      if (name === 'kb'               && !_sa_soporteLoaded.kb)               { _sa_soporteLoaded.kb               = true; saCargarFaqs(); saCargarRecursos(); }
      if (name === 'bajo-rendimiento' && !_sa_soporteLoaded['bajo-rendimiento']) { _sa_soporteLoaded['bajo-rendimiento'] = true; saCargarBajoRendimiento(); }
    }

    // ── Logs de actividad ─────────────────────────────────────────────────────

    const _LOG_BADGES = {
      'wizard.curso.creado':    ['#15803d', '🆕 Curso creado'],
      'wizard.paso.completado': ['#1d4ed8', '✅ Paso completado'],
      'wizard.sync.error':      ['#b45309', '⚠️ Error sync'],
      'wizard.descarga.ok':     ['#0f766e', '⬇️ Descarga OK'],
      'wizard.descarga.error':  ['#b91c1c', '❌ Error descarga'],
    };

    function _saLogBadge(eventType) {
      const [color, label] = _LOG_BADGES[eventType] || ['#6b7280', eventType];
      return `<span style="display:inline-block;padding:2px 8px;border-radius:20px;font-size:11px;font-weight:700;color:#fff;background:${color}">${label}</span>`;
    }

    function _saLogMeta(metadata) {
      if (!metadata || !Object.keys(metadata).length) return '—';
      return Object.entries(metadata)
        .map(([k, v]) => `<span style="color:var(--c-text-3)">${k}:</span> ${String(v).slice(0, 80)}`)
        .join(' &nbsp;·&nbsp; ');
    }

    async function saCargarLogs() {
      const el    = document.getElementById('sa-logs-tabla');
      const tipo  = document.getElementById('sa-logs-filtro-tipo')?.value  || '';
      const desde = document.getElementById('sa-logs-filtro-desde')?.value || '';
      const hasta = document.getElementById('sa-logs-filtro-hasta')?.value || '';
      const usFilt = (document.getElementById('sa-logs-filtro-usuario')?.value || '').trim().toLowerCase();

      el.innerHTML = '<p class="loading-txt">Cargando...</p>';

      let q = _supabase
        .from('event_logs')
        .select('id, event_type, metadata, created_at, profiles(nombre, apellido, email)')
        .order('created_at', { ascending: false })
        .limit(500);

      if (tipo)  q = q.eq('event_type', tipo);
      if (desde) q = q.gte('created_at', desde + 'T00:00:00');
      if (hasta) q = q.lte('created_at', hasta + 'T23:59:59');

      const { data, error } = await q;
      if (error) { el.innerHTML = `<p class="error-txt">Error: ${error.message}</p>`; return; }

      let rows = data || [];
      if (usFilt) {
        rows = rows.filter(r => {
          const p = r.profiles;
          return p && (
            (p.nombre   || '').toLowerCase().includes(usFilt) ||
            (p.apellido || '').toLowerCase().includes(usFilt) ||
            (p.email    || '').toLowerCase().includes(usFilt)
          );
        });
      }

      if (!rows.length) {
        el.innerHTML = '<p class="empty-txt" style="padding:24px 0">Sin registros con estos filtros.</p>';
        return;
      }

      el.innerHTML = `<div class="table-wrap"><table class="data-table">
        <thead><tr>
          <th>Fecha</th><th>Usuario</th><th>Evento</th><th>Detalle</th>
        </tr></thead>
        <tbody>${rows.map(r => {
          const p      = r.profiles;
          const nombre = p
            ? ([p.nombre, p.apellido].filter(Boolean).join(' ') || p.email || '—')
            : '<span style="color:var(--c-text-3);font-size:11px">(usuario eliminado)</span>';
          const fecha  = new Date(r.created_at).toLocaleString('es-MX', { dateStyle: 'short', timeStyle: 'short' });
          return `<tr>
            <td style="white-space:nowrap;font-size:11px;color:var(--c-text-3)">${fecha}</td>
            <td style="font-size:12px">${nombre}</td>
            <td>${_saLogBadge(r.event_type)}</td>
            <td style="font-size:11px">${_saLogMeta(r.metadata)}</td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>
      <p style="font-size:11px;color:var(--c-text-3);margin-top:8px;text-align:right">
        ${rows.length} registro${rows.length !== 1 ? 's' : ''}
      </p>`;
    }

    // ─────────────────────────────────────────────────────────────────────────

    async function saCargarKB() {
      // Carga inicial al abrir el tab Soporte: tickets + badges
      saCargarTicketsSA();
      _sa_soporteLoaded.tickets = true;
      sa_CargarBadges();
    }

    async function sa_CargarBadges() {
      try {
        const tickets = await apiFetch('/soporte/tickets');
        const abiertos = (tickets || []).filter(t => t.estado !== 'resuelto').length;
        const badgeT = document.getElementById('sa-sp-badge-tickets');
        if (badgeT) badgeT.textContent = abiertos || '';

        const sugs = await apiFetch('/soporte/sugerencias?estado=pendiente');
        const badgeS = document.getElementById('sa-sp-badge-sugerencias');
        if (badgeS) badgeS.textContent = (sugs || []).length || '';
      } catch(_) { /* badges son decorativos */ }
    }

    // ── SA: Tickets ──────────────────────────────────────────────────────────

    async function saCargarTicketsSA() {
      const el = document.getElementById('sa-listaTicketsSA');
      el.innerHTML = '<p class="loading-txt">Cargando tickets...</p>';
      try {
        const data = await apiFetch('/soporte/tickets');
        _sa_tickets = data || [];
        sa_RenderTablaTicketsSA(_sa_tickets);
      } catch(e) {
        el.innerHTML = `<p class="error-txt">Error: ${e.message}</p>`;
      }
    }

    function saFiltrarTicketsSA(q) {
      if (!q.trim()) { sa_RenderTablaTicketsSA(_sa_tickets); return; }
      const lq = q.toLowerCase();
      sa_RenderTablaTicketsSA(_sa_tickets.filter(t =>
        (t.asunto       || '').toLowerCase().includes(lq) ||
        (t.user_email   || '').toLowerCase().includes(lq) ||
        (t.user_nombre  || '').toLowerCase().includes(lq) ||
        (t.categoria    || '').toLowerCase().includes(lq) ||
        String(t.numero || '').includes(lq)
      ));
    }

    function sa_RenderTablaTicketsSA(tickets) {
      const el = document.getElementById('sa-listaTicketsSA');
      if (!tickets.length) { el.innerHTML = '<p class="empty-txt">No hay tickets.</p>'; return; }
      el.innerHTML = `<div class="table-wrap"><table class="data-table">
        <thead><tr>
          <th>#</th><th>Asunto</th><th>Usuario</th><th>Categoría</th><th>Estado</th><th>Fecha</th><th></th>
        </tr></thead>
        <tbody>${tickets.map(t => {
          const fecha = new Date(t.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
          const cls   = `status-badge badge-${t.estado}`;
          const label = t.estado === 'nuevo' ? 'Nuevo' : t.estado === 'en_revision' ? 'En revisión' : 'Resuelto';
          const nom   = t.user_nombre || t.user_email || '—';
          return `<tr>
            <td style="font-weight:700;color:var(--c-text-3)">#${t.numero || '—'}</td>
            <td style="font-weight:600;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${t.asunto || '(Sin asunto)'}</td>
            <td style="font-size:12px;color:var(--c-text-3)">${nom}</td>
            <td><span style="font-size:11px">${t.categoria || '—'}</span></td>
            <td><span class="${cls}">${label}</span></td>
            <td style="font-size:12px;color:var(--c-text-3);white-space:nowrap">${fecha}</td>
            <td><button class="btn-sm" onclick="saAbrirTicketSA('${t.id}')">Ver</button></td>
          </tr>`;
        }).join('')}</tbody>
      </table></div>`;
    }

    async function saAbrirTicketSA(ticketId) {
      _sa_ticketIdActivo = ticketId;
      const modal = document.getElementById('sa-modalTicketSA');
      const body  = document.getElementById('sa-modalTicketBody');
      body.innerHTML = '<p class="loading-txt" style="padding:20px">Cargando ticket...</p>';
      modal.classList.add('open');
      try {
        const t = await apiFetch(`/soporte/tickets/${ticketId}`);
        const fecha = new Date(t.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
        const estadoCls = `status-badge badge-${t.estado}`;
        const estadoLabel = t.estado === 'nuevo' ? 'Nuevo' : t.estado === 'en_revision' ? 'En revisión' : 'Resuelto';

        // Transcript
        let transcriptHtml = '';
        if (Array.isArray(t.transcript) && t.transcript.length) {
          const msgs = t.transcript.map(m => {
            const isUser = m.role === 'user';
            return `<div class="ct-msg ${isUser ? 'ct-msg--user' : 'ct-msg--assistant'}">
              <div>
                <div class="ct-role-label">${isUser ? '👤 Usuario' : '🤖 IA'}</div>
                <div class="ct-bubble">${_esc(m.content || '')}</div>
              </div>
            </div>`;
          }).join('');
          transcriptHtml = `
            <div class="sa-modal-section" style="margin-bottom:14px">
              <div class="tk-label">Conversación IA</div>
              <div class="chat-transcript">${msgs}</div>
            </div>`;
        }

        // Estado actual y acciones
        const resuelto = t.estado === 'resuelto';
        const resolucionActual = resuelto && t.resolucion
          ? `<div class="sa-modal-section" style="margin-bottom:14px">
              <div class="tk-label">Resolución aplicada</div>
              <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:var(--r-md);padding:12px 14px;font-size:13px;color:#166534">${_esc(t.resolucion)}</div>
            </div>`
          : '';

        const notasInternas = t.notas_internas
          ? `<div class="sa-modal-section" style="margin-bottom:14px">
              <div class="tk-label">Notas internas</div>
              <div style="font-size:13px;color:var(--c-text-3)">${_esc(t.notas_internas)}</div>
            </div>`
          : '';

        const formResolucion = !resuelto ? `
          <div class="sa-modal-section" style="margin-bottom:14px">
            <label class="tk-label" for="sa-ticketResolucion">Resolución</label>
            <textarea class="tk-textarea" id="sa-ticketResolucion" rows="4"
              placeholder="Describe la solución para el usuario...">${_esc(t.resolucion || '')}</textarea>
          </div>
          <p class="form-msg" id="sa-ticketMsg"></p>
          <div class="modal-btns" style="margin-top:8px">
            ${t.estado === 'nuevo'
              ? `<button class="btn-sm" id="sa-btnEnRevision" onclick="saCambiarEstadoTicketSA('${t.id}','en_revision')">Poner en revisión</button>`
              : ''}
            <button class="btn-primary" id="sa-btnResolver" onclick="saResolverTicketSA('${t.id}')">✓ Marcar resuelto</button>
          </div>` : '';

        body.innerHTML = `
          <div class="sa-modal-title" style="margin-bottom:4px">#${t.numero || ''} ${_esc(t.asunto || '(Sin asunto)')}</div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;margin-bottom:18px">
            <span class="${estadoCls}">${estadoLabel}</span>
            ${t.prioridad ? `<span style="font-size:11px;color:var(--c-text-3)">Prioridad: ${t.prioridad}</span>` : ''}
            <span style="font-size:11px;color:var(--c-text-3)">${t.user_nombre || ''} &lt;${t.user_email || ''}&gt;</span>
            <span style="font-size:11px;color:var(--c-text-3)">${fecha}</span>
            ${t.pagina_origen ? `<span style="font-size:11px;color:var(--c-text-3)">Página: ${_esc(t.pagina_origen)}</span>` : ''}
          </div>
          ${transcriptHtml}
          ${notasInternas}
          ${resolucionActual}
          ${formResolucion}`;
      } catch(e) {
        body.innerHTML = `<p class="error-txt" style="padding:20px">Error: ${e.message}</p>`;
      }
    }

    async function saCambiarEstadoTicketSA(ticketId, estado) {
      const btn = document.getElementById('sa-btnEnRevision');
      if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
      try {
        await apiFetch(`/soporte/tickets/${ticketId}`, { method: 'PATCH', body: { estado } });
        mostrarToast(`Ticket marcado: ${estado === 'en_revision' ? 'en revisión' : estado}`);
        saCerrarTicketModalSA();
        saCargarTicketsSA();
        sa_CargarBadges();
      } catch(e) {
        const msg = document.getElementById('sa-ticketMsg');
        if (msg) { msg.textContent = 'Error: ' + e.message; msg.className = 'form-msg err'; }
        if (btn) { btn.disabled = false; btn.textContent = 'Poner en revisión'; }
      }
    }

    async function saResolverTicketSA(ticketId) {
      const resolucion = (document.getElementById('sa-ticketResolucion')?.value || '').trim();
      if (!resolucion) {
        const msg = document.getElementById('sa-ticketMsg');
        if (msg) { msg.textContent = 'Escribe una resolución antes de cerrar el ticket.'; msg.className = 'form-msg err'; }
        return;
      }
      const btn = document.getElementById('sa-btnResolver');
      if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
      try {
        await apiFetch(`/soporte/tickets/${ticketId}`, {
          method: 'PATCH',
          body:   { estado: 'resuelto', resolucion },
        });
        mostrarToast('Ticket resuelto');
        saCerrarTicketModalSA();
        saCargarTicketsSA();
        sa_CargarBadges();
      } catch(e) {
        const msg = document.getElementById('sa-ticketMsg');
        if (msg) { msg.textContent = 'Error: ' + e.message; msg.className = 'form-msg err'; }
        if (btn) { btn.disabled = false; btn.textContent = '✓ Marcar resuelto'; }
      }
    }

    function saCerrarTicketModalSA(e) {
      if (e && e.target !== document.getElementById('sa-modalTicketSA')) return;
      document.getElementById('sa-modalTicketSA').classList.remove('open');
      _sa_ticketIdActivo = null;
    }

    // ── SA: KB — FAQs y Recursos ─────────────────────────────────────────────

    let _sa_faqs     = [];
    let _sa_recursos = [];

    function saToggleKBSection(bodyId) {
      const body    = document.getElementById(bodyId);
      const section = body?.parentElement;
      if (!section) return;
      section.classList.toggle('open');
      const arrow = section.querySelector('.arrow');
      if (arrow) arrow.textContent = section.classList.contains('open') ? '▼' : '▶';
    }

    function saFiltrarKB() {
      const q = (document.getElementById('sa-kbSearch')?.value || '').toLowerCase();
      sa_RenderFaqsFiltered(q);
      sa_RenderRecursosFiltered(q);
    }

    // ── FAQs ─────────────────────────────────────────────────────────────────

    async function saCargarFaqs() {
      const el = document.getElementById('sa-listaFaqs');
      el.innerHTML = '<p class="loading-txt">Cargando FAQs...</p>';
      try {
        _sa_faqs = await apiFetch('/soporte/faqs') || [];
        const countEl = document.getElementById('sa-faqCount');
        if (countEl) countEl.textContent = _sa_faqs.length || '';
        sa_RenderFaqsFiltered('');
      } catch(e) {
        el.innerHTML = `<p class="error-txt">Error al cargar FAQs: ${e.message}</p>`;
      }
    }

    function sa_RenderFaqsFiltered(q) {
      const el = document.getElementById('sa-listaFaqs');
      if (!el) return;
      const lista = q
        ? _sa_faqs.filter(f =>
            (f.pregunta   || '').toLowerCase().includes(q) ||
            (f.respuesta  || '').toLowerCase().includes(q) ||
            (f.categoria  || '').toLowerCase().includes(q) ||
            (f.contexto   || '').toLowerCase().includes(q))
        : _sa_faqs;

      if (!lista.length) {
        el.innerHTML = `<p class="empty-txt">${q ? 'Sin resultados.' : 'No hay FAQs.'}</p>`;
        return;
      }
      el.innerHTML = lista.map(f => {
        const util = f.votos_util     || 0;
        const neg  = f.votos_negativo || 0;
        const exp  = f.exposiciones   || 0;
        return `<div style="border:1px solid var(--c-border);border-radius:var(--r-lg);padding:14px 16px;margin-bottom:10px;background:var(--c-surface)">
          <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap">
            <div style="flex:1;min-width:0">
              <div style="font-weight:700;font-size:13px;color:var(--c-text);margin-bottom:4px">${_esc(f.pregunta)}</div>
              <div style="font-size:12px;color:var(--c-text-3);margin-bottom:6px;line-height:1.5">${_esc(f.respuesta)}</div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
                <span class="norma-badge" style="font-size:10px">${_esc(f.categoria || 'general')}</span>
                <span style="font-size:10px;color:var(--c-text-3)">ctx: ${_esc(f.contexto || 'general')}</span>
                <span style="font-size:10px;color:var(--c-text-3)">👍 ${util} | 👎 ${neg} | 👁 ${exp}</span>
              </div>
            </div>
            <div style="display:flex;gap:6px;flex-shrink:0">
              <button class="btn-sm" onclick="saAbrirEditarFaq('${f.id}')">Editar</button>
              <button class="btn-sm" style="color:#dc2626;border-color:#fca5a5" onclick="saEliminarFaq('${f.id}')">Eliminar</button>
            </div>
          </div>
        </div>`;
      }).join('');
    }

    async function saGuardarFaq() {
      const pregunta  = (document.getElementById('sa-faqPregunta')?.value  || '').trim();
      const respuesta = (document.getElementById('sa-faqRespuesta')?.value || '').trim();
      const categoria = (document.getElementById('sa-faqCategoria')?.value || 'general').trim();
      const contexto  = (document.getElementById('sa-faqContexto')?.value  || 'general');
      const msg       = document.getElementById('sa-faqMsg');
      const btn       = document.getElementById('sa-btnGuardarFaq');

      if (!pregunta || !respuesta) {
        if (msg) { msg.textContent = 'Pregunta y respuesta son obligatorias.'; msg.className = 'form-msg err'; }
        return;
      }
      if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
      if (msg) msg.textContent = '';
      try {
        await apiFetch('/soporte/faqs', { method: 'POST', body: { pregunta, respuesta, categoria, contexto } });
        if (msg) { msg.textContent = '✓ FAQ guardada.'; msg.className = 'form-msg ok'; }
        // limpiar form
        ['sa-faqPregunta','sa-faqRespuesta'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        mostrarToast('FAQ guardada');
        await saCargarFaqs();
        // abrir sección si estaba cerrada
        const section = document.getElementById('sa-kbFaqsSection');
        if (section && !section.classList.contains('open')) saToggleKBSection('sa-kbFaqsBody');
      } catch(e) {
        if (msg) { msg.textContent = 'Error: ' + e.message; msg.className = 'form-msg err'; }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Guardar FAQ'; }
      }
    }

    function saAbrirEditarFaq(id) {
      const faq = _sa_faqs.find(f => f.id === id);
      if (!faq) return;
      document.getElementById('sa-editFaqId').value        = faq.id;
      document.getElementById('sa-editFaqPregunta').value  = faq.pregunta  || '';
      document.getElementById('sa-editFaqRespuesta').value = faq.respuesta || '';
      document.getElementById('sa-editFaqCategoria').value = faq.categoria || 'general';
      document.getElementById('sa-editFaqContexto').value  = faq.contexto  || 'general';
      document.getElementById('sa-editFaqMsg').textContent = '';
      document.getElementById('sa-modalEditarFaq').classList.add('open');
    }

    async function saGuardarEdicionFaq() {
      const id        = document.getElementById('sa-editFaqId').value;
      const pregunta  = (document.getElementById('sa-editFaqPregunta')?.value  || '').trim();
      const respuesta = (document.getElementById('sa-editFaqRespuesta')?.value || '').trim();
      const categoria = (document.getElementById('sa-editFaqCategoria')?.value || 'general').trim();
      const contexto  = (document.getElementById('sa-editFaqContexto')?.value  || 'general');
      const msg       = document.getElementById('sa-editFaqMsg');
      const btn       = document.getElementById('sa-btnGuardarEdicionFaq');

      if (!pregunta || !respuesta) {
        msg.textContent = 'Pregunta y respuesta son obligatorias.'; msg.className = 'form-msg err'; return;
      }
      btn.disabled = true; btn.textContent = 'Guardando...'; msg.textContent = '';
      try {
        await apiFetch(`/soporte/faqs/${id}`, { method: 'PATCH', body: { pregunta, respuesta, categoria, contexto } });
        mostrarToast('FAQ actualizada');
        saCerrarModalEditarFaq();
        await saCargarFaqs();
      } catch(e) {
        msg.textContent = 'Error: ' + e.message; msg.className = 'form-msg err';
      } finally {
        btn.disabled = false; btn.textContent = 'Guardar cambios';
      }
    }

    function saCerrarModalEditarFaq(e) {
      if (e && e.target !== document.getElementById('sa-modalEditarFaq')) return;
      document.getElementById('sa-modalEditarFaq').classList.remove('open');
    }

    async function saEliminarFaq(faqId) {
      const faq = _sa_faqs.find(f => f.id === faqId);
      const preg = faq ? `"${faq.pregunta.slice(0, 60)}..."` : 'esta FAQ';
      if (!confirm(`¿Eliminar ${preg}? Esta acción desactiva la FAQ del sistema.`)) return;
      try {
        await apiFetch(`/soporte/faqs/${faqId}`, { method: 'DELETE' });
        mostrarToast('FAQ eliminada');
        await saCargarFaqs();
      } catch(e) {
        alert('Error al eliminar: ' + e.message);
      }
    }

    // ── Recursos ─────────────────────────────────────────────────────────────

    async function saCargarRecursos() {
      const el = document.getElementById('sa-listaRecursos');
      el.innerHTML = '<p class="loading-txt">Cargando recursos...</p>';
      try {
        _sa_recursos = await apiFetch('/soporte/recursos') || [];
        const countEl = document.getElementById('sa-recursosCount');
        if (countEl) countEl.textContent = _sa_recursos.length || '';
        sa_RenderRecursosFiltered('');
      } catch(e) {
        el.innerHTML = `<p class="error-txt">Error al cargar recursos: ${e.message}</p>`;
      }
    }

    function sa_RenderRecursosFiltered(q) {
      const el = document.getElementById('sa-listaRecursos');
      if (!el) return;
      const lista = q
        ? _sa_recursos.filter(r =>
            (r.titulo   || '').toLowerCase().includes(q) ||
            (r.contexto || '').toLowerCase().includes(q) ||
            (r.tipo     || '').toLowerCase().includes(q))
        : _sa_recursos;

      if (!lista.length) {
        el.innerHTML = `<p class="empty-txt">${q ? 'Sin resultados.' : 'No hay recursos.'}</p>`;
        return;
      }
      const tipoLabel = { articulo: 'Artículo', video: 'Video', guia: 'Guía', plantilla: 'Plantilla' };
      el.innerHTML = lista.map(r => {
        const fecha = new Date(r.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
        const urlHtml = r.url
          ? `<a href="${_escAttr(r.url)}" target="_blank" rel="noopener" style="font-size:11px;color:var(--c-blue-600)">${_esc(r.url)}</a>`
          : '';
        return `<div style="border:1px solid var(--c-border);border-radius:var(--r-lg);padding:14px 16px;margin-bottom:10px;background:var(--c-surface);display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap">
          <div style="flex:1;min-width:0">
            <div style="font-weight:700;font-size:13px;color:var(--c-text);margin-bottom:3px">${_esc(r.titulo)}</div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
              <span class="norma-badge" style="font-size:10px">${tipoLabel[r.tipo] || r.tipo}</span>
              <span style="font-size:10px;color:var(--c-text-3)">ctx: ${_esc(r.contexto || 'general')}</span>
              <span style="font-size:10px;color:var(--c-text-3)">${fecha}</span>
              ${urlHtml}
            </div>
          </div>
          <button class="btn-sm" style="flex-shrink:0;color:#dc2626;border-color:#fca5a5" onclick="saEliminarRecurso('${r.id}')">Eliminar</button>
        </div>`;
      }).join('');
    }

    async function saGuardarRecurso() {
      const titulo    = (document.getElementById('sa-recursoTitulo')?.value    || '').trim();
      const tipo      = (document.getElementById('sa-recursoTipo')?.value      || 'articulo');
      const url       = (document.getElementById('sa-recursoUrl')?.value       || '').trim();
      const contexto  = (document.getElementById('sa-recursoContexto')?.value  || 'general');
      const contenido = (document.getElementById('sa-recursoContenido')?.value || '').trim();
      const msg       = document.getElementById('sa-recursoMsg');
      const btn       = document.getElementById('sa-btnGuardarRecurso');

      if (!titulo) {
        if (msg) { msg.textContent = 'El título es obligatorio.'; msg.className = 'form-msg err'; }
        return;
      }
      if (btn) { btn.disabled = true; btn.textContent = 'Guardando...'; }
      if (msg) msg.textContent = '';
      try {
        const res = await apiFetch('/soporte/recursos', { method: 'POST', body: { titulo, tipo, url, contexto, contenido } });
        const chunks = res.chunks_generados || 0;
        if (msg) { msg.textContent = `✓ Recurso guardado${chunks ? ` (${chunks} chunks)` : ''}.`; msg.className = 'form-msg ok'; }
        ['sa-recursoTitulo','sa-recursoUrl','sa-recursoContenido'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
        mostrarToast('Recurso guardado');
        await saCargarRecursos();
        const section = document.getElementById('sa-kbRecursosSection');
        if (section && !section.classList.contains('open')) saToggleKBSection('sa-kbRecursosBody');
      } catch(e) {
        if (msg) { msg.textContent = 'Error: ' + e.message; msg.className = 'form-msg err'; }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = 'Guardar recurso'; }
      }
    }

    async function saEliminarRecurso(recursoId) {
      const recurso = _sa_recursos.find(r => r.id === recursoId);
      const tit = recurso ? `"${recurso.titulo}"` : 'este recurso';
      if (!confirm(`¿Eliminar ${tit}?`)) return;
      try {
        await apiFetch(`/soporte/recursos/${recursoId}`, { method: 'DELETE' });
        mostrarToast('Recurso eliminado');
        await saCargarRecursos();
      } catch(e) {
        alert('Error al eliminar: ' + e.message);
      }
    }

    // ── SA: Bajo rendimiento ─────────────────────────────────────────────────

    let _sa_br = [];

    async function saCargarBajoRendimiento() {
      const el = document.getElementById('sa-listaBR');
      el.innerHTML = '<p class="loading-txt">Cargando FAQs de bajo rendimiento...</p>';
      try {
        _sa_br = await apiFetch('/soporte/faqs/bajo-rendimiento') || [];
        if (!_sa_br.length) { el.innerHTML = '<p class="empty-txt">¡Todo bien! No hay FAQs con bajo rendimiento.</p>'; return; }
        el.innerHTML = _sa_br.map(f => {
          const util = f.votos_util     || 0;
          const neg  = f.votos_negativo || 0;
          const exp  = f.exposiciones   || 0;
          const pct  = (util + neg) > 0 ? Math.round(neg / (util + neg) * 100) : 0;
          return `<div style="border:1.5px solid #fecaca;border-radius:var(--r-lg);padding:14px 16px;margin-bottom:10px;background:#fff7f7">
            <div style="display:flex;align-items:flex-start;justify-content:space-between;gap:10px;flex-wrap:wrap">
              <div style="flex:1;min-width:0">
                <div style="font-weight:700;font-size:13px;color:var(--c-text);margin-bottom:4px">${_esc(f.pregunta)}</div>
                <div style="font-size:12px;color:var(--c-text-3);margin-bottom:6px;line-height:1.5">${_esc(f.respuesta)}</div>
                <div style="display:flex;gap:10px;flex-wrap:wrap">
                  <span style="font-size:11px;color:#b91c1c;font-weight:700">👎 ${neg} negativos (${pct}%)</span>
                  <span style="font-size:11px;color:var(--c-text-3)">👍 ${util} útiles · 👁 ${exp} exposiciones</span>
                  <span style="font-size:10px;color:var(--c-text-3)">ctx: ${_esc(f.contexto || 'general')} · cat: ${_esc(f.categoria || '—')}</span>
                </div>
              </div>
              <button class="btn-sm" id="sa-br-btn-${f.id}" onclick="saAnalizarFaqCalidadSingle('${f.id}', this)">🤖 Analizar</button>
            </div>
          </div>`;
        }).join('');
      } catch(e) {
        el.innerHTML = `<p class="error-txt">Error: ${e.message}</p>`;
      }
    }

    async function saAnalizarFaqCalidadSingle(faqId, btn) {
      // No hay endpoint individual — llama el batch que procesa todas las candidatas
      if (!confirm('Se analizarán todas las FAQs de bajo rendimiento con IA y se crearán sugerencias. ¿Continuar?')) return;
      await saAnalizarLoteBR(btn);
    }

    async function saAnalizarLoteBR(triggerBtn) {
      const btn = triggerBtn || document.querySelector('[onclick="saAnalizarLoteBR()"]');
      const orig = btn?.textContent || '';
      if (btn) { btn.disabled = true; btn.textContent = '⏳ Analizando...'; }
      try {
        const res = await apiFetch('/soporte/cron/analizar-calidad-faqs', { method: 'POST' });
        const guardadas = res.guardadas ?? res.faqs_analizadas ?? '?';
        mostrarToast(`Análisis completo — ${guardadas} sugerencia(s) creadas`);
        await saCargarBajoRendimiento();
        // Refrescar badges de sugerencias
        sa_CargarBadges();
      } catch(e) {
        alert('Error al analizar: ' + e.message);
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = orig || '🤖 Analizar todas'; }
      }
    }

    // ── SA: Sugerencias IA ───────────────────────────────────────────────────

    const SA_SUG_META = {
      nueva_faq:     { label: '✨ Nueva FAQ',     color: '#059669', bg: '#f0fdf4' },
      editar_faq:    { label: '✏️ Editar FAQ',    color: '#2563eb', bg: '#eff6ff' },
      eliminar_faq:  { label: '🗑️ Eliminar FAQ', color: '#dc2626', bg: '#fff7f7' },
      unir_faqs:     { label: '🔗 Unir FAQs',    color: '#7c3aed', bg: '#faf5ff' },
      nuevo_recurso: { label: '📄 Nuevo recurso', color: '#d97706', bg: '#fffbeb' },
    };

    let _sa_sugerencias    = [];
    let _sa_sugEditMode    = {};   // {sugId: true/false}

    async function saCargarSugerencias(estado = 'pendiente') {
      const el = document.getElementById('sa-listaSugerencias');
      el.innerHTML = '<p class="loading-txt">Cargando sugerencias...</p>';
      try {
        _sa_sugerencias = await apiFetch(`/soporte/sugerencias?estado=${estado}`) || [];
        _sa_sugEditMode = {};
        sa_RenderSugerencias(_sa_sugerencias);
      } catch(e) {
        el.innerHTML = `<p class="error-txt">Error: ${e.message}</p>`;
      }
    }

    function saFiltrarSugerenciasTipo() {
      const tipo = document.getElementById('sa-filtroSugTipo')?.value || '';
      const lista = tipo ? _sa_sugerencias.filter(s => s.tipo === tipo) : _sa_sugerencias;
      sa_RenderSugerencias(lista);
    }

    function sa_RenderSugerencias(sugs) {
      const el = document.getElementById('sa-listaSugerencias');
      if (!sugs.length) { el.innerHTML = '<p class="empty-txt">No hay sugerencias pendientes.</p>'; return; }
      el.innerHTML = sugs.map(s => {
        const meta  = SA_SUG_META[s.tipo] || { label: s.tipo, color: '#6b7280', bg: 'var(--c-surface)' };
        const fecha = new Date(s.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
        const enEdicion = _sa_sugEditMode[s.id];
        const body  = enEdicion
          ? sa_RenderSugBodyEdit(s.tipo, s.propuesta || {}, s.id)
          : sa_RenderSugBody(s.tipo, s.propuesta || {});
        return `<div id="sa-sug-card-${s.id}" style="border:1.5px solid ${meta.color}33;border-radius:var(--r-xl);padding:16px 18px;margin-bottom:12px;background:${meta.bg}">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;flex-wrap:wrap">
            <span style="font-size:11px;font-weight:700;color:${meta.color};background:${meta.color}18;padding:3px 10px;border-radius:20px">${meta.label}</span>
            <span style="font-size:11px;color:var(--c-text-3)">${fecha}</span>
          </div>
          <div id="sa-sug-body-${s.id}">${body}</div>
          <div id="sa-sug-actions-${s.id}" style="margin-top:12px">${sa_RenderSugActions(s.id, s.tipo, enEdicion)}</div>
        </div>`;
      }).join('');
    }

    function sa_RenderSugBody(tipo, prop) {
      if (tipo === 'nueva_faq') return `
        <div style="margin-bottom:6px"><span class="tk-label">Pregunta</span><div style="font-size:13px;font-weight:600">${_esc(prop.pregunta || '')}</div></div>
        <div style="margin-bottom:6px"><span class="tk-label">Respuesta</span><div style="font-size:13px;color:var(--c-text-2);line-height:1.5">${_esc(prop.respuesta || '')}</div></div>
        <div style="font-size:11px;color:var(--c-text-3)">Contexto: ${_esc(prop.contexto || 'general')}</div>`;

      if (tipo === 'editar_faq') return `
        ${prop.causa_raiz ? `<div style="font-size:12px;color:#92400e;background:#fef9c3;border-radius:var(--r-sm);padding:6px 10px;margin-bottom:10px">🔍 ${_esc(prop.causa_raiz)}</div>` : ''}
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
          <div>
            <div class="tk-label" style="color:#dc2626">Original</div>
            <div style="font-size:12px;font-weight:600;margin-bottom:3px">${_esc(prop.pregunta_original || '')}</div>
            <div style="font-size:12px;color:var(--c-text-3);line-height:1.4">${_esc(prop.respuesta_original || '')}</div>
          </div>
          <div>
            <div class="tk-label" style="color:#059669">Propuesta</div>
            <div style="font-size:12px;font-weight:600;margin-bottom:3px">${_esc(prop.pregunta || '')}</div>
            <div style="font-size:12px;color:var(--c-text-2);line-height:1.4">${_esc(prop.respuesta || '')}</div>
          </div>
        </div>`;

      if (tipo === 'eliminar_faq') return `
        <div style="font-size:13px;font-weight:600;margin-bottom:6px">${_esc(prop.pregunta_original || '')}</div>
        ${prop.razon ? `<div style="font-size:12px;color:var(--c-text-3)">Razón: ${_esc(prop.razon)}</div>` : ''}
        ${prop.metricas ? `<div style="font-size:11px;color:var(--c-text-3)">👁 ${prop.metricas.exposiciones || 0} exp · 👍 ${prop.metricas.votos_util || 0} · 👎 ${prop.metricas.votos_negativo || 0}</div>` : ''}`;

      if (tipo === 'unir_faqs') {
        const orig = (prop.preguntas_originales || []).map(p => `<li style="font-size:12px;color:var(--c-text-3)">${_esc(p)}</li>`).join('');
        return `
          <div style="margin-bottom:8px"><div class="tk-label">Preguntas a unir</div><ul style="margin:4px 0;padding-left:18px">${orig || '<li style="font-size:12px;color:var(--c-text-3)">—</li>'}</ul></div>
          <div><div class="tk-label" style="color:#7c3aed">FAQ unificada</div>
          <div style="font-size:12px;font-weight:600;margin-bottom:3px">${_esc(prop.pregunta || '')}</div>
          <div style="font-size:12px;color:var(--c-text-2);line-height:1.4">${_esc(prop.respuesta || '')}</div></div>`;
      }

      if (tipo === 'nuevo_recurso') return `
        <div style="font-weight:700;font-size:13px;margin-bottom:4px">${_esc(prop.titulo || '')}</div>
        ${prop.contenido ? `<div style="font-size:12px;color:var(--c-text-3);line-height:1.4;max-height:80px;overflow:hidden">${_esc(prop.contenido.slice(0, 300))}${prop.contenido.length > 300 ? '…' : ''}</div>` : ''}
        <div style="font-size:11px;color:var(--c-text-3);margin-top:4px">Tipo: ${_esc(prop.tipo_recurso || 'articulo')} · Contexto: ${_esc(prop.contexto || 'general')}</div>`;

      return `<pre style="font-size:11px;overflow:auto">${_esc(JSON.stringify(prop, null, 2))}</pre>`;
    }

    function sa_RenderSugBodyEdit(tipo, prop, sugId) {
      const ctx = (c) => `<option value="general"${c==='general'?' selected':''}>general</option>
        <option value="wizard"${c==='wizard'?' selected':''}>wizard</option>
        <option value="erp"${c==='erp'?' selected':''}>erp</option>
        <option value="pagos"${c==='pagos'?' selected':''}>pagos</option>`;

      if (tipo === 'nueva_faq' || tipo === 'editar_faq') return `
        <div class="form-field" style="margin-bottom:10px">
          <label>Pregunta</label>
          <input type="text" id="sa-sug-${sugId}-pregunta" value="${_escAttr(prop.pregunta || '')}" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;background:var(--c-surface)">
        </div>
        <div class="form-field" style="margin-bottom:10px">
          <label>Respuesta</label>
          <textarea id="sa-sug-${sugId}-respuesta" rows="4" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;font-family:inherit;background:var(--c-surface);resize:vertical">${_esc(prop.respuesta || '')}</textarea>
        </div>
        <div class="form-field" style="margin-bottom:4px">
          <label>Contexto</label>
          <select id="sa-sug-${sugId}-contexto" style="width:100%;padding:8px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;background:var(--c-surface)">${ctx(prop.contexto || 'general')}</select>
        </div>`;

      if (tipo === 'unir_faqs') return `
        <div style="margin-bottom:8px;font-size:12px;color:var(--c-text-3)">FAQs a unir: ${(prop.faq_ids||[]).join(', ')}</div>
        <div class="form-field" style="margin-bottom:10px">
          <label>Pregunta unificada</label>
          <input type="text" id="sa-sug-${sugId}-pregunta" value="${_escAttr(prop.pregunta || '')}" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;background:var(--c-surface)">
        </div>
        <div class="form-field" style="margin-bottom:10px">
          <label>Respuesta unificada</label>
          <textarea id="sa-sug-${sugId}-respuesta_unificada" rows="4" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;font-family:inherit;background:var(--c-surface);resize:vertical">${_esc(prop.respuesta || '')}</textarea>
        </div>
        <div class="form-field">
          <label>Contexto</label>
          <select id="sa-sug-${sugId}-contexto" style="width:100%;padding:8px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;background:var(--c-surface)">${ctx(prop.contexto || 'general')}</select>
        </div>`;

      if (tipo === 'nuevo_recurso') return `
        <div class="form-field" style="margin-bottom:10px">
          <label>Título</label>
          <input type="text" id="sa-sug-${sugId}-titulo" value="${_escAttr(prop.titulo || '')}" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;background:var(--c-surface)">
        </div>
        <div class="form-field" style="margin-bottom:10px">
          <label>Contenido</label>
          <textarea id="sa-sug-${sugId}-contenido" rows="4" style="width:100%;box-sizing:border-box;padding:8px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;font-family:inherit;background:var(--c-surface);resize:vertical">${_esc(prop.contenido || '')}</textarea>
        </div>
        <div class="form-field">
          <label>Contexto</label>
          <select id="sa-sug-${sugId}-contexto" style="width:100%;padding:8px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;background:var(--c-surface)">${ctx(prop.contexto || 'general')}</select>
        </div>`;

      // eliminar_faq — no hay campos editables significativos
      return sa_RenderSugBody(tipo, prop);
    }

    function sa_RenderSugActions(sugId, tipo, enEdicion) {
      if (enEdicion) return `
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          <button class="btn-primary" style="font-size:13px;padding:7px 14px" onclick="saAccionSugerencia('${sugId}','aprobar')">✓ Aprobar con cambios</button>
          <button class="btn-sm" onclick="saToggleEditarSugerencia('${sugId}')">Cancelar</button>
        </div>`;
      return `
        <div style="display:flex;gap:8px;flex-wrap:wrap">
          ${tipo !== 'eliminar_faq' ? `<button class="btn-sm" onclick="saToggleEditarSugerencia('${sugId}')">✏️ Editar antes de aprobar</button>` : ''}
          <button class="btn-primary" style="font-size:13px;padding:7px 14px" onclick="saAccionSugerencia('${sugId}','aprobar')">✓ Aprobar</button>
          <button class="btn-sm" style="color:#dc2626;border-color:#fca5a5" onclick="saAccionSugerencia('${sugId}','rechazar')">✗ Rechazar</button>
        </div>`;
    }

    function saToggleEditarSugerencia(sugId) {
      _sa_sugEditMode[sugId] = !_sa_sugEditMode[sugId];
      const sug = _sa_sugerencias.find(s => s.id === sugId);
      if (!sug) return;
      const bodyEl    = document.getElementById(`sa-sug-body-${sugId}`);
      const actionsEl = document.getElementById(`sa-sug-actions-${sugId}`);
      const enEdicion = _sa_sugEditMode[sugId];
      if (bodyEl)    bodyEl.innerHTML    = enEdicion ? sa_RenderSugBodyEdit(sug.tipo, sug.propuesta || {}, sugId) : sa_RenderSugBody(sug.tipo, sug.propuesta || {});
      if (actionsEl) actionsEl.innerHTML = sa_RenderSugActions(sugId, sug.tipo, enEdicion);
    }

    function sa_GetEditedPropuesta(sugId, tipo, propOriginal) {
      const v = (id) => document.getElementById(`sa-sug-${sugId}-${id}`)?.value?.trim() || '';
      if (tipo === 'nueva_faq')  return { ...propOriginal, pregunta: v('pregunta'), respuesta: v('respuesta'), contexto: v('contexto') };
      if (tipo === 'editar_faq') return { ...propOriginal, pregunta: v('pregunta'), respuesta: v('respuesta'), contexto: v('contexto') };
      if (tipo === 'unir_faqs')  return { ...propOriginal, pregunta: v('pregunta'), respuesta: v('respuesta_unificada'), contexto: v('contexto') };
      if (tipo === 'nuevo_recurso') return { ...propOriginal, titulo: v('titulo'), contenido: v('contenido'), contexto: v('contexto') };
      return propOriginal;
    }

    async function saAccionSugerencia(sugId, accion) {
      const sug = _sa_sugerencias.find(s => s.id === sugId);
      if (!sug) return;
      const enEdicion = _sa_sugEditMode[sugId];
      const propuesta = enEdicion ? sa_GetEditedPropuesta(sugId, sug.tipo, sug.propuesta || {}) : null;

      if (accion === 'rechazar' && !confirm('¿Rechazar esta sugerencia de la IA?')) return;

      const actionsEl = document.getElementById(`sa-sug-actions-${sugId}`);
      if (actionsEl) actionsEl.innerHTML = '<p class="loading-txt" style="margin:0">Procesando...</p>';

      try {
        await apiFetch(`/soporte/sugerencias/${sugId}`, {
          method: 'PATCH',
          body:   { accion, ...(propuesta ? { propuesta } : {}) },
        });
        mostrarToast(accion === 'aprobar' ? '✓ Sugerencia aprobada y aplicada' : 'Sugerencia rechazada');
        // Refrescar lista y badges
        _sa_sugerencias = _sa_sugerencias.filter(s => s.id !== sugId);
        sa_RenderSugerencias(_sa_sugerencias);
        sa_CargarBadges();
        // Si era nueva FAQ, refrescar lista de FAQs en background
        if (accion === 'aprobar' && ['nueva_faq','editar_faq','eliminar_faq','unir_faqs'].includes(sug.tipo)) {
          saCargarFaqs().catch(() => {});
        }
      } catch(e) {
        if (actionsEl) actionsEl.innerHTML = `<p class="error-txt" style="margin:0">Error: ${e.message}</p>`;
      }
    }

