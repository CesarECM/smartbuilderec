// ─── shared.js — Utilidades compartidas de SmartBuilder EC ───────────────────
    //
    // Incluir en todas las páginas del wizard (excepto ingresoToken.html):
    //   <script src="shared.js"></script>   ← antes de cerrar </body>
    const BACKEND_URL = "https://smartbuilderec.onrender.com";

// ─── Sistema de Modales Personalizados ───────────────────────────────────────

(function initCustomModals() {
  // Insertar el HTML del modal en el DOM una sola vez
  if (document.getElementById("cmOverlay")) return;
  const el = document.createElement("div");
  el.id = "cmOverlay";
  el.className = "cm-overlay";
  el.style.display = "none";
  el.setAttribute("role", "dialog");
  el.setAttribute("aria-modal", "true");
  el.innerHTML = `
    <div class="cm-box">
      <div class="cm-header">
        <span class="cm-icon" id="cmIcon">ℹ️</span>
        <h3 class="cm-title" id="cmTitle">Aviso</h3>
      </div>
      <div class="cm-body">
        <p id="cmMessage"></p>
      </div>
      <div class="cm-footer" id="cmFooter"></div>
    </div>
  `;
  // Esperar a que el body esté disponible
  if (document.body) {
    document.body.appendChild(el);
  } else {
    document.addEventListener("DOMContentLoaded", () => document.body.appendChild(el));
  }
})();

function _cmGetModal() {
  let overlay = document.getElementById("cmOverlay");
  if (!overlay) {
    // Por si se llama antes de que initCustomModals corra
    overlay = document.createElement("div");
    overlay.id = "cmOverlay";
    overlay.className = "cm-overlay";
    overlay.setAttribute("role", "dialog");
    overlay.setAttribute("aria-modal", "true");
    overlay.innerHTML = `
      <div class="cm-box">
        <div class="cm-header">
          <span class="cm-icon" id="cmIcon">ℹ️</span>
          <h3 class="cm-title" id="cmTitle">Aviso</h3>
        </div>
        <div class="cm-body">
          <p id="cmMessage"></p>
        </div>
        <div class="cm-footer" id="cmFooter"></div>
      </div>
    `;
    document.body.appendChild(overlay);
  }
  return overlay;
}

function _cmSetContent(message, icon, title) {
  const modal = _cmGetModal();
  document.getElementById("cmIcon").textContent = icon;
  document.getElementById("cmTitle").textContent = title;
  // Convertir saltos de línea en <br> y escapar HTML básico
  const safe = message
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
  document.getElementById("cmMessage").innerHTML = safe;
  return modal;
}

/**
 * showAlert(message, opts?)
 * opts: { title, icon }
 * Returns Promise<void>
 */
function showAlert(message, opts = {}) {
  return new Promise(resolve => {
    const title = opts.title || _cmDetectTitle(message);
    const icon  = opts.icon  || _cmDetectIcon(message);
    const modal = _cmSetContent(message, icon, title);

    const footer = document.getElementById("cmFooter");
    footer.innerHTML = "";
    const okBtn = document.createElement("button");
    okBtn.className = "cm-btn-ok";
    okBtn.textContent = "Entendido";
    okBtn.addEventListener("click", () => {
      modal.style.display = "none";
      resolve();
    });
    footer.appendChild(okBtn);

    modal.style.display = "flex";
    setTimeout(() => okBtn.focus(), 50);
  });
}

/**
 * showConfirm(message, opts?)
 * opts: { title, icon, confirmText, cancelText, danger }
 * Returns Promise<boolean>
 */
function showConfirm(message, opts = {}) {
  return new Promise(resolve => {
    const title       = opts.title       || "Confirmar";
    const icon        = opts.icon        || "❓";
    const confirmText = opts.confirmText || "Confirmar";
    const cancelText  = opts.cancelText  || "Cancelar";
    const modal = _cmSetContent(message, icon, title);

    const footer = document.getElementById("cmFooter");
    footer.innerHTML = "";

    const cancelBtn = document.createElement("button");
    cancelBtn.className = "cm-btn-cancel";
    cancelBtn.textContent = cancelText;
    cancelBtn.addEventListener("click", () => {
      modal.style.display = "none";
      resolve(false);
    });

    const confirmBtn = document.createElement("button");
    confirmBtn.className = opts.danger ? "cm-btn-confirm danger" : "cm-btn-confirm";
    confirmBtn.textContent = confirmText;
    confirmBtn.addEventListener("click", () => {
      modal.style.display = "none";
      resolve(true);
    });

    footer.appendChild(cancelBtn);
    footer.appendChild(confirmBtn);

    modal.style.display = "flex";
    setTimeout(() => confirmBtn.focus(), 50);
  });
}

