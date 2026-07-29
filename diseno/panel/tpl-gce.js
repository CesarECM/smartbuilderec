document.getElementById('rp-ce_admin').innerHTML = `
  <nav class="role-tab-bar">
    <button class="role-tab-btn active" id="gce-tab-evaluaciones" onclick="gceShowTab('evaluaciones')">🗂️ Evaluaciones</button>
    <button class="role-tab-btn"        id="gce-tab-resumen"      onclick="gceShowTab('resumen')">📊 Resumen</button>
  </nav>

  <!-- ── Evaluaciones ──────────────────────────────────────── -->
  <div id="gce-panel-evaluaciones" class="role-tab-panel active">
    <div class="sec-header">
      <div>
        <h2>Procesos de evaluación <span class="count-tag" id="gce-countProcesos"></span></h2>
        <p style="font-size:12px;color:var(--c-text-3);margin:4px 0 0">
          Gestiona el ciclo de evaluación de tus candidatos por Estándar de Competencia.
        </p>
      </div>
      <button class="btn-primary" onclick="gceAbrirModalNuevo()">+ Nueva evaluación</button>
    </div>
    <div id="gce-listaProcesos"><p class="loading-txt">Cargando...</p></div>
  </div>

  <!-- ── Resumen ───────────────────────────────────────────── -->
  <div id="gce-panel-resumen" class="role-tab-panel">
    <div class="stats-row">
      <div class="stat-card">
        <div class="stat-icon">📋</div>
        <div><div class="stat-num" id="gce-statTotal">—</div><div class="stat-label">Total procesos</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🔄</div>
        <div><div class="stat-num" id="gce-statEnCurso">—</div><div class="stat-label">En curso</div></div>
      </div>
      <div class="stat-card">
        <div class="stat-icon">🏆</div>
        <div><div class="stat-num" id="gce-statCert">—</div><div class="stat-label">Certificados</div></div>
      </div>
    </div>
    <div style="margin-top:20px;padding:16px;background:var(--c-surface);border-radius:10px;max-width:340px">
      <h3 style="font-size:13px;margin:0 0 12px;color:var(--c-text)">Pipeline por estado</h3>
      <div id="gce-pipeline"></div>
    </div>
  </div>

  <!-- ── Modal: nueva evaluación ──────────────────────────── -->
  <div id="gce-modal-nuevo"
       style="display:none;position:fixed;inset:0;background:rgba(0,0,0,.55);z-index:1000;align-items:center;justify-content:center">
    <div style="background:var(--c-surface);border-radius:12px;padding:24px;width:min(480px,92vw);max-height:90vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,.3)">
      <h3 style="margin:0 0 18px;font-size:15px;color:var(--c-text)">Nueva evaluación</h3>

      <label style="display:block;margin-bottom:14px">
        <span style="font-size:12px;color:var(--c-text-3);display:block;margin-bottom:4px">Candidato *</span>
        <select id="gce-selCandidato"
          style="width:100%;padding:8px 10px;border:1px solid var(--c-border);border-radius:6px;background:var(--c-bg);color:var(--c-text);font-size:13px">
          <option value="">— Selecciona candidato —</option>
        </select>
      </label>

      <label style="display:block;margin-bottom:14px">
        <span style="font-size:12px;color:var(--c-text-3);display:block;margin-bottom:4px">Estándar de Competencia *</span>
        <select id="gce-selEC"
          style="width:100%;padding:8px 10px;border:1px solid var(--c-border);border-radius:6px;background:var(--c-bg);color:var(--c-text);font-size:13px">
          <option value="">— Selecciona EC —</option>
        </select>
      </label>

      <label style="display:block;margin-bottom:20px">
        <span style="font-size:12px;color:var(--c-text-3);display:block;margin-bottom:4px">
          Evaluador <span style="opacity:.6">(opcional — se puede asignar después)</span>
        </span>
        <select id="gce-selEvaluador"
          style="width:100%;padding:8px 10px;border:1px solid var(--c-border);border-radius:6px;background:var(--c-bg);color:var(--c-text);font-size:13px">
          <option value="">Sin asignar por ahora</option>
        </select>
      </label>

      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button onclick="gceCerrarModalNuevo()"
          style="padding:8px 16px;border:1px solid var(--c-border);border-radius:6px;background:none;color:var(--c-text);cursor:pointer;font-size:13px">
          Cancelar
        </button>
        <button onclick="gceGuardarNuevo()" class="btn-primary" id="gce-btnGuardar">Crear proceso</button>
      </div>
    </div>
  </div>
`;
