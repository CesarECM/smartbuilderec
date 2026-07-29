-- ============================================================
-- MPS #013 — GCE: Gestor del Ciclo de Evaluación
-- Migración v1: tablas base + constraint de roles actualizado
-- Ejecutar en Supabase SQL Editor
-- ============================================================

-- 1. Catálogo de Estándares de Competencia
CREATE TABLE IF NOT EXISTS estandares_competencia (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo        TEXT UNIQUE NOT NULL,
  titulo        TEXT NOT NULL,
  version       TEXT DEFAULT '',
  nivel_snc     INT,
  vigencia_cert INT DEFAULT 3,
  config        JSONB NOT NULL DEFAULT '{}',
  activo        BOOLEAN DEFAULT TRUE,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE estandares_competencia ENABLE ROW LEVEL SECURITY;

CREATE POLICY "estandares_lectura_auth"
  ON estandares_competencia FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "estandares_escritura_service"
  ON estandares_competencia FOR ALL
  USING (auth.role() = 'service_role');

-- 2. Procesos de Evaluación (un proceso por candidato × EC)
CREATE TABLE IF NOT EXISTS procesos_evaluacion (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  candidato_id     UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluador_id     UUID REFERENCES auth.users(id),
  ce_id            UUID REFERENCES auth.users(id),
  oc_id            UUID REFERENCES auth.users(id),
  estandar_id      UUID REFERENCES estandares_competencia(id),
  estado           TEXT DEFAULT 'registro'
                   CHECK (estado IN (
                     'registro','diagnostico','plan_acordado',
                     'evidencias','juicio','cierre','certificado'
                   )),
  datos            JSONB DEFAULT '{}',
  juicio           TEXT CHECK (juicio IN ('C', 'TNC', NULL)),
  credito_canjeado BOOLEAN DEFAULT FALSE,
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE procesos_evaluacion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "proceso_owner"
  ON procesos_evaluacion FOR ALL
  USING (
    candidato_id = auth.uid()
    OR evaluador_id = auth.uid()
    OR ce_id       = auth.uid()
    OR oc_id       = auth.uid()
  );

-- 3. Trigger updated_at en procesos_evaluacion
CREATE OR REPLACE FUNCTION fn_update_proceso_timestamp()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_proceso_updated_at ON procesos_evaluacion;
CREATE TRIGGER trg_proceso_updated_at
  BEFORE UPDATE ON procesos_evaluacion
  FOR EACH ROW EXECUTE FUNCTION fn_update_proceso_timestamp();

-- 4. Actualizar constraint de user_roles para incluir nuevos roles GCE
ALTER TABLE user_roles
  DROP CONSTRAINT IF EXISTS user_roles_role_check;

ALTER TABLE user_roles
  ADD CONSTRAINT user_roles_role_check
  CHECK (role IN (
    'evaluador', 'asesor',
    'norma_ec0091', 'norma_ec0616',
    'oc_admin', 'ce_admin'
  ));
