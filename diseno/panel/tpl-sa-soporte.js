document.getElementById('sa-panel-soporte').innerHTML = `
        <nav class="sp-tab-bar">
          <button class="sp-tab-btn active" id="sa-sptab-tickets"          onclick="saShowSoporteTab('tickets')">🎫 Tickets <span class="sp-badge" id="sa-sp-badge-tickets"></span></button>
          <button class="sp-tab-btn"        id="sa-sptab-sugerencias"      onclick="saShowSoporteTab('sugerencias')">💡 Sugerencias IA <span class="sp-badge sp-badge-gray" id="sa-sp-badge-sugerencias"></span></button>
          <button class="sp-tab-btn"        id="sa-sptab-kb"               onclick="saShowSoporteTab('kb')">📚 KB</button>
          <button class="sp-tab-btn"        id="sa-sptab-bajo-rendimiento" onclick="saShowSoporteTab('bajo-rendimiento')">📉 Bajo rendimiento</button>
        </nav>

        <!-- ── Tickets ─────────────────────────────────────────────── -->
        <div id="sa-sppanel-tickets" class="sp-panel active">
          <div class="sec-header">
            <h2>🎫 Tickets de soporte</h2>
            <button class="btn-sm" onclick="saCargarTicketsSA()">↺ Actualizar</button>
          </div>
          <input class="search-input" type="search" placeholder="Buscar ticket..." style="margin-bottom:16px" oninput="saFiltrarTicketsSA(this.value)">
          <div id="sa-listaTicketsSA"><p class="loading-txt">Cargando tickets...</p></div>
        </div>

        <!-- ── Sugerencias IA ─────────────────────────────────────── -->
        <div id="sa-sppanel-sugerencias" class="sp-panel">
          <div class="sec-header">
            <h2>💡 Sugerencias IA</h2>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
              <select id="sa-filtroSugTipo" class="vigencia-select" onchange="saFiltrarSugerenciasTipo()">
                <option value="">Todas</option>
                <option value="nueva_faq">Nueva FAQ</option>
                <option value="editar_faq">Editar FAQ</option>
                <option value="eliminar_faq">Eliminar FAQ</option>
                <option value="unir_faqs">Unir FAQs</option>
                <option value="nuevo_recurso">Nuevo recurso</option>
              </select>
              <button class="btn-sm" onclick="saCargarSugerencias('pendiente')">↺ Actualizar</button>
            </div>
          </div>
          <div id="sa-listaSugerencias"><p class="loading-txt">Cargando sugerencias...</p></div>
        </div>

        <!-- ── KB ─────────────────────────────────────────────────── -->
        <div id="sa-sppanel-kb" class="sp-panel">
          <div class="sec-header">
            <h2>📚 Base de conocimiento</h2>
            <div style="display:flex;gap:8px;flex-wrap:wrap;align-items:center">
              <input class="search-input" type="search" id="sa-kbSearch" placeholder="Buscar KB..." oninput="saFiltrarKB()">
              <button class="btn-primary" style="font-size:13px;padding:7px 14px" onclick="document.getElementById('sa-nuevaFaqForm').style.display='block'">+ Nueva FAQ</button>
            </div>
          </div>

          <!-- FAQs collapsible -->
          <div class="kb-section" id="sa-kbFaqsSection">
            <div class="kb-section-hdr" onclick="saToggleKBSection('sa-kbFaqsBody')">
              <span>📋 FAQs <span class="badge-count" id="sa-faqCount"></span></span>
              <span class="arrow">▶</span>
            </div>
            <div class="kb-section-body" id="sa-kbFaqsBody">
              <!-- nueva FAQ inline form -->
              <div id="sa-nuevaFaqForm" style="background:var(--c-surface-2);border:1.5px solid var(--c-border);border-radius:var(--r-lg);padding:16px 18px;margin-bottom:16px;display:none">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px">
                  <div class="form-field">
                    <label>Pregunta</label>
                    <input type="text" id="sa-faqPregunta" placeholder="Pregunta frecuente...">
                  </div>
                  <div class="form-field">
                    <label>Categoría</label>
                    <input type="text" id="sa-faqCategoria" value="general" placeholder="general">
                  </div>
                </div>
                <div class="form-field" style="margin-bottom:10px">
                  <label>Respuesta</label>
                  <textarea id="sa-faqRespuesta" rows="3" placeholder="Respuesta completa..."></textarea>
                </div>
                <div style="display:flex;gap:8px;align-items:center;flex-wrap:wrap">
                  <select id="sa-faqContexto" class="vigencia-select">
                    <option value="general">general</option>
                    <option value="wizard">wizard</option>
                    <option value="erp">erp</option>
                    <option value="pagos">pagos</option>
                  </select>
                  <button class="btn-primary" style="font-size:13px;padding:7px 14px" id="sa-btnGuardarFaq" onclick="saGuardarFaq()">Guardar FAQ</button>
                  <button class="btn-sm" onclick="document.getElementById('sa-nuevaFaqForm').style.display='none'">Cancelar</button>
                  <p class="form-msg" id="sa-faqMsg" style="margin:0"></p>
                </div>
              </div>
              <div id="sa-listaFaqs"><p class="loading-txt">Cargando FAQs...</p></div>
            </div>
          </div>

          <!-- Recursos collapsible -->
          <div class="kb-section" style="margin-top:12px" id="sa-kbRecursosSection">
            <div class="kb-section-hdr" onclick="saToggleKBSection('sa-kbRecursosBody')">
              <span>📄 Recursos <span class="badge-count" id="sa-recursosCount"></span></span>
              <span class="arrow">▶</span>
            </div>
            <div class="kb-section-body" id="sa-kbRecursosBody">
              <!-- nuevo recurso inline form -->
              <div id="sa-nuevoRecursoForm" style="background:var(--c-surface-2);border:1.5px solid var(--c-border);border-radius:var(--r-lg);padding:16px 18px;margin-bottom:16px">
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px">
                  <div class="form-field">
                    <label>Título</label>
                    <input type="text" id="sa-recursoTitulo" placeholder="Título del recurso...">
                  </div>
                  <div class="form-field">
                    <label>Tipo</label>
                    <select id="sa-recursoTipo" style="width:100%;padding:8px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;background:var(--c-surface);color:var(--c-text)">
                      <option value="articulo">Artículo</option>
                      <option value="video">Video</option>
                      <option value="guia">Guía</option>
                      <option value="plantilla">Plantilla</option>
                    </select>
                  </div>
                </div>
                <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:10px">
                  <div class="form-field">
                    <label>URL (opcional)</label>
                    <input type="url" id="sa-recursoUrl" placeholder="https://...">
                  </div>
                  <div class="form-field">
                    <label>Contexto</label>
                    <select id="sa-recursoContexto" style="width:100%;padding:8px 12px;border:1.5px solid var(--c-border);border-radius:var(--r-sm);font-size:13px;background:var(--c-surface);color:var(--c-text)">
                      <option value="general">general</option>
                      <option value="wizard">wizard</option>
                      <option value="erp">erp</option>
                      <option value="pagos">pagos</option>
                    </select>
                  </div>
                </div>
                <div class="form-field" style="margin-bottom:10px">
                  <label>Contenido</label>
                  <textarea id="sa-recursoContenido" rows="4" placeholder="Contenido completo del recurso (se vectorizará)..."></textarea>
                </div>
                <div style="display:flex;gap:8px;align-items:center">
                  <button class="btn-primary" style="font-size:13px;padding:7px 14px" id="sa-btnGuardarRecurso" onclick="saGuardarRecurso()">Guardar recurso</button>
                  <p class="form-msg" id="sa-recursoMsg" style="margin:0"></p>
                </div>
              </div>
              <div id="sa-listaRecursos"><p class="loading-txt">Cargando recursos...</p></div>
            </div>
          </div>
        </div><!-- /sp-panel kb -->

        <!-- ── Bajo rendimiento ─────────────────────────────────── -->
        <div id="sa-sppanel-bajo-rendimiento" class="sp-panel">
          <div class="sec-header">
            <h2>📉 FAQs con bajo rendimiento</h2>
            <div style="display:flex;gap:8px">
              <button class="btn-sm" onclick="saCargarBajoRendimiento()">↺ Actualizar</button>
              <button class="btn-sm" onclick="saAnalizarLoteBR()">🤖 Analizar todas</button>
            </div>
          </div>
          <p style="font-size:13px;color:var(--c-text-3);margin-bottom:16px">FAQs con ≥20 exposiciones sin votos útiles o con mayoría de votos negativos.</p>
          <div id="sa-listaBR"><p class="loading-txt">Cargando...</p></div>
        </div>
`;
