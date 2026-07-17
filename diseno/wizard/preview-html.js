// ─── wizard/preview-html.js — Vista previa HTML del expediente EC0217 ─────────

const _NA = `<span style="color:#94a3b8;font-style:italic;">Sin datos</span>`;

function _esc(str) {
  return String(str ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;")
    .replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function _sec(titulo, contenido) {
  return `<div style="margin-bottom:28px;">
    <h3 style="margin:0 0 8px;font-size:14px;color:var(--c-primary,#1e40af);
      border-bottom:2px solid var(--c-primary,#1e40af);padding-bottom:5px;">${titulo}</h3>
    <div style="font-size:13px;color:#374151;line-height:1.7;">${contenido}</div>
  </div>`;
}

// Fila de tabla: etiqueta + valor (pre=true preserva saltos de línea)
function _f(label, val, pre = false) {
  const v = _esc(val?.toString().trim() || "");
  const valHtml = pre ? v.replace(/\n/g, "<br>") : v;
  return `<tr>
    <td style="padding:5px 10px;color:#64748b;font-weight:600;white-space:nowrap;
               width:210px;vertical-align:top;border-bottom:1px solid #f1f5f9;">${label}</td>
    <td style="padding:5px 10px;border-bottom:1px solid #f1f5f9;">${valHtml || _NA}</td>
  </tr>`;
}

function _tbl(filas) {
  return `<table style="width:100%;border-collapse:collapse;font-size:13px;">${filas}</table>`;
}

function _lista(arr) {
  if (!arr) return _NA;
  if (typeof arr === "string") arr = arr.split("\n").map(s => s.trim()).filter(Boolean);
  if (!arr.length) return _NA;
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

  // ── Temario ───────────────────────────────────────────────────────────────
  const secTemario = (() => {
    const u = (nom, items) => items?.length
      ? `<tr>
          <td style="padding:5px 10px;font-weight:600;color:#64748b;vertical-align:top;
                     width:120px;border-bottom:1px solid #f1f5f9;">${_esc(nom)}</td>
          <td style="padding:5px 10px;border-bottom:1px solid #f1f5f9;">${_lista(items)}</td>
        </tr>`
      : "";
    const filas = u(tem.nombreU1 || "Unidad 1", tem.u1)
                + u(tem.nombreU2 || "Unidad 2", tem.u2)
                + u(tem.nombreU3 || "Unidad 3", tem.u3);
    return filas ? _tbl(filas) : _NA;
  })();

  // ── Distribución de tiempos ───────────────────────────────────────────────
  const secTiempos = (() => {
    if (!tArr.length) return _NA;
    return tArr.map(b => {
      const total = (b.filas || []).reduce((s, f) => s + (parseInt(f.tiempo, 10) || 0), 0);
      const filas = (b.filas || []).map(f =>
        `<tr>
          <td style="padding:4px 10px;border-bottom:1px solid #f1f5f9;">${_esc(f.titulo) || "—"}</td>
          <td style="padding:4px 10px;border-bottom:1px solid #f1f5f9;text-align:right;
                     white-space:nowrap;width:80px;">${parseInt(f.tiempo, 10) || 0} min</td>
        </tr>`
      ).join("");
      const titulo = _esc(b.seccion || b.nombre || "Bloque");
      return `<p style="margin:12px 0 4px;font-weight:700;color:#1e40af;">${titulo} — ${total} min</p>
        <table style="width:100%;border-collapse:collapse;font-size:12px;margin-bottom:4px;">
          <thead>
            <tr style="background:#f0f4fb;">
              <th style="padding:4px 10px;text-align:left;color:#64748b;">Actividad</th>
              <th style="padding:4px 10px;text-align:right;color:#64748b;width:80px;">Tiempo</th>
            </tr>
          </thead>
          <tbody>${filas}</tbody>
        </table>`;
    }).join("");
  })();

  // ── Materiales ────────────────────────────────────────────────────────────
  const secMateriales = (() => {
    const cats = [
      ["instalaciones",        "Instalaciones y mobiliario"],
      ["equipo",               "Equipo de apoyo"],
      ["materialesDidacticos", "Materiales didácticos"],
      ["humanos",              "Requerimientos humanos"],
      ["otros",                "Otros requerimientos"],
      ["seguridad",            "Salud / Seguridad"],
    ];
    const filas = cats.map(([k, label]) => {
      const val = mat[k];
      if (!val) return "";
      const arr = typeof val === "string" ? val.split("\n").map(s => s.trim()).filter(Boolean) : (val || []);
      if (!arr.length) return "";
      return `<tr>
        <td style="padding:5px 10px;font-weight:600;color:#64748b;vertical-align:top;
                   width:180px;border-bottom:1px solid #f1f5f9;">${label}</td>
        <td style="padding:5px 10px;border-bottom:1px solid #f1f5f9;">${_lista(arr)}</td>
      </tr>`;
    }).join("");
    return filas ? _tbl(filas) : _NA;
  })();

  const pctF = ev.pctFormativa ?? 0;
  const pctS = ev.pctSumativa  ?? 0;

  return [
    _sec("1. Datos del Curso", _tbl([
      _f("Nombre del curso",  d.nombreCurso),
      _f("Instructor",        d.instructor),
      _f("Diseñador",         d.disenador),
      _f("Lugar",             d.lugar),
      _f("Fecha",             d.fecha),
      _f("Duración",          d.duracion ? `${d.duracion} min` : ""),
      _f("Participantes",     d.participantes),
      _f("Perfil de egreso",  d.perfil),
    ].join(""))),

    _sec("2. Objetivos de Aprendizaje", _tbl([
      _f("Cognitivo",   obj.cognitiva),
      _f("Psicomotriz", obj.psicomotriz),
      _f("Afectivo",    obj.afectiva),
      _f("General",     obj.general),
    ].join(""))),

    _sec("3. Beneficios del Curso",
      p.beneficios ? _lista(p.beneficios) : _NA
    ),

    _sec("4. Temario", secTemario),

    _sec("5. Técnica Expositiva", _tbl([
      _f("Objetivo",     exp.objetivo),
      _f("Introducción", exp.introduccion),
      _f("Desarrollo",   exp.desarrollo),
      _f("Síntesis",     exp.sintesis),
    ].join(""))),

    _sec("6. Técnica Demostrativa", _tbl([
      _f("Objetivo",    dem.objetivo),
      _f("Experiencia", dem.experiencia),
      _f("Actividad",   dem.actividad),
      _f("Ejemplos",    dem.ejemplos),
    ].join(""))),

    _sec("7. Técnica de Diálogo / Discusión", _tbl([
      _f("Objetivo",      dia.objetivo),
      _f("Actividad",     dia.actividad),
      _f("Instrucciones", dia.instrucciones),
      _f("Conclusión",    dia.conclusion),
    ].join(""))),

    _sec("8. Cierre", _tbl([
      _f("Texto de cierre",         cie.texto),
      _f("Resumen",                 cie.resumen),
      _f("Compromisos de aplic.",   cie.compromisos),
      _f("Sugerencias continuidad", cie.sugerencias),
      _f("Referencias bibliogr.",   cie.referencias),
    ].join(""))),

    _sec("9. Evaluaciones", _tbl([
      _f("Diagnóstica (0%)",             ev.instDiagnostica,  true),
      _f(`Formativa (${pctF}%)`,         ev.instFormativa,    true),
      _f("Tipo instrumento formativa",   ev.tipoInstrumentoFormativa),
      _f(`Sumativa (${pctS}%)`,          ev.instSumativa,     true),
      _f("Reacción",                     ev.instReac,         true),
    ].join(""))),

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
