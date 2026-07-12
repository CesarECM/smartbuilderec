document.getElementById('erp-modals').innerHTML = `
  <!-- ══ MODAL: Detalle alumno ══════════════════════════════════════════��════ -->
  <div class="modal-overlay" id="modalDetalle">
    <div class="modal-box wide">
      <button class="modal-close" onclick="cerrarModal('modalDetalle')">✕</button>
      <div id="detalleContenido"><p class="loading-txt">Cargando...</p></div>
    </div>
  </div>

  <!-- ══ MODAL: Pago manual ══════════════════════════════════════════════════ -->
  <div class="modal-overlay" id="modalPago">
    <div class="modal-box">
      <button class="modal-close" onclick="cerrarModal('modalPago')">✕</button>
      <div class="modal-title">Registrar pago manual</div>
      <div class="modal-subtitle" id="pagoAlumnoNombre"></div>
      <div class="form-grid one">
        <div class="form-field">
          <label>Norma</label>
          <select id="pagoNormaId"></select>
        </div>
        <div class="form-field">
          <label>Concepto</label>
          <select id="pagoConcepto">
            <option value="alineacion">Alineación (Wizard)</option>
            <option value="evaluacion">Evaluación CONOCER</option>
            <option value="certificacion">Emisión de certificado</option>
          </select>
        </div>
        <div class="form-field">
          <label>Monto (MXN, opcional)</label>
          <input type="number" id="pagoMonto" placeholder="0" min="0">
        </div>
        <div class="form-field">
          <label>Referencia (opcional)</label>
          <input type="text" id="pagoReferencia" placeholder="Ej. TRANSF-001, recibo #123">
        </div>
        <div class="form-field full">
          <label>Notas (opcional)</label>
          <textarea id="pagoNotas" placeholder="Observaciones del pago..."></textarea>
        </div>
      </div>
      <div id="pagoMsg" class="form-msg"></div>
      <div class="modal-actions">
        <button class="btn-cancelar" onclick="cerrarModal('modalPago')">Cancelar</button>
        <button class="btn-primary" onclick="registrarPago()" id="btnRegistrarPago">Registrar pago</button>
      </div>
    </div>
  </div>

  <!-- ══ MODAL: Evaluado ════════════════════════════════════════════════════ -->
  <div class="modal-overlay" id="modalEvaluado">
    <div class="modal-box">
      <button class="modal-close" onclick="cerrarModal('modalEvaluado')">✕</button>
      <div class="modal-title">Registrar evaluación exitosa</div>
      <div class="modal-subtitle" id="evalAlumnoNombre"></div>
      <div class="form-grid one">
        <div class="form-field">
          <label>Norma</label>
          <select id="evalNormaId"></select>
        </div>
        <div class="form-field">
          <label>Fecha de evaluación</label>
          <input type="date" id="evalFecha">
        </div>
        <div class="form-field full">
          <label>Notas (opcional)</label>
          <textarea id="evalNotas" placeholder="Resultado, observaciones..."></textarea>
        </div>
      </div>
      <div id="evalMsg" class="form-msg"></div>
      <div class="modal-actions">
        <button class="btn-cancelar" onclick="cerrarModal('modalEvaluado')">Cancelar</button>
        <button class="btn-primary" onclick="registrarEvaluado()" id="btnRegistrarEval">Registrar</button>
      </div>
    </div>
  </div>

  <!-- ══ MODAL: Lote enviado ════════════════════════════════════════════════ -->
  <div class="modal-overlay" id="modalLote">
    <div class="modal-box">
      <button class="modal-close" onclick="cerrarModal('modalLote')">✕</button>
      <div class="modal-title">Registrar envío de lote al CONOCER</div>
      <div class="modal-subtitle" id="loteAlumnoNombre"></div>
      <div class="form-grid one">
        <div class="form-field">
          <label>Norma</label>
          <select id="loteNormaId"></select>
        </div>
        <div class="form-field">
          <label>Fecha de envío del lote</label>
          <input type="date" id="loteFecha">
        </div>
        <div class="form-field full">
          <label>Notas (opcional)</label>
          <textarea id="loteNotas" placeholder="Número de lote, folio, observaciones..."></textarea>
        </div>
      </div>
      <div id="loteMsg" class="form-msg"></div>
      <div class="modal-actions">
        <button class="btn-cancelar" onclick="cerrarModal('modalLote')">Cancelar</button>
        <button class="btn-primary" onclick="registrarLote()" id="btnRegistrarLote">Registrar envío</button>
      </div>
    </div>
  </div>

  <!-- ══ MODAL: Asignar rol ═════════════════════════════════════════════════ -->
  <div class="modal-overlay" id="modalRol">
    <div class="modal-box">
      <button class="modal-close" onclick="cerrarModal('modalRol')">✕</button>
      <div class="modal-title">Asignar rol adicional</div>
      <div class="modal-subtitle">El usuario mantiene su rol actual y además tendrá este nuevo rol.</div>
      <div class="form-grid one">
        <div class="form-field">
          <label>Usuario</label>
          <select id="rolUserId"></select>
        </div>
        <div class="form-field">
          <label>Rol</label>
          <select id="rolTipo">
            <option value="evaluador">Evaluador CONOCER</option>
            <option value="asesor">Asesor</option>
          </select>
        </div>
      </div>
      <div id="rolMsg" class="form-msg"></div>
      <div class="modal-actions">
        <button class="btn-cancelar" onclick="cerrarModal('modalRol')">Cancelar</button>
        <button class="btn-primary" onclick="asignarRol()" id="btnAsignarRol">Asignar</button>
      </div>
    </div>
  </div>

  <!-- ══ MODAL: Norma ═══════════════════════════════════════════════════════ -->
  <div class="modal-overlay" id="modalNorma">
    <div class="modal-box">
      <button class="modal-close" onclick="cerrarModal('modalNorma')">✕</button>
      <div class="modal-title" id="normaModalTitulo">Nueva norma</div>
      <div class="form-grid">
        <div class="form-field">
          <label>Código</label>
          <input type="text" id="norCodigo" placeholder="Ej. EC0217.01">
        </div>
        <div class="form-field">
          <label>Días estimados certificado</label>
          <input type="number" id="norDias" value="45" min="1">
        </div>
        <div class="form-field full">
          <label>Nombre</label>
          <input type="text" id="norNombre" placeholder="Nombre completo de la norma">
        </div>
        <div class="form-field full">
          <label>Descripción</label>
          <textarea id="norDescripcion" placeholder="Descripción breve de la norma..."></textarea>
        </div>
        <div class="form-field">
          <label>¿Tiene wizard de alineación?</label>
          <select id="norWizard">
            <option value="false">No</option>
            <option value="true">Sí</option>
          </select>
        </div>
        <div class="form-field">
          <label>Estado</label>
          <select id="norActivo">
            <option value="true">Activa</option>
            <option value="false">Inactiva</option>
          </select>
        </div>
      </div>
      <div id="norMsg" class="form-msg"></div>
      <div class="modal-actions">
        <button class="btn-cancelar" onclick="cerrarModal('modalNorma')">Cancelar</button>
        <button class="btn-primary" onclick="guardarNorma()" id="btnGuardarNorma">Guardar</button>
      </div>
    </div>
  </div>
`;
