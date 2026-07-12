const msg = document.getElementById("msg");

function setMsg(text, type) {
  msg.textContent = text;
  msg.className = "login-msg " + type;
}

function mostrarFormulario() {
  document.getElementById("estadoCargando").style.display = "none";
  document.getElementById("formReset").style.display = "";
}

function mostrarError() {
  document.getElementById("estadoCargando").style.display = "none";
  document.getElementById("estadoError").style.display = "";
}

_supabase.auth.onAuthStateChange(async (event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    try {
      const { data: { user } } = await _supabase.auth.getUser();
      if (user) {
        const { data: perfil } = await _supabase
          .from("profiles").select("nombre").eq("id", user.id).single();
        if (perfil?.nombre) document.getElementById("nombre").value = perfil.nombre;
      }
    } catch (_) {}
    mostrarFormulario();
  } else if (event === "SIGNED_IN" && session) {
    window.location.href = "dashboard";
  }
});

// Timeout: si en 4 segundos no llega el evento, el enlace es inválido
setTimeout(() => {
  if (document.getElementById("estadoCargando").style.display !== "none") {
    mostrarError();
  }
}, 4000);

// ── Validación en tiempo real ─────────────────────────────────────────────
const REGLAS = [
  { id: "req-len",     test: p => p.length >= 8 },
  { id: "req-upper",   test: p => /[A-Z]/.test(p) },
  { id: "req-num",     test: p => /[0-9]/.test(p) },
  { id: "req-special", test: p => /[^A-Za-z0-9]/.test(p) },
];

const COLORES   = ["", "#e74c3c", "#e67e22", "#f1c40f", "#27ae60"];
const ETIQUETAS = ["", "Muy débil", "Débil", "Aceptable", "Segura"];

function evaluarFortaleza(password) {
  return REGLAS.filter(r => r.test(password)).length;
}

function actualizarUI() {
  const pw  = document.getElementById("password").value;
  const pw2 = document.getElementById("password2").value;
  const puntaje = evaluarFortaleza(pw);

  REGLAS.forEach(r => {
    document.getElementById(r.id).classList.toggle("ok", r.test(pw));
  });

  const bar   = document.getElementById("strengthBar");
  const label = document.getElementById("strengthLabel");
  bar.style.width      = pw ? (puntaje * 25) + "%" : "0%";
  bar.style.background = pw ? COLORES[puntaje] : "";
  label.textContent    = pw ? ETIQUETAS[puntaje] : "";
  label.style.color    = pw ? COLORES[puntaje] : "";

  const hint = document.getElementById("matchHint");
  if (!pw2) {
    hint.textContent = "";
    hint.className = "match-hint";
  } else if (pw === pw2) {
    hint.textContent = "✓ Las contraseñas coinciden";
    hint.className = "match-hint ok";
  } else {
    hint.textContent = "✗ Las contraseñas no coinciden";
    hint.className = "match-hint error";
  }

  const todo = puntaje === 4 && pw === pw2 && pw2.length > 0;
  document.getElementById("btnReset").disabled = !todo;
}

document.getElementById("password").addEventListener("input", actualizarUI);
document.getElementById("password2").addEventListener("input", actualizarUI);

// ── Guardar perfil + contraseña ───────────────────────────────────────────
document.getElementById("btnReset").addEventListener("click", async () => {
  const apellido = document.getElementById("apellido").value.trim();
  const nombre   = document.getElementById("nombre").value.trim();
  const lada     = document.getElementById("lada").value;
  const telLocal = document.getElementById("telefono").value.trim();
  const telefono = telLocal ? `${lada} ${telLocal}` : "";
  const password = document.getElementById("password").value;
  const btn      = document.getElementById("btnReset");

  if (!apellido || !nombre) { setMsg("Ingresa tu apellido y nombre.", "error"); return; }
  if (!telefono)            { setMsg("Ingresa tu número de teléfono.", "error"); return; }

  btn.disabled = true;
  btn.textContent = "Guardando...";
  setMsg("", "");

  try {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) throw new Error("Sin sesión activa.");

    const { error: errPerfil } = await _supabase
      .from("profiles")
      .update({ nombre, apellido, telefono })
      .eq("id", user.id);
    if (errPerfil) throw new Error(errPerfil.message);

    const { error: errPwd } = await _supabase.auth.updateUser({ password });
    if (errPwd) throw new Error(errPwd.message);

    setMsg("¡Cuenta activada! Redirigiendo...", "ok");
    btn.textContent = "Listo ✓";
    setTimeout(() => { window.location.href = "dashboard"; }, 1500);
  } catch (e) {
    setMsg("Error: " + e.message, "error");
    btn.disabled = false;
    btn.textContent = "Activar mi cuenta →";
  }
});
