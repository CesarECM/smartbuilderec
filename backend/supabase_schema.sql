-- ═══════════════════════════════════════════════════════════════════════════
-- SmartBuilderEC — Schema Supabase v2.0
-- Plataforma EC0217.01 | CEECM
--
-- INSTRUCCIONES DE EJECUCIÓN:
--   1. Ve a tu proyecto Supabase → SQL Editor → New query
--   2. Pega TODO este archivo y ejecuta (Run)
--   3. Al terminar, sigue las instrucciones al final del archivo para
--      crear el primer super_admin
--
-- IMPORTANTE: Ejecutar solo UNA VEZ en un proyecto limpio.
--             Si necesitas re-ejecutar, usa el bloque de limpieza al final.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. TABLA profiles ────────────────────────────────────────────────────
-- Extiende auth.users. Cada usuario tiene exactamente un perfil.
CREATE TABLE public.profiles (
  id                     UUID        REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  nombre                 TEXT,
  apellido               TEXT,
  email                  TEXT,
  rol                    TEXT        NOT NULL DEFAULT 'user'
                                     CHECK (rol IN ('super_admin', 'admin', 'user')),
  -- admin_id: NULL si el usuario pagó por Stripe o se registró directamente.
  -- Apunta al admin que lo gestiona si accedió con código de un solo uso.
  admin_id               UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  -- credits solo aplica para rol='admin': cuántos usuarios puede tener activos.
  credits                INT         NOT NULL DEFAULT 0,
  stripe_customer_id     TEXT,
  stripe_subscription_id TEXT,
  activo                 BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.profiles                        IS 'Perfiles de usuario — extensión de auth.users con roles, créditos y relación admin↔usuario.';
COMMENT ON COLUMN public.profiles.admin_id               IS 'Admin propietario del usuario. NULL = registro libre (Stripe o directo).';
COMMENT ON COLUMN public.profiles.credits                IS 'Solo rol=admin: cuántos usuarios puede gestionar simultáneamente.';


-- ── 2. TABLA planeaciones ─────────────────────────────────────────────────
-- Cada fila es una instancia completa e independiente del wizard de 16 pasos.
-- El campo `datos` contiene todo lo que antes vivía en localStorage (ec0217_*).
CREATE TABLE public.planeaciones (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  nombre_curso TEXT        NOT NULL DEFAULT 'Sin título',
  status       TEXT        NOT NULL DEFAULT 'borrador'
                           CHECK (status IN ('borrador', 'completa')),
  paso_actual  INT         NOT NULL DEFAULT 1 CHECK (paso_actual BETWEEN 1 AND 16),
  -- datos: snapshot completo del wizard. Estructura esperada:
  -- { datos: {...}, objetivos: {...}, beneficios: {...}, temario: {...},
  --   encuadre: {...}, tecnicas: {...}, expositiva: {...}, demostrativa: {...},
  --   dialogo: {...}, cierre: {...}, evaluaciones: {...}, tiempos: {...},
  --   materiales: {...}, completados: { datos: true, objetivos: true, ... } }
  datos        JSONB       NOT NULL DEFAULT '{}'::JSONB,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.planeaciones       IS 'Instancias del wizard EC0217.01. Un usuario puede tener múltiples cursos en elaboración.';
COMMENT ON COLUMN public.planeaciones.datos IS 'Estado completo del wizard. Equivalente a todas las claves ec0217_* del localStorage anterior.';


-- ── 3b. TABLA email_templates ─────────────────────────────────────────────────
-- Plantillas de correo editables desde el panel superadmin.
-- El backend las lee vía service_role (bypassa RLS) al enviar notificaciones.
-- Las variables se insertan con formato {{nombre_variable}}.
CREATE TABLE IF NOT EXISTS public.email_templates (
  slug        TEXT        PRIMARY KEY,
  nombre      TEXT        NOT NULL,
  subject     TEXT        NOT NULL,
  body_html   TEXT        NOT NULL DEFAULT '',
  variables   TEXT[]      NOT NULL DEFAULT '{}',
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_templates_superadmin"
  ON public.email_templates FOR ALL
  USING (public.get_my_role() = 'super_admin');

-- Plantillas semilla (INSERT OR IGNORE para no sobreescribir ediciones futuras)
INSERT INTO public.email_templates (slug, nombre, subject, variables, body_html) VALUES

('bienvenida_admin', 'Bienvenida — Nuevo Admin',
 'Bienvenido a SmartBuilderEC — Tu panel de administrador está listo',
 ARRAY['nombre','email','creditos','vigencia_hasta','link_acceso'],
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
  <p style="margin:0 0 20px">Tu cuenta de Administrador en SmartBuilderEC ha sido activada. A partir de ahora puedes gestionar instructores y generar códigos de acceso desde tu panel.</p>
  <table cellpadding="0" cellspacing="0" border="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;padding:16px 20px;margin-bottom:28px;width:100%;box-sizing:border-box">
    <tr><td style="font-size:13px;color:#475569;padding:4px 0"><strong>Email:</strong> {{email}}</td></tr>
    <tr><td style="font-size:13px;color:#475569;padding:4px 0"><strong>Créditos disponibles:</strong> {{creditos}}</td></tr>
    <tr><td style="font-size:13px;color:#475569;padding:4px 0"><strong>Vigencia hasta:</strong> {{vigencia_hasta}}</td></tr>
  </table>
  <table cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:8px;background:#1F3B6D">
    <a href="{{link_acceso}}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none">Acceder a mi panel →</a>
  </td></tr></table>
</td></tr>
<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px;text-align:center">
  <p style="margin:0;color:#94a3b8;font-size:12px">SmartBuilderEC · <a href="https://www.smartbuilderec.com" style="color:#1F3B6D;text-decoration:none">smartbuilderec.com</a></p>
</td></tr>
</table></td></tr></table>
</body></html>$html$),

('bienvenida_user_codigo', 'Bienvenida — Usuario por Código',
 'Tu acceso a SmartBuilderEC está listo',
 ARRAY['nombre','email','nombre_admin'],
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
  <p style="margin:0 0 20px">Tu cuenta en SmartBuilderEC ha sido activada por <strong>{{nombre_admin}}</strong>. Ya puedes iniciar sesión y comenzar a construir tu planeación didáctica EC0217.01.</p>
  <p style="margin:0 0 28px;font-size:13px;color:#64748b">Accede con tu correo: <strong>{{email}}</strong></p>
  <table cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:8px;background:#1F3B6D">
    <a href="https://www.smartbuilderec.com/login.html" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none">Comenzar ahora →</a>
  </td></tr></table>
</td></tr>
<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px;text-align:center">
  <p style="margin:0;color:#94a3b8;font-size:12px">SmartBuilderEC · <a href="https://www.smartbuilderec.com" style="color:#1F3B6D;text-decoration:none">smartbuilderec.com</a></p>
</td></tr>
</table></td></tr></table>
</body></html>$html$),

('bienvenida_user_stripe', 'Bienvenida — Usuario Stripe',
 'Tu suscripción a SmartBuilderEC está activa',
 ARRAY['nombre','email','monto'],
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
  <p style="margin:0 0 12px">¡Tu suscripción a SmartBuilderEC está activa! Hemos procesado tu pago exitosamente.</p>
  <table cellpadding="0" cellspacing="0" border="0" style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:8px;padding:14px 20px;margin-bottom:28px;width:100%;box-sizing:border-box">
    <tr><td style="font-size:14px;color:#166534"><strong>Monto cobrado:</strong> {{monto}}</td></tr>
  </table>
  <p style="margin:0 0 28px;color:#64748b;font-size:13px">Ya puedes acceder con tu correo: <strong>{{email}}</strong></p>
  <table cellpadding="0" cellspacing="0" border="0"><tr><td style="border-radius:8px;background:#1F3B6D">
    <a href="https://www.smartbuilderec.com/login.html" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none">Ir a SmartBuilderEC →</a>
  </td></tr></table>
</td></tr>
<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px;text-align:center">
  <p style="margin:0;color:#94a3b8;font-size:12px">SmartBuilderEC · <a href="https://www.smartbuilderec.com" style="color:#1F3B6D;text-decoration:none">smartbuilderec.com</a></p>
</td></tr>
</table></td></tr></table>
</body></html>$html$),

('vigencia_admin_por_vencer', 'Vigencia por Vencer',
 'Tu acceso a SmartBuilderEC vence en {{dias_restantes}} días',
 ARRAY['nombre','email','vigencia_hasta','dias_restantes'],
$html$<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:32px 16px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#92400e;padding:28px 40px">
  <p style="margin:0;color:#fff;font-size:22px;font-weight:700">SmartBuilderEC</p>
  <p style="margin:4px 0 0;color:#fde68a;font-size:12px">Aviso importante sobre tu cuenta</p>
</td></tr>
<tr><td style="padding:36px 40px;color:#1e293b;font-size:15px;line-height:1.7">
  <p style="margin:0 0 16px">Hola <strong>{{nombre}}</strong>,</p>
  <p style="margin:0 0 20px">Te informamos que tu acceso como Administrador en SmartBuilderEC <strong>vence en {{dias_restantes}} días</strong> ({{vigencia_hasta}}).</p>
  <table cellpadding="0" cellspacing="0" border="0" style="background:#fffbeb;border:1px solid #fde68a;border-radius:8px;padding:14px 20px;margin-bottom:28px;width:100%;box-sizing:border-box">
    <tr><td style="font-size:13px;color:#92400e">⚠️ Después de esta fecha tu cuenta quedará suspendida y tus usuarios no podrán acceder a la plataforma.</td></tr>
  </table>
  <p style="margin:0 0 8px;font-size:13px;color:#64748b">Para renovar, contacta al administrador de la plataforma respondiendo este correo.</p>
</td></tr>
<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px;text-align:center">
  <p style="margin:0;color:#94a3b8;font-size:12px">SmartBuilderEC · <a href="https://www.smartbuilderec.com" style="color:#1F3B6D;text-decoration:none">smartbuilderec.com</a></p>
</td></tr>
</table></td></tr></table>
</body></html>$html$),

('vigencia_admin_expirada', 'Vigencia Expirada',
 'Tu acceso a SmartBuilderEC ha expirado',
 ARRAY['nombre','email','vigencia_hasta'],
$html$<!DOCTYPE html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif">
<table width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;padding:32px 16px"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:12px;overflow:hidden">
<tr><td style="background:#991b1b;padding:28px 40px">
  <p style="margin:0;color:#fff;font-size:22px;font-weight:700">SmartBuilderEC</p>
  <p style="margin:4px 0 0;color:#fca5a5;font-size:12px">Aviso de cuenta suspendida</p>
</td></tr>
<tr><td style="padding:36px 40px;color:#1e293b;font-size:15px;line-height:1.7">
  <p style="margin:0 0 16px">Hola <strong>{{nombre}}</strong>,</p>
  <p style="margin:0 0 20px">Tu acceso como Administrador venció el <strong>{{vigencia_hasta}}</strong>. Tu cuenta ha sido suspendida temporalmente.</p>
  <p style="margin:0 0 8px;font-size:13px;color:#64748b">Para reactivar tu cuenta y el acceso de tus usuarios, comunícate con el administrador de la plataforma.</p>
</td></tr>
<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px;text-align:center">
  <p style="margin:0;color:#94a3b8;font-size:12px">SmartBuilderEC · <a href="https://www.smartbuilderec.com" style="color:#1F3B6D;text-decoration:none">smartbuilderec.com</a></p>
</td></tr>
</table></td></tr></table>
</body></html>$html$),

('reset_password', 'Restablecer Contraseña',
 'Restablece tu contraseña — SmartBuilderEC',
 ARRAY['nombre','email','link_reset'],
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
  <p style="margin:0 0 28px">Recibimos una solicitud para restablecer la contraseña de tu cuenta <strong>({{email}})</strong>. Haz clic en el botón para crear una nueva contraseña.</p>
  <table cellpadding="0" cellspacing="0" border="0" style="margin-bottom:28px"><tr><td style="border-radius:8px;background:#1F3B6D">
    <a href="{{link_reset}}" style="display:inline-block;padding:13px 28px;color:#ffffff;font-size:14px;font-weight:600;text-decoration:none">Restablecer contraseña →</a>
  </td></tr></table>
  <p style="margin:0;font-size:13px;color:#94a3b8">Si no solicitaste este cambio, puedes ignorar este correo. Tu contraseña no cambiará.</p>
</td></tr>
<tr><td style="background:#f8fafc;border-top:1px solid #e2e8f0;padding:18px 40px;text-align:center">
  <p style="margin:0;color:#94a3b8;font-size:12px">SmartBuilderEC · <a href="https://www.smartbuilderec.com" style="color:#1F3B6D;text-decoration:none">smartbuilderec.com</a></p>
</td></tr>
</table></td></tr></table>
</body></html>$html$)

ON CONFLICT (slug) DO NOTHING;


-- ── 3. TABLA access_codes ────────────────────────────────────────────────
-- Códigos de un solo uso que los admins generan para sus usuarios.
-- Formato: XXXX-XXXX (8 caracteres hex en mayúsculas separados por guion).
CREATE TABLE public.access_codes (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  code       TEXT        NOT NULL UNIQUE,
  admin_id   UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  used_by    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '30 days'),
  used_at    TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.access_codes IS 'Códigos de acceso único generados por admins. El uso descuenta 1 crédito al admin.';


-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCIONES AUXILIARES
-- ═══════════════════════════════════════════════════════════════════════════

-- Devuelve el rol del usuario en sesión.
-- SECURITY DEFINER para evitar recursión en políticas RLS.
CREATE OR REPLACE FUNCTION public.get_my_role()
RETURNS TEXT
LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT rol FROM public.profiles WHERE id = auth.uid();
$$;

-- Actualiza updated_at antes de cada UPDATE.
CREATE OR REPLACE FUNCTION public.fn_update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

-- Crea el perfil del usuario automáticamente tras el registro en Supabase Auth.
-- Acepta metadatos: nombre, apellido, rol, admin_id (todos opcionales).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.profiles (id, nombre, apellido, email, rol, admin_id)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'nombre', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'apellido',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'rol', 'user'),
    (NEW.raw_user_meta_data->>'admin_id')::UUID
  );
  RETURN NEW;
END;
$$;

-- Descuenta 1 crédito del admin cuando se le asigna un nuevo usuario.
-- Solo aplica cuando admin_id IS NOT NULL y rol = 'user'.
CREATE OR REPLACE FUNCTION public.fn_deduct_admin_credit()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.admin_id IS NOT NULL AND NEW.rol = 'user' THEN
    UPDATE public.profiles
       SET credits = credits - 1
     WHERE id = NEW.admin_id
       AND credits > 0;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'INSUFFICIENT_CREDITS: El administrador no tiene créditos disponibles.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- fn_restore_admin_credit eliminada: eliminar un usuario NO devuelve créditos al admin.
-- Eliminar y crear otro usuario consumiría un crédito adicional, evitando el abuso de
-- reutilizar slots. Se ejecutó en Supabase:
--   DROP TRIGGER IF EXISTS trg_restore_credit_on_user_delete ON public.profiles;
--   DROP FUNCTION IF EXISTS public.fn_restore_admin_credit();

-- Verifica si un código de acceso es válido sin exponer la tabla completa.
-- Retorna: { valid: true, admin_id: "uuid" } o { valid: false, error: "..." }
-- SECURITY DEFINER: cualquier usuario autenticado puede llamarla.
CREATE OR REPLACE FUNCTION public.verify_access_code(p_code TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_row public.access_codes%ROWTYPE;
BEGIN
  SELECT * INTO v_row
  FROM   public.access_codes
  WHERE  code       = p_code
    AND  used_at    IS NULL
    AND  expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Código inválido o expirado.');
  END IF;

  RETURN jsonb_build_object('valid', true, 'admin_id', v_row.admin_id::TEXT);
END;
$$;

-- Marca un código como usado y lo asocia al usuario que lo canjeó.
-- Solo el backend (service role) debe llamar esta función tras registrar al usuario.
CREATE OR REPLACE FUNCTION public.use_access_code(p_code TEXT, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  UPDATE public.access_codes
     SET used_by  = p_user_id,
         used_at  = NOW()
   WHERE code       = p_code
     AND used_at    IS NULL
     AND expires_at > NOW();
  RETURN FOUND;
END;
$$;

-- Genera un código único en formato XXXX-XXXX e inserta en access_codes.
-- Llamada exclusivamente por el backend con service_role_key.
CREATE OR REPLACE FUNCTION public.generate_access_code(
  p_admin_id    UUID,
  p_expires_days INT DEFAULT 30
)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_code  TEXT;
  v_tries INT := 0;
BEGIN
  LOOP
    v_code := upper(
      substring(md5(random()::TEXT || clock_timestamp()::TEXT) FROM 1 FOR 4) || '-' ||
      substring(md5(random()::TEXT || clock_timestamp()::TEXT) FROM 5 FOR 4)
    );
    EXIT WHEN NOT EXISTS (SELECT 1 FROM public.access_codes WHERE code = v_code);
    v_tries := v_tries + 1;
    IF v_tries > 20 THEN
      RAISE EXCEPTION 'No se pudo generar un código único tras 20 intentos.';
    END IF;
  END LOOP;

  INSERT INTO public.access_codes (code, admin_id, expires_at)
  VALUES (v_code, p_admin_id, NOW() + (p_expires_days || ' days')::INTERVAL);

  RETURN v_code;
END;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS
-- ═══════════════════════════════════════════════════════════════════════════

-- Crear perfil automáticamente al registrar un usuario en Supabase Auth
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Mantener updated_at al día en profiles y planeaciones
CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

CREATE TRIGGER trg_planeaciones_updated_at
  BEFORE UPDATE ON public.planeaciones
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

-- Sistema de créditos: descontar al crear usuario. Eliminar usuario NO restaura crédito.
CREATE TRIGGER trg_deduct_credit_on_user_create
  AFTER INSERT ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.fn_deduct_admin_credit();


-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY (RLS)
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planeaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.access_codes ENABLE ROW LEVEL SECURITY;


-- ── Políticas: profiles ───────────────────────────────────────────────────

-- Cada usuario lee su propio perfil
CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

-- Admin lee los perfiles de sus usuarios asignados
CREATE POLICY "profiles_select_my_users"
  ON public.profiles FOR SELECT
  USING (
    admin_id = auth.uid()
    AND public.get_my_role() = 'admin'
  );

-- Super admin lee todos los perfiles
CREATE POLICY "profiles_select_superadmin"
  ON public.profiles FOR SELECT
  USING (public.get_my_role() = 'super_admin');

-- Cada usuario actualiza solo su propio perfil (nombre, apellido)
CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Super admin puede actualizar cualquier perfil (rol, créditos, activo, etc.)
CREATE POLICY "profiles_update_superadmin"
  ON public.profiles FOR UPDATE
  USING (public.get_my_role() = 'super_admin');


-- ── Políticas: planeaciones ───────────────────────────────────────────────

-- Usuario gestiona sus propias planeaciones (CREATE, READ, UPDATE, DELETE)
CREATE POLICY "planeaciones_all_own"
  ON public.planeaciones FOR ALL
  USING    (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin ve las planeaciones de todos sus usuarios asignados (solo lectura)
CREATE POLICY "planeaciones_select_admin"
  ON public.planeaciones FOR SELECT
  USING (
    public.get_my_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE  p.id       = planeaciones.user_id
        AND  p.admin_id = auth.uid()
    )
  );

-- Super admin ve todas las planeaciones (solo lectura)
CREATE POLICY "planeaciones_select_superadmin"
  ON public.planeaciones FOR SELECT
  USING (public.get_my_role() = 'super_admin');


-- ── Políticas: access_codes ───────────────────────────────────────────────

-- Admin gestiona solo sus propios códigos
CREATE POLICY "access_codes_all_own"
  ON public.access_codes FOR ALL
  USING    (admin_id = auth.uid() AND public.get_my_role() = 'admin')
  WITH CHECK (admin_id = auth.uid() AND public.get_my_role() = 'admin');

-- Super admin gestiona todos los códigos
CREATE POLICY "access_codes_all_superadmin"
  ON public.access_codes FOR ALL
  USING (public.get_my_role() = 'super_admin');

-- Nota: los usuarios NO tienen SELECT directo sobre access_codes.
-- Para verificar un código deben llamar: SELECT public.verify_access_code('XXXX-XXXX')
-- que es una función SECURITY DEFINER y no expone el resto de la tabla.


-- ═══════════════════════════════════════════════════════════════════════════
-- ÍNDICES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_profiles_admin_id        ON public.profiles(admin_id);
CREATE INDEX idx_profiles_rol             ON public.profiles(rol);
CREATE INDEX idx_planeaciones_user_id     ON public.planeaciones(user_id);
CREATE INDEX idx_planeaciones_updated_at  ON public.planeaciones(updated_at DESC);
CREATE INDEX idx_planeaciones_datos_gin   ON public.planeaciones USING GIN (datos);
CREATE INDEX idx_access_codes_admin_id    ON public.access_codes(admin_id);
CREATE INDEX idx_access_codes_code        ON public.access_codes(code);


-- ═══════════════════════════════════════════════════════════════════════════
-- PERMISOS DE EJECUCIÓN DE FUNCIONES
-- ═══════════════════════════════════════════════════════════════════════════

-- verify_access_code: accesible sin autenticación (se llama durante el registro con código,
-- antes de que el usuario exista en el sistema)
GRANT EXECUTE ON FUNCTION public.verify_access_code(TEXT) TO anon, authenticated;

-- use_access_code: accesible a anon y authenticated — se llama justo después del signUp,
-- momento en que el cliente puede no tener la sesión sincronizada aún.
GRANT EXECUTE ON FUNCTION public.use_access_code(TEXT, UUID) TO anon, authenticated;

-- generate_access_code: solo el backend con service_role_key la llama directamente
-- No se otorgan permisos a anon ni authenticated intencionalmente.


-- ═══════════════════════════════════════════════════════════════════════════
-- CONFIGURACIÓN INICIAL DEL SUPER ADMIN
-- ═══════════════════════════════════════════════════════════════════════════
--
-- PASO 1: En Supabase Dashboard → Authentication → Users → "Add user"
--         Crea la cuenta con tu email (cesar@ceecm.mx) y una contraseña segura.
--         Activa "Auto Confirm User" para no requerir verificación por email ahora.
--
-- PASO 2: Ejecuta el siguiente UPDATE (en una nueva query) reemplazando el email:
--
--   UPDATE public.profiles
--      SET rol = 'super_admin'
--    WHERE email = 'cesar@ceecm.mx';
--
-- PASO 3: Para los colaboradores de respaldo (también super_admin), repite el proceso:
--   - Crea su cuenta en Authentication → Users
--   - Ejecuta el mismo UPDATE con su email
--
-- ═══════════════════════════════════════════════════════════════════════════
-- LIMPIEZA (solo si necesitas re-ejecutar desde cero en el mismo proyecto)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- DROP TRIGGER IF EXISTS on_auth_user_created            ON auth.users;
-- DROP TRIGGER IF EXISTS trg_profiles_updated_at         ON public.profiles;
-- DROP TRIGGER IF EXISTS trg_planeaciones_updated_at     ON public.planeaciones;
-- DROP TRIGGER IF EXISTS trg_deduct_credit_on_user_create ON public.profiles;
-- DROP TRIGGER IF EXISTS trg_restore_credit_on_user_delete ON public.profiles;
-- DROP FUNCTION IF EXISTS public.get_my_role();
-- DROP FUNCTION IF EXISTS public.fn_update_updated_at();
-- DROP FUNCTION IF EXISTS public.handle_new_user();
-- DROP FUNCTION IF EXISTS public.fn_deduct_admin_credit();
-- DROP FUNCTION IF EXISTS public.fn_restore_admin_credit();
-- DROP FUNCTION IF EXISTS public.verify_access_code(TEXT);
-- DROP FUNCTION IF EXISTS public.use_access_code(TEXT, UUID);
-- DROP FUNCTION IF EXISTS public.generate_access_code(UUID, INT);
-- DROP TABLE IF EXISTS public.access_codes;
-- DROP TABLE IF EXISTS public.planeaciones;
-- DROP TABLE IF EXISTS public.profiles;
-- ═══════════════════════════════════════════════════════════════════════════
