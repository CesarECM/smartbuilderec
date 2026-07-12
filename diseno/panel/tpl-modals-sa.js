document.getElementById('panel-modals-sa').innerHTML = `
  <!-- ── Modal SA: reasignar usuario ─────────────────────────── -->
  <div class="sa-modal-overlay" id="sa-modalReasignar" onclick="saCerrarModalReasignar(event)">
    <div class="sa-modal-box">
      <button class="sa-modal-close" onclick="saCerrarModalReasignar()">✕</button>
      <div class="sa-modal-title">Reasignar usuario</div>
      <div class="sa-modal-subtitle" id="sa-reasignarNombre"></div>
      <div class="form-field">
        <label>Asignar al admin:</label>
        <select id="sa-selectAdminReasignar" class="sa-select" style="margin-top:6px"></select>
      </div>
      <div class="modal-btns">
        <button class="btn-secondary" onclick="saCerrarModalReasignar()">Cancelar</button>
        <button class="btn-primary" id="sa-btnConfirmarReasignar" onclick="saConfirmarReasignar()">Reasignar</button>
      </div>
    </div>
  </div>

  <!-- ── Modal SA: vigencia de usuario ─────────────────────────── -->
  <div class="sa-modal-overlay" id="sa-modalVigenciaUser" onclick="saCerrarModalVigenciaUser(event)">
    <div class="sa-modal-box">
      <button class="sa-modal-close" onclick="saCerrarModalVigenciaUser()">✕</button>
      <div class="sa-modal-title">Editar vigencia de usuario</div>
      <div class="sa-modal-subtitle" id="sa-vigenciaUserNombre"></div>
      <div class="renovar-field" style="margin-bottom:16px">
        <label style="font-size:12px;font-weight:600;color:var(--c-text-2);display:block;margin-bottom:4px">Vigencia hasta</label>
        <input type="date" id="sa-inputVigenciaUser" class="renovar-input" style="width:100%;box-sizing:border-box">
      </div>
      <p class="crear-msg" id="sa-vigenciaUserMsg"></p>
      <div class="modal-btns">
        <button class="btn-secondary" onclick="saCerrarModalVigenciaUser()">Cancelar</button>
        <button class="btn-primary" id="sa-btnConfirmarVigenciaUser" onclick="saConfirmarVigenciaUser()">Guardar vigencia</button>
      </div>
    </div>
  </div>

  <!-- ── Modal SA: usuarios sin planeación ─────────────────────── -->
  <div class="sa-modal-overlay" id="sa-modalSinPlan" onclick="saCerrarModalSinPlan(event)">
    <div class="sa-modal-box wide">
      <button class="sa-modal-close" onclick="saCerrarModalSinPlan()">✕</button>
      <div class="sa-modal-title">👤 Usuarios sin planeación</div>
      <div class="sa-modal-subtitle">Registrados hace más de 7 días y sin ninguna planeación creada.</div>
      <div id="sa-sinPlanLista"><p class="loading-txt">Cargando...</p></div>
    </div>
  </div>

  <!-- ── Modal SA: transferir planeación ───────────────────────── -->
  <div class="sa-modal-overlay" id="sa-modalTransferirSA" onclick="saCerrarModalTransferirSA(event)">
    <div class="sa-modal-box">
      <button class="sa-modal-close" onclick="saCerrarModalTransferirSA()">✕</button>
      <div class="sa-modal-title">Transferir planeación</div>
      <div class="sa-modal-subtitle" id="sa-tranCursoNombre"></div>
      <label style="font-size:12px;font-weight:600;color:var(--c-text-2);display:block;margin-bottom:6px">Participante destinatario:</label>
      <select id="sa-selectAlumnoSA" class="sa-select" style="margin-bottom:12px">
        <option value="">— Selecciona un participante —</option>
      </select>
      <p style="font-size:12px;color:var(--c-text-3);margin-bottom:16px">Al transferir, la planeación pasará a ser del participante y desaparecerá de tu lista.</p>
      <p class="crear-msg" id="sa-tranMsg"></p>
      <div class="modal-btns">
        <button class="btn-secondary" onclick="saCerrarModalTransferirSA()">Cancelar</button>
        <button class="btn-primary" id="sa-btnConfirmarTransferirSA" onclick="saConfirmarTransferirSA()">Transferir</button>
      </div>
    </div>
  </div>

  <!-- ── Modal SA: eliminar usuario (captcha aritmético) ───────── -->
  <div class="sa-modal-overlay" id="sa-modalEliminarUsuario" onclick="saCerrarModalEliminarUsuario(event)">
    <div class="sa-modal-box">
      <button class="sa-modal-close" onclick="saCerrarModalEliminarUsuario()">✕</button>
      <div class="sa-modal-title" style="color:#dc2626">⚠️ Eliminar usuario</div>
      <div class="sa-modal-subtitle" id="sa-eliminarUsuarioNombre"></div>
      <div style="background:#fff1f2;border:1px solid #fca5a5;border-radius:8px;padding:12px 14px;margin-bottom:16px;font-size:13px;color:#7f1d1d;line-height:1.5">
        Esta acción es <strong>permanente e irreversible</strong>. Se eliminarán todos sus datos, planeaciones e historial.
      </div>
      <div style="margin-bottom:14px">
        <label style="font-size:12px;font-weight:600;color:var(--c-text-2);display:block;margin-bottom:6px">
          Resuelve la operación: <strong id="sa-eliminarOpTexto"></strong>
        </label>
        <input type="number" id="sa-eliminarOpRespuesta" class="renovar-input"
          placeholder="Tu respuesta" style="width:100%;box-sizing:border-box" autocomplete="off">
      </div>
      <div style="margin-bottom:16px">
        <label style="font-size:12px;font-weight:600;color:var(--c-text-2);display:block;margin-bottom:6px">
          Escribe <strong style="color:#dc2626">BORRAR</strong> para confirmar:
        </label>
        <input type="text" id="sa-eliminarConfirmTexto" class="renovar-input"
          placeholder="BORRAR" style="width:100%;box-sizing:border-box" autocomplete="off">
      </div>
      <p class="crear-msg" id="sa-eliminarUsuarioMsg"></p>
      <div class="modal-btns">
        <button class="btn-secondary" onclick="saCerrarModalEliminarUsuario()">Cancelar</button>
        <button class="btn-sm danger" id="sa-btnConfirmarEliminarUsuario"
          style="padding:8px 16px;font-size:13px"
          onclick="saConfirmarEliminarUsuario()">Eliminar permanentemente</button>
      </div>
    </div>
  </div>

  <!-- ── Modal SA: detalle de admin ────────────────────────────── -->
  <div class="sa-modal-overlay" id="sa-modalDetalle" onclick="saCerrarModalDetalle(event)">
    <div class="sa-modal-box wide">
      <button class="sa-modal-close" onclick="saCerrarModalDetalle()">✕</button>
      <div id="sa-modalDetalleBody"></div>
    </div>
  </div>

  <!-- ── Modal SA: detalle de alumno ───────────────────────────── -->
  <div class="sa-modal-overlay" id="sa-modalAlumno" onclick="saCerrarModalAlumno(event)">
    <div class="sa-modal-box" style="max-width:620px">
      <button class="sa-modal-close" onclick="saCerrarModalAlumno()">✕</button>
      <div id="sa-modalAlumnoBody"></div>
    </div>
  </div>

  <!-- ── Modal SA: renovar créditos y vigencia de admin ───────── -->
  <div class="sa-modal-overlay" id="sa-modalRenovar" onclick="saCerrarModalRenovar(event)">
    <div class="sa-modal-box">
      <button class="sa-modal-close" onclick="saCerrarModalRenovar()">✕</button>
      <div class="sa-modal-title">Renovar acceso de admin</div>
      <div class="sa-modal-subtitle" id="sa-renovarNombre"></div>
      <div class="renovar-form">
        <div class="renovar-field">
          <label>Créditos</label>
          <input type="number" id="sa-renovarCreditos" class="renovar-input" min="0" max="9999" placeholder="Ej. 10">
        </div>
        <div class="renovar-field">
          <label>Vigencia hasta</label>
          <input type="date" id="sa-renovarVigencia" class="renovar-input">
        </div>
      </div>
      <p class="crear-msg" id="sa-renovarMsg"></p>
      <div class="modal-btns">
        <button class="btn-secondary" onclick="saCerrarModalRenovar()">Cancelar</button>
        <button class="btn-primary" id="sa-btnConfirmarRenovar" onclick="saConfirmarRenovar()">Guardar renovación</button>
      </div>
    </div>
  </div>

  <!-- ── Modal SA: crear nuevo administrador ───────────────────── -->
  <div class="sa-modal-overlay" id="sa-modalCrearAdmin" onclick="saCerrarModalCrearAdmin(event)">
    <div class="sa-modal-box">
      <button class="sa-modal-close" onclick="saCerrarModalCrearAdmin()">✕</button>
      <div class="sa-modal-title">Crear nuevo administrador</div>
      <div class="sa-modal-subtitle">Se creará la cuenta y se enviará un correo de bienvenida con el enlace de acceso.</div>
      <div class="crear-admin-grid">
        <div class="crear-admin-field">
          <label>Nombre</label>
          <input type="text" id="sa-caEmail_nombre" placeholder="Juan" autocomplete="off">
        </div>
        <div class="crear-admin-field">
          <label>Apellido</label>
          <input type="text" id="sa-caEmail_apellido" placeholder="Pérez" autocomplete="off">
        </div>
        <div class="crear-admin-field full">
          <label>Correo electrónico</label>
          <input type="email" id="sa-caEmail_email" placeholder="admin@empresa.com" autocomplete="off">
        </div>
        <div class="crear-admin-field">
          <label>Créditos iniciales</label>
          <input type="number" id="sa-caEmail_creditos" value="10" min="0" max="9999">
        </div>
        <div class="crear-admin-field">
          <label>Vigencia hasta</label>
          <input type="date" id="sa-caEmail_vigencia">
        </div>
      </div>
      <p class="crear-msg" id="sa-crearAdminMsg"></p>
      <div class="modal-btns">
        <button class="btn-secondary" onclick="saCerrarModalCrearAdmin()">Cancelar</button>
        <button class="btn-primary" id="sa-btnConfirmarCrearAdmin" onclick="saConfirmarCrearAdmin()">Crear y enviar email</button>
      </div>
    </div>
  </div>

  <!-- ── Modal: Ver/resolver ticket SA ─────────────────────────────── -->
  <div class="sa-modal-overlay" id="sa-modalTicketSA" onclick="saCerrarTicketModalSA(event)">
    <div class="sa-modal-box" style="max-width:680px">
      <button class="sa-modal-close" onclick="saCerrarTicketModalSA()">✕</button>
      <div id="sa-modalTicketBody"></div>
    </div>
  </div>

  <!-- ── Modal: Editar FAQ del KB ──────────────────────────────────── -->
  <div class="sa-modal-overlay" id="sa-modalEditarFaq" onclick="saCerrarModalEditarFaq(event)">
    <div class="sa-modal-box" style="max-width:560px">
      <button class="sa-modal-close" onclick="saCerrarModalEditarFaq()">✕</button>
      <div class="sa-modal-title">✏️ Editar FAQ</div>
      <input type="hidden" id="sa-editFaqId">
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
        <div class="form-field">
          <label>Pregunta</label>
          <input type="text" id="sa-editFaqPregunta" placeholder="Pregunta frecuente...">
        </div>
        <div class="form-field">
          <label>Categoría</label>
          <input type="text" id="sa-editFaqCategoria" placeholder="general">
        </div>
      </div>
      <div class="form-field" style="margin-bottom:12px">
        <label>Respuesta</label>
        <textarea id="sa-editFaqRespuesta" rows="5" style="width:100%;box-sizing:border-box;padding:9px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;font-family:inherit;background:var(--c-surface);resize:vertical;outline:none" placeholder="Respuesta completa..."></textarea>
      </div>
      <div class="form-field" style="margin-bottom:16px">
        <label>Contexto</label>
        <select id="sa-editFaqContexto" class="sa-select" style="width:100%">
          <option value="general">general</option>
          <option value="wizard">wizard</option>
          <option value="erp">erp</option>
          <option value="pagos">pagos</option>
        </select>
      </div>
      <p class="form-msg" id="sa-editFaqMsg"></p>
      <div class="modal-btns">
        <button class="btn-secondary" onclick="saCerrarModalEditarFaq()">Cancelar</button>
        <button class="btn-primary" id="sa-btnGuardarEdicionFaq" onclick="saGuardarEdicionFaq()">Guardar cambios</button>
      </div>
    </div>
  </div>
`;
