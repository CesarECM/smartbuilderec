document.getElementById('sa-panel-usuarios').innerHTML = `
        <div class="sec-header">
          <h2>👥 Usuarios &amp; Roles</h2>
          <div class="sec-actions">
            <input type="text" id="sa-searchUnificado" class="search-input"
              placeholder="🔍 Buscar nombre o email..." oninput="saFiltrarUnificada(this.value)">
            <button class="btn-sm" onclick="document.getElementById('sa-promoverPanel').classList.toggle('visible');document.getElementById('sa-buscarEmail').focus()">⬆️ Promover a admin</button>
            <button class="btn-sm" onclick="saAbrirModalCrearAdmin()">✨ Nuevo admin</button>
            <button class="btn-primary" onclick="document.getElementById('sa-crearUsuarioPanel').classList.toggle('visible');document.getElementById('sa-saNombre').focus()">➕ Crear usuario</button>
          </div>
        </div>

        <!-- Promover existente -->
        <div class="panel-colapsable" id="sa-promoverPanel">
          <p>El usuario debe estar registrado en la plataforma. Busca por correo y asígnale créditos iniciales.</p>
          <div class="promover-form">
            <div class="promover-field" style="flex:1;min-width:200px">
              <label for="sa-buscarEmail">Correo del usuario</label>
              <input type="email" id="sa-buscarEmail" class="promover-input" placeholder="usuario@ejemplo.com">
            </div>
            <div class="promover-field">
              <label for="sa-creditosAsignar">Créditos iniciales</label>
              <input type="number" id="sa-creditosAsignar" class="promover-input" min="0" max="9999" value="10">
            </div>
            <div class="promover-field">
              <label for="sa-vigenciaAsignar">Vigencia hasta</label>
              <input type="date" id="sa-vigenciaAsignar" class="promover-input">
            </div>
            <button class="btn-primary" id="sa-btnBuscar" onclick="saBuscarUsuario()">Buscar</button>
          </div>
          <div id="sa-resultadoBusqueda" class="resultado-busqueda"></div>
        </div>

        <!-- Crear usuario -->
        <div class="panel-colapsable" id="sa-crearUsuarioPanel">
          <p>Crea un usuario directamente y asígnalo a un admin. Recibirá un correo para configurar su contraseña.</p>
          <div class="crear-grid">
            <div class="crear-field"><label>Nombre</label><input type="text" id="sa-saNombre" placeholder="Juan" autocomplete="off"></div>
            <div class="crear-field"><label>Apellido</label><input type="text" id="sa-saApellido" placeholder="Pérez" autocomplete="off"></div>
            <div class="crear-field full"><label>Correo electrónico</label><input type="email" id="sa-saEmail" placeholder="juan@empresa.com" autocomplete="off"></div>
            <div class="crear-field full">
              <label>Asignar a admin</label>
              <select id="sa-saAdminId" class="sa-select">
                <option value="">Sin admin (usuario independiente)</option>
              </select>
            </div>
          </div>
          <div class="crear-actions">
            <button class="btn-secondary" onclick="document.getElementById('sa-crearUsuarioPanel').classList.remove('visible')">Cancelar</button>
            <button class="btn-primary" id="sa-btnCrearSA" onclick="saCrearUsuario()">Crear y enviar invitación</button>
          </div>
          <p class="crear-msg" id="sa-crearSAMsg"></p>
        </div>

        <div style="margin-top:12px;display:flex;align-items:center;gap:10px">
          <span class="count-tag" id="sa-countUnificado"></span>
          <button class="btn-sm" onclick="saCargarTablaUnificada()" style="font-size:11px;padding:4px 10px">↺ Actualizar</button>
        </div>
        <p style="font-size:12px;color:var(--c-text-3);margin:6px 0 0">
          Haz clic en un rol para activarlo o desactivarlo. <strong>Alumno</strong> siempre está activo.
          Activar <strong>Admin</strong> abre formulario de créditos y vigencia.
        </p>
        <div id="sa-listaUnificada" style="margin-top:12px">
          <p class="loading-txt">Cargando...</p>
        </div>

        <!-- Control de vigencias -->
        <div class="panel-section-gap">
          <div class="kb-section" id="sa-vigenciaSection">
            <div class="kb-section-hdr" onclick="saToggleVigenciaSection()">
              <div style="display:flex;align-items:center;gap:10px">
                <span style="font-size:14px;font-weight:700;color:var(--c-text)">🚦 Control de vigencias</span>
              </div>
              <div style="display:flex;align-items:center;gap:8px">
                <button class="btn-sm" onclick="event.stopPropagation();saCargarVigencia()">↺ Actualizar</button>
                <button class="btn-primary" id="sa-btnCheckVigencias"
                        onclick="event.stopPropagation();saEnviarAlertasVigencia()"
                        style="font-size:12px;padding:6px 14px">📧 Enviar alertas</button>
              </div>
            </div>
            <div class="kb-section-body" id="sa-vigenciaInnerBody">
              <div class="semaforo-stats" id="sa-semaforoStats" style="margin-top:16px">
                <div class="semaforo-stat rojo">
                  <div class="sem-num" id="sa-semRojo">—</div>
                  <div class="sem-lbl">Expirados / Inactivos</div>
                </div>
                <div class="semaforo-stat amarillo">
                  <div class="sem-num" id="sa-semAmarillo">—</div>
                  <div class="sem-lbl">Por vencer (&lt;15 días)</div>
                </div>
                <div class="semaforo-stat verde">
                  <div class="sem-num" id="sa-semVerde">—</div>
                  <div class="sem-lbl">Activos y vigentes</div>
                </div>
              </div>
              <div id="sa-vigenciaContent"><p class="empty-txt">Clic en "Actualizar" para ver el estado de vigencias.</p></div>
            </div>
          </div>
        </div>
`;
