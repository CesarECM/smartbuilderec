// W#1/W#2 → wizard/ui-sync.js | Sidebar → wizard/ui-sidebar.js
// Abrir automáticamente el grupo que contiene el item activo
function abrirGrupoActivo() {
  const activo = document.querySelector(".nav-item.active");
  if (!activo) return;
  const grupo = activo.closest(".nav-grupo-items");
  if (grupo) {
    grupo.classList.add("open");
    grupo.classList.remove("closed");
    const arrow = grupo.previousElementSibling?.querySelector(".nav-grupo-arrow");
    if (arrow) arrow.textContent = "▾";
  }
}

(async () => {
  if (window.location.pathname === '/' && !window.location.search) {
    const _s = await getSession();
    if (_s) { window.location.replace('/panel'); return; }
  }
  if (!await authGuard()) return;
  await storageSync.init();

  // Si admin/superadmin está editando la planeación de otro usuario, mostrar banner
  const adminEditing = localStorage.getItem("sbe_admin_editing");
  if (adminEditing) {
    const banner = document.createElement("div");
    banner.id = "admin-edit-banner";
    banner.style.cssText = [
      "position:fixed;top:0;left:0;right:0;z-index:9999",
      "background:#1e40af;color:white;text-align:center",
      "padding:9px 48px 9px 16px;font-size:13px;font-weight:600",
      "box-shadow:0 2px 8px rgba(0,0,0,0.3)"
    ].join(";");
    banner.textContent = "✏️ Editando planeación de: " + adminEditing + ". Los cambios se guardan automáticamente.";
    const closeBtn = document.createElement("button");
    closeBtn.textContent = "✕";
    closeBtn.style.cssText = "position:absolute;right:14px;top:50%;transform:translateY(-50%);background:rgba(255,255,255,0.2);border:none;color:white;padding:3px 9px;border-radius:4px;cursor:pointer;font-size:12px;font-weight:700;";
    closeBtn.onclick = () => {
      banner.remove();
      document.body.style.paddingTop = "";
    };
    banner.appendChild(closeBtn);
    document.body.prepend(banner);
    document.body.style.paddingTop = "42px";
  }

  // W#7: Autocompletar datos del instructor desde el perfil en cursos nuevos
  const esNuevoCurso = localStorage.getItem("ec0217_datos_completo") !== "true"
                    && !getData("ec0217_datos")?.nombreCurso;
  if (esNuevoCurso && typeof getUserProfile === "function") {
    try {
      const perfil = await getUserProfile();
      if (perfil) {
        const nombreCompleto = [perfil.nombre, perfil.apellido].filter(Boolean).join(" ");
        const datosActuales = getData("ec0217_datos") || {};
        if (!datosActuales.instructor && nombreCompleto) {
          saveData("ec0217_datos", { ...datosActuales, instructor: nombreCompleto, disenador: nombreCompleto });
        }
      }
    } catch (_) {}
  }

  // Re-inicializar TODO el wizard con datos frescos de Supabase.
  // Las funciones cargarXxx() ya corrieron síncronamente con cache vacío;
  // aquí las volvemos a llamar ahora que el cache tiene los datos reales.
  modoEstricto = localStorage.getItem("ec0217_modo_estricto") || "on";
  cargarDatosCurso();
  cargarObjetivos();            // internamente llama aplicarModoObjetivos()
  cargarBeneficios();
  cargarTemario();
  cargarEncuadre();
  cargarTecnicas();
  cargarExpositiva();
  cargarDemostrativa();
  cargarDialogo();
  cargarCierre();
  cargarEvaluaciones();
  cargarTiempos();
  actualizarBotonDescripcionGeneral();

  // Mostrar la sección correcta según el avance del curso
  if (localStorage.getItem("ec0217_datos_completo") === "true") {
    document.getElementById("nav-datos")?.classList.add("completed");
    document.getElementById("nav-objetivos")?.classList.remove("disabled");
    mostrarSeccionPrincipal("seccionObjetivos");
  } else {
    mostrarSeccionPrincipal("seccionDatos");
  }

  abrirGrupoActivo();
})();



// W#4/W#8 → wizard/navigation.js
const flujoSecciones = [
  "seccionDatos",
  "seccionObjetivos",
  "seccionBeneficios",
  "seccionTemario",

  "seccionIntegracion",
  "seccionPreguntas",
  "seccionReglas",
  "seccionContrato",

  "seccionExpositiva",
  "seccionDemostrativa",
  "seccionEnergizante",
  "seccionDialogo",

  "seccionCierre",

  "seccionEvaluaciones",

  "seccionTiempos",
  "seccionMateriales",

  "seccionFormatos"
];



// ─── SECCIONES PRINCIPALES: DATOS → OBJETIVOS ────────────────────────────────

function mostrarSeccionPrincipal(id) {
  document.querySelectorAll(".wizard-section").forEach(section => {
    section.classList.add("hidden");
  });

  const seccion = document.getElementById(id);

  if (!seccion) {
    console.error(`No existe la sección con id: ${id}`);
    return;
  }

  seccion.classList.remove("hidden");

  document.querySelectorAll(".sidebar .nav-item").forEach(item => {
    item.classList.remove("active");
  });

  if (id === "seccionDatos") {
    document.getElementById("nav-datos")?.classList.add("active");
  }

  if (id === "seccionObjetivos") {
    document.getElementById("nav-objetivos")?.classList.add("active");
  }

  if (id === "seccionBeneficios") {
    document.getElementById("nav-beneficios")?.classList.add("active");
  }

  if (id === "seccionTemario") {
  document.getElementById("nav-temario")?.classList.add("active");
  }

  if (id === "seccionPreguntas") {
    document.getElementById("nav-preguntas")?.classList.add("active");
  }

  if (id === "seccionReglas") {
    document.getElementById("nav-reglas")?.classList.add("active");
  }

  if (id === "seccionContrato") {
    document.getElementById("nav-contrato")?.classList.add("active");
    inicializarContratoPorDefecto();
  }

  if (id === "seccionIntegracion") {
    document.getElementById("nav-integracion")?.classList.add("active");
    inicializarTecnicasPersonalizadasPorDefecto();
  }

  if (id === "seccionEnergizante") {
    document.getElementById("nav-energizante")?.classList.add("active");
    inicializarTecnicasPersonalizadasPorDefecto();
  }

  if (id === "seccionExpositiva") {
    document.getElementById("nav-expositiva")?.classList.add("active");
    cargarObjetivoCognitivoExpositiva();
  }

  if (id === "seccionDemostrativa") {
    document.getElementById("nav-demostrativa")?.classList.add("active");
    cargarObjetivoPsicomotrizDemostrativa();
  }

  if (id === "seccionDialogo") {
    document.getElementById("nav-dialogo")?.classList.add("active");
    cargarObjetivoAfectivoDialogo();
  }

  if (id === "seccionCierre") {
    document.getElementById("nav-cierre")?.classList.add("active");
  }

  if (id === "seccionEvaluaciones") {
    document.getElementById("nav-evaluaciones")?.classList.add("active");
    actualizarBotonDescripcionGeneral();
  }

  if (id === "seccionTiempos") {
    document.getElementById("nav-tiempos")?.classList.add("active");
  }

  if (id === "seccionMateriales") {
    document.getElementById("nav-materiales")?.classList.add("active");
    cargarMateriales();
  }

  if (id === "seccionFormatos") {
    document.getElementById("nav-formatos")?.classList.add("active");
    poblarResumenExpediente();
  }

  // Abrir el grupo del sidebar que contiene el item activo
  abrirGrupoActivo();
}

// ─── DATOS DEL CURSO ─────────────────────────────────────────────────────────

const camposDatos = [
  { id: 'nombreCurso',   errId: 'err-nombreCurso',   tipo: 'texto' },
  { id: 'instructor',    errId: 'err-instructor',    tipo: 'texto' },
  { id: 'disenador',     errId: 'err-disenador',     tipo: 'texto' },
  { id: 'lugar',         errId: 'err-lugar',         tipo: 'texto' },
  { id: 'fecha',         errId: 'err-fecha',         tipo: 'texto' },
  { id: 'duracion',      errId: 'err-duracion',      tipo: 'numero', min: 120 },
  { id: 'participantes', errId: 'err-participantes', tipo: 'numero', min: 4 },
  { id: 'perfil',        errId: 'err-perfil',        tipo: 'texto' },
];

function limpiarErroresDatos() {
  camposDatos.forEach(({ id, errId }) => {
    document.getElementById(id).classList.remove('error');
    document.getElementById(errId).style.display = 'none';
  });
}

function mostrarErrorDatos(id, errId) {
  document.getElementById(id).classList.add('error');
  document.getElementById(errId).style.display = 'block';
}

function validarDatosCurso() {
  limpiarErroresDatos();

  let valido = true;
  let primerError = null;

  for (const campo of camposDatos) {
    const el = document.getElementById(campo.id);
    const valor = el.value.trim();

    if (!valor) {
      mostrarErrorDatos(campo.id, campo.errId);
      if (!primerError) primerError = campo.id;
      valido = false;
      continue;
    }

    if (campo.tipo === 'numero') {
      const num = parseInt(valor, 10);
      if (isNaN(num) || num < campo.min) {
        mostrarErrorDatos(campo.id, campo.errId);
        if (!primerError) primerError = campo.id;
        valido = false;
      }
    }
  }

  if (primerError) {
    document.getElementById(primerError).scrollIntoView({
      behavior: 'smooth',
      block: 'center'
    });
    document.getElementById(primerError).focus();
  }

  return valido;
}

function cargarDatosCurso() {
  const guardado = localStorage.getItem('ec0217_datos');
  if (!guardado) return;

  const d = JSON.parse(guardado);

  document.getElementById('nombreCurso').value = d.nombreCurso || '';
  document.getElementById('instructor').value = d.instructor || '';
  document.getElementById('disenador').value = d.disenador || '';
  document.getElementById('lugar').value = d.lugar || '';
  document.getElementById('fecha').value = d.fecha || '';
  document.getElementById('duracion').value = d.duracion || '';
  document.getElementById('participantes').value = d.participantes || '';
  document.getElementById('perfil').value = d.perfil || '';
}

function guardarDatosCurso() {
  const datos = {
    nombreCurso: document.getElementById('nombreCurso').value.trim(),
    instructor: document.getElementById('instructor').value.trim(),
    disenador: document.getElementById('disenador').value.trim(),
    lugar: document.getElementById('lugar').value.trim(),
    fecha: document.getElementById('fecha').value,
    duracion: parseInt(document.getElementById('duracion').value, 10),
    participantes: parseInt(document.getElementById('participantes').value, 10),
    perfil: document.getElementById('perfil').value.trim(),
  };

  localStorage.setItem('ec0217_datos', JSON.stringify(datos));
  localStorage.setItem('ec0217_datos_completo', 'true');

  document.getElementById("nav-datos")?.classList.add("completed");
  document.getElementById("nav-objetivos")?.classList.remove("disabled");
}

document.getElementById('btnSiguienteDatos').addEventListener('click', () => {
  if (!validarDatosCurso()) return;

  guardarDatosCurso();
  mostrarSeccionPrincipal("seccionObjetivos");
});

const btnCopiarInstructor = document.getElementById('btnCopiarInstructor');

if (btnCopiarInstructor) {
  btnCopiarInstructor.addEventListener('click', () => {
    const valor = document.getElementById('instructor').value.trim();

    if (valor) {
      document.getElementById('disenador').value = valor;
      document.getElementById('disenador').classList.remove('error');
      document.getElementById('err-disenador').style.display = 'none';
    }
  });
}

document.getElementById("nav-datos")?.addEventListener("click", () => {
  mostrarSeccionPrincipal("seccionDatos");
});

document.getElementById("nav-objetivos")?.addEventListener("click", () => {
  if (localStorage.getItem("ec0217_datos_completo") === "true") {
    mostrarSeccionPrincipal("seccionObjetivos");
  } else {
    mostrarSeccionPrincipal("seccionDatos");
  }
});

document.getElementById("nav-beneficios")?.addEventListener("click", () => {
  if (localStorage.getItem("ec0217_objetivos_completo") === "true") {
    mostrarSeccionPrincipal("seccionBeneficios");
  }
});

document.getElementById("nav-temario")?.addEventListener("click", () => {
  if (localStorage.getItem("ec0217_beneficios_completo") === "true") {
    mostrarSeccionPrincipal("seccionTemario");
  }
});

document.getElementById("nav-preguntas")?.addEventListener("click", () => {
  if (localStorage.getItem("ec0217_integracion_completo") === "true") {
    mostrarSeccionPrincipal("seccionPreguntas");
  }
});

document.getElementById("nav-reglas")?.addEventListener("click", () => {
  if (localStorage.getItem("ec0217_preguntas_completo") === "true") {
    mostrarSeccionPrincipal("seccionReglas");
  }
});

document.getElementById("nav-contrato")?.addEventListener("click", () => {
  if (localStorage.getItem("ec0217_reglas_completo") === "true") {
    mostrarSeccionPrincipal("seccionContrato");
  }
});

document.getElementById("nav-integracion")?.addEventListener("click", () => {
  if (localStorage.getItem("ec0217_temario_completo") === "true") {
    mostrarSeccionPrincipal("seccionIntegracion");
  }
});

document.getElementById("nav-energizante")?.addEventListener("click", () => {
  if (localStorage.getItem("ec0217_demostrativa_completo") === "true") {
    mostrarSeccionPrincipal("seccionEnergizante");
  }
});


document.getElementById("nav-demostrativa")?.addEventListener("click", () => {
  if (localStorage.getItem("ec0217_expositiva_completo") === "true") {
    mostrarSeccionPrincipal("seccionDemostrativa");
  }
});

document.getElementById("nav-evaluaciones")?.addEventListener("click", () => {
  if (localStorage.getItem("ec0217_cierre_completo") === "true") {
    mostrarSeccionPrincipal("seccionEvaluaciones");
  }
});

document.getElementById("nav-tiempos")?.addEventListener("click", () => {
  if (localStorage.getItem("ec0217_evaluaciones_completo") === "true") {
    mostrarSeccionPrincipal("seccionTiempos");
  }
});

document.getElementById("nav-materiales")?.addEventListener("click", () => {
  if (localStorage.getItem("ec0217_tiempos_completo") === "true") {
    mostrarSeccionPrincipal("seccionMateriales");
  }
});

document.getElementById("nav-formatos")?.addEventListener("click", () => {
  if (localStorage.getItem("ec0217_materiales_completo") === "true") {
    mostrarSeccionPrincipal("seccionFormatos");
  }
});


const textarea = document.getElementById("objectiveInput");
const summary = document.getElementById("summary");
const sectionTitle = document.getElementById("sectionTitle");
const btnGenerarObjetivoGeneral = document.getElementById("btnGenerarObjetivoGeneral");

const btnGuardarObjetivoLibre = document.getElementById("btnGuardarObjetivoLibre");
const sendBtn = document.getElementById("sendBtn");
const nextBtn = document.getElementById("nextBtn");
const btnDescargar = document.getElementById("btnDescargar");
const mensajeDescarga = document.getElementById("mensajeDescarga");

const btnIrBeneficios   = document.getElementById("btnIrBeneficios");
const btnGenerarGeneral = document.getElementById("btnGenerarGeneral");

if (btnGenerarGeneral) {
  btnGenerarGeneral.addEventListener("click", () => {
    btnGenerarGeneral.disabled = true;
    btnGenerarGeneral.textContent = "Generando...";
    generarGeneral();
  });
}

if (btnIrBeneficios) {
  btnIrBeneficios.addEventListener("click", () => {
    habilitarBeneficios();
    mostrarSeccionPrincipal("seccionBeneficios");
  });
}

const btnGenerarBeneficios = document.getElementById("btnGenerarBeneficios");
const btnGuardarBeneficios = document.getElementById("btnGuardarBeneficios");
const beneficiosTexto = document.getElementById("beneficiosTexto");
const loaderBeneficios = document.getElementById("loaderBeneficios");
const errBeneficiosTexto = document.getElementById("err-beneficiosTexto");

// ─── VARIABLES TEMARIO ───────────────────────────────────────────────────────

const listaTemasU1 = document.getElementById("listaTemasU1");
const listaTemasU2 = document.getElementById("listaTemasU2");
const listaTemasU3 = document.getElementById("listaTemasU3");

const temaU1Input = document.getElementById("temaU1Input");
const temaU2Input = document.getElementById("temaU2Input");
const temaU3Input = document.getElementById("temaU3Input");

const btnAgregarTemaU1 = document.getElementById("btnAgregarTemaU1");
const btnAgregarTemaU2 = document.getElementById("btnAgregarTemaU2");
const btnAgregarTemaU3 = document.getElementById("btnAgregarTemaU3");

const btnGuardarTemario = document.getElementById("btnGuardarTemario");
const btnGenerarTemario = document.getElementById("btnGenerarTemario");
const loaderTemario = document.getElementById("loaderTemario");

// ─── VARIABLES ENCUADRE ─────────────────────────────────────────────────────

const preguntasEncuadre = document.getElementById("preguntasEncuadre");
const btnGuardarPreguntas = document.getElementById("btnGuardarPreguntas");
const errPreguntas = document.getElementById("err-preguntas");

const otraRegla = document.getElementById("otraRegla");
const otroAcuerdo = document.getElementById("otroAcuerdo");
const btnAgregarAcuerdo = document.getElementById("btnAgregarAcuerdo");
const listaAcuerdosPersonalizados = document.getElementById("listaAcuerdosPersonalizados");
const btnGenerarPreguntas = document.getElementById("btnGenerarPreguntas");
const loaderPreguntas = document.getElementById("loaderPreguntas");
const btnCopiarReglas = document.getElementById("btnCopiarReglas");
const reglasCursoTexto = document.getElementById("reglasCursoTexto");

const btnGuardarReglas = document.getElementById("btnGuardarReglas");
const btnGuardarContrato = document.getElementById("btnGuardarContrato");

const errReglas = document.getElementById("err-reglas");
const errContrato = document.getElementById("err-contrato");


// ─── VARIABLES TÉCNICAS GRUPALES ─────────────────────────────────────────────

const btnGuardarIntegracion = document.getElementById("btnGuardarIntegracion");
const btnGuardarEnergizante = document.getElementById("btnGuardarEnergizante");

const errIntegracion = document.getElementById("err-integracion");
const errEnergizante = document.getElementById("err-energizante");

const camposIntegracionPersonalizada = document.getElementById("camposIntegracionPersonalizada");
const camposEnergizantePersonalizada = document.getElementById("camposEnergizantePersonalizada");

const detalleIntegracion = document.getElementById("detalleIntegracion");
const detalleIntegracionNombre = document.getElementById("detalleIntegracionNombre");
const detalleIntegracionObjetivo = document.getElementById("detalleIntegracionObjetivo");
const detalleIntegracionInstrucciones = document.getElementById("detalleIntegracionInstrucciones");

const detalleEnergizante = document.getElementById("detalleEnergizante");
const detalleEnergizanteNombre = document.getElementById("detalleEnergizanteNombre");
const detalleEnergizanteObjetivo = document.getElementById("detalleEnergizanteObjetivo");
const detalleEnergizanteInstrucciones = document.getElementById("detalleEnergizanteInstrucciones");

// ─── VARIABLES TÉCNICA EXPOSITIVA ───────────────────────────────────────────

const btnGuardarExpositiva = document.getElementById("btnGuardarExpositiva");
const errExpositiva = document.getElementById("err-expositiva");

const expObjetivo = document.getElementById("expObjetivo");
const expIntroduccion = document.getElementById("expIntroduccion");
const expExperiencia = document.getElementById("expExperiencia");
const expDesarrollo = document.getElementById("expDesarrollo");
const expEjemplos = document.getElementById("expEjemplos");
const expSintesis = document.getElementById("expSintesis");
const expPreguntas = document.getElementById("expPreguntas");
const expUtilidad = document.getElementById("expUtilidad");


// ─── VARIABLES TÉCNICA DEMOSTRATIVA ─────────────────────────────────────────

