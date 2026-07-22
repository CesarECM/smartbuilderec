// ── Inicialización ────────────────────────────────────────────────────────
async function init() {
  const session = await authGuard();
  if (!session) return;

  _perfil = await getUserProfile();
  if (!_perfil) { window.location.href = "login"; return; }

  if (typeof inyectarBranding === 'function') inyectarBranding(_perfil);

  const rolValido = _perfil.rol === "admin" || _perfil.rol === "super_admin";
  if (!rolValido) {
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
  const total      = _alumnos.length;
  const conPago    = _alumnos.filter(a => a.pagos_count > 0).length;
  const pendientes = _alumnos.filter(a => a.tiene_pendientes).length;
  document.getElementById("statTotal").textContent      = total;
  document.getElementById("statConPago").textContent    = conPago;
  document.getElementById("statPendientes").textContent = pendientes;
  document.getElementById("statEvaluados").textContent  = "—";
}
