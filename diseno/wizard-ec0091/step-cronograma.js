// ─── wizard-ec0091/step-cronograma.js — Paso 7: Cronograma ──────────────────

let _actividades = [];

const COLUMNAS = ["fecha", "hora", "actividad", "responsable", "lugar"];

function _crearFila(datos = {}) {
  const tr = document.createElement("tr");
  COLUMNAS.forEach(col => {
    const td = document.createElement("td");
    const input = document.createElement("input");
    input.type = "text";
    input.placeholder = { fecha:"dd/mm/aaaa", hora:"HH:MM", actividad:"Describe la actividad", responsable:"Nombre", lugar:"Lugar" }[col] || "";
    input.value = datos[col] || "";
    input.addEventListener("input", () => _guardarActividadesEnMemoria());
    td.appendChild(input);
    tr.appendChild(td);
  });
  const tdAccion = document.createElement("td");
  const btnElim = document.createElement("button");
  btnElim.type = "button";
  btnElim.textContent = "✕";
  btnElim.style.cssText = "background:none;border:none;color:#991b1b;cursor:pointer;font-size:16px;padding:2px 6px;";
  btnElim.addEventListener("click", () => { tr.remove(); _guardarActividadesEnMemoria(); });
  tdAccion.appendChild(btnElim);
  tr.appendChild(tdAccion);
  return tr;
}

function _guardarActividadesEnMemoria() {
  const filas = document.querySelectorAll("#cronograma91Body tr");
  _actividades = Array.from(filas).map(tr => {
    const inputs = tr.querySelectorAll("input");
    const obj = {};
    COLUMNAS.forEach((col, i) => { obj[col] = inputs[i]?.value.trim() || ""; });
    return obj;
  });
}

export function cargarCronograma91() {
  const raw = localStorage.getItem("ec0091_cronograma");
  if (!raw) return;
  const d = JSON.parse(raw);
  _actividades = d.actividades || [];
  const tbody = document.getElementById("cronograma91Body");
  if (!tbody) return;
  tbody.innerHTML = "";
  _actividades.forEach(act => tbody.appendChild(_crearFila(act)));
  if (_actividades.length === 0) tbody.appendChild(_crearFila());
}

export function guardarCronograma91() {
  _guardarActividadesEnMemoria();
  const datos = { actividades: _actividades };
  localStorage.setItem("ec0091_cronograma", JSON.stringify(datos));
  localStorage.setItem("ec0091_cronograma_completo", "true");
  document.getElementById("nav91-cronograma")?.classList.add("completed");
  document.getElementById("nav91-lista")?.classList.remove("disabled");
  window.ec0091Sync?.schedule();
}

export function initStepCronograma91() {
  window.cargarCronograma91  = cargarCronograma91;
  window.guardarCronograma91 = guardarCronograma91;

  document.getElementById("btn91AgregarAct")?.addEventListener("click", () => {
    const tbody = document.getElementById("cronograma91Body");
    if (tbody) tbody.appendChild(_crearFila());
  });
}

export function getTemplate() {
  return `
  <section id="sec91Cronograma" class="wizard-section hidden">
    <p class="paso-titulo">Paso 7 de 13</p>
    <h1>Cronograma de la Verificación</h1>
    <div class="card" style="max-width:960px;">
      <p style="color:#555;font-size:14px;">Programa las actividades, fechas, horarios y responsables de la verificación.</p>

      <div style="display:flex;gap:8px;margin-bottom:12px;flex-wrap:wrap;align-items:center;">
        <button type="button" id="btn91AgregarAct" class="btn-siguiente" style="padding:8px 16px;font-size:13px;margin:0;">+ Agregar actividad</button>
        <button type="button" id="btn91RevCronograma" class="btn-ia">🔍 Revisar con IA</button>
      </div>

      <div style="overflow-x:auto;">
        <table class="cronograma-tabla">
          <thead>
            <tr>
              <th>Fecha</th><th>Hora</th><th>Actividad</th><th>Responsable</th><th>Lugar</th><th></th>
            </tr>
          </thead>
          <tbody id="cronograma91Body"></tbody>
        </table>
      </div>

      <div id="revision91Cronograma" class="revision-resultado" style="display:none;margin-top:12px;"></div>

      <button class="btn-siguiente" id="btn91SigCronograma" style="margin-top:16px;">Siguiente →</button>
    </div>
  </section>`;
}
