// ─── wizard/step-tiempos.js — Paso 15: Distribución de Tiempos ───────────────
// La meta de minutos es la duración declarada en Paso 1 (mínimo 120 por norma).

import { DURACION_MINIMA_MIN } from "./config.js";

function _getDuracionRequerida() {
  try {
    const d = JSON.parse(localStorage.getItem("ec0217_datos") || "{}");
    const n = parseInt(d.duracion, 10);
    return n >= DURACION_MINIMA_MIN ? n : DURACION_MINIMA_MIN;
  } catch (_) { return DURACION_MINIMA_MIN; }
}

// Estructura canónica de 30 actividades. Los títulos y nombres de sección
// DEBEN coincidir exactamente con los que el backend busca al armar la Carta
// Descriptiva (backend/services/doc_planeacion_filas.py → _tiempo/_subtotal).
// Suma = 120 min (= DURACION_MINIMA_MIN).
const _DEFAULT_TIEMPOS = [
  { seccion: "Inicio / Encuadre del curso", filas: [
    { titulo: "Presentación del Instructor",             tiempo: 1 },
    { titulo: "Lista de asistencia",                     tiempo: 1 },
    { titulo: "Presentación de los participantes",       tiempo: 1 },
    { titulo: "Técnica Rompe Hielo o de integración",    tiempo: 5 },
    { titulo: "Objetivos del curso/sesión",              tiempo: 2 },
    { titulo: "Descripción general",                     tiempo: 1 },
    { titulo: "Temario del curso/sesión",                tiempo: 1 },
    { titulo: "Preguntas de la experiencia",             tiempo: 3 },
    { titulo: "Beneficios del curso",                    tiempo: 2 },
    { titulo: "Tipo de evaluaciones",                    tiempo: 2 },
    { titulo: "Expectativas del curso/sesión",           tiempo: 3 },
    { titulo: "Reglas de operación del curso",           tiempo: 1 },
    { titulo: "Contrato de aprendizaje",                 tiempo: 3 },
    { titulo: "Evaluación diagnóstica",                  tiempo: 5 },
  ]},
  { seccion: "Desarrollo del curso", filas: [
    { titulo: "Técnica expositiva",        tiempo: 25 },
    { titulo: "Técnica demostrativa",      tiempo: 20 },
    { titulo: "Evaluación formativa",      tiempo: 5 },
    { titulo: "Descanso",                  tiempo: 3 },
    { titulo: "Técnica Energizante",       tiempo: 3 },
    { titulo: "Técnica diálogo-discusión", tiempo: 15 },
    { titulo: "Evaluación final",          tiempo: 5 },
  ]},
  { seccion: "Cierre del curso", filas: [
    { titulo: "Conclusión",                                 tiempo: 1 },
    { titulo: "Resumen general del curso",                  tiempo: 1 },
    { titulo: "Logro de expectativas del curso",            tiempo: 1 },
    { titulo: "Logro de los objetivos",                     tiempo: 1 },
    { titulo: "Sugerencias de continuidad del aprendizaje", tiempo: 1 },
    { titulo: "Referencia(s) bibliográfica",                tiempo: 1 },
    { titulo: "Compromisos de aplicación del aprendizaje",  tiempo: 1 },
    { titulo: "Evaluación de satisfacción",                 tiempo: 5 },
    { titulo: "Cierre",                                     tiempo: 1 },
  ]},
];

const _tiempos = () => window.sbeTiemposCurso ?? [];

export function guardarTiemposTemporal() {
  localStorage.setItem("ec0217_tiempos", JSON.stringify(_tiempos()));
}

export function guardarTiemposFinal() {
  guardarTiemposTemporal();
  localStorage.setItem("ec0217_tiempos_completo", "true");
  document.getElementById("nav-tiempos")?.classList.add("completed");
  document.getElementById("nav-materiales")?.classList.remove("disabled");
}

export function actualizarSubtotalesTiempos() {
  document.querySelectorAll(".tiempo-bloque").forEach((bloqueDiv, bloqueIndex) => {
    const subtotal = _tiempos()[bloqueIndex]?.filas.reduce((acc, f) => acc + Number(f.tiempo || 0), 0) ?? 0;
    const span = bloqueDiv.querySelector(".tiempo-subtotal");
    if (span) span.textContent = `${subtotal} minutos`;
  });
}

export function actualizarTotalTiempos() {
  const meta  = _getDuracionRequerida();
  const total = _tiempos().reduce((acc, b) => acc + b.filas.reduce((s, f) => s + Number(f.tiempo || 0), 0), 0);

  const totalEl = document.getElementById("totalTiempos");
  if (totalEl) totalEl.textContent = total;

  const metaEl = document.getElementById("duracionMetaLabel");
  if (metaEl) metaEl.textContent = `${meta} minutos`;

  const totalCard = document.getElementById("totalTiemposCard");
  if (totalCard) {
    totalCard.classList.remove("total-correcto", "total-error");
    totalCard.classList.add(total === meta ? "total-correcto" : "total-error");
  }

  const errEl = document.getElementById("err-tiempos");
  if (errEl) {
    if (total === meta) {
      errEl.style.display = "none";
    } else {
      const diff = total - meta;
      errEl.textContent = diff > 0
        ? `El total es ${total} min — necesitas reducir ${diff} minuto${diff !== 1 ? "s" : ""} para llegar a ${meta} min.`
        : `El total es ${total} min — necesitas agregar ${Math.abs(diff)} minuto${Math.abs(diff) !== 1 ? "s" : ""} para llegar a ${meta} min.`;
      errEl.style.display = "block";
    }
  }

  const hayActividadCero = _tiempos().some(b => b.filas.some(f => (parseInt(f.tiempo, 10) || 0) < 1));
  const btnGuardarTiempos = document.getElementById("btnGuardarTiempos");
  if (btnGuardarTiempos) btnGuardarTiempos.disabled = total !== meta || hayActividadCero;

  if (hayActividadCero && errEl && total === meta) {
    errEl.textContent = "Todas las actividades deben tener al menos 1 minuto.";
    errEl.style.display = "block";
  }

  return total;
}

