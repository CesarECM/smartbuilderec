-- MPS #009 — Sistema de pagos Stripe para CE/EI
-- Ejecutar en Supabase SQL Editor

-- ── Tabla: suscripciones de admin ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS admin_subscriptions (
  id                         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                    uuid NOT NULL UNIQUE REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id         text,
  stripe_subscription_id     text,
  stripe_subscription_item_id text,
  plan                       text CHECK (plan IN ('basico', 'profesional', 'partner')),
  plan_credits_total         integer NOT NULL DEFAULT 0,
  plan_credits_remaining     integer NOT NULL DEFAULT 0,
  plan_period_start          timestamptz,
  plan_period_end            timestamptz,
  status                     text NOT NULL DEFAULT 'active'
                               CHECK (status IN ('active', 'canceled', 'past_due', 'trialing')),
  created_at                 timestamptz DEFAULT now(),
  updated_at                 timestamptz DEFAULT now()
);

-- ── Tabla: packs de créditos extra (one-time) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS credit_packs (
  id                       uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                  uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_payment_intent_id text,
  credits_purchased        integer NOT NULL DEFAULT 10,
  credits_remaining        integer NOT NULL DEFAULT 10,
  purchased_at             timestamptz DEFAULT now(),
  expires_at               timestamptz NOT NULL,
  created_at               timestamptz DEFAULT now()
);

-- ── Tabla: auditoría de transacciones de créditos ─────────────────────────────
CREATE TABLE IF NOT EXISTS credit_transactions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  type        text NOT NULL CHECK (type IN (
                'plan_reset', 'extra_purchase', 'consumed', 'expired', 'plan_upgrade'
              )),
  amount      integer NOT NULL,
  source      text,
  description text,
  created_at  timestamptz DEFAULT now()
);

-- ── Índices ───────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_admin_subs_user      ON admin_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_subs_stripe_sub ON admin_subscriptions(stripe_subscription_id);
CREATE INDEX IF NOT EXISTS idx_admin_subs_stripe_cust ON admin_subscriptions(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_credit_packs_user    ON credit_packs(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_packs_expires ON credit_packs(expires_at)
  WHERE credits_remaining > 0;
CREATE INDEX IF NOT EXISTS idx_credit_tx_user       ON credit_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_credit_tx_type       ON credit_transactions(type, created_at DESC);

-- ── RLS ───────────────────────────────────────────────────────────────────────
ALTER TABLE admin_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_packs        ENABLE ROW LEVEL SECURITY;
ALTER TABLE credit_transactions ENABLE ROW LEVEL SECURITY;

-- Cada admin solo ve sus propios registros
CREATE POLICY "admin_subs_own" ON admin_subscriptions
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "credit_packs_own" ON credit_packs
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "credit_tx_own" ON credit_transactions
  FOR SELECT USING (auth.uid() = user_id);

-- Service role tiene acceso completo (para el backend)
CREATE POLICY "admin_subs_service" ON admin_subscriptions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "credit_packs_service" ON credit_packs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

CREATE POLICY "credit_tx_service" ON credit_transactions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');
