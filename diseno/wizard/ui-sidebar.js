// ─── wizard/ui-sidebar.js — Sidebar colapsable y menú hamburguesa ─────────────

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
