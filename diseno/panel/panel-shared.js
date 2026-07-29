    var BACKEND_URL = "https://smartbuilderec.onrender.com";

    var _perfil     = null;
    var _extraRoles = [];
    var _rolesDisp  = [];
    var _rolActivo  = null;

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
      if (extraRoles.includes('ce_admin'))  roles.push({ id: 'ce_admin',   label: '🏫 GCE' });
      if (extraRoles.includes('oc_admin'))  roles.push({ id: 'oc_admin',   label: '🏛️ OC' });
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

    var _panelLoaded = {};

    async function cargarPanel(rol) {
      if (_panelLoaded[rol]) return;
      _panelLoaded[rol] = true;
      switch (rol) {
        case 'alumno':      typeof cargarPanelAlumno    === 'function' && await cargarPanelAlumno();    break;
        case 'asesor':      typeof cargarPanelAsesor    === 'function' && await cargarPanelAsesor();    break;
        case 'evaluador':   typeof cargarPanelEvaluador === 'function' && await cargarPanelEvaluador(); break;
        case 'ce_admin':    typeof gceInit              === 'function' && await gceInit();              break;
        case 'oc_admin':    typeof ocInit               === 'function' && await ocInit();               break;
        case 'admin':       typeof admInit              === 'function' && await admInit();              break;
        case 'super_admin': typeof saInit               === 'function' && await saInit();               break;
      }
    }
