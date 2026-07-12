// ─── app.js — DEPRECADO (Sprint 11 MPS-001) ──────────────────────────────────
// Toda la lógica del wizard EC0217 ha sido migrada a módulos ES en wizard/:
//
//   wizard/main.js          — entry point (carga todos los módulos)
//   wizard/state.js         — estado global del wizard
//   wizard/config.js        — constantes EC0217.01
//   wizard/api.js           — capa de comunicación con el backend
//   wizard/navigation.js    — mostrarSeccionPrincipal, desbloquear
//   wizard/ui-sidebar.js    — sidebar colapsable, hamburguesa
//   wizard/ui-helpers.js    — progress bar, focus mode, toasts, copiar
//   wizard/ui-sync.js       — indicadores de sincronización
//   wizard/ui-writing.js    — efecto typewriter para IA
//   wizard/step-datos.js    — Paso 1: Datos del Curso
//   wizard/step-objetivos.js  — Paso 2: Objetivos de Aprendizaje
//   wizard/step-beneficios.js — Paso 3: Beneficios
//   wizard/step-temario.js    — Paso 4: Temario
//   wizard/step-encuadre.js   — Pasos 5-8: Encuadre
//   wizard/step-tecnicas.js   — Pasos 5/11: Técnicas Grupales
//   wizard/step-detalle-tecnicas.js — Detalle de técnicas grupales
//   wizard/step-expositiva.js — Paso 9: Técnica Expositiva
//   wizard/step-demostrativa.js — Paso 10: Técnica Demostrativa
//   wizard/step-dialogo.js    — Paso 11: Técnica Diálogo
//   wizard/step-cierre.js     — Paso 12: Cierre
//   wizard/step-evaluaciones.js — Paso 13: Evaluaciones
//   wizard/step-tiempos.js    — Paso 14: Tiempos
//   wizard/step-materiales.js — Paso 15: Materiales
//   wizard/step-formatos.js   — Paso 16: Formatos y Descarga
//   wizard/ia-objetivos.js    — IA: objetivos de aprendizaje
//   wizard/ia-temario.js      — IA: temario
//   wizard/ia-encuadre.js     — IA: preguntas de encuadre
//   wizard/ia-tecnicas.js     — IA: técnicas expositiva y demostrativa
//   wizard/ia-dialogo.js      — IA: técnica diálogo
//   wizard/ia-cierre.js       — IA: cierre y descripción general
//   wizard/ia-resumen.js      — IA: resumen y compromisos
//   wizard/ia-evaluacion.js   — IA: evaluaciones y formativa
//   wizard/ia-materiales.js   — IA: materiales clasificados
//   wizard/export.js          — descarga del paquete final ZIP
//   wizard/validators.js      — validaciones normativas EC0217.01
//   wizard/tecnicas-data.js   — catálogo de técnicas rompehielos / energizantes
