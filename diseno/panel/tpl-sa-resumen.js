document.getElementById('sa-panel-resumen').innerHTML = `
        <div class="stats-row" id="sa-stats">
          <div class="stat-card purple">
            <div class="stat-icon">👑</div>
            <div><div class="stat-num" id="sa-statAdmins">—</div><div class="stat-label">Admins activos</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">👥</div>
            <div><div class="stat-num" id="sa-statUsuarios">—</div><div class="stat-label">Usuarios totales</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">📚</div>
            <div><div class="stat-num" id="sa-statPlaneaciones">—</div><div class="stat-label">Planeaciones</div></div>
          </div>
          <div class="stat-card">
            <div class="stat-icon">🪙</div>
            <div><div class="stat-num" id="sa-statCreditos">—</div><div class="stat-label">Créditos totales</div></div>
          </div>
        </div>

        <div class="integ-section">
          <div class="integ-header">
            <div>
              <div class="integ-title">Estado de integraciones</div>
              <div class="integ-meta" id="sa-integLastCheck"></div>
            </div>
            <button class="btn-sm" id="sa-btnVerificar" onclick="verificarIntegraciones()">↺ Verificar</button>
          </div>
          <div class="integ-grid">

            <div class="integ-card" id="sa-integ-claude">
              <span class="led led-gray" id="sa-led-claude"></span>
              <div class="integ-icon">🤖</div>
              <div class="integ-body">
                <div><div class="integ-name">Claude AI</div><div class="integ-desc">Chat · Feedback loop</div></div>
                <span class="integ-badge gray" id="sa-badge-claude">—</span>
              </div>
            </div>

            <div class="integ-card" id="sa-integ-openai">
              <span class="led led-gray" id="sa-led-openai"></span>
              <div class="integ-icon">⚡</div>
              <div class="integ-body">
                <div><div class="integ-name">OpenAI</div><div class="integ-desc">Embeddings · RAG</div></div>
                <span class="integ-badge gray" id="sa-badge-openai">—</span>
              </div>
            </div>

            <div class="integ-card" id="sa-integ-supabase">
              <span class="led led-gray" id="sa-led-supabase"></span>
              <div class="integ-icon">🗄️</div>
              <div class="integ-body">
                <div><div class="integ-name">Supabase</div><div class="integ-desc">Base de datos · Auth</div></div>
                <span class="integ-badge gray" id="sa-badge-supabase">—</span>
              </div>
            </div>

            <div class="integ-card" id="sa-integ-pgvector">
              <span class="led led-gray" id="sa-led-pgvector"></span>
              <div class="integ-icon">🔍</div>
              <div class="integ-body">
                <div><div class="integ-name">pgvector / RAG</div><div class="integ-desc">Búsqueda semántica</div></div>
                <span class="integ-badge gray" id="sa-badge-pgvector">—</span>
              </div>
            </div>

            <div class="integ-card" id="sa-integ-resend">
              <span class="led led-gray" id="sa-led-resend"></span>
              <div class="integ-icon">📧</div>
              <div class="integ-body">
                <div><div class="integ-name">Resend Email</div><div class="integ-desc">Notificaciones · Alertas</div></div>
                <span class="integ-badge gray" id="sa-badge-resend">—</span>
              </div>
            </div>

            <div class="integ-card" id="sa-integ-stripe">
              <span class="led led-gray" id="sa-led-stripe"></span>
              <div class="integ-icon">💳</div>
              <div class="integ-body">
                <div><div class="integ-name">Stripe</div><div class="integ-desc">Pagos · Suscripciones</div></div>
                <span class="integ-badge gray" id="sa-badge-stripe">—</span>
              </div>
            </div>

            <div class="integ-card" id="sa-integ-docs">
              <span class="led led-gray" id="sa-led-docs"></span>
              <div class="integ-icon">📄</div>
              <div class="integ-body">
                <div><div class="integ-name">Generador Docs</div><div class="integ-desc">DOCX · PPTX</div></div>
                <span class="integ-badge gray" id="sa-badge-docs">—</span>
              </div>
            </div>

            <div class="integ-card" id="sa-integ-stripe_pagos">
              <span class="led led-gray" id="sa-led-stripe_pagos"></span>
              <div class="integ-icon">💰</div>
              <div class="integ-body">
                <div><div class="integ-name">Último Pago</div><div class="integ-desc">Stripe · Checkout</div></div>
                <span class="integ-badge gray" id="sa-badge-stripe_pagos">—</span>
              </div>
            </div>

            <div class="integ-card" id="sa-integ-tokens_ia">
              <span class="led led-gray" id="sa-led-tokens_ia"></span>
              <div class="integ-icon">🧮</div>
              <div class="integ-body">
                <div><div class="integ-name">Tokens IA Hoy</div><div class="integ-desc">OpenAI · Costo estimado</div></div>
                <span class="integ-badge gray" id="sa-badge-tokens_ia">—</span>
              </div>
            </div>

            <div class="integ-card" id="sa-integ-tickets_kb">
              <span class="led led-gray" id="sa-led-tickets_kb"></span>
              <div class="integ-icon">🎫</div>
              <div class="integ-body">
                <div><div class="integ-name">Tickets Soporte</div><div class="integ-desc">Sin resolver</div></div>
                <span class="integ-badge gray" id="sa-badge-tickets_kb">—</span>
              </div>
            </div>

            <div class="integ-card" id="sa-integ-sugerencias_kb">
              <span class="led led-gray" id="sa-led-sugerencias_kb"></span>
              <div class="integ-icon">💡</div>
              <div class="integ-body">
                <div><div class="integ-name">Sugerencias IA</div><div class="integ-desc">Sin aplicar</div></div>
                <span class="integ-badge gray" id="sa-badge-sugerencias_kb">—</span>
              </div>
            </div>

            <div class="integ-card" id="sa-integ-vigencias_proximas">
              <span class="led led-gray" id="sa-led-vigencias_proximas"></span>
              <div class="integ-icon">⏳</div>
              <div class="integ-body">
                <div><div class="integ-name">Vigencias</div><div class="integ-desc">Admins por vencer ≤7 días</div></div>
                <span class="integ-badge gray" id="sa-badge-vigencias_proximas">—</span>
              </div>
            </div>

            <div class="integ-card" id="sa-integ-admins_sin_creditos">
              <span class="led led-gray" id="sa-led-admins_sin_creditos"></span>
              <div class="integ-icon">🪙</div>
              <div class="integ-body">
                <div><div class="integ-name">Créditos</div><div class="integ-desc">Admins en 0 créditos</div></div>
                <span class="integ-badge gray" id="sa-badge-admins_sin_creditos">—</span>
              </div>
            </div>

            <div class="integ-card" id="sa-integ-usuarios_sin_plan"
                 onclick="saAbrirSinPlan()" style="cursor:pointer" title="Ver usuarios sin planeación">
              <span class="led led-gray" id="sa-led-usuarios_sin_plan"></span>
              <div class="integ-icon">👤</div>
              <div class="integ-body">
                <div><div class="integ-name">Sin planeación</div><div class="integ-desc">Usuarios +7 días inactivos</div></div>
                <span class="integ-badge gray" id="sa-badge-usuarios_sin_plan">—</span>
              </div>
            </div>

          </div>
        </div>
`;
