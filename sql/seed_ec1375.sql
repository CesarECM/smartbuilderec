-- ─────────────────────────────────────────────────────────────────────────────
-- seed_ec1375.sql  — INSERT / UPSERT de EC1375 en estandares_competencia
--
-- config.diagnostico : 142 reactivos SI/NO (autodiagnóstico oficial CONOCER)
-- config.iec         : 29 criterios del IEC  (sin peso_relativo — pendiente IEC oficial)
-- puntaje_minimo     : 97.64  (umbral CONOCER conocido; pesos individuales = TBD)
-- ─────────────────────────────────────────────────────────────────────────────

INSERT INTO estandares_competencia (codigo, titulo, version, nivel_snc, vigencia_cert, config, activo)
VALUES (
  'EC1375',
  'Prestación de servicios auxiliares en la contribución tradicional y complementaria de la recuperación de las condiciones físicas y socioemocionales de las personas',
  '1.0',
  3,
  3,
  $cfg${
    "diagnostico": {
      "instrucciones": "Lea cuidadosamente cada uno de los apartados del Diagnóstico tomando en cuenta las actividades que usted sabe hacer. Marque SI cuando considere que sabe hacer o ha hecho el desempeño/producto/conocimiento/actitud y NO en caso contrario. Tiempo máximo: 30 minutos.",
      "tabla_interpretacion": [
        { "min": 128, "max": 142, "posibilidad": "Altas",  "sugerencia": "Cumpliste el 90% o más de los reactivos. Se recomienda EVALUARSE." },
        { "min": 0,   "max": 127, "posibilidad": "Bajas",  "sugerencia": "Cumpliste menos del 90% de los reactivos. Se sugiere ASESORARSE con tu Centro Evaluador o Evaluador Independiente." }
      ],
      "reactivos": [

        { "tipo": "grupo_header",   "texto": "Elemento 1 de 4 — E4323: Preparar el espacio en la contribución tradicional y complementaria" },
        { "tipo": "seccion_header", "texto": "DESEMPEÑOS" },
        { "num": 1,  "tipo": "si_no", "descripcion": "Realiza protocolos de seguridad sanitaria: Antes de recibir al usuario" },
        { "num": 2,  "tipo": "si_no", "descripcion": "Realiza protocolos: Lavándose las manos conforme al protocolo señalado por la OMS" },
        { "num": 3,  "tipo": "si_no", "descripcion": "Realiza protocolos: Colocándose cubrebocas de tipo quirúrgico de triple capa conforme a recomendaciones de la Secretaría de Salud" },
        { "num": 4,  "tipo": "si_no", "descripcion": "Realiza protocolos: Colocando tapete sanitizante con solución desinfectante al ingreso del inmueble" },
        { "num": 5,  "tipo": "si_no", "descripcion": "Realiza protocolos: Disponiendo de gel antibacterial para el ingreso del inmueble" },
        { "num": 6,  "tipo": "si_no", "descripcion": "Realiza protocolos: Disponiendo de termómetro digital para el ingreso del inmueble" },

        { "tipo": "seccion_header", "texto": "PRODUCTOS — El espacio acondicionado" },
        { "num": 7,  "tipo": "si_no", "descripcion": "El espacio dispone del material, herramientas, mobiliario y equipo suficientes para otorgar el servicio" },
        { "num": 8,  "tipo": "si_no", "descripcion": "El espacio cuenta con espacio suficiente para el desplazamiento libre y a distancia entre el usuario y quien otorga el servicio" },
        { "num": 9,  "tipo": "si_no", "descripcion": "El espacio cuenta con archivero/medio digital para el resguardo de la documentación del usuario" },
        { "num": 10, "tipo": "si_no", "descripcion": "El espacio está ventilado y sin corrientes de aire" },
        { "num": 11, "tipo": "si_no", "descripcion": "El espacio cuenta con energía eléctrica e iluminación natural" },
        { "num": 12, "tipo": "si_no", "descripcion": "El espacio presenta colores claros en las paredes y techo" },
        { "num": 13, "tipo": "si_no", "descripcion": "El espacio dispone de depósitos para desechar basura orgánica e inorgánica" },
        { "num": 14, "tipo": "si_no", "descripcion": "El espacio dispone de depósitos para desechar residuos peligrosos biológicos-infecciosos conforme a NOM-087-ECOL-SSA1-2002" },
        { "num": 15, "tipo": "si_no", "descripcion": "El espacio cuenta con un lugar específico para que los usuarios coloquen sus pertenencias" },

        { "tipo": "seccion_header", "texto": "PRODUCTOS — Herramientas y materiales de trabajo" },
        { "num": 16, "tipo": "si_no", "descripcion": "Las herramientas y materiales están limpias y desinfectadas/sanitizadas" },
        { "num": 17, "tipo": "si_no", "descripcion": "Las herramientas y materiales se encuentran disponibles y en condiciones para su uso" },
        { "num": 18, "tipo": "si_no", "descripcion": "Las herramientas y materiales están contenidas en estuches/depósitos/contenedores que las protejan de contaminantes ambientales" },
        { "num": 19, "tipo": "si_no", "descripcion": "Las herramientas y materiales tienen las especificaciones de uso/vigencia/garantía/condiciones de operación del proveedor" },

        { "tipo": "seccion_header", "texto": "CONOCIMIENTOS" },
        { "num": 20, "tipo": "si_no", "descripcion": "Conozco las técnicas de atención tradicional y complementaria" },
        { "num": 21, "tipo": "si_no", "descripcion": "Conozco Desinfección vs Sanitización: definición, características, medios y recursos" },
        { "num": 22, "tipo": "si_no", "descripcion": "Conozco el manejo de residuos peligrosos NOM-087-ECOL-SSA1-2002" },

        { "tipo": "seccion_header", "texto": "ACTITUDES / HÁBITOS / VALORES" },
        { "num": 23, "tipo": "si_no", "descripcion": "Limpieza: El espacio acondicionado está libre de polvo, suciedad, manchas, malos olores y basura" },
        { "num": 24, "tipo": "si_no", "descripcion": "Orden: El espacio acondicionado tiene dispuestos de manera organizada un lugar para equipos, materiales, herramientas, documentación y mobiliario" },

        { "tipo": "grupo_header",   "texto": "Elemento 2 de 4 — E4324: Preparar al usuario para la contribución tradicional y complementaria" },
        { "tipo": "seccion_header", "texto": "DESEMPEÑOS — Recibe al usuario" },
        { "num": 25, "tipo": "si_no", "descripcion": "Recibe al usuario: Saludándolo cordialmente" },
        { "num": 26, "tipo": "si_no", "descripcion": "Recibe al usuario: Aplicando protocolos de seguridad sanitaria (gel antibacterial en manos y toma digital de temperatura)" },
        { "num": 27, "tipo": "si_no", "descripcion": "Recibe al usuario: Presentándose, indicando su nombre completo y su función" },
        { "num": 28, "tipo": "si_no", "descripcion": "Recibe al usuario: Agradeciendo su presencia" },
        { "num": 29, "tipo": "si_no", "descripcion": "Recibe al usuario: Preguntando su nombre completo" },
        { "num": 30, "tipo": "si_no", "descripcion": "Recibe al usuario: Indicándole pasar al lugar de recepción/antesala para su atención" },
        { "num": 31, "tipo": "si_no", "descripcion": "Recibe al usuario: Ofreciéndole un lugar cómodo y previamente sanitizado para que tome asiento" },

        { "tipo": "seccion_header", "texto": "DESEMPEÑOS — Introduce para llenado de bitácora/carpeta de atención integral" },
        { "num": 32, "tipo": "si_no", "descripcion": "Introduce para bitácora: Antes de iniciar la atención tradicional y complementaria" },
        { "num": 33, "tipo": "si_no", "descripcion": "Introduce para bitácora: Estableciendo un clima de confianza" },
        { "num": 34, "tipo": "si_no", "descripcion": "Introduce para bitácora: Señalando que el objetivo es la recuperación de las condiciones físicas y socioemocionales" },
        { "num": 35, "tipo": "si_no", "descripcion": "Introduce para bitácora: Indicando los principios de discreción y confidencialidad en su atención" },
        { "num": 36, "tipo": "si_no", "descripcion": "Introduce para bitácora: Comentando que los datos personales están protegidos conforme a la Ley Federal de Protección de Datos Personales" },
        { "num": 37, "tipo": "si_no", "descripcion": "Introduce para bitácora: Indicándole el llenado de la ficha de registro de atención de condiciones físicas y socioemocionales" },
        { "num": 38, "tipo": "si_no", "descripcion": "Introduce para bitácora: Indicándole que se realizará una exploración física, previa autorización con firma en la ficha de registro" },
        { "num": 39, "tipo": "si_no", "descripcion": "Introduce para bitácora: Indicándole que se tomarán signos vitales, el orden a seguir, las razones y su previa autorización con firma" },
        { "num": 40, "tipo": "si_no", "descripcion": "Introduce para bitácora: Preguntándole si tiene dudas, para su aclaración" },

        { "tipo": "seccion_header", "texto": "DESEMPEÑOS — Introduce para llenado de ficha de registro de atención" },
        { "num": 41, "tipo": "si_no", "descripcion": "Introduce para ficha: Comentando que los datos personales están protegidos (Aviso de Privacidad)" },
        { "num": 42, "tipo": "si_no", "descripcion": "Introduce para ficha: Solicitando la firma de enterado del usuario del Aviso de Privacidad" },
        { "num": 43, "tipo": "si_no", "descripcion": "Introduce para ficha: Corroborando nombre completo con identificación oficial vigente" },
        { "num": 44, "tipo": "si_no", "descripcion": "Introduce para ficha: Recabando la información de manera verbal y presencial por parte del usuario" },
        { "num": 45, "tipo": "si_no", "descripcion": "Introduce para ficha: Solicitando el llenado con datos generales, médico tratante, antecedentes físicos/socioemocionales/heredo familiares, enfermedades y hábitos" },
        { "num": 46, "tipo": "si_no", "descripcion": "Introduce para ficha: Registrando información sobre su interés/necesidad/diagnóstico emitido por el médico tratante" },
        { "num": 47, "tipo": "si_no", "descripcion": "Introduce para ficha: Señalando que los servicios no cubren ni substituyen las indicaciones del médico tratante" },
        { "num": 48, "tipo": "si_no", "descripcion": "Introduce para ficha: Agradeciendo su disponibilidad" },

        { "tipo": "seccion_header", "texto": "DESEMPEÑOS — Mide niveles de saturación de oxígeno (SpO₂) y pulso" },
        { "num": 49, "tipo": "si_no", "descripcion": "Mide SpO₂ y pulso: Explicando el procedimiento conforme a las indicaciones del fabricante del oxímetro" },
        { "num": 50, "tipo": "si_no", "descripcion": "Mide SpO₂ y pulso: Limpiando la superficie del sensor con paño suave o algodón y solución desinfectante" },
        { "num": 51, "tipo": "si_no", "descripcion": "Mide SpO₂ y pulso: Solicitando al usuario colocar el dedo en el sensor conforme a las indicaciones del fabricante" },
        { "num": 52, "tipo": "si_no", "descripcion": "Mide SpO₂ y pulso: Solicitando al usuario mantenerse sin movimientos que puedan alterar la medición" },
        { "num": 53, "tipo": "si_no", "descripcion": "Mide SpO₂ y pulso: Presionando el interruptor de inicio de medición de acuerdo con el fabricante" },
        { "num": 54, "tipo": "si_no", "descripcion": "Mide SpO₂ y pulso: Registrando los valores obtenidos de SpO₂ y pulso en la ficha de registro" },

        { "tipo": "seccion_header", "texto": "DESEMPEÑOS — Observa la postura física del usuario" },
        { "num": 55, "tipo": "si_no", "descripcion": "Postura física: Revisando visualmente la cabeza, cuello, tórax, extremidades y pelvis" },
        { "num": 56, "tipo": "si_no", "descripcion": "Postura física: Registrando los datos obtenidos en la ficha de registro de atención" },

        { "tipo": "seccion_header", "texto": "DESEMPEÑOS — Realiza la toma de la frecuencia respiratoria" },
        { "num": 57, "tipo": "si_no", "descripcion": "Frecuencia respiratoria: Solicitando al usuario permanezca sentado y en reposo" },
        { "num": 58, "tipo": "si_no", "descripcion": "Frecuencia respiratoria: Contando las elevaciones del tórax y abdomen durante un minuto" },
        { "num": 59, "tipo": "si_no", "descripcion": "Frecuencia respiratoria: Registrando los datos obtenidos en la ficha de registro de atención" },

        { "tipo": "seccion_header", "texto": "DESEMPEÑOS — Verifica la presión arterial del usuario" },
        { "num": 60, "tipo": "si_no", "descripcion": "Presión arterial: Explicando el procedimiento conforme a las indicaciones del fabricante del baumanómetro" },
        { "num": 61, "tipo": "si_no", "descripcion": "Presión arterial: Colocando el brazalete en el brazo del usuario conforme a las indicaciones del fabricante" },
        { "num": 62, "tipo": "si_no", "descripcion": "Presión arterial: Solicitando al usuario tome la postura recomendada por el fabricante" },
        { "num": 63, "tipo": "si_no", "descripcion": "Presión arterial: Activando el interruptor de inicio conforme lo señala el fabricante" },
        { "num": 64, "tipo": "si_no", "descripcion": "Presión arterial: Registrando los datos obtenidos en la ficha de registro de atención" },

        { "tipo": "seccion_header", "texto": "PRODUCTOS — Bitácora/carpeta de atención integral del usuario" },
        { "num": 65, "tipo": "si_no", "descripcion": "La bitácora contiene la ficha de registro, plan de seguimiento y consentimiento informado/aceptación del servicio" },
        { "num": 66, "tipo": "si_no", "descripcion": "La bitácora contiene fecha, nombre completo, edad, peso, estatura, fecha de nacimiento, dirección y folio asignado" },
        { "num": 67, "tipo": "si_no", "descripcion": "La bitácora incluye datos del médico tratante/profesional de la salud que atiende al usuario" },
        { "num": 68, "tipo": "si_no", "descripcion": "La bitácora contiene antecedentes físicos, fisiológicos, socioemocionales y heredo familiares" },
        { "num": 69, "tipo": "si_no", "descripcion": "La bitácora contiene el registro de enfermedades crónicas, degenerativas y alérgicas" },
        { "num": 70, "tipo": "si_no", "descripcion": "La bitácora contiene información toxicológica" },
        { "num": 71, "tipo": "si_no", "descripcion": "La bitácora contiene información sobre hábitos personales de sueño, alimenticios, de higiene, deportivos y consumo de sustancias farmacológicas/adictivas" },
        { "num": 72, "tipo": "si_no", "descripcion": "La bitácora contiene los registros de la medición de signos vitales y observaciones de la postura física del usuario" },
        { "num": 73, "tipo": "si_no", "descripcion": "La bitácora contiene el resumen de resultados actuales y previos con base en estudios de laboratorio y gabinete" },
        { "num": 74, "tipo": "si_no", "descripcion": "La bitácora contiene información sobre el interés/necesidad/malestar para recibir el servicio" },
        { "num": 75, "tipo": "si_no", "descripcion": "La bitácora señala la leyenda de que los servicios no cubren ni substituyen las indicaciones del médico tratante" },
        { "num": 76, "tipo": "si_no", "descripcion": "La bitácora contiene nombre completo y firma del usuario, del asistente auxiliar y del profesional que brinda los servicios" },

        { "tipo": "seccion_header", "texto": "CONOCIMIENTOS" },
        { "num": 77, "tipo": "si_no", "descripcion": "Conozco rangos y niveles de signos vitales en niños, adultos y personas de la tercera edad" },
        { "num": 78, "tipo": "si_no", "descripcion": "Conozco Goniometría: concepto, utilidad y aplicación" },
        { "num": 79, "tipo": "si_no", "descripcion": "Conozco Biomecánica: definición, planos anatómicos, ejes del cuerpo, movimientos y anatomía/fisiología topográfica" },
        { "num": 80, "tipo": "si_no", "descripcion": "Conozco Higiene de columna: posiciones adecuadas y manipulaciones de carga" },
        { "num": 81, "tipo": "si_no", "descripcion": "Conozco Pruebas funcionales musculares de Daniels: posiciones y desarrollo" },

        { "tipo": "seccion_header", "texto": "ACTITUDES / HÁBITOS / VALORES" },
        { "num": 82, "tipo": "si_no", "descripcion": "Amabilidad: La manera en que brindo el servicio al usuario, resolviendo sus dudas y recibiendo comentarios" },
        { "num": 83, "tipo": "si_no", "descripcion": "Orden: La manera en que integro el expediente clínico del usuario conforme al servicio tradicional y complementario otorgado" },
        { "num": 84, "tipo": "si_no", "descripcion": "Responsabilidad: La manera en que recabo, resguardo y no hago mal uso de la información proporcionada por el usuario" },

        { "tipo": "grupo_header",   "texto": "Elemento 3 de 4 — E4325: Introducir al usuario a la contribución tradicional y complementaria" },
        { "tipo": "seccion_header", "texto": "DESEMPEÑOS — Introduce al usuario a la contribución" },
        { "num": 85, "tipo": "si_no", "descripcion": "Introduce al usuario: Antes de que reciba la atención tradicional y complementaria" },
        { "num": 86, "tipo": "si_no", "descripcion": "Introduce al usuario: Identificando que no haya impedimento para recibir la atención" },
        { "num": 87, "tipo": "si_no", "descripcion": "Introduce al usuario: Resaltando la importancia y el compromiso del usuario para el resultado satisfactorio de la atención" },

        { "tipo": "seccion_header", "texto": "DESEMPEÑOS — Explica el procedimiento designado por el especialista" },
        { "num": 88, "tipo": "si_no", "descripcion": "Explica procedimiento: Partiendo de los hallazgos de la inspección visual o de la solicitud del profesional de la salud" },
        { "num": 89, "tipo": "si_no", "descripcion": "Explica procedimiento: Describiendo la atención tradicional y complementaria, sus bondades/beneficios/ventajas y alcance/casos de éxito" },
        { "num": 90, "tipo": "si_no", "descripcion": "Explica procedimiento: Señalando posibles reacciones/sensaciones/efectos durante y después de la atención" },
        { "num": 91, "tipo": "si_no", "descripcion": "Explica procedimiento: Mencionando el objetivo a alcanzar" },
        { "num": 92, "tipo": "si_no", "descripcion": "Explica procedimiento: Describiendo la vestimenta recomendada para la atención" },
        { "num": 93, "tipo": "si_no", "descripcion": "Explica procedimiento: Preguntando si tiene dudas o algún comentario, para atenderlas" },

        { "tipo": "seccion_header", "texto": "DESEMPEÑOS — Presenta el documento de consentimiento informado" },
        { "num": 94, "tipo": "si_no", "descripcion": "Presenta consentimiento: Antes de dar inicio a la atención tradicional y complementaria" },
        { "num": 95, "tipo": "si_no", "descripcion": "Presenta consentimiento: Describiendo en qué consiste el documento, su contenido y alcances" },
        { "num": 96, "tipo": "si_no", "descripcion": "Presenta consentimiento: Recabando firma de aceptación por parte del usuario" },

        { "tipo": "seccion_header", "texto": "DESEMPEÑOS — Informa al usuario sobre la finalización del servicio" },
        { "num": 97,  "tipo": "si_no", "descripcion": "Informa finalización: Indicando que el servicio ha finalizado" },
        { "num": 98,  "tipo": "si_no", "descripcion": "Informa finalización: Mencionando que puede permanecer en la mesa/superficie por unos momentos y sus razones" },
        { "num": 99,  "tipo": "si_no", "descripcion": "Informa finalización: Preguntando cómo se siente después de la atención recibida" },
        { "num": 100, "tipo": "si_no", "descripcion": "Informa finalización: Preguntando si tiene dudas al respecto para atenderlas" },
        { "num": 101, "tipo": "si_no", "descripcion": "Informa finalización: Informando el efecto de las técnicas dentro de las veinticuatro horas subsecuentes a su aplicación" },
        { "num": 102, "tipo": "si_no", "descripcion": "Informa finalización: Explicando la forma de incorporarse conforme a los protocolos de Higiene de Columna" },
        { "num": 103, "tipo": "si_no", "descripcion": "Informa finalización: Dejando el área de trabajo para permitirle al usuario vestirse" },

        { "tipo": "seccion_header", "texto": "PRODUCTOS — Carta de consentimiento informado/aceptación del servicio" },
        { "num": 104, "tipo": "si_no", "descripcion": "El consentimiento contiene fecha, nombre completo, edad, fecha de nacimiento, dirección y nombre de familiar a quien avisar" },
        { "num": 105, "tipo": "si_no", "descripcion": "El consentimiento contiene el Aviso de Privacidad conforme a la Ley Federal de Protección de Datos Personales" },
        { "num": 106, "tipo": "si_no", "descripcion": "El consentimiento contiene descritas las técnicas a aplicar" },
        { "num": 107, "tipo": "si_no", "descripcion": "El consentimiento especifica los puntos y zonas del cuerpo que tocará de acuerdo con el efecto a lograr" },
        { "num": 108, "tipo": "si_no", "descripcion": "El consentimiento contiene descritas las reacciones físicas posibles que se presentan" },
        { "num": 109, "tipo": "si_no", "descripcion": "El consentimiento especifica la vestimenta recomendada para la preparación de las técnicas" },
        { "num": 110, "tipo": "si_no", "descripcion": "El consentimiento señala limitantes de aplicación del servicio de técnicas tradicionales y complementarias" },
        { "num": 111, "tipo": "si_no", "descripcion": "El consentimiento describe las condiciones de preparación que debe cubrir el usuario" },
        { "num": 112, "tipo": "si_no", "descripcion": "El consentimiento contiene el número de sesiones a utilizar y la duración de cada sesión" },
        { "num": 113, "tipo": "si_no", "descripcion": "El consentimiento contiene los objetivos a alcanzar por sesión y los efectos generales" },
        { "num": 114, "tipo": "si_no", "descripcion": "El consentimiento contiene la rúbrica/firma/huella de conformidad del usuario" },
        { "num": 115, "tipo": "si_no", "descripcion": "El consentimiento está integrado al expediente del usuario" },
        { "num": 116, "tipo": "si_no", "descripcion": "El consentimiento contiene nombre y firma/huella digital del usuario y de quien otorga el servicio" },

        { "tipo": "grupo_header",   "texto": "Elemento 4 de 4 — E4326: Dar seguimiento al usuario en la contribución tradicional y complementaria" },
        { "tipo": "seccion_header", "texto": "DESEMPEÑOS — Aplica encuesta de satisfacción" },
        { "num": 117, "tipo": "si_no", "descripcion": "Aplica encuesta: Al término del servicio" },
        { "num": 118, "tipo": "si_no", "descripcion": "Aplica encuesta: Explicando las instrucciones para su llenado" },
        { "num": 119, "tipo": "si_no", "descripcion": "Aplica encuesta: Recibiendo comentarios acerca del servicio" },
        { "num": 120, "tipo": "si_no", "descripcion": "Aplica encuesta: Agradeciendo al usuario su colaboración y comentarios" },

        { "tipo": "seccion_header", "texto": "DESEMPEÑOS — Acuerda con el usuario el programa de seguimiento" },
        { "num": 121, "tipo": "si_no", "descripcion": "Acuerda seguimiento: Una vez finalizado el servicio" },
        { "num": 122, "tipo": "si_no", "descripcion": "Acuerda seguimiento: Atendiendo las indicaciones del profesional que otorgó la atención" },
        { "num": 123, "tipo": "si_no", "descripcion": "Acuerda seguimiento: Mencionando el objetivo a alcanzar por sesión con la atención tradicional y complementaria" },
        { "num": 124, "tipo": "si_no", "descripcion": "Acuerda seguimiento: Proponiendo fechas y horarios" },
        { "num": 125, "tipo": "si_no", "descripcion": "Acuerda seguimiento: Acordando fechas y horarios" },
        { "num": 126, "tipo": "si_no", "descripcion": "Acuerda seguimiento: Resaltando las recomendaciones para su tratamiento por parte del especialista" },
        { "num": 127, "tipo": "si_no", "descripcion": "Acuerda seguimiento: Indicando que la atención será permanente para la aclaración de dudas/consulta de información" },
        { "num": 128, "tipo": "si_no", "descripcion": "Acuerda seguimiento: Confirmando que se hayan resuelto las dudas planteadas" },

        { "tipo": "seccion_header", "texto": "DESEMPEÑOS — Asegura el medio de contacto para el seguimiento" },
        { "num": 129, "tipo": "si_no", "descripcion": "Asegura contacto: Solicitando la vía más viable para mantener la comunicación" },
        { "num": 130, "tipo": "si_no", "descripcion": "Asegura contacto: Registrando teléfono fijo/celular/correo electrónico/redes sociales" },
        { "num": 131, "tipo": "si_no", "descripcion": "Asegura contacto: Proporcionándole datos del Centro de Atención Tradicional y Complementaria y datos de atención telefónica" },
        { "num": 132, "tipo": "si_no", "descripcion": "Asegura contacto: Agradeciendo su asistencia, disposición y confianza" },

        { "tipo": "seccion_header", "texto": "PRODUCTOS — Plan de Seguimiento elaborado" },
        { "num": 133, "tipo": "si_no", "descripcion": "El Plan de Seguimiento contiene datos con información general sobre fechas y horarios" },
        { "num": 134, "tipo": "si_no", "descripcion": "El Plan de Seguimiento señala el medio de contacto: encuentro presencial/llamada telefónica/correo electrónico/mensaje/plataformas digitales" },
        { "num": 135, "tipo": "si_no", "descripcion": "El Plan de Seguimiento contiene número de sesiones programadas, su frecuencia y duración" },
        { "num": 136, "tipo": "si_no", "descripcion": "El Plan de Seguimiento contiene el plan de sesión programado" },
        { "num": 137, "tipo": "si_no", "descripcion": "El Plan de Seguimiento contiene nombre y firma/huella digital del usuario y de quien otorga el servicio" },

        { "tipo": "seccion_header", "texto": "PRODUCTOS — Plan de sesión elaborado" },
        { "num": 138, "tipo": "si_no", "descripcion": "El Plan de sesión se integra en el Plan de Seguimiento" },
        { "num": 139, "tipo": "si_no", "descripcion": "El Plan de sesión contiene por cada sesión: número, fecha, hora de inicio y término y el registro de signos vitales" },
        { "num": 140, "tipo": "si_no", "descripcion": "El Plan de sesión describe las actividades/intervenciones/atención que se otorgará en el servicio al usuario" },
        { "num": 141, "tipo": "si_no", "descripcion": "El Plan de sesión incluye notas de evolución y el pronóstico del número de sesiones necesarias para el bienestar del usuario" },
        { "num": 142, "tipo": "si_no", "descripcion": "El Plan de sesión incluye actividades/tareas/ejercicios para realizar en casa que coadyuven a la atención recibida" }

      ]
    },

    "iec": {
      "puntaje_minimo": 97.64,
      "nota": "Pesos individuales pendientes de IEC oficial CONOCER. Score auto-calculado mostrará 0/97.64 hasta recibir el instrumento.",
      "reactivos": [
        { "codigo": "E4323-D1", "tipo": "desempeño",    "descripcion": "Realiza protocolos de seguridad sanitaria: lavado de manos OMS, cubrebocas quirúrgico triple capa, tapete sanitizante, gel antibacterial y termómetro digital al ingreso" },
        { "codigo": "E4323-P1", "tipo": "producto",     "descripcion": "Espacio acondicionado: material/herramientas/equipo suficientes, desplazamiento libre, archivero, ventilación, iluminación, colores claros, depósitos de basura y pertenencias" },
        { "codigo": "E4323-P2", "tipo": "producto",     "descripcion": "Herramientas y materiales: limpias/desinfectadas, disponibles, en estuches/contenedores y con especificaciones de uso/vigencia/garantía" },
        { "codigo": "E4323-C1", "tipo": "conocimiento", "descripcion": "Técnicas de atención tradicional y complementaria" },
        { "codigo": "E4323-C2", "tipo": "conocimiento", "descripcion": "Desinfección vs Sanitización: definición, características, medios y recursos" },
        { "codigo": "E4323-C3", "tipo": "conocimiento", "descripcion": "Manejo de residuos peligrosos NOM-087-ECOL-SSA1-2002" },
        { "codigo": "E4324-D1", "tipo": "desempeño",    "descripcion": "Recibe al usuario: saluda cordialmente, aplica protocolos sanitarios, se presenta, agradece, pregunta nombre, indica lugar y ofrece asiento sanitizado" },
        { "codigo": "E4324-D2", "tipo": "desempeño",    "descripcion": "Introduce al usuario para el llenado de la bitácora/carpeta de atención integral: clima de confianza, objetivo del servicio, discreción, aviso de privacidad y firma de autorización" },
        { "codigo": "E4324-D3", "tipo": "desempeño",    "descripcion": "Introduce al usuario para el llenado de la ficha de registro de atención: aviso de privacidad, verificación de identidad, datos generales, médico tratante, antecedentes, enfermedades y hábitos" },
        { "codigo": "E4324-D4", "tipo": "desempeño",    "descripcion": "Mide niveles de saturación de oxígeno (SpO₂) y pulso con oxímetro conforme a indicaciones del fabricante y registra valores en la ficha" },
        { "codigo": "E4324-D5", "tipo": "desempeño",    "descripcion": "Observa la postura física del usuario: cabeza, cuello, tórax, extremidades y pelvis; registra datos en la ficha" },
        { "codigo": "E4324-D6", "tipo": "desempeño",    "descripcion": "Realiza la toma de la frecuencia respiratoria: usuario sentado en reposo, cuenta elevaciones tórax/abdomen durante un minuto y registra" },
        { "codigo": "E4324-D7", "tipo": "desempeño",    "descripcion": "Verifica la presión arterial con baumanómetro conforme a indicaciones del fabricante y registra datos en la ficha" },
        { "codigo": "E4324-P1", "tipo": "producto",     "descripcion": "Bitácora/carpeta de atención integral: ficha de registro, plan de seguimiento, consentimiento, signos vitales, antecedentes, hábitos, estudios, malestar y firmas completas" },
        { "codigo": "E4324-C1", "tipo": "conocimiento", "descripcion": "Rangos y niveles de signos vitales en niños, adultos y personas de la tercera edad" },
        { "codigo": "E4324-C2", "tipo": "conocimiento", "descripcion": "Goniometría: concepto, utilidad y aplicación" },
        { "codigo": "E4324-C3", "tipo": "conocimiento", "descripcion": "Biomecánica: definición, planos anatómicos, ejes del cuerpo, movimientos y anatomía/fisiología topográfica" },
        { "codigo": "E4324-C4", "tipo": "conocimiento", "descripcion": "Higiene de columna: posiciones adecuadas y manipulaciones de carga" },
        { "codigo": "E4324-C5", "tipo": "conocimiento", "descripcion": "Pruebas funcionales musculares de Daniels: posiciones y desarrollo" },
        { "codigo": "E4325-D1", "tipo": "desempeño",    "descripcion": "Introduce al usuario a la contribución: identifica impedimentos y resalta la importancia del compromiso del usuario para el resultado satisfactorio" },
        { "codigo": "E4325-D2", "tipo": "desempeño",    "descripcion": "Explica el procedimiento del especialista: hallazgos/solicitud del profesional, bondades, reacciones posibles, objetivo, vestimenta recomendada y responde dudas" },
        { "codigo": "E4325-D3", "tipo": "desempeño",    "descripcion": "Presenta al usuario el documento de consentimiento informado: describe contenido y alcances, recaba firma de aceptación" },
        { "codigo": "E4325-D4", "tipo": "desempeño",    "descripcion": "Informa al usuario la finalización del servicio: permanencia en mesa, sensaciones, efectos en 24 h, higiene de columna y retira el área para que se vista" },
        { "codigo": "E4325-P1", "tipo": "producto",     "descripcion": "Carta de consentimiento informado: datos del usuario, familiar de contacto, aviso de privacidad, técnicas, zonas del cuerpo, reacciones, vestimenta, limitantes, sesiones, objetivos y firmas" },
        { "codigo": "E4326-D1", "tipo": "desempeño",    "descripcion": "Aplica encuesta de satisfacción al término del servicio: explica instrucciones, recibe comentarios y agradece colaboración" },
        { "codigo": "E4326-D2", "tipo": "desempeño",    "descripcion": "Acuerda programa de seguimiento: objetivo por sesión, fechas/horarios, recomendaciones del especialista, atención permanente y confirma resolución de dudas" },
        { "codigo": "E4326-D3", "tipo": "desempeño",    "descripcion": "Asegura el medio de contacto: vía de comunicación, registra teléfono/correo/redes, proporciona datos del Centro de Atención y agradece asistencia" },
        { "codigo": "E4326-P1", "tipo": "producto",     "descripcion": "Plan de Seguimiento elaborado: fechas/horarios, medio de contacto, número de sesiones/frecuencia/duración, plan de sesión y firmas" },
        { "codigo": "E4326-P2", "tipo": "producto",     "descripcion": "Plan de sesión elaborado: número, fecha, hora inicio/término, signos vitales por sesión, actividades/intervenciones, notas de evolución, pronóstico y tareas en casa" }
      ]
    }
  }$cfg$::jsonb,
  true
)
ON CONFLICT (codigo) DO UPDATE SET
  titulo        = EXCLUDED.titulo,
  version       = EXCLUDED.version,
  nivel_snc     = EXCLUDED.nivel_snc,
  vigencia_cert = EXCLUDED.vigencia_cert,
  config        = EXCLUDED.config,
  activo        = EXCLUDED.activo;
