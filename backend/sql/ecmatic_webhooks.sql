-- Tabla de suscripciones de webhook para ECMatic
-- Ejecutar en el SQL Editor de Supabase

CREATE TABLE IF NOT EXISTS ecmatic_webhooks (
    id          UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    url         TEXT        NOT NULL,
    eventos     TEXT[]      DEFAULT '{}',
    descripcion TEXT,
    activo      BOOLEAN     DEFAULT TRUE,
    created_at  TIMESTAMPTZ DEFAULT NOW(),
    updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS desactivado: solo se accede vía service_role desde el backend
ALTER TABLE ecmatic_webhooks DISABLE ROW LEVEL SECURITY;

-- Índice para queries por activo
CREATE INDEX IF NOT EXISTS idx_ecmatic_webhooks_activo ON ecmatic_webhooks (activo);
