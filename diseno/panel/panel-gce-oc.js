// ══════════════════════════════════════════════════════════════
// MÓDULO GCE-OC — Vista del Organismo Certificador
// ══════════════════════════════════════════════════════════════

var _oc_procesos   = [];
var _oc_estandares = [];

var _oc_ces       = [];
var _oc_ce_activo = null;

async function ocInit() {
  await Promise.all([_ocCargarEstandares(), _ocCargarProcesos(), _ocCargarCEs()]);
}

function ocShowTab(name) {
  document.querySelectorAll('#rp-oc_admin .role-tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#rp-oc_admin .role-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('oc-panel-' + name)?.classList.add('active');
  document.getElementById('oc-tab-'   + name)?.classList.add('active');
  if (name === 'dashboard') _ocRenderDashboard();
}

// ── Carga de datos ───────────────────────────────────────────

async function _ocCargarEstandares() {
  try {
    console.log('[GCE-OC] GET', BACKEND_URL + '/gce/estandares');
    const d = await apiFetch('/gce/estandares');
    console.log('[GCE-OC] estándares recibidos:', d);
    _oc_estandares = d.estandares || [];
  } catch (e) {
    console.error('[GCE-OC] error al cargar estándares:', e);
    _oc_estandares = [];
  }
}

async function _ocCargarProcesos() {
  const el = document.getElementById('oc-listaProcesos');
  try {
    console.log('[GCE-OC] GET', BACKEND_URL + '/gce/procesos');
    if (el) el.innerHTML = '<p class="loading-txt">Cargando procesos…</p>';
    const d = await apiFetch('/gce/procesos');
    console.log('[GCE-OC] procesos recibidos:', d);
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
    console.error('[GCE-OC] error al cargar procesos:', e);
    const esFetch = e instanceof TypeError && e.message === 'Failed to fetch';
    const msg = esFetch
      ? 'No se pudo conectar al servidor. El backend puede estar iniciando (cold start). Espera 30 s y recarga.'
      : `Error: ${e.message}`;
    if (el) el.innerHTML = `<p class="empty-txt">${msg}</p>
      <button class="btn-sm" style="margin:8px 0" onclick="_ocCargarProcesos()">🔄 Reintentar</button>`;
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

// ── Gestión de CEs ───────────────────────────────────────────

async function _ocCargarCEs() {
  const el = document.getElementById('oc-listaCEs');
  try {
    const d = await apiFetch('/gce/oc/ces');
    _oc_ces = d.ces || [];
    _ocRenderCEs();
    const ct = document.getElementById('oc-countCEs');
    if (ct) ct.textContent = _oc_ces.length || '';
  } catch (e) {
    if (el) el.innerHTML = `<p class="empty-txt">Error: ${e.message}</p>`;
  }
}

function _ocRenderCEs() {
  const el = document.getElementById('oc-listaCEs');
  if (!el) return;
  if (!_oc_ces.length) { el.innerHTML = '<p class="empty-txt">Aún no has incorporado ningún Centro de Evaluación.</p>'; return; }
  el.innerHTML = `<div class="table-wrap"><table class="data-table"><thead><tr><th>Centro de Evaluación</th><th>ECs autorizados</th><th></th></tr></thead><tbody>${
    _oc_ces.map(ce => {
      const nom = _ocNombre(ce);
      const ecs = (ce.estandares || []).map(e => `<span class="norma-badge" style="font-size:9px">${e.codigo}</span>`).join(' ') || '<span style="color:var(--c-text-3);font-size:12px">Sin ECs</span>';
      return `<tr>
        <td><div style="font-weight:600">${nom}</div><div style="font-size:11px;color:var(--c-text-3)">${ce.email}</div></td>
        <td>${ecs}</td>
        <td><button class="btn-sm" onclick="ocAbrirModalECs('${ce.id}','${nom.replace(/'/g,"\\'")}')">Gestionar ECs</button>
            <button class="btn-sm danger" style="margin-left:4px" onclick="ocQuitarCE('${ce.id}','${nom.replace(/'/g,"\\'")}')">✕</button></td>
      </tr>`;
    }).join('')
  }</tbody></table></div>`;
}

function ocAbrirModalAgregarCE() {
  document.getElementById('oc-inputEmailCE').value = '';
  document.getElementById('oc-msgCE').textContent  = '';
  const btn = document.getElementById('oc-btnAgregarCE');
  btn.disabled = false; btn.textContent = 'Agregar';
  document.getElementById('oc-modal-ce').style.display = 'flex';
}
function ocCerrarModalCE() { document.getElementById('oc-modal-ce').style.display = 'none'; }

async function ocConfirmarAgregarCE() {
  const email = document.getElementById('oc-inputEmailCE').value.trim();
  const msg   = document.getElementById('oc-msgCE');
  const btn   = document.getElementById('oc-btnAgregarCE');
  if (!email) { msg.textContent = 'Ingresa un email.'; msg.style.color = '#ef4444'; return; }
  btn.disabled = true; btn.textContent = 'Agregando...'; msg.textContent = '';
  try {
    await apiFetch('/gce/oc/ces', { method: 'POST', body: { email } });
    ocCerrarModalCE();
    await _ocCargarCEs();
    mostrarToast('✓ Centro de Evaluación incorporado.');
  } catch (e) {
    msg.textContent = e.message; msg.style.color = '#ef4444';
    btn.disabled = false; btn.textContent = 'Agregar';
  }
}

async function ocQuitarCE(ceId, nombre) {
  if (!confirm(`¿Quitar a "${nombre}" de tu organismo? Se eliminarán sus ECs autorizados.`)) return;
  try {
    await apiFetch(`/gce/oc/ces/${ceId}`, { method: 'DELETE' });
    await _ocCargarCEs();
    mostrarToast('CE eliminado del organismo.');
  } catch (e) { mostrarToast('Error: ' + e.message); }
}

async function ocAbrirModalECs(ceId, ceNombre) {
  _oc_ce_activo = ceId;
  document.getElementById('oc-modalECs-titulo').textContent = 'ECs autorizados';
  document.getElementById('oc-modalECs-sub').textContent    = ceNombre;
  const lista   = document.getElementById('oc-modalECs-lista');
  lista.innerHTML = '<p class="loading-txt">Cargando...</p>';
  document.getElementById('oc-modal-ecs').style.display = 'flex';
  const autorizados = new Set((_oc_ces.find(c => c.id === ceId)?.estandares || []).map(e => e.id));
  lista.innerHTML = _oc_estandares.map(e =>
    `<label style="display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer">
      <input type="checkbox" value="${e.id}" ${autorizados.has(e.id) ? 'checked' : ''}
        style="width:16px;height:16px;accent-color:var(--c-primary)">
      <span><strong>${e.codigo}</strong> — ${e.titulo}</span>
    </label>`
  ).join('') || '<p style="font-size:12px;color:var(--c-text-3)">Sin ECs activos en el catálogo.</p>';
}
function ocCerrarModalECs() { document.getElementById('oc-modal-ecs').style.display = 'none'; _oc_ce_activo = null; }

async function ocGuardarECs() {
  if (!_oc_ce_activo) return;
  const checks = document.querySelectorAll('#oc-modalECs-lista input[type=checkbox]:checked');
  const estandar_ids = [...checks].map(c => c.value);
  const btn = document.getElementById('oc-btnGuardarECs');
  btn.disabled = true; btn.textContent = 'Guardando...';
  try {
    await apiFetch(`/gce/oc/ces/${_oc_ce_activo}/estandares`, { method: 'PUT', body: { estandar_ids } });
    await _ocCargarCEs();
    ocCerrarModalECs();
    mostrarToast('✓ ECs autorizados guardados.');
  } catch (e) { mostrarToast('Error: ' + e.message); }
  finally { btn.disabled = false; btn.textContent = 'Guardar'; }
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
