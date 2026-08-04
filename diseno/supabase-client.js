// ─── supabase-client.js — Instancia única del cliente Supabase ───────────────
// CONFIGURACIÓN REQUERIDA:
//   1. Ve a tu proyecto en supabase.com
//   2. Project Settings → API
//   3. Copia "Project URL" y la clave "anon public"
//   4. Pégalas abajo reemplazando los valores TU_*
//
// La ANON KEY es segura en el frontend (es pública por diseño de Supabase).
// La SERVICE ROLE KEY NUNCA va aquí — solo en el backend de Render.
//
// TAMBIÉN CONFIGURA EN SUPABASE (una sola vez):
//   Authentication → URL Configuration → Redirect URLs → Agregar:
//     https://smartbuilderec.vercel.app/**
//     http://localhost:*/**
// ─────────────────────────────────────────────────────────────────────────────

const SUPABASE_URL      = "https://jvlmxrdknjmyqaprsezd.supabase.co";       // ← pegar aquí tu Project URL
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2bG14cmRrbmpteXFhcHJzZXpkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1ODY1OTEsImV4cCI6MjA5NjE2MjU5MX0.1xAgCG0GcR2nXVVRPjvjHKOlxT2BgjyuJ6hyvBGvWmU";  // ← pegar aquí tu anon public key

const _supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession:     true,
    storageKey:         "sbe_auth",  // clave en localStorage para la sesión
    autoRefreshToken:   true,
    detectSessionInUrl: true,        // necesario para Google OAuth y Magic Links
  }
});
// Exponer para módulos ES (gce/main.js, etc.) que no pueden acceder a const global
window._supabase = _supabase;
