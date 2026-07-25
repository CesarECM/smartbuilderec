    // ── Códigos de acceso ─────────────────────────────────────────
    async function admCargarCodigos() {
      const lista = document.getElementById('adm-listaCodigos');
      lista.innerHTML = '<p class="loading-txt">Cargando códigos...</p>';
      const { data: codigos, error } = await _supabase
        .from('access_codes')
        .select('id, code, used_at, expires_at, created_at, used_by')
        .eq('admin_id', _perfil.id)
        .order('created_at', { ascending: false });

      if (error) { lista.innerHTML = '<p class="error-txt">Error al cargar códigos.</p>'; return; }

      if (!codigos?.length) {
        lista.innerHTML = `<div class="empty-state">
          <div class="empty-state-icon">🔑</div>
          <h3>Aún no has generado ningún código</h3>
          <p>Los códigos permiten que tus usuarios se registren sin pago.</p>
          <button class="btn-primary" onclick="admGenerarCodigo()">🔑 Generar primer código</button>
        </div>`;
        return;
      }

      const usedByIds = [...new Set(codigos.filter(c => c.used_by).map(c => c.used_by))];
      const perfilesMap = {};
      if (usedByIds.length) {
        const { data: perfiles } = await _supabase
          .from('profiles').select('id, nombre, apellido, email').in('id', usedByIds);
        perfiles?.forEach(p => { perfilesMap[p.id] = p; });
      }

      const ahora    = new Date();
      const activos  = codigos.filter(c => !c.used_at && new Date(c.expires_at) > ahora);
      const historial= codigos.filter(c =>  !!c.used_at || new Date(c.expires_at) <= ahora);

      let html = activos.length
        ? `<div class="code-grid">${activos.map((c, i) => _adm_renderCodeCard(c, perfilesMap, ahora, i === 0)).join('')}</div>`
        : `<p class="empty-txt" style="margin-bottom:16px">No hay códigos activos. Genera uno nuevo arriba.</p>`;

      html += `<details class="historial-section" ${historial.length ? 'open' : ''}>
        <summary class="historial-summary">
          Historial de códigos <span class="count-tag">${historial.length} registro${historial.length !== 1 ? 's' : ''}</span>
        </summary>
        ${historial.length
          ? `<div class="code-grid" style="margin-top:12px">${historial.map(c => _adm_renderCodeCard(c, perfilesMap, ahora)).join('')}</div>`
          : `<p class="empty-txt" style="margin:12px 0 4px">Ningún código ha sido usado o expirado aún.</p>`
        }
      </details>`;

      lista.innerHTML = html;
    }

    function _adm_renderCodeCard(c, perfilesMap, ahora, isNewest = false) {
      const expirado   = new Date(c.expires_at) <= ahora;
      const usado      = !!c.used_at;
      const disponible = !usado && !expirado;
      const destacar   = isNewest && disponible;
      const badgeCls   = usado ? 'badge-usado' : expirado ? 'badge-expirado' : 'badge-disponible';
      const badgeTxt   = usado ? 'Usado' : expirado ? 'Expirado' : 'Disponible';
      const fechaExp   = new Date(c.expires_at).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
      const fechaCrea  = new Date(c.created_at).toLocaleDateString('es-MX', { day:'2-digit', month:'short', year:'numeric' });
      const tiempoRel  = _adm_tiempoRelativo(c.created_at);

      let metaExtra = '';
      if (usado && c.used_by && perfilesMap[c.used_by]) {
        const p   = perfilesMap[c.used_by];
        const nom = [p.nombre, p.apellido].filter(Boolean).join(' ') || p.email;
        metaExtra = `<br>Canjeado por: <strong style="color:var(--c-text)">${nom}</strong> <span style="color:var(--c-text-4)">(${p.email})</span>`;
      } else if (usado) {
        metaExtra = '<br>Canjeado';
      }

      return `<div class="code-card${destacar ? ' code-card--nuevo' : ''}" id="adm-ccard-${c.id}">
        ${destacar ? `<div class="code-nuevo-label">✨ Recién generado</div>` : ''}
        <div class="code-card-top">
          <span class="code-text">${c.code}</span>
          <span class="${badgeCls}">${badgeTxt}</span>
        </div>
        <div class="code-meta"><span class="code-tiempo-rel">${tiempoRel}</span><br>Creado: ${fechaCrea} · Expira: ${fechaExp}${metaExtra}</div>
        <div class="code-actions">
          ${disponible ? `<button class="btn-sm" onclick="admCopiarCodigo('${c.code}')">Copiar</button>` : ''}
          ${disponible ? `<button class="btn-sm danger" onclick="admEliminarCodigo('${c.id}',this)">Eliminar</button>` : ''}
        </div>
      </div>`;
    }

    function _adm_tiempoRelativo(fechaISO) {
      const diff = Date.now() - new Date(fechaISO).getTime();
      const min  = Math.floor(diff / 60000);
      if (min < 1)  return 'hace unos segundos';
      if (min < 60) return `hace ${min} minuto${min !== 1 ? 's' : ''}`;
      const h = Math.floor(min / 60);
      if (h < 24)   return `hace ${h} hora${h !== 1 ? 's' : ''}`;
      const d = Math.floor(h / 24);
      if (d < 7)    return `hace ${d} día${d !== 1 ? 's' : ''}`;
      const w = Math.floor(d / 7);
      if (w < 5)    return `hace ${w} semana${w !== 1 ? 's' : ''}`;
      const m = Math.floor(d / 30);
      return `hace ${m} mes${m !== 1 ? 'es' : ''}`;
    }

    function _adm_generarCodigoAleatorio() {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
      let code = '';
      for (let i = 0; i < 8; i++) {
        if (i === 4) code += '-';
        code += chars[Math.floor(Math.random() * chars.length)];
      }
      return code;
    }

    async function admGenerarCodigo() {
      const btn = document.getElementById('adm-btnGenerarCodigo');
      btn.disabled = true; btn.textContent = 'Generando...';

      const { data: perfil } = await _supabase
        .from('profiles').select('credits').eq('id', _perfil.id).single();

      if (_perfil.rol !== 'super_admin' && (!perfil || perfil.credits <= 0)) {
        btn.disabled = false; btn.textContent = '+ Generar código';
        alert('No tienes créditos disponibles. Ve a Mi Plan para renovar o agregar créditos.');
        return;
      }

      let code, intentos = 0;
      while (intentos < 10) {
        code = _adm_generarCodigoAleatorio();
        const { data } = await _supabase.from('access_codes').select('id').eq('code', code).single();
        if (!data) break;
        intentos++;
      }

      const dias    = parseInt(document.getElementById('adm-selectVigencia')?.value || '30');
      const expires = new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();
      const { data, error } = await _supabase.from('access_codes')
        .insert({ code, admin_id: _perfil.id, expires_at: expires }).select().single();

      btn.disabled = false; btn.textContent = '+ Generar código';
      if (error) { alert('Error al generar código: ' + error.message); return; }
      await Promise.all([admCargarCodigos(), admCargarStats()]);
      admCopiarCodigo(data.code);
    }

    async function admEliminarCodigo(codeId, btn) {
      if (!confirm('¿Eliminar este código?')) return;
      btn.disabled = true;
      const { error } = await _supabase.from('access_codes').delete().eq('id', codeId);
      if (!error) {
        document.getElementById('adm-ccard-' + codeId)?.remove();
        admCargarStats();
      } else {
        btn.disabled = false;
      }
    }

    function admCopiarCodigo(code) {
      const mensaje =
`🎓 ¡Te comparto tu acceso a SmartBuilder EC!

Con este código puedes registrarte y empezar a construir tu expediente didáctico listo para evaluación CONOCER EC0217.01:

🔑 Código: ${code}

👉 Regístrate aquí: https://smartbuilderec.com/registro

Te tomará menos de 2 minutos y podrás generar todos los documentos que exige la norma de forma guiada, rápida y con apoyo de inteligencia artificial.`;

      navigator.clipboard.writeText(mensaje).catch(() => {
        const t = document.createElement('textarea');
        t.value = mensaje; document.body.appendChild(t); t.select();
        document.execCommand('copy'); t.remove();
      });
      mostrarToast(`✓ Código ${code} copiado con mensaje`);
    }

    function _adm_actualizarEstadoBtnCodigo(creditos, codigosActivos) {
      const btn = document.getElementById('adm-btnGenerarCodigo');
      if (!btn) return;
      if (_perfil.rol === 'super_admin') { btn.disabled = false; return; }
      if (creditos <= 0) {
        btn.disabled = true;
        btn.title = 'Sin créditos disponibles — ve a Mi Plan para renovar o agregar créditos';
      } else {
        btn.disabled = false;
        btn.title = `${creditos} crédito${creditos !== 1 ? 's' : ''} disponible${creditos !== 1 ? 's' : ''}`;
      }
    }
