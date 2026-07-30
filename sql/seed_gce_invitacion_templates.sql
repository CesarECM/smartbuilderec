-- Templates de email: invitaciones GCE (candidato y evaluador)
-- Ejecutar en Supabase SQL Editor

INSERT INTO email_templates (slug, nombre, subject, body_html, variables)
VALUES (
  'gce_invitacion_candidato',
  'GCE — Invitación a proceso de evaluación',
  '{{ce_nombre}} te invita a certificar tus competencias',
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
        <p style="margin:0 0 8px;font-size:15px;color:#111">Hola,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6">
          <strong>{{ce_nombre}}</strong> te ha invitado a iniciar tu proceso de evaluación de competencias laborales a través de la plataforma SmartBuilderEC.
        </p>
        <div style="background:#f5f3ff;border-left:4px solid #7c3aed;border-radius:6px;padding:14px 18px;margin-bottom:24px">
          <p style="margin:0;font-size:12px;color:#7c3aed;font-weight:700;text-transform:uppercase;letter-spacing:.5px">¿Qué sigue?</p>
          <p style="margin:6px 0 0;font-size:13px;color:#1f2937;line-height:1.5">
            Al hacer clic en el botón podrás ver los estándares de competencia para los que fuiste invitado y confirmar tu participación.
          </p>
        </div>
        <a href="{{link_invitacion}}"
           style="display:inline-block;background:#7c3aed;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700">
          Ver mi invitación →
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.5">
          Esta invitación es válida por 7 días. Si no la solicitaste, puedes ignorar este mensaje.<br>
          Mensaje automático de SmartBuilderEC.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>',
  ARRAY['ce_nombre','link_invitacion']
)
ON CONFLICT (slug) DO UPDATE SET
  nombre    = EXCLUDED.nombre,
  subject   = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  variables = EXCLUDED.variables;


INSERT INTO email_templates (slug, nombre, subject, body_html, variables)
VALUES (
  'gce_invitacion_evaluador',
  'GCE — Invitación a unirse como evaluador',
  '{{ce_nombre}} te invita a unirte como evaluador',
  '<!DOCTYPE html>
<html lang="es">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f3f4f6;font-family:Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f3f4f6;padding:32px 16px">
  <tr><td align="center">
    <table width="560" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 2px 12px rgba(0,0,0,.08)">
      <tr><td style="background:#0f766e;padding:24px 32px">
        <p style="margin:0;font-size:18px;font-weight:700;color:#fff">SmartBuilderEC</p>
        <p style="margin:4px 0 0;font-size:12px;color:rgba(255,255,255,.7)">Gestor del Ciclo de Evaluación</p>
      </td></tr>
      <tr><td style="padding:32px">
        <p style="margin:0 0 8px;font-size:15px;color:#111">Hola,</p>
        <p style="margin:0 0 20px;font-size:14px;color:#444;line-height:1.6">
          <strong>{{ce_nombre}}</strong> te ha invitado a unirte a su equipo como <strong>evaluador</strong> en la plataforma SmartBuilderEC.
        </p>
        <div style="background:#f0fdfa;border-left:4px solid #0f766e;border-radius:6px;padding:14px 18px;margin-bottom:24px">
          <p style="margin:0;font-size:12px;color:#0f766e;font-weight:700;text-transform:uppercase;letter-spacing:.5px">Tu rol como evaluador</p>
          <p style="margin:6px 0 0;font-size:13px;color:#1f2937;line-height:1.5">
            Podrás gestionar procesos de evaluación de candidatos, emitir juicios de competencia y seguir el avance de cada proceso.
          </p>
        </div>
        <a href="{{link_invitacion}}"
           style="display:inline-block;background:#0f766e;color:#fff;text-decoration:none;padding:12px 24px;border-radius:8px;font-size:14px;font-weight:700">
          Aceptar invitación →
        </a>
        <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.5">
          Esta invitación es válida por 7 días. Si no la solicitaste, puedes ignorar este mensaje.<br>
          Mensaje automático de SmartBuilderEC.
        </p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>',
  ARRAY['ce_nombre','link_invitacion']
)
ON CONFLICT (slug) DO UPDATE SET
  nombre    = EXCLUDED.nombre,
  subject   = EXCLUDED.subject,
  body_html = EXCLUDED.body_html,
  variables = EXCLUDED.variables;
