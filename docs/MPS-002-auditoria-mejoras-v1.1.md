# MPS #002 — Auditoría Funcional de Mejoras v1.1

**Fecha:** 2026-07-17  
**Objetivo:** Validar el funcionamiento real de todas las mejoras implementadas desde MPS-001, sección por sección, con el usuario como evaluador manual. Si una mejora falla, se añade código de depuración y se dialoga hasta resolverlo.

**Modo:** Interactivo — el agente pregunta, el usuario responde, el agente depura si es necesario.

---

## Inventario de mejoras a auditar

| # | Commit | Mejora | Estado auditoría |
|---|---|---|---|
| A1 | 95c2a2b | Migración Node.js → Python (generación doc planeación) | ⬜ Pendiente |
| A2 | 7c05528 | Progreso real de generación via SSE | ⬜ Pendiente |
| A3 | c33a45f | Generar sección completa con IA — Expositiva, Demostrativa, Diálogo | ⬜ Pendiente |
| A4 | 09a61fa | Botón "Generar todo" al tope — Cierre, Evaluaciones, Materiales | ⬜ Pendiente |
| A5 | 1144cc0 | Undo (deshacer) para generación con IA | ⬜ Pendiente |
| A6 | c03e602 | Descarga individual de documentos EC0217 | ⬜ Pendiente |
| A7 | b1d4468 | Vista previa HTML del expediente antes de descargar | ⬜ Pendiente |
| A8 | d886f78 | Formatos × participantes en Materiales + columna Cantidad | ⬜ Pendiente |
| A9 | be56861 | Badge "desactualizado" cuando wizard cambia post-descarga | ⬜ Pendiente |
| B1 | — | Bug #6 — Límite 3 cursos con modal claro | ⬜ Pendiente |
| B2 | — | Bug #10 — Validación cruzada entre secciones (tiempos, porcentajes) | ⬜ Pendiente |

---

## Sprints de auditoría

### Sprint 1 — Generación de documentos (backend)
Auditar que el ZIP se genera sin invocar Node.js y que la barra de progreso SSE funciona.

- 1.1 ⬜ Verificar A1: generación completa sin errores (el usuario genera y descarga)
- 1.2 ⬜ Verificar A2: barra de progreso muestra documentos en tiempo real

### Sprint 2 — IA en secciones del wizard
Auditar el botón "Generar todo" en cada sección.

- 2.1 ⬜ Verificar A3a: Generar todo en Expositiva
- 2.2 ⬜ Verificar A3b: Generar todo en Demostrativa
- 2.3 ⬜ Verificar A3c: Generar todo en Diálogo/Discusión
- 2.4 ⬜ Verificar A4a: Generar todo en Cierre
- 2.5 ⬜ Verificar A4b: Generar todo en Evaluaciones
- 2.6 ⬜ Verificar A4c: Generar todo en Materiales

### Sprint 3 — Undo y descarga individual
- 3.1 ⬜ Verificar A5: botón Deshacer revierte última generación IA
- 3.2 ⬜ Verificar A6: descarga individual de cada documento funciona

### Sprint 4 — Vista previa y badge
- 4.1 ⬜ Verificar A7: vista previa HTML se abre y muestra datos correctos
- 4.2 ⬜ Verificar A9: badge aparece al modificar wizard post-descarga

### Sprint 5 — Materiales
- 5.1 ⬜ Verificar A8a: cálculo formatos × participantes en tabla de materiales
- 5.2 ⬜ Verificar A8b: columna Cantidad aparece en Lista de Requerimientos

### Sprint 6 — Bugs wizard
- 6.1 ⬜ Verificar B1: al intentar crear curso 4+, aparece modal claro
- 6.2 ⬜ Verificar B2: validación cruzada en Paso 16 (tiempos y porcentajes)

---

## Decisiones técnicas

- Orden de auditoría: de backend hacia frontend, de mayor a menor riesgo
- Si el usuario reporta fallo: se añade `console.log` / Python `logger.info` de diagnóstico, se hace commit, se re-prueba
- Una vez resuelto el fallo: se elimina el código de depuración y se hace commit de cierre
- Estado de cada ítem se actualiza en este documento a medida que se completa

---

## Registro de hallazgos

*(se llena durante la auditoría)*

| # | Hallazgo | Acción tomada | Commit |
|---|---|---|---|
| — | — | — | — |
