-- ════════════════════════════════════════════════════════════════════════════
-- SmartBuilderEC — Vigencia automática de 90 días para usuarios por código
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ════════════════════════════════════════════════════════════════════════════

-- Redefine use_access_code para que, al canjear un código, también establezca
-- vigencia_hasta = hoy + 90 días en el perfil del usuario.
-- La lógica de marcado del código (used_by / used_at) no cambia.

CREATE OR REPLACE FUNCTION public.use_access_code(
  p_code    TEXT,
  p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.access_codes
     SET used_by = p_user_id,
         used_at = NOW()
   WHERE code       = p_code
     AND used_at    IS NULL
     AND expires_at > NOW();

  IF FOUND THEN
    UPDATE public.profiles
       SET vigencia_hasta = (NOW() + INTERVAL '90 days')::date
     WHERE id = p_user_id;
  END IF;

  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION public.use_access_code(TEXT, UUID) TO authenticated;

-- ════════════════════════════════════════════════════════════════════════════
-- ROLLBACK (si necesitas revertir al comportamiento anterior):
--
-- CREATE OR REPLACE FUNCTION public.use_access_code(p_code TEXT, p_user_id UUID)
-- RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
-- BEGIN
--   UPDATE public.access_codes
--      SET used_by = p_user_id, used_at = NOW()
--    WHERE code = p_code AND used_at IS NULL AND expires_at > NOW();
--   RETURN FOUND;
-- END; $$;
-- ════════════════════════════════════════════════════════════════════════════
