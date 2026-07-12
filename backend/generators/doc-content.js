const { obtenerTiempo, obtenerSubtotalTiempo, extraerNombreInstrumento } = require('./cell-helpers');

function buildFilasContenido(d) {
  const tecnicas     = d.tecnicas     || {};
  const enc          = d.encuadre     || {};
  const obj          = d.objetivos    || {};
  const tem          = d.temario      || {};
  const ev           = d.evaluaciones || {};
  const expositiva   = d.expositiva   || {};
  const demostrativa = d.demostrativa || {};
  const dialogo      = d.dialogo      || {};
  const cierre       = d.cierre       || {};
  const descripcionGeneral = ev.descripcionGeneral || "";

  const preguntas   = enc.preguntas   || '';
  const reglasTexto = enc.reglasTexto || [];
  const otraRegla   = enc.otraRegla   || '';
  const rhNombre    = tecnicas.rhNombre  || 'Técnica Rompe Hielo';
  const enNombre    = tecnicas.enNombre  || 'Técnica Energizante';
  const enDetalle   = tecnicas.enDetalle || '';

  const rhDetalle = (() => {
    const raw = tecnicas.rhDetalle || '';
    if (!raw) return '';
    const rhTiempo = obtenerTiempo(d, "Presentación del Instructor");
    return raw.split('\n\n')
      .filter(p => !/^[def]\)/.test(p.trim()))
      .map(p => (/^c\)/.test(p.trim()) && rhTiempo)
        ? p.replace(/c\) Mencionará el tiempo para realizarla\.?/, `c) Mencionará el tiempo para realizarla: ${rhTiempo}`)
        : p)
      .join('\n\n');
  })();

  const filasPrevio = [{
    etapa: "Comprobación de la existencia y funcionamiento de los recursos requeridos",
    actividades: [
      "El instructor aplicará la Lista de verificación de requerimientos.",
      "El instructor realizará pruebas de funcionamiento del equipo.",
      "El instructor verificará la distribución del mobiliario y equipo.",
      "El instructor verificará la suficiencia de los materiales conforme al número de participantes."
    ],
    duracion: "10 min previos al inicio", tecnica: "", material: "Lista de verificación de requerimientos"
  }];

  const filasApertura = [
    { etapa: "1. Presentación del instructor / facilitador y de los participantes",
      actividades: [
        "El instructor se presentará ante el grupo.",
        "El instructor pedirá que se anoten en la lista de asistencia.",
        "El instructor propiciará la presentación de los participantes.",
        `El instructor aplicará la Técnica Rompe Hielo / Integración: "${rhNombre}".\n${rhDetalle}`
      ],
      duracion: obtenerTiempo(d, "Presentación del Instructor"),
      tecnica: `Técnica grupal:\n${rhNombre}`, material: "Lista de asistencia\nMateriales de la técnica" },
    { etapa: "2. Presentación del curso",
      actividades: [
        `El instructor presentará los objetivos del curso/sesión.\n\nOBJETIVO GENERAL:\n${obj.general || ''}\n\nOBJETIVOS PARTICULARES:\n1. (Cognitivo) ${obj.cognitiva || ''}\n\n2. (Psicomotriz) ${obj.psicomotriz || ''}\n\n3. (Afectivo) ${obj.afectiva || ''}`,
        `El instructor presentará la descripción general del desarrollo del curso/sesión.\n${descripcionGeneral}`,
        `El instructor mencionará el temario del curso/sesión.\n\nUnidad 1:\n${(tem.u1||[]).join('\n')}\n\nUnidad 2:\n${(tem.u2||[]).join('\n')}\n\nUnidad 3:\n${(tem.u3||[]).join('\n')}`,
        `El instructor creará un ambiente participativo mediante preguntas relacionadas con el contexto o experiencia de los participantes.\n${preguntas}`,
        `El instructor explicará los beneficios del curso/sesión y su relación con la experiencia laboral y personal.\n${d.beneficios || ''}`,
        `El instructor especificará el tipo de evaluaciones a realizar, los instrumentos a utilizar, el momento de aplicarlos y los criterios a utilizar.\n\na) Evaluación Diagnóstica (${extraerNombreInstrumento(ev.instDiagnostica,'Cuestionario')}) — Al inicio. ${ev.pctDiagnostica||0}% solo referencial.\nFinalidad: Identificar el nivel de conocimientos previos de los participantes como punto de partida del curso.\n\nb) Evaluación Formativa (${extraerNombreInstrumento(ev.instFormativa,'Lista de cotejo / Guía de observación')}) — Intermedia. ${ev.pctFormativa||0}%.\nFinalidad: Identificar la comprensión y avance logrado por los participantes durante el curso.\n\nc) Evaluación Sumativa (${extraerNombreInstrumento(ev.instSumativa,'Cuestionario')}) — Al final. ${ev.pctSumativa||0}%.\nFinalidad: Acreditar los aprendizajes adquiridos por los participantes en el proceso de enseñanza-aprendizaje.\n\nd) Criterios de evaluación:\n- Conocimientos Teóricos.\n- Actitud y comportamiento.\n- Evaluaciones aplicadas.`
      ],
      duracion: obtenerTiempo(d, "Objetivos del curso/sesión"), tecnica: "", material: "Laptop, proyector, PowerPoint" },
    { etapa: "3. Acuerdos y compromisos",
      actividades: [
        "El instructor acordará con el grupo las expectativas del curso/sesión.\nEl instructor clarificará el alcance del curso de acuerdo con las expectativas planteadas.",
        `El instructor acordará con el grupo las reglas de operación del curso/sesión.\n${[...reglasTexto,...(otraRegla?[otraRegla]:[])].join('\n')}`,
        "El instructor realizará el contrato de aprendizaje con los participantes.\nAlcance: El contrato establece los compromisos mutuos entre el instructor y los participantes para garantizar el logro de los objetivos.\nInstrucciones: Ambas partes leen, acuerdan y firman el contrato como compromiso de participación y aprovechamiento del curso."
      ],
      duracion: obtenerTiempo(d, "Reglas de operación del curso"), tecnica: "", material: "Hojas blancas\nFormatos de contrato de aprendizaje" },
    { etapa: "4. Evaluación diagnóstica",
      actividades: [
        "El instructor realizará la evaluación diagnóstica.",
        `Instrumento: ${extraerNombreInstrumento(ev.instDiagnostica,'Cuestionario diagnóstico')}`,
        "Indicará alcance, propósito y finalidad de la evaluación:\nFinalidad: Identificar el nivel de conocimientos previos de los participantes como punto de partida del curso.",
        "Indicará las instrucciones y el tiempo para realizarla.",
        "Aclarará las dudas que se presenten.",
        "Mencionará que los errores son oportunidades para fortalecer el aprendizaje."
      ],
      duracion: obtenerTiempo(d, "Evaluación diagnóstica"), tecnica: "", material: "Instrumentos diagnósticos\nBolígrafos" },
    { etapa: "Suma de los tiempos",
      actividades: [`Subtotal Apertura / Encuadre: ${obtenerSubtotalTiempo(d,"Inicio / Encuadre del curso")}`],
      duracion: obtenerSubtotalTiempo(d,"Inicio / Encuadre del curso"), tecnica: "", material: "" }
  ];

  const filasDesarrollo = [
    { etapa: `Unidad 1 — Cognitivo\n\n${(tem.u1||[]).join('\n')}`,
      actividades: [
        "El instructor aplicará la técnica expositiva:",
        `a) Presentará el objetivo del tema:\n${obj.cognitiva||''}`,
        `b) Realizará una introducción general al contenido temático:\n${expositiva.introduccion||''}`,
        `c) Recuperará la experiencia previa de los participantes:\n${expositiva.experiencia||''}`,
        `d) Desarrollará el contenido:\n${expositiva.desarrollo||''}`,
        `e) Utilizará ejemplos relacionados con los temas y situaciones cotidianas:\n${expositiva.ejemplos||''}`,
        `g) Realizará la síntesis haciendo énfasis en los aspectos sobresalientes:\n${expositiva.sintesis||''}`,
        `h) Planteará preguntas dirigidas que verifiquen la comprensión del tema:\n${expositiva.preguntas||''}`,
        `i) Promoverá comentarios sobre la utilidad y aplicación de los temas:\n${expositiva.utilidad||''}`
      ],
      duracion: obtenerTiempo(d,"Técnica expositiva"), tecnica: "Expositiva", material: "Laptop, proyector, PowerPoint" },
    { etapa: `Unidad 2 — Psicomotriz\n\n${(tem.u2||[]).join('\n')}`,
      actividades: [
        "El instructor aplicará la técnica demostrativa:",
        `a) Presentará objetivo de la actividad a desarrollar:\n${obj.psicomotriz||''}`,
        `b) Recuperará la experiencia previa de los participantes:\n${demostrativa.experiencia||''}`,
        `c) Presentará la actividad a desarrollar y mencionará el propósito de la misma:\n${demostrativa.actividad||''}`,
        "d) Ejemplificará la actividad a desarrollar.",
        "e) Resolverá dudas sobre la demostración realizada.",
        "f) Permitirá que los participantes realicen la práctica.",
        "g) Retroalimentará sobre la práctica.",
        `h) Usará ejemplos relacionados con los temas y situaciones cotidianas:\n${demostrativa.ejemplos||''}`,
        `i) Preguntará por los conocimientos adquiridos y la utilidad de lo aprendido:\n${demostrativa.preguntas||''}`,
        "j) Recordará al grupo las reglas de operación acordadas.",
        "k) Mencionará al grupo los logros alcanzados y lo que falta por abordar."
      ],
      duracion: obtenerTiempo(d,"Técnica demostrativa"), tecnica: "Demostrativa", material: "Laptop, proyector, PowerPoint" },
    { etapa: "Evaluación Formativa",
      actividades: [
        "El instructor realizará la evaluación formativa.",
        `Instrumento: ${extraerNombreInstrumento(ev.instFormativa,'Lista de cotejo / Guía de observación')}`,
        "Indicará alcance, propósito y finalidad de la evaluación:\nFinalidad: Identificar la comprensión y avance logrado por los participantes durante el curso.",
        "Indicará las instrucciones y el tiempo para realizarla.", "Aclarará las dudas que se presenten."
      ],
      duracion: obtenerTiempo(d,"Evaluación formativa"), tecnica: "", material: "Formatos de evaluación formativa\nBolígrafos" },
    { etapa: "Descanso", actividades: ["Descanso"],
      duracion: obtenerTiempo(d,"Descanso"), tecnica: "", material: "Servicio de café" },
    { etapa: `Técnica Energizante\n\n${enNombre}`,
      actividades: [
        `El instructor aplicará la Técnica Energizante: "${enNombre}".`,
        `a) Explicará objetivo de la técnica:\n${tecnicas.enObjetivo||''}`,
        `b) Dará las instrucciones de la técnica:\n${enDetalle}`,
        "c) Mencionará el tiempo para realizarla.",
        "d) Participará con el grupo en la técnica.",
        "e) Controlará el tiempo para realizar la técnica."
      ],
      duracion: obtenerTiempo(d,"Técnica Energizante"), tecnica: `Técnica grupal:\n${enNombre}`, material: "Materiales de la técnica" },
    { etapa: `Unidad 3 — Afectivo / Relacional-social\n\n${(tem.u3||[]).join('\n')}`,
      actividades: [
        "El instructor aplicará la técnica diálogo-discusión:",
        `a) Mencionará el objetivo de la técnica:\n${obj.afectiva||''}`,
        `b) Presentará la actividad a desarrollar:\n${dialogo.actividad||''}`,
        `c) Mencionará el tema/planteamiento/reto a discutir:\n${dialogo.tema||''}`,
        `d) Indicará las instrucciones de la actividad:\n${dialogo.instrucciones||''}`,
        `e) Indicará el tiempo asignado a la actividad:\n${dialogo.tiempo||''}`,
        "f) Dividirá al grupo en subgrupos.",
        `g) Establecerá reglas de operación con la participación del grupo:\n${dialogo.reglas||''}`,
        `h) Abrirá la discusión recordando el tema a ser discutido:\n${dialogo.introduccion||''}`,
        "i) Propiciará la discusión de los equipos.", "j) Moderará la discusión.",
        `k) Utilizará ejemplos relacionados con los temas y las situaciones cotidianas:\n${dialogo.ejemplos||''}`,
        `l) Desarrollará junto con el grupo las conclusiones acerca del tema discutido y su utilidad:\n${dialogo.conclusion||''}`
      ],
      duracion: obtenerTiempo(d,"Técnica diálogo-discusión"), tecnica: "Diálogo-discusión", material: "Laptop, proyector, PowerPoint" },
    { etapa: "Evaluación Final",
      actividades: [
        "El instructor realizará la evaluación final.",
        `Instrumento: ${extraerNombreInstrumento(ev.instSumativa,'Cuestionario final')}`,
        "Indicará alcances, estrategias e instrucciones de la evaluación:\nFinalidad: Acreditar los aprendizajes adquiridos por los participantes en el proceso de enseñanza-aprendizaje.",
        "Indicará el tiempo para realizar la evaluación.", "Aclarará las dudas que se presenten."
      ],
      duracion: obtenerTiempo(d,"Evaluación final"), tecnica: "", material: "Formatos de evaluación final\nBolígrafos" },
    { etapa: "Suma de los tiempos",
      actividades: [`Subtotal Desarrollo: ${obtenerSubtotalTiempo(d,"Desarrollo del curso")}`],
      duracion: obtenerSubtotalTiempo(d,"Desarrollo del curso"), tecnica: "", material: "" }
  ];

  const filasCierre = [
    { etapa: "1. Conclusiones",
      actividades: ["El instructor realizará la conclusión de los contenidos temáticos desarrollados con apoyo del grupo.", "Mencionará los logros alcanzados.", "Preguntará la opinión de los participantes sobre la aplicación de los temas tratados.", cierre.texto||""].filter(Boolean),
      duracion: obtenerTiempo(d,"Conclusión"), tecnica: "Técnica grupal de cierre", material: "Laptop, proyector, PowerPoint" },
    { etapa: "2. Resumen general del curso",
      actividades: ["El instructor mencionará el resumen general del curso, invitando a los participantes a resumir los contenidos.", cierre.resumen||""].filter(Boolean),
      duracion: obtenerTiempo(d,"Resumen general del curso"), tecnica: "", material: "" },
    { etapa: "3. Logro de expectativas",
      actividades: ["El instructor retomará las expectativas escritas por los participantes al inicio del curso y analizará en grupo si se cumplieron."],
      duracion: obtenerTiempo(d,"Logro de expectativas del curso"), tecnica: "", material: "Pintarrón" },
    { etapa: "4. Logro de objetivos",
      actividades: [`El instructor preguntará a los participantes acerca del logro de los objetivos.\n\nOBJETIVO GENERAL:\n${obj.general||''}\n\n¿Se cumplió el objetivo general del curso?`],
      duracion: obtenerTiempo(d,"Logro de los objetivos"), tecnica: "", material: "Laptop, proyector, PowerPoint" },
    { etapa: "5. Sugerencias de continuidad",
      actividades: ["El instructor sugerirá acciones que permitan la continuidad en el aprendizaje.", cierre.sugerencias||""].filter(Boolean),
      duracion: obtenerTiempo(d,"Sugerencias de continuidad del aprendizaje"), tecnica: "", material: "" },
    { etapa: "6. Referencia(s) bibliográfica(s)",
      actividades: ["El instructor indicará las referencias bibliográficas o fuentes de información del aprendizaje del curso/sesión.", cierre.referencias||""].filter(Boolean),
      duracion: obtenerTiempo(d,"Referencia(s) bibliográfica"), tecnica: "", material: "" },
    { etapa: "7. Compromisos de aplicación",
      actividades: ["El instructor conducirá al grupo a la formulación de compromisos de aplicación del aprendizaje.", cierre.compromisos||""].filter(Boolean),
      duracion: obtenerTiempo(d,"Compromisos de aplicación del aprendizaje"), tecnica: "", material: "" },
    { etapa: "8. Evaluación de satisfacción",
      actividades: ["El instructor aplicará la evaluación de satisfacción.", "Indicará alcances e instrucciones de la evaluación:\nFinalidad: Conocer el nivel de satisfacción de los participantes respecto al curso, el instructor y las instalaciones.", "Indicará el tiempo para realizarla.", "Aclarará las dudas que se presenten."],
      duracion: obtenerTiempo(d,"Evaluación de satisfacción"), tecnica: "", material: "Instrumentos de evaluación de satisfacción\nBolígrafos" },
    { etapa: "9. Cierre",
      actividades: ["El instructor empleará una técnica de cierre.", "El instructor dará las gracias."],
      duracion: obtenerTiempo(d,"Cierre"), tecnica: "", material: "" },
    { etapa: "Suma de los tiempos",
      actividades: [
        `Subtotal Cierre: ${obtenerSubtotalTiempo(d,"Cierre del curso")}`,
        `TOTAL GENERAL: ${(() => {
          const bloques = Array.isArray(d.tiempos) ? d.tiempos : [];
          return bloques.reduce((acc,b) => acc+(b.filas||[]).reduce((s,f)=>s+Number(f.tiempo||0),0),0)+' min';
        })()}`
      ],
      duracion: obtenerSubtotalTiempo(d,"Cierre del curso"), tecnica: "", material: "" }
  ];

  return { filasPrevio, filasApertura, filasDesarrollo, filasCierre };
}

module.exports = { buildFilasContenido };
