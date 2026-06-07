// ─── perfil.js — Sección "Mi Perfil" compartida entre todos los paneles ──────
// Requiere: supabase-client.js (_supabase) y _perfil global en cada página.

const CURP_REGEX = /^[A-Z]{4}[0-9]{2}(0[1-9]|1[0-2])(0[1-9]|[12][0-9]|3[01])[HM](AS|BC|BS|CC|CL|CM|CS|CH|DF|DG|GT|GR|HG|JC|MC|MN|MS|NT|NL|OC|PL|QT|QR|SP|SL|SR|TC|TS|TL|VZ|YN|ZS|NE)[B-DF-HJ-NP-TV-Z]{3}[0-9A-Z][0-9]$/;

function _esc(str) {
  return (str || "").replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function _camposFaltantesPerfil(p) {
  const c = [];
  if (!p.nombre)   c.push("nombre");
  if (!p.apellido) c.push("apellido");
  if (!p.telefono) c.push("teléfono");
  if (!p.curp)     c.push("CURP");
  return c;
}

// Inyecta la tarjeta de aviso al inicio de `contenedor`.
// onclickFn: función que navega/hace scroll a la sección de perfil.
function renderCardPI(contenedor, p, onclickFn) {
  const faltantes = _camposFaltantesPerfil(p);
  if (!faltantes.length) return;
  const div = document.createElement("div");
  div.className = "card-pi";
  div.id = "cardPI";
  div.innerHTML = `
    <div class="card-pi-icon">⚠️</div>
    <div class="card-pi-body">
      <div class="card-pi-title">Completa tu perfil</div>
      <div class="card-pi-desc">Faltan datos: <strong>${faltantes.join(", ")}</strong></div>
    </div>
    <button class="card-pi-btn" id="btnCompletarPerfil">Completar ahora →</button>`;
  contenedor.prepend(div);
  document.getElementById("btnCompletarPerfil").onclick = onclickFn;
}

// Genera el HTML del formulario de perfil pre-rellenado con los datos del perfil.
function _htmlPerfilForm(p) {
  return `
    <div class="perfil-grid">
      <div class="perfil-field">
        <label for="pfNombre">Nombre</label>
        <input type="text" id="pfNombre" value="${_esc(p.nombre)}" placeholder="Tu nombre">
      </div>
      <div class="perfil-field">
        <label for="pfApellido">Apellido</label>
        <input type="text" id="pfApellido" value="${_esc(p.apellido)}" placeholder="Tu apellido">
      </div>
      <div class="perfil-field">
        <label>Correo electrónico</label>
        <div class="email-wrap">
          <input type="email" id="pfEmail" value="${_esc(p.email)}" disabled>
          <span class="lock-icon">🔒</span>
        </div>
      </div>
      <div class="perfil-field">
        <label for="pfTelefono">Teléfono</label>
        <input type="tel" id="pfTelefono" value="${_esc(p.telefono)}" placeholder="10 dígitos" maxlength="10" oninput="this.value=this.value.replace(/\\D/g,'')">
      </div>
      <div class="perfil-field full">
        <label for="pfCurp">CURP</label>
        <input type="text" id="pfCurp" value="${_esc(p.curp)}" placeholder="Ej. GOMC800101HDFLRR06" maxlength="18" oninput="this.value=this.value.toUpperCase()" onblur="validarCurpInput()">
        <div class="perfil-hint" id="pfCurpHint"></div>
      </div>
    </div>
    <div class="perfil-actions">
      <button class="btn-guardar-perfil" onclick="guardarPerfilDatos()">Guardar cambios</button>
      <span class="perfil-msg" id="pfMsg"></span>
    </div>`;
}

// Valida el formato de CURP en tiempo real (onblur del input).
function validarCurpInput() {
  const input = document.getElementById("pfCurp");
  const hint  = document.getElementById("pfCurpHint");
  if (!input || !hint) return;
  const val = input.value.trim();
  if (!val) {
    input.classList.remove("valid", "invalid");
    hint.textContent = "";
    hint.className   = "perfil-hint";
    return;
  }
  const ok = CURP_REGEX.test(val);
  input.classList.toggle("valid",   ok);
  input.classList.toggle("invalid", !ok);
  hint.textContent = ok
    ? "✓ Formato válido"
    : "✗ Formato inválido — debe tener 18 caracteres según el patrón oficial RENAPO";
  hint.className = "perfil-hint " + (ok ? "ok" : "err");
}

// Valida y guarda los datos del perfil en Supabase.
async function guardarPerfilDatos() {
  const nombre   = (document.getElementById("pfNombre")?.value   || "").trim();
  const apellido = (document.getElementById("pfApellido")?.value || "").trim();
  const telefono = (document.getElementById("pfTelefono")?.value || "").trim();
  const curp     = (document.getElementById("pfCurp")?.value     || "").trim().toUpperCase();
  const msg      = document.getElementById("pfMsg");
  if (!msg) return;

  if (!nombre || !apellido) {
    msg.textContent = "Nombre y apellido son obligatorios.";
    msg.className   = "perfil-msg err";
    return;
  }
  if (telefono && telefono.length !== 10) {
    msg.textContent = "El teléfono debe tener 10 dígitos.";
    msg.className   = "perfil-msg err";
    return;
  }
  if (curp && !CURP_REGEX.test(curp)) {
    msg.textContent = "El CURP no tiene un formato válido.";
    msg.className   = "perfil-msg err";
    return;
  }

  msg.textContent = "Guardando...";
  msg.className   = "perfil-msg";

  const { data: { user } } = await _supabase.auth.getUser();
  const { error } = await _supabase.from("profiles").update({
    nombre,
    apellido,
    telefono: telefono || null,
    curp:     curp     || null,
  }).eq("id", user.id);

  if (error) {
    msg.textContent = "Error al guardar. Intenta de nuevo.";
    msg.className   = "perfil-msg err";
    return;
  }

  // Actualizar _perfil global
  if (typeof _perfil !== "undefined" && _perfil) {
    _perfil.nombre   = nombre;
    _perfil.apellido = apellido;
    _perfil.telefono = telefono || null;
    _perfil.curp     = curp     || null;
  }

  // Actualizar o eliminar la tarjeta de aviso
  const cardEl = document.getElementById("cardPI");
  if (cardEl && typeof _perfil !== "undefined") {
    const faltantes = _camposFaltantesPerfil(_perfil);
    if (!faltantes.length) {
      cardEl.style.transition = "opacity 0.4s";
      cardEl.style.opacity    = "0";
      setTimeout(() => cardEl.remove(), 400);
    } else {
      cardEl.querySelector(".card-pi-desc").innerHTML =
        `Faltan datos: <strong>${faltantes.join(", ")}</strong>`;
    }
  }

  // Actualizar header con nuevo nombre
  const headerNombre = document.getElementById("headerNombre");
  if (headerNombre) headerNombre.textContent = [nombre, apellido].filter(Boolean).join(" ");
  const headerAvatar = document.getElementById("headerAvatar");
  if (headerAvatar) headerAvatar.textContent = ((nombre[0] || "") + (apellido[0] || "")).toUpperCase();

  msg.textContent = "✓ Cambios guardados";
  msg.className   = "perfil-msg ok";
  setTimeout(() => { if (msg) { msg.textContent = ""; msg.className = "perfil-msg"; } }, 3000);
}
