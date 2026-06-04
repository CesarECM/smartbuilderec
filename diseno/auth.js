// ─── auth.js — Autenticación SmartBuilderEC ──────────────────────────────────
// Requiere: supabase-client.js cargado ANTES en el HTML.
// Roles válidos: 'super_admin' | 'admin' | 'user'

// ── Sesión y usuario ──────────────────────────────────────────────────────────

async function getSession() {
  const { data: { session } } = await _supabase.auth.getSession();
  return session;
}

async function getUser() {
  const { data: { user } } = await _supabase.auth.getUser();
  return user;
}

// Perfil completo desde la tabla profiles (con rol, credits, admin_id)
async function getUserProfile() {
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) return null;
  const { data } = await _supabase
    .from("profiles")
    .select("id, nombre, apellido, email, rol, credits, admin_id, activo")
    .eq("id", user.id)
    .single();
  return data;
}

// ── Login ─────────────────────────────────────────────────────────────────────

async function login(email, password) {
  const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

async function loginWithGoogle() {
  const { data, error } = await _supabase.auth.signInWithOAuth({
    provider: "google",
    options: { redirectTo: `${window.location.origin}/dashboard.html` }
  });
  if (error) throw error;
  return data;
}

async function loginWithMagicLink(email) {
  const { error } = await _supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/dashboard.html` }
  });
  if (error) throw error;
}

// ── Registro ──────────────────────────────────────────────────────────────────

// Registro estándar — rol 'user'. El acceso por Stripe se activa en Bloque 8.
async function registro(email, password, nombre, apellido) {
  const { data, error } = await _supabase.auth.signUp({
    email,
    password,
    options: { data: { nombre, apellido, rol: "user" } }
  });
  if (error) throw error;
  return data;
}

// Registro con código de acceso generado por un admin.
// Flujo: verificar código → crear cuenta con admin_id → marcar código como usado.
async function registroConCodigo(email, password, nombre, apellido, codigo) {
  const codigoFmt = codigo.trim().toUpperCase();

  // 1. Verificar código (función SECURITY DEFINER, accesible sin autenticación)
  const { data: verificacion, error: errVerif } = await _supabase
    .rpc("verify_access_code", { p_code: codigoFmt });

  if (errVerif) throw new Error("Error al verificar el código de acceso.");
  if (!verificacion?.valid) throw new Error(verificacion?.error || "Código inválido o expirado.");

  // 2. Crear cuenta. El trigger de Supabase asignará admin_id y descontará el crédito.
  const { data, error } = await _supabase.auth.signUp({
    email,
    password,
    options: {
      data: { nombre, apellido, rol: "user", admin_id: verificacion.admin_id }
    }
  });
  if (error) throw error;

  // 3. Marcar código como usado si la sesión ya está activa (auto-confirm habilitado).
  //    Si requiere confirmación de email, el backend lo marcará en Bloque 7.
  if (data?.session && data?.user?.id) {
    await _supabase
      .rpc("use_access_code", { p_code: codigoFmt, p_user_id: data.user.id })
      .catch(() => {});
  }

  return data;
}

// ── Logout ────────────────────────────────────────────────────────────────────

async function logout() {
  await _supabase.auth.signOut();
  Object.keys(localStorage)
    .filter(k => k.startsWith("ec0217_") || k.startsWith("sbe_"))
    .forEach(k => localStorage.removeItem(k));
  window.location.href = "login.html";
}

// ── Utilidades ────────────────────────────────────────────────────────────────

// Headers con JWT para llamadas al backend FastAPI
async function getAuthHeaders() {
  const session = await getSession();
  const headers = { "Content-Type": "application/json" };
  if (session?.access_token) {
    headers["Authorization"] = `Bearer ${session.access_token}`;
  }
  return headers;
}

// Guard de autenticación y rol.
// rolesPermitidos vacío = solo verifica que haya sesión activa.
// Ejemplo: await authGuard(['admin', 'super_admin'])
async function authGuard(rolesPermitidos = []) {
  const session = await getSession();
  if (!session) {
    window.location.href = "login.html";
    return null;
  }
  if (rolesPermitidos.length > 0) {
    const profile = await getUserProfile();
    const rol = profile?.rol || "user";
    if (!rolesPermitidos.includes(rol)) {
      window.location.href = "dashboard.html";
      return null;
    }
  }
  return session;
}

// ── Exportar al scope global ──────────────────────────────────────────────────
window.getSession         = getSession;
window.getUser            = getUser;
window.getUserProfile     = getUserProfile;
window.login              = login;
window.loginWithGoogle    = loginWithGoogle;
window.loginWithMagicLink = loginWithMagicLink;
window.registro           = registro;
window.registroConCodigo  = registroConCodigo;
window.logout             = logout;
window.getAuthHeaders     = getAuthHeaders;
window.authGuard          = authGuard;
