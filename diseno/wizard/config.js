// ─── wizard/config.js — Constantes del wizard EC0217.01 ──────────────────────

export const BACKEND_URL = "https://smartbuilderec.onrender.com";

/** Orden oficial de navegación del wizard (16 pasos + formatos) */
export const FLUJO_SECCIONES = [
  "seccionDatos",
  "seccionObjetivos",
  "seccionBeneficios",
  "seccionTemario",

  "seccionIntegracion",
  "seccionPreguntas",
  "seccionReglas",
  "seccionContrato",

  "seccionExpositiva",
  "seccionDemostrativa",
  "seccionEnergizante",
  "seccionDialogo",

  "seccionCierre",

  "seccionEvaluaciones",

  "seccionTiempos",
  "seccionMateriales",

  "seccionFormatos",
];

/** Mapeo id de nav-item → id de sección visible */
export const NAV_A_SECCION = {
  "nav-datos":        "seccionDatos",
  "nav-objetivos":    "seccionObjetivos",
  "nav-beneficios":   "seccionBeneficios",
  "nav-temario":      "seccionTemario",
  "nav-integracion":  "seccionIntegracion",
  "nav-preguntas":    "seccionPreguntas",
  "nav-reglas":       "seccionReglas",
  "nav-contrato":     "seccionContrato",
  "nav-expositiva":   "seccionExpositiva",
  "nav-demostrativa": "seccionDemostrativa",
  "nav-energizante":  "seccionEnergizante",
  "nav-dialogo":      "seccionDialogo",
  "nav-cierre":       "seccionCierre",
  "nav-evaluaciones": "seccionEvaluaciones",
  "nav-tiempos":      "seccionTiempos",
  "nav-materiales":   "seccionMateriales",
  "nav-formatos":     "seccionFormatos",
};

// ─── Restricciones normativas EC0217.01 ──────────────────────────────────────

/** Duración mínima del curso en minutos exigida por la norma */
export const DURACION_MINIMA_MIN = 120;

/** Las 6 categorías de materiales / requerimientos del EC0217 */
export const CATEGORIAS_MATERIALES = [
  "instalaciones",
  "equipo",
  "materialesDidacticos",
  "humanos",
  "otros",
  "seguridad",
];

/** Técnicas cuyo material se captura individualmente */
export const TECNICAS_MATERIALES = [
  "integracion",
  "expositiva",
  "demostrativa",
  "energizante",
  "dialogo",
];
