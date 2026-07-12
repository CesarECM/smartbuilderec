// ─── wizard/validators.js — Validaciones normativas EC0217.01 ─────────────────
// Valida que los datos del wizard cumplan la norma antes de generar documentos.

import { DURACION_MINIMA_MIN, CATEGORIAS_MATERIALES } from "./config.js";

// Verbos de cada dominio de Bloom aceptados en EC0217.01
const VERBOS_COGNITIVOS = [
  "identificar","reconocer","recordar","nombrar","listar","definir",
  "describir","explicar","clasificar","comparar","resumir","interpretar",
  "aplicar","demostrar","resolver","calcular","analizar","diferenciar",
  "examinar","evaluar","argumentar","justificar","crear","diseñar","elaborar",
];

const VERBOS_PSICOMOTRICES = [
  "realizar","ejecutar","operar","construir","montar","ensamblar",
  "manejar","utilizar","practicar","demostrar","manipular","preparar",
  "instalar","aplicar","producir","elaborar","reparar","ajustar",
];

const VERBOS_AFECTIVOS = [
  "valorar","apreciar","respetar","aceptar","comprometerse","adoptar",
  "asumir","demostrar","manifestar","participar","colaborar","integrar",
  "defender","promover","internalizar","reflexionar","sensibilizar",
];

/**
 * Verifica que la suma total de tiempos cumpla:
 *  - Sea exactamente igual a la duración del curso
 *  - Sea al menos DURACION_MINIMA_MIN minutos
 *
 * @param {Array}  tiemposData   — array de bloques (formato ec0217_tiempos)
 * @param {number} duracionCurso — duración declarada del curso en minutos
 * @returns {{ ok: boolean, errores: string[] }}
 */
export function validarTiempos(tiemposData = [], duracionCurso = 0) {
  const errores = [];
  const total = tiemposData.reduce((acc, bloque) =>
    acc + (bloque.filas || []).reduce((s, f) => s + (parseInt(f.tiempo, 10) || 0), 0), 0);

  if (total < DURACION_MINIMA_MIN) {
    errores.push(`La duración total (${total} min) es menor al mínimo normativo de ${DURACION_MINIMA_MIN} min para EC0217.01.`);
  }
  if (duracionCurso > 0 && total !== duracionCurso) {
    errores.push(`La distribución de tiempos suma ${total} min pero la duración del curso es ${duracionCurso} min.`);
  }

  return { ok: errores.length === 0, errores };
}

/**
 * Verifica que los objetivos usen verbos reconocidos para cada dominio de Bloom.
 * No bloquea si el verbo no se reconoce (advertencia, no error duro).
 *
 * @param {{ cognitiva: string, psicomotriz: string, afectiva: string }} objetivos
 * @returns {{ ok: boolean, advertencias: string[] }}
 */
export function validarTaxonomia(objetivos = {}) {
  const advertencias = [];

  function _primerVerbo(texto) {
    return (texto || "").trim().toLowerCase().split(/\s+/)[0];
  }

  const verboCog  = _primerVerbo(objetivos.cognitiva);
  const verboPsi  = _primerVerbo(objetivos.psicomotriz);
  const verboAfe  = _primerVerbo(objetivos.afectiva);

  if (verboCog && !VERBOS_COGNITIVOS.includes(verboCog)) {
    advertencias.push(`El objetivo cognitivo empieza con "${verboCog}", que no es un verbo de Bloom cognitivo habitual.`);
  }
  if (verboPsi && !VERBOS_PSICOMOTRICES.includes(verboPsi)) {
    advertencias.push(`El objetivo psicomotriz empieza con "${verboPsi}", que no es un verbo psicomotriz habitual.`);
  }
  if (verboAfe && !VERBOS_AFECTIVOS.includes(verboAfe)) {
    advertencias.push(`El objetivo afectivo empieza con "${verboAfe}", que no es un verbo afectivo habitual.`);
  }

  return { ok: advertencias.length === 0, advertencias };
}

/**
 * Verifica que el objeto de materiales tenga al menos una categoría con texto.
 *
 * @param {object} materiales — objeto con claves de CATEGORIAS_MATERIALES
 * @returns {{ ok: boolean, errores: string[] }}
 */
export function validarCategoriasMateriales(materiales = {}) {
  const errores = [];
  const tieneAlguna = CATEGORIAS_MATERIALES.some(cat => {
    const val = materiales[cat];
    return typeof val === "string" && val.trim().length > 0;
  });
  if (!tieneAlguna) {
    errores.push("Debes capturar al menos una categoría de materiales y requerimientos.");
  }
  return { ok: errores.length === 0, errores };
}
