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

  function _hsl(h, s, l) {
    return `hsl(${h}, ${s}%, ${l}%)`;
  }

  // Convierte HSL a [r, g, b] enteros (para generar rgba en sombras)
  function _hslToRgb(h, s, l) {
    s /= 100; l /= 100;
    const k = n => (n + h / 30) % 12;
    const c = s * Math.min(l, 1 - l);
    const f = n => l - c * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
    return [Math.round(f(0) * 255), Math.round(f(8) * 255), Math.round(f(4) * 255)];
  }

  // Genera la cadena de CSS variables que sobrescriben variables.css
  function _generarCSS(hexP, hexA) {
    const p = _hexToHSL(hexP);
    const a = hexA ? _hexToHSL(hexA) : null;
    const { h, s } = p;
    const [rD, gD, bD] = _hslToRgb(h, s, 25); // tono oscuro del primario (para sombras)

    const lines = [
      // Escala de azules → sustituida por escala del color primario
      `--c-blue-900: ${_hsl(h, s, 10)};`,
      `--c-blue-800: ${_hsl(h, s, 18)};`,
      `--c-blue-700: ${_hsl(h, s, 25)};`,
      `--c-blue-600: ${hexP};`,
      `--c-blue-500: ${_hsl(h, s, 42)};`,
      `--c-blue-400: ${_hsl(h, s, 58)};`,
      `--c-blue-100: ${_hsl(h, Math.round(s * 0.6), 88)};`,
      `--c-blue-50:  ${_hsl(h, Math.round(s * 0.4), 94)};`,
      // Sidebar gradient
      `--sb-bg: linear-gradient(180deg, ${_hsl(h, s, 25)} 0%, ${_hsl(h, s, 10)} 100%);`,
      `--sb-accent: ${hexA || hexP};`,
      // Texto con tono del primario
      `--c-text-2: ${_hsl(h, Math.round(s * 0.7), 28)};`,
      `--c-text-3: ${_hsl(h, Math.round(s * 0.5), 48)};`,
      `--c-text-4: ${_hsl(h, Math.round(s * 0.35), 65)};`,
      // Fondos y bordes con tint del primario
      `--c-bg:        ${_hsl(h, Math.round(s * 0.6), 96)};`,
      `--c-surface-2: ${_hsl(h, Math.round(s * 0.3), 98)};`,
      `--c-border:    ${_hsl(h, Math.round(s * 0.35), 88)};`,
      `--c-border-s:  ${_hsl(h, Math.round(s * 0.4), 80)};`,
      // Sombras con el tono oscuro del primario
      `--shadow-sm: 0 2px 8px rgba(${rD},${gD},${bD},0.09);`,
      `--shadow-md: 0 4px 16px rgba(${rD},${gD},${bD},0.13);`,
      `--shadow-lg: 0 10px 32px rgba(${rD},${gD},${bD},0.18);`,
    ];

    if (a) {
      lines.push(
        `--c-ai:       ${hexA};`,
        `--c-ai-dark:  ${_hsl(a.h, a.s, Math.max(a.l - 15, 5))};`,
        `--c-ai-light: ${_hsl(a.h, Math.round(a.s * 0.5), 92)};`,
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

  // Valida que un string sea hex de 6 dígitos
  function _esHex(v) {
    return typeof v === 'string' && /^#[0-9A-Fa-f]{6}$/.test(v.trim());
  }

  // Aplica el branding completo a partir del objeto _perfil
  function inyectarBranding(perfil) {
    if (!perfil) return;
    const hexP = perfil.branding_color_primario;
    const hexA = perfil.branding_color_acento;
    if (_esHex(hexP)) {
      _inyectarCSS(_generarCSS(hexP.trim(), _esHex(hexA) ? hexA.trim() : null));
    } else {
      _limpiarCSS();
    }
    _aplicarHeader(perfil.branding_logo_url || null, perfil.branding_empresa || null);
  }

  // Elimina el branding (restaura colores por defecto)
  function limpiarBranding() {
    _limpiarCSS();
  }

  window.inyectarBranding = inyectarBranding;
  window.limpiarBranding  = limpiarBranding;
  window._generarCSSBranding = _generarCSS; // expuesto para preview en tiempo real
})();
