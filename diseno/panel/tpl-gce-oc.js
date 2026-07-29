document.getElementById('rp-oc_admin').innerHTML = `
  <nav class="role-tab-bar">
    <button class="role-tab-btn active" id="oc-tab-procesos"   onclick="ocShowTab('procesos')">📋 Procesos</button>
    <button class="role-tab-btn"        id="oc-tab-dashboard"  onclick="ocShowTab('dashboard')">📊 Dashboard</button>
  </nav>

  <!-- ── Procesos ───────────────────────────────────────────── -->
  <div id="oc-panel-procesos" class="role-tab-panel active">
    <div class="sec-header">
      <div>
        <h2>Procesos supervisados <span class="count-tag" id="oc-countProcesos"></span></h2>
        <p style="font-size:12px;color:var(--c-text-3);margin:4px 0 0">
          Todos los procesos de evaluación de los Centros de Evaluación bajo tu organismo.
        </p>
      </div>
    </div>
    <div id="oc-listaProcesos"><p class="loading-txt">Cargando...</p></div>
  </div>

  <!-- ── Dashboard ─────────────────────────────────────────── -->
  <div id="oc-panel-dashboard" class="role-tab-panel">
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div><div class="stat-num" id="oc-statTotal">—</div><div class="stat-label">Total procesos</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔄</div>
        <div><div class="stat-num" id="oc-statEnCurso">—</div><div class="stat-label">En curso</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏆</div>
        <div><div class="stat-num" id="oc-statCert">—</div><div class="stat-label">Certificados</div></div>
      </div>
    </div>
    <div style="margin-top:20px;padding:20px;background:var(--c-surface);border-radius:10px;max-width:480px">
      <h3 style="font-size:13px;margin:0 0 16px;color:var(--c-text)">Pipeline por estado</h3>
      <div id="oc-pipeline"></div>
    </div>
  </div>
`;
