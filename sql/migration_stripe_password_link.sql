-- ═══════════════════════════════════════════════════════════════════════════
-- SmartBuilderEC — Fix: email de bienvenida Stripe incluye link para
-- que el usuario establezca su contraseña (en lugar de mandarlos a login.html
-- donde no pueden entrar porque nunca tuvieron contraseña).
-- Ejecutar en Supabase SQL Editor (seguro repetir: UPDATE es idempotente)
-- ═══════════════════════════════════════════════════════════════════════════

UPDATE public.email_templates
SET
  variables = ARRAY['nombre','email','monto','link_acceso'],
  body_html = $html$<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:32px 16px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#1F3B6D;padding:28px 40px">
  <p style="margin:0;color:#fff;font-size:22px;font-weight:700">SmartBuilderEC</p>
  <p style="margin:4px 0 0;color:#93c5fd;font-size:12px">EC0217.01 · Planeación Didáctica</p>
</td></tr>
<tr><td style="padding:36px 40px;color:#1e293b;font-size:15px;line-height:1.7">
  <p style="margin:0 0 16px">Hola <strong>{{nombre}}</strong>,</p>
  <p style="margin:0 0 12px">¡Tu suscripción a SmartBuilderEC está activa! Hemos procesado tu pago exitosamente.</p>
  <table cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 20px;margin-bottom:28px;width:100%;box-sizing:border-box">
    <tr><td style="font-size:14px;color:#166534"><strong>Monto cobrado:</strong> {{monto}}</td></tr>
  </table>
  <p style="margin:0 0 8px;color:#64748b;font-size:13px">Tu cuenta está lista con el correo: <strong>{{email}}</strong></p>
  <p style="margin:0 0 28px;color:#94a3b8;font-size:12px">⏱ Este enlace es válido por <strong>24 horas</strong>. Después usa &ldquo;Olvidé mi contraseña&rdquo; en el login.</p>
  <table cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:8px;background:#1F3B6D">
    <a href="{{link_acceso}}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none">Establecer mi contraseña →</a>
  </td></tr></table>
</td></tr>
<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px;text-align:center">
  <p style="margin:0;color:#94a3b8;font-size:12px">SmartBuilderEC · <a href="https://www.smartbuilderec.com" style="color:#1F3B6D;text-decoration:none">smartbuilderec.com</a></p>
</td></tr>
</table></td></tr></table>
</body></html>$html$
WHERE slug = 'bienvenida_user_stripe';
