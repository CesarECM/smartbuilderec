# MPS #005 — Brechas en instrumentos de evaluación EC0217.01 y EC0301
**Fecha:** 2026-07-20
**Modo:** A (Planificación) → pendiente de aprobación por sprint
**Objetivo:** Cerrar las 10 brechas detectadas al comparar las fichas oficiales EC0217.01 (v7.0, 2021) y EC0301 (v6.0, 2012) contra los documentos generados por el wizard y el ZIP de exportación.

---

## Contexto del análisis

Se compararon:
- **Ficha EC0217.01 v7.0** — Elemento 3 de 3: "Evaluar la sesión/curso" (desempeños + productos + glosario).
- **Ficha EC0301 v6.0** — Elemento 2 de 3: "Diseñar instrumentos para la evaluación" y Elemento 3 de 3: "Diseñar manuales del curso".
- Código fuente: `doc_evaluaciones.py`, `doc_instructor.py`, `doc_planeacion_tablas.py`, `doc_planeacion.py`, `doc_helpers.py`, `doc_generales.py`, `step-evaluaciones.js`, `ia-evaluacion.js`, prompts `evaluacion_*.txt`.

Los documentos actualmente en el ZIP son:
1. Evaluación Diagnóstica ✅
2. Evaluación Formativa (cotejo o guía) ✅
3. Evaluación Sumativa ✅
4. Evaluación de Reacción ✅
5. Lista de Asistencia ✅
6. Contrato de Aprendizaje ✅
7. Lista de Verificación de Requerimientos ✅
8. Manual del Instructor (solo claves) ⚠️
9. Presentación PPTX ✅
10. Planeación DOCX (carta descriptiva) ✅

---

## Inventario de brechas

| ID | Descripción | Estándar | Severidad |
|----|-------------|----------|-----------|
| G1 | Informe Final del Curso ausente | EC0217.01 E3 P2 | 🔴 |
| G2 | Manual del Participante ausente | EC0301 E3 P1-5 | 🔴 |
| G3 | Manual del Instructor incompleto (solo claves, falta 80%) | EC0301 E3 P6 | 🔴 |
| G4 | Clave de respuestas sin puntaje total esperado | EC0301 E2 P4 | 🟠 |
| G5 | Clave formativa sin tabla de ponderación por criterio | EC0301 E2 P4 | 🟠 |
| G6 | Tipo de instrumento incorrecto en carta descriptiva | EC0217.01 E1 P2 | 🟠 |
| G7 | Doble bloque instrucciones/tiempo en diagnóstica y sumativa | EC0217.01 E3 D2-3 | 🟠 |
| G8 | PPTX: slide diagnóstica muestra reactivos en lugar de instrucciones | EC0217.01 E2 | 🟡 |
| G9 | Valor por reactivo no indicado inline en instrumento del participante | EC0301 E2 P3 | 🟡 |
| G10 | Campo `descripcionGeneral` en evaluaciones es dead code | — | 🟡 |

---

## Riesgos normativos o técnicos

- **R1 (Alto):** G1, G2, G3 son documentos que el evaluador CONOCER puede pedir físicamente. Su ausencia puede hacer que el instructor no pase la certificación aunque el curso haya sido bueno.
- **R2 (Medio):** G3 implica extender `doc_instructor.py` significativamente. Actualmente tiene ~70 líneas; la versión completa puede llegar a 200+. Vigilar límite 300 líneas.
- **R3 (Medio):** G2 (Manual del Participante) requiere contenido que el wizard NO captura hoy (desarrollo de temas, fuentes). Hay dos posibles enfoques: (a) template con placeholders para llenado manual, o (b) nuevo paso del wizard. Decisión con alto impacto arquitectónico.
- **R4 (Bajo):** G6 afecta `doc_planeacion_tablas.py`. Al cambiar el texto de la columna "Instrumento", puede afectar visualmente la carta descriptiva existente. Retrocompatibilidad con planeaciones guardadas.
- **R5 (Bajo):** G7: al eliminar el bloque hardcodeado de instrucciones, el documento diagnóstica/sumativa cambia de estructura. Verificar que `instXxxHeader` contenga información suficiente en todos los casos.

