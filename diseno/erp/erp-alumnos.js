// ── Tabla de alumnos ──────────────────────────────────────────────────────
function renderTablaAlumnos(lista) {
  const tbody = document.getElementById("tbodyAlumnos");
  if (!lista.length) {
    tbody.innerHTML = `<tr><td colspan="5" class="empty-txt">No hay alumnos registrados.</td></tr>`;
    return;
  }

  tbody.innerHTML = lista.map(a => {
    const normas  = a.normas || [];
    const sinPago = a.normas_sin_pago || [];

    const normaChips = normas.map(n => {
      const esSinPago = sinPago.some(s => s.norma_id === n.norma_id);
      return `<span class="norma-chip ${esSinPago ? 'sin-pago' : ''}" title="${n.nombre}">${n.codigo || "?"}</span>`;
    }).join("") || `<span style="font-size:11px;color:var(--c-text-4)">Sin normas</span>`;

    let semColor = "gris", semLabel = "Sin inscripción";
    if (normas.length > 0) {
      if (sinPago.length === 0)             { semColor = "verde";   semLabel = "Al día"; }
      else if (sinPago.length < normas.length) { semColor = "naranja"; semLabel = "Parcial"; }
      else                                   { semColor = "naranja"; semLabel = "Sin pagos"; }
    }

    return `
      <tr>
        <td>
          <div class="alumno-nombre">${[a.nombre, a.apellido].filter(Boolean).join(" ") || "—"}</div>
          <div class="alumno-email">${a.email || ""}</div>
        </td>
        <td>${normaChips}</td>
        <td>
          <div class="semaforo">
            <span class="sem-dot ${semColor}"></span>
            <span class="sem-label">${semLabel}</span>
          </div>
        </td>
        <td>
          <span style="font-size:12px;color:var(--c-text-3)">Ver detalle</span>
        </td>
        <td>
          <div style="display:flex;gap:5px;flex-wrap:wrap">
            <button class="btn-sm azul" onclick="verDetalle('${a.id}')">Ver detalle</button>
            <button class="btn-sm pago" onclick="abrirModalPago('${a.id}','${(a.nombre||'')+' '+(a.apellido||'')}')">+ Pago</button>
            <button class="btn-sm eval" onclick="abrirModalEvaluado('${a.id}','${(a.nombre||'')+' '+(a.apellido||'')}')">Evaluado</button>
            <button class="btn-sm" onclick="abrirModalLote('${a.id}','${(a.nombre||'')+' '+(a.apellido||'')}')">Lote CONOCER</button>
          </div>
        </td>
      </tr>`;
  }).join("");
}

function filtrarAlumnos() {
  const q          = document.getElementById("searchAlumno").value.toLowerCase();
  const normaFiltro = document.getElementById("filtroNorma").value;
  const pagoFiltro  = document.getElementById("filtroPago").value;

  const filtrada = _alumnos.filter(a => {
    const nombre = [a.nombre, a.apellido, a.email].filter(Boolean).join(" ").toLowerCase();
    if (q && !nombre.includes(q)) return false;
    if (normaFiltro && !a.normas.some(n => n.norma_id === normaFiltro)) return false;
    if (pagoFiltro === "pendientes" && !a.tiene_pendientes) return false;
    if (pagoFiltro === "con-pago"   && a.pagos_count === 0) return false;
    return true;
  });

  renderTablaAlumnos(filtrada);
}

