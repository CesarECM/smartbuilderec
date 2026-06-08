-- ═══════════════════════════════════════════════════════════════════
-- SmartBuilderEC — Bucket wizard-templates (Supabase Storage)
-- Sprint 5: Generación de docs con templates .docx desde el navegador
--
-- Ejecutar en Supabase → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════════


-- ── 1. Crear bucket (idempotente) ────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'wizard-templates',
  'wizard-templates',
  FALSE,       -- privado: requiere JWT para leer
  10485760,    -- 10 MB máximo por archivo
  ARRAY[
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/octet-stream'
  ]
)
ON CONFLICT (id) DO NOTHING;


-- ── 2. RLS en storage.objects ─────────────────────────────────────────

-- Lectura: cualquier usuario autenticado puede descargar templates
-- (para que el wizard engine pueda obtenerlos al generar documentos)
CREATE POLICY "wizard_templates_read"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'wizard-templates');

-- Escritura (INSERT): solo super_admin y editor
CREATE POLICY "wizard_templates_insert"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'wizard-templates'
    AND public.get_my_role() IN ('super_admin', 'editor')
  );

-- Actualización (UPDATE): solo super_admin y editor
CREATE POLICY "wizard_templates_update"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (
    bucket_id = 'wizard-templates'
    AND public.get_my_role() IN ('super_admin', 'editor')
  );

-- Eliminación (DELETE): solo super_admin y editor
CREATE POLICY "wizard_templates_delete"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'wizard-templates'
    AND public.get_my_role() IN ('super_admin', 'editor')
  );
