-- ═══════════════════════════════════════════════════════════════════
-- SmartBuilderEC — Schemas JSON: EC0217.01 y EC0301.01
-- Sprint 4: Motor Genérico de Wizards
--
-- Ejecutar DESPUÉS de migration_motor_wizards.sql
-- Idempotente: ON CONFLICT DO UPDATE reemplaza el schema activo.
-- ═══════════════════════════════════════════════════════════════════


-- ── EC0217.01 ─────────────────────────────────────────────────────
INSERT INTO public.wizard_schemas (norma_id, version, esquema, activo) VALUES (
'ec0217',
1,
$schema${
  "meta": {
    "codigo": "EC0217.01",
    "nombre": "Diseño de Cursos de Capacitación",
    "color_header": "#1F3B6D",
    "min_duracion": 120,
    "min_participantes": 4
  },
  "secciones": [
    {
      "id": "planeacion",
      "titulo": "Planeación",
      "icono": "📋",
      "pasos": [
        {
          "id": "datos",
          "titulo": "Datos del Curso",
          "numero": 1,
          "campos": [
            {"id":"nombreCurso","tipo":"text","label":"Nombre del curso","requerido":true,"placeholder":"Ej. Manejo de Extintores"},
            {"id":"instructor","tipo":"text","label":"Instructor","requerido":true,"placeholder":"Nombre completo del instructor"},
            {"id":"disenador","tipo":"text","label":"Diseñador","requerido":true,"placeholder":"Nombre completo del diseñador"},
            {"id":"lugar","tipo":"text","label":"Lugar","requerido":true,"placeholder":"Ciudad o instalación"},
            {"id":"fecha","tipo":"date","label":"Fecha","requerido":true},
            {"id":"duracion","tipo":"number","label":"Duración (minutos)","requerido":true,"min":120,"hint":"Mínimo 120 minutos según EC0217.01","placeholder":"Mínimo 120"},
            {"id":"participantes","tipo":"number","label":"Número de participantes","requerido":true,"min":4,"hint":"Mínimo 4 participantes","placeholder":"Mínimo 4"},
            {"id":"perfil","tipo":"textarea","label":"Perfil del participante","requerido":true,"full_width":true,"rows":6,"placeholder":"Describe el perfil: puesto, experiencia previa, nivel educativo...\n\nConocimientos:\nHabilidades:\nActitudes y Valores:"}
          ]
        },
        {
          "id": "objetivos",
          "titulo": "Objetivos de Aprendizaje",
          "numero": 2,
          "tipo_especial": "objetivos_tabs",
          "campos": [
            {"id":"obj_cognitiva","tipo":"textarea","label":"Objetivo Cognitivo","requerido":true,"placeholder":"Redacta el objetivo cognitivo..."},
            {"id":"obj_psicomotriz","tipo":"textarea","label":"Objetivo Psicomotriz","requerido":true,"placeholder":"Redacta el objetivo psicomotriz..."},
            {"id":"obj_afectiva","tipo":"textarea","label":"Objetivo Afectivo","requerido":true,"placeholder":"Redacta el objetivo afectivo..."},
            {"id":"obj_general","tipo":"textarea","label":"Objetivo General","requerido":true,"placeholder":"Redacta el objetivo general del curso...","ai":{"activo":true,"prompt":"Redacta el objetivo general del curso '{{nombreCurso}}' integrando los tres objetivos específicos. Cognitivo: {{obj_cognitiva}} | Psicomotriz: {{obj_psicomotriz}} | Afectivo: {{obj_afectiva}}. El objetivo general debe comenzar con un verbo en infinitivo y sintetizar los tres dominios de aprendizaje.","boton_label":"✨ Generar objetivo general"}}
          ]
        },
        {
          "id": "beneficios",
          "titulo": "Beneficios del Curso",
          "numero": 3,
          "campos": [
            {"id":"beneficios","tipo":"textarea","label":"Beneficios del curso","requerido":true,"full_width":true,"rows":8,"placeholder":"Lista los beneficios del curso para los participantes...","ai":{"activo":true,"prompt":"Lista en forma de viñetas los principales beneficios del curso '{{nombreCurso}}'. Objetivo general: {{obj_general}}. Perfil del participante: {{perfil}}. Escribe entre 5 y 8 beneficios concretos y medibles.","boton_label":"✨ Generar beneficios con IA"}}
          ]
        },
        {
          "id": "temario",
          "titulo": "Temario del Curso",
          "numero": 4,
          "tipo_especial": "temario_unidades",
          "campos": [
            {"id":"temario_u1_titulo","tipo":"text","label":"Título Unidad 1","placeholder":"Ej. Fundamentos"},
            {"id":"temario_u1","tipo":"list","label":"Temas de la Unidad 1","placeholder_item":"Ej. Introducción al tema","ai":{"activo":true,"prompt":"Genera 4-6 temas para la Unidad 1 (introductoria/fundamentos) del curso '{{nombreCurso}}'. Objetivo general: {{obj_general}}.","boton_label":"✨ Generar temas U1"}},
            {"id":"temario_u2_titulo","tipo":"text","label":"Título Unidad 2","placeholder":"Ej. Aplicación Práctica"},
            {"id":"temario_u2","tipo":"list","label":"Temas de la Unidad 2","placeholder_item":"Ej. Procedimiento paso a paso","ai":{"activo":true,"prompt":"Genera 4-6 temas para la Unidad 2 (aplicación práctica) del curso '{{nombreCurso}}'.","boton_label":"✨ Generar temas U2"}},
            {"id":"temario_u3_titulo","tipo":"text","label":"Título Unidad 3","placeholder":"Ej. Evaluación y Seguimiento"},
            {"id":"temario_u3","tipo":"list","label":"Temas de la Unidad 3","placeholder_item":"Ej. Evaluación de desempeño","ai":{"activo":true,"prompt":"Genera 4-6 temas para la Unidad 3 (evaluación/integración) del curso '{{nombreCurso}}'.","boton_label":"✨ Generar temas U3"}}
          ]
        }
      ]
    },
    {
      "id": "encuadre",
      "titulo": "Encuadre",
      "icono": "🤝",
      "pasos": [
        {
          "id": "preguntas",
          "titulo": "Preguntas de Experiencia",
          "numero": 5,
          "campos": [
            {"id":"preguntas","tipo":"textarea","label":"Preguntas detonadoras de experiencia","requerido":true,"full_width":true,"rows":6,"placeholder":"Escribe las preguntas para explorar la experiencia previa de los participantes...","ai":{"activo":true,"prompt":"Genera 4-5 preguntas detonadoras de experiencia previa para el curso '{{nombreCurso}}'. Perfil: {{perfil}}. Deben activar conocimientos previos y crear interés en el tema.","boton_label":"✨ Generar preguntas con IA"}}
          ]
        },
        {
          "id": "reglas",
          "titulo": "Reglas del Curso",
          "numero": 6,
          "campos": [
            {"id":"reglasTexto","tipo":"list","label":"Reglas del grupo","requerido":true,"placeholder_item":"Ej. Celular en silencio durante la sesión","ai":{"activo":true,"prompt":"Genera 6-8 reglas de convivencia para el curso '{{nombreCurso}}'. Deben ser claras, positivas y apropiadas para capacitación empresarial.","boton_label":"✨ Generar reglas con IA"}}
          ]
        },
        {
          "id": "contrato",
          "titulo": "Contrato de Aprendizaje",
          "numero": 7,
          "campos": [
            {"id":"contrato","tipo":"textarea","label":"Contrato de aprendizaje","requerido":true,"full_width":true,"rows":10,"placeholder":"Redacta el contrato de aprendizaje para el grupo...","ai":{"activo":true,"prompt":"Redacta un contrato de aprendizaje formal para el curso '{{nombreCurso}}'. Incluye compromisos del instructor, compromisos de los participantes, condiciones de evaluación y estas reglas: {{reglasTexto}}.","boton_label":"✨ Generar contrato con IA"}}
          ]
        },
        {
          "id": "integracion",
          "titulo": "Técnica de Integración Grupal",
          "numero": 8,
          "tipo_especial": "tecnica_card",
          "campos": [
            {"id":"rhSeleccion","tipo":"text","label":"Nombre de la técnica","placeholder":"Ej. La telaraña, El barco se hunde..."},
            {"id":"rhObjetivo","tipo":"textarea","label":"Objetivo de la técnica"},
            {"id":"rhInstrucciones","tipo":"textarea","label":"Instrucciones / Desarrollo","rows":6,"ai":{"activo":true,"prompt":"Describe el desarrollo paso a paso de la técnica '{{rhSeleccion}}' para el curso '{{nombreCurso}}' con {{participantes}} participantes.","boton_label":"✨ Generar desarrollo con IA"}},
            {"id":"rhDuracion","tipo":"text","label":"Duración","placeholder":"Ej. 15 minutos"},
            {"id":"rhMateriales","tipo":"textarea","label":"Materiales necesarios"}
          ]
        }
      ]
    },
    {
      "id": "desarrollo",
      "titulo": "Desarrollo",
      "icono": "🎯",
      "pasos": [
        {
          "id": "energizante",
          "titulo": "Técnica Energizante",
          "numero": 9,
          "tipo_especial": "tecnica_card",
          "campos": [
            {"id":"enSeleccion","tipo":"text","label":"Nombre de la técnica energizante"},
            {"id":"enObjetivo","tipo":"textarea","label":"Objetivo"},
            {"id":"enInstrucciones","tipo":"textarea","label":"Instrucciones / Desarrollo","rows":6,"ai":{"activo":true,"prompt":"Describe el desarrollo de la técnica energizante '{{enSeleccion}}' para el curso '{{nombreCurso}}'.","boton_label":"✨ Generar con IA"}},
            {"id":"enDuracion","tipo":"text","label":"Duración","placeholder":"Ej. 10 minutos"},
            {"id":"enMateriales","tipo":"textarea","label":"Materiales"}
          ]
        },
        {
          "id": "expositiva",
          "titulo": "Técnica Expositiva",
          "numero": 10,
          "campos": [
            {"id":"expositiva_descripcion","tipo":"textarea","label":"Descripción de la técnica expositiva","full_width":true,"rows":8,"ai":{"activo":true,"prompt":"Describe cómo aplicar la técnica expositiva en el curso '{{nombreCurso}}'. Incluye: introducción, desarrollo de contenidos con apoyos visuales, manejo de preguntas. Objetivo cognitivo: {{obj_cognitiva}}","boton_label":"✨ Generar descripción con IA"}},
            {"id":"expositiva_duracion","tipo":"text","label":"Duración estimada","placeholder":"Ej. 45 minutos"}
          ]
        },
        {
          "id": "demostrativa",
          "titulo": "Técnica Demostrativa",
          "numero": 11,
          "campos": [
            {"id":"demostrativa_descripcion","tipo":"textarea","label":"Descripción de la técnica demostrativa","full_width":true,"rows":8,"ai":{"activo":true,"prompt":"Describe cómo aplicar la técnica demostrativa en el curso '{{nombreCurso}}'. Incluye: demostración por el instructor, práctica guiada, práctica independiente. Objetivo psicomotriz: {{obj_psicomotriz}}","boton_label":"✨ Generar descripción con IA"}},
            {"id":"demostrativa_duracion","tipo":"text","label":"Duración estimada","placeholder":"Ej. 30 minutos"}
          ]
        },
        {
          "id": "dialogo",
          "titulo": "Técnica de Diálogo / Discusión",
          "numero": 12,
          "campos": [
            {"id":"dialogo_preguntas","tipo":"list","label":"Preguntas para el diálogo","placeholder_item":"Ej. ¿Cómo aplicarían esto en su trabajo?","ai":{"activo":true,"prompt":"Genera 4-5 preguntas reflexivas para una discusión grupal del curso '{{nombreCurso}}'. Deben invitar a conectar el contenido con la experiencia laboral.","boton_label":"✨ Generar preguntas con IA"}},
            {"id":"dialogo_conclusion","tipo":"textarea","label":"Conclusión del diálogo","ai":{"activo":true,"prompt":"Redacta la conclusión del diálogo grupal del curso '{{nombreCurso}}' enfatizando el objetivo afectivo: {{obj_afectiva}}","boton_label":"✨ Generar conclusión con IA"}}
          ]
        }
      ]
    },
    {
      "id": "cierre",
      "titulo": "Cierre",
      "icono": "🏁",
      "pasos": [
        {
          "id": "cierre",
          "titulo": "Cierre del Curso",
          "numero": 13,
          "campos": [
            {"id":"cierre_resumen","tipo":"textarea","label":"Resumen del curso","full_width":true,"rows":6,"ai":{"activo":true,"prompt":"Redacta un resumen de cierre del curso '{{nombreCurso}}'. Sintetiza los puntos más importantes. Objetivo general: {{obj_general}}","boton_label":"✨ Generar resumen con IA"}},
            {"id":"cierre_compromisos","tipo":"list","label":"Compromisos de aplicación","placeholder_item":"Compromiso concreto que el participante adquiere","ai":{"activo":true,"prompt":"Lista 5-6 compromisos de aplicación práctica que el participante del curso '{{nombreCurso}}' puede adoptar al regresar a su trabajo. Objetivo general: {{obj_general}}","boton_label":"✨ Generar compromisos con IA"}},
            {"id":"cierre_bibliografias","tipo":"list","label":"Referencias bibliográficas","placeholder_item":"Ej. Autor (Año). Título. Editorial."},
            {"id":"descripcionGeneral","tipo":"textarea","label":"Descripción general del instructor","rows":4,"placeholder":"Breve descripción del instructor, su experiencia y trayectoria..."}
          ]
        }
      ]
    },
    {
      "id": "evaluaciones",
      "titulo": "Evaluaciones",
      "icono": "📝",
      "pasos": [
        {
          "id": "evaluaciones",
          "titulo": "Instrumentos de Evaluación",
          "numero": 14,
          "tipo_especial": "evaluaciones_block",
          "campos": [
            {"id":"pctDiagnostica","tipo":"number","label":"% Diagnóstica","min":0,"max":100},
            {"id":"instDiagnostica","tipo":"textarea","label":"Instrumento diagnóstico","rows":6,"ai":{"activo":true,"prompt":"Diseña un instrumento de evaluación diagnóstica (cuestionario de 5-8 preguntas) para el curso '{{nombreCurso}}'. Perfil del participante: {{perfil}}","boton_label":"✨ Generar instrumento con IA"}},
            {"id":"pctFormativa","tipo":"number","label":"% Formativa","min":0,"max":100},
            {"id":"tipoInstrumentoFormativa","tipo":"text","label":"Tipo de instrumento formativo","placeholder":"Lista de cotejo, Guía de observación..."},
            {"id":"instFormativa","tipo":"textarea","label":"Instrumento formativo","rows":6,"ai":{"activo":true,"prompt":"Diseña un instrumento de evaluación formativa de tipo '{{tipoInstrumentoFormativa}}' para el curso '{{nombreCurso}}'.","boton_label":"✨ Generar instrumento con IA"}},
            {"id":"pctSumativa","tipo":"number","label":"% Sumativa","min":0,"max":100},
            {"id":"instSumativa","tipo":"textarea","label":"Instrumento sumativo","rows":6,"ai":{"activo":true,"prompt":"Diseña un instrumento de evaluación sumativa (cuestionario) para el curso '{{nombreCurso}}'. Objetivo general: {{obj_general}}","boton_label":"✨ Generar instrumento con IA"}},
            {"id":"instReac","tipo":"textarea","label":"Instrumento de reacción / satisfacción","rows":4,"ai":{"activo":true,"prompt":"Diseña un instrumento de evaluación de reacción/satisfacción para el curso '{{nombreCurso}}'.","boton_label":"✨ Generar instrumento con IA"}}
          ]
        }
      ]
    },
    {
      "id": "revision",
      "titulo": "Revisión Final",
      "icono": "✅",
      "pasos": [
        {
          "id": "tiempos",
          "titulo": "Distribución de Tiempos",
          "numero": 15,
          "tipo_especial": "tiempos_block",
          "campos": []
        },
        {
          "id": "materiales",
          "titulo": "Lista de Materiales",
          "numero": "15B",
          "campos": [
            {"id":"mat_didacticos","tipo":"list","label":"Materiales didácticos (impresos, manuales, guías)"},
            {"id":"mat_fungibles","tipo":"list","label":"Materiales fungibles (papelería, consumibles)"},
            {"id":"mat_instalaciones","tipo":"list","label":"Instalaciones y mobiliario"},
            {"id":"mat_herramientas","tipo":"list","label":"Herramientas y equipo"},
            {"id":"mat_tecnologicos","tipo":"list","label":"Recursos tecnológicos"},
            {"id":"mat_otros","tipo":"list","label":"Otros recursos"}
          ]
        },
        {
          "id": "formatos",
          "titulo": "Generar Documentos",
          "numero": 16,
          "tipo_especial": "formatos_block",
          "campos": []
        }
      ]
    }
  ],
  "documentos": [
    {"id":"planeacion","nombre":"Planeación Didáctica","formato":"docx","generador":"planeacion"},
    {"id":"presentacion","nombre":"Presentación del Curso","formato":"pptx","generador":"presentacion"},
    {"id":"eval_diagnostica","nombre":"Evaluación Diagnóstica","formato":"docx","generador":"eval_diagnostica"},
    {"id":"contrato","nombre":"Contrato de Aprendizaje","formato":"docx","generador":"contrato"},
    {"id":"lista_req","nombre":"Lista de Requerimientos","formato":"docx","generador":"lista_req"},
    {"id":"eval_formativa_cotejo","nombre":"Eval. Formativa — Lista de Cotejo","formato":"docx","generador":"eval_formativa_cotejo"},
    {"id":"eval_formativa_guia","nombre":"Eval. Formativa — Guía de Observación","formato":"docx","generador":"eval_formativa_guia"},
    {"id":"eval_sumativa","nombre":"Evaluación Sumativa","formato":"docx","generador":"eval_sumativa"},
    {"id":"eval_reaccion","nombre":"Evaluación de Reacción","formato":"docx","generador":"eval_reaccion"},
    {"id":"lista_asistencia","nombre":"Lista de Asistencia","formato":"docx","generador":"lista_asistencia"},
    {"id":"manual_instructor","nombre":"Manual del Instructor","formato":"docx","generador":"manual_instructor"}
  ]
}$schema$,
TRUE
)
ON CONFLICT (norma_id) WHERE activo = TRUE
DO UPDATE SET esquema = EXCLUDED.esquema, version = wizard_schemas.version + 1, updated_at = NOW();


