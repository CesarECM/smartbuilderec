    function renderPagoPill(concepto, pago) {
      const pagado = !!pago;
      return `
        <div class="pago-pill ${pagado ? "pagado" : "pendiente"}">
          <span class="pago-dot"></span>
          <span class="pago-concepto">${concepto}</span>
          ${pagado && pago.pagado_at
            ? `<span class="pago-fecha">${fmtFechaCorta(pago.pagado_at)}</span>`
            : (!pagado ? `<span class="pago-fecha">Pendiente</span>` : "")
          }
        </div>`;
    }

    function renderWizardSection(planeacion) {
      if (!planeacion) {
        return `
          <hr class="norma-divider">
          <p class="seccion-label">Asistente de alineación (EC0217.01)</p>
          <div style="display:flex;align-items:center;gap:12px;background:var(--c-surface-2);border:1px solid var(--c-border);border-radius:var(--r-md);padding:12px 16px;">
            <span style="font-size:20px">📋</span>
            <div>
              <div style="font-size:13px;font-weight:600;color:var(--c-text)">No tienes cursos creados aún</div>
              <div style="font-size:12px;color:var(--c-text-3)">Ve a "Mis cursos" para comenzar tu expediente didáctico.</div>
            </div>
            <a href="dashboard" class="btn-ir-wizard" style="margin-top:0;flex-shrink:0">Ir al asistente →</a>
          </div>`;
      }

      const paso = planeacion.paso_actual || 1;
      const pct  = Math.round(((paso - 1) / 15) * 100);
      const esCompleta = planeacion.status === "completa";

      return `
        <hr class="norma-divider">
        <p class="seccion-label">Asistente de alineación (EC0217.01)</p>
        <div class="wizard-barra-wrap">
          <div class="wizard-meta">
            <span>${planeacion.nombre_curso || "Mi curso"}</span>
            <strong>${esCompleta ? "Completado" : `Paso ${paso} / 16`}</strong>
          </div>
          <div class="progress-track">
            <div class="progress-fill ${esCompleta ? "completa" : ""}" style="width:${esCompleta ? 100 : pct}%"></div>
          </div>
          <a href="dashboard" class="btn-ir-wizard">
            ${esCompleta ? "Ver expediente" : "Continuar asistente"} →
          </a>
        </div>`;
    }

    function renderTimeline(cert) {
      const etapa = cert.etapa || "pendiente";

      const steps = [
        {
          key:     "evaluacion",
          titulo:  "Evaluación realizada",
          done:    !!cert.evaluado_at,
          fecha:   cert.evaluado_at ? fmtFecha(cert.evaluado_at) : null,
          detalle: cert.evaluacion_notas || null,
        },
        {
          key:    "lote",
          titulo: "Lote enviado al CONOCER",
          done:   !!cert.lote_enviado_at,
          fecha:  cert.lote_enviado_at ? fmtFecha(cert.lote_enviado_at) : null,
        },
        {
          key:    "espera",
          titulo: "Certificado en trámite",
          done:   !!cert.certificado_esperado_at,
          fecha:  cert.certificado_esperado_at ? `Esperado el ${fmtFechaCorta(cert.certificado_esperado_at)}` : null,
        },
        {
          key:    "recibido",
          titulo: "Certificado recibido",
          done:   !!cert.certificado_recibido_at,
          fecha:  cert.certificado_recibido_at ? fmtFecha(cert.certificado_recibido_at) : null,
        },
      ];

      let foundActive = false;
      const stepsHtml = steps.map(s => {
        let clase = "pending";
        if (s.done) {
          clase = "done";
        } else if (!foundActive) {
          clase    = "active";
          foundActive = true;
        }

        const iconoDone = `<svg width="8" height="8" viewBox="0 0 10 8" fill="none">
          <path d="M1 4L4 7L9 1" stroke="white" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>`;

        return `
          <div class="timeline-step ${clase}">
            <div class="timeline-dot">${s.done ? iconoDone : ""}</div>
            <div class="timeline-step-title">${s.titulo}</div>
            ${s.fecha ? `<div class="timeline-step-fecha">${s.fecha}</div>` : ""}
            ${s.detalle ? `<div class="timeline-step-fecha" style="margin-top:2px;font-style:italic">"${s.detalle}"</div>` : ""}
          </div>`;
      }).join("");

      let countdownHtml = "";
      if (cert.certificado_recibido_at) {
        countdownHtml = `
          <div class="countdown-box listo" style="margin-top:14px">
            <span style="font-size:28px">🎉</span>
            <div class="countdown-label">
              <strong>¡Certificado recibido!</strong>
              ${fmtFecha(cert.certificado_recibido_at)}
            </div>
          </div>`;
      } else if (cert.certificado_esperado_at) {
        const dias = calcDiasRestantes(cert.certificado_esperado_at);
        if (dias <= 0) {
          countdownHtml = `
            <div class="countdown-box listo" style="margin-top:14px">
              <span style="font-size:22px">📬</span>
              <div class="countdown-label">
                <strong>El certificado debería estar en camino</strong>
                Fecha estimada: ${fmtFechaCorta(cert.certificado_esperado_at)}
              </div>
            </div>`;
        } else {
          const urgente = dias <= 10;
          countdownHtml = `
            <div class="countdown-box ${urgente ? "urgente" : ""}" style="margin-top:14px">
              <div>
                <div class="countdown-num">${dias}</div>
              </div>
              <div class="countdown-label">
                <strong>día${dias !== 1 ? "s" : ""} restante${dias !== 1 ? "s" : ""}</strong>
                para recibir tu certificado CONOCER<br>
                <span style="font-size:11px;opacity:0.75">Fecha estimada: ${fmtFechaCorta(cert.certificado_esperado_at)}</span>
              </div>
            </div>`;
        }
      }

      return `
        <div class="timeline">${stepsHtml}</div>
        ${countdownHtml}`;
    }

    // ── Inicialización ────────────────────────────────────────────────────────
    async function init() {
      const session = await authGuard();
      if (!session) return;

      const perfil = await getUserProfile();
      if (!perfil) { window.location.href = "login"; return; }

      if (perfil.rol === "super_admin") {
        const viewAs = localStorage.getItem("sbe_view_as");
        if (!viewAs || !["evaluador","asesor","alumno"].includes(viewAs)) {
          window.location.href = "superadmin"; return;
        }
        _renderViewAsBanner(viewAs);
      }
      if (perfil.rol === "admin") { window.location.href = "admin"; return; }

      const nombre = [perfil.nombre, perfil.apellido].filter(Boolean).join(" ") || "usuario";
      document.getElementById("headerAvatar").textContent = iniciales(perfil.nombre, perfil.apellido);
      document.getElementById("headerNombre").textContent = nombre;
      document.getElementById("tituloWelcome").textContent = `Mi expediente, ${perfil.nombre || nombre}`;

      await cargarServicios(perfil);
    }

    async function cargarServicios(perfil) {
      const contenido = document.getElementById("contenido");

      try {
        const headers = await getAuthHeaders();
        const res  = await fetch(`${BACKEND_URL}/erp/mis-servicios`, { headers });

        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.detail || `Error ${res.status}`);
        }

        const data = await res.json();
        const servicios = data.servicios || [];

        if (!servicios.length) {
          contenido.innerHTML = `
            <div class="empty-state">
              <div class="empty-state-icon">📄</div>
              <h3>Aún no tienes normas asignadas</h3>
              <p>Tu asesor o administrador te inscribirá en los estándares correspondientes. Mientras tanto puedes usar el asistente de planeación didáctica.</p>
            </div>`;
          return;
        }

        const { data: planes } = await _supabase
          .from("planeaciones")
          .select("id, nombre_curso, paso_actual, status, updated_at")
          .eq("user_id", perfil.id)
          .order("updated_at", { ascending: false });

        contenido.innerHTML = servicios
          .map(s => renderNormaCard(s, planes || []))
          .join("");

      } catch (err) {
        console.error("[mi-expediente] Error:", err);
        contenido.innerHTML = `
          <div class="error-box">
            No se pudo cargar tu expediente. Intenta recargar la página.<br>
            <small style="opacity:0.75">${err.message}</small>
          </div>`;
      }
    }

    init();
