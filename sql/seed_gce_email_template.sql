-- Template de email: notificación de avance en proceso GCE
-- Ejecutar en Supabase SQL Editor

INSERT INTO email_templates (slug, nombre, subject, body_html, variables)
VALUES (
  'gce_avance_proceso',
  'GCE — Avance en proceso de evaluación',
  'Actualización en tu proceso de evaluación — {{ec_codigo}}',
  '<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
      <tr><td style="background:#7c3aed;padding:24px 32px">
        <p style="margin:0;font-size:18px;font-weight:700;color:#fff">SmartBuilderEC</p>
        <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,.7)">Gestor del Ciclo de Evaluación</p>
      </td></tr>
      <tr><td style="padding:32px">
        <p style="margin:0 0 8px;font-size:15px;color:#111">Hola <strong>{{nombre}}</strong>,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6">
          Tu proceso de evaluación para la norma <strong>{{ec_codigo}}</strong> ha avanzado.
        </p>
        <div style="background:#f5f3ff;border-left:4px solid #7c3aed;border-radius:6px;padding:14px 18px;margin-bottom:24px">
          <p style="margin:0;font-size:12px;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Estado actual</p>
          <p style="margin:6px 0 0;font-size:16px;font-weight:700;color:#1f2937">{{estado_label}}</p>
        </div>
        <a href="{{link_portafolio}}"
           style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700">
          Ver mi portafolio →
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.5">
          Este es un mensaje automático de SmartBuilderEC. Si tienes dudas, contacta a tu Centro de Evaluación.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>',
  '["nombre","ec_codigo","estado_label","link_portafolio"]'
)
ON CONFLICT (slug) DO UPDATE SET
  nombre   = EXCLUDED.nombre,
  subject  = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  variables = EXCLUDED.variables;
