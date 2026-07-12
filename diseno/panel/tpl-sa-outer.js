document.getElementById('rp-super_admin').innerHTML = `
      <nav class="role-tab-bar">
        <button class="role-tab-btn active" id="sa-tab-resumen"    onclick="saShowTab('resumen')">📊 Resumen</button>
        <button class="role-tab-btn"        id="sa-tab-usuarios"   onclick="saShowTab('usuarios')">👥 Usuarios</button>
        <button class="role-tab-btn"        id="sa-tab-plataforma" onclick="saShowTab('plataforma')">📚 Plataforma</button>
        <button class="role-tab-btn"        id="sa-tab-soporte"    onclick="saShowTab('soporte')">🤖 Soporte KB</button>
        <button class="role-tab-btn"        id="sa-tab-config"     onclick="saShowTab('config')">⚙️ Config</button>
        <button class="role-tab-btn"        id="sa-tab-logs"       onclick="saShowTab('logs')">📋 Logs</button>
        <button class="role-tab-btn"        onclick="window.location.href='erp-admin'">🏫 ERP →</button>
        <button class="role-tab-btn"        id="sa-tab-mi-perfil"  onclick="saShowTab('mi-perfil')">👤 Mi Perfil</button>
      </nav>
      <div id="sa-panel-resumen"    class="role-tab-panel active"></div>
      <div id="sa-panel-usuarios"   class="role-tab-panel"></div>
      <div id="sa-panel-plataforma" class="role-tab-panel"></div>
      <div id="sa-panel-config"     class="role-tab-panel"></div>
      <div id="sa-panel-soporte"    class="role-tab-panel"></div>
      <div id="sa-panel-logs"       class="role-tab-panel"></div>
      <div id="sa-panel-mi-perfil"  class="role-tab-panel"></div>
`;
