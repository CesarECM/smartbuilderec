# MPS #012 — Wizards EC0091 y EC0616

**Fecha:** 2026-07-28  
**Objetivo:** Integrar dos nuevos wizards independientes: EC0091 (Verificador Externo) y EC0616 (Portafolio de Evidencias Auxiliar de Enfermería) como nuevas normas dentro del marketplace SmartBuilderEC.  
**Estado:** EN EJECUCIÓN — Sprint 1

---

## Modelo de plataforma (definitivo)

SmartBuilderEC es un **ERP/marketplace de estándares CONOCER**. Cada norma es un wizard completamente independiente. No hay motor genérico compartido; el código de cada wizard es 100% autónomo. Los usuarios pueden tener una o más normas habilitadas.

---

## Decisiones técnicas aprobadas

| Decisión | Resolución |
|---|---|
| Arquitectura | Wizards independientes por norma (B1). Sin motor genérico. |
| EC0616 propósito | Portafolio de evidencias del candidato (A1) |
| Base de datos | Tablas separadas `ec0091_datos`, `ec0616_datos` (C1) |
| Créditos | 1 crédito por ZIP, mismo modelo que EC0217 |
| Acceso por plan | Incluidos en planes existentes, ocultos al usuario; solo superadmin habilita |
| Motor genérico | DESCARTADO — cada wizard se construye desde cero |

---

## Norma EC0091 — Verificación Externa

**Usuario objetivo:** Verificador Externo del CONOCER  
**Propósito del wizard:** Guiar al VE en la preparación de su expediente completo de verificación externa de un Centro de Evaluación (CE) o Evaluador Independiente (EI).  
**Elementos del estándar:** 3 (E0389 Preparar / E0390 Ejecutar / E0391 Concluir)

### Pasos del wizard (13 pasos)

| Paso | Archivo | Contenido | Modo IA |
|---|---|---|---|
| 1 | step-datos.js | Datos OC, Verificador Externo, CE/EI, responsable que recibe | — |
| 2 | step-objetivo.js | Objetivo y alcance de la verificación | Generativa + Revisora |
| 3 | step-antecedentes.js | Verificaciones previas, acciones correctivas anteriores | Revisora |
| 4 | step-lineas.js | Selección de líneas (proceso/producto/persona) + actividades | Revisora + Detectora de brechas |
| 5 | step-muestreo.js | Calculadora Muestreo Aleatorio Simple | Calculadora guiada (determinista) |
| 6 | step-documentos.js | Documentos de soporte requeridos por línea | Generativa + Revisora |
| 7 | step-cronograma.js | Fechas, horarios y responsable por actividad | Revisora |
| 8 | step-lista.js | Lista de Verificación: preguntas/temas por línea | Generativa + Revisora |
| 9 | step-ejecucion.js | Registro cumplimientos/incumplimientos post-campo | Revisora + Clasificadora |
| 10 | step-hallazgos.js | Hallazgos, causa raíz, acciones correctivas, indicadores | Generativa + Refinadora + Revisora |
| 11 | step-informe.js | Resultados y conclusiones del informe | Generativa + Revisora |
| 12 | step-cierre.js | Confirmación de firmas y cierre de la verificación | — |
| 13 | step-expediente.js | Revisión final del expediente + descargar ZIP | Revisora global |

### Modos IA por paso — detalle

- **Paso 2 (Objetivo):** G genera texto desde datos CE/EI; R verifica que incluye alcance definido por OC.
- **Paso 3 (Antecedentes):** R detecta si faltan tipos de antecedentes requeridos (reportes anteriores, auditorías, supervisiones CONOCER).
- **Paso 4 (Líneas):** Regla fija EC0091: mínimo 1 línea proceso + 1 producto + 1 persona. La IA detecta si falta alguna categoría.
- **Paso 5 (Muestreo):** Cálculo determinista. IA solo explica en lenguaje natural qué significan muestra/aceptaciones/rechazos.
- **Paso 8 (Lista de verificación):** G genera preguntas críticas por línea; R verifica que inducen "detalles y aspectos críticos" (criterio literal del IEC0091).
- **Paso 10 (Hallazgos):** G propone causa raíz probable; Rf mejora redacción para ser objetivo; R verifica 6 campos obligatorios (descripción/causa raíz/acción/tiempo/indicador/firma).
- **Paso 11 (Informe):** G genera resumen ejecutivo desde datos acumulados; R verifica 6 elementos obligatorios del EC.
- **Paso 13 (Expediente):** Revisora global de consistencia cruzada entre los 5 documentos antes del ZIP.