const btnGuardarDemostrativa = document.getElementById("btnGuardarDemostrativa");
const errDemostrativa = document.getElementById("err-demostrativa");

const demoObjetivo = document.getElementById("demoObjetivo");
const demoExperiencia = document.getElementById("demoExperiencia");
const demoActividad = document.getElementById("demoActividad");
const demoEjemplos = document.getElementById("demoEjemplos");
const demoPreguntas = document.getElementById("demoPreguntas");


// ─── VARIABLES TÉCNICA DIÁLOGO/DISCUSIÓN ────────────────────────────────────

const btnGuardarDialogo = document.getElementById("btnGuardarDialogo");
const errDialogo = document.getElementById("err-dialogo");

const dialogoObjetivo = document.getElementById("dialogoObjetivo");
const dialogoActividad = document.getElementById("dialogoActividad");
const dialogoInstrucciones = document.getElementById("dialogoInstrucciones");
const dialogoEjemplos = document.getElementById("dialogoEjemplos");
const dialogoConclusion = document.getElementById("dialogoConclusion");


// ─── VARIABLES CIERRE ───────────────────────────────────────────────────────

const btnGenerarCierre        = document.getElementById("btnGenerarCierre");
const btnGuardarCierre        = document.getElementById("btnGuardarCierre");
const loaderCierre            = document.getElementById("loaderCierre");
const cierreTexto             = document.getElementById("cierreTexto");
const errCierre               = document.getElementById("err-cierre");

const btnGenerarResumen       = document.getElementById("btnGenerarResumen");
const loaderResumen           = document.getElementById("loaderResumen");
const cierreResumen           = document.getElementById("cierreResumen");

const btnGenerarCompromisos   = document.getElementById("btnGenerarCompromisos");
const loaderCompromisos       = document.getElementById("loaderCompromisos");
const compromisosTexto        = document.getElementById("compromisosTexto");

const sugerenciasContinuidad    = document.getElementById("sugerenciasContinuidad");
const referenciasBibliograficas = document.getElementById("referenciasBibliograficas");



const detalleIntegracionTiempo = document.getElementById("detalleIntegracionTiempo");
const detalleIntegracionParticipacion = document.getElementById("detalleIntegracionParticipacion");
const detalleIntegracionIntegracion = document.getElementById("detalleIntegracionIntegracion");
const detalleIntegracionControlTiempo = document.getElementById("detalleIntegracionControlTiempo");


// ─── VARIABLES EVALUACIONES ────────────────────────────────────────────────

const btnGuardarEvaluaciones = document.getElementById("btnGuardarEvaluaciones");
const errEvaluaciones = document.getElementById("err-evaluaciones");

const pctDiagnostica = document.getElementById("pctDiagnostica");
const pctFormativa = document.getElementById("pctFormativa");
const pctSumativa = document.getElementById("pctSumativa");

const sliderEvaluaciones = document.getElementById("sliderEvaluaciones");
const pctFormativaValor = document.getElementById("pctFormativaValor");
const pctSumativaValor = document.getElementById("pctSumativaValor");

const instDiagnostica = document.getElementById("instDiagnostica");
const instFormativa = document.getElementById("instFormativa");
const instSumativa = document.getElementById("instSumativa");
const instReac = document.getElementById("instReac");

const btnGenerarDescripcionGeneral = document.getElementById("btnGenerarDescripcionGeneral");
const loaderDescripcionGeneral = document.getElementById("loaderDescripcionGeneral");
const descripcionGeneralEvaluacion = document.getElementById("descripcionGeneralEvaluacion");


const btnGenerarDiagnostica = document.getElementById("btnGenerarDiagnostica");
const loaderDiagnostica = document.getElementById("loaderDiagnostica");

const btnGenerarSumativa = document.getElementById("btnGenerarSumativa");
const loaderSumativa = document.getElementById("loaderSumativa");

let tipoInstrumentoFormativa = "";

async function generarFormativaIA() {
  const demostrativa = getData("ec0217_demostrativa") || {};
  const datos = getData("ec0217_datos") || {};

  const actividad =
    demostrativa.actividad ||
    demostrativa.demoActividad ||
    demoActividad?.value?.trim() ||
    "";

  if (!actividad.trim()) {
    showAlert("Primero completa el apartado c) de Técnica Demostrativa: Presentará la actividad a desarrollar y mencionará el propósito de la misma.");
    mostrarSeccionPrincipal("seccionDemostrativa");
    return;
  }

  const yaTieneTexto = instFormativa && instFormativa.value.trim().length > 0;

  if (yaTieneTexto) {
    const confirmar = await showConfirm(
      "Ya tienes texto en la evaluación formativa. Si generas con IA, el contenido actual será reemplazado. ¿Deseas continuar?",
      { title: "Reemplazar contenido", icon: "⚠️", confirmText: "Sí, reemplazar", danger: true }
    );
    if (!confirmar) return;
  }

  try {
    if (loaderFormativa) loaderFormativa.style.display = "block";

    if (btnGenerarFormativa) {
      btnGenerarFormativa.disabled = true;
      btnGenerarFormativa.textContent = "Generando...";
    }

    const response = await fetchConTimeout(`${BACKEND_URL}/generate-formativa`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nombreCurso: datos.nombreCurso || "",
        actividad: actividad
      })
    });

    if (!response.ok) {
      let detalle = `HTTP ${response.status}`;

      try {
        const errJson = await response.json();
        const d = errJson.detail;
        detalle = d ? (typeof d === "object" ? JSON.stringify(d) : String(d)) : JSON.stringify(errJson);
      } catch (_) {}

      throw new Error(detalle);
    }

    const data = await response.json();

      let textoGenerado = "";
      let tipoGenerado = "";

      if (Array.isArray(data.reactivos)) {
        tipoGenerado = data.tipoInstrumento || "";

        textoGenerado = data.reactivos
          .map((reactivo, index) => `${index + 1}. ${reactivo}`)
          .join("\n");
      } else {
        textoGenerado =
          data.texto ||
          data.instrumento ||
          data.resultado ||
          data.respuesta ||
          "";

        tipoGenerado = data.tipoInstrumento || "";

        // Por si el backend manda el JSON como texto plano
        if (typeof textoGenerado === "string" && textoGenerado.trim().startsWith("{")) {
          try {
            const jsonInterno = JSON.parse(textoGenerado);

            tipoGenerado = jsonInterno.tipoInstrumento || tipoGenerado;

            if (Array.isArray(jsonInterno.reactivos)) {
              textoGenerado = jsonInterno.reactivos
                .map((reactivo, index) => `${index + 1}. ${reactivo}`)
                .join("\n");
            }
          } catch (error) {
            console.error("No se pudo convertir el JSON interno:", error);
          }
        }
      }

      tipoInstrumentoFormativa = tipoGenerado;

      if (!textoGenerado.trim()) {
        console.log("Respuesta evaluación formativa:", data);
        showAlert("La IA respondió, pero no llegó texto para la evaluación formativa.");
        return;
      }

      instFormativa.value = textoGenerado;

      guardarEvaluacionesTemporal();

    guardarEvaluacionesTemporal();

  } catch (err) {
    console.error("Error al generar evaluación formativa:", err);
    showAlert(`No se pudo generar la evaluación formativa:\n\n${mensajeAmigable(err)}`);
  } finally {
    if (loaderFormativa) loaderFormativa.style.display = "none";

    if (btnGenerarFormativa) {
      btnGenerarFormativa.disabled = false;
      btnGenerarFormativa.textContent = "Generar evaluación formativa con IA";
    }
  }
}

if (btnGenerarFormativa) {
  btnGenerarFormativa.addEventListener("click", generarFormativaIA);
}


// ─── VARIABLES Tiempos ─────────────────────────────────────────────────────


const tablaTiempos = document.getElementById("tablaTiempos");
const totalTiempos = document.getElementById("totalTiempos");
const errTiempos = document.getElementById("err-tiempos");
const btnGuardarTiempos = document.getElementById("btnGuardarTiempos");




// ─── VARIABLES FORMATOS ─────────────────────────────────────────────────────

const btnDescargarPlaneacionFinal = document.getElementById("btnDescargarPlaneacionFinal");
const loaderFormatos = document.getElementById("loaderFormatos");
const mensajeFormatos = document.getElementById("mensajeFormatos");


const enNombreCustom = document.getElementById("enNombreCustom");
const enDetalleCustom = document.getElementById("enDetalleCustom");
const enDuracionCustom = document.getElementById("enDuracionCustom");
const enMaterialesCustom = document.getElementById("enMaterialesCustom");

function temarioTieneDatos() {
  return (
    temario.u1.length > 0 ||
    temario.u2.length > 0 ||
    temario.u3.length > 0
  );
}

const errU1 = document.getElementById("err-u1");
const errU2 = document.getElementById("err-u2");
const errU3 = document.getElementById("err-u3");

let temario = {
  u1: [],
  u2: [],
  u3: []
};
window.sbeTemario = temario; // referencia compartida para step-temario.js

let tiemposCurso = [
  {
    seccion: "Inicio / Encuadre del curso",
    filas: [
      { titulo: "Presentación del Instructor", tiempo: 1 },
      { titulo: "Lista de asistencia", tiempo: 1 },
      { titulo: "Presentación de los participantes", tiempo: 1},
      { titulo: "Técnica Rompe Hielo o de integración", tiempo: 5 },
      { titulo: "Objetivos del curso/sesión", tiempo: 2 },
      { titulo: "Descripción general", tiempo: 1 },
      { titulo: "Temario del curso/sesión", tiempo: 1 },
      { titulo: "Preguntas de la experiencia", tiempo: 3 },
      { titulo: "Beneficios del curso", tiempo: 2 },
      { titulo: "Tipo de evaluaciones", tiempo: 2 },
      { titulo: "Expectativas del curso/sesión", tiempo: 3 },
      { titulo: "Reglas de operación del curso", tiempo: 1 },
      { titulo: "Contrato de aprendizaje", tiempo: 3 },
      { titulo: "Evaluación diagnóstica", tiempo: 5 }
    ]
  },
  {
    seccion: "Desarrollo del curso",
    filas: [
      { titulo: "Técnica expositiva", tiempo: 25 },
      { titulo: "Técnica demostrativa", tiempo: 20 },
      { titulo: "Evaluación formativa", tiempo: 5 },
      { titulo: "Descanso", tiempo: 3 },
      { titulo: "Técnica Energizante", tiempo: 3 },
      { titulo: "Técnica diálogo-discusión", tiempo: 15 },
      { titulo: "Evaluación final", tiempo: 5 }
    ]
  },
  {
    seccion: "Cierre del curso",
    filas: [
      { titulo: "Conclusión", tiempo: 1 },
      { titulo: "Resumen general del curso", tiempo: 1 },
      { titulo: "Logro de expectativas del curso", tiempo: 1 },
      { titulo: "Logro de los objetivos", tiempo: 1 },
      { titulo: "Sugerencias de continuidad del aprendizaje", tiempo: 1 },
      { titulo: "Referencia(s) bibliográfica", tiempo: 1 },
      { titulo: "Compromisos de aplicación del aprendizaje", tiempo: 1 },
      { titulo: "Evaluación de satisfacción", tiempo: 5 },
      { titulo: "Cierre", tiempo: 1 }
    ]
  }
];

let acuerdosPersonalizados = [];
window.sbeAcuerdosPersonalizados = acuerdosPersonalizados; // referencia compartida para step-encuadre.js
window.cargandoTecnicas = false; // flag compartido para step-tecnicas.js
let cargandoTecnicas = window.cargandoTecnicas; // alias local (se sincroniza vía window)

const criteria = ["quien", "cuando", "accion", "objeto", "condicion", "finalidad"];

let estado = {
  actual: "cognitiva",
  cognitiva:    { texto: "", completa: false },
  psicomotriz:  { texto: "", completa: false },
  afectiva:     { texto: "", completa: false },
  general:      { texto: "", completa: false }
};
window.sbeEstadoObjetivos = estado; // referencia compartida para step-objetivos.js



const btnModoEstrictoOn = document.getElementById("btnModoEstrictoOn");
const btnModoEstrictoOff = document.getElementById("btnModoEstrictoOff");

let modoEstricto = localStorage.getItem("ec0217_modo_estricto") || "on";

cargarObjetivos();
aplicarModoObjetivos();


// ─── BOTÓN EVALUAR ────────────────────────────────────────────────────────────

sendBtn.addEventListener("click", () => {
  evaluateText(textarea.value);
});

textarea.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    evaluateText(textarea.value);
  }
});

// ─── NAVEGACIÓN DE SECCIONES ─────────────────────────────────────────────────

function obtenerSiguiente(seccion) {
  const orden = ["cognitiva", "psicomotriz", "afectiva", "general"];
  const index = orden.indexOf(seccion);
  return orden[index + 1];
}

nextBtn.addEventListener("click", () => {
  const siguiente = obtenerSiguiente(estado.actual);
  if (siguiente) cambiarSeccion(siguiente);
});

function cambiarSeccion(seccion) {
  if (
    modoEstricto === "on" &&
    document.getElementById(`nav-${seccion}`).classList.contains("disabled")
  ) return;

  estado.actual = seccion;

  document.querySelectorAll(".objetivos-tabs .nav-item").forEach(el => el.classList.remove("active"));
  document.getElementById(`nav-${seccion}`).classList.add("active");

  const titulos = {
    cognitiva:   "Objetivo Cognitivo",
    psicomotriz: "Objetivo Psicomotriz",
    afectiva:    "Objetivo Afectivo",
    general:     "Objetivo General"
  };

  const placeholders = {
    cognitiva:   "Redacta el objetivo cognitivo...",
    psicomotriz: "Redacta el objetivo psicomotriz...",
    afectiva:    "Redacta el objetivo afectivo...",
    general:     "El objetivo general se genera automáticamente."
  };

  sectionTitle.textContent = titulos[seccion];
  textarea.placeholder = placeholders[seccion];
  textarea.value = estado[seccion].texto;

  if (seccion === "general") {
    textarea.disabled = false;

    sendBtn.style.display = "none";
    nextBtn.style.display = "none";

    if (btnGuardarObjetivoLibre) {
      btnGuardarObjetivoLibre.style.display = "none";
    }

    if (estado.general.texto.trim()) {
      // Ya tiene texto: mostrar solo el botón de continuar
      if (btnGenerarGeneral) btnGenerarGeneral.style.display = "none";
      btnIrBeneficios.style.display = "inline-block";
    } else {
      // Sin texto: mostrar botón de generar
      if (btnGenerarGeneral) btnGenerarGeneral.style.display = "inline-block";
      btnIrBeneficios.style.display = "none";
    }

  } else {
    textarea.disabled = false;

    if (modoEstricto === "on") {
      // Modo estricto: se revisa con IA
      sendBtn.style.display = "inline-block";

      if (btnGuardarObjetivoLibre) {
        btnGuardarObjetivoLibre.style.display = "none";
      }
    } else {
      // Modo no estricto: no se revisa con IA, solo se guarda
      sendBtn.style.display = "none";

      if (btnGuardarObjetivoLibre) {
        btnGuardarObjetivoLibre.style.display = "inline-block";
      }
    }
  }

  resetChecks();
  summary.textContent = "";
  mensajeDescarga.style.display = "none";

  const observacionesBox = document.getElementById("observacionesBox");

  if (seccion === "general") {
    observacionesBox?.classList.add("hidden");
  } else {
    observacionesBox?.classList.remove("hidden");
  }
}


document.querySelectorAll("#nav-cognitiva, #nav-psicomotriz, #nav-afectiva, #nav-general").forEach(item => {
  item.addEventListener("click", () => {
    const id = item.id.replace("nav-", "");
    cambiarSeccion(id);
  });
});


function guardarObjetivoLibre() {
  if (modoEstricto !== "off") return;

  if (estado.actual === "general") return;

  const texto = textarea.value.trim();

  if (!texto) {
    showAlert("Escribe algo en el objetivo antes de guardarlo.");
    return;
  }

  estado[estado.actual].texto = texto;
  estado[estado.actual].completa = true;

  document.getElementById(`nav-${estado.actual}`)?.classList.add("completed");

  guardarObjetivos();
  aplicarModoObjetivos();

  summary.style.display = "block";
  summary.textContent = "✅ Objetivo guardado en modo no estricto.";
}

if (btnGuardarObjetivoLibre) {
  btnGuardarObjetivoLibre.addEventListener("click", guardarObjetivoLibre);
}

// ─── EVALUACIÓN ───────────────────────────────────────────────────────────────

