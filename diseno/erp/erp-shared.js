const BACKEND_URL = "https://smartbuilderec.onrender.com";

let _perfil      = null;
let _esSuper     = false;
let _alumnos     = [];
let _normas      = [];
let _asesores    = [];
let _evaluadores = [];
let _alumnoActual = null;

// ── Toast ─────────────────────────────────────────────────────────────────
function toast(msg, ms = 3000) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("visible");
  setTimeout(() => t.classList.remove("visible"), ms);
}

// ── Tabs ──────────────────────────────────────────────────────────────────
function switchTab(id, btn) {
  document.querySelectorAll(".tab-panel").forEach(p => p.classList.remove("active"));
  document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
  document.getElementById("panel-" + id).classList.add("active");
  btn.classList.add("active");

  if (id === "roles")  cargarRoles();
  if (id === "normas") cargarNormasTabla();
}

// ── Modal helpers ─────────────────────────────────────────────────────────
function abrirModal(id) {
  document.getElementById(id).classList.add("open");
}
function cerrarModal(id) {
  document.getElementById(id).classList.remove("open");
}
document.querySelectorAll(".modal-overlay").forEach(m => {
  m.addEventListener("click", e => { if (e.target === m) m.classList.remove("open"); });
});

// ── Utilidades ────────────────────────────────────────────────────────────
function fmtFechaCorta(iso) {
  if (!iso) return "—";
  return new Date(iso.includes("T") ? iso : iso + "T12:00:00")
    .toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function iniciales(n, a) {
  return ((n?.[0] || "") + (a?.[0] || "")).toUpperCase() || "?";
}

async function apiFetch(path, opts = {}) {
  const headers = await getAuthHeaders();
  const res = await fetch(BACKEND_URL + path, { ...opts, headers: { ...headers, ...(opts.headers || {}) } });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.detail || `Error ${res.status}`);
  }
  return res.json();
}
