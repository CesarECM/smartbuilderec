// panel-branding.js — Lógica del panel de configuración de marca blanca

var _brd_pendingFile = null; // archivo de logo seleccionado pero no subido aún

// ── Preview en tiempo real ───────────────────────────────────────────────────

function brandingPreviewColor() {
  const hexP = document.getElementById('brd-colorP')?.value;
  const hexA = document.getElementById('brd-colorA')?.value;
  document.getElementById('brd-colorPHex').value = hexP;
  document.getElementById('brd-colorAHex').value = hexA;
  if (typeof _generarCSSBranding === 'function') {
    const css = _generarCSSBranding(hexP, hexA);
    let el = document.getElementById('sbe-branding');
    if (!el) { el = document.createElement('style'); el.id = 'sbe-branding'; document.head.appendChild(el); }
    el.textContent = css;
  }
}

function brandingSyncHex(tipo) {
  const hexInput = document.getElementById(`brd-color${tipo}Hex`);
  const picker   = document.getElementById(`brd-color${tipo}`);
  if (!hexInput || !picker) return;
  const val = hexInput.value.trim();
  if (/^#[0-9A-Fa-f]{6}$/.test(val)) {
    picker.value = val;
    brandingPreviewColor();
  }
}

// Alias para el oninput del acento (typo corregido en handler)
function brandingsSyncHex(tipo) { brandingSyncHex(tipo); }

function brandingPreviewLogo(input) {
  if (!input.files?.[0]) return;
  const file = input.files[0];
  if (file.size > 2 * 1024 * 1024) {
    _brdMsg('El logo no debe superar 2 MB.', 'err');
    input.value = '';
    return;
  }
  _brd_pendingFile = file;
  const reader = new FileReader();
  reader.onload = (e) => {
    const preview = document.getElementById('brd-logoPreview');
    if (preview) preview.innerHTML = `<img src="${e.target.result}" alt="Logo preview" id="brd-logoImg" style="max-height:56px">`;
    const headerLogoEl = document.getElementById('headerLogo');
    if (headerLogoEl) headerLogoEl.src = e.target.result;
  };
  reader.readAsDataURL(file);
}

function brandingPreviewEmpresa(valor) {
  const el = document.getElementById('headerTitle');
  if (el) el.textContent = valor || 'SmartBuilderEC';
}

// ── Guardar ──────────────────────────────────────────────────────────────────

async function brandingGuardar() {
  const btn = document.getElementById('brd-btnGuardar');
  btn.disabled = true;
  _brdMsg('Guardando...', '');

  try {
    const { data: { user } } = await _supabase.auth.getUser();
    let logoUrl = _perfil.branding_logo_url || null;

    // Subir logo si hay archivo pendiente
    if (_brd_pendingFile) {
      const ext  = _brd_pendingFile.name.split('.').pop().toLowerCase();
      const path = `${user.id}/logo.${ext}`;
      const { error: upErr } = await _supabase.storage
        .from('branding')
        .upload(path, _brd_pendingFile, { upsert: true, contentType: _brd_pendingFile.type });
      if (upErr) throw new Error('Error al subir el logo: ' + upErr.message);
      const { data: urlData } = _supabase.storage.from('branding').getPublicUrl(path);
      logoUrl = urlData.publicUrl + '?t=' + Date.now();
      _brd_pendingFile = null;
    }

    const empresa = (document.getElementById('brd-empresa')?.value || '').trim();
    const colorP  = document.getElementById('brd-colorP')?.value  || null;
    const colorA  = document.getElementById('brd-colorA')?.value  || null;

    const { error } = await _supabase.from('profiles').update({
      branding_logo_url:      logoUrl,
      branding_empresa:        empresa  || null,
      branding_color_primario: colorP,
      branding_color_acento:   colorA,
    }).eq('id', user.id);

    if (error) throw new Error(error.message);

    // Actualizar _perfil global
    _perfil.branding_logo_url      = logoUrl;
    _perfil.branding_empresa        = empresa || null;
    _perfil.branding_color_primario = colorP;
    _perfil.branding_color_acento   = colorA;

    // Re-render del botón de logo si había logo nuevo
    if (logoUrl) {
      const actions = document.querySelector('.branding-logo-actions');
      if (actions && !actions.querySelector('.danger')) {
        actions.innerHTML += `<button class="btn-sm danger" onclick="brandingEliminarLogo()">Eliminar</button>`;
      }
      const lbl = actions?.querySelector('.branding-upload-btn');
      if (lbl) lbl.textContent = '🔄 Cambiar logo';
    }

    _brdMsg('✓ Configuración guardada', 'ok');
  } catch (e) {
    _brdMsg(e.message, 'err');
  } finally {
    btn.disabled = false;
  }
}