async function evaluateText(text) {
  if (estado.actual === "general") return;

  if (!text.trim()) return;

  // Validación mínima antes de llamar al backend
  const palabras = text.trim().split(/\s+/).filter(Boolean);
  if (palabras.length < 10) {
    summary.textContent = "⚠️ El objetivo es demasiado corto. Un objetivo bien redactado necesita al menos 10 palabras que incluyan: quién, cuándo, acción, objeto, condición y finalidad.";
    summary.style.display = "block";
    document.getElementById('checksList').style.display = "block";
    // Marcar todos como faltantes
    criteria.forEach(c => {
      document.getElementById(`chk-${c}`).textContent = `❌ ${capitalize(c)}`;
    });
    nextBtn.style.display = "none";
    return;
  }

  document.getElementById('summary').style.display = 'none';
  document.getElementById('checksList').style.display = 'none';
  document.getElementById('contenedorLoader1').style.display = 'grid';
  document.getElementById('contenedorLoader2').style.display = 'grid';
  sendBtn.disabled = true;

  try {
    const response = await fetchConTimeout(`${BACKEND_URL}/evaluate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texto: text,
        tipo: estado.actual,
        objetivo_cognitivo: estado.cognitiva.texto || "",
        objetivo_psicomotriz: estado.psicomotriz.texto || ""
      })
    });

    if (!response.ok) {
      let detalle = `HTTP ${response.status}`;

      try {
        const errJson = await response.json();
        const d = errJson.detail;
        detalle = d ? (typeof d === "object" ? JSON.stringify(d) : String(d)) : JSON.stringify(errJson);
      } catch (_) {}

      throw new Error(detalle);
    }

    const data = await response.json();

    // Normalizar faltantes: quitar acentos y pasar a minúsculas
    // para que "acción" y "accion" se traten igual
    const normalizar = str => str
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

    const faltantesNorm = (data.faltantes || []).map(normalizar);

    criteria.forEach(c => {
      const li = document.getElementById(`chk-${c}`);
      li.textContent = faltantesNorm.includes(normalizar(c))
        ? `❌ ${capitalize(c)}`
        : `✔ ${capitalize(c)}`;
    });

    if (!data.coincide_con_seccion) {
      summary.textContent =
        `⚠️ El objetivo parece ser de tipo ${capitalize(data.tipo_detectado)}, ` +
        `pero estás en la sección ${capitalize(estado.actual)}.\n\n` +
        data.resumen;
    } else {
      summary.textContent = data.resumen;
    }

    if (faltantesNorm.length === 0 && data.coincide_con_seccion) {
      marcarCompleta(estado.actual);
      summary.textContent += "\n\n✅ ¡Objetivo completo! Puedes pasar al siguiente.";
      if (modoEstricto === "on") {
        nextBtn.style.display = "inline-block";
      } else {
        nextBtn.style.display = "none";
      }
    } else {
      nextBtn.style.display = "none";
    }

  } catch (err) {
    summary.textContent = `⚠️ Error al conectar con el servidor: ${err.message}`;
  } finally {
    document.getElementById('contenedorLoader1').style.display = 'none';
    document.getElementById('contenedorLoader2').style.display = 'none';
    document.getElementById('summary').style.display = 'block';
    document.getElementById('checksList').style.display = 'block';
    sendBtn.disabled = false;
  }
}

// ─── COMPLETAR SECCIÓN ────────────────────────────────────────────────────────

function marcarCompleta(seccion) {
  estado[seccion].completa = true;
  document.getElementById(`nav-${seccion}`)?.classList.add("completed");

  guardarObjetivos();

  if (modoEstricto === "on") {
    if (seccion === "cognitiva") desbloquear("psicomotriz");
    if (seccion === "psicomotriz") desbloquear("afectiva");
  }

  if (modoEstricto === "on") {
    intentarGenerarGeneral();
  }

  aplicarModoObjetivos();
}


function intentarGenerarGeneral() {
  const completos =
    estado.cognitiva.completa &&
    estado.psicomotriz.completa &&
    estado.afectiva.completa;

  if (completos) {
    document.getElementById("nav-general")?.classList.remove("disabled");
    // No generar automáticamente: el usuario pulsa el botón al entrar a la sección
  }
}

function objetivosTienenTextoMinimo() {
  return (
    estado.cognitiva.texto.trim().length > 0 &&
    estado.psicomotriz.texto.trim().length > 0 &&
    estado.afectiva.texto.trim().length > 0 &&
    estado.cognitiva.completa &&
    estado.psicomotriz.completa &&
    estado.afectiva.completa
  );
}

function reiniciarAvanceObjetivosEstricto() {
  // Mantiene los textos, pero reinicia el estado de completado
  estado.cognitiva.completa = false;
  estado.psicomotriz.completa = false;
  estado.afectiva.completa = false;
  estado.general.completa = false;

  estado.general.texto = "";

  // Quita estilos de completado
  document.getElementById("nav-cognitiva")?.classList.remove("completed");
  document.getElementById("nav-psicomotriz")?.classList.remove("completed");
  document.getElementById("nav-afectiva")?.classList.remove("completed");
  document.getElementById("nav-general")?.classList.remove("completed");

  // Bloquea todo excepto cognitiva
  document.getElementById("nav-cognitiva")?.classList.remove("disabled");
  document.getElementById("nav-psicomotriz")?.classList.add("disabled");
  document.getElementById("nav-afectiva")?.classList.add("disabled");
  document.getElementById("nav-general")?.classList.add("disabled");

  // Evita que se considere completada toda la sección de objetivos
  localStorage.removeItem("ec0217_objetivos_completo");

  document.getElementById("nav-objetivos")?.classList.remove("completed");
  document.getElementById("nav-beneficios")?.classList.add("disabled");

  if (btnIrBeneficios) {
    btnIrBeneficios.style.display = "none";
  }

  if (nextBtn) {
    nextBtn.style.display = "none";
  }

  if (summary) {
    summary.textContent = "";
  }

  guardarObjetivos();
}

function aplicarModoObjetivos() {
  if (btnModoEstrictoOn) {
    btnModoEstrictoOn.classList.toggle("active", modoEstricto === "on");
  }

  if (btnModoEstrictoOff) {
    btnModoEstrictoOff.classList.toggle("active", modoEstricto === "off");
  }

  const navCognitiva = document.getElementById("nav-cognitiva");
  const navPsicomotriz = document.getElementById("nav-psicomotriz");
  const navAfectiva = document.getElementById("nav-afectiva");
  const navGeneral = document.getElementById("nav-general");

  if (modoEstricto === "off") {
    navCognitiva?.classList.remove("disabled");
    navPsicomotriz?.classList.remove("disabled");
    navAfectiva?.classList.remove("disabled");
    navGeneral?.classList.remove("disabled");
  }

  if (modoEstricto === "on") {
    navCognitiva?.classList.remove("disabled");

    navPsicomotriz?.classList.toggle("disabled", !estado.cognitiva.completa);
    navAfectiva?.classList.toggle("disabled", !estado.psicomotriz.completa);
    navGeneral?.classList.toggle("disabled", !estado.afectiva.completa && !estado.general.completa);
  }
}


if (btnModoEstrictoOn) {
  btnModoEstrictoOn.addEventListener("click", async () => {
    const veniaDeOff = modoEstricto === "off";

    if (veniaDeOff) {
      const confirmar = await showConfirm(
        "Al activar el Modo Estricto se reiniciará el avance de los objetivos y necesitarás volver a validarlos con IA.\n\nTu texto se conservará, pero los objetivos quedarán como \"no validados\".\n\n¿Deseas continuar?",
        { title: "Activar Modo Estricto", icon: "⚠️", confirmText: "Sí, activar", danger: true }
      );
      if (!confirmar) return;
    }

    modoEstricto = "on";
    localStorage.setItem("ec0217_modo_estricto", modoEstricto);

    if (veniaDeOff) {
      reiniciarAvanceObjetivosEstricto();
      aplicarModoObjetivos();
      cambiarSeccion("cognitiva");
      return;
    }

    aplicarModoObjetivos();
    cambiarSeccion(estado.actual);
  });
}

if (btnModoEstrictoOff) {
  btnModoEstrictoOff.addEventListener("click", () => {
    modoEstricto = "off";
    localStorage.setItem("ec0217_modo_estricto", modoEstricto);
    aplicarModoObjetivos();
    cambiarSeccion(estado.actual);
  });
}



function guardarObjetivos() {
  localStorage.setItem("ec0217_objetivos", JSON.stringify({
    cognitiva: estado.cognitiva.texto,
    psicomotriz: estado.psicomotriz.texto,
    afectiva: estado.afectiva.texto,
    general: estado.general.texto,

    cognitivaCompleta: estado.cognitiva.completa,
    psicomotrizCompleta: estado.psicomotriz.completa,
    afectivaCompleta: estado.afectiva.completa,
    generalCompleta: estado.general.completa
  }));
}


function habilitarBeneficios() {
  document.getElementById("nav-objetivos")?.classList.add("completed");
  document.getElementById("nav-beneficios")?.classList.remove("disabled");

  localStorage.setItem("ec0217_objetivos_completo", "true");

  if (btnIrBeneficios && estado.general.completa) {
    btnIrBeneficios.style.display = "inline-block";
  }
}


function cargarObjetivos() {
  const guardado = localStorage.getItem("ec0217_objetivos");
  if (!guardado) return;

  const obj = JSON.parse(guardado);

  estado.cognitiva.texto = obj.cognitiva || "";
  estado.psicomotriz.texto = obj.psicomotriz || "";
  estado.afectiva.texto = obj.afectiva || "";
  estado.general.texto = obj.general || "";

  if (obj.cognitivaCompleta) {
    estado.cognitiva.completa = true;
    document.getElementById("nav-cognitiva")?.classList.add("completed");
    document.getElementById("nav-psicomotriz")?.classList.remove("disabled");
  }

  if (obj.psicomotrizCompleta) {
    estado.psicomotriz.completa = true;
    document.getElementById("nav-psicomotriz")?.classList.add("completed");
    document.getElementById("nav-afectiva")?.classList.remove("disabled");
  }

  if (obj.afectivaCompleta) {
    estado.afectiva.completa = true;
    document.getElementById("nav-afectiva")?.classList.add("completed");
    document.getElementById("nav-general")?.classList.remove("disabled");
  }

  if (obj.generalCompleta) {
    estado.general.completa = true;
    document.getElementById("nav-general")?.classList.add("completed");

    habilitarBeneficios();
  }

  textarea.value = estado[estado.actual].texto || "";
  aplicarModoObjetivos();
}

function desbloquear(seccion) {
  document.getElementById(`nav-${seccion}`).classList.remove("disabled");
}

// ─── GENERAR OBJETIVO GENERAL ─────────────────────────────────────────────────

async function generarGeneral() {
  if (btnGenerarGeneral) {
    btnGenerarGeneral.disabled = true;
    btnGenerarGeneral.textContent = "Generando...";
  }
  document.getElementById("contenedorLoader2").style.display = "block";

  try {
    const response = await fetchConTimeout(`${BACKEND_URL}/generate-general`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        cognitiva:   estado.cognitiva.texto,
        psicomotriz: estado.psicomotriz.texto,
        afectiva:    estado.afectiva.texto
      })
    });

    const data = await response.json();
    estado.general.texto = data.general;
    estado.general.completa = true;
    document.getElementById("nav-general").classList.add("completed");
    document.getElementById("nav-general")?.classList.remove("disabled");
    guardarObjetivos();

    habilitarBeneficios();
    aplicarModoObjetivos();

    if (estado.actual === "general") {
      textarea.value = estado.general.texto;
      if (btnGenerarGeneral) btnGenerarGeneral.style.display = "none";
      btnIrBeneficios.style.display = "inline-block";
    }
  } catch (err) {
    console.error("Error al generar objetivo general:", err);
    if (btnGenerarGeneral) {
      btnGenerarGeneral.textContent = "✨ Generar Objetivo General con IA";
      btnGenerarGeneral.style.display = "inline-block";
    }
  } finally {
    document.getElementById("contenedorLoader2").style.display = "none";
    if (btnGenerarGeneral) {
      btnGenerarGeneral.disabled = false;
      if (btnGenerarGeneral.style.display !== "none") {
        btnGenerarGeneral.textContent = "✨ Generar Objetivo General con IA";
      }
    }
  }
}

// ─── DESCARGAR ZIP ────────────────────────────────────────────────────────────

if (btnDescargar) {
  btnDescargar.addEventListener("click", async () => {
  const todosCompletos =
    estado.general.completa &&
    estado.cognitiva.completa &&
    estado.psicomotriz.completa &&
    estado.afectiva.completa;

  if (!todosCompletos) {
    mensajeDescarga.style.color = "red";
    mensajeDescarga.textContent = "⚠️ Completa todos los objetivos antes de descargar.";
    mensajeDescarga.style.display = "block";
    return;
  }

  btnDescargar.disabled = true;
  btnDescargar.textContent = "Generando...";
  mensajeDescarga.style.display = "none";

  try {
    const response = await fetchConTimeout(`${BACKEND_URL}/generate-doc/objetivos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        general:     estado.general.texto,
        cognitiva:   estado.cognitiva.texto,
        psicomotriz: estado.psicomotriz.texto,
        afectiva:    estado.afectiva.texto
      })
    });

    if (!response.ok) {
      let detalle = `HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        detalle = errJson.detail || JSON.stringify(errJson);
      } catch (err) {
        console.error("Error al generar beneficios:", err);
        showAlert(`No se pudieron generar los beneficios:\n\n${mensajeAmigable(err)}`);
      }
    }

    // Convertir respuesta binaria en descarga
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "objetivos_EC0217.zip";
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);

    mensajeDescarga.style.color = "green";
    mensajeDescarga.textContent = "✅ Descarga iniciada correctamente.";
    mensajeDescarga.style.display = "block";

  } catch (err) {
    console.error("Error al descargar:", err);
    mensajeDescarga.style.color = "red";
    mensajeDescarga.textContent = `⚠️ Error: ${err.message}`;
    mensajeDescarga.style.display = "block";
  } finally {
    btnDescargar.disabled = false;
    btnDescargar.textContent = "⬇ Descargar objetivos (.zip)";
  }
});
}

// ─── ESCRITURA CON DELAY ──────────────────────────────────────────────────────

textarea.addEventListener("input", () => {
  estado[estado.actual].texto = textarea.value;

    if (estado.actual === "general") {
      estado.general.completa = textarea.value.trim().length > 0;

      if (estado.general.completa) {
        document.getElementById("nav-general")?.classList.add("completed");

        if (
          estado.cognitiva.completa &&
          estado.psicomotriz.completa &&
          estado.afectiva.completa
        ) {
          habilitarBeneficios();
        }
      } else {
        document.getElementById("nav-general")?.classList.remove("completed");

        if (btnIrBeneficios) {
          btnIrBeneficios.style.display = "none";
        }

        document.getElementById("nav-beneficios")?.classList.add("disabled");
        localStorage.removeItem("ec0217_objetivos_completo");
      }
    }

  guardarObjetivos();
});

// ─── BENEFICIOS DEL CURSO ────────────────────────────────────────────────────

function cargarBeneficios() {
  const guardado = localStorage.getItem("ec0217_beneficios");
  if (!guardado || !beneficiosTexto) return;

  const data = JSON.parse(guardado);

  if (typeof data === "string") {
    beneficiosTexto.value = data;
  } else {
    beneficiosTexto.value = data.lista || data.texto || "";
  }

  if (localStorage.getItem("ec0217_beneficios_completo") === "true") {
  document.getElementById("nav-beneficios")?.classList.add("completed");
  document.getElementById("nav-temario")?.classList.remove("disabled");
  }
}

function validarBeneficios() {
  if (!beneficiosTexto) return false;

  const texto = beneficiosTexto.value.trim();

  const lineas = texto
    .split(/\n+/)
    .map(l => l.trim())
    .filter(Boolean);

  if (lineas.length < 3) {
    beneficiosTexto.classList.add("error");
    errBeneficiosTexto.style.display = "block";
    return false;
  }

  beneficiosTexto.classList.remove("error");
  errBeneficiosTexto.style.display = "none";
  return true;
}

function guardarBeneficios() {
  const texto = beneficiosTexto.value.trim();

  localStorage.setItem("ec0217_beneficios", JSON.stringify({
    lista: texto
  }));

  localStorage.setItem("ec0217_beneficios_completo", "true");

  document.getElementById("nav-beneficios")?.classList.add("completed");
  document.getElementById("nav-temario")?.classList.remove("disabled");
}

if (btnGenerarBeneficios) {
  btnGenerarBeneficios.addEventListener("click", async () => {
    const objetivosGuardados = localStorage.getItem("ec0217_objetivos");

    if (!objetivosGuardados) {
      showAlert("Primero completa los objetivos.");
      mostrarSeccionPrincipal("seccionObjetivos");
      return;
    }

    const objetivos = JSON.parse(objetivosGuardados);

    if (!objetivos.general) {
      showAlert("Primero genera el objetivo general.");
      mostrarSeccionPrincipal("seccionObjetivos");
      return;
    }

    btnGenerarBeneficios.disabled = true;
    loaderBeneficios.style.display = "block";

    try {
      const datos = JSON.parse(localStorage.getItem("ec0217_datos") || "{}");

      const response = await fetchConTimeout(`${BACKEND_URL}/generate-beneficios`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          general: objetivos.general,
          nombre: datos.nombreCurso || ""
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      beneficiosTexto.value = data.beneficios || data.lista || data.texto || "";

      localStorage.setItem("ec0217_beneficios", JSON.stringify({
        lista: beneficiosTexto.value.trim()
      }));

    } catch (err) {
      console.error("Error real al generar beneficios:", err);
      showAlert(`No se pudieron generar los beneficios:\n\n${mensajeAmigable(err)}`);
    } finally {
      btnGenerarBeneficios.disabled = false;
      loaderBeneficios.style.display = "none";
    }
  });
}

if (btnGuardarBeneficios) {
  btnGuardarBeneficios.addEventListener("click", () => {
    if (!validarBeneficios()) return;

    guardarBeneficios();

    mostrarSeccionPrincipal("seccionTemario");
  });
}

if (beneficiosTexto) {
  beneficiosTexto.addEventListener("input", () => {
    localStorage.setItem("ec0217_beneficios", JSON.stringify({
      lista: beneficiosTexto.value.trim()
    }));
  });
}

cargarBeneficios();


// ─── TEMARIO DEL CURSO ───────────────────────────────────────────────────────

function cargarTemario() {
  const guardado = localStorage.getItem("ec0217_temario");
  if (!guardado) return;

  try {
    const data = JSON.parse(guardado);

    temario.u1 = Array.isArray(data.u1) ? data.u1 : [];
    temario.u2 = Array.isArray(data.u2) ? data.u2 : [];
    temario.u3 = Array.isArray(data.u3) ? data.u3 : [];

    renderTemario();

    if (localStorage.getItem("ec0217_temario_completo") === "true") {
      document.getElementById("nav-temario")?.classList.add("completed");
      document.getElementById("nav-integracion")?.classList.remove("disabled");
    }
  } catch (err) {
    console.error("Error al cargar temario:", err);
  }
}

function guardarTemarioTemporal() {
  localStorage.setItem("ec0217_temario", JSON.stringify(temario));
}

async function generarTemarioIA() {
  if (temarioTieneDatos()) {
    const confirmar = await showConfirm(
      "Ya tienes temas escritos. Si generas temas con IA, los temas actuales se eliminarán y serán reemplazados por nuevas sugerencias. ¿Deseas continuar?",
      { title: "Reemplazar temario", icon: "⚠️", confirmText: "Sí, reemplazar", danger: true }
    );
    if (!confirmar) return;
  }

  const datos = getData("ec0217_datos") || {};
  const objetivos = getData("ec0217_objetivos") || {};
  const beneficios = getData("ec0217_beneficios") || {};

  let beneficiosTexto = "";

  if (typeof beneficios === "string") {
    beneficiosTexto = beneficios;
  } else if (beneficios && typeof beneficios === "object") {
    beneficiosTexto = beneficios.lista || beneficios.texto || "";
  }

  if (!objetivos.general) {
    showAlert("Primero necesitas tener generado el objetivo general para poder sugerir el temario.");
    return;
  }

  try {
    if (loaderTemario) loaderTemario.style.display = "block";
    if (btnGenerarTemario) btnGenerarTemario.disabled = true;

    const response = await fetchConTimeout(`${BACKEND_URL}/generate-temario`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nombre: datos.nombreCurso || "",
        general: objetivos.general || "",
        cognitiva: objetivos.cognitiva || "",
        psicomotriz: objetivos.psicomotriz || "",
        afectiva: objetivos.afectiva || "",
        beneficios: beneficiosTexto
      })
    });

    if (!response.ok) {
      let detalle = `HTTP ${response.status}`;

      try {
        const errJson = await response.json();
        const d = errJson.detail;
        detalle = d ? (typeof d === "object" ? JSON.stringify(d) : String(d)) : JSON.stringify(errJson);
      } catch (_) {}

      throw new Error(detalle);
    }

    const data = await response.json();

    temario.u1 = Array.isArray(data.u1) ? data.u1 : [];
    temario.u2 = Array.isArray(data.u2) ? data.u2 : [];
    temario.u3 = Array.isArray(data.u3) ? data.u3 : [];

    guardarTemarioTemporal();
    renderTemario();
    limpiarErroresTemario();

  } catch (err) {
    console.error("Error al generar temario:", err);
    showAlert(`No se pudo generar el temario:\n\n${mensajeAmigable(err)}`);
  } finally {
    if (loaderTemario) loaderTemario.style.display = "none";
    if (btnGenerarTemario) btnGenerarTemario.disabled = false;
  }
}

function renderTemario() {
  renderListaTemas("u1", listaTemasU1);
  renderListaTemas("u2", listaTemasU2);
  renderListaTemas("u3", listaTemasU3);
}

function renderListaTemas(unidad, contenedor) {
  if (!contenedor) return;

  contenedor.innerHTML = "";

  if (!temario[unidad] || temario[unidad].length === 0) {
    contenedor.innerHTML = `<p class="hint">Aún no has agregado temas.</p>`;
    return;
  }

  temario[unidad].forEach((tema, index) => {
    const div = document.createElement("div");
    div.className = "tema-item";

    div.innerHTML = `
      <span>${tema}</span>
      <button type="button" data-unidad="${unidad}" data-index="${index}">
        Eliminar
      </button>
    `;

    contenedor.appendChild(div);
  });

  contenedor.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      const unidad = btn.dataset.unidad;
      const index = parseInt(btn.dataset.index, 10);

      temario[unidad].splice(index, 1);
      guardarTemarioTemporal();
      renderTemario();
    });
  });
}

function agregarTema(unidad, input) {
  if (!input) return;

  const texto = input.value.trim();

  if (!texto) {
    showAlert("Escribe un tema antes de agregar.");
    return;
  }

  temario[unidad].push(texto);
  input.value = "";

  guardarTemarioTemporal();
  renderTemario();
  limpiarErroresTemario();
}

if (btnAgregarTemaU1) {
  btnAgregarTemaU1.addEventListener("click", () => {
    agregarTema("u1", temaU1Input);
  });
}

if (btnAgregarTemaU2) {
  btnAgregarTemaU2.addEventListener("click", () => {
    agregarTema("u2", temaU2Input);
  });
}

if (btnAgregarTemaU3) {
  btnAgregarTemaU3.addEventListener("click", () => {
    agregarTema("u3", temaU3Input);
  });
}

function limpiarErroresTemario() {
  [errU1, errU2, errU3].forEach(err => {
    if (err) err.style.display = "none";
  });
}

function validarTemario() {
  limpiarErroresTemario();

  let valido = true;

  if (temario.u1.length === 0) {
    if (errU1) errU1.style.display = "block";
    valido = false;
  }

  if (temario.u2.length === 0) {
    if (errU2) errU2.style.display = "block";
    valido = false;
  }

  if (temario.u3.length === 0) {
    if (errU3) errU3.style.display = "block";
    valido = false;
  }

  return valido;
}

function guardarTemarioFinal() {
  localStorage.setItem("ec0217_temario", JSON.stringify(temario));
  localStorage.setItem("ec0217_temario_completo", "true");

  document.getElementById("nav-temario")?.classList.add("completed");
  document.getElementById("nav-integracion")?.classList.remove("disabled");
}

if (btnGenerarTemario) {
  btnGenerarTemario.addEventListener("click", generarTemarioIA);
}

if (temaU1Input) {
  temaU1Input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      agregarTema("u1", temaU1Input);
    }
  });
}

if (temaU2Input) {
  temaU2Input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      agregarTema("u2", temaU2Input);
    }
  });
}

if (temaU3Input) {
  temaU3Input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      agregarTema("u3", temaU3Input);
    }
  });
}

if (btnGuardarTemario) {
  btnGuardarTemario.addEventListener("click", () => {
    if (!validarTemario()) return;

    guardarTemarioFinal();

    mostrarSeccionPrincipal("seccionIntegracion");
  });
}

cargarTemario();
renderTemario();
cargarEncuadre();

// ─── ENCUADRE DEL CURSO ─────────────────────────────────────────────────────

async function generarPreguntasEncuadreIA() {
  const datos = getData("ec0217_datos") || {};

  if (!datos.nombreCurso || !datos.perfil) {
    showAlert("Primero completa el nombre del curso y el perfil del participante en Datos del Curso.");
    mostrarSeccionPrincipal("seccionDatos");
    return;
  }

  const yaTienePreguntas = preguntasEncuadre && preguntasEncuadre.value.trim().length > 0;

  if (yaTienePreguntas) {
    const confirmar = await showConfirm(
      "Ya tienes preguntas escritas. Si generas preguntas con IA, las preguntas actuales se eliminarán y serán reemplazadas. ¿Deseas continuar?",
      { title: "Reemplazar preguntas", icon: "⚠️", confirmText: "Sí, reemplazar", danger: true }
    );
    if (!confirmar) return;
  }

  try {
    if (loaderPreguntas) loaderPreguntas.style.display = "block";
    if (btnGenerarPreguntas) btnGenerarPreguntas.disabled = true;

    const response = await fetchConTimeout(`${BACKEND_URL}/generate-preguntas`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nombre: datos.nombreCurso || "",
        perfil: datos.perfil || ""
      })
    });

    if (!response.ok) {
      let detalle = `HTTP ${response.status}`;

      try {
        const errJson = await response.json();
        const d = errJson.detail;
        detalle = d ? (typeof d === "object" ? JSON.stringify(d) : String(d)) : JSON.stringify(errJson);
      } catch (_) {}

      throw new Error(detalle);
    }

    const data = await response.json();

    let preguntas = [];

    if (Array.isArray(data.preguntas)) {
      preguntas = data.preguntas;
    } else if (typeof data.preguntas === "string") {
      preguntas = data.preguntas.split(/\n+/).filter(Boolean);
    }

    preguntasEncuadre.value = preguntas
      .slice(0, 4)
      .map((p, i) => `${i + 1}. ${p.replace(/^\d+[\).\s-]*/, "")}`)
      .join("\n");

    guardarEncuadreTemporal();

  } catch (err) {
    console.error("Error al generar preguntas:", err);
    showAlert(`No se pudieron generar las preguntas:\n\n${mensajeAmigable(err)}`);
  } finally {
    if (loaderPreguntas) loaderPreguntas.style.display = "none";
    if (btnGenerarPreguntas) btnGenerarPreguntas.disabled = false;
  }
}

const tecnicasRompehielos = [
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

const tecnicasEnergizantes = [
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

// Exponer arrays de técnicas para step-detalle-tecnicas.js y step-tecnicas.js
window.sbeTecnicasRompehielos  = tecnicasRompehielos;
window.sbeTecnicasEnergizantes = tecnicasEnergizantes;

function obtenerChecksSeleccionados(selector) {
  return Array.from(document.querySelectorAll(selector))
    .filter(check => check.checked)
    .map(check => check.value);
}

function copiarReglasSeleccionadasATextarea() {
  const reglasSeleccionadas = obtenerChecksSeleccionados(".regla-check");

  const reglaExtra = otraRegla ? otraRegla.value.trim() : "";

  if (reglaExtra) {
    reglasSeleccionadas.push(reglaExtra);
  }

  if (reglasSeleccionadas.length === 0) {
    showAlert("Selecciona al menos una regla antes de copiar.");
    return;
  }

  if (reglasCursoTexto) {
    reglasCursoTexto.value = reglasSeleccionadas
      .map(regla => `• ${regla}`)
      .join("\n");
  }

  guardarEncuadreTemporal();
}

function inicializarContratoPorDefecto() {
  const yaInicializado = localStorage.getItem("ec0217_contrato_inicializado");

  if (yaInicializado === "true") return;

  const acuerdos = document.querySelectorAll(".acuerdo-check");

  acuerdos.forEach(check => {
    check.checked = true;
  });

  localStorage.setItem("ec0217_contrato_inicializado", "true");

  guardarEncuadreTemporal();
}


function cargarEncuadre() {
  const guardado = localStorage.getItem("ec0217_encuadre");
  if (!guardado) return;

  try {
    const data = JSON.parse(guardado);

    if (preguntasEncuadre) {
      preguntasEncuadre.value = data.preguntas || "";
    }

    if (localStorage.getItem("ec0217_contrato_completo") === "true") {
      document.getElementById("nav-contrato")?.classList.add("completed");
      document.getElementById("nav-expositiva")?.classList.remove("disabled");
    }

    if (otraRegla) {
      otraRegla.value = data.otraRegla || "";
    }

    if (otroAcuerdo) {
      otroAcuerdo.value = data.otroAcuerdo || "";
    }

    acuerdosPersonalizados = Array.isArray(data.acuerdosPersonalizados)
      ? data.acuerdosPersonalizados
      : [];

    renderAcuerdosPersonalizados();

    document.querySelectorAll(".regla-check").forEach(check => {
      const reglasParaRestaurar = Array.isArray(data.reglasSeleccionadas)
        ? data.reglasSeleccionadas
        : data.reglasTexto;

      check.checked = Array.isArray(reglasParaRestaurar)
        ? reglasParaRestaurar.includes(check.value)
        : false;
    });

    if (reglasCursoTexto) {
      reglasCursoTexto.value = Array.isArray(data.reglasTexto)
        ? data.reglasTexto.map(regla => `• ${regla}`).join("\n")
        : "";
    }

    document.querySelectorAll(".acuerdo-check").forEach(check => {
      check.checked = Array.isArray(data.acuerdosTexto)
        ? data.acuerdosTexto.includes(check.value)
        : false;
    });

    if (localStorage.getItem("ec0217_reglas_completo") === "true") {
      document.getElementById("nav-reglas")?.classList.add("completed");
      document.getElementById("nav-contrato")?.classList.remove("disabled");
    }

    if (localStorage.getItem("ec0217_contrato_completo") === "true") {
      document.getElementById("nav-contrato")?.classList.add("completed");
      document.getElementById("nav-expositiva")?.classList.remove("disabled");
    }

  } catch (err) {
    console.error("Error al cargar encuadre:", err);
  }
}


function recolectarEncuadre() {
  const reglasSeleccionadas = obtenerChecksSeleccionados(".regla-check");

  const reglaExtra = otraRegla ? otraRegla.value.trim() : "";

  if (reglaExtra) {
    reglasSeleccionadas.push(reglaExtra);
  }

  let reglasFinales = [];

  if (reglasCursoTexto && reglasCursoTexto.value.trim()) {
    reglasFinales = reglasCursoTexto.value
      .split(/\n+/)
      .map(linea => linea.trim())
      .filter(Boolean)
      .map(linea => linea.replace(/^•\s*/, ""));
  } else {
    reglasFinales = reglasSeleccionadas;
  }

  return {
    preguntas: preguntasEncuadre ? preguntasEncuadre.value.trim() : "",

    // Aquí se guardan las reglas finales, ya editadas por el usuario
    reglasTexto: reglasFinales,

    // Esto guarda la selección original de radios para poder restaurarla visualmente
    reglasSeleccionadas: reglasSeleccionadas,

    otraRegla: otraRegla ? otraRegla.value.trim() : "",

    acuerdosTexto: [
      ...obtenerChecksSeleccionados(".acuerdo-check"),
      ...acuerdosPersonalizados
    ],
    otroAcuerdo: "",
    acuerdosPersonalizados: acuerdosPersonalizados,

    // Compatibilidad con el modelo de FastAPI
    reglas: [],
    acuerdos: []
  };
}


function renderAcuerdosPersonalizados() {
  if (!listaAcuerdosPersonalizados) return;

  listaAcuerdosPersonalizados.innerHTML = "";

  if (acuerdosPersonalizados.length === 0) {
    listaAcuerdosPersonalizados.innerHTML = `
      <p class="hint">Aún no has agregado compromisos personalizados.</p>
    `;
    return;
  }

  acuerdosPersonalizados.forEach((acuerdo, index) => {
    const div = document.createElement("div");
    div.className = "tema-item";

    div.innerHTML = `
      <span>${acuerdo}</span>
      <button type="button" data-index="${index}">
        Eliminar
      </button>
    `;

    listaAcuerdosPersonalizados.appendChild(div);
  });

  listaAcuerdosPersonalizados.querySelectorAll("button").forEach(btn => {
    btn.addEventListener("click", () => {
      const index = parseInt(btn.dataset.index, 10);

      acuerdosPersonalizados.splice(index, 1);

      guardarEncuadreTemporal();
      renderAcuerdosPersonalizados();
    });
  });
}

function agregarAcuerdoPersonalizado() {
  if (!otroAcuerdo) return;

  const texto = otroAcuerdo.value.trim();

  if (!texto) {
    showAlert("Escribe un compromiso antes de agregar.");
    return;
  }

  acuerdosPersonalizados.push(texto);
  otroAcuerdo.value = "";

  guardarEncuadreTemporal();
  renderAcuerdosPersonalizados();

  if (errContrato) errContrato.style.display = "none";
}


function guardarEncuadreTemporal() {
  const data = recolectarEncuadre();
  localStorage.setItem("ec0217_encuadre", JSON.stringify(data));
}

function validarPreguntas() {
  if (errPreguntas) errPreguntas.style.display = "none";

  const texto = preguntasEncuadre ? preguntasEncuadre.value.trim() : "";

  if (!texto) {
    if (errPreguntas) errPreguntas.style.display = "block";
    return false;
  }

  return true;
}

function guardarPreguntasFinal() {
  guardarEncuadreTemporal();

  localStorage.setItem("ec0217_preguntas_completo", "true");

  document.getElementById("nav-preguntas")?.classList.add("completed");
  document.getElementById("nav-reglas")?.classList.remove("disabled");
}

function validarReglas() {
  if (errReglas) errReglas.style.display = "none";

  const data = recolectarEncuadre();

  const tieneReglas = data.reglasTexto.length > 0;

  if (!tieneReglas) {
    if (errReglas) errReglas.style.display = "block";
    return false;
  }

  return true;
}

function validarContrato() {
  if (errContrato) errContrato.style.display = "none";

  const acuerdosSeleccionados = obtenerChecksSeleccionados(".acuerdo-check");
  const acuerdoEscrito = otroAcuerdo ? otroAcuerdo.value.trim() : "";

  const tieneSeleccionados = acuerdosSeleccionados.length > 0;
  const tienePersonalizados = acuerdosPersonalizados.length > 0;
  const tieneTextoSinAgregar = acuerdoEscrito.length > 0;

  if (!tieneSeleccionados && !tienePersonalizados && !tieneTextoSinAgregar) {
    if (errContrato) errContrato.style.display = "block";
    return false;
  }

  if (tieneTextoSinAgregar) {
    acuerdosPersonalizados.push(acuerdoEscrito);
    otroAcuerdo.value = "";
    renderAcuerdosPersonalizados();
    guardarEncuadreTemporal();
  }

  return true;
}

function guardarEncuadreFinal() {
  const data = recolectarEncuadre();

  localStorage.setItem("ec0217_encuadre", JSON.stringify(data));
  localStorage.setItem("ec0217_encuadre_completo", "true");

  document.getElementById("nav-contrato")?.classList.add("completed");
  document.getElementById("nav-expositiva")?.classList.remove("disabled");
}

if (btnGenerarPreguntas) {
  btnGenerarPreguntas.addEventListener("click", generarPreguntasEncuadreIA);
}


if (preguntasEncuadre) {
  preguntasEncuadre.addEventListener("input", guardarEncuadreTemporal);
}

if (btnGuardarPreguntas) {
  btnGuardarPreguntas.addEventListener("click", () => {
    if (!validarPreguntas()) return;

    guardarPreguntasFinal();

    mostrarSeccionPrincipal("seccionReglas");
  });
}

if (btnCopiarReglas) {
  btnCopiarReglas.addEventListener("click", copiarReglasSeleccionadasATextarea);
}

if (reglasCursoTexto) {
  reglasCursoTexto.addEventListener("input", guardarEncuadreTemporal);
}

if (otraRegla) {
  otraRegla.addEventListener("input", guardarEncuadreTemporal);
}

if (otroAcuerdo) {
  otroAcuerdo.addEventListener("input", guardarEncuadreTemporal);
}

if (btnAgregarAcuerdo) {
  btnAgregarAcuerdo.addEventListener("click", agregarAcuerdoPersonalizado);
}

if (otroAcuerdo) {
  otroAcuerdo.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      agregarAcuerdoPersonalizado();
    }
  });
}

document.querySelectorAll(".regla-check").forEach(check => {
  check.addEventListener("change", guardarEncuadreTemporal);
});

document.querySelectorAll(".acuerdo-check").forEach(check => {
  check.addEventListener("change", guardarEncuadreTemporal);
});


if (btnGuardarReglas) {
  btnGuardarReglas.addEventListener("click", () => {
    if (!validarReglas()) return;

    guardarEncuadreTemporal();

    localStorage.setItem("ec0217_reglas_completo", "true");

    document.getElementById("nav-reglas")?.classList.add("completed");
    document.getElementById("nav-contrato")?.classList.remove("disabled");

    mostrarSeccionPrincipal("seccionContrato");
  });
}

if (btnGuardarContrato) {
  btnGuardarContrato.addEventListener("click", () => {
    if (!validarContrato()) return;

    guardarEncuadreFinal();

    localStorage.setItem("ec0217_contrato_completo", "true");

    document.getElementById("nav-contrato")?.classList.add("completed");
    document.getElementById("nav-expositiva")?.classList.remove("disabled");

    mostrarSeccionPrincipal("seccionExpositiva");
  });
}


// ─── TÉCNICAS GRUPALES ───────────────────────────────────────────────────────


async function generarExpositivaIA(campo, boton) {
  const datos = getData("ec0217_datos") || {};
  const objetivos = getData("ec0217_objetivos") || {};
  const temario = getData("ec0217_temario") || {};

  const camposMap = {
    introduccion: expIntroduccion,
    experiencia: expExperiencia,
    desarrollo: expDesarrollo,
    ejemplos: expEjemplos,
    sintesis: expSintesis,
    preguntas: expPreguntas,
    utilidad: expUtilidad
  };

  const textareaDestino = camposMap[campo];

  if (!textareaDestino) return;

  try {
    boton.disabled = true;
    boton.textContent = "Generando...";

    const response = await fetchConTimeout(`${BACKEND_URL}/generate-expositiva`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        campo,
        nombreCurso: datos.nombreCurso || "",
        perfil: datos.perfil || "",
        objetivoCognitivo: objetivos.cognitiva || "",
        objetivoGeneral: objetivos.general || "",
        temario
      })
    });

    if (!response.ok) {
      let detalle = `HTTP ${response.status}`;

      try {
        const errJson = await response.json();
        const d = errJson.detail;
        detalle = d ? (typeof d === "object" ? JSON.stringify(d) : String(d)) : JSON.stringify(errJson);
      } catch (_) {}

      throw new Error(detalle);
    }

    const data = await response.json();

    textareaDestino.value = data.texto || "";

    guardarExpositivaTemporal();

  } catch (err) {
    console.error("Error al generar técnica expositiva:", err);
    showAlert(`No se pudo generar el texto:\n\n${mensajeAmigable(err)}`);
  } finally {
    boton.disabled = false;
    boton.textContent = "Generar con IA";
  }
}

document.querySelectorAll("#seccionExpositiva .btn-ia-expositiva").forEach(btn => {
  btn.addEventListener("click", () => {
    const campo = btn.dataset.campo;
    generarExpositivaIA(campo, btn);
  });
});

// Botones de demostrativa: acepta btn-ia-expositiva y btn-ia-demostrativa
document.querySelectorAll("#seccionDemostrativa .btn-ia-expositiva, #seccionDemostrativa .btn-ia-demostrativa").forEach(btn => {
  btn.addEventListener("click", () => {
    const campo = btn.dataset.campo;
    generarDemostrativaIA(campo, btn);
  });
});

function obtenerRadioSeleccionado(name) {
  return document.querySelector(`input[name="${name}"]:checked`);
}

function buscarTecnica(lista, id) {
  return lista.find(item => item.id === id);
}

function mostrarDetalleIntegracion() {
  const seleccionada = obtenerRadioSeleccionado("tecnicaIntegracion");

  if (!seleccionada) {
    if (detalleIntegracionNombre) {
      detalleIntegracionNombre.value = "Información de la técnica de integración";
    }

    if (detalleIntegracionObjetivo) detalleIntegracionObjetivo.value = "";
    if (detalleIntegracionInstrucciones) detalleIntegracionInstrucciones.value = "";

    return;
  }

  if (seleccionada.value === "personalizada") {
    if (detalleIntegracionNombre) {
      if (!detalleIntegracionNombre.value) detalleIntegracionNombre.value = "Técnica personalizada";
    }

    // No limpiar si ya tienen valor (pueden venir del JSON importado o de una sesión previa)
    if (detalleIntegracionObjetivo && !detalleIntegracionObjetivo.value) detalleIntegracionObjetivo.value = "";
    if (detalleIntegracionInstrucciones && !detalleIntegracionInstrucciones.value) detalleIntegracionInstrucciones.value = "";

    if (!cargandoTecnicas) {
      guardarTecnicasTemporal();
    }
    return;
  }

  const tecnica = buscarTecnica(tecnicasRompehielos, seleccionada.value);

  if (!tecnica) return;

  if (detalleIntegracionNombre) {
    detalleIntegracionNombre.value = tecnica.nombre;
  }

  if (detalleIntegracionObjetivo) {
    detalleIntegracionObjetivo.value = tecnica.objetivo || "";
  }

  if (detalleIntegracionInstrucciones) {
    detalleIntegracionInstrucciones.value = tecnica.instrucciones || "";
  }

  if (seleccionada && !cargandoTecnicas) {
    guardarTecnicasTemporal();
  }
}

function mostrarDetalleEnergizante() {
  const seleccionada = obtenerRadioSeleccionado("tecnicaEnergizante");

  if (!seleccionada) {
    if (detalleEnergizanteNombre) {
      detalleEnergizanteNombre.value = "Información de la técnica energizante";
    }

    if (detalleEnergizanteObjetivo) detalleEnergizanteObjetivo.value = "";
    if (detalleEnergizanteInstrucciones) detalleEnergizanteInstrucciones.value = "";

    return;
  }

  if (seleccionada.value === "personalizada") {
    if (detalleEnergizanteNombre) {
      if (!detalleEnergizanteNombre.value) detalleEnergizanteNombre.value = "Técnica personalizada";
    }

    // No limpiar si ya tienen valor (pueden venir del JSON importado o de una sesión previa)
    if (detalleEnergizanteObjetivo && !detalleEnergizanteObjetivo.value) detalleEnergizanteObjetivo.value = "";
    if (detalleEnergizanteInstrucciones && !detalleEnergizanteInstrucciones.value) detalleEnergizanteInstrucciones.value = "";

    if (!cargandoTecnicas) {
      guardarTecnicasTemporal();
    }

    return;
  }

  const tecnica = buscarTecnica(tecnicasEnergizantes, seleccionada.value);

  if (!tecnica) return;

  if (detalleEnergizanteNombre) {
    detalleEnergizanteNombre.value = tecnica.nombre;
  }

  if (detalleEnergizanteObjetivo) {
    detalleEnergizanteObjetivo.value = tecnica.objetivo || "";
  }

  if (detalleEnergizanteInstrucciones) {
    detalleEnergizanteInstrucciones.value = tecnica.instrucciones || "";
  }

  if (!cargandoTecnicas) {
    guardarTecnicasTemporal();
  }
}

function actualizarCamposPersonalizadosTecnicas() {
  const rhSeleccionada = obtenerRadioSeleccionado("tecnicaIntegracion");
  const enSeleccionada = obtenerRadioSeleccionado("tecnicaEnergizante");

  if (camposIntegracionPersonalizada) {
    camposIntegracionPersonalizada.classList.toggle(
      "hidden",
      !rhSeleccionada || rhSeleccionada.value !== "personalizada"
    );
  }

  if (camposEnergizantePersonalizada) {
    camposEnergizantePersonalizada.classList.toggle(
      "hidden",
      !enSeleccionada || enSeleccionada.value !== "personalizada"
    );
  }
  mostrarDetalleIntegracion();
  mostrarDetalleEnergizante();
}

function recolectarTecnicas() {
  const rhSeleccionada = obtenerRadioSeleccionado("tecnicaIntegracion");
  const enSeleccionada = obtenerRadioSeleccionado("tecnicaEnergizante");

  let rompehielos = null;
  let energizante = null;

  if (rhSeleccionada) {
    if (rhSeleccionada.value === "personalizada") {
      rompehielos = {
        id: "personalizada",
        nombre: "Técnica personalizada",
        objetivo: detalleIntegracionObjetivo
          ? detalleIntegracionObjetivo.value.trim()
          : "",
        instrucciones: detalleIntegracionInstrucciones
          ? detalleIntegracionInstrucciones.value.trim()
          : "",
        duracion: "",
        participacion: "",
        integracion: "",
        controlTiempo: ""
      };
    } else {
      const tecnicaBase = buscarTecnica(tecnicasRompehielos, rhSeleccionada.value);

      rompehielos = tecnicaBase ? {
        id: tecnicaBase.id,
        nombre: tecnicaBase.nombre,
        objetivo: detalleIntegracionObjetivo
          ? detalleIntegracionObjetivo.value.trim()
          : "",
        instrucciones: detalleIntegracionInstrucciones
          ? detalleIntegracionInstrucciones.value.trim()
          : "",
        duracion: "",
        participacion: "",
        integracion: "",
        controlTiempo: ""
      } : null;
    }
  }

  if (enSeleccionada) {
  if (enSeleccionada.value === "personalizada") {
    energizante = {
      id: "personalizada",
      nombre: "Técnica personalizada",
      objetivo: detalleEnergizanteObjetivo
        ? detalleEnergizanteObjetivo.value.trim()
        : "",
      instrucciones: detalleEnergizanteInstrucciones
        ? detalleEnergizanteInstrucciones.value.trim()
        : ""
    };
  } else {
    const tecnicaBase = buscarTecnica(tecnicasEnergizantes, enSeleccionada.value);

    energizante = tecnicaBase ? {
      id: tecnicaBase.id,
      nombre: tecnicaBase.nombre,
      objetivo: detalleEnergizanteObjetivo
        ? detalleEnergizanteObjetivo.value.trim()
        : "",
      instrucciones: detalleEnergizanteInstrucciones
        ? detalleEnergizanteInstrucciones.value.trim()
        : ""
    } : null;
  }
}

  return {
    rhNombre: (detalleIntegracionNombre && detalleIntegracionNombre.value.trim())
      ? detalleIntegracionNombre.value.trim()
      : (rompehielos ? rompehielos.nombre : ""),
    rhObjetivo: rompehielos ? rompehielos.objetivo : "",
    rhInstrucciones: rompehielos ? rompehielos.instrucciones : "",
    rhDetalle: rompehielos
      ? `a) Explicará objetivo de la técnica:\n${rompehielos.objetivo}\n\nb) Dará las instrucciones de la técnica:\n${rompehielos.instrucciones}\n\nc) Mencionará el tiempo para realizarla:\n${rompehielos.duracion}\n\nd) ${rompehielos.participacion}\n\ne) ${rompehielos.integracion}\n\nf) ${rompehielos.controlTiempo}`
      : "",
    rhDuracion: rompehielos ? rompehielos.duracion : "",
    rhMateriales: rompehielos ? rompehielos.materiales : "",

    enNombre: (detalleEnergizanteNombre && detalleEnergizanteNombre.value.trim())
      ? detalleEnergizanteNombre.value.trim()
      : (energizante ? energizante.nombre : ""),
    enObjetivo: energizante ? energizante.objetivo : "",
    enInstrucciones: energizante ? energizante.instrucciones : "",
    enDetalle: energizante
      ? `a) Explicará objetivo de la técnica:\n${energizante.objetivo}\n\nb) Dará las instrucciones de la técnica:\n${energizante.instrucciones}`
      : "",
    enDuracion: "",
    enMateriales: "",

    rompehielos,
    energizante
  };
}

function guardarTecnicasTemporal() {
  if (cargandoTecnicas) return;

  const data = recolectarTecnicas();

  const rhSeleccionada = obtenerRadioSeleccionado("tecnicaIntegracion");
  const enSeleccionada = obtenerRadioSeleccionado("tecnicaEnergizante");

  data.rhSeleccion = rhSeleccionada ? rhSeleccionada.value : "";
  data.enSeleccion = enSeleccionada ? enSeleccionada.value : "";

  localStorage.setItem("ec0217_tecnicas", JSON.stringify(data));
}

function restaurarDetalleIntegracionGuardado(data) {
  if (!data) return;

  if (detalleIntegracionNombre) {
    detalleIntegracionNombre.value =
      data.rhNombre || data.rompehielos?.nombre || "";
  }

  if (detalleIntegracionObjetivo) {
    detalleIntegracionObjetivo.value =
      data.rhObjetivo || data.rompehielos?.objetivo || "";
  }

  if (detalleIntegracionInstrucciones) {
    detalleIntegracionInstrucciones.value =
      data.rhInstrucciones || data.rompehielos?.instrucciones || "";
  }
}


function restaurarNavegacionTecnicas() {
  if (localStorage.getItem("ec0217_temario_completo") === "true") {
    document.getElementById("nav-temario")?.classList.add("completed");
    document.getElementById("nav-integracion")?.classList.remove("disabled");
  }

  if (localStorage.getItem("ec0217_integracion_completo") === "true") {
    document.getElementById("nav-integracion")?.classList.add("completed");
    document.getElementById("nav-preguntas")?.classList.remove("disabled");
  }

  if (localStorage.getItem("ec0217_preguntas_completo") === "true") {
    document.getElementById("nav-preguntas")?.classList.add("completed");
    document.getElementById("nav-reglas")?.classList.remove("disabled");
  }

  if (localStorage.getItem("ec0217_reglas_completo") === "true") {
    document.getElementById("nav-reglas")?.classList.add("completed");
    document.getElementById("nav-contrato")?.classList.remove("disabled");
  }

  if (localStorage.getItem("ec0217_contrato_completo") === "true") {
    document.getElementById("nav-contrato")?.classList.add("completed");
    document.getElementById("nav-expositiva")?.classList.remove("disabled");
  }

  if (localStorage.getItem("ec0217_expositiva_completo") === "true") {
    document.getElementById("nav-expositiva")?.classList.add("completed");
    document.getElementById("nav-demostrativa")?.classList.remove("disabled");
  }

  if (localStorage.getItem("ec0217_demostrativa_completo") === "true") {
    document.getElementById("nav-demostrativa")?.classList.add("completed");
    document.getElementById("nav-energizante")?.classList.remove("disabled");
  }

  if (localStorage.getItem("ec0217_energizante_completo") === "true") {
    document.getElementById("nav-energizante")?.classList.add("completed");
    document.getElementById("nav-dialogo")?.classList.remove("disabled");
  }

  if (localStorage.getItem("ec0217_dialogo_completo") === "true") {
    document.getElementById("nav-dialogo")?.classList.add("completed");
    document.getElementById("nav-cierre")?.classList.remove("disabled");
  }

  if (localStorage.getItem("ec0217_cierre_completo") === "true") {
    document.getElementById("nav-cierre")?.classList.add("completed");
    document.getElementById("nav-evaluaciones")?.classList.remove("disabled");
  }
}

function cargarTecnicas() {
  const guardado = localStorage.getItem("ec0217_tecnicas");
  if (!guardado) return;

  cargandoTecnicas = true;

  try {
    const data = JSON.parse(guardado);

    if (data.rhSeleccion) {
      const radioRh = document.querySelector(
        `input[name="tecnicaIntegracion"][value="${data.rhSeleccion}"]`
      );

      if (radioRh) {
        radioRh.checked = true;
      }
    }

    if (data.enSeleccion) {
      const radioEn = document.querySelector(
        `input[name="tecnicaEnergizante"][value="${data.enSeleccion}"]`
      );

      if (radioEn) {
        radioEn.checked = true;
      }
    }

    if (detalleIntegracionNombre) {
      detalleIntegracionNombre.value =
        data.rhNombre || data.rompehielos?.nombre || "";
    }

    if (detalleIntegracionObjetivo) {
      detalleIntegracionObjetivo.value =
        data.rhObjetivo ||
        data.rompehielos?.objetivo ||
        "";
    }

    if (detalleIntegracionInstrucciones) {
      detalleIntegracionInstrucciones.value =
        data.rhInstrucciones ||
        data.rompehielos?.instrucciones ||
        "";
    }


    if (camposEnergizantePersonalizada) {
      camposEnergizantePersonalizada.classList.toggle(
        "hidden",
        data.enSeleccion !== "personalizada"
      );
    }

    if (localStorage.getItem("ec0217_integracion_completo") === "true") {
      document.getElementById("nav-integracion")?.classList.add("completed");
      document.getElementById("nav-preguntas")?.classList.remove("disabled");
    }

    if (localStorage.getItem("ec0217_energizante_completo") === "true") {
      document.getElementById("nav-energizante")?.classList.add("completed");
      document.getElementById("nav-dialogo")?.classList.remove("disabled");
    }

    if (detalleEnergizanteNombre) {
      detalleEnergizanteNombre.value =
        data.enNombre || data.energizante?.nombre || "";
    }

    if (detalleEnergizanteObjetivo) {
      detalleEnergizanteObjetivo.value =
        data.enObjetivo ||
        data.energizante?.objetivo ||
        "";
    }

    if (detalleEnergizanteInstrucciones) {
      detalleEnergizanteInstrucciones.value =
        data.enInstrucciones ||
        data.energizante?.instrucciones ||
        "";
    }

  } catch (err) {
    console.error("Error al cargar técnicas:", err);
  } finally {
    cargandoTecnicas = false;
  }
}


function inicializarTecnicasPersonalizadasPorDefecto() {
  const tecnicasGuardadas = localStorage.getItem("ec0217_tecnicas");

  // Si ya hay datos guardados, no forzamos personalizada
  if (tecnicasGuardadas) return;

  const integracionPersonalizada = document.querySelector(
    'input[name="tecnicaIntegracion"][value="personalizada"]'
  );

  const energizantePersonalizada = document.querySelector(
    'input[name="tecnicaEnergizante"][value="personalizada"]'
  );

  if (integracionPersonalizada) {
    integracionPersonalizada.checked = true;
  }

  if (energizantePersonalizada) {
    energizantePersonalizada.checked = true;
  }

  actualizarCamposPersonalizadosTecnicas();
  guardarTecnicasTemporal();
}

function validarIntegracion() {
  if (errIntegracion) errIntegracion.style.display = "none";

  const data = recolectarTecnicas();

  if (
    !data.rhNombre ||
    !data.rhObjetivo ||
    !data.rhInstrucciones
  ) {
    if (errIntegracion) errIntegracion.style.display = "block";
    return false;
  }

  return true;
}

function validarEnergizante() {
  if (errEnergizante) errEnergizante.style.display = "none";

  const data = recolectarTecnicas();

  if (
    !data.enNombre ||
    !data.enObjetivo ||
    !data.enInstrucciones
  ) {
    if (errEnergizante) errEnergizante.style.display = "block";
    return false;
  }

  return true;
}

function guardarTecnicasFinal() {
  const data = recolectarTecnicas();

  const rhSeleccionada = obtenerRadioSeleccionado("tecnicaIntegracion");
  const enSeleccionada = obtenerRadioSeleccionado("tecnicaEnergizante");

  data.rhSeleccion = rhSeleccionada ? rhSeleccionada.value : "";
  data.enSeleccion = enSeleccionada ? enSeleccionada.value : "";

  localStorage.setItem("ec0217_tecnicas", JSON.stringify(data));
  localStorage.setItem("ec0217_tecnicas_completo", "true");

  document.getElementById("nav-energizante")?.classList.add("completed");
  document.getElementById("nav-dialogo")?.classList.remove("disabled");
}

document.querySelectorAll('input[name="tecnicaIntegracion"]').forEach(radio => {
  radio.addEventListener("change", () => {
    actualizarCamposPersonalizadosTecnicas();
    guardarTecnicasTemporal();

    const detalle = document.getElementById("detalleIntegracion");

    if (detalle) {
      setTimeout(() => {
        detalle.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 150);
    }
  });
});

document.querySelectorAll('input[name="tecnicaEnergizante"]').forEach(radio => {
  radio.addEventListener("change", () => {
    actualizarCamposPersonalizadosTecnicas();
    guardarTecnicasTemporal();

    const detalle = document.getElementById("detalleEnergizante");

    if (detalle) {
      setTimeout(() => {
        detalle.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }, 150);
    }
  });
});

[

  detalleIntegracionObjetivo,
  detalleIntegracionInstrucciones,

  enNombreCustom,
  enDetalleCustom,
  enDuracionCustom,
  enMaterialesCustom
].forEach(campo => {
  if (campo) {
    campo.addEventListener("input", guardarTecnicasTemporal);
  }
});

if (btnGuardarIntegracion) {
  btnGuardarIntegracion.addEventListener("click", () => {
    if (!validarIntegracion()) return;

    guardarTecnicasTemporal();

    localStorage.setItem("ec0217_integracion_completo", "true");

    document.getElementById("nav-integracion")?.classList.add("completed");
    document.getElementById("nav-preguntas")?.classList.remove("disabled");

    mostrarSeccionPrincipal("seccionPreguntas");
  });
}

if (btnGuardarEnergizante) {
  btnGuardarEnergizante.addEventListener("click", () => {
    if (!validarEnergizante()) return;

    guardarTecnicasFinal();

    localStorage.setItem("ec0217_energizante_completo", "true");
    localStorage.setItem("ec0217_tecnicas_completo", "true");

    document.getElementById("nav-energizante")?.classList.add("completed");
    document.getElementById("nav-dialogo")?.classList.remove("disabled");

    mostrarSeccionPrincipal("seccionDialogo");
  });
}

cargarTecnicas();


function cargarObjetivoCognitivoExpositiva() {
  const objetivos = getData("ec0217_objetivos") || {};

  if (expObjetivo) {
    expObjetivo.value = objetivos.cognitiva || "";
  }
}

function recolectarExpositiva() {
  return {
    objetivo: expObjetivo ? expObjetivo.value.trim() : "",
    introduccion: expIntroduccion ? expIntroduccion.value.trim() : "",
    experiencia: expExperiencia ? expExperiencia.value.trim() : "",
    desarrollo: expDesarrollo ? expDesarrollo.value.trim() : "",
    ejemplos: expEjemplos ? expEjemplos.value.trim() : "",
    sintesis: expSintesis ? expSintesis.value.trim() : "",
    preguntas: expPreguntas ? expPreguntas.value.trim() : "",
    utilidad: expUtilidad ? expUtilidad.value.trim() : ""
  };
}

function guardarExpositivaTemporal() {
  const data = recolectarExpositiva();
  localStorage.setItem("ec0217_expositiva", JSON.stringify(data));
}

function cargarExpositiva() {
  cargarObjetivoCognitivoExpositiva();

  const guardado = localStorage.getItem("ec0217_expositiva");
  if (!guardado) return;

  try {
    const data = JSON.parse(guardado);

    if (expIntroduccion) expIntroduccion.value = data.introduccion || "";
    if (expExperiencia) expExperiencia.value = data.experiencia || "";
    if (expDesarrollo) expDesarrollo.value = data.desarrollo || "";
    if (expEjemplos) expEjemplos.value = data.ejemplos || "";
    if (expSintesis) expSintesis.value = data.sintesis || "";
    if (expPreguntas) expPreguntas.value = data.preguntas || "";
    if (expUtilidad) expUtilidad.value = data.utilidad || "";

    if (localStorage.getItem("ec0217_expositiva_completo") === "true") {
      document.getElementById("nav-expositiva")?.classList.add("completed");
      document.getElementById("nav-demostrativa")?.classList.remove("disabled");
    }

  } catch (err) {
    console.error("Error al cargar técnica expositiva:", err);
  }
}

function validarExpositiva() {
  if (errExpositiva) errExpositiva.style.display = "none";

  const data = recolectarExpositiva();

  const completo =
    data.objetivo &&
    data.introduccion &&
    data.experiencia &&
    data.desarrollo &&
    data.ejemplos &&
    data.sintesis &&
    data.preguntas &&
    data.utilidad;

  if (!completo) {
    if (errExpositiva) errExpositiva.style.display = "block";
    return false;
  }

  return true;
}

function guardarExpositivaFinal() {
  guardarExpositivaTemporal();

  localStorage.setItem("ec0217_expositiva_completo", "true");

  document.getElementById("nav-expositiva")?.classList.add("completed");
  document.getElementById("nav-demostrativa")?.classList.remove("disabled");
}


[
  expIntroduccion,
  expExperiencia,
  expDesarrollo,
  expEjemplos,
  expSintesis,
  expPreguntas,
  expUtilidad
].forEach(campo => {
  if (campo) {
    campo.addEventListener("input", guardarExpositivaTemporal);
  }
});

if (btnGuardarExpositiva) {
  btnGuardarExpositiva.addEventListener("click", () => {
    if (!validarExpositiva()) return;

    guardarExpositivaFinal();

    document.getElementById("nav-demostrativa")?.classList.remove("disabled");

    mostrarSeccionPrincipal("seccionDemostrativa");
  });
}

document.getElementById("nav-expositiva")?.addEventListener("click", () => {
  if (localStorage.getItem("ec0217_contrato_completo") === "true") {
    mostrarSeccionPrincipal("seccionExpositiva");
  }
});

document.getElementById("nav-evaluaciones")?.addEventListener("click", () => {
  if (localStorage.getItem("ec0217_cierre_completo") === "true") {
    mostrarSeccionPrincipal("seccionEvaluaciones");
  }
});

document.getElementById("nav-cierre")?.addEventListener("click", () => {
  if (localStorage.getItem("ec0217_dialogo_completo") === "true") {
    mostrarSeccionPrincipal("seccionCierre");
  }
});

cargarExpositiva();
cargarDemostrativa();
cargarDialogo();
cargarCierre();
cargarEvaluaciones();
cargarTiempos();
actualizarBotonDescripcionGeneral();
restaurarNavegacionTecnicas();

/* TÉCNICA DEMOSTRATIVA */

function cargarObjetivoPsicomotrizDemostrativa() {
  const objetivos = getData("ec0217_objetivos") || {};

  if (demoObjetivo) {
    demoObjetivo.value = objetivos.psicomotriz || "";
  }
}

function recolectarDemostrativa() {
  return {
    objetivo: demoObjetivo ? demoObjetivo.value.trim() : "",
    experiencia: demoExperiencia ? demoExperiencia.value.trim() : "",
    actividad: demoActividad ? demoActividad.value.trim() : "",
    ejemplos: demoEjemplos ? demoEjemplos.value.trim() : "",
    preguntas: demoPreguntas ? demoPreguntas.value.trim() : ""
  };
}

function guardarDemostrativaTemporal() {
  const data = recolectarDemostrativa();
  localStorage.setItem("ec0217_demostrativa", JSON.stringify(data));
}

function cargarDemostrativa() {
  cargarObjetivoPsicomotrizDemostrativa();

  const guardado = localStorage.getItem("ec0217_demostrativa");
  if (!guardado) return;

  try {
    const data = JSON.parse(guardado);

    if (demoExperiencia) demoExperiencia.value = data.experiencia || "";
    if (demoActividad) demoActividad.value = data.actividad || "";
    if (demoEjemplos) demoEjemplos.value = data.ejemplos || "";
    if (demoPreguntas) demoPreguntas.value = data.preguntas || "";

    if (localStorage.getItem("ec0217_demostrativa_completo") === "true") {
      document.getElementById("nav-demostrativa")?.classList.add("completed");
      document.getElementById("nav-energizante")?.classList.remove("disabled");
    }

  } catch (err) {
    console.error("Error al cargar técnica demostrativa:", err);
  }
}

function validarDemostrativa() {
  if (errDemostrativa) errDemostrativa.style.display = "none";

  const data = recolectarDemostrativa();

  const completo =
    data.objetivo &&
    data.experiencia &&
    data.actividad &&
    data.ejemplos &&
    data.preguntas;

  if (!completo) {
    if (errDemostrativa) errDemostrativa.style.display = "block";
    return false;
  }

  return true;
}

function guardarDemostrativaFinal() {
  guardarDemostrativaTemporal();

  localStorage.setItem("ec0217_demostrativa_completo", "true");

  document.getElementById("nav-demostrativa")?.classList.add("completed");
  document.getElementById("nav-energizante")?.classList.remove("disabled");
}


[
  demoExperiencia,
  demoActividad,
  demoEjemplos,
  demoPreguntas
].forEach(campo => {
  if (campo) {
    campo.addEventListener("input", guardarDemostrativaTemporal);
  }
});

if (btnGuardarDemostrativa) {
  btnGuardarDemostrativa.addEventListener("click", () => {
    if (!validarDemostrativa()) return;

    guardarDemostrativaFinal();

    document.getElementById("nav-energizante")?.classList.remove("disabled");

    mostrarSeccionPrincipal("seccionEnergizante");
  });
}

document.getElementById("nav-demostrativa")?.addEventListener("click", () => {
  if (localStorage.getItem("ec0217_expositiva_completo") === "true") {
    mostrarSeccionPrincipal("seccionDemostrativa");
  }
});

document.getElementById("nav-evaluaciones")?.addEventListener("click", () => {
  if (localStorage.getItem("ec0217_cierre_completo") === "true") {
    mostrarSeccionPrincipal("seccionEvaluaciones");
  }
});

async function generarDemostrativaIA(campo, boton) {
  const datos = getData("ec0217_datos") || {};
  const objetivos = getData("ec0217_objetivos") || {};
  const temario = getData("ec0217_temario") || {};

  const camposMap = {
    experiencia: demoExperiencia,
    actividad: demoActividad,
    ejemplos: demoEjemplos,
    preguntas: demoPreguntas
  };

  const textareaDestino = camposMap[campo];

  if (!textareaDestino) return;

  try {
    boton.disabled = true;
    boton.textContent = "Generando...";

    const response = await fetchConTimeout(`${BACKEND_URL}/generate-demostrativa`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        campo,
        nombreCurso: datos.nombreCurso || "",
        perfil: datos.perfil || "",
        objetivoPsicomotriz: objetivos.psicomotriz || "",
        objetivoGeneral: objetivos.general || "",
        temario
      })
    });

    if (!response.ok) {
      let detalle = `HTTP ${response.status}`;

      try {
        const errJson = await response.json();
        const d = errJson.detail;
        detalle = d ? (typeof d === "object" ? JSON.stringify(d) : String(d)) : JSON.stringify(errJson);
      } catch (_) {}

      throw new Error(detalle);
    }

    const data = await response.json();

    const textoGenerado =
      data.texto ||
      data.resultado ||
      data.contenido ||
      data.respuesta ||
      "";

    if (!textoGenerado.trim()) {
      console.log("Respuesta recibida de demostrativa:", data);
      showAlert("La IA respondió, pero no llegó texto en el campo esperado. Revisa la consola.");
      return;
    }

    textareaDestino.value = textoGenerado;

    guardarDemostrativaTemporal();

  } catch (err) {
    console.error("Error al generar técnica demostrativa:", err);
    showAlert(`No se pudo generar el texto:\n\n${mensajeAmigable(err)}`);
  } finally {
    boton.disabled = false;
    boton.textContent = "Generar con IA";
  }
}


async function generarDialogoIA(campo, boton) {
  const datos = getData("ec0217_datos") || {};
  const objetivos = getData("ec0217_objetivos") || {};
  const temario = getData("ec0217_temario") || {};

  const camposMap = {
    actividad: dialogoActividad,
    instrucciones: dialogoInstrucciones,
    ejemplos: dialogoEjemplos,
    conclusion: dialogoConclusion
  };

  const textareaDestino = camposMap[campo];

  if (!textareaDestino) return;

  try {
    boton.disabled = true;
    boton.textContent = "Generando...";

    const response = await fetchConTimeout(`${BACKEND_URL}/generate-dialogo`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        campo,
        nombreCurso: datos.nombreCurso || "",
        perfil: datos.perfil || "",
        objetivoAfectivo: objetivos.afectiva || "",
        objetivoGeneral: objetivos.general || "",
        temario
      })
    });

    if (!response.ok) {
      let detalle = `HTTP ${response.status}`;

      try {
        const errJson = await response.json();
        const d = errJson.detail;
        detalle = d ? (typeof d === "object" ? JSON.stringify(d) : String(d)) : JSON.stringify(errJson);
      } catch (_) {}

      throw new Error(detalle);
    }

    const data = await response.json();

    textareaDestino.value = data.texto || "";

    guardarDialogoTemporal();

  } catch (err) {
    console.error("Error al generar técnica diálogo/discusión:", err);
    showAlert(`No se pudo generar el texto:\n\n${mensajeAmigable(err)}`);
  } finally {
    boton.disabled = false;
    boton.textContent = "Generar con IA";
  }
}



async function generarCierreIA() {
  const datos = getData("ec0217_datos") || {};
  const objetivos = getData("ec0217_objetivos") || {};
  const expositiva = getData("ec0217_expositiva") || {};
  const demostrativa = getData("ec0217_demostrativa") || {};
  const dialogo = getData("ec0217_dialogo") || {};

  const desarrolloExpositiva = expositiva.desarrollo || "";
  const actividadDemostrativa = demostrativa.actividad || "";
  const instruccionesDialogo = dialogo.instrucciones || "";

  if (!desarrolloExpositiva || !actividadDemostrativa || !instruccionesDialogo) {
    showAlert(
      "Para generar el cierre necesitas tener información en: inciso d) de técnica expositiva, inciso c) de técnica demostrativa e inciso d) de técnica diálogo/discusión.",
      { title: "Pasos requeridos" }
    );
    return;
  }

  try {
    if (loaderCierre) loaderCierre.style.display = "block";
    if (btnGenerarCierre) btnGenerarCierre.disabled = true;

    const response = await fetchConTimeout(`${BACKEND_URL}/generate-cierre`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nombreCurso: datos.nombreCurso || "",
        objetivoGeneral: objetivos.general || "",
        objetivoCognitivo: objetivos.cognitiva || "",
        objetivoPsicomotriz: objetivos.psicomotriz || "",
        objetivoAfectivo: objetivos.afectiva || "",
        desarrolloExpositiva,
        actividadDemostrativa,
        instruccionesDialogo
      })
    });

    if (!response.ok) {
      let detalle = `HTTP ${response.status}`;

      try {
        const errJson = await response.json();
        const d = errJson.detail;
        detalle = d ? (typeof d === "object" ? JSON.stringify(d) : String(d)) : JSON.stringify(errJson);
      } catch (_) {}

      throw new Error(detalle);
    }

    const data = await response.json();

    if (detalleIntegracionNombre) {
  detalleIntegracionNombre.addEventListener("input", guardarTecnicasTemporal);
}
if (detalleEnergizanteNombre) {
  detalleEnergizanteNombre.addEventListener("input", guardarTecnicasTemporal);
}

if (cierreTexto) {
      cierreTexto.value = data.texto || "";
    }

    guardarCierreTemporal();

    // ── Generar el resumen automáticamente con los datos disponibles ──────────
    // El resumen se guarda en ec0217_cierre_resumen y se incluye en cierre.resumen
    // para que generar_planeacion.js lo use en la fila "Resumen general del curso".
    try {
      const expositiva   = getData("ec0217_expositiva")   || {};
      const demostrativa = getData("ec0217_demostrativa") || {};
      const dialogo      = getData("ec0217_dialogo")      || {};
      const cierre_data  = getData("ec0217_cierre")       || {};
      const objetivos_d  = getData("ec0217_objetivos")    || {};
      const datos_d      = getData("ec0217_datos")        || {};

      const resumenResp = await fetchConTimeout(`${BACKEND_URL}/generate-resumen`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombreCurso:               datos_d.nombreCurso          || "",
          objetivoGeneral:           objetivos_d.general          || "",
          objetivoCognitivo:         objetivos_d.cognitiva        || "",
          objetivoPsicomotriz:       objetivos_d.psicomotriz      || "",
          objetivoAfectivo:          objetivos_d.afectiva         || "",
          desarrolloExpositiva:      expositiva.desarrollo        || "",
          actividadDemostrativa:     demostrativa.actividad       || "",
          instruccionesDialogo:      dialogo.instrucciones        || "",
          sugerenciasContinuidad:    sugerenciasContinuidad    ? sugerenciasContinuidad.value.trim()    : "",
          referenciasBibliograficas: referenciasBibliograficas ? referenciasBibliograficas.value.trim() : "",
          compromisos:               compromisosTexto          ? compromisosTexto.value.trim()          : ""
        })
      });

      if (resumenResp.ok) {
        const resumenData = await resumenResp.json();
        const textoResumen = resumenData.texto || resumenData.resumen || "";
        if (textoResumen) {
          if (cierreResumen) cierreResumen.value = textoResumen;
          localStorage.setItem("ec0217_cierre_resumen", textoResumen);
          guardarCierreTemporal();
        }
      }
    } catch (errResumen) {
      console.warn("No se pudo generar el resumen automático:", errResumen);
      // No es crítico: continúa sin el resumen
    }

  } catch (err) {
    console.error("Error al generar cierre:", err);
    showAlert(`No se pudo generar el cierre:\n\n${mensajeAmigable(err)}`);
  } finally {
    if (loaderCierre) loaderCierre.style.display = "none";
    if (btnGenerarCierre) btnGenerarCierre.disabled = false;
  }
}


async function generarDescripcionGeneralIA() {
  const cierre = getData("ec0217_cierre") || {};
  const textoCierre = cierre.texto || "";

  if (!textoCierre.trim()) {
    showAlert("Primero escribe o genera el texto de cierre.");
    actualizarBotonDescripcionGeneral();
    return;
  }

  try {
    if (loaderDescripcionGeneral) loaderDescripcionGeneral.style.display = "block";
    if (btnGenerarDescripcionGeneral) btnGenerarDescripcionGeneral.disabled = true;

    const response = await fetchConTimeout(`${BACKEND_URL}/generate-descripcion-general`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        cierre: textoCierre
      })
    });

    if (!response.ok) {
      let detalle = `HTTP ${response.status}`;

      try {
        const errJson = await response.json();
        const d = errJson.detail;
        detalle = d ? (typeof d === "object" ? JSON.stringify(d) : String(d)) : JSON.stringify(errJson);
      } catch (_) {}

      throw new Error(detalle);
    }

    const data = await response.json();

    if (descripcionGeneralEvaluacion) {
      descripcionGeneralEvaluacion.value = data.texto || "";
    }

    guardarEvaluacionesTemporal();

  } catch (err) {
    console.error("Error al generar descripción general:", err);
    showAlert(`No se pudo generar la descripción general:\n\n${mensajeAmigable(err)}`);
  } finally {
    if (loaderDescripcionGeneral) loaderDescripcionGeneral.style.display = "none";
    actualizarBotonDescripcionGeneral();
  }
}


async function generarEvaluacionIA(tipo) {
  const objetivos = getData("ec0217_objetivos") || {};
  const datos = getData("ec0217_datos") || {};

  const esDiagnostica = tipo === "diagnostica";
  const boton = esDiagnostica ? btnGenerarDiagnostica : btnGenerarSumativa;
  const loader = esDiagnostica ? loaderDiagnostica : loaderSumativa;
  const destino = esDiagnostica ? instDiagnostica : instSumativa;

  try {
    if (loader) loader.style.display = "block";
    if (boton) boton.disabled = true;

    const response = await fetchConTimeout(`${BACKEND_URL}/generate-evaluacion-${tipo}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        nombreCurso: datos.nombreCurso || "",
        objetivoGeneral: objetivos.general || "",
        objetivoCognitivo: objetivos.cognitiva || "",
        objetivoPsicomotriz: objetivos.psicomotriz || "",
        objetivoAfectivo: objetivos.afectiva || ""
      })
    });

    if (!response.ok) {
      let detalle = `HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        detalle = errJson.detail || JSON.stringify(errJson);
      } catch (_) {}
      throw new Error(detalle);
    }

    const data = await response.json();

    if (destino) {
      const resultado = data.preguntas || data.texto || data;

      if (Array.isArray(resultado)) {
        destino.value = resultado.map((p, i) => {
          return `${i + 1}. ${p.pregunta || ""}
      A) ${p.opciones?.A || ""}
      B) ${p.opciones?.B || ""}
      C) ${p.opciones?.C || ""}
      D) ${p.opciones?.D || ""}
      Respuesta correcta: ${p.respuesta_correcta || p.respuesta || ""}
      Dificultad: ${p.dificultad || p.nivel || p.nivel_dificultad || ""}`;
        }).join("\n\n");
      } else {
        destino.value = resultado || "";
      }
    }

    guardarEvaluacionesTemporal();

  } catch (err) {
    showAlert(`No se pudo generar la evaluación:\n\n${mensajeAmigable(err)}`);
  } finally {
    if (loader) loader.style.display = "none";
    if (boton) boton.disabled = false;
  }
}


if (btnGenerarDiagnostica) {
  btnGenerarDiagnostica.addEventListener("click", () => {
    generarEvaluacionIA("diagnostica");
  });
}

if (btnGenerarSumativa) {
  btnGenerarSumativa.addEventListener("click", () => {
    generarEvaluacionIA("sumativa");
  });
}




// ─── Generar RESUMEN con IA ───────────────────────────────────────────────────
async function generarResumenIA() {
  const expositiva   = getData("ec0217_expositiva")   || {};
  const demostrativa = getData("ec0217_demostrativa") || {};
  const dialogo      = getData("ec0217_dialogo")      || {};
  const objetivos    = getData("ec0217_objetivos")    || {};
  const datos        = getData("ec0217_datos")        || {};

  try {
    if (loaderResumen) loaderResumen.style.display = "block";
    if (btnGenerarResumen) btnGenerarResumen.disabled = true;

    const response = await fetchConTimeout(`${BACKEND_URL}/generate-resumen`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombreCurso:               datos.nombreCurso          || "",
        objetivoGeneral:           objetivos.general          || "",
        objetivoCognitivo:         objetivos.cognitiva        || "",
        objetivoPsicomotriz:       objetivos.psicomotriz      || "",
        objetivoAfectivo:          objetivos.afectiva         || "",
        desarrolloExpositiva:      expositiva.desarrollo      || "",
        actividadDemostrativa:     demostrativa.actividad     || "",
        instruccionesDialogo:      dialogo.instrucciones      || "",
        sugerenciasContinuidad:    sugerenciasContinuidad    ? sugerenciasContinuidad.value.trim()    : "",
        referenciasBibliograficas: referenciasBibliograficas ? referenciasBibliograficas.value.trim() : "",
        compromisos:               compromisosTexto          ? compromisosTexto.value.trim()          : ""
      })
    });

    if (!response.ok) {
      let detalle = `HTTP ${response.status}`;
      try { const e = await response.json(); detalle = e.detail || JSON.stringify(e); } catch (_) {}
      throw new Error(detalle);
    }

    const data = await response.json();
    const texto = data.texto || data.resumen || "";

    if (texto) {
      if (cierreResumen) cierreResumen.value = texto;
      localStorage.setItem("ec0217_cierre_resumen", texto);
      guardarCierreTemporal();
    }
  } catch (err) {
    showAlert(`⚠️ No se pudo generar el resumen:\n\n${mensajeAmigable(err)}`);
    console.error("Error generando resumen:", err);
  } finally {
    if (loaderResumen) loaderResumen.style.display = "none";
    if (btnGenerarResumen) btnGenerarResumen.disabled = false;
  }
}

if (btnGenerarResumen) {
  btnGenerarResumen.addEventListener("click", generarResumenIA);
}
if (cierreResumen) {
  cierreResumen.addEventListener("input", guardarCierreTemporal);
}


// ─── Generar COMPROMISOS con IA ──────────────────────────────────────────────
async function generarCompromisosIA() {
  const objetivos = getData("ec0217_objetivos") || {};
  const datos     = getData("ec0217_datos")     || {};

  try {
    if (loaderCompromisos) loaderCompromisos.style.display = "block";
    if (btnGenerarCompromisos) btnGenerarCompromisos.disabled = true;

    const response = await fetchConTimeout(`${BACKEND_URL}/generate-compromisos`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        nombreCurso:         datos.nombreCurso      || "",
        objetivoGeneral:     objetivos.general      || "",
        objetivoCognitivo:   objetivos.cognitiva    || "",
        objetivoPsicomotriz: objetivos.psicomotriz  || "",
        objetivoAfectivo:    objetivos.afectiva     || ""
      })
    });

    if (!response.ok) {
      let detalle = `HTTP ${response.status}`;
      try { const e = await response.json(); detalle = e.detail || JSON.stringify(e); } catch (_) {}
      throw new Error(detalle);
    }

    const data = await response.json();
    const texto = data.texto || data.compromisos || "";

    if (texto && compromisosTexto) {
      compromisosTexto.value = texto;
      guardarCierreTemporal();
    }
  } catch (err) {
    showAlert(`⚠️ No se pudieron generar los compromisos:\n\n${mensajeAmigable(err)}`);
    console.error("Error generando compromisos:", err);
  } finally {
    if (loaderCompromisos) loaderCompromisos.style.display = "none";
    if (btnGenerarCompromisos) btnGenerarCompromisos.disabled = false;
  }
}

if (btnGenerarCompromisos) {
  btnGenerarCompromisos.addEventListener("click", generarCompromisosIA);
}
if (compromisosTexto) {
  compromisosTexto.addEventListener("input", guardarCierreTemporal);
}
if (sugerenciasContinuidad) {
  sugerenciasContinuidad.addEventListener("input", guardarCierreTemporal);
}
if (referenciasBibliograficas) {
  referenciasBibliograficas.addEventListener("input", guardarCierreTemporal);
}


if (btnGenerarCierre) {
  btnGenerarCierre.addEventListener("click", generarCierreIA);
}

if (cierreTexto) {
  cierreTexto.addEventListener("input", () => {
    guardarCierreTemporal();
    actualizarBotonDescripcionGeneral();
  });
}

if (btnGuardarCierre) {
  btnGuardarCierre.addEventListener("click", () => {
    if (!validarCierre()) return;

    guardarCierreFinal();

    mostrarSeccionPrincipal("seccionEvaluaciones");
  });
}

if (btnGenerarDescripcionGeneral) {
  btnGenerarDescripcionGeneral.addEventListener("click", generarDescripcionGeneralIA);
}

if (descripcionGeneralEvaluacion) {
  descripcionGeneralEvaluacion.addEventListener("input", guardarEvaluacionesTemporal);
}


document.querySelectorAll(".btn-ia-dialogo").forEach(btn => {
  btn.addEventListener("click", () => {
    const campo = btn.dataset.campo;
    generarDialogoIA(campo, btn);
  });
});



// Listener de demostrativa consolidado arriba junto al de expositiva (misma clase CSS)


function cargarObjetivoAfectivoDialogo() {
  const objetivos = getData("ec0217_objetivos") || {};

  if (dialogoObjetivo) {
    dialogoObjetivo.value = objetivos.afectiva || "";
  }
}

function recolectarDialogo() {
  return {
    objetivo: dialogoObjetivo ? dialogoObjetivo.value.trim() : "",
    actividad: dialogoActividad ? dialogoActividad.value.trim() : "",
    instrucciones: dialogoInstrucciones ? dialogoInstrucciones.value.trim() : "",
    ejemplos: dialogoEjemplos ? dialogoEjemplos.value.trim() : "",
    conclusion: dialogoConclusion ? dialogoConclusion.value.trim() : ""
  };
}

function guardarDialogoTemporal() {
  const data = recolectarDialogo();
  localStorage.setItem("ec0217_dialogo", JSON.stringify(data));
}

function cargarDialogo() {
  cargarObjetivoAfectivoDialogo();

  const guardado = localStorage.getItem("ec0217_dialogo");
  if (!guardado) return;

  try {
    const data = JSON.parse(guardado);

    if (dialogoActividad) dialogoActividad.value = data.actividad || "";
    if (dialogoInstrucciones) dialogoInstrucciones.value = data.instrucciones || "";
    if (dialogoEjemplos) dialogoEjemplos.value = data.ejemplos || "";
    if (dialogoConclusion) dialogoConclusion.value = data.conclusion || "";

    if (localStorage.getItem("ec0217_dialogo_completo") === "true") {
      document.getElementById("nav-dialogo")?.classList.add("completed");
      document.getElementById("nav-cierre")?.classList.remove("disabled");
    }

  } catch (err) {
    console.error("Error al cargar técnica diálogo/discusión:", err);
  }
}

function validarDialogo() {
  if (errDialogo) errDialogo.style.display = "none";

  const data = recolectarDialogo();

  const completo =
    data.objetivo &&
    data.actividad &&
    data.instrucciones &&
    data.ejemplos &&
    data.conclusion;

  if (!completo) {
    if (errDialogo) errDialogo.style.display = "block";
    return false;
  }

  return true;
}

function guardarDialogoFinal() {
  guardarDialogoTemporal();

  localStorage.setItem("ec0217_dialogo_completo", "true");

  document.getElementById("nav-dialogo")?.classList.add("completed");
  document.getElementById("nav-cierre")?.classList.remove("disabled");
}



[
  dialogoActividad,
  dialogoInstrucciones,
  dialogoEjemplos,
  dialogoConclusion
].forEach(campo => {
  if (campo) {
    campo.addEventListener("input", guardarDialogoTemporal);
  }
});

if (btnGuardarDialogo) {
  btnGuardarDialogo.addEventListener("click", () => {
    if (!validarDialogo()) return;

    guardarDialogoFinal();

    mostrarSeccionPrincipal("seccionCierre");
  });
}

document.getElementById("nav-dialogo")?.addEventListener("click", () => {
  if (localStorage.getItem("ec0217_energizante_completo") === "true") {
    mostrarSeccionPrincipal("seccionDialogo");
  }
});

/*cierre */


function recolectarCierre() {
  const resumenVal = cierreResumen
    ? cierreResumen.value.trim()
    : (localStorage.getItem("ec0217_cierre_resumen") || "");
  return {
    texto:             cierreTexto             ? cierreTexto.value.trim()             : "",
    resumen:           resumenVal,
    sugerencias:       sugerenciasContinuidad  ? sugerenciasContinuidad.value.trim()  : "",
    referencias:       referenciasBibliograficas ? referenciasBibliograficas.value.trim() : "",
    compromisos:       compromisosTexto        ? compromisosTexto.value.trim()        : "",
    descripcionGeneral: descripcionGeneralEvaluacion ? descripcionGeneralEvaluacion.value.trim() : ""
  };
}

function guardarCierreTemporal() {
  const data = recolectarCierre();
  localStorage.setItem("ec0217_cierre", JSON.stringify(data));
}

function cargarCierre() {
  const guardado = localStorage.getItem("ec0217_cierre");

  if (guardado) {
    try {
      const data = JSON.parse(guardado);

      if (cierreTexto && data.texto)
        cierreTexto.value = data.texto;
      if (descripcionGeneralEvaluacion && data.descripcionGeneral)
        descripcionGeneralEvaluacion.value = data.descripcionGeneral;

      // Restaurar resumen
      const resumenGuardado = data.resumen || localStorage.getItem("ec0217_cierre_resumen") || "";
      if (resumenGuardado) {
        localStorage.setItem("ec0217_cierre_resumen", resumenGuardado);
        if (cierreResumen) cierreResumen.value = resumenGuardado;
      }

      // Restaurar campos adicionales del cierre
      if (sugerenciasContinuidad && data.sugerencias)
        sugerenciasContinuidad.value = data.sugerencias;
      if (referenciasBibliograficas && data.referencias)
        referenciasBibliograficas.value = data.referencias;
      if (compromisosTexto && data.compromisos)
        compromisosTexto.value = data.compromisos;
    } catch (err) {
      console.error("Error al cargar cierre:", err);
    }
  }

  if (localStorage.getItem("ec0217_cierre_completo") === "true") {
    document.getElementById("nav-cierre")?.classList.add("completed");
    document.getElementById("nav-evaluaciones")?.classList.remove("disabled");
  }
}

function validarCierre() {
  if (errCierre) errCierre.style.display = "none";

  const data = recolectarCierre();

  if (!data.texto) {
    if (errCierre) errCierre.style.display = "block";
    return false;
  }

  return true;
}

function guardarCierreFinal() {
  guardarCierreTemporal();

  localStorage.setItem("ec0217_cierre_completo", "true");

  document.getElementById("nav-cierre")?.classList.add("completed");
  document.getElementById("nav-evaluaciones")?.classList.remove("disabled");
}


function recolectarEvaluaciones() {
  return {
    pctDiagnostica: 0,
    pctFormativa: pctFormativa ? parseInt(pctFormativa.value || "50", 10) : 50,
    pctSumativa: pctSumativa ? parseInt(pctSumativa.value || "50", 10) : 50,

    instDiagnostica: instDiagnostica ? instDiagnostica.value.trim() : "",
    instFormativa: instFormativa ? instFormativa.value.trim() : "",
    instSumativa: instSumativa ? instSumativa.value.trim() : "",
    instReac: instReac ? instReac.value.trim() : "",

    tipoInstrumentoFormativa: tipoInstrumentoFormativa || "",

    descripcionGeneral: descripcionGeneralEvaluacion
      ? descripcionGeneralEvaluacion.value.trim()
      : ""
  };
}

function guardarEvaluacionesTemporal() {
  const data = recolectarEvaluaciones();
  localStorage.setItem("ec0217_evaluaciones", JSON.stringify(data));
}

function cargarEvaluaciones() {
  const guardado = localStorage.getItem("ec0217_evaluaciones");
  if (!guardado) {
    actualizarPorcentajesEvaluacion(50);
    return;
  }

  try {
    const data = JSON.parse(guardado);

    tipoInstrumentoFormativa = data.tipoInstrumentoFormativa || "";

    if (pctDiagnostica) pctDiagnostica.value = 0;

    const formativa = data.pctFormativa !== undefined
      ? parseInt(data.pctFormativa, 10)
      : 50;

    const sumativa = 100 - formativa;

    if (pctFormativa) pctFormativa.value = formativa;
    if (pctSumativa) pctSumativa.value = sumativa;

    if (sliderEvaluaciones) sliderEvaluaciones.value = formativa;
    if (pctFormativaValor) pctFormativaValor.textContent = `${formativa}%`;
    if (pctSumativaValor) pctSumativaValor.textContent = `${sumativa}%`;

    if (instDiagnostica) instDiagnostica.value = data.instDiagnostica || "";
    if (instFormativa) instFormativa.value = data.instFormativa || "";
    if (instSumativa) instSumativa.value = data.instSumativa || "";
    if (instReac) instReac.value = data.instReac || "";
    if (descripcionGeneralEvaluacion) {
      descripcionGeneralEvaluacion.value = data.descripcionGeneral || "";
    }

    if (localStorage.getItem("ec0217_evaluaciones_completo") === "true") {
      document.getElementById("nav-evaluaciones")?.classList.add("completed");
      document.getElementById("nav-tiempos")?.classList.remove("disabled");
    }

  } catch (err) {
    console.error("Error al cargar evaluaciones:", err);
    actualizarPorcentajesEvaluacion(50);
  }
}

if (sliderEvaluaciones) {
  sliderEvaluaciones.addEventListener("input", () => {
    actualizarPorcentajesEvaluacion(sliderEvaluaciones.value);
  });
}


function actualizarBotonDescripcionGeneral() {
  const cierre = getData("ec0217_cierre") || {};
  const tieneCierre = cierre.texto && cierre.texto.trim().length > 0;

  if (btnGenerarDescripcionGeneral) {
    btnGenerarDescripcionGeneral.disabled = !tieneCierre;
  }
}

function validarEvaluaciones() {
  if (!pctFormativa || !pctSumativa) return false;

  const formativa = parseInt(pctFormativa.value || "0", 10);
  const sumativa = parseInt(pctSumativa.value || "0", 10);

  const validoPorcentajes = formativa + sumativa === 100;

  const validoInstrumentos =
    instDiagnostica.value.trim() &&
    instFormativa.value.trim() &&
    instSumativa.value.trim();

  if (!validoPorcentajes || !validoInstrumentos) {
    errEvaluaciones.style.display = "block";
    return false;
  }

  errEvaluaciones.style.display = "none";
  return true;
}

function guardarEvaluacionesFinal() {
  guardarEvaluacionesTemporal();

  localStorage.setItem("ec0217_evaluaciones_completo", "true");

  document.getElementById("nav-evaluaciones")?.classList.add("completed");
  document.getElementById("nav-tiempos")?.classList.remove("disabled");
  mostrarSeccionPrincipal("seccionTiempos");
}



[
  pctDiagnostica,
  pctFormativa,
  pctSumativa,
  instDiagnostica,
  instFormativa,
  instSumativa,
  instReac,
].forEach(campo => {
  if (campo) {
    campo.addEventListener("input", guardarEvaluacionesTemporal);
  }
});

if (btnGuardarEvaluaciones) {
  btnGuardarEvaluaciones.addEventListener("click", () => {
    if (!validarEvaluaciones()) return;

    guardarEvaluacionesFinal();

    mostrarSeccionPrincipal("seccionTiempos");
  });
}


function actualizarPorcentajesEvaluacion(valorFormativa) {
  const formativa = parseInt(valorFormativa, 10);
  const sumativa = 100 - formativa;

  if (pctDiagnostica) pctDiagnostica.value = 0;
  if (pctFormativa) pctFormativa.value = formativa;
  if (pctSumativa) pctSumativa.value = sumativa;

  if (pctFormativaValor) pctFormativaValor.textContent = `${formativa}%`;
  if (pctSumativaValor) pctSumativaValor.textContent = `${sumativa}%`;

  guardarEvaluacionesTemporal();
}

function renderTiempos() {
  if (!tablaTiempos) return;

  tablaTiempos.innerHTML = "";
  tablaTiempos.className = "tiempos-wrapper";

  tiemposCurso.forEach((bloque, bloqueIndex) => {
    const subtotal = bloque.filas.reduce((acc, fila) => {
      return acc + Number(fila.tiempo || 0);
    }, 0);

    const div = document.createElement("div");
    div.className = "tiempo-bloque";

    const subtotalColor = subtotal === 0 ? "#999" : "#1F3B6D";
    div.innerHTML = `
      <div class="tiempo-bloque-header">
        <h3>${bloque.seccion}</h3>
        <span class="tiempo-subtotal" style="color:${subtotalColor}">${subtotal} min</span>
      </div>

      <table class="tabla-tiempos">
        <thead>
          <tr>
            <th>Actividad</th>
            <th class="col-tiempo">Tiempo</th>
          </tr>
        </thead>
        <tbody>
          ${bloque.filas.map((fila, filaIndex) => `
            <tr>
              <td>${fila.titulo}</td>
              <td class="col-tiempo">
                <div class="input-tiempo-wrapper">
                  <input
                    type="number"
                    min="0"
                    value="${fila.tiempo}"
                    data-bloque="${bloqueIndex}"
                    data-fila="${filaIndex}"
                    class="input-tiempo"
                  >
                  <span class="min-label">min</span>
                </div>
              </td>
            </tr>
          `).join("")}
        </tbody>
      </table>
    `;

    tablaTiempos.appendChild(div);
  });

  document.querySelectorAll(".input-tiempo").forEach(input => {
    input.addEventListener("input", () => {
      const bloqueIndex = Number(input.dataset.bloque);
      const filaIndex = Number(input.dataset.fila);

      tiemposCurso[bloqueIndex].filas[filaIndex].tiempo = Number(input.value || 0);

      guardarTiemposTemporal();
      actualizarTotalTiempos();
      actualizarSubtotalesTiempos();
    });
  });

  actualizarTotalTiempos();
}


function actualizarSubtotalesTiempos() {
  document.querySelectorAll(".tiempo-bloque").forEach((bloqueDiv, bloqueIndex) => {
    const subtotal = tiemposCurso[bloqueIndex].filas.reduce((acc, fila) => {
      return acc + Number(fila.tiempo || 0);
    }, 0);

    const subtotalSpan = bloqueDiv.querySelector(".tiempo-subtotal");

    if (subtotalSpan) {
      subtotalSpan.textContent = `${subtotal} minutos`;
    }
  });
}


function actualizarTotalTiempos() {
  const total = tiemposCurso.reduce((acc, bloque) => {
    return acc + bloque.filas.reduce((suma, fila) => {
      return suma + Number(fila.tiempo || 0);
    }, 0);
  }, 0);

  if (totalTiempos) totalTiempos.textContent = total;

  const totalCard = document.getElementById("totalTiemposCard");

  if (totalCard) {
    totalCard.classList.remove("total-correcto", "total-error");

    if (total === 120) {
      totalCard.classList.add("total-correcto");
    } else {
      totalCard.classList.add("total-error");
    }
  }

  if (errTiempos) {
    if (total === 120) {
      errTiempos.style.display = "none";
    } else {
      const diff = total - 120;
      errTiempos.textContent = diff > 0
        ? `El total es ${total} min — necesitas reducir ${diff} minuto${diff !== 1 ? "s" : ""} en alguna actividad.`
        : `El total es ${total} min — necesitas agregar ${Math.abs(diff)} minuto${Math.abs(diff) !== 1 ? "s" : ""} en alguna actividad.`;
      errTiempos.style.display = "block";
    }
  }

  if (btnGuardarTiempos) {
    btnGuardarTiempos.disabled = total !== 120;
  }

  return total;
}

function guardarTiemposTemporal() {
  localStorage.setItem("ec0217_tiempos", JSON.stringify(tiemposCurso));
}

function cargarTiempos() {
  const guardado = localStorage.getItem("ec0217_tiempos");

  if (guardado) {
    try {
      const data = JSON.parse(guardado);
      // Solo reemplazar si el array tiene contenido; si está vacío usar la estructura por defecto
      if (Array.isArray(data) && data.length > 0) tiemposCurso = data;
    } catch (err) {
      console.error("Error al cargar tiempos:", err);
    }
  }

  renderTiempos();

  if (localStorage.getItem("ec0217_tiempos_completo") === "true") {
    document.getElementById("nav-tiempos")?.classList.add("completed");
    document.getElementById("nav-materiales")?.classList.remove("disabled");
  }
}


if (btnGuardarTiempos) {
  btnGuardarTiempos.addEventListener("click", () => {
    const total = actualizarTotalTiempos();

    if (total !== 120) {
      showAlert("La suma total debe ser exactamente 120 minutos.");
      return;
    }

    guardarTiemposTemporal();

    localStorage.setItem("ec0217_tiempos_completo", "true");

    document.getElementById("nav-tiempos")?.classList.add("completed");
    document.getElementById("nav-materiales")?.classList.remove("disabled");

    mostrarSeccionPrincipal("seccionMateriales");
  });
}



// ─── W#9: Poblar pantalla resumen al entrar a seccionFormatos ─────────────────
function poblarResumenExpediente() {
  const datos        = getData("ec0217_datos")        || {};
  const evaluaciones = getData("ec0217_evaluaciones") || {};
  const temario      = getData("ec0217_temario")      || {};
  const tiempos      = getData("ec0217_tiempos")      || [];

  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val ?? "—"; };

  set("res-nombre",        datos.nombreCurso   || "Sin nombre");
  set("res-instructor",    datos.instructor    || "—");
  set("res-duracion",      datos.duracion      || "—");
  set("res-participantes", datos.participantes || "—");

  const pctDiag = evaluaciones.pctDiagnostica ?? evaluaciones.pctDiag ?? 0;
  const pctForm = evaluaciones.pctFormativa   ?? evaluaciones.pctForm ?? 0;
  const pctSuma = evaluaciones.pctSumativa    ?? evaluaciones.pctSuma ?? 0;
  const total   = pctDiag + pctForm + pctSuma;
  set("res-pct-diag",  pctDiag);
  set("res-pct-form",  pctForm);
  set("res-pct-suma",  pctSuma);
  set("res-pct-total", total);
  const totalWrap = document.getElementById("res-pct-total-wrap");
  if (totalWrap) totalWrap.style.color = total === 100 ? "#16a34a" : "#dc2626";

  set("res-u1", temario.u1?.length ?? 0);
  set("res-u2", temario.u2?.length ?? 0);
  set("res-u3", temario.u3?.length ?? 0);

  const totalTiempos = tiempos.reduce((acc, b) =>
    acc + (b.filas || []).reduce((s, f) => s + (parseInt(f.tiempo, 10) || 0), 0), 0);
  const duracion = parseInt(datos.duracion, 10) || 0;
  set("res-tiempos-total",    totalTiempos);
  set("res-tiempos-duracion", duracion);
  const diffWrap = document.getElementById("res-tiempos-diff-wrap");
  if (diffWrap && duracion > 0) {
    const diff = totalTiempos - duracion;
    diffWrap.textContent = diff === 0 ? "✅ Cuadra exactamente" : (diff > 0 ? `+${diff} min de más` : `${diff} min faltantes`);
    diffWrap.style.color = diff === 0 ? "#16a34a" : "#dc2626";
  }

  const errores = validarExpedienteCompleto();
  const alertasEl    = document.getElementById("res-alertas");
  const alertasLista = document.getElementById("res-alertas-lista");
  if (alertasEl && alertasLista) {
    if (errores.length > 0) {
      alertasLista.innerHTML = errores.map(e => `<li>${e}</li>`).join("");
      alertasEl.style.display = "block";
    } else {
      alertasEl.style.display = "none";
    }
  }
}

function validarExpedienteCompleto() {
  const errores = [];

  const ev = getData("ec0217_evaluaciones") || {};
  const pctDiag = ev.pctDiagnostica ?? ev.pctDiag ?? 0;
  const pctForm = ev.pctFormativa    ?? ev.pctForm ?? 0;
  const pctSuma = ev.pctSumativa     ?? ev.pctSuma ?? 0;
  const totalPct = pctDiag + pctForm + pctSuma;
  if (totalPct !== 100) {
    errores.push(`Los porcentajes de evaluación suman ${totalPct}% (deben sumar 100%) — Paso 14.`);
  }

  const datos = getData("ec0217_datos") || {};
  const duracionCurso = parseInt(datos.duracion, 10) || 0;
  const tiempos = getData("ec0217_tiempos") || [];
  const totalTiempoMinutos = tiempos.reduce((acc, bloque) => {
    return acc + (bloque.filas || []).reduce((s, f) => s + (parseInt(f.tiempo, 10) || 0), 0);
  }, 0);
  if (duracionCurso > 0 && totalTiempoMinutos !== duracionCurso) {
    errores.push(`La distribución de tiempos suma ${totalTiempoMinutos} min pero la duración del curso es ${duracionCurso} min — Paso 15.`);
  }

  const temario = getData("ec0217_temario") || {};
  const totalTemas = (temario.u1?.length || 0) + (temario.u2?.length || 0) + (temario.u3?.length || 0);
  if (totalTemas === 0) {
    errores.push("El temario no tiene ningún tema registrado — Paso 4.");
  }

  return errores;
}

async function descargarPlaneacionFinal() {
  const payload = recolectarPayload();

  const erroresValidacion = validarExpedienteCompleto();
  if (erroresValidacion.length > 0) {
    const lista = erroresValidacion.map(e => `• ${e}`).join("\n");
    const continuar = await showConfirm(
      `Se encontraron inconsistencias en el expediente:\n\n${lista}\n\nPuedes corregirlas o descargar de todas formas (los documentos se generarán con los datos actuales).`,
      { title: "Revisar antes de descargar", icon: "⚠️", confirmText: "Descargar de todas formas", cancelText: "Ir a corregir" }
    );
    if (!continuar) return;
  }

  try {
    if (loaderFormatos) loaderFormatos.style.display = "block";

    if (mensajeFormatos) {
      mensajeFormatos.style.display = "none";
      mensajeFormatos.textContent = "";
    }

    if (btnDescargarPlaneacionFinal) {
      btnDescargarPlaneacionFinal.disabled = true;
      btnDescargarPlaneacionFinal.textContent = "Generando...";
    }

    const response = await fetchConTimeout(`${BACKEND_URL}/generate-doc/planeacion`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      let detalle = `HTTP ${response.status}`;

      try {
        const errJson = await response.json();
        const d = errJson.detail;
        detalle = d ? (typeof d === "object" ? JSON.stringify(d) : String(d)) : JSON.stringify(errJson);
      } catch (_) {}

      throw new Error(detalle);
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);

    const nombreCurso = payload.datos?.nombreCurso || "EC0217";

    const a = document.createElement("a");
    a.href = url;
    a.download = `Planeacion_${nombreCurso.replace(/\s+/g, "_")}.zip`;

    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);

    if (typeof logEvento === 'function')
      logEvento('wizard.descarga.ok', { nombre_curso: payload.datos?.nombreCurso || '' });

    if (mensajeFormatos) {
      mensajeFormatos.style.display = "block";
      mensajeFormatos.style.color = "green";
      mensajeFormatos.textContent = "✅ Descarga iniciada correctamente.";
    }

  } catch (err) {
    if (typeof logEvento === 'function')
      logEvento('wizard.descarga.error', { error: String(err?.message || err) });
    console.error("Error al generar formatos:", err);

    if (mensajeFormatos) {
      mensajeFormatos.style.display = "block";
      mensajeFormatos.style.color = "red";
      mensajeFormatos.textContent = `⚠️ Error al generar formatos: ${mensajeError(err)}`;
    }

  } finally {
    if (loaderFormatos) loaderFormatos.style.display = "none";

    if (btnDescargarPlaneacionFinal) {
      btnDescargarPlaneacionFinal.disabled = false;
      btnDescargarPlaneacionFinal.textContent = "Descargar paquete hasta ahora";
    }
  }
}


if (btnDescargarPlaneacionFinal) {
  btnDescargarPlaneacionFinal.addEventListener("click", descargarPlaneacionFinal);
}


// ─── UTILIDADES ───────────────────────────────────────────────────────────────

function resetChecks() {
  criteria.forEach(c => {
    document.getElementById(`chk-${c}`).textContent = `❌ ${capitalize(c)}`;
  });
}

function capitalize(text) {
  return text.charAt(0).toUpperCase() + text.slice(1);
}

// ─── SECCIÓN MATERIALES ───────────────────────────────────────────────────────

// Helper: convierte cualquier error a string legible
function mensajeError(err) {
  if (!err) return "Error desconocido";
  if (typeof err === "string") return err;
  if (err instanceof Error) return err.message || err.toString();
  if (typeof err === "object") return JSON.stringify(err);
  return String(err);
}


async function generarMaterialesIA(tecnica) {
  const loader = document.getElementById(`loaderMat-${tecnica}`);
  const textareaEl = document.getElementById(`mat-${tecnica}`);

  if (!loader || !textareaEl) return;

  // Botón individual (opcional — puede no existir si se usa el botón global)
  const btn = document.querySelector(`.btn-generar-materiales[data-tecnica="${tecnica}"]`);

  const datos = getData("ec0217_datos") || {};
  const objetivos = getData("ec0217_objetivos") || {};
  const temario = getData("ec0217_temario") || {};
  const tecnicas = getData("ec0217_tecnicas") || {};
  const expositiva = getData("ec0217_expositiva") || {};
  const demostrativa = getData("ec0217_demostrativa") || {};
  const dialogo = getData("ec0217_dialogo") || {};

  if (btn) { btn.disabled = true; btn.textContent = "Generando…"; }
  loader.style.display = "block";

  try {
    const response = await fetchConTimeout(`${BACKEND_URL}/generate-materiales`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tecnica,
        nombreCurso: datos.nombreCurso || "",
        perfil: datos.perfil || "",
        objetivoGeneral: objetivos.general || "",
        objetivos,
        temario,
        tecnicas,
        expositiva,
        demostrativa,
        dialogo
      })
    });

    if (!response.ok) {
      let detalle = `HTTP ${response.status}`;
      try {
        const errJson = await response.json();
        const d = errJson.detail;
        detalle = d ? (typeof d === "object" ? JSON.stringify(d) : String(d)) : JSON.stringify(errJson);
      } catch (_) {}
      throw new Error(detalle);
    }

    const data = await response.json();
    textareaEl.value = data.texto || "";
    guardarMateriales();

  } catch (err) {
    showAlert(`⚠️ Error al generar materiales para ${tecnica}:\n\n${mensajeAmigable(err)}`);
    console.error(`Error al generar materiales para ${tecnica}:`, err);
  } finally {
    if (btn) { btn.disabled = false; btn.textContent = "✨ Generar con IA"; }
    loader.style.display = "none";
  }
}

function guardarMateriales() {
  const materiales = {
    // Por técnica
    integracion:  document.getElementById("mat-integracion")?.value  || "",
    expositiva:   document.getElementById("mat-expositiva")?.value   || "",
    demostrativa: document.getElementById("mat-demostrativa")?.value || "",
    energizante:  document.getElementById("mat-energizante")?.value  || "",
    dialogo:      document.getElementById("mat-dialogo")?.value      || "",
    // Clasificados por categoría de requerimientos
    instalaciones:          document.getElementById("req-instalaciones")?.value          || "",
    equipo:                 document.getElementById("req-equipo")?.value                 || "",
    materialesDidacticos:   document.getElementById("req-materiales-didacticos")?.value  || "",
    humanos:                document.getElementById("req-humanos")?.value                || "",
    otros:                  document.getElementById("req-otros")?.value                  || "",
    seguridad:              document.getElementById("req-seguridad")?.value              || "",
  };
  localStorage.setItem("ec0217_materiales", JSON.stringify(materiales));
}

function cargarMateriales() {
  const guardado = localStorage.getItem("ec0217_materiales");
  if (!guardado) return;
  try {
    const m = JSON.parse(guardado);
    // Técnicas individuales
    ["integracion","expositiva","demostrativa","energizante","dialogo"].forEach(t => {
      const el = document.getElementById(`mat-${t}`);
      if (el && m[t]) el.value = m[t];
    });
    // Categorías de requerimientos
    const mapReq = {
      instalaciones:        "req-instalaciones",
      equipo:               "req-equipo",
      materialesDidacticos: "req-materiales-didacticos",
      humanos:              "req-humanos",
      otros:                "req-otros",
      seguridad:            "req-seguridad",
    };
    Object.entries(mapReq).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (el && m[key]) el.value = m[key];
    });
  } catch (_) {}
}

// Guardar al escribir en cualquier textarea de materiales (técnicas + requerimientos)
["integracion","expositiva","demostrativa","energizante","dialogo"].forEach(t => {
  document.getElementById(`mat-${t}`)?.addEventListener("input", guardarMateriales);
});
["req-instalaciones","req-equipo","req-materiales-didacticos","req-humanos","req-otros","req-seguridad"].forEach(id => {
  document.getElementById(id)?.addEventListener("input", guardarMateriales);
});

// Botones generar con IA
document.querySelectorAll(".btn-generar-materiales").forEach(btn => {
  btn.addEventListener("click", () => {
    const tecnica = btn.dataset.tecnica;
    if (tecnica) generarMaterialesIA(tecnica);
  });
});

// ─── Botón superior: genera materiales de TODAS las técnicas ─────────────────
const btnGenerarTodosMateriales = document.getElementById("btnGenerarTodosMateriales");
if (btnGenerarTodosMateriales) {
  btnGenerarTodosMateriales.addEventListener("click", async () => {
    const loaderTodos = document.getElementById("loaderTodosMateriales");
    const TECNICAS = ["integracion", "expositiva", "demostrativa", "energizante", "dialogo"];

    btnGenerarTodosMateriales.disabled = true;
    btnGenerarTodosMateriales.textContent = "⏳ Generando…";
    if (loaderTodos) loaderTodos.style.display = "block";

    for (const tec of TECNICAS) {
      await generarMaterialesIA(tec);
    }

    btnGenerarTodosMateriales.disabled = false;
    btnGenerarTodosMateriales.textContent = "✨ Generar materiales de todas las técnicas";
    if (loaderTodos) loaderTodos.style.display = "none";
  });
}

// ─── Botón inferior: clasifica el texto ya existente en los textareas ─────────
async function generarClasificacionIA() {
  const btnClas    = document.getElementById("btnGenerarClasificacion");
  const loaderClas = document.getElementById("loaderClasificacion");

  const TECNICAS = ["integracion", "expositiva", "demostrativa", "energizante", "dialogo"];

  // Recoger el texto actual de cada textarea de técnica
  const payload = {};
  TECNICAS.forEach(t => {
    payload[t] = document.getElementById(`mat-${t}`)?.value.trim() || "";
  });

  // Advertir si no hay nada para clasificar
  const hayContenido = Object.values(payload).some(v => v.length > 0);
  if (!hayContenido) {
    showAlert(
      "Primero genera los materiales de cada técnica usando el botón de arriba antes de clasificar.",
      { title: "Sin contenido para clasificar" }
    );
    return;
  }

  if (btnClas) { btnClas.disabled = true; btnClas.textContent = "⏳ Clasificando…"; }
  if (loaderClas) loaderClas.style.display = "block";

  try {
    const response = await fetchConTimeout(`${BACKEND_URL}/generate-materiales-clasificados`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }, 60000);

    if (!response.ok) {
      let det = `HTTP ${response.status}`;
      try { const e = await response.json(); det = e.detail || det; } catch (_) {}
      throw new Error(det);
    }

    const data = await response.json();

    const mapReq = {
      instalaciones:        "req-instalaciones",
      equipo:               "req-equipo",
      materialesDidacticos: "req-materiales-didacticos",
      humanos:              "req-humanos",
      otros:                "req-otros",
      seguridad:            "req-seguridad",
    };
    Object.entries(mapReq).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (el) el.value = data[key] || "";
    });

    guardarMateriales();
    if (typeof showToast === "function") showToast("Materiales clasificados correctamente", "success");

  } catch (err) {
    showAlert(`⚠️ No se pudo clasificar:\n\n${mensajeAmigable(err)}`);
    console.error("Error clasificando materiales:", err);
  } finally {
    if (btnClas) { btnClas.disabled = false; btnClas.textContent = "✨ Clasificar materiales por categoría"; }
    if (loaderClas) loaderClas.style.display = "none";
  }
}

const btnGenerarClasificacion = document.getElementById("btnGenerarClasificacion");
if (btnGenerarClasificacion) {
  btnGenerarClasificacion.addEventListener("click", generarClasificacionIA);
}


// Botón Siguiente de materiales
const btnGuardarMateriales = document.getElementById("btnGuardarMateriales");
if (btnGuardarMateriales) {
  btnGuardarMateriales.addEventListener("click", () => {
    const m = {
      integracion:  document.getElementById("mat-integracion")?.value.trim()  || "",
      expositiva:   document.getElementById("mat-expositiva")?.value.trim()   || "",
      demostrativa: document.getElementById("mat-demostrativa")?.value.trim() || "",
      energizante:  document.getElementById("mat-energizante")?.value.trim()  || "",
      dialogo:      document.getElementById("mat-dialogo")?.value.trim()      || "",
      instalaciones:        document.getElementById("req-instalaciones")?.value.trim()         || "",
      equipo:               document.getElementById("req-equipo")?.value.trim()                || "",
      materialesDidacticos: document.getElementById("req-materiales-didacticos")?.value.trim() || "",
      humanos:              document.getElementById("req-humanos")?.value.trim()               || "",
      otros:                document.getElementById("req-otros")?.value.trim()                 || "",
      seguridad:            document.getElementById("req-seguridad")?.value.trim()             || "",
    };

    const tieneAlguno = Object.values(m).some(v => v.length > 0);
    const errEl = document.getElementById("err-materiales");

    if (!tieneAlguno) {
      if (errEl) errEl.style.display = "block";
      return;
    }
    if (errEl) errEl.style.display = "none";

    localStorage.setItem("ec0217_materiales", JSON.stringify(m));
    localStorage.setItem("ec0217_materiales_completo", "true");

    document.getElementById("nav-materiales")?.classList.add("completed");
    document.getElementById("nav-formatos")?.classList.remove("disabled");

    mostrarSeccionPrincipal("seccionFormatos");
  });
}

// También agregar materiales al payload de recolectarPayload en shared.js se hace desde aquí
// sobreescribimos recolectarPayload para incluir materiales cuando existan
(function patchRecolectarPayload() {
  const original = window.recolectarPayload;
  if (typeof original !== "function") return;
  window.recolectarPayload = function() {
    const payload = original();
    const raw = localStorage.getItem("ec0217_materiales");
    payload.materiales = raw ? JSON.parse(raw) : {};
    return payload;
  };
})();

// Restaurar estado de materiales al recargar la página
if (localStorage.getItem("ec0217_tiempos_completo") === "true") {
  document.getElementById("nav-materiales")?.classList.remove("disabled");
}
if (localStorage.getItem("ec0217_materiales_completo") === "true") {
  document.getElementById("nav-materiales")?.classList.add("completed");
  document.getElementById("nav-formatos")?.classList.remove("disabled");
}

// Hamburguesa + Rediseño v2 → wizard/ui-sidebar.js y wizard/ui-helpers.js


// ─── 2. Progress bar ─────────────────────────────────────────
const PROGRESS_STEPS = [
  { key: "ec0217_datos_completo",        label: "Datos del curso" },
  { key: "ec0217_objetivos_completo",    label: "Objetivos" },
  { key: "ec0217_beneficios_completo",   label: "Beneficios" },
  { key: "ec0217_temario_completo",      label: "Temario" },
  { key: "ec0217_encuadre_completo",     label: "Encuadre" },
  { key: "ec0217_tecnicas_completo",     label: "Técnicas grupales" },
  { key: "ec0217_expositiva_completo",   label: "Técnica expositiva" },
  { key: "ec0217_demostrativa_completo", label: "Técnica demostrativa" },
  { key: "ec0217_dialogo_completo",      label: "Técnica diálogo" },
  { key: "ec0217_cierre_completo",       label: "Cierre" },
  { key: "ec0217_evaluaciones_completo", label: "Evaluaciones" },
  { key: "ec0217_tiempos_completo",      label: "Tiempos" },
  { key: "ec0217_materiales_completo",   label: "Materiales" },
];

const progressFill  = document.getElementById("progress-fill");
const progressPct   = document.getElementById("progress-pct");
const progressLabel = document.getElementById("progress-step-label");

function actualizarProgressBar(seccionActual) {
  const total     = PROGRESS_STEPS.length;
  const completados = PROGRESS_STEPS.filter(s => localStorage.getItem(s.key) === "true").length;
  const pct       = Math.round((completados / total) * 100);

  if (progressFill) progressFill.style.width = pct + "%";
  if (progressPct)  progressPct.textContent  = pct + "%";

  if (progressLabel && seccionActual) {
    const paso = PROGRESS_STEPS.findIndex(s => s.key.includes(seccionActual));
    const num  = paso >= 0 ? paso + 1 : "";
    const nombre = PROGRESS_STEPS.find(s => s.key.includes(seccionActual))?.label || seccionActual;
    progressLabel.textContent = num ? `Paso ${num} — ${nombre}` : nombre;
  }
}

// Progress bar patch + Focus mode listeners → wizard/ui-helpers.js (initUIHelpers)


// ─── 4. Sistema de Toasts ────────────────────────────────────
function showToast(mensaje, tipo = "default", duracion = 3000) {
  const container = document.getElementById("toast-container");
  if (!container) return;

  const toast = document.createElement("div");
  toast.className = `toast ${tipo}`;
  const iconos = { success: "✅", error: "❌", warning: "⚠️", default: "ℹ️" };
  toast.textContent = (iconos[tipo] || "") + " " + mensaje;
  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("out");
    toast.addEventListener("animationend", () => toast.remove(), { once: true });
  }, duracion);
}

// Hacer showToast global para usarlo desde cualquier parte
window.showToast = showToast;


// ─── 5. Botones de copiar en textareas con IA ────────────────
function inyectarBotonesCopiar() {
  const TEXTAREAS_IA = [
    "beneficiosTexto", "cierreTexto", "cierreResumen", "compromisosTexto",
    "sugerenciasContinuidad", "referenciasBibliograficas",
    "preguntasEncuadre", "instDiagnostica", "instFormativa", "instSumativa",
  ];

  TEXTAREAS_IA.forEach(id => {
    const ta = document.getElementById(id);
    if (!ta) return;

    const padre = ta.closest(".form-group, .textarea-ia-row") || ta.parentElement;
    if (!padre || padre.querySelector(".btn-copiar-ia")) return;

    const computado = getComputedStyle(padre);
    if (computado.position === "static") padre.style.position = "relative";

    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "btn-copiar-ia";
    btn.textContent = "📋 Copiar";
    btn.title = "Copiar al portapapeles";

    btn.addEventListener("click", async () => {
      const texto = ta.value.trim();
      if (!texto) return;
      try {
        await navigator.clipboard.writeText(texto);
        btn.textContent = "✓ Copiado";
        btn.classList.add("copiado");
        showToast("Copiado al portapapeles", "success", 2000);
        setTimeout(() => { btn.textContent = "📋 Copiar"; btn.classList.remove("copiado"); }, 2000);
      } catch (_) {
        showToast("No se pudo copiar", "error", 2500);
      }
    });

    padre.appendChild(btn);
  });
}

// Inyección inicial + patch mostrarSeccionPrincipal → wizard/ui-helpers.js (initUIHelpers)


// ─── 6. Celebración al descargar ─────────────────────────────
function mostrarCelebracion() {
  const overlay = document.getElementById("celebration-overlay");
  if (!overlay) return;
  overlay.classList.add("show");
  setTimeout(() => overlay.classList.remove("show"), 3200);
}

// Celebración + autoguardado + botones regresar + validación blur → wizard/ui-helpers.js (initUIHelpers)