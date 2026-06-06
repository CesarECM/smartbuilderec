-- ══════════════════════════════════════════════════════════════════════════════
-- Sistema de Soporte IA — Schema Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- Paso previo: Database → Extensions → Buscar "vector" → Activar
-- ══════════════════════════════════════════════════════════════════════════════

-- 1. Habilitar extensión pgvector
CREATE EXTENSION IF NOT EXISTS vector;

-- ── Knowledge Base ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS knowledge_faqs (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pregunta    text NOT NULL,
  respuesta   text NOT NULL,
  categoria   text DEFAULT 'general',
  contexto    text DEFAULT 'general',  -- 'general' | 'ventas' | 'wizard_ec0217' | etc.
  activo      boolean DEFAULT true,
  votos_util  integer DEFAULT 0,
  embedding   vector(1536),
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_recursos (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  titulo      text NOT NULL,
  tipo        text DEFAULT 'articulo',  -- 'articulo' | 'video' | 'pdf' | 'tutorial'
  contenido   text,
  url         text,
  contexto    text DEFAULT 'general',
  activo      boolean DEFAULT true,
  embedding   vector(1536),
  created_at  timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS knowledge_chunks (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recurso_id  uuid REFERENCES knowledge_recursos(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  contenido   text NOT NULL,
  embedding   vector(1536),
  created_at  timestamptz DEFAULT now()
);

-- ── Conversación y Escalación ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS soporte_sesiones (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        uuid,                                  -- nullable: permite anónimos
  pagina_origen  text,
  contexto       text DEFAULT 'general',
  total_turnos   integer DEFAULT 0,
  transcript     jsonb DEFAULT '[]'::jsonb,
  resolucion     text DEFAULT 'en_curso',               -- 'en_curso' | 'resuelta_l1' | 'escalada'
  ticket_id      uuid,
  created_at     timestamptz DEFAULT now(),
  updated_at     timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS soporte_tickets (
  id                     uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero                 serial UNIQUE,
  sesion_id              uuid REFERENCES soporte_sesiones(id),
  user_id                uuid,
  user_email             text,
  user_nombre            text,
  asunto                 text NOT NULL,
  categoria              text DEFAULT 'general',
  prioridad              text DEFAULT 'normal',         -- 'baja' | 'normal' | 'alta'
  estado                 text DEFAULT 'nuevo',          -- 'nuevo' | 'en_revision' | 'resuelto'
  resolucion             text,
  notas_internas         text,
  tiempo_resolucion_mins integer,
  created_at             timestamptz DEFAULT now(),
  updated_at             timestamptz DEFAULT now()
);

-- ── Sistema de Aprendizaje (Fase 3) ───────────────────────────────────────

CREATE TABLE IF NOT EXISTS soporte_sugerencias (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  tipo         text,       -- 'nueva_faq' | 'nuevo_recurso' | 'actualizar_prompt' | 'patron_detectado'
  ticket_ids   uuid[],
  propuesta    jsonb,      -- {descripcion, contenido, causa_raiz}
  estado       text DEFAULT 'pendiente',  -- 'pendiente' | 'aprobada' | 'rechazada'
  aprobada_por uuid,
  aplicada_en  timestamptz,
  created_at   timestamptz DEFAULT now()
);

-- ── Función RPC de Búsqueda Vectorial ─────────────────────────────────────

CREATE OR REPLACE FUNCTION match_knowledge(
  query_embedding       vector(1536),
  similarity_threshold  float    DEFAULT 0.72,
  match_count           int      DEFAULT 5,
  filtro_contexto       text     DEFAULT NULL
)
RETURNS TABLE (
  id          uuid,
  tipo        text,
  titulo      text,
  contenido   text,
  similarity  float
) AS $$
BEGIN
  RETURN QUERY
    -- FAQs directas
    SELECT
      f.id,
      'faq'::text                              AS tipo,
      f.pregunta                               AS titulo,
      f.respuesta                              AS contenido,
      1 - (f.embedding <=> query_embedding)    AS similarity
    FROM knowledge_faqs f
    WHERE f.activo = true
      AND f.embedding IS NOT NULL
      AND (
        filtro_contexto IS NULL
        OR f.contexto IS NULL
        OR f.contexto = 'general'
        OR f.contexto = filtro_contexto
      )
      AND 1 - (f.embedding <=> query_embedding) > similarity_threshold

    UNION ALL

    -- Chunks de recursos
    SELECT
      c.id,
      'recurso_chunk'::text                    AS tipo,
      r.titulo                                 AS titulo,
      c.contenido                              AS contenido,
      1 - (c.embedding <=> query_embedding)    AS similarity
    FROM knowledge_chunks c
    JOIN knowledge_recursos r ON r.id = c.recurso_id
    WHERE r.activo = true
      AND c.embedding IS NOT NULL
      AND (
        filtro_contexto IS NULL
        OR r.contexto IS NULL
        OR r.contexto = 'general'
        OR r.contexto = filtro_contexto
      )
      AND 1 - (c.embedding <=> query_embedding) > similarity_threshold

    ORDER BY similarity DESC
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ── Índices HNSW (búsqueda rápida con millones de vectores) ───────────────

CREATE INDEX IF NOT EXISTS idx_faqs_embedding
  ON knowledge_faqs USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_recursos_embedding
  ON knowledge_recursos USING hnsw (embedding vector_cosine_ops);

CREATE INDEX IF NOT EXISTS idx_chunks_embedding
  ON knowledge_chunks USING hnsw (embedding vector_cosine_ops);

-- ── Índices de apoyo ───────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_faqs_activo_contexto
  ON knowledge_faqs (activo, contexto);

CREATE INDEX IF NOT EXISTS idx_tickets_estado
  ON soporte_tickets (estado, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sesiones_updated
  ON soporte_sesiones (updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_sugerencias_estado
  ON soporte_sugerencias (estado);
