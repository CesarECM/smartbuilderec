// ─── wizard-ec0616/main.js — Bootstrap del wizard EC0616 ─────────────────────

import { getSidebarHTML, initNavigation, mostrarSeccion, actualizarProgressBar } from "./navigation.js";
import { ELEMENTOS } from "./config.js";

import { initStepDatos16,     getTemplate as tplDatos }     from "./step-datos.js";
import { crearModulosElementos }                              from "./step-elemento.js";
import { initStepPortafolio16, getTemplate as tplPortafolio } from "./step-portafolio.js";
import { initIAElementos16 }   from "./ia-elem.js";
import { initIAScorecard16 }   from "./ia-scorecard.js";
import { initExport16 }        from "./export.js";

// ─── Inyectar sidebar ────────────────────────────────────────────────────────
const _sidebar = document.getElementById("sidebar");
if (_sidebar) _sidebar.innerHTML = getSidebarHTML();

// ─── Generar módulos de los 7 elementos ──────────────────────────────────────
const _modulos = crearModulosElementos();

// ─── Inyectar secciones en el DOM ────────────────────────────────────────────
const _main = document.querySelector("main.main");
if (_main) {
  _main.insertAdjacentHTML("beforeend", tplDatos());
  _modulos.forEach(m => _main.insertAdjacentHTML("beforeend", m.getTemplate()));
  _main.insertAdjacentHTML("beforeend", tplPortafolio());
}

// ─── Inicializar módulos ──────────────────────────────────────────────────────
initNavigation();
initStepDatos16();
_modulos.forEach(m => {
  window[`cargar${m.id.charAt(0).toUpperCase() + m.id.slice(1)}16`] = m.cargar;
  window[`guardar${m.id.charAt(0).toUpperCase() + m.id.slice(1)}16`] = m.guardar;
});
initStepPortafolio16();
initIAElementos16();
initIAScorecard16();
initExport16();

// ─── Tabla de botones Siguiente ──────────────────────────────────────────────
const _BTN_NAV_ELEM = [
  { btn:"btn16SigDatos", validar:"validarDatos16", guardar:"guardarDatos16", sig:"sec16Oxigenacion" },
];

// Agregar botones "Siguiente" de cada elemento al siguiente
const _secIds = ["sec16Oxigenacion","sec16Alimentacion","sec16Eliminacion","sec16Confort","sec16Seguridad","sec16Postmortem","sec16Autocuidado","sec16Portafolio"];
_modulos.forEach((m, i) => {
  const cap = m.id.charAt(0).toUpperCase() + m.id.slice(1);
  _BTN_NAV_ELEM.push({
    btn:    `btn16-sig-${m.id}`,
    validar: null,
    guardar: `guardar${cap}16`,
    sig:    _secIds[i + 1],
  });
});

_BTN_NAV_ELEM.forEach(({ btn, validar, guardar, sig }) => {
  document.getElementById(btn)?.addEventListener("click", () => {
    if (validar && typeof window[validar] === "function" && !window[validar]()) return;
    if (guardar && typeof window[guardar] === "function") window[guardar]();
    mostrarSeccion(sig);
  });
});

window.dispatchEvent(new CustomEvent("wizard-ec0616:ready"));

// ─── Bootstrap ────────────────────────────────────────────────────────────────
(async () => {
  if (!await authGuard()) return;
  await window.ec0616Sync?.init();

  try {
    const perfil = await getUserProfile();
    if (perfil) {
      if (typeof inyectarBranding === "function") inyectarBranding(perfil);
      document.getElementById("wiz-nav-nombre").textContent =
        [perfil.nombre, perfil.apellido].filter(Boolean).join(" ") || perfil.email;
    }
  } catch (_) {}

  window.cargarDatos16?.();
  _modulos.forEach(m => m.cargar());
  window.cargarPortafolio16?.();

  actualizarProgressBar();

  const pasosSigs = [
    { clave:"ec0616_datos_completo",        sec:"sec16Oxigenacion" },
    { clave:"ec0616_oxigenacion_completo",  sec:"sec16Alimentacion" },
    { clave:"ec0616_alimentacion_completo", sec:"sec16Eliminacion" },
    { clave:"ec0616_eliminacion_completo",  sec:"sec16Confort" },
    { clave:"ec0616_confort_completo",      sec:"sec16Seguridad" },
    { clave:"ec0616_seguridad_completo",    sec:"sec16Postmortem" },
    { clave:"ec0616_postmortem_completo",   sec:"sec16Autocuidado" },
    { clave:"ec0616_autocuidado_completo",  sec:"sec16Portafolio" },
  ];

  // Desbloquear nav items ya completados
  const navPairs = [
    ["ec0616_datos_completo",        "nav16-oxigenacion"],
    ["ec0616_oxigenacion_completo",  "nav16-alimentacion"],
    ["ec0616_alimentacion_completo", "nav16-eliminacion"],
    ["ec0616_eliminacion_completo",  "nav16-confort"],
    ["ec0616_confort_completo",      "nav16-seguridad"],
    ["ec0616_seguridad_completo",    "nav16-postmortem"],
    ["ec0616_postmortem_completo",   "nav16-autocuidado"],
    ["ec0616_autocuidado_completo",  "nav16-portafolio"],
  ];
  navPairs.forEach(([clave, navId]) => {
    if (localStorage.getItem(clave) === "true") document.getElementById(navId)?.classList.remove("disabled");
  });

  if (localStorage.getItem("ec0616_datos_completo") !== "true") {
    mostrarSeccion("sec16Datos");
  } else {
    const siguiente = pasosSigs.find(p => localStorage.getItem(p.clave) !== "true");
    mostrarSeccion(siguiente ? siguiente.sec : "sec16Portafolio");
  }
})();
