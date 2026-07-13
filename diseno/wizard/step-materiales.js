// ─── wizard/step-materiales.js — Paso 16: Materiales y Requerimientos ────────

export function guardarMateriales() {
  const g = id => document.getElementById(id)?.value || "";
  const materiales = {
    integracion:          g("mat-integracion"),
    expositiva:           g("mat-expositiva"),
    demostrativa:         g("mat-demostrativa"),
    energizante:          g("mat-energizante"),
    dialogo:              g("mat-dialogo"),
    instalaciones:        g("req-instalaciones"),
    equipo:               g("req-equipo"),
    materialesDidacticos: g("req-materiales-didacticos"),
    humanos:              g("req-humanos"),
    otros:                g("req-otros"),
    seguridad:            g("req-seguridad"),
  };
  localStorage.setItem("ec0217_materiales", JSON.stringify(materiales));
}

const _FORMATOS_IND = [
  "Evaluación Diagnóstica",
  "Contrato de Aprendizaje",
  "Evaluación Formativa",
  "Evaluación Sumativa",
  "Evaluación de Reacción",
];

export function actualizarFormatosIndividuales() {
  const datos = JSON.parse(localStorage.getItem("ec0217_datos") || "{}");
  const n = parseInt(datos.participantes, 10) || 0;
  const label = n > 0 ? String(n) : "N";

  const badgeN  = document.getElementById("badge-n-participantes");
  const badgeFmt = document.getElementById("badge-participantes-fmt");
  if (badgeN)  badgeN.textContent  = label;
  if (badgeFmt) badgeFmt.textContent = label;

  const tbody = document.getElementById("tbody-formatos-ind");
  if (!tbody) return;

  const hojasAsistencia = n > 0 ? Math.ceil(n / 20) : "—";
  const filas = _FORMATOS_IND.map(nombre => ({ nombre, cantidad: n > 0 ? n : "—" }));
  filas.push({ nombre: "Lista de Asistencia (hojas)", cantidad: hojasAsistencia });

  tbody.innerHTML = filas.map((f, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"};">
      <td style="padding:8px 12px;border:1px solid #e2e8f0;">${f.nombre}</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center;font-weight:600;color:#1F3B6D;">${f.cantidad}</td>
      <td style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center;"><input type="checkbox" style="width:16px;height:16px;cursor:pointer;"></td>
    </tr>
  `).join("");
}

export function cargarMateriales() {
  actualizarFormatosIndividuales();
  const raw = localStorage.getItem("ec0217_materiales");
  if (!raw) return;
  try {
    const m = JSON.parse(raw);
    ["integracion","expositiva","demostrativa","energizante","dialogo"].forEach(t => {
      const el = document.getElementById(`mat-${t}`);
      if (el && m[t]) el.value = m[t];
    });
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

export function initStepMateriales() {
  window.guardarMateriales             = guardarMateriales;
  window.cargarMateriales              = cargarMateriales;
  window.actualizarFormatosIndividuales = actualizarFormatosIndividuales;
}

export function getTemplate() {
  return `
      <section id="seccionMateriales" class="wizard-section hidden">
        <p class="paso-titulo">Paso 15B de 16</p>
        <h1>Revisión Final: Materiales</h1>
        <button type="button" id="btnGenerarTodosMateriales" class="btn-ia" style="margin-bottom:8px;">✨ Generar todo con IA</button>
        <p style="font-size:13px;color:#666;margin:0 0 20px;">Solo rellena los campos vacíos. Si alguno ya tiene contenido te preguntará antes de continuar.</p>

        <div class="card" style="max-width: 950px;">
          <p>
            Revisa que las siguientes actividades indiquen de manera correcta los materiales que se van a requerir.
            Puedes editarlos manualmente o usar los botones de IA para generarlos.
          </p>
          <p class="hint">
            💡 Genera los materiales de cada técnica individualmente o usa el botón de arriba para generarlos todos.
            Luego clasifícalos automáticamente en las categorías del EC0217.
          </p>

          <hr style="margin:20px 0;">

          <div class="materiales-bloque">
            <div class="materiales-bloque-header" style="display:flex;justify-content:space-between;align-items:center;">
              <h3>Técnica de Integración</h3>
              <button type="button" class="btn-generar-materiales btn-ia" data-tecnica="integracion">✨ Generar con IA</button>
            </div>
            <div class="loader-materiales" id="loaderMat-integracion" style="display:none;">Generando materiales…</div>
            <textarea spellcheck="true" lang="es" id="mat-integracion" class="materiales-textarea" rows="5"
              placeholder="Los materiales de la técnica de integración aparecerán aquí tras la generación automática. También puedes escribirlos manualmente."></textarea>
          </div>

          <hr>

          <div class="materiales-bloque">
            <div class="materiales-bloque-header" style="display:flex;justify-content:space-between;align-items:center;">
              <h3>Técnica Expositiva</h3>
              <button type="button" class="btn-generar-materiales btn-ia" data-tecnica="expositiva">✨ Generar con IA</button>
            </div>
            <div class="loader-materiales" id="loaderMat-expositiva" style="display:none;">Generando materiales…</div>
            <textarea spellcheck="true" lang="es" id="mat-expositiva" class="materiales-textarea" rows="5"
              placeholder="Los materiales de la técnica expositiva aparecerán aquí tras la generación automática. También puedes escribirlos manualmente."></textarea>
          </div>

          <hr>

          <div class="materiales-bloque">
            <div class="materiales-bloque-header" style="display:flex;justify-content:space-between;align-items:center;">
              <h3>Técnica Demostrativa</h3>
              <button type="button" class="btn-generar-materiales btn-ia" data-tecnica="demostrativa">✨ Generar con IA</button>
            </div>
            <div class="loader-materiales" id="loaderMat-demostrativa" style="display:none;">Generando materiales…</div>
            <textarea spellcheck="true" lang="es" id="mat-demostrativa" class="materiales-textarea" rows="5"
              placeholder="Los materiales de la técnica demostrativa aparecerán aquí tras la generación automática. También puedes escribirlos manualmente."></textarea>
          </div>

          <hr>

          <div class="materiales-bloque">
            <div class="materiales-bloque-header" style="display:flex;justify-content:space-between;align-items:center;">
              <h3>Técnica Energizante</h3>
              <button type="button" class="btn-generar-materiales btn-ia" data-tecnica="energizante">✨ Generar con IA</button>
            </div>
            <div class="loader-materiales" id="loaderMat-energizante" style="display:none;">Generando materiales…</div>
            <textarea spellcheck="true" lang="es" id="mat-energizante" class="materiales-textarea" rows="5"
              placeholder="Los materiales de la técnica energizante aparecerán aquí tras la generación automática. También puedes escribirlos manualmente."></textarea>
          </div>

          <hr>

          <div class="materiales-bloque">
            <div class="materiales-bloque-header" style="display:flex;justify-content:space-between;align-items:center;">
              <h3>Técnica Diálogo/Discusión</h3>
              <button type="button" class="btn-generar-materiales btn-ia" data-tecnica="dialogo">✨ Generar con IA</button>
            </div>
            <div class="loader-materiales" id="loaderMat-dialogo" style="display:none;">Generando materiales…</div>
            <textarea spellcheck="true" lang="es" id="mat-dialogo" class="materiales-textarea" rows="5"
              placeholder="Los materiales de la técnica diálogo/discusión aparecerán aquí tras la generación automática. También puedes escribirlos manualmente."></textarea>
          </div>

          <hr>

          <div id="seccion-clasificacion">
            <h2 style="margin-bottom:6px;">Clasificación de requerimientos</h2>
            <p class="hint" style="margin-bottom:18px;">
              Toma el texto de cada técnica (generado arriba) y lo clasifica automáticamente en las
              6 categorías oficiales del EC0217. Esta información poblará directamente la
              <strong>Lista de Verificación de Requerimientos</strong>.
            </p>

            <button type="button" id="btnGenerarClasificacion" class="btn-siguiente btn-ia">
              ✨ Clasificar materiales por categoría
            </button>
            <div id="loaderClasificacion" style="display:none; margin-top:12px; font-size:14px; color:var(--c-text-3);">
              ⏳ Clasificando materiales con IA…
            </div>

            <div style="margin-top:24px; display:flex; flex-direction:column; gap:18px;">
              <div class="form-group full-width">
                <label for="req-instalaciones">Instalaciones, mobiliario y su distribución</label>
                <textarea spellcheck="true" lang="es" id="req-instalaciones" rows="5"
                  placeholder="Ej: • Aula con iluminación adecuada&#10;• Mesas y sillas para los participantes&#10;• Pintarrón"></textarea>
              </div>
              <div class="form-group full-width">
                <label for="req-equipo">Equipo de apoyo</label>
                <textarea spellcheck="true" lang="es" id="req-equipo" rows="5"
                  placeholder="Ej: • Laptop del instructor&#10;• Proyector&#10;• Pantalla o pared blanca&#10;• Extensión eléctrica"></textarea>
              </div>
              <div class="form-group full-width">
                <label for="req-materiales-didacticos">Materiales didácticos de apoyo y servicios</label>
                <span id="badge-mat-participantes" style="display:inline-flex;align-items:center;gap:5px;background:#e0e7ff;color:#3730a3;border-radius:6px;padding:3px 10px;font-size:12px;font-weight:600;margin-bottom:8px;">
                  × <span id="badge-n-participantes">N</span> participantes — multiplica los ítems individuales por esta cantidad
                </span>
                <textarea spellcheck="true" lang="es" id="req-materiales-didacticos" rows="5"
                  placeholder="Ej: • Hojas blancas (1 por participante)&#10;• Bolígrafos&#10;• Manual del participante"></textarea>
              </div>
              <div class="form-group full-width">
                <label for="req-humanos">Requerimientos humanos</label>
                <textarea spellcheck="true" lang="es" id="req-humanos" rows="4"
                  placeholder="Ej: • Instructor certificado&#10;• Participantes registrados"></textarea>
              </div>
              <div class="form-group full-width">
                <label for="req-otros">Otros requerimientos</label>
                <textarea spellcheck="true" lang="es" id="req-otros" rows="4"
                  placeholder="Materiales especiales de las dinámicas que no entran en las otras categorías."></textarea>
              </div>
              <div class="form-group full-width">
                <label for="req-seguridad">Material y equipo para medidas de salud / seguridad / higiene / protección civil</label>
                <textarea spellcheck="true" lang="es" id="req-seguridad" rows="4"
                  placeholder="Ej: • Botiquín de primeros auxilios&#10;• Señalización de salidas de emergencia&#10;• Gel antibacterial"></textarea>
              </div>
            </div>
          </div>

          <hr>

          <div id="seccion-formatos-individuales">
            <h2 style="margin-bottom:6px;">Formatos individuales por participante</h2>
            <p class="hint" style="margin-bottom:16px;">
              Con <strong id="badge-participantes-fmt">—</strong> participantes registrados en el Paso 1,
              necesitarás preparar estas impresiones antes del curso.
            </p>
            <div style="overflow-x:auto;">
              <table style="width:100%;border-collapse:collapse;font-size:13px;">
                <thead>
                  <tr style="background:#f0f4fb;">
                    <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:left;">Formato</th>
                    <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center;width:110px;">Copias</th>
                    <th style="padding:8px 12px;border:1px solid #e2e8f0;text-align:center;width:80px;">¿Listo?</th>
                  </tr>
                </thead>
                <tbody id="tbody-formatos-ind"></tbody>
              </table>
            </div>
          </div>

          <hr>

          <span class="error-msg" id="err-materiales">
            Completa los materiales de al menos una técnica antes de continuar.
          </span>

          <button class="btn-siguiente" id="btnGuardarMateriales">
            Siguiente
          </button>
        </div>
      </section>
  `;
}