// ── Modal: Detalle alumno ─────────────────────────────────────────────────
async function verDetalle(alumnoId) {
  abrirModal("modalDetalle");
  document.getElementById("detalleContenido").innerHTML = `<p class="loading-txt">Cargando...</p>`;

  try {
    const data = await apiFetch(`/erp/admin/alumnos/${alumnoId}/detalle`);
    const a        = data.alumno   || {};
    const servicios = data.servicios || [];
    const nombre    = [a.nombre, a.apellido].filter(Boolean).join(" ") || a.email;

    let html = `
      <div class="modal-title">${nombre}</div>
      <div class="modal-subtitle">${a.email || ""}</div>`;

    if (!servicios.length) {
      html += `<p style="color:var(--c-text-3);font-size:13px">Este alumno no tiene normas asignadas todavía.</p>`;
    }

    servicios.forEach(s => {
      const norma  = s.norma         || {};
      const pagos  = s.pagos         || {};
      const cert   = s.certificacion || {};
      const asesor = s.asesor;
      const eval_  = s.evaluador;

      const etapas = [
        { titulo: "Evaluación realizada",       done: !!cert.evaluado_at,            fecha: cert.evaluado_at            ? fmtFechaCorta(cert.evaluado_at)            : null },
        { titulo: "Lote enviado al CONOCER",    done: !!cert.lote_enviado_at,        fecha: cert.lote_enviado_at        ? fmtFechaCorta(cert.lote_enviado_at)        : null },
        { titulo: "Certificado esperado",       done: !!cert.certificado_esperado_at, fecha: cert.certificado_esperado_at ? fmtFechaCorta(cert.certificado_esperado_at) : null },
        { titulo: "Certificado recibido",       done: !!cert.certificado_recibido_at, fecha: cert.certificado_recibido_at ? fmtFechaCorta(cert.certificado_recibido_at) : null },
      ];

      let foundActive = false;
      const tlHtml = etapas.map(e => {
        let cls = "pending";
        if (e.done) { cls = "done"; }
        else if (!foundActive) { cls = "active"; foundActive = true; }
        return `
          <div class="tl-step ${cls}">
            <div class="tl-dot"></div>
            <div class="tl-title">${e.titulo}</div>
            ${e.fecha ? `<div class="tl-fecha">${e.fecha}</div>` : ""}
          </div>`;
      }).join("");

      const conceptos = ["alineacion", "evaluacion", "certificacion"];
      const pagosHtml = conceptos.map(c => {
        const p = pagos[c];
        return `
          <div class="pago-row-detalle ${p ? 'pagado' : ''}">
            <div class="pago-row-dot"></div>
            <span class="pago-row-concepto">${c.charAt(0).toUpperCase() + c.slice(1)}</span>
            <span class="pago-row-info">${p ? `Pagado ${fmtFechaCorta(p.pagado_at)}` : "Pendiente"}</span>
            ${!p ? `<button class="btn-sm pago" style="margin-left:8px;font-size:10px" onclick="cerrarModal('modalDetalle');abrirModalPago('${alumnoId}','${nombre}','${norma.id}','${c}')">+ Pagar</button>` : ""}
          </div>`;
      }).join("");

      html += `
        <div class="detalle-section">
          <h4>${norma.codigo} · ${norma.nombre}</h4>
          <div style="display:flex;gap:12px;margin-bottom:14px;flex-wrap:wrap">
            <span style="font-size:12px;color:var(--c-text-3)">Asesor: <strong style="color:var(--c-text)">${asesor ? [asesor.nombre,asesor.apellido].filter(Boolean).join(" ") : "No asignado"}</strong></span>
            <span style="font-size:12px;color:var(--c-text-3)">Evaluador: <strong style="color:var(--c-text)">${eval_ ? [eval_.nombre,eval_.apellido].filter(Boolean).join(" ") : "No asignado"}</strong></span>
          </div>
          <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--c-text-3);margin-bottom:8px">Pagos</p>
          ${pagosHtml}
          <p style="font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;color:var(--c-text-3);margin:14px 0 10px">Proceso CONOCER</p>
          <div class="tl">${tlHtml}</div>
        </div>`;
    });

    document.getElementById("detalleContenido").innerHTML = html;
  } catch (e) {
    document.getElementById("detalleContenido").innerHTML =
      `<p class="error-txt">Error al cargar detalle: ${e.message}</p>`;
  }
}