export function renderTiempos() {
  const tablaTiempos = document.getElementById("tablaTiempos");
  if (!tablaTiempos) return;

  tablaTiempos.innerHTML = "";
  tablaTiempos.className = "tiempos-wrapper";

  _tiempos().forEach((bloque, bloqueIndex) => {
    const subtotal = bloque.filas.reduce((acc, f) => acc + Number(f.tiempo || 0), 0);
    const div = document.createElement("div");
    div.className = "tiempo-bloque";
    const subtotalColor = subtotal === 0 ? "#999" : "#1F3B6D";
    div.innerHTML = `
      <div class="tiempo-bloque-header">
        <h3>${bloque.seccion}</h3>
        <span class="tiempo-subtotal" style="color:${subtotalColor}">${subtotal} min</span>
      </div>
      <table class="tabla-tiempos">
        <thead><tr><th>Actividad</th><th class="col-tiempo">Tiempo</th></tr></thead>
        <tbody>
          ${bloque.filas.map((fila, filaIndex) => `
            <tr>
              <td>${fila.titulo}</td>
              <td class="col-tiempo">
                <div class="input-tiempo-wrapper">
                  <input type="number" min="1" value="${fila.tiempo}"
                    data-bloque="${bloqueIndex}" data-fila="${filaIndex}" class="input-tiempo">
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

  tablaTiempos.querySelectorAll(".input-tiempo").forEach(input => {
    input.addEventListener("input", () => {
      const bi = Number(input.dataset.bloque);
      const fi = Number(input.dataset.fila);
      _tiempos()[bi].filas[fi].tiempo = Number(input.value || 0);
      guardarTiemposTemporal();
      actualizarTotalTiempos();
      actualizarSubtotalesTiempos();
    });
    input.addEventListener("blur", () => {
      if (!input.value || Number(input.value) < 1) {
        input.value = 1;
        const bi = Number(input.dataset.bloque);
        const fi = Number(input.dataset.fila);
        _tiempos()[bi].filas[fi].tiempo = 1;
        guardarTiemposTemporal();
        actualizarTotalTiempos();
        actualizarSubtotalesTiempos();
      }
    });
  });

  actualizarTotalTiempos();
}

export function cargarTiempos() {
  const raw = localStorage.getItem("ec0217_tiempos");
  if (raw) {
    try {
      const data = JSON.parse(raw);
      if (Array.isArray(data) && data.length > 0) {
        window.sbeTiemposCurso = data;
      }
    } catch (_) {}
  }
  renderTiempos();
  if (localStorage.getItem("ec0217_tiempos_completo") === "true") {
    document.getElementById("nav-tiempos")?.classList.add("completed");
    document.getElementById("nav-materiales")?.classList.remove("disabled");
  }
}

export function initStepTiempos() {
  if (!window.sbeTiemposCurso) {
    window.sbeTiemposCurso = JSON.parse(JSON.stringify(_DEFAULT_TIEMPOS));
  }
  window.guardarTiemposTemporal      = guardarTiemposTemporal;
  window.guardarTiemposFinal         = guardarTiemposFinal;
  window.actualizarSubtotalesTiempos = actualizarSubtotalesTiempos;
  window.actualizarTotalTiempos      = actualizarTotalTiempos;
  window.renderTiempos               = renderTiempos;
  window.cargarTiempos               = cargarTiempos;
}

export function getTemplate() {
  return `
      <section id="seccionTiempos" class="wizard-section hidden">
        <p class="paso-titulo">Paso 15 de 16</p>
        <h1>Distribución de Tiempos</h1>

        <div class="card" style="max-width: 950px;">
          <p>
            Ajusta los minutos de cada actividad para que el total sea exactamente <strong id="duracionMetaLabel">120 minutos</strong>.
            Todos los campos son editables — modifica los valores hasta alcanzar la duración indicada en el Paso 1.
          </p>
          <p class="hint">
            💡 <strong>Sugerencia:</strong> Si te sobran o faltan minutos, ajusta primero las técnicas grupales
            (Rompe Hielo, Energizante) o los descansos, ya que son las actividades más flexibles en duración.
          </p>

          <div id="tablaTiempos"></div>

          <hr>

          <div id="totalTiemposCard" class="total-tiempos-card">
            <h3>Total general</h3>
            <div>
              <span id="totalTiempos" class="total-tiempos-numero">0</span>
              <span>minutos</span>
            </div>
          </div>

          <span class="error-msg" id="err-tiempos">
            La suma total debe ser exactamente 120 minutos.
          </span>

          <button class="btn-siguiente" id="btnGuardarTiempos">
            Siguiente
          </button>
        </div>
      </section>
  `;
}
