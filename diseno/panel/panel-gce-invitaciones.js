// ══════════════════════════════════════════════════════════════
// MÓDULO GCE INVITACIONES — tab 📨 Invitaciones (ce_admin)
// ══════════════════════════════════════════════════════════════

var _gceInv_cargado = false;
var _gceInv_lista   = [];

const _GCE_INV_COLOR = { pendiente: '#fbbf24', aceptada: '#4ade80', expirada: '#94a3b8' };

function gceInvShowTab() {
  gceShowTab('invitaciones');
  gceInvPoblarECs();
  if (!_gceInv_cargado) gceInvCargar();
}

function gceInvPoblarECs() {
  const wrap = document.getElementById('gce-inv-ecs-checks');
  if (!wrap || wrap.dataset.poblado) return;
  if (!_gce_estandares.length) return;
  wrap.innerHTML = _gce_estandares.map(e =>
    `<label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
      <input type="checkbox" value="${e.id}" style="width:15px;height:15px;cursor:pointer">
      <span class="norma-badge" style="font-size:10px">${e.codigo}</span>
      <span style="color:var(--c-text-3);font-size:11px">${e.titulo}</span>
    </label>`
  ).join('');
  wrap.dataset.poblado = '1';
}

function gceInvToggleTipo() {
  const tipo = document.getElementById('gce-inv-tipo')?.value;
  const wrap = document.getElementById('gce-inv-ecs-wrap');
  if (wrap) wrap.style.display = tipo === 'candidato' ? 'block' : 'none';
}

async function gceInvCargar() {
  const el = document.getElementById('gce-inv-lista');
  try {
    if (el) el.innerHTML = '<p class="loading-txt">Cargando...</p>';
    const d = await apiFetch('/gce/invitaciones');
    _gceInv_lista   = d.invitaciones || [];
    _gceInv_cargado = true;
    gceInvRenderLista();
  } catch (e) {
    if (el) el.innerHTML = `<p class="empty-txt">Error: ${e.message}</p>`;
  }
}

function gceInvRenderLista() {
  const el = document.getElementById('gce-inv-lista');
  if (!el) return;
  if (!_gceInv_lista.length) {
    el.innerHTML = '<p class="empty-txt">Sin invitaciones enviadas aún.</p>';
    return;
  }
  el.innerHTML = `<div class="table-wrap"><table class="data-table">
    <thead><tr><th>Correo</th><th>Tipo</th><th>Estado</th><th>Enviada</th><th></th></tr></thead>
    <tbody>${_gceInv_lista.map(inv => {
      const color = _GCE_INV_COLOR[inv.estado] || '#94a3b8';
      const badge = `<span style="display:inline-block;padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700;color:#fff;background:${color}">${inv.estado}</span>`;
      const fecha = new Date(inv.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
      const tipo  = inv.tipo === 'candidato' ? '👤 Candidato' : '🔬 Evaluador';
      const btnElim = inv.estado === 'pendiente'
        ? `<button class="btn-sm danger" onclick="gceInvEliminar('${inv.id}')" title="Eliminar">✕</button>`
        : '';
      return `<tr>
        <td>${inv.candidato_email}</td>
        <td style="font-size:12px">${tipo}</td>
        <td>${badge}</td>
        <td style="font-size:12px;color:var(--c-text-4)">${fecha}</td>
        <td>${btnElim}</td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

async function gceInvEliminar(id) {
  if (!confirm('¿Eliminar esta invitación pendiente?')) return;
  try {
    await apiFetch(`/gce/invitaciones/${id}`, { method: 'DELETE' });
    _gceInv_cargado = false;
    await gceInvCargar();
    mostrarToast('Invitación eliminada.');
  } catch (e) {
    mostrarToast('Error: ' + e.message);
  }
}

async function gceInvEnviar() {
  const email = document.getElementById('gce-inv-email')?.value.trim();
  const tipo  = document.getElementById('gce-inv-tipo')?.value;
  const estandar_ids = tipo === 'candidato'
    ? [...document.querySelectorAll('#gce-inv-ecs-checks input[type=checkbox]:checked')].map(cb => cb.value)
    : [];

  if (!email || !tipo) { mostrarToast('⚠️ Completa todos los campos.'); return; }
  if (tipo === 'candidato' && !estandar_ids.length) { mostrarToast('⚠️ Selecciona al menos un EC.'); return; }

  const btn = document.getElementById('gce-inv-btn');
  btn.disabled = true; btn.textContent = 'Enviando...';
  try {
    await apiFetch('/gce/invitaciones', { method: 'POST', body: { email, tipo, estandar_ids } });
    document.getElementById('gce-inv-email').value = '';
    document.querySelectorAll('#gce-inv-ecs-checks input[type=checkbox]').forEach(cb => { cb.checked = false; });
    _gceInv_cargado = false;
    await gceInvCargar();
    mostrarToast('✓ Invitación enviada por correo.');
  } catch (e) {
    mostrarToast('Error: ' + e.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Enviar invitación';
  }
}
