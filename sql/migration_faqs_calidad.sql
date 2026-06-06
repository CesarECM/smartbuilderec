-- ══════════════════════════════════════════════════════════════════════════════
-- Migración: Calidad de FAQs — votos negativos + exposiciones
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

ALTER TABLE knowledge_faqs
  ADD COLUMN IF NOT EXISTS votos_negativo integer DEFAULT 0,
  ADD COLUMN IF NOT EXISTS exposiciones   integer DEFAULT 0;

-- Índice para acelerar la consulta de bajo rendimiento
CREATE INDEX IF NOT EXISTS idx_faqs_calidad
  ON knowledge_faqs (activo, created_at, exposiciones)
  WHERE activo = true;
