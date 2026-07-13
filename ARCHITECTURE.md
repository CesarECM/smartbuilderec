# Arquitectura SmartBuilderEC

**Última actualización:** 2026-07-12 (post MPS-001 refactoring)

Stack: FastAPI (Python) + Vanilla JS (ES Modules) + Supabase + Vercel

---

## Backend (`backend/`)

### Punto de entrada

```
backend/
└── main.py          # FastAPI app, CORS, middlewares, include_router (~61 líneas)
```

### Middleware

```
backend/middleware/
└── jwt_auth.py      # JWTAuthMiddleware, _es_publico, _get_public_key
```

### Modelos Pydantic

```
backend/models/
├── ia_models.py     # EvaluationRequest, GeneralRequest, BeneficiosRequest, TemarioRequest,
│                    # PreguntasRequest, ExpositivaRequest, DemostrativaRequest, DialogoRequest,
│                    # CierreRequest, DescripcionGeneralRequest, EvaluacionIARequest,
│                    # MaterialesRequest, ResumenRequest, CompromisosRequest
├── wizard_models.py # DatosInfo, ObjetivosInfo, TemarioInfo, EncuadreInfo, TecnicasInfo,
│                    # EvaluacionesInfo, TiempoFila, TiempoBloque, PlaneacionRequest,
│                    # ObjetivosRequest, TokenRequest
├── admin_models.py  # CreateUserRequest
├── erp_models.py    # NormaUpsert, AsignacionRequest, PagoManualRequest, EvaluadoRequest,
│                    # LoteEnviadoRequest, CertificadoRecibidoRequest, AsignarRolRequest
└── soporte_models.py # SesionInitRequest, ChatRequest, TicketRequest, FAQCreate, FAQUpdate,
                      # RecursoCreate, TicketUpdate, SugerenciaAction, VotoFAQs
                      # helpers: _get_user, _require_superadmin, _require_admin
```

### Servicios

```
backend/services/
├── doc_helpers.py        # tabla_encabezado, _docx_bytes, _titulo, crear_zip_con_docx,
│                         # limpiar_nombre_archivo, _validar_expediente, _calc_content_len, load_prompt
├── doc_objetivos.py      # crear_docx_objetivos
├── doc_evaluaciones.py   # generar_evaluacion_diagnostica, generar_evaluacion_formativa_cotejo,
│                         # generar_evaluacion_formativa_guia, generar_evaluacion_sumativa,
│                         # generar_evaluacion_reaccion, generar_lista_asistencia
├── doc_planeacion.py     # generar_presentacion_curso
├── doc_generales.py      # generar_contrato_aprendizaje, generar_lista_requerimientos
├── erp_helpers.py        # _caller, _get_profile, _require_role, _get_extra_roles,
│                         # _is_evaluador, _is_asesor, _can_manage_alumno, _is_assigned_as,
│                         # _build_cert_status
├── soporte_feedback.py   # _analizar_resolucion_sync (feedback loop Claude Haiku)
├── rag_service.py        # búsqueda semántica en knowledge base
├── embeddings_service.py # generación de embeddings
├── email_service.py      # envío de correos transaccionales
└── capi.py               # Facebook Conversions API
```

### Routers

