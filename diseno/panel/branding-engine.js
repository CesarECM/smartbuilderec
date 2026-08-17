// branding-engine.js — Motor de marca blanca
// Convierte 1-2 colores hex en tokens CSS completos y los inyecta en <head>.
// También reemplaza logo y nombre de empresa en el header del panel.

(function () {
  // ── Conversión de color ──────────────────────────────────────────

  function _hexToHSL(hex) {
    let r = parseInt(hex.slice(1, 3), 16) / 255;
    let g = parseInt(hex.slice(3, 5), 16) / 255;
    let b = parseInt(hex.slice(5, 7), 16) / 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) {
      h = s = 0;
    } else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
        case g: h = ((b - r) / d + 2) / 6; break;
        case b: h = ((r - g) / d + 4) / 6; break;
      }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
  }

  function _hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const c = s * Math.min(l, 1 - l);
    const f = n => l - c * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }

  function _hslToHex(h, s, l) {
    const [r, g, b] = _hslToRgb(h, s, l);
    return '#' + [r, g, b].map(v => v.toString(16).padStart(2, '0')).join('');
  }

  // Genera la cadena de CSS variables que sobrescriben variables.css.
  // overrides: { oscuro, profundo, fondo, borde } — hex strings opcionales para tokens editables.
  function _generarCSS(hexP, hexA, overrides = {}) {
    const { h, s } = _hexToHSL(hexP);
    const a = hexA ? _hexToHSL(hexA) : null;
    const [rD, gD, bD] = _hslToRgb(h, s, 25);

    const oscuro   = (_esHex(overrides.oscuro)   ? overrides.oscuro   : null) ?? _hslToHex(h, s, 25);
    const profundo = (_esHex(overrides.profundo)  ? overrides.profundo : null) ?? _hslToHex(h, s, 10);
    const fondo    = (_esHex(overrides.fondo)     ? overrides.fondo    : null) ?? _hslToHex(h, Math.round(s * 0.6), 96);
    const borde    = (_esHex(overrides.borde)     ? overrides.borde    : null) ?? _hslToHex(h, Math.round(s * 0.35), 88);

    const lines = [
      `--c-blue-900: ${profundo};`,
      `--c-blue-800: ${_hslToHex(h, s, 18)};`,
      `--c-blue-700: ${oscuro};`,
      `--c-blue-600: ${hexP};`,
      `--c-blue-500: ${_hslToHex(h, s, 42)};`,
      `--c-blue-400: ${_hslToHex(h, s, 58)};`,
      `--c-blue-100: ${_hslToHex(h, Math.round(s * 0.6), 88)};`,
      `--c-blue-50:  ${_hslToHex(h, Math.round(s * 0.4), 94)};`,
      `--sb-bg: linear-gradient(180deg, ${oscuro} 0%, ${profundo} 100%);`,
      `--sb-accent: ${hexA || hexP};`,
      `--c-text-2: ${_hslToHex(h, Math.round(s * 0.7), 28)};`,
      `--c-text-3: ${_hslToHex(h, Math.round(s * 0.5), 48)};`,
      `--c-text-4: ${_hslToHex(h, Math.round(s * 0.35), 65)};`,
      `--c-bg:        ${fondo};`,
      `--c-surface-2: ${_hslToHex(h, Math.round(s * 0.3), 98)};`,
      `--c-border:    ${borde};`,
      `--c-border-s:  ${_hslToHex(h, Math.round(s * 0.4), 80)};`,
      `--shadow-sm: 0 2px 8px rgba(${rD},${gD},${bD},0.09);`,
      `--shadow-md: 0 4px 16px rgba(${rD},${gD},${bD},0.13);`,
      `--shadow-lg: 0 10px 32px rgba(${rD},${gD},${bD},0.18);`,
    ];

    if (a) {
      lines.push(
        `--c-ai:       ${hexA};`,
        `--c-ai-dark:  ${_hslToHex(a.h, a.s, Math.max(a.l - 15, 5))};`,
        `--c-ai-light: ${_hslToHex(a.h, Math.round(a.s * 0.5), 92)};`,
        `--shadow-ai:  0 4px 20px ${hexA}52;`,
      );
    }

    return `:root {\n  ${lines.join('\n  ')}\n}`;
  }

  // ── Inyección CSS ────────────────────────────────────────────────

  function _inyectarCSS(css) {
    let el = document.getElementById('sbe-branding');
    if (!el) {
      el = document.createElement('style');
      el.id = 'sbe-branding';
      document.head.appendChild(el);
    }
    el.textContent = css;
  }

  function _limpiarCSS() {
    const el = document.getElementById('sbe-branding');
    if (el) el.remove();
  }

  // ── Header: logo y nombre de empresa ────────────────────────────

  function _aplicarHeader(logoUrl, empresa) {
    const imgEl = document.getElementById('headerLogo');
    if (imgEl && logoUrl) {
      imgEl.src = logoUrl;
      imgEl.alt = empresa || 'Logo';
    }
    const titleEl = document.getElementById('headerTitle');
    if (titleEl && empresa) {
      titleEl.textContent = empresa;
    }
  }

  // ── API pública ──────────────────────────────────────────────────

  function _esHex(v) {
    return typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v.trim());
  }

  function inyectarBranding(perfil) {
    if (!perfil) return;
    const hexP = perfil.branding_color_primario;
    const hexA = perfil.branding_color_acento;
    if (_esHex(hexP)) {
      const overrides = {
        oscuro:   perfil.branding_color_oscuro   || null,
        profundo: perfil.branding_color_profundo  || null,
        fondo:    perfil.branding_color_fondo     || null,
        borde:    perfil.branding_color_borde     || null,
      };
      _inyectarCSS(_generarCSS(hexP.trim(), _esHex(hexA) ? hexA.trim() : null, overrides));
    } else {
      _limpiarCSS();
    }
    _aplicarHeader(perfil.branding_logo_url || null, perfil.branding_empresa || null);
  }

  function limpiarBranding() {
    _limpiarCSS();
  }

  window.inyectarBranding    = inyectarBranding;
  window.limpiarBranding     = limpiarBranding;
  window._generarCSSBranding = _generarCSS;
  // Calcula los 4 tokens derivados como hex a partir del color primario
  window._computarDerivados  = function (hexP) {
    const { h, s } = _hexToHSL(hexP);
    return {
      oscuro:   _hslToHex(h, s, 25),
      profundo: _hslToHex(h, s, 10),
      fondo:    _hslToHex(h, Math.round(s * 0.6), 96),
      borde:    _hslToHex(h, Math.round(s * 0.35), 88),
    };
  };
})();
