-- Templates de email para recordatorios automáticos GCE (S6 del MPS #017)
-- Ejecutar en Supabase SQL Editor antes de activar el cron job en Render

INSERT INTO email_templates (slug, nombre, subject, body_html, variables)
VALUES (
  'gce_recordatorio_ficha',
  'GCE — Recordatorio: candidato sin Ficha',
  '⏰ {{candidato_nombre}} aún no llena su Ficha de Registro — {{ec_codigo}}',
  '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
      <tr><td style="background:#4c1d95;padding:24px 32px">
        <p style="margin:0;font-size:18px;font-weight:700;color:#fff">SmartBuilderEC</p>
        <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,.7)">Recordatorio automático</p>
      </td></tr>
      <tr><td style="padding:32px">
        <p style="margin:0 0 16px;font-size:15px;color:#111">Hola <strong>{{nombre}}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6">
          Han pasado 24 horas desde que abriste el proceso de evaluación para <strong>{{candidato_nombre}}</strong> ({{ec_codigo}}) y el candidato aún no ha llenado su Ficha de Registro.
        </p>
        <p style="margin:0 0 24px;font-size:13px;color:#6b7280">Comparte el enlace del portal para que pueda completar este primer paso.</p>
        <a href="{{link_portafolio}}" style="display:inline-block;background:#4c1d95;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700">Ver proceso →</a>
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

INSERT INTO email_templates (slug, nombre, subject, body_html, variables)
VALUES (
  'gce_recordatorio_diagnostico',
  'GCE — Recordatorio: candidato sin completar Diagnóstico',
  '⏰ {{candidato_nombre}} aún no termina el Diagnóstico — {{ec_codigo}}',
  '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
      <tr><td style="background:#4c1d95;padding:24px 32px">
        <p style="margin:0;font-size:18px;font-weight:700;color:#fff">SmartBuilderEC</p>
        <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,.7)">Recordatorio automático</p>
      </td></tr>
      <tr><td style="padding:32px">
        <p style="margin:0 0 16px;font-size:15px;color:#111">Hola <strong>{{nombre}}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6">
          <strong>{{candidato_nombre}}</strong> lleva más de 24 horas en el paso de Diagnóstico y aún no lo completa ({{ec_codigo}}).
        </p>
        <p style="margin:0 0 24px;font-size:13px;color:#6b7280">Puedes contactar al candidato para que retome el proceso.</p>
        <a href="{{link_portafolio}}" style="display:inline-block;background:#4c1d95;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700">Ver proceso →</a>
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

INSERT INTO email_templates (slug, nombre, subject, body_html, variables)
VALUES (
  'gce_recordatorio_plan_ev',
  'GCE — Recordatorio: evaluador sin elaborar el Plan',
  '⏰ El evaluador no ha elaborado el Plan para {{candidato_nombre}}',
  '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
      <tr><td style="background:#78350f;padding:24px 32px">
        <p style="margin:0;font-size:18px;font-weight:700;color:#fff">SmartBuilderEC</p>
        <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,.7)">Recordatorio automático</p>
      </td></tr>
      <tr><td style="padding:32px">
        <p style="margin:0 0 16px;font-size:15px;color:#111">Hola <strong>{{nombre}}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6">
          Han pasado 48 horas y el evaluador asignado aún no ha elaborado el Plan de Evaluación para <strong>{{candidato_nombre}}</strong> ({{ec_codigo}}).
        </p>
        <p style="margin:0 0 24px;font-size:13px;color:#6b7280">Considera contactar directamente al evaluador o reasignar el proceso.</p>
        <a href="{{link_portafolio}}" style="display:inline-block;background:#78350f;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700">Ver proceso →</a>
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

INSERT INTO email_templates (slug, nombre, subject, body_html, variables)
VALUES (
  'gce_recordatorio_plan_cand',
  'GCE — Recordatorio: candidato sin confirmar el Plan',
  '⏰ {{candidato_nombre}} no ha confirmado el Plan de Evaluación',
  '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
      <tr><td style="background:#4c1d95;padding:24px 32px">
        <p style="margin:0;font-size:18px;font-weight:700;color:#fff">SmartBuilderEC</p>
        <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,.7)">Recordatorio automático</p>
      </td></tr>
      <tr><td style="padding:32px">
        <p style="margin:0 0 16px;font-size:15px;color:#111">Hola <strong>{{nombre}}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6">
          El Plan de Evaluación está listo, pero <strong>{{candidato_nombre}}</strong> lleva más de 24 horas sin confirmarlo ({{ec_codigo}}).
        </p>
        <p style="margin:0 0 24px;font-size:13px;color:#6b7280">Comparte el enlace del portal para que pueda revisarlo y firmarlo.</p>
        <a href="{{link_portafolio}}" style="display:inline-block;background:#4c1d95;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700">Ver proceso →</a>
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

INSERT INTO email_templates (slug, nombre, subject, body_html, variables)
VALUES (
  'gce_recordatorio_encuesta',
  'GCE — Recordatorio: candidato sin completar la Encuesta',
  '⏰ {{candidato_nombre}} no ha completado la Encuesta de Satisfacción',
  '<!DOCTYPE html><html lang="es"><head><meta charset="UTF-8"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
      <tr><td style="background:#4c1d95;padding:24px 32px">
        <p style="margin:0;font-size:18px;font-weight:700;color:#fff">SmartBuilderEC</p>
        <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,.7)">Recordatorio automático</p>
      </td></tr>
      <tr><td style="padding:32px">
        <p style="margin:0 0 16px;font-size:15px;color:#111">Hola <strong>{{nombre}}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6">
          La Cédula de Evaluación está lista, pero <strong>{{candidato_nombre}}</strong> lleva más de 48 horas sin completar la Encuesta de Satisfacción ({{ec_codigo}}).
        </p>
        <p style="margin:0 0 24px;font-size:13px;color:#6b7280">Comparte el enlace del portal para cerrar el proceso.</p>
        <a href="{{link_portafolio}}" style="display:inline-block;background:#4c1d95;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700">Ver proceso →</a>
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
