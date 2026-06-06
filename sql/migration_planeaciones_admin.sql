-- ═══════════════════════════════════════════════════════════════════════════
-- SmartBuilderEC — Migración: edición y transferencia de planeaciones
-- Ejecutar en Supabase → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Columna created_by: registra quién creó la planeación originalmente
ALTER TABLE public.planeaciones
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL;

COMMENT ON COLUMN public.planeaciones.created_by IS 'Admin que creó la planeación antes de transferirla. NULL si la creó el propio usuario.';

-- 2. RLS: Admin puede ACTUALIZAR planeaciones de sus usuarios asignados
CREATE POLICY "planeaciones_update_admin"
  ON public.planeaciones FOR UPDATE
  USING (
    public.get_my_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE  p.id       = planeaciones.user_id
        AND  p.admin_id = auth.uid()
    )
  );

-- 3. RLS: Superadmin tiene acceso total a todas las planeaciones
CREATE POLICY "planeaciones_all_superadmin"
  ON public.planeaciones FOR ALL
  USING    (public.get_my_role() = 'super_admin')
  WITH CHECK (public.get_my_role() = 'super_admin');

-- 4. RPC: Transferir planeación a un alumno con validaciones de seguridad
--    Admin solo puede transferir planeaciones propias a alumnos de su cuenta.
--    Superadmin puede transferir cualquier planeación a cualquier usuario.
CREATE OR REPLACE FUNCTION public.transferir_planeacion(
  p_planeacion_id UUID,
  p_alumno_id     UUID
)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF public.get_my_role() NOT IN ('admin', 'super_admin') THEN
    RAISE EXCEPTION 'Sin permisos para transferir planeaciones.';
  END IF;

  IF public.get_my_role() = 'admin' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.planeaciones
      WHERE id = p_planeacion_id AND user_id = auth.uid()
    ) THEN
      RAISE EXCEPTION 'La planeación no te pertenece.';
    END IF;

    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = p_alumno_id AND admin_id = auth.uid() AND rol = 'user'
    ) THEN
      RAISE EXCEPTION 'El alumno no pertenece a tu cuenta.';
    END IF;
  END IF;

  IF public.get_my_role() = 'super_admin' THEN
    IF NOT EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = p_alumno_id AND rol = 'user'
    ) THEN
      RAISE EXCEPTION 'El usuario destino no existe o no es un alumno válido.';
    END IF;
  END IF;

  UPDATE public.planeaciones
     SET user_id    = p_alumno_id,
         created_by = COALESCE(created_by, auth.uid())
   WHERE id = p_planeacion_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Planeación no encontrada.';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.transferir_planeacion(UUID, UUID) TO authenticated;

-- 5. Índice para consultas por created_by
CREATE INDEX IF NOT EXISTS idx_planeaciones_created_by ON public.planeaciones(created_by);

-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK (si necesitas revertir):
--
-- DROP POLICY IF EXISTS "planeaciones_update_admin"    ON public.planeaciones;
-- DROP POLICY IF EXISTS "planeaciones_all_superadmin"  ON public.planeaciones;
-- DROP FUNCTION IF EXISTS public.transferir_planeacion(UUID, UUID);
-- DROP INDEX IF EXISTS idx_planeaciones_created_by;
-- ALTER TABLE public.planeaciones DROP COLUMN IF EXISTS created_by;
-- ═══════════════════════════════════════════════════════════════════════════
