# MPS #004 — Mejoras de cumplimiento EC0217.01 y EC0301
**Fecha:** 2026-07-20
**Modo:** A (Planificación) → listo para ejecución en MODO B
**Objetivo:** Aplicar al wizard existente las mejoras de cumplimiento detectadas al comparar las fichas oficiales del EC0217.01 (v7.0, 2021) y EC0301 contra el sistema actual.

---

## Arquitectura aprobada & Decisiones técnicas

| # | Mejora | Decisión |
|---|--------|----------|
| #1 | Dominio relacional-social | Se integra en el objetivo afectivo. Solo cambia la label a "Objetivo Afectivo / Relacional-Social". Sin nuevo paso ni campo. |
| #2 | Perfil + Requisitos de ingreso | Campo único renombrado. Template del textarea restructurado en dos secciones. Nuevo botón IA → `ia-perfil.js`. Prompt cubre ambos EC. |
| #3 | Lista de verificación + salud/seguridad | Solo backend: agregar sección de medidas de salud/seguridad/higiene/protección civil en 2 templates DOCX (lista independiente + doc de planeación). |
| #4 | Nuevos inputs en instrumentos de evaluación | Por cada instrumento (diagnóstica, formativa, sumativa): Input 1 = instrucciones/propósito/alcance/tiempo (va al participante); Input 2 = clave de respuestas (solo manual instructor). Formativa calcula porcentaje dinámicamente según n criterios. Diagnóstica y sumativa: nota hardcodeada 5 × 20% = 100%. |
| #5 | Encuesta de satisfacción | Ya cubierta. Sin cambios. |
| #6–8 | Manuales + Informe Final | Deferred a MPS futuro. |
| #9–10 | Checker objetivos + congruencia | Ya resueltos. Sin cambios. |

### Patrón de botón IA (reutilizar)
Seguir el patrón de `ia-beneficios.js`: el botón llama al backend, recibe texto, lo inyecta en el textarea correspondiente. Aplicar a `ia-perfil.js`.

### Separación instrumento participante vs. manual instructor
- **Input 0** (`instXxx`) → reactivos → va al participante
- **Input 1** (`instXxxHeader`) → instrucciones/propósito/alcance/tiempo → va al participante (encabezado del instrumento)
- **Input 2** (`instXxxClave`) → clave de respuestas → SOLO manual del instructor

### Cálculo dinámico formativa
La IA cuenta los criterios generados y retorna `n` y `porcentaje = 100/n`. El frontend renderiza nota dinámica. El backend retorna estructura JSON con campos separados: `reactivos`, `header`, `clave`, `n_criterios`, `pct_por_criterio`.

---

## Riesgos normativos o técnicos

- **R1 (Bajo):** El campo perfil restructurado debe mantener retrocompatibilidad con planeaciones guardadas en localStorage (JSON existente tiene key `perfil` como string plano). Al cargar, si el valor no contiene el nuevo template, mostrarlo tal cual sin sobrescribir.
- **R2 (Medio):** Los nuevos campos de evaluaciones (`instXxxHeader`, `instXxxClave`) no existían en localStorage previo. Al cargar planeaciones antiguas, deben quedar vacíos sin error.
- **R3 (Bajo):** La clave de respuestas NO debe aparecer en el DOCX del instrumento del participante. Verificar en backend que el template del instrumento no incluye el campo `instXxxClave`.
- **R4 (Bajo):** El límite de 300 líneas/archivo. `step-evaluaciones.js` tiene 224 líneas actualmente. Al agregar 6 nuevos inputs (2 × 3 instrumentos) el template crecerá. Vigilar y dividir si supera 300.

---

## Backlog priorizado

### Sprint 1 — Labels y campo perfil (Paso 1 y 2 del wizard)
*Riesgo: Bajo | Archivos: `step-datos.js`, `step-objetivos.js`, `ia-perfil.js`, `main.js`*

- **1.1** ⬜ Cambiar label en template de `step-objetivos.js`: "Afectiva" → "Afectivo / Relacional-Social"
- **1.2** ⬜ Renombrar label del campo `perfil` en `step-datos.js`: "Perfil del participante" → "Perfil del participante / Requisitos de ingreso"
- **1.3** ⬜ Restructurar el placeholder/template del textarea `perfil` con dos secciones: `Perfil del participante:` y `Requisitos de ingreso:`
- **1.4** ⬜ Agregar botón "✨ Completar con IA" junto al campo `perfil` en el template HTML de `step-datos.js`
- **1.5** ⬜ Crear `ia-perfil.js`: función `initIAPerfil()` + `addEventListener` en `btnGenerarPerfil`. Llama al backend con `nombreCurso` como referencia. Prompt cubre perfil del participante (EC0217.01) y requisitos de ingreso (EC0301).
- **1.6** ⬜ Importar y llamar `initIAPerfil()` en `main.js`
- **1.7** ⬜ Verificar que `recolectarPayload` sigue leyendo `perfil` correctamente (el key en localStorage no cambia, solo la UI)

**Criterio de terminado Sprint 1:** El campo muestra nueva label y template, el botón IA genera contenido con las dos secciones, el valor se guarda/carga sin romper planeaciones existentes.

---

### Sprint 2 — Nuevos inputs en evaluaciones: HTML y estado (Paso 14)
*Riesgo: Medio | Archivos: `step-evaluaciones.js`*

> Vigilar límite 300 líneas. Si el template crece demasiado, extraer el HTML a `step-evaluaciones-tpl.js`.

