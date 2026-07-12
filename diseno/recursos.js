  const BACKEND = 'https://smartbuilderec.onrender.com';

  // ── Markdown → HTML (para artículos) ────────────────────────────────────────
  function mdFull(raw) {
    if (!raw) return '';
    let s = raw
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    // Bloques de código ```
    s = s.replace(/```[\w]*\n?([\s\S]*?)```/g, (_, code) =>
      `<pre><code>${code.trim()}</code></pre>`);

    // Headers
    s = s.replace(/^### (.+)$/gm, '<h3>$1</h3>');
    s = s.replace(/^## (.+)$/gm,  '<h2>$1</h2>');
    s = s.replace(/^# (.+)$/gm,   '<h1>$1</h1>');

    // Bold / Italic
    s = s.replace(/\*\*\*([^*\n]+)\*\*\*/g, '<strong><em>$1</em></strong>');
    s = s.replace(/\*\*([^*\n]+)\*\*/g, '<strong>$1</strong>');
    s = s.replace(/\*([^*\n]+)\*/g, '<em>$1</em>');

    // Código inline
    s = s.replace(/`([^`\n]+)`/g, '<code>$1</code>');

    // Links [texto](url)
    s = s.replace(/\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // HR
    s = s.replace(/^(---|\*\*\*)$/gm, '<hr>');

    // Blockquote
    s = s.replace(/^&gt; (.+)$/gm, '<blockquote>$1</blockquote>');

    // Listas
    const lines = s.split('\n');
    let html = ''; let inUl = false; let inOl = false;
    for (const line of lines) {
      if (/^[-•*]\s/.test(line)) {
        if (inOl) { html += '</ol>'; inOl = false; }
        if (!inUl) { html += '<ul>'; inUl = true; }
        html += `<li>${line.replace(/^[-•*]\s+/, '')}</li>`;
      } else if (/^\d+\.\s/.test(line)) {
        if (inUl) { html += '</ul>'; inUl = false; }
        if (!inOl) { html += '<ol>'; inOl = true; }
        html += `<li>${line.replace(/^\d+\.\s+/, '')}</li>`;
      } else {
        if (inUl) { html += '</ul>'; inUl = false; }
        if (inOl) { html += '</ol>'; inOl = false; }
        // Saltos de párrafo
        if (line.trim() === '') {
          html += '</p><p>';
        } else if (!line.startsWith('<h') && !line.startsWith('<pre') &&
                   !line.startsWith('<hr') && !line.startsWith('<blockquote')) {
          html += line + ' ';
        } else {
          html += line;
        }
      }
    }
    if (inUl) html += '</ul>';
    if (inOl) html += '</ol>';
    // Limpiar párrafos vacíos
    html = '<p>' + html + '</p>';
    html = html.replace(/<p>\s*<\/p>/g, '');
    html = html.replace(/<p>\s*(<h[1-6]|<pre|<ul|<ol|<hr|<blockquote)/g, '$1');
    html = html.replace(/(<\/h[1-6]>|<\/pre>|<\/ul>|<\/ol>|<hr>|<\/blockquote>)\s*<\/p>/g, '$1');
    return html;
  }

  // ── Tipo badge ───────────────────────────────────────────────────────────────
  function tipoLabel(tipo) {
    const map = { articulo: 'Artículo', tutorial: 'Tutorial', guia: 'Guía',
                  pdf: 'PDF', video: 'Video' };
    return map[tipo] || tipo || 'Recurso';
  }

  // ── Excerpto del contenido ───────────────────────────────────────────────────
  function excerpt(txt, n = 120) {
    if (!txt) return '';
    const plain = txt.replace(/[#*`>_\[\]]/g, '').replace(/\s+/g, ' ').trim();
    return plain.length > n ? plain.slice(0, n) + '…' : plain;
  }

  // ── Listado ──────────────────────────────────────────────────────────────────
  async function cargarLista() {
    const el = document.getElementById('lista-recursos');
    try {
      const res = await fetch(`${BACKEND}/recursos`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const recursos = await res.json();
      if (!recursos.length) {
        el.innerHTML = `<div class="empty">
          <div class="empty-icon">📚</div>
          <h3>Aún no hay recursos publicados</h3>
          <p>Pronto encontrarás aquí artículos, tutoriales y guías sobre la norma EC0217.01 y el uso de SmartBuilderEC.</p>
        </div>`;
        return;
      }
      el.innerHTML = `<div class="grid">${recursos.map(r => {
        const fecha = new Date(r.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
        const ex    = excerpt(r.contenido || r.titulo);
        return `<a class="card" href="/recursos?id=${r.id}" onclick="abrirArticulo(event,'${r.id}')">
          <span class="card-type">${tipoLabel(r.tipo)}</span>
          <h2>${r.titulo.replace(/</g,'&lt;')}</h2>
          ${ex ? `<p class="card-excerpt">${ex.replace(/</g,'&lt;')}</p>` : ''}
          <div class="card-footer">
            <span class="card-date">${fecha}</span>
            <span class="card-arrow">Leer →</span>
          </div>
        </a>`;
      }).join('')}</div>`;
    } catch(e) {
      el.innerHTML = `<div class="error-msg">Error al cargar recursos: ${e.message}</div>`;
    }
  }

  // ── Artículo individual ───────────────────────────────────────────────────────
  async function cargarArticulo(id) {
    const el = document.getElementById('articulo-contenido');
    el.innerHTML = '<div class="loading">Cargando artículo...</div>';
    document.getElementById('view-list').style.display    = 'none';
    document.getElementById('view-article').style.display = 'block';
    try {
      const res = await fetch(`${BACKEND}/recursos/${id}`);
      if (res.status === 404) throw new Error('Artículo no encontrado.');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const r = await res.json();
      const fecha = new Date(r.created_at).toLocaleDateString('es-MX', { day: '2-digit', month: 'long', year: 'numeric' });
      document.title = `${r.titulo} — SmartBuilderEC`;
      el.innerHTML = `
        <div class="article-header">
          <span class="article-type">${tipoLabel(r.tipo)}</span>
          <h1>${r.titulo.replace(/</g,'&lt;')}</h1>
          <div class="article-meta">Publicado el ${fecha} · Contexto: ${r.contexto || 'general'}</div>
          ${r.url ? `<div class="article-url"><a href="${r.url}" target="_blank" rel="noopener">🔗 Ver recurso externo</a></div>` : ''}
        </div>
        ${r.contenido
          ? `<div class="article-body">${mdFull(r.contenido)}</div>`
          : '<p style="color:var(--text-3);font-style:italic">Este recurso no tiene contenido de texto; accede al recurso externo con el enlace de arriba.</p>'
        }`;
    } catch(e) {
      el.innerHTML = `<div class="error-msg">${e.message}</div>`;
    }
  }

  function abrirArticulo(e, id) {
    e.preventDefault();
    history.pushState({ id }, '', `/recursos?id=${id}`);
    cargarArticulo(id);
  }

  function volverLista(e) {
    e.preventDefault();
    history.pushState({}, '', '/recursos');
    document.getElementById('view-list').style.display    = 'block';
    document.getElementById('view-article').style.display = 'none';
    document.title = 'Recursos — SmartBuilderEC';
  }

  window.addEventListener('popstate', (e) => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    if (id) {
      cargarArticulo(id);
    } else {
      document.getElementById('view-list').style.display    = 'block';
      document.getElementById('view-article').style.display = 'none';
      document.title = 'Recursos — SmartBuilderEC';
    }
  });

  // ── Init ─────────────────────────────────────────────────────────────────────
  const _params = new URLSearchParams(window.location.search);
  const _id = _params.get('id');
  if (_id) {
    cargarLista(); // carga silenciosa en background para el botón "volver"
    cargarArticulo(_id);
  } else {
    cargarLista();
  }