function _cmDetectIcon(msg) {
  if (msg.includes("⚠️") || msg.toLowerCase().includes("error") || msg.toLowerCase().includes("no se pudo")) return "⚠️";
  if (msg.includes("✅") || msg.toLowerCase().includes("correcto") || msg.toLowerCase().includes("éxito")) return "✅";
  return "ℹ️";
}

function _cmDetectTitle(msg) {
  if (msg.includes("⚠️") || msg.toLowerCase().includes("error") || msg.toLowerCase().includes("no se pudo")) return "Atención";
  if (msg.includes("Primero") || msg.includes("necesitas") || msg.includes("completa")) return "Paso requerido";
  return "Aviso";
}

    // ─── Timeout y mensajes amigables de error ────────────────────────────────
    const FETCH_TIMEOUT_MS = 45000; // 45 segundos

    function mensajeAmigable(err) {
      const msg = String(err?.message || "");
      if (err?.name === "AbortError" || msg.includes("timeout"))
        return "La solicitud tardó demasiado. El servidor puede estar ocupado. Intenta de nuevo en unos momentos.";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("Load failed"))
        return "No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta de nuevo.";
      if (msg.includes("502"))
        return "El servidor está reiniciando. Espera 30 segundos e intenta de nuevo.";
      if (msg.includes("503"))
        return "El servidor está temporalmente no disponible. Intenta de nuevo en unos momentos.";
      if (msg.includes("500"))
        return "Ocurrió un error interno en el servidor. Si el problema persiste, contacta a soporte.";
      if (msg.includes("429"))
        return "Demasiadas solicitudes. Espera un momento e intenta de nuevo.";
      if (msg.includes("401") || msg.includes("403"))
        return "Sesión expirada. Vuelve a iniciar sesión.";
      return msg || "Ocurrió un error inesperado. Intenta de nuevo.";
    }

    async function fetchConTimeout(url, opciones = {}, timeoutMs = FETCH_TIMEOUT_MS) {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), timeoutMs);
      try {
        const response = await fetch(url, { ...opciones, signal: controller.signal });
        clearTimeout(id);
        return response;
      } catch (err) {
        clearTimeout(id);
        if (err.name === "AbortError") throw new Error("timeout");
        throw err;
      }
    }
    // ─── authGuard ────────────────────────────────────────────────────────────────
    // async function authGuard(rolesPermitidos = []) {
    //   // Delega a auth.js (debe cargarse antes que shared.js)
    //   if (typeof window.authGuard === "function") {
    //     return window.authGuard(rolesPermitidos);
    //   }
    //   // Fallback legacy: si auth.js no está cargado
    //   const session = await (typeof getSession === "function" ? getSession() : Promise.resolve(null));
    //   if (!session) {
    //     window.location.href = "login.html";
    //     return null;
    //   }
    //   return session;
    function authGuard() {}
    // ─── Migración única: mueve datos ec0217_* de sessionStorage a localStorage ──
    // Corre solo una vez al cargar la página; copia datos existentes sin borrarlos.
    (function migrarALocalStorage() {
      const PREFIX = "ec0217_";
      try {
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key && key.startsWith(PREFIX) && !localStorage.getItem(key)) {
            localStorage.setItem(key, sessionStorage.getItem(key));
          }
        }
      } catch (_) {}
    })();

    // ─── getData / saveData (usan localStorage para que los datos persistan) ─────
    function getData(key) {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : null;
    }
    function saveData(key, value) {
      localStorage.setItem(key, JSON.stringify(value));
    }
    // ─── Recolectar todo el estado del wizard ────────────────────────────────────
    function recolectarPayload() {
    const datos      = getData("ec0217_datos")       || {};
    const objetivos  = getData("ec0217_objetivos")   || {};
    const temario    = getData("ec0217_temario")     || {};
    const encuadre   = getData("ec0217_encuadre")    || {};
    const tecnicas   = getData("ec0217_tecnicas")    || {};
    const expositiva = getData("ec0217_expositiva") || {};
    const demostrativa = getData("ec0217_demostrativa") || {};
    const dialogo = getData("ec0217_dialogo") || {};
    const cierre = getData("ec0217_cierre") || {};
    const evaluaciones = getData("ec0217_evaluaciones") || {};
    const tiempos = getData("ec0217_tiempos") || [];
    const materiales = getData("ec0217_materiales") || {};
    const beneficios   = getData("ec0217_beneficios");
    // Beneficios puede estar guardado como string o como objeto
    let beneficiosStr = "";
    if (typeof beneficios === "string") {
        beneficiosStr = beneficios;
    } else if (beneficios && typeof beneficios === "object") {
        beneficiosStr = beneficios.lista || beneficios.texto || JSON.stringify(beneficios);
    }
    return { datos, objetivos, beneficios: beneficiosStr, temario, encuadre, tecnicas, expositiva, demostrativa, dialogo, cierre, evaluaciones, tiempos, materiales };
    }
    // ─── Speed Dial flotante ─────────────────────────────────────────────────────
    // Botón principal 🧪 que al hacer clic despliega hacia arriba dos opciones:
    //   1. ⬇️  Descargar paquete completo (comportamiento original)
    //   2. 📂  Importar planeación desde JSON
    (function initSpeedDial() {

    // ── Contenedor principal ──────────────────────────────────────────────────
    // Nota: los estilos del Speed Dial están en styles.css
    const container = document.createElement("div");
    container.id = "sd-container";
    document.body.appendChild(container);

    // ── Botón principal ───────────────────────────────────────────────────────
    const mainBtn = document.createElement("button");
    mainBtn.id = "sd-main";
    mainBtn.textContent = "🧪";
    mainBtn.title = "Opciones";
    container.appendChild(mainBtn);

    // ── Opciones ──────────────────────────────────────────────────────────────
    function crearOpcion(emoji, label, color, onClick) {
        const wrap = document.createElement("div");
        wrap.className = "sd-option";

        const lbl = document.createElement("span");
        lbl.className = "sd-option-label";
        lbl.textContent = label;

        const btn = document.createElement("button");
        btn.className = "sd-option-btn";
        btn.style.background = color;
        btn.textContent = emoji;
        btn.title = label;
        btn.addEventListener("click", (e) => { e.stopPropagation(); cerrarMenu(); onClick(); });

        wrap.appendChild(lbl);
        wrap.appendChild(btn);
        container.insertBefore(wrap, mainBtn);
        return wrap;
    }

    // Input oculto para importar
    const inputFile = document.createElement("input");
    inputFile.type = "file";
    inputFile.accept = ".json";
    inputFile.style.display = "none";
    document.body.appendChild(inputFile);

    const opcionDescargar = crearOpcion("⬇️", "Descargar archivos hasta el momento", "#2e7d32", descargarPaquete);
    const opcionImportar  = crearOpcion("📂", "Importar planeación (.json)", "#e65100", () => inputFile.click());
    const opcionLimpiar   = crearOpcion("🗑️", "Limpiar todos los datos", "#c62828", abrirModalLimpiar);

    // ── Abrir / cerrar menú ───────────────────────────────────────────────────
    let abierto = false;

    function abrirMenu() {
        abierto = true;
        mainBtn.classList.add("open");
        setTimeout(() => opcionDescargar.classList.add("visible"), 0);
        setTimeout(() => opcionImportar.classList.add("visible"),  60);
        setTimeout(() => opcionLimpiar.classList.add("visible"),   120);
    }

    function cerrarMenu() {
        abierto = false;
        mainBtn.classList.remove("open");
        opcionDescargar.classList.remove("visible");
        opcionImportar.classList.remove("visible");
        opcionLimpiar.classList.remove("visible");
    }

    mainBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        abierto ? cerrarMenu() : abrirMenu();
    });

    // Cerrar al hacer clic fuera
    document.addEventListener("click", () => { if (abierto) cerrarMenu(); });

    // ── Acción: Descargar paquete ─────────────────────────────────────────────
    async function descargarPaquete() {
        const payload = recolectarPayload();

        // DEBUG: revisar en consola del navegador (F12 → Console) qué se manda al backend
        console.group("📦 Payload enviado al backend");
        console.log("tecnicas:", JSON.stringify(payload.tecnicas, null, 2));
        console.log("cierre:", JSON.stringify(payload.cierre, null, 2));
        console.log("evaluaciones:", JSON.stringify(payload.evaluaciones, null, 2));
        console.groupEnd();

        mainBtn.disabled = true;
        mainBtn.textContent = "⏳";

        // Barra de progreso simulada mientras se generan los documentos
        let progreso = 0;
        const barraId = "sd-progreso-bar";
        let barraEl = document.getElementById(barraId);
        if (!barraEl) {
          barraEl = document.createElement("div");
          barraEl.id = barraId;
          barraEl.style.cssText = "position:fixed;bottom:0;left:0;width:0%;height:4px;background:#1F3B6D;transition:width 0.5s;z-index:9999;";
          document.body.appendChild(barraEl);
        }
        barraEl.style.width = "0%";
        const progTimer = setInterval(() => {
          progreso = Math.min(progreso + 3, 88);
          barraEl.style.width = progreso + "%";
        }, 800);

        try {
        // const authHeaders = typeof getAuthHeaders === "function" ? await getAuthHeaders() : { "Content-Type": "application/json" };
        const response = await fetchConTimeout(`${BACKEND_URL}/generate-doc/planeacion`, {
            method: "POST",
            headers:{ "Content-Type": "application/json" },// authHeaders,
            body: JSON.stringify(payload),
        }, 90000);
        if (!response.ok) {
            let detalle = `HTTP ${response.status}`;
            try { const errJson = await response.json(); detalle = errJson.detail || JSON.stringify(errJson); } catch (_) {}
            throw new Error(detalle);
        }
        const blob = await response.blob();
        barraEl.style.width = "100%";
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `Planeacion_${(payload.datos.nombreCurso || "EC0217").replace(/\s+/g, "_")}.zip`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);

        // Guardar planeación en Supabase (best-effort, no bloquea la descarga)
        // try {
        //   const session = await getSession();
        //   if (session) {
        //     const titulo = payload.datos?.nombreCurso || "Sin título";
        //     fetch(`${BACKEND_URL}/planeaciones`, {
        //       method: "POST",
        //       headers: await getAuthHeaders(),
        //       body: JSON.stringify({ titulo, datos: payload }),
        //     }).catch(() => {});
        //   }
        // } catch (_) {}

        } catch (err) {
        showAlert(`⚠️ ${mensajeAmigable(err)}`);
        console.error(err);
        } finally {
        clearInterval(progTimer);
        setTimeout(() => { barraEl.style.width = "0%"; }, 600);
        mainBtn.disabled = false;
        mainBtn.textContent = "🧪";
        }
    }

    // ── Acción: Importar JSON ─────────────────────────────────────────────────
    const CLAVES = {
        datos:"ec0217_datos", objetivos:"ec0217_objetivos", beneficios:"ec0217_beneficios",
        temario:"ec0217_temario", encuadre:"ec0217_encuadre", tecnicas:"ec0217_tecnicas",
        expositiva:"ec0217_expositiva", demostrativa:"ec0217_demostrativa",
        dialogo:"ec0217_dialogo", cierre:"ec0217_cierre",
        evaluaciones:"ec0217_evaluaciones", tiempos:"ec0217_tiempos", materiales:"ec0217_materiales",
    };

    function normalizarEvaluaciones(ev) {
        if (!ev) return {};

        return {
            pctDiagnostica: ev.pctDiagnostica ?? ev.pctDiag ?? 0,
            pctFormativa: ev.pctFormativa ?? ev.pctForm ?? 0,
            pctSumativa: ev.pctSumativa ?? ev.pctSuma ?? 0,

            instDiagnostica: ev.instDiagnostica ?? ev.instDiag ?? "",
            instFormativa: ev.instFormativa ?? ev.instForm ?? "",
            instSumativa: ev.instSumativa ?? ev.instSuma ?? "",

            instReac: ev.instReac ?? "",
            descripcionGeneral: ev.descripcionGeneral ?? "",
            tipoInstrumentoFormativa: ev.tipoInstrumentoFormativa ?? ""
        };
    }

    inputFile.addEventListener("change", async function() {
        const file = this.files[0];
        if (!file) return;
        this.value = "";

        try {
        if (!file.name.endsWith(".json"))
            throw new Error("Solo se aceptan archivos .json.\nExtrae el archivo del ZIP descargado primero.");

        const text = await file.text();
        let jsonObj;
        try { jsonObj = JSON.parse(text); } catch(_) { throw new Error("El archivo no es un JSON válido."); }

        if (!jsonObj || typeof jsonObj.datos !== "object" || Array.isArray(jsonObj.datos))
            throw new Error("El archivo no tiene la estructura de planeación esperada.");

        if (jsonObj.evaluaciones) jsonObj.evaluaciones = normalizarEvaluaciones(jsonObj.evaluaciones);

        for (const [campo, clave] of Object.entries(CLAVES)) {
            if (jsonObj[campo] === undefined) continue;
            // No sobreescribir tiempos con array vacío; se usará la estructura por defecto
            if (campo === "tiempos" && Array.isArray(jsonObj[campo]) && jsonObj[campo].length === 0) continue;
            localStorage.setItem(clave, JSON.stringify(jsonObj[campo]));
        }

        // Restaurar flags _completo para desbloquear la navegacion lateral.
        // Sin estas flags, las secciones quedan bloqueadas aunque los datos existan.
        // "integracion" y "energizante" se guardan en el JSON bajo la clave "tecnicas".
        const flagMap = {
            datos:        "datos",
            objetivos:    "objetivos",
            beneficios:   "beneficios",
            temario:      "temario",
            preguntas:    "encuadre",
            reglas:       "encuadre",
            contrato:     "encuadre",
            integracion:  "tecnicas",
            energizante:  "tecnicas",
            tecnicas:     "tecnicas",
            expositiva:   "expositiva",
            demostrativa: "demostrativa",
            dialogo:      "dialogo",
            cierre:       "cierre",
            evaluaciones: "evaluaciones",
            tiempos:      "tiempos",
            materiales:   "materiales"
        };
        Object.entries(flagMap).forEach(([seccion, claveJSON]) => {
            if (jsonObj[claveJSON] === undefined) return;
            // No marcar tiempos como completo si el array está vacío
            if (claveJSON === "tiempos" && Array.isArray(jsonObj[claveJSON]) && jsonObj[claveJSON].length === 0) return;
            localStorage.setItem("ec0217_" + seccion + "_completo", "true");
        });
        // "datos" siempre se marca completo si el JSON tiene datos validos del curso
        localStorage.setItem("ec0217_datos_completo", "true");
        sessionStorage.setItem("loggedIn", "true");

        const nombre = jsonObj.datos.nombreCurso || "(sin nombre aún)";
        const ok = await showConfirm(
            `Planeación importada correctamente.\n\nCurso: "${nombre}"\n\nLa página se recargará para mostrar todos los datos.`,
            { title: "Importación exitosa", icon: "✅", confirmText: "Recargar ahora", cancelText: "Más tarde" }
        );
        if (ok) location.reload();

        } catch(err) {
        showAlert("⚠️ Error al importar:\n" + err.message);
        console.error("Error importando planeación:", err);
        }
    });

    // ── Acción: Limpiar todos los datos ──────────────────────────────────────
    const modalOverlay = document.createElement("div");
    modalOverlay.className = "sd-modal-overlay";
    modalOverlay.innerHTML = `
      <div class="sd-modal">
        <h3>⚠️ Limpiar todos los datos</h3>
        <p>Se borrarán todos los datos que hayas ingresado en <strong>todas las secciones</strong>. Esta acción no se puede deshacer.</p>
        <div class="sd-modal-btns">
          <button class="sd-modal-btn-cancelar">Cancelar</button>
          <button class="sd-modal-btn-aceptar">Sí, borrar todo</button>
        </div>
      </div>`;
    document.body.appendChild(modalOverlay);

    modalOverlay.querySelector(".sd-modal-btn-cancelar").addEventListener("click", cerrarModalLimpiar);
    modalOverlay.querySelector(".sd-modal-btn-aceptar").addEventListener("click", () => {
        Object.keys(localStorage)
            .filter(k => k.startsWith("ec0217_"))
            .forEach(k => localStorage.removeItem(k));
        cerrarModalLimpiar();
        location.reload();
    });

    modalOverlay.addEventListener("click", (e) => {
        if (e.target === modalOverlay) cerrarModalLimpiar();
    });

    function abrirModalLimpiar() { modalOverlay.classList.add("visible"); }
    function cerrarModalLimpiar() { modalOverlay.classList.remove("visible"); }

    })();