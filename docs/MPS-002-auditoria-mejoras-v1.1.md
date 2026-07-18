# MPS #002 — Auditoría Funcional de Mejoras v1.1

**Fecha:** 2026-07-17  
**Objetivo:** Validar el funcionamiento real de todas las mejoras implementadas desde MPS-001, sección por sección, con el usuario como evaluador manual. Si una mejora falla, se añade código de depuración y se dialoga hasta resolverlo.

**Modo:** Interactivo — el agente pregunta, el usuario responde, el agente depura si es necesario.

---

## Inventario de mejoras a auditar

| # | Commit | Mejora | Estado auditoría |
|---|---|---|---|
| A1 | 95c2a2b | Migración Node.js → Python (generación doc planeación) | ✅ OK |
| A2 | 7c05528 | Progreso real de generación via SSE | ✅ OK |
| A3 | c33a45f | Generar sección completa con IA — Expositiva, Demostrativa, Diálogo | ✅ OK |
| A4 | 09a61fa | Botón "Generar todo" al tope — Cierre, Evaluaciones, Materiales | ✅ OK (2 fixes) |
| A5 | 1144cc0 | Undo (deshacer) para generación con IA | ✅ OK + mejora UX |
| A6 | c03e602 | Descarga individual de documentos EC0217 | ✅ OK |
| A7 | b1d4468 | Vista previa HTML del expediente antes de descargar | ✅ OK (fix tiempos + tablas) |
| A8 | d886f78 | Formatos × participantes en Materiales + columna Cantidad | ✅ OK (rediseñado) |
| A9 | be56861 | Badge "desactualizado" cuando wizard cambia post-descarga | ✅ OK |
| B1 | — | Bug #6 — Límite 3 cursos con modal claro | ⏸ Pendiente (requiere cuenta con 3 planeaciones) |
| B2 | — | Bug #10 — Validación cruzada entre secciones (tiempos, porcentajes) | ✅ OK |

---

## Sprints de auditoría

### Sprint 1 — Generación de documentos (backend)
Auditar que el ZIP se genera sin invocar Node.js y que la barra de progreso SSE funciona.

- 1.1 ✅ Verificar A1: generación completa sin errores (el usuario genera y descarga)
- 1.2 ✅ Verificar A2: barra de progreso muestra documentos en tiempo real

### Sprint 2 — IA en secciones del wizard
Auditar el botón "Generar todo" en cada sección.

- 2.1 ✅ Verificar A3a: Generar todo en Expositiva
- 2.2 ✅ Verificar A3b: Generar todo en Demostrativa
- 2.3 ✅ Verificar A3c: Generar todo en Diálogo/Discusión
- 2.4 ✅ Verificar A4a: Generar todo en Cierre (fix: faltaba descripción general — commit 3f22403)
- 2.5 ✅ Verificar A4b: Generar todo en Evaluaciones
- 2.6 ✅ Verificar A4c: Generar todo en Materiales (fix: btnGenerarClasificacion sin listener — commit 5d7c8f4)

### Sprint 3 — Undo y descarga individual
- 3.1 ✅ Verificar A5: botón Deshacer revierte última generación IA (mejora: undo inline bajo cada textarea — commit 0b6a5db)
- 3.2 ✅ Verificar A6: descarga individual de cada documento funciona

### Sprint 4 — Vista previa y badge
- 4.1 ✅ Verificar A7: vista previa HTML se abre y muestra datos correctos (2 fixes — commit 36fe437)
- 4.2 ✅ Verificar A9: badge aparece al modificar wizard post-descarga

### Sprint 5 — Materiales
- 5.1 ✅ Verificar A8: formatos × participantes se inyectan en materiales didácticos post-clasificación IA (commit 9ce8b60)
- 5.2 N/A Tabla separada eliminada — ya no es necesaria

### Sprint 6 — Bugs wizard
- 6.1 ⏸ Verificar B1: al intentar crear curso 4+, aparece modal claro (pendiente — requiere cuenta con 3 planeaciones)
- 6.2 ✅ Verificar B2: validación cruzada en Paso 16 — validaciones existen, estados inválidos son inalcanzables por diseño del wizard

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
| H1 | `index-init.js:91` — addEventListener en null | Guarda nula + early return | aec47a2 |
| H2 | `preview-html.js:26` — `_lista()` recibe string de textarea | split("\n") antes de mapear | aec47a2 |
| H3 | `btnGenerarClasificacion` sin listener — botón inerte | addEventListener en initIAMateriales | 5d7c8f4 |
| H4 | `_generarTodoCierre` no generaba descripción general | Añadir `generarDescripcionGeneralIA` al batch | 3f22403 |
| H5 | Undo bar fija abajo — UI desconectada del campo | Botón inline bajo cada textarea via closest(.form-group) | 0b6a5db / a09e1b9 |
| H6 | Preview tiempos mostraba "Bloque" — `b.nombre` inexistente | Corregir a `b.seccion` | 36fe437 |
| H7 | Preview evaluaciones de corrido | `_f(label, val, pre=true)` convierte \n a \<br\> | a71bd2c |
| H8 | Materiales didácticos duplicaban formatos de evaluación | Eliminar del prompt + filtro anti-duplicados en frontend | dfe2afc / 7348b43 |
| H9 | `window.sbeTiemposCurso` nunca inicializado — Paso 15 vacío | initStepTiempos() inicializa con estructura default 120min | cde058a |
| H10 | Meta de tiempos hardcodeada a 120 independiente de Paso 1 | `_getDuracionRequerida()` lee `ec0217_datos.duracion` | 229b023 |
| H11 | Actividades podían quedar en 0 minutos | min="1" + blur enforcer + validación en botón Siguiente | ff39061 |
