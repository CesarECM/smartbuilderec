// ─── wizard/video-panel.js — Panel lateral de videos guía EC0217.01 ──────────

import { BUNNY_LIBRARY_ID, VIDEOS, VIDEO_MAP } from "./video-config.js";

const WATCHED_KEY = "sbe_videos_watched";

function getWatched() {
  try { return new Set(JSON.parse(localStorage.getItem(WATCHED_KEY) || "[]")); }
  catch (_) { return new Set(); }
}

function markWatched(guid) {
  const set = getWatched();
  set.add(guid);
  localStorage.setItem(WATCHED_KEY, JSON.stringify([...set]));
  const check = document.querySelector(`[data-guid="${guid}"] .vp-check`);
  if (check) { check.textContent = "✓"; check.classList.add("vp-check--done"); }
}

function embedUrl(guid) {
  return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${guid}` +
    `?autoplay=false&preload=true&responsive=true`;
}

function loadVideo(guid, title) {
  const iframe = document.getElementById("vp-iframe");
  const titleEl = document.getElementById("vp-title");
  if (iframe) iframe.src = embedUrl(guid);
  if (titleEl) titleEl.textContent = title;
  markWatched(guid);
}

function renderList(keys) {
  const watched = getWatched();
  const el = document.getElementById("vp-list");
  if (!el) return;

  el.innerHTML = keys.map((key, i) => {
    const v = VIDEOS[key];
    if (!v) return "";
    const done = watched.has(v.guid);
    return `<button class="vp-item${i === 0 ? " vp-item--active" : ""}"
        data-guid="${v.guid}" data-title="${v.title}">
      <span class="vp-check${done ? " vp-check--done" : ""}">${done ? "✓" : "○"}</span>
      <span class="vp-meta">
        <span class="vp-name">${v.title}</span>
        <span class="vp-dur">${v.duration}</span>
      </span>
    </button>`;
  }).join("");

  el.querySelectorAll(".vp-item").forEach(btn => {
    btn.addEventListener("click", () => {
      el.querySelectorAll(".vp-item").forEach(b => b.classList.remove("vp-item--active"));
      btn.classList.add("vp-item--active");
      loadVideo(btn.dataset.guid, btn.dataset.title);
    });
  });
}

let _currentKeys = [];

function openDrawer() {
  if (!_currentKeys.length) return;
  renderList(_currentKeys);
  const first = VIDEOS[_currentKeys[0]];
  if (first) loadVideo(first.guid, first.title);
  document.getElementById("vp-drawer")?.classList.add("vp-open");
  document.getElementById("vp-overlay")?.classList.add("vp-overlay--on");
}

function closeDrawer() {
  document.getElementById("vp-drawer")?.classList.remove("vp-open");
  document.getElementById("vp-overlay")?.classList.remove("vp-overlay--on");
  const iframe = document.getElementById("vp-iframe");
  if (iframe) iframe.src = "";
}

export function showVideoForSection(seccionId) {
  const keys = VIDEO_MAP[seccionId];
  _currentKeys = keys?.length ? keys : [];
  const badge = document.getElementById("vp-badge");
  if (badge) badge.style.display = _currentKeys.length ? "block" : "none";
  if (document.getElementById("vp-drawer")?.classList.contains("vp-open") && _currentKeys.length) {
    renderList(_currentKeys);
    const first = VIDEOS[_currentKeys[0]];
    if (first) loadVideo(first.guid, first.title);
  }
}

function getHTML() {
  return `
  <button id="vp-tab" title="Ver guía EC0217.01">
    <span id="vp-badge">●</span>
    <span class="vp-tab-icon">▶</span>
    <span class="vp-tab-label">Guía<br>EC0217</span>
  </button>
  <div id="vp-overlay"></div>
  <aside id="vp-drawer">
    <div id="vp-header">
      <span id="vp-title">Guía EC0217.01</span>
      <button id="vp-close" title="Cerrar panel">✕</button>
    </div>
    <div id="vp-iframe-wrap">
      <iframe id="vp-iframe" allowfullscreen
        allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen">
      </iframe>
    </div>
    <div id="vp-list-header">Videos de este paso</div>
    <div id="vp-list"></div>
  </aside>`;
}

export function initVideoPanel() {
  document.body.insertAdjacentHTML("beforeend", getHTML());
  document.getElementById("vp-tab")?.addEventListener("click", openDrawer);
  document.getElementById("vp-close")?.addEventListener("click", closeDrawer);
  document.getElementById("vp-overlay")?.addEventListener("click", closeDrawer);
  window.showVideoForSection = showVideoForSection;
}
