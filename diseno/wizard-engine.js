/**
 * SmartBuilderEC — Motor Genérico de Wizards (Sprint 4)
 * Lee un JSON schema desde Supabase y renderiza el wizard completo.
 * URL: /diseno/wizard-engine.html?norma=ec0217[&instancia=<uuid>]
 */

const API = "https://smartbuilderec.onrender.com";
const SAVE_DEBOUNCE_MS = 2000;

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
    const session = await authGuard(["user", "admin", "super_admin"]);
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

  // ── Schema y datos ───────────────────────────────────────────────────────

  async _cargarSchema() {
    const token = await this._getToken();
    const resp  = await fetch(`${API}/wizard/${this.normaId}/schema`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    if (!resp.ok) throw new Error("Schema no encontrado para " + this.normaId);
    const body  = await resp.json();
    this.schema = body.esquema;
  },

  async _cargarOCrearInstancia() {
    const token = await this._getToken();

    if (this.instanciaId) {
      const resp = await fetch(
        `${API}/wizard/${this.normaId}/instancias/${this.instanciaId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!resp.ok) throw new Error("Instancia no encontrada");
      const inst    = await resp.json();
      this.datos    = inst.datos || {};
      this.datos._pasoActual = inst.paso_actual || "";
      if (inst.assigned_by) {
        document.getElementById("wiz-assigned-banner").style.display = "block";
        document.getElementById("wiz-main").style.marginTop = "84px";
      }
    } else {
      // Crear nueva instancia
      const nombre  = this.schema.meta?.nombre || this.normaId;
      const resp    = await fetch(
        `${API}/wizard/${this.normaId}/instancias`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: "Nueva planeación — " + nombre })
        }
      );
      if (!resp.ok) throw new Error("No se pudo crear la instancia");
      const inst       = await resp.json();
      this.instanciaId = inst.id;
      this.datos       = {};
      // Actualizar URL sin recargar
      history.replaceState({}, "", `?norma=${this.normaId}&instancia=${inst.id}`);
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
    let cards = `<div class="wiz-formatos-grid">`;
    docs.forEach(d => {
      cards += `<div class="wiz-formato-card">
        <span class="wiz-formato-tipo">${d.formato.toUpperCase()}</span>
        <span class="wiz-formato-nombre">${d.nombre}</span>
      </div>`;
    });
    cards += `</div>`;

    return `<div class="wiz-card">
      <p style="font-size:14px;color:var(--c-text-2);margin-bottom:20px">
        El paquete incluye <strong>${docs.length} documento${docs.length!==1?"s":""}</strong>.
        Asegúrate de haber completado todos los pasos antes de generar.
      </p>
      <button class="wiz-btn-generar-todo" id="wiz-btn-generar-todo" onclick="Engine.generarDocumentos()">
        📥 Generar y descargar paquete completo
      </button>
      ${cards}
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
    const token = await this._getToken();
    await fetch(`${API}/wizard/${this.normaId}/instancias/${this.instanciaId}`, {
      method: "PUT",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    });
  },

  // ── Generación de documentos ─────────────────────────────────────────────

  async generarDocumentos() {
    const btn = document.getElementById("wiz-btn-generar-todo");
    if (btn) btn.disabled = true;
    this._mostrarLoading("Generando documentos...");

    try {
      // Guardar primero
      await this._guardar();

      const token = await this._getToken();
      const resp  = await fetch(
        `${API}/wizard/${this.normaId}/instancias/${this.instanciaId}/generar`,
        { method: "POST", headers: { Authorization: `Bearer ${token}` } }
      );
      if (!resp.ok) throw new Error(await resp.text());

      const blob = await resp.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement("a");
      const nombre = (this.datos.nombreCurso || "planeacion").replace(/\s+/g, "_");
      a.href     = url;
      a.download = `SmartBuilder_${nombre}.zip`;
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
