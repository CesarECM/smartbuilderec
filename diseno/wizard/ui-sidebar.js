// ─── wizard/ui-sidebar.js — Sidebar colapsable, menú hamburguesa y template ───

export function getSidebarHTML() {
  return `
      <div class="logo-container">
        <img src="img/ECM%20blanco%20sin%20fondo.png" alt="Logo CEECM" class="logo-img">
      </div>

      <div id="sbe-sidebar-status" style="padding:8px 14px;border-bottom:1px solid rgba(255,255,255,0.07);">
        <div id="sbe-sync-status" style="display:flex;align-items:center;gap:6px;font-size:11px;color:rgba(255,255,255,0.5);margin-bottom:6px;">
          <span id="sbe-sync-icon">☁️</span>
          <span id="sbe-sync-text">Sincronizado</span>
        </div>
        <div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
          <div style="flex:1;height:4px;background:rgba(255,255,255,0.1);border-radius:2px;overflow:hidden;">
            <div id="sbe-progress-bar" style="height:100%;width:0%;background:#4ade80;border-radius:2px;transition:width 0.4s ease;"></div>
          </div>
          <span id="sbe-progress-label" style="font-size:10px;color:rgba(255,255,255,0.4);white-space:nowrap;">0 / 16</span>
        </div>
        <div style="display:flex;align-items:center;justify-content:space-between;">
          <span style="font-size:10px;color:rgba(255,255,255,0.35);">Navegación libre</span>
          <button id="btnModoLibre" title="Permite saltar a cualquier sección sin completar las anteriores"
            style="font-size:10px;padding:2px 8px;border-radius:10px;border:1px solid rgba(255,255,255,0.2);background:rgba(255,255,255,0.05);color:rgba(255,255,255,0.4);cursor:pointer;font-family:inherit;transition:all 0.2s;">
            OFF
          </button>
        </div>
      </div>

      <button id="btnFocusMode" title="Ocultar/mostrar barra lateral">⬅ Modo Focus</button>

      <nav class="menu">
        <ul class="nav-grupos">

          <li class="nav-grupo">
            <div class="nav-grupo-header" data-grupo="planeacion">
              <span>📋 Planeación</span>
              <span class="nav-grupo-arrow">▾</span>
            </div>
            <ul class="nav-grupo-items open">
              <li id="nav-datos" class="nav-item active">Datos del curso</li>
              <li id="nav-objetivos" class="nav-item">Objetivos</li>
              <li id="nav-beneficios" class="nav-item disabled" data-prereq="Completa «Objetivos» primero">Beneficios</li>
              <li id="nav-temario" class="nav-item disabled" data-prereq="Completa «Beneficios» primero">Temario</li>
            </ul>
          </li>

          <li class="nav-grupo">
            <div class="nav-grupo-header" data-grupo="encuadre">
              <span>🔲 Encuadre</span>
              <span class="nav-grupo-arrow">▾</span>
            </div>
            <ul class="nav-grupo-items open">
              <li id="nav-integracion" class="nav-item disabled" data-prereq="Completa «Temario» primero">Técnica de integración</li>
              <li id="nav-preguntas" class="nav-item disabled" data-prereq="Completa «Integración grupal» primero">Preguntas</li>
              <li id="nav-reglas" class="nav-item disabled" data-prereq="Completa «Preguntas de experiencia» primero">Reglas</li>
              <li id="nav-contrato" class="nav-item disabled" data-prereq="Completa «Reglas del curso» primero">Contrato de aprendizaje</li>
            </ul>
          </li>

          <li class="nav-grupo">
            <div class="nav-grupo-header" data-grupo="desarrollo">
              <span>⚙️ Desarrollo</span>
              <span class="nav-grupo-arrow">▾</span>
            </div>
            <ul class="nav-grupo-items open">
              <li id="nav-expositiva" class="nav-item disabled" data-prereq="Completa «Contrato de aprendizaje» primero">Técnica expositiva</li>
              <li id="nav-demostrativa" class="nav-item disabled" data-prereq="Completa «Técnica expositiva» primero">Técnica demostrativa</li>
              <li id="nav-energizante" class="nav-item disabled" data-prereq="Completa «Técnica demostrativa» primero">Técnica energizante</li>
              <li id="nav-dialogo" class="nav-item disabled" data-prereq="Completa «Técnica energizante» primero">Técnica diálogo/discusión</li>
            </ul>
          </li>

          <li class="nav-grupo">
            <div class="nav-grupo-header" data-grupo="cierre">
              <span>🏁 Cierre</span>
              <span class="nav-grupo-arrow">▾</span>
            </div>
            <ul class="nav-grupo-items open">
              <li id="nav-cierre" class="nav-item disabled" data-prereq="Completa «Técnica de diálogo» primero">Cierre</li>
            </ul>
          </li>

          <li class="nav-grupo">
            <div class="nav-grupo-header" data-grupo="evaluaciones">
              <span>📊 Evaluaciones</span>
              <span class="nav-grupo-arrow">▾</span>
            </div>
            <ul class="nav-grupo-items open">
              <li id="nav-evaluaciones" class="nav-item disabled" data-prereq="Completa «Cierre del curso» primero">Evaluaciones</li>
            </ul>
          </li>

          <li class="nav-grupo">
            <div class="nav-grupo-header" data-grupo="revision">
              <span>✅ Revisión Final</span>
              <span class="nav-grupo-arrow">▾</span>
            </div>
            <ul class="nav-grupo-items open">
              <li id="nav-tiempos" class="nav-item disabled" data-prereq="Completa «Evaluaciones» primero">Tiempos</li>
              <li id="nav-materiales" class="nav-item disabled" data-prereq="Completa «Tiempos del curso» primero">Materiales</li>
            </ul>
          </li>

          <li class="nav-grupo">
            <div class="nav-grupo-header" data-grupo="formatos">
              <span>📄 Formatos adicionales</span>
              <span class="nav-grupo-arrow">▾</span>
            </div>
            <ul class="nav-grupo-items open">
              <li id="nav-formatos" class="nav-item disabled" data-prereq="Completa «Lista de materiales» primero">Formatos</li>
            </ul>
          </li>

        </ul>
      </nav>
  `;
}

/** Abre el grupo del sidebar que contiene el nav-item activo */
export function abrirGrupoActivo() {
  const activo = document.querySelector(".nav-item.active");
  if (!activo) return;
  const grupo = activo.closest(".nav-grupo-items");
  if (grupo) {
    grupo.classList.add("open");
    grupo.classList.remove("closed");
    const arrow = grupo.previousElementSibling?.querySelector(".nav-grupo-arrow");
    if (arrow) arrow.textContent = "▾";
  }
}

/** Registra listeners del sidebar y hamburguesa; expone abrirGrupoActivo en window */
export function initSidebar() {
  document.querySelectorAll(".nav-grupo-header").forEach(header => {
    header.addEventListener("click", () => {
      const items = header.nextElementSibling;
      const arrow = header.querySelector(".nav-grupo-arrow");
      const isOpen = items.classList.contains("open");
      items.classList.toggle("open", !isOpen);
      items.classList.toggle("closed", isOpen);
      arrow.textContent = isOpen ? "▸" : "▾";
    });
  });

  const menuToggle = document.getElementById("menuToggle");
  const sidebar    = document.getElementById("sidebar");
  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => sidebar.classList.toggle("active"));
  }

  window.abrirGrupoActivo = abrirGrupoActivo;
}
