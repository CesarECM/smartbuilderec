document.getElementById('sa-panel-config').innerHTML = `
        <div class="sec-header">
          <h2>⚙️ Plantillas de email</h2>
          <p style="font-size:13px;color:var(--c-text-3);margin:0">
            Edita el asunto y el cuerpo HTML. Usa
            <code style="background:var(--c-surface-2);padding:1px 5px;border-radius:3px">{{variable}}</code>
            para insertar datos dinámicos.
          </p>
        </div>

        <div class="tpl-list" id="sa-tplList">
          <p class="loading-txt">Cargando plantillas...</p>
        </div>

        <div class="tpl-editor" id="sa-tplEditor">
          <div class="tpl-editor-header">
            <div class="tpl-editor-title" id="sa-tplEditorTitle">Editando plantilla</div>
            <div class="tpl-editor-actions">
              <button class="btn-sm"     id="sa-btnTplTest" onclick="saTestearTemplate()">Enviar prueba</button>
              <button class="btn-primary" id="sa-btnTplSave" onclick="saGuardarTemplate()">Guardar cambios</button>
            </div>
          </div>

          <div class="tpl-field">
            <label>Asunto del email</label>
            <input type="text" id="sa-tplSubject" placeholder="Asunto del correo">
          </div>

          <div class="tpl-field">
            <label>Variables disponibles
              <span style="font-weight:400;color:var(--c-text-3)">(clic para insertar)</span>
            </label>
            <div class="tpl-vars" id="sa-tplVarsChips"></div>
          </div>

          <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start">
            <div class="tpl-field" style="margin:0">
              <label>Cuerpo HTML</label>
              <textarea id="sa-tplBodyHtml" rows="18"
                placeholder="HTML del email..." oninput="saActualizarPreview()"></textarea>
            </div>
            <div>
              <label style="display:block;font-size:12px;font-weight:600;color:var(--c-text-2);text-transform:uppercase;letter-spacing:0.03em;margin-bottom:5px">
                Vista previa
              </label>
              <div class="tpl-preview">
                <iframe id="sa-tplPreviewFrame" title="Vista previa del email"></iframe>
              </div>
            </div>
          </div>

          <p class="crear-msg" id="sa-tplMsg" style="margin-top:10px"></p>
        </div>
`;
