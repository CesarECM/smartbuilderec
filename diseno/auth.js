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

// Perfil completo desde la tabla profiles (con rol, credits, admin_id, vigencia_hasta)
async function getUserProfile() {
  const { data: { user } } = await _supabase.auth.getUser();
  if (!user) return null;
  const { data } = await _supabase
    .from("profiles")
    .select("id, nombre, apellido, email, rol, credits, admin_id, activo, vigencia_hasta, telefono, curp")
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
    options: { redirectTo: `${window.location.origin}/panel` }
  });
  if (error) throw error;
  return data;
}

async function loginWithMagicLink(email) {
  const { error } = await _supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${window.location.origin}/panel` }
  });
  if (error) throw error;
}

// ── Registro ──────────────────────────────────────────────────────────────────

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
      emailRedirectTo: `${window.location.origin}/panel`,
      data: { nombre, apellido, rol: "user", admin_id: verificacion.admin_id }
    }
  });
  if (error) throw error;

  // 3. Marcar código como usado.
  // setSession sincroniza el cliente con la sesión recién creada antes de llamar el RPC.
  // use_access_code tiene GRANT a anon y authenticated, por lo que funciona en ambos casos.
  if (data?.user?.id) {
    if (data.session) {
      await _supabase.auth.setSession(data.session).catch(() => {});
    }
    const { error: errUso } = await _supabase
      .rpc("use_access_code", { p_code: codigoFmt, p_user_id: data.user.id });
    if (errUso) console.warn("[auth] use_access_code falló:", errUso.message);
  }

  return data;
}

// ── Logout ────────────────────────────────────────────────────────────────────

async function logout() {
  if (window.storageSync?.flushSync) {
    try { await window.storageSync.flushSync(); } catch (_) {}
  }
  await _supabase.auth.signOut();
  Object.keys(localStorage)
    .filter(k => k.startsWith("ec0217_") || k.startsWith("sbe_"))
    .forEach(k => localStorage.removeItem(k));
  window.location.href = "login";
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

// Guard de autenticación, rol y vigencia.
// rolesPermitidos vacío = solo verifica sesión activa.
async function authGuard(rolesPermitidos = []) {
  const session = await getSession();
  if (!session) {
    window.location.href = "login";
    return null;
  }

  const profile = await getUserProfile();
  if (!profile) {
    window.location.href = "login";
    return null;
  }

  // Cuenta desactivada
  if (profile.activo === false) {
    await _supabase.auth.signOut();
    window.location.href = "login?razon=inactivo";
    return null;
  }

  // Vigencia expirada (admins y usuarios — super_admin nunca expira)
  if (profile.rol !== "super_admin" && profile.vigencia_hasta) {
    const vence = new Date(profile.vigencia_hasta);
    if (vence < new Date()) {
      await _supabase.auth.signOut();
      window.location.href = "login?razon=vigencia_expirada";
      return null;
    }
  }

  if (rolesPermitidos.length > 0) {
    const rol = profile?.rol || "user";
    if (!rolesPermitidos.includes(rol)) {
      window.location.href = "panel";
      return null;
    }
  }
  return session;
}

// Devuelve los días restantes de vigencia (null si no aplica)
function diasRestantesVigencia(profile) {
  if (!profile?.vigencia_hasta) return null;
  const delta = new Date(profile.vigencia_hasta) - new Date();
  return Math.ceil(delta / (1000 * 60 * 60 * 24));
}

// ── Exportar al scope global ──────────────────────────────────────────────────
window.getSession               = getSession;
window.getUser                  = getUser;
window.getUserProfile           = getUserProfile;
window.login                    = login;
window.loginWithGoogle          = loginWithGoogle;
window.loginWithMagicLink       = loginWithMagicLink;
window.registroConCodigo        = registroConCodigo;
window.logout                   = logout;
window.getAuthHeaders           = getAuthHeaders;
window.authGuard                = authGuard;
window.diasRestantesVigencia    = diasRestantesVigencia;
