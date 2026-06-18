-- ─────────────────────────────────────────────────────────────────────────────
-- Panel Alumno MVP — Migración Supabase
-- Ejecutar en orden. Cada bloque es idempotente (IF NOT EXISTS / DEFAULT).
-- ─────────────────────────────────────────────────────────────────────────────

-- 1. Campos de perfil del alumno
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS curp        TEXT,
  ADD COLUMN IF NOT EXISTS telefono    TEXT,
  ADD COLUMN IF NOT EXISTS curriculum  TEXT,
  ADD COLUMN IF NOT EXISTS cert_asesor_autorizo    BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cert_evaluador_autorizo BOOLEAN DEFAULT FALSE;

-- 2. Ampliar tabla descargas con snapshot para deduplicación
--    (la tabla ya existe — fue creada en Fase 4 de mejoras-v1.1)
ALTER TABLE descargas
  ADD COLUMN IF NOT EXISTS snapshot_instructor   TEXT,
  ADD COLUMN IF NOT EXISTS snapshot_nombre_curso TEXT,
  ADD COLUMN IF NOT EXISTS snapshot_content_len  INT,
  ADD COLUMN IF NOT EXISTS es_slot               BOOLEAN DEFAULT TRUE;

-- 3. RLS en descargas: el alumno solo ve sus propias filas
ALTER TABLE descargas ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'descargas' AND policyname = 'alumno_own_descargas_select'
  ) THEN
    CREATE POLICY alumno_own_descargas_select ON descargas
      FOR SELECT USING (auth.uid() = user_id);
  END IF;
END $$;
