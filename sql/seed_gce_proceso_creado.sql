-- Templates de email para notificaciones al crear/asignar proceso GCE
-- Ejecutar en Supabase SQL Editor (S2 + S2b del MPS #017)

-- S2: Notificación al candidato cuando el CE abre su proceso
INSERT INTO email_templates (slug, nombre, subject, body_html, variables)
VALUES (
  'gce_proceso_creado',
  'GCE — Tu proceso de evaluación fue abierto',
  '{{ce_nombre}} abrió tu proceso de evaluación — {{ec_codigo}}',
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
          <strong>{{ce_nombre}}</strong> ha abierto un proceso de evaluación de competencias para ti en el estándar <strong>{{ec_codigo}}</strong>.
        </p>
        <div style="background:#f5f3ff;border-left:4px solid #7c3aed;border-radius:6px;padding:14px 18px;margin-bottom:24px">
          <p style="margin:0;font-size:12px;color:#7c3aed;font-weight:700">PRIMER PASO</p>
          <p style="margin:6px 0 0;font-size:13px;color:#1f2937;line-height:1.5">
            Accede al portal y llena tu Ficha de Registro con tus datos personales para comenzar el proceso.
          </p>
        </div>
        <a href="{{link_portafolio}}" style="display:inline-block;background:#4c1d95;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700">
          Ir a mi proceso →
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.5">
          Si tienes dudas, comunícate con tu Centro de Evaluación.<br>
          Mensaje automático de SmartBuilderEC.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>',
  ARRAY['nombre','ce_nombre','ec_codigo','link_portafolio']
)
ON CONFLICT (slug) DO UPDATE SET
  nombre    = EXCLUDED.nombre,
  subject   = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  variables = EXCLUDED.variables;

-- S2b: Notificación al evaluador cuando el CE le asigna un proceso
INSERT INTO email_templates (slug, nombre, subject, body_html, variables)
VALUES (
  'gce_proceso_asignado',
  'GCE — Tienes un nuevo proceso asignado',
  'Tienes un nuevo proceso asignado — {{candidato_nombre}} / {{ec_codigo}}',
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
          <strong>{{ce_nombre}}</strong> te ha asignado un proceso de evaluación para el candidato <strong>{{candidato_nombre}}</strong> bajo el estándar <strong>{{ec_codigo}}</strong>.
        </p>
        <div style="background:#eff6ff;border-left:4px solid #3b82f6;border-radius:6px;padding:14px 18px;margin-bottom:24px">
          <p style="margin:0;font-size:12px;color:#1e40af;font-weight:700">PRÓXIMO PASO</p>
          <p style="margin:6px 0 0;font-size:13px;color:#1f2937;line-height:1.5">
            Ingresa al portal, revisa la Ficha de Registro del candidato y elabora el Plan de Evaluación una vez que complete el Diagnóstico.
          </p>
        </div>
        <a href="{{link_portafolio}}" style="display:inline-block;background:#1e3a5f;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700">
          Ver el proceso →
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.5">
          Mensaje automático de SmartBuilderEC.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>',
  ARRAY['nombre','ce_nombre','candidato_nombre','ec_codigo','link_portafolio']
)
ON CONFLICT (slug) DO UPDATE SET
  nombre    = EXCLUDED.nombre,
  subject   = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  variables = EXCLUDED.variables;
