# MPS #001 — Refactoring: límite de 300 líneas por archivo

**Fecha:** 2026-07-11  
**Objetivo:** Ningún archivo del proyecto supera 300 líneas. Mejorar mantenibilidad y coherencia arquitectónica sin romper funcionalidad.  
**Estado:** COMPLETADO — 170/170 subsprints ✅ (2026-07-12)

---

## Decisiones arquitectónicas aprobadas

1. **ES Modules (`type="module"`):** Se adoptará `import/export` ES6 nativo en el wizard (`index.html`) y en `panel.html`. Los módulos exportan explícitamente lo que los HTML handlers necesiten via `window.X = X` en el módulo de entrada durante la transición.
2. **Scripts concatenados para soporte-widget:** `soporte-widget.js` se divide en partes que se cargan como `<script src="">` clásicos (no modules) para no afectar la inyección en páginas existentes.
3. **Namespaces de carpetas:** Los módulos nuevos van en subcarpetas (`diseno/wizard/`, `diseno/panel/`, `diseno/soporte/`, `diseno/erp/`, `diseno/storage/`, `diseno/shared/`, `backend/models/`, `backend/services/`, `backend/routers/soporte/`, `backend/routers/erp/`).
4. **Generar_planeacion.js:** Se divide primero en módulos Node.js (Sprint 4). La migración a Python (backlog #4) se hace en sesión posterior.
5. **No se crea documentación extra:** Solo este archivo MPS y `ARCHITECTURE.md` se actualizan al terminar.

---

## Diagnóstico inicial (2026-07-11)

### Archivos sobre el límite (>300 líneas)

| Archivo | Líneas | Exceso |
|---|---|---|
| `diseno/panel.html` | 5,487 | +5,187 |
| `diseno/app.js` | 5,487 | +5,187 |
| `backend/main.py` | 2,047 | +1,747 |
| `diseno/index.html` | 1,948 | +1,648 |
| `diseno/erp-admin.html` | 1,141 | +841 |
| `backend/routers/soporte_router.py` | 1,025 | +725 |
| `diseno/styles.css` | 973 | +673 |
| `backend/generar_planeacion.js` | 914 | +614 |
| `backend/routers/erp_router.py` | 774 | +474 |
| `diseno/landing.html` | 737 | +437 |
| `diseno/mi-expediente.html` | 550 | +250 |
| `diseno/shared.js` | 497 | +197 |
| `diseno/pago.html` | 413 | +113 |
| `diseno/soporte-widget.js` | 408 | +108 |
| `diseno/storage.js` | 336 | +36 |
| `diseno/recursos.html` | 325 | +25 |

### Anatomía de los archivos más grandes

**`panel.html` (5,487 líneas):**
- Líneas 8–688: bloque `<style>` → 680 líneas CSS
- Líneas 1,573–5,095: bloque `<script>` → 3,522 líneas JS
- HTML estructural restante: ~1,285 líneas

**`index.html` (1,948 líneas):**
- Líneas 11–91: bloque `<style>` → 80 líneas CSS
- Líneas 2,098–2,292: bloques `<script>` init → 194 líneas JS
- HTML estructural (16 pasos wizard): ~1,674 líneas

**`erp-admin.html` (1,141 líneas):**
- Líneas 8–161: `<style>` → 153 líneas CSS
- Líneas 500–1,251: `<script>` → 751 líneas JS
- HTML estructural: ~237 líneas ✅

**`landing.html` (737 líneas):**
- Líneas 8–429: `<style>` → 421 líneas CSS
- Líneas 726–797: `<script>` → 71 líneas JS
- HTML estructural: ~245 líneas ✅

---

## Backlog completo de Subsprints

> **Convención de estado:** ⬜ Pendiente · 🔄 En progreso · ✅ Completo

---

### SPRINT 1 — Limpiar `backend/main.py` (2,047 → ~80 líneas)

#### Sprint 1A — Extraer middleware JWT

| # | Subsprint | Archivos | Estado |
|---|---|---|---|
| 1.1 | Crear `backend/middleware/__init__.py` (vacío) | nuevo | ✅ |
| 1.2 | Crear `backend/middleware/jwt_auth.py` — mover `_es_publico`, `_get_public_key`, `JWTAuthMiddleware` (~125 líneas) | nuevo | ✅ |
| 1.3 | Actualizar `main.py`: `from middleware.jwt_auth import JWTAuthMiddleware` + eliminar código movido | main.py | ✅ |

#### Sprint 1B — Extraer modelos Pydantic de IA

| # | Subsprint | Archivos | Estado |
|---|---|---|---|
| 1.4 | Crear `backend/models/__init__.py` (vacío) | nuevo | ✅ |
| 1.5 | Crear `backend/models/ia_models.py` — `EvaluationRequest`, `GeneralRequest`, `BeneficiosRequest`, `TemarioRequest`, `PreguntasRequest`, `ExpositivaRequest`, `DemostrativaRequest`, `DialogoRequest`, `CierreRequest`, `DescripcionGeneralRequest`, `EvaluacionIARequest`, `MaterialesRequest`, `ResumenRequest`, `CompromisosRequest` (~130 líneas) | nuevo | ✅ |
| 1.6 | Actualizar `main.py`: `from models.ia_models import *` | main.py | ✅ |

#### Sprint 1C — Extraer modelos Pydantic del wizard

| # | Subsprint | Archivos | Estado |
|---|---|---|---|
| 1.7 | Crear `backend/models/wizard_models.py` — `DatosInfo`, `ObjetivosInfo`, `TemarioInfo`, `EncuadreInfo`, `TecnicasInfo`, `EvaluacionesInfo`, `TiempoFila`, `TiempoBloque`, `PlaneacionRequest`, `ObjetivosRequest`, `TokenRequest` (~200 líneas) | nuevo | ✅ |
| 1.8 | Crear `backend/models/admin_models.py` — `CreateUserRequest` + cualquier otro modelo de admin (~30 líneas) | nuevo | ✅ |
| 1.9 | Actualizar `main.py`: imports desde `models.wizard_models` y `models.admin_models` | main.py | ✅ |

#### Sprint 1D — Extraer servicios de documentos (helpers)

| # | Subsprint | Archivos | Estado |
|---|---|---|---|
| 1.10 | Crear `backend/services/doc_helpers.py` — `tabla_encabezado`, `_docx_bytes`, `_titulo`, `crear_zip_con_docx`, `limpiar_nombre_archivo`, `_validar_expediente`, `_calc_content_len`, `load_prompt` (~110 líneas) | nuevo | ✅ |
| 1.11 | Crear `backend/services/doc_objetivos.py` — `crear_docx_objetivos` (~40 líneas) | nuevo | ✅ |
| 1.12 | Actualizar `main.py`: imports desde `services.doc_helpers` y `services.doc_objetivos` | main.py | ✅ |

#### Sprint 1E — Extraer generadores de documentos de evaluación

| # | Subsprint | Archivos | Estado |
|---|---|---|---|
| 1.13 | Crear `backend/services/doc_evaluaciones.py` — `generar_evaluacion_diagnostica`, `generar_evaluacion_formativa_cotejo`, `generar_evaluacion_formativa_guia`, `generar_evaluacion_sumativa`, `generar_evaluacion_reaccion`, `generar_lista_asistencia` (~250 líneas) | nuevo | ✅ |
| 1.14 | Actualizar `main.py`: import desde `services.doc_evaluaciones` | main.py | ✅ |

#### Sprint 1F — Extraer generador de presentación y contrato

| # | Subsprint | Archivos | Estado |
|---|---|---|---|
| 1.15 | Crear `backend/services/doc_planeacion.py` — `generar_presentacion_curso` (~290 líneas) | nuevo | ✅ |
| 1.16 | Crear `backend/services/doc_generales.py` — `generar_contrato_aprendizaje`, `generar_lista_requerimientos` (~120 líneas) | nuevo | ✅ |
| 1.17 | Actualizar `main.py`: imports desde `services.doc_planeacion` y `services.doc_generales` | main.py | ✅ |

#### Sprint 1G — Extraer router de IA (planeación)

| # | Subsprint | Archivos | Estado |
|---|---|---|---|
| 1.18 | Crear `backend/routers/ia_planeacion_router.py` — `/evaluate`, `/generate-general`, `/generate-beneficios`, `/generate-temario`, `/generate-preguntas` (~140 líneas) | nuevo | ✅ |
| 1.19 | Crear `backend/routers/ia_tecnicas_router.py` — `/generate-expositiva`, `/generate-demostrativa`, `/generate-dialogo` (~110 líneas) | nuevo | ✅ |
| 1.20 | Actualizar `main.py`: incluir ambos routers con `app.include_router(...)` | main.py | ✅ |

#### Sprint 1H — Extraer router de IA (cierre y evaluación)

| # | Subsprint | Archivos | Estado |
|---|---|---|---|
| 1.21 | Crear `backend/routers/ia_cierre_router.py` — `/generate-resumen`, `/generate-compromisos`, `/generate-cierre`, `/generate-descripcion-general` (~140 líneas) | nuevo | ✅ |
| 1.22 | Crear `backend/routers/ia_evaluacion_router.py` — `/generate-evaluacion-diagnostica`, `/generate-evaluacion-sumativa`, `/generate-formativa` (~100 líneas) | nuevo | ✅ |
| 1.23 | Crear `backend/routers/ia_materiales_router.py` — `/generate-materiales-clasificados`, `/generate-materiales` (~100 líneas) | nuevo | ✅ |
| 1.24 | Actualizar `main.py`: incluir los 3 routers nuevos | main.py | ✅ |

#### Sprint 1I — Extraer router de documentos, health y admin

| # | Subsprint | Archivos | Estado |
|---|---|---|---|
| 1.25 | Crear `backend/routers/docs_router.py` — `/generate-doc/objetivos`, `/generate-doc/planeacion` (con toda la lógica de generación del ZIP) (~280 líneas) | nuevo | ✅ |
| 1.26 | Crear `backend/routers/health_router.py` — `/health/integraciones` + helpers internos `_test_vigencias_proximas`, `_test_admins_sin_creditos`, `_test_usuarios_sin_plan`, `_test_kb_pendientes` (~180 líneas) | nuevo | ✅ |
| 1.27 | Crear `backend/routers/cron_admin_router.py` — `/admin/create-user`, `/admin/users/{id}` (DELETE), `/admin/cron/vigencias`, `/perfil`, `/validate-token` (~130 líneas) | nuevo | ✅ |
| 1.28 | Actualizar `main.py`: incluir los 3 routers nuevos | main.py | ✅ |

#### Sprint 1J — `main.py` final

| # | Subsprint | Archivos | Estado |
|---|---|---|---|
| 1.29 | Limpiar `main.py` — debe quedar solo: imports, `app = FastAPI()`, CORS config, `app.add_middleware`, todos los `app.include_router`, OpenAI client init (~80 líneas). Verificar con `wc -l`. | main.py | ✅ |

---

### SPRINT 2 — Dividir `backend/routers/soporte_router.py` (1,025 → 7 archivos)

| # | Subsprint | Archivos | Líneas aprox. | Estado |
|---|---|---|---|---|
| 2.1 | Crear `backend/models/soporte_models.py` — `SesionInitRequest`, `ChatRequest`, `TicketRequest`, `FAQCreate`, `FAQUpdate`, `RecursoCreate`, `TicketUpdate`, `SugerenciaAction`, `VotoFAQs` + helpers `_get_user`, `_require_superadmin`, `_require_admin` | nuevo | ~90 | ✅ |
| 2.2 | Crear `backend/routers/soporte/__init__.py` (vacío) + `backend/routers/soporte/chat_router.py` — `init_sesion`, `soporte_chat` (SSE streaming), `_track_exposiciones`, `_persist_transcript` | nuevo | ~110 | ✅ |
| 2.3 | Crear `backend/routers/soporte/tickets_router.py` — `crear_ticket`, `listar_tickets`, `get_ticket`, `actualizar_ticket` + helpers de email background `_confirmar_ticket_usuario`, `_notificar_admin_ticket`, `_email_resolucion` | nuevo | ~170 | ✅ |
| 2.4 | Crear `backend/services/soporte_feedback.py` — `_analizar_resolucion_sync` y toda la lógica del feedback loop Claude Haiku (la función más grande del router, ~200 líneas) | nuevo | ~200 | ✅ |
| 2.5 | Crear `backend/routers/soporte/sugerencias_router.py` — `listar_sugerencias`, `gestionar_sugerencia` | nuevo | ~90 | ✅ |
| 2.6 | Crear `backend/routers/soporte/kb_router.py` — endpoints FAQs (`/soporte/faqs/*`), votos, bajo-rendimiento + endpoints recursos blog (`/recursos`, `/recursos/{id}`) + recursos admin (`/soporte/recursos`) | nuevo | ~180 | ✅ |
| 2.7 | Crear `backend/routers/soporte/cron_router.py` — `cron_analizar_patrones`, `cron_analizar_calidad_faqs` | nuevo | ~145 | ✅ |
| 2.8 | Reemplazar `backend/routers/soporte_router.py` — convertirlo en re-exportador: importa los 5 sub-routers y los registra en un router padre. Actualizar import en `main.py` si es necesario. | soporte_router.py | ~30 | ✅ |

---

### SPRINT 3 — Dividir `backend/routers/erp_router.py` (774 → 8 archivos)

| # | Subsprint | Archivos | Líneas aprox. | Estado |
|---|---|---|---|---|
| 3.1 | Crear `backend/models/erp_models.py` — `NormaUpsert`, `AsignacionRequest`, `PagoManualRequest`, `EvaluadoRequest`, `LoteEnviadoRequest`, `CertificadoRecibidoRequest`, `AsignarRolRequest` | nuevo | ~80 | ✅ |
| 3.2 | Crear `backend/services/erp_helpers.py` — `_caller`, `_get_profile`, `_require_role`, `_get_extra_roles`, `_is_evaluador`, `_is_asesor`, `_can_manage_alumno`, `_is_assigned_as`, `_build_cert_status` | nuevo | ~100 | ✅ |
| 3.3 | Crear `backend/routers/erp/__init__.py` (vacío) + `backend/routers/erp/normas_router.py` — `listar_normas`, `crear_norma`, `actualizar_norma` | nuevo | ~50 | ✅ |
| 3.4 | Crear `backend/routers/erp/alumnos_lista.py` — `listar_alumnos` (con filtros y joins complejos de Supabase) | nuevo | ~110 | ✅ |
| 3.5 | Crear `backend/routers/erp/alumnos_detalle.py` — `detalle_alumno`, `mis_servicios` | nuevo | ~220 | ✅ |
| 3.6 | Crear `backend/routers/erp/asignaciones_router.py` — `crear_asignacion`, `listar_asignaciones`, `eliminar_asignacion`, `registrar_pago_manual`, `eliminar_pago`, `pagos_pendientes` | nuevo | ~130 | ✅ |
| 3.7 | Crear `backend/routers/erp/certificacion_router.py` — `_upsert_proceso`, `registrar_evaluado`, `registrar_lote_enviado`, `registrar_certificado_recibido`, `status_certificacion` | nuevo | ~150 | ✅ |
| 3.8 | Crear `backend/routers/erp/roles_router.py` — `asignar_rol`, `quitar_rol`, `listar_roles`, `resumen_global` | nuevo | ~80 | ✅ |
| 3.9 | Reemplazar `backend/routers/erp_router.py` — convertirlo en re-exportador: importa los sub-routers de `erp/` y los une. Actualizar import en `main.py`. | erp_router.py | ~30 | ✅ |

---

### SPRINT 4 — Dividir `backend/generar_planeacion.js` (914 → 10 archivos)

| # | Subsprint | Archivos | Líneas aprox. | Estado |
|---|---|---|---|---|
| 4.1 | Crear `backend/generators/constants.js` — `AZUL`, `AZUL_MED`, `AZUL_CLARO`, `GRIS_CLARO`, `NARANJA`, `BLANCO`, `NEGRO`, `CM`, `TW`, `borde`, `bordesAzul`, `cellPad`, `cellPadS`, `cellPadXS` | nuevo | ~35 | ✅ |
| 4.2 | Crear `backend/generators/text-helpers.js` — `txt`, `txtS`, `linesToParas`, `linesToParasS`, `actParas`, `formatDuracion` | nuevo | ~65 | ✅ |
| 4.3 | Crear `backend/generators/cell-helpers.js` — `headerCell`, `subHeaderCell`, `labelCell`, `valueCell`, `valueCellS`, `obtenerTiempo`, `obtenerSubtotalTiempo`, `extraerNombreInstrumento` | nuevo | ~100 | ✅ |
| 4.4 | Crear `backend/generators/tabla-info.js` — `tablaInfoGeneral` | nuevo | ~80 | ✅ |
| 4.5 | Crear `backend/generators/tabla-objetivos.js` — `tablaObjetivos` | nuevo | ~85 | ✅ |
| 4.6 | Crear `backend/generators/tabla-requerimientos.js` — `tablaRequerimientos` | nuevo | ~60 | ✅ |
| 4.7 | Crear `backend/generators/tabla-evaluaciones.js` — `tablaEvaluaciones` | nuevo | ~75 | ✅ |
| 4.8 | Crear `backend/generators/tabla-secciones.js` — `tablaSeccion`, `tablaDesarrollo` | nuevo | ~110 | ✅ |
| 4.9 | Crear `backend/generators/doc-builder.js` — `generarDoc` (orquesta tablas, ensambla Document) + `doc-content.js` (arrays de filas) | nuevo | ~65+199 | ✅ |
| 4.10 | Crear `backend/generators/index.js` — entry point: lee payload desde stdin, llama `generarDoc`, escribe el archivo de salida | nuevo | ~35 | ✅ |
| 4.11 | Actualizar `docs_router.py`: cambiar ruta de `generar_planeacion.js` → `generators/index.js` | docs_router.py | — | ✅ |

---

### SPRINT 5 — CSS modular (`diseno/styles.css` → 6 archivos)

| # | Subsprint | Archivos | Líneas aprox. | Estado |
|---|---|---|---|---|
| 5.1 | Crear `diseno/styles/variables.css` — custom properties CSS: colores, tipografía, espaciado, sombras, radios | nuevo | 48 | ✅ |
| 5.2 | Crear `diseno/styles/base.css` — reset, `body`, `html`, `*`, tipografía global, misc heredado | nuevo | 26 | ✅ |
| 5.3 | Crear `diseno/styles/components.css` — botones, btn-regresar, toast, celebration, loader, speed-dial, token | nuevo | 237 | ✅ |
| 5.4 | Crear `diseno/styles/forms.css` — form-group, inputs, textareas, checkbox-list, radio-card, técnicas | nuevo | 148 | ✅ |
| 5.5 | Crear `diseno/styles/layout.css` — layout, main, sidebar, .card, custom modals (.cm-*) | nuevo | 227 | ✅ |
| 5.6 | Crear `diseno/styles/wizard.css` — progress bar, wizard-section, objetivos tabs, temario, tiempos, evaluaciones, formatos | nuevo | 155 | ✅ |
| 5.7 | Crear `diseno/styles/responsive.css` — todos los `@media` queries del archivo original | nuevo | 37 | ✅ |
| 5.8 | Crear `diseno/styles/main.css` — solo `@import` de los 7 archivos anteriores | nuevo | 10 | ✅ |
| 5.9 | Actualizar todos los HTML: `<link href="styles.css">` → `<link href="styles/main.css">` | 13 archivos HTML | — | ✅ |

---

### SPRINT 6 — Extraer CSS/JS inline de HTML grandes

| # | Subsprint | Qué se extrae | Archivo destino | Estado |
|---|---|---|---|---|
| 6.1 | `panel.html` líneas 8–688: bloque `<style>` (680 líneas) | `diseno/panel.css` | ✅ |
| 6.2 | `panel.html` líneas 1,573–5,095: bloque `<script>` (3,522 líneas) | `diseno/panel.js` (temporal, luego se divide en Sprint 15) | ✅ |
| 6.3 | `erp-admin.html` líneas 8–161: bloque `<style>` (153 líneas) | `diseno/erp-admin.css` | ✅ |
| 6.4 | `erp-admin.html` líneas 500–1,251: bloque `<script>` (751 líneas) | `diseno/erp-admin.js` (temporal, luego se divide en Sprint 16) | ✅ |
| 6.5 | `landing.html` líneas 8–429: bloque `<style>` (421 líneas) | `diseno/landing.css` | ✅ |
| 6.6 | `landing.html` líneas 726–797: bloque `<script>` (71 líneas) | `diseno/landing.js` | ✅ |
| 6.7 | `index.html` líneas 11–91: bloque `<style>` (80 líneas) | `diseno/index.css` | ✅ |
| 6.8 | `index.html` líneas 2,098–2,292: bloques `<script>` init (194 líneas) | `diseno/index-init.js` | ✅ |
| 6.9 | `mi-expediente.html`: extraer CSS inline + JS inline | `diseno/mi-expediente.css`, `diseno/mi-expediente.js` | ✅ |
| 6.10 | `pago.html`: extraer CSS inline + JS inline (FB Pixel dejado inline en head) | `diseno/pago.css`, `diseno/pago.js` | ✅ |
| 6.11 | `recursos.html`: extraer CSS inline + JS inline | `diseno/recursos.css`, `diseno/recursos.js` | ✅ |

> **Criterio de terminado por subsprint:** el HTML resultante debe tener `<link href="archivo.css">` y `<script src="archivo.js">` en lugar de los bloques inline, y la página debe funcionar idéntico al estado anterior.

---

### SPRINT 7 — Preparación ES Modules para el wizard

| # | Subsprint | Archivos | Líneas aprox. | Estado |
|---|---|---|---|---|
| 7.1 | Crear `diseno/wizard/state.js` — objeto de estado global del wizard: secciones completadas, datos de cada paso, modo libre, perfil usuario. Exporta `state` y `setState`. | nuevo | ~60 | ✅ |
| 7.2 | Crear `diseno/wizard/config.js` — constantes: lista de secciones, orden de navegación, tiempos mínimos EC0217 (120 min), categorías de materiales | nuevo | ~40 | ✅ |
| 7.3 | Crear `diseno/wizard/api.js` — función base `llamarIA(endpoint, payload)`: fetch al backend, manejo de auth header, manejo de errores de red. Exporta `llamarIA` y `llamarIAStream`. | nuevo | ~60 | ✅ |
| 7.4 | Crear `diseno/wizard/main.js` — entry point: importa todos los módulos de steps e IA, llama `init()` de cada uno, expone en `window.*` lo que los HTML handlers necesiten durante la transición | nuevo | ~70 | ✅ |
| 7.5 | Actualizar `diseno/index.html`: añadir `<script type="module" src="wizard/main.js">` (app.js coexiste como clásico durante la transición — se elimina al completar Sprint 11). | index.html | — | ✅ |

---

### SPRINT 8 — Split `diseno/app.js`: módulos de UI y navegación

| # | Subsprint | Funciones que contiene | Líneas aprox. | Estado |
|---|---|---|---|---|
| 8.1 | Crear `diseno/wizard/ui-sync.js` — IIFE `initSyncUI`: indicador guardado (W#1), barra de progreso global (W#2), escucha eventos `sbe:sync-*` | ~35 | ✅ |
| 8.2 | Crear `diseno/wizard/ui-sidebar.js` — grupos colapsables del sidebar, `abrirGrupoActivo`, menú hamburguesa | ~50 | ✅ |
| 8.3 | Crear `diseno/wizard/ui-helpers.js` — `showToast`, `mostrarCelebracion`, `setFocusMode`, `inyectarBotonesCopiar`, `actualizarProgressBar`, botones Regresar, toast autoguardado, validación blur sección Datos, clase `btn-ia` | ~200 | ✅ |
| 8.4 | Crear `diseno/wizard/ui-writing.js` — escritura con delay (efecto typewriter para sugerencias IA) | ~35 | ✅ |
| 8.5 | Crear `diseno/wizard/navigation.js` — `mostrarSeccionPrincipal`, `obtenerSiguiente`, `cambiarSeccion`, `desbloquear`, modo libre de navegación (W#4), navegación teclado Alt+←/→ (W#8) | ~120 | ✅ |

---

### SPRINT 9 — Split `diseno/app.js`: módulos de steps (pasos del wizard)

| # | Subsprint | Funciones que contiene | Líneas aprox. | Estado |
|---|---|---|---|---|
| 9.1 | Crear `diseno/wizard/step-datos.js` — `cargarDatosCurso`, `guardarDatosCurso`, `validarDatosCurso`, `limpiarErroresDatos`, `mostrarErrorDatos` + autocompletar perfil instructor (W#7) | ~220 | ✅ |
| 9.2 | Crear `diseno/wizard/step-objetivos.js` — `cargarObjetivos`, `guardarObjetivos`, `guardarObjetivoLibre`, `validar` (cognitivo/psicomotriz/afectivo), `marcarCompleta`, `aplicarModoObjetivos`, `reiniciarAvanceObjetivosEstricto`, `intentarGenerarGeneral`, `objetivosTienenTextoMinimo`, `habilitarBeneficios` | ~250 | ✅ |
| 9.3 | Crear `diseno/wizard/step-beneficios.js` — `cargarBeneficios`, `guardarBeneficios`, `validarBeneficios` | ~130 | ✅ |
| 9.4 | Crear `diseno/wizard/step-temario.js` — `cargarTemario`, `guardarTemarioTemporal`, `guardarTemarioFinal`, `renderTemario`, `renderListaTemas`, `agregarTema`, `validarTemario`, `limpiarErroresTemario`, `temarioTieneDatos` | ~265 | ✅ |
| 9.5 | Crear `diseno/wizard/step-encuadre.js` — `cargarEncuadre`, `recolectarEncuadre`, `inicializarContratoPorDefecto`, `obtenerChecksSeleccionados`, `copiarReglasSeleccionadasATextarea`, `renderAcuerdosPersonalizados`, `agregarAcuerdoPersonalizado`, `guardarEncuadreTemporal`, `guardarEncuadreFinal`, `validarPreguntas`, `validarReglas`, `validarContrato`, `guardarPreguntasFinal` | ~290 | ✅ |
| 9.6 | Crear `diseno/wizard/step-tecnicas.js` — `recolectarTecnicas`, `cargarTecnicas`, `validarIntegracion`, `validarEnergizante`, `guardarTecnicasFinal`, `guardarTecnicasTemporal`, `restaurarDetalleIntegracionGuardado`, `restaurarNavegacionTecnicas`, `actualizarCamposPersonalizadosTecnicas`, `inicializarTecnicasPersonalizadasPorDefecto`, `obtenerRadioSeleccionado`, `buscarTecnica` | ~280 | ✅ |
| 9.7 | Crear `diseno/wizard/step-detalle-tecnicas.js` — `mostrarDetalleIntegracion`, `mostrarDetalleEnergizante` (renderizado de tablas de técnicas grupales) | ~100 | ✅ |
| 9.8 | Crear `diseno/wizard/step-expositiva.js` — `cargarExpositiva`, `recolectarExpositiva`, `guardarExpositivaTemporal`, `guardarExpositivaFinal`, `validarExpositiva`, `cargarObjetivoCognitivoExpositiva` | ~140 | ✅ |
| 9.9 | Crear `diseno/wizard/step-demostrativa.js` — `cargarDemostrativa`, `recolectarDemostrativa`, `guardarDemostrativaTemporal`, `guardarDemostrativaFinal`, `validarDemostrativa`, `cargarObjetivoPsicomotrizDemostrativa` | ~120 | ✅ |
| 9.10 | Crear `diseno/wizard/step-dialogo.js` — `cargarDialogo`, `recolectarDialogo`, `guardarDialogoTemporal`, `guardarDialogoFinal`, `validarDialogo`, `cargarObjetivoAfectivoDialogo` | ~110 | ✅ |
| 9.11 | Crear `diseno/wizard/step-cierre.js` — `cargarCierre`, `recolectarCierre`, `guardarCierreTemporal`, `guardarCierreFinal`, `validarCierre` | ~100 | ✅ |
| 9.12 | Crear `diseno/wizard/step-evaluaciones.js` — `cargarEvaluaciones`, `recolectarEvaluaciones`, `guardarEvaluacionesTemporal`, `guardarEvaluacionesFinal`, `validarEvaluaciones`, `actualizarPorcentajesEvaluacion`, `actualizarBotonDescripcionGeneral` | ~150 | ✅ |
| 9.13 | Crear `diseno/wizard/step-tiempos.js` — `cargarTiempos`, `guardarTiemposTemporal`, `renderTiempos`, `actualizarSubtotalesTiempos`, `actualizarTotalTiempos` | ~150 | ✅ |
| 9.14 | Crear `diseno/wizard/step-materiales.js` — `cargarMateriales`, `guardarMateriales`, `mensajeError`, `resetChecks` | ~100 | ✅ |
| 9.15 | Crear `diseno/wizard/step-formatos.js` — `poblarResumenExpediente` (W#9), `validarExpedienteCompleto` | ~85 | ✅ |

---

### SPRINT 10 — Split `diseno/app.js`: módulos de IA

| # | Subsprint | Funciones que contiene | Líneas aprox. | Estado |
|---|---|---|---|---|
| 10.1 | Crear `diseno/wizard/ia-objetivos.js` — `evaluateText`, `generarGeneral` (genera objetivo general con IA a partir de los 3 objetivos) | ~130 | ✅ |
| 10.2 | Crear `diseno/wizard/ia-temario.js` — `generarTemarioIA` | ~80 | ✅ |
| 10.3 | Crear `diseno/wizard/ia-encuadre.js` — `generarPreguntasEncuadreIA` (la función más grande del bloque de encuadre, ~337 líneas en app.js — dividir en dos partes si supera 300) | ~290 | ✅ |
| 10.4 | Crear `diseno/wizard/ia-tecnicas.js` — `generarExpositivaIA`, `generarDemostrativaIA` | ~170 | ✅ |
| 10.5 | Crear `diseno/wizard/ia-dialogo.js` — `generarDialogoIA` | ~70 | ✅ |
| 10.6 | Crear `diseno/wizard/ia-cierre.js` — `generarCierreIA`, `generarDescripcionGeneralIA` | ~160 | ✅ |
| 10.7 | Crear `diseno/wizard/ia-resumen.js` — `generarResumenIA`, `generarCompromisosIA` | ~200 | ✅ |
| 10.8 | Crear `diseno/wizard/ia-evaluacion.js` — `generarEvaluacionIA`, `generarFormativaIA` | ~200 | ✅ |
| 10.9 | Crear `diseno/wizard/ia-materiales.js` — `generarMaterialesIA` (por técnica individual), `generarClasificacionIA` (clasifica texto en 6 categorías EC0217) | ~265 | ✅ |
| 10.10 | Actualizar `diseno/wizard/main.js`: importar todos los módulos de IA creados en este sprint | wizard/main.js | — | ✅ |

---

### SPRINT 11 — Export y `app.js` final

| # | Subsprint | Archivos | Estado |
|---|---|---|---|
| 11.1 | Crear `diseno/wizard/export.js` — `descargarPlaneacionFinal`: arma el payload completo del wizard, llama `/generate-doc/planeacion`, maneja el ZIP, `mostrarCelebracion` | nuevo | ✅ |
| 11.2 | Crear `diseno/wizard/validators.js` — validaciones normativas EC0217: tiempo mínimo 120 minutos, taxonomías de objetivos de Bloom, categorías de materiales. Exporta `validarTiempos`, `validarTaxonomia` | nuevo | ✅ |
| 11.3 | Actualizar `diseno/wizard/main.js` con todos los imports finales + bootstrap `initWizardApp` async | wizard/main.js | ✅ |
| 11.4 | Vaciar `diseno/app.js` — reemplazado por comentario de redirección. Datos de técnicas → `wizard/tecnicas-data.js`. Globales `sbeX` inicializados en cada `initX()`. Bootstrap IIFE movido a `main.js`. `index.html` eliminó `<script src="app.js">`. | app.js | ✅ |

---

### SPRINT 12 — Split `diseno/shared.js` (497 líneas)

| # | Subsprint | Archivos | Líneas aprox. | Estado |
|---|---|---|---|---|
| 12.1 | Leer `shared.js` completo — secciones: modales (7–155), fetch+utils (157–260), speed-dial (261–541), logEvento (543–557). Sin validadores (ya están en `wizard/validators.js` del S11.2) | — | — | ✅ |
| 12.2 | Crear `diseno/shared/modals.js` — `initCustomModals`, `_cmGetModal`, `_cmSetContent`, `showAlert`, `showConfirm`, `_cmDetectIcon`, `_cmDetectTitle` | nuevo | 145 | ✅ |
| 12.3 | Crear `diseno/shared/utils.js` — `BACKEND_URL`, `FETCH_TIMEOUT_MS`, `mensajeAmigable`, `fetchConTimeout`, `authGuard` stub, `migrarALocalStorage`, `getData`, `saveData`, `recolectarPayload` (no había validators en shared.js) | nuevo | 95 | ✅ |
| 12.4 | Crear `diseno/shared/events.js` — `logEvento` (registro en Supabase event_logs) | nuevo | 15 | ✅ |
| 12.4b | Crear `diseno/shared/speed-dial.js` — `initSpeedDial` IIFE completo (botón 🧪, descargar, importar, limpiar) | nuevo | 250 | ✅ |
| 12.5 | Actualizar HTML que cargan `shared.js`: solo `index.html` y `datos.html` (los demás no lo usaban). Reemplazado por 4 scripts en orden correcto. `shared.js` vaciado con comentario redirect. | index.html, datos.html | — | ✅ |

---

### SPRINT 13 — Split `diseno/storage.js` (387 líneas)

| # | Subsprint | Archivos | Líneas aprox. | Estado |
|---|---|---|---|---|
| 13.1 | Mapear `storage.js`: único IIFE, secciones — cache/interceptores (1–155), helpers estado (87–121), toast (123–154), sync (156–258), init (260–348), limpiar/flushSync/API (350–387). `getData`/`setData` no están aquí (ya estaban en `shared/utils.js`). | — | — | ✅ |
| 13.2 | Crear `diseno/storage/core.js` — IIFE: DEBOUNCE_MS, PASOS, estado privado (_cache, _adminMode, _syncing…), interceptores localStorage, helpers (recolectarEstado, restaurarEstado, calcularPasoActual, _limpiarCache), toast, emitir. Expone `window._sbeCore` con getters/setters. Llama `window._sbeSync?.schedule()` en setItem. | nuevo | 164 | ✅ |
| 13.3 | Crear `diseno/storage/sync.js` — IIFE: usa `_c = window._sbeCore`, implementa scheduleSyncToSupabase, syncToSupabase, init, limpiar, flushSync. Expone `window._sbeSync` (puente interno) y `window.storageSync` (API pública). | nuevo | 229 | ✅ |
| 13.4 | Actualizar `diseno/index.html`: `<script src="storage.js">` → dos scripts en orden (core.js → sync.js). `storage.js` vaciado con comentario redirect. Solo index.html usaba storage.js. | index.html | — | ✅ |

---

### SPRINT 14 — Split `diseno/soporte-widget.js` (454 líneas)

| # | Subsprint | Archivos | Líneas | Estado |
|---|---|---|---|---|
| 14.1 | Mapear soporte-widget.js: md() (1–35), PAGE_MAP/session (37–102), estado+DOM (104–190), toggle (192–207), mensajes (209–241), chat SSE (242–332), tickets (334–414), votación (416–443), init (445–454). Estado compartido → `window._sbeW`. | — | — | ✅ |
| 14.2 | Crear `diseno/soporte/widget-main.js` — IIFE: BACKEND, SESSION_TTL, md(), PAGE_MAP, getPageCtx, session management, inicializa `window._sbeW` con estado compartido y utilidades | nuevo | 111 | ✅ |
| 14.3 | Crear `diseno/soporte/widget-ui.js` — IIFE: injectCSS, buildWidget (event listeners via `_w.*` para late binding), toggleWidget, _startConversation. Registra en `_sbeW`. | nuevo | 105 | ✅ |
| 14.4 | Crear `diseno/soporte/widget-chat.js` — IIFE: _addMsg, _showTyping, _hideTyping, setSendDisabled, sendMsg (SSE), _addVoteRow, window._sbVote. Registra en `_sbeW`. | nuevo | 161 | ✅ |
| 14.5 | Crear `diseno/soporte/widget-tickets.js` — IIFE: _offerTicket, window._sbeOpenTicket, closeTicketForm, submitTicket. Registra en `_sbeW`. Init al final (todos los módulos listos). | nuevo | 100 | ✅ |
| 14.6 | Actualizar 11 HTML que cargaban soporte-widget.js: index, landing, login, pago, registro, checkout-success, reset-password, recursos (sin indent) + erp-admin, mi-expediente, panel (2 espacios). soporte-widget.js vaciado. | 11 archivos | — | ✅ |

---

### SPRINT 15 — Dividir `diseno/panel.js` (extraído en Sprint 6, ~3,522 líneas)

> **Prerequisito:** Sprint 6.2 completado.

| # | Subsprint | Archivos | Líneas aprox. | Estado |
|---|---|---|---|---|
| 15.1 | Mapear secciones de `panel.js`: identificar funciones por pestaña del panel | — | — | ✅ |
| 15.2 | Crear `diseno/panel/panel-shared.js` — BACKEND_URL, globals var, apiFetch, mostrarToast, role switcher (determinarRoles, renderRoleSwitcher, switchRol, cargarPanel) | nuevo | 74 | ✅ |
| 15.3 | Crear `diseno/panel/panel-alumno.js` — Panel alumno completo + asesor + evaluador + _tiempoRel | nuevo | 342 | ✅ |
| 15.4 | Crear `diseno/panel/panel-admin-usuarios.js` — admInit, admShowTab, admCargarStats, admCargarUsuarios, admRenderTablaUsuarios, admToggleUsuario, admEliminarUsuario | nuevo | 216 | ✅ |
| 15.5 | Crear `diseno/panel/panel-admin-codigos.js` — admCargarCodigos, admGenerarCodigo, admEliminarCodigo, admCopiarCodigo | nuevo | 168 | ✅ |
| 15.6 | Crear `diseno/panel/panel-admin-planeaciones.js` — admCargarMisCursos, modals de transferir/user-cursos/promover, ficha de contacto | nuevo | 225 | ✅ |
| 15.7 | Crear `diseno/panel/panel-sa-init.js` — saInit, saShowTab, saCargarStats, saVerDetalleAdmin, saEditarCreditos, vigencia utils | nuevo | 229 | ✅ |
| 15.8 | Crear `diseno/panel/panel-sa-vigencias.js` — saVerDetalleAlumno, saBuscarUsuario, saCargarVigencia, saAbrirModalRenovar, saConfirmarCrearAdmin | nuevo | 274 | ✅ |
| 15.9 | Crear `diseno/panel/panel-sa-integraciones.js` — _SA_INTEG_META, _sa_classifyError, verificarIntegraciones | nuevo | 135 | ✅ |
| 15.9b | Crear `diseno/panel/panel-sa-usuarios.js` — saCrearUsuario, saToggleUsuarioSA, saAbrirReasignar, saAbrirEliminarUsuario, saResetPassword | nuevo | 229 | ✅ |
| 15.9c | Crear `diseno/panel/panel-sa-plataforma.js` — saCargarCursos, saCargarCursosPorAdmin, saAbrirTransferirSA, saCargarAuditLog | nuevo | 274 | ✅ |
| 15.9d | Crear `diseno/panel/panel-sa-tabla.js` — saCargarTablaUnificada, saRenderTablaUnificada, saToggleRol, sa_RefrescarFilaRoles | nuevo | 340 | ✅ |
| 15.9e | Crear `diseno/panel/panel-sa-templates.js` — saCargarPlantillas, saEditarTemplate, saGuardarTemplate, saTestearTemplate | nuevo | 143 | ✅ |
| 15.9f | Crear `diseno/panel/panel-sa-logs.js` — _esc, saShowSoporteTab, saCargarLogs, saCargarKB, sa_CargarBadges | nuevo | 129 | ✅ |
| 15.9g | Crear `diseno/panel/panel-sa-tickets.js` — saCargarTicketsSA, saAbrirTicketSA, saResolverTicketSA | nuevo | 176 | ✅ |
| 15.9h | Crear `diseno/panel/panel-sa-kb.js` — saCargarFaqs, saGuardarFaq, saCargarRecursos, saGuardarRecurso | nuevo | 253 | ✅ |
| 15.9i | Crear `diseno/panel/panel-sa-sugerencias.js` — saCargarBajoRendimiento, saCargarSugerencias, sa_RenderSugerencias, saAccionSugerencia | nuevo | 270 | ✅ |
| 15.10 | Crear `diseno/panel/panel-main.js` — init() + init() call (entry point) | nuevo | 27 | ✅ |
| 15.11 | Actualizar `diseno/panel.html`: reemplazar `<script src="panel.js">` por 17 scripts de `panel/`. Vaciar `panel.js` con comentario redirect. | panel.html | ✅ |

---

### SPRINT 16 — Dividir `diseno/erp-admin.js` (extraído en Sprint 6, ~751 líneas)

> **Prerequisito:** Sprint 6.4 completado.

| # | Subsprint | Archivos | Líneas | Estado |
|---|---|---|---|---|
| 16.1 | Mapear secciones de `erp-admin.js` — 8 secciones identificadas | — | — | ✅ |
| 16.2 | Crear `diseno/erp/erp-shared.js` — BACKEND_URL, globals, toast, switchTab, modal helpers, fmtFechaCorta, iniciales, apiFetch | nuevo | 52 | ✅ |
| 16.3 | Crear `diseno/erp/erp-init.js` — init(), cargarNormas, cargarPersonas, cargarAlumnos, actualizarStats | nuevo | 67 | ✅ |
| 16.4 | Crear `diseno/erp/erp-alumnos.js` — renderTablaAlumnos, filtrarAlumnos, verDetalle | nuevo | 130 | ✅ |
| 16.5 | Crear `diseno/erp/erp-asignaciones.js` — abrirModalPago/registrarPago, abrirModalEvaluado/registrarEvaluado, abrirModalLote/registrarLote, poblarSelectsInscripcion, inscribirAlumno | nuevo | 246 | ✅ |
| 16.6 | Crear `diseno/erp/erp-roles.js` — cargarRoles, abrirModalAsignarRol, asignarRol, quitarRol | nuevo | 73 | ✅ |
| 16.7 | Crear `diseno/erp/erp-normas.js` — cargarNormasTabla, abrirModalNorma, guardarNorma, _style injection. `erp-main.js` — entry point `init()` | nuevo | 88+1 | ✅ |
| 16.8 | Actualizar `diseno/erp-admin.html`: 7 scripts de `erp/`. Vaciar `erp-admin.js` con redirect. | erp-admin.html | — | ✅ |

---

### SPRINT 17 — HTML estructural grande (index.html y panel.html)

> **Prerequisito:** Sprints 7–11 y Sprint 15 completados. index.html debe estar usando ES Modules.

| # | Subsprint | Descripción | Estado |
|---|---|---|---|
| 17.1 | `getTemplate()` en `step-datos.js` + seccionDatos movida | ✅ |
| 17.2 | `getTemplate()` en `step-objetivos.js` + seccionObjetivos movida | ✅ |
| 17.3 | `getTemplate()` en `step-beneficios.js` + seccionBeneficios movida | ✅ |
| 17.4 | `getTemplate()` en `step-temario.js` + seccionTemario movida | ✅ |
| 17.5 | `getTemplate()` en `step-encuadre.js` (seccionPreguntas). seccionReglas → `html-reglas.js`. seccionContrato → `html-contrato.js`. seccionIntegracion → `html-integracion.js` | ✅ |
| 17.6 | `getTemplate()` en `step-expositiva.js` + seccionExpositiva movida | ✅ |
| 17.7 | `getTemplate()` en `step-demostrativa.js` + seccionDemostrativa movida | ✅ |
| 17.8 | `getTemplate()` en `step-detalle-tecnicas.js` + seccionEnergizante movida | ✅ |
| 17.9 | `getTemplate()` en `step-dialogo.js` + seccionDialogo movida | ✅ |
| 17.10 | `getTemplate()` en `step-cierre.js` + seccionCierre movida | ✅ |
| 17.11 | `getTemplate()` en `step-evaluaciones.js` + seccionEvaluaciones movida | ✅ |
| 17.12 | `getTemplate()` en `step-tiempos.js` + seccionTiempos movida | ✅ |
| 17.13 | `getTemplate()` en `step-materiales.js` + seccionMateriales movida | ✅ |
| 17.14 | `getTemplate()` en `step-formatos.js` + seccionFormatos movida | ✅ |
| 17.15 | `getSidebarHTML()` en `ui-sidebar.js`. `main.js` inyecta sidebar + 17 secciones. `index.html` → 77 líneas ✅ | ✅ |
| 17.16 | `panel.html` — mover HTML de cada sección (usuarios, planeaciones, soporte, admins, logs, ERP) a templates en `panel/` → panel.html queda ~80 líneas | ✅ |

---

### SPRINT 18 — Verificación final y cierre

| # | Subsprint | Estado |
|---|---|---|
| 18.1 | Ejecutar script de verificación: `Get-ChildItem -Recurse *.js,*.py,*.html,*.css \| Where Lines -gt 300` → resultado debe ser vacío | ✅ |
| 18.2 | Smoke test completo: login como user → wizard paso 1 a 16 → descarga ZIP → verificar 10 documentos | ✅ |
| 18.3 | Smoke test panel: login como admin → gestionar usuarios → login como superadmin → asignar créditos → panel logs | ✅ |
| 18.4 | Smoke test soporte: widget en landing → chat IA → crear ticket → resolver desde panel → feedback loop | ✅ |
| 18.5 | Eliminar archivos originales obsoletos: `diseno/app.js` monolítico (si ya es un redirect), `backend/generar_planeacion.js` | ✅ |
| 18.6 | Actualizar `ARCHITECTURE.md`: nueva estructura de carpetas y archivos | ✅ |

---

## Resumen del backlog

| Sprint | Descripción | Subsprints | Riesgo |
|---|---|---|---|
| 1A–1J | Limpiar `main.py` | 29 | Bajo |
| 2 | Split `soporte_router.py` | 8 | Bajo |
| 3 | Split `erp_router.py` | 9 | Bajo |
| 4 | Split `generar_planeacion.js` | 11 | Medio |
| 5 | CSS modular (`styles.css`) | 9 | Muy bajo |
| 6 | Extraer CSS/JS de HTML grandes | 11 | Muy bajo |
| 7 | Preparación ES Modules | 5 | Medio |
| 8 | `app.js`: UI y navegación | 5 | Alto |
| 9 | `app.js`: Steps del wizard | 15 | Alto |
| 10 | `app.js`: Módulos de IA | 10 | Alto ✅ |
| 11 | `app.js`: Export y cierre | 4 | Alto ✅ |
| 12 | Split `shared.js` | 5 | Medio |
| 13 | Split `storage.js` | 4 | Medio |
| 14 | Split `soporte-widget.js` | 5 | Medio |
| 15 | Split `panel.js` | 11 | Alto |
| 16 | Split `erp-admin.js` | 7 | Medio |
| 17 | HTML estructural grande | 16 | Alto |
| 18 | Verificación y cierre | 6 | — |
| **Total** | | **170** | |

---

## Orden de ejecución recomendado

```
Sprint 1 (backend) → Sprint 2 → Sprint 3 → Sprint 4
    ↓ deploy backend limpio
Sprint 5 (CSS) → Sprint 6 (extraer inline)
    ↓ frontend más limpio, sin tocar lógica
Sprint 7 (ES modules setup) → Sprint 8 → Sprint 9 → Sprint 10 → Sprint 11
    ↓ app.js completamente modularizado
Sprint 12 → Sprint 13 → Sprint 14
    ↓ shared.js, storage.js, widget divididos
Sprint 15 → Sprint 16
    ↓ panel.js y erp-admin.js divididos
Sprint 17 (HTML estructural — el más riesgoso)
    ↓
Sprint 18 (verificación final)
```

> **Regla de oro:** Nunca ejecutar dos sprints de riesgo Alto en la misma sesión. Siempre terminar, probar y hacer `git push` antes de iniciar el siguiente.
