-- Templates de email para momentos clave del ciclo GCE (S5 del MPS #017)
-- Ejecutar en Supabase SQL Editor

-- gce_ficha_completa → CE cuando candidato termina la Ficha (estado → diagnostico)
INSERT INTO email_templates (slug, nombre, subject, body_html, variables)
VALUES (
  'gce_ficha_completa',
  'GCE — Candidato completó su Ficha de Registro',
  '{{candidato_nombre}} completó su Ficha de Registro — {{ec_codigo}}',
  '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
      <tr><td style="background:#4c1d95;padding:24px 32px">
        <p style="margin:0;font-size:18px;font-weight:700;color:#fff">SmartBuilderEC</p>
        <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,.7)">Gestor del Ciclo de Evaluación</p>
      </td></tr>
      <tr><td style="padding:32px">
        <p style="margin:0 0 16px;font-size:15px;color:#111">Hola <strong>{{nombre}}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6">
          <strong>{{candidato_nombre}}</strong> completó su Ficha de Registro y comenzó el Diagnóstico de competencias para el estándar <strong>{{ec_codigo}}</strong>.
        </p>
        <div style="background:#f5f3ff;border-left:4px solid #7c3aed;border-radius:6px;padding:14px 18px;margin-bottom:24px">
          <p style="margin:0;font-size:12px;color:#7c3aed;font-weight:700">SIGUIENTE PASO</p>
          <p style="margin:6px 0 0;font-size:13px;color:#1f2937;line-height:1.5">
            El candidato está realizando el Diagnóstico. Al terminar, el evaluador asignado recibirá un aviso para elaborar el Plan de Evaluación.
          </p>
        </div>
        <a href="{{link_portafolio}}" style="display:inline-block;background:#4c1d95;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700">
          Ver proceso →
        </a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>',
  ARRAY['nombre','candidato_nombre','ec_codigo','link_portafolio']
)
ON CONFLICT (slug) DO UPDATE SET
  nombre=EXCLUDED.nombre, subject=EXCLUDED.subject,
  body_html=EXCLUDED.body_html, variables=EXCLUDED.variables;

-- gce_diagnostico_completo → EV cuando candidato termina el Diagnóstico (estado → plan_acordado)
INSERT INTO email_templates (slug, nombre, subject, body_html, variables)
VALUES (
  'gce_diagnostico_completo',
  'GCE — Candidato completó el Diagnóstico',
  '{{candidato_nombre}} completó el Diagnóstico — elabora el Plan',
  '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
      <tr><td style="background:#1e3a5f;padding:24px 32px">
        <p style="margin:0;font-size:18px;font-weight:700;color:#fff">SmartBuilderEC</p>
        <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,.7)">Gestor del Ciclo de Evaluación</p>
      </td></tr>
      <tr><td style="padding:32px">
        <p style="margin:0 0 16px;font-size:15px;color:#111">Hola <strong>{{nombre}}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6">
          <strong>{{candidato_nombre}}</strong> completó el Diagnóstico de competencias para el estándar <strong>{{ec_codigo}}</strong>.
        </p>
        <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:6px;padding:14px 18px;margin-bottom:24px">
          <p style="margin:0;font-size:12px;color:#1e40af;font-weight:700">ACCIÓN REQUERIDA</p>
          <p style="margin:6px 0 0;font-size:13px;color:#1f2937;line-height:1.5">
            Ingresa al portal, revisa los resultados del Diagnóstico y elabora el Plan de Evaluación con fechas y técnicas a aplicar.
          </p>
        </div>
        <a href="{{link_portafolio}}" style="display:inline-block;background:#1e3a5f;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700">
          Elaborar Plan →
        </a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>',
  ARRAY['nombre','candidato_nombre','ec_codigo','link_portafolio']
)
ON CONFLICT (slug) DO UPDATE SET
  nombre=EXCLUDED.nombre, subject=EXCLUDED.subject,
  body_html=EXCLUDED.body_html, variables=EXCLUDED.variables;