### Documentos ZIP EC0091 (5 archivos Word)

```
01_Plan_Verificacion_Externa.docx
02_Lista_Verificacion.docx
03_Lista_Verificacion_Aplicada.docx
04_Reporte_Hallazgos.docx
05_Informe_Verificacion_Externa.docx
```

---

## Norma EC0616 — Portafolio de Evidencias Auxiliar de Enfermería

**Usuario objetivo:** Auxiliar de enfermería (candidato) o empresa que lo envía a certificarse  
**Propósito del wizard:** Compilar el portafolio de evidencias que demuestra las 7 competencias ante un CE para obtener el certificado EC0616.  
**Elementos del estándar:** 7 (E1952–E1958: oxigenación, alimentación, eliminación, confort, seguridad, post mortem, autocuidado)

### Pasos del wizard (9 pasos)

| Paso | Archivo | Contenido | Modo IA |
|---|---|---|---|
| 1 | step-datos.js | CURP, nombre, unidad médica, CE asignado, evaluador, fecha | — |
| 2 | step-oxigenacion.js | Elemento 1: desempeños y productos de oxigenación | Generativa + Refinadora + Revisora |
| 3 | step-alimentacion.js | Elemento 2: desempeños y productos de alimentación | Generativa + Refinadora + Revisora |
| 4 | step-eliminacion.js | Elemento 3: desempeños y productos de eliminación | Generativa + Refinadora + Revisora |
| 5 | step-confort.js | Elemento 4: higiene, descanso y sueño | Generativa + Refinadora + Revisora |
| 6 | step-seguridad.js | Elemento 5: medidas de seguridad OMS y protocolos | Generativa + Refinadora + Revisora |
| 7 | step-postmortem.js | Elemento 6: cuidados post mortem (prompt clínico/respetuoso) | Generativa + Refinadora + Revisora |
| 8 | step-autocuidado.js | Elemento 7: orientación para el autocuidado | Generativa + Refinadora + Revisora |
| 9 | step-portafolio.js | Revisión final del portafolio + descargar ZIP | Detectora de brechas global |

### Modos IA — pasos 2–8 (patrón común, 3 botones por paso)

Cada paso de elemento tiene 3 botones IA independientes:

| Botón | Función | Qué hace |
|---|---|---|
| "Redactar por mí" | `generarDescripcion()` | Generativa: propone descripción de desempeños alineada al EC0616 según unidad médica y contexto del candidato |
| "Mejorar mi texto" | `refinarTexto()` | Refinadora: toma lo que el candidato escribió y lo reformula con vocabulario y estructura del CONOCER |
| "¿Cumple el criterio?" | `revisarCumplimiento()` | Revisora: evalúa si cubre TODOS los desempeños del elemento; devuelve checklist ✅/⚠️/❌ por desempeño requerido |

**Paso 9 (Portafolio):** Detectora de brechas global — scorecard de los 7 elementos; muestra cuáles tienen cobertura completa y cuáles necesitan más evidencia antes de generar el ZIP.

**Nota sobre Paso 7 (Post mortem):** El prompt de IA incluye instrucción explícita de tono clínico profesional, sin lenguaje dramático ni inapropiado.

### Documentos ZIP EC0616 (9 archivos Word)

