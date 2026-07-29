# MPS #013 — GCE: Gestor del Ciclo de Evaluación

**Fecha:** 2026-07-29  
**Objetivo:** Expandir SmartBuilderEC a un sistema de gestión del ciclo completo de competencias laborales CONOCER, soportando el proceso evaluación → portafolio → certificado para cualquier Estándar de Competencia, gestionado por OC / CE / Evaluadores / Candidatos.

---

## Contexto y visión

SmartBuilderEC pasa de herramienta para instructores (planeación didáctica EC0217.01) a **marketplace de gestión de competencias laborales** que sirve a todo el ecosistema CONOCER:

- **OC (Organismo Certificador):** cuenta propia, gestiona múltiples CEs bajo él
- **CE (Centro de Evaluación):** gestiona candidatos y evaluadores, da acceso vía códigos
- **Evaluador Independiente (EI):** puede trabajar con múltiples CEs (freelance)
- **Candidato:** accede con código del CE, completa su portafolio

---

## Hallazgos clave del análisis normativo

### EC0076 — qué es en realidad
EC0076 es el Estándar de Competencia que deben cumplir los **evaluadores** para ser certificados. Sus 4 elementos definen el proceso que un evaluador debe seguir:
1. E4594 — Preparar la evaluación (presentar y acordar Plan)
2. E4595 — Recopilar evidencias (desempeño, producto, conocimiento, AHV)
3. E4596 — Emitir el juicio (Competente / Todavía no Competente)
4. E4597 — Presentar resultados (Cédula de Evaluación)

### Portafolio de Evidencias — estructura universal
La estructura del portafolio es **idéntica para cualquier EC**. Solo cambia el contenido dentro de cada sección:

```
PORTAFOLIO DE EVIDENCIAS
├── 1. Datos del Candidato
│   ├── Ficha de Registro         ← estructura fija CONOCER
│   ├── Diagnóstico               ← reactivos ESPECÍFICOS por EC
│   └── Derechos y Obligaciones   ← documento estándar CONOCER
├── 2. Recopilación de Evidencias
│   ├── Plan de Evaluación        ← actividades ESPECÍFICAS por EC
│   ├── IEC aplicado              ← criterios y pesos ESPECÍFICOS por EC
│   └── Evidencias opcionales     ← fotos, videos, evidencia histórica
└── 3. Cierre de la Evaluación
    ├── Cédula de Evaluación      ← estructura fija, contenido varía
    └── Encuesta de Satisfacción  ← 8 preguntas estándar CONOCER
```

### Lo que varía por EC (config JSON)
- Diagnóstico: reactivos de opción múltiple + tabla de interpretación (rangos → posibilidad de éxito)
- Plan de Evaluación: lista de actividades + técnica/instrumento por elemento
- IEC: criterios por reactivo + pesos relativos + puntaje mínimo para juicio Competente
- Recursos requeridos para la evaluación

### Decisión IEC: Opción A (aprobada)
El IEC se pre-carga en el config JSONB del EC. El evaluador solo captura C/NC por reactivo. El sistema calcula el puntaje y emite el juicio automáticamente.

---

## Arquitectura aprobada

### Nuevas tablas Supabase

```sql
-- Catálogo de Estándares de Competencia
CREATE TABLE estandares_competencia (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo        TEXT UNIQUE NOT NULL,        -- EC0616, EC0217, etc.
  titulo        TEXT NOT NULL,
  version       TEXT,
  nivel_snc     INT,                         -- 1-5
  vigencia_cert INT,                         -- años de vigencia del certificado
  config        JSONB NOT NULL DEFAULT '{}', -- diagnóstico + actividades + iec + recursos
  activo        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Proceso de evaluación por candidato
CREATE TABLE procesos_evaluacion (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id   UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluador_id   UUID REFERENCES auth.users(id),
  ce_id          UUID REFERENCES auth.users(id),    -- admin que representa al CE
  oc_id          UUID REFERENCES auth.users(id),    -- admin que representa al OC
  estandar_id    UUID REFERENCES estandares_competencia(id),
  estado         TEXT DEFAULT 'registro',
  -- estados: registro|diagnostico|plan_acordado|evidencias|juicio|cierre|certificado
  datos          JSONB DEFAULT '{}',                -- portafolio completo
  juicio         TEXT,                              -- C | TNC | null
  credito_canjeado BOOLEAN DEFAULT FALSE,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE estandares_competencia ENABLE ROW LEVEL SECURITY;
ALTER TABLE procesos_evaluacion ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner_proceso" ON procesos_evaluacion
  USING (candidato_id = auth.uid() OR evaluador_id = auth.uid() OR ce_id = auth.uid());
```

