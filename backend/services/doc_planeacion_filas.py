from services.doc_planeacion_xml import _tiempo, _subtotal, _inst


def _filas_previo(_d):
    return [{'etapa': "Comprobación de la existencia y funcionamiento de los recursos requeridos",
             'actividades': [
                 "El instructor aplicará la Lista de verificación de requerimientos.",
                 "El instructor realizará pruebas de funcionamiento del equipo.",
                 "El instructor verificará la distribución del mobiliario y equipo.",
                 "El instructor verificará la suficiencia de los materiales conforme al número de participantes.",
             ],
             'duracion': "10 min previos al inicio", 'tecnica': "", 'material': "Lista de verificación de requerimientos"}]


def _filas_apertura(d):
    tec = d.get('tecnicas') or {}; enc = d.get('encuadre') or {}
    obj = d.get('objetivos') or {}; tem = d.get('temario') or {}; ev = d.get('evaluaciones') or {}
    rh     = tec.get('rhNombre', 'Técnica Rompe Hielo')
    rh_raw = tec.get('rhDetalle', '')
    rh_t   = _tiempo(d, "Presentación del Instructor")
    partes = [p for p in rh_raw.split('\n\n') if not any(p.strip().startswith(x) for x in ('d)','e)','f)'))]
    partes = [
        p.replace('c) Mencionará el tiempo para realizarla.', f'c) Mencionará el tiempo para realizarla: {rh_t}')
        if p.strip().startswith('c)') and rh_t else p
        for p in partes
    ]
    rh_det  = '\n\n'.join(partes)
    reglas  = (enc.get('reglasTexto') or []) + ([enc.get('otraRegla')] if enc.get('otraRegla') else [])
    pct_d   = ev.get('pctDiagnostica') or ev.get('pctDiag') or 0
    pct_f   = ev.get('pctFormativa')   or ev.get('pctForm') or 0
    pct_s   = ev.get('pctSumativa')    or ev.get('pctSuma') or 0
    NL      = '\n'
    return [
        {'etapa': "1. Presentación del instructor / facilitador y de los participantes",
         'actividades': [
             "El instructor se presentará ante el grupo.",
             "El instructor pedirá que se anoten en la lista de asistencia.",
             "El instructor propiciará la presentación de los participantes.",
             f'El instructor aplicará la Técnica Rompe Hielo / Integración: "{rh}".\n{rh_det}',
         ],
         'duracion': _tiempo(d, "Presentación del Instructor"),
         'tecnica': f"Técnica grupal:\n{rh}", 'material': "Lista de asistencia\nMateriales de la técnica"},
        {'etapa': "2. Presentación del curso",
         'actividades': [
             f"El instructor presentará los objetivos del curso/sesión.\n\nOBJETIVO GENERAL:\n{obj.get('general','')}\n\nOBJETIVOS PARTICULARES:\n1. (Cognitivo) {obj.get('cognitiva','')}\n\n2. (Psicomotriz) {obj.get('psicomotriz','')}\n\n3. (Afectivo) {obj.get('afectiva','')}",
             f"El instructor presentará la descripción general del desarrollo del curso/sesión.\n{ev.get('descripcionGeneral','')}",
             f"El instructor mencionará el temario del curso/sesión.\n\nUnidad 1:\n{NL.join(tem.get('u1') or [])}\n\nUnidad 2:\n{NL.join(tem.get('u2') or [])}\n\nUnidad 3:\n{NL.join(tem.get('u3') or [])}",
             f"El instructor creará un ambiente participativo mediante preguntas.\n{enc.get('preguntas','')}",
             f"El instructor explicará los beneficios del curso/sesión.\n{d.get('beneficios','')}",
             f"El instructor especificará el tipo de evaluaciones a realizar.\n\na) Evaluación Diagnóstica ({_inst(ev.get('instDiagnostica'),'Cuestionario')}) — Al inicio. {pct_d}% solo referencial.\nb) Evaluación Formativa ({_inst(ev.get('instFormativa'),'Lista de cotejo')}) — Intermedia. {pct_f}%.\nc) Evaluación Sumativa ({_inst(ev.get('instSumativa'),'Cuestionario')}) — Al final. {pct_s}%.\nd) Criterios: Conocimientos Teóricos, Actitud y comportamiento, Evaluaciones aplicadas.",
         ],
         'duracion': _tiempo(d, "Objetivos del curso/sesión"),
         'tecnica': "", 'material': "Laptop, proyector, PowerPoint"},
        {'etapa': "3. Acuerdos y compromisos",
         'actividades': [
             "El instructor acordará con el grupo las expectativas del curso/sesión.",
             f"El instructor acordará las reglas de operación.\n{NL.join(reglas)}",
             "El instructor realizará el contrato de aprendizaje con los participantes.",
         ],
         'duracion': _tiempo(d, "Reglas de operación del curso"),
         'tecnica': "", 'material': "Hojas blancas\nFormatos de contrato de aprendizaje"},
        {'etapa': "4. Evaluación diagnóstica",
         'actividades': [
             "El instructor realizará la evaluación diagnóstica.",
             f"Instrumento: {_inst(ev.get('instDiagnostica'),'Cuestionario diagnóstico')}",
             f"Indicará alcance, propósito y finalidad:\n{ev.get('apfDiagnostica') or 'Alcance: Los reactivos abordan los temas y contenidos principales del curso.\nPropósito: Conocer el nivel de conocimientos y experiencia previa de los participantes para orientar el proceso de enseñanza-aprendizaje.\nFinalidad: Identificar el nivel de conocimientos previos de los participantes como punto de partida del curso.'}",
             "Indicará las instrucciones y el tiempo para realizarla.",
             "Aclarará las dudas que se presenten.",
             "Mencionará que los errores son oportunidades para fortalecer el aprendizaje.",
         ],
         'duracion': _tiempo(d, "Evaluación diagnóstica"),
         'tecnica': "", 'material': "Instrumentos diagnósticos\nBolígrafos"},
        {'etapa': "Suma de los tiempos",
         'actividades': [f"Subtotal Apertura / Encuadre: {_subtotal(d, 'Inicio / Encuadre del curso')}"],
         'duracion': _subtotal(d, "Inicio / Encuadre del curso"), 'tecnica': "", 'material': ""},
    ]


