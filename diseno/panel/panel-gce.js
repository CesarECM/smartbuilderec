// ══════════════════════════════════════════════════════════════
// MÓDULO GCE — Gestor del Ciclo de Evaluación (ce_admin)
// ══════════════════════════════════════════════════════════════

var _gce_procesos    = [];
var _gce_estandares  = [];
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
    const n = data?.credits ?? 0;
    const $c = document.getElementById('gce-creditos-count');
    const $b = document.getElementById('gce-creditos-bar');
    if ($c) $c.textContent = n;
    if ($b) $b.style.color = n < 3 ? '#ef4444' : 'var(--c-text-3)';
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
    console.log('[GCE-CE] GET', BACKEND_URL + '/gce/estandares');
    const d = await apiFetch('/gce/estandares');
    console.log('[GCE-CE] estándares:', d);
    _gce_estandares = d.estandares || [];
  } catch (e) {
    console.error('[GCE-CE] error estándares:', e);
    _gce_estandares = [];
  }
}

async function gceCargarProcesos() {
  const el = document.getElementById('gce-listaProcesos');
  try {
    console.log('[GCE-CE] GET', BACKEND_URL + '/gce/procesos');
    if (el) el.innerHTML = '<p class="loading-txt">Cargando procesos…</p>';
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
    console.error('[GCE-CE] error procesos:', e);
    const esFetch = e instanceof TypeError && e.message === 'Failed to fetch';
    const msg = esFetch
      ? 'No se pudo conectar al servidor. El backend puede estar iniciando (cold start). Espera 30 s y recarga.'
      : `Error: ${e.message}`;
    if (el) el.innerHTML = `<p class="empty-txt">${msg}</p>
      <button class="btn-sm" style="margin:8px 0" onclick="gceCargarProcesos()">🔄 Reintentar</button>`;
  }
}

async function gceCargarUsuarios() {
  const { data: evRoles } = await _supabase
    .from('user_roles').select('user_id').eq('role', 'evaluador');
  const evIds = new Set((evRoles || []).map(r => r.user_id));
  if (!evIds.size) { _gce_evaluadores = []; return; }
  const { data: evProfs } = await _supabase
    .from('profiles').select('id, nombre, apellido, email')
    .in('id', [...evIds]).order('nombre');
  _gce_evaluadores = evProfs || [];
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
  const $s = id => document.getElementById(id);
  if ($s('gce-statTotal'))  $s('gce-statTotal').textContent  = _gce_procesos.length;
  if ($s('gce-statEnCurso')) $s('gce-statEnCurso').textContent = enCurso;
  if ($s('gce-statCert'))   $s('gce-statCert').textContent   = cert;
  const pipe  = $s('gce-pipeline');
  if (!pipe) return;
  const total = _gce_procesos.length;
  const counts = {};
  _gce_procesos.forEach(p => { counts[p.estado] = (counts[p.estado] || 0) + 1; });
  pipe.innerHTML = Object.entries(GCE_ESTADOS).map(([k, v]) => {
    const n = counts[k] || 0, pct = total ? Math.round((n / total) * 100) : 0;
    return `<div style="margin-bottom:10px"><div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:12px;color:var(--c-text-3)">${v.label}</span><span style="font-size:12px;font-weight:700">${n}</span></div><div style="height:8px;background:var(--c-border);border-radius:4px;overflow:hidden"><div style="height:100%;width:${pct}%;background:${v.color};border-radius:4px;transition:width .35s"></div></div></div>`;
  }).join('');
}

// ── Modal nueva evaluación ───────────────────────────────────

var _gce_buscarTimer = null;

async function gceBuscarCandidato(q) {
  document.getElementById('gce-selCandidato').value = '';
  document.getElementById('gce-candidatoSeleccionado').style.display = 'none';
  const res = document.getElementById('gce-candidatoResultados');
  if (!q || q.trim().length < 2) { res.style.display = 'none'; return; }
  clearTimeout(_gce_buscarTimer);
  _gce_buscarTimer = setTimeout(async () => {
    try {
      const url = `/gce/candidatos/buscar?q=${encodeURIComponent(q.trim())}`;
      console.log('[GCE buscar]', url); const d = await apiFetch(url); console.log('[GCE buscar] resp:', d);
      const lista = d.candidatos || [];
      if (!lista.length) { res.style.display = 'block'; res.innerHTML = '<div style="padding:8px 12px;font-size:12px;color:var(--c-text-3)">Sin resultados</div>'; return; }
      res.style.display = 'block';
      res.innerHTML = lista.map(u => {
        const nom = gceNombre(u);
        return `<div onclick="gceSeleccionarCandidato('${u.id}','${nom.replace(/'/g,"\\'")}','${u.email}')" style="padding:8px 12px;font-size:13px;cursor:pointer;border-bottom:1px solid var(--c-border)" onmouseenter="this.style.background='var(--c-hover)'" onmouseleave="this.style.background=''"><div style="font-weight:600">${nom}</div><div style="font-size:11px;color:var(--c-text-3)">${u.email}</div></div>`;
      }).join('');
    } catch (e) {
      console.error('[GCE buscar] error:', e);
      res.style.display = 'block'; res.innerHTML = `<div style="padding:8px 12px;font-size:12px;color:#ef4444">Error: ${e.message}</div>`;
    }
  }, 300);
}

function gceSeleccionarCandidato(id, nombre, email) {
  document.getElementById('gce-selCandidato').value = id;
  document.getElementById('gce-inputCandidato').value = nombre + ' — ' + email;
  document.getElementById('gce-candidatoResultados').style.display = 'none';
  const tag = document.getElementById('gce-candidatoSeleccionado');
  tag.textContent = '✓ ' + nombre;
  tag.style.display = 'block';
}

function gceAbrirModalNuevo() {
  const modal = document.getElementById('gce-modal-nuevo');
  if (!modal) return;

  // Resetear buscador candidato
  document.getElementById('gce-inputCandidato').value = '';
  document.getElementById('gce-selCandidato').value   = '';
  document.getElementById('gce-candidatoResultados').style.display = 'none';
  document.getElementById('gce-candidatoSeleccionado').style.display = 'none';

  document.getElementById('gce-selEC').innerHTML =
    '<option value="">— Selecciona EC —</option>' +
    _gce_estandares.map(e => `<option value="${e.id}">${e.codigo} — ${e.titulo}</option>`).join('');

  document.getElementById('gce-selEvaluador').innerHTML =
    '<option value="">Sin asignar por ahora</option>' +
    _gce_evaluadores.map(u => `<option value="${u.id}">${gceNombre(u)}</option>`).join('');

  modal.style.display = 'flex';
}

function gceCerrarModalNuevo() {
  const m = document.getElementById('gce-modal-nuevo'); if (m) m.style.display = 'none';
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
  navigator.clipboard.writeText(url).then(() => mostrarToast('✓ Enlace copiado.'), () => mostrarToast('Enlace: ' + url));
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
