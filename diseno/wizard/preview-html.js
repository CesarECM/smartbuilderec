// ─── wizard/preview-html.js — Vista previa HTML del expediente EC0217 ─────────

const _NA = `<span style="color:#94a3b8;font-style:italic;">Sin datos</span>`;

function _esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function _sec(titulo, contenido) {
  return `<div style="margin-bottom:24px;">
    <h3 style="margin:0 0 10px;font-size:14px;color:var(--c-primary,#1e40af);
      border-bottom:2px solid var(--c-primary,#1e40af);padding-bottom:6px;">${titulo}</h3>
    <div style="font-size:13px;color:#374151;line-height:1.7;">${contenido}</div>
  </div>`;
}

function _f(label, val) {
  const v = _esc(val?.toString().trim() || "");
  return `<p style="margin:3px 0;"><span style="color:#64748b;display:inline-block;min-width:190px;">${label}:</span>${v || _NA}</p>`;
}

function _lista(arr) {
  if (!arr?.length) return _NA;
  return `<ul style="margin:4px 0;padding-left:20px;">${arr.map(i => `<li>${_esc(i)}</li>`).join("")}</ul>`;
}

export function getPreviewHTML(p) {
  const d   = p.datos        || {};
  const obj = p.objetivos    || {};
  const tem = p.temario      || {};
  const exp = p.expositiva   || {};
  const dem = p.demostrativa || {};
  const dia = p.dialogo      || {};
  const cie = p.cierre       || {};
  const ev  = p.evaluaciones || {};
  const mat = p.materiales   || {};
  const tArr = Array.isArray(p.tiempos) ? p.tiempos : [];

  const secTemario = (() => {
    const u = (nom, items) => items?.length
      ? `<p style="margin:8px 0 3px;font-weight:600;">${_esc(nom)}</p>${_lista(items)}`
      : "";
    const html = u(tem.nombreU1 || "Unidad 1", tem.u1)
               + u(tem.nombreU2 || "Unidad 2", tem.u2)
               + u(tem.nombreU3 || "Unidad 3", tem.u3);
    return html || _NA;
  })();

  const secTiempos = (() => {
    if (!tArr.length) return _NA;
    return tArr.map(b => {
      const total = (b.filas || []).reduce((s, f) => s + (parseInt(f.tiempo, 10) || 0), 0);
      const rows  = (b.filas || []).map(f =>
        `<tr><td style="padding:2px 8px;">${_esc(f.actividad) || "—"}</td>
             <td style="padding:2px 8px;text-align:right;">${parseInt(f.tiempo, 10) || 0} min</td></tr>`
      ).join("");
      return `<p style="margin:8px 0 4px;font-weight:600;">${_esc(b.nombre) || "Bloque"} — ${total} min</p>
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:8px;">
          <thead><tr style="background:#f1f5f9;color:#64748b;">
            <th style="padding:3px 8px;text-align:left;">Actividad</th>
            <th style="padding:3px 8px;text-align:right;">Tiempo</th>
          </tr></thead>
          <tbody>${rows}</tbody>
        </table>`;
    }).join("");
  })();

  const secMateriales = (() => {
    const cats = [
      ["instalaciones",         "Instalaciones"],
      ["equipo",                "Equipo"],
      ["materialesDidacticos",  "Materiales didácticos"],
      ["humanos",               "Recursos humanos"],
      ["otros",                 "Otros"],
      ["seguridad",             "Seguridad"],
    ];
    const html = cats.map(([k, label]) => {
      const items = mat[k];
      return items?.length
        ? `<p style="margin:6px 0 2px;font-weight:600;">${label}</p>${_lista(items)}`
        : "";
    }).join("");
    return html || _NA;
  })();

  const pctF = ev.pctFormativa ?? 0;
  const pctS = ev.pctSumativa  ?? 0;

  return [
    _sec("1. Datos del Curso", [
      _f("Nombre del curso", d.nombreCurso),
      _f("Instructor",       d.instructor),
      _f("Diseñador",        d.disenador),
      _f("Lugar",            d.lugar),
      _f("Fecha",            d.fecha),
      _f("Duración",         d.duracion ? `${d.duracion} min` : ""),
      _f("Participantes",    d.participantes),
      _f("Perfil de egreso", d.perfil),
    ].join("")),

    _sec("2. Objetivos de Aprendizaje", [
      _f("Cognitivo",   obj.cognitiva),
      _f("Psicomotriz", obj.psicomotriz),
      _f("Afectivo",    obj.afectiva),
      _f("General",     obj.general),
    ].join("")),

    _sec("3. Beneficios del Curso",
      p.beneficios ? `<p style="margin:4px 0;">${_esc(p.beneficios)}</p>` : _NA
    ),

    _sec("4. Temario", secTemario),

    _sec("5. Técnica Expositiva", [
      _f("Objetivo",     exp.objetivo),
      _f("Introducción", exp.introduccion),
      _f("Desarrollo",   exp.desarrollo),
      _f("Síntesis",     exp.sintesis),
    ].join("")),

    _sec("6. Técnica Demostrativa", [
      _f("Objetivo",    dem.objetivo),
      _f("Experiencia", dem.experiencia),
      _f("Actividad",   dem.actividad),
      _f("Ejemplos",    dem.ejemplos),
    ].join("")),

    _sec("7. Técnica de Diálogo / Discusión", [
      _f("Objetivo",      dia.objetivo),
      _f("Actividad",     dia.actividad),
      _f("Instrucciones", dia.instrucciones),
      _f("Conclusión",    dia.conclusion),
    ].join("")),

    _sec("8. Actividad de Cierre", [
      _f("Actividad principal",     cie.texto),
      _f("Resumen",                 cie.resumen),
      _f("Compromisos de aplic.",   cie.compromisos),
      _f("Sugerencias continuidad", cie.sugerencias),
      _f("Referencias bibliogr.",   cie.referencias),
    ].join("")),

    _sec("9. Evaluaciones", [
      _f("Diagnóstica",  `0% — ${ev.instDiagnostica || "—"}`),
      _f("Formativa",    `${pctF}% (${ev.tipoInstrumentoFormativa || "—"}) — ${ev.instFormativa || "—"}`),
      _f("Sumativa",     `${pctS}% — ${ev.instSumativa || "—"}`),
      _f("Reacción",     ev.instReac),
    ].join("")),

    _sec("10. Distribución de Tiempos", secTiempos),
    _sec("11. Materiales y Requerimientos", secMateriales),
  ].join("");
}

