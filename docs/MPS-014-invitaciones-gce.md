# MPS #014 — Invitaciones GCE + Estructura OC→CE→EC + Gestión de Equipo

**Fecha:** 2026-07-29
**Objetivo:** Tres bloques interdependientes:
1. Estructura OC→CE→EC: OC incorpora CEs y autoriza qué ECs trabaja cada uno
2. Flujo de invitación por email (candidatos y evaluadores) — CE no busca en DB
3. Panel "Mi Equipo" del CE: gestión de evaluadores y candidatos activos

---

## Decisiones técnicas

- `gce_invitaciones.tipo`: `'candidato'` (crea procesos + créditos) | `'evaluador'` (asigna rol + vincula)
- Candidato: crédito descontado al ACEPTAR, no al enviar invitación
- Evaluador: sin crédito — es parte del equipo operativo del CE
- `ce_evaluador_relaciones`: vinculación permanente CE↔Evaluador (independiente de procesos)
- CE no busca en DB: ingresa email → sistema determina si ya tiene cuenta
- OC busca CEs por email entre `ce_admin` (B2B, universo pequeño, sin riesgo privacidad)
- Token UUID, expira 7 días, branding CE en email

---

## Modelo de datos

```sql
-- 1. OC incorpora CEs a su organización
CREATE TABLE oc_ce_relaciones (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oc_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  ce_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (oc_id, ce_id)
);

-- 2. OC autoriza qué ECs puede trabajar un CE
CREATE TABLE ce_estandares_autorizados (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  oc_id       UUID REFERENCES auth.users(id),
  ce_id       UUID REFERENCES auth.users(id),
  estandar_id UUID REFERENCES estandares_competencia(id),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (ce_id, estandar_id)
);

-- 3. CE vincula evaluadores a su equipo
CREATE TABLE ce_evaluador_relaciones (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ce_id         UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  evaluador_id  UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (ce_id, evaluador_id)
);

-- 4. Invitaciones CE → candidato o evaluador
CREATE TABLE gce_invitaciones (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token           TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  ce_id           UUID REFERENCES auth.users(id),
  tipo            TEXT NOT NULL CHECK (tipo IN ('candidato', 'evaluador')),
  candidato_email TEXT NOT NULL,
  estandar_ids    UUID[],          -- solo para tipo='candidato'
  estado          TEXT DEFAULT 'pendiente'
                  CHECK (estado IN ('pendiente','aceptada','expirada')),
  candidato_id    UUID REFERENCES auth.users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  expires_at      TIMESTAMPTZ DEFAULT NOW() + INTERVAL '7 days',
  aceptada_at     TIMESTAMPTZ
);
```

---

## Flujos

### OC incorpora un CE
```
OC panel → tab "🏢 Mis CEs" → ingresa email del CE
    → busca entre usuarios con rol ce_admin
    → crea oc_ce_relaciones → CE queda bajo el OC
    → OC puede asignarle ECs
```

### OC autoriza ECs a un CE
```
OC panel → Mis CEs → selecciona CE → "Gestionar ECs"
    → checkboxes de ECs activos
    → guarda → ce_estandares_autorizados actualizado
```

### CE invita candidato
```
CE panel → tab "📨 Invitaciones" → tipo: Candidato
    → ingresa email + selecciona ECs autorizados
    → sistema envía email → estado: pendiente, SIN crédito

Candidato acepta:
    ├─ Con sesión → acepta → N procesos → N créditos del CE
    └─ Sin sesión → /registro?invitacion=xxx → registro → acepta
```

### CE invita evaluador
```
CE panel → tab "📨 Invitaciones" → tipo: Evaluador
    → ingresa email del evaluador
    → sistema envía email → estado: pendiente, SIN crédito

Evaluador acepta:
    ├─ Con sesión → acepta → rol evaluador asignado + ce_evaluador_relaciones creada
    └─ Sin sesión → /registro?invitacion=xxx → registro → acepta
```

### CE panel — Mi Equipo
```
Tab "👥 Mi Equipo":
  ┌─ Evaluadores: lista de ce_evaluador_relaciones + botón "Invitar evaluador"
  └─ Candidatos activos: usuarios con procesos activos en este CE
```

---

## Backlog de Sprints

### Bloque A — Estructura OC→CE→EC (prerequisito)
| Sprint | Descripción | Estado |
|--------|-------------|--------|
| S1 | SQL: `oc_ce_relaciones` + `ce_estandares_autorizados` + `ce_evaluador_relaciones` + RLS | ⏳ |
| S2 | Backend: OC gestiona CEs (`GET/POST/DELETE /gce/oc/ces`) | ⏳ |
| S3 | Backend: OC gestiona ECs por CE (`GET/PUT /gce/oc/ces/{ce_id}/estandares`) | ⏳ |
| S4 | OC panel: tab "🏢 Mis CEs" — agregar CE + lista + gestionar ECs | ⏳ |
| S5 | CE modal proceso: filtrar EC selector a solo ECs autorizados | ⏳ |

### Bloque B — Invitaciones
| Sprint | Descripción | Estado |
|--------|-------------|--------|
| S6 | SQL: `gce_invitaciones` + RLS | ⏳ |
| S7 | Backend: `POST /gce/invitaciones` (crear + enviar email según tipo) | ⏳ |
| S8 | Backend: `GET /gce/invitaciones/verificar?token` + `POST /gce/invitaciones/aceptar` | ⏳ |
| S9 | Backend: `GET /gce/invitaciones` (lista del CE) | ⏳ |
| S10 | Email templates: `gce_invitacion_candidato` + `gce_invitacion_evaluador` (branding CE) | ⏳ |
| S11 | CE panel: tab "📨 Invitaciones" — form (tipo + email + ECs si candidato) + lista | ⏳ |
| S12 | Landing `/gce-invitacion`: acepta si tiene sesión / redirige a registro | ⏳ |
| S13 | Registro: detecta `?invitacion=token` → post-registro acepta | ⏳ |

### Bloque C — Gestión de equipo CE
| Sprint | Descripción | Estado |
|--------|-------------|--------|
| S14 | Backend: `GET /gce/equipo` (evaluadores + candidatos activos del CE) | ⏳ |
| S15 | CE panel: tab "👥 Mi Equipo" — evaluadores + candidatos activos | ⏳ |
| S16 | Descuento crédito en proceso manual (candidato ya vinculado) | ⏳ |

### Bloque D — Cierre
| Sprint | Descripción | Estado |
|--------|-------------|--------|
| S17 | Smoke tests completos | ⏳ |

---

## Notas

- `access_codes` NO se modifica — sigue para wizards EC0217/EC0091/EC0616
- CE debe tener `rol = 'admin'` en profiles para tener créditos
- Buscador actual del modal GCE (todos los usuarios, solo superadmin) se mantiene para testing hasta S17
- Bloque A debe completarse antes de Bloque B
- Evaluador puede trabajar con múltiples CEs simultáneamente (relación N:M via `ce_evaluador_relaciones`)