-- gce_plan_listo → CA cuando el evaluador firma el Plan
INSERT INTO email_templates (slug, nombre, subject, body_html, variables)
VALUES (
  'gce_plan_listo',
  'GCE — Tu Plan de Evaluación está listo',
  'El evaluador preparó tu Plan de Evaluación — {{ec_codigo}}',
  '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
      <tr><td style="background:#4c1d95;padding:24px 32px">
        <p style="margin:0;font-size:18px;font-weight:700;color:#fff">SmartBuilderEC</p>
        <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,.7)">Gestor del Ciclo de Evaluación</p>
      </td></tr>
      <tr><td style="padding:32px">
        <p style="margin:0 0 16px;font-size:15px;color:#111">Hola <strong>{{nombre}}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6">
          El evaluador preparó el Plan de Evaluación para tu proceso bajo el estándar <strong>{{ec_codigo}}</strong>.
        </p>
        <div style="background:#fefce8;border-left:4px solid #facc15;border-radius:6px;padding:14px 18px;margin-bottom:24px">
          <p style="margin:0;font-size:12px;color:#854d0e;font-weight:700">ACCIÓN REQUERIDA</p>
          <p style="margin:6px 0 0;font-size:13px;color:#1f2937;line-height:1.5">
            Ingresa al portal, revisa el Plan de Evaluación con atención y confírmalo para continuar con la evaluación.
          </p>
        </div>
        <a href="{{link_portafolio}}" style="display:inline-block;background:#4c1d95;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700">
          Revisar Plan →
        </a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>',
  ARRAY['nombre','ec_codigo','link_portafolio']
)
ON CONFLICT (slug) DO UPDATE SET
  nombre=EXCLUDED.nombre, subject=EXCLUDED.subject,
  body_html=EXCLUDED.body_html, variables=EXCLUDED.variables;

-- gce_plan_acordado → CE cuando ambas firmas están en el Plan
INSERT INTO email_templates (slug, nombre, subject, body_html, variables)
VALUES (
  'gce_plan_acordado',
  'GCE — Plan de Evaluación acordado',
  'Plan acordado con {{candidato_nombre}} — evaluación en marcha',
  '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
      <tr><td style="background:#4c1d95;padding:24px 32px">
        <p style="margin:0;font-size:18px;font-weight:700;color:#fff">SmartBuilderEC</p>
        <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,.7)">Gestor del Ciclo de Evaluación</p>
      </td></tr>
      <tr><td style="padding:32px">
        <p style="margin:0 0 16px;font-size:15px;color:#111">Hola <strong>{{nombre}}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6">
          El Plan de Evaluación de <strong>{{candidato_nombre}}</strong> para el estándar <strong>{{ec_codigo}}</strong> fue acordado por ambas partes.
        </p>
        <div style="background:#f0fdf4;border-left:4px solid #4ade80;border-radius:6px;padding:14px 18px;margin-bottom:24px">
          <p style="margin:0;font-size:12px;color:#14532d;font-weight:700">TODO EN ORDEN</p>
          <p style="margin:6px 0 0;font-size:13px;color:#1f2937;line-height:1.5">
            El evaluador está aplicando el Instrumento de Evaluación de Competencias (IEC). Recibirás una notificación cuando se emita la Cédula de Evaluación.
          </p>
        </div>
        <a href="{{link_portafolio}}" style="display:inline-block;background:#4c1d95;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700">
          Ver proceso →
        </a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>',
  ARRAY['nombre','candidato_nombre','ec_codigo','link_portafolio']
)
ON CONFLICT (slug) DO UPDATE SET
  nombre=EXCLUDED.nombre, subject=EXCLUDED.subject,
  body_html=EXCLUDED.body_html, variables=EXCLUDED.variables;

-- gce_proceso_completado → CE cuando el estado llega a certificado
INSERT INTO email_templates (slug, nombre, subject, body_html, variables)
VALUES (
  'gce_proceso_completado',
  'GCE — Proceso de evaluación completado',
  '{{candidato_nombre}} completó su proceso de evaluación — {{ec_codigo}}',
  '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
      <tr><td style="background:#14532d;padding:24px 32px">
        <p style="margin:0;font-size:18px;font-weight:700;color:#fff">SmartBuilderEC</p>
        <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,.7)">Gestor del Ciclo de Evaluación</p>
      </td></tr>
      <tr><td style="padding:32px">
        <p style="margin:0 0 16px;font-size:15px;color:#111">Hola <strong>{{nombre}}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6">
          El proceso de evaluación de <strong>{{candidato_nombre}}</strong> para el estándar <strong>{{ec_codigo}}</strong> ha concluido exitosamente.
        </p>
        <div style="background:#f0fdf4;border-left:4px solid #4ade80;border-radius:6px;padding:14px 18px;margin-bottom:24px">
          <p style="margin:0;font-size:12px;color:#14532d;font-weight:700">PROCESO COMPLETADO ✓</p>
          <p style="margin:6px 0 0;font-size:13px;color:#1f2937;line-height:1.5">
            El expediente completo está disponible para descarga en el portal.
          </p>
        </div>
        <a href="{{link_portafolio}}" style="display:inline-block;background:#14532d;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700">
          Ver expediente →
        </a>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>',
  ARRAY['nombre','candidato_nombre','ec_codigo','link_portafolio']
)
ON CONFLICT (slug) DO UPDATE SET
  nombre=EXCLUDED.nombre, subject=EXCLUDED.subject,
  body_html=EXCLUDED.body_html, variables=EXCLUDED.variables;
