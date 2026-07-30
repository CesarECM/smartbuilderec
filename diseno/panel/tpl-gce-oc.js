document.getElementById('rp-oc_admin').innerHTML = `
  <nav class="role-tab-bar">
    <button class="role-tab-btn active" id="oc-tab-procesos"   onclick="ocShowTab('procesos')">📋 Procesos</button>
    <button class="role-tab-btn"        id="oc-tab-ces"        onclick="ocShowTab('ces')">🏢 Mis CEs</button>
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

  <!-- ── Mis CEs ──────────────────────────────────────────── -->
  <div id="oc-panel-ces" class="role-tab-panel">
    <div class="sec-header">
      <div>
        <h2>Centros de Evaluación <span class="count-tag" id="oc-countCEs"></span></h2>
        <p style="font-size:12px;color:var(--c-text-3);margin:4px 0 0">Incorpora CEs a tu organismo y autoriza los ECs que pueden evaluar.</p>
      </div>
      <button class="btn-primary" onclick="ocAbrirModalAgregarCE()">+ Agregar CE</button>
    </div>
    <div id="oc-listaCEs"><p class="loading-txt">Cargando...</p></div>

    <!-- Modal ECs por CE -->
    <div id="oc-modal-ecs" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000;align-items:center;justify-content:center">
      <div style="background:var(--c-surface);border-radius:12px;padding:24px;width:min(480px,92vw);max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.3)">
        <h3 style="margin:0 0 4px;font-size:15px" id="oc-modalECs-titulo">ECs autorizados</h3>
        <p style="font-size:12px;color:var(--c-text-3);margin:0 0 16px" id="oc-modalECs-sub"></p>
        <div id="oc-modalECs-lista" style="display:flex;flex-direction:column;gap:8px;margin-bottom:20px"></div>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button onclick="ocCerrarModalECs()" style="padding:8px 16px;border:1px solid var(--c-border);border-radius:6px;background:none;color:var(--c-text);cursor:pointer;font-size:13px">Cancelar</button>
          <button onclick="ocGuardarECs()" class="btn-primary" id="oc-btnGuardarECs">Guardar</button>
        </div>
      </div>
    </div>

    <!-- Modal agregar CE -->
    <div id="oc-modal-ce" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000;align-items:center;justify-content:center">
      <div style="background:var(--c-surface);border-radius:12px;padding:24px;width:min(420px,92vw);box-shadow:0 8px 32px rgba(0,0,0,.3)">
        <h3 style="margin:0 0 16px;font-size:15px">Agregar Centro de Evaluación</h3>
        <label style="display:block;margin-bottom:16px">
          <span style="font-size:12px;color:var(--c-text-3);display:block;margin-bottom:4px">Email del CE (debe tener rol ce_admin)</span>
          <input id="oc-inputEmailCE" type="email" placeholder="ce@empresa.com"
            style="width:100%;padding:8px 10px;border:1px solid var(--c-border);border-radius:6px;background:var(--c-bg);color:var(--c-text);font-size:13px;box-sizing:border-box">
        </label>
        <p id="oc-msgCE" style="font-size:12px;min-height:16px;margin:0 0 16px"></p>
        <div style="display:flex;gap:8px;justify-content:flex-end">
          <button onclick="ocCerrarModalCE()" style="padding:8px 16px;border:1px solid var(--c-border);border-radius:6px;background:none;color:var(--c-text);cursor:pointer;font-size:13px">Cancelar</button>
          <button onclick="ocConfirmarAgregarCE()" class="btn-primary" id="oc-btnAgregarCE">Agregar</button>
        </div>
      </div>
    </div>
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
