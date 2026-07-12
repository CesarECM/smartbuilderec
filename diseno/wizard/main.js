// ─── wizard/main.js — Entry point ES Module del wizard EC0217 ────────────────
// Corre como <script type="module"> — diferido por el navegador, ejecuta
// después de parsear todo el HTML y después de los scripts clásicos.
//
// Durante la transición (Sprints 7→11) coexiste con app.js (script clásico).
// A medida que cada módulo de step se extrae de app.js, se importa aquí y
// se elimina la función correspondiente de app.js.

import {
  state,
  setState,
  getSeccionCompleta,
  setSeccionCompleta,
  getDatos,
  setDatos,
} from "./state.js";

import {
  BACKEND_URL,
  FLUJO_SECCIONES,
  NAV_A_SECCION,
  DURACION_MINIMA_MIN,
  CATEGORIAS_MATERIALES,
  TECNICAS_MATERIALES,
} from "./config.js";

import { llamarIA, llamarIAStream } from "./api.js";

// ─── Exponer API de módulos en window.* para compatibilidad con scripts clásicos
// y con handlers inline del HTML durante la transición.
window.wizardState  = { state, setState, getSeccionCompleta, setSeccionCompleta, getDatos, setDatos };
window.wizardConfig = { BACKEND_URL, FLUJO_SECCIONES, NAV_A_SECCION, DURACION_MINIMA_MIN, CATEGORIAS_MATERIALES, TECNICAS_MATERIALES };
window.wizardAPI    = { llamarIA, llamarIAStream };

// Señal para que otros scripts/tests detecten que la capa modular está lista
window.dispatchEvent(new CustomEvent("wizard:modules-ready"));
