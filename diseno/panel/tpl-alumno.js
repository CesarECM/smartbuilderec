document.getElementById('rp-alumno').innerHTML = `
      <!-- ─ Sección 1: Mis datos ─────────────────────────────────── -->
      <div class="sec-header">
        <h2>👤 Mis datos</h2>
        <div class="sec-actions" id="alumno-datos-actions">
          <button class="btn-sm" onclick="alumnoEditarDatos()">✎ Editar</button>
        </div>
      </div>
      <div id="alumno-datos-view"><p class="loading-txt">Cargando...</p></div>
      <form id="alumno-datos-form" style="display:none" onsubmit="alumnoGuardarDatos(event)">
        <div class="alm-form-grid">
          <div class="alm-field">
            <label>Nombre(s)</label>
            <input id="fd-nombre" class="alm-input" placeholder="Nombre(s)">
          </div>
          <div class="alm-field">
            <label>Apellido(s)</label>
            <input id="fd-apellido" class="alm-input" placeholder="Apellido(s)">
          </div>
          <div class="alm-field">
            <label>CURP</label>
            <input id="fd-curp" class="alm-input" placeholder="18 caracteres" maxlength="18" style="text-transform:uppercase">
          </div>
          <div class="alm-field">
            <label>Teléfono</label>
            <input id="fd-telefono" class="alm-input" type="tel" placeholder="10 dígitos">
          </div>
          <div class="alm-field" style="grid-column:1/-1">
            <label>Correo electrónico</label>
            <input id="fd-email" class="alm-input" type="email" disabled style="opacity:0.55">
            <span class="alm-hint">El correo no puede modificarse desde aquí.</span>
          </div>
          <div class="alm-field" style="grid-column:1/-1">
            <label>Currículum / Semblanza profesional</label>
            <textarea id="fd-curriculum" class="alm-input" rows="4" placeholder="Describe brevemente tu experiencia y formación como instructor..."></textarea>
          </div>
        </div>
        <div class="alm-form-actions">
          <button type="button" class="btn-secondary" onclick="alumnoCancelarEdicion()">Cancelar</button>
          <button type="submit" class="btn-primary" id="alumno-save-btn">Guardar cambios</button>
        </div>
      </form>

      <!-- ─ Sección 2: Mis planeaciones ──────────────────────────── -->
      <div class="sec-header sec-gap">
        <div>
          <h2>📋 Mis planeaciones <span class="count-tag" id="alumno-plan-count"></span></h2>
        </div>
        <div class="sec-actions" style="align-items:center;gap:12px">
          <div class="alm-slots-counter" id="alumno-slots-counter" style="display:none"></div>
          <button class="btn-primary" id="alumno-nueva-btn" onclick="alumnoNuevaPlaneacion()">+ Nueva planeación</button>
        </div>
      </div>
      <div id="alumno-degradado-banner" class="alm-degradado-banner" style="display:none">
        ⚠️ Tienes más de 5 planeaciones activas. Elimina una para poder descargar y usar la IA.
      </div>
      <div id="alumno-planeaciones"><p class="loading-txt">Cargando...</p></div>

      <!-- ─ Sección 3: Ruta de certificación ─────────────────────── -->
      <div class="sec-header sec-gap">
        <h2>🏆 Mi ruta de certificación</h2>
        <span class="count-tag">EC0217.01</span>
      </div>
      <div class="alm-stepper">
        <div class="alm-step alm-step-active">
          <div class="alm-step-icon">📋</div>
          <div class="alm-step-line"></div>
          <div class="alm-step-label">Alineación</div>
          <div class="alm-step-status alm-status-active">En curso</div>
          <a href="index?open=1" class="btn-sm" style="margin-top:10px">Ir al wizard →</a>
        </div>
        <div class="alm-step">
          <div class="alm-step-icon alm-icon-pending">🤝</div>
          <div class="alm-step-line"></div>
          <div class="alm-step-label">Evaluación</div>
          <div class="alm-step-status">Pendiente</div>
          <button class="btn-sm" style="margin-top:10px" disabled title="Tu asesor debe autorizarte primero">Solicitar evaluador</button>
          <span class="alm-step-note">Esperando autorización de asesor</span>
        </div>
        <div class="alm-step alm-step-last">
          <div class="alm-step-icon alm-icon-pending">🏆</div>
          <div class="alm-step-label">Expediente</div>
          <div class="alm-step-status">Pendiente</div>
          <button class="btn-sm" style="margin-top:10px" disabled title="Tu evaluador debe autorizarte primero">Pagar certificado</button>
          <span class="alm-step-note">Esperando autorización de evaluador</span>
        </div>
      </div>

      <!-- ─ Sección 4: Mis verificaciones EC0091 ─────────────────── -->
      <div id="alumno-ec0091-section" style="display:none">
        <div class="sec-header sec-gap">
          <div><h2>🔬 Mis verificaciones <span class="count-tag">EC0091</span></h2></div>
          <div class="sec-actions">
            <a href="ec0091?new=1" class="btn-primary">+ Nueva verificación</a>
          </div>
        </div>
        <div id="alumno-ec0091-lista"><p class="loading-txt">Cargando...</p></div>
      </div>

      <!-- ─ Sección 5: Mi portafolio EC0616 ─────────────────────── -->
      <div id="alumno-ec0616-section" style="display:none">
        <div class="sec-header sec-gap">
          <div><h2>🏥 Mi portafolio <span class="count-tag">EC0616</span></h2></div>
          <div class="sec-actions">
            <a href="ec0616?new=1" class="btn-primary">+ Nuevo portafolio</a>
          </div>
        </div>
        <div id="alumno-ec0616-lista"><p class="loading-txt">Cargando...</p></div>
      </div>
`;

document.getElementById('rp-asesor').innerHTML = `
      <div class="sec-header">
        <h2>🤝 Mis asesorados</h2>
        <button class="btn-sm" onclick="cargarPanelAsesor()">↺ Actualizar</button>
      </div>
      <p style="font-size:12px;color:var(--c-text-3);margin:-6px 0 16px">
        Alumnos que tienes asignados para acompañar en su proceso de certificación.
      </p>
      <div id="asesor-lista"><p class="loading-txt">Cargando...</p></div>
`;

document.getElementById('rp-evaluador').innerHTML = `
      <div class="sec-header">
        <h2>📋 Mis evaluados</h2>
        <button class="btn-sm" onclick="cargarPanelEvaluador()">↺ Actualizar</button>
      </div>
      <p style="font-size:12px;color:var(--c-text-3);margin:-6px 0 16px">
        Alumnos que tienes asignados para evaluar ante el CONOCER.
      </p>
      <div id="evaluador-lista"><p class="loading-txt">Cargando...</p></div>
`;
