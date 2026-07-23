// ─── wizard/video-panel.js — Panel lateral de videos guía EC0217.01 ──────────

import { BUNNY_LIBRARY_ID, VIDEOS, VIDEO_LIST } from "./video-config.js";

const WATCHED_KEY = "sbe_videos_watched";

function getWatched() {
  try { return new Set(JSON.parse(localStorage.getItem(WATCHED_KEY) || "[]")); }
  catch (_) { return new Set(); }
}

function embedUrl(guid) {
  return `https://iframe.mediadelivery.net/embed/${BUNNY_LIBRARY_ID}/${guid}` +
    `?autoplay=true&preload=true&responsive=true`;
}

function markWatched(guid) {
  const set = getWatched();
  set.add(guid);
  localStorage.setItem(WATCHED_KEY, JSON.stringify([...set]));
  const dot = document.querySelector(`.vp-acc-item[data-guid="${guid}"] .vp-dot`);
  if (dot) { dot.classList.add("vp-dot--done"); dot.title = "Visto"; }
  updateBadge();
}

function updateBadge() {
  const watched = getWatched();
  const done = VIDEO_LIST.filter(k => watched.has(VIDEOS[k]?.guid)).length;
  const badge = document.getElementById("vp-badge");
  if (!badge) return;
  if (done === 0) { badge.style.display = "none"; return; }
  badge.style.display = "block";
  badge.textContent = done === VIDEO_LIST.length ? "✓" : done;
}

function closeAll() {
  document.querySelectorAll(".vp-acc-item.vp-open").forEach(item => {
    item.classList.remove("vp-open");
    const iframe = item.querySelector("iframe");
    if (iframe) iframe.src = "";
  });
}

function toggleItem(item) {
  const isOpen = item.classList.contains("vp-open");
  closeAll();
  if (isOpen) return;
  item.classList.add("vp-open");
  const guid = item.dataset.guid;
  const iframe = item.querySelector("iframe");
  if (iframe && guid) {
    iframe.src = embedUrl(guid);
    markWatched(guid);
  }
  setTimeout(() => item.scrollIntoView({ behavior: "smooth", block: "nearest" }), 50);
}

function buildAccordion() {
  const watched = getWatched();
  return VIDEO_LIST.map(key => {
    const v = VIDEOS[key];
    if (!v) return "";
    const done = watched.has(v.guid);
    return `
    <div class="vp-acc-item" data-guid="${v.guid}">
      <button class="vp-acc-trigger" type="button">
        <span class="vp-dot${done ? " vp-dot--done" : ""}" title="${done ? "Visto" : ""}">●</span>
        <span class="vp-acc-info">
          <span class="vp-acc-title">${v.title}</span>
          <span class="vp-acc-dur">${v.duration}</span>
        </span>
        <span class="vp-acc-arrow">▾</span>
      </button>
      <div class="vp-acc-body">
        <p class="vp-acc-desc">${v.description}</p>
        <div class="vp-acc-player">
          <iframe allowfullscreen
            allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen">
          </iframe>
        </div>
      </div>
    </div>`;
  }).join("");
}

function getHTML() {
  return `
  <button id="vp-tab" title="Ver videos guía EC0217.01">
    <span id="vp-badge"></span>
    <span class="vp-tab-icon">▶</span>
    <span class="vp-tab-label">Guía<br>EC0217</span>
  </button>
  <div id="vp-overlay"></div>
  <aside id="vp-drawer">
    <div id="vp-header">
      <span id="vp-header-title">📹 Guía EC0217.01 <small>(12 videos)</small></span>
      <button id="vp-close" title="Cerrar">✕</button>
    </div>
    <div id="vp-accordion">${buildAccordion()}</div>
  </aside>`;
}

function openDrawer() {
  document.getElementById("vp-drawer")?.classList.add("vp-open");
  document.getElementById("vp-overlay")?.classList.add("vp-overlay--on");
}

function closeDrawer() {
  closeAll();
  document.getElementById("vp-drawer")?.classList.remove("vp-open");
  document.getElementById("vp-overlay")?.classList.remove("vp-overlay--on");
}

export function initVideoPanel() {
  document.body.insertAdjacentHTML("beforeend", getHTML());
  document.getElementById("vp-tab")?.addEventListener("click", openDrawer);
  document.getElementById("vp-close")?.addEventListener("click", closeDrawer);
  document.getElementById("vp-overlay")?.addEventListener("click", closeDrawer);
  document.getElementById("vp-accordion")?.addEventListener("click", e => {
    const trigger = e.target.closest(".vp-acc-trigger");
    if (trigger) toggleItem(trigger.closest(".vp-acc-item"));
  });
  updateBadge();
}