```
backend/routers/
│
│  # IA — generación de contenido con Claude/OpenAI
├── ia_planeacion_router.py  # /evaluate, /generate-general, /generate-beneficios,
│                             # /generate-temario, /generate-preguntas
├── ia_tecnicas_router.py    # /generate-expositiva, /generate-demostrativa, /generate-dialogo
├── ia_cierre_router.py      # /generate-resumen, /generate-compromisos, /generate-cierre,
│                             # /generate-descripcion-general
├── ia_evaluacion_router.py  # /generate-evaluacion-diagnostica, /generate-evaluacion-sumativa,
│                             # /generate-formativa
├── ia_materiales_router.py  # /generate-materiales-clasificados, /generate-materiales
│
│  # Documentos
├── docs_router.py           # /generate-doc/objetivos, /generate-doc/planeacion (ZIP)
│
│  # Salud y administración
├── health_router.py         # /health/integraciones + helpers internos
├── cron_admin_router.py     # /admin/create-user, /admin/users/{id}, /admin/cron/vigencias,
│                             # /perfil, /validate-token
├── admin_router.py          # rutas de administración general
├── alumno_router.py         # rutas del panel alumno
├── email_router.py          # envío de emails
├── stripe_router.py         # webhooks y pagos Stripe
│
│  # ERP (re-exportador)
├── erp_router.py            # agrega sub-routers de erp/
└── erp/
    ├── normas_router.py         # listar_normas, crear_norma, actualizar_norma
    ├── alumnos_lista.py         # listar_alumnos (filtros + joins Supabase)
    ├── alumnos_detalle.py       # detalle_alumno, mis_servicios
    ├── asignaciones_router.py   # crear_asignacion, listar_asignaciones, eliminar_asignacion,
    │                             # registrar_pago_manual, eliminar_pago, pagos_pendientes
    ├── certificacion_router.py  # _upsert_proceso, registrar_evaluado, registrar_lote_enviado,
    │                             # registrar_certificado_recibido, status_certificacion
    └── roles_router.py          # asignar_rol, quitar_rol, listar_roles, resumen_global

│  # Soporte IA (re-exportador)
├── soporte_router.py        # agrega sub-routers de soporte/
└── soporte/
    ├── chat_router.py           # init_sesion, soporte_chat (SSE streaming), _track_exposiciones,
    │                             # _persist_transcript
    ├── tickets_router.py        # crear_ticket, listar_tickets, get_ticket, actualizar_ticket
    │                             # background tasks: _confirmar_ticket_usuario, _notificar_admin_ticket
    ├── kb_router.py             # FAQs CRUD + votos, bajo-rendimiento, recursos blog
    ├── sugerencias_router.py    # listar_sugerencias, gestionar_sugerencia
    ├── cron_router.py           # cron_analizar_patrones
    └── cron_calidad_router.py   # cron_analizar_calidad_faqs

│  # API v1 (Panel Alumno MVP)
└── api_v1/
    ├── router.py    # agrega sub-routers api_v1
    ├── auth.py      # autenticación
    ├── users.py     # perfil de usuario
    ├── courses.py   # planeaciones/cursos del alumno
    ├── documents.py # documentos generados
    ├── payments.py  # historial de pagos
    ├── stats.py     # estadísticas
    └── webhooks.py  # webhooks externos
```

### Generador de documentos Node.js

```
backend/generators/
├── index.js                # entry point: lee payload stdin → escribe archivo salida
├── constants.js            # colores, medidas, estilos base (AZUL, CM, TW, borde…)
├── text-helpers.js         # txt, txtS, linesToParas, actParas, formatDuracion
├── cell-helpers.js         # headerCell, subHeaderCell, labelCell, valueCell, obtenerTiempo
├── tabla-info.js           # tablaInfoGeneral
├── tabla-objetivos.js      # tablaObjetivos
├── tabla-requerimientos.js # tablaRequerimientos
├── tabla-evaluaciones.js   # tablaEvaluaciones
├── tabla-secciones.js      # tablaSeccion, tablaDesarrollo
├── doc-content.js          # arrays de filas para cada sección del documento
└── doc-builder.js          # generarDoc — orquesta tablas y ensambla Document (docx)
```

---

## Frontend (`diseno/`)

### Páginas HTML

```
diseno/
├── index.html           # Wizard EC0217 (16 pasos) — ES Modules, ~60 líneas
├── panel.html           # Panel unificado (alumno + admin + superadmin) — ~75 líneas
├── landing.html         # Landing pública (~292 líneas)
├── login.html           # Login / registro
├── registro.html        # Registro nuevo usuario
├── pago.html            # Checkout de pago
├── checkout-success.html
├── mi-expediente.html   # Expediente del evaluado
├── datos.html           # Formulario de datos complementarios
├── recursos.html        # Blog / recursos públicos
├── catalogo.html        # Catálogo de cursos
├── erp-admin.html       # Panel ERP (evaluadores/asesores)
├── reset-password.html
├── ingresoToken.html
├── admin.html           # redirect → panel.html
├── dashboard.html       # redirect → panel.html
└── superadmin.html      # redirect → panel.html
```

