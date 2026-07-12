// ── Roles (solo super_admin) ──────────────────────────────────────────────
async function cargarRoles() {
  if (!_esSuper) return;
  try {
    const data  = await apiFetch("/erp/admin/roles");
    const roles = data.roles || [];
    const tbody = document.getElementById("tbodyRoles");
    if (!roles.length) {
      tbody.innerHTML = `<tr><td colspan="4" class="empty-txt">No hay roles asignados.</td></tr>`;
      return;
    }
    tbody.innerHTML = roles.map(r => {
      const p      = r.profiles || {};
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
