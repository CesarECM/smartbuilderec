    const BACKEND_URL = "https://ceecmweb.onrender.com";
    const EMOJIS_CURSOS = ["📋", "🎯", "💼", "🚀", "🏆", "📊", "🔬", "🎓"];

    // ── Actualizar navbar según sesión ────────────────────
    (async () => {
      const session = await getSession();
      if (session) {
        const meta = session.user?.user_metadata || {};
        const nombre = meta.nombre || session.user.email;
        const rol = meta.rol || "estudiante";
        const actionsEl = document.querySelector(".lp-nav-actions");
        actionsEl.innerHTML = `
          <span style="color:rgba(255,255,255,0.7);font-size:13px;">Hola, ${meta.nombre || nombre}</span>
          <a href="dashboard.html" class="btn-nav-login">Mi cuenta</a>
          ${rol === "instructor" || rol === "ce" ? '<a href="index.html" class="btn-nav-register">Wizard</a>' : '<a href="catalogo.html" class="btn-nav-register">Mis cursos</a>'}
        `;
      }
    })();

    // ── Cargar cursos destacados ──────────────────────────
    async function cargarCursos() {
      try {
        const res = await fetch(`${BACKEND_URL}/cursos`);
        if (!res.ok) return;
        const cursos = await res.json();
        const grid = document.getElementById("cursosGrid");

        const destacados = cursos.slice(0, 6);

        // Actualizar stat del hero
        document.getElementById("statCursos").textContent = cursos.length + "+";
        document.getElementById("statsCursos").textContent = cursos.length + "+";

        if (!destacados.length) {
          grid.innerHTML = `<p style="grid-column:1/-1;text-align:center;color:var(--c-text-3);padding:40px;">Próximamente habrá cursos disponibles.</p>`;
          return;
        }

        grid.innerHTML = destacados.map((c, i) => {
          const emoji = EMOJIS_CURSOS[i % EMOJIS_CURSOS.length];
          const instructor = c.profiles ? `${c.profiles.nombre || ""} ${c.profiles.apellido || ""}`.trim() : "";
          const precio = c.precio === 0 ? "Gratis" : `$${Number(c.precio).toLocaleString("es-MX")} MXN`;

          return `
            <div class="curso-card-lp">
              <div class="curso-thumb">
                ${c.imagen_url ? `<img src="${c.imagen_url}" alt="${c.titulo}">` : emoji}
                <div class="curso-badge">CEECM</div>
              </div>
              <div class="curso-card-body">
                <div class="curso-card-titulo">${c.titulo}</div>
                ${instructor ? `<div class="curso-card-instructor">${instructor}</div>` : ""}
                <div class="curso-card-meta">
                  <span class="estrellas">★★★★★</span>
                  ${c.duracion_horas ? `<span>⏱ ${c.duracion_horas}h</span>` : ""}
                </div>
              </div>
              <div class="curso-card-footer">
                <span class="curso-precio-lp">${precio}</span>
                <a href="catalogo.html" class="btn-ver-curso">Ver curso</a>
              </div>
            </div>
          `;
        }).join("");
      } catch (_) {
        // Si el backend no responde, los skeletons permanecen
      }
    }

    cargarCursos();
