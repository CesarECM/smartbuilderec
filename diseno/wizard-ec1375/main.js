// ─── wizard-ec1375/main.js — Bootstrap del wizard EC1375 ──────────────────────

import { getSidebarHTML, initNavigation, mostrarSeccion, actualizarProgressBar } from "./navigation.js";

import { initStepDatos75,         getTemplate as tplDatos }         from "./step-datos.js";
import { initStepEspacio75,       getTemplate as tplEspacio }       from "./step-espacio.js";
import { initStepUsuario75,       getTemplate as tplUsuario }       from "./step-usuario.js";
import { initStepSignos75,        getTemplate as tplSignos }        from "./step-signos.js";
import { initStepConsentimiento75, getTemplate as tplConsentimiento } from "./step-consentimiento.js";
import { initStepSeguimiento75,   getTemplate as tplSeguimiento }   from "./step-seguimiento.js";
import { initStepExpediente75,    getTemplate as tplExpediente }    from "./step-expediente.js";
import { initIASeguimiento75 }    from "./ia-seguimiento.js";
import { initExport75 }           from "./export.js";

// ─── Inyectar sidebar ────────────────────────────────────────────────────────
const _sidebar = document.getElementById("sidebar");
if (_sidebar) _sidebar.innerHTML = getSidebarHTML();

// ─── Inyectar secciones en el DOM ────────────────────────────────────────────
const _main = document.querySelector("main.main");
if (_main) {
  _main.insertAdjacentHTML("beforeend", tplDatos());
  _main.insertAdjacentHTML("beforeend", tplEspacio());
  _main.insertAdjacentHTML("beforeend", tplUsuario());
  _main.insertAdjacentHTML("beforeend", tplSignos());
  _main.insertAdjacentHTML("beforeend", tplConsentimiento());
  _main.insertAdjacentHTML("beforeend", tplSeguimiento());
  _main.insertAdjacentHTML("beforeend", tplExpediente());
}

// ─── Inicializar módulos ──────────────────────────────────────────────────────
initNavigation();
initStepDatos75();
initStepEspacio75();
initStepUsuario75();
initStepSignos75();
initStepConsentimiento75();
initStepSeguimiento75();
initStepExpediente75();
initIASeguimiento75();
initExport75();

// ─── Botones Siguiente ────────────────────────────────────────────────────────
const _BTN_NAV = [
  { btn: "btn75SigDatos",          validar: "validarDatos75",          guardar: "guardarDatos75",          sig: "sec75Espacio" },
  { btn: "btn75SigEspacio",        validar: null,                      guardar: "guardarEspacio75",        sig: "sec75Usuario" },
  { btn: "btn75SigUsuario",        validar: "validarUsuario75",        guardar: "guardarUsuario75",        sig: "sec75Signos" },
  { btn: "btn75SigSignos",         validar: null,                      guardar: "guardarSignos75",         sig: "sec75Consentimiento" },
  { btn: "btn75SigConsentimiento", validar: "validarConsentimiento75", guardar: "guardarConsentimiento75", sig: "sec75Seguimiento" },
  { btn: "btn75SigSeguimiento",    validar: null,                      guardar: "guardarSeguimiento75",    sig: "sec75Expediente" },
];

_BTN_NAV.forEach(({ btn, validar, guardar, sig }) => {
  document.getElementById(btn)?.addEventListener("click", () => {
    if (validar && typeof window[validar] === "function" && !window[validar]()) return;
    if (guardar && typeof window[guardar] === "function") window[guardar]();
    mostrarSeccion(sig);
  });
});

window.dispatchEvent(new CustomEvent("wizard-ec1375:ready"));

// ─── Bootstrap ────────────────────────────────────────────────────────────────
(async () => {
  if (!await authGuard()) return;
  await window.ec1375Sync?.init();

  try {
    const perfil = await getUserProfile();
    if (perfil) {
      if (typeof inyectarBranding === "function") inyectarBranding(perfil);
      document.getElementById("wiz-nav-nombre").textContent =
        [perfil.nombre, perfil.apellido].filter(Boolean).join(" ") || perfil.email;
    }
  } catch (_) {}

  window.cargarDatos75?.();
  window.cargarEspacio75?.();
  window.cargarUsuario75?.();
  window.cargarSignos75?.();
  window.cargarConsentimiento75?.();
  window.cargarSeguimiento75?.();
  window.cargarExpediente75?.();

  actualizarProgressBar();

  // Desbloquear nav items ya completados
  const navPairs = [
    ["ec1375_datos_completo",          "nav75-espacio"],
    ["ec1375_espacio_completo",        "nav75-usuario"],
    ["ec1375_usuario_completo",        "nav75-signos"],
    ["ec1375_signos_completo",         "nav75-consentimiento"],
    ["ec1375_consentimiento_completo", "nav75-seguimiento"],
    ["ec1375_seguimiento_completo",    "nav75-expediente"],
  ];
  navPairs.forEach(([clave, navId]) => {
    if (localStorage.getItem(clave) === "true") document.getElementById(navId)?.classList.remove("disabled");
  });

  // Ir al primer paso incompleto
  const pasosSigs = [
    { clave: "ec1375_datos_completo",          sec: "sec75Espacio" },
    { clave: "ec1375_espacio_completo",        sec: "sec75Usuario" },
    { clave: "ec1375_usuario_completo",        sec: "sec75Signos" },
    { clave: "ec1375_signos_completo",         sec: "sec75Consentimiento" },
    { clave: "ec1375_consentimiento_completo", sec: "sec75Seguimiento" },
    { clave: "ec1375_seguimiento_completo",    sec: "sec75Expediente" },
  ];

  if (localStorage.getItem("ec1375_datos_completo") !== "true") {
    mostrarSeccion("sec75Datos");
  } else {
    const siguiente = pasosSigs.find(p => localStorage.getItem(p.clave) !== "true");
    mostrarSeccion(siguiente ? siguiente.sec : "sec75Expediente");
  }
})();