```
00_Portada_Portafolio.docx
01_Evidencia_Oxigenacion.docx
02_Evidencia_Alimentacion.docx
03_Evidencia_Eliminacion.docx
04_Evidencia_Confort.docx
05_Evidencia_Seguridad_Proteccion.docx
06_Evidencia_Cuidados_Post_Mortem.docx
07_Evidencia_Autocuidado.docx
08_Declaratoria_Candidato.docx
```

---

## Estructura de archivos aprobada

```
diseno/
├── ec0091.html                    ← nuevo entry point EC0091
├── ec0091.css                     ← overrides visuales EC0091
├── wizard-ec0091/
│   ├── main.js                    ← init(), bootstrap, listeners globales
│   ├── state.js                   ← estado global EC0091
│   ├── config.js                  ← 13 secciones, colores, constantes
│   ├── export.js                  ← generar ZIP EC0091
│   ├── sync.js                    ← auto-guardado → ec0091_datos
│   ├── step-datos.js
│   ├── step-objetivo.js
│   ├── step-antecedentes.js
│   ├── step-lineas.js
│   ├── step-muestreo.js
│   ├── step-documentos.js
│   ├── step-cronograma.js
│   ├── step-lista.js
│   ├── step-ejecucion.js
│   ├── step-hallazgos.js
│   ├── step-informe.js
│   ├── step-cierre.js
│   ├── step-expediente.js
│   ├── ia-objetivo.js             ← generativa + revisora
│   ├── ia-lista.js                ← generativa + revisora
│   ├── ia-hallazgos.js            ← generativa + refinadora + revisora
│   ├── ia-informe.js              ← generativa + revisora
│   └── ia-revision-global.js      ← revisora cruzada paso 13
├── ec0616.html                    ← nuevo entry point EC0616
├── ec0616.css                     ← overrides visuales EC0616
└── wizard-ec0616/
    ├── main.js
    ├── state.js
    ├── config.js                  ← 9 secciones, 7 elementos
    ├── export.js
    ├── sync.js                    ← auto-guardado → ec0616_datos
    ├── step-datos.js
    ├── step-oxigenacion.js
    ├── step-alimentacion.js
    ├── step-eliminacion.js
    ├── step-confort.js
    ├── step-seguridad.js
    ├── step-postmortem.js
    ├── step-autocuidado.js
    ├── step-portafolio.js
    ├── ia-elem1.js                ← generarDescripcion, refinarTexto, revisarCumplimiento
    ├── ia-elem2.js
    ├── ia-elem3.js
    ├── ia-elem4.js
    ├── ia-elem5.js
    ├── ia-elem6.js                ← prompt con instrucción clínica
    ├── ia-elem7.js
    └── ia-scorecard.js            ← detectora de brechas global paso 9

backend/
├── models/
│   ├── ec0091_models.py           ← Pydantic models IA + docs EC0091
│   └── ec0616_models.py           ← Pydantic models IA + docs EC0616
├── routers/
│   ├── ia_ec0091_router.py        ← /ec0091/ia/* (4 endpoints)
│   ├── ia_ec0616_router.py        ← /ec0616/ia/* (7 endpoints + scorecard)
│   ├── docs_ec0091_router.py      ← /ec0091/generate-doc
│   └── docs_ec0616_router.py      ← /ec0616/generate-doc
└── services/
    ├── doc_ec0091_helpers.py      ← generadores 5 docs Word EC0091
    └── doc_ec0616_helpers.py      ← generadores 9 docs Word EC0616
```

### Archivos reutilizados sin modificar

`diseno/shared/` · `diseno/storage/` · `diseno/styles/wizard.css` · `diseno/auth.js`  
`diseno/supabase-client.js` · `backend/services/doc_helpers.py` · `backend/middleware/jwt_auth.py`

---

## SQL requerido (ejecutar en Supabase antes del Sprint 2)

