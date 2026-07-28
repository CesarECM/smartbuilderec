// ─── wizard-ec0091/main.js — Bootstrap del wizard EC0091 ─────────────────────

import { getSidebarHTML, initNavigation, mostrarSeccion, actualizarProgressBar } from "./navigation.js";

import { initStepDatos91,       getTemplate as tplDatos }       from "./step-datos.js";
import { initStepObjetivo91,    getTemplate as tplObjetivo }    from "./step-objetivo.js";
import { initStepAntecedentes91,getTemplate as tplAntecedentes }from "./step-antecedentes.js";
import { initStepLineas91,      getTemplate as tplLineas }      from "./step-lineas.js";
import { initStepMuestreo91,    getTemplate as tplMuestreo }    from "./step-muestreo.js";
import { initStepDocumentos91,  getTemplate as tplDocumentos }  from "./step-documentos.js";
import { initStepCronograma91,  getTemplate as tplCronograma }  from "./step-cronograma.js";
import { initStepLista91,       getTemplate as tplLista }       from "./step-lista.js";
import { initStepEjecucion91,   getTemplate as tplEjecucion }   from "./step-ejecucion.js";
import { initStepHallazgos91,   getTemplate as tplHallazgos }   from "./step-hallazgos.js";
import { initStepInforme91,     getTemplate as tplInforme }     from "./step-informe.js";
import { initStepCierre91,      getTemplate as tplCierre }      from "./step-cierre.js";
import { initStepExpediente91,  getTemplate as tplExpediente }  from "./step-expediente.js";

import { initIAObjetivo91 }       from "./ia-objetivo.js";
import { initIALista91 }          from "./ia-lista.js";
import { initIAHallazgos91 }      from "./ia-hallazgos.js";
import { initIAInforme91 }        from "./ia-informe.js";
import { initIARevisionGlobal91 } from "./ia-revision-global.js";
import { initExport91 }           from "./export.js";

// ─── Inyectar sidebar y secciones ────────────────────────────────────────────
const _sidebar = document.getElementById("sidebar");
if (_sidebar) _sidebar.innerHTML = getSidebarHTML();

const _main = document.querySelector("main.main");
if (_main) {
  [tplDatos, tplObjetivo, tplAntecedentes, tplLineas, tplMuestreo, tplDocumentos,
   tplCronograma, tplLista, tplEjecucion, tplHallazgos, tplInforme, tplCierre, tplExpediente
  ].forEach(fn => _main.insertAdjacentHTML("beforeend", fn()));
}

// ─── Inicializar módulos ──────────────────────────────────────────────────────
initNavigation();
initStepDatos91();
initStepObjetivo91();
initStepAntecedentes91();
initStepLineas91();
initStepMuestreo91();
initStepDocumentos91();
initStepCronograma91();
initStepLista91();
initStepEjecucion91();
initStepHallazgos91();
initStepInforme91();
initStepCierre91();
initStepExpediente91();

initIAObjetivo91();
initIALista91();
initIAHallazgos91();
initIAInforme91();
initIARevisionGlobal91();
initExport91();

