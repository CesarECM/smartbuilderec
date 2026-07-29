-- ============================================================
-- Seed: EC0616 — Prestación de Servicios Auxiliares de Enfermería
-- Basado en portafolio real (OC0046 / Trainmar)
-- Ejecutar DESPUÉS de migration_gce_v1.sql
-- ============================================================

INSERT INTO estandares_competencia (codigo, titulo, version, nivel_snc, vigencia_cert, config)
VALUES (
  'EC0616',
  'Prestación de Servicios Auxiliares de Enfermería en Cuidados Básicos y Orientación a Personas en Unidades de Atención Médica',
  '1.0',
  3,
  3,
  '{
    "diagnostico": {
      "instrucciones": "Conteste todos los reactivos. Lea cuidadosamente.",
      "objetivo": "Identificar las posibilidades de éxito del candidato para someterse al proceso de evaluación.",
      "total_reactivos": 20,
      "reactivos": [
        {
          "num": 1,
          "pregunta": "¿Qué es la presión arterial?",
          "tipo": "opcion_multiple",
          "opciones": [
            "a) Las veces que el corazón realiza el ciclo completo de llenado y vaciado de sus cámaras en un determinado tiempo.",
            "b) La fuerza que la sangre ejerce sobre las paredes de las arterias.",
            "c) Implica contar la cantidad de respiraciones durante un minuto contando la cantidad de veces que el tórax se eleva."
          ],
          "respuesta_correcta": "b"
        },
        {
          "num": 2,
          "pregunta": "¿Qué son los signos vitales?",
          "tipo": "opcion_multiple",
          "opciones": [
            "a) Reflejan funciones esenciales del cuerpo, incluso el ritmo cardiaco, la frecuencia respiratoria, la temperatura y la presión arterial.",
            "b) Signo radiológico de las lesiones localizadas en la transición entre el cuello y el mediastino.",
            "c) Se presenta en el área situada por debajo del ombligo y entre las caderas."
          ],
          "respuesta_correcta": "a"
        },
        {
          "num": 3,
          "pregunta": "Relaciona los signos vitales con sus valores normales.",
          "tipo": "relacion",
          "opciones": [
            "Temperatura corporal → b) Es normal generalmente cuando es de 98.6 °F (37 °C)",
            "Pulso → c) 75 con intervalo de 50 a 90 x''",
            "Frecuencia respiratoria → d) Es normal para un adulto en reposo, es de 8 a 16 respiraciones por minuto.",
            "Presión arterial → a) Es normal cuando es menor a 120/80 mm Hg"
          ],
          "respuesta_correcta": "b,c,d,a"
        },
        {
          "num": 4,
          "pregunta": "Relaciona las pulsaciones según grupo de edad.",
          "tipo": "relacion",
          "opciones": [
            "Recién nacido → c) 130 con intervalo de 80 a 180 x''",
            "1 año → e) 120 con intervalo de 80 a 140 x''",
            "10 años → d) 80 con intervalo de 60 a 100 x''",
            "Adolescentes → b) 70 con intervalo de 60 a 100 x''",
            "Adulto → a) 70 con intervalo de 50 a 90 x''",
            "Anciano → f) 75 con intervalo de 50 a 90 x''"
          ],
          "respuesta_correcta": "c,e,d,b,a,f"
        },
        {
          "num": 5,
          "pregunta": "¿Qué es el aislamiento?",
          "tipo": "opcion_multiple",
          "opciones": [
            "a) Es para personas que han estado expuestas a una enfermedad contagiosa, pero que no están enfermas.",
            "b) Es para las personas que están enfermas con una enfermedad contagiosa.",
            "c) Se hace cuando está claro que el individuo posee un riesgo significante de transmitir una enfermedad contagiosa."
          ],
          "respuesta_correcta": "b"
        },
        {
          "num": 6,
          "pregunta": "¿Qué son los residuos peligrosos biológicos-infecciosos?",
          "tipo": "opcion_multiple",
          "opciones": [
            "a) Son los que contienen sustancias capaces de causar la muerte o provocar efectos nocivos en la salud.",
            "b) Son materiales dañinos, en estado líquido o sólido, perjudiciales para la salud al inhalarse, ingerirlos o tocarlos.",
            "c) Son aquellos materiales generados durante los servicios de atención médica que contengan agentes biológico-infecciosos."
          ],
          "respuesta_correcta": "c"
        },
        {
          "num": 7,
          "pregunta": "¿Qué es el aparato digestivo?",
          "tipo": "opcion_multiple",
          "opciones": [
            "a) Conjunto de órganos que procesan los alimentos y los líquidos para descomponerlos en sustancias que el cuerpo usa como fuente de energía.",
            "b) Es el que efectúa las respuestas musculares ordenadas por el sistema nervioso.",
            "c) Está formado por vasos sanguíneos que transportan sangre desde el corazón y hacia el corazón."
          ],
          "respuesta_correcta": "a"
        },
        {
          "num": 8,
          "pregunta": "Relaciona los componentes del aparato digestivo.",
          "tipo": "relacion",
          "opciones": [
            "Órganos principales → c) Cavidad bucal, faringe, esófago, estómago, intestino delgado e intestino grueso",
            "Órganos accesorios → b) Lengua, piezas dentarias, vesicular, vesícula biliar y apéndice vermiforme",
            "Glándulas accesorias → a) Salivales, hígado y páncreas"
          ],
          "respuesta_correcta": "c,b,a"
        }
      ],
      "tabla_interpretacion": [
        {"min": 0,  "max": 10, "posibilidad": "Bajas",  "sugerencia": "Tomar curso de capacitación antes de la evaluación"},
        {"min": 11, "max": 12, "posibilidad": "Medias", "sugerencia": "Tomar alineación antes de la evaluación"},
        {"min": 13, "max": 15, "posibilidad": "Altas",  "sugerencia": "Iniciar el proceso de evaluación"}
      ]
    },
    "plan_evaluacion": {
      "puntaje_minimo": 99.62,
      "criterio_1": "La suma total del peso relativo a los reactivos del IEC aplicado es igual o mayor a 99.62",
      "criterio_2": "Existe al menos un reactivo cumplido para cada Criterio de Evaluación",
      "recursos": ["Al menos cinco personas que apoyen desempeñando el papel de participantes (simulación)"],
      "actividades": [
        {"num": 1,  "tecnica": "Documental / Lista de cotejo",      "descripcion": "Verifica la funcionalidad de la unidad de la persona: corroborando el funcionamiento de la toma de oxígeno, comprobando la existencia de material para ministración de oxígeno, manteniendo el stock de acuerdo al servicio."},
        {"num": 2,  "tecnica": "Documental / Lista de cotejo",      "descripcion": "Realiza actividades previas para proporcionar el cuidado: lavándose las manos al inicio con la técnica OMS, presentándose con la persona, identificando a la persona."},
        {"num": 3,  "tecnica": "De campo / Guía de observación",    "descripcion": "Identifica características de la respiración: cuantificando el número de respiraciones por minuto, identificando alteraciones en el patrón respiratorio."},
        {"num": 4,  "tecnica": "De campo / Guía de observación",    "descripcion": "Proporciona cuidados para favorecer la respiración: colocando en posición semifowler, aplicando oxígeno nasal, aflojando la vestimenta, proporcionando confort."},
        {"num": 5,  "tecnica": "Documental / Lista de cotejo",      "descripcion": "Reporta al superior inmediato alteraciones: describiendo verbalmente las características de la respiración y acciones realizadas, registrando en el formato establecido, manteniendo el equipo y unidad limpios."},
        {"num": 6,  "tecnica": "Documental / Lista de cotejo",      "descripcion": "Orienta sobre signos y síntomas de alarma por falta de oxigenación: describiendo signos de alarma, describiendo síntomas de alarma."},
        {"num": 7,  "tecnica": "Documental / Lista de cotejo",      "descripcion": "Realiza actividades finales al proporcionar el cuidado: despidiéndose de la persona, lavándose las manos al término con la técnica OMS."},
        {"num": 8,  "tecnica": "De campo / Guía de observación",    "descripcion": "El reporte elaborado en el formato establecido incluye actividades y orientación realizadas, fecha/hora/lugar/nombre/firma, solicitudes de insumos y mantenimiento."},
        {"num": 9,  "tecnica": "Documental / Lista de cotejo",      "descripcion": "Verifica la funcionalidad de la unidad para alimentación: comprobando existencia de material y equipo para alimentación vía oral e higiene de manos."},
        {"num": 10, "tecnica": "Documental / Lista de cotejo",      "descripcion": "Verifica el tipo de alimentación prescrita: verificando indicación de dieta, comprobando identidad, identificando dificultades para la ingestión."},
        {"num": 11, "tecnica": "De campo / Guía de observación",    "descripcion": "Realiza cuidados para proporcionar la alimentación al adulto: lavado de manos OMS, posición fowler, higiene bucal, temperatura de alimentos, cucharadas pequeñas, eructo, despedida."},
        {"num": 12, "tecnica": "De campo / Guía de observación",    "descripcion": "Realiza cuidados para proporcionar la alimentación al lactante: posición sentado, protector mentón, cucharadas pausadas, estimulación del eructo, posición semifowler post-alimentación."},
        {"num": 13, "tecnica": "De campo / Guía de observación",    "descripcion": "Reporta al superior alteraciones de la alimentación: verbalmente, registrando en formato, manteniendo el equipo limpio."},
        {"num": 14, "tecnica": "De campo / Guía de observación",    "descripcion": "El reporte de alimentación incluye actividades realizadas, tipo y cantidad de dieta, incidentes, fecha/hora/firma, orientación higiénica y dietética."},
        {"num": 15, "tecnica": "De campo / Guía de observación",    "descripcion": "Verifica la existencia de insumos para eliminación: corroborando stock de consumibles y funcionalidad de dispositivos."},
        {"num": 16, "tecnica": "De campo / Guía de observación",    "descripcion": "Valora la autonomía de la persona en la necesidad de eliminación: acondicionando para privacidad, identificando señales corporales."},
        {"num": 17, "tecnica": "De campo / Guía de observación",    "descripcion": "Realiza cuidados para favorecer la eliminación: identificando hábitos, colocando y retirando dispositivos, verificando lavado de manos, dejando cómoda a la persona."},
        {"num": 18, "tecnica": "De campo / Guía de observación",    "descripcion": "Reporta alteraciones de eliminación: verbalmente describiendo características, registrando en formato, manteniendo equipo limpio."},
        {"num": 19, "tecnica": "Documental / Cuestionario",         "descripcion": "Orienta sobre aspectos básicos para favorecer la eliminación: importancia según edad/sexo, alimentos ricos en fibra, hidratación."},
        {"num": 20, "tecnica": "Documental / Cuestionario",         "descripcion": "Orienta a la persona y familia sobre eliminación: etapa de desarrollo, hábitos de eliminación, higiene de genitales post-eliminación."},
        {"num": 21, "tecnica": "Documental / Cuestionario",         "descripcion": "El reporte de eliminación incluye actividades, características y cantidades, eventualidades, fecha/hora/firma."},
        {"num": 22, "tecnica": "De campo / Guía de observación",    "descripcion": "Verifica la funcionalidad del área para higiene: funcionamiento de la unidad, existencia de material y equipo, stock de consumibles."},
        {"num": 23, "tecnica": "De campo / Guía de observación",    "descripcion": "Identifica a la persona para el procedimiento de higiene: corroborando indicación médica, presentándose, informando del procedimiento."},
        {"num": 24, "tecnica": "De campo / Guía de observación",    "descripcion": "Realiza cuidados para la higiene: lavado de manos OMS, signos vitales, seguridad anti-caídas, baño completo, secado, lubricación de piel, higiene bucal, uñas, peinado."},
        {"num": 25, "tecnica": "De campo / Guía de observación",    "descripcion": "Realiza cuidados para el descanso y sueño: evaluando dolor/insomnio, respetando hábitos, reduciendo estimulación nocturna, orientando sobre técnicas de relajación."},
        {"num": 26, "tecnica": "Documental / Lista de cotejo",      "descripcion": "Reporta alteraciones de higiene/descanso/sueño: observaciones e incidentes de manera verbal y en formato establecido."},
        {"num": 27, "tecnica": "Documental / Lista de cotejo",      "descripcion": "El reporte de higiene incluye observaciones, incidentes, actividades realizadas, fecha/hora/firma, solicitudes de insumos."},
        {"num": 28, "tecnica": "De campo / Guía de observación",    "descripcion": "Aplica medidas de seguridad OMS: identificación del paciente, lavado de manos, medicamentos de alto riesgo, asepsia, protocolo anti-caídas y anti-úlceras."},
        {"num": 29, "tecnica": "De campo / Guía de observación",    "descripcion": "Identifica riesgos en el entorno: verificando equipo biomédico e infraestructura funcional, previniendo eventos adversos."},
        {"num": 30, "tecnica": "De campo / Guía de observación",    "descripcion": "Reporta incidentes al superior: faltantes, anomalías de manera verbal y en formatos establecidos."},
        {"num": 31, "tecnica": "De campo / Guía de observación",    "descripcion": "El reporte de incidentes incluye tipos de incidentes, solicitudes de insumos, desabasto o falla de infraestructura, fecha/hora/firma."},
        {"num": 32, "tecnica": "De campo / Guía de observación",    "descripcion": "Colabora en la preparación del cuerpo de la persona fallecida: material/equipo correcto, ambiente de respeto/intimidad, aseo, colocación de sábana, identificaciones, traslado."},
        {"num": 33, "tecnica": "De campo / Guía de observación",    "descripcion": "Presta apoyo a la familia: empatía, acceso para despedida, apoyo en el duelo."},
        {"num": 34, "tecnica": "De campo / Guía de observación",    "descripcion": "Identifica personas con situaciones legales: evitando procedimientos, aplicando protocolo de la unidad."},
        {"num": 35, "tecnica": "De campo / Guía de observación",    "descripcion": "El reporte de fallecimiento incluye datos del deceso, fecha/hora/firma, solicitud de insumos."},
        {"num": 36, "tecnica": "Documental / Lista de cotejo",      "descripcion": "Identifica el nivel de conocimiento de la persona para el cuidado de su salud: estado de salud, asistencia a servicios, estilos de vida, medidas preventivas."},
        {"num": 37, "tecnica": "Documental / Lista de cotejo",      "descripcion": "Orienta sobre medidas generales de salud: hábitos saludables, plato del Buen Comer, actividad física por edad/sexo, prevención del estrés."},
        {"num": 38, "tecnica": "Documental / Lista de cotejo",      "descripcion": "El reporte de orientación de salud incluye información proporcionada y recibida, incidentes, fecha/hora/firma, solicitudes de insumos."}
      ]
    },
    "iec": {
      "nota": "IEC completo pendiente de cargar. Estructura lista, reactivos y pesos se integran via PUT /gce/estandares/{id}.",
      "reactivos": [],
      "puntaje_minimo": 99.62
    }
  }'::jsonb
)
ON CONFLICT (codigo) DO UPDATE
  SET config = EXCLUDED.config,
      titulo  = EXCLUDED.titulo,
      version = EXCLUDED.version;
