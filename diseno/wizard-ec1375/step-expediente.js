// ─── wizard-ec1375/step-expediente.js — Paso 7: Revisión y descarga ZIP ───────

export function cargarExpediente75() {
  const secciones = [
    { clave: "ec1375_datos",          label: "Datos del auxiliar" },
    { clave: "ec1375_espacio",        label: "Espacio y protocolos" },
    { clave: "ec1375_usuario",        label: "Datos del usuario" },
    { clave: "ec1375_signos",         label: "Signos vitales" },
    { clave: "ec1375_consentimiento", label: "Técnica y consentimiento" },
    { clave: "ec1375_seguimiento",    label: "Plan de seguimiento" },
  ];

  const lista = document.getElementById("exp75Lista");
  if (!lista) return;

  const items = secciones.map(({ clave, label }) => {
    const completo = localStorage.getItem(`${clave}_completo`) === "true";
    return `<li style="display:flex;align-items:center;gap:10px;padding:8px 0;border-bottom:1px solid #f1f5f9;">
      <span style="font-size:18px;">${completo ? "✅" : "⚠️"}</span>
      <span style="font-size:14px;${completo ? "" : "color:#b45309;"}">${label}${completo ? "" : " — pendiente"}</span>
    </li>`;
  }).join("");

  lista.innerHTML = `<ul style="list-style:none;padding:0;">${items}</ul>`;

  const todoCompleto = secciones.every(({ clave }) => localStorage.getItem(`${clave}_completo`) === "true");
  const btn = document.getElementById("btn75Descargar");
  if (btn) {
    btn.disabled = !todoCompleto;
    btn.title = todoCompleto ? "Descargar expediente" : "Completa todos los pasos para descargar";
  }

  // Resumen del auxiliar y usuario
  const rawAx = localStorage.getItem("ec1375_datos");
  const rawUs = localStorage.getItem("ec1375_usuario");
  const ax = rawAx ? JSON.parse(rawAx) : {};
  const us = rawUs ? JSON.parse(rawUs) : {};

  const resumen = document.getElementById("exp75Resumen");
  if (resumen) {
    resumen.innerHTML = `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;font-size:13px;">
        <div>
          <div style="font-weight:700;margin-bottom:6px;">Auxiliar</div>
          <div>${[ax.aux75Nombre, ax.aux75Apellidos].filter(Boolean).join(" ") || "—"}</div>
          <div style="color:#666;">${ax.aux75Centro || ""}</div>
          <div style="color:#666;">${ax.aux75Fecha || ""}</div>
        </div>
        <div>
          <div style="font-weight:700;margin-bottom:6px;">Usuario</div>
          <div>${us.usr75Nombre || "—"}</div>
          <div style="color:#666;">Motivo: ${us.usr75Motivo?.slice(0, 60) || ""}${us.usr75Motivo?.length > 60 ? "…" : ""}</div>
        </div>
      </div>`;
  }
}

export function initStepExpediente75() {
  window.cargarExpediente75 = cargarExpediente75;
}

export function getTemplate() {
  return `
  <section id="sec75Expediente" class="wizard-section hidden">
    <p class="paso-titulo">Paso 7 de 7</p>
    <h1>Revisión del Expediente</h1>
    <div class="card" style="max-width:800px;">
      <p style="color:#555;font-size:14px;">
        Revisa que todos los pasos estén completos antes de generar el paquete de documentos.
        El ZIP incluirá 4 documentos Word listos para imprimir y archivar.
      </p>

      <div id="exp75Resumen" style="background:#f8fafc;border-radius:10px;padding:16px;margin-bottom:16px;"></div>

      <h3 style="font-size:14px;font-weight:700;margin-bottom:8px;">Estado por sección</h3>
      <div id="exp75Lista"></div>

      <div style="margin-top:20px;padding:16px;background:#eff6ff;border-radius:10px;font-size:13px;color:#1e3a5f;">
        <strong>El ZIP incluirá:</strong>
        <ul style="margin:8px 0 0 16px;line-height:2;">
          <li>01_Ficha_Registro_Atencion.docx — Ficha del usuario con signos vitales</li>
          <li>02_Lista_Verificacion_Espacio.docx — Checklist E4323</li>
          <li>03_Consentimiento_Informado.docx — Carta con firma</li>
          <li>04_Plan_Seguimiento_Sesiones.docx — Plan de seguimiento</li>
        </ul>
      </div>

      <button class="btn-primary" id="btn75Descargar" style="margin-top:24px;width:100%;padding:14px;font-size:15px;" disabled>
        ⬇ Generar y descargar expediente EC1375
      </button>
    </div>
  </section>`;
}
