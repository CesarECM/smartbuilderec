// ══════════════════════════════════════════════════════════════
// MÓDULO GCE — Gestor del Ciclo de Evaluación (ce_admin)
// ══════════════════════════════════════════════════════════════

var _gce_procesos    = [];
var _gce_estandares  = [];
var _gce_candidatos  = [];
var _gce_evaluadores = [];

const GCE_ESTADOS = {
  registro:      { label: 'Registro',       color: '#94a3b8' },
  diagnostico:   { label: 'Diagnóstico',    color: '#60a5fa' },
  plan_acordado: { label: 'Plan acordado',  color: '#fbbf24' },
  evidencias:    { label: 'Evidencias',     color: '#fb923c' },
  juicio:        { label: 'Juicio',         color: '#a78bfa' },
  cierre:        { label: 'Cierre',         color: '#2dd4bf' },
  certificado:   { label: 'Certificado',    color: '#4ade80' },
};

async function gceInit() {
  await Promise.all([
    gceCargarEstandares(),
    gceCargarProcesos(),
    gceCargarUsuarios(),
    gceCargarCreditos(),
  ]);
}

async function gceCargarCreditos() {
  try {
    const { data } = await _supabase.from('profiles').select('credits').eq('id', _perfil.id).single();
    const n  = data?.credits ?? 0;
    const el = document.getElementById('gce-creditos-count');
    if (el) el.textContent = n;
    const bar = document.getElementById('gce-creditos-bar');
    if (bar) bar.style.color = n < 3 ? '#ef4444' : 'var(--c-text-3)';
  } catch { /* ignore */ }
}

function gceBuyCredits() {
  // Si el usuario tiene rol admin, ir a Mi Plan; si solo es ce_admin, abrir checkout directo
  if (_perfil?.rol === 'admin' || _perfil?.rol === 'super_admin') {
    switchRol('admin');
    setTimeout(() => typeof admShowTab === 'function' && admShowTab('mi-plan'), 300);
  } else {
    mostrarToast('Contacta al administrador de la plataforma para recargar créditos.');
  }
}