---

## Backlog priorizado

> **Regla de trabajo:** Al iniciar cada sprint en MODO B, leer la sección "Preguntas previas" de ese sprint. Si alguna está sin respuesta, formularlas al usuario ANTES de implementar cualquier línea de código. Solo continuar cuando el usuario las haya respondido.

---

### Sprint 1 — Fixes en documentos existentes (G4, G5, G6, G7, G8, G9, G10)

*Riesgo: Bajo | Sin preguntas previas — bugs claros*
*Archivos: `doc_instructor.py`, `doc_evaluaciones.py`, `doc_planeacion.py`, `doc_planeacion_tablas.py`, `step-evaluaciones.js`*

**Preguntas previas:** Ninguna. Estos son bugs con solución unívoca.

- **1.1** ⬜ `doc_instructor.py` — Agregar fila de TOTAL a `_tabla_clave_opcion_multiple`: última fila con `"TOTAL"` | `""` | `"100%"`. *(G4)*
- **1.2** ⬜ `doc_instructor.py` — Para la formativa, reemplazar `doc.add_paragraph(clave_f)` por una tabla de criterios con columnas `"Criterio" | "Ponderación"`. Parsear `clave_f` por líneas numeradas. Agregar fila final `"Mínimo aprobatorio"` | `"70%"`. *(G5)*
- **1.3** ⬜ `doc_planeacion_tablas.py` — En `_tabla_evaluaciones`, reemplazar `_inst(ev.get('instFormativa'), ...)` por la cadena humana del tipo: si `ev.get('tipoInstrumentoFormativa') == 'lista_cotejo'` → `"Lista de cotejo"`, si `== 'guia_observacion'` → `"Guía de observación"`, else usar el fallback actual. Para diagnóstica/sumativa, usar siempre `"Cuestionario de opción múltiple"` como fallback. *(G6)*
- **1.4** ⬜ `doc_evaluaciones.py` — En `generar_evaluacion_diagnostica` y `generar_evaluacion_sumativa`: eliminar el sub-ítem `("Tiempo para desarrollar la actividad:", "Considerar el tiempo establecido en el documento de planeación.")` del bloque hardcodeado. El tiempo ya vendrá en `instXxxHeader`. *(G7)*
- **1.5** ⬜ `doc_planeacion.py` — Cambiar slide "Evaluación Diagnóstica": usar `evaluaciones.instDiagnosticaHeader or evaluaciones.instDiagnostica or ""` para mostrar instrucciones, no reactivos. *(G8)*
- **1.6** ⬜ `step-evaluaciones.js` — Eliminar `descripcionGeneral: g("descripcionGeneralEvaluacion")` de `recolectarEvaluaciones()` y quitar `descripcionGeneral` de `cargarEvaluaciones()`. Verificar que `EvaluacionesInfo` en `wizard_models.py` siga teniendo el campo (para retrocompatibilidad con planeaciones guardadas, solo omitir en la recolección nueva). *(G10)*
- **1.7** ⬜ Verificar que G9 (valor inline por reactivo) queda implícitamente cubierto por la nota `"5 reactivos × 20% = 100%"` en header + la tabla de claves en el manual instructor. Si se considera insuficiente, agregar `"(20 pts)"` inline al final de cada línea de reactivo en `generar_evaluacion_diagnostica` / `generar_evaluacion_sumativa`. Tomar decisión y documentar.

**Criterio de terminado Sprint 1:** Las tablas de claves tienen fila TOTAL. La formativa tiene tabla de criterios con ponderación. La carta descriptiva muestra el tipo de instrumento correcto. No hay bloque de tiempo duplicado. El PPTX muestra instrucciones en el slide diagnóstica. Dead code eliminado.

---

### Sprint 2 — Manual del Instructor completo (G3)

*Riesgo: Medio | Archivos: `doc_instructor.py` (extender o dividir)*

**Preguntas previas — formular al usuario ANTES de implementar:**

