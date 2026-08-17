// panel-branding.js — Lógica del panel de configuración de marca blanca

var _brd_pendingFile = null;

// ── Helpers internos ─────────────────────────────────────────────────────────

function _brdIsHex(v) { return /^#[0-9A-Fa-f]{6}$/.test((v || '').trim()); }

function _setBrdPicker(capToken, hex) {
  const picker = document.getElementById(`brd-color${capToken}`);
  const input  = document.getElementById(`brd-color${capToken}Hex`);
  if (picker) picker.value = hex;
  if (input)  input.value  = hex;
}

function _getBrdOverrides() {
  return {
    oscuro:   document.getElementById('brd-colorOscuroHex')?.value.trim()   || null,
    profundo: document.getElementById('brd-colorProfundoHex')?.value.trim() || null,
    fondo:    document.getElementById('brd-colorFondoHex')?.value.trim()    || null,
    borde:    document.getElementById('brd-colorBordeHex')?.value.trim()    || null,
  };
}

// ── Preview en tiempo real ───────────────────────────────────────────────────

// Aplica todos los colores actuales al <style id="sbe-branding">
function brandingPreviewFull() {
  const hexP = document.getElementById('brd-colorPHex')?.value.trim()
            || document.getElementById('brd-colorP')?.value;
  const hexA = document.getElementById('brd-colorAHex')?.value.trim()
            || document.getElementById('brd-colorA')?.value;
  if (!hexP || typeof window._generarCSSBranding !== 'function') return;
  const css = window._generarCSSBranding(hexP, hexA, _getBrdOverrides());
  let el = document.getElementById('sbe-branding');
  if (!el) { el = document.createElement('style'); el.id = 'sbe-branding'; document.head.appendChild(el); }
  el.textContent = css;
}

// Sincroniza los hex-inputs de primario/acento y actualiza preview
function brandingPreviewColor() {
  const hexP = document.getElementById('brd-colorP')?.value;
  const hexA = document.getElementById('brd-colorA')?.value;
  const pHex = document.getElementById('brd-colorPHex');
  const aHex = document.getElementById('brd-colorAHex');
  if (pHex) pHex.value = hexP;
  if (aHex) aHex.value = hexA;
  brandingPreviewFull();
}

// Sincroniza picker desde hex-input (primario y acento)
function brandingSyncHex(tipo) {
  const hexInput = document.getElementById(`brd-color${tipo}Hex`);
  const picker   = document.getElementById(`brd-color${tipo}`);
  if (!hexInput || !picker) return;
  const val = hexInput.value.trim();
  if (_brdIsHex(val)) { picker.value = val; brandingPreviewFull(); }
}
function brandingsSyncHex(tipo) { brandingSyncHex(tipo); }

// Sincroniza picker derivado desde su hex-input y actualiza preview
function brandingSyncToken(token) {
  const cap    = token.charAt(0).toUpperCase() + token.slice(1);
  const input  = document.getElementById(`brd-color${cap}Hex`);
  const picker = document.getElementById(`brd-color${cap}`);
  if (!input || !picker) return;
  const val = input.value.trim();
  if (_brdIsHex(val)) { picker.value = val; brandingPreviewFull(); }
}

// Sincroniza hex-input desde picker derivado y actualiza preview
function brandingPreviewToken(token) {
  const cap   = token.charAt(0).toUpperCase() + token.slice(1);
  const hex   = document.getElementById(`brd-color${cap}`)?.value;
  const input = document.getElementById(`brd-color${cap}Hex`);
  if (input && hex) input.value = hex;
  brandingPreviewFull();
}

// Recalcula los 4 tokens derivados a partir del color principal
function brandingGenerarPaleta() {
  const hexP = document.getElementById('brd-colorPHex')?.value.trim()
            || document.getElementById('brd-colorP')?.value;
  if (!hexP || !_brdIsHex(hexP) || typeof window._computarDerivados !== 'function') return;
  const d = window._computarDerivados(hexP);
  _setBrdPicker('Oscuro',   d.oscuro);
  _setBrdPicker('Profundo', d.profundo);
  _setBrdPicker('Fondo',    d.fondo);
  _setBrdPicker('Borde',    d.borde);
  brandingPreviewFull();
}

// ── Preview de logo y empresa ────────────────────────────────────────────────

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

    const empresa    = (document.getElementById('brd-empresa')?.value         || '').trim();
    const colorP     = document.getElementById('brd-colorPHex')?.value.trim() || null;
    const colorA     = document.getElementById('brd-colorAHex')?.value.trim() || null;
    const colorOsc   = document.getElementById('brd-colorOscuroHex')?.value.trim()   || null;
    const colorProf  = document.getElementById('brd-colorProfundoHex')?.value.trim() || null;
    const colorFondo = document.getElementById('brd-colorFondoHex')?.value.trim()    || null;
    const colorBorde = document.getElementById('brd-colorBordeHex')?.value.trim()    || null;

    const { error } = await _supabase.from('profiles').update({
      branding_logo_url:      logoUrl,
      branding_empresa:        empresa  || null,
      branding_color_primario: colorP,
      branding_color_acento:   colorA,
      branding_color_oscuro:   colorOsc,
      branding_color_profundo: colorProf,
      branding_color_fondo:    colorFondo,
      branding_color_borde:    colorBorde,
    }).eq('id', user.id);

    if (error) throw new Error(error.message);

    Object.assign(_perfil, {
      branding_logo_url:      logoUrl,
      branding_empresa:        empresa || null,
      branding_color_primario: colorP,
      branding_color_acento:   colorA,
      branding_color_oscuro:   colorOsc,
      branding_color_profundo: colorProf,
      branding_color_fondo:    colorFondo,
      branding_color_borde:    colorBorde,
    });

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
    await _supabase.storage.from('branding').remove([
      `${user.id}/logo.png`, `${user.id}/logo.jpg`,
      `${user.id}/logo.jpeg`, `${user.id}/logo.webp`,
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
      branding_logo_url: null, branding_empresa: null,
      branding_color_primario: null, branding_color_acento: null,
      branding_color_oscuro: null,   branding_color_profundo: null,
      branding_color_fondo: null,    branding_color_borde: null,
    }).eq('id', user.id);

    Object.assign(_perfil, {
      branding_logo_url: null, branding_empresa: null,
      branding_color_primario: null, branding_color_acento: null,
      branding_color_oscuro: null,   branding_color_profundo: null,
      branding_color_fondo: null,    branding_color_borde: null,
    });

    if (typeof limpiarBranding === 'function') limpiarBranding();

    const headerLogoEl  = document.getElementById('headerLogo');
    const headerTitleEl = document.getElementById('headerTitle');
    if (headerLogoEl)  headerLogoEl.src         = 'img/ECM%20blanco%20sin%20fondo.png';
    if (headerTitleEl) headerTitleEl.textContent = 'SmartBuilderEC';

    const container = document.getElementById('adm-panel-branding');
    if (container) container.innerHTML = _htmlBrandingPanel(_perfil);

    _brdMsg('Configuración restaurada', 'ok');
  } catch (e) {
    _brdMsg('Error: ' + e.message, 'err');
  }
}

// ── Helper de mensajes ───────────────────────────────────────────────────────

function _brdMsg(texto, tipo) {
  const el = document.getElementById('brd-msg');
  if (!el) return;
  el.textContent = texto;
  el.className   = 'branding-msg' + (tipo ? ' ' + tipo : '');
  if (tipo === 'ok') setTimeout(() => { if (el) { el.textContent = ''; el.className = 'branding-msg'; } }, 3000);
}