def _filas_desarrollo(d):
    tec = d.get('tecnicas') or {}; obj = d.get('objetivos') or {}
    tem = d.get('temario') or {};  ev  = d.get('evaluaciones') or {}
    exp = d.get('expositiva') or {}; dem = d.get('demostrativa') or {}; dia = d.get('dialogo') or {}
    en     = tec.get('enNombre', 'Técnica Energizante')
    en_det = tec.get('enDetalle', '')
    NL     = '\n'
    return [
        {'etapa': f"Unidad 1 — Cognitivo\n\n{NL.join(tem.get('u1') or [])}",
         'actividades': [
             "El instructor aplicará la técnica expositiva:",
             f"a) Presentará el objetivo del tema:\n{obj.get('cognitiva','')}",
             f"b) Introducción general al contenido temático:\n{exp.get('introduccion','')}",
             f"c) Recuperará la experiencia previa:\n{exp.get('experiencia','')}",
             f"d) Desarrollará el contenido:\n{exp.get('desarrollo','')}",
             f"e) Utilizará ejemplos:\n{exp.get('ejemplos','')}",
             f"g) Realizará la síntesis:\n{exp.get('sintesis','')}",
             f"h) Planteará preguntas dirigidas:\n{exp.get('preguntas','')}",
             f"i) Promoverá comentarios sobre utilidad:\n{exp.get('utilidad','')}",
         ],
         'duracion': _tiempo(d, "Técnica expositiva"), 'tecnica': "Expositiva", 'material': "Laptop, proyector, PowerPoint"},
        {'etapa': f"Unidad 2 — Psicomotriz\n\n{NL.join(tem.get('u2') or [])}",
         'actividades': [
             "El instructor aplicará la técnica demostrativa:",
             f"a) Presentará objetivo de la actividad:\n{obj.get('psicomotriz','')}",
             f"b) Recuperará la experiencia previa:\n{dem.get('experiencia','')}",
             f"c) Presentará la actividad a desarrollar:\n{dem.get('actividad','')}",
             "d) Ejemplificará la actividad.", "e) Resolverá dudas.", "f) Permitirá la práctica.", "g) Retroalimentará.",
             f"h) Usará ejemplos:\n{dem.get('ejemplos','')}",
             f"i) Preguntará por los conocimientos adquiridos:\n{dem.get('preguntas','')}",
             "j) Recordará las reglas de operación.", "k) Mencionará los logros alcanzados.",
         ],
         'duracion': _tiempo(d, "Técnica demostrativa"), 'tecnica': "Demostrativa", 'material': "Laptop, proyector, PowerPoint"},
        {'etapa': "Evaluación Formativa",
         'actividades': [
             "El instructor realizará la evaluación formativa.",
             f"Instrumento: {_inst(ev.get('instFormativa'),'Lista de cotejo / Guía de observación')}",
             f"Indicará alcance, propósito y finalidad:\n{ev.get('apfFormativa') or 'Alcance: Cubre los criterios y desempeños desarrollados durante el proceso de enseñanza-aprendizaje.\nPropósito: Retroalimentar a los participantes sobre sus avances y fortalecer el aprendizaje durante el curso.\nFinalidad: Identificar la comprensión y avance logrado por los participantes durante el curso.'}",
             "Indicará instrucciones y tiempo.", "Aclarará dudas.",
         ],
         'duracion': _tiempo(d, "Evaluación formativa"), 'tecnica': "", 'material': "Formatos de evaluación formativa\nBolígrafos"},
        {'etapa': "Descanso", 'actividades': ["Descanso"],
         'duracion': _tiempo(d, "Descanso"), 'tecnica': "", 'material': "Servicio de café"},
        {'etapa': f"Técnica Energizante\n\n{en}",
         'actividades': [
             f'El instructor aplicará la Técnica Energizante: "{en}".',
             f"a) Explicará objetivo:\n{tec.get('enObjetivo','')}",
             f"b) Dará instrucciones:\n{en_det}",
             "c) Mencionará el tiempo.", "d) Participará con el grupo.", "e) Controlará el tiempo.",
         ],
         'duracion': _tiempo(d, "Técnica Energizante"), 'tecnica': f"Técnica grupal:\n{en}", 'material': "Materiales de la técnica"},
        {'etapa': f"Unidad 3 — Afectivo / Relacional-social\n\n{NL.join(tem.get('u3') or [])}",
         'actividades': [
             "El instructor aplicará la técnica diálogo-discusión:",
             f"a) Mencionará el objetivo:\n{obj.get('afectiva','')}",
             f"b) Presentará la actividad:\n{dia.get('actividad','')}",
             f"c) Mencionará el tema a discutir:\n{dia.get('tema','')}",
             f"d) Indicará las instrucciones:\n{dia.get('instrucciones','')}",
             f"e) Indicará el tiempo:\n{dia.get('tiempo','')}", "f) Dividirá al grupo en subgrupos.",
             f"g) Establecerá reglas:\n{dia.get('reglas','')}",
             f"h) Abrirá la discusión:\n{dia.get('introduccion','')}",
             "i) Propiciará la discusión.", "j) Moderará la discusión.",
             f"k) Utilizará ejemplos:\n{dia.get('ejemplos','')}",
             f"l) Desarrollará conclusiones:\n{dia.get('conclusion','')}",
         ],
         'duracion': _tiempo(d, "Técnica diálogo-discusión"), 'tecnica': "Diálogo-discusión", 'material': "Laptop, proyector, PowerPoint"},
        {'etapa': "Evaluación Final",
         'actividades': [
             "El instructor realizará la evaluación final.",
             f"Instrumento: {_inst(ev.get('instSumativa'),'Cuestionario final')}",
             f"Indicará alcance, propósito y finalidad:\n{ev.get('apfSumativa') or 'Alcance: Abarca todos los contenidos temáticos y competencias desarrolladas durante el curso.\nPropósito: Comprobar el logro de aprendizaje integral adquirido por los participantes al concluir el curso.\nFinalidad: Acreditar los aprendizajes adquiridos por los participantes en el proceso de enseñanza-aprendizaje.'}",
             "Indicará instrucciones y tiempo.", "Aclarará dudas.",
         ],
         'duracion': _tiempo(d, "Evaluación final"), 'tecnica': "", 'material': "Formatos de evaluación final\nBolígrafos"},
        {'etapa': "Suma de los tiempos",
         'actividades': [f"Subtotal Desarrollo: {_subtotal(d, 'Desarrollo del curso')}"],
         'duracion': _subtotal(d, "Desarrollo del curso"), 'tecnica': "", 'material': ""},
    ]


