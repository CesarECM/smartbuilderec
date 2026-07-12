    const BACKEND_URL = "https://smartbuilderec.onrender.com";

    // ── Banner de vista simulada (superadmin) ─────────────────────────────────
    function _renderViewAsBanner(modo) {
      const labels = { admin: "Admin", alumno: "Alumno", evaluador: "Evaluador", asesor: "Asesor" };
      const b = document.createElement("div");
      b.style.cssText = "position:fixed;top:0;left:0;right:0;z-index:10000;background:#f59e0b;color:#78350f;padding:9px 20px;display:flex;align-items:center;justify-content:space-between;gap:12px;font-size:13px;font-weight:600;box-shadow:0 2px 8px rgba(0,0,0,0.12)";
      b.innerHTML = `<span>👁️ Vista simulada: <strong>${labels[modo] || modo}</strong></span><a href="superadmin" onclick="localStorage.removeItem('sbe_view_as')" style="color:#7c2d12;font-weight:700;text-decoration:none;background:#fde68a;padding:5px 14px;border-radius:6px;font-size:12px">← Volver a Super Admin</a>`;
      document.body.prepend(b);
      document.body.style.paddingTop = (parseInt(document.body.style.paddingTop||"0") + 44) + "px";
    }

    // ── Utilidades ────────────────────────────────────────────────────────────
    function iniciales(n, a) {
      return ((n?.[0] || "") + (a?.[0] || "")).toUpperCase() || "U";
    }

    function fmtFecha(iso) {
      if (!iso) return null;
      return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "long", year: "numeric" });
    }

    function fmtFechaCorta(iso) {
      if (!iso) return null;
      return new Date(iso.includes("T") ? iso : iso + "T12:00:00")
        .toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
    }

    function calcDiasRestantes(fechaISO) {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      const meta = new Date(fechaISO.includes("T") ? fechaISO : fechaISO + "T12:00:00");
      return Math.ceil((meta - hoy) / 86400000);
    }

    // ── HTML: tarjeta de norma ────────────────────────────────────────────────
    function renderNormaCard(s, planeaciones) {
      const norma      = s.norma || {};
      const pagos      = s.pagos || {};
      const cert       = s.certificacion || {};
      const asesor     = s.asesor;
      const evaluador  = s.evaluador;

      // Buscar planeación activa de esta norma (solo EC0217.01 por ahora)
      const planeacion = norma.tiene_wizard
        ? (planeaciones[0] || null)
        : null;

      return `
        <div class="norma-card">
          <!-- Cabecera -->
          <div class="norma-header">
            <div class="norma-header-left">
              <span class="norma-codigo">${norma.codigo || ""}</span>
              <span class="norma-nombre">${norma.nombre || ""}</span>
            </div>
            ${norma.tiene_wizard
              ? `<span class="norma-badge-wizard">Con asistente IA</span>`
              : `<span class="norma-badge-wizard" style="background:rgba(255,255,255,0.10);">Presencial</span>`
            }
          </div>

          <div class="norma-body">

            <!-- Asesor / Evaluador -->
            <div class="asignados-row">
              <div class="asignado-chip">
                <span class="asignado-icon">👤</span>
                <div class="asignado-info">
                  <span class="asignado-rol">Asesor</span>
                  ${asesor
                    ? `<span class="asignado-nombre">${[asesor.nombre, asesor.apellido].filter(Boolean).join(" ")}</span>`
                    : `<span class="asignado-vacio">Por asignar</span>`
                  }
                </div>
              </div>
              <div class="asignado-chip">
                <span class="asignado-icon">📋</span>
                <div class="asignado-info">
                  <span class="asignado-rol">Evaluador</span>
                  ${evaluador
                    ? `<span class="asignado-nombre">${[evaluador.nombre, evaluador.apellido].filter(Boolean).join(" ")}</span>`
                    : `<span class="asignado-vacio">Por asignar</span>`
                  }
                </div>
              </div>
            </div>

            <hr class="norma-divider">

            <!-- Pagos -->
            <p class="seccion-label">Pagos</p>
            <div class="pagos-row">
              ${renderPagoPill("Alineación",    pagos.alineacion)}
              ${renderPagoPill("Evaluación",    pagos.evaluacion)}
              ${renderPagoPill("Certificación", pagos.certificacion)}
            </div>

            <!-- Wizard (solo EC0217.01) -->
            ${norma.tiene_wizard ? renderWizardSection(planeacion) : ""}

            <hr class="norma-divider">

            <!-- Proceso CONOCER -->
            <p class="seccion-label">Proceso de certificación CONOCER</p>
            ${renderTimeline(cert)}

          </div>
        </div>`;
    }

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

      // El paso "activo" es el primero que no está done
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

      // Cuenta regresiva
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

      // Redirigir si no es alumno (bypass si superadmin está en modo vista)
      if (perfil.rol === "super_admin") {
        const viewAs = localStorage.getItem("sbe_view_as");
        if (!viewAs || !["evaluador","asesor","alumno"].includes(viewAs)) {
          window.location.href = "superadmin"; return;
        }
        _renderViewAsBanner(viewAs);
      }
      if (perfil.rol === "admin")       { window.location.href = "admin"; return; }

      const nombre = [perfil.nombre, perfil.apellido].filter(Boolean).join(" ") || "usuario";
      document.getElementById("headerAvatar").textContent = iniciales(perfil.nombre, perfil.apellido);
      document.getElementById("headerNombre").textContent = nombre;
      document.getElementById("tituloWelcome").textContent = `Mi expediente, ${perfil.nombre || nombre}`;

      await cargarServicios(perfil);
    }

    async function cargarServicios(perfil) {
      const contenido = document.getElementById("contenido");

      try {
        // Llamada al backend
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

        // Cargar planeaciones del alumno para el progreso del wizard
        const { data: planes } = await _supabase
          .from("planeaciones")
          .select("id, nombre_curso, paso_actual, status, updated_at")
          .eq("user_id", perfil.id)
          .order("updated_at", { ascending: false });

        // Renderizar todas las tarjetas
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
