-- SmartBuilderEC — Agregar columna telefono a profiles
-- Ejecutar en Supabase SQL Editor (seguro repetir: IF NOT EXISTS)

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS telefono text DEFAULT '';