### CSS global

```
diseno/styles/
├── main.css        # solo @import de los 7 módulos (usado por todos los HTML)
├── variables.css   # custom properties: colores, tipografía, espaciado, sombras
├── base.css        # reset, body, html, tipografía global
├── components.css  # botones, toast, celebration, loader, speed-dial, token
├── forms.css       # form-group, inputs, textareas, checkbox-list, radio-card
├── layout.css      # layout, sidebar, .card, custom modals (.cm-*)
├── wizard.css      # progress bar, wizard-section, tabs, temario, tiempos, evaluaciones
└── responsive.css  # todos los @media queries
```

### CSS específico por módulo

```
diseno/
├── panel.css              # variables + estilos base del panel
├── panel-sa.css           # superadmin — estilos propios
├── panel-sa-modules.css   # superadmin — módulos y tabs
├── panel-tables.css       # tablas del panel (compartido admin + SA)
├── erp-admin.css          # ERP panel
├── index.css              # overrides del wizard
├── landing.css            # landing pública
├── landing-sections.css   # secciones de la landing
├── mi-expediente.css      # expediente
├── pago.css               # checkout
├── recursos.css           # blog recursos
├── login.css              # login / registro
├── reset-password.css     # reset password
└── soporte-widget.css     # widget flotante de soporte
```

### Wizard EC0217 — ES Modules (`diseno/wizard/`)

```
diseno/wizard/
│  # Infraestructura
├── main.js          # entry point: importa todos los módulos, llama init(), bootstrap
├── state.js         # objeto de estado global del wizard (secciones, datos, modo)
├── config.js        # constantes: secciones, tiempos mínimos EC0217, categorías
├── api.js           # llamarIA(endpoint, payload), llamarIAStream — fetch al backend
├── validators.js    # validarTiempos, validarTaxonomia (reglas normativas EC0217)
├── export.js           # descargarPlaneacionFinal — arma payload, llama ZIP, celebración
├── download-tracker.js # saveDownloadSnapshot, hasUnsavedChanges — badge "expediente modificado"
├── tecnicas-data.js    # catálogo de técnicas didácticas (datos estáticos)
│
│  # UI
├── ui-sync.js       # indicador de guardado, barra progreso global, eventos sbe:sync-*
├── ui-sidebar.js    # getSidebarHTML, grupos colapsables, menú hamburguesa
├── ui-helpers.js    # showToast, mostrarCelebracion, setFocusMode, inyectarBotonesCopiar,
│                    # actualizarProgressBar, botones Regresar, validación blur
├── ui-writing.js    # efecto typewriter para sugerencias IA
├── navigation.js    # mostrarSeccionPrincipal, cambiarSeccion, desbloquear, modo libre,
│                    # navegación teclado Alt+←/→
│
│  # Steps del wizard (16 pasos)
├── step-datos.js         # getTemplate + cargar/guardar/validar datos del curso
├── step-objetivos.js     # getTemplate + objetivos cognitivo/psicomotriz/afectivo
├── step-beneficios.js    # getTemplate + cargar/guardar/validar beneficios
├── step-temario.js       # getTemplate + agregar/renderizar/validar temas
├── step-encuadre.js      # getTemplate + preguntas, reglas, contrato, acuerdos
├── step-tecnicas.js      # getTemplate + integradora/energizante, búsqueda técnicas
├── step-detalle-tecnicas.js # getTemplate + renderizado de tablas de técnicas grupales
├── step-expositiva.js    # getTemplate + técnica expositiva
├── step-demostrativa.js  # getTemplate + técnica demostrativa
├── step-dialogo.js       # getTemplate + técnica de diálogo
├── step-cierre.js        # getTemplate + actividad de cierre
├── step-evaluaciones.js  # getTemplate + evaluaciones + porcentajes
├── step-tiempos.js       # getTemplate + cálculo subtotales/totales
├── step-materiales.js    # getTemplate + checklist de materiales
├── step-formatos.js      # getTemplate + resumen expediente (paso 16)
│
│  # HTML templates auxiliares (encuadre)
├── html-reglas.js        # template HTML del bloque de reglas/acuerdos
├── html-contrato.js      # template HTML del contrato de aprendizaje
├── html-integracion.js   # template HTML de técnica integradora
│
│  # Módulos de IA
├── ia-objetivos.js    # evaluateText, generarGeneral
├── ia-temario.js      # generarTemarioIA
├── ia-encuadre.js     # generarPreguntasEncuadreIA
├── ia-tecnicas.js     # generarExpositivaIA, generarDemostrativaIA
├── ia-dialogo.js      # generarDialogoIA
├── ia-cierre.js       # generarCierreIA, generarDescripcionGeneralIA
├── ia-resumen.js      # generarResumenIA, generarCompromisosIA
├── ia-evaluacion.js   # generarEvaluacionIA, generarFormativaIA
└── ia-materiales.js   # generarMaterialesIA, generarClasificacionIA
```