```sql
-- EC0091
CREATE TABLE ec0091_datos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id        UUID REFERENCES auth.users(id),
  nombre_verificacion TEXT,
  datos           JSONB DEFAULT '{}',
  credito_canjeado BOOLEAN DEFAULT FALSE,
  snapshot_url    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ec0091_datos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner" ON ec0091_datos USING (user_id = auth.uid());

-- EC0616
CREATE TABLE ec0616_datos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  admin_id        UUID REFERENCES auth.users(id),
  nombre_candidato TEXT,
  datos           JSONB DEFAULT '{}',
  credito_canjeado BOOLEAN DEFAULT FALSE,
  snapshot_url    TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);
ALTER TABLE ec0616_datos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner" ON ec0616_datos USING (user_id = auth.uid());
```

---

## Riesgos normativos y técnicos

| Riesgo | Mitigación |
|---|---|
| Calculadora MAS (Paso 5 EC0091): fórmula exacta usada por CONOCER no especificada en el EC | Investigar antes de implementar el paso 5; usar tabla ANSI Z1.4 estándar |
| EC0616 Elemento 6 (post mortem): tono inapropiado de la IA | Prompt con instrucción explícita: tono clínico, profesional, sin dramatismo |
| Portafolio EC0616: PDF de plantilla real no legible (scaneado) | Estructura inferida del estándar; ajustar docs si el usuario comparte índice editable |
| sync.js existente NO se modifica | Cada wizard crea su propio `sync.js` apuntando a su tabla |
| main.py no se rompe | Nuevos routers se agregan al final del bloque include_router |
| Regla 300 líneas: ia-elemN.js con 3 funciones podría excederse | Vigilar en Sprint 3; dividir en `ia-elemN-gen.js` / `ia-elemN-rev.js` si aplica |

---

## Backlog de Sprints

### Sprint 1 — EC0091 Frontend (pasos 1–8 + sync)
*Criterio: Primeros 8 pasos renderizan, guardan en localStorage, auto-guardado funciona hacia `ec0091_datos`.*

| Sub | Tarea |
|---|---|
| 1.1 | `ec0091.html` — entry point (estructura de index.html, imports wizard-ec0091) |
| 1.2 | `ec0091.css` — overrides de color/header para diferenciarlo de EC0217 |
| 1.3 | `wizard-ec0091/config.js` — 13 secciones, constantes, nombre norma |
| 1.4 | `wizard-ec0091/state.js` — estado global EC0091 |
| 1.5 | `wizard-ec0091/main.js` — init(), bootstrap, listeners globales |
| 1.6 | `wizard-ec0091/step-datos.js` — formulario OC / VE / CE+EI |
| 1.7 | `wizard-ec0091/step-objetivo.js` + `ia-objetivo.js` — objetivo con 2 botones IA |
| 1.8 | `wizard-ec0091/step-antecedentes.js` — antecedentes con botón Revisar |
| 1.9 | `wizard-ec0091/step-lineas.js` — selección líneas + validación mínimo 3 tipos |
| 1.10 | `wizard-ec0091/step-muestreo.js` — calculadora MAS + explicación IA |
| 1.11 | `wizard-ec0091/step-documentos.js` — documentos soporte con sugerencia IA |
| 1.12 | `wizard-ec0091/step-cronograma.js` — cronograma con revisora |
| 1.13 | `wizard-ec0091/step-lista.js` + `ia-lista.js` — Lista de Verificación |
| 1.14 | SQL: `CREATE TABLE ec0091_datos` en Supabase |
| 1.15 | `wizard-ec0091/sync.js` — auto-guardado hacia `ec0091_datos` |

### Sprint 2 — EC0091 Ejecución, conclusión y exportación
*Criterio: Pasos 9–13 funcionales, ZIP de 5 documentos descargable, 1 crédito consumido.*

