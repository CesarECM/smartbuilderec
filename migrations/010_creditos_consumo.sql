-- MPS #010 — Modelo de consumo de créditos
-- Ejecutar en Supabase SQL Editor
--
-- Cambios:
--   1. Agrega 'restored' al CHECK de credit_transactions.type
--   2. verify_access_code: verifica que el admin tenga créditos > 0
--      (super_admin siempre tiene acceso ilimitado)
--   3. use_access_code: descuenta profiles.credits y plan_credits_remaining,
--      registra en credit_transactions (type='consumed')
--      (super_admin no descuenta créditos)

-- ── 1. Ampliar CHECK de credit_transactions.type ──────────────────────────────
ALTER TABLE public.credit_transactions
  DROP CONSTRAINT IF EXISTS credit_transactions_type_check;

ALTER TABLE public.credit_transactions
  ADD CONSTRAINT credit_transactions_type_check
  CHECK (type IN ('plan_reset', 'extra_purchase', 'consumed', 'expired', 'plan_upgrade', 'restored'));


-- ── 2. verify_access_code: agrega validación de créditos disponibles ──────────
CREATE OR REPLACE FUNCTION public.verify_access_code(p_code TEXT)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_row     public.access_codes%ROWTYPE;
  v_credits INT;
  v_rol     TEXT;
BEGIN
  SELECT * INTO v_row
  FROM   public.access_codes
  WHERE  code       = p_code
    AND  used_at    IS NULL
    AND  expires_at > NOW();

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Código inválido o expirado.');
  END IF;

  SELECT credits, rol INTO v_credits, v_rol
  FROM   public.profiles
  WHERE  id = v_row.admin_id;

  -- super_admin tiene créditos ilimitados; solo bloquear si es admin regular sin créditos
  IF v_rol <> 'super_admin' AND COALESCE(v_credits, 0) <= 0 THEN
    RETURN jsonb_build_object('valid', false, 'error', 'El instructor no tiene créditos disponibles.');
  END IF;

  RETURN jsonb_build_object('valid', true, 'admin_id', v_row.admin_id::TEXT);
END;
$$;


-- ── 3. use_access_code: descuenta crédito al canjear ─────────────────────────
CREATE OR REPLACE FUNCTION public.use_access_code(p_code TEXT, p_user_id UUID)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_admin_id  UUID;
  v_admin_rol TEXT;
BEGIN
  UPDATE public.access_codes
     SET used_by = p_user_id,
         used_at = NOW()
   WHERE code       = p_code
     AND used_at    IS NULL
     AND expires_at > NOW()
  RETURNING admin_id INTO v_admin_id;

  IF NOT FOUND OR v_admin_id IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT rol INTO v_admin_rol FROM public.profiles WHERE id = v_admin_id;

  -- super_admin no consume créditos
  IF v_admin_rol = 'super_admin' THEN
    RETURN TRUE;
  END IF;

  -- Descuenta crédito agregado (profiles.credits es la fuente operativa)
  UPDATE public.profiles
     SET credits = GREATEST(0, credits - 1)
   WHERE id = v_admin_id;

  -- Descuenta plan_credits_remaining para mantener handle_subscription_updated preciso
  UPDATE public.admin_subscriptions
     SET plan_credits_remaining = GREATEST(0, plan_credits_remaining - 1),
         updated_at             = NOW()
   WHERE user_id = v_admin_id
     AND status  = 'active';

  INSERT INTO public.credit_transactions (user_id, type, amount, source, description)
  VALUES (v_admin_id, 'consumed', -1,
          'code:' || p_code,
          'Crédito consumido al canjear código');

  RETURN TRUE;
END;
$$;
