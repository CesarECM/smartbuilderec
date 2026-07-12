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

      const planeacion = norma.tiene_wizard
        ? (planeaciones[0] || null)
        : null;

      return `
        <div class="norma-card">
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

            <p class="seccion-label">Pagos</p>
            <div class="pagos-row">
              ${renderPagoPill("Alineación",    pagos.alineacion)}
              ${renderPagoPill("Evaluación",    pagos.evaluacion)}
              ${renderPagoPill("Certificación", pagos.certificacion)}
            </div>

            ${norma.tiene_wizard ? renderWizardSection(planeacion) : ""}

            <hr class="norma-divider">

            <p class="seccion-label">Proceso de certificación CONOCER</p>
            ${renderTimeline(cert)}

          </div>
        </div>`;
    }
