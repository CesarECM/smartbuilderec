-- ══════════════════════════════════════════════════════════════════════════════
-- Migración: Recursos públicos — match_knowledge devuelve recurso_id
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ══════════════════════════════════════════════════════════════════════════════

-- Actualizar función para exponer el recurso_id en chunks (el chat lo usa para
-- construir el enlace al artículo completo en el blog público).

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
  similarity  float,
  recurso_id  uuid
) AS $$
BEGIN
  RETURN QUERY
    -- FAQs directas
    SELECT
      f.id,
      'faq'::text                              AS tipo,
      f.pregunta                               AS titulo,
      f.respuesta                              AS contenido,
      1 - (f.embedding <=> query_embedding)    AS similarity,
      NULL::uuid                               AS recurso_id
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
      1 - (c.embedding <=> query_embedding)    AS similarity,
      r.id                                     AS recurso_id
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
