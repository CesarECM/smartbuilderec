// ─── wizard/tecnicas-data.js — Catálogo de técnicas EC0217 ────────────────────

export const tecnicasRompehielos = [
  {
    id: "bingo",
    nombre: "El Bingo de Presentación",
    objetivo: "Romper la barrera de aproximación física inicial, fomentar el contacto visual y propiciar presentaciones breves entre participantes que aún no se conocen.",
    instrucciones: `Desarrollo:
1. El instructor distribuye a cada participante una cuadrícula de 2x2 con iconos o atributos visuales (al estilo de la Lotería).
2. Cada participante debe circular libremente por el espacio buscando a compañeros que coincidan con los iconos de su cuadrícula.
3. Al encontrar a alguien que coincida con un icono, el participante le pide que firme o escriba su nombre en el recuadro correspondiente.
4. Gana el primero en completar su cuadrícula con cuatro firmas diferentes.
5. El instructor cierra la actividad invitando a compartir quién completó el bingo primero y qué descubrió de sus compañeros.`,
    duracion: "10 a 15 minutos",
    participacion: "",
    integracion: "",
    controlTiempo: ""
  },
  {
    id: "dos-verdades",
    nombre: "Dos Verdades y Una Mentira",
    objetivo: "Abrir canales de observación y escucha activa entre los participantes, generando un ambiente de curiosidad mutua y confianza inicial.",
    instrucciones: `Desarrollo:
1. Cada participante piensa en tres afirmaciones sobre su vida personal o trayectoria profesional: dos verdaderas y una falsa.
2. De forma voluntaria o en turnos, cada persona expone sus tres afirmaciones al grupo sin revelar cuál es la mentira.
3. El resto del grupo analiza, debate y vota cuál de las tres consideran que es la afirmación falsa.
4. El participante revela la mentira y, si lo desea, explica brevemente el contexto de las dos verdades.
5. El instructor facilita la dinámica manteniendo un ritmo ágil y promoviendo la participación equitativa.`,
    duracion: "",
    participacion: "",
    integracion: "",
    controlTiempo: ""
  },
  {
    id: "objetos-historia",
    nombre: "Objetos con Historia (Secreto)",
    objetivo: "Fomentar la capacidad de abstracción, la descripción precisa y la empatía a través del valor simbólico que cada persona otorga a los objetos cotidianos.",
    instrucciones: `Desarrollo:
1. Cada participante selecciona un objeto personal que porte consigo (llaves, joyería, agenda, etc.) sin revelarlo al grupo.
2. Tiene un máximo de 60 segundos para describir el objeto únicamente a través de sus funciones, las sensaciones que produce o su importancia emocional, sin nombrarlo ni describir su apariencia directamente.
3. El resto del grupo escucha y, al finalizar, propone en voz alta qué objeto creen que es.
4. El participante revela el objeto y comparte brevemente por qué lo eligió.
5. El instructor refuerza la escucha activa comentando los elementos descriptivos más creativos o precisos que escuchó.`,
    duracion: "",
    participacion: "",
    integracion: "",
    controlTiempo: ""
  },
  {
    id: "tombola",
    nombre: "La Tómbola de Preguntas",
    objetivo: "Promover la espontaneidad y la apertura verbal ante el grupo, reduciendo el miedo a la participación pública mediante el azar como elemento liberador.",
    instrucciones: `Desarrollo:
1. El grupo forma un círculo y se coloca en el centro un recipiente (tómbola, bolsa o caja) con preguntas escritas en tarjetas, por ejemplo: ¿Cuál es tu mayor reto hoy?, ¿Qué esperas aprender aquí?, ¿Qué habilidad te enorgullece?
2. Se entrega un objeto (pelota, borrador, etc.) que se pasará entre los participantes mientras suena música o a criterio del instructor.
3. Cuando el instructor lo indique, quien tenga el objeto extrae una tarjeta de la tómbola y responde la pregunta en voz alta ante el grupo.
4. No hay respuestas correctas o incorrectas; el instructor refuerza positivamente cada participación.
5. La dinámica continúa hasta que todos hayan respondido al menos una pregunta.`,
    duracion: "",
    participacion: "",
    integracion: "",
    controlTiempo: ""
  },
  {
    id: "red-similitudes",
    nombre: "La Red de Similitudes (Round Robin)",
    objetivo: "Crear identidad de equipo y cohesión grupal mediante el reconocimiento de afinidades compartidas entre los participantes.",
    instrucciones: `Desarrollo:
1. Se forman equipos de máximo 6 personas.
2. A la señal del instructor, inicia una ronda de conversación libre con un tiempo límite de 5 minutos por equipo.
3. Cada equipo debe identificar y anotar el mayor número posible de puntos en común entre sus integrantes: experiencias, gustos, miedos, logros, hábitos, etc.
4. Al concluir el tiempo, cada equipo comparte ante el grupo sus tres similitudes más sorprendentes o llamativas.
5. El instructor cierra la actividad destacando cómo las personas comparten más de lo que suponen al primer encuentro.`,
    duracion: "",
    participacion: "",
    integracion: "",
    controlTiempo: ""
  },
  {
    id: "circulo-cumpleanos",
    nombre: "El Círculo de Cumpleaños (Mudo)",
    objetivo: "Desarrollar estrategias de comunicación no verbal y evidenciar la capacidad del grupo para resolver un problema colectivo bajo la restricción del silencio.",
    instrucciones: `Desarrollo:
1. El instructor indica al grupo que deberán ordenarse en una línea o círculo de forma cronológica por día y mes de nacimiento (del 1 de enero al 31 de diciembre).
2. Se establece la restricción estricta: absolutamente nadie puede emitir sonidos ni hablar durante toda la actividad.
3. Los participantes deben encontrar la manera de comunicarse únicamente a través de gestos, señas, expresiones faciales o escritura en papel.
4. El instructor observa sin intervenir, tomando nota de los liderazgos espontáneos y las estrategias comunicativas que emergen.
5. Al finalizar, el grupo verifica si el orden es correcto y el instructor facilita una reflexión breve sobre los métodos de comunicación utilizados.`,
    duracion: "",
    participacion: "",
    integracion: "",
    controlTiempo: ""
  },
  {
    id: "isla-desierta",
    nombre: "La Isla Desierta",
    objetivo: "Facilitar la negociación, la exposición de argumentos lógicos y la jerarquización de valores y prioridades grupales en un contexto de decisión bajo presión.",
    instrucciones: `Desarrollo:
1. El instructor presenta el escenario: el grupo ha naufragado en una isla desierta y debe elegir colectivamente solo 3 objetos de una lista predefinida de 10 para sobrevivir y ser rescatados (ej. cuerda, fósforos, radio, navaja, botiquín, lona, mapa, etc.).
2. Cada participante reflexiona individualmente durante 2 minutos y elige sus 3 objetos personales con argumentos.
3. Se abre el debate grupal: cada persona expone y defiende sus elecciones. El grupo debe llegar a un consenso de 3 objetos en común.
4. El instructor no impone soluciones; su rol es garantizar que todos los participantes tengan voz durante el debate.
5. Al concluir, el instructor facilita una reflexión sobre los procesos de negociación, los roles asumidos y cómo se tomó la decisión final.`,
    duracion: "",
    participacion: "",
    integracion: "",
    controlTiempo: ""
  },
  {
    id: "mapa-ficticio",
    nombre: "El Mapa Ficticio",
    objetivo: "Explorar la autopercepción y la identidad a través de la proyección simbólica, desarrollando la descripción precisa y la escucha interpretativa entre los participantes.",
    instrucciones: `Desarrollo:
1. El instructor proyecta o distribuye impreso un mapa ficticio con personajes diversos: pueden ser ilustraciones de un mundo de fantasía, un tablero de juego o una ilustración temática con múltiples figuras.
2. Cada participante observa el mapa en silencio durante 1-2 minutos y elige mentalmente un personaje con el que se identifique, sin comunicarlo a nadie.
3. En turno, cada participante describe en voz alta por qué eligió a ese personaje: qué rasgos le atraen, qué representa para él o ella, qué tiene en común con su forma de ser o trabajar. No menciona el nombre ni la apariencia del personaje.
4. El resto del grupo escucha y, al finalizar la descripción, señala en el mapa cuál cree que es el personaje elegido.
5. El participante confirma su elección y el instructor facilita una reflexión breve sobre los valores y rasgos que cada persona proyectó en su personaje.`,
    duracion: "",
    participacion: "",
    integracion: "",
    controlTiempo: ""
  },
  {
    id: "linea-tiempo",
    nombre: "La Línea del Tiempo Compartida",
    objetivo: "Desarrollar la escucha activa y la retroalimentación positiva entre participantes, conectando su historia personal con hitos relevantes del contexto en el que se encuentran.",
    instrucciones: `Desarrollo:
1. El instructor presenta una línea del tiempo preconfigurada que incluye hitos sobresalientes: pueden ser eventos del tema del curso, de la historia de la empresa u organización, o de la historia reciente de interés común.
2. Cada participante recibe una tira de papel y marca sobre ella 3 momentos de su propia trayectoria profesional que considere significativos (inicio, punto de quiebre y estado actual), vinculándolos opcionalmente con los hitos del contexto mostrado.
3. En parejas rotativas con un tiempo de 90 segundos por turno, cada participante presenta su línea de tiempo al compañero.
4. El oyente tiene la tarea de identificar y verbalizar en voz alta una fortaleza o patrón positivo que observe en la trayectoria de quien presenta.
5. El instructor cierra la actividad invitando a dos o tres voluntarios a compartir qué fortaleza les fue reconocida y cómo se sintieron al escucharla.`,
    duracion: "",
    participacion: "",
    integracion: "",
    controlTiempo: ""
  },
  {
    id: "telegrama",
    nombre: "El Telegrama de 10 Palabras",
    objetivo: "Entrenar la síntesis y la comunicación bajo restricción, eliminando el miedo a hablar en público al igualar a todos los participantes bajo la misma limitación.",
    instrucciones: `Desarrollo:
1. El instructor explica la regla fundamental: cada participante debe presentarse al grupo usando exactamente 10 palabras. Ni una más, ni una menos. Las 10 palabras deben incluir: su nombre, su rol o profesión y una expectativa del curso o actividad.
2. Se otorgan 2 minutos de preparación individual para que cada persona redacte y ensaye su telegrama.
3. En turno, cada participante lee o expone su telegrama en voz alta frente al grupo. El instructor puede contar públicamente las palabras para mantener el juego.
4. Opcionalmente, el grupo vota levantando la mano por el telegrama más preciso y por el más creativo o ingenioso.
5. El instructor cierra la actividad felicitando la participación general y destacando cómo la restricción obliga a identificar lo verdaderamente esencial de uno mismo.`,
    duracion: "",
    participacion: "",
    integracion: "",
    controlTiempo: ""
  }
];

