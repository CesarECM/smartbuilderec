// // ─── auth.js — Supabase Auth helpers ─────────────────────────────────────────
// // IMPORTANTE: Reemplazar con las credenciales de tu proyecto Supabase.
// // Encuéntralas en: Dashboard → Settings → API
// // Estas claves son públicas por diseño (anon key).
// const SUPABASE_URL = "https://TU_REF.supabase.co";   // ← reemplazar
// const SUPABASE_ANON_KEY = "TU_ANON_KEY";              // ← reemplazar

// const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
//   auth: { persistSession: true, storageKey: "ceecm_auth" }
// });

// async function login(email, password) {
//   const { data, error } = await supabase.auth.signInWithPassword({ email, password });
//   if (error) throw error;
//   return data;
// }

// async function registro(email, password, nombre, apellido, rol = "estudiante") {
//   const { data, error } = await supabase.auth.signUp({
//     email,
//     password,
//     options: { data: { nombre, apellido, rol } }
//   });
//   if (error) throw error;
//   return data;
// }

// async function logout() {
//   await supabase.auth.signOut();
//   Object.keys(localStorage)
//     .filter(k => k.startsWith("ec0217_"))
//     .forEach(k => localStorage.removeItem(k));
//   window.location.href = "login.html";
// }

// async function getSession() {
//   const { data: { session } } = await supabase.auth.getSession();
//   return session;
// }

// async function getUser() {
//   const { data: { user } } = await supabase.auth.getUser();
//   return user;
// }

// async function getUserRol() {
//   const session = await getSession();
//   if (!session) return null;
//   const meta = session.user?.user_metadata || {};
//   return meta.rol || "estudiante";
// }

// async function getAuthHeaders() {
//   const session = await getSession();
//   if (!session) return { "Content-Type": "application/json" };
//   return {
//     "Content-Type": "application/json",
//     "Authorization": `Bearer ${session.access_token}`
//   };
// }

// async function authGuard(rolesPermitidos = []) {
//   const session = await getSession();
//   if (!session) {
//     window.location.href = "login.html";
//     return null;
//   }
//   if (rolesPermitidos.length > 0) {
//     const rol = session.user?.user_metadata?.rol || "estudiante";
//     if (!rolesPermitidos.includes(rol)) {
//       window.location.href = "login.html";
//       return null;
//     }
//   }
//   return session;
// }

// // Exponer en window para que shared.js y otros scripts puedan delegarle
// window.authGuard = authGuard;