- **2.1** ⬜ Agregar bajo `instDiagnostica`: label + textarea `instDiagnosticaHeader` (instrucciones/propósito/alcance/tiempo) + nota hardcodeada "5 reactivos × 20% = 100%"
- **2.2** ⬜ Agregar bajo `instDiagnosticaHeader`: label + textarea `instDiagnosticaClave` (formato: "1. A  2. B  3. C  4. D  5. E")
- **2.3** ⬜ Agregar bajo `instFormativa`: label + textarea `instFormativaHeader` + nota dinámica (placeholder: se llenará al generar)
- **2.4** ⬜ Agregar bajo `instFormativaHeader`: label + textarea `instFormativaClave`
- **2.5** ⬜ Agregar bajo `instSumativa`: label + textarea `instSumativaHeader` + nota hardcodeada "5 reactivos × 20% = 100%"
- **2.6** ⬜ Agregar bajo `instSumativaHeader`: label + textarea `instSumativaClave`
- **2.7** ⬜ Actualizar `recolectarEvaluaciones()` para incluir los 6 nuevos campos + `notaFormativa` (n_criterios y pct)
- **2.8** ⬜ Actualizar `cargarEvaluaciones()` para cargar los 6 nuevos campos (valores vacíos si planeación antigua)
- **2.9** ⬜ Actualizar `guardarEvaluacionesTemporal()` (se hace automáticamente si recolectarEvaluaciones ya los incluye — verificar)

**Criterio de terminado Sprint 2:** Los 6 nuevos textareas aparecen en el UI, se guardan y cargan correctamente, no rompen planeaciones previas.

---

### Sprint 3 — Prompts IA de evaluaciones (backend Python)
*Riesgo: Medio | Archivos: endpoint de evaluaciones en FastAPI + `ia-evaluacion.js`*

- **3.1** ⬜ Actualizar prompt de **diagnóstica** en backend: retornar JSON con `{ reactivos, header, clave }`. `header` = instrucciones + propósito + tiempo. `clave` = "1. X  2. X  3. X  4. X  5. X"
- **3.2** ⬜ Actualizar prompt de **formativa** en backend: retornar JSON con `{ reactivos, header, clave, n_criterios, pct_por_criterio }`. La IA determina n según objetivos, calcula pct = 100/n.
- **3.3** ⬜ Actualizar prompt de **sumativa** en backend: igual que diagnóstica
- **3.4** ⬜ Crear endpoint (o ruta) en backend para `ia-perfil`: recibe `{ nombreCurso }`, retorna texto con perfil + requisitos de ingreso cubriendo EC0217.01 y EC0301
- **3.5** ⬜ Actualizar `ia-evaluacion.js`: al recibir la respuesta, inyectar `reactivos` → `instXxx`, `header` → `instXxxHeader`, `clave` → `instXxxClave`. Para formativa, renderizar nota dinámica con `n_criterios` y `pct_por_criterio`.
- **3.6** ⬜ Actualizar "✨ Generar todo con IA" (`btnGenerarTodoEvaluaciones`) para incluir los nuevos campos en su flujo

**Criterio de terminado Sprint 3:** Al generar cada instrumento con IA, los 3 inputs (0, 1, 2) se llenan automáticamente. La formativa muestra nota dinámica correcta.

---

### Sprint 4 — Templates DOCX en backend Python
*Riesgo: Bajo | Archivos: templates .docx en backend*

- **4.1** ⬜ Agregar sección "Medidas de Salud / Seguridad / Higiene / Protección Civil" al template DOCX de la **Lista de Verificación independiente** (tabla con ítems: salidas de emergencia, extintor, botiquín, higiene, protocolo evacuación + columna "Verificado ✓" en blanco)
- **4.2** ⬜ Agregar la misma sección al template del **Documento de Planeación** (sección correspondiente a la lista de verificación)
- **4.3** ⬜ Actualizar el template del **instrumento del participante** (diagnóstica, sumativa): incluir campo `instXxxHeader` como encabezado del documento. NO incluir `instXxxClave`.
- **4.4** ⬜ Actualizar el template del **manual del instructor**: incluir `instXxxClave` con formato de tabla (Reactivo | Respuesta correcta | Valor). Para formativa incluir n_criterios y pct_por_criterio.
- **4.5** ⬜ Verificar que el template del instrumento formativa (lista de cotejo) incluye `instFormativaHeader` como encabezado y `instFormativaClave` solo en manual instructor

**Criterio de terminado Sprint 4:** El ZIP generado contiene instrumentos con encabezado visible para el participante, sin claves. Las claves aparecen únicamente en el manual del instructor. La lista de verificación tiene la sección de salud/seguridad.

---

### Sprint 5 — Verificación y cierre
*Riesgo: Bajo*

- **5.1** ⬜ Smoke test Paso 1: nueva label, nuevo template textarea, botón IA genera contenido correcto
- **5.2** ⬜ Smoke test Paso 2: label "Afectivo / Relacional-Social" visible
- **5.3** ⬜ Smoke test Paso 14: 6 nuevos inputs aparecen, generación IA llena los 3 inputs por instrumento, nota formativa es dinámica
- **5.4** ⬜ Smoke test ZIP: abrir instrumento del participante → sin clave; abrir manual instructor → con clave
- **5.5** ⬜ Smoke test lista de verificación: sección salud/seguridad presente
- **5.6** ⬜ Test retrocompatibilidad: importar JSON de planeación antigua → no rompe, nuevos campos vacíos

---

## Deferred (MPS futuro)
- #6 Manual del Participante
- #7 Manual del Instructor (extensión mayor)
- #8 Informe Final del Curso (template post-curso)