### Estructura del JSONB `config` en estandares_competencia

```json
{
  "diagnostico": {
    "instrucciones": "...",
    "reactivos": [
      {
        "num": 1,
        "pregunta": "¿Qué es la presión arterial?",
        "tipo": "opcion_multiple",
        "opciones": ["a) ...", "b) ...", "c) ..."],
        "respuesta_correcta": "b"
      }
    ],
    "tabla_interpretacion": [
      {"min": 0, "max": 10, "posibilidad": "Bajas", "sugerencia": "Tomar curso de capacitación"},
      {"min": 11, "max": 12, "posibilidad": "Medias", "sugerencia": "Tomar alineación"},
      {"min": 13, "max": 20, "posibilidad": "Altas", "sugerencia": "Iniciar el proceso"}
    ],
    "total_reactivos": 20
  },
  "plan_evaluacion": {
    "actividades": [
      {
        "num": 1,
        "descripcion": "Verifica la funcionalidad de la unidad...",
        "subactividades": ["Corroborando el funcionamiento de..."],
        "tecnica_instrumento": "Documental / Lista de cotejo"
      }
    ],
    "puntaje_minimo": 99.62,
    "criterio_1": "Suma total del peso relativo ≥ puntaje_minimo",
    "criterio_2": "Al menos un reactivo cumplido por cada criterio de evaluación",
    "recursos": ["Al menos 5 personas como participantes (simulación)"]
  },
  "iec": {
    "reactivos": [
      {
        "codigo": "D1.1",
        "tipo": "desempeno",
        "descripcion": "...",
        "peso_relativo": 2.5,
        "cumple": null
      }
    ]
  }
}
```

### Estructura del JSONB `datos` en procesos_evaluacion

```json
{
  "ficha_registro": {
    "nombre_completo": "", "curp": "", "fecha_nacimiento": "",
    "genero": "", "domicilio": {}, "email": "", "telefono": "",
    "lugar_nacimiento": "", "nacionalidad": "", "foto_url": "",
    "sabe_leer_escribir": true, "estudios": "", "discapacidad": "",
    "trabaja_actualmente": true, "puesto": "", "experiencia": "",
    "certificaciones_previas": "", "observaciones": "",
    "consentimiento_renap": false, "firma_url": ""
  },
  "diagnostico": {
    "respuestas": ["b", "a", ...],
    "correctas": 15,
    "total": 20,
    "posibilidad": "Altas",
    "sugerencia": "Iniciar el proceso",
    "decision_candidato": "Iniciar",
    "fecha": ""
  },
  "plan_evaluacion": {
    "lugar_evaluacion": "", "fecha_evaluacion": "", "horario_evaluacion": "",
    "lugar_resultados": "", "fecha_resultados": "", "horario_resultados": "",
    "firma_evaluador_url": "", "firma_candidato_url": "",
    "actividades": []
  },
  "iec": {
    "fecha_aplicacion": "",
    "reactivos": [{"codigo": "D1.1", "cumple": true, "observacion": ""}],
    "puntaje_obtenido": 0,
    "juicio_preliminar": "C"
  },
  "cedula": {
    "mejores_practicas": "",
    "areas_oportunidad": "",
    "criterios_no_cubiertos": [],
    "recomendaciones": "",
    "juicio": "C",
    "firma_evaluador_url": "",
    "firma_candidato_url": "",
    "fecha": ""
  },
  "encuesta": {
    "respuestas": [4, 4, 4, 4, 4, 4, 4, 4],
    "observaciones": "",
    "fecha": ""
  }
}
```

