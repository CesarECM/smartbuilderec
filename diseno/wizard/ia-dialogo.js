// ─── wizard/ia-dialogo.js — IA para Técnica Diálogo/Discusión ───────────────
// generarDialogoIA: genera un campo individual de la técnica diálogo/discusión

import { llamarIA } from "./api.js";
import { guardarUndo, mostrarUndo, iniciarBatch, finalizarBatch } from "./undo.js";

const IDS_DIALOGO = {
  actividad:     "dialogoActividad",
  instrucciones: "dialogoInstrucciones",
  ejemplos:      "dialogoEjemplos",
  conclusion:    "dialogoConclusion",
};

export async function generarDialogoIA(campo, boton) {
  const datos     = getData("ec0217_datos")     || {};
  const objetivos = getData("ec0217_objetivos") || {};
  const temario   = getData("ec0217_temario")   || {};

  const textareaDestino = document.getElementById(IDS_DIALOGO[campo]);
  if (!textareaDestino) return;

  guardarUndo("ec0217_dialogo", "cargarDialogo");
  try {
    boton.disabled    = true;
    boton.textContent = "Generando...";

    const data = await llamarIA("generate-dialogo", {
      campo,
      nombreCurso:      datos.nombreCurso    || "",
      perfil:           datos.perfil         || "",
      objetivoAfectivo: objetivos.afectiva   || "",
      objetivoGeneral:  objetivos.general    || "",
      temario,
    });

    textareaDestino.value = data.texto || "";
    if (typeof window.guardarDialogoTemporal === "function") window.guardarDialogoTemporal();
    mostrarUndo("Técnica Diálogo", IDS_DIALOGO[campo]);

  } catch (err) {
    console.error("Error al generar técnica diálogo/discusión:", err);
    const msg = typeof mensajeAmigable === "function" ? mensajeAmigable(err) : err.message;
    if (typeof showAlert === "function") showAlert(`No se pudo generar el texto:\n\n${msg}`);
  } finally {
    boton.disabled    = false;
    boton.textContent = "Generar con IA";
  }
}

export function initIADialogo() {
  window.generarDialogoIA = generarDialogoIA;

  // ── Diálogo: botones individuales ─────────────────────────────────────────
  document.querySelectorAll(".btn-ia-dialogo").forEach(btn => {
    btn.addEventListener("click", () => generarDialogoIA(btn.dataset.campo, btn));
  });

  // ── Diálogo: botón Generar todo ───────────────────────────────────────────
  const btnTodo = document.getElementById("btnGenerarTodoDialogo");
  if (btnTodo) {
    btnTodo.addEventListener("click", () => {
      const vacios = Object.entries(IDS_DIALOGO)
        .filter(([, id]) => !document.getElementById(id)?.value.trim())
        .map(([campo]) => campo);
      if (!vacios.length) {
        if (typeof showAlert === "function") showAlert("Todos los campos ya tienen contenido.");
        return;
      }
      if (vacios.length < Object.keys(IDS_DIALOGO).length &&
          !confirm("Algunos campos ya tienen contenido. ¿Generar solo los vacíos?")) return;
      _generarTodoDialogo(vacios, btnTodo);
    });
  }
}

async function _generarTodoDialogo(campos, btnTodo) {
  iniciarBatch("ec0217_dialogo", "cargarDialogo");
  btnTodo.disabled = true;
  const original = btnTodo.textContent;
  let completados = 0;
  btnTodo.textContent = `Generando 0/${campos.length}...`;
  try {
    await Promise.all(campos.map(async campo => {
      const fb = { disabled: false, textContent: "" };
      await generarDialogoIA(campo, fb);
      completados++;
      btnTodo.textContent = `Generando ${completados}/${campos.length}...`;
    }));
    window.guardarDialogoFinal?.();
    finalizarBatch("Técnica Diálogo completa");
  } catch (err) {
    const msg = typeof mensajeAmigable === "function" ? mensajeAmigable(err) : err.message;
    if (typeof showAlert === "function") showAlert(`⚠️ Error al generar:\n${msg}`);
  } finally {
    btnTodo.disabled = false;
    btnTodo.textContent = original;
  }
}
