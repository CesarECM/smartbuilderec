-- ═══════════════════════════════════════════════════════════════════
-- SmartBuilderEC — Motor Genérico de Wizards
-- Sprint 4: wizard_schemas + wizard_instancias
--
-- INSTRUCCIONES:
--   Supabase → SQL Editor → New query → Pegar y ejecutar.
--   Idempotente: se puede re-ejecutar con IF NOT EXISTS / ON CONFLICT.
-- ═══════════════════════════════════════════════════════════════════


-- ── 0. wizard_normas (catálogo base) ─────────────────────────────
-- La tabla ya existe. Solo aseguramos que ec0217 y ec0301 estén.
INSERT INTO public.wizard_normas (id, nombre, descripcion, icono, activo, orden)
VALUES
  ('ec0217', 'EC0217.01',
   'Diseño de cursos de capacitación y formación de capital humano con base en estándares de competencia',
   '📐', TRUE, 1),
  ('ec0301', 'EC0301.01',
   'Impartición de cursos de capacitación y formación de capital humano de manera presencial grupal',
   '🎓', TRUE, 2)
ON CONFLICT (id) DO NOTHING;


-- ── 1. wizard_schemas ─────────────────────────────────────────────
-- Almacena el JSON completo de cada norma: secciones, pasos, campos,
-- prompts de IA y metadatos de documentos.
CREATE TABLE IF NOT EXISTS public.wizard_schemas (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  norma_id   TEXT        NOT NULL REFERENCES public.wizard_normas(id) ON DELETE CASCADE,
  version    INT         NOT NULL DEFAULT 1,
  esquema    JSONB       NOT NULL DEFAULT '{}'::JSONB,
  activo     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Solo un schema activo por norma
CREATE UNIQUE INDEX IF NOT EXISTS uq_wizard_schemas_norma_activo
  ON public.wizard_schemas (norma_id)
  WHERE activo = TRUE;

CREATE TRIGGER trg_wizard_schemas_updated_at
  BEFORE UPDATE ON public.wizard_schemas
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

ALTER TABLE public.wizard_schemas ENABLE ROW LEVEL SECURITY;

-- Cualquier usuario autenticado puede leer schemas activos
CREATE POLICY "schemas_lectura_autenticados"
  ON public.wizard_schemas FOR SELECT
  TO authenticated
  USING (activo = TRUE);

-- Solo super_admin puede crear / editar / eliminar
CREATE POLICY "schemas_escritura_superadmin"
  ON public.wizard_schemas FOR ALL
  USING (public.get_my_role() = 'super_admin')
  WITH CHECK (public.get_my_role() = 'super_admin');


-- ── 2. wizard_instancias ──────────────────────────────────────────
-- Una fila por cada planeación que un usuario (o admin) está llenando
-- en cualquier norma. Reemplaza la tabla por-norma para todas las normas
-- nuevas; ec0217 legacy sigue leyendo de planeaciones.
CREATE TABLE IF NOT EXISTS public.wizard_instancias (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  norma_id    TEXT        NOT NULL REFERENCES public.wizard_normas(id),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  assigned_by UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  nombre      TEXT        NOT NULL DEFAULT 'Sin título',
  status      TEXT        NOT NULL DEFAULT 'borrador'
                          CHECK (status IN ('borrador', 'completa')),
  paso_actual TEXT        NOT NULL DEFAULT '',
  datos       JSONB       NOT NULL DEFAULT '{}'::JSONB,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wizard_instancias_user
  ON public.wizard_instancias (user_id);
CREATE INDEX IF NOT EXISTS idx_wizard_instancias_norma_user
  ON public.wizard_instancias (norma_id, user_id);

CREATE TRIGGER trg_wizard_instancias_updated_at
  BEFORE UPDATE ON public.wizard_instancias
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

ALTER TABLE public.wizard_instancias ENABLE ROW LEVEL SECURITY;

-- Usuario: ver y editar sus propias instancias
CREATE POLICY "instancias_usuario_propio"
  ON public.wizard_instancias FOR ALL
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Admin: leer instancias de cualquier usuario (para pre-llenado y asignación)
CREATE POLICY "instancias_admin_lee_todas"
  ON public.wizard_instancias FOR SELECT
  TO authenticated
  USING (public.get_my_role() IN ('admin', 'super_admin'));

-- Admin: crear instancias para cualquier user (pre-llenado)
CREATE POLICY "instancias_admin_crea"
  ON public.wizard_instancias FOR INSERT
  TO authenticated
  WITH CHECK (public.get_my_role() IN ('admin', 'super_admin'));

-- Admin: actualizar instancias (asignación, edición)
CREATE POLICY "instancias_admin_actualiza"
  ON public.wizard_instancias FOR UPDATE
  TO authenticated
  USING (public.get_my_role() IN ('admin', 'super_admin'));

-- Admin: eliminar instancias
CREATE POLICY "instancias_admin_elimina"
  ON public.wizard_instancias FOR DELETE
  TO authenticated
  USING (public.get_my_role() IN ('admin', 'super_admin'));

COMMENT ON TABLE  public.wizard_instancias             IS 'Instancias de cualquier norma: cada fila es una planeación en progreso.';
COMMENT ON COLUMN public.wizard_instancias.assigned_by IS 'Admin que pre-llenó la instancia. NULL = el propio usuario la creó.';
COMMENT ON COLUMN public.wizard_instancias.datos       IS 'Snapshot plano de todos los campos del wizard (keys = field IDs del schema).';