export const tecnicasEnergizantes = [
  {
    id: "memorama",
    nombre: "Memorama",
    objetivo: "Que el participante se relaje y aumente su entusiasmo para fomentar su aprendizaje, estimulando la memoria visual y la concentración a través del juego.",
    instrucciones: `Desarrollo:
1. El instructor distribuye sobre una mesa o superficie plana un conjunto de tarjetas boca abajo, organizadas en filas y columnas. Cada tarjeta tiene un par idéntico entre el mazo.
2. Se determina el orden de participación, ya sea por turno, de manera voluntaria o al azar.
3. Cada participante, en su turno, voltea dos tarjetas. Si las tarjetas son iguales, se queda con el par y vuelve a voltear otras dos.
4. Si las tarjetas son diferentes, las vuelve a colocar boca abajo en su lugar original y cede el turno al siguiente participante.
5. Gana quien acumule más pares al finalizar todas las tarjetas. El instructor celebra el desempeño del grupo y aprovecha para reactivar la energía con aplausos o una celebración breve.`
  },
  {
    id: "nudo-humano",
    nombre: "El Nudo Humano",
    objetivo: "Activar el movimiento corporal y la coordinación grupal, generando energía positiva y trabajo colaborativo mediante el contacto físico y la resolución creativa de problemas.",
    instrucciones: `Desarrollo:
1. El grupo forma un círculo compacto, hombro con hombro.
2. A la señal del instructor, cada participante extiende ambas manos hacia el centro y toma las manos de dos personas diferentes, asegurándose de no tomar ambas manos de la misma persona ni la mano del compañero inmediato de su lado.
3. Una vez que todos están conectados, el grupo debe desenredarse y formar de nuevo un círculo sin soltar las manos en ningún momento.
4. El instructor observa, anima al grupo y puede permitir una sola reconexión si el nudo resulta imposible de resolver.
5. Al finalizar, el instructor invita al grupo a reflexionar brevemente sobre la estrategia que usaron y cómo se comunicaron para lograrlo.`
  },
  {
    id: "zip-zap-boing",
    nombre: "Zip Zap Boing",
    objetivo: "Activar los reflejos, la atención sostenida y el estado de alerta en el grupo mediante un juego de reacción verbal que genera dinamismo y risas espontáneas.",
    instrucciones: `Desarrollo:
1. El grupo forma un círculo de pie. El instructor explica las tres reglas: "Zip" envía la energía al participante siguiente en el sentido de las manecillas del reloj; "Zap" la envía directamente a cualquier persona al otro lado del círculo señalándola con los dedos; "Boing" la rebota de regreso a quien la envió.
2. El instructor inicia diciendo "Zip" y pasando la energía. El juego debe mantener un ritmo ágil, sin pausas largas.
3. Quien cometa un error, confunda el comando, tarde demasiado o reaccione fuera de turno, recibe una penitencia simbólica o queda eliminado según decida el instructor.
4. A medida que el grupo domina las reglas, el instructor puede aumentar la velocidad o añadir variantes.
5. El instructor finaliza la dinámica con un cierre energético: todos gritan al mismo tiempo una palabra acordada o aplauden con ritmo.`
  },
  {
    id: "respiracion-478",
    nombre: "Respiración 4-7-8",
    objetivo: "Activar el sistema nervioso parasimpático para reducir el estrés, mejorar la concentración y preparar al participante para un aprendizaje más receptivo y enfocado.",
    instrucciones: `Desarrollo:
1. El instructor indica a todos que adopten una postura cómoda, ya sea sentados con la espalda recta o de pie con los hombros relajados.
2. Se explica la técnica: inhalar por la nariz durante 4 segundos, retener el aire durante 7 segundos y exhalar lentamente por la boca durante 8 segundos, emitiendo un sonido suave si se desea.
3. El instructor guía el ritmo en voz alta, contando o usando señas visuales para los tres ciclos completos.
4. Se repite la secuencia completa de tres a cuatro veces de manera consecutiva.
5. Al finalizar, el instructor invita al grupo a notar cómo se siente su cuerpo y su mente, y aprovecha para hacer la transición hacia la siguiente actividad con una pregunta activadora.`
  },
  {
    id: "espejo",
    nombre: "El Espejo",
    objetivo: "Desarrollar la atención plena, la coordinación interhemisférica y la conexión interpersonal a través de la imitación consciente del movimiento del otro.",
    instrucciones: `Desarrollo:
1. Los participantes se organizan en parejas y se colocan frente a frente, a una distancia de aproximadamente un brazo extendido.
2. Se designa quién inicia como líder y quién como espejo. El líder comienza a realizar movimientos lentos y continuos con su cuerpo: brazos, cabeza, torso y expresiones faciales.
3. El espejo debe imitar cada movimiento con la mayor precisión y fluidez posible, como si fuera el reflejo en un espejo real.
4. A la señal del instructor, ya sea un aplauso o una indicación verbal, los roles se invierten sin interrumpir el movimiento.
5. Opcionalmente, en una tercera fase, ninguno de los dos lidera: ambos deben moverse en sincronía sin acuerdo previo, desarrollando sensibilidad hacia el movimiento del otro. El instructor cierra con una reflexión breve sobre la escucha no verbal.`
  },
  {
    id: "palabras-encadenadas",
    nombre: "Palabras Encadenadas por Categoría",
    objetivo: "Estimular la agilidad mental, la velocidad de procesamiento y la activación cognitiva del grupo mediante un juego de asociación verbal bajo presión de tiempo.",
    instrucciones: `Desarrollo:
1. El grupo se coloca en círculo, de pie o sentado. El instructor anuncia la primera categoría, por ejemplo: animales, países, frutas o marcas de autos.
2. El instructor da inicio y cada participante, en el sentido de las manecillas del reloj, debe decir en voz alta una palabra que pertenezca a la categoría en un máximo de 3 segundos.
3. No se puede repetir una palabra ya dicha en la misma ronda. Quien no responda en el tiempo establecido, repita una palabra o diga una que no pertenezca a la categoría, cambia la categoría para el siguiente participante.
4. El instructor mantiene el ritmo animando al grupo y puede señalar con palmadas el conteo de 3 segundos.
5. Se realizan mínimo tres rondas con categorías diferentes, incrementando la dificultad gradualmente.`
  },
  {
    id: "palmadas-ritmo",
    nombre: "Palmadas con Ritmo (Body Percussion)",
    objetivo: "Activar la coordinación motriz, la memoria rítmica y la cohesión grupal mediante la creación colectiva de patrones de percusión corporal.",
    instrucciones: `Desarrollo:
1. El instructor presenta un patrón básico de body percussion, por ejemplo: dos palmadas en los muslos, una palmada de manos y un chasquido de dedos.
2. El grupo replica el patrón completo junto con el instructor hasta dominarlo con fluidez.
3. Una vez dominado el patrón base, el instructor añade una nueva capa o variación al patrón. El grupo debe integrar la nueva capa sin perder el ritmo.
4. Se agregan capas de complejidad de forma progresiva: cambios de tempo, adición de sonidos vocales o división del grupo en dos partes que ejecutan patrones complementarios.
5. El instructor cierra la secuencia llevando el ritmo a un clímax y terminando con un remate final en conjunto, seguido de aplausos espontáneos del grupo.`
  },
  {
    id: "secuencia-simon",
    nombre: "La Secuencia Simón",
    objetivo: "Estimular la memoria de trabajo, la atención selectiva y la agilidad de respuesta motriz a través de la replicación progresiva de secuencias de movimiento.",
    instrucciones: `Desarrollo:
1. El instructor explica la dinámica: realizará una secuencia de movimientos corporales, por ejemplo aplaudir, tocarse la cabeza, saltar o girar, y el grupo deberá replicarla exactamente.
2. Inicia con una secuencia de 3 movimientos. El grupo la observa en silencio y luego la replica en conjunto a la señal del instructor.
3. Si el grupo la ejecuta correctamente, el instructor añade un movimiento nuevo al final de la secuencia existente. La secuencia siempre se ejecuta desde el principio.
4. Si alguien falla, puede quedar eliminado o recibir una penitencia simbólica, según decida el instructor de acuerdo con el clima del grupo.
5. La dinámica continúa hasta alcanzar una secuencia de 7 a 10 movimientos o hasta que solo queden dos o tres participantes. El instructor reconoce al grupo por su concentración y memoria.`
  },
  {
    id: "numero-prohibido",
    nombre: "El Número Prohibido",
    objetivo: "Activar la concentración, la inhibición de respuesta automática y el estado de alerta cognitivo mediante una tarea de sustitución numérica que desafía el piloto automático mental.",
    instrucciones: `Desarrollo:
1. El grupo se coloca en círculo. El instructor explica la regla: contarán en orden ascendente del 1 en adelante, pero cada vez que corresponda decir un múltiplo de 3, o el número que el instructor designe como prohibido, el participante debe decir "¡Boom!" en lugar del número.
2. El instructor hace una demostración corta con los primeros 10 números para que el grupo comprenda la dinámica.
3. Se inicia el conteo en círculo. Quien diga el número prohibido en lugar de "¡Boom!", o quien dude más de 3 segundos, queda eliminado o cede su lugar al siguiente.
4. Cuando el grupo domina la regla con los múltiplos de 3, el instructor puede añadir un segundo número prohibido, por ejemplo múltiplos de 5 = "¡Pum!", para incrementar la dificultad.
5. El instructor cierra la actividad reconociendo a quienes llegaron más lejos y utilizando el error como momento de humor y aprendizaje sobre la atención.`
  },
  {
    id: "caminata-intenciones",
    nombre: "Caminata de Intenciones",
    objetivo: "Activar el estado emocional y la energía corporal del grupo mediante el movimiento consciente guiado, rompiendo la inercia física y mental generada por el sedentarismo prolongado.",
    instrucciones: `Desarrollo:
1. El instructor indica a todos que se pongan de pie y comiencen a caminar libremente por el espacio disponible en la sala, sin un destino fijo.
2. Cada 20 a 30 segundos, el instructor da una nueva instrucción que cambia el estado de la caminata, por ejemplo: "Camina como si llegaras tarde a una reunión muy importante", "Camina como si el piso fuera de lava y debes ir con cuidado", "Saluda a todos los que encuentres como si fueran las personas más importantes del mundo", "Camina como si acabaras de recibir una gran noticia".
3. Los participantes deben adoptar la instrucción de inmediato con el cuerpo completo: postura, expresión facial, velocidad y gesticulación.
4. El instructor varía las instrucciones entre estados de alta energía y estados de calma o elegancia para producir un contraste activador.
5. Para cerrar, el instructor da la instrucción final: "Camina como alguien que está listo para aprender algo que va a cambiar su trabajo" y detiene al grupo en ese estado, haciendo la transición directa hacia el siguiente bloque del programa.`
  }
];