### Nuevos roles de sistema

| Rol (user_roles) | Quién | Jerarquía |
|---|---|---|
| `oc_admin` | Organismo Certificador | Gestiona admins CE bajo él |
| `ce_admin` | Centro de Evaluación | Gestiona candidatos y evaluadores |
| `evaluador` | Evaluador (existente) | Accede a candidatos asignados |
| *(user)* | Candidato | Accede a su proceso |

### Nuevos archivos frontend

```
diseno/
├── gce.html                        # Portal GCE (nuevo)
├── gce.css
└── gce/
    ├── main.js                     # entry point
    ├── config.js                   # BACKEND_URL, estados del pipeline
    ├── state.js
    ├── sync.js                     # sync → procesos_evaluacion
    ├── navigation.js
    ├── step-ficha.js               # Ficha de Registro del Candidato
    ├── step-diagnostico.js         # Diagnóstico interactivo
    ├── step-plan.js                # Plan de Evaluación
    ├── step-iec.js                 # IEC: captura de resultados C/NC
    ├── step-cedula.js              # Cédula de Evaluación
    ├── step-encuesta.js            # Encuesta de Satisfacción
    ├── export.js                   # descargarPortafolioZip
    └── panel-ce.js                 # Panel del CE: candidatos + estados
```

### Nuevos archivos backend

```
backend/
├── models/
│   └── gce_models.py              # EstándarCreate, ProcesoCreate, PortafolioUpdate
├── routers/
│   ├── estandares_router.py       # GET /estandares, GET /estandares/{codigo}
│   ├── gce_router.py              # procesos CRUD + pipeline de estados
│   └── docs_gce_router.py         # POST /gce/generate-portafolio → ZIP
└── services/
    └── doc_gce_helpers.py         # generadores Word por sección del portafolio
```

---

## Riesgos identificados

| Riesgo | Severidad | Mitigación |
|---|---|---|
| Config JSONB del EC con errores | Alta | Validación Pydantic en backend al crear/editar EC |
| Puntaje mínimo IEC muy específico (ej. 99.62) | Alta | El puntaje se almacena en config, no hardcodeado |
| Conflicto roles OC/CE con sistema actual | Media | `user_roles` ya es extensible; agregar oc_admin/ce_admin como roles nuevos |
| Firma digital del candidato en documentos | Media | Fase 1: captura nombre + checkbox conformidad. Firma biométrica es fase futura |
| Foto del candidato (Ficha de Registro) | Media | Supabase Storage bucket `candidatos-fotos` |

---

## Backlog priorizado

### Sprint 1 — Catálogo de ECs + Schema (fundación)
- **1.1** Crear tabla `estandares_competencia` en Supabase + RLS
- **1.2** Definir y documentar JSON schema del config (diagnóstico + plan + IEC + recursos)
- **1.3** Cargar EC0616 completo en config (basado en portafolio real analizado)
- **1.4** Router `estandares_router.py`: GET /estandares + GET /estandares/{codigo}
- **1.5** Validación Pydantic del config al crear/editar

### Sprint 2 — Estructura organizacional OC → CE → Evaluador → Candidato
- **2.1** Rol `oc_admin` en user_roles + constraint actualizado
- **2.2** Crear tabla `procesos_evaluacion` en Supabase + RLS
- **2.3** Router `gce_router.py`: crear proceso, asignar evaluador, listar por CE/OC
- **2.4** Panel CE en panel.html: nueva pestaña "GCE / Evaluaciones"
- **2.5** Vista tabla candidatos con estado del pipeline por color

