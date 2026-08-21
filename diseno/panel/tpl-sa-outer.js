document.getElementById('rp-super_admin').innerHTML = `
      <nav class="role-tab-bar">
        <button class="role-tab-btn active" id="sa-tab-resumen"    onclick="saShowTab('resumen')">📊 Resumen</button>
        <button class="role-tab-btn"        id="sa-tab-usuarios"   onclick="saShowTab('usuarios')">👥 Usuarios</button>
        <button class="role-tab-btn"        id="sa-tab-plataforma" onclick="saShowTab('plataforma')">📚 Plataforma</button>
        <button class="role-tab-btn"        id="sa-tab-soporte"    onclick="saShowTab('soporte')">🤖 Soporte KB</button>
        <button class="role-tab-btn"        id="sa-tab-config"     onclick="saShowTab('config')">⚙️ Config</button>
        <button class="role-tab-btn"        id="sa-tab-logs"       onclick="saShowTab('logs')">📋 Logs</button>
        <button class="role-tab-btn"        onclick="window.location.href='erp-admin'">🏫 ERP →</button>
        <button class="role-tab-btn"        id="sa-tab-mi-plan"    onclick="saShowTab('mi-plan')">💳 Mi Plan</button>
        <button class="role-tab-btn"        id="sa-tab-mi-perfil"  onclick="saShowTab('mi-perfil')">👤 Mi Perfil</button>
      </nav>
      <div id="sa-panel-resumen"    class="role-tab-panel active"></div>
      <div id="sa-panel-usuarios"   class="role-tab-panel"></div>
      <div id="sa-panel-plataforma" class="role-tab-panel"></div>
      <div id="sa-panel-config"     class="role-tab-panel"></div>
      <div id="sa-panel-soporte"    class="role-tab-panel"></div>
      <div id="sa-panel-logs"       class="role-tab-panel"></div>
      <div id="sa-panel-mi-plan"    class="role-tab-panel">
        <div class="sec-header">
          <h2>💳 Mi Plan</h2>
          <select id="sa-plan-user-select" onchange="saPlanVerComo(this.value)"
            style="font-size:13px;padding:5px 10px;border-radius:6px;border:1.5px solid var(--c-border);background:var(--c-surface);color:var(--c-text);cursor:pointer;max-width:260px">
            <option value="">Mi cuenta</option>
          </select>
        </div>
        <div id="adm-planContainer"><p class="loading-txt">Cargando...</p></div>
      </div>
      <div id="sa-panel-mi-perfil"  class="role-tab-panel"></div>
`;