> **P2.1** El manual del instructor según EC0301 debe incluir la carta descriptiva completa integrada. ¿La integramos como referencia/hipervínculo al doc de planeación, o la reproducimos completa dentro del mismo archivo DOCX del manual del instructor?
>
> **P2.2** EC0301 exige "sugerencias para desarrollar los temas" en el manual del instructor. ¿Quieres que la IA genere estas sugerencias automáticamente (nuevo prompt), o que el instructor las llene manualmente (campos en blanco en el template)?
>
> **P2.3** "Requerimientos del lugar de capacitación" ya están en la lista de verificación. ¿Los duplicamos en el manual del instructor (simplificado) o solo hacemos referencia a ese documento?
>
> **P2.4** Las "Fuentes de información" en EC0301 requieren: autor, año, título, editorial/URL, país. El wizard captura referencias bibliográficas en el paso de Cierre. ¿Las tomamos de ahí para el manual del instructor?
>
> **P2.5** Si `doc_instructor.py` supera 300 líneas al agregar todo esto, ¿dividimos en `doc_instructor_claves.py` + `doc_instructor_manuales.py`, o en `doc_instructor.py` + `doc_instructor_tpl.py` (templates)?

Una vez respondidas P2.1–P2.5, definir subsprints:

- **2.1** ⬜ Actualizar `_titulo` del manual: "MANUAL DEL INSTRUCTOR" con subtítulo según EC0301.
- **2.2** ⬜ Agregar sección "Índice" al inicio del documento.
- **2.3** ⬜ Agregar sección "Introducción" (propósito del manual, estructura del curso, modalidad).
- **2.4** ⬜ [Según P2.1] Integrar o referenciar la carta descriptiva.
- **2.5** ⬜ [Según P2.3] Agregar requerimientos del lugar de capacitación.
- **2.6** ⬜ [Según P2.2] Agregar sugerencias para desarrollar temas (IA o placeholders).
- **2.7** ⬜ [Según P2.4] Agregar fuentes de información del wizard (referencias bibliográficas del cierre).
- **2.8** ⬜ [Según P2.5] Dividir en módulos si supera 300 líneas.
- **2.9** ⬜ Verificar que las claves existentes (Sprints 1.1 y 1.2) siguen en su lugar correcto.

**Criterio de terminado Sprint 2:** El documento Manual del Instructor contiene: índice, introducción, carta descriptiva o referencia, requerimientos, sugerencias de desarrollo, claves de evaluación, fuentes. Cumple EC0301 Elemento 3 PRODUCTO 6.

---

### Sprint 3 — Manual del Participante (G2)

*Riesgo: Alto (decisión arquitectónica) | Archivos: nuevo `doc_manual_participante.py` + posiblemente nuevo paso wizard*

**Preguntas previas — formular al usuario ANTES de implementar:**

> **P3.1** El Manual del Participante requiere "temas desarrollados" (contenido del curso). El wizard captura el temario (nombres de temas) pero NO el contenido de cada tema. ¿Adoptamos el enfoque (a) o (b)?
> - **(a) Template con placeholders:** Se genera un DOCX con estructura correcta y secciones en blanco donde el instructor escribe el contenido. El instructor lo edita manualmente en Word.
> - **(b) Nuevo paso wizard:** Agregar un paso 17 donde el instructor escribe o genera con IA el contenido de cada tema (uno por unidad). Implica nueva ruta de wizard + storage.
>
> **P3.2** "Presentación del manual" según EC0301 incluye: bienvenida al participante, recomendaciones de uso, descripción de la organización del manual. ¿Quieres que la IA genere este texto basándose en el nombre del curso y los objetivos?
>
> **P3.3** "Introducción" del manual del participante requiere: resumen de temas, beneficio que el curso aportará, enfoque didáctico. ¿La IA la genera automáticamente o el instructor la escribe?
>
> **P3.4** Las "fuentes de información" del participante requieren todos los campos bibliográficos. El wizard tiene el campo de referencias en Cierre. ¿Usamos esas referencias o agregamos un campo específico para fuentes del manual?
>
> **P3.5** "Incluye una forma de evaluación por tema" — EC0301 pide que cada tema en el manual del participante tenga su forma de evaluación. ¿Cómo lo manejamos? ¿Texto genérico o conectado con las evaluaciones del paso 14?

