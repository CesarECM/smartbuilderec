// ─── wizard/ia-objetivos.js — IA para Objetivos de Aprendizaje ───────────────
// evaluateText:  evalúa el objetivo redactado con el backend (/evaluate)
// generarGeneral: genera el objetivo general a partir de los 3 objetivos

import { llamarIA } from "./api.js";

const CRITERIA = ["quien", "cuando", "accion", "objeto", "condicion", "finalidad"];

const _estado = () => window.sbeEstadoObjetivos || {
  actual: "cognitiva",
  cognitiva:   { texto: "", completa: false },
  psicomotriz: { texto: "", completa: false },
  afectiva:    { texto: "", completa: false },
  general:     { texto: "", completa: false },
};

function _cap(text) { return text.charAt(0).toUpperCase() + text.slice(1); }

export async function evaluateText(text) {
  const e = _estado();
  if (e.actual === "general") return;
  if (!text.trim()) return;

  const summary     = document.getElementById("summary");
  const checksList  = document.getElementById("checksList");
  const sendBtn     = document.getElementById("sendBtn");
  const nextBtn     = document.getElementById("nextBtn");
  const loader1     = document.getElementById("contenedorLoader1");
  const loader2     = document.getElementById("contenedorLoader2");

  const palabras = text.trim().split(/\s+/).filter(Boolean);
  if (palabras.length < 10) {
    if (summary) {
      summary.textContent = "⚠️ El objetivo es demasiado corto. Un objetivo bien redactado necesita al menos 10 palabras que incluyan: quién, cuándo, acción, objeto, condición y finalidad.";
      summary.style.display = "block";
    }
    if (checksList) checksList.style.display = "block";
    CRITERIA.forEach(c => {
      const li = document.getElementById(`chk-${c}`);
      if (li) li.textContent = `❌ ${_cap(c)}`;
    });
    if (nextBtn) nextBtn.style.display = "none";
    return;
  }

  if (summary) summary.style.display = "none";
  if (checksList) checksList.style.display = "none";
  if (loader1) loader1.style.display = "grid";
  if (loader2) loader2.style.display = "grid";
  if (sendBtn) sendBtn.disabled = true;

  try {
    const data = await llamarIA("evaluate", {
      texto:               text,
      tipo:                e.actual,
      objetivo_cognitivo:  e.cognitiva.texto   || "",
      objetivo_psicomotriz: e.psicomotriz.texto || "",
    });

    const norm = s => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
    const faltantesNorm = (data.faltantes || []).map(norm);

    CRITERIA.forEach(c => {
      const li = document.getElementById(`chk-${c}`);
      if (li) li.textContent = faltantesNorm.includes(norm(c)) ? `❌ ${_cap(c)}` : `✔ ${_cap(c)}`;
    });

    if (!data.coincide_con_seccion) {
      if (summary) summary.textContent =
        `⚠️ El objetivo parece ser de tipo ${_cap(data.tipo_detectado)}, ` +
        `pero estás en la sección ${_cap(e.actual)}.\n\n${data.resumen}`;
    } else {
      if (summary) summary.textContent = data.resumen;
    }

    const modoEstricto = localStorage.getItem("ec0217_modo_estricto") || "on";
    if (faltantesNorm.length === 0 && data.coincide_con_seccion) {
      if (typeof window.marcarCompleta === "function") window.marcarCompleta(e.actual);
      if (summary) summary.textContent += "\n\n✅ ¡Objetivo completo! Puedes pasar al siguiente.";
      if (nextBtn) nextBtn.style.display = modoEstricto === "on" ? "inline-block" : "none";
    } else {
      if (nextBtn) nextBtn.style.display = "none";
    }

  } catch (err) {
    if (summary) summary.textContent = `⚠️ Error al conectar con el servidor: ${err.message}`;
  } finally {
    if (loader1) loader1.style.display = "none";
    if (loader2) loader2.style.display = "none";
    if (summary) summary.style.display = "block";
    if (checksList) checksList.style.display = "block";
    if (sendBtn) sendBtn.disabled = false;
  }
}

