-- ═══════════════════════════════════════════════════════════════════════════
-- SmartBuilderEC — ERP Académico: Migration v1.0
-- Tablas nuevas: normas, user_roles, asignaciones, pagos, proceso_certificacion
--
-- INSTRUCCIONES:
--   Supabase Dashboard → SQL Editor → New query → pegar y ejecutar
--   Seguro repetir: todos los CREATE usan IF NOT EXISTS y ON CONFLICT DO NOTHING
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. TABLA normas ──────────────────────────────────────────────────────────
-- Catálogo de estándares CONOCER. Extensible sin código: el superadmin agrega filas.
CREATE TABLE IF NOT EXISTS public.normas (
  id                         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  codigo                     TEXT        NOT NULL UNIQUE,
  nombre                     TEXT        NOT NULL,
  descripcion                TEXT        NOT NULL DEFAULT '',
  dias_estimados_certificado INT         NOT NULL DEFAULT 45,
  tiene_wizard               BOOLEAN     NOT NULL DEFAULT FALSE,
  activo                     BOOLEAN     NOT NULL DEFAULT TRUE,
  created_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                 TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE  public.normas IS 'Catálogo de estándares de competencia laboral CONOCER.';
COMMENT ON COLUMN public.normas.dias_estimados_certificado IS 'Días calendario estimados desde el envío del lote al CONOCER hasta recibir el certificado.';
COMMENT ON COLUMN public.normas.tiene_wizard IS 'TRUE si existe wizard de alineación para esta norma en la plataforma.';

INSERT INTO public.normas (codigo, nombre, descripcion, dias_estimados_certificado, tiene_wizard) VALUES
  ('EC0217.01', 'Impartición de cursos de capacitación presenciales',
   'Norma para instructores que imparten cursos de capacitación presenciales conforme al CONOCER.',
   45, TRUE),
  ('EC0301', 'Evaluación de competencias de candidatos con base en estándares de competencia',
   'Norma para evaluadores de competencias laborales.',
   50, FALSE),
  ('EC0076', 'Diseño e impartición de cursos de capacitación',
   'Norma para diseñadores e instructores de programas de capacitación.',
   45, FALSE),
  ('EC0366', 'Elaboración de proyectos de capacitación',
   'Norma para elaborar proyectos de capacitación en organizaciones.',
   45, FALSE),
  ('EC0581', 'Capacitación grupal de personas adultas',
   'Norma para facilitadores de procesos de aprendizaje grupal con adultos.',
   45, FALSE),
  ('EC0249', 'Diseño de cursos de capacitación presencial y sus instrumentos de evaluación',
   'Norma para el diseño curricular de cursos de capacitación.',
   45, FALSE)
ON CONFLICT (codigo) DO NOTHING;


-- ── 2. TABLA user_roles ───────────────────────────────────────────────────────
-- Roles acumulativos (evaluador / asesor), independientes de profiles.rol.
-- Un mismo usuario puede tener ambos. El superadmin los asigna manualmente.
CREATE TABLE IF NOT EXISTS public.user_roles (
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role        TEXT        NOT NULL CHECK (role IN ('evaluador', 'asesor')),
  assigned_by UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, role)
);

COMMENT ON TABLE public.user_roles IS 'Roles adicionales evaluador/asesor. Un usuario puede tener ambos simultáneamente.';


-- ── 3. TABLA asignaciones ──────────────────────────────────────────────────────
-- Enrollamiento de un alumno en una norma, con su asesor y evaluador asignados.
-- Un alumno puede estar en múltiples normas; cada norma tiene su propio par asesor/evaluador.
CREATE TABLE IF NOT EXISTS public.asignaciones (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id    UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  norma_id     UUID        NOT NULL REFERENCES public.normas(id)   ON DELETE CASCADE,
  asesor_id    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  evaluador_id UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  admin_id     UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(alumno_id, norma_id)
);

COMMENT ON TABLE  public.asignaciones IS 'Enrollamiento alumno↔norma con asesor y evaluador asignados.';
COMMENT ON COLUMN public.asignaciones.admin_id IS 'Admin dueño del registro — el que gestiona a este alumno.';


