// ══════════════════════════════════════════════════════════════
// MÓDULO GCE EQUIPO — tab 👥 Mi Equipo (ce_admin)
// ══════════════════════════════════════════════════════════════

var _gceEq_cargado     = false;
var _gceEq_evaluadores = [];
var _gceEq_candidatos  = [];

function gceEqShowTab() {
  gceShowTab('equipo');
  if (!_gceEq_cargado) gceEqCargar();
}

async function gceEqCargar() {
  const elEv = document.getElementById('gce-eq-evaluadores');
  const elCa = document.getElementById('gce-eq-candidatos');
  try {
    if (elEv) elEv.innerHTML = '<p class="loading-txt">Cargando...</p>';
    if (elCa) elCa.innerHTML = '';
    const d = await apiFetch('/gce/equipo');
    _gceEq_evaluadores = d.evaluadores        || [];
    _gceEq_candidatos  = d.candidatos_activos  || [];
    _gceEq_cargado = true;
    gceEqRenderEvaluadores();
    gceEqRenderCandidatos();
  } catch (e) {
    if (elEv) elEv.innerHTML = `<p class="empty-txt">Error: ${e.message}</p>`;
  }
}

function gceEqRenderEvaluadores() {
  const el = document.getElementById('gce-eq-evaluadores');
  if (!el) return;
  if (!_gceEq_evaluadores.length) {
    el.innerHTML = '<p class="empty-txt">Sin evaluadores aún. Invítalos desde el tab 📨 Invitaciones.</p>';
    return;
  }
  el.innerHTML = '<div style="display:flex;flex-wrap:wrap;gap:12px">' +
    _gceEq_evaluadores.map(u =>
      `<div style="background:var(--c-surface);border:1px solid var(--c-border);border-radius:10px;padding:14px 16px;min-width:200px;max-width:260px">
        <div style="font-weight:600;font-size:13px;color:var(--c-text);margin-bottom:2px">${gceNombre(u)}</div>
        <div style="font-size:11px;color:var(--c-text-3)">${u.email || ''}</div>
      </div>`
    ).join('') + '</div>';
}

function gceEqRenderCandidatos() {
  const el = document.getElementById('gce-eq-candidatos');
  if (!el) return;
  if (!_gceEq_candidatos.length) {
    el.innerHTML = '<p class="empty-txt">Sin candidatos activos. Invítalos desde el tab 📨 Invitaciones.</p>';
    return;
  }
  const evById = {};
  [..._gceEq_evaluadores, ..._gce_evaluadores].forEach(u => { if (u?.id) evById[u.id] = u; });

  const filas = _gceEq_candidatos.flatMap(c =>
    c.procesos.map((proc, i) => {
      const ev = proc.evaluador_id ? (evById[proc.evaluador_id] || null) : null;
      return `<tr>
        ${i === 0
          ? `<td rowspan="${c.procesos.length}" style="vertical-align:middle">
              <div style="font-weight:600;color:var(--c-text)">${gceNombre(c)}</div>
              <div style="font-size:11px;color:var(--c-text-3)">${c.email || ''}</div>
            </td>`
          : ''}
        <td><span class="norma-badge" style="font-size:9px">${proc.estandar_codigo || '—'}</span></td>
        <td>${gceBadge(proc.estado)}</td>
        <td style="font-size:12px;color:var(--c-text-3)">${ev ? gceNombre(ev) : '—'}</td>
      </tr>`;
    })
  ).join('');

  el.innerHTML = `<div class="table-wrap"><table class="data-table">
    <thead><tr><th>Candidato</th><th>EC</th><th>Estado</th><th>Evaluador</th></tr></thead>
    <tbody>${filas}</tbody>
  </table></div>`;
}
