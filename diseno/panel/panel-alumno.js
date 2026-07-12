    // ══════════════════════════════════════════════════════════════
    // PANEL ALUMNO
    // ══════════════════════════════════════════════════════════════
    var _alumnoEstado = null;

    async function cargarPanelAlumno() {
      await Promise.all([
        cargarAlumnoDatos(),
        cargarAlumnoEstadoYPlaneaciones(),
      ]);
    }

    // ── Estado de límites ────────────────────────────────────────
    async function cargarAlumnoEstadoYPlaneaciones() {
      try {
        _alumnoEstado = await apiFetch('/alumno/estado');
      } catch (e) {
        _alumnoEstado = { planeaciones_count: 0, slots_usados: 0, slots_disponibles: 5, modo_degradado: false };
      }
      _renderSlotCounter();
      await cargarMisPlaneaciones();
    }

    function _renderSlotCounter() {
      const el = document.getElementById('alumno-slots-counter');
      if (!el || !_alumnoEstado) return;
      const { slots_usados, slots_max } = _alumnoEstado;
      el.style.display = '';
      el.textContent = `${slots_usados} / ${slots_max} descargas usadas`;
      el.className = 'alm-slots-counter' +
        (slots_usados >= slots_max ? ' full' : slots_usados >= 4 ? ' warn' : '');

      const banner = document.getElementById('alumno-degradado-banner');
      if (banner) banner.style.display = _alumnoEstado.modo_degradado ? '' : 'none';
    }

    // ── Mis datos personales ─────────────────────────────────────
    async function cargarAlumnoDatos() {
      const el = document.getElementById('alumno-datos-view');
      const p  = _perfil;
      if (!p) return;

      const curp  = p.curp       || '';
      const tel   = p.telefono   || '';
      const curric = p.curriculum || '';

      el.innerHTML = `<div class="alm-datos-card">
        <div class="alm-dato">
          <span class="alm-dato-label">Nombre completo</span>
          <span class="alm-dato-val">${[p.nombre, p.apellido].filter(Boolean).join(' ') || '<span class="alm-dato-empty">Sin registrar</span>'}</span>
        </div>
        <div class="alm-dato">
          <span class="alm-dato-label">CURP</span>
          <span class="alm-dato-val ${curp ? '' : 'alm-dato-empty'}">${curp || 'Sin registrar'}</span>
        </div>
        <div class="alm-dato">
          <span class="alm-dato-label">Teléfono</span>
          <span class="alm-dato-val ${tel ? '' : 'alm-dato-empty'}">${tel || 'Sin registrar'}</span>
        </div>
        <div class="alm-dato">
          <span class="alm-dato-label">Correo</span>
          <span class="alm-dato-val">${p.email || '—'}</span>
        </div>
        <div class="alm-dato alm-dato-curric">
          <span class="alm-dato-label">Currículum</span>
          <span class="alm-dato-val ${curric ? '' : 'alm-dato-empty'}">${curric || 'Sin registrar'}</span>
        </div>
      </div>`;
    }

    function alumnoEditarDatos() {
      const p = _perfil;
      document.getElementById('fd-nombre').value     = p.nombre    || '';
      document.getElementById('fd-apellido').value   = p.apellido  || '';
      document.getElementById('fd-curp').value       = p.curp      || '';
      document.getElementById('fd-telefono').value   = p.telefono  || '';
      document.getElementById('fd-email').value      = p.email     || '';
      document.getElementById('fd-curriculum').value = p.curriculum || '';

      document.getElementById('alumno-datos-view').style.display  = 'none';
      document.getElementById('alumno-datos-form').style.display  = '';
      document.getElementById('alumno-datos-actions').style.display = 'none';
    }

    function alumnoCancelarEdicion() {
      document.getElementById('alumno-datos-view').style.display  = '';
      document.getElementById('alumno-datos-form').style.display  = 'none';
      document.getElementById('alumno-datos-actions').style.display = '';
    }

    async function alumnoGuardarDatos(e) {
      e.preventDefault();
      const btn = document.getElementById('alumno-save-btn');
      btn.disabled = true; btn.textContent = 'Guardando…';

      const updates = {
        nombre:     document.getElementById('fd-nombre').value.trim(),
        apellido:   document.getElementById('fd-apellido').value.trim(),
        curp:       document.getElementById('fd-curp').value.trim().toUpperCase(),
        telefono:   document.getElementById('fd-telefono').value.trim(),
        curriculum: document.getElementById('fd-curriculum').value.trim(),
      };

      const { error } = await _supabase
        .from('profiles')
        .update(updates)
        .eq('id', _perfil.id);

      btn.disabled = false; btn.textContent = 'Guardar cambios';

      if (error) { mostrarToast('Error al guardar. Intenta de nuevo.'); return; }

      Object.assign(_perfil, updates);
      alumnoCancelarEdicion();
      cargarAlumnoDatos();
      document.getElementById('headerNombre').textContent =
        [_perfil.nombre, _perfil.apellido].filter(Boolean).join(' ') || _perfil.email;
      mostrarToast('Datos guardados correctamente.');
    }

    // ── Mis planeaciones ─────────────────────────────────────────
    async function cargarMisPlaneaciones() {
      const el = document.getElementById('alumno-planeaciones');
      const { data, error } = await _supabase
        .from('planeaciones')
        .select('id, nombre_curso, paso_actual, status, updated_at')
        .eq('user_id', _perfil.id)
        .order('updated_at', { ascending: false });

      const count = data?.length || 0;
      const cTag = document.getElementById('alumno-plan-count');
      if (cTag) cTag.textContent = count;

      if (error || !count) {
        el.innerHTML = `<div style="text-align:center;padding:32px;background:var(--c-surface);border:2px dashed var(--c-border);border-radius:var(--r-xl)">
          <div style="font-size:36px;margin-bottom:10px">📋</div>
          <h3 style="font-size:15px;font-weight:700;margin-bottom:6px">Aún no tienes cursos</h3>
          <p style="font-size:13px;color:var(--c-text-3);margin-bottom:14px">Crea tu primer expediente didáctico EC0217.01.</p>
          <button class="btn-primary" onclick="alumnoNuevaPlaneacion()">+ Crear primer curso</button>
        </div>`;
        return;
      }

      const degradado = _alumnoEstado?.modo_degradado;
      const sinSlots  = (_alumnoEstado?.slots_disponibles ?? 1) <= 0;

      el.innerHTML = data.map(p => {
        const pct      = Math.min(100, Math.round(((p.paso_actual - 1) / 15) * 100));
        const completa = p.status === 'completa';
        const tiempo   = _tiempoRel(p.updated_at);
        const titulo   = p.nombre_curso || '(Sin título)';

        const btnDescargar = completa
          ? (degradado
              ? `<button class="btn-sm" disabled title="Elimina una planeación para descargar">⬇ Descargar</button>`
              : sinSlots
                ? `<button class="btn-sm" disabled title="Límite de descargas alcanzado">⬇ Descargar</button>`
                : `<button class="btn-sm success" onclick="alumnoDescargar('${p.id}','${titulo.replace(/'/g, "\\'")}')">⬇ Descargar</button>`)
          : '';

        return `<div class="alm-plan-card">
          <div class="alm-plan-top">
            <div class="alm-plan-info">
              <div class="alm-plan-title">${titulo}</div>
              <div class="alm-plan-meta">Editado ${tiempo} · Paso ${p.paso_actual}/16</div>
            </div>
            <div class="alm-plan-actions">
              <span class="status-badge ${completa ? 'badge-completa' : 'badge-borrador'}">${completa ? 'Completa' : 'Borrador'}</span>
              ${btnDescargar}
              <a href="index?planeacion_id=${p.id}" class="btn-sm">${completa ? 'Ver' : 'Continuar'}</a>
              <button class="btn-sm danger" onclick="alumnoEliminarPlaneacion('${p.id}','${titulo.replace(/'/g, "\\'")}')">🗑</button>
            </div>
          </div>
          <div class="alm-prog-wrap">
            <div class="alm-prog-fill ${completa ? 'completa' : ''}" style="width:${pct}%"></div>
          </div>
        </div>`;
      }).join('');
    }

    // ── Nueva planeación ─────────────────────────────────────────
    function alumnoNuevaPlaneacion() {
      const count = parseInt(document.getElementById('alumno-plan-count')?.textContent) || 0;
      if (count >= 5) {
        const ok = confirm(
          `Tienes ${count} planeaciones activas (límite recomendado: 5).\n\n` +
          `Tendrás acceso reducido (sin descargas ni IA) hasta que elimines una.\n\n` +
          `¿Crear de todas formas?`
        );
        if (!ok) return;
      }
      window.location.href = 'index?new=1';
    }

    // ── Eliminar planeación ──────────────────────────────────────
    async function alumnoEliminarPlaneacion(id, nombre) {
      if (!confirm(`¿Eliminar "${nombre}"?\n\nEsta acción no se puede deshacer.`)) return;

      const { error } = await _supabase
        .from('planeaciones')
        .delete()
        .eq('id', id)
        .eq('user_id', _perfil.id);

      if (error) { mostrarToast('Error al eliminar. Intenta de nuevo.'); return; }

      mostrarToast('Planeación eliminada.');
      _panelLoaded['alumno'] = false;
      await cargarAlumnoEstadoYPlaneaciones();
    }

    // ── Descargar ZIP ────────────────────────────────────────────
    async function alumnoDescargar(planeacionId, nombreCurso) {
      await _alumnoTriggerDescarga(planeacionId, nombreCurso, false);
    }

    async function _alumnoTriggerDescarga(planeacionId, nombreCurso, confirmNewCourse) {
      // Obtener datos completos del wizard desde Supabase
      const { data: row, error } = await _supabase
        .from('planeaciones')
        .select('datos, nombre_curso')
        .eq('id', planeacionId)
        .single();

      if (error || !row?.datos) {
        mostrarToast('No se pudieron obtener los datos del curso.'); return;
      }

      const payload = {
        ...row.datos,
        planeacion_id:      planeacionId,
        confirm_new_course: confirmNewCourse,
      };

      const headers = await getAuthHeaders();
      headers['Content-Type'] = 'application/json';

      let res;
      try {
        res = await fetch(BACKEND_URL + '/generate-doc/planeacion', {
          method: 'POST', headers, body: JSON.stringify(payload),
        });
      } catch (e) {
        mostrarToast('Error de conexión al generar el expediente.'); return;
      }

      if (res.status === 409) {
        const slotsDisp = res.headers.get('X-Slots-Disponibles') || '?';
        const ok = confirm(
          `Se detectaron cambios significativos.\n\n` +
          `Esto se registrará como un nuevo curso y usará 1 de tus ${slotsDisp} descargas disponibles.\n\n` +
          `¿Continuar?`
        );
        if (ok) await _alumnoTriggerDescarga(planeacionId, nombreCurso, true);
        return;
      }

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        mostrarToast(err.detail || `Error ${res.status} al generar el expediente.`);
        return;
      }

      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `Expediente_${(row.nombre_curso || 'EC0217').replace(/\s+/g, '_')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      mostrarToast('Expediente descargado.');
      // Refrescar contador de slots
      try { _alumnoEstado = await apiFetch('/alumno/estado'); _renderSlotCounter(); } catch (_) {}
    }

    // ── Utilidad: tiempo relativo ─────────────────────────────────
    function _tiempoRel(dateStr) {
      const diff = Date.now() - new Date(dateStr).getTime();
      const mins = Math.floor(diff / 60000);
      const hs   = Math.floor(mins / 60);
      const dias = Math.floor(hs / 24);
      if (mins < 2)   return 'Ahora mismo';
      if (mins < 60)  return `Hace ${mins} min`;
      if (hs  < 24)   return `Hace ${hs} h`;
      if (dias === 1) return 'Ayer';
      if (dias < 7)   return `Hace ${dias} días`;
      return new Date(dateStr).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
    }
