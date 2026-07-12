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

export function cargarMateriales() {
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
  window.guardarMateriales = guardarMateriales;
  window.cargarMateriales  = cargarMateriales;
}

export function getTemplate() {
  return `
      <section id="seccionMateriales" class="wizard-section hidden">
        <p class="paso-titulo">Paso 15B de 16</p>
        <h1>Revisión Final: Materiales</h1>

        <div class="card" style="max-width: 950px;">
          <p>
            Revisa que las siguientes actividades indiquen de manera correcta los materiales que se van a requerir.
            Puedes editarlos manualmente o usar los botones de IA para generarlos.
          </p>
          <p class="hint">
            💡 <strong>Paso 1:</strong> Usa el botón de abajo para generar los materiales de cada técnica.
            <strong>Paso 2:</strong> En la sección de clasificación, clasifícalos automáticamente en las categorías del EC0217.
          </p>

          <button type="button" id="btnGenerarTodosMateriales" class="btn-siguiente btn-ia" style="margin-bottom:8px;">
            ✨ Generar materiales de todas las técnicas
          </button>
          <div id="loaderTodosMateriales" style="display:none; margin-bottom:16px; font-size:13px; color:var(--c-text-3);">
            ⏳ Generando materiales con IA…
          </div>

          <hr style="margin:20px 0;">

          <div class="materiales-bloque">
            <div class="materiales-bloque-header"><h3>Técnica de Integración</h3></div>
            <div class="loader-materiales" id="loaderMat-integracion" style="display:none;">Generando materiales…</div>
            <textarea spellcheck="true" lang="es" id="mat-integracion" class="materiales-textarea" rows="5"
              placeholder="Los materiales de la técnica de integración aparecerán aquí tras la generación automática. También puedes escribirlos manualmente."></textarea>
          </div>

          <hr>

          <div class="materiales-bloque">
            <div class="materiales-bloque-header"><h3>Técnica Expositiva</h3></div>
            <div class="loader-materiales" id="loaderMat-expositiva" style="display:none;">Generando materiales…</div>
            <textarea spellcheck="true" lang="es" id="mat-expositiva" class="materiales-textarea" rows="5"
              placeholder="Los materiales de la técnica expositiva aparecerán aquí tras la generación automática. También puedes escribirlos manualmente."></textarea>
          </div>

          <hr>

          <div class="materiales-bloque">
            <div class="materiales-bloque-header"><h3>Técnica Demostrativa</h3></div>
            <div class="loader-materiales" id="loaderMat-demostrativa" style="display:none;">Generando materiales…</div>
            <textarea spellcheck="true" lang="es" id="mat-demostrativa" class="materiales-textarea" rows="5"
              placeholder="Los materiales de la técnica demostrativa aparecerán aquí tras la generación automática. También puedes escribirlos manualmente."></textarea>
          </div>

          <hr>

          <div class="materiales-bloque">
            <div class="materiales-bloque-header"><h3>Técnica Energizante</h3></div>
            <div class="loader-materiales" id="loaderMat-energizante" style="display:none;">Generando materiales…</div>
            <textarea spellcheck="true" lang="es" id="mat-energizante" class="materiales-textarea" rows="5"
              placeholder="Los materiales de la técnica energizante aparecerán aquí tras la generación automática. También puedes escribirlos manualmente."></textarea>
          </div>

          <hr>

          <div class="materiales-bloque">
            <div class="materiales-bloque-header"><h3>Técnica Diálogo/Discusión</h3></div>
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
