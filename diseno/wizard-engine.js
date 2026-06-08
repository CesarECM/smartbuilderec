/**
 * SmartBuilderEC — Motor Genérico de Wizards (Sprint 4)
 * Lee un JSON schema desde Supabase y renderiza el wizard completo.
 * URL: /diseno/wizard-engine.html?norma=ec0217[&instancia=<uuid>]
 */

const API = window.SBE_API || "https://smartbuilderec.onrender.com";
const SAVE_DEBOUNCE_MS = 2000;

// Endpoints de doc-generation que SÍ existen en el backend de producción
const DOC_ENDPOINTS = {
  ec0217: `${API}/generate-doc/planeacion`,
  ec0301: `${API}/generate-doc/ec0301`,
};

const Engine = {
  schema:     null,
  normaId:    null,
  instanciaId:null,
  datos:      {},
  pasoActual: null,
  saveTimer:  null,
  _guardando: false,

  // ── Entrada ──────────────────────────────────────────────────────────────

  async init() {
    const session = await authGuard(["user", "admin", "super_admin", "editor"]);
    if (!session) return;

    const params    = new URLSearchParams(location.search);
    this.normaId    = params.get("norma");
    this.instanciaId= params.get("instancia") || null;

    if (!this.normaId) {
      document.getElementById("wiz-content").innerHTML =
        '<p style="color:#dc2626;font-weight:600;">Parámetro ?norma= requerido en la URL.</p>';
      return;
    }

    this._mostrarLoading("Cargando wizard...");
    try {
      await this._cargarSchema();
      await this._cargarOCrearInstancia();
      this._renderTopbar();
      this._renderSidebar();
      this._navegarA(this.datos._pasoActual || this._primerPaso());
    } catch (e) {
      this._toast("Error al cargar: " + e.message, true);
    } finally {
      this._ocultarLoading();
    }
  },

  // ── Schema y datos (Supabase directo — sin depender del backend) ─────────

  async _cargarSchema() {
    const { data, error } = await _supabase
      .from("wizard_schemas")
      .select("esquema")
      .eq("norma_id", this.normaId)
      .eq("activo", true)
      .single();

    if (error || !data) {
      throw new Error(
        `Schema no encontrado para "${this.normaId}". ` +
        `Verifica que se ejecutó migration_motor_wizards.sql y seed_wizard_schemas.sql en Supabase.`
      );
    }
    this.schema = data.esquema;
  },

  async _cargarOCrearInstancia() {
    if (this.instanciaId) {
      const { data, error } = await _supabase
        .from("wizard_instancias")
        .select("*")
        .eq("id", this.instanciaId)
        .single();

      if (error || !data) throw new Error("Instancia no encontrada");
      this.datos             = data.datos || {};
      this.datos._pasoActual = data.paso_actual || "";
      if (data.assigned_by) {
        document.getElementById("wiz-assigned-banner").style.display = "block";
        document.getElementById("wiz-main").style.marginTop = "84px";
      }
    } else {
      const { data: { user } } = await _supabase.auth.getUser();
      const nombre = this.schema.meta?.nombre || this.normaId;

      const { data, error } = await _supabase
        .from("wizard_instancias")
        .insert({
          norma_id:   this.normaId,
          user_id:    user.id,
          nombre:     "Nueva planeación — " + nombre,
          datos:      {},
          paso_actual: "",
        })
        .select()
        .single();

      if (error) throw new Error("No se pudo crear la planeación: " + error.message);
      this.instanciaId = data.id;
      this.datos       = {};
      history.replaceState({}, "", `?norma=${this.normaId}&instancia=${data.id}`);
    }
  },

  // ── Topbar ───────────────────────────────────────────────────────────────

  _renderTopbar() {
    const meta = this.schema.meta || {};
    document.title = `${meta.codigo || this.normaId} — SmartBuilderEC`;
    document.getElementById("wiz-topbar").style.background = meta.color_header || "#1F3B6D";
    document.getElementById("wiz-topbar-norma").textContent = meta.codigo || this.normaId.toUpperCase();
    document.getElementById("wiz-topbar-titulo").textContent = this.datos.nombreCurso || "Nueva planeación";
  },

  _actualizarTituloTopbar() {
    const titulo = this.datos.nombreCurso || "Nueva planeación";
    document.getElementById("wiz-topbar-titulo").textContent = titulo;
  },

  // ── Sidebar ──────────────────────────────────────────────────────────────

  _renderSidebar() {
    const normaLabel = document.getElementById("wiz-sidebar-norma-label");
    normaLabel.textContent = this.schema.meta?.codigo || this.normaId.toUpperCase();

    const container = document.getElementById("wiz-sidebar-content");
    container.innerHTML = "";

    (this.schema.secciones || []).forEach(sec => {
      const grupo = document.createElement("div");
      grupo.className = "wiz-sidebar-grupo";

      const header = document.createElement("div");
      header.className = "wiz-sidebar-grupo-hdr";
      header.innerHTML = `
        <span>${sec.icono || "📄"}</span>
        <span style="flex:1">${sec.titulo}</span>
        <span class="wiz-sidebar-grupo-arrow open">▾</span>
      `;
      const items = document.createElement("div");
      items.className = "wiz-sidebar-grupo-items open";

      header.addEventListener("click", () => {
        const isOpen = items.classList.contains("open");
        items.classList.toggle("open", !isOpen);
        items.classList.toggle("closed", isOpen);
        header.querySelector(".wiz-sidebar-grupo-arrow").classList.toggle("open", !isOpen);
      });

      (sec.pasos || []).forEach(paso => {
        const a = document.createElement("div");
        a.className = "wiz-sidebar-item";
        a.dataset.paso = paso.id;
        a.innerHTML = `
          <span class="wiz-paso-num">${paso.numero || "·"}</span>
          <span>${paso.titulo}</span>
        `;
        a.addEventListener("click", () => this._navegarA(paso.id));
        items.appendChild(a);
      });

      grupo.appendChild(header);
      grupo.appendChild(items);
      container.appendChild(grupo);
    });

    this._actualizarSidebarEstado();
  },

  _actualizarSidebarEstado() {
    document.querySelectorAll(".wiz-sidebar-item").forEach(el => {
      const pasoId = el.dataset.paso;
      el.classList.remove("active", "completed", "locked");
      if (pasoId === this.pasoActual) {
        el.classList.add("active");
      } else if (this.datos[`_completado_${pasoId}`]) {
        el.classList.add("completed");
      }
    });
  },

  // ── Navegación ───────────────────────────────────────────────────────────

  _primerPaso() {
    for (const sec of (this.schema.secciones || [])) {
      if (sec.pasos?.length) return sec.pasos[0].id;
    }
    return null;
  },

  _todosLosPasos() {
    const pasos = [];
    (this.schema.secciones || []).forEach(sec => {
      (sec.pasos || []).forEach(p => pasos.push(p));
    });
    return pasos;
  },

  _buscarPaso(pasoId) {
    for (const sec of (this.schema.secciones || [])) {
      const p = (sec.pasos || []).find(p => p.id === pasoId);
      if (p) return p;
    }
    return null;
  },

  _pasosAdyacentes(pasoId) {
    const todos = this._todosLosPasos();
    const idx   = todos.findIndex(p => p.id === pasoId);
    return {
      prev: idx > 0 ? todos[idx - 1] : null,
      next: idx < todos.length - 1 ? todos[idx + 1] : null,
    };
  },

  _navegarA(pasoId) {
    if (!pasoId) return;
    this.pasoActual = pasoId;
    this.datos._pasoActual = pasoId;

    const paso = this._buscarPaso(pasoId);
    if (!paso) return;

    this._renderPaso(paso);
    this._actualizarSidebarEstado();
    document.getElementById("wiz-main").scrollTo(0, 0);
    window.scrollTo(0, 0);

    // Guardar paso actual sin debounce
    this._guardarPatch({ paso_actual: pasoId });
  },

  // ── Render de pasos ──────────────────────────────────────────────────────

  _renderPaso(paso) {
    const { prev, next } = this._pasosAdyacentes(paso.id);
    const content = document.getElementById("wiz-content");

    let html = `
      <p class="wiz-paso-label">Paso ${paso.numero || "–"} de ${this._todosLosPasos().length}</p>
      <h1 class="wiz-paso-titulo">${paso.titulo}</h1>
    `;

    if (paso.tipo_especial) {
      html += this._renderEspecial(paso);
    } else {
      html += `<div class="wiz-card"><div class="wiz-form-grid">${
        (paso.campos || []).map(c => this._renderCampo(c)).join("")
      }</div></div>`;
    }

    // Botones de navegación
    html += `<div class="wiz-nav-btns">`;
    if (prev) html += `<button class="wiz-btn-prev" onclick="Engine._navegarA('${prev.id}')">← ${prev.titulo}</button>`;
    if (next) html += `<button class="wiz-btn-next" onclick="Engine._navegarA('${next.id}')">${next.titulo} →</button>`;
    html += `</div>`;

    content.innerHTML = html;
    this._activarCampos(paso);
  },

  // ── Renderizadores de campos genéricos ───────────────────────────────────

  _renderCampo(campo) {
    const cls = campo.full_width ? "wiz-field full" : "wiz-field";
    const req  = campo.requerido ? " *" : "";
    let inner  = "";

    switch (campo.tipo) {
      case "text":
        inner = `<input type="text" class="wiz-input" id="wf_${campo.id}"
          data-field="${campo.id}" placeholder="${campo.placeholder || ""}"
          value="${this._esc(this.datos[campo.id] || "")}">`;
        break;

      case "date":
        inner = `<input type="date" class="wiz-input" id="wf_${campo.id}"
          data-field="${campo.id}" value="${this._esc(this.datos[campo.id] || "")}">`;
        break;

      case "number":
        inner = `<input type="number" class="wiz-input" id="wf_${campo.id}"
          data-field="${campo.id}"
          ${campo.min !== undefined ? `min="${campo.min}"` : ""}
          ${campo.max !== undefined ? `max="${campo.max}"` : ""}
          placeholder="${campo.placeholder || ""}"
          value="${this.datos[campo.id] ?? ""}">`;
        break;

      case "textarea":
        inner = `<textarea class="wiz-textarea" id="wf_${campo.id}"
          data-field="${campo.id}" rows="${campo.rows || 5}"
          placeholder="${campo.placeholder || ""}">${this._esc(this.datos[campo.id] || "")}</textarea>`;
        if (campo.ai?.activo) {
          inner += `<button class="wiz-btn-ia" data-ai-field="${campo.id}">${campo.ai.boton_label || "✨ Generar con IA"}</button>`;
        }
        break;

      case "list":
        inner = this._renderList(campo);
        break;

      default:
        inner = `<input type="text" class="wiz-input" id="wf_${campo.id}" data-field="${campo.id}" value="${this._esc(this.datos[campo.id] || "")}">`;
    }

    const hint  = campo.hint  ? `<span class="wiz-hint">${campo.hint}</span>` : "";
    const error = campo.requerido ? `<span class="wiz-error">Este campo es requerido.</span>` : "";

    return `<div class="${cls}" data-fieldid="${campo.id}">
      <label class="wiz-label" for="wf_${campo.id}">${campo.label}${req}</label>
      ${inner}${hint}${error}
    </div>`;
  },

  _renderList(campo) {
    const items = Array.isArray(this.datos[campo.id]) ? this.datos[campo.id] : [];
    const ph    = campo.placeholder_item || "Escribe aquí...";
    let html    = `<div class="wiz-list" data-listfield="${campo.id}">`;
    items.forEach((item, i) => {
      html += `<div class="wiz-list-row">
        <input type="text" class="wiz-input wiz-list-input" placeholder="${ph}" value="${this._esc(item)}" data-listidx="${i}">
        <button type="button" class="wiz-list-del" onclick="Engine._listDel('${campo.id}',${i})">✕</button>
      </div>`;
    });
    html += `</div>
      <button type="button" class="wiz-list-add" onclick="Engine._listAdd('${campo.id}','${ph}')">+ Agregar</button>`;
    if (campo.ai?.activo) {
      html += `<button class="wiz-btn-ia" data-ai-field="${campo.id}" data-ai-target-list="${campo.id}">${campo.ai.boton_label || "✨ Generar con IA"}</button>`;
    }
    return html;
  },

  // ── Renderers especiales ─────────────────────────────────────────────────

  _renderEspecial(paso) {
    switch (paso.tipo_especial) {
      case "objetivos_tabs":    return this._renderObjetivosTabs(paso);
      case "temario_unidades":  return this._renderTemarioUnidades(paso);
      case "evaluaciones_block":return this._renderEvaluacionesBlock(paso);
      case "tiempos_block":     return this._renderTiemposBlock(paso);
      case "formatos_block":    return this._renderFormatosBlock(paso);
      case "tecnica_card":      return this._renderTecnicaCard(paso);
      default:
        return `<div class="wiz-card"><div class="wiz-form-grid">${(paso.campos||[]).map(c=>this._renderCampo(c)).join("")}</div></div>`;
    }
  },

  _renderObjetivosTabs(paso) {
    const campos = paso.campos || [];
    let tabs = `<div class="wiz-obj-tabs">`;
    campos.forEach((c, i) => {
      const done = this.datos[c.id] ? " done" : "";
      tabs += `<button class="wiz-obj-tab${i===0?" active":""}${done}" onclick="Engine._objTab('${paso.id}',${i})">${c.label}</button>`;
    });
    tabs += `</div>`;

    let panels = "";
    campos.forEach((c, i) => {
      const ph  = c.placeholder || "";
      const val = this._esc(this.datos[c.id] || "");
      const ai  = c.ai?.activo ? `<button class="wiz-btn-ia" data-ai-field="${c.id}">${c.ai.boton_label || "✨ Generar con IA"}</button>` : "";
      panels += `<div class="wiz-obj-panel${i===0?" active":""}" data-objpanel="${i}" data-pasoobj="${paso.id}">
        <div class="wiz-card">
          <div class="wiz-field full">
            <label class="wiz-label">${c.label} *</label>
            <textarea class="wiz-textarea" id="wf_${c.id}" data-field="${c.id}" rows="6" placeholder="${ph}">${val}</textarea>
            ${ai}
          </div>
        </div>
      </div>`;
    });

    return tabs + panels;
  },

  _objTab(pasoId, idx) {
    document.querySelectorAll(`[data-pasoobj="${pasoId}"]`).forEach((el, i) => {
      el.classList.toggle("active", i === idx);
    });
    document.querySelectorAll(".wiz-obj-tab").forEach((el, i) => {
      el.classList.toggle("active", i === idx);
    });
  },

  _renderTemarioUnidades(paso) {
    const campos = paso.campos || [];
    let html = `<div class="wiz-temario-grid">`;
    for (let u = 1; u <= 3; u++) {
      const tituloC = campos.find(c => c.id === `temario_u${u}_titulo`);
      const listaC  = campos.find(c => c.id === `temario_u${u}`);
      html += `<div class="wiz-temario-unit">
        <h4>Unidad ${u}</h4>`;
      if (tituloC) html += `<div class="wiz-field" style="margin-bottom:10px">
          <label class="wiz-label">${tituloC.label}</label>
          ${this._renderInputInline(tituloC)}
        </div>`;
      if (listaC) html += `<div class="wiz-field full">
          <label class="wiz-label">${listaC.label}</label>
          ${this._renderList(listaC)}
        </div>`;
      html += `</div>`;
    }
    return html + `</div>`;
  },

  _renderEvaluacionesBlock(paso) {
    const campos = paso.campos || [];
    const grupos = [
      { titulo: "Diagnóstica", ids: ["pctDiagnostica","instDiagnostica"] },
      { titulo: "Formativa",   ids: ["pctFormativa","tipoInstrumentoFormativa","instFormativa"] },
      { titulo: "Sumativa + Reacción", ids: ["pctSumativa","instSumativa","instReac"] },
    ];
    let html = `<div class="wiz-eval-grid">`;
    grupos.forEach(g => {
      html += `<div class="wiz-eval-card"><h4>${g.titulo}</h4>`;
      g.ids.forEach(id => {
        const c = campos.find(c => c.id === id);
        if (c) html += `<div class="wiz-field" style="margin-bottom:12px">${this._renderCampo(c)}</div>`;
      });
      html += `</div>`;
    });
    return html + `</div>`;
  },

  _renderTecnicaCard(paso) {
    return `<div class="wiz-card"><div class="wiz-form-grid">${(paso.campos||[]).map(c=>this._renderCampo(c)).join("")}</div></div>`;
  },

  _renderTiemposBlock(paso) {
    const secciones = this._todosLosPasos()
      .filter(p => p.id !== "tiempos" && p.id !== "formatos")
      .map(p => ({ id: p.id, titulo: p.titulo }));

    const tiemposBloques = this.datos.tiempos_bloques || [];

    let html = `<div class="wiz-card">
      <p style="font-size:13px;color:var(--c-text-2);margin-bottom:16px">
        Distribuye los ${this.datos.duracion || "N/A"} minutos del curso entre las secciones.
        El total debe ser igual o mayor a ${this.schema.meta?.min_duracion || 120} minutos.
      </p>
      <table class="wiz-tiempos-table">
        <thead><tr><th>Sección</th><th>Minutos</th></tr></thead>
        <tbody>`;

    secciones.forEach(sec => {
      const bloque = tiemposBloques.find(b => b.seccion === sec.id);
      const min    = bloque?.tiempo || 0;
      html += `<tr>
        <td>${sec.titulo}</td>
        <td><input type="number" class="wiz-input" min="0" style="width:80px"
          data-tiempos-sec="${sec.id}" value="${min}" oninput="Engine._tiemposChange()"></td>
      </tr>`;
    });

    html += `</tbody>
        <tfoot><tr>
          <td style="font-weight:700;padding:8px 12px">Total</td>
          <td style="padding:8px 12px" class="wiz-tiempos-total" id="wiz-tiempos-total">0 min</td>
        </tr></tfoot>
      </table>
      <div class="wiz-tiempos-status" id="wiz-tiempos-status"></div>
    </div>`;

    setTimeout(() => this._tiemposChange(), 50);
    return html;
  },

  _tiemposChange() {
    const inputs = document.querySelectorAll("[data-tiempos-sec]");
    let total = 0;
    const bloques = [];
    inputs.forEach(inp => {
      const t = parseInt(inp.value) || 0;
      total += t;
      bloques.push({ seccion: inp.dataset.tiemposSec, tiempo: t });
    });
    const minReq = this.schema.meta?.min_duracion || 120;
    const totalEl  = document.getElementById("wiz-tiempos-total");
    const statusEl = document.getElementById("wiz-tiempos-status");
    if (totalEl) totalEl.textContent = total + " min";
    if (statusEl) {
      if (total >= minReq) {
        statusEl.className = "wiz-tiempos-status ok";
        statusEl.textContent = `✓ Cumple el mínimo de ${minReq} minutos.`;
      } else {
        statusEl.className = "wiz-tiempos-status err";
        statusEl.textContent = `✗ Faltan ${minReq - total} minutos para cumplir el mínimo.`;
      }
    }
    this.datos.tiempos_bloques = bloques;
    this._scheduleSave();
  },

  _renderFormatosBlock(paso) {
    const docs = this.schema.documentos || [];
    if (!docs.length) {
      return `<div class="wiz-card"><p style="color:var(--c-text-3);font-size:14px">
        No hay documentos definidos en el schema de esta norma.</p></div>`;
    }

    const cards = docs.map(d => {
      const tieneTemplate = !!d.template_path;
      const badge = tieneTemplate
        ? `<span style="background:#dcfce7;color:#166534;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;margin-bottom:6px;display:inline-block">✓ Template listo</span>`
        : `<span style="background:#fef3c7;color:#92400e;font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;margin-bottom:6px;display:inline-block">⚠ Sin template</span>`;
      const btnStyle = tieneTemplate
        ? `style="margin-top:8px;width:100%;justify-content:center"`
        : `style="margin-top:8px;width:100%;justify-content:center;opacity:0.45;cursor:not-allowed" disabled`;
      const title = tieneTemplate ? "" : `title="Sube un template .docx desde el editor"`;
      return `<div class="wiz-formato-card">
        <span class="wiz-formato-tipo">${d.formato.toUpperCase()}</span>
        <span class="wiz-formato-nombre">${d.nombre}</span>
        ${badge}
        <button class="wiz-btn-ia" ${btnStyle} ${title}
          onclick="Engine._generarDocumento('${d.id}')">
          📥 Descargar
        </button>
      </div>`;
    }).join("");

    const tieneEndpointLegacy = !!DOC_ENDPOINTS[this.normaId];
    const legacyBtn = tieneEndpointLegacy
      ? `<button class="wiz-btn-generar-todo" onclick="Engine.generarDocumentos()" style="margin-bottom:20px">
           📦 Descargar paquete completo (generadores originales)
         </button>`
      : "";

    return `<div class="wiz-card">
      <p style="font-size:14px;color:var(--c-text-2);margin-bottom:16px">
        Descarga cada documento individualmente usando su template,
        o el paquete completo con los generadores originales.
      </p>
      ${legacyBtn}
      <div class="wiz-formatos-grid">${cards}</div>
    </div>`;
  },

  _renderInputInline(campo) {
    return `<input type="text" class="wiz-input" id="wf_${campo.id}" data-field="${campo.id}"
      placeholder="${campo.placeholder||""}" value="${this._esc(this.datos[campo.id]||"")}">`;
  },

  // ── Activación de eventos (después de insertar HTML) ────────────────────

  _activarCampos(paso) {
    // inputs / textareas → guardar en datos
    document.querySelectorAll("[data-field]").forEach(el => {
      const key = el.dataset.field;
      const save = () => {
        this.datos[key] = el.value;
        if (key === "nombreCurso") this._actualizarTituloTopbar();
        this._scheduleSave();
      };
      el.addEventListener("input", save);
      el.addEventListener("change", save);
    });

    // Listas: delegar en inputs dentro de .wiz-list
    document.querySelectorAll(".wiz-list").forEach(listEl => {
      const field = listEl.dataset.listfield;
      listEl.addEventListener("input", e => {
        if (e.target.classList.contains("wiz-list-input")) {
          this._sincronizarLista(field);
        }
      });
    });

    // Botones IA
    document.querySelectorAll(".wiz-btn-ia").forEach(btn => {
      btn.addEventListener("click", () => this._generarConIA(btn, paso));
    });
  },

  // ── Listas dinámicas ─────────────────────────────────────────────────────

  _listAdd(fieldId, placeholder) {
    const listEl = document.querySelector(`[data-listfield="${fieldId}"]`);
    if (!listEl) return;
    const items = Array.isArray(this.datos[fieldId]) ? this.datos[fieldId] : [];
    const idx   = items.length;
    const row   = document.createElement("div");
    row.className = "wiz-list-row";
    row.innerHTML = `
      <input type="text" class="wiz-input wiz-list-input" placeholder="${placeholder}" data-listidx="${idx}">
      <button type="button" class="wiz-list-del" onclick="Engine._listDel('${fieldId}',${idx})">✕</button>
    `;
    row.querySelector("input").addEventListener("input", () => this._sincronizarLista(fieldId));
    listEl.appendChild(row);
    items.push("");
    this.datos[fieldId] = items;
    this._scheduleSave();
    row.querySelector("input").focus();
  },

  _listDel(fieldId, idx) {
    const listEl = document.querySelector(`[data-listfield="${fieldId}"]`);
    if (!listEl) return;
    const rows = listEl.querySelectorAll(".wiz-list-row");
    if (rows[idx]) rows[idx].remove();
    this._sincronizarLista(fieldId);
  },

  _sincronizarLista(fieldId) {
    const listEl = document.querySelector(`[data-listfield="${fieldId}"]`);
    if (!listEl) return;
    const valores = [];
    listEl.querySelectorAll(".wiz-list-input").forEach(inp => {
      if (inp.value.trim()) valores.push(inp.value.trim());
    });
    this.datos[fieldId] = valores;
    this._scheduleSave();
  },

  // ── Generación con IA ────────────────────────────────────────────────────

  async _generarConIA(btn, paso) {
    const fieldId = btn.dataset.aiField;
    const campo   = (paso.campos || []).find(c => c.id === fieldId);
    if (!campo?.ai?.prompt) {
      this._toast("Este campo no tiene prompt de IA configurado.", true);
      return;
    }

    const prompt = this._interpolar(campo.ai.prompt);
    btn.disabled = true;
    const originalText = btn.innerHTML;
    btn.classList.add("loading");
    btn.innerHTML = "Generando...";

    try {
      const token = await this._getToken();
      const resp  = await fetch(`${API}/ai/generar-campo`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, temperature: 0.4 })
      });
      if (!resp.ok) throw new Error("Error en la generación IA");
      const { resultado } = await resp.json();

      // Pegar resultado en el campo correspondiente
      const el = document.getElementById(`wf_${fieldId}`);
      if (el) {
        el.value = resultado;
        this.datos[fieldId] = resultado;
        this._scheduleSave();
      } else if (campo.tipo === "list") {
        // IA devuelve líneas separadas → convertir a lista
        const lineas = resultado.split("\n").map(l => l.replace(/^[-•*\d.]+\s*/, "").trim()).filter(Boolean);
        this.datos[fieldId] = lineas;
        this._rerenderList(fieldId, campo, lineas);
        this._scheduleSave();
      }
      this._toast("✓ Generado con IA");
    } catch (e) {
      this._toast("Error: " + e.message, true);
    } finally {
      btn.disabled = false;
      btn.classList.remove("loading");
      btn.innerHTML = originalText;
    }
  },

  _rerenderList(fieldId, campo, items) {
    const listEl = document.querySelector(`[data-listfield="${fieldId}"]`);
    if (!listEl) return;
    listEl.innerHTML = "";
    items.forEach((item, i) => {
      const row = document.createElement("div");
      row.className = "wiz-list-row";
      row.innerHTML = `
        <input type="text" class="wiz-input wiz-list-input" value="${this._esc(item)}" data-listidx="${i}" placeholder="${campo.placeholder_item||""}">
        <button type="button" class="wiz-list-del" onclick="Engine._listDel('${fieldId}',${i})">✕</button>
      `;
      row.querySelector("input").addEventListener("input", () => this._sincronizarLista(fieldId));
      listEl.appendChild(row);
    });
  },

  _interpolar(template) {
    return template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
      const val = this.datos[key];
      if (Array.isArray(val)) return val.join(", ");
      return val != null ? String(val) : "";
    });
  },

  // ── Guardado ─────────────────────────────────────────────────────────────

  _scheduleSave() {
    clearTimeout(this.saveTimer);
    this.saveTimer = setTimeout(() => this._guardar(), SAVE_DEBOUNCE_MS);
    document.getElementById("wiz-topbar-save-status").textContent = "Cambios sin guardar...";
  },

  async _guardar() {
    if (!this.instanciaId || this._guardando) return;
    this._guardando = true;
    try {
      await this._guardarPatch({
        datos: { ...this.datos },
        nombre: this.datos.nombreCurso || "Sin título",
        paso_actual: this.pasoActual || "",
      });
      const el = document.getElementById("wiz-topbar-save-status");
      el.textContent = "Guardado ✓";
      setTimeout(() => { el.textContent = ""; }, 2000);
    } catch (e) {
      document.getElementById("wiz-topbar-save-status").textContent = "Error al guardar";
    } finally {
      this._guardando = false;
    }
  },

  async _guardarPatch(patch) {
    if (!this.instanciaId) return;
    const { error } = await _supabase
      .from("wizard_instancias")
      .update(patch)
      .eq("id", this.instanciaId);
    if (error) throw new Error(error.message);
  },

  // ── Generación de documentos ─────────────────────────────────────────────

  async generarDocumentos() {
    const btn = document.getElementById("wiz-btn-generar-todo");
    if (btn) btn.disabled = true;
    this._mostrarLoading("Generando documentos...");

    try {
      await this._guardar();

      const endpoint = DOC_ENDPOINTS[this.normaId];
      if (!endpoint) {
        throw new Error(`Generación no disponible aún para la norma "${this.normaId}".`);
      }

      const token    = await this._getToken();
      const payload  = this._datosToPlaneacion();
      const resp     = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error(await resp.text());

      const blob   = await resp.blob();
      const url    = URL.createObjectURL(blob);
      const a      = document.createElement("a");
      const nombre = (this.datos.nombreCurso || "planeacion").replace(/\s+/g, "_");
      a.href       = url;
      a.download   = `SmartBuilder_${nombre}.zip`;
      a.click();
      URL.revokeObjectURL(url);
      this._toast("✓ Documentos descargados");
    } catch (e) {
      this._toast("Error al generar: " + e.message, true);
    } finally {
      this._ocultarLoading();
      if (btn) btn.disabled = false;
    }
  },

  // Convierte datos planos de wizard_instancias al PlaneacionRequest que espera el backend
  _datosToPlaneacion() {
    const d = this.datos;
    return {
      datos: {
        nombreCurso:  d.nombreCurso  || "",
        instructor:   d.instructor   || "",
        disenador:    d.disenador    || "",
        lugar:        d.lugar        || "",
        fecha:        d.fecha        || "",
        duracion:     d.duracion     || null,
        participantes:d.participantes|| null,
        perfil:       d.perfil       || "",
      },
      objetivos: {
        general:    d.obj_general    || "",
        cognitiva:  d.obj_cognitiva  || "",
        psicomotriz:d.obj_psicomotriz|| "",
        afectiva:   d.obj_afectiva   || "",
      },
      beneficios: d.beneficios || "",
      temario: {
        u1: d.temario_u1 || [],
        u2: d.temario_u2 || [],
        u3: d.temario_u3 || [],
      },
      encuadre: {
        preguntas:    d.preguntas    || "",
        reglasTexto:  d.reglasTexto  || [],
        acuerdosTexto:[],
        reglas: [], acuerdos: [], otraRegla: "", otroAcuerdo: "",
      },
      tecnicas: {
        rhSeleccion:    d.rhSeleccion    || "",
        rhObjetivo:     d.rhObjetivo     || "",
        rhInstrucciones:d.rhInstrucciones|| "",
        rhDuracion:     d.rhDuracion     || "",
        rhMateriales:   d.rhMateriales   || "",
        enSeleccion:    d.enSeleccion    || "",
        enObjetivo:     d.enObjetivo     || "",
        enInstrucciones:d.enInstrucciones|| "",
        enDuracion:     d.enDuracion     || "",
        enMateriales:   d.enMateriales   || "",
        rompehielos: {}, energizante: {},
      },
      evaluaciones: {
        pctDiagnostica:           d.pctDiagnostica            || 0,
        instDiagnostica:          d.instDiagnostica            || "",
        pctFormativa:             d.pctFormativa               || 0,
        tipoInstrumentoFormativa: d.tipoInstrumentoFormativa   || "",
        instFormativa:            d.instFormativa              || "",
        pctSumativa:              d.pctSumativa                || 0,
        instSumativa:             d.instSumativa               || "",
        instReac:                 d.instReac                   || "",
        descripcionGeneral:       d.descripcionGeneral         || "",
      },
      expositiva:   { campo: d.expositiva_descripcion  || "", duracion: d.expositiva_duracion  || "" },
      demostrativa: { campo: d.demostrativa_descripcion|| "", duracion: d.demostrativa_duracion|| "" },
      dialogo:      { preguntas: d.dialogo_preguntas || [], conclusion: d.dialogo_conclusion || "" },
      cierre:       { resumen: d.cierre_resumen || "", compromisos: d.cierre_compromisos || [], bibliografias: d.cierre_bibliografias || [] },
      materiales: {
        didacticos:    d.mat_didacticos    || [],
        fungibles:     d.mat_fungibles     || [],
        instalaciones: d.mat_instalaciones || [],
        herramientas:  d.mat_herramientas  || [],
        tecnologicos:  d.mat_tecnologicos  || [],
        otros:         d.mat_otros         || [],
      },
      tiempos: d.tiempos_bloques || [],
    };
  },

  // ── Generación con templates .docx (navegador, sin backend) ────────────

  _getDocById(docId) {
    return (this.schema.documentos || []).find(d => d.id === docId);
  },

  async _generarDocumento(docId) {
    const doc = this._getDocById(docId);
    if (!doc) { this._toast("Documento no encontrado.", true); return; }

    if (!doc.template_path) {
      this._toast(`"${doc.nombre}" aún no tiene template. Súbelo desde el editor de schemas.`, true);
      return;
    }

    this._mostrarLoading(`Generando ${doc.nombre}...`);
    try {
      // 1. Descargar template desde Supabase Storage
      const { data: blob, error: dlErr } = await _supabase.storage
        .from("wizard-templates")
        .download(doc.template_path);
      if (dlErr) throw new Error("No se pudo descargar el template: " + dlErr.message);

      // 2. Cargar en PizZip
      const arrayBuffer = await blob.arrayBuffer();
      const zip = new PizZip(arrayBuffer);

      // 3. Sustituir variables con docxtemplater
      const Docx = window.Docxtemplater || window.docxtemplater;
      if (!Docx) throw new Error("docxtemplater no cargado. Recarga la página.");

      const docx = new Docx(zip, {
        paragraphLoop: true,
        linebreaks: true,
      });
      docx.render(this._datosToTemplateVars());

      // 4. Generar blob y descargar
      const out = docx.getZip().generate({
        type: "blob",
        mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      });
      const url    = URL.createObjectURL(out);
      const a      = document.createElement("a");
      const nombre = (this.datos.nombreCurso || "curso").replace(/\s+/g, "_");
      a.href       = url;
      a.download   = `${doc.nombre}_${nombre}.docx`;
      a.click();
      URL.revokeObjectURL(url);
      this._toast(`✓ ${doc.nombre} descargado`);
    } catch (e) {
      this._toast(`Error: ${e.message}`, true);
      console.error(e);
    } finally {
      this._ocultarLoading();
    }
  },

  // Convierte datos del wizard a variables planas para {variable} en templates
  _datosToTemplateVars() {
    const d   = this.datos;
    const txt = (arr) => Array.isArray(arr) ? arr.filter(Boolean).join("\n") : (arr || "");
    const lst = (arr) => (Array.isArray(arr) ? arr : []).filter(Boolean).map(v => ({ valor: v }));

    return {
      // Datos generales
      nombre_curso:      d.nombreCurso   || "",
      instructor:        d.instructor    || "",
      disenador:         d.disenador     || "",
      lugar:             d.lugar         || "",
      fecha:             d.fecha ? new Date(d.fecha + "T12:00:00").toLocaleDateString("es-MX") : "",
      duracion:          String(d.duracion      || ""),
      participantes:     String(d.participantes || ""),
      perfil:            d.perfil        || "",
      // Objetivos
      obj_cognitiva:    d.obj_cognitiva  || "",
      obj_psicomotriz:  d.obj_psicomotriz|| "",
      obj_afectiva:     d.obj_afectiva   || "",
      obj_general:      d.obj_general    || "",
      // Beneficios
      beneficios:       d.beneficios     || "",
      // Temario (texto plano + lista para loops)
      temario_u1_titulo: d.temario_u1_titulo || "Unidad 1",
      temario_u1:        txt(d.temario_u1),
      temario_u1_items:  lst(d.temario_u1),
      temario_u2_titulo: d.temario_u2_titulo || "Unidad 2",
      temario_u2:        txt(d.temario_u2),
      temario_u2_items:  lst(d.temario_u2),
      temario_u3_titulo: d.temario_u3_titulo || "Unidad 3",
      temario_u3:        txt(d.temario_u3),
      temario_u3_items:  lst(d.temario_u3),
      // Encuadre
      preguntas:         d.preguntas     || "",
      reglas:            txt(d.reglasTexto),
      reglas_items:      lst(d.reglasTexto),
      contrato:          d.contrato      || "",
      // Técnicas
      integracion_nombre: d.rhSeleccion      || "",
      integracion_obj:    d.rhObjetivo       || "",
      integracion_desc:   d.rhInstrucciones  || "",
      integracion_dur:    d.rhDuracion       || "",
      integracion_mat:    d.rhMateriales     || "",
      energizante_nombre: d.enSeleccion      || "",
      energizante_obj:    d.enObjetivo       || "",
      energizante_desc:   d.enInstrucciones  || "",
      energizante_dur:    d.enDuracion       || "",
      expositiva:         d.expositiva_descripcion   || "",
      expositiva_dur:     d.expositiva_duracion      || "",
      demostrativa:       d.demostrativa_descripcion || "",
      demostrativa_dur:   d.demostrativa_duracion    || "",
      dialogo_preguntas:  txt(d.dialogo_preguntas),
      dialogo_items:      lst(d.dialogo_preguntas),
      dialogo_conclusion: d.dialogo_conclusion || "",
      // Cierre
      resumen:            d.cierre_resumen    || "",
      compromisos:        txt(d.cierre_compromisos),
      compromisos_items:  lst(d.cierre_compromisos),
      bibliografias:      txt(d.cierre_bibliografias),
      bibliografias_items:lst(d.cierre_bibliografias),
      descripcion_instructor: d.descripcionGeneral || "",
      // Evaluaciones
      pct_diagnostica:    String(d.pctDiagnostica            || 0),
      inst_diagnostica:   d.instDiagnostica          || "",
      pct_formativa:      String(d.pctFormativa               || 0),
      tipo_formativa:     d.tipoInstrumentoFormativa  || "",
      inst_formativa:     d.instFormativa             || "",
      pct_sumativa:       String(d.pctSumativa                || 0),
      inst_sumativa:      d.instSumativa              || "",
      inst_reaccion:      d.instReac                  || "",
      // Materiales
      mat_didacticos:    txt(d.mat_didacticos),
      mat_fungibles:     txt(d.mat_fungibles),
      mat_instalaciones: txt(d.mat_instalaciones),
      mat_herramientas:  txt(d.mat_herramientas),
      mat_tecnologicos:  txt(d.mat_tecnologicos),
      mat_otros:         txt(d.mat_otros),
    };
  },

  // ── Utilidades ───────────────────────────────────────────────────────────

  async _getToken() {
    const { data } = await _supabase.auth.getSession();
    return data?.session?.access_token || "";
  },

  _esc(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/"/g, "&quot;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  },

  _mostrarLoading(txt = "Cargando...") {
    document.getElementById("wiz-loading-txt").textContent = txt;
    document.getElementById("wiz-loading").classList.add("show");
  },

  _ocultarLoading() {
    document.getElementById("wiz-loading").classList.remove("show");
  },

  _toast(msg, isError = false) {
    const el = document.getElementById("wiz-toast");
    el.textContent = msg;
    el.className   = "show" + (isError ? " error" : "");
    setTimeout(() => { el.className = ""; }, 3000);
  },
};

// Arrancar al cargar la página
document.addEventListener("DOMContentLoaded", () => Engine.init());
