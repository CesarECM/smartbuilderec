-- ═══════════════════════════════════════════════════════════════════════════
-- SmartBuilderEC — Migración: 5 nuevas plantillas de email transaccional
-- Ejecutar en Supabase SQL Editor (seguro repetir: ON CONFLICT DO NOTHING)
-- ═══════════════════════════════════════════════════════════════════════════

INSERT INTO public.email_templates (slug, nombre, subject, variables, body_html) VALUES

-- ── 1. Renovación de admin ────────────────────────────────────────────────
('renovacion_admin', 'Renovación de Cuenta Admin',
 'Tu cuenta SmartBuilderEC ha sido renovada',
 ARRAY['nombre','email','creditos','vigencia_hasta'],
$html$<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:32px 16px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#1F3B6D;padding:28px 40px">
  <p style="margin:0;color:#fff;font-size:22px;font-weight:700">SmartBuilderEC</p>
  <p style="margin:4px 0 0;color:#93c5fd;font-size:12px">EC0217.01 · Planeación Didáctica</p>
</td></tr>
<tr><td style="padding:36px 40px;color:#1e293b;font-size:15px;line-height:1.7">
  <p style="margin:0 0 16px">Hola <strong>{{nombre}}</strong>,</p>
  <p style="margin:0 0 20px">Tu cuenta de Administrador en SmartBuilderEC ha sido renovada exitosamente. Ya puedes continuar gestionando a tus instructores sin interrupciones.</p>
  <table cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:28px;width:100%;box-sizing:border-box">
    <tr><td style="font-size:13px;color:#166534;padding:4px 0"><strong>Cuenta:</strong> {{email}}</td></tr>
    <tr><td style="font-size:13px;color:#166534;padding:4px 0"><strong>Créditos disponibles:</strong> {{creditos}}</td></tr>
    <tr><td style="font-size:13px;color:#166534;padding:4px 0"><strong>Vigencia hasta:</strong> {{vigencia_hasta}}</td></tr>
  </table>
  <table cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:8px;background:#1F3B6D">
    <a href="https://www.smartbuilderec.com/login.html" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none">Ir a mi panel →</a>
  </td></tr></table>
</td></tr>
<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px;text-align:center">
  <p style="margin:0;color:#94a3b8;font-size:12px">SmartBuilderEC · <a href="https://www.smartbuilderec.com" style="color:#1F3B6D;text-decoration:none">smartbuilderec.com</a></p>
</td></tr>
</table></td></tr></table>
</body></html>$html$),

-- ── 2. Alerta de créditos bajos ───────────────────────────────────────────
('creditos_bajos_admin', 'Alerta — Créditos Bajos',
 'Atención: solo te queda {{creditos_restantes}} crédito en SmartBuilderEC',
 ARRAY['nombre','email','creditos_restantes'],
$html$<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:32px 16px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#92400e;padding:28px 40px">
  <p style="margin:0;color:#fff;font-size:22px;font-weight:700">SmartBuilderEC</p>
  <p style="margin:4px 0 0;color:#fde68a;font-size:12px">Aviso de cuenta</p>
</td></tr>
<tr><td style="padding:36px 40px;color:#1e293b;font-size:15px;line-height:1.7">
  <p style="margin:0 0 16px">Hola <strong>{{nombre}}</strong>,</p>
  <p style="margin:0 0 20px">Tu cuenta de Administrador solo tiene <strong>{{creditos_restantes}} crédito disponible</strong>. Cuando se agoten, no podrás registrar nuevos instructores.</p>
  <table cellpadding="0" cellspacing="0" border="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 20px;margin-bottom:28px;width:100%;box-sizing:border-box">
    <tr><td style="font-size:13px;color:#92400e">⚠️ Para seguir incorporando instructores, contacta al administrador de la plataforma para renovar tus créditos.</td></tr>
  </table>
  <p style="margin:0;font-size:13px;color:#64748b">Responde a este correo o escríbenos para solicitar más créditos.</p>
</td></tr>
<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px;text-align:center">
  <p style="margin:0;color:#94a3b8;font-size:12px">SmartBuilderEC · <a href="https://www.smartbuilderec.com" style="color:#1F3B6D;text-decoration:none">smartbuilderec.com</a></p>
</td></tr>
</table></td></tr></table>
</body></html>$html$),

