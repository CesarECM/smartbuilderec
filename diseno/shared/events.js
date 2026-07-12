// ─── shared/events.js — Registro de actividad en Supabase ────────────────────
// Escribe un evento en la tabla event_logs. No lanza excepciones (best-effort).
// Requiere: supabase-client.js y auth.js cargados antes.
async function logEvento(eventType, metadata = {}) {
  try {
    const session = await getSession();
    if (!session) return;
    await _supabase.from('event_logs').insert({
      user_id:    session.user.id,
      event_type: eventType,
      metadata
    });
  } catch (_) {}
}
window.logEvento = logEvento;