function gceShowTab(name) {
  document.querySelectorAll('#rp-ce_admin .role-tab-panel').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('#rp-ce_admin .role-tab-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('gce-panel-' + name)?.classList.add('active');
  document.getElementById('gce-tab-'   + name)?.classList.add('active');
  if (name === 'resumen') gceRenderStats();
}

// ── Carga de datos ───────────────────────────────────────────

async function gceCargarEstandares() {
  try {
    const d = await apiFetch('/gce/estandares');
    _gce_estandares = d.estandares || [];
  } catch { _gce_estandares = []; }
}

async function gceCargarProcesos() {
  const el = document.getElementById('gce-listaProcesos');
  try {
    const d = await apiFetch('/gce/procesos');
    _gce_procesos = d.procesos || [];

    const ids = [...new Set([
      ..._gce_procesos.map(p => p.candidato_id),
      ..._gce_procesos.map(p => p.evaluador_id),
    ].filter(Boolean))];

    const byId = {};
    if (ids.length) {
      const { data: profs } = await _supabase
        .from('profiles').select('id, nombre, apellido, email').in('id', ids);
      (profs || []).forEach(p => { byId[p.id] = p; });
    }

    _gce_procesos = _gce_procesos.map(p => ({
      ...p,
      _candidato: byId[p.candidato_id] || {},
      _evaluador: p.evaluador_id ? (byId[p.evaluador_id] || null) : null,
    }));

    gceRenderTabla();
    const ct = document.getElementById('gce-countProcesos');
    if (ct) ct.textContent = _gce_procesos.length || '';
  } catch (e) {
    if (el) el.innerHTML = `<p class="empty-txt">Error al cargar procesos: ${e.message}</p>`;
  }
}

async function gceCargarUsuarios() {
  const { data: todos } = await _supabase
    .from('profiles').select('id, nombre, apellido, email')
    .eq('admin_id', _perfil.id).order('nombre');
  _gce_candidatos = todos || [];

  const { data: evRoles } = await _supabase
    .from('user_roles').select('user_id').eq('role', 'evaluador');
  const evIds = new Set((evRoles || []).map(r => r.user_id));
  _gce_evaluadores = _gce_candidatos.filter(u => evIds.has(u.id));
}

// ── Helpers de render ────────────────────────────────────────

function gceNombre(u) {
  return [u?.nombre, u?.apellido].filter(Boolean).join(' ') || u?.email || '—';
}

function gceBadge(estado) {
  const e = GCE_ESTADOS[estado] || { label: estado, color: '#94a3b8' };
  return `<span style="display:inline-block;padding:3px 9px;border-radius:20px;font-size:10px;font-weight:700;color:#fff;background:${e.color};white-space:nowrap">${e.label}</span>`;
}

function gceEvSelect(procesoId, evaluadorIdActual) {
  const opts = '<option value="">Sin asignar</option>' +
    _gce_evaluadores.map(u =>
      `<option value="${u.id}"${evaluadorIdActual === u.id ? ' selected' : ''}>${gceNombre(u)}</option>`
    ).join('');
  return `<select onchange="gceAsignarEvaluador('${procesoId}',this.value)"
    style="font-size:11px;padding:3px 6px;border:1px solid var(--c-border);border-radius:4px;background:var(--c-bg);color:var(--c-text);max-width:160px">${opts}</select>`;
}

// ── Render tabla ─────────────────────────────────────────────

function gceRenderTabla() {
  const el = document.getElementById('gce-listaProcesos');
  if (!el) return;
  if (!_gce_procesos.length) {
    el.innerHTML = '<p class="empty-txt">Sin procesos registrados. Usa "+ Nueva evaluación" para comenzar.</p>';
    return;
  }
  el.innerHTML = `<div class="table-wrap"><table class="data-table">
    <thead><tr>
      <th>Candidato</th><th>EC</th><th>Estado</th><th>Evaluador</th><th>Inicio</th><th>Enlace</th>
    </tr></thead>
    <tbody>${_gce_procesos.map(p => {
      const ec  = _gce_estandares.find(e => e.id === p.estandar_id) || {};
      const fec = new Date(p.created_at).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
      return `<tr>
        <td>
          <div style="font-weight:600;color:var(--c-text)">${gceNombre(p._candidato)}</div>
          <div style="font-size:11px;color:var(--c-text-3)">${p._candidato?.email || ''}</div>
        </td>
        <td><span class="norma-badge" style="font-size:9px">${ec.codigo || '—'}</span></td>
        <td>${gceBadge(p.estado)}</td>
        <td>${gceEvSelect(p.id, p.evaluador_id)}</td>
        <td style="font-size:12px;color:var(--c-text-4)">${fec}</td>
        <td><button class="btn-sm" onclick="gceCopiarEnlace('${p.id}')" title="Copiar enlace del portafolio">🔗</button></td>
      </tr>`;
    }).join('')}</tbody>
  </table></div>`;
}

// ── Stats ────────────────────────────────────────────────────

function gceRenderStats() {
  const enCurso = _gce_procesos.filter(p => p.estado !== 'certificado').length;
  const cert    = _gce_procesos.filter(p => p.estado === 'certificado').length;
  const elT = document.getElementById('gce-statTotal');
  const elC = document.getElementById('gce-statEnCurso');
  const elR = document.getElementById('gce-statCert');
  if (elT) elT.textContent = _gce_procesos.length;
  if (elC) elC.textContent = enCurso;
  if (elR) elR.textContent = cert;

  const pipe = document.getElementById('gce-pipeline');
  if (pipe) {
    const total  = _gce_procesos.length;
    const counts = {};
    _gce_procesos.forEach(p => { counts[p.estado] = (counts[p.estado] || 0) + 1; });
    pipe.innerHTML = Object.entries(GCE_ESTADOS).map(([k, v]) => {
      const n   = counts[k] || 0;
      const pct = total ? Math.round((n / total) * 100) : 0;
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
}

// ── Modal nueva evaluación ───────────────────────────────────

function gceAbrirModalNuevo() {
  const modal = document.getElementById('gce-modal-nuevo');
  if (!modal) return;

  document.getElementById('gce-selCandidato').innerHTML =
    '<option value="">— Selecciona candidato —</option>' +
    _gce_candidatos.map(u => `<option value="${u.id}">${gceNombre(u)}</option>`).join('');

  document.getElementById('gce-selEC').innerHTML =
    '<option value="">— Selecciona EC —</option>' +
    _gce_estandares.map(e => `<option value="${e.id}">${e.codigo} — ${e.titulo}</option>`).join('');

  document.getElementById('gce-selEvaluador').innerHTML =
    '<option value="">Sin asignar por ahora</option>' +
    _gce_evaluadores.map(u => `<option value="${u.id}">${gceNombre(u)}</option>`).join('');

  modal.style.display = 'flex';
}

function gceCerrarModalNuevo() {
  const m = document.getElementById('gce-modal-nuevo');
  if (m) m.style.display = 'none';
}

async function gceGuardarNuevo() {
  const candidato_id = document.getElementById('gce-selCandidato').value;
  const estandar_id  = document.getElementById('gce-selEC').value;
  const evaluador_id = document.getElementById('gce-selEvaluador').value || null;

  if (!candidato_id || !estandar_id) {
    mostrarToast('⚠️ Selecciona candidato y estándar de competencia.');
    return;
  }
  const btn = document.getElementById('gce-btnGuardar');
  btn.disabled = true; btn.textContent = 'Creando...';
  try {
    await apiFetch('/gce/procesos', { method: 'POST', body: { candidato_id, estandar_id, evaluador_id } });
    gceCerrarModalNuevo();
    _gce_procesos = [];
    await gceCargarProcesos();
    mostrarToast('✓ Proceso de evaluación creado.');
  } catch (e) {
    mostrarToast('Error: ' + e.message);
  } finally {
    btn.disabled = false; btn.textContent = 'Crear proceso';
  }
}

// ── Asignar evaluador (inline select en tabla) ───────────────

function gceCopiarEnlace(procesoId) {
  const url = `${window.location.origin}/gce?proceso_id=${procesoId}`;
  navigator.clipboard.writeText(url).then(
    () => mostrarToast('✓ Enlace copiado al portapapeles.'),
    () => mostrarToast('Enlace: ' + url),
  );
}

async function gceAsignarEvaluador(procesoId, evaluadorId) {
  try {
    await apiFetch(`/gce/procesos/${procesoId}`, {
      method: 'PATCH',
      body: { evaluador_id: evaluadorId || null },
    });
    const p = _gce_procesos.find(x => x.id === procesoId);
    if (p) {
      p.evaluador_id = evaluadorId || null;
      p._evaluador   = _gce_evaluadores.find(u => u.id === evaluadorId) || null;
    }
    mostrarToast('✓ Evaluador actualizado.');
  } catch (e) {
    mostrarToast('Error: ' + e.message);
    await gceCargarProcesos();
  }
}
