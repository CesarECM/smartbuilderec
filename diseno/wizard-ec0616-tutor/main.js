// ─── wizard-ec0616-tutor/main.js — Bootstrap Sprint 3 ─────────────────────────

import {
  getSidebarHTML, initNavigation, mostrarSeccion, actualizarProgressBar,
} from "./navigation.js";
import { PASOS, PREFIJO } from "./config.js";
import { getTemplate as getFichaTemplate,        initStepFicha }        from "./step-ficha.js";
import { getTemplate as getConfidencialTemplate,  initStepConfidencial }  from "./step-confidencial.js";
import { getTemplate as getDiagnosticoTemplate,   initStepDiagnostico }   from "./step-diagnostico.js";
import { getTemplate as getPlanTemplate,          initStepPlan }          from "./step-plan.js";
import { getTemplate as getIECTemplate,           initStepIEC }           from "./step-iec.js";
import { getTemplate as getCierreTemplate,        initStepCierre }        from "./step-cierre.js";
import { initExportTutor }                                                from "./export.js";

// ── Sidebar ──────────────────────────────────────────────────────────────────
const _sidebar = document.getElementById("sidebar");
if (_sidebar) _sidebar.innerHTML = getSidebarHTML();

// ── Secciones ─────────────────────────────────────────────────────────────────
const _main = document.querySelector("main.main");
if (_main) {
  PASOS.forEach(p => {
    if (p.id === "ficha") {
      _main.insertAdjacentHTML("beforeend", getFichaTemplate());
    } else if (p.id === "confidencial") {
      _main.insertAdjacentHTML("beforeend", getConfidencialTemplate());
    } else if (p.id === "diagnostico") {
      _main.insertAdjacentHTML("beforeend", getDiagnosticoTemplate());
    } else if (p.id === "plan") {
      _main.insertAdjacentHTML("beforeend", getPlanTemplate());
    } else if (p.id.startsWith("iec")) {
      const n = parseInt(p.id.replace("iec", ""), 10);
      _main.insertAdjacentHTML("beforeend", getIECTemplate(n));
    } else if (p.id === "cierre") {
      _main.insertAdjacentHTML("beforeend", getCierreTemplate());
    } else {
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
    }
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

  // Inicializar pasos implementados (S2 + S3 + S4)
  initStepFicha();
  initStepConfidencial();
  initStepDiagnostico();
  initStepPlan();
  // IEC secuencial → cierre después para que _marcas esté completo al calcular
  (async () => {
    for (let e = 1; e <= 7; e++) await initStepIEC(e);
    await initStepCierre();
    initExportTutor();
  })();

  // Navegar al primer paso incompleto (o al último si todo completo)
  const primerIncompleto = PASOS.find(p =>
    localStorage.getItem(`${PREFIJO}${p.id}_completo`) !== "true"
  );
  mostrarSeccion(
    primerIncompleto ? primerIncompleto.sec : PASOS[PASOS.length - 1].sec
  );
})();
