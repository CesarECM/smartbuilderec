// ─── wizard-ec0616/ia-elem.js — IA compartida para los 7 elementos EC0616 ────
// Cada elemento usa 3 botones: generarDescripcion, refinarTexto, revisarCumplimiento.
// Identificado por el id del elemento (oxigenacion, alimentacion, etc.)

import { llamarIA as _llamar } from "./api.js";
import { ELEMENTOS } from "./config.js";

function _getDatosCandidato() {
  const raw = localStorage.getItem("ec0616_datos");
  return raw ? JSON.parse(raw) : {};
}

async function _ejecutarAccion(elemId, accion) {
  const elem   = ELEMENTOS.find(e => e.id === elemId);
  if (!elem) return;

  const btnId  = accion === "generar" ? `btn16-gen-${elemId}` : accion === "refinar" ? `btn16-ref-${elemId}` : `btn16-rev-${elemId}`;
  const btn    = document.getElementById(btnId);
  const loader = document.getElementById(`loader16-${elemId}`);
  const divRev = document.getElementById(`revision16-${elemId}`);
  const ta     = document.getElementById(`elem${elem.num}_desempenos`);
  if (!btn || !ta) return;

  const textoOrig = btn.textContent;
  btn.disabled = true; btn.textContent = "...";
  if (loader) loader.style.display = "block";

  try {
    const cand = _getDatosCandidato();
    const data = await _llamar("ec0616/ia/elemento", {
      accion,
      elemento_num:   elem.num,
      elemento_titulo: elem.titulo,
      desempenos_ec:  elem.desempenos,
      texto_actual:   ta.value.trim(),
      unidad_medica:  cand.cand16UnidadMedica || "",
    });

    if (accion === "generar" && data.descripcion) {
      ta.value = data.descripcion;
    } else if (accion === "refinar" && data.descripcion) {
      ta.value = data.descripcion;
    } else if (accion === "revisar" && divRev) {
      divRev.style.display = "block";
      const checklist = Array.isArray(data.checklist) ? data.checklist : [];
      if (checklist.length > 0) {
        const items = checklist.map(item => {
          const cls = item.cumple === true ? "ok" : item.cumple === false ? "error" : "warn";
          const ico = item.cumple === true ? "✅" : item.cumple === false ? "❌" : "⚠️";
          return `<li class="${cls}">${ico} ${item.desempeno || item.texto || ""}</li>`;
        }).join("");
        divRev.innerHTML = `<ul class="elem-checklist">${items}</ul>${data.comentario ? `<p style="font-size:13px;margin-top:8px;">${data.comentario}</p>` : ""}`;
      } else {
        divRev.innerHTML = data.resultado || data.texto || JSON.stringify(data);
      }
    }
  } catch (err) {
    if (divRev) { divRev.style.display = "block"; divRev.textContent = `⚠️ Error: ${err.message}`; }
  } finally {
    btn.disabled = false; btn.textContent = textoOrig;
    if (loader) loader.style.display = "none";
  }
}

export function initIAElementos16() {
  ELEMENTOS.forEach(elem => {
    document.getElementById(`btn16-gen-${elem.id}`)?.addEventListener("click", () => _ejecutarAccion(elem.id, "generar"));
    document.getElementById(`btn16-ref-${elem.id}`)?.addEventListener("click", () => _ejecutarAccion(elem.id, "refinar"));
    document.getElementById(`btn16-rev-${elem.id}`)?.addEventListener("click", () => _ejecutarAccion(elem.id, "revisar"));
  });
}