### Sprint 3 — Portafolio parte 1: Ficha de Registro + Diagnóstico
- **3.1** `gce.html` + `gce.css` + módulos base (config, state, sync, navigation, main)
- **3.2** `step-ficha.js`: formulario Ficha de Registro + upload foto
- **3.3** `step-diagnostico.js`: diagnóstico interactivo (reactivos del config) + auto-cálculo resultado
- **3.4** Vista candidato "Mi proceso de evaluación": timeline de pasos con estado
- **3.5** Sync → `procesos_evaluacion.datos.ficha_registro` + `.diagnostico`

### Sprint 4 — Portafolio parte 2: Plan de Evaluación + IEC
- **4.1** `step-plan.js`: Plan de Evaluación generado del config + campos lugar/fecha/horario
- **4.2** Pantalla de acuerdo: evaluador y candidato confirman el plan (firma texto + checkbox)
- **4.3** `step-iec.js`: IEC digital — lista de reactivos del config, evaluador marca C/NC por reactivo
- **4.4** Auto-cálculo: puntaje ponderado + verificación criterio 2 (al menos 1 cumplido por categoría)
- **4.5** Determinación automática de juicio preliminar C / TNC

### Sprint 5 — Cierre: Cédula + Encuesta + Juicio final
- **5.1** `step-cedula.js`: Cédula de Evaluación — evaluador llena mejores prácticas, áreas, recomendaciones
- **5.2** Comunicación del juicio al candidato (toast + cambio de estado visible)
- **5.3** `step-encuesta.js`: Encuesta de Satisfacción del candidato (8 preguntas CONOCER + escala)
- **5.4** Cierre del proceso → estado = `cierre` → habilitar descarga del portafolio

### Sprint 6 — Generador ZIP del Portafolio completo
- **6.1** `doc_gce_helpers.py`: generador base (encabezado con logo CE/OC, datos candidato)
- **6.2** Documento 1: Ficha de Registro.docx
- **6.3** Documento 2: Diagnóstico aplicado.docx (con resultado y decisión)
- **6.4** Documento 3: Plan de Evaluación.docx (tabla actividades + firmas)
- **6.5** Documento 4: IEC aplicado.docx (reactivos + C/NC + puntaje + juicio)
- **6.6** Documento 5: Cédula de Evaluación.docx
- **6.7** Documento 6: Encuesta de Satisfacción.docx
- **6.8** Router `docs_gce_router.py`: POST /gce/generate-portafolio → ZIP + canje de crédito

### Sprint 7 — Panel OC + Dashboard de seguimiento
- **7.1** Vista OC en panel.html: tabla de sus CEs + candidatos totales por estado
- **7.2** Dashboard: gráfica candidatos por estado del pipeline (registro→certificado)
- **7.3** Vista candidato: timeline visual de su proceso (qué completó, qué falta)
- **7.4** Email notificación al candidato cuando evaluador avanza de fase

### Sprint 8 — Integración con sistema actual
- **8.1** Modelo de créditos para GCE: 1 crédito por portafolio descargado (ZIP)
- **8.2** Sección GCE en planes de suscripción (CE/EI) o plan separado
- **8.3** Acceso a `gce.html` desde panel.html según rol
- **8.4** Smoke tests: flujo completo OC → CE → Evaluador → Candidato → ZIP

---

## ECs a integrar (bajo demanda vía MPS futuras)

| Prioridad | EC | Sector |
|---|---|---|
| 1 (base) | EC0616 | Enfermería (portafolio real disponible) |
| 2 | EC0076 | Evaluadores CONOCER |
| 3 | EC0217.01 | Instructores capacitación |
| 4 | EC0091 | Verificadores Externos |
| 5+ | Por solicitud del cliente | Cualquier sector |

---

## Estado de sprints

- Sprint 1 — ⏳ Pendiente
- Sprint 2 — ⏳ Pendiente
- Sprint 3 — ⏳ Pendiente
- Sprint 4 — ⏳ Pendiente
- Sprint 5 — ⏳ Pendiente
- Sprint 6 — ⏳ Pendiente
- Sprint 7 — ⏳ Pendiente
- Sprint 8 — ⏳ Pendiente
