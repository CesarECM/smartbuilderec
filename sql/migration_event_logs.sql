-- ─────────────────────────────────────────────────────────────────────────────
-- migration_event_logs.sql
-- Sistema de logs de actividad de alumnos en el wizard EC0217
-- Ejecutar en Supabase SQL Editor
-- ─────────────────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS event_logs (
  id           UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID        REFERENCES profiles(id) ON DELETE SET NULL,
  event_type   TEXT        NOT NULL,
  metadata     JSONB       DEFAULT '{}',
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_event_logs_user_id    ON event_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_event_logs_event_type ON event_logs(event_type);
CREATE INDEX IF NOT EXISTS idx_event_logs_created_at ON event_logs(created_at DESC);

ALTER TABLE event_logs ENABLE ROW LEVEL SECURITY;

-- Alumnos pueden insertar sus propios eventos
CREATE POLICY "event_logs_insert_own" ON event_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Superadmin puede leer todos los logs
CREATE POLICY "event_logs_select_superadmin" ON event_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND rol = 'super_admin'
    )
  );