-- ── EC0301.01 ─────────────────────────────────────────────────────
INSERT INTO public.wizard_schemas (norma_id, version, esquema, activo) VALUES (
'ec0301',
1,
$schema${
  "meta": {
    "codigo": "EC0301.01",
    "nombre": "Impartición de Cursos de Capacitación",
    "color_header": "#166534",
    "min_duracion": 120,
    "min_participantes": 4
  },
  "secciones": [
    {
      "id": "planeacion",
      "titulo": "Planeación",
      "icono": "📋",
      "pasos": [
        {
          "id": "datos",
          "titulo": "Datos del Curso",
          "numero": 1,
          "campos": [
            {"id":"nombreCurso","tipo":"text","label":"Nombre del curso","requerido":true,"placeholder":"Ej. Manejo de Extintores"},
            {"id":"instructor","tipo":"text","label":"Instructor","requerido":true,"placeholder":"Nombre completo del instructor"},
            {"id":"disenador","tipo":"text","label":"Diseñador","requerido":true,"placeholder":"Nombre completo del diseñador"},
            {"id":"lugar","tipo":"text","label":"Lugar","requerido":true,"placeholder":"Ciudad o instalación"},
            {"id":"fecha","tipo":"date","label":"Fecha","requerido":true},
            {"id":"duracion","tipo":"number","label":"Duración (minutos)","requerido":true,"min":120,"hint":"Mínimo 120 minutos según EC0301.01","placeholder":"Mínimo 120"},
            {"id":"participantes","tipo":"number","label":"Número de participantes","requerido":true,"min":4,"hint":"Mínimo 4 participantes","placeholder":"Mínimo 4"},
            {"id":"perfil","tipo":"textarea","label":"Perfil del participante","requerido":true,"full_width":true,"rows":6,"placeholder":"Describe el perfil: puesto, experiencia previa, nivel educativo...\n\nConocimientos:\nHabilidades:\nActitudes y Valores:"}
          ]
        },
        {
          "id": "objetivos",
          "titulo": "Objetivos de Aprendizaje",
          "numero": 2,
          "tipo_especial": "objetivos_tabs",
          "campos": [
            {"id":"obj_cognitiva","tipo":"textarea","label":"Objetivo Cognitivo","requerido":true,"placeholder":"Redacta el objetivo cognitivo..."},
            {"id":"obj_psicomotriz","tipo":"textarea","label":"Objetivo Psicomotriz","requerido":true,"placeholder":"Redacta el objetivo psicomotriz..."},
            {"id":"obj_afectiva","tipo":"textarea","label":"Objetivo Afectivo","requerido":true,"placeholder":"Redacta el objetivo afectivo..."},
            {"id":"obj_general","tipo":"textarea","label":"Objetivo General","requerido":true,"placeholder":"Redacta el objetivo general del curso...","ai":{"activo":true,"prompt":"Redacta el objetivo general del curso '{{nombreCurso}}' integrando los tres objetivos: Cognitivo: {{obj_cognitiva}} | Psicomotriz: {{obj_psicomotriz}} | Afectivo: {{obj_afectiva}}.","boton_label":"✨ Generar objetivo general"}}
          ]
        },
        {
          "id": "beneficios",
          "titulo": "Beneficios del Curso",
          "numero": 3,
          "campos": [
            {"id":"beneficios","tipo":"textarea","label":"Beneficios del curso","requerido":true,"full_width":true,"rows":8,"placeholder":"Lista los beneficios del curso...","ai":{"activo":true,"prompt":"Lista en forma de viñetas los principales beneficios del curso '{{nombreCurso}}'. Objetivo general: {{obj_general}}. Perfil: {{perfil}}.","boton_label":"✨ Generar beneficios con IA"}}
          ]
        },
        {
          "id": "temario",
          "titulo": "Temario del Curso",
          "numero": 4,
          "tipo_especial": "temario_unidades",
          "campos": [
            {"id":"temario_u1_titulo","tipo":"text","label":"Título Unidad 1","placeholder":"Ej. Fundamentos"},
            {"id":"temario_u1","tipo":"list","label":"Temas de la Unidad 1","placeholder_item":"Ej. Introducción al tema","ai":{"activo":true,"prompt":"Genera 4-6 temas para la Unidad 1 del curso '{{nombreCurso}}'.","boton_label":"✨ Generar temas U1"}},
            {"id":"temario_u2_titulo","tipo":"text","label":"Título Unidad 2","placeholder":"Ej. Aplicación Práctica"},
            {"id":"temario_u2","tipo":"list","label":"Temas de la Unidad 2","placeholder_item":"Ej. Procedimiento paso a paso","ai":{"activo":true,"prompt":"Genera 4-6 temas para la Unidad 2 del curso '{{nombreCurso}}'.","boton_label":"✨ Generar temas U2"}},
            {"id":"temario_u3_titulo","tipo":"text","label":"Título Unidad 3","placeholder":"Ej. Evaluación"},
            {"id":"temario_u3","tipo":"list","label":"Temas de la Unidad 3","placeholder_item":"Ej. Evaluación de desempeño","ai":{"activo":true,"prompt":"Genera 4-6 temas para la Unidad 3 del curso '{{nombreCurso}}'.","boton_label":"✨ Generar temas U3"}}
          ]
        }
      ]
    },
    {
      "id": "encuadre",
      "titulo": "Encuadre",
      "icono": "🤝",
      "pasos": [
        {"id":"preguntas","titulo":"Preguntas de Experiencia","numero":5,"campos":[{"id":"preguntas","tipo":"textarea","label":"Preguntas detonadoras de experiencia","requerido":true,"full_width":true,"rows":6,"ai":{"activo":true,"prompt":"Genera 4-5 preguntas detonadoras de experiencia previa para el curso '{{nombreCurso}}'. Perfil: {{perfil}}.","boton_label":"✨ Generar preguntas con IA"}}]},
        {"id":"reglas","titulo":"Reglas del Curso","numero":6,"campos":[{"id":"reglasTexto","tipo":"list","label":"Reglas del grupo","requerido":true,"placeholder_item":"Ej. Celular en silencio","ai":{"activo":true,"prompt":"Genera 6-8 reglas de convivencia para el curso '{{nombreCurso}}'.","boton_label":"✨ Generar reglas con IA"}}]},
        {"id":"contrato","titulo":"Contrato de Aprendizaje","numero":7,"campos":[{"id":"contrato","tipo":"textarea","label":"Contrato de aprendizaje","requerido":true,"full_width":true,"rows":10,"ai":{"activo":true,"prompt":"Redacta un contrato de aprendizaje formal para el curso '{{nombreCurso}}'. Reglas: {{reglasTexto}}.","boton_label":"✨ Generar contrato con IA"}}]},
        {"id":"integracion","titulo":"Técnica de Integración Grupal","numero":8,"tipo_especial":"tecnica_card","campos":[{"id":"rhSeleccion","tipo":"text","label":"Nombre de la técnica"},{"id":"rhObjetivo","tipo":"textarea","label":"Objetivo"},{"id":"rhInstrucciones","tipo":"textarea","label":"Instrucciones / Desarrollo","rows":6,"ai":{"activo":true,"prompt":"Describe el desarrollo de la técnica '{{rhSeleccion}}' para el curso '{{nombreCurso}}' con {{participantes}} participantes.","boton_label":"✨ Generar con IA"}},{"id":"rhDuracion","tipo":"text","label":"Duración","placeholder":"Ej. 15 minutos"},{"id":"rhMateriales","tipo":"textarea","label":"Materiales"}]}
      ]
    },
    {
      "id": "desarrollo",
      "titulo": "Desarrollo",
      "icono": "🎯",
      "pasos": [
        {"id":"energizante","titulo":"Técnica Energizante","numero":9,"tipo_especial":"tecnica_card","campos":[{"id":"enSeleccion","tipo":"text","label":"Nombre de la técnica"},{"id":"enObjetivo","tipo":"textarea","label":"Objetivo"},{"id":"enInstrucciones","tipo":"textarea","label":"Instrucciones","rows":6,"ai":{"activo":true,"prompt":"Describe la técnica energizante '{{enSeleccion}}' para el curso '{{nombreCurso}}'.","boton_label":"✨ Generar con IA"}},{"id":"enDuracion","tipo":"text","label":"Duración"},{"id":"enMateriales","tipo":"textarea","label":"Materiales"}]},
        {"id":"expositiva","titulo":"Técnica Expositiva","numero":10,"campos":[{"id":"expositiva_descripcion","tipo":"textarea","label":"Descripción de la técnica expositiva","full_width":true,"rows":8,"ai":{"activo":true,"prompt":"Describe cómo aplicar la técnica expositiva en el curso '{{nombreCurso}}'. Objetivo cognitivo: {{obj_cognitiva}}","boton_label":"✨ Generar descripción con IA"}},{"id":"expositiva_duracion","tipo":"text","label":"Duración estimada"}]},
        {"id":"demostrativa","titulo":"Técnica Demostrativa","numero":11,"campos":[{"id":"demostrativa_descripcion","tipo":"textarea","label":"Descripción de la técnica demostrativa","full_width":true,"rows":8,"ai":{"activo":true,"prompt":"Describe cómo aplicar la técnica demostrativa en el curso '{{nombreCurso}}'. Objetivo psicomotriz: {{obj_psicomotriz}}","boton_label":"✨ Generar descripción con IA"}},{"id":"demostrativa_duracion","tipo":"text","label":"Duración estimada"}]},
        {"id":"dialogo","titulo":"Técnica de Diálogo","numero":12,"campos":[{"id":"dialogo_preguntas","tipo":"list","label":"Preguntas para el diálogo","ai":{"activo":true,"prompt":"Genera 4-5 preguntas reflexivas para una discusión del curso '{{nombreCurso}}'.","boton_label":"✨ Generar preguntas con IA"}},{"id":"dialogo_conclusion","tipo":"textarea","label":"Conclusión del diálogo","ai":{"activo":true,"prompt":"Redacta la conclusión del diálogo del curso '{{nombreCurso}}'. Objetivo afectivo: {{obj_afectiva}}","boton_label":"✨ Generar conclusión con IA"}}]}
      ]
    },
    {
      "id": "cierre",
      "titulo": "Cierre",
      "icono": "🏁",
      "pasos": [
        {"id":"cierre","titulo":"Cierre del Curso","numero":13,"campos":[{"id":"cierre_resumen","tipo":"textarea","label":"Resumen del curso","full_width":true,"rows":6,"ai":{"activo":true,"prompt":"Redacta el resumen de cierre del curso '{{nombreCurso}}'. Objetivo: {{obj_general}}","boton_label":"✨ Generar resumen con IA"}},{"id":"cierre_compromisos","tipo":"list","label":"Compromisos de aplicación","ai":{"activo":true,"prompt":"Lista 5-6 compromisos de aplicación para el curso '{{nombreCurso}}'.","boton_label":"✨ Generar compromisos con IA"}},{"id":"cierre_bibliografias","tipo":"list","label":"Referencias bibliográficas","placeholder_item":"Ej. Autor (Año). Título."},{"id":"descripcionGeneral","tipo":"textarea","label":"Descripción general del instructor","rows":4}]}
      ]
    },
    {
      "id": "evaluaciones",
      "titulo": "Evaluaciones",
      "icono": "📝",
      "pasos": [
        {"id":"evaluaciones","titulo":"Instrumentos de Evaluación","numero":14,"tipo_especial":"evaluaciones_block","campos":[{"id":"pctDiagnostica","tipo":"number","label":"% Diagnóstica","min":0,"max":100},{"id":"instDiagnostica","tipo":"textarea","label":"Instrumento diagnóstico","rows":6,"ai":{"activo":true,"prompt":"Diseña un instrumento de evaluación diagnóstica para el curso '{{nombreCurso}}'.","boton_label":"✨ Generar con IA"}},{"id":"pctFormativa","tipo":"number","label":"% Formativa","min":0,"max":100},{"id":"tipoInstrumentoFormativa","tipo":"text","label":"Tipo de instrumento formativo"},{"id":"instFormativa","tipo":"textarea","label":"Instrumento formativo","rows":6,"ai":{"activo":true,"prompt":"Diseña un instrumento de evaluación formativa '{{tipoInstrumentoFormativa}}' para el curso '{{nombreCurso}}'.","boton_label":"✨ Generar con IA"}},{"id":"pctSumativa","tipo":"number","label":"% Sumativa","min":0,"max":100},{"id":"instSumativa","tipo":"textarea","label":"Instrumento sumativo","rows":6,"ai":{"activo":true,"prompt":"Diseña un instrumento de evaluación sumativa para el curso '{{nombreCurso}}'.","boton_label":"✨ Generar con IA"}},{"id":"instReac","tipo":"textarea","label":"Instrumento de reacción","rows":4,"ai":{"activo":true,"prompt":"Diseña un instrumento de evaluación de reacción para el curso '{{nombreCurso}}'.","boton_label":"✨ Generar con IA"}}]}
      ]
    },
    {
      "id": "revision",
      "titulo": "Revisión Final",
      "icono": "✅",
      "pasos": [
        {"id":"tiempos","titulo":"Distribución de Tiempos","numero":15,"tipo_especial":"tiempos_block","campos":[]},
        {"id":"materiales","titulo":"Lista de Materiales","numero":"15B","campos":[{"id":"mat_didacticos","tipo":"list","label":"Materiales didácticos"},{"id":"mat_fungibles","tipo":"list","label":"Materiales fungibles"},{"id":"mat_instalaciones","tipo":"list","label":"Instalaciones y mobiliario"},{"id":"mat_herramientas","tipo":"list","label":"Herramientas y equipo"},{"id":"mat_tecnologicos","tipo":"list","label":"Recursos tecnológicos"},{"id":"mat_otros","tipo":"list","label":"Otros recursos"}]},
        {"id":"formatos","titulo":"Generar Documentos","numero":16,"tipo_especial":"formatos_block","campos":[]}
      ]
    }
  ],
  "documentos": [
    {"id":"manual_instructor","nombre":"Manual del Instructor","formato":"docx","generador":"ec0301_manual_instructor"},
    {"id":"manual_participante","nombre":"Manual del Participante","formato":"docx","generador":"ec0301_manual_participante"}
  ]
}$schema$,
TRUE
)
ON CONFLICT (norma_id) WHERE activo = TRUE
DO UPDATE SET esquema = EXCLUDED.esquema, version = wizard_schemas.version + 1, updated_at = NOW();
