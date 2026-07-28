// ─── wizard-ec0091/ia-hallazgos.js — IA para Paso 10: Hallazgos ─────────────

import { BACKEND_URL } from "./config.js";

async function _llamar(endpoint, payload) {
  const res = await fetch(`${BACKEND_URL}/${endpoint}`, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function _getCardDesdeBoton(btn) {
  return btn.closest(".hallazgo-card");
}

async function _ejecutarAccion(card, accion, btnEl, btnTextoOrig) {
  if (!card) return;
  const descripcion = card.querySelector(".hcDescripcion")?.value.trim() || "";
  const causa       = card.querySelector(".hcCausa")?.value.trim()       || "";
  const accion_prop = card.querySelector(".hcAccion")?.value.trim()      || "";
  const idx         = parseInt(card.dataset.idx || "0", 10);
  const divRev      = document.getElementById(`revision91-hallazgo-${idx}`);

  btnEl.disabled = true; btnEl.textContent = "...";

  try {
    const data = await _llamar("ec0091/ia/hallazgos", { accion, descripcion, causa, accion_propuesta: accion_prop });
    if (accion === "generar_causa" && data.causa) {
      const causaEl = card.querySelector(".hcCausa");
      if (causaEl) causaEl.value = data.causa;
    } else if (accion === "refinar" && data.descripcion) {
      const descEl = card.querySelector(".hcDescripcion");
      if (descEl) descEl.value = data.descripcion;
      if (data.causa) { const cEl = card.querySelector(".hcCausa"); if (cEl) cEl.value = data.causa; }
      if (data.accion) { const aEl = card.querySelector(".hcAccion"); if (aEl) aEl.value = data.accion; }
    } else if (accion === "revisar" && divRev) {
      divRev.style.display = "block";
      divRev.innerHTML = data.resultado || data.texto || JSON.stringify(data);
    }
  } catch (err) {
    if (divRev) { divRev.style.display = "block"; divRev.textContent = `⚠️ Error: ${err.message}`; }
  } finally {
    btnEl.disabled = false; btnEl.textContent = btnTextoOrig;
  }
}

export function initIAHallazgos91() {
  document.getElementById("hallazgos91Container")?.addEventListener("click", e => {
    const genBtn = e.target.closest(".btn91-gen-hallazgo");
    if (genBtn) { _ejecutarAccion(_getCardDesdeBoton(genBtn), "generar_causa", genBtn, "✨ Generar causa raíz"); return; }
    const refBtn = e.target.closest(".btn91-ref-hallazgo");
    if (refBtn) { _ejecutarAccion(_getCardDesdeBoton(refBtn), "refinar",       refBtn, "✏️ Mejorar redacción"); return; }
    const revBtn = e.target.closest(".btn91-rev-hallazgo");
    if (revBtn) { _ejecutarAccion(_getCardDesdeBoton(revBtn), "revisar",       revBtn, "🔍 Revisar 6 campos"); return; }
  });
}
