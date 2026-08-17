// tpl-branding.js — Template HTML del panel de branding (marca blanca)
// Solo visible para rol admin. Se inyecta en adm-panel-branding.

function _htmlBrandingPanel(perfil) {
  const logo    = perfil.branding_logo_url         || '';
  const empresa = perfil.branding_empresa           || '';
  const colorP  = perfil.branding_color_primario    || '#1F3B6D';
  const colorA  = perfil.branding_color_acento      || '#7C3AED';

  // Derivar valores por defecto para los 4 tokens editables
  const _d = (typeof window._computarDerivados === 'function')
    ? window._computarDerivados(colorP) : {};
  const colorOsc  = perfil.branding_color_oscuro   || _d.oscuro   || '#1a3464';
  const colorProf = perfil.branding_color_profundo  || _d.profundo || '#0f1e3c';
  const colorFond = perfil.branding_color_fondo     || _d.fondo    || '#eff3fb';
  const colorBord = perfil.branding_color_borde     || _d.borde    || '#dde5f0';

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
        <h3 class="branding-section-title">Paleta de colores</h3>
        <p class="branding-hint">Define el color principal y genera la paleta completa, o ajusta cada tono de forma independiente.</p>

        <div class="branding-palette-header">
          <div class="branding-color-field">
            <label for="brd-colorP">Color principal</label>
            <p class="branding-field-hint">Botones, navbar y acciones clave</p>
            <div class="branding-color-wrap">
              <input type="color" id="brd-colorP" value="${colorP}"
                oninput="brandingPreviewColor()">
              <input type="text" id="brd-colorPHex" value="${colorP}" maxlength="7"
                placeholder="#1F3B6D" oninput="brandingSyncHex('P')" class="branding-hex-input">
            </div>
          </div>
          <button class="btn-secondary brd-generar-btn" onclick="brandingGenerarPaleta()">
            ↺ Generar paleta
          </button>
        </div>

        <div class="branding-palette-grid">

          <div class="branding-color-field">
            <label for="brd-colorOscuro">Header y sidebar</label>
            <p class="branding-field-hint">Barra superior y fondo del menú lateral</p>
            <div class="branding-color-wrap">
              <input type="color" id="brd-colorOscuro" value="${colorOsc}"
                oninput="brandingPreviewToken('oscuro')">
              <input type="text" id="brd-colorOscuroHex" value="${colorOsc}" maxlength="7"
                oninput="brandingSyncToken('oscuro')" class="branding-hex-input">
            </div>
          </div>

          <div class="branding-color-field">
            <label for="brd-colorProfundo">Sidebar profundo</label>
            <p class="branding-field-hint">Tono más oscuro al fondo del sidebar</p>
            <div class="branding-color-wrap">
              <input type="color" id="brd-colorProfundo" value="${colorProf}"
                oninput="brandingPreviewToken('profundo')">
              <input type="text" id="brd-colorProfundoHex" value="${colorProf}" maxlength="7"
                oninput="brandingSyncToken('profundo')" class="branding-hex-input">
            </div>
          </div>

          <div class="branding-color-field">
            <label for="brd-colorA">Botones de IA</label>
            <p class="branding-field-hint">Botones "Generar con IA" y resaltados secundarios</p>
            <div class="branding-color-wrap">
              <input type="color" id="brd-colorA" value="${colorA}"
                oninput="brandingPreviewColor()">
              <input type="text" id="brd-colorAHex" value="${colorA}" maxlength="7"
                oninput="brandingsSyncHex('A')" class="branding-hex-input">
            </div>
          </div>

          <div class="branding-color-field">
            <label for="brd-colorFondo">Fondo de página</label>
            <p class="branding-field-hint">Color de fondo general de la plataforma</p>
            <div class="branding-color-wrap">
              <input type="color" id="brd-colorFondo" value="${colorFond}"
                oninput="brandingPreviewToken('fondo')">
              <input type="text" id="brd-colorFondoHex" value="${colorFond}" maxlength="7"
                oninput="brandingSyncToken('fondo')" class="branding-hex-input">
            </div>
          </div>

          <div class="branding-color-field">
            <label for="brd-colorBorde">Bordes y líneas</label>
            <p class="branding-field-hint">Tarjetas, inputs y separadores</p>
            <div class="branding-color-wrap">
              <input type="color" id="brd-colorBorde" value="${colorBord}"
                oninput="brandingPreviewToken('borde')">
              <input type="text" id="brd-colorBordeHex" value="${colorBord}" maxlength="7"
                oninput="brandingSyncToken('borde')" class="branding-hex-input">
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
