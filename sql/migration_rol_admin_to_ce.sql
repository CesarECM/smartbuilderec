-- MPS #020: Migración rol 'admin' → 'ce'
-- Ejecutar en Supabase SQL Editor de una sola vez (transacción atómica)
-- ANTES de que el deploy de Render/Vercel llegue a producción.

BEGIN;

-- ── 0. Actualizar CHECK constraint ──────────────────────────────────────────
ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_rol_check;
ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_rol_check
  CHECK (rol IN ('super_admin', 'ce', 'user'));

-- ── 1. Actualizar datos ──────────────────────────────────────────────────────
UPDATE public.profiles SET rol = 'ce' WHERE rol = 'admin';

-- ── 2. Policies: profiles ────────────────────────────────────────────────────
DROP POLICY IF EXISTS "profiles_select_my_users" ON public.profiles;
CREATE POLICY "profiles_select_my_users"
  ON public.profiles FOR SELECT
  USING (
    admin_id = auth.uid()
    AND public.get_my_role() = 'ce'
  );

-- ── 3. Policies: planeaciones ────────────────────────────────────────────────
DROP POLICY IF EXISTS "planeaciones_select_admin" ON public.planeaciones;
CREATE POLICY "planeaciones_select_admin"
  ON public.planeaciones FOR SELECT
  USING (
    public.get_my_role() = 'ce'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE  p.id       = planeaciones.user_id
        AND  p.admin_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "planeaciones_update_admin" ON public.planeaciones;
CREATE POLICY "planeaciones_update_admin"
  ON public.planeaciones FOR UPDATE
  USING (
    public.get_my_role() = 'ce'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE  p.id       = planeaciones.user_id
        AND  p.admin_id = auth.uid()
    )
  );

-- ── 4. Policies: access_codes ────────────────────────────────────────────────
DROP POLICY IF EXISTS "access_codes_all_own" ON public.access_codes;
CREATE POLICY "access_codes_all_own"
  ON public.access_codes FOR ALL
  USING    (admin_id = auth.uid() AND public.get_my_role() = 'ce')
  WITH CHECK (admin_id = auth.uid() AND public.get_my_role() = 'ce');

-- ── 5. Policies: user_roles ──────────────────────────────────────────────────
DROP POLICY IF EXISTS "user_roles_select_admin" ON public.user_roles;
CREATE POLICY "user_roles_select_admin"
  ON public.user_roles FOR SELECT
  USING (
    public.get_my_role() = 'ce'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_roles.user_id AND p.admin_id = auth.uid()
    )
  );

-- ── 6. Policies: asignaciones ────────────────────────────────────────────────
DROP POLICY IF EXISTS "asignaciones_select_admin" ON public.asignaciones;
CREATE POLICY "asignaciones_select_admin"
  ON public.asignaciones FOR SELECT
  USING (admin_id = auth.uid() AND public.get_my_role() = 'ce');

DROP POLICY IF EXISTS "asignaciones_insert_admin" ON public.asignaciones;
CREATE POLICY "asignaciones_insert_admin"
  ON public.asignaciones FOR INSERT
  WITH CHECK (admin_id = auth.uid() AND public.get_my_role() = 'ce');

DROP POLICY IF EXISTS "asignaciones_update_admin" ON public.asignaciones;
CREATE POLICY "asignaciones_update_admin"
  ON public.asignaciones FOR UPDATE
  USING (admin_id = auth.uid() AND public.get_my_role() = 'ce');

-- ── 7. Policies: pagos ───────────────────────────────────────────────────────
DROP POLICY IF EXISTS "pagos_select_admin" ON public.pagos;
CREATE POLICY "pagos_select_admin"
  ON public.pagos FOR SELECT
  USING (
    public.get_my_role() = 'ce'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = pagos.alumno_id AND p.admin_id = auth.uid()
    )
  );

-- ── 8. Policies: proceso_certificacion ───────────────────────────────────────
DROP POLICY IF EXISTS "proceso_select_admin" ON public.proceso_certificacion;
CREATE POLICY "proceso_select_admin"
  ON public.proceso_certificacion FOR SELECT
  USING (
    public.get_my_role() = 'ce'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = proceso_certificacion.alumno_id AND p.admin_id = auth.uid()
    )
  );

-- ── 9. Función: transferir_planeacion ────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.transferir_planeacion(
  p_planeacion_id UUID,
  p_alumno_id     UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF public.get_my_role() NOT IN ('ce', 'super_admin') THEN
    RAISE EXCEPTION 'Sin permisos para transferir planeaciones.';
  END IF;

  IF public.get_my_role() = 'ce' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.planeaciones
      WHERE id = p_planeacion_id AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'La planeación no te pertenece.';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = p_alumno_id AND admin_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'El alumno no pertenece a tu cuenta.';
    END IF;
  END IF;

  UPDATE public.planeaciones
  SET user_id = p_alumno_id
  WHERE id = p_planeacion_id;
END;
$$;

COMMIT;

-- ── Verificación (ejecutar por separado después del COMMIT) ──────────────────
-- SELECT rol, COUNT(*) FROM public.profiles GROUP BY rol ORDER BY rol;
-- Debería mostrar 'ce' en lugar de 'admin'.
