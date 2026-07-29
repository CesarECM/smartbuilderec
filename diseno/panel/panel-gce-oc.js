// ══════════════════════════════════════════════════════════════
// MÓDULO GCE-OC — Vista del Organismo Certificador
// ══════════════════════════════════════════════════════════════

var _oc_procesos   = [];
var _oc_estandares = [];

async function ocInit() {
  await Promise.all([_ocCargarEstandares(), _ocCargarProcesos()]);
}

function ocShowTab(name) {
  document.querySelectorAll('#rp-oc_admin .role-tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#rp-oc_admin .role-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('oc-panel-'  + name)?.classList.add('active');
  document.getElementById('oc-tab-'    + name)?.classList.add('active');
  if (name === 'dashboard') _ocRenderDashboard();
}

// ── Carga de datos ───────────────────────────────────────────

async function _ocCargarEstandares() {
  try {
    const d = await apiFetch('/gce/estandares');
    _oc_estandares = d.estandares || [];
  } catch { _oc_estandares = []; }
}

async function _ocCargarProcesos() {
  const el = document.getElementById('oc-listaProcesos');
  try {
    const d = await apiFetch('/gce/procesos');
    _oc_procesos = d.procesos || [];

    const ids = [...new Set([
      ..._oc_procesos.map(p => p.candidato_id),
      ..._oc_procesos.map(p => p.evaluador_id),
      ..._oc_procesos.map(p => p.ce_id),
    ].filter(Boolean))];

    const byId = {};
    if (ids.length) {
      const { data: profs } = await _supabase
        .from('profiles').select('id, nombre, apellido, email').in('id', ids);
      (profs || []).forEach(p => { byId[p.id] = p; });
    }

    _oc_procesos = _oc_procesos.map(p => ({
      ...p,
      _candidato: byId[p.candidato_id] || {},
      _evaluador: p.evaluador_id ? byId[p.evaluador_id] : null,
      _ce:        p.ce_id        ? byId[p.ce_id]        : null,
    }));

    _ocRenderTabla();
    const ct = document.getElementById('oc-countProcesos');
    if (ct) ct.textContent = _oc_procesos.length || '';
  } catch (e) {
    if (el) el.innerHTML = `<p class="empty-txt">Error al cargar: ${e.message}</p>`;
  }
}

// ── Render tabla ─────────────────────────────────────────────

function _ocNombre(u) {
  return [u?.nombre, u?.apellido].filter(Boolean).join(' ') || u?.email || '—';
}

function _ocRenderTabla() {
  const el = document.getElementById('oc-listaProcesos');
  if (!el) return;
  if (!_oc_procesos.length) {
    el.innerHTML = '<p class="empty-txt">Sin procesos supervisados aún.</p>';
    return;
  }
  el.innerHTML = `<div class="table-wrap"><table class="data-table">
    <thead><tr>
      <th>Candidato</th><th>Centro de Evaluación</th><th>EC</th>
      <th>Estado</th><th>Evaluador</th><th></th>
    </tr></thead>
    <tbody>${_oc_procesos.map(p => {
      const ec  = _oc_estandares.find(e => e.id === p.estandar_id) || {};
      return `<tr>
        <td>
          <div style="font-weight:600;color:var(--c-text)">${_ocNombre(p._candidato)}</div>
          <div style="font-size:11px;color:var(--c-text-3)">${p._candidato?.email || ''}</div>
        </td>
        <td style="font-size:12px;color:var(--c-text-2)">${_ocNombre(p._ce)}</td>
        <td><span class="norma-badge" style="font-size:9px">${ec.codigo || '—'}</span></td>
        <td>${gceBadge(p.estado)}</td>
        <td style="font-size:12px;color:var(--c-text-2)">${_ocNombre(p._evaluador)}</td>
        <td><button class="btn-sm" onclick="gceCopiarEnlace('${p.id}')" title="Copiar enlace portafolio">🔗</button></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

// ── Dashboard con barras CSS ─────────────────────────────────

function _ocRenderDashboard() {
  const total   = _oc_procesos.length;
  const enCurso = _oc_procesos.filter(p => p.estado !== 'certificado').length;
  const cert    = _oc_procesos.filter(p => p.estado === 'certificado').length;

  const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
  set('oc-statTotal', total); set('oc-statEnCurso', enCurso); set('oc-statCert', cert);

  const pipe = document.getElementById('oc-pipeline');
  if (!pipe) return;

  const counts = {};
  _oc_procesos.forEach(p => { counts[p.estado] = (counts[p.estado] || 0) + 1; });

  pipe.innerHTML = !total
    ? '<p style="font-size:12px;color:var(--c-text-3)">Sin datos aún.</p>'
    : Object.entries(GCE_ESTADOS).map(([k, v]) => {
        const n   = counts[k] || 0;
        const pct = Math.round((n / total) * 100);
        return `<div style="margin-bottom:10px">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">
            <span style="font-size:12px;color:var(--c-text-3)">${v.label}</span>
            <span style="font-size:12px;font-weight:700;color:var(--c-text)">${n}</span>
          </div>
          <div style="height:8px;background:var(--c-border);border-radius:4px;overflow:hidden">
            <div style="height:100%;width:${pct}%;background:${v.color};border-radius:4px;transition:width .35s"></div>
          </div>
        </div>`;
      }).join('');
}