-- ── 3. Suscripción cancelada ──────────────────────────────────────────────
('suscripcion_cancelada', 'Suscripción Cancelada',
 'Tu suscripción a SmartBuilderEC ha finalizado',
 ARRAY['nombre','email'],
$html$<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:32px 16px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#475569;padding:28px 40px">
  <p style="margin:0;color:#fff;font-size:22px;font-weight:700">SmartBuilderEC</p>
  <p style="margin:4px 0 0;color:#cbd5e1;font-size:12px">Aviso de cuenta</p>
</td></tr>
<tr><td style="padding:36px 40px;color:#1e293b;font-size:15px;line-height:1.7">
  <p style="margin:0 0 16px">Hola <strong>{{nombre}}</strong>,</p>
  <p style="margin:0 0 20px">Tu suscripción a SmartBuilderEC asociada a <strong>{{email}}</strong> ha finalizado y tu acceso ha sido desactivado.</p>
  <table cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:14px 20px;margin-bottom:28px;width:100%;box-sizing:border-box">
    <tr><td style="font-size:13px;color:#475569">Si crees que esto es un error o deseas reactivar tu acceso, responde a este correo y te ayudaremos a la brevedad.</td></tr>
  </table>
  <p style="margin:0;font-size:13px;color:#64748b">Gracias por haber confiado en SmartBuilderEC. Tus planeaciones quedan guardadas y disponibles si decides renovar.</p>
</td></tr>
<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px;text-align:center">
  <p style="margin:0;color:#94a3b8;font-size:12px">SmartBuilderEC · <a href="https://www.smartbuilderec.com" style="color:#1F3B6D;text-decoration:none">smartbuilderec.com</a></p>
</td></tr>
</table></td></tr></table>
</body></html>$html$),

-- ── 4. Ticket de soporte creado (confirmación al usuario) ─────────────────
('ticket_soporte_creado', 'Confirmación de Ticket de Soporte',
 'Recibimos tu consulta — Ticket #{{numero_ticket}}',
 ARRAY['nombre','email','asunto_ticket','numero_ticket'],
$html$<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:32px 16px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#1F3B6D;padding:28px 40px">
  <p style="margin:0;color:#fff;font-size:22px;font-weight:700">SmartBuilderEC</p>
  <p style="margin:4px 0 0;color:#93c5fd;font-size:12px">Soporte · EC0217.01</p>
</td></tr>
<tr><td style="padding:36px 40px;color:#1e293b;font-size:15px;line-height:1.7">
  <p style="margin:0 0 16px">Hola <strong>{{nombre}}</strong>,</p>
  <p style="margin:0 0 20px">Hemos recibido tu consulta. Nuestro equipo la revisará a la brevedad y te responderá en este correo.</p>
  <table cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:28px;width:100%;box-sizing:border-box">
    <tr><td style="font-size:13px;color:#475569;padding:4px 0"><strong>Número de ticket:</strong> #{{numero_ticket}}</td></tr>
    <tr><td style="font-size:13px;color:#475569;padding:4px 0"><strong>Asunto:</strong> {{asunto_ticket}}</td></tr>
  </table>
  <p style="margin:0;font-size:13px;color:#64748b">Si tienes información adicional sobre tu consulta, responde directamente a este correo.</p>
</td></tr>
<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px;text-align:center">
  <p style="margin:0;color:#94a3b8;font-size:12px">SmartBuilderEC · <a href="https://www.smartbuilderec.com" style="color:#1F3B6D;text-decoration:none">smartbuilderec.com</a></p>
</td></tr>
</table></td></tr></table>
</body></html>$html$),

-- ── 5. Ticket de soporte resuelto ─────────────────────────────────────────
('ticket_soporte_resuelto', 'Ticket de Soporte Respondido',
 'Tu consulta fue respondida — Ticket #{{numero_ticket}}',
 ARRAY['nombre','email','asunto_ticket','numero_ticket','resolucion'],
$html$<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:32px 16px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#065f46;padding:28px 40px">
  <p style="margin:0;color:#fff;font-size:22px;font-weight:700">SmartBuilderEC</p>
  <p style="margin:4px 0 0;color:#6ee7b7;font-size:12px">Soporte · Consulta resuelta</p>
</td></tr>
<tr><td style="padding:36px 40px;color:#1e293b;font-size:15px;line-height:1.7">
  <p style="margin:0 0 16px">Hola <strong>{{nombre}}</strong>,</p>
  <p style="margin:0 0 20px">Tu consulta ha sido respondida. A continuación encontrarás la información.</p>
  <table cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:12px 18px;margin-bottom:16px;width:100%;box-sizing:border-box">
    <tr><td style="font-size:12px;color:#64748b;padding:3px 0"><strong>Ticket #{{numero_ticket}}</strong> · {{asunto_ticket}}</td></tr>
  </table>
  <table cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:16px 20px;margin-bottom:28px;width:100%;box-sizing:border-box">
    <tr><td style="font-size:13px;color:#166534;font-weight:600;padding-bottom:8px">Respuesta:</td></tr>
    <tr><td style="font-size:14px;color:#1e293b;line-height:1.7;white-space:pre-wrap">{{resolucion}}</td></tr>
  </table>
  <table cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:8px;background:#1F3B6D">
    <a href="https://www.smartbuilderec.com" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none">Ir a SmartBuilderEC →</a>
  </td></tr></table>
</td></tr>
<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px;text-align:center">
  <p style="margin:0;color:#94a3b8;font-size:12px">SmartBuilderEC · <a href="https://www.smartbuilderec.com" style="color:#1F3B6D;text-decoration:none">smartbuilderec.com</a></p>
</td></tr>
</table></td></tr></table>
</body></html>$html$)

ON CONFLICT (slug) DO NOTHING;
