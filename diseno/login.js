const BACKEND_URL = "https://smartbuilderec.onrender.com";

function _panelPorRol(rol) {
  return "panel";
}

function _destino() {
  const r = new URLSearchParams(location.search).get('redirect');
  // Solo permite redirección relativa (evita open redirect)
  return (r && !r.startsWith('http') && !r.startsWith('//')) ? r : 'panel';
}

// Redirigir si ya hay sesión activa
(async () => {
  const session = await getSession();
  if (session) {
    const perfil = await getUserProfile();
    window.location.href = _destino();
  }
})();

const msg = document.getElementById("msg");

function setMsg(text, type) {
  msg.textContent = text;
  msg.className = "login-msg " + type;
}

// ── Tabs ──────────────────────────────────────────────────────────────────
document.getElementById("tabBtnPassword").addEventListener("click", () => {
  document.getElementById("tabBtnPassword").classList.add("active");
  document.getElementById("tabBtnMagic").classList.remove("active");
  document.getElementById("formPassword").style.display = "";
  document.getElementById("formMagic").style.display = "none";
  setMsg("", "");
});

document.getElementById("tabBtnMagic").addEventListener("click", () => {
  document.getElementById("tabBtnMagic").classList.add("active");
  document.getElementById("tabBtnPassword").classList.remove("active");
  document.getElementById("formMagic").style.display = "";
  document.getElementById("formPassword").style.display = "none";
  setMsg("", "");
});

// ── Login email + contraseña ──────────────────────────────────────────────
document.getElementById("password").addEventListener("keydown", e => {
  if (e.key === "Enter") document.getElementById("btnLogin").click();
});

document.getElementById("btnLogin").addEventListener("click", async () => {
  const email    = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;
  const btn      = document.getElementById("btnLogin");

  if (!email || !password) { setMsg("Ingresa tu correo y contraseña.", "error"); return; }

  btn.disabled = true;
  btn.textContent = "Ingresando...";
  setMsg("", "");

  try {
    await login(email, password);
    setMsg("Sesión iniciada. Redirigiendo...", "ok");
    const perfil = await getUserProfile();
    window.location.href = _destino();
  } catch (err) {
    const t = err.message || "";
    if (t.includes("Invalid login") || t.includes("invalid_credentials")) {
      setMsg("Correo o contraseña incorrectos.", "error");
    } else if (t.includes("Email not confirmed")) {
      setMsg("Confirma tu correo antes de iniciar sesión.", "error");
    } else {
      setMsg("Error al iniciar sesión. Intenta de nuevo.", "error");
    }
    btn.disabled = false;
    btn.textContent = "Entrar";
  }
});

// ── Magic Link ───────────────────────────────────────────────��────────────
document.getElementById("btnMagic").addEventListener("click", async () => {
  const email = document.getElementById("magicEmail").value.trim();
  const btn   = document.getElementById("btnMagic");

  if (!email) { setMsg("Ingresa tu correo electrónico.", "error"); return; }

  btn.disabled = true;
  btn.textContent = "Enviando...";
  setMsg("", "");

  try {
    await loginWithMagicLink(email);
    setMsg("¡Enlace enviado! Revisa tu correo (y la carpeta de spam).", "ok");
    btn.textContent = "Enlace enviado ✓";
  } catch (err) {
    setMsg("Error al enviar el enlace. Intenta de nuevo.", "error");
    btn.disabled = false;
    btn.textContent = "Enviar enlace mágico";
  }
});

// ── Google OAuth ──────────────────────────────────────────────────────────
document.getElementById("btnGoogle").addEventListener("click", async () => {
  try {
    await loginWithGoogle();
  } catch (err) {
    setMsg("Error al conectar con Google. Intenta de nuevo.", "error");
  }
});

// ── Olvidé mi contraseña ──────────────────────────────────────────────────
document.getElementById("btnForgot").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("formPassword").style.display = "none";
  document.getElementById("formForgot").style.display = "";
  const emailVal = document.getElementById("email").value.trim();
  if (emailVal) document.getElementById("forgotEmail").value = emailVal;
  setMsg("", "");
});

document.getElementById("btnBackLogin").addEventListener("click", (e) => {
  e.preventDefault();
  document.getElementById("formForgot").style.display = "none";
  document.getElementById("formPassword").style.display = "";
  setMsg("", "");
});

document.getElementById("btnSendReset").addEventListener("click", async () => {
  const email = document.getElementById("forgotEmail").value.trim();
  const btn   = document.getElementById("btnSendReset");

  if (!email) { setMsg("Ingresa tu correo electrónico.", "error"); return; }

  btn.disabled = true;
  btn.textContent = "Enviando...";
  setMsg("", "");

  try {
    const res = await fetch(`${BACKEND_URL}/auth/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    if (!res.ok) throw new Error("Error del servidor");
    setMsg("¡Enlace enviado! Revisa tu correo (y la carpeta de spam).", "ok");
    btn.textContent = "Enviado ✓";
  } catch (err) {
    setMsg("Error al enviar el enlace. Verifica el correo e intenta de nuevo.", "error");
    btn.disabled = false;
    btn.textContent = "Enviar enlace de recuperación";
  }
});
