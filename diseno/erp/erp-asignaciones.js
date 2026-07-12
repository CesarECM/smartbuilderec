// ── Modal: Pago manual ────────────────────────────────────────────────────
function abrirModalPago(alumnoId, alumnoNombre, normaId = "", concepto = "") {
  _alumnoActual = alumnoId;
  document.getElementById("pagoAlumnoNombre").textContent = "Alumno: " + alumnoNombre.trim();
  document.getElementById("pagoMsg").textContent = "";
  document.getElementById("pagoMonto").value = "";
  document.getElementById("pagoReferencia").value = "";
  document.getElementById("pagoNotas").value = "";
  if (concepto) document.getElementById("pagoConcepto").value = concepto;

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
        alumno_id:        _alumnoActual,
        norma_id:         document.getElementById("evalNormaId").value,
        evaluado_at:      document.getElementById("evalFecha").value,
        evaluacion_notas: document.getElementById("evalNotas").value || null,
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
  const selAlumno    = document.getElementById("inscAlumno");
  const selAlumnoRol = document.getElementById("rolUserId");
  selAlumno.innerHTML = `<option value="">— Selecciona un alumno —</option>`;
  if (selAlumnoRol) selAlumnoRol.innerHTML = `<option value="">— Selecciona un usuario —</option>`;

  if (_perfil.rol === "super_admin") {
    const optSelf = document.createElement("option");
    optSelf.value = _perfil.id;
    const nomSelf = [_perfil.nombre, _perfil.apellido].filter(Boolean).join(" ") || "Super Admin";
    optSelf.textContent = `⭐ ${nomSelf} (yo — Super Admin)`;
    selAlumno.appendChild(optSelf);
  }

  _alumnos.forEach(a => {
    if (a.id === _perfil.id) return;
    const label = [a.nombre, a.apellido].filter(Boolean).join(" ") + ` (${a.email})`;
    [selAlumno].forEach(sel => {
      const opt = document.createElement("option");
      opt.value = a.id;
      opt.textContent = label;
      sel.appendChild(opt);
    });
  });

  if (selAlumnoRol) {
    _asesores.forEach(p => {
      const opt = document.createElement("option");
      opt.value = p.id;
      opt.textContent = [p.nombre, p.apellido].filter(Boolean).join(" ") + ` (${p.email})`;
      selAlumnoRol.appendChild(opt);
    });
  }

  const selNorma = document.getElementById("inscNorma");
  selNorma.innerHTML = `<option value="">— Selecciona una norma —</option>`;
  _normas.forEach(n => {
    const opt = document.createElement("option");
    opt.value = n.id;
    opt.textContent = `${n.codigo} — ${n.nombre}`;
    selNorma.appendChild(opt);
  });

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
  const btn         = document.getElementById("btnInscribir");
  const msg         = document.getElementById("inscMsg");
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
        asesor_id:    asesorId    || null,
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
