-- ═══════════════════════════════════════════════════════════════════
-- SmartBuilderEC — Rol "editor" (gestor de schemas de wizards)
-- Sprint 4: Motor Genérico
--
-- Ejecutar en Supabase → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════════


-- ── 1. Agregar "editor" al CHECK constraint de profiles ────────────
-- Elimina el constraint viejo y lo recrea incluyendo el nuevo rol.
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_rol_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_rol_check
  CHECK (rol IN ('super_admin', 'admin', 'editor', 'user'));


-- ── 2. Actualizar wizard_schemas: editor también puede escribir ─────
-- Reemplaza la política existente para incluir editor.
DROP POLICY IF EXISTS "schemas_escritura_superadmin"         ON public.wizard_schemas;
DROP POLICY IF EXISTS "schemas_escritura_superadmin_editor"  ON public.wizard_schemas;

CREATE POLICY "schemas_escritura_superadmin_editor"
  ON public.wizard_schemas FOR ALL
  USING  (public.get_my_role() IN ('super_admin', 'editor'))
  WITH CHECK (public.get_my_role() IN ('super_admin', 'editor'));


-- ── 3. wizard_instancias: editor puede leer todas las instancias ────
DROP POLICY IF EXISTS "instancias_editor_lee" ON public.wizard_instancias;

CREATE POLICY "instancias_editor_lee"
  ON public.wizard_instancias FOR SELECT
  TO authenticated
  USING (public.get_my_role() = 'editor');


-- ── 4. Función: asignar rol editor (llamable desde el frontend) ──────
-- SECURITY DEFINER → se ejecuta como el owner de la BD, bypasea RLS.
-- Valida internamente que el llamante sea super_admin.
CREATE OR REPLACE FUNCTION public.fn_assign_editor(target_email TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_perfil RECORD;
BEGIN
  IF public.get_my_role() <> 'super_admin' THEN
    RAISE EXCEPTION 'Solo el super_admin puede asignar el rol editor.';
  END IF;

  -- Búsqueda case-insensitive
  SELECT id, nombre, apellido, rol
    INTO v_perfil
    FROM public.profiles
   WHERE lower(email) = lower(target_email)
   LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado con el correo: %', target_email;
  END IF;

  IF v_perfil.rol = 'super_admin' THEN
    RAISE EXCEPTION 'No se puede cambiar el rol de un super_admin.';
  END IF;

  UPDATE public.profiles
     SET rol = 'editor', updated_at = NOW()
   WHERE id = v_perfil.id;

  RETURN jsonb_build_object(
    'ok', true,
    'id', v_perfil.id,
    'nombre', COALESCE(NULLIF(trim(v_perfil.nombre || ' ' || COALESCE(v_perfil.apellido,'')), ''), target_email)
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_assign_editor(TEXT) TO authenticated;


-- ── 5. Función: revocar rol editor (vuelve a 'user') ─────────────────
CREATE OR REPLACE FUNCTION public.fn_revoke_editor(target_id UUID)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF public.get_my_role() <> 'super_admin' THEN
    RAISE EXCEPTION 'Solo el super_admin puede revocar el rol editor.';
  END IF;

  UPDATE public.profiles
     SET rol = 'user', updated_at = NOW()
   WHERE id = target_id AND rol = 'editor';

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Editor no encontrado o ya no tiene ese rol.';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_revoke_editor(UUID) TO authenticated;
