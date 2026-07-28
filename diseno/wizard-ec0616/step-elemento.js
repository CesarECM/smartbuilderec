// ─── wizard-ec0616/step-elemento.js — Factory para pasos de elementos ────────
// Cada uno de los 7 elementos EC0616 comparte la misma estructura UI/lógica.
// Se instancia una vez por elemento con _crearModuloElemento(elem, sigNavId).

import { ELEMENTOS } from "./config.js";

export function _crearModuloElemento(elem, sigNavId) {
  const { id, num, nav, sec, clave, titulo, desc, desempenos } = elem;
  const paso = num + 1; // paso 2-8

  function cargar() {
    const raw = localStorage.getItem(clave);
    if (!raw) return;
    const d = JSON.parse(raw);
    const desEl = document.getElementById(`elem${num}_desempenos`);
    const proEl = document.getElementById(`elem${num}_productos`);
    if (desEl && d.desempenos !== undefined) desEl.value = d.desempenos;
    if (proEl && d.productos  !== undefined) proEl.value = d.productos;
  }

  function guardar() {
    const datos = {
      desempenos: document.getElementById(`elem${num}_desempenos`)?.value.trim() || "",
      productos:  document.getElementById(`elem${num}_productos`)?.value.trim()  || "",
    };
    localStorage.setItem(clave, JSON.stringify(datos));
    localStorage.setItem(`${clave}_completo`, "true");
    document.getElementById(nav)?.classList.add("completed");
    if (sigNavId) document.getElementById(sigNavId)?.classList.remove("disabled");
    window.ec0616Sync?.schedule();
  }

  function getTemplate() {
    return `
    <section id="${sec}" class="wizard-section hidden">
      <p class="paso-titulo">Paso ${paso} de 9</p>
      <h1>Elemento ${num} — ${titulo}</h1>
      <div class="card" style="max-width:800px;">
        <p style="color:#555;font-size:14px;">${desc}</p>

        <div style="background:#f0fdf4;border:1.5px solid #059669;border-radius:8px;padding:14px;margin-bottom:16px;">
          <h4 style="color:#065f46;margin:0 0 8px 0;">Desempeños requeridos EC0616 — Elemento ${num}</h4>
          <ul style="margin:0;padding-left:18px;font-size:13px;color:#374151;">
            ${desempenos.map(d => `<li>${d}</li>`).join("")}
          </ul>
        </div>

        <div class="form-group">
          <label for="elem${num}_desempenos">Descripción de tus desempeños *</label>
          <div class="ia-grupo-elem">
            <button type="button" id="btn16-gen-${id}" class="btn-ia">✨ Redactar por mí</button>
            <button type="button" id="btn16-ref-${id}" class="btn-ia">✏️ Mejorar mi texto</button>
            <button type="button" id="btn16-rev-${id}" class="btn-ia">🔍 ¿Cumple el criterio?</button>
          </div>
          <div id="loader16-${id}" style="display:none;font-size:13px;color:#065f46;font-style:italic;margin-bottom:6px;">Procesando...</div>
          <textarea id="elem${num}_desempenos" rows="7" spellcheck="true" lang="es"
            placeholder="Describe cómo has llevado a cabo los desempeños de este elemento en tu práctica como auxiliar de enfermería..."></textarea>
        </div>

        <div id="revision16-${id}" class="revision-resultado" style="display:none;margin-bottom:12px;"></div>

        <div class="form-group" style="margin-top:12px;">
          <label for="elem${num}_productos">Productos / evidencias documentales</label>
          <textarea id="elem${num}_productos" rows="4" spellcheck="true" lang="es"
            placeholder="Lista los documentos, registros o evidencias físicas que demuestran tu desempeño (ej. notas de enfermería, hojas de registro, fotografías firmadas...)"></textarea>
        </div>

        <button class="btn-siguiente" id="btn16-sig-${id}">Siguiente →</button>
      </div>
    </section>`;
  }

  return { cargar, guardar, getTemplate, id, nav, sec };
}

/** Genera los 7 módulos de elementos */
export function crearModulosElementos() {
  const sigNavIds = [
    "nav16-alimentacion","nav16-eliminacion","nav16-confort",
    "nav16-seguridad","nav16-postmortem","nav16-autocuidado","nav16-portafolio"
  ];
  return ELEMENTOS.map((e, i) => _crearModuloElemento(e, sigNavIds[i]));
}
