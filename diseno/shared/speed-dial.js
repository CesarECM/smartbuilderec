// ─── shared/speed-dial.js — Botón flotante de herramientas de desarrollo ─────
// Botón principal 🧪 que al hacer clic despliega hacia arriba tres opciones:
//   1. ⬇️  Descargar paquete completo
//   2. 📂  Importar planeación desde JSON
//   3. 🗑️  Limpiar todos los datos
// Depende de: modals.js (showAlert, showConfirm), utils.js (recolectarPayload,
//             fetchConTimeout, BACKEND_URL), auth.js (getAuthHeaders),
//             storage.js (storageSync)
(function initSpeedDial() {

  const container = document.createElement("div");
  container.id = "sd-container";
  document.body.appendChild(container);

  const mainBtn = document.createElement("button");
  mainBtn.id = "sd-main";
  mainBtn.textContent = "🧪";
  mainBtn.title = "Opciones";
  container.appendChild(mainBtn);

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

  const inputFile = document.createElement("input");
  inputFile.type = "file";
  inputFile.accept = ".json";
  inputFile.style.display = "none";
  document.body.appendChild(inputFile);

  const opcionDescargar = crearOpcion("⬇️", "Descargar archivos hasta el momento", "#2e7d32", descargarPaquete);
  const opcionImportar  = crearOpcion("📂", "Importar planeación (.json)", "#e65100", () => inputFile.click());
  const opcionLimpiar   = crearOpcion("🗑️", "Limpiar todos los datos", "#c62828", abrirModalLimpiar);

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

  document.addEventListener("click", () => { if (abierto) cerrarMenu(); });

  async function descargarPaquete() {
    const payload = recolectarPayload();

    console.group("📦 Payload enviado al backend");
    console.log("tecnicas:", JSON.stringify(payload.tecnicas, null, 2));
    console.log("cierre:", JSON.stringify(payload.cierre, null, 2));
    console.log("evaluaciones:", JSON.stringify(payload.evaluaciones, null, 2));
    console.groupEnd();

    mainBtn.disabled = true;
    mainBtn.textContent = "⏳";

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
      const _authHeaders = await getAuthHeaders();
      const response = await fetchConTimeout(`${BACKEND_URL}/generate-doc/planeacion`, {
        method: "POST",
        headers: { ..._authHeaders, "Content-Type": "application/json" },
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

      if (typeof logEvento === 'function')
        logEvento('wizard.descarga.ok', { nombre_curso: payload.datos?.nombreCurso || '' });

    } catch (err) {
      if (typeof logEvento === 'function')
        logEvento('wizard.descarga.error', { error: String(err?.message || err) });
      showAlert(`⚠️ ${mensajeAmigable(err)}`);
      console.error(err);
    } finally {
      clearInterval(progTimer);
      setTimeout(() => { barraEl.style.width = "0%"; }, 600);
      mainBtn.disabled = false;
      mainBtn.textContent = "🧪";
    }
  }

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
      pctFormativa:   ev.pctFormativa   ?? ev.pctForm ?? 0,
      pctSumativa:    ev.pctSumativa    ?? ev.pctSuma ?? 0,
      instDiagnostica: ev.instDiagnostica ?? ev.instDiag ?? "",
      instFormativa:   ev.instFormativa   ?? ev.instForm ?? "",
      instSumativa:    ev.instSumativa    ?? ev.instSuma ?? "",
      instReac:              ev.instReac              ?? "",
      descripcionGeneral:    ev.descripcionGeneral    ?? "",
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

      if (typeof storageSync !== "undefined") storageSync.limpiar();

      for (const [campo, clave] of Object.entries(CLAVES)) {
        if (jsonObj[campo] === undefined) continue;
        if (campo === "tiempos" && Array.isArray(jsonObj[campo]) && jsonObj[campo].length === 0) continue;
        localStorage.setItem(clave, JSON.stringify(jsonObj[campo]));
      }

      const flagMap = {
        datos:"datos", objetivos:"objetivos", beneficios:"beneficios",
        temario:"temario", preguntas:"encuadre", reglas:"encuadre", contrato:"encuadre",
        integracion:"tecnicas", energizante:"tecnicas", tecnicas:"tecnicas",
        expositiva:"expositiva", demostrativa:"demostrativa", dialogo:"dialogo",
        cierre:"cierre", evaluaciones:"evaluaciones", tiempos:"tiempos", materiales:"materiales"
      };
      Object.entries(flagMap).forEach(([seccion, claveJSON]) => {
        if (jsonObj[claveJSON] === undefined) return;
        if (claveJSON === "tiempos" && Array.isArray(jsonObj[claveJSON]) && jsonObj[claveJSON].length === 0) return;
        localStorage.setItem("ec0217_" + seccion + "_completo", "true");
      });
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
    if (typeof storageSync !== "undefined") storageSync.limpiar();
    Object.keys(localStorage)
      .filter(k => k.startsWith("ec0217_"))
      .forEach(k => localStorage.removeItem(k));
    cerrarModalLimpiar();
    location.reload();
  });

  modalOverlay.addEventListener("click", (e) => {
    if (e.target === modalOverlay) cerrarModalLimpiar();
  });

  function abrirModalLimpiar()  { modalOverlay.classList.add("visible"); }
  function cerrarModalLimpiar() { modalOverlay.classList.remove("visible"); }

})();