export function initPreview() {
  if (!document.getElementById("sbe-preview-overlay")) {
    const ov = document.createElement("div");
    ov.id = "sbe-preview-overlay";
    ov.style.cssText = "display:none;position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.6);overflow:hidden;";
    ov.innerHTML = `
      <div style="background:#fff;height:100%;max-width:860px;margin:0 auto;display:flex;flex-direction:column;box-shadow:0 0 40px rgba(0,0,0,.3);">
        <div style="display:flex;justify-content:space-between;align-items:center;padding:14px 22px;background:var(--c-primary,#1e40af);color:#fff;flex-shrink:0;">
          <span id="sbe-preview-title" style="font-weight:700;font-size:15px;">Vista previa — Expediente EC0217.01</span>
          <button id="sbe-preview-close" style="background:rgba(255,255,255,.2);border:none;color:#fff;padding:6px 14px;border-radius:6px;cursor:pointer;font-size:13px;font-weight:600;">✕ Cerrar</button>
        </div>
        <div id="sbe-preview-body" style="overflow-y:auto;padding:24px 28px;flex:1;"></div>
      </div>`;
    document.body.appendChild(ov);
    document.getElementById("sbe-preview-close").addEventListener("click", _cerrarPreview);
    ov.addEventListener("click", e => { if (e.target === ov) _cerrarPreview(); });
    document.addEventListener("keydown", e => { if (e.key === "Escape") _cerrarPreview(); });
  }
  const btn = document.getElementById("btnVistaPrevia");
  if (btn) btn.addEventListener("click", _abrirPreview);
}

function _abrirPreview() {
  const p   = typeof window.recolectarPayload === "function" ? window.recolectarPayload() : {};
  const nom = p.datos?.nombreCurso;
  const tEl = document.getElementById("sbe-preview-title");
  if (tEl) tEl.textContent = nom ? `Vista previa — ${nom}` : "Vista previa — Expediente EC0217.01";
  const body = document.getElementById("sbe-preview-body");
  if (body) body.innerHTML = getPreviewHTML(p);
  const ov = document.getElementById("sbe-preview-overlay");
  if (ov) { ov.style.display = "flex"; document.body.style.overflow = "hidden"; }
}

function _cerrarPreview() {
  const ov = document.getElementById("sbe-preview-overlay");
  if (ov) { ov.style.display = "none"; document.body.style.overflow = ""; }
}
