/*-- ═══════════════════════════════════════════════════════════════
-- CEECM — Schema de Base de Datos en Supabase
-- Ejecutar en: Supabase Dashboard → SQL Editor → New query
-- ═══════════════════════════════════════════════════════════════

-- ── 1. Tabla profiles ────────────────────────────────────────────
create table public.profiles (
  id               uuid references auth.users(id) on delete cascade primary key,
  nombre           text,
  apellido         text,
  rol              text not null default 'estudiante'
                   check (rol in ('admin', 'instructor', 'estudiante')),
  stripe_customer_id text,
  created_at       timestamptz default now()
);

-- Trigger: crear perfil automáticamente al registrar usuario
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nombre, apellido, rol)
  values (
    new.id,
    new.raw_user_meta_data->>'nombre',
    new.raw_user_meta_data->>'apellido',
    coalesce(new.raw_user_meta_data->>'rol', 'estudiante')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ── 2. Tabla cursos ───────────────────────────────────────────────
create table public.cursos (
  id               uuid primary key default gen_random_uuid(),
  titulo           text not null,
  descripcion      text,
  duracion_horas   int,
  precio           numeric(10,2) not null default 0,
  stripe_price_id  text,
  instructor_id    uuid references public.profiles(id) on delete set null,
  imagen_url       text,
  activo           boolean default true,
  created_at       timestamptz default now()
);

-- ── 3. Tabla inscripciones ────────────────────────────────────────
create table public.inscripciones (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references public.profiles(id) on delete cascade not null,
  curso_id            uuid references public.cursos(id) on delete cascade not null,
  stripe_payment_id   text,
  stripe_session_id   text,
  estado              text not null default 'pagado'
                      check (estado in ('pagado', 'cancelado', 'reembolsado')),
  fecha_pago          timestamptz default now(),
  unique (user_id, curso_id)
);

-- ── 4. Tabla planeaciones ─────────────────────────────────────────
create table public.planeaciones (
  id              uuid primary key default gen_random_uuid(),
  instructor_id   uuid references public.profiles(id) on delete cascade not null,
  curso_id        uuid references public.cursos(id) on delete set null,
  titulo          text,
  datos           jsonb,
  created_at      timestamptz default now()
);

-- ═══════════════════════════════════════════════════════════════
-- RLS (Row Level Security)
-- ═══════════════════════════════════════════════════════════════

alter table public.profiles       enable row level security;
alter table public.cursos         enable row level security;
alter table public.inscripciones  enable row level security;
alter table public.planeaciones   enable row level security;

-- profiles: cada usuario lee/edita solo el suyo
create policy "profiles_select_own"  on public.profiles for select  using (auth.uid() = id);
create policy "profiles_update_own"  on public.profiles for update  using (auth.uid() = id);

-- cursos: lectura pública para cursos activos; escritura solo instructor/admin
create policy "cursos_select_public" on public.cursos for select  using (activo = true);
create policy "cursos_insert_own"    on public.cursos for insert  with check (instructor_id = auth.uid());
create policy "cursos_update_own"    on public.cursos for update  using (instructor_id = auth.uid());

-- inscripciones: usuario ve solo las suyas
create policy "inscripciones_select_own" on public.inscripciones for select using (user_id = auth.uid());

-- planeaciones: instructor ve y gestiona solo las suyas
create policy "planeaciones_all_own" on public.planeaciones for all using (instructor_id = auth.uid());

-- ═══════════════════════════════════════════════════════════════
-- Permisos para el service role (usado desde el backend FastAPI)
-- El service role bypassa RLS automáticamente en Supabase.
-- No se necesitan políticas adicionales para el backend.
-- ═══════════════════════════════════════════════════════════════
*/