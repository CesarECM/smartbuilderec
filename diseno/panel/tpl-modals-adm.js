document.getElementById('panel-modals-adm').innerHTML = `
  <!-- ── Modal: planeaciones de un usuario (Admin) ──────────────── -->
  <div class="tk-modal-overlay" id="adm-modalUserCursos" onclick="admCerrarModalUserCursos(event)">
    <div class="tk-modal-box" style="max-width:740px">
      <button class="tk-modal-close" onclick="admCerrarModalUserCursos()">✕</button>
      <div style="font-size:16px;font-weight:700;margin-bottom:16px" id="adm-userCursosNombre">Planeaciones de...</div>
      <div id="adm-userCursosLista"><p class="loading-txt">Cargando...</p></div>
    </div>
  </div>

  <!-- ── Modal: transferir planeación a alumno (Admin) ───────────── -->
  <div class="tk-modal-overlay" id="adm-modalTransferir" onclick="admCerrarModalTransferir(event)">
    <div class="tk-modal-box" style="max-width:420px">
      <button class="tk-modal-close" onclick="admCerrarModalTransferir()">✕</button>
      <div style="font-size:16px;font-weight:700;margin-bottom:4px">Transferir curso</div>
      <div style="font-size:13px;color:var(--c-text-3);margin-bottom:20px" id="adm-transferirCursoNombre"></div>
      <label style="font-size:12px;font-weight:600;color:var(--c-text-2);display:block;margin-bottom:6px">Alumno destinatario:</label>
      <select id="adm-selectAlumno" style="width:100%;border:1.5px solid var(--c-border);border-radius:var(--r-sm);padding:9px 12px;font-size:14px;font-family:inherit;background:var(--c-surface);outline:none;margin-bottom:16px">
        <option value="">— Selecciona un alumno —</option>
      </select>
      <p style="font-size:12px;color:var(--c-text-3);margin-bottom:16px">Al transferir, el curso pasará a ser del alumno y desaparecerá de tu lista de cursos.</p>
      <div style="display:flex;gap:8px;justify-content:flex-end">
        <button class="btn-secondary" onclick="admCerrarModalTransferir()">Cancelar</button>
        <button class="btn-primary" id="adm-btnConfirmarTransferir" onclick="admConfirmarTransferir()">Transferir</button>
      </div>
      <p class="crear-msg" id="adm-transferirMsg"></p>
    </div>
  </div>

  <!-- ── Modal: promover usuario a Admin (Admin / SA) ─────────────── -->
  <div class="modal-overlay" id="adm-modalPromover" onclick="admCerrarModalPromover(event)">
    <div class="modal-box">
      <button class="modal-close" onclick="admCerrarModalPromover()">✕</button>
      <div class="modal-title">Promover a Admin</div>
      <div class="modal-sub" id="adm-promoverNombreLabel"></div>
      <div class="form-grid">
        <div class="form-field">
          <label>Créditos iniciales</label>
          <input type="number" id="adm-promoverCreditos" value="10" min="0" max="9999">
        </div>
        <div class="form-field">
          <label>Vigencia hasta</label>
          <input type="date" id="adm-promoverVigencia">
        </div>
      </div>
      <p class="form-msg" id="adm-promoverMsg"></p>
      <div class="modal-btns">
        <button class="btn-secondary" onclick="admCerrarModalPromover()">Cancelar</button>
        <button class="btn-primary" id="adm-btnConfirmarPromover" onclick="admConfirmarPromover()">Promover</button>
      </div>
    </div>
  </div>

  <!-- ── Modal: ficha de contacto (compartida Admin + SA) ─────────── -->
  <div id="modalContacto" style="display:none;position:fixed;inset:0;background:rgba(0,0,0,0.45);z-index:9999;align-items:center;justify-content:center" onclick="if(event.target===this)cerrarFichaContacto()">
    <div style="background:var(--c-surface);border-radius:var(--r-xl);padding:28px 28px 24px;width:100%;max-width:380px;margin:16px;box-shadow:var(--shadow-lg);border:1px solid var(--c-border)">
      <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:20px">
        <h3 style="margin:0;font-size:16px;font-weight:700;color:var(--c-text)">Ficha de contacto</h3>
        <button onclick="cerrarFichaContacto()" style="background:none;border:none;font-size:18px;cursor:pointer;color:var(--c-text-3);padding:2px 6px;border-radius:4px">✕</button>
      </div>
      <div style="display:flex;flex-direction:column;gap:10px">
        <div style="display:flex;align-items:center;gap:10px;background:var(--c-surface-2);border-radius:var(--r-md);padding:10px 12px">
          <div style="flex:0 0 72px;font-size:12px;font-weight:600;color:var(--c-text-3);text-transform:uppercase;letter-spacing:.04em">Nombre</div>
          <div id="fichaShowNombre" style="flex:1;font-size:14px;font-weight:600;color:var(--c-text)">—</div>
          <button onclick="copiarCampoFicha('fichaShowNombre',this)" style="background:none;border:1px solid var(--c-border-s);border-radius:6px;padding:4px 8px;cursor:pointer;font-size:13px;color:var(--c-text-2);white-space:nowrap">📋</button>
        </div>
        <div style="display:flex;align-items:center;gap:10px;background:var(--c-surface-2);border-radius:var(--r-md);padding:10px 12px">
          <div style="flex:0 0 72px;font-size:12px;font-weight:600;color:var(--c-text-3);text-transform:uppercase;letter-spacing:.04em">Email</div>
          <div id="fichaShowEmail" style="flex:1;font-size:14px;color:var(--c-text);word-break:break-all">—</div>
          <button onclick="copiarCampoFicha('fichaShowEmail',this)" style="background:none;border:1px solid var(--c-border-s);border-radius:6px;padding:4px 8px;cursor:pointer;font-size:13px;color:var(--c-text-2);white-space:nowrap">📋</button>
        </div>
        <div style="display:flex;align-items:center;gap:10px;background:var(--c-surface-2);border-radius:var(--r-md);padding:10px 12px">
          <div style="flex:0 0 72px;font-size:12px;font-weight:600;color:var(--c-text-3);text-transform:uppercase;letter-spacing:.04em">Teléfono</div>
          <div id="fichaShowTel" style="flex:1;font-size:14px;color:var(--c-text)">—</div>
          <button onclick="copiarCampoFicha('fichaShowTel',this)" style="background:none;border:1px solid var(--c-border-s);border-radius:6px;padding:4px 8px;cursor:pointer;font-size:13px;color:var(--c-text-2);white-space:nowrap">📋</button>
        </div>
      </div>
      <button onclick="copiarFichaCompleta()" id="btnCopiarTodo" style="width:100%;margin-top:16px;padding:10px;background:var(--c-blue-600);color:#fff;border:none;border-radius:var(--r-md);font-size:14px;font-weight:600;cursor:pointer;font-family:inherit">📋 Copiar ficha completa</button>
    </div>
  </div>
`;
