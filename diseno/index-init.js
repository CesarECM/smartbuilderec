  // ─── Importar planeación desde JSON ──────────────────────────────────────
  (function() {
    const CLAVES = {
      datos:        "ec0217_datos",
      objetivos:    "ec0217_objetivos",
      beneficios:   "ec0217_beneficios",
      temario:      "ec0217_temario",
      encuadre:     "ec0217_encuadre",
      tecnicas:     "ec0217_tecnicas",
      expositiva:   "ec0217_expositiva",
      demostrativa: "ec0217_demostrativa",
      dialogo:      "ec0217_dialogo",
      cierre:       "ec0217_cierre",
      evaluaciones: "ec0217_evaluaciones",
      tiempos:      "ec0217_tiempos",
      materiales:   "ec0217_materiales",
    };

    function normalizarEvaluaciones(ev) {
      if (!ev) return {};
      return {
        pctDiagnostica:           ev.pctDiagnostica  ?? ev.pctDiag  ?? 0,
        instDiagnostica:          ev.instDiagnostica ?? ev.instDiag ?? "",
        pctFormativa:             ev.pctFormativa     ?? ev.pctForm  ?? 0,
        instFormativa:            ev.instFormativa    ?? ev.instForm ?? "",
        pctSumativa:              ev.pctSumativa      ?? ev.pctSuma  ?? 0,
        instSumativa:             ev.instSumativa     ?? ev.instSuma ?? "",
        instReac:                 ev.instReac                        ?? "",
        tipoInstrumentoFormativa: ev.tipoInstrumentoFormativa        ?? "",
        descripcionGeneral:       ev.descripcionGeneral              ?? "",
      };
    }

    function cargarEnLocalStorage(jsonObj) {
      if (!jsonObj || typeof jsonObj !== "object") throw new Error("Formato de archivo inválido.");
      if (!jsonObj.datos || !jsonObj.datos.nombreCurso) throw new Error("El archivo no contiene datos de curso.");

      if (jsonObj.evaluaciones) jsonObj.evaluaciones = normalizarEvaluaciones(jsonObj.evaluaciones);

      for (const [campo, clave] of Object.entries(CLAVES)) {
        if (jsonObj[campo] === undefined) continue;
        // No sobreescribir tiempos con array vacío; la estructura default es mejor
        if (campo === "tiempos" && Array.isArray(jsonObj[campo]) && jsonObj[campo].length === 0) continue;
        const val = campo === "beneficios" && typeof jsonObj[campo] === "string"
          ? jsonObj[campo].split("\n").filter(Boolean)
          : jsonObj[campo];
        localStorage.setItem(clave, JSON.stringify(val));
      }

      // Restaurar flags _completo para desbloquear la navegacion lateral.
      // Si el JSON contiene datos de una seccion, se considera que esa seccion ya fue completada.
      // "integracion" y "energizante" se guardan en el JSON bajo "tecnicas"
      const flagMap = {
        datos:        "datos",
        objetivos:    "objetivos",
        beneficios:   "beneficios",
        temario:      "temario",
        preguntas:    "preguntas",
        reglas:       "reglas",
        contrato:     "contrato",
        integracion:  "tecnicas",
        energizante:  "tecnicas",
        tecnicas:     "tecnicas",
        expositiva:   "expositiva",
        demostrativa: "demostrativa",
        dialogo:      "dialogo",
        cierre:       "cierre",
        evaluaciones: "evaluaciones",
        tiempos:      "tiempos"
      };
      Object.entries(flagMap).forEach(([seccion, claveJSON]) => {
        if (jsonObj[claveJSON] === undefined) return;
        // No marcar tiempos como completo si el array está vacío
        if (claveJSON === "tiempos" && Array.isArray(jsonObj[claveJSON]) && jsonObj[claveJSON].length === 0) return;
        localStorage.setItem("ec0217_" + seccion + "_completo", "true");
      });
      // "datos" siempre se marca completo si los datos del curso son validos
      localStorage.setItem("ec0217_datos_completo", "true");

      return jsonObj.datos.nombreCurso;
    }

    function prerellenarPaso1(d) {
      const campos = ["nombreCurso","instructor","disenador","lugar","fecha","duracion","participantes","perfil"];
      for (const id of campos) {
        const el = document.getElementById(id);
        if (el && d[id] !== undefined && d[id] !== "") el.value = d[id];
      }
    }

    const _inputJSON = document.getElementById("inputImportarJSON");
    if (!_inputJSON) return;
    _inputJSON.addEventListener("change", async function() {
      const file = this.files[0];
      if (!file) return;
      this.value = "";

      const status = document.getElementById("importarStatus");
      status.style.display = "inline";
      status.style.color = "#1F3B6D";
      status.textContent = "⏳ Leyendo archivo...";

      try {
        if (!file.name.endsWith(".json")) throw new Error("Solo se aceptan archivos .json. Extrae el archivo del ZIP primero.");

        const text = await file.text();
        let jsonObj;
        try { jsonObj = JSON.parse(text); }
        catch(_) { throw new Error("El archivo no es un JSON válido."); }

        const nombreCurso = cargarEnLocalStorage(jsonObj);

        // Prerellenar campos visibles del paso 1 inmediatamente
        prerellenarPaso1(jsonObj.datos || {});

        // Persistir en Supabase antes de recargar: el _cache (in-memory) se destruye
        // en el reload, así que hay que guardarlo ahora para que init() lo recupere.
        status.style.color = "#1F3B6D";
        status.textContent = "⏳ Guardando en servidor...";
        try {
          if (typeof storageSync !== "undefined" && storageSync.syncNow) {
            await storageSync.syncNow();
          }
        } catch (_) { /* no bloquear el reload si falla el sync */ }

        status.style.color = "#2e7d32";
        status.textContent = `✅ "${nombreCurso}" importado. Recargando...`;
        setTimeout(() => window.location.reload(), 1200);

        // Banner superior de confirmación
        let banner = document.getElementById("banner-importado");
        if (!banner) {
          banner = document.createElement("div");
          banner.id = "banner-importado";
          Object.assign(banner.style, {
            position:"fixed", top:"0", left:"0", right:"0", zIndex:"10000",
            background:"#2e7d32", color:"#fff", padding:"10px 20px",
            fontSize:"14px", display:"flex", alignItems:"center",
            gap:"10px", boxShadow:"0 2px 6px rgba(0,0,0,0.3)"
          });
          document.body.prepend(banner);
        }
        banner.innerHTML =
          "✅ <strong>Planeación importada:</strong> " + nombreCurso +
          ". Todos los campos están prellenados. Revisa y continúa normalmente." +
          " <button onclick=\"this.parentElement.remove()\" style=\"margin-left:auto;background:none;border:1px solid #fff;color:#fff;padding:2px 10px;border-radius:4px;cursor:pointer;\">✕</button>";
        setTimeout(() => banner && banner.remove(), 10000);

      } catch(err) {
        status.style.color = "#c62828";
        status.textContent = "⚠️ " + err.message;
        console.error("Error importando:", err);
      }
    });

    // Al cargar la página, prerellenar paso 1 si ya hay datos en localStorage
    window.addEventListener("DOMContentLoaded", function() {
      const raw = localStorage.getItem("ec0217_datos");
      if (!raw) return;
      try { prerellenarPaso1(JSON.parse(raw)); } catch(_) {}
    });
  })();

    // Poblar navbar: nombre del curso y del usuario
    (async function () {
      try {
        const raw = localStorage.getItem("ec0217_datos");
        if (raw) {
          const d = JSON.parse(raw);
          const nombre = d.nombreCurso || d.nombre_curso || "";
          if (nombre) document.getElementById("wiz-nav-curso").textContent = nombre;
        }
      } catch (_) {}
      try {
        const perfil = await getUserProfile();
        if (perfil) {
          const nombre = [perfil.nombre, perfil.apellido].filter(Boolean).join(" ") || perfil.email;
          document.getElementById("wiz-nav-nombre").textContent = nombre;
          const back = document.getElementById("wizNavBack");
          if (back) {
            if (perfil.rol === "super_admin") back.href = "superadmin";
            else if (perfil.rol === "admin")  back.href = "admin";
          }
        }
      } catch (_) {}
    })();
