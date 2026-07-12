// ─── wizard/step-materiales.js — Paso 16: Materiales y Requerimientos ────────

export function guardarMateriales() {
  const g = id => document.getElementById(id)?.value || "";
  const materiales = {
    integracion:          g("mat-integracion"),
    expositiva:           g("mat-expositiva"),
    demostrativa:         g("mat-demostrativa"),
    energizante:          g("mat-energizante"),
    dialogo:              g("mat-dialogo"),
    instalaciones:        g("req-instalaciones"),
    equipo:               g("req-equipo"),
    materialesDidacticos: g("req-materiales-didacticos"),
    humanos:              g("req-humanos"),
    otros:                g("req-otros"),
    seguridad:            g("req-seguridad"),
  };
  localStorage.setItem("ec0217_materiales", JSON.stringify(materiales));
}

export function cargarMateriales() {
  const raw = localStorage.getItem("ec0217_materiales");
  if (!raw) return;
  try {
    const m = JSON.parse(raw);
    ["integracion","expositiva","demostrativa","energizante","dialogo"].forEach(t => {
      const el = document.getElementById(`mat-${t}`);
      if (el && m[t]) el.value = m[t];
    });
    const mapReq = {
      instalaciones:        "req-instalaciones",
      equipo:               "req-equipo",
      materialesDidacticos: "req-materiales-didacticos",
      humanos:              "req-humanos",
      otros:                "req-otros",
      seguridad:            "req-seguridad",
    };
    Object.entries(mapReq).forEach(([key, id]) => {
      const el = document.getElementById(id);
      if (el && m[key]) el.value = m[key];
    });
  } catch (_) {}
}

export function initStepMateriales() {
  window.guardarMateriales = guardarMateriales;
  window.cargarMateriales  = cargarMateriales;
}
