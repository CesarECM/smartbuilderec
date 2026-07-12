document.getElementById('sa-panel-logs').innerHTML = `
        <div class="sec-header">
          <h2>📋 Logs de actividad</h2>
          <div class="sec-header-actions">
            <button class="btn-sm" onclick="saCargarLogs()">↻ Actualizar</button>
          </div>
        </div>

        <div style="display:flex;gap:10px;flex-wrap:wrap;align-items:flex-end;margin-bottom:16px;padding:14px;background:var(--c-surface-2);border-radius:var(--r-lg);border:1px solid var(--c-border)">
          <div>
            <div class="form-label" style="font-size:11px;margin-bottom:3px">Evento</div>
            <select id="sa-logs-filtro-tipo" class="form-control" style="font-size:12px;padding:5px 8px">
              <option value="">Todos</option>
              <option value="wizard.curso.creado">🆕 Curso creado</option>
              <option value="wizard.paso.completado">✅ Paso completado</option>
              <option value="wizard.sync.error">⚠️ Error sync</option>
              <option value="wizard.descarga.ok">⬇️ Descarga OK</option>
              <option value="wizard.descarga.error">❌ Error descarga</option>
            </select>
          </div>
          <div>
            <div class="form-label" style="font-size:11px;margin-bottom:3px">Usuario</div>
            <input id="sa-logs-filtro-usuario" class="form-control" type="text" placeholder="Nombre o email" style="font-size:12px;padding:5px 8px;width:170px">
          </div>
          <div>
            <div class="form-label" style="font-size:11px;margin-bottom:3px">Desde</div>
            <input id="sa-logs-filtro-desde" class="form-control" type="date" style="font-size:12px;padding:5px 8px">
          </div>
          <div>
            <div class="form-label" style="font-size:11px;margin-bottom:3px">Hasta</div>
            <input id="sa-logs-filtro-hasta" class="form-control" type="date" style="font-size:12px;padding:5px 8px">
          </div>
          <button class="btn-primary" style="font-size:12px;padding:7px 16px" onclick="saCargarLogs()">Buscar</button>
        </div>

        <div id="sa-logs-tabla"><p class="loading-txt">Cargando logs...</p></div>
`;

document.getElementById('sa-panel-mi-perfil').innerHTML = `
        <div class="sec-header"><h2>👤 Mi Perfil</h2></div>
        <div class="perfil-card" id="sa-perfilFormContainer">
          <p class="loading-txt">Cargando perfil...</p>
        </div>
`;