export async function generarGeneral() {
  const e = _estado();
  const btnGenerarGeneral = document.getElementById("btnGenerarGeneral");
  const loader2           = document.getElementById("contenedorLoader2");
  const textarea          = document.getElementById("objectiveInput");
  const btnIrBeneficios   = document.getElementById("btnIrBeneficios");

  if (btnGenerarGeneral) { btnGenerarGeneral.disabled = true; btnGenerarGeneral.textContent = "Generando..."; }
  if (loader2) loader2.style.display = "block";

  try {
    const data = await llamarIA("generate-general", {
      cognitiva:   e.cognitiva.texto,
      psicomotriz: e.psicomotriz.texto,
      afectiva:    e.afectiva.texto,
    });

    e.general.texto    = data.general;
    e.general.completa = true;
    document.getElementById("nav-general")?.classList.add("completed");
    document.getElementById("nav-general")?.classList.remove("disabled");

    if (typeof window.guardarObjetivos    === "function") window.guardarObjetivos();
    if (typeof window.habilitarBeneficios === "function") window.habilitarBeneficios();
    if (typeof window.aplicarModoObjetivos === "function") window.aplicarModoObjetivos();

    if (e.actual === "general") {
      if (textarea) textarea.value = e.general.texto;
      if (btnGenerarGeneral) btnGenerarGeneral.style.display = "none";
      if (btnIrBeneficios)  btnIrBeneficios.style.display   = "inline-block";
    }
  } catch (err) {
    console.error("Error al generar objetivo general:", err);
    if (btnGenerarGeneral) {
      btnGenerarGeneral.textContent  = "✨ Generar Objetivo General con IA";
      btnGenerarGeneral.style.display = "inline-block";
    }
  } finally {
    if (loader2) loader2.style.display = "none";
    if (btnGenerarGeneral) {
      btnGenerarGeneral.disabled = false;
      if (btnGenerarGeneral.style.display !== "none")
        btnGenerarGeneral.textContent = "✨ Generar Objetivo General con IA";
    }
  }
}

export function initIAObjetivos() {
  window.evaluateText   = evaluateText;
  window.generarGeneral = generarGeneral;

  // Botón "Revisar con IA"
  document.getElementById("sendBtn")?.addEventListener("click", () => {
    evaluateText(document.getElementById("objectiveInput")?.value || "");
  });

  // Botón "Siguiente →" (marcar objetivo actual como completo)
  document.getElementById("nextBtn")?.addEventListener("click", () => {
    const e = _estado();
    const ta = document.getElementById("objectiveInput");
    if (ta && e.actual) e[e.actual].texto = ta.value;
    window.marcarCompleta?.(e.actual);
  });

  // Botón "Guardar objetivo" (modo libre)
  document.getElementById("btnGuardarObjetivoLibre")?.addEventListener("click", () => {
    const e = _estado();
    const ta = document.getElementById("objectiveInput");
    if (ta && e.actual) e[e.actual].texto = ta.value;
    window.guardarObjetivoLibre?.();
  });

  // Botón "✨ Generar objetivo general con IA"
  document.getElementById("btnGenerarObjetivoGeneral")?.addEventListener("click", () => generarGeneral());

  // Botón "Siguiente" (ir a Beneficios tras objetivo general)
  document.getElementById("btnIrBeneficios")?.addEventListener("click", () => {
    window.mostrarSeccionPrincipal?.("seccionBeneficios");
  });

  // Modo estricto ON / OFF
  document.getElementById("btnModoEstrictoOn")?.addEventListener("click", () => {
    localStorage.setItem("ec0217_modo_estricto", "on");
    window.reiniciarAvanceObjetivosEstricto?.();
    window.aplicarModoObjetivos?.();
  });
  document.getElementById("btnModoEstrictoOff")?.addEventListener("click", () => {
    localStorage.setItem("ec0217_modo_estricto", "off");
    window.aplicarModoObjetivos?.();
  });

  // Sub-tabs: cognitiva / psicomotriz / afectiva / general
  const TITLES = { cognitiva:"Objetivo Cognitivo", psicomotriz:"Objetivo Psicomotriz", afectiva:"Objetivo Afectivo", general:"Objetivo General" };
  ["cognitiva","psicomotriz","afectiva","general"].forEach(tipo => {
    document.getElementById(`nav-${tipo}`)?.addEventListener("click", () => {
      if (document.getElementById(`nav-${tipo}`)?.classList.contains("disabled")) return;
      const e  = _estado();
      const ta = document.getElementById("objectiveInput");
      if (ta && e.actual) e[e.actual].texto = ta.value;
      e.actual = tipo;
      if (ta) ta.value = e[tipo].texto || "";
      const titleEl = document.getElementById("sectionTitle");
      if (titleEl) titleEl.textContent = TITLES[tipo] || tipo;
      ["cognitiva","psicomotriz","afectiva","general"].forEach(t =>
        document.getElementById(`nav-${t}`)?.classList.toggle("active", t === tipo)
      );
      const modo = localStorage.getItem("ec0217_modo_estricto") || "on";
      const isGeneral = tipo === "general";
      const $  = id => document.getElementById(id);
      const sv = (id, v) => { const el = $(id); if (el) el.style.display = v; };
      sv("btnGenerarGeneral",      isGeneral && !e.general.completa  ? "inline-block" : "none");
      sv("btnIrBeneficios",        isGeneral &&  e.general.completa  ? "inline-block" : "none");
      sv("nextBtn",               !isGeneral && modo === "on"  && !e[tipo].completa ? "inline-block" : "none");
      sv("btnGuardarObjetivoLibre",!isGeneral && modo === "off"               ? "inline-block" : "none");
      const sumEl = $("summary");
      if (sumEl) sumEl.textContent = "Aquí aparecerá el análisis automático.";
      const ckEl = $("checksList");
      if (ckEl) ckEl.style.display = "none";
    });
  });
}
