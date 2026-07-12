// ── Normas (solo super_admin) ─────────────────────────────────────────────
let _normaEditando = null;

async function cargarNormasTabla() {
  if (!_esSuper) return;
  try {
    const data  = await apiFetch("/erp/normas?todas=true");
    const normas = data.normas || [];
    const tbody  = document.getElementById("tbodyNormas");
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
    document.getElementById("norCodigo").value      = n.codigo      || "";
    document.getElementById("norNombre").value      = n.nombre      || "";
    document.getElementById("norDescripcion").value = n.descripcion || "";
    document.getElementById("norDias").value        = n.dias_estimados_certificado || 45;
    document.getElementById("norWizard").value      = String(!!n.tiene_wizard);
    document.getElementById("norActivo").value      = String(!!n.activo);
  } else {
    ["norCodigo","norNombre","norDescripcion"].forEach(id => document.getElementById(id).value = "");
    document.getElementById("norDias").value   = 45;
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

const _style = document.createElement("style");
_style.textContent = `.status-badge{font-size:10px;font-weight:700;text-transform:uppercase;padding:2px 8px;border-radius:20px;display:inline-block}`;
document.head.appendChild(_style);
