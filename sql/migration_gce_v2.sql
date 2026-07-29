-- ============================================================
-- MPS #014 — GCE v2: Estructura OC→CE→EC + Equipo + Invitaciones
-- Migración v2: 4 tablas nuevas
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. OC incorpora CEs a su organización
CREATE TABLE IF NOT EXISTS oc_ce_relaciones (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oc_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ce_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (oc_id, ce_id)
);

ALTER TABLE oc_ce_relaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "oc_ce_lectura"
  ON oc_ce_relaciones FOR SELECT
  USING (oc_id = auth.uid() OR ce_id = auth.uid());

CREATE POLICY "oc_ce_escritura_service"
  ON oc_ce_relaciones FOR ALL
  USING (auth.role() = 'service_role');

-- 2. OC autoriza qué ECs puede trabajar un CE
CREATE TABLE IF NOT EXISTS ce_estandares_autorizados (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oc_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  ce_id       UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  estandar_id UUID NOT NULL REFERENCES estandares_competencia(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (ce_id, estandar_id)
);

ALTER TABLE ce_estandares_autorizados ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ce_estandares_lectura"
  ON ce_estandares_autorizados FOR SELECT
  USING (oc_id = auth.uid() OR ce_id = auth.uid());

CREATE POLICY "ce_estandares_escritura_service"
  ON ce_estandares_autorizados FOR ALL
  USING (auth.role() = 'service_role');

-- 3. CE vincula evaluadores a su equipo
CREATE TABLE IF NOT EXISTS ce_evaluador_relaciones (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ce_id        UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluador_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (ce_id, evaluador_id)
);

ALTER TABLE ce_evaluador_relaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ce_evaluador_lectura"
  ON ce_evaluador_relaciones FOR SELECT
  USING (ce_id = auth.uid() OR evaluador_id = auth.uid());

CREATE POLICY "ce_evaluador_escritura_service"
  ON ce_evaluador_relaciones FOR ALL
  USING (auth.role() = 'service_role');

-- 4. Invitaciones GCE (candidatos y evaluadores)
CREATE TABLE IF NOT EXISTS gce_invitaciones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token           TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  ce_id           UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo            TEXT NOT NULL CHECK (tipo IN ('candidato', 'evaluador')),
  candidato_email TEXT NOT NULL,
  estandar_ids    UUID[],
  estado          TEXT NOT NULL DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente', 'aceptada', 'expirada')),
  candidato_id    UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  aceptada_at     TIMESTAMPTZ
);

ALTER TABLE gce_invitaciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "invitacion_lectura_ce"
  ON gce_invitaciones FOR SELECT
  USING (ce_id = auth.uid() OR candidato_id = auth.uid());

CREATE POLICY "invitacion_escritura_service"
  ON gce_invitaciones FOR ALL
  USING (auth.role() = 'service_role');

-- Índices para búsquedas frecuentes
CREATE INDEX IF NOT EXISTS idx_gce_inv_token   ON gce_invitaciones (token);
CREATE INDEX IF NOT EXISTS idx_gce_inv_ce      ON gce_invitaciones (ce_id);
CREATE INDEX IF NOT EXISTS idx_gce_inv_email   ON gce_invitaciones (candidato_email);
CREATE INDEX IF NOT EXISTS idx_ce_est_ce       ON ce_estandares_autorizados (ce_id);
CREATE INDEX IF NOT EXISTS idx_oc_ce_oc        ON oc_ce_relaciones (oc_id);
CREATE INDEX IF NOT EXISTS idx_ce_ev_ce        ON ce_evaluador_relaciones (ce_id);