-- ── 4. TABLA pagos ────────────────────────────────────────────────────────────
-- Un registro por combinación (alumno, norma, concepto). UNIQUE lo garantiza.
-- concepto: 'alineacion' = acceso al wizard; 'evaluacion' = evaluación CONOCER;
--           'certificacion' = emisión del certificado.
CREATE TABLE IF NOT EXISTS public.pagos (
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id         UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  norma_id          UUID        NOT NULL REFERENCES public.normas(id)   ON DELETE CASCADE,
  concepto          TEXT        NOT NULL CHECK (concepto IN ('alineacion', 'evaluacion', 'certificacion')),
  tipo              TEXT        NOT NULL CHECK (tipo IN ('stripe', 'manual')),
  monto             INT         NOT NULL DEFAULT 0,
  moneda            TEXT        NOT NULL DEFAULT 'MXN',
  stripe_session_id TEXT,
  referencia        TEXT,
  notas             TEXT,
  registrado_por    UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  pagado_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(alumno_id, norma_id, concepto)
);

COMMENT ON TABLE  public.pagos IS 'Registro de pagos (Stripe o manual) por alumno, norma y concepto.';
COMMENT ON COLUMN public.pagos.monto IS 'Monto en centavos (ej. 179900 = $1,799 MXN).';


-- ── 5. TABLA proceso_certificacion ────────────────────────────────────────────
-- Tracking del proceso CONOCER por alumno y norma.
-- Flujo: evaluado_at (evaluador) → lote_enviado_at (admin) → certificado_recibido_at
CREATE TABLE IF NOT EXISTS public.proceso_certificacion (
  id                      UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  alumno_id               UUID        NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  norma_id                UUID        NOT NULL REFERENCES public.normas(id)   ON DELETE CASCADE,
  evaluado_at             TIMESTAMPTZ,
  evaluado_por            UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  evaluacion_notas        TEXT,
  lote_enviado_at         TIMESTAMPTZ,
  lote_enviado_por        UUID        REFERENCES public.profiles(id) ON DELETE SET NULL,
  certificado_esperado_at DATE,
  certificado_recibido_at DATE,
  notas                   TEXT,
  created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(alumno_id, norma_id)
);

COMMENT ON TABLE  public.proceso_certificacion IS 'Tracking del proceso de certificación CONOCER por alumno y norma.';
COMMENT ON COLUMN public.proceso_certificacion.certificado_esperado_at IS 'lote_enviado_at + norma.dias_estimados_certificado (calculado al registrar el lote).';


-- ═══════════════════════════════════════════════════════════════════════════
-- FUNCIONES AUXILIARES
-- ═══════════════════════════════════════════════════════════════════════════

-- Verifica si el usuario en sesión tiene un rol adicional (evaluador/asesor)
CREATE OR REPLACE FUNCTION public.has_extra_role(p_role TEXT)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = p_role
  );
$$;

-- Verifica si el usuario en sesión tiene asignado un alumno (como evaluador o asesor)
CREATE OR REPLACE FUNCTION public.is_assigned_to(p_alumno_id UUID)
RETURNS BOOLEAN LANGUAGE SQL SECURITY DEFINER STABLE AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.asignaciones
    WHERE alumno_id = p_alumno_id
      AND (evaluador_id = auth.uid() OR asesor_id = auth.uid())
  );
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- TRIGGERS updated_at
-- ═══════════════════════════════════════════════════════════════════════════

DROP TRIGGER IF EXISTS trg_normas_updated_at ON public.normas;
CREATE TRIGGER trg_normas_updated_at
  BEFORE UPDATE ON public.normas
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

DROP TRIGGER IF EXISTS trg_asignaciones_updated_at ON public.asignaciones;
CREATE TRIGGER trg_asignaciones_updated_at
  BEFORE UPDATE ON public.asignaciones
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();

DROP TRIGGER IF EXISTS trg_proceso_certificacion_updated_at ON public.proceso_certificacion;
CREATE TRIGGER trg_proceso_certificacion_updated_at
  BEFORE UPDATE ON public.proceso_certificacion
  FOR EACH ROW EXECUTE FUNCTION public.fn_update_updated_at();


-- ═══════════════════════════════════════════════════════════════════════════
-- ROW LEVEL SECURITY
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE public.normas                ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.asignaciones          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pagos                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proceso_certificacion ENABLE ROW LEVEL SECURITY;


-- ── normas: lectura pública (autenticado), escritura solo superadmin ──────────

CREATE POLICY "normas_select_authenticated"
  ON public.normas FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "normas_all_superadmin"
  ON public.normas FOR ALL
  USING (public.get_my_role() = 'super_admin');


-- ── user_roles ────────────────────────────────────────────────────────────────

CREATE POLICY "user_roles_select_own"
  ON public.user_roles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "user_roles_select_admin"
  ON public.user_roles FOR SELECT
  USING (
    public.get_my_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = user_roles.user_id AND p.admin_id = auth.uid()
    )
  );

CREATE POLICY "user_roles_all_superadmin"
  ON public.user_roles FOR ALL
  USING (public.get_my_role() = 'super_admin');


