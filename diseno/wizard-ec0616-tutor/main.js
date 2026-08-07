// ─── wizard-ec0616-tutor/main.js — Bootstrap Sprint 1 ────────────────────────
// Sprint 1: infraestructura + navegación. Los pasos reales se agregan en S2-S6.

import {
  getSidebarHTML, initNavigation, mostrarSeccion, actualizarProgressBar,
} from "./navigation.js";
import { PASOS, PREFIJO } from "./config.js";

// ── Sidebar ──────────────────────────────────────────────────────────────────
const _sidebar = document.getElementById("sidebar");
if (_sidebar) _sidebar.innerHTML = getSidebarHTML();

// ── Secciones placeholder (se reemplazarán en Sprints 2-6) ───────────────────
const _main = document.querySelector("main.main");
if (_main) {
  PASOS.forEach(p => {
    _main.insertAdjacentHTML("beforeend", `
      <section id="${p.sec}" class="wizard-section hidden">
        <p class="paso-titulo">Paso ${p.paso} de 12</p>
        <h1>${p.label}</h1>
        <div class="card" style="max-width:800px">
          <div style="text-align:center;padding:40px 0;color:#9ca3af;">
            <div style="font-size:40px;margin-bottom:12px">🚧</div>
            <p style="font-size:14px;font-style:italic">Este paso estará disponible en la próxima actualización.</p>
          </div>
        </div>
      </section>`);
  });
}

// ── Navegación ────────────────────────────────────────────────────────────────
initNavigation();

// ── Bootstrap async ──────────────────────────────────────────────────────────
(async () => {
  if (!await authGuard()) return;
  await window.ec0616tSync?.init();

  try {
    const perfil = await getUserProfile();
    if (perfil) {
      if (typeof inyectarBranding === "function") inyectarBranding(perfil);
      const nombreEl = document.getElementById("wiz-nav-nombre");
      if (nombreEl) nombreEl.textContent =
        [perfil.nombre, perfil.apellido].filter(Boolean).join(" ") || perfil.email;
    }
  } catch (_) {}

  // Desbloquear pasos cuyos prerequisitos estén completos
  PASOS.forEach((p, i) => {
    if (i === 0) return;
    const prev = PASOS[i - 1];
    if (localStorage.getItem(`${PREFIJO}${prev.id}_completo`) === "true") {
      document.getElementById(p.nav)?.classList.remove("disabled");
    }
  });

  actualizarProgressBar();

  // Navegar al primer paso incompleto (o al último si todo completo)
  const primerIncompleto = PASOS.find(p =>
    localStorage.getItem(`${PREFIJO}${p.id}_completo`) !== "true"
  );
  mostrarSeccion(
    primerIncompleto ? primerIncompleto.sec : PASOS[PASOS.length - 1].sec
  );
})();