// ─── Tabla de botones "Siguiente" ────────────────────────────────────────────
const _BTN_NAV = [
  { btn:"btn91SigDatos",       validar:"validarDatos91",    guardar:"guardarDatos91",       sig:"sec91Objetivo"     },
  { btn:"btn91SigObjetivo",    validar:"validarObjetivo91", guardar:"guardarObjetivo91",    sig:"sec91Antecedentes" },
  { btn:"btn91SigAntecedentes",validar:null,                guardar:"guardarAntecedentes91",sig:"sec91Lineas"       },
  { btn:"btn91SigLineas",      validar:"validarLineas91",   guardar:"guardarLineas91",      sig:"sec91Muestreo"     },
  { btn:"btn91SigMuestreo",    validar:null,                guardar:"guardarMuestreo91",    sig:"sec91Documentos"   },
  { btn:"btn91SigDocumentos",  validar:null,                guardar:"guardarDocumentos91",  sig:"sec91Cronograma"   },
  { btn:"btn91SigCronograma",  validar:null,                guardar:"guardarCronograma91",  sig:"sec91Lista"        },
  { btn:"btn91SigLista",       validar:null,                guardar:"guardarLista91",       sig:"sec91Ejecucion"    },
  { btn:"btn91SigEjecucion",   validar:null,                guardar:"guardarEjecucion91",   sig:"sec91Hallazgos"    },
  { btn:"btn91SigHallazgos",   validar:null,                guardar:"guardarHallazgos91",   sig:"sec91Informe"      },
  { btn:"btn91SigInforme",     validar:null,                guardar:"guardarInforme91",     sig:"sec91Cierre"       },
  { btn:"btn91SigCierre",      validar:null,                guardar:"guardarCierre91",      sig:"sec91Expediente"   },
];

_BTN_NAV.forEach(({ btn, validar, guardar, sig }) => {
  document.getElementById(btn)?.addEventListener("click", () => {
    if (validar && typeof window[validar] === "function" && !window[validar]()) return;
    if (guardar && typeof window[guardar] === "function") window[guardar]();
    mostrarSeccion(sig);
  });
});

window.dispatchEvent(new CustomEvent("wizard-ec0091:ready"));

// ─── Bootstrap: auth, sync, cargar secciones ─────────────────────────────────
(async () => {
  if (!await authGuard()) return;
  await window.ec0091Sync?.init();

  // Poblar navbar
  try {
    const perfil = await getUserProfile();
    if (perfil) {
      if (typeof inyectarBranding === "function") inyectarBranding(perfil);
      document.getElementById("wiz-nav-nombre").textContent =
        [perfil.nombre, perfil.apellido].filter(Boolean).join(" ") || perfil.email;
    }
  } catch (_) {}

  // Cargar datos en formularios
  window.cargarDatos91?.();
  window.cargarObjetivo91?.();
  window.cargarAntecedentes91?.();
  window.cargarLineas91?.();
  window.cargarMuestreo91?.();
  window.cargarDocumentos91?.();
  window.cargarCronograma91?.();
  window.cargarLista91?.();
  window.cargarEjecucion91?.();
  window.cargarHallazgos91?.();
  window.cargarInforme91?.();
  window.cargarCierre91?.();
  window.cargarExpediente91?.();

  actualizarProgressBar();

  // Mostrar primer paso no completado
  const pasos = [
    { clave:"ec0091_datos_completo",        sec:"sec91Objetivo" },
    { clave:"ec0091_objetivo_completo",     sec:"sec91Antecedentes" },
    { clave:"ec0091_antecedentes_completo", sec:"sec91Lineas" },
    { clave:"ec0091_lineas_completo",       sec:"sec91Muestreo" },
    { clave:"ec0091_muestreo_completo",     sec:"sec91Documentos" },
    { clave:"ec0091_documentos_completo",   sec:"sec91Cronograma" },
    { clave:"ec0091_cronograma_completo",   sec:"sec91Lista" },
    { clave:"ec0091_lista_completo",        sec:"sec91Ejecucion" },
    { clave:"ec0091_ejecucion_completo",    sec:"sec91Hallazgos" },
    { clave:"ec0091_hallazgos_completo",    sec:"sec91Informe" },
    { clave:"ec0091_informe_completo",      sec:"sec91Cierre" },
    { clave:"ec0091_cierre_completo",       sec:"sec91Expediente" },
  ];
  if (localStorage.getItem("ec0091_datos_completo") !== "true") {
    mostrarSeccion("sec91Datos");
  } else {
    const siguiente = pasos.find(p => localStorage.getItem(p.clave) !== "true");
    mostrarSeccion(siguiente ? siguiente.sec : "sec91Expediente");
  }
})();