| Sub | Tarea |
|---|---|
| 2.1 | `step-ejecucion.js` — registro cumplimientos/incumplimientos |
| 2.2 | `step-hallazgos.js` + `ia-hallazgos.js` — 3 modos (gen/ref/rev) |
| 2.3 | `step-informe.js` + `ia-informe.js` — 2 modos (gen/rev) |
| 2.4 | `step-cierre.js` — confirmación de firmas |
| 2.5 | `step-expediente.js` + `ia-revision-global.js` — revisora cruzada |
| 2.6 | `wizard-ec0091/export.js` — payload, endpoint, ZIP, celebración |
| 2.7 | `backend/models/ec0091_models.py` — Pydantic models |
| 2.8 | `backend/routers/ia_ec0091_router.py` — 4 endpoints IA |
| 2.9 | `backend/services/doc_ec0091_helpers.py` — 5 generadores Word |
| 2.10 | `backend/routers/docs_ec0091_router.py` — /ec0091/generate-doc |
| 2.11 | Registrar routers EC0091 en `backend/main.py` |
| 2.12 | Smoke test: flujo completo paso 1 → ZIP EC0091 |

### Sprint 3 — EC0616 Frontend (pasos 1–9 + sync)
*Criterio: 9 pasos renderizan, guardan, auto-sincronizan con `ec0616_datos`.*

| Sub | Tarea |
|---|---|
| 3.1 | `ec0616.html` + `ec0616.css` — entry point con identidad visual EC0616 |
| 3.2 | `wizard-ec0616/config.js` + `state.js` + `main.js` |
| 3.3 | `wizard-ec0616/step-datos.js` — CURP, candidato, unidad médica, evaluador, CE |
| 3.4 | `step-oxigenacion.js` + `ia-elem1.js` — 3 botones IA |
| 3.5 | `step-alimentacion.js` + `ia-elem2.js` |
| 3.6 | `step-eliminacion.js` + `ia-elem3.js` |
| 3.7 | `step-confort.js` + `ia-elem4.js` |
| 3.8 | `step-seguridad.js` + `ia-elem5.js` |
| 3.9 | `step-postmortem.js` + `ia-elem6.js` (prompt clínico) |
| 3.10 | `step-autocuidado.js` + `ia-elem7.js` |
| 3.11 | `step-portafolio.js` + `ia-scorecard.js` — brechas global |
| 3.12 | SQL: `CREATE TABLE ec0616_datos` en Supabase |
| 3.13 | `wizard-ec0616/sync.js` — auto-guardado hacia `ec0616_datos` |

### Sprint 4 — EC0616 Backend y exportación
*Criterio: ZIP de 9 documentos descargable, crédito consumido.*

| Sub | Tarea |
|---|---|
| 4.1 | `wizard-ec0616/export.js` — payload, endpoint, ZIP, celebración |
| 4.2 | `backend/models/ec0616_models.py` — Pydantic models |
| 4.3 | `backend/routers/ia_ec0616_router.py` — 7 endpoints IA + scorecard |
| 4.4 | `backend/services/doc_ec0616_helpers.py` — 9 generadores Word |
| 4.5 | `backend/routers/docs_ec0616_router.py` — /ec0616/generate-doc |
| 4.6 | Registrar routers EC0616 en `backend/main.py` |
| 4.7 | Smoke test: flujo completo paso 1 → ZIP EC0616 |

### Sprint 5 — Integración al panel y cierre
*Criterio: Superadmin ve y habilita EC0091/EC0616; usuarios con acceso ven sus wizards disponibles.*

| Sub | Tarea |
|---|---|
| 5.1 | Panel alumno/admin: cards de EC habilitados por norma asignada |
| 5.2 | Panel superadmin: toggle para habilitar EC0091/EC0616 por usuario |
| 5.3 | Verificar consumo correcto de crédito en ambas normas |
| 5.4 | Actualizar `ARCHITECTURE.md` con secciones wizard-ec0091 y wizard-ec0091 |
| 5.5 | Smoke tests finales EC0091 + EC0616 end-to-end |

---

## Progreso

| Sprint | Estado |
|---|---|
| Sprint 1 — EC0091 Frontend | ⏳ Pendiente |
| Sprint 2 — EC0091 Backend + Export | ⏳ Pendiente |
| Sprint 3 — EC0616 Frontend | ⏳ Pendiente |
| Sprint 4 — EC0616 Backend + Export | ⏳ Pendiente |
| Sprint 5 — Integración panel | ⏳ Pendiente |
