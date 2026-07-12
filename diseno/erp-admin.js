    const BACKEND_URL = "https://smartbuilderec.onrender.com";

    let _perfil     = null;
    let _esSuper    = false;
    let _alumnos    = [];
    let _normas     = [];
    let _asesores   = [];
    let _evaluadores = [];
    let _alumnoActual = null; // alumno seleccionado en modal

    // ── Toast ─────────────────────────────────────────────────────────────────
    function toast(msg, ms = 3000) {
      const t = document.getElementById("toast");
      t.textContent = msg;
      t.classList.add("visible");
      setTimeout(() => t.classList.remove("visible"), ms);
    }

    // ── Tabs ──────────────────────────────────────────────────────────────────
    function switchTab(id, btn) {
      document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
      document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
      document.getElementById("panel-" + id).classList.add("active");
      btn.classList.add("active");

      if (id === "roles")  cargarRoles();
      if (id === "normas") cargarNormasTabla();
    }

    // ── Modal helpers ─────────────────────────────────────────────────────────
    function abrirModal(id) {
      document.getElementById(id).classList.add("open");
    }
    function cerrarModal(id) {
      document.getElementById(id).classList.remove("open");
    }
    document.querySelectorAll(".modal-overlay").forEach(m => {
      m.addEventListener("click", e => { if (e.target === m) m.classList.remove("open"); });
    });

    // ── Utilidades ────────────────────────────────────────────────────────────
    function fmtFechaCorta(iso) {
      if (!iso) return "—";
      return new Date(iso.includes("T") ? iso : iso + "T12:00:00")
        .toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
    }

    function iniciales(n, a) {
      return ((n?.[0] || "") + (a?.[0] || "")).toUpperCase() || "?";
    }

    async function apiFetch(path, opts = {}) {
      const headers = await getAuthHeaders();
      const res = await fetch(BACKEND_URL + path, { ...opts, headers: { ...headers, ...(opts.headers || {}) } });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.detail || `Error ${res.status}`);
      }
      return res.json();
    }

    // ── Inicialización ────────────────────────────────────────────────────────
    async function init() {
      const session = await authGuard();
      if (!session) return;

      _perfil = await getUserProfile();
      if (!_perfil) { window.location.href = "login"; return; }

      const rolValido = _perfil.rol === "admin" || _perfil.rol === "super_admin";
      if (!rolValido) {
        // Puede ser evaluador/asesor con rol 'user' — verificar
        // Por ahora redirigir a dashboard si no es admin
        window.location.href = "panel";
        return;
      }

      _esSuper = _perfil.rol === "super_admin";
      const nombre = [_perfil.nombre, _perfil.apellido].filter(Boolean).join(" ") || _perfil.email;
      document.getElementById("headerNombre").textContent = nombre;
      document.getElementById("rolBadge").textContent = _esSuper ? "Super Admin" : "Admin";

      if (_esSuper) {
        document.getElementById("tabRoles").style.display = "flex";
        document.getElementById("tabNormas").style.display = "flex";
      }

      await Promise.all([cargarNormas(), cargarAlumnos(), cargarPersonas()]);
      poblarSelectsInscripcion();
    }

    // ── Datos base ────────────────────────────────────────────────────────────
    async function cargarNormas() {
      try {
        const data = await apiFetch("/erp/normas" + (_esSuper ? "?todas=true" : ""));
        _normas = data.normas || [];
        // Poblar filtro de normas
        const filtro = document.getElementById("filtroNorma");
        _normas.forEach(n => {
          const opt = document.createElement("option");
          opt.value = n.id;
          opt.textContent = n.codigo;
          filtro.appendChild(opt);
        });
      } catch (e) { console.warn("Error cargando normas:", e.message); }
    }

    async function cargarPersonas() {
      // Cargar todos los profiles para selects de asesor/evaluador
      try {
        const { data } = await _supabase
          .from("profiles")
          .select("id, nombre, apellido, email, rol")
          .order("nombre");
        const todos = data || [];
        _asesores    = todos;
        _evaluadores = todos;
      } catch (e) {}
    }

    async function cargarAlumnos() {
      try {
        const data = await apiFetch("/erp/admin/alumnos");
        _alumnos = data.alumnos || [];
        renderTablaAlumnos(_alumnos);
        actualizarStats();
      } catch (e) {
        document.getElementById("tbodyAlumnos").innerHTML =
          `<tr><td colspan="5" class="error-txt">Error: ${e.message}</td></tr>`;
      }
    }

    function actualizarStats() {
      const total = _alumnos.length;
      const conPago = _alumnos.filter(a => a.pagos_count > 0).length;
      const pendientes = _alumnos.filter(a => a.tiene_pendientes).length;
      // Evaluados = alumnos con alguna asignacion que tenga proceso de evaluacion completado
      // (no tenemos ese dato aquí, aproximamos con los que tienen normas pero usamos 0 por ahora)
      document.getElementById("statTotal").textContent = total;
      document.getElementById("statConPago").textContent = conPago;
      document.getElementById("statPendientes").textContent = pendientes;
      // statEvaluados se puede calcular aparte, por ahora —
      document.getElementById("statEvaluados").textContent = "—";
    }

    // ── Tabla de alumnos ──────────────────────────────────────────────────────
    function renderTablaAlumnos(lista) {
      const tbody = document.getElementById("tbodyAlumnos");
      if (!lista.length) {
        tbody.innerHTML = `<tr><td colspan="5" class="empty-txt">No hay alumnos registrados.</td></tr>`;
        return;
      }

      tbody.innerHTML = lista.map(a => {
        const normas = a.normas || [];
        const sinPago = a.normas_sin_pago || [];

        const normaChips = normas.map(n => {
          const esSinPago = sinPago.some(s => s.norma_id === n.norma_id);
          return `<span class="norma-chip ${esSinPago ? 'sin-pago' : ''}" title="${n.nombre}">${n.codigo || "?"}</span>`;
        }).join("") || `<span style="font-size:11px;color:var(--c-text-4)">Sin normas</span>`;

        // Semáforo de pagos
        let semColor = "gris", semLabel = "Sin inscripción";
        if (normas.length > 0) {
          if (sinPago.length === 0) { semColor = "verde"; semLabel = "Al día"; }
          else if (sinPago.length < normas.length) { semColor = "naranja"; semLabel = "Parcial"; }
          else { semColor = "naranja"; semLabel = "Sin pagos"; }
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
      const q = document.getElementById("searchAlumno").value.toLowerCase();
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
        const a = data.alumno || {};
        const servicios = data.servicios || [];

        const nombre = [a.nombre, a.apellido].filter(Boolean).join(" ") || a.email;

        let html = `
          <div class="modal-title">${nombre}</div>
          <div class="modal-subtitle">${a.email || ""}</div>`;

        if (!servicios.length) {
          html += `<p style="color:var(--c-text-3);font-size:13px">Este alumno no tiene normas asignadas todavía.</p>`;
        }

        servicios.forEach(s => {
          const norma = s.norma || {};
          const pagos = s.pagos || {};
          const cert  = s.certificacion || {};
          const asesor = s.asesor;
          const eval_  = s.evaluador;

          const etapas = [
            { titulo: "Evaluación realizada", done: !!cert.evaluado_at, fecha: cert.evaluado_at ? fmtFechaCorta(cert.evaluado_at) : null },
            { titulo: "Lote enviado al CONOCER", done: !!cert.lote_enviado_at, fecha: cert.lote_enviado_at ? fmtFechaCorta(cert.lote_enviado_at) : null },
            { titulo: "Certificado esperado", done: !!cert.certificado_esperado_at, fecha: cert.certificado_esperado_at ? fmtFechaCorta(cert.certificado_esperado_at) : null },
            { titulo: "Certificado recibido", done: !!cert.certificado_recibido_at, fecha: cert.certificado_recibido_at ? fmtFechaCorta(cert.certificado_recibido_at) : null },
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

    // ── Modal: Pago manual ────────────────────────────────────────────────────
    function abrirModalPago(alumnoId, alumnoNombre, normaId = "", concepto = "") {
      _alumnoActual = alumnoId;
      document.getElementById("pagoAlumnoNombre").textContent = "Alumno: " + alumnoNombre.trim();
      document.getElementById("pagoMsg").textContent = "";
      document.getElementById("pagoMonto").value = "";
      document.getElementById("pagoReferencia").value = "";
      document.getElementById("pagoNotas").value = "";
      if (concepto) document.getElementById("pagoConcepto").value = concepto;

      // Poblar normas del alumno
      const alumno = _alumnos.find(a => a.id === alumnoId);
      const sel = document.getElementById("pagoNormaId");
      sel.innerHTML = "";
      const normasAlumno = alumno?.normas || [];
      if (normasAlumno.length) {
        normasAlumno.forEach(n => {
          const opt = document.createElement("option");
          opt.value = n.norma_id;
          opt.textContent = `${n.codigo} — ${n.nombre}`;
          if (n.norma_id === normaId) opt.selected = true;
          sel.appendChild(opt);
        });
      } else {
        // Fallback: usar todas las normas
        _normas.forEach(n => {
          const opt = document.createElement("option");
          opt.value = n.id;
          opt.textContent = `${n.codigo} — ${n.nombre}`;
          if (n.id === normaId) opt.selected = true;
          sel.appendChild(opt);
        });
      }

      abrirModal("modalPago");
    }

    async function registrarPago() {
      const btn = document.getElementById("btnRegistrarPago");
      const msg = document.getElementById("pagoMsg");
      btn.disabled = true;
      msg.className = "form-msg";
      msg.textContent = "Guardando...";

      try {
        await apiFetch("/erp/admin/pagos/manual", {
          method: "POST",
          body: JSON.stringify({
            alumno_id:  _alumnoActual,
            norma_id:   document.getElementById("pagoNormaId").value,
            concepto:   document.getElementById("pagoConcepto").value,
            monto:      parseInt(document.getElementById("pagoMonto").value || "0") * 100,
            referencia: document.getElementById("pagoReferencia").value || null,
            notas:      document.getElementById("pagoNotas").value || null,
          }),
        });
        msg.className = "form-msg ok";
        msg.textContent = "Pago registrado correctamente.";
        toast("Pago registrado");
        await cargarAlumnos();
        setTimeout(() => cerrarModal("modalPago"), 1200);
      } catch (e) {
        msg.className = "form-msg err";
        msg.textContent = "Error: " + e.message;
      } finally {
        btn.disabled = false;
      }
    }

    // ── Modal: Evaluado ───────────────────────────────────────────────────────
    function abrirModalEvaluado(alumnoId, alumnoNombre) {
      _alumnoActual = alumnoId;
      document.getElementById("evalAlumnoNombre").textContent = "Alumno: " + alumnoNombre.trim();
      document.getElementById("evalFecha").value = new Date().toISOString().split("T")[0];
      document.getElementById("evalNotas").value = "";
      document.getElementById("evalMsg").textContent = "";

      const alumno = _alumnos.find(a => a.id === alumnoId);
      const sel = document.getElementById("evalNormaId");
      sel.innerHTML = "";
      (alumno?.normas || _normas.map(n => ({norma_id: n.id, codigo: n.codigo, nombre: n.nombre}))).forEach(n => {
        const opt = document.createElement("option");
        opt.value = n.norma_id || n.id;
        opt.textContent = `${n.codigo} — ${n.nombre}`;
        sel.appendChild(opt);
      });

      abrirModal("modalEvaluado");
    }

    async function registrarEvaluado() {
      const btn = document.getElementById("btnRegistrarEval");
      const msg = document.getElementById("evalMsg");
      btn.disabled = true;
      msg.className = "form-msg";
      msg.textContent = "Guardando...";

      try {
        await apiFetch("/erp/certificacion/evaluado", {
          method: "POST",
          body: JSON.stringify({
            alumno_id:         _alumnoActual,
            norma_id:          document.getElementById("evalNormaId").value,
            evaluado_at:       document.getElementById("evalFecha").value,
            evaluacion_notas:  document.getElementById("evalNotas").value || null,
          }),
        });
        msg.className = "form-msg ok";
        msg.textContent = "Evaluación registrada.";
        toast("Evaluación registrada");
        await cargarAlumnos();
        setTimeout(() => cerrarModal("modalEvaluado"), 1200);
      } catch (e) {
        msg.className = "form-msg err";
        msg.textContent = "Error: " + e.message;
      } finally {
        btn.disabled = false;
      }
    }

    // ── Modal: Lote enviado ───────────────────────────────────────────────────
    function abrirModalLote(alumnoId, alumnoNombre) {
      _alumnoActual = alumnoId;
      document.getElementById("loteAlumnoNombre").textContent = "Alumno: " + alumnoNombre.trim();
      document.getElementById("loteFecha").value = new Date().toISOString().split("T")[0];
      document.getElementById("loteNotas").value = "";
      document.getElementById("loteMsg").textContent = "";

      const alumno = _alumnos.find(a => a.id === alumnoId);
      const sel = document.getElementById("loteNormaId");
      sel.innerHTML = "";
      (alumno?.normas || _normas.map(n => ({norma_id: n.id, codigo: n.codigo, nombre: n.nombre}))).forEach(n => {
        const opt = document.createElement("option");
        opt.value = n.norma_id || n.id;
        opt.textContent = `${n.codigo} — ${n.nombre}`;
        sel.appendChild(opt);
      });

      abrirModal("modalLote");
    }

    async function registrarLote() {
      const btn = document.getElementById("btnRegistrarLote");
      const msg = document.getElementById("loteMsg");
      btn.disabled = true;
      msg.className = "form-msg";
      msg.textContent = "Guardando...";

      try {
        const result = await apiFetch("/erp/certificacion/lote-enviado", {
          method: "POST",
          body: JSON.stringify({
            alumno_id:       _alumnoActual,
            norma_id:        document.getElementById("loteNormaId").value,
            lote_enviado_at: document.getElementById("loteFecha").value,
            notas:           document.getElementById("loteNotas").value || null,
          }),
        });
        const esperado = result.certificado_esperado_at;
        msg.className = "form-msg ok";
        msg.textContent = `Lote registrado. Certificado esperado: ${esperado ? fmtFechaCorta(esperado) : "calculado"}`;
        toast("Lote enviado registrado");
        await cargarAlumnos();
        setTimeout(() => cerrarModal("modalLote"), 1800);
      } catch (e) {
        msg.className = "form-msg err";
        msg.textContent = "Error: " + e.message;
      } finally {
        btn.disabled = false;
      }
    }

    // ── Inscribir alumno ──────────────────────────────────────────────────────
    function poblarSelectsInscripcion() {
      // Alumnos
      const selAlumno = document.getElementById("inscAlumno");
      const selAlumnoRol = document.getElementById("rolUserId");
      selAlumno.innerHTML = `<option value="">— Selecciona un alumno —</option>`;
      if (selAlumnoRol) selAlumnoRol.innerHTML = `<option value="">— Selecciona un usuario —</option>`;

      // Super admin puede inscribirse a sí mismo como alumno en cualquier norma
      if (_perfil.rol === "super_admin") {
        const optSelf = document.createElement("option");
        optSelf.value = _perfil.id;
        const nomSelf = [_perfil.nombre, _perfil.apellido].filter(Boolean).join(" ") || "Super Admin";
        optSelf.textContent = `⭐ ${nomSelf} (yo — Super Admin)`;
        selAlumno.appendChild(optSelf);
      }

      _alumnos.forEach(a => {
        if (a.id === _perfil.id) return; // evitar duplicado si ya apareció en la API
        const label = [a.nombre, a.apellido].filter(Boolean).join(" ") + ` (${a.email})`;
        [selAlumno].forEach(sel => {
          const opt = document.createElement("option");
          opt.value = a.id;
          opt.textContent = label;
          sel.appendChild(opt);
        });
      });

      // Para rol: todos los usuarios (asesores, evaluadores)
      if (selAlumnoRol) {
        _asesores.forEach(p => {
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.textContent = [p.nombre, p.apellido].filter(Boolean).join(" ") + ` (${p.email})`;
          selAlumnoRol.appendChild(opt);
        });
      }

      // Normas
      const selNorma = document.getElementById("inscNorma");
      selNorma.innerHTML = `<option value="">— Selecciona una norma —</option>`;
      _normas.forEach(n => {
        const opt = document.createElement("option");
        opt.value = n.id;
        opt.textContent = `${n.codigo} — ${n.nombre}`;
        selNorma.appendChild(opt);
      });

      // Asesor y evaluador
      const selAsesor    = document.getElementById("inscAsesor");
      const selEvaluador = document.getElementById("inscEvaluador");
      selAsesor.innerHTML    = `<option value="">— Sin asignar —</option>`;
      selEvaluador.innerHTML = `<option value="">— Sin asignar —</option>`;
      _asesores.forEach(p => {
        const label = [p.nombre, p.apellido].filter(Boolean).join(" ") + ` (${p.email})`;
        [selAsesor, selEvaluador].forEach(sel => {
          const opt = document.createElement("option");
          opt.value = p.id;
          opt.textContent = label;
          sel.appendChild(opt);
        });
      });
    }

    async function inscribirAlumno() {
      const btn = document.getElementById("btnInscribir");
      const msg = document.getElementById("inscMsg");
      const alumnoId    = document.getElementById("inscAlumno").value;
      const normaId     = document.getElementById("inscNorma").value;
      const asesorId    = document.getElementById("inscAsesor").value;
      const evaluadorId = document.getElementById("inscEvaluador").value;

      if (!alumnoId || !normaId) {
        msg.className = "form-msg err";
        msg.textContent = "Selecciona un alumno y una norma.";
        return;
      }

      btn.disabled = true;
      msg.className = "form-msg";
      msg.textContent = "Guardando...";

      try {
        await apiFetch("/erp/admin/asignaciones", {
          method: "POST",
          body: JSON.stringify({
            alumno_id:    alumnoId,
            norma_id:     normaId,
            asesor_id:    asesorId || null,
            evaluador_id: evaluadorId || null,
          }),
        });
        msg.className = "form-msg ok";
        msg.textContent = "Alumno inscrito correctamente.";
        toast("Alumno inscrito");
        await cargarAlumnos();
        poblarSelectsInscripcion();
        setTimeout(() => { msg.textContent = ""; }, 3000);
      } catch (e) {
        msg.className = "form-msg err";
        msg.textContent = "Error: " + e.message;
      } finally {
        btn.disabled = false;
      }
    }

    // ── Roles (solo super_admin) ──────────────────────────────────────────────
    async function cargarRoles() {
      if (!_esSuper) return;
      try {
        const data = await apiFetch("/erp/admin/roles");
        const roles = data.roles || [];
        const tbody = document.getElementById("tbodyRoles");
        if (!roles.length) {
          tbody.innerHTML = `<tr><td colspan="4" class="empty-txt">No hay roles asignados.</td></tr>`;
          return;
        }
        tbody.innerHTML = roles.map(r => {
          const p = r.profiles || {};
          const nombre = [p.nombre, p.apellido].filter(Boolean).join(" ") || p.email || "—";
          return `
            <tr>
              <td>
                <div style="font-weight:600;color:var(--c-text)">${nombre}</div>
                <div style="font-size:11px;color:var(--c-text-3)">${p.email || ""}</div>
              </td>
              <td><span class="role-chip ${r.role === 'asesor' ? 'asesor' : ''}">${r.role}</span></td>
              <td style="font-size:12px;color:var(--c-text-3)">${fmtFechaCorta(r.created_at)}</td>
              <td>
                <button class="btn-sm" style="color:#991b1b;border-color:#fca5a5"
                  onclick="quitarRol('${r.user_id}','${r.role}')">Quitar</button>
              </td>
            </tr>`;
        }).join("");
      } catch (e) {
        document.getElementById("tbodyRoles").innerHTML =
          `<tr><td colspan="4" class="error-txt">Error: ${e.message}</td></tr>`;
      }
    }

    function abrirModalAsignarRol() {
      document.getElementById("rolMsg").textContent = "";
      abrirModal("modalRol");
    }

    async function asignarRol() {
      const btn = document.getElementById("btnAsignarRol");
      const msg = document.getElementById("rolMsg");
      btn.disabled = true;
      msg.className = "form-msg";
      msg.textContent = "Guardando...";
      try {
        await apiFetch("/erp/admin/roles/asignar", {
          method: "POST",
          body: JSON.stringify({
            user_id: document.getElementById("rolUserId").value,
            role:    document.getElementById("rolTipo").value,
          }),
        });
        msg.className = "form-msg ok";
        msg.textContent = "Rol asignado.";
        toast("Rol asignado");
        cargarRoles();
        setTimeout(() => cerrarModal("modalRol"), 1200);
      } catch (e) {
        msg.className = "form-msg err";
        msg.textContent = "Error: " + e.message;
      } finally {
        btn.disabled = false;
      }
    }

    async function quitarRol(userId, role) {
      if (!confirm(`¿Quitar rol "${role}" a este usuario?`)) return;
      try {
        await apiFetch(`/erp/admin/roles/quitar?user_id=${userId}&role=${role}`, { method: "DELETE" });
        toast("Rol removido");
        cargarRoles();
      } catch (e) {
        alert("Error: " + e.message);
      }
    }

    // ── Normas (solo super_admin) ─────────────────────────────────────────────
    let _normaEditando = null;

    async function cargarNormasTabla() {
      if (!_esSuper) return;
      try {
        const data = await apiFetch("/erp/normas?todas=true");
        const normas = data.normas || [];
        const tbody = document.getElementById("tbodyNormas");
        if (!normas.length) {
          tbody.innerHTML = `<tr><td colspan="6" class="empty-txt">No hay normas.</td></tr>`;
          return;
        }
        tbody.innerHTML = normas.map(n => `
          <tr>
            <td style="font-weight:700;color:var(--c-blue-600)">${n.codigo}</td>
            <td style="color:var(--c-text);font-size:13px">${n.nombre}</td>
            <td style="font-size:12px">${n.dias_estimados_certificado} días</td>
            <td>${n.tiene_wizard ? '<span style="color:#065f46;font-size:12px;font-weight:600">Sí</span>' : '<span style="color:var(--c-text-4);font-size:12px">No</span>'}</td>
            <td><span class="status-badge" style="${n.activo ? 'background:#d1fae5;color:#065f46' : 'background:#fee2e2;color:#991b1b'}">${n.activo ? 'Activa' : 'Inactiva'}</span></td>
            <td><button class="btn-sm" onclick="abrirModalNorma('${n.id}')">Editar</button></td>
          </tr>`).join("");
      } catch (e) {
        document.getElementById("tbodyNormas").innerHTML =
          `<tr><td colspan="6" class="error-txt">Error: ${e.message}</td></tr>`;
      }
    }

    function abrirModalNorma(normaId = null) {
      _normaEditando = normaId;
      document.getElementById("normaModalTitulo").textContent = normaId ? "Editar norma" : "Nueva norma";
      document.getElementById("norMsg").textContent = "";

      if (normaId) {
        const n = _normas.find(x => x.id === normaId) || {};
        document.getElementById("norCodigo").value = n.codigo || "";
        document.getElementById("norNombre").value = n.nombre || "";
        document.getElementById("norDescripcion").value = n.descripcion || "";
        document.getElementById("norDias").value = n.dias_estimados_certificado || 45;
        document.getElementById("norWizard").value = String(!!n.tiene_wizard);
        document.getElementById("norActivo").value = String(!!n.activo);
      } else {
        ["norCodigo","norNombre","norDescripcion"].forEach(id => document.getElementById(id).value = "");
        document.getElementById("norDias").value = 45;
        document.getElementById("norWizard").value = "false";
        document.getElementById("norActivo").value = "true";
      }

      abrirModal("modalNorma");
    }

    async function guardarNorma() {
      const btn = document.getElementById("btnGuardarNorma");
      const msg = document.getElementById("norMsg");
      btn.disabled = true;
      msg.className = "form-msg";
      msg.textContent = "Guardando...";

      const payload = {
        codigo:                     document.getElementById("norCodigo").value.trim(),
        nombre:                     document.getElementById("norNombre").value.trim(),
        descripcion:                document.getElementById("norDescripcion").value.trim(),
        dias_estimados_certificado: parseInt(document.getElementById("norDias").value || "45"),
        tiene_wizard:               document.getElementById("norWizard").value === "true",
        activo:                     document.getElementById("norActivo").value === "true",
      };

      if (!payload.codigo || !payload.nombre) {
        msg.className = "form-msg err";
        msg.textContent = "Código y nombre son requeridos.";
        btn.disabled = false;
        return;
      }

      try {
        if (_normaEditando) {
          await apiFetch(`/erp/normas/${_normaEditando}`, { method: "PUT", body: JSON.stringify(payload) });
        } else {
          await apiFetch("/erp/normas", { method: "POST", body: JSON.stringify(payload) });
        }
        msg.className = "form-msg ok";
        msg.textContent = "Norma guardada.";
        toast("Norma guardada");
        await cargarNormas();
        cargarNormasTabla();
        setTimeout(() => cerrarModal("modalNorma"), 1200);
      } catch (e) {
        msg.className = "form-msg err";
        msg.textContent = "Error: " + e.message;
      } finally {
        btn.disabled = false;
      }
    }

    // Agregar clase status-badge a los estilos usados en normasTabla
    const _style = document.createElement("style");
    _style.textContent = `.status-badge{font-size:10px;font-weight:700;text-transform:uppercase;padding:2px 8px;border-radius:20px;display:inline-block}`;
    document.head.appendChild(_style);

    init();