def _filas_cierre(d):
    obj   = d.get('objetivos') or {}; c = d.get('cierre') or {}
    total = sum(int(f.get('tiempo') or 0) for b in (d.get('tiempos') or []) for f in (b.get('filas') or []))
    return [
        {'etapa': "1. Conclusiones",
         'actividades': [a for a in [
             "El instructor realizará la conclusión de los contenidos temáticos desarrollados.",
             "Mencionará los logros alcanzados.", "Preguntará la opinión sobre la aplicación de los temas.",
             c.get('texto',''),
         ] if a],
         'duracion': _tiempo(d, "Conclusión"), 'tecnica': "Técnica grupal de cierre", 'material': "Laptop, proyector, PowerPoint"},
        {'etapa': "2. Resumen general del curso",
         'actividades': [a for a in ["El instructor mencionará el resumen general del curso.", c.get('resumen','')] if a],
         'duracion': _tiempo(d, "Resumen general del curso"), 'tecnica': "", 'material': ""},
        {'etapa': "3. Logro de expectativas",
         'actividades': ["El instructor retomará las expectativas escritas al inicio y analizará si se cumplieron."],
         'duracion': _tiempo(d, "Logro de expectativas del curso"), 'tecnica': "", 'material': "Pintarrón"},
        {'etapa': "4. Logro de objetivos",
         'actividades': [f"El instructor preguntará acerca del logro de los objetivos.\n\nOBJETIVO GENERAL:\n{obj.get('general','')}\n\n¿Se cumplió el objetivo general del curso?"],
         'duracion': _tiempo(d, "Logro de los objetivos"), 'tecnica': "", 'material': "Laptop, proyector, PowerPoint"},
        {'etapa': "5. Sugerencias de continuidad",
         'actividades': [a for a in ["El instructor sugerirá acciones de continuidad en el aprendizaje.", c.get('sugerencias','')] if a],
         'duracion': _tiempo(d, "Sugerencias de continuidad del aprendizaje"), 'tecnica': "", 'material': ""},
        {'etapa': "6. Referencia(s) bibliográfica(s)",
         'actividades': [a for a in ["El instructor indicará las referencias bibliográficas.", c.get('referencias','')] if a],
         'duracion': _tiempo(d, "Referencia(s) bibliográfica"), 'tecnica': "", 'material': ""},
        {'etapa': "7. Compromisos de aplicación",
         'actividades': [a for a in ["El instructor conducirá al grupo a formular compromisos de aplicación.", c.get('compromisos','')] if a],
         'duracion': _tiempo(d, "Compromisos de aplicación del aprendizaje"), 'tecnica': "", 'material': ""},
        {'etapa': "8. Evaluación de satisfacción",
         'actividades': [
             "El instructor aplicará la evaluación de satisfacción.",
             "Indicará alcances e instrucciones de la evaluación.", "Indicará el tiempo.", "Aclarará dudas.",
         ],
         'duracion': _tiempo(d, "Evaluación de satisfacción"), 'tecnica': "", 'material': "Instrumentos de evaluación de satisfacción\nBolígrafos"},
        {'etapa': "9. Cierre",
         'actividades': ["El instructor empleará una técnica de cierre.", "El instructor dará las gracias."],
         'duracion': _tiempo(d, "Cierre"), 'tecnica': "", 'material': ""},
        {'etapa': "Suma de los tiempos",
         'actividades': [f"Subtotal Cierre: {_subtotal(d, 'Cierre del curso')}", f"TOTAL GENERAL: {total} min"],
         'duracion': _subtotal(d, "Cierre del curso"), 'tecnica': "", 'material': ""},
    ]
