document.getElementById('rp-admin').innerHTML = `
      <nav class="role-tab-bar">
        <button class="role-tab-btn active" id="adm-tab-resumen"    onclick="admShowTab('resumen')">📊 Resumen</button>
        <button class="role-tab-btn"        id="adm-tab-mis-cursos" onclick="admShowTab('mis-cursos')">📚 Mis Cursos</button>
        <button class="role-tab-btn"        id="adm-tab-usuarios"   onclick="admShowTab('usuarios')">👥 Usuarios &amp; Acceso</button>
        <button class="role-tab-btn"        onclick="window.location.href='erp-admin'">🏫 ERP →</button>
        <button class="role-tab-btn"        id="adm-tab-mi-perfil"  onclick="admShowTab('mi-perfil')">👤 Mi Perfil</button>
        <button class="role-tab-btn"        id="adm-tab-branding"   onclick="admShowTab('branding')">🎨 Mi Marca</button>
        <button class="role-tab-btn"        id="adm-tab-mi-plan"    onclick="admShowTab('mi-plan')">💳 Mi Plan</button>
      </nav>

      <!-- ── Resumen ─────────────────────────────────────────────── -->
      <div id="adm-panel-resumen" class="role-tab-panel active">
        <div class="stats-row" id="adm-stats">
          <div class="stat-card"><div class="stat-icon">👥</div><div><div class="stat-num" id="adm-statUsuarios">—</div><div class="stat-label">Usuarios registrados</div></div></div>
          <div class="stat-card"><div class="stat-icon">🪙</div><div><div class="stat-num" id="adm-statCreditos">—</div><div class="stat-label">Créditos disponibles</div></div></div>
          <div class="stat-card"><div class="stat-icon">🔑</div><div><div class="stat-num" id="adm-statCodigos">—</div><div class="stat-label">Códigos sin usar</div></div></div>
          <div class="stat-card"><div class="stat-icon">📚</div><div><div class="stat-num" id="adm-statMisCursos">—</div><div class="stat-label">Mis cursos creados</div></div></div>
          <div class="stat-card"><div class="stat-icon">📋</div><div><div class="stat-num" id="adm-statCursosAlumnos">—</div><div class="stat-label">Cursos de alumnos</div></div></div>
        </div>
        <div class="credits-alert" id="adm-creditAlert">
          ⚠️ Te quedan pocos créditos. Contacta al administrador de la plataforma para recargar.
        </div>
      </div>

      <!-- ── Mis Cursos ──────────────────────────────────────────── -->
      <div id="adm-panel-mis-cursos" class="role-tab-panel">
        <div class="sec-header">
          <div>
            <h2>Mis cursos <span class="count-tag" id="adm-countMisCursos"></span></h2>
            <p style="font-size:12px;color:var(--c-text-3);margin-top:4px;margin-bottom:0">Crea cursos aquí y transfíérelos a tus alumnos cuando estén listos.</p>
          </div>
          <a href="index?new=1" class="btn-primary" style="text-decoration:none">+ Nuevo curso</a>
        </div>
        <div id="adm-listaMisCursos"><p class="loading-txt">Cargando...</p></div>
      </div>

      <!-- ── Usuarios & Acceso ───────────────────────────────────── -->
      <div id="adm-panel-usuarios" class="role-tab-panel">
        <div class="inner-tab-bar">
          <button class="inner-tab-btn active" id="adm-itab-usuarios" onclick="admShowInnerTab('usuarios')">
            👥 Usuarios <span class="count-tag" id="adm-countUsuarios"></span>
          </button>
          <button class="inner-tab-btn" id="adm-itab-codigos" onclick="admShowInnerTab('codigos')">
            🔑 Códigos de acceso
          </button>
        </div>
        <div id="adm-ipanel-usuarios" class="inner-panel active">
          <div class="sec-header">
            <h2>Mis usuarios</h2>
            <div class="sec-actions">
              <input type="text" id="adm-searchUsuarios" class="search-input"
                placeholder="🔍 Buscar..." oninput="admFiltrarUsuarios(this.value)">
            </div>
          </div>
          <div id="adm-listaUsuarios"><p class="loading-txt">Cargando usuarios...</p></div>
        </div>
        <div id="adm-ipanel-codigos" class="inner-panel">
          <div class="sec-header">
            <h2>Códigos de acceso</h2>
            <div class="sec-actions">
              <select id="adm-selectVigencia" class="vigencia-select">
                <option value="7">Vigencia: 7 días</option>
                <option value="15">Vigencia: 15 días</option>
                <option value="30" selected>Vigencia: 30 días</option>
                <option value="60">Vigencia: 60 días</option>
                <option value="90">Vigencia: 90 días</option>
              </select>
              <button class="btn-primary" id="adm-btnGenerarCodigo">+ Generar código</button>
            </div>
          </div>
          <p id="adm-creditAlertCodigos" style="display:none;font-size:13px;color:#92400e;background:#fffbeb;border:1px solid #fde68a;border-radius:var(--r-md);padding:10px 14px;margin-bottom:14px">
            ⚠️ Sin créditos disponibles para generar códigos.
          </p>
          <div id="adm-listaCodigos"><p class="loading-txt">Cargando códigos...</p></div>
        </div>
      </div>

      <!-- ── Mi Perfil ───────────────────────────────────────────── -->
      <div id="adm-panel-mi-perfil" class="role-tab-panel">
        <div class="sec-header"><h2>👤 Mi Perfil</h2></div>
        <div id="adm-perfilFormContainer"><p class="loading-txt">Cargando perfil...</p></div>
      </div>

      <!-- ── Mi Marca ────────────────────────────────────────────── -->
      <div id="adm-panel-branding" class="role-tab-panel">
        <div class="sec-header"><h2>🎨 Mi Marca</h2></div>
        <div id="adm-brandingContainer"><p class="loading-txt">Cargando...</p></div>
      </div>

      <!-- ── Mi Plan ────────────────────────────────────────────── -->
      <div id="adm-panel-mi-plan" class="role-tab-panel">
        <div class="sec-header">
          <h2>💳 Mi Plan</h2>
          <a href="pagos.html" class="btn-sm" style="text-decoration:none">Ver todos los planes →</a>
        </div>
        <div id="adm-planContainer"><p class="loading-txt">Cargando...</p></div>
      </div>
`;