### Panel Unificado (`diseno/panel/`)

```
diseno/panel/
│  # Infraestructura
├── panel-main.js    # entry point: llama init()
├── panel-shared.js  # BACKEND_URL, apiFetch, mostrarToast, determinarRoles,
│                    # renderRoleSwitcher, switchRol, cargarPanel
│
│  # Vista alumno / asesor / evaluador
├── panel-alumno.js  # Panel alumno completo + asesor + evaluador + _tiempoRel
│
│  # Vista admin
├── panel-admin-usuarios.js    # admInit, admShowTab, admCargarStats, admCargarUsuarios,
│                               # admRenderTablaUsuarios, admToggleUsuario, admEliminarUsuario
├── panel-admin-codigos.js     # admCargarCodigos, admGenerarCodigo, admEliminarCodigo
├── panel-admin-planeaciones.js # admCargarMisCursos, modals transferir/user-cursos/promover
├── panel-roles.js             # gestión de roles para admin
│
│  # Vista superadmin
├── panel-sa-init.js           # saInit, saShowTab, saCargarStats, saVerDetalleAdmin,
│                               # saEditarCreditos, vigencia utils
├── panel-sa-vigencias.js      # saVerDetalleAlumno, saBuscarUsuario, saCargarVigencia,
│                               # saAbrirModalRenovar, saConfirmarCrearAdmin
├── panel-sa-tabla.js          # saCargarTablaUnificada, saRenderTablaUnificada, saToggleRol
├── panel-sa-usuarios.js       # saCrearUsuario, saToggleUsuarioSA, saAbrirReasignar,
│                               # saAbrirEliminarUsuario, saResetPassword
├── panel-sa-plataforma.js     # saCargarCursos, saCargarCursosPorAdmin, saAbrirTransferirSA,
│                               # saCargarAuditLog
├── panel-sa-integraciones.js  # _SA_INTEG_META, _sa_classifyError, verificarIntegraciones
├── panel-sa-roles.js          # gestión de roles superadmin
├── panel-sa-logs.js           # _esc, saShowSoporteTab, saCargarLogs, saCargarKB, sa_CargarBadges
├── panel-sa-tickets.js        # saCargarTicketsSA, saAbrirTicketSA, saResolverTicketSA
├── panel-sa-kb.js             # saCargarFaqs, saGuardarFaq, saCargarRecursos, saGuardarRecurso
├── panel-sa-sugerencias.js    # saCargarBajoRendimiento, saCargarSugerencias, saAccionSugerencia
├── panel-sa-templates.js      # saCargarPlantillas, saEditarTemplate, saGuardarTemplate
│
│  # Templates HTML
├── tpl-alumno.js          # HTML del panel alumno
├── tpl-admin.js           # HTML del panel admin
├── tpl-modals-adm.js      # Modals del admin
├── tpl-modals-sa.js       # Modals del superadmin
├── tpl-sa-outer.js        # Estructura outer superadmin
├── tpl-sa-resumen.js      # Resumen / stats superadmin
├── tpl-sa-usuarios.js     # Tabla usuarios superadmin
├── tpl-sa-config.js       # Config superadmin
├── tpl-sa-plataforma.js   # Plataforma superadmin
├── tpl-sa-logs.js         # Logs superadmin
└── tpl-sa-soporte.js      # Soporte superadmin
```

### ERP Admin (`diseno/erp/`)

