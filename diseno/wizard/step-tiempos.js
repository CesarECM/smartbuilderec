// ─── wizard/step-tiempos.js — Paso 15: Distribución de Tiempos ───────────────
// La norma EC0217 exige exactamente 120 minutos de duración del curso.

import { DURACION_MINIMA_MIN } from "./config.js";

const _DEFAULT_TIEMPOS = [
  { seccion: "Apertura", filas: [
    { titulo: "Encuadre y presentación del instructor", tiempo: 10 },
    { titulo: "Técnica de integración grupal",          tiempo: 10 },
    { titulo: "Evaluación diagnóstica",                 tiempo: 10 },
  ]},
  { seccion: "Desarrollo", filas: [
    { titulo: "Técnica expositiva",          tiempo: 30 },
    { titulo: "Técnica demostrativa",        tiempo: 20 },
    { titulo: "Técnica energizante",         tiempo: 10 },
    { titulo: "Técnica de diálogo/discusión",tiempo: 15 },
  ]},
  { seccion: "Cierre", filas: [
    { titulo: "Resumen y compromisos de aplicación", tiempo: 5 },
  ]},
  { seccion: "Evaluación", filas: [
    { titulo: "Evaluación sumativa",  tiempo: 5 },
    { titulo: "Evaluación de reacción", tiempo: 5 },
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
  const total = _tiempos().reduce((acc, b) => acc + b.filas.reduce((s, f) => s + Number(f.tiempo || 0), 0), 0);

  const totalEl = document.getElementById("totalTiempos");
  if (totalEl) totalEl.textContent = total;

  const totalCard = document.getElementById("totalTiemposCard");
  if (totalCard) {
    totalCard.classList.remove("total-correcto", "total-error");
    totalCard.classList.add(total === DURACION_MINIMA_MIN ? "total-correcto" : "total-error");
  }

  const errEl = document.getElementById("err-tiempos");
  if (errEl) {
    if (total === DURACION_MINIMA_MIN) {
      errEl.style.display = "none";
    } else {
      const diff = total - DURACION_MINIMA_MIN;
      errEl.textContent = diff > 0
        ? `El total es ${total} min — necesitas reducir ${diff} minuto${diff !== 1 ? "s" : ""} en alguna actividad.`
        : `El total es ${total} min — necesitas agregar ${Math.abs(diff)} minuto${Math.abs(diff) !== 1 ? "s" : ""} en alguna actividad.`;
      errEl.style.display = "block";
    }
  }

  const btnGuardarTiempos = document.getElementById("btnGuardarTiempos");
  if (btnGuardarTiempos) btnGuardarTiempos.disabled = total !== DURACION_MINIMA_MIN;

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
                  <input type="number" min="0" value="${fila.tiempo}"
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
            Ajusta los minutos de cada actividad para que el total sea exactamente <strong>120 minutos</strong>.
            Todos los campos son editables — modifica los valores hasta que el contador llegue a 120.
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
