// tpl-branding.js — Template HTML del panel de branding (marca blanca)
// Solo visible para rol admin. Se inyecta en adm-panel-branding.

function _htmlBrandingPanel(perfil) {
  const logo    = perfil.branding_logo_url    || '';
  const empresa = perfil.branding_empresa      || '';
  const colorP  = perfil.branding_color_primario || '#1F3B6D';
  const colorA  = perfil.branding_color_acento   || '#7C3AED';

  return `
    <div class="branding-wrap">

      <div class="branding-section">
        <h3 class="branding-section-title">Logo de tu empresa</h3>
        <p class="branding-hint">PNG o JPG, máximo 2 MB. Se mostrará en el encabezado de la plataforma.</p>
        <div class="branding-logo-row">
          <div class="branding-logo-preview" id="brd-logoPreview">
            ${logo
              ? `<img src="${logo}" alt="Logo actual" id="brd-logoImg">`
              : `<span class="branding-logo-placeholder" id="brd-logoPlaceholder">Sin logo</span>`}
          </div>
          <div class="branding-logo-actions">
            <label class="btn-secondary branding-upload-btn" for="brd-inputLogo">
              ${logo ? '🔄 Cambiar logo' : '⬆️ Subir logo'}
            </label>
            <input type="file" id="brd-inputLogo" accept="image/png,image/jpeg,image/webp"
              style="display:none" onchange="brandingPreviewLogo(this)">
            ${logo ? `<button class="btn-sm danger" onclick="brandingEliminarLogo()">Eliminar</button>` : ''}
          </div>
        </div>
      </div>

      <div class="branding-section">
        <h3 class="branding-section-title">Nombre de tu empresa</h3>
        <p class="branding-hint">Aparece en el encabezado al lado del logo.</p>
        <input type="text" id="brd-empresa" class="branding-input"
          value="${_escBrd(empresa)}" placeholder="Ej. CEECM Capacitación" maxlength="60"
          oninput="brandingPreviewEmpresa(this.value)">
      </div>

      <div class="branding-section">
        <h3 class="branding-section-title">Colores de marca</h3>
        <p class="branding-hint">
          El <strong>color primario</strong> define la paleta principal (encabezados, botones, sidebar).
          El <strong>color de acento</strong> se usa en botones de IA y elementos secundarios.
        </p>
        <div class="branding-colors-row">
          <div class="branding-color-field">
            <label for="brd-colorP">Color primario</label>
            <div class="branding-color-wrap">
              <input type="color" id="brd-colorP" value="${colorP}"
                oninput="brandingPreviewColor()">
              <input type="text"  id="brd-colorPHex" value="${colorP}" maxlength="7"
                placeholder="#1F3B6D" oninput="brandingSyncHex('P')" class="branding-hex-input">
            </div>
          </div>
          <div class="branding-color-field">
            <label for="brd-colorA">Color de acento</label>
            <div class="branding-color-wrap">
              <input type="color" id="brd-colorA" value="${colorA}"
                oninput="brandingPreviewColor()">
              <input type="text"  id="brd-colorAHex" value="${colorA}" maxlength="7"
                placeholder="#7C3AED" oninput="brandingsSyncHex('A')" class="branding-hex-input">
            </div>
          </div>
        </div>
      </div>

      <div class="branding-actions">
        <button class="btn-primary" id="brd-btnGuardar" onclick="brandingGuardar()">
          Guardar configuración
        </button>
        <button class="btn-secondary" onclick="brandingRestaurar()">
          Restaurar predeterminados
        </button>
        <span class="branding-msg" id="brd-msg"></span>
      </div>

    </div>`;
}

function _escBrd(str) {
  return (str || '').replace(/&/g,'&amp;').replace(/"/g,'&quot;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
}