```
diseno/erp/
├── erp-main.js        # entry point: init()
├── erp-shared.js      # BACKEND_URL, toast, switchTab, modal helpers, apiFetch
├── erp-init.js        # cargarNormas, cargarPersonas, cargarAlumnos, actualizarStats
├── erp-alumnos.js     # renderTablaAlumnos, filtrarAlumnos, verDetalle
├── erp-asignaciones.js # modals y registro de pagos/evaluados/lotes/inscripciones
├── erp-roles.js       # cargarRoles, abrirModalAsignarRol, asignarRol, quitarRol
├── erp-normas.js      # cargarNormasTabla, abrirModalNorma, guardarNorma
└── tpl-modals.js      # templates HTML de modals del ERP
```

### Widget de Soporte (`diseno/soporte/`)

```
diseno/soporte/
├── widget-main.js    # IIFE: BACKEND, SESSION_TTL, md(), PAGE_MAP, session management,
│                     # inicializa window._sbeW
├── widget-ui.js      # IIFE: injectCSS, buildWidget, toggleWidget, _startConversation
├── widget-chat.js    # IIFE: _addMsg, _showTyping, sendMsg (SSE), _addVoteRow
└── widget-tickets.js # IIFE: _offerTicket, window._sbeOpenTicket, submitTicket
```

### Storage con sincronización (`diseno/storage/`)

```
diseno/storage/
├── core.js   # IIFE: interceptores localStorage, estado privado, toast, emitir.
│             # Expone window._sbeCore
└── sync.js   # IIFE: scheduleSyncToSupabase, syncToSupabase, flushSync.
              # Expone window._sbeSync y window.storageSync
```

### Shared utilities (`diseno/shared/`)

```
diseno/shared/
├── utils.js      # BACKEND_URL, FETCH_TIMEOUT_MS, mensajeAmigable, fetchConTimeout,
│                 # authGuard, migrarALocalStorage, getData, saveData, recolectarPayload
├── modals.js     # initCustomModals, showAlert, showConfirm, _cmDetectIcon
├── events.js     # logEvento (registro en Supabase event_logs)
└── speed-dial.js # initSpeedDial IIFE — botón 🧪, descargar, importar, limpiar
```

### Scripts globales

```
diseno/
├── auth.js           # flujo de autenticación Supabase (login, signup, logout, callbacks)
├── supabase-client.js # cliente Supabase singleton
├── tokens.js         # gestión de tokens de acceso
├── perfil.js         # carga y edición de perfil del usuario
├── datos.js          # formulario de datos complementarios
├── mi-expediente.js  # lógica del expediente del evaluado
├── mi-expediente-render.js # renderizado de secciones del expediente
├── landing.js        # interactividad de la landing
├── login.js          # formulario de login
├── reset-password.js # flujo de reset de contraseña
├── pago.js           # lógica de checkout
├── recursos.js       # blog / listado de recursos
└── index-init.js     # bootstrap del wizard (auth guard, init, listeners globales)
```

---

## Flujo principal: Generación de planeación

```
index.html (wizard 16 pasos)
    → wizard/main.js (ES Module entry point)
        → wizard/state.js (estado compartido)
        → wizard/step-*.js (16 pasos)
        → wizard/ia-*.js (generación con IA)
        → wizard/export.js
            → POST /generate-doc/planeacion (docs_router.py)
                → backend/generators/index.js (Node.js subprocess)
                    → doc-builder.js → tabla-*.js → *.docx
                → ZIP con todos los documentos
```

## Convenciones

- **Límite de 300 líneas** por archivo (MPS-001, completado 2026-07-12)
- **ES Modules** en wizard (`diseno/wizard/`) e `index.html`
- **IIFE clásicos** en soporte widget y storage (inyección en páginas externas)
- **Re-exportadores** en `erp_router.py` y `soporte_router.py` (agregadores de sub-routers)
- **Templates HTML** en archivos `tpl-*.js` para separar estructura de lógica en panel y ERP
- **Namespaces de ventana**: `window._sbeCore` (storage), `window._sbeSync` (sync),
  `window._sbeW` (widget), `window.storageSync` (API pública)
