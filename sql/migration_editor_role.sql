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


-- ── 4. Función helper: asignar rol editor a un usuario existente ─────
CREATE OR REPLACE FUNCTION public.fn_assign_editor(target_email TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF public.get_my_role() <> 'super_admin' THEN
    RAISE EXCEPTION 'Solo el super_admin puede asignar el rol editor.';
  END IF;

  UPDATE public.profiles
  SET rol = 'editor', updated_at = NOW()
  WHERE email = target_email;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Usuario no encontrado: %', target_email;
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.fn_assign_editor(TEXT) TO authenticated;