Una vez respondidas P3.1–P3.5, definir subsprints detallados.

**Criterio de terminado Sprint 3:** El ZIP incluye un Manual del Participante conforme a EC0301 Elemento 3 PRODUCTOS 1–5. Pasa la revisión de evaluación CONOCER.

---

### Sprint 4 — Informe Final del Curso (G1)

*Riesgo: Alto | Archivos: nuevo `doc_informe_final.py` + posiblemente extensión del wizard o formulario post-curso*

**Preguntas previas — formular al usuario ANTES de implementar:**

> **P4.1** El Informe Final es un documento POST-CURSO: el instructor lo llena con datos REALES una vez que el curso terminó (resultados de evaluaciones, comentarios, contingencias). Hay dos enfoques:
> - **(a) Template en blanco:** Se genera como parte del ZIP, con estructura conforme al EC0217.01, pero con campos en blanco para que el instructor llene en Word después del curso.
> - **(b) Módulo post-curso en la plataforma:** El instructor vuelve a la plataforma después del curso, llena los campos en un nuevo paso/formulario, y genera el informe desde ahí.
> ¿Cuál eliges?
>
> **P4.2** EC0217.01 exige que el Informe Final "Incluye los gráficos de las evaluaciones de aprendizaje". Si elegimos (b), ¿generamos gráficas automáticas de pastel/barra con los resultados de evaluaciones? Si elegimos (a), ¿incluimos un espacio en blanco tipo "pegar gráfica aquí"?
>
> **P4.3** "Contiene como anexo el registro de asistencia al curso" — la Lista de Asistencia ya se genera. ¿Se integra físicamente en el mismo DOCX del informe final, o se referencia como documento separado del ZIP?
>
> **P4.4** "Incluye el apartado del plan de seguimiento a los participantes/capacitandos en la aplicación de lo aprendido" — ¿Quieres que el wizard captura este plan (ej. en el paso de Cierre, campo compromisos), o es un campo libre que el instructor llena después?

Una vez respondidas P4.1–P4.4, definir subsprints detallados.

**Criterio de terminado Sprint 4:** Existe un documento de Informe Final conforme a EC0217.01 Elemento 3 PRODUCTO 2. El evaluador CONOCER puede recibirlo como parte del expediente.

---

### Sprint 5 — Verificación y cierre

*Riesgo: Bajo*

- **5.1** ⬜ Smoke test Sprint 1: Abrir manual instructor → tabla de claves tiene fila TOTAL; formativa tiene tabla de criterios; no hay tiempo duplicado en diagnóstica.
- **5.2** ⬜ Smoke test Sprint 1: Carta descriptiva → columna instrumento muestra "Cuestionario de opción múltiple" y "Lista de cotejo" / "Guía de observación".
- **5.3** ⬜ Smoke test Sprint 1: PPTX → slide diagnóstica muestra instrucciones, no reactivos.
- **5.4** ⬜ Smoke test Sprint 2: Manual del instructor → contiene índice, introducción, claves, fuentes.
- **5.5** ⬜ Smoke test Sprint 3: ZIP incluye Manual del Participante con estructura EC0301 completa.
- **5.6** ⬜ Smoke test Sprint 4: ZIP o módulo post-curso genera Informe Final con todos los campos EC0217.01.
- **5.7** ⬜ Test retrocompatibilidad: importar JSON de planeación antigua → no rompe, campos nuevos muestran placeholders o vacíos.
- **5.8** ⬜ Actualizar ARCHITECTURE.md con los nuevos documentos generados.

---

## Deferred (MPS futuro)

- Encuesta de satisfacción: análisis de si la escala actual (Excelente/Bueno/Regular/Malo) cumple con EC0301 o requiere ajuste.
- Reactivos inline con valor individual (G9) — evaluar con usuario si el nivel actual es aceptable.
- Automatización del Informe Final (si se elige enfoque b en P4.1), incluyendo gráficas de evaluaciones.