// ── Eliminar logo ────────────────────────────────────────────────────────────

async function brandingEliminarLogo() {
  if (!confirm('¿Eliminar el logo actual?')) return;
  try {
    const { data: { user } } = await _supabase.auth.getUser();
    // Intentar eliminar archivos comunes del bucket
    await _supabase.storage.from('branding').remove([
      `${user.id}/logo.png`,
      `${user.id}/logo.jpg`,
      `${user.id}/logo.jpeg`,
      `${user.id}/logo.webp`,
    ]);
    await _supabase.from('profiles').update({ branding_logo_url: null }).eq('id', user.id);
    _perfil.branding_logo_url = null;
    _brd_pendingFile = null;

    const preview = document.getElementById('brd-logoPreview');
    if (preview) preview.innerHTML = `<span class="branding-logo-placeholder" id="brd-logoPlaceholder">Sin logo</span>`;
    const lbl = document.querySelector('.branding-upload-btn');
    if (lbl) lbl.textContent = '⬆️ Subir logo';
    const delBtn = document.querySelector('.branding-logo-actions .danger');
    if (delBtn) delBtn.remove();

    const headerLogoEl = document.getElementById('headerLogo');
    if (headerLogoEl) headerLogoEl.src = 'img/ECM%20blanco%20sin%20fondo.png';
    _brdMsg('Logo eliminado', 'ok');
  } catch (e) {
    _brdMsg('Error al eliminar: ' + e.message, 'err');
  }
}

// ── Restaurar predeterminados ────────────────────────────────────────────────

async function brandingRestaurar() {
  if (!confirm('¿Restaurar los colores y logo predeterminados de SmartBuilderEC?')) return;
  try {
    const { data: { user } } = await _supabase.auth.getUser();
    await _supabase.from('profiles').update({
      branding_logo_url:      null,
      branding_empresa:        null,
      branding_color_primario: null,
      branding_color_acento:   null,
    }).eq('id', user.id);

    Object.assign(_perfil, {
      branding_logo_url: null, branding_empresa: null,
      branding_color_primario: null, branding_color_acento: null,
    });

    if (typeof limpiarBranding === 'function') limpiarBranding();

    const headerLogoEl  = document.getElementById('headerLogo');
    const headerTitleEl = document.getElementById('headerTitle');
    if (headerLogoEl)  headerLogoEl.src         = 'img/ECM%20blanco%20sin%20fondo.png';
    if (headerTitleEl) headerTitleEl.textContent = 'SmartBuilderEC';

    // Re-renderizar el panel con valores por defecto
    const container = document.getElementById('adm-panel-branding');
    if (container) container.innerHTML = _htmlBrandingPanel(_perfil);

    _brdMsg('Configuración restaurada', 'ok');
  } catch (e) {
    _brdMsg('Error: ' + e.message, 'err');
  }
}

// ── Helper ───────────────────────────────────────────────────────────────────

function _brdMsg(texto, tipo) {
  const el = document.getElementById('brd-msg');
  if (!el) return;
  el.textContent = texto;
  el.className   = 'branding-msg' + (tipo ? ' ' + tipo : '');
  if (tipo === 'ok') setTimeout(() => { if (el) { el.textContent = ''; el.className = 'branding-msg'; } }, 3000);
}