-- ── asignaciones ──────────────────────────────────────────────────────────────

CREATE POLICY "asignaciones_select_alumno"
  ON public.asignaciones FOR SELECT
  USING (alumno_id = auth.uid());

CREATE POLICY "asignaciones_select_admin"
  ON public.asignaciones FOR SELECT
  USING (admin_id = auth.uid() AND public.get_my_role() = 'admin');

CREATE POLICY "asignaciones_select_asignado"
  ON public.asignaciones FOR SELECT
  USING (evaluador_id = auth.uid() OR asesor_id = auth.uid());

CREATE POLICY "asignaciones_all_superadmin"
  ON public.asignaciones FOR ALL
  USING (public.get_my_role() = 'super_admin');

CREATE POLICY "asignaciones_insert_admin"
  ON public.asignaciones FOR INSERT
  WITH CHECK (admin_id = auth.uid() AND public.get_my_role() = 'admin');

CREATE POLICY "asignaciones_update_admin"
  ON public.asignaciones FOR UPDATE
  USING (admin_id = auth.uid() AND public.get_my_role() = 'admin');


-- ── pagos ─────────────────────────────────────────────────────────────────────

CREATE POLICY "pagos_select_alumno"
  ON public.pagos FOR SELECT
  USING (alumno_id = auth.uid());

CREATE POLICY "pagos_select_admin"
  ON public.pagos FOR SELECT
  USING (
    public.get_my_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = pagos.alumno_id AND p.admin_id = auth.uid()
    )
  );

CREATE POLICY "pagos_select_asignado"
  ON public.pagos FOR SELECT
  USING (public.is_assigned_to(alumno_id));

CREATE POLICY "pagos_all_superadmin"
  ON public.pagos FOR ALL
  USING (public.get_my_role() = 'super_admin');


-- ── proceso_certificacion ─────────────────────────────────────────────────────

CREATE POLICY "proceso_select_alumno"
  ON public.proceso_certificacion FOR SELECT
  USING (alumno_id = auth.uid());

CREATE POLICY "proceso_select_admin"
  ON public.proceso_certificacion FOR SELECT
  USING (
    public.get_my_role() = 'admin'
    AND EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = proceso_certificacion.alumno_id AND p.admin_id = auth.uid()
    )
  );

CREATE POLICY "proceso_select_asignado"
  ON public.proceso_certificacion FOR SELECT
  USING (public.is_assigned_to(alumno_id));

CREATE POLICY "proceso_all_superadmin"
  ON public.proceso_certificacion FOR ALL
  USING (public.get_my_role() = 'super_admin');


-- ═══════════════════════════════════════════════════════════════════════════
-- ÍNDICES
-- ═══════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_normas_activo          ON public.normas(activo);
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id     ON public.user_roles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_roles_role        ON public.user_roles(role);
CREATE INDEX IF NOT EXISTS idx_asignaciones_alumno    ON public.asignaciones(alumno_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_admin     ON public.asignaciones(admin_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_evaluador ON public.asignaciones(evaluador_id);
CREATE INDEX IF NOT EXISTS idx_asignaciones_asesor    ON public.asignaciones(asesor_id);
CREATE INDEX IF NOT EXISTS idx_pagos_alumno           ON public.pagos(alumno_id);
CREATE INDEX IF NOT EXISTS idx_pagos_norma            ON public.pagos(norma_id);
CREATE INDEX IF NOT EXISTS idx_proceso_alumno         ON public.proceso_certificacion(alumno_id);
CREATE INDEX IF NOT EXISTS idx_proceso_norma          ON public.proceso_certificacion(norma_id);


-- ═══════════════════════════════════════════════════════════════════════════
-- PERMISOS DE FUNCIONES
-- ═══════════════════════════════════════════════════════════════════════════

GRANT EXECUTE ON FUNCTION public.has_extra_role(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_assigned_to(UUID) TO authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLBACK (ejecutar solo si necesitas deshacer esta migración)
-- ═══════════════════════════════════════════════════════════════════════════
--
-- DROP TABLE IF EXISTS public.proceso_certificacion CASCADE;
-- DROP TABLE IF EXISTS public.pagos CASCADE;
-- DROP TABLE IF EXISTS public.asignaciones CASCADE;
-- DROP TABLE IF EXISTS public.user_roles CASCADE;
-- DROP TABLE IF EXISTS public.normas CASCADE;
-- DROP FUNCTION IF EXISTS public.has_extra_role(TEXT);
-- DROP FUNCTION IF EXISTS public.is_assigned_to(UUID);
-- ═══════════════════════════════════════════════════════════════════════════
