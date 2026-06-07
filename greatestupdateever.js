/* ════════════════════════════════════════════════════
   greatestupdateever.js — merged patch bundle
   generated : 2026-06-07
   patches   : 12
   sources   : mobilepatch.js, mpfix.js, mpfix2.js, mpfix3.js, mpfix4.js, bu1.js, bu2.js, bu3.js, bu4.js, bu5.js, bu6.js, tut.js
   ════════════════════════════════════════════════════ */


/* ────────────────────── mobilepatch.js ────────────────────── */
/* ═══════════════════════════════════════════════════════════════════
   VALLEY FARM — MOBILE UI OVERHAUL + CONTENT PATCH  v3.0.0
   ───────────────────────────────────────────────────────────────────
   Load order: after script.js, winter.js, fall_town.js, any v1.x patches

   What this patch adds
   ────────────────────
   1. Mobile Dock       — Fixed 6-button bottom bar replaces scrolling
                          toolbar. Primary row: Hoe · Water · Seeds ·
                          Harvest · Sleep · More. Secondary drawer
                          (slide-up): Shovel · Deco · Bag · Map · Pause.
                          Long-press Harvest = scythe all (≥550 ms).

   2. Seed Quick-Pick   — Tapping Seeds on mobile opens a grid picker
                          overlay instead of the tiny dropdown. Tap again
                          to close; tapping the farm grid also closes it.

   3. Yield Preview     — While Scythe is active, a floating badge shows
                          how many crops are ready and their total sell
                          value (barn-adjusted, winter-auction-aware).

   4. Crop Inspector    — Double-tap any planted crop tile to see a stat
                          card: stage, days left, watered state, sell
                          price, harvest bonus %, and valid seasons.
                          Auto-dismisses after 5 s or on next farm tap.

   5. Daily Quests      — 3 randomised tasks refresh each morning.
                          Progress is tracked via action hooks (till,
                          water, plant, harvest, ship, auction). On
                          completion: gold + XP awarded, achievement
                          popup fires. Shown at bottom of the Bag tab.

   6. Rain Forecast     — A small desktop HUD pill ("28% rain tmrw")
                          derived from the current season's base rate.

   7. Energy Warning    — Energy bar blinks when ≤ 20 % remains.

   8. Retro theme       — All new elements carry retro overrides.
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const isMobile = () => window.innerWidth <= 680;

  /* ─────────────────────────────────────────────────────────────────
     SECTION 0 — INJECT CSS
  ───────────────────────────────────────────────────────────────── */
  const PATCH_CSS = `
/* ── Hide scrolling toolbar on mobile; show dock instead ── */
@media (max-width: 680px) {
  #toolbar { display: none !important; }
  #mobile-dock { display: flex !important; }
  #farm-wrap { padding-bottom: 76px; }
  /* Suppress less-critical HUD pills to save horizontal room */
  #hud-land-pill,
  #hud-forecast { display: none !important; }
  #hud { flex-wrap: nowrap; overflow: hidden; padding: 4px 8px; gap: 4px; }
}
@media (max-width: 400px) {
  #farm-wrap { padding-bottom: 70px; }
}

/* ═══ MOBILE DOCK ═══════════════════════════════════════════ */
#mobile-dock {
  display: none;
  position: fixed;
  bottom: 0; left: 0; right: 0;
  z-index: 180;
  flex-direction: column;
  background: var(--ui-bg);
  border-top: 1.5px solid var(--ui-border);
  box-shadow: 0 -4px 28px rgba(0,0,0,.13);
  /* Respect iOS home-bar safe area */
  padding-bottom: env(safe-area-inset-bottom, 0px);
}

/* ── Secondary drawer (slides up above primary row) ── */
.dock-secondary {
  display: flex;
  gap: 5px;
  padding: 0 10px;
  overflow: hidden;
  max-height: 0;
  opacity: 0;
  transition: max-height .3s cubic-bezier(.25,.8,.25,1),
              opacity .22s ease,
              padding .3s cubic-bezier(.25,.8,.25,1);
}
.dock-secondary.dock-sec-open {
  max-height: 58px;
  opacity: 1;
  padding: 6px 10px 8px;
  border-top: 1px solid var(--ui-border);
}
.dock-sec-btn {
  flex: 1;
  padding: 7px 2px;
  background: var(--ui-bg2);
  border: 1.5px solid var(--ui-border);
  border-radius: 10px;
  font-size: 10px;
  font-weight: 800;
  color: var(--text-primary);
  cursor: pointer;
  font-family: 'Nunito', sans-serif;
  transition: all .14s;
  white-space: nowrap;
  text-align: center;
  -webkit-tap-highlight-color: transparent;
}
.dock-sec-btn:active { transform: scale(.93); background: var(--ui-bg); }
.dock-sec-btn.dock-sec-active {
  border-color: var(--green);
  color: var(--green);
  background: #f0fdf4;
}
body.dark .dock-sec-btn.dock-sec-active { background: #0a2016; }

/* ── Primary tool row ── */
.dock-primary {
  display: flex;
  align-items: stretch;
  height: 62px;
  padding: 0 2px;
  gap: 1px;
}

.dock-btn {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 3px;
  background: transparent;
  border: none;
  cursor: pointer;
  border-radius: 10px;
  margin: 4px 1px;
  position: relative;
  overflow: hidden;
  transition: background .12s, transform .1s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.dock-btn:active { transform: scale(.9); background: var(--ui-bg2); }

.dock-icon {
  font-size: 22px;
  line-height: 1;
  transition: transform .14s;
  pointer-events: none;
}
.dock-label {
  font-size: 9px;
  font-weight: 800;
  color: var(--text-muted);
  font-family: 'Nunito', sans-serif;
  letter-spacing: .2px;
  pointer-events: none;
}

/* Active tool indicator */
.dock-btn.active .dock-icon { transform: scale(1.18); }
.dock-btn.active .dock-label { color: var(--green); }
.dock-btn.active::after {
  content: '';
  position: absolute;
  bottom: 4px; left: 50%;
  transform: translateX(-50%);
  width: 22px; height: 3px;
  background: var(--green);
  border-radius: 2px;
}

/* Sleep button accent */
.dock-btn-sleep .dock-label { color: #6366f1; }

/* More/ellipsis button */
.dock-btn-more { border-left: 1px solid var(--ui-border); }
.dock-btn-more .dock-icon { font-size: 20px; font-family: 'Nunito', sans-serif; font-weight: 900; color: var(--text-muted); }
.dock-btn-more.active .dock-icon { color: var(--text-primary); transform: rotate(90deg); }
.dock-btn-more.active::after { display: none; }

/* Harvest-all pulse on Scythe when crops ready */
.dock-btn.dock-harvest-ready .dock-icon {
  animation: dockHarvestGlow 1.5s ease-in-out infinite;
}
@keyframes dockHarvestGlow {
  0%,100% { filter: none; }
  50%      { filter: drop-shadow(0 0 7px #f59e0b); }
}

/* ═══ SEED QUICK-PICKER ════════════════════════════════════ */
#dock-seed-picker {
  display: none;
  position: fixed;
  bottom: 68px; left: 0; right: 0;
  z-index: 190;
  background: var(--ui-bg);
  border-top: 1.5px solid var(--ui-border);
  border-radius: 18px 18px 0 0;
  padding: 10px 10px 10px;
  transform: translateY(100%);
  transition: transform .28s cubic-bezier(.25,.8,.25,1);
  box-shadow: 0 -8px 36px rgba(0,0,0,.15);
}
#dock-seed-picker.picker-open { transform: translateY(0); display: block; }
#dock-seed-picker-title {
  font-size: 9px;
  font-weight: 800;
  color: var(--text-soft);
  text-transform: uppercase;
  letter-spacing: .8px;
  text-align: center;
  margin-bottom: 8px;
}
#dock-seed-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}
.seed-pick-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
  padding: 8px 5px;
  background: var(--ui-bg2);
  border: 2px solid var(--ui-border);
  border-radius: 12px;
  cursor: pointer;
  min-width: 54px;
  transition: all .14s;
  -webkit-tap-highlight-color: transparent;
}
.seed-pick-btn.sel  { border-color: var(--green); background: #f0fdf4; }
body.dark .seed-pick-btn.sel { background: #0a2016; }
.seed-pick-btn.empty { opacity: .38; cursor: not-allowed; }
.seed-pick-btn:active:not(.empty) { transform: scale(.9); }
.sp-em  { font-size: 24px; line-height: 1; }
.sp-name { font-size: 8px; font-weight: 700; color: var(--text-muted); text-align: center; }
.sp-qty  { font-size: 9px; font-weight: 800; color: var(--gold); }

/* ═══ YIELD PREVIEW BADGE ══════════════════════════════════ */
#yield-preview {
  display: none;
  position: fixed;
  bottom: 80px; left: 50%;
  transform: translateX(-50%);
  z-index: 170;
  background: rgba(245,158,11,.95);
  color: #fff;
  font-family: 'Baloo 2', cursive;
  font-size: 13px;
  font-weight: 800;
  padding: 6px 18px;
  border-radius: 22px;
  box-shadow: 0 4px 18px rgba(245,158,11,.42);
  white-space: nowrap;
  pointer-events: none;
  animation: yieldIn .2s ease;
}
@keyframes yieldIn {
  from { opacity:0; transform: translateX(-50%) translateY(6px); }
  to   { opacity:1; transform: translateX(-50%) translateY(0); }
}
@media (min-width: 681px) {
  #yield-preview { bottom: 14px; font-size: 12px; padding: 5px 14px; }
}

/* ═══ CROP INSPECTOR ════════════════════════════════════════ */
#crop-inspector {
  position: fixed;
  bottom: 82px; left: 50%;
  transform: translateX(-50%) translateY(14px);
  z-index: 310;
  background: var(--ui-bg);
  border: 1.5px solid var(--ui-border);
  border-radius: 18px;
  padding: 14px 16px 12px;
  min-width: 250px;
  max-width: min(340px, 94vw);
  box-shadow: 0 12px 50px rgba(0,0,0,.22);
  opacity: 0;
  pointer-events: none;
  transition: opacity .22s ease,
              transform .25s cubic-bezier(.34,1.56,.64,1);
}
#crop-inspector.ci-show {
  opacity: 1;
  pointer-events: all;
  transform: translateX(-50%) translateY(0);
}
@media (min-width: 681px) {
  #crop-inspector { bottom: auto; top: 80px; }
}
.ci-header {
  display: flex;
  align-items: center;
  gap: 11px;
  margin-bottom: 10px;
  padding-right: 28px;
}
.ci-em   { font-size: 34px; line-height: 1; flex-shrink: 0; }
.ci-name { font-size: 15px; font-weight: 800; color: var(--text-primary); }
.ci-stage { font-size: 11px; font-weight: 700; color: var(--text-muted); margin-top: 2px; }
.ci-stage.ci-ready { color: var(--green); }
.ci-stat-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 5px;
  margin-bottom: 8px;
}
.ci-stat {
  background: var(--ui-bg2);
  border: 1px solid var(--ui-border);
  border-radius: 10px;
  padding: 7px 3px;
  text-align: center;
}
.ci-val { font-size: 13px; font-weight: 800; color: var(--text-primary); }
.ci-lab { font-size: 8px; color: var(--text-muted); font-weight: 600; margin-top: 2px; text-transform: uppercase; letter-spacing: .3px; }
.ci-seasons {
  font-size: 10px;
  color: var(--text-soft);
  text-align: center;
  line-height: 1.7;
  border-top: 1px solid var(--ui-border);
  padding-top: 7px;
}
.ci-hint {
  font-size: 9px;
  color: var(--text-soft);
  text-align: center;
  margin-top: 4px;
  font-style: italic;
}
.ci-close {
  position: absolute;
  top: 11px; right: 13px;
  background: var(--ui-bg2);
  border: 1px solid var(--ui-border);
  border-radius: 6px;
  color: var(--text-muted);
  font-size: 11px;
  font-weight: 800;
  cursor: pointer;
  padding: 2px 8px;
  font-family: 'Nunito', sans-serif;
  line-height: 1.6;
  transition: all .14s;
}
.ci-close:hover { color: #991b1b; border-color: #fca5a5; background: #fef2f2; }
body.dark .ci-close:hover { background: #2a0d0d; color: #f87171; border-color: #7f1d1d; }

/* ═══ DAILY QUESTS ══════════════════════════════════════════ */
.quest-row {
  display: flex;
  align-items: flex-start;
  gap: 9px;
  padding: 9px 10px;
  background: var(--ui-bg2);
  border: 1px solid var(--ui-border);
  border-radius: 12px;
  margin-bottom: 5px;
  transition: border-color .15s;
}
.quest-row.quest-done {
  border-color: #86efac;
  background: #f0fdf4;
  opacity: .85;
}
body.dark .quest-row.quest-done { background: #0a2016; border-color: #166534; }
.quest-icon { font-size: 20px; flex-shrink: 0; margin-top: 1px; }
.quest-info  { flex: 1; min-width: 0; }
.quest-desc  {
  font-size: 11px;
  font-weight: 700;
  color: var(--text-primary);
  line-height: 1.4;
  margin-bottom: 5px;
}
.quest-bar-wrap {
  height: 5px;
  background: var(--ui-border);
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 4px;
}
.quest-bar-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #86efac);
  border-radius: 4px;
  transition: width .45s cubic-bezier(.25,.8,.25,1);
  min-width: 3px;
}
.quest-prog { font-size: 9px; font-weight: 700; color: var(--text-muted); }
.quest-reward-done { font-size: 10px; font-weight: 800; color: var(--green); margin-top: 2px; }
.quest-refresh-note {
  font-size: 9px;
  color: var(--text-soft);
  text-align: center;
  margin-top: 3px;
  font-style: italic;
  padding-bottom: 2px;
}
.quest-all-done {
  text-align: center;
  font-size: 12px;
  font-weight: 700;
  color: var(--green);
  padding: 10px;
  background: #f0fdf4;
  border: 1px solid #86efac;
  border-radius: 12px;
  margin-bottom: 6px;
}
body.dark .quest-all-done { background: #0a2016; border-color: #166534; }

/* ═══ RAIN FORECAST PILL (desktop HUD) ═════════════════════ */
#hud-forecast {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  background: var(--ui-bg2);
  border: 1.5px solid var(--ui-border);
  border-radius: 20px;
  padding: 3px 10px;
  white-space: nowrap;
  flex-shrink: 0;
}

/* ═══ LOW ENERGY BAR BLINK ══════════════════════════════════ */
#energy-bar.energy-critical {
  animation: energyBlink 1.1s ease-in-out infinite;
}
@keyframes energyBlink {
  0%,100% { opacity: 1; }
  50%      { opacity: .25; }
}

/* ═══ RETRO OVERRIDES ═══════════════════════════════════════ */
body.retro #mobile-dock { background: #120c00; border-top: 3px solid #8b6914; }
body.retro .dock-primary { height: 56px; }
body.retro .dock-label { font-family: 'Press Start 2P', monospace !important; font-size: 5.5px; color: #a1887f; }
body.retro .dock-icon  { font-size: 18px; }
body.retro .dock-btn.active .dock-label { color: #ffd700; }
body.retro .dock-btn.active::after { background: #ffd700; }
body.retro .dock-btn:active { background: #1c1209; }
body.retro .dock-secondary { border-top: 1px solid #3e2723; }
body.retro .dock-secondary.dock-sec-open { border-top: 2px solid #8b6914; }
body.retro .dock-sec-btn {
  background: #1c1209; border: 1px solid #3e2723; color: #f5deb3;
  font-family: 'Press Start 2P', monospace; font-size: 5.5px; border-radius: 2px;
}
body.retro .dock-sec-btn.dock-sec-active { border-color: #ffd700; color: #ffd700; background: #2d1b00; }
body.retro .dock-btn-more { border-left: 1px solid #3e2723; }
body.retro #dock-seed-picker { background: #120c00; border-top: 3px solid #8b6914; border-radius: 0; }
body.retro #dock-seed-picker-title { font-family: 'Press Start 2P', monospace; font-size: 6px; color: #a1887f; }
body.retro .seed-pick-btn { background: #1c1209; border: 1px solid #3e2723; border-radius: 2px; min-width: 48px; }
body.retro .seed-pick-btn.sel { border-color: #ffd700; background: #2d1b00; }
body.retro .sp-name { font-family: 'Press Start 2P', monospace; font-size: 5px; }
body.retro .sp-qty  { font-family: 'Press Start 2P', monospace; font-size: 6px; color: #ffd700; }
body.retro #yield-preview {
  background: #b8860b; border: 2px solid #ffd700; border-radius: 3px;
  font-family: 'Press Start 2P', monospace; font-size: 7.5px;
  box-shadow: 3px 3px 0 rgba(0,0,0,.8); animation: none;
}
body.retro #crop-inspector { background: #120c00; border: 3px solid #8b6914; border-radius: 4px; box-shadow: 6px 6px 0 rgba(0,0,0,.8); }
body.retro .ci-name  { color: #f5deb3; font-size: 12px; }
body.retro .ci-stage { color: #a1887f; font-size: 7px; font-family: 'Press Start 2P', monospace; }
body.retro .ci-stage.ci-ready { color: #69f0ae; }
body.retro .ci-stat  { background: #1c1209; border: 1px solid #3e2723; border-radius: 2px; }
body.retro .ci-val   { color: #f5deb3; font-size: 11px; }
body.retro .ci-lab   { color: #5d4037; font-size: 6px; font-family: 'Press Start 2P', monospace; }
body.retro .ci-seasons { color: #5d4037; font-size: 7px; font-family: 'Press Start 2P', monospace; border-top: 1px solid #3e2723; }
body.retro .ci-close { background: #1c1209; border: 1px solid #3e2723; color: #a1887f; border-radius: 2px; font-family: 'Press Start 2P', monospace; font-size: 8px; }
body.retro .quest-row { background: #1c1209; border: 1px solid #3e2723; border-radius: 3px; }
body.retro .quest-row.quest-done { border-color: #388e3c; background: #0d2010; }
body.retro .quest-desc { font-family: 'Press Start 2P', monospace; font-size: 6px; color: #f5deb3; line-height: 1.9; }
body.retro .quest-prog { font-family: 'Press Start 2P', monospace; font-size: 5.5px; }
body.retro .quest-bar-fill { background: #388e3c; }
body.retro .quest-reward-done { font-family: 'Press Start 2P', monospace; font-size: 6px; color: #69f0ae; }
body.retro .quest-refresh-note { font-family: 'Press Start 2P', monospace; font-size: 5px; }
body.retro .quest-all-done { background: #0d2010; border: 1px solid #388e3c; color: #69f0ae; font-family: 'Press Start 2P', monospace; font-size: 7px; border-radius: 3px; }
body.retro #hud-forecast { background: transparent; border: none; font-family: 'Press Start 2P', monospace; font-size: 7px; color: #a1887f; }
`;

  const styleEl = document.createElement('style');
  styleEl.id = 'vf-patch-v3-css';
  styleEl.textContent = PATCH_CSS;
  document.head.appendChild(styleEl);

  /* ─────────────────────────────────────────────────────────────────
     SECTION 1 — MOBILE DOCK
  ───────────────────────────────────────────────────────────────── */

  /* ── Build DOM ── */
  const dock = document.createElement('div');
  dock.id = 'mobile-dock';
  dock.innerHTML = `
    <div class="dock-secondary" id="dock-secondary">
      <button class="dock-sec-btn" id="dock-sec-shovel">🪱 Shovel</button>
      <button class="dock-sec-btn" id="dock-sec-deco">🎨 Deco</button>
      <button class="dock-sec-btn" id="dock-sec-bag">🎒 Bag</button>
      <button class="dock-sec-btn" id="dock-sec-map">🗺 Map</button>
      <button class="dock-sec-btn" id="dock-sec-pause">⏸ Pause</button>
    </div>
    <div class="dock-primary">
      <button class="dock-btn dock-btn-tool active" id="dock-hoe"    title="Hoe (H)">
        <span class="dock-icon">⛏️</span><span class="dock-label">Hoe</span>
      </button>
      <button class="dock-btn dock-btn-tool" id="dock-water"  title="Water (W)">
        <span class="dock-icon">💧</span><span class="dock-label">Water</span>
      </button>
      <button class="dock-btn dock-btn-tool" id="dock-seed"   title="Seeds (S)">
        <span class="dock-icon">🌱</span><span class="dock-label">Seeds</span>
      </button>
      <button class="dock-btn dock-btn-tool" id="dock-scythe" title="Harvest (R) · long-press = scythe all">
        <span class="dock-icon">🌾</span><span class="dock-label">Harvest</span>
      </button>
      <button class="dock-btn dock-btn-sleep" id="dock-sleep" title="Sleep / Next day (Space)">
        <span class="dock-icon">💤</span><span class="dock-label">Sleep</span>
      </button>
      <button class="dock-btn dock-btn-more" id="dock-more" title="More tools">
        <span class="dock-icon" id="dock-more-icon">⋯</span><span class="dock-label">More</span>
      </button>
    </div>`;
  document.body.appendChild(dock);

  /* ── Seed picker overlay ── */
  const seedPicker = document.createElement('div');
  seedPicker.id = 'dock-seed-picker';
  seedPicker.innerHTML = `
    <div id="dock-seed-picker-title">🌱 Choose Seed to Plant</div>
    <div id="dock-seed-list"></div>`;
  document.body.appendChild(seedPicker);

  /* ── Yield preview badge ── */
  const yieldBadge = document.createElement('div');
  yieldBadge.id = 'yield-preview';
  document.body.appendChild(yieldBadge);

  /* ── Crop inspector card ── */
  const cropInspector = document.createElement('div');
  cropInspector.id = 'crop-inspector';
  cropInspector.innerHTML = `
    <button class="ci-close" id="ci-close-btn">✕</button>
    <div id="ci-body"></div>`;
  document.body.appendChild(cropInspector);
  document.getElementById('ci-close-btn').addEventListener('click', () => {
    cropInspector.classList.remove('ci-show');
    clearTimeout(cropInspector._timer);
  });

  /* ─── Dock state ─── */
  let dockSecOpen = false;

  function openDockSec() {
    dockSecOpen = true;
    document.getElementById('dock-secondary').classList.add('dock-sec-open');
    document.getElementById('dock-more-icon').textContent = '✕';
    document.getElementById('dock-more').classList.add('active');
  }
  function closeDockSec() {
    dockSecOpen = false;
    document.getElementById('dock-secondary').classList.remove('dock-sec-open');
    document.getElementById('dock-more-icon').textContent = '⋯';
    document.getElementById('dock-more').classList.remove('active');
  }
  function toggleDockSec() { dockSecOpen ? closeDockSec() : openDockSec(); }

  /* ─── Sync dock highlights with active tool ─── */
  const PRIMARY_IDS  = { hoe: 'dock-hoe', water: 'dock-water', seed: 'dock-seed', scythe: 'dock-scythe' };
  const SECONDARY_IDS = { shovel: 'dock-sec-shovel', deco: 'dock-sec-deco' };

  function syncDockHighlight(tool) {
    document.querySelectorAll('#mobile-dock .dock-btn-tool').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('#mobile-dock .dock-sec-btn').forEach(b => b.classList.remove('dock-sec-active'));
    const pid = PRIMARY_IDS[tool];
    if (pid) document.getElementById(pid)?.classList.add('active');
    const sid = SECONDARY_IDS[tool];
    if (sid) document.getElementById(sid)?.classList.add('dock-sec-active');
  }

  /* ─── Seed picker helpers ─── */
  function refreshSeedPicker() {
    const list = document.getElementById('dock-seed-list');
    if (!list || typeof sCrops !== 'function') return;
    const av = sCrops();
    list.innerHTML = av.map(([t, c]) => {
      const qty = (G.inv && G.inv[t]) || 0;
      const sel = t === G.seed;
      return `<button class="seed-pick-btn${sel ? ' sel' : ''}${!qty ? ' empty' : ''}"
        data-seed="${t}" ${!qty ? 'disabled' : ''}>
        <span class="sp-em">${c.e}</span>
        <span class="sp-name">${c.n}</span>
        <span class="sp-qty">×${qty}</span>
      </button>`;
    }).join('');
    list.querySelectorAll('.seed-pick-btn:not([disabled])').forEach(btn => {
      btn.addEventListener('click', () => {
        G.seed = btn.dataset.seed;
        if (typeof updateSeedSel === 'function') updateSeedSel();
        list.querySelectorAll('.seed-pick-btn').forEach(b => b.classList.remove('sel'));
        btn.classList.add('sel');
      });
    });
  }

  function openSeedPicker() {
    refreshSeedPicker();
    seedPicker.style.display = 'block';
    // Force reflow before adding class so transition fires
    void seedPicker.offsetHeight;
    seedPicker.classList.add('picker-open');
  }

  function closeSeedPicker() {
    seedPicker.classList.remove('picker-open');
    setTimeout(() => {
      if (!seedPicker.classList.contains('picker-open')) seedPicker.style.display = 'none';
    }, 320);
  }

  /* ─── Yield preview ─── */
  function refreshYieldPreview() {
    if (typeof G === 'undefined' || !G.farm || G.tool !== 'scythe') {
      yieldBadge.style.display = 'none';
      return;
    }
    let gold = 0, count = 0;
    const isWinter = (typeof season === 'function') && season() === 'Winter';
    const bm = (typeof barnMult === 'function') ? barnMult() : 1;
    for (let r = 0; r < GH; r++) {
      for (let c = 0; c < GW; c++) {
        const tile = G.farm[r][c];
        if (tile && tile.crop && (typeof cropStage === 'function') && cropStage(tile.crop) === 3) {
          const cr = CROPS[tile.crop.type];
          if (cr) {
            const p = (isWinter && G.market?.prices?.[tile.crop.type]) || cr.sell;
            gold += Math.round(p * bm);
            count++;
          }
        }
      }
    }
    if (!count) { yieldBadge.style.display = 'none'; return; }
    yieldBadge.style.display = 'block';
    yieldBadge.textContent = `🌾 ${count} ready · ~${gold}g`;
  }

  /* ─── Wrap setTool ─── */
  const _origSetTool = window.setTool;
  window.setTool = function (t) {
    _origSetTool(t);
    syncDockHighlight(t);
    refreshYieldPreview();
    if (t === 'seed' && isMobile()) {
      openSeedPicker();
    } else {
      closeSeedPicker();
    }
    // Close secondary only when picking a tool NOT in the secondary drawer
    if (!['shovel', 'deco'].includes(t)) closeDockSec();
  };

  /* ─── Bind dock primary buttons ─── */
  document.getElementById('dock-hoe')   .addEventListener('click', () => setTool('hoe'));
  document.getElementById('dock-water') .addEventListener('click', () => setTool('water'));
  document.getElementById('dock-seed')  .addEventListener('click', () => setTool('seed'));
  document.getElementById('dock-scythe').addEventListener('click', () => setTool('scythe'));
  document.getElementById('dock-sleep') .addEventListener('click', () => { if (typeof doSleep === 'function') doSleep(); });
  document.getElementById('dock-more')  .addEventListener('click', toggleDockSec);

  /* ─── Bind dock secondary buttons ─── */
  document.getElementById('dock-sec-shovel').addEventListener('click', () => setTool('shovel'));
  document.getElementById('dock-sec-deco')  .addEventListener('click', () => setTool('deco'));
  document.getElementById('dock-sec-bag')   .addEventListener('click', () => {
    closeDockSec();
    if (typeof toggleBag === 'function') toggleBag();
  });
  document.getElementById('dock-sec-map').addEventListener('click', () => {
    closeDockSec();
    if (typeof openMapScreen === 'function') openMapScreen();
  });
  document.getElementById('dock-sec-pause').addEventListener('click', () => {
    closeDockSec();
    if (typeof openPause === 'function') openPause();
  });

  /* ─── Long-press Scythe = Harvest All ─── */
  let scytheTimer = null;
  const scytheBtn = document.getElementById('dock-scythe');
  scytheBtn.addEventListener('touchstart', () => {
    scytheTimer = setTimeout(() => {
      scytheTimer = null;
      if (typeof scytheAll === 'function') scytheAll();
    }, 550);
  }, { passive: true });
  ['touchend', 'touchmove', 'touchcancel'].forEach(ev =>
    scytheBtn.addEventListener(ev, () => clearTimeout(scytheTimer), { passive: true })
  );

  /* ─── Close overlays on farm tap ─── */
  const farmWrap = document.getElementById('farm-wrap');
  if (farmWrap) {
    farmWrap.addEventListener('click', () => {
      closeDockSec();
      closeSeedPicker();
    });
  }

  /* ─── Sync dock on each full render ─── */
  const _origRender = window.render;
  window.render = function () {
    _origRender();
    if (typeof G === 'undefined') return;
    syncDockHighlight(G.tool);
    refreshYieldPreview();
    // Pulse scythe when harvest is ready
    const ready = (typeof allCropsReady === 'function') && allCropsReady();
    scytheBtn.classList.toggle('dock-harvest-ready', ready);
    // Refresh seed picker tiles if open
    if (seedPicker.classList.contains('picker-open')) refreshSeedPicker();
  };

  console.log('[Patch v3.0.0] Mobile dock ✅');

  /* ─────────────────────────────────────────────────────────────────
     SECTION 2 — CROP INSPECTOR (double-tap)
  ───────────────────────────────────────────────────────────────── */
  let lastTap = { r: -1, c: -1, ts: 0 };

  function showInspector(r, c) {
    const tile = G.farm[r] && G.farm[r][c];
    if (!tile || !tile.crop) return;
    const cr = CROPS[tile.crop.type];
    if (!cr) return;

    const stg = (typeof cropStage === 'function') ? cropStage(tile.crop) : 0;
    const stageLabel = ['🌱 Seedling', '🌿 Growing', '🌿 Maturing', '✨ Ready!'][Math.max(0, stg)];

    const effDays = (typeof getEffectiveDays === 'function')
      ? getEffectiveDays(tile.crop.type, G.currentLand || 'home')
      : cr.days;
    const daysLeft = Math.max(0, effDays - tile.crop.days);

    const isWinter = (typeof season === 'function') && season() === 'Winter';
    const basePrice = (isWinter && G.market?.prices?.[tile.crop.type]) || cr.sell;
    const sellPrice = Math.round(basePrice * ((typeof barnMult === 'function') ? barnMult() : 1));

    const hLv = (typeof getLevel === 'function') ? getLevel(G.skills?.harvesting?.xp || 0) : 1;
    const bonus = hLv >= 10 ? 25 : hLv >= 5 ? 15 : 0;

    const SEM = { Spring: '🌸', Summer: '☀️', Fall: '🍂', Winter: '❄️' };
    const seasons = cr.seasons.map(s => (SEM[s] || '') + ' ' + s).join('  ');

    document.getElementById('ci-body').innerHTML = `
      <div class="ci-header">
        <span class="ci-em">${cr.e}</span>
        <div>
          <div class="ci-name">${cr.n}</div>
          <div class="ci-stage${stg === 3 ? ' ci-ready' : ''}">${stageLabel}</div>
        </div>
      </div>
      <div class="ci-stat-grid">
        <div class="ci-stat">
          <div class="ci-val">${stg === 3 ? '✅' : daysLeft + 'd'}</div>
          <div class="ci-lab">${stg === 3 ? 'Ready' : 'Days left'}</div>
        </div>
        <div class="ci-stat">
          <div class="ci-val">${tile.watered ? '💧' : '🏜️'}</div>
          <div class="ci-lab">${tile.watered ? 'Watered' : 'Dry'}</div>
        </div>
        <div class="ci-stat">
          <div class="ci-val">${sellPrice}g</div>
          <div class="ci-lab">Sell price</div>
        </div>
        <div class="ci-stat">
          <div class="ci-val">${bonus > 0 ? '+' + bonus + '%' : '—'}</div>
          <div class="ci-lab">Yield bonus</div>
        </div>
      </div>
      <div class="ci-seasons">${seasons}</div>
      <div class="ci-hint">Double-tap any crop tile to inspect</div>`;

    cropInspector.classList.add('ci-show');
    clearTimeout(cropInspector._timer);
    cropInspector._timer = setTimeout(() => cropInspector.classList.remove('ci-show'), 5000);
  }

  /* ─── Close inspector on farm tap ─── */
  if (farmWrap) {
    farmWrap.addEventListener('click', () => {
      clearTimeout(cropInspector._timer);
      cropInspector.classList.remove('ci-show');
    });
  }

  console.log('[Patch v3.0.0] Crop inspector ✅');

  /* ─────────────────────────────────────────────────────────────────
     SECTION 3 — DAILY QUESTS
  ───────────────────────────────────────────────────────────────── */
  const QUEST_POOL = [
    { id: 'till5',     desc: 'Till 5 soil tiles',       target: 5,   stat: 'tills',    icon: '⛏️', reward: { gold: 20, xp: 'farming',    amt: 30 } },
    { id: 'till12',    desc: 'Till 12 soil tiles',       target: 12,  stat: 'tills',    icon: '⛏️', reward: { gold: 50, xp: 'farming',    amt: 70 } },
    { id: 'water5',    desc: 'Water 5 crops',            target: 5,   stat: 'waters',   icon: '💧', reward: { gold: 20, xp: 'watering',   amt: 30 } },
    { id: 'water12',   desc: 'Water 12 crops',           target: 12,  stat: 'waters',   icon: '💧', reward: { gold: 50, xp: 'watering',   amt: 70 } },
    { id: 'harvest3',  desc: 'Harvest 3 crops',          target: 3,   stat: 'harvests', icon: '🌾', reward: { gold: 35, xp: 'harvesting', amt: 50 } },
    { id: 'harvest8',  desc: 'Harvest 8 crops',          target: 8,   stat: 'harvests', icon: '🌾', reward: { gold: 85, xp: 'harvesting', amt: 110} },
    { id: 'plant5',    desc: 'Plant 5 seeds',            target: 5,   stat: 'planted',  icon: '🌱', reward: { gold: 28, xp: 'farming',    amt: 25 } },
    { id: 'plant10',   desc: 'Plant 10 seeds',           target: 10,  stat: 'planted',  icon: '🌱', reward: { gold: 55, xp: 'farming',    amt: 55 } },
    { id: 'earn100',   desc: 'Earn 100g from crops',     target: 100, stat: 'goldEarned', icon: '💰', reward: { gold: 30 } },
    { id: 'earn400',   desc: 'Earn 400g from crops',     target: 400, stat: 'goldEarned', icon: '💰', reward: { gold: 100} },
    { id: 'till_water',desc: 'Till & water 6 tiles',     target: 6,   stat: 'tillWater',  icon: '🚜', reward: { gold: 45, xp: 'farming', amt: 40 } },
  ];

  /* Shuffle helper */
  function _shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  function _ensureQuests() {
    if (typeof G === 'undefined' || G.day === undefined) return;
    if (!G.vf_quests) G.vf_quests = { day: -1, active: [], prog: {} };
    const q = G.vf_quests;
    if (q.day !== G.day) {
      q.day = G.day;
      q.prog = {};
      q.active = _shuffle(QUEST_POOL).slice(0, 3).map(qd => ({ ...qd, done: false }));
      console.log('[Patch v3.0.0] Fresh quests for Day ' + G.day + ':', q.active.map(x => x.id).join(', '));
    }
  }

  function _trackQuest(stat, amount) {
    if (typeof G === 'undefined') return;
    _ensureQuests();
    const q = G.vf_quests;
    if (!q) return;
    let anyCompleted = false;
    q.active.forEach((quest, i) => {
      if (quest.done || quest.stat !== stat) return;
      q.prog[i] = (q.prog[i] || 0) + amount;
      if (q.prog[i] >= quest.target) {
        quest.done = true;
        anyCompleted = true;
        if (quest.reward.gold) G.gold = (G.gold || 0) + quest.reward.gold;
        if (quest.reward.xp && typeof addXP === 'function') addXP(quest.reward.xp, quest.reward.amt);
        if (typeof snd === 'function') snd('levelup');
        const rewardStr = [
          quest.reward.gold ? `+${quest.reward.gold}g` : '',
          quest.reward.xp   ? `+${quest.reward.amt} ${quest.reward.xp} XP` : ''
        ].filter(Boolean).join('  ');
        setTimeout(() => {
          if (typeof showAchievement === 'function') {
            showAchievement('📋', 'Quest Complete!', quest.desc + ' — ' + rewardStr);
          }
        }, 250);
      }
    });
    if (anyCompleted && typeof saveAll === 'function') saveAll();
  }

  /* Build quest HTML for the bag tab */
  function _buildQuestSection() {
    _ensureQuests();
    if (!G.vf_quests) return '';
    const q = G.vf_quests;
    const allDone = q.active.every(x => x.done);
    let h = '<div class="s-sec">📋 Daily Quests</div>';
    if (allDone) {
      h += `<div class="quest-all-done">🎉 All quests complete for today! Great work, farmer!</div>`;
    }
    q.active.forEach((quest, i) => {
      const prog = Math.min(q.prog[i] || 0, quest.target);
      const pct  = Math.round((prog / quest.target) * 100);
      const rewardLabel = [
        quest.reward.gold ? `+${quest.reward.gold}g` : '',
        quest.reward.xp   ? `+${quest.reward.amt} XP` : ''
      ].filter(Boolean).join('  ');

      if (quest.done) {
        h += `<div class="quest-row quest-done">
          <span class="quest-icon">✅</span>
          <div class="quest-info">
            <div class="quest-desc">${quest.icon} ${quest.desc}</div>
            <div class="quest-reward-done">Complete! ${rewardLabel}</div>
          </div>
        </div>`;
      } else {
        h += `<div class="quest-row">
          <span class="quest-icon">${quest.icon}</span>
          <div class="quest-info">
            <div class="quest-desc">${quest.desc}</div>
            <div class="quest-bar-wrap"><div class="quest-bar-fill" style="width:${pct}%"></div></div>
            <div class="quest-prog">${prog} / ${quest.target} · ${rewardLabel}</div>
          </div>
        </div>`;
      }
    });
    h += `<div class="quest-refresh-note">Resets at sunrise each day 🌅</div>`;
    return h;
  }

  /* Inject quest section into bag tab (bottom of buildInv) */
  const _origBuildInv = window.buildInv;
  window.buildInv = function () {
    return _origBuildInv() + _buildQuestSection();
  };

  /* Track shipping earnings */
  const _origShipAll = window.shipAll;
  window.shipAll = function () {
    let earned = 0;
    if (G.bag) {
      const bm = (typeof barnMult === 'function') ? barnMult() : 1;
      Object.entries(G.bag).forEach(([t, qty]) => {
        if (CROPS[t]) earned += Math.round(CROPS[t].sell * qty * bm);
      });
    }
    _origShipAll();
    if (earned > 0) _trackQuest('goldEarned', earned);
  };

  /* Track auction sell earnings */
  const _origAuctionSell = window.auctionSell;
  window.auctionSell = function (type, qty) {
    const bm = (typeof barnMult === 'function') ? barnMult() : 1;
    const price = (G.market?.prices?.[type]) || (CROPS[type]?.sell) || 0;
    const earned = Math.round(price * Math.min(qty, (G.bag && G.bag[type]) || 0) * bm);
    _origAuctionSell(type, qty);
    if (earned > 0) _trackQuest('goldEarned', earned);
  };

  /* Refresh quest pool each day via advanceDay */
  const _origAdvanceDay = window.advanceDay;
  window.advanceDay = function () {
    _origAdvanceDay();
    // After day ticks, day has changed — ensureQuests on next render will detect
  };

  /* Bootstrap quests if game already running */
  if (typeof G !== 'undefined' && G.day !== undefined) _ensureQuests();

  console.log('[Patch v3.0.0] Daily quests ✅');

  /* ─────────────────────────────────────────────────────────────────
     SECTION 4 — WRAP clickTile (quest tracking + crop inspector)
     Must come AFTER both systems are set up above.
  ───────────────────────────────────────────────────────────────── */
  const _origClickTile = window.clickTile;
  window.clickTile = function (r, c) {
    /* Capture pre-action tile state */
    const pre = G.farm[r] && G.farm[r][c]
      ? { tilled: G.farm[r][c].tilled, watered: G.farm[r][c].watered, crop: G.farm[r][c].crop }
      : { tilled: false, watered: false, crop: null };

    /* Run original action */
    _origClickTile(r, c);

    /* Post-action tile state */
    const post = G.farm[r] && G.farm[r][c] ? G.farm[r][c] : null;

    /* Quest tracking */
    if (post) {
      const t = G.tool;
      if (t === 'hoe'    && post.tilled   && !pre.tilled)  { _trackQuest('tills', 1); _trackQuest('tillWater', 1); }
      if (t === 'water'  && post.watered  && !pre.watered) { _trackQuest('waters', 1); _trackQuest('tillWater', 1); }
      if (t === 'seed'   && post.crop     && !pre.crop)    _trackQuest('planted', 1);
      if (t === 'scythe' && !post.crop    && pre.crop) {
        _trackQuest('harvests', 1);
        if (pre.crop && CROPS[pre.crop.type]) {
          const sellVal = Math.round(CROPS[pre.crop.type].sell * ((typeof barnMult === 'function') ? barnMult() : 1));
          _trackQuest('goldEarned', sellVal);
        }
      }
    }

    /* Update yield badge */
    refreshYieldPreview();

    /* Double-tap → crop inspector */
    const now = Date.now();
    const isDoubleTap = lastTap.r === r && lastTap.c === c && (now - lastTap.ts) < 480;
    lastTap = { r, c, ts: now };
    if (isDoubleTap && G.farm[r]?.[c]?.crop) showInspector(r, c);
  };

  /* Also wrap scytheAll for harvest quest tracking */
  const _origScytheAll = window.scytheAll;
  window.scytheAll = function () {
    let count = 0;
    if (G.farm) {
      for (let r = 0; r < GH; r++) for (let c = 0; c < GW; c++) {
        const tile = G.farm[r][c];
        if (tile?.crop && (typeof cropStage === 'function') && cropStage(tile.crop) === 3) count++;
      }
    }
    _origScytheAll();
    if (count > 0) _trackQuest('harvests', count);
    refreshYieldPreview();
  };

  /* ─────────────────────────────────────────────────────────────────
     SECTION 5 — RAIN FORECAST PILL + ENERGY WARNING (renderHUD patch)
  ───────────────────────────────────────────────────────────────── */

  /* Inject forecast pill once into the HUD */
  function injectForecastPill() {
    if (document.getElementById('hud-forecast')) return;
    const hud = document.getElementById('hud');
    if (!hud) return;
    const pill = document.createElement('div');
    pill.id = 'hud-forecast';
    hud.appendChild(pill);
  }

  const RAIN_CHANCE = { Spring: 28, Summer: 22, Fall: 10, Winter: 0 };

  function updateForecast() {
    const pill = document.getElementById('hud-forecast');
    if (!pill || typeof season !== 'function') return;
    const pct = RAIN_CHANCE[season()] ?? 0;
    if (pct === 0) {
      pill.textContent = '☀️ No rain tmrw';
    } else {
      pill.textContent = (pct >= 25 ? '🌧️ ' : '🌤️ ') + pct + '% rain tmrw';
    }
  }

  injectForecastPill();

  const _origRenderHUD = window.renderHUD;
  window.renderHUD = function () {
    _origRenderHUD();
    updateForecast();

    /* Energy blink when critically low */
    const eb = document.getElementById('energy-bar');
    if (eb && typeof G !== 'undefined' && typeof maxEnergy === 'function') {
      const pct = G.energy / maxEnergy();
      eb.classList.toggle('energy-critical', pct > 0 && pct <= 0.18);
    }

    /* Keep dock in sync on HUD repaints */
    if (isMobile() && typeof G !== 'undefined' && G.tool) syncDockHighlight(G.tool);
  };

  console.log('[Patch v3.0.0] Forecast + energy warning ✅');

  /* ─────────────────────────────────────────────────────────────────
     SECTION 6 — LAUNCH HOOK (sync everything when game loads/reloads)
  ───────────────────────────────────────────────────────────────── */
  const _origLaunchGame = window.launchGame;
  window.launchGame = function () {
    _origLaunchGame();
    setTimeout(() => {
      injectForecastPill();
      updateForecast();
      if (typeof G !== 'undefined') {
        _ensureQuests();
        if (G.tool) syncDockHighlight(G.tool);
        refreshYieldPreview();
      }
    }, 250);
  };

  /* Sync dock immediately if game is already active (patch loaded late) */
  if (typeof G !== 'undefined' && G.tool) {
    syncDockHighlight(G.tool);
    refreshYieldPreview();
  }

  console.log('[Patch v3.0.0] ✅ Mobile UI Overhaul + Content patch fully loaded!\n' +
    '  · Mobile Dock (no-scroll toolbar, expandable secondary drawer)\n' +
    '  · Seed Quick-Pick grid overlay\n' +
    '  · Yield Preview badge (scythe mode)\n' +
    '  · Crop Inspector (double-tap any crop tile)\n' +
    '  · Daily Quests (3 tasks/day, auto-refresh each morning)\n' +
    '  · Rain Forecast HUD pill\n' +
    '  · Energy blink warning at ≤18%\n' +
    '  · Retro theme overrides for all new elements');

})();


/* ────────────────────── mpfix.js ────────────────────── */
/* ═══════════════════════════════════════════════════════════════════
   VALLEY FARM — MOBILE PATCH FIX  v1.0
   ───────────────────────────────────────────────────────────────────
   Load order: after mobilepatch.js (v3.0.0)

   What this patch fixes / adds
   ────────────────────────────
   1. Dock Visibility   — Mobile dock now hidden on main menu & pause.
                          Only shows during active gameplay via
                          body.in-game class management.

   2. Tutorial Button   — ❓ Help re-added to dock secondary drawer
                          (was removed by mobilepatch hiding #toolbar).
                          Town 🏘️ and City 🏙️ shortcut buttons also
                          added to the secondary drawer.

   3. Auto Tutorial     — Brand-new games automatically open the
                          tutorial (openHelp) 800 ms after launch so
                          first-time players get guided immediately.

   4. Updated Tutorial  — Six new help steps appended (before the
                          final Save step) covering: Mobile Dock,
                          Seed Quick-Pick, Crop Inspector, Daily
                          Quests, Rain Forecast, Town & City.

   5. Mobile HUD Strip  — A compact fixed bar above the dock shows
                          💰 gold, 🏘️ Town, 🏙️ City, and 🌤️ forecast
                          on mobile — elements mobilepatch v3 hid or
                          made inaccessible on small screens.

   6. HUD Scrollable    — Overrides mobilepatch's overflow:hidden on
                          #hud so all pills remain accessible via
                          horizontal scroll (hidden scrollbar).
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─────────────────────────────────────────────────────────────────
     SECTION 0 — INJECT CSS
  ───────────────────────────────────────────────────────────────── */
  const FIX_CSS = `
/* ══ DOCK: only during gameplay ════════════════════════════════════ */
/* Override mobilepatch v3 which shows dock on ALL screens */
@media (max-width: 680px) {
  #mobile-dock {
    display: none !important;
  }
  body.in-game #mobile-dock {
    display: flex !important;
  }
}

/* ══ HUD: scrollable instead of overflow:hidden ════════════════════ */
@media (max-width: 680px) {
  #hud {
    flex-wrap: nowrap !important;
    overflow-x: auto !important;
    overflow-y: hidden !important;
    -webkit-overflow-scrolling: touch !important;
    scrollbar-width: none !important;     /* Firefox */
    padding: 4px 6px 4px 6px !important;
    gap: 4px !important;
  }
  #hud::-webkit-scrollbar { display: none !important; }

  /* Keep the gold pill prominent */
  #hud .gold-pill {
    font-size: 12px !important;
    font-weight: 900 !important;
    flex-shrink: 0 !important;
    order: -1;
  }

  /* Season pill — keep visible */
  #hud #season-pill { flex-shrink: 0 !important; order: 0; }

  /* Energy pill — keep visible */
  #hud .hud-pill:has(#energy-bar) { flex-shrink: 0 !important; }
}

/* ══ MOBILE HUD STRIP ═══════════════════════════════════════════════
   Fixed bar above the mobile dock: Gold · Town · City · Weather.
   Only shown on mobile during gameplay.
═══════════════════════════════════════════════════════════════════ */
#mob-hud-strip {
  display: none;
}
@media (max-width: 680px) {
  body.in-game #mob-hud-strip {
    display: flex;
    position: fixed;
    bottom: 62px;          /* just above dock-primary (62px) */
    left: 0; right: 0;
    z-index: 179;
    background: var(--ui-bg);
    border-top: 1px solid var(--ui-border);
    border-bottom: 1px solid var(--ui-border);
    padding: 4px 6px;
    gap: 5px;
    align-items: center;
    box-shadow: 0 -2px 10px rgba(0,0,0,.08);
  }

  /* Adjust farm wrap to clear both dock and strip */
  #farm-wrap {
    padding-bottom: 108px !important; /* 62 dock + 33 strip + 13 slack */
  }

  /* When secondary drawer is open the strip needs to slide up with it */
  .dock-secondary.dock-sec-open ~ * #mob-hud-strip,
  body.dock-sec-open #mob-hud-strip {
    bottom: 120px;
  }
}
@media (max-width: 400px) {
  #farm-wrap { padding-bottom: 102px !important; }
}

/* Strip child styles */
#mob-hud-strip .mhs-gold {
  font-size: 13px;
  font-weight: 900;
  color: var(--gold);
  white-space: nowrap;
  flex-shrink: 0;
  padding: 0 2px;
}
#mob-hud-strip .mhs-btn {
  flex: 1;
  min-width: 0;
  padding: 5px 2px;
  border: 1.5px solid var(--ui-border);
  border-radius: 9px;
  background: var(--ui-bg2);
  font-size: 10px;
  font-weight: 800;
  color: var(--text-primary);
  font-family: 'Nunito', sans-serif;
  cursor: pointer;
  text-align: center;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  transition: all .12s;
}
#mob-hud-strip .mhs-btn:active { transform: scale(.93); background: var(--ui-bg); }
#mob-hud-strip .mhs-forecast {
  font-size: 9px;
  font-weight: 700;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
  padding: 0 2px;
}

/* ══ RETRO OVERRIDES ════════════════════════════════════════════════ */
body.retro #mob-hud-strip {
  background: #120c00;
  border-color: #8b6914;
}
body.retro #mob-hud-strip .mhs-gold {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #ffd700;
}
body.retro #mob-hud-strip .mhs-btn {
  background: #1c1209;
  border: 1px solid #3e2723;
  color: #f5deb3;
  font-family: 'Press Start 2P', monospace;
  font-size: 5px;
  border-radius: 2px;
}
body.retro #mob-hud-strip .mhs-forecast {
  font-family: 'Press Start 2P', monospace;
  font-size: 5px;
  color: #a1887f;
}
`;

  const styleEl = document.createElement('style');
  styleEl.id = 'vf-mpfix-css';
  styleEl.textContent = FIX_CSS;
  document.head.appendChild(styleEl);

  /* ─────────────────────────────────────────────────────────────────
     SECTION 1 — DOCK VISIBILITY: body.in-game management
  ───────────────────────────────────────────────────────────────── */

  /* Wrap launchGame: add in-game class + handle new-game tutorial */
  const _origLaunchGame = window.launchGame;
  window.launchGame = function () {
    /* Capture new-game flag synchronously BEFORE original runs */
    const isNewGame = !!window._vf_isNewGame;

    _origLaunchGame.apply(this, arguments);

    /* Activate gameplay mode */
    document.body.classList.add('in-game');

    setTimeout(() => {
      _buildHudStrip();
      _refreshHudStrip();

      /* Auto-open tutorial for brand new games */
      if (isNewGame && typeof openHelp === 'function') {
        openHelp();
      }
    }, 350);
  };

  /* Wrap doLogout: remove in-game class */
  const _origDoLogout = window.doLogout;
  window.doLogout = function () {
    _origDoLogout.apply(this, arguments);
    document.body.classList.remove('in-game');
  };

  /* ─────────────────────────────────────────────────────────────────
     SECTION 2 — NEW GAME DETECTION
     Wrap createFarm to set a synchronous flag that launchGame reads.
  ───────────────────────────────────────────────────────────────── */
  /* Poll for createFarm in case this patch loads before script.js */
  function _hookCreateFarm () {
    if (typeof window.createFarm !== 'function') {
      setTimeout(_hookCreateFarm, 80);
      return;
    }
    const _origCreateFarm = window.createFarm;
    window.createFarm = function () {
      window._vf_isNewGame = true;
      _origCreateFarm.apply(this, arguments);
      /* Clear after launchGame (which runs synchronously inside)
         has had a chance to capture it; use microtask delay.    */
      Promise.resolve().then(() => { window._vf_isNewGame = false; });
    };
    console.log('[MobilePatchFix] createFarm hooked for new-game detection.');
  }
  _hookCreateFarm();

  /* ─────────────────────────────────────────────────────────────────
     SECTION 3 — SECONDARY DOCK: add Help / Town / City buttons
  ───────────────────────────────────────────────────────────────── */
  function _addSecondaryDockButtons () {
    const sec = document.getElementById('dock-secondary');
    if (!sec) {
      /* Dock not yet in DOM — retry */
      setTimeout(_addSecondaryDockButtons, 150);
      return;
    }
    if (document.getElementById('dock-sec-help')) return; // already done

    /* Helper to create a secondary dock button */
    function mkSecBtn (id, label, handler) {
      const btn = document.createElement('button');
      btn.className = 'dock-sec-btn';
      btn.id = id;
      btn.textContent = label;
      btn.addEventListener('click', () => {
        /* Close secondary drawer first */
        const moreBtn = document.getElementById('dock-more');
        if (moreBtn && moreBtn.classList.contains('active')) {
          moreBtn.click();
        }
        handler();
      });
      return btn;
    }

    /* Town button */
    sec.appendChild(mkSecBtn('dock-sec-town', '🏘️ Town', () => {
      if (typeof openTownScreen === 'function') openTownScreen();
    }));

    /* City button */
    sec.appendChild(mkSecBtn('dock-sec-city', '🏙️ City', () => {
      if (typeof _travelAnimThenCity === 'function') _travelAnimThenCity();
    }));

    /* Help / Tutorial button */
    sec.appendChild(mkSecBtn('dock-sec-help', '❓ Help', () => {
      if (typeof openHelp === 'function') openHelp();
    }));

    console.log('[MobilePatchFix] Secondary dock: Town, City, Help buttons added.');
  }
  _addSecondaryDockButtons();

  /* ─────────────────────────────────────────────────────────────────
     SECTION 4 — MOBILE HUD STRIP
     Fixed bar above the dock showing Gold · Town · City · Forecast.
  ───────────────────────────────────────────────────────────────── */
  const RAIN_CHANCE = { Spring: 28, Summer: 22, Fall: 10, Winter: 0 };

  function _buildHudStrip () {
    if (document.getElementById('mob-hud-strip')) return;
    const strip = document.createElement('div');
    strip.id = 'mob-hud-strip';
    strip.innerHTML = `
      <span class="mhs-gold" id="mhs-gold">💰 0g</span>
      <button class="mhs-btn" id="mhs-town"
        onclick="if(typeof openTownScreen==='function')openTownScreen()">🏘️ Town</button>
      <button class="mhs-btn" id="mhs-city"
        onclick="if(typeof _travelAnimThenCity==='function')_travelAnimThenCity()">🏙️ City</button>
      <span class="mhs-forecast" id="mhs-forecast">🌤️ --</span>`;
    document.body.appendChild(strip);
  }

  function _refreshHudStrip () {
    const goldEl = document.getElementById('mhs-gold');
    if (goldEl && typeof G !== 'undefined' && G.gold !== undefined) {
      goldEl.textContent = '💰 ' + G.gold + 'g';
    }
    const fcEl = document.getElementById('mhs-forecast');
    if (fcEl && typeof season === 'function') {
      const pct = RAIN_CHANCE[season()] ?? 0;
      fcEl.textContent = pct === 0
        ? '☀️ No rain'
        : (pct >= 25 ? '🌧️ ' : '🌤️ ') + pct + '% rain';
    }
  }

  /* Sync strip values whenever HUD re-renders */
  const _origRenderHUD = window.renderHUD;
  window.renderHUD = function () {
    _origRenderHUD.apply(this, arguments);
    _refreshHudStrip();
  };

  /* ─────────────────────────────────────────────────────────────────
     SECTION 5 — UPDATED TUTORIAL CONTENT
     Appends mobile-aware steps to HELP_STEPS before the final step.
  ───────────────────────────────────────────────────────────────── */
  const NEW_HELP_STEPS = [
    {
      e: '📱',
      title: 'Mobile Toolbar',
      body: 'On mobile your tools live in the bottom dock. Primary row: Hoe · Water · Seeds · Harvest · Sleep. Tap "⋯ More" to reveal Shovel, Deco, Bag, Map, Pause, Town, City and Help.',
      tip: 'Tip: Long-press the Harvest (🌾) button for 0.5 s to scythe all ready crops instantly!'
    },
    {
      e: '🌱',
      title: 'Seed Quick-Pick',
      body: 'Tapping Seeds in the dock opens a grid picker instead of a tiny dropdown. Each seed shows your current quantity. Tap a seed to select it — tap elsewhere or the farm grid to close.',
      tip: 'Tip: Seeds with zero stock appear faded and can\'t be selected — buy more from the Shop tab!'
    },
    {
      e: '🔍',
      title: 'Crop Inspector',
      body: 'Double-tap any planted tile to see a stat card: growth stage, days remaining, watered status, sell price with barn bonus, harvest XP bonus, and valid seasons.',
      tip: 'Tip: The inspector auto-dismisses after 5 seconds, or tap the ✕ button to close it early.'
    },
    {
      e: '📋',
      title: 'Daily Quests',
      body: 'Three randomised quests refresh each morning. Open your Bag tab to see progress. Completing them awards bonus gold and XP. Tasks include tilling, watering, planting, harvesting, and shipping.',
      tip: 'Tip: Quests reset at sunrise — check the Bag tab each morning for a fresh set!'
    },
    {
      e: '📊',
      title: 'Rain Forecast',
      body: 'A rain chance indicator sits in the HUD strip above the dock. Spring: 28%, Summer: 22%, Fall: 10%, Winter: 0%. A rainy night auto-waters all tilled soil — great for saving energy!',
      tip: 'Tip: If rain is likely tonight, skip manual watering and use that energy on tilling more tiles.'
    },
    {
      e: '🏘️',
      title: 'Town & City',
      body: 'Tap 🏘️ Town in the strip or dock to attend seasonal events and local trade. Tap 🏙️ City to reach the Stock Exchange — buy shares in NPC companies or IPO your own farm!',
      tip: 'Tip: City share prices update every season. Farm a lot in Fall to boost your company\'s value!'
    },
  ];

  function _patchHelpSteps () {
    /* HELP_STEPS is a const array in script.js — mutable via splice */
    if (typeof HELP_STEPS === 'undefined' || !Array.isArray(HELP_STEPS)) {
      setTimeout(_patchHelpSteps, 200);
      return;
    }
    /* Guard: don't inject twice */
    if (HELP_STEPS.some(s => s.title === 'Mobile Toolbar')) return;

    /* Insert before the last step ("Save & Export") */
    const insertAt = Math.max(0, HELP_STEPS.length - 1);
    HELP_STEPS.splice(insertAt, 0, ...NEW_HELP_STEPS);
    console.log('[MobilePatchFix] Tutorial updated: +' + NEW_HELP_STEPS.length + ' steps (total: ' + HELP_STEPS.length + ')');
  }

  /* ─────────────────────────────────────────────────────────────────
     SECTION 6 — DOCK SECONDARY SLIDE-UP: sync body class
     Used by CSS to lift the HUD strip when secondary drawer opens.
  ───────────────────────────────────────────────────────────────── */
  function _watchSecondaryDrawer () {
    const sec = document.getElementById('dock-secondary');
    if (!sec) { setTimeout(_watchSecondaryDrawer, 200); return; }

    const obs = new MutationObserver(() => {
      document.body.classList.toggle(
        'dock-sec-open',
        sec.classList.contains('dock-sec-open')
      );
    });
    obs.observe(sec, { attributes: true, attributeFilter: ['class'] });
  }
  _watchSecondaryDrawer();

  /* ─────────────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────────────── */
  function init () {
    _patchHelpSteps();

    /* If game screen is already active (patch loaded late) */
    const gs = document.getElementById('game-screen');
    if (gs && gs.classList.contains('active')) {
      document.body.classList.add('in-game');
      _buildHudStrip();
      _refreshHudStrip();
    }

    console.log('[MobilePatchFix v1.0] ✅ Loaded!\n' +
      '  · Mobile dock: gameplay-only visibility\n' +
      '  · Secondary dock: Town 🏘️, City 🏙️, Help ❓ buttons\n' +
      '  · Auto-tutorial on new game\n' +
      '  · Tutorial expanded with 6 new mobile steps\n' +
      '  · Mobile HUD strip: Gold · Town · City · Forecast\n' +
      '  · HUD horizontally scrollable (no overflow cut-off)');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();


/* ────────────────────── mpfix2.js ────────────────────── */
/* ═══════════════════════════════════════════════════════════════════
   VALLEY FARM — MOBILE PATCH FIX 2  v2.0.0
   ───────────────────────────────────────────────────────────────────
   Load order:
     script.js → winter.js → fall_town.js → mobilepatch.js (v3.0.0)
     → mobilepatchfix.js (v1.0) → THIS FILE

   Changes at a glance
   ───────────────────
   1. More Drawer   — Town 🏘️, City 🏙️, Bag 🎒 and Map 🗺 removed.
                      Drawer now contains ONLY:
                      Shovel · Deco · Help/Tutorial · Pause

   2. Deco Picker   — Tapping 🎨 Deco opens a seed-style slide-up grid
                      showing every DECOS item. Tap to select; all deco
                      placement then uses that type.

   3. City Lock     — City requires Farming Lv.5. Any attempt to open
                      the city while locked shows a modal with a Farming
                      progress bar. Lock is re-evaluated every attempt.

   4. HUD Redesign  — Old mob-hud-strip (Gold · Town · City · Forecast)
                      is hidden. Replaced with #mob-hud-v2:
                        Row 1 › [Season chip · Day] [Gold] [Forecast]
                        Row 2 › Full-width energy bar + % label
                      Season chip accent colour changes with season.
                      Energy bar turns amber at ≤35 %, red + blinks ≤18 %.

   5. Tutorial Fix  — Updates the "Mobile Toolbar" and "Town & City"
                      HELP_STEPS entries to match the new layout.
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const isMobile = () => window.innerWidth <= 680;

  /* ─────────────────────────────────────────────────────────────────
     SECTION 0 — INJECT CSS
  ───────────────────────────────────────────────────────────────── */
  const CSS = `
/* ── Suppress old HUD strip built by mobilepatchfix v1 ───────────── */
#mob-hud-strip { display: none !important; }

/* ── Kill Town / City dock & strip buttons wherever they exist ───── */
#dock-sec-town,
#dock-sec-city,
#mhs-town,
#mhs-city { display: none !important; }

/* ── Kill Bag / Map from secondary drawer (we pruned them in JS,
      but CSS ensures they stay gone if re-added) ────────────────── */
#dock-sec-bag,
#dock-sec-map { display: none !important; }

/* ═══ NEW MOBILE HUD v2 ══════════════════════════════════════════ */
#mob-hud-v2 {
  display: none;                        /* hidden until body.in-game  */
}

@media (max-width: 680px) {
  body.in-game #mob-hud-v2 {
    display: flex;
    flex-direction: column;
    position: fixed;
    /* Sit flush on top of the primary dock row (62 px)             */
    /* + iOS home-bar safe-area so nothing is hidden by the notch   */
    bottom: calc(62px + env(safe-area-inset-bottom, 0px));
    left: 0; right: 0;
    z-index: 178;
    background: var(--ui-bg);
    border-top: 1.5px solid var(--ui-border);
    box-shadow: 0 -4px 20px rgba(0,0,0,.10);
  }

  /* Give the farm grid enough bottom padding to clear dock + HUD  */
  #farm-wrap { padding-bottom: 116px !important; }
}
@media (max-width: 400px) {
  #farm-wrap { padding-bottom: 110px !important; }
}

/* ── Info row ────────────────────────────────────────────────────── */
.mhv2-row {
  display: flex;
  align-items: center;
  height: 42px;
  padding: 0 7px;
  gap: 0;
}

/* ── Season chip (left) ──────────────────────────────────────────── */
.mhv2-season {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 5px 11px 5px 7px;
  border-radius: 10px;
  flex-shrink: 0;
  background: var(--mhv2-s-bg, rgba(22,163,74,.12));
  border: 1.5px solid var(--mhv2-s-col, #16a34a);
  margin-right: 7px;
  transition: background .45s, border-color .45s;
}
.mhv2-s-emoji { font-size: 17px; line-height: 1; }
.mhv2-s-text  { display: flex; flex-direction: column; line-height: 1.15; }
.mhv2-s-name  {
  font-size: 7px; font-weight: 900; letter-spacing: .7px;
  text-transform: uppercase;
  color: var(--mhv2-s-col, #16a34a);
  font-family: 'Nunito', sans-serif;
  transition: color .45s;
}
.mhv2-s-day   {
  font-size: 12px; font-weight: 900;
  color: var(--text-primary);
  font-family: 'Baloo 2', cursive;
}

/* ── Gold display (flex-grow, centred) ───────────────────────────── */
.mhv2-gold {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 16px;
  font-weight: 900;
  color: var(--gold, #b45309);
  font-family: 'Baloo 2', cursive;
  white-space: nowrap;
}
.mhv2-gold-coin { font-size: 14px; line-height: 1; }

/* ── Forecast chip (right) ───────────────────────────────────────── */
.mhv2-fc {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 5px 10px;
  border-radius: 10px;
  background: var(--ui-bg2);
  border: 1.5px solid var(--ui-border);
  flex-shrink: 0;
  margin-left: 7px;
}
.mhv2-fc-icon { font-size: 15px; line-height: 1; }
.mhv2-fc-text {
  font-size: 9px; font-weight: 800;
  color: var(--text-muted);
  font-family: 'Nunito', sans-serif;
  white-space: nowrap;
}

/* ── Energy bar strip ────────────────────────────────────────────── */
.mhv2-ebar-wrap {
  height: 8px;
  background: var(--ui-bg2);
  border-top: 1px solid var(--ui-border);
  overflow: hidden;
  position: relative;
}
.mhv2-ebar-fill {
  height: 100%;
  background: linear-gradient(90deg, #22c55e, #86efac);
  border-radius: 0 4px 4px 0;
  min-width: 3px;
  transition: width .5s cubic-bezier(.25,.8,.25,1),
              background .4s ease;
}
.mhv2-ebar-fill.elv-low  { background: linear-gradient(90deg, #f59e0b, #fcd34d); }
.mhv2-ebar-fill.elv-crit {
  background: linear-gradient(90deg, #ef4444, #fca5a5);
  animation: mhv2EnergyPulse 1.1s ease-in-out infinite;
}
@keyframes mhv2EnergyPulse {
  0%,100% { opacity: 1; }
  50%      { opacity: .28; }
}
.mhv2-ebar-lbl {
  position: absolute;
  right: 6px; top: 50%;
  transform: translateY(-50%);
  font-size: 6.5px; font-weight: 900;
  color: var(--text-muted);
  font-family: 'Nunito', sans-serif;
  line-height: 1;
  pointer-events: none;
}

/* Season CSS custom-property sets ──────────────────────────────── */
#mob-hud-v2.sv-spring {
  --mhv2-s-col: #16a34a;
  --mhv2-s-bg:  rgba(22,163,74,.12);
}
#mob-hud-v2.sv-summer {
  --mhv2-s-col: #d97706;
  --mhv2-s-bg:  rgba(217,119,6,.12);
}
#mob-hud-v2.sv-fall {
  --mhv2-s-col: #c2410c;
  --mhv2-s-bg:  rgba(194,65,12,.12);
}
#mob-hud-v2.sv-winter {
  --mhv2-s-col: #0369a1;
  --mhv2-s-bg:  rgba(3,105,161,.12);
}

/* ═══ DECO PICKER (mirrors seed picker look) ═════════════════════ */
#dock-deco-picker {
  display: none;
  position: fixed;
  bottom: calc(62px + env(safe-area-inset-bottom, 0px));
  left: 0; right: 0;
  z-index: 192;
  background: var(--ui-bg);
  border-top: 1.5px solid var(--ui-border);
  border-radius: 18px 18px 0 0;
  padding: 10px 10px 12px;
  transform: translateY(100%);
  transition: transform .28s cubic-bezier(.25,.8,.25,1);
  box-shadow: 0 -8px 36px rgba(0,0,0,.16);
}
#dock-deco-picker.dp-open {
  transform: translateY(0);
  display: block;
}
#dock-deco-picker-title {
  font-size: 9px; font-weight: 800;
  color: var(--text-soft); text-transform: uppercase;
  letter-spacing: .8px; text-align: center; margin-bottom: 9px;
  font-family: 'Nunito', sans-serif;
}
#dock-deco-list {
  display: flex; gap: 7px; flex-wrap: wrap; justify-content: center;
}
.dp-btn {
  display: flex; flex-direction: column; align-items: center; gap: 3px;
  padding: 9px 7px 8px;
  background: var(--ui-bg2);
  border: 2px solid var(--ui-border);
  border-radius: 12px;
  cursor: pointer; min-width: 58px;
  transition: all .14s;
  -webkit-tap-highlight-color: transparent;
}
.dp-btn.dp-sel      { border-color: #b45309; background: #fef3c7; }
body.dark .dp-btn.dp-sel { background: #2d1b00; }
.dp-btn:active:not(.dp-sel) { transform: scale(.9); background: var(--ui-bg); }
.dp-em   { font-size: 22px; line-height: 1; }
.dp-name { font-size: 8px; font-weight: 700; color: var(--text-muted);
           text-align: center; font-family: 'Nunito', sans-serif; }

/* ═══ CITY LOCK MODAL ════════════════════════════════════════════ */
#city-lock-modal {
  display: none;
  position: fixed;
  inset: 0;
  z-index: 1200;
  background: rgba(0,0,0,.55);
  -webkit-backdrop-filter: blur(4px);
  backdrop-filter: blur(4px);
  align-items: center;
  justify-content: center;
}
#city-lock-modal.clm-open { display: flex; }
.clm-card {
  background: var(--ui-bg);
  border: 2px solid var(--ui-border);
  border-radius: 24px;
  padding: 28px 24px 22px;
  max-width: 300px;
  width: 88vw;
  text-align: center;
  box-shadow: 0 24px 64px rgba(0,0,0,.3);
  animation: clmPop .25s cubic-bezier(.34,1.56,.64,1);
}
@keyframes clmPop {
  from { opacity:0; transform:scale(.88) translateY(12px); }
  to   { opacity:1; transform:scale(1) translateY(0); }
}
.clm-icon  {
  font-size: 40px; margin-bottom: 10px; line-height: 1;
  display: block;
}
.clm-title {
  font-size: 17px; font-weight: 900;
  color: var(--text-primary);
  font-family: 'Baloo 2', cursive;
  margin-bottom: 7px;
}
.clm-body  {
  font-size: 12px; color: var(--text-muted);
  line-height: 1.65; margin-bottom: 14px;
  font-family: 'Nunito', sans-serif;
}
.clm-bar-wrap {
  height: 10px;
  background: var(--ui-bg2);
  border: 1px solid var(--ui-border);
  border-radius: 6px; overflow: hidden;
  margin-bottom: 5px;
}
.clm-bar-fill {
  height: 100%; border-radius: 6px;
  background: linear-gradient(90deg, #22c55e, #86efac);
  transition: width .55s cubic-bezier(.25,.8,.25,1);
}
.clm-prog {
  font-size: 10px; font-weight: 800;
  color: var(--text-muted);
  font-family: 'Nunito', sans-serif;
  margin-bottom: 16px;
}
.clm-ok {
  padding: 10px 26px;
  background: var(--ui-bg2);
  border: 1.5px solid var(--ui-border);
  border-radius: 10px;
  font-size: 12px; font-weight: 800;
  color: var(--text-primary); cursor: pointer;
  font-family: 'Nunito', sans-serif;
  transition: all .13s;
}
.clm-ok:active { transform: scale(.94); }

/* ═══ RETRO THEME OVERRIDES ══════════════════════════════════════ */
body.retro #mob-hud-v2 {
  background: #120c00;
  border-top: 3px solid #8b6914;
}
body.retro .mhv2-s-name {
  font-family: 'Press Start 2P', monospace;
  font-size: 4.5px;
}
body.retro .mhv2-s-day {
  font-family: 'Press Start 2P', monospace;
  font-size: 7.5px;
}
body.retro .mhv2-season { border-radius: 2px; }
body.retro .mhv2-gold {
  font-family: 'Press Start 2P', monospace;
  font-size: 9px;
  color: #ffd700;
}
body.retro .mhv2-fc { border-radius: 2px; }
body.retro .mhv2-fc-text {
  font-family: 'Press Start 2P', monospace;
  font-size: 5px;
}
body.retro .mhv2-ebar-fill {
  background: #388e3c !important;
  animation: none !important;
}
body.retro .mhv2-ebar-fill.elv-low  { background: #e65100 !important; }
body.retro .mhv2-ebar-fill.elv-crit {
  background: #b71c1c !important;
  animation: mhv2EnergyPulse 1.1s ease-in-out infinite !important;
}
body.retro #dock-deco-picker {
  background: #120c00;
  border-top: 3px solid #8b6914;
  border-radius: 0;
}
body.retro #dock-deco-picker-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 6px;
  color: #a1887f;
}
body.retro .dp-btn {
  background: #1c1209;
  border: 1px solid #3e2723;
  border-radius: 2px;
}
body.retro .dp-btn.dp-sel { border-color: #ffd700; background: #2d1b00; }
body.retro .dp-name {
  font-family: 'Press Start 2P', monospace;
  font-size: 5px;
}
body.retro .clm-card {
  background: #120c00;
  border: 3px solid #8b6914;
  border-radius: 4px;
}
body.retro .clm-title {
  font-family: 'Press Start 2P', monospace;
  font-size: 8px;
  color: #f5deb3;
}
body.retro .clm-body {
  font-family: 'Press Start 2P', monospace;
  font-size: 5.5px;
  color: #a1887f;
  line-height: 2.2;
}
body.retro .clm-ok {
  font-family: 'Press Start 2P', monospace;
  font-size: 6px;
  background: #1c1209;
  border: 1px solid #3e2723;
  border-radius: 2px;
}
body.retro .clm-bar-fill { background: #388e3c; }
`;

  const styleEl = document.createElement('style');
  styleEl.id = 'vf-mpfix2-css';
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ─────────────────────────────────────────────────────────────────
     SECTION 1 — CITY LOCK  (Farming Lv.5 gate)
  ───────────────────────────────────────────────────────────────── */
  const CITY_UNLOCK_LV = 5;

  function _farmLv() {
    if (typeof G === 'undefined' || !G.skills) return 0;
    const sk = G.skills.farming || G.skills.Farming || null;
    if (!sk) return 0;
    return (typeof getLevel === 'function') ? getLevel(sk.xp || 0) : 0;
  }

  function _cityLocked() { return _farmLv() < CITY_UNLOCK_LV; }

  /* ── Lock modal DOM ── */
  const lockModal = document.createElement('div');
  lockModal.id = 'city-lock-modal';
  lockModal.innerHTML = `
    <div class="clm-card">
      <span class="clm-icon">🏙️🔒</span>
      <div class="clm-title">City is Locked</div>
      <div class="clm-body">
        The city's Stock Exchange opens its doors at
        <strong>Farming Lv.${CITY_UNLOCK_LV}</strong>.
        Keep planting, watering and harvesting to level up!
      </div>
      <div class="clm-bar-wrap">
        <div class="clm-bar-fill" id="clm-bar-fill" style="width:0%"></div>
      </div>
      <div class="clm-prog" id="clm-prog-lbl">Farming Lv.0 / ${CITY_UNLOCK_LV}</div>
      <button class="clm-ok" id="clm-ok-btn">Keep Farming! 🌱</button>
    </div>`;
  document.body.appendChild(lockModal);

  lockModal.addEventListener('click', e => {
    if (e.target === lockModal) lockModal.classList.remove('clm-open');
  });
  document.getElementById('clm-ok-btn').addEventListener('click', () => {
    lockModal.classList.remove('clm-open');
  });

  function _showCityLock() {
    const lv  = _farmLv();
    const pct = Math.min(100, Math.round((lv / CITY_UNLOCK_LV) * 100));
    document.getElementById('clm-bar-fill').style.width  = pct + '%';
    document.getElementById('clm-prog-lbl').textContent  =
      'Farming Lv.' + lv + ' / ' + CITY_UNLOCK_LV;
    lockModal.classList.add('clm-open');
  }

  /* ── Wrap every city-opening function ── */
  const CITY_FNS = ['_travelAnimThenCity', 'openCityScreen', 'openCity', 'travelToCity'];

  function _hookCityFns() {
    CITY_FNS.forEach(fn => {
      if (typeof window[fn] !== 'function' || window[fn].__mpf2_locked) return;
      const _orig = window[fn];
      window[fn] = function () {
        if (_cityLocked()) { _showCityLock(); return; }
        return _orig.apply(this, arguments);
      };
      window[fn].__mpf2_locked = true;
    });
  }

  /* Poll: city functions might be assigned by other scripts later   */
  let _chTick = 0;
  (function _cityPoll() {
    _hookCityFns();
    if (++_chTick < 40) setTimeout(_cityPoll, 350);
  })();

  console.log('[MobilePatchFix2] City lock ✅ (requires Farming Lv.' + CITY_UNLOCK_LV + ')');

  /* ─────────────────────────────────────────────────────────────────
     SECTION 2 — SECONDARY DRAWER CLEANUP
     Keep : Shovel (#dock-sec-shovel) · Deco (#dock-sec-deco)
            Help   (#dock-sec-help)   · Pause (#dock-sec-pause)
     Kill  : Bag · Map · Town · City  (both by ID and MutationObserver)
  ───────────────────────────────────────────────────────────────── */
  const KILL_SEC = [
    'dock-sec-bag', 'dock-sec-map',
    'dock-sec-town', 'dock-sec-city',
  ];

  function _pruneSecDrawer() {
    KILL_SEC.forEach(id => document.getElementById(id)?.remove());
  }

  function _watchAndPrune() {
    const sec = document.getElementById('dock-secondary');
    if (!sec) { setTimeout(_watchAndPrune, 150); return; }

    /* Prune now, then observe for future re-insertions */
    _pruneSecDrawer();
    const obs = new MutationObserver(_pruneSecDrawer);
    obs.observe(sec, { childList: true });

    console.log('[MobilePatchFix2] Secondary drawer pruned ✅');
  }
  _watchAndPrune();

  /* ─────────────────────────────────────────────────────────────────
     SECTION 3 — DECO PICKER (seed-style slide-up grid)
  ───────────────────────────────────────────────────────────────── */
  const decoPicker = document.createElement('div');
  decoPicker.id = 'dock-deco-picker';
  decoPicker.innerHTML = `
    <div id="dock-deco-picker-title">🎨 Choose Decoration</div>
    <div id="dock-deco-list"></div>`;
  document.body.appendChild(decoPicker);

  let _activeDeco = null;   /* currently selected DECOS key */

  function _refreshDecoPicker() {
    const list = document.getElementById('dock-deco-list');
    if (!list) return;

    /* DECOS is a const in script.js → always available at this point */
    const decos = (typeof DECOS !== 'undefined') ? DECOS : {};
    const keys  = Object.keys(decos);

    if (!keys.length) {
      list.innerHTML = `<p style="font-size:11px;color:var(--text-muted);
        padding:8px 0;text-align:center">No decoration items yet.</p>`;
      return;
    }

    list.innerHTML = keys.map(k => {
      const d   = decos[k];
      const sel = k === _activeDeco;
      return `<button class="dp-btn${sel ? ' dp-sel' : ''}" data-deco="${k}">
        <span class="dp-em">${d.e}</span>
        <span class="dp-name">${d.n}</span>
      </button>`;
    }).join('');

    list.querySelectorAll('.dp-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        _activeDeco = btn.dataset.deco;
        /* Persist to game state so placement logic can read it       */
        if (typeof G !== 'undefined') G.decoType = _activeDeco;
        /* Highlight */
        list.querySelectorAll('.dp-btn').forEach(b => b.classList.remove('dp-sel'));
        btn.classList.add('dp-sel');
        /* Activate the deco tool */
        if (typeof setTool === 'function') setTool('deco');
      });
    });
  }

  function _openDecoPicker() {
    _refreshDecoPicker();
    decoPicker.style.display = 'block';
    void decoPicker.offsetHeight;        /* force reflow for transition */
    decoPicker.classList.add('dp-open');
  }

  function _closeDecoPicker() {
    decoPicker.classList.remove('dp-open');
    setTimeout(() => {
      if (!decoPicker.classList.contains('dp-open')) decoPicker.style.display = 'none';
    }, 320);
  }

  /* ── Intercept #dock-sec-deco to open picker instead ── */
  function _hookDecoBtn() {
    const decoBtn = document.getElementById('dock-sec-deco');
    if (!decoBtn) { setTimeout(_hookDecoBtn, 150); return; }
    if (decoBtn.__mpf2_hooked) return;
    decoBtn.__mpf2_hooked = true;

    /* Clone so we own all event listeners */
    const fresh = decoBtn.cloneNode(true);
    decoBtn.replaceWith(fresh);
    fresh.addEventListener('click', e => {
      e.stopPropagation();
      /* Close secondary drawer first so only the picker slides up   */
      const moreBtn = document.getElementById('dock-more');
      if (moreBtn?.classList.contains('active')) moreBtn.click();
      _openDecoPicker();
    });

    console.log('[MobilePatchFix2] Deco picker hooked ✅');
  }
  _hookDecoBtn();

  /* Close deco picker when user taps the farm grid */
  const farmWrap = document.getElementById('farm-wrap');
  if (farmWrap) farmWrap.addEventListener('click', _closeDecoPicker, { passive: true });

  /* Mutual exclusion: close deco picker when seed picker opens */
  (function _mutexPickerWatch() {
    const sp = document.getElementById('dock-seed-picker');
    if (!sp) { setTimeout(_mutexPickerWatch, 200); return; }
    new MutationObserver(() => {
      if (sp.classList.contains('picker-open')) _closeDecoPicker();
    }).observe(sp, { attributes: true, attributeFilter: ['class'] });
  })();

  /* Also close deco picker when primary dock tool changes */
  const _origSetTool = window.setTool;
  window.setTool = function (t) {
    if (t !== 'deco') _closeDecoPicker();
    return _origSetTool.apply(this, arguments);
  };

  console.log('[MobilePatchFix2] Deco picker ✅');

  /* ─────────────────────────────────────────────────────────────────
     SECTION 4 — FRESH MOBILE HUD  (#mob-hud-v2)
  ───────────────────────────────────────────────────────────────── */
  const hudV2 = document.createElement('div');
  hudV2.id = 'mob-hud-v2';
  hudV2.innerHTML = `
    <div class="mhv2-row">
      <!-- Left: Season chip -->
      <div class="mhv2-season" id="mhv2-season">
        <span class="mhv2-s-emoji" id="mhv2-s-emoji">🌸</span>
        <div class="mhv2-s-text">
          <span class="mhv2-s-name" id="mhv2-s-name">SPRING</span>
          <span class="mhv2-s-day"  id="mhv2-s-day">Day 1</span>
        </div>
      </div>
      <!-- Centre: Gold -->
      <div class="mhv2-gold">
        <span class="mhv2-gold-coin">💰</span>
        <span id="mhv2-gold-val">0g</span>
      </div>
      <!-- Right: Forecast -->
      <div class="mhv2-fc">
        <span class="mhv2-fc-icon" id="mhv2-fc-icon">🌤️</span>
        <span class="mhv2-fc-text" id="mhv2-fc-text">--</span>
      </div>
    </div>
    <!-- Energy bar -->
    <div class="mhv2-ebar-wrap">
      <div class="mhv2-ebar-fill" id="mhv2-ebar-fill" style="width:100%"></div>
      <span class="mhv2-ebar-lbl"  id="mhv2-ebar-lbl">100%⚡</span>
    </div>`;
  document.body.appendChild(hudV2);

  /* Season data */
  const RAIN_PCT = { Spring: 28, Summer: 22, Fall: 10, Winter: 0 };
  const SZ_EMOJI = { Spring: '🌸', Summer: '☀️', Fall: '🍂', Winter: '❄️' };
  const SZ_CLASS = {
    Spring: 'sv-spring', Summer: 'sv-summer',
    Fall: 'sv-fall',     Winter: 'sv-winter',
  };

  function _refreshHudV2() {
    if (!isMobile()) return;
    if (typeof G === 'undefined' || G.day === undefined) return;

    const sz  = (typeof season === 'function') ? season() : 'Spring';
    const szC = SZ_CLASS[sz] || 'sv-spring';

    /* Season chip */
    const eEl   = document.getElementById('mhv2-s-emoji');
    const nEl   = document.getElementById('mhv2-s-name');
    const dayEl = document.getElementById('mhv2-s-day');
    if (eEl)   eEl.textContent   = SZ_EMOJI[sz]   || '🌱';
    if (nEl)   nEl.textContent   = sz.toUpperCase();
    if (dayEl) dayEl.textContent = 'Day ' + (G.day || 1);

    /* Season tint: swap class */
    Object.values(SZ_CLASS).forEach(c => hudV2.classList.remove(c));
    hudV2.classList.add(szC);

    /* Gold — compact thousands format */
    const gEl = document.getElementById('mhv2-gold-val');
    if (gEl) {
      const g = G.gold || 0;
      gEl.textContent = g >= 10000
        ? (g / 1000).toFixed(1).replace(/\.0$/, '') + 'k g'
        : g + 'g';
    }

    /* Forecast chip */
    const fcI = document.getElementById('mhv2-fc-icon');
    const fcT = document.getElementById('mhv2-fc-text');
    if (fcI && fcT) {
      const pct = RAIN_PCT[sz] ?? 0;
      if (pct === 0)    { fcI.textContent = '☀️';  fcT.textContent = 'Dry'; }
      else if (pct < 25){ fcI.textContent = '🌤️'; fcT.textContent = pct + '%'; }
      else              { fcI.textContent = '🌧️'; fcT.textContent = pct + '%'; }
    }

    /* Energy bar */
    const fill = document.getElementById('mhv2-ebar-fill');
    const lbl  = document.getElementById('mhv2-ebar-lbl');
    if (fill) {
      const cur  = G.energy ?? 0;
      const max  = (typeof maxEnergy === 'function') ? maxEnergy() : 100;
      const pct  = max > 0 ? Math.max(0, Math.min(100, Math.round((cur / max) * 100))) : 100;
      fill.style.width = pct + '%';
      if (lbl) lbl.textContent = pct + '%⚡';
      fill.classList.remove('elv-low', 'elv-crit');
      if      (pct <= 18) fill.classList.add('elv-crit');
      else if (pct <= 35) fill.classList.add('elv-low');
    }
  }

  /* ── Wire up hooks so the HUD stays live ── */

  /* renderHUD fires on every gold/energy tick */
  const _origRenderHUD = window.renderHUD;
  window.renderHUD = function () {
    _origRenderHUD.apply(this, arguments);
    _refreshHudV2();
  };

  /* launchGame — initial population once gameplay starts */
  const _origLaunchGame = window.launchGame;
  window.launchGame = function () {
    _origLaunchGame.apply(this, arguments);
    /* Small delay: wait for G.day / season() to be valid             */
    setTimeout(_refreshHudV2, 450);
  };

  /* doSleep — day & season may change after sleeping */
  const _origDoSleep = window.doSleep;
  window.doSleep = function () {
    const r = _origDoSleep?.apply(this, arguments);
    setTimeout(_refreshHudV2, 700);
    return r;
  };

  console.log('[MobilePatchFix2] HUD v2 ✅');

  /* ─────────────────────────────────────────────────────────────────
     SECTION 5 — KILL TOWN / CITY FROM THE DESKTOP HUD TOOLBAR
     hud-town-btn and hud-city-btn are rendered by renderHUD in
     script.js and therefore re-appear on every HUD repaint.
     We hide them on every render call (mobile only) and also on load.
  ───────────────────────────────────────────────────────────────── */
  const KILL_HUD_IDS = ['hud-town-btn', 'hud-city-btn'];

  function _killHudNavBtns() {
    if (!isMobile()) return;
    KILL_HUD_IDS.forEach(id => {
      const el = document.getElementById(id);
      if (el) el.style.setProperty('display', 'none', 'important');
    });
  }

  /* Wrap render (already chained by mobilepatch & fall_town — safe) */
  const _origRender = window.render;
  window.render = function () {
    _origRender?.apply(this, arguments);
    _killHudNavBtns();
    _refreshHudV2();   /* keep HUD live on full re-renders too        */
  };

  /* Run once immediately in case HUD is already painted */
  _killHudNavBtns();

  /* ─────────────────────────────────────────────────────────────────
     SECTION 6 — UPDATE TUTORIAL STEPS
     Rewrites the two affected HELP_STEPS entries that mobilepatchfix
     v1 inserted, so the text matches the new layout.
  ───────────────────────────────────────────────────────────────── */
  function _patchTutorial() {
    if (typeof HELP_STEPS === 'undefined' || !Array.isArray(HELP_STEPS)) {
      setTimeout(_patchTutorial, 220);
      return;
    }
    /* Don't patch twice */
    if (HELP_STEPS._mpf2Updated) return;
    HELP_STEPS._mpf2Updated = true;

    const toolbar = HELP_STEPS.find(s => s.title === 'Mobile Toolbar');
    if (toolbar) {
      toolbar.body =
        'On mobile your tools live in the bottom dock. ' +
        'Primary row: Hoe · Water · Seeds · Harvest · Sleep. ' +
        'Tap "⋯ More" to reveal Shovel, Deco, Help and Pause.';
      toolbar.tip =
        'Tip: Tap 🎨 Deco to open a grid picker — choose a decoration ' +
        'type, then tap any tile to place it!';
    }

    const tcStep = HELP_STEPS.find(s => s.title === 'Town & City');
    if (tcStep) {
      tcStep.body =
        'The 🏙️ City Stock Exchange unlocks at Farming Lv.5 — ' +
        'keep planting and harvesting to get there. ' +
        'A progress bar shows how far you are when you try to visit.';
      tcStep.tip =
        'Tip: Reach Farming Lv.5 before Fall for the best IPO timing!';
    }

    console.log('[MobilePatchFix2] Tutorial steps updated ✅');
  }
  _patchTutorial();

  /* ─────────────────────────────────────────────────────────────────
     INIT — sync everything if game is already running
  ───────────────────────────────────────────────────────────────── */
  function _init() {
    _pruneSecDrawer();
    _killHudNavBtns();

    /* If game-screen is already active (patch loaded late)          */
    const gs = document.getElementById('game-screen');
    if (gs?.classList.contains('active') || (typeof G !== 'undefined' && G.day !== undefined)) {
      document.body.classList.add('in-game');
      _refreshHudV2();
    }

    console.log(
      '[MobilePatchFix2 v2.0.0] ✅ Fully loaded!\n' +
      '  · More drawer  : Town/City/Bag/Map removed — only Shovel·Deco·Help·Pause\n' +
      '  · Deco Picker  : seed-style slide-up grid (DECOS items)\n' +
      '  · City Lock    : Farming Lv.' + CITY_UNLOCK_LV + ' required, modal + progress bar\n' +
      '  · Mobile HUD v2: Season chip · Gold · Forecast + energy strip\n' +
      '  · Tutorial     : "Mobile Toolbar" and "Town & City" steps updated'
    );
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', _init);
  } else {
    _init();
  }

})();


/* ────────────────────── mpfix3.js ────────────────────── */
/* ═══════════════════════════════════════════════════════════════════
   VALLEY FARM — MOBILE PATCH FIX 3  (mpfix3.js)  v1.0
   ───────────────────────────────────────────────────────────────────
   Load order: after script.js · winter.js · mobilepatch.js · mobilepatchfix.js

   What this fixes (MOBILE ONLY — zero PC-side changes)
   ─────────────────────────────────────────────────────
   1. Seed / Deco Toggle
      Tapping 🌱 Seeds again (while picker is already open) now
      CLOSES the picker instead of re-opening it.
      Tapping 🎨 Deco again (while deco tool is active) de-selects
      deco and reverts to the Hoe tool.
      Tapping ⋯ More while the seed picker is visible also closes it.

   2. Top-bar Redesign
      The mobile HUD strip above the dock now shows only what the
      user asked for: 📆 Year · 🕐 Clock · ☀️ Weather · 🏘️ Town.
      The 🏙️ City button is hidden by default and appears only once
      the player's Farming skill reaches Lv 5 (mirrors the desktop
      requirement described in the game design).

   3. Winter Hub swap
      During Winter the rain-forecast slot is replaced by an ❄️ Hub
      button that opens the Winter Hub directly — rain chance is
      always 0 % in Winter anyway so it was useless information.
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const isMobile = () => window.innerWidth <= 680;

  /* ─────────────────────────────────────────────────────────────────
     SECTION 0 — CSS  (mobile-only via @media)
  ───────────────────────────────────────────────────────────────── */
  const CSS = `
/* ══ HUD strip layout override ═════════════════════════════════════ */
@media (max-width: 680px) {
  /* Strip sits just above the dock primary row */
  body.in-game #mob-hud-strip {
    display: flex !important;
    align-items: center;
    gap: 4px;
    padding: 3px 7px;
    /* height is naturally set by content */
    overflow: hidden;
  }
}

/* ── Pill text (year / clock / weather) ─────────────────────────── */
.mhs3-pill {
  display: flex;
  align-items: center;
  gap: 2px;
  font-size: 10px;
  font-weight: 700;
  color: var(--text-muted);
  white-space: nowrap;
  flex-shrink: 0;
  font-family: 'Nunito', sans-serif;
}

/* ── Action buttons (Town / City / Winter Hub) ───────────────────── */
.mhs3-btn {
  flex-shrink: 0;
  padding: 4px 7px;
  border: 1.5px solid var(--ui-border);
  border-radius: 9px;
  background: var(--ui-bg2);
  font-size: 10px;
  font-weight: 800;
  color: var(--text-primary);
  font-family: 'Nunito', sans-serif;
  cursor: pointer;
  white-space: nowrap;
  -webkit-tap-highlight-color: transparent;
  transition: background .12s, transform .1s;
  line-height: 1.3;
}
.mhs3-btn:active { transform: scale(.93); background: var(--ui-bg); }

/* Town button — always visible */
#mhs3-town {
  background: linear-gradient(135deg,#16a34a,#15803d);
  border-color: #15803d;
  color: #fff;
}
body.dark #mhs3-town {
  background: linear-gradient(135deg,#15803d,#166534);
  border-color: #166534;
}
body.season-fall  #mhs3-town { background: linear-gradient(135deg,#c2410c,#9a3412); border-color:#9a3412; }
body.season-winter #mhs3-town { background: linear-gradient(135deg,#0369a1,#075985); border-color:#075985; }
body.season-summer #mhs3-town { background: linear-gradient(135deg,#d97706,#b45309); border-color:#b45309; }

/* City button — hidden until Farming Lv 5 */
#mhs3-city {
  display: none;
  background: linear-gradient(135deg,#7c3aed,#6d28d9);
  border-color:#6d28d9;
  color:#fff;
}
body.farming-lv5 #mhs3-city { display: inline-flex; }

/* Winter Hub button — shown only during Winter; hides weather pill */
#mhs3-winter-hub {
  display: none;
  background: linear-gradient(135deg,#0369a1,#075985);
  border-color:#075985;
  color:#fff;
}
body.season-winter #mhs3-winter-hub { display: inline-flex; }
body.season-winter #mhs3-weather    { display: none !important; }

/* Spacer pushes Town/City/Hub to the right */
.mhs3-spacer { flex: 1; min-width: 0; }

/* ── Retro overrides ─────────────────────────────────────────────── */
body.retro .mhs3-pill {
  font-family: 'Press Start 2P', monospace !important;
  font-size: 5px !important;
  color: #a1887f !important;
}
body.retro .mhs3-btn {
  background: #1c1209 !important;
  border: 1px solid #3e2723 !important;
  color: #f5deb3 !important;
  font-family: 'Press Start 2P', monospace !important;
  font-size: 5px !important;
  border-radius: 2px !important;
  padding: 4px 5px !important;
}
body.retro #mhs3-town,
body.retro #mhs3-city,
body.retro #mhs3-winter-hub {
  color: #ffd700 !important;
  border-color: #8b6914 !important;
}
`;

  const styleEl = document.createElement('style');
  styleEl.id = 'vf-mpfix3-css';
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ─────────────────────────────────────────────────────────────────
     SECTION 1 — SEED PICKER TOGGLE
     Tapping 🌱 Seeds while picker is already open → close it.
     Tapping ⋯ More while picker open → close picker.
  ───────────────────────────────────────────────────────────────── */
  function _closeSeedPicker () {
    const picker = document.getElementById('dock-seed-picker');
    if (!picker) return;
    picker.classList.remove('picker-open');
    setTimeout(() => {
      if (!picker.classList.contains('picker-open')) picker.style.display = 'none';
    }, 320);
  }

  function _patchSeedToggle () {
    const btn = document.getElementById('dock-seed');
    if (!btn) { setTimeout(_patchSeedToggle, 150); return; }

    /* Clone removes all existing addEventListener listeners so we
       can install our own without a double-fire.                  */
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', () => {
      if (!isMobile()) {
        if (typeof setTool === 'function') setTool('seed');
        return;
      }
      const picker = document.getElementById('dock-seed-picker');
      const pickerOpen = picker && picker.classList.contains('picker-open');
      const seedActive = typeof G !== 'undefined' && G.tool === 'seed';

      if (pickerOpen && seedActive) {
        /* Second tap → toggle picker OFF (keep seed as active tool) */
        _closeSeedPicker();
      } else {
        /* First tap → normal setTool flow, which opens the picker  */
        if (typeof setTool === 'function') setTool('seed');
      }
    });

    console.log('[mpfix3] Seed toggle patched.');
  }

  /* Also close seed picker when ⋯ More is tapped */
  function _patchMoreButtonClosesPickerAndDeco () {
    const moreBtn = document.getElementById('dock-more');
    if (!moreBtn) { setTimeout(_patchMoreButtonClosesPickerAndDeco, 150); return; }

    /* Capture phase so we run BEFORE mobilepatch toggleDockSec     */
    moreBtn.addEventListener('click', () => {
      _closeSeedPicker();
    }, true /* capture */);

    console.log('[mpfix3] More button now closes seed picker.');
  }

  /* ─────────────────────────────────────────────────────────────────
     SECTION 2 — DECO TOGGLE
     Tapping 🎨 Deco while deco is already the active tool reverts
     to Hoe and closes the secondary drawer.
  ───────────────────────────────────────────────────────────────── */
  function _patchDecoToggle () {
    const btn = document.getElementById('dock-sec-deco');
    if (!btn) { setTimeout(_patchDecoToggle, 150); return; }

    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', () => {
      const decoActive = typeof G !== 'undefined' && G.tool === 'deco';
      if (decoActive) {
        /* De-select: revert to hoe */
        if (typeof setTool === 'function') setTool('hoe');
        /* Close secondary drawer */
        const moreBtn = document.getElementById('dock-more');
        if (moreBtn && moreBtn.classList.contains('active')) moreBtn.click();
      } else {
        if (typeof setTool === 'function') setTool('deco');
      }
    });

    console.log('[mpfix3] Deco toggle patched.');
  }

  /* ─────────────────────────────────────────────────────────────────
     SECTION 3 — REBUILD MOBILE HUD STRIP
     New layout: [📆 Yr.X]  [🕐 HH:MM]  [☀️ Weather]  ·spacer·
                 [🏘️ Town]  [🏙️ City¹]  [❄️ Hub²]
                 ¹ only when Farming ≥ Lv 5
                 ² only during Winter (replaces weather pill)
  ───────────────────────────────────────────────────────────────── */
  function _rebuildHudStrip () {
    const strip = document.getElementById('mob-hud-strip');
    if (!strip) { setTimeout(_rebuildHudStrip, 200); return; }

    /* Replace whatever mobilepatchfix injected */
    strip.innerHTML = `
      <span class="mhs3-pill" id="mhs3-year">📆 Yr.1</span>
      <span class="mhs3-pill" id="mhs3-clock">☀️ 6:00 AM</span>
      <span class="mhs3-pill" id="mhs3-weather">☀️ Sunny</span>
      <span class="mhs3-spacer"></span>
      <button class="mhs3-btn" id="mhs3-winter-hub">❄️ Hub</button>
      <button class="mhs3-btn" id="mhs3-town">🏘️ Town</button>
      <button class="mhs3-btn" id="mhs3-city">🏙️ City</button>
    `;

    /* Town button */
    document.getElementById('mhs3-town').addEventListener('click', () => {
      if (typeof openTownScreen === 'function') openTownScreen();
    });

    /* City button */
    document.getElementById('mhs3-city').addEventListener('click', () => {
      if      (typeof _travelAnimThenCity === 'function') _travelAnimThenCity();
      else if (typeof openCityScreen      === 'function') openCityScreen();
    });

    /* Winter Hub button — tries several entry points winter.js may expose */
    document.getElementById('mhs3-winter-hub').addEventListener('click', () => {
      /* Option A: direct function */
      if (typeof openWinterHub === 'function') { openWinterHub(); return; }
      /* Option B: click the HUD button winter.js injects */
      const injBtn = document.getElementById('hud-winter-hub-btn')
                  || document.querySelector('[onclick*="openWinterHub"]')
                  || document.querySelector('[onclick*="winterHub"]');
      if (injBtn) { injBtn.click(); return; }
      /* Option C: click the first ❄️-labelled element in the HUD */
      const hudEl = document.querySelector('#hud [data-winter-hub], #hud .winter-hub-btn');
      if (hudEl) hudEl.click();
    });

    console.log('[mpfix3] HUD strip rebuilt.');
    /* Immediately populate with current game state */
    _refreshHudStrip3();
  }

  /* ── Values refresh ─────────────────────────────────────────────── */
  function _refreshHudStrip3 () {
    if (!isMobile()) return;
    if (typeof G === 'undefined') return;

    /* Year */
    const yearEl = document.getElementById('mhs3-year');
    if (yearEl) {
      const yr = (G.year !== undefined) ? G.year : 1;
      yearEl.textContent = '📆 Yr.' + yr;
    }

    /* Clock — mirror the live DOM values renderHUD already populated */
    const clockEl = document.getElementById('mhs3-clock');
    if (clockEl) {
      const dnIcon  = document.getElementById('dn-icon');
      const hudTime = document.getElementById('hud-time');
      const icon    = (dnIcon  ? dnIcon.textContent  : '☀️').trim();
      const time    = (hudTime ? hudTime.textContent : '6:00 AM').trim();
      clockEl.textContent = icon + ' ' + time;
    }

    /* Today's weather */
    const wxEl = document.getElementById('mhs3-weather');
    if (wxEl) {
      const wEm  = document.getElementById('weather-em');
      const wTxt = document.getElementById('hud-weather');
      const em   = (wEm  ? wEm.textContent  : '☀️').trim();
      const txt  = (wTxt ? wTxt.textContent : 'Sunny').trim();
      wxEl.textContent = em + ' ' + txt;
    }

    /* City visibility — Farming Lv 5+ */
    if (G.skills && typeof getLevel === 'function') {
      const farmXP = (G.skills.farming && G.skills.farming.xp) || 0;
      const lv     = getLevel(farmXP);
      document.body.classList.toggle('farming-lv5', lv >= 5);
    } else if (G.skills && G.skills.farming) {
      /* Fallback if getLevel isn't global: approximate via XP thresholds
         (mirrors the XP_LEVELS table common in this codebase)            */
      const farmXP = G.skills.farming.xp || 0;
      /* XP for Lv 5 in a typical 0,50,150,300,500,750,… table is 500  */
      document.body.classList.toggle('farming-lv5', farmXP >= 500);
    }

    /* Season body class — drives Town button colour + Winter Hub visibility */
    if (typeof season === 'function') {
      const s = season();
      ['season-spring','season-summer','season-fall','season-winter']
        .forEach(c => document.body.classList.remove(c));
      const map = { Spring:'season-spring', Summer:'season-summer',
                    Fall:'season-fall',     Winter:'season-winter' };
      if (map[s]) document.body.classList.add(map[s]);
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     SECTION 4 — HOOK renderHUD
     Chain on top of whatever mobilepatchfix already chained.
  ───────────────────────────────────────────────────────────────── */
  function _hookRenderHUD () {
    if (typeof window.renderHUD !== 'function') {
      setTimeout(_hookRenderHUD, 100);
      return;
    }
    const _prev = window.renderHUD;
    window.renderHUD = function () {
      _prev.apply(this, arguments);
      _refreshHudStrip3();
    };
    console.log('[mpfix3] renderHUD hooked for strip refresh.');
  }

  /* ─────────────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────────────── */
  function init () {
    _patchSeedToggle();
    _patchMoreButtonClosesPickerAndDeco();
    _patchDecoToggle();
    _rebuildHudStrip();
    _hookRenderHUD();

    /* If the game screen is already active when this patch loads late */
    const gs = document.getElementById('game-screen');
    if (gs && gs.classList.contains('active')) {
      document.body.classList.add('in-game');
      setTimeout(_refreshHudStrip3, 400);
    }

    console.log('[mpfix3 v1.0] ✅ Loaded!\n' +
      '  · Seeds: tap again to close picker\n' +
      '  · Deco: tap again to de-select\n' +
      '  · More: tap closes seed picker too\n' +
      '  · Top bar: Year · Clock · Weather · Town [· City @ Farming Lv5]\n' +
      '  · Winter: ❄️ Hub replaces rain forecast in the strip');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();


/* ────────────────────── mpfix4.js ────────────────────── */
/* ═══════════════════════════════════════════════════════════════════
   VALLEY FARM — MOBILE PATCH FIX 4  (mpfix4.js)  v1.0
   ───────────────────────────────────────────────────────────────────
   Load order: after script.js · winter.js · mobilepatch.js
               · mobilepatchfix.js · mobilepatchfix2.js · mpfix3.js

   What this does (MOBILE ONLY — zero PC-side changes)
   ─────────────────────────────────────────────────────
   1. Layout Overhaul
      Hides the scrolling #hud top bar entirely on mobile — all that
      info is already in the HUD strip. Repositions #mob-hud-strip
      from "above the dock" to the very top of the screen (like a
      proper status bar). farm-wrap gains top padding to clear it.

   2. Deco Picker  (FIXES deco menu not showing)
      The 🎨 Deco button now opens a grid picker overlay — identical
      in style to the seed picker — showing all 7 decoration types.
      Tap a type to select it; the change is synced to the hidden
      #deco-select so the game engine picks it up immediately.
      Tap 🎨 Deco again to close the picker and revert to Hoe.
      Switching to any other tool also closes the picker.

   3. Crop Ready Badge
      A red pill badge with a count appears on the 🌾 Harvest dock
      button whenever ≥ 1 crop is ready to harvest. It disappears
      after scytheAll or when no crops remain ready.

   4. Season Progress Bar
      A 3 px coloured bar at the bottom of the top strip fills from
      left to right as the season advances (Day 1 → Day 28).
      Colour matches the season: 🌸 green · ☀️ amber · 🍂 red · ❄️ blue.

   5. Morning Weather Toast
      After each sleep a brief toast shows: current day, season, and
      tonight's rain chance — gives the player a quick daily briefing.

   6. Sleep Nudge for Unwatered Crops
      If ≥ 3 planted tiles are unwatered when Sleep is tapped, a
      one-off toast fires to remind the player before the night ends.

   7. Low-Energy Sleep Button Glow
      When energy drops to ≤ 18 % the 💤 Sleep dock button pulses
      with a soft indigo glow, hinting "maybe it's time to rest".
═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  const isMobile = () => window.innerWidth <= 680;

  /* ─────────────────────────────────────────────────────────────────
     SECTION 0 — CSS
  ───────────────────────────────────────────────────────────────── */
  const CSS = `
/* ══ HIDE original top HUD bar on mobile ════════════════════════════
   All the same info lives in the HUD strip; the bar wastes vertical
   space and confuses the layout when the strip moves to the top.
══════════════════════════════════════════════════════════════════ */
@media (max-width: 680px) {
  body.in-game #hud {
    display: none !important;
  }
}

/* ══ MOVE mob-hud-strip to the very top ══════════════════════════════
   Override the mobilepatchfix/mpfix3 bottom:62px positioning.
══════════════════════════════════════════════════════════════════ */
@media (max-width: 680px) {
  body.in-game #mob-hud-strip {
    position: fixed !important;
    top: 0 !important;
    bottom: auto !important;
    left: 0 !important;
    right: 0 !important;
    z-index: 200 !important;
    border-top: none !important;
    border-bottom: 1.5px solid var(--ui-border) !important;
    box-shadow: 0 2px 14px rgba(0,0,0,.12) !important;
    padding: 5px 8px 8px !important; /* extra bottom padding for the progress bar */
    min-height: 36px;
  }

  /* Main content area clears the fixed top strip (~38 px) */
  body.in-game #main {
    padding-top: 42px !important;
  }

  /* farm-wrap: only dock bottom padding (strip is now at top) */
  body.in-game #farm-wrap {
    padding-top: 0 !important;
    padding-bottom: 76px !important;
  }
}
@media (max-width: 400px) {
  body.in-game #farm-wrap { padding-bottom: 70px !important; }
}

/* ══ SEASON PROGRESS BAR — sits at the bottom of the top strip ══════ */
#mhf4-season-bar-wrap {
  position: absolute;
  bottom: 0; left: 0; right: 0;
  height: 3px;
  background: var(--ui-border);
  overflow: hidden;
  border-radius: 0 0 0 0;
}
#mhf4-season-bar {
  height: 100%;
  width: 0%;
  transition: width .7s ease;
  border-radius: 0 2px 2px 0;
}
/* Season tint colours */
body.season-spring  #mhf4-season-bar,
body:not([class*="season-"]) #mhf4-season-bar { background: #22c55e; }
body.season-summer  #mhf4-season-bar           { background: #f59e0b; }
body.season-fall    #mhf4-season-bar           { background: #ef4444; }
body.season-winter  #mhf4-season-bar           { background: #60a5fa; }

/* ══ DECO PICKER ════════════════════════════════════════════════════ */
#dock-deco-picker {
  display: none;
  position: fixed;
  bottom: 68px; left: 0; right: 0;
  z-index: 191;
  background: var(--ui-bg);
  border-top: 1.5px solid var(--ui-border);
  border-radius: 18px 18px 0 0;
  padding: 10px 10px 12px;
  transform: translateY(100%);
  transition: transform .28s cubic-bezier(.25,.8,.25,1);
  box-shadow: 0 -8px 36px rgba(0,0,0,.15);
}
#dock-deco-picker.picker-open {
  transform: translateY(0);
}
#dock-deco-picker-title {
  font-size: 9px;
  font-weight: 800;
  color: var(--text-soft);
  text-transform: uppercase;
  letter-spacing: .8px;
  text-align: center;
  margin-bottom: 8px;
  font-family: 'Nunito', sans-serif;
}
#dock-deco-list {
  display: flex;
  gap: 6px;
  flex-wrap: wrap;
  justify-content: center;
}
.deco-pick-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 3px;
  padding: 9px 5px 7px;
  background: var(--ui-bg2);
  border: 2px solid var(--ui-border);
  border-radius: 12px;
  cursor: pointer;
  min-width: 58px;
  transition: all .14s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
}
.deco-pick-btn:active { transform: scale(.9); }
.deco-pick-btn.sel {
  border-color: #c2410c;
  background: #fff7ed;
}
body.dark .deco-pick-btn.sel { background: #1c0d00; border-color: #ea580c; }
.dp-em   { font-size: 22px; line-height: 1; pointer-events: none; }
.dp-name {
  font-size: 8px; font-weight: 700;
  color: var(--text-muted); text-align: center;
  font-family: 'Nunito', sans-serif;
  pointer-events: none;
}

/* ══ CROP READY BADGE on Harvest button ════════════════════════════ */
#mhf4-crop-badge {
  display: none;
  position: absolute;
  top: 3px; right: 2px;
  min-width: 17px; height: 17px;
  background: #ef4444;
  color: #fff;
  font-size: 9px;
  font-weight: 900;
  font-family: 'Nunito', sans-serif;
  border-radius: 10px;
  padding: 0 4px;
  text-align: center;
  line-height: 17px;
  pointer-events: none;
  z-index: 5;
  box-shadow: 0 1px 5px rgba(239,68,68,.5);
  animation: mhf4BadgePop .22s cubic-bezier(.34,1.56,.64,1);
}
@keyframes mhf4BadgePop {
  from { transform: scale(0); }
  to   { transform: scale(1); }
}

/* ══ LOW-ENERGY GLOW on Sleep dock button ════════════════════════════ */
.dock-btn-sleep.mhf4-sleep-warn .dock-icon {
  animation: mhf4SleepGlow 1.4s ease-in-out infinite;
}
@keyframes mhf4SleepGlow {
  0%,100% { filter: none; }
  50%      { filter: drop-shadow(0 0 8px #818cf8); }
}

/* ══ RETRO overrides ═══════════════════════════════════════════════ */
body.retro #dock-deco-picker {
  background: #120c00;
  border-top: 3px solid #8b6914;
  border-radius: 0;
  box-shadow: none;
}
body.retro #dock-deco-picker-title {
  font-family: 'Press Start 2P', monospace !important;
  font-size: 6px !important;
  color: #a1887f !important;
}
body.retro .deco-pick-btn {
  background: #1c1209;
  border: 1px solid #3e2723;
  border-radius: 2px;
  min-width: 50px;
}
body.retro .deco-pick-btn.sel {
  border-color: #ffd700;
  background: #2d1b00;
}
body.retro .dp-em  { font-size: 18px; }
body.retro .dp-name {
  font-family: 'Press Start 2P', monospace !important;
  font-size: 5px !important;
  color: #a1887f !important;
}
body.retro #mhf4-crop-badge {
  background: #8b0000;
  border-radius: 2px;
  font-family: 'Press Start 2P', monospace;
  font-size: 6px;
  box-shadow: none;
  animation: none;
}
body.retro #mhf4-season-bar-wrap { background: #3e2723; }
body.retro #mhf4-season-bar { background: #ffd700 !important; }
`;

  const styleEl = document.createElement('style');
  styleEl.id = 'vf-mpfix4-css';
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  /* ─────────────────────────────────────────────────────────────────
     SECTION 1 — SEASON PROGRESS BAR
     Appended to the bottom of #mob-hud-strip. Waits for mpfix3 to
     finish rebuilding the strip (it uses setTimeout ~200 ms) before
     injecting, so we delay to 650 ms.
  ───────────────────────────────────────────────────────────────── */
  function _injectSeasonBar () {
    const strip = document.getElementById('mob-hud-strip');
    if (!strip) { setTimeout(_injectSeasonBar, 200); return; }
    if (document.getElementById('mhf4-season-bar-wrap')) return;

    const wrap = document.createElement('div');
    wrap.id = 'mhf4-season-bar-wrap';
    const bar = document.createElement('div');
    bar.id = 'mhf4-season-bar';
    wrap.appendChild(bar);
    strip.appendChild(wrap);

    console.log('[mpfix4] Season progress bar injected.');
  }

  function _updateSeasonBar () {
    const bar = document.getElementById('mhf4-season-bar');
    if (!bar || typeof G === 'undefined') return;
    const SEASON_LEN = 28;
    const dayInSeason = ((G.day - 1) % SEASON_LEN) + 1;
    bar.style.width = Math.min(100, Math.round((dayInSeason / SEASON_LEN) * 100)) + '%';
  }

  /* ─────────────────────────────────────────────────────────────────
     SECTION 2 — DECO PICKER
     Mirrors the seed picker pattern from mobilepatch.js v3.0.0.
     Opens when 🎨 Deco is tapped; each option syncs to G.deco and
     the hidden #deco-select so clickTile places the right deco.
  ───────────────────────────────────────────────────────────────── */
  const DECO_TYPES = [
    { value: 'path',      e: '🟫', n: 'Path'      },
    { value: 'fence',     e: '🪵', n: 'Fence'     },
    { value: 'flower',    e: '🌸', n: 'Flowers'   },
    { value: 'lamp',      e: '🏮', n: 'Lamp'      },
    { value: 'sign',      e: '🪧', n: 'Sign'      },
    { value: 'rock',      e: '🪨', n: 'Rock'      },
    { value: 'scarecrow', e: '🧍', n: 'Scarecrow' },
  ];

  let _decoPicker = null;

  function _buildDecoPicker () {
    if (document.getElementById('dock-deco-picker')) {
      _decoPicker = document.getElementById('dock-deco-picker');
      return;
    }
    const picker = document.createElement('div');
    picker.id = 'dock-deco-picker';
    picker.innerHTML = `
      <div id="dock-deco-picker-title">🎨 Choose Decoration</div>
      <div id="dock-deco-list"></div>`;
    document.body.appendChild(picker);
    _decoPicker = picker;
    _refreshDecoPicker();
    console.log('[mpfix4] Deco picker built.');
  }

  function _refreshDecoPicker () {
    const list = document.getElementById('dock-deco-list');
    if (!list) return;
    const cur = (typeof G !== 'undefined' && G.deco) ? G.deco : 'path';
    list.innerHTML = DECO_TYPES.map(d =>
      `<button class="deco-pick-btn${d.value === cur ? ' sel' : ''}" data-deco="${d.value}">
         <span class="dp-em">${d.e}</span>
         <span class="dp-name">${d.n}</span>
       </button>`
    ).join('');
    list.querySelectorAll('.deco-pick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const val = btn.dataset.deco;
        if (typeof G !== 'undefined') G.deco = val;
        /* Sync to the hidden desktop <select> so the game engine
           registers the change exactly as if the user used it.   */
        const sel = document.getElementById('deco-select');
        if (sel) { sel.value = val; sel.dispatchEvent(new Event('change')); }
        list.querySelectorAll('.deco-pick-btn').forEach(b => b.classList.remove('sel'));
        btn.classList.add('sel');
        /* Keep picker open — player may want to swap types mid-session */
      });
    });
  }

  function _openDecoPicker () {
    if (!_decoPicker) _buildDecoPicker();
    _refreshDecoPicker();
    _decoPicker.style.display = 'block';
    void _decoPicker.offsetHeight; // force reflow so transition fires
    _decoPicker.classList.add('picker-open');

    /* Close seed picker if accidentally open */
    const sp = document.getElementById('dock-seed-picker');
    if (sp && sp.classList.contains('picker-open')) {
      sp.classList.remove('picker-open');
      setTimeout(() => {
        if (!sp.classList.contains('picker-open')) sp.style.display = 'none';
      }, 320);
    }
  }

  function _closeDecoPicker () {
    if (!_decoPicker) return;
    _decoPicker.classList.remove('picker-open');
    /* Hide after transition completes */
    setTimeout(() => {
      if (_decoPicker && !_decoPicker.classList.contains('picker-open'))
        _decoPicker.style.display = 'none';
    }, 320);
  }

  /* ── Patch the Deco secondary-dock button ───────────────────────── */
  function _patchDecoButton () {
    const btn = document.getElementById('dock-sec-deco');
    if (!btn) { setTimeout(_patchDecoButton, 150); return; }

    /* Clone removes ALL prior listeners (mobilepatch, mpfix3, etc.)
       so we start with a clean slate.                              */
    const newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);

    newBtn.addEventListener('click', () => {
      if (!isMobile()) {
        if (typeof setTool === 'function') setTool('deco');
        return;
      }
      const decoActive = typeof G !== 'undefined' && G.tool === 'deco';
      if (decoActive) {
        /* Second tap → close picker and revert to Hoe */
        _closeDecoPicker();
        if (typeof setTool === 'function') setTool('hoe');
        /* Close the secondary drawer too */
        const moreBtn = document.getElementById('dock-more');
        if (moreBtn && moreBtn.classList.contains('active')) moreBtn.click();
      } else {
        /* First tap → activate deco tool AND show the picker */
        if (typeof setTool === 'function') setTool('deco');
        _openDecoPicker();
      }
    });

    console.log('[mpfix4] Deco button patched (picker enabled).');
  }

  /* ── Wrap setTool so switching away closes the deco picker ───────── */
  function _hookSetToolCloseDeco () {
    if (typeof window.setTool !== 'function') {
      setTimeout(_hookSetToolCloseDeco, 100);
      return;
    }
    const _prev = window.setTool;
    window.setTool = function (t) {
      _prev.apply(this, arguments);
      if (t !== 'deco') _closeDecoPicker();
    };
    console.log('[mpfix4] setTool hooked to auto-close deco picker.');
  }

  /* ─────────────────────────────────────────────────────────────────
     SECTION 3 — CROP READY BADGE on 🌾 Harvest dock button
  ───────────────────────────────────────────────────────────────── */
  function _injectCropBadge () {
    const btn = document.getElementById('dock-scythe');
    if (!btn) { setTimeout(_injectCropBadge, 200); return; }
    if (document.getElementById('mhf4-crop-badge')) return;
    const badge = document.createElement('span');
    badge.id = 'mhf4-crop-badge';
    btn.style.position = 'relative'; // ensure badge positions relative to button
    btn.appendChild(badge);
    console.log('[mpfix4] Crop ready badge injected.');
  }

  function _countReadyCrops () {
    if (typeof G === 'undefined' || !G.farm) return 0;
    let count = 0;
    for (let r = 0; r < GH; r++) {
      for (let c = 0; c < GW; c++) {
        const tile = G.farm[r] && G.farm[r][c];
        if (tile && tile.crop && typeof cropStage === 'function' && cropStage(tile.crop) === 3)
          count++;
      }
    }
    return count;
  }

  function _updateCropBadge () {
    const badge = document.getElementById('mhf4-crop-badge');
    if (!badge) return;
    const count = _countReadyCrops();
    if (count > 0) {
      const label = count > 9 ? '9+' : String(count);
      if (badge.textContent !== label) {
        badge.textContent = label;
        /* Re-trigger pop animation */
        badge.style.animation = 'none';
        void badge.offsetHeight;
        badge.style.animation = '';
      }
      badge.style.display = 'block';
    } else {
      badge.style.display = 'none';
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     SECTION 4 — LOW-ENERGY SLEEP BUTTON GLOW
  ───────────────────────────────────────────────────────────────── */
  function _updateSleepGlow () {
    const btn = document.getElementById('dock-sleep');
    if (!btn || typeof G === 'undefined') return;
    const maxE = (typeof maxEnergy === 'function') ? maxEnergy() : 100;
    const low  = maxE > 0 && (G.energy / maxE) <= 0.18 && G.energy > 0;
    btn.classList.toggle('mhf4-sleep-warn', low);
  }

  /* ─────────────────────────────────────────────────────────────────
     SECTION 5 — MORNING WEATHER TOAST  (fires after sleep)
  ───────────────────────────────────────────────────────────────── */
  const RAIN_PCT   = { Spring: 28, Summer: 22, Fall: 10, Winter: 0 };
  const SEASON_EM  = { Spring: '🌸', Summer: '☀️', Fall: '🍂', Winter: '❄️' };

  function _morningToast () {
    if (!isMobile() || typeof G === 'undefined' || typeof season !== 'function') return;
    const s   = season();
    const pct = RAIN_PCT[s] ?? 0;
    const em  = SEASON_EM[s] || '🌾';
    /* Use first word of farmer name or fall back to 'Farmer' */
    const name = (G.name ? G.name.split(' ')[0] : 'Farmer');
    const wxStr = pct === 0
      ? 'No rain tonight ☀️'
      : (pct >= 25 ? `🌧️ ${pct}% rain tonight!` : `🌤️ ${pct}% rain tonight`);
    if (typeof toast === 'function') {
      toast(`${em} Good morning, ${name}! Day ${G.day} · ${s} · ${wxStr}`);
    }
  }

  /* ─────────────────────────────────────────────────────────────────
     SECTION 6 — UNWATERED CROPS NUDGE  (fires just before sleep)
  ───────────────────────────────────────────────────────────────── */
  let _nudgeFiredToday = false;

  function _countUnwateredCrops () {
    if (typeof G === 'undefined' || !G.farm) return 0;
    let n = 0;
    for (let r = 0; r < GH; r++) {
      for (let c = 0; c < GW; c++) {
        const t = G.farm[r] && G.farm[r][c];
        if (t && t.tilled && t.crop && !t.watered) n++;
      }
    }
    return n;
  }

  function _hookDoSleep () {
    if (typeof window.doSleep !== 'function') {
      setTimeout(_hookDoSleep, 200);
      return;
    }
    const _prev = window.doSleep;
    window.doSleep = function () {
      /* Pre-sleep nudge (fires synchronously before overnight calc) */
      if (isMobile() && !_nudgeFiredToday) {
        const unwatered = _countUnwateredCrops();
        if (unwatered >= 3 && typeof toast === 'function') {
          _nudgeFiredToday = true;
          toast(`🌵 ${unwatered} crops weren't watered — they'll grow slower overnight!`);
        }
      }

      const ret = _prev.apply(this, arguments);

      /* Post-sleep: reset flag + fire morning briefing */
      _nudgeFiredToday = false;
      setTimeout(() => {
        _morningToast();
        _updateCropBadge();
        _updateSeasonBar();
        _updateSleepGlow();
      }, 950); /* after sleep animation finishes */

      return ret;
    };
    console.log('[mpfix4] doSleep hooked for nudge + morning toast.');
  }

  /* ─────────────────────────────────────────────────────────────────
     SECTION 7 — HOOK renderHUD
     Chain after whatever mpfix3 already chained.
  ───────────────────────────────────────────────────────────────── */
  function _hookRenderHUD () {
    if (typeof window.renderHUD !== 'function') {
      setTimeout(_hookRenderHUD, 100);
      return;
    }
    const _prev = window.renderHUD;
    window.renderHUD = function () {
      _prev.apply(this, arguments);
      if (!isMobile()) return;
      _updateCropBadge();
      _updateSeasonBar();
      _updateSleepGlow();
    };
    console.log('[mpfix4] renderHUD hooked for badge / bar / glow updates.');
  }

  /* ─────────────────────────────────────────────────────────────────
     INIT
  ───────────────────────────────────────────────────────────────── */
  function init () {
    _buildDecoPicker();
    _patchDecoButton();
    _hookSetToolCloseDeco();
    _injectCropBadge();
    _hookDoSleep();
    _hookRenderHUD();

    /* Season bar: wait 650 ms so mpfix3's _rebuildHudStrip (200 ms)
       has definitely fired before we append to the strip.         */
    setTimeout(_injectSeasonBar, 650);

    /* If the game screen is already active when this patch loads late */
    const gs = document.getElementById('game-screen');
    if (gs && gs.classList.contains('active')) {
      document.body.classList.add('in-game');
      setTimeout(() => {
        _updateCropBadge();
        _updateSeasonBar();
        _updateSleepGlow();
      }, 700);
    }

    console.log('[mpfix4 v1.0] ✅ Loaded!\n' +
      '  · Top #hud bar hidden on mobile\n' +
      '  · #mob-hud-strip repositioned to screen TOP\n' +
      '  · 🎨 Deco button now opens a full deco-type picker\n' +
      '  · 🌾 Harvest button shows red crop-ready badge\n' +
      '  · Season progress bar in top strip (Day X/28)\n' +
      '  · Morning weather toast after each sleep\n' +
      '  · Unwatered-crops nudge before sleep (≥3 tiles)\n' +
      '  · 💤 Sleep button glows when energy ≤ 18%');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();


/* ────────────────────── bu1.js ────────────────────── */

/* ═══════════════════════════════════════════════════════
   tbu.js — Merged Patch Bundle
   Generated: 2026-06-06
   Sources:   bigupdate_1_grass.js, bigupdate_2_fertilizer.js, bigupdate_3_jobs.js, bigupdate_4_hoe.js, patch_v3.js
   ═══════════════════════════════════════════════════════ */


/* ──────────────────────── bigupdate_1_grass.js ──────────────────────── */
/* ═══════════════════════════════════════════════════════════════
   BIG UPDATE — Part 1: SEAMLESS GRASS FIELD  v1.0
   Removes the tile-grid look and makes the farm feel like a
   continuous, organic patch of land.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── CSS injection ─────────────────────────────────────────── */
  var style = document.createElement('style');
  style.id = 'bigupdate-grass-css';
  style.textContent = [
    /* Collapse the 3px gap to 0 — tiles become adjacent */
    '#farm-grid { gap: 0 !important; border-radius: 12px; overflow: hidden; }',
    '#farm-wrap { border-radius: 14px; overflow: hidden;',
    '             box-shadow: 0 6px 28px rgba(0,0,0,0.22); }',

    /* Remove borders / rounding from ALL tile types */
    '.tile, .tile-tree {',
    '  border: none !important;',
    '  border-radius: 0 !important;',
    '  box-shadow: none !important;',
    '}',

    /* Hover: keep the brightness lift but drop the scale/border */
    '.tile:hover {',
    '  filter: brightness(1.22) !important;',
    '  transform: none !important;',
    '  z-index: 5;',
    '  box-shadow: inset 0 0 0 2px rgba(255,255,255,0.55) !important;',
    '}',

    /* Grass micro-variations (class applied by JS below) */
    '.gv0 { filter: brightness(1.00) saturate(1.00); }',
    '.gv1 { filter: brightness(0.94) saturate(0.93); }',
    '.gv2 { filter: brightness(1.06) saturate(1.06); }',
    '.gv3 { filter: brightness(0.90) saturate(0.88); }',
    '.gv4 { filter: brightness(1.10) saturate(1.10); }',
    /* hover on varied tiles — override the variation temporarily */
    '.gv0:hover, .gv1:hover, .gv2:hover, .gv3:hover, .gv4:hover {',
    '  filter: brightness(1.22) !important;',
    '}',

    /* Tilled soil — inset shadow makes it look embedded in the ground */
    '.tile[data-tilled="1"] {',
    '  box-shadow: inset 0 3px 7px rgba(0,0,0,0.30),',
    '              inset 0 0 0 1px rgba(0,0,0,0.18) !important;',
    '  border-radius: 2px !important;',
    '}',
    '.tile[data-tilled="1"][data-watered="1"] {',
    '  box-shadow: inset 0 3px 9px rgba(0,0,0,0.42),',
    '              inset 0 0 0 1px rgba(30,10,0,0.28) !important;',
    '}',

    /* Decorated tiles — subtle rounding so decos stand out */
    '.tile[data-deco="1"] {',
    '  border-radius: 4px !important;',
    '  box-shadow: inset 0 0 0 1px rgba(0,0,0,0.10) !important;',
    '}',

    /* Harvest-ready glow — nicer pulse */
    '.tile-ready {',
    '  animation: grassReadyPulse 1.6s ease-in-out infinite !important;',
    '}',
    '@keyframes grassReadyPulse {',
    '  0%,100% { filter: brightness(1.0); }',
    '  50%      { filter: brightness(1.20) drop-shadow(0 0 6px rgba(251,191,36,0.55)); }',
    '}',

    /* Grass deco sprite — subtler so it reads as texture, not icon */
    '.grass-deco {',
    '  opacity: 0.38;',
    '  font-size: 15px;',
    '  filter: saturate(0.65);',
    '  pointer-events: none;',
    '  user-select: none;',
    '}',

    /* Crop emoji transition */
    '.crop-em { transition: transform 0.18s ease; }',
  ].join('\n');
  document.head.appendChild(style);

  /* ── Patch renderFarm ──────────────────────────────────────── */
  function applyGrassPatch() {
    if (typeof window.renderFarm !== 'function') {
      return setTimeout(applyGrassPatch, 150);
    }
    var _orig = window.renderFarm;

    window.renderFarm = function () {
      _orig.apply(this, arguments);

      var grid = document.getElementById('farm-grid');
      if (!grid || typeof G === 'undefined' || !G.farm) return;

      var GW_v  = typeof GW !== 'undefined' ? GW : 14;
      var GH_v  = typeof GH !== 'undefined' ? GH : 10;

      /* Build the set of tree-cell keys for the current land */
      var landTrees = [];
      if (typeof LAND_TREES !== 'undefined' && G.currentLand) {
        landTrees = LAND_TREES[G.currentLand] || LAND_TREES.home || [];
      } else if (typeof TREES !== 'undefined') {
        landTrees = TREES;
      }
      var treeKeys = new Set(landTrees.map(function (t) { return t[0] * 100 + t[1]; }));

      var idx = 0;
      for (var r = 0; r < GH_v; r++) {
        for (var c = 0; c < GW_v; c++) {
          var el   = grid.children[idx++];
          if (!el) continue;
          var tkey = r * 100 + c;

          /* Tree cells — no data attributes needed */
          if (treeKeys.has(tkey)) continue;

          var tile = G.farm[r] && G.farm[r][c];
          if (!tile) continue;

          /* Stamp data attributes so CSS selectors work */
          el.dataset.tilled  = tile.tilled  ? '1' : '0';
          el.dataset.watered = tile.watered ? '1' : '0';
          el.dataset.deco    = tile.deco    ? '1' : '0';

          /* Grass micro-variation — deterministic from position */
          if (!tile.tilled && !tile.deco) {
            var v = (r * 7 + c * 13 + r * c * 3) % 5;
            el.classList.add('gv' + v);
          }
        }
      }
    };

    console.log('[BIG UPDATE 1] Seamless Grass Field patch applied.');
  }

  applyGrassPatch();
})();


/* ──────────────────────── bigupdate_2_fertilizer.js ──────────────────────── */
/* ═══════════════════════════════════════════════════════════════
   BIG UPDATE — Part 2: FERTILIZER SYSTEM  v1.0
   Adds four fertilizer types buyable from the Shop (Town Supply).
   Apply to tilled soil with the 🌿 Fert tool — each type gives
   a different bonus: extra growth, speed, or bonus harvest yield.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Fertilizer definitions ─────────────────────────────────── */
  var FERTILIZERS = {
    basic:    { n:'Basic Fertilizer', e:'🌿', cost:50,
                desc:'+1 extra growth per watered day',
                growBonus:1, yieldBonus:0, speedMult:0 },
    compost:  { n:'Rich Compost',     e:'🪱', cost:120,
                desc:'+2 extra growth per watered day',
                growBonus:2, yieldBonus:0, speedMult:0 },
    speedgrow:{ n:'Speed Grow',       e:'⚡', cost:200,
                desc:'Crops advance 2× on every watered day',
                growBonus:0, yieldBonus:0, speedMult:1 },
    mega:     { n:'Mega Fertilizer',  e:'💎', cost:350,
                desc:'+35% bonus yield chance on harvest',
                growBonus:0, yieldBonus:0.35, speedMult:0 },
  };

  /* Expose so other patches can read it */
  window.FERTILIZERS = FERTILIZERS;

  /* ── CSS ────────────────────────────────────────────────────── */
  var css = document.createElement('style');
  css.textContent = [
    /* Badge icon on fertilized tiles */
    '.fert-badge {',
    '  position:absolute; bottom:2px; right:2px;',
    '  font-size:10px; line-height:1; opacity:0.88;',
    '  pointer-events:none; user-select:none; z-index:4;',
    '  text-shadow:0 1px 2px rgba(0,0,0,0.5);',
    '}',
    /* Shop fertilizer card accent */
    '.fert-card { border-left:3px solid #16a34a !important; }',
    '.fert-card:hover { border-color:#22c55e !important; }',
  ].join('\n');
  document.head.appendChild(css);

  /* ── State helpers ──────────────────────────────────────────── */
  function ensureFertInv() {
    if (typeof G !== 'undefined' && !G.fertilizers) G.fertilizers = {};
  }

  /* ── Patch initState ────────────────────────────────────────── */
  var _waitInit = setInterval(function () {
    if (typeof window.initState !== 'function') return;
    clearInterval(_waitInit);
    var _orig = window.initState;
    window.initState = function () {
      _orig.apply(this, arguments);
      if (G) G.fertilizers = {};
    };
  }, 100);

  /* ── Patch loadState ────────────────────────────────────────── */
  var _waitLoad = setInterval(function () {
    if (typeof window.loadState !== 'function') return;
    clearInterval(_waitLoad);
    var _orig = window.loadState;
    window.loadState = function (s) {
      _orig.apply(this, arguments);
      if (G && !G.fertilizers) G.fertilizers = {};
    };
  }, 100);

  /* ── Buy fertilizer (called by event binding in renderSide) ─── */
  window.buyFertilizer = function (id, qty) {
    var f = FERTILIZERS[id];
    if (!f) return;
    ensureFertInv();
    var cost = f.cost * qty;
    if (G.gold < cost) {
      if (typeof toast === 'function') toast('Need ' + cost + 'g! 💸', 'error');
      if (typeof snd  === 'function') snd('error');
      return;
    }
    G.gold -= cost;
    G.fertilizers[id] = (G.fertilizers[id] || 0) + qty;
    if (typeof snd   === 'function') snd('buy');
    if (typeof toast === 'function') toast('Bought ×' + qty + ' ' + f.n + '! ' + f.e, 'success');
    if (typeof render === 'function') render();
  };

  /* ── Fertilizer section HTML ────────────────────────────────── */
  function buildFertSection() {
    ensureFertInv();
    var h = '<div class="s-sec">🌿 Fertilizers <span style="font-size:9px;font-weight:400;opacity:.6">(Town Supply)</span></div>';
    h += '<div style="font-size:10px;color:var(--text-muted);margin:-4px 0 7px;padding:0 2px">Select the 🌿 Fert tool then tap tilled soil to apply. Effects last until harvest.</div>';
    Object.entries(FERTILIZERS).forEach(function (_ref) {
      var id = _ref[0], f = _ref[1];
      var have    = (G.fertilizers && G.fertilizers[id]) || 0;
      var cost1   = f.cost;
      var cost3   = f.cost * 3;
      var canBuy1 = G && G.gold >= cost1;
      var canBuy3 = G && G.gold >= cost3;
      h += '<div class="shop-card fert-card">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">';
      h += '<span class="shop-name">' + f.e + ' ' + f.n + '</span>';
      h += '<span class="shop-price">' + cost1 + 'g each</span></div>';
      h += '<div class="shop-meta">' + f.desc + ' &nbsp;·&nbsp; Have: ' + have + '</div>';
      h += '<div class="shop-row">';
      h += '<button class="buy-btn" data-buy-fert="' + id + '" data-qty="1" ' + (canBuy1 ? '' : 'disabled') + '>×1 (' + cost1 + 'g)</button>';
      h += '<button class="buy-btn" data-buy-fert="' + id + '" data-qty="3" ' + (canBuy3 ? '' : 'disabled') + '>×3 (' + cost3 + 'g)</button>';
      h += '</div></div>';
    });
    return h;
  }

  /* ── Patch buildShop to add fertilizer section ──────────────── */
  var _waitShop = setInterval(function () {
    if (typeof window.buildShop !== 'function') return;
    clearInterval(_waitShop);
    var _orig = window.buildShop;
    window.buildShop = function () {
      var base = _orig.apply(this, arguments);
      /* Skip in winter — base already returns the auction screen */
      if (typeof season === 'function' && season() === 'Winter') return base;
      return base + buildFertSection();
    };
  }, 100);

  /* ── Patch renderSide to bind fertilizer buy buttons ────────── */
  var _waitRS = setInterval(function () {
    if (typeof window.renderSide !== 'function') return;
    clearInterval(_waitRS);
    var _origRS = window.renderSide;
    window.renderSide = function () {
      _origRS.apply(this, arguments);
      ['side-content', 'sheet-content'].forEach(function (panelId) {
        var el = document.getElementById(panelId);
        if (!el) return;
        el.querySelectorAll('[data-buy-fert]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            window.buyFertilizer(btn.dataset.buyFert, +btn.dataset.qty || 1);
          });
        });
      });
      updateFertSel();
    };
  }, 100);

  /* ── Fertilize tool button + select ─────────────────────────── */
  function injectFertTool() {
    if (document.getElementById('tool-fert')) return; // already injected
    var seedBtn = document.getElementById('tool-seed');
    if (!seedBtn) return;

    var btn = document.createElement('button');
    btn.className = 'tool-btn';
    btn.id = 'tool-fert';
    btn.title = 'Apply Fertilizer to tilled soil';
    btn.textContent = '🌿 Fert';
    btn.addEventListener('click', function () {
      if (typeof setTool === 'function') setTool('fert');
    });
    seedBtn.insertAdjacentElement('afterend', btn);

    var sel = document.createElement('select');
    sel.id = 'fert-select';
    sel.style.cssText = 'display:none;font-size:11px;padding:4px 7px;border-radius:8px;border:1.5px solid var(--ui-border);background:var(--ui-bg);color:var(--text-primary);font-family:Nunito,sans-serif;font-weight:700';
    sel.addEventListener('change', function () {
      if (typeof G !== 'undefined') G.selectedFert = sel.value;
    });
    btn.insertAdjacentElement('afterend', sel);
    updateFertSel();
  }

  function updateFertSel() {
    var sel = document.getElementById('fert-select');
    if (!sel || typeof G === 'undefined') return;
    ensureFertInv();
    sel.innerHTML = Object.entries(FERTILIZERS).map(function (_ref2) {
      var id = _ref2[0], f = _ref2[1];
      var have = (G.fertilizers && G.fertilizers[id]) || 0;
      return '<option value="' + id + '" ' + (have > 0 ? '' : 'disabled') + '>' +
             f.e + ' ' + f.n + ' (×' + have + ')</option>';
    }).join('');
    /* Prefer current selection; fall back to first available */
    var avail = Object.keys(FERTILIZERS).find(function (id) { return (G.fertilizers[id] || 0) > 0; });
    if (G.selectedFert && (G.fertilizers[G.selectedFert] || 0) > 0) {
      sel.value = G.selectedFert;
    } else if (avail) {
      G.selectedFert = avail; sel.value = avail;
    }
    sel.style.display = (G.tool === 'fert') ? 'inline-block' : 'none';
  }

  /* ── Patch setTool for fert visibility ──────────────────────── */
  var _waitST = setInterval(function () {
    if (typeof window.setTool !== 'function') return;
    clearInterval(_waitST);
    var _orig = window.setTool;
    window.setTool = function (t) {
      _orig.apply(this, arguments);
      var fertBtn = document.getElementById('tool-fert');
      if (fertBtn) fertBtn.classList.toggle('active', t === 'fert');
      var fertSel = document.getElementById('fert-select');
      if (fertSel) fertSel.style.display = (t === 'fert') ? 'inline-block' : 'none';
      if (t === 'fert') updateFertSel();
    };
  }, 100);

  /* ── Patch clickTile — handle 'fert' tool ───────────────────── */
  var _waitCT = setInterval(function () {
    if (typeof window.clickTile !== 'function') return;
    clearInterval(_waitCT);
    var _origCT = window.clickTile;
    window.clickTile = function (r, c) {
      if (typeof G === 'undefined' || G.tool !== 'fert') {
        return _origCT.apply(this, arguments);
      }
      if (G.energy <= 0) {
        if (typeof toast === 'function') toast('Too tired! 😴 Sleep to restore energy.', 'error');
        return;
      }
      var tile = G.farm[r][c];
      if (!tile.tilled) {
        if (typeof toast === 'function') toast('Till the soil first!', 'warn', 1200);
        return;
      }
      ensureFertInv();
      var fertId = (G.selectedFert && (G.fertilizers[G.selectedFert] || 0) > 0)
                  ? G.selectedFert : null;
      if (!fertId) {
        if (typeof toast === 'function') toast('No fertilizer! Buy some from the Shop tab. 🌿', 'warn');
        return;
      }
      if (tile.fertilizer) {
        var existing = FERTILIZERS[tile.fertilizer];
        if (typeof toast === 'function')
          toast('Already fertilized (' + (existing ? existing.n : tile.fertilizer) + ')!', 'info', 1200);
        return;
      }
      G.fertilizers[fertId]--;
      if (!G.fertilizers[fertId]) delete G.fertilizers[fertId];
      G.farm[r][c] = Object.assign({}, tile, { fertilizer: fertId });
      if (typeof S !== 'undefined' && S.energyCost) G.energy = Math.max(0, G.energy - 1);
      if (typeof snd   === 'function') snd('place');
      if (typeof toast === 'function')
        toast(FERTILIZERS[fertId].e + ' ' + FERTILIZERS[fertId].n + ' applied! 🌿', 'success', 1400);
      updateFertSel();
      if (typeof render === 'function') render();
    };
  }, 100);

  /* ── Patch advanceFarmGrid — fertilizer growth bonuses ──────── */
  var _waitAFG = setInterval(function () {
    if (typeof window.advanceFarmGrid !== 'function') return;
    clearInterval(_waitAFG);
    var _origAFG = window.advanceFarmGrid;
    window.advanceFarmGrid = function (farm, hasGreenhouse, hasSprinkler) {
      var result = _origAFG.apply(this, arguments);
      /* Apply fertilizer-specific growth boosts */
      for (var r = 0; r < result.length; r++) {
        for (var c = 0; c < result[r].length; c++) {
          var origTile = farm[r] && farm[r][c];
          var newTile  = result[r] && result[r][c];
          if (!origTile || !newTile || !origTile.fertilizer) continue;
          if (!newTile.crop) continue; /* crop died / wrong season */
          var f = FERTILIZERS[origTile.fertilizer];
          if (!f) continue;
          /* Carry fertilizer forward (it stays until crop is harvested) */
          newTile.fertilizer = origTile.fertilizer;
          /* Only apply bonus on days the crop was watered */
          if (!origTile.watered) continue;
          var maxDays = (typeof CROPS !== 'undefined' && CROPS[newTile.crop.type])
                        ? CROPS[newTile.crop.type].days : 999;
          /* Extra grow progress per watered day */
          if (f.growBonus > 0) {
            newTile.crop.days = Math.min(maxDays, (newTile.crop.days || 0) + f.growBonus);
          }
          /* Speed-grow: one extra advance (net ×2 progress per day) */
          if (f.speedMult > 0) {
            newTile.crop.days = Math.min(maxDays, (newTile.crop.days || 0) + 1);
          }
        }
      }
      return result;
    };
  }, 100);

  /* ── Patch clickTile scythe branch — mega fertilizer yield ──── */
  /* We hook addXP indirectly: after harvest, if tile had mega fert
     we give an extra item to the bag. We do this by wrapping the
     scythe outcome inside clickTile (already wrapped above). */
  var _waitScythe = setInterval(function () {
    if (typeof window.scytheAll !== 'function') return;
    clearInterval(_waitScythe);
    var _origSA = window.scytheAll;
    window.scytheAll = function () {
      /* Before bulk harvest, credit mega-fert bonus items */
      if (typeof G !== 'undefined' && G.farm) {
        G.farm.forEach(function (row) {
          row.forEach(function (tile) {
            if (!tile.crop || !tile.fertilizer) return;
            var f = FERTILIZERS[tile.fertilizer];
            if (!f || !f.yieldBonus) return;
            if (Math.random() < f.yieldBonus) {
              tile._megaBonus = true;
            }
          });
        });
      }
      _origSA.apply(this, arguments);
    };
  }, 100);

  /* ── Patch renderFarm — show fertilizer badge on tiles ──────── */
  var _waitRF = setInterval(function () {
    if (typeof window.renderFarm !== 'function') return;
    clearInterval(_waitRF);
    var _origRF = window.renderFarm;
    window.renderFarm = function () {
      _origRF.apply(this, arguments);
      var grid = document.getElementById('farm-grid');
      if (!grid || typeof G === 'undefined' || !G.farm) return;
      var GW_v = typeof GW !== 'undefined' ? GW : 14;
      var GH_v = typeof GH !== 'undefined' ? GH : 10;
      var landTrees = [];
      if (typeof LAND_TREES !== 'undefined' && G.currentLand) {
        landTrees = LAND_TREES[G.currentLand] || LAND_TREES.home || [];
      }
      var treeKeys = new Set(landTrees.map(function (t) { return t[0] * 100 + t[1]; }));
      var idx = 0;
      for (var r = 0; r < GH_v; r++) {
        for (var c = 0; c < GW_v; c++) {
          var el = grid.children[idx++];
          if (!el) continue;
          if (treeKeys.has(r * 100 + c)) continue;
          var tile = G.farm[r] && G.farm[r][c];
          if (!tile || !tile.fertilizer) continue;
          var f = FERTILIZERS[tile.fertilizer];
          if (!f) continue;
          var badge = document.createElement('span');
          badge.className = 'fert-badge';
          badge.textContent = f.e;
          badge.title = f.n + ' applied';
          el.appendChild(badge);
        }
      }
    };
  }, 100);

  /* ── Inject tool button once toolbar is in DOM ──────────────── */
  var _toolInt = setInterval(function () {
    if (document.getElementById('toolbar')) {
      injectFertTool();
      clearInterval(_toolInt);
    }
  }, 200);

  console.log('[BIG UPDATE 2] Fertilizer System loaded.');
})();


/* ──────────────────────── bigupdate_3_jobs.js ──────────────────────── */
/* ═══════════════════════════════════════════════════════════════
   BIG UPDATE — Part 3: JOBS SYSTEM  v1.0
   Adds a Jobs Board to the Shop tab.  Take one job at a time —
   each grants daily income and a special perk.

   Jobs:
    👷 Construction Worker  — free to hire
         Perk:  Unlocks "⚒ Till Field" button — tills the entire
                farm in one click (costs 15 energy).
         Pay:   +40g / day

    🚚 Delivery Driver       — free to hire
         Perk:  +12% bonus on every Ship-All or auction sale.
         Pay:   +35g / day

    🌱 Apprentice Gardener   — free to hire
         Perk:  +20% XP on all farming/watering/harvesting actions.
         Pay:   +20g / day

    🔭 Field Scout           — costs 80g to hire
         Perk:  Shows tomorrow's weather forecast each morning.
         Pay:   +55g / day (premium position)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Job definitions ─────────────────────────────────────────── */
  var JOBS = {
    construction: {
      id:'construction', e:'👷', n:'Construction Worker',
      desc:'Hire yourself out as a construction worker. Unlocks the "Till Field" button — tills every untilled grass tile on this farm in one click.',
      perks:['⚒ Till entire field in one click','40g daily wage'],
      dailyPay:40, hireCost:0,
      perkTag:'⚒ Till Field Unlocked',
    },
    driver: {
      id:'driver', e:'🚚', n:'Delivery Driver',
      desc:'Work as a produce delivery driver between seasons. All your crop shipments and auction sales earn +12% more gold.',
      perks:['+12% on all crop sales','35g daily wage'],
      dailyPay:35, hireCost:0,
      perkTag:'📦 +12% Sales Bonus Active',
    },
    gardener: {
      id:'gardener', e:'🌱', n:'Apprentice Gardener',
      desc:'Part-time job at the community garden. You gain +20% XP from tilling, watering, and harvesting on your own farm.',
      perks:['+20% XP from all farm actions','20g daily wage'],
      dailyPay:20, hireCost:0,
      perkTag:'⭐ +20% XP Active',
    },
    scout: {
      id:'scout', e:'🔭', n:'Field Scout',
      desc:'Scout terrain and forecast weather for local farms. Requires an 80g equipment fee. Shows tomorrow\'s weather each morning.',
      perks:['🌤 Tomorrow\'s weather revealed each morning','55g daily wage'],
      dailyPay:55, hireCost:80,
      perkTag:'🌤 Weather Forecast Active',
    },
  };

  /* Expose globally */
  window.JOBS = JOBS;

  /* ── CSS ─────────────────────────────────────────────────────── */
  var css = document.createElement('style');
  css.textContent = [
    '.job-card {',
    '  padding:10px 12px; background:var(--ui-bg2);',
    '  border:1.5px solid var(--ui-border); border-radius:13px;',
    '  margin-bottom:8px; transition:border-color .15s;',
    '}',
    '.job-card:hover { border-color:#86efac; }',
    '.job-card-active { border-color:#22c55e !important;',
    '  background:linear-gradient(135deg,rgba(34,197,94,.06),rgba(34,197,94,.02)) !important; }',
    '.job-title { font-size:13px; font-weight:800; color:var(--text-primary); }',
    '.job-pay   { font-size:11px; color:#16a34a; font-weight:700; }',
    '.job-desc  { font-size:10.5px; color:var(--text-muted); margin:4px 0 6px; line-height:1.5; }',
    '.job-perks { font-size:10px; color:var(--green); font-weight:700; margin-bottom:6px; }',
    '.job-perk-item::before { content:"✓ "; }',
    '.job-btn-row { display:flex; gap:5px; }',
    '.job-hire-btn {',
    '  flex:1; padding:7px 10px; border:none; border-radius:9px;',
    '  background:linear-gradient(135deg,#22c55e,#16a34a); color:#fff;',
    '  font-family:Nunito,sans-serif; font-size:11px; font-weight:800;',
    '  cursor:pointer; transition:opacity .15s;',
    '}',
    '.job-hire-btn:disabled { opacity:.4; cursor:not-allowed; }',
    '.job-hire-btn:not(:disabled):hover { opacity:.85; }',
    '.job-quit-btn {',
    '  padding:7px 10px; border:1.5px solid #ef4444; border-radius:9px;',
    '  background:transparent; color:#ef4444; font-family:Nunito,sans-serif;',
    '  font-size:11px; font-weight:800; cursor:pointer; transition:all .15s;',
    '}',
    '.job-quit-btn:hover { background:rgba(239,68,68,.1); }',
    '.job-active-badge {',
    '  display:inline-block; padding:2px 8px; border-radius:20px;',
    '  background:rgba(34,197,94,.12); color:#16a34a; font-size:10px; font-weight:800;',
    '  border:1px solid rgba(34,197,94,.3); margin-bottom:6px;',
    '}',
    /* Till Field toolbar button */
    '#tool-tillall {',
    '  background:linear-gradient(135deg,#d97706,#b45309) !important;',
    '  color:#fff !important; border-color:#b45309 !important;',
    '  font-weight:800 !important;',
    '}',
    '#tool-tillall:hover { opacity:.88; }',
    /* Job status pill in the job card */
    '.job-income-note {',
    '  font-size:9.5px; color:var(--text-muted); margin-top:4px; font-style:italic;',
    '}',
  ].join('\n');
  document.head.appendChild(css);

  /* ── State helpers ───────────────────────────────────────────── */
  function ensureJob() {
    if (typeof G !== 'undefined' && G.job === undefined) G.job = null;
  }

  /* ── Patch initState ─────────────────────────────────────────── */
  var _wI = setInterval(function () {
    if (typeof window.initState !== 'function') return;
    clearInterval(_wI);
    var _o = window.initState;
    window.initState = function () { _o.apply(this, arguments); if (G) G.job = null; };
  }, 100);

  /* ── Patch loadState ─────────────────────────────────────────── */
  var _wL = setInterval(function () {
    if (typeof window.loadState !== 'function') return;
    clearInterval(_wL);
    var _o = window.loadState;
    window.loadState = function (s) {
      _o.apply(this, arguments);
      if (G && G.job === undefined) G.job = null;
    };
  }, 100);

  /* ── Hire / quit ─────────────────────────────────────────────── */
  window.hireJob = function (id) {
    var job = JOBS[id];
    if (!job) return;
    ensureJob();
    if (G.job === id) { if (typeof toast === 'function') toast('You already have this job!', 'warn'); return; }
    if (G.gold < job.hireCost) {
      if (typeof toast === 'function') toast('Need ' + job.hireCost + 'g to take this job!', 'error');
      if (typeof snd === 'function') snd('error');
      return;
    }
    if (G.job !== null) {
      /* Auto-quit old job */
      var oldJob = JOBS[G.job];
      if (typeof toast === 'function' && oldJob)
        toast('Quit your ' + oldJob.n + ' job.', 'info', 2000);
    }
    G.gold -= job.hireCost;
    G.job = id;
    if (typeof snd   === 'function') snd('buy');
    if (typeof toast === 'function')
      toast(job.e + ' You\'re now a ' + job.n + '! ' + job.perkTag, 'success', 3500);
    updateTillAllBtn();
    if (typeof render === 'function') render();
  };

  window.quitJob = function () {
    ensureJob();
    if (!G.job) { if (typeof toast === 'function') toast('No job to quit!', 'info'); return; }
    var job = JOBS[G.job];
    G.job = null;
    if (typeof toast === 'function' && job)
      toast('You quit your ' + job.n + ' job. Good luck out there!', 'info', 2800);
    updateTillAllBtn();
    if (typeof render === 'function') render();
  };

  /* ── Jobs Board HTML ─────────────────────────────────────────── */
  function buildJobsSection() {
    ensureJob();
    var curJob  = G.job;
    var h = '<div class="s-sec">💼 Jobs Board</div>';
    h += '<div style="font-size:10px;color:var(--text-muted);margin:-4px 0 7px;padding:0 2px">';
    h += 'Hold one job at a time. Daily pay arrives every morning with your sleep. Perks are active immediately.</div>';

    if (curJob) {
      var cj = JOBS[curJob];
      h += '<div style="padding:7px 10px;background:rgba(34,197,94,.08);border:1.5px solid rgba(34,197,94,.3);border-radius:10px;font-size:11px;font-weight:700;color:#16a34a;margin-bottom:8px">';
      h += cj.e + ' Currently employed as: <b>' + cj.n + '</b>';
      h += '<br><span style="font-weight:400;font-size:10px;color:var(--text-muted)">+' + cj.dailyPay + 'g/day · ' + cj.perkTag + '</span>';
      h += '</div>';
    }

    Object.values(JOBS).forEach(function (job) {
      var isActive  = (curJob === job.id);
      var canAfford = G && G.gold >= job.hireCost;
      h += '<div class="job-card' + (isActive ? ' job-card-active' : '') + '">';
      h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px">';
      h += '<span class="job-title">' + job.e + ' ' + job.n + '</span>';
      h += '<span class="job-pay">+' + job.dailyPay + 'g/day</span>';
      h += '</div>';
      if (isActive) h += '<span class="job-active-badge">✓ Active Job</span><br>';
      h += '<div class="job-desc">' + job.desc + '</div>';
      h += '<div class="job-perks">';
      job.perks.forEach(function (p) {
        h += '<div class="job-perk-item">' + p + '</div>';
      });
      h += '</div>';
      if (job.hireCost > 0 && !isActive) {
        h += '<div class="job-income-note">Hire fee: ' + job.hireCost + 'g (equipment cost)</div>';
      }
      h += '<div class="job-btn-row">';
      if (isActive) {
        h += '<button class="job-quit-btn" onclick="quitJob()">Quit Job</button>';
      } else {
        h += '<button class="job-hire-btn" data-hire-job="' + job.id + '"' + (canAfford ? '' : ' disabled') + '>';
        h += (job.hireCost > 0 ? 'Hire (' + job.hireCost + 'g)' : 'Take Job — Free') + '</button>';
      }
      h += '</div>';
      h += '</div>';
    });
    return h;
  }

  /* ── Patch buildShop ─────────────────────────────────────────── */
  var _wS = setInterval(function () {
    if (typeof window.buildShop !== 'function') return;
    clearInterval(_wS);
    var _o = window.buildShop;
    window.buildShop = function () {
      return _o.apply(this, arguments) + buildJobsSection();
    };
  }, 100);

  /* ── Bind job hire buttons in renderSide ─────────────────────── */
  var _wRS = setInterval(function () {
    if (typeof window.renderSide !== 'function') return;
    clearInterval(_wRS);
    var _o = window.renderSide;
    window.renderSide = function () {
      _o.apply(this, arguments);
      ['side-content', 'sheet-content'].forEach(function (panelId) {
        var el = document.getElementById(panelId);
        if (!el) return;
        el.querySelectorAll('[data-hire-job]').forEach(function (btn) {
          btn.addEventListener('click', function () { window.hireJob(btn.dataset.hireJob); });
        });
      });
    };
  }, 100);

  /* ── Patch doSleep — award daily job pay ─────────────────────── */
  var _wSleep = setInterval(function () {
    if (typeof window.doSleep !== 'function') return;
    clearInterval(_wSleep);
    var _o = window.doSleep;
    window.doSleep = function () {
      ensureJob();
      /* Inject job pay into the morning-message queue after base sleep */
      var ret = _o.apply(this, arguments);
      if (G.job) {
        var job = JOBS[G.job];
        if (job) {
          /* Pay is credited by patching advanceDay, but we show the toast here */
          setTimeout(function () {
            if (typeof toast === 'function')
              toast(job.e + ' Job pay: +' + job.dailyPay + 'g (' + job.n + ')', 'success', 2800);
          }, 2800);
        }
      }
      return ret;
    };
  }, 100);

  /* ── Patch advanceDay — actually add the gold ────────────────── */
  var _wAD = setInterval(function () {
    if (typeof window.advanceDay !== 'function') return;
    clearInterval(_wAD);
    var _o = window.advanceDay;
    window.advanceDay = function () {
      _o.apply(this, arguments);
      ensureJob();
      if (G.job) {
        var job = JOBS[G.job];
        if (job) {
          G.gold += job.dailyPay;
          G.stats.earned = (G.stats.earned || 0) + job.dailyPay;
        }
        /* Field Scout: reveal weather forecast */
        if (G.job === 'scout') {
          var rainChance = {Spring:0.28,Summer:0.22,Fall:0.10,Winter:0}[
            typeof season === 'function' ? season() : 'Spring'] || 0.22;
          var likelyRain = Math.random() < rainChance;
          G._scoutForecast = likelyRain ? 'rainy' : 'sunny';
        }
      }
    };
  }, 100);

  /* ── Patch shipAll and auction for Delivery Driver bonus ──────── */
  var _wShip = setInterval(function () {
    if (typeof window.shipAll !== 'function' || typeof window.auctionSell !== 'function') return;
    clearInterval(_wShip);

    /* shipAll bonus */
    var _oShip = window.shipAll;
    window.shipAll = function () {
      _oShip.apply(this, arguments);
      ensureJob();
      if (G.job === 'driver' && G.pending > 0) {
        var bonus = Math.round(G.pending * 0.12);
        G.pending += bonus;
        if (typeof toast === 'function')
          setTimeout(function () { toast('🚚 Driver bonus: +' + bonus + 'g on shipping!', 'success', 2200); }, 400);
      }
    };

    /* auctionSell bonus */
    var _oAuct = window.auctionSell;
    window.auctionSell = function (type, qty) {
      ensureJob();
      if (G.job !== 'driver') { _oAuct.apply(this, arguments); return; }
      /* Call original, then add 12% on top */
      var goldBefore = G.gold;
      _oAuct.apply(this, arguments);
      var earned = G.gold - goldBefore;
      if (earned > 0) {
        var bonus = Math.round(earned * 0.12);
        G.gold += bonus;
        G.stats.earned = (G.stats.earned || 0) + bonus;
        if (typeof toast === 'function')
          setTimeout(function () { toast('🚚 Driver bonus: +' + bonus + 'g!', 'success', 1800); }, 400);
      }
    };
  }, 100);

  /* ── Patch addXP for Gardener +20% bonus ─────────────────────── */
  var _wXP = setInterval(function () {
    if (typeof window.addXP !== 'function') return;
    clearInterval(_wXP);
    var _o = window.addXP;
    window.addXP = function (skill, amount) {
      ensureJob();
      var finalAmount = amount;
      if (G.job === 'gardener') {
        finalAmount = Math.round(amount * 1.20);
      }
      _o.call(this, skill, finalAmount);
    };
  }, 100);

  /* ── Construction Worker: "Till Field" button ────────────────── */
  function tillEntireField() {
    ensureJob();
    if (G.job !== 'construction') {
      if (typeof toast === 'function') toast('You need to be a Construction Worker!', 'warn'); return;
    }
    if (G.energy < 15) {
      if (typeof toast === 'function') toast('Not enough energy! Need 15 energy.', 'error');
      if (typeof snd === 'function') snd('error');
      return;
    }
    var GW_v = typeof GW !== 'undefined' ? GW : 14;
    var GH_v = typeof GH !== 'undefined' ? GH : 10;
    var landTrees = [];
    if (typeof LAND_TREES !== 'undefined' && G.currentLand) {
      landTrees = LAND_TREES[G.currentLand] || LAND_TREES.home || [];
    }
    var treeKeys = new Set(landTrees.map(function (t) { return t[0] * 100 + t[1]; }));
    var fLv = typeof getLevel === 'function' ? getLevel((G.skills && G.skills.farming && G.skills.farming.xp) || 0) : 1;
    var count = 0;
    for (var r = 0; r < GH_v; r++) {
      for (var c = 0; c < GW_v; c++) {
        if (treeKeys.has(r * 100 + c)) continue;
        var tile = G.farm[r][c];
        if (tile.tilled || tile.deco || tile.crop) continue;
        var newTile = Object.assign({}, tile, { tilled: true, idleDays: 0, deco: null });
        if (fLv >= 10) newTile.watered = true;
        G.farm[r][c] = newTile;
        count++;
      }
    }
    if (count === 0) {
      if (typeof toast === 'function') toast('All tillable soil is already tilled!', 'info'); return;
    }
    if (typeof S !== 'undefined' && S.energyCost) G.energy = Math.max(0, G.energy - 15);
    if (typeof addXP === 'function') addXP('farming', Math.round(count * 2.5));
    if (typeof snd   === 'function') snd('till');
    if (typeof toast === 'function')
      toast('👷 Tilled ' + count + ' tiles! Great work! ⛏', 'success', 2400);
    if (typeof render === 'function') render();
  }
  window.tillEntireField = tillEntireField;

  function updateTillAllBtn() {
    var btn = document.getElementById('tool-tillall');
    if (!btn) return;
    ensureJob();
    btn.style.display = (G.job === 'construction') ? 'inline-flex' : 'none';
  }

  function injectTillAllBtn() {
    if (document.getElementById('tool-tillall')) return;
    var scytheBtn = document.getElementById('tool-scythe');
    if (!scytheBtn) return;
    var btn = document.createElement('button');
    btn.className = 'tool-btn';
    btn.id = 'tool-tillall';
    btn.title = 'Construction Worker: Till entire farm in one go';
    btn.textContent = '⚒ Till Field';
    btn.style.display = 'none';
    btn.addEventListener('click', tillEntireField);
    scytheBtn.insertAdjacentElement('afterend', btn);
  }

  /* ── Patch render — sync Till Field button visibility ─────────── */
  var _wR = setInterval(function () {
    if (typeof window.render !== 'function') return;
    clearInterval(_wR);
    var _o = window.render;
    window.render = function () {
      _o.apply(this, arguments);
      updateTillAllBtn();
      /* Scout forecast pill in HUD */
      if (G.job === 'scout' && G._scoutForecast) {
        var hud = document.getElementById('hud-weather');
        if (hud && hud.parentElement) {
          var pip = hud.parentElement.querySelector('.scout-tomorrow');
          if (!pip) {
            pip = document.createElement('span');
            pip.className = 'scout-tomorrow';
            pip.style.cssText = 'font-size:9px;opacity:.7;margin-left:3px;';
            hud.parentElement.appendChild(pip);
          }
          pip.textContent = '→' + (G._scoutForecast === 'rainy' ? '🌧' : '☀️');
          pip.title = 'Scout forecast: tomorrow will be ' + G._scoutForecast;
        }
      }
    };
  }, 100);

  /* ── Inject button once DOM is ready ────────────────────────── */
  var _tbInt = setInterval(function () {
    if (document.getElementById('toolbar')) {
      injectTillAllBtn();
      clearInterval(_tbInt);
    }
  }, 200);

  console.log('[BIG UPDATE 3] Jobs System loaded.');
})();


/* ──────────────────────── bigupdate_4_hoe.js ──────────────────────── */
/* ═══════════════════════════════════════════════════════════════
   BIG UPDATE — Part 4: HOE AREA UPGRADES  v1.0
   Adds two upgrades to the Upgrades tab that increase the hoe's
   tilling area.

   ⚒️  Iron Hoe Head  (1,200g) — Hoe tills a 3×3 area per swing.
   🔩  Steel Hoe Head (2,500g) — Hoe tills a 4×4 area per swing.
                                   Requires Iron Hoe Head first.

   Both upgrades are per-land (like all other upgrades) so you
   need to buy them separately for each plot you own.
   A subtle preview box appears when hovering over the farm grid
   while the Hoe tool is active.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Register upgrades into the game's UPGRADES object ──────── */
  /* UPGRADES is declared with `const` in script.js but it is an
     object, so adding properties is legal.                        */
  var _waitUpgrades = setInterval(function () {
    if (typeof UPGRADES === 'undefined') return;
    clearInterval(_waitUpgrades);

    UPGRADES.hoe_3x3 = {
      n:'Iron Hoe Head', e:'⚒️',
      desc:'Hoe tills a 3×3 patch of soil in one swing. Dramatically speeds up field preparation!',
      cost:1200, max:1,
    };
    UPGRADES.hoe_4x4 = {
      n:'Steel Hoe Head', e:'🔩',
      desc:'Upgrade to a massive 4×4 tilling area. One swing clears 16 tiles! Requires the Iron Hoe Head.',
      cost:2500, max:1,
    };

    console.log('[BIG UPDATE 4] Hoe upgrades registered in UPGRADES.');
  }, 100);

  /* ── Prerequisite check — block hoe_4x4 without hoe_3x3 ──────── */
  var _waitBU = setInterval(function () {
    if (typeof window.buyUpgrade !== 'function') return;
    clearInterval(_waitBU);
    var _orig = window.buyUpgrade;
    window.buyUpgrade = function (id) {
      if (id === 'hoe_4x4') {
        var upgs = typeof curUpgs === 'function' ? curUpgs() : {};
        if (!(upgs.hoe_3x3 >= 1)) {
          if (typeof toast === 'function')
            toast('🔒 Buy the Iron Hoe Head (3×3) first!', 'warn', 2800);
          if (typeof snd === 'function') snd('error');
          return;
        }
      }
      _orig.apply(this, arguments);
    };
    console.log('[BIG UPDATE 4] buyUpgrade prerequisite check applied.');
  }, 100);

  /* ── CSS ─────────────────────────────────────────────────────── */
  var css = document.createElement('style');
  css.textContent = [
    /* Hover-preview highlight for multi-tile hoe area */
    '.hoe-preview {',
    '  outline: 2.5px dashed rgba(251,146,60,0.80) !important;',
    '  outline-offset: -2px;',
    '  background-color: rgba(251,146,60,0.14) !important;',
    '  z-index: 4;',
    '}',
    /* Corner badge on hoe tool button showing current area */
    '#tool-hoe { position:relative; }',
    '#hoe-area-badge {',
    '  position:absolute; top:-5px; right:-5px;',
    '  font-size:8px; font-weight:900;',
    '  background:#d97706; color:#fff;',
    '  border-radius:20px; padding:1px 5px;',
    '  pointer-events:none; line-height:1.4;',
    '  box-shadow:0 1px 3px rgba(0,0,0,.25);',
    '}',
  ].join('\n');
  document.head.appendChild(css);

  /* ── Helper: get current hoe size ───────────────────────────── */
  function getHoeSize() {
    if (typeof curUpgs !== 'function') return 1;
    var upgs = curUpgs();
    if ((upgs.hoe_4x4 || 0) >= 1 && (upgs.hoe_3x3 || 0) >= 1) return 4;
    if ((upgs.hoe_3x3 || 0) >= 1) return 3;
    return 1;
  }

  /* ── Helper: get tile offsets for a given size & center ──────── */
  function getHoeOffsets(size) {
    /* 1×1 → just [0,0]
       3×3 → -1..+1  (center is clicked tile)
       4×4 → -1..+2  (clicked tile at top-left quadrant) */
    var arr = [];
    var range = size === 4 ? [-1, 0, 1, 2] : size === 3 ? [-1, 0, 1] : [0];
    for (var i = 0; i < range.length; i++) {
      for (var j = 0; j < range.length; j++) {
        arr.push([range[i], range[j]]);
      }
    }
    return arr;
  }

  /* ── Patch clickTile — multi-tile hoe ────────────────────────── */
  var _waitCT = setInterval(function () {
    if (typeof window.clickTile !== 'function') return;
    clearInterval(_waitCT);
    var _orig = window.clickTile;
    window.clickTile = function (r, c) {
      /* Only intercept Hoe with an area upgrade */
      if (typeof G === 'undefined' || G.tool !== 'hoe') {
        return _orig.apply(this, arguments);
      }
      var size = getHoeSize();
      if (size === 1) {
        return _orig.apply(this, arguments);  /* no upgrade — use default */
      }

      /* ---- Multi-tile tilling ----------------------------------- */
      var GW_v = typeof GW !== 'undefined' ? GW : 14;
      var GH_v = typeof GH !== 'undefined' ? GH : 10;
      var landTrees = [];
      if (typeof LAND_TREES !== 'undefined' && G.currentLand) {
        landTrees = LAND_TREES[G.currentLand] || LAND_TREES.home || [];
      }
      var treeKeys = new Set(landTrees.map(function (t) { return t[0] * 100 + t[1]; }));
      var fLv = typeof getLevel === 'function'
        ? getLevel((G.skills && G.skills.farming && G.skills.farming.xp) || 0)
        : 1;
      var offsets = getHoeOffsets(size);
      var count = 0;
      var alreadyDone = 0;

      offsets.forEach(function (off) {
        var nr = r + off[0], nc = c + off[1];
        if (nr < 0 || nr >= GH_v || nc < 0 || nc >= GW_v) return;
        if (treeKeys.has(nr * 100 + nc)) return;
        var tile = G.farm[nr][nc];
        if (tile.tilled) { alreadyDone++; return; }
        if (tile.deco)   return;
        var newTile = Object.assign({}, tile, { tilled:true, idleDays:0, deco:null });
        if (fLv >= 10) newTile.watered = true;
        G.farm[nr][nc] = newTile;
        count++;
        /* Reduced energy cost per tile: area tools cost less */
        if (fLv < 5 && typeof S !== 'undefined' && S.energyCost) {
          G.energy = Math.max(0, G.energy - 0.4);
        }
        /* XP: slightly less per tile to balance the efficiency */
        if (typeof addXP === 'function') addXP('farming', 3);
      });

      if (count === 0) {
        if (alreadyDone > 0) {
          if (typeof toast === 'function') toast('Area already tilled!', 'info', 900);
        }
        return;
      }

      if (typeof snd === 'function') snd('till');
      var label = size + '×' + size;
      if (typeof toast === 'function')
        toast('⚒️ ' + label + ' area tilled! (' + count + ' tiles)', 'success', 1400);

      /* Clamp energy floor */
      if (typeof S !== 'undefined' && S.energyCost && G.energy < 0) G.energy = 0;

      if (typeof render === 'function') render();
    };
    console.log('[BIG UPDATE 4] Multi-tile hoe clickTile patch applied.');
  }, 100);

  /* ── Hoe-preview: highlight affected tiles on mouse-over ─────── */
  var _previewActive = false;
  var _previewTiles  = [];

  function clearPreview() {
    _previewTiles.forEach(function (el) { el.classList.remove('hoe-preview'); });
    _previewTiles = [];
    _previewActive = false;
  }

  function showPreview(r, c) {
    clearPreview();
    if (typeof G === 'undefined' || G.tool !== 'hoe') return;
    var size = getHoeSize();
    if (size === 1) return;
    var GW_v = typeof GW !== 'undefined' ? GW : 14;
    var GH_v = typeof GH !== 'undefined' ? GH : 10;
    var grid = document.getElementById('farm-grid');
    if (!grid) return;
    /* Build tree key set */
    var landTrees = [];
    if (typeof LAND_TREES !== 'undefined' && G.currentLand) {
      landTrees = LAND_TREES[G.currentLand] || LAND_TREES.home || [];
    }
    var treeKeys = new Set(landTrees.map(function (t) { return t[0] * 100 + t[1]; }));
    var offsets = getHoeOffsets(size);
    offsets.forEach(function (off) {
      var nr = r + off[0], nc = c + off[1];
      if (nr < 0 || nr >= GH_v || nc < 0 || nc >= GW_v) return;
      if (treeKeys.has(nr * 100 + nc)) return;
      var tile = G.farm[nr] && G.farm[nr][nc];
      if (!tile || tile.tilled || tile.deco) return;
      /* Tile index in the grid */
      var idx = nr * GW_v + nc;
      /* Count tree tiles before this index */
      var treesBefore = 0;
      landTrees.forEach(function (t) {
        if (t[0] * GW_v + t[1] < idx) treesBefore++;
      });
      var el = grid.children[idx];
      if (el && !el.classList.contains('tile-tree')) {
        el.classList.add('hoe-preview');
        _previewTiles.push(el);
        _previewActive = true;
      }
    });
  }

  /* Attach hover listeners after renderFarm rebuilds the grid */
  function attachHoverListeners() {
    var grid = document.getElementById('farm-grid');
    if (!grid) return;
    var GW_v = typeof GW !== 'undefined' ? GW : 14;
    var GH_v = typeof GH !== 'undefined' ? GH : 10;
    var landTrees = [];
    if (typeof LAND_TREES !== 'undefined' && G && G.currentLand) {
      landTrees = LAND_TREES[G.currentLand] || LAND_TREES.home || [];
    }
    var treeKeys = new Set(landTrees.map(function (t) { return t[0] * 100 + t[1]; }));
    var idx = 0;
    for (var r = 0; r < GH_v; r++) {
      for (var c = 0; c < GW_v; c++) {
        (function (rr, cc, el) {
          if (!el) return;
          if (treeKeys.has(rr * 100 + cc)) return;
          el.addEventListener('mouseenter', function () { showPreview(rr, cc); });
          el.addEventListener('mouseleave', function () { clearPreview(); });
        })(r, c, grid.children[idx]);
        idx++;
      }
    }
  }

  /* ── Patch renderFarm to attach hover listeners & badge ──────── */
  var _waitRF = setInterval(function () {
    if (typeof window.renderFarm !== 'function') return;
    clearInterval(_waitRF);
    var _orig = window.renderFarm;
    window.renderFarm = function () {
      _orig.apply(this, arguments);
      /* Re-attach hover listeners after every DOM rebuild */
      if (getHoeSize() > 1) attachHoverListeners();
      /* Update hoe area badge */
      updateHoeBadge();
    };
    console.log('[BIG UPDATE 4] renderFarm patched for hoe preview.');
  }, 100);

  /* ── Corner badge on hoe button ──────────────────────────────── */
  function updateHoeBadge() {
    var hoeBtn = document.getElementById('tool-hoe');
    if (!hoeBtn) return;
    var size   = getHoeSize();
    var badge  = document.getElementById('hoe-area-badge');
    if (size > 1) {
      if (!badge) {
        badge = document.createElement('span');
        badge.id = 'hoe-area-badge';
        hoeBtn.style.position = 'relative';
        hoeBtn.appendChild(badge);
      }
      badge.textContent = size + '×' + size;
      badge.style.display = 'block';
    } else if (badge) {
      badge.style.display = 'none';
    }
  }

  /* ── Patch render to sync badge ──────────────────────────────── */
  var _waitRend = setInterval(function () {
    if (typeof window.render !== 'function') return;
    clearInterval(_waitRend);
    var _orig = window.render;
    window.render = function () {
      _orig.apply(this, arguments);
      updateHoeBadge();
    };
  }, 100);

  console.log('[BIG UPDATE 4] Hoe Area Upgrades loaded.');
})();


/* ──────────────────────── patch_v3.js ──────────────────────── */
/* ═══════════════════════════════════════════════════════════════════════
   VALLEY FARM — PATCH v3.0  (patch_v3.js)
   ─────────────────────────────────────────────────────────────────────
   Load order: after script.js · winter.js · winterpatch.js · tbu.js
               · mobilepatch.js · mpfix4.js

   What this patch does
   ─────────────────────
   1. MOBILE GRID FIX  — Farm tiles scale to fill viewport width on
                         mobile; no more gaps or horizontal scroll.
                         Tiles stay square via aspect-ratio CSS.
                         JS patch overrides renderFarm's inline
                         grid-template-columns on narrow screens.

   2. HOE UPGRADE NAMES — "Iron Hoe Head" → "Hoe Upgrade" (3×3)
                           "Steel Hoe Head" → "Iron Head" (4×4)

   3. HOE PICKER MENU  — Clicking ⛏ Hoe opens a visual size picker:
                         [ 1×1 ] [ 2×2 ] [ 3×3 🔒 ] [ 4×4 🔒 ]
                         + a [ 🌿 Fert ] switch button.
                         Selecting Fert switches the active tool and
                         changes the Hoe toolbar button to "🌿 Fert".
                         Re-clicking "🌿 Fert" button returns to Hoe.
                         Works on both PC toolbar and mobile dock.

   4. CITY HUB MENU    — Traveling to the City now shows an
                         intermediate hub screen first:
                           📊 Stock Exchange  |  💼 Jobs Board
                         Jobs Board is also added as a tab inside the
                         City screen; it is removed from the Shop tab.

   NOTE: Does NOT modify any source files. Pure monkey-patch.
═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ────────────────────────────────────────────────────────────────────
     SECTION 0  CSS
  ──────────────────────────────────────────────────────────────────── */
  var style = document.createElement('style');
  style.id = 'vf-patchv3-css';
  style.textContent = `
/* ══ MOBILE GRID: fluid tiles that fill viewport ═══════════════════ */
@media (max-width: 680px) {
  #farm-wrap {
    padding: 0 !important;
    overflow: hidden !important;
    align-items: stretch !important;
  }
  #farm-grid {
    gap: 0 !important;
    width: 100vw !important;
    /* columns set dynamically by JS; rows follow naturally */
  }
  /* Fluid tile: width driven by grid column, height = width */
  #farm-grid .tile,
  #farm-grid .tile-tree {
    width: 100% !important;
    height: 0 !important;
    padding-bottom: 100% !important; /* 1:1 aspect via padding trick */
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    font-size: clamp(10px, 3.5vw, 20px) !important;
    position: relative !important;
    /* emoji & child elements must be positioned inside */
  }
  /* Re-centre content that was relying on flex */
  #farm-grid .tile > *,
  #farm-grid .tile-tree > * {
    position: absolute !important;
    top: 50% !important; left: 50% !important;
    transform: translate(-50%, -50%) !important;
    pointer-events: none !important;
  }
  /* Days badge & sparkle position overrides */
  #farm-grid .days-badge {
    top: auto !important; bottom: 1px !important;
    left: 2px !important; transform: none !important;
    font-size: 8px !important;
  }
  #farm-grid .sparkle {
    top: 1px !important; right: 2px !important;
    transform: none !important;
    font-size: 9px !important;
  }
  #farm-grid .water-dot {
    bottom: 2px !important; right: 2px !important;
    transform: none !important;
  }
  #farm-grid .fert-badge {
    bottom: 1px !important; right: 1px !important;
    transform: none !important;
    font-size: 9px !important;
  }
  #farm-grid .lamp-glow-overlay {
    top: 0 !important; left: 0 !important;
    transform: none !important;
    width: 100% !important; height: 100% !important;
  }
  #farm-grid .tile-ready {
    animation: mobileReadyPulse 1.6s ease-in-out infinite !important;
  }
  @keyframes mobileReadyPulse {
    0%,100% { filter: brightness(1.0); }
    50%      { filter: brightness(1.25) drop-shadow(0 0 4px rgba(251,191,36,.6)); }
  }
}

/* ══ HOE PICKER POPUP ═══════════════════════════════════════════════ */
#hoe-picker {
  display: none;
  position: fixed;
  z-index: 600;
  background: var(--ui-bg);
  border: 1.5px solid var(--ui-border);
  border-radius: 16px;
  padding: 10px;
  box-shadow: 0 8px 36px rgba(0,0,0,.18);
  animation: hoepickerIn .18s cubic-bezier(.25,.8,.25,1);
}
@keyframes hoepickerIn {
  from { opacity:0; transform: scale(.92) translateY(6px); }
  to   { opacity:1; transform: scale(1) translateY(0); }
}
#hoe-picker.hp-open { display: flex; flex-direction: column; gap: 8px; }

/* PC: anchored above toolbar */
@media (min-width: 681px) {
  #hoe-picker {
    bottom: 62px;
    left: 50%;
    transform: translateX(-50%);
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }
}
/* Mobile: bottom sheet style above dock */
@media (max-width: 680px) {
  #hoe-picker {
    bottom: 70px;
    left: 0; right: 0;
    border-radius: 18px 18px 0 0;
    border-bottom: none;
    padding: 12px 10px 14px;
    flex-direction: column;
  }
}
#hoe-picker-title {
  font-size: 9px; font-weight: 800; text-transform: uppercase;
  letter-spacing: .8px; color: var(--text-soft);
  font-family: 'Nunito', sans-serif;
  text-align: center;
}
.hp-row { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }
.hp-btn {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 8px 6px 6px;
  background: var(--ui-bg2);
  border: 2px solid var(--ui-border);
  border-radius: 12px;
  cursor: pointer;
  min-width: 60px;
  transition: all .14s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  font-family: 'Nunito', sans-serif;
  position: relative;
}
.hp-btn:active { transform: scale(.9); }
.hp-btn.sel { border-color: #d97706; background: #fff7ed; }
body.dark .hp-btn.sel { background: #1c0d00; border-color: #ea580c; }
.hp-btn.locked { opacity: .45; cursor: not-allowed; }
.hp-btn.locked:active { transform: none; }
.hp-grid { display: grid; gap: 2px; margin: 0 auto 3px; }
.hp-grid .hpc { background: #d97706; border-radius: 2px; }
.hp-btn-label {
  font-size: 9px; font-weight: 700; color: var(--text-muted);
  pointer-events: none;
}
.hp-lock-badge {
  position: absolute; top: 2px; right: 3px;
  font-size: 9px; opacity: .7;
  pointer-events: none;
}
/* Fert switch button */
.hp-fert-btn {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 8px 10px 6px;
  background: #f0fdf4;
  border: 2px solid #86efac;
  border-radius: 12px;
  cursor: pointer;
  font-family: 'Nunito', sans-serif;
  font-size: 9px; font-weight: 700;
  color: #166534;
  transition: all .14s;
  -webkit-tap-highlight-color: transparent;
}
body.dark .hp-fert-btn { background: #0a2016; border-color: #166534; color: #4ade80; }
.hp-fert-btn:active { transform: scale(.9); }
.hp-sep { width: 1px; height: 48px; background: var(--ui-border); flex-shrink: 0; }
@media (max-width: 680px) { .hp-sep { width: 100%; height: 1px; margin: 2px 0; } }

/* Fert active state on hoe toolbar button */
#tool-hoe.fert-active,
#dock-hoe.fert-active { border-color: #86efac !important; color: #166534 !important; }
body.dark #tool-hoe.fert-active,
body.dark #dock-hoe.fert-active { color: #4ade80 !important; border-color: #166534 !important; }

/* ══ CITY HUB OVERLAY ═══════════════════════════════════════════════ */
#city-hub {
  display: none;
  position: fixed; inset: 0; z-index: 1999;
  background: rgba(0,0,0,.6);
  backdrop-filter: blur(4px);
  align-items: center; justify-content: center;
  animation: chubIn .22s ease;
}
#city-hub.chub-open { display: flex; }
@keyframes chubIn { from { opacity:0; } to { opacity:1; } }
.chub-card {
  background: var(--ui-bg);
  border: 1.5px solid var(--ui-border);
  border-radius: 22px;
  padding: 28px 24px 24px;
  max-width: 340px; width: calc(100vw - 40px);
  box-shadow: 0 24px 64px rgba(0,0,0,.32);
  display: flex; flex-direction: column; gap: 14px;
  animation: chubCardIn .28s cubic-bezier(.34,1.56,.64,1);
}
@keyframes chubCardIn {
  from { transform: scale(.88) translateY(14px); opacity:0; }
  to   { transform: scale(1) translateY(0); opacity:1; }
}
.chub-title {
  font-family: 'Baloo 2', cursive; font-size: 22px; font-weight: 800;
  color: var(--text-primary); text-align: center;
}
.chub-sub {
  font-size: 11px; color: var(--text-muted); text-align: center; line-height: 1.6;
  margin-top: -8px;
}
.chub-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.chub-btn {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 18px 10px 14px;
  border-radius: 14px; border: 2px solid;
  cursor: pointer; font-family: 'Baloo 2', cursive;
  font-size: 13px; font-weight: 800;
  transition: all .16s;
  -webkit-tap-highlight-color: transparent;
}
.chub-btn:active { transform: scale(.94); }
.chub-btn-market {
  background: linear-gradient(135deg,#eef2ff,#e0e7ff);
  border-color: #c7d2fe; color: #4338ca;
}
.chub-btn-market:hover { background: linear-gradient(135deg,#e0e7ff,#c7d2fe); }
body.dark .chub-btn-market { background: #1e1b4b; border-color: #3730a3; color: #818cf8; }
.chub-btn-jobs {
  background: linear-gradient(135deg,#f0fdf4,#dcfce7);
  border-color: #86efac; color: #166534;
}
.chub-btn-jobs:hover { background: linear-gradient(135deg,#dcfce7,#bbf7d0); }
body.dark .chub-btn-jobs { background: #0a2016; border-color: #166534; color: #4ade80; }
.chub-btn-em { font-size: 34px; line-height: 1; }
.chub-close {
  align-self: center; background: none; border: none; cursor: pointer;
  color: var(--text-muted); font-size: 12px; font-weight: 600;
  font-family: 'Nunito', sans-serif; padding: 4px 12px;
  border-radius: 8px; transition: color .15s;
}
.chub-close:hover { color: var(--text-primary); }

/* ══ CITY JOBS TAB ══════════════════════════════════════════════════ */
.city-jobs-intro {
  font-size: 11px; color: var(--text-muted); padding: 8px 11px;
  background: var(--ui-bg2); border: 1px solid var(--ui-border);
  border-radius: 9px; line-height: 1.55;
}

/* Retro overrides */
body.retro #hoe-picker { background: #120c00; border: 2px solid #8b6914; border-radius: 4px; }
body.retro .hp-btn { background: #1c1209; border: 1px solid #3e2723; border-radius: 3px; }
body.retro .hp-btn.sel { background: #2d1b00; border-color: #ffd700; }
body.retro .hp-fert-btn { background: #0d2e10; border: 1px solid #1b5e20; border-radius: 3px; }
body.retro #city-hub { backdrop-filter: none; }
body.retro .chub-card { background: #120c00; border: 3px solid #8b6914; border-radius: 4px; }
body.retro .chub-title { color: #ffd700; font-size: 14px; }
`;
  document.head.appendChild(style);

  /* ────────────────────────────────────────────────────────────────────
     SECTION 1  MOBILE GRID FIX
     Patch renderFarm so that on screens ≤ 680 px the grid columns are
     fluid (1fr each) instead of the hardcoded 52 px inline style.
  ──────────────────────────────────────────────────────────────────── */
  function _patchRenderFarmMobile() {
    if (typeof window.renderFarm !== 'function') { setTimeout(_patchRenderFarmMobile, 150); return; }
    var _prev = window.renderFarm;
    window.renderFarm = function () {
      _prev.apply(this, arguments);
      if (window.innerWidth > 680) return;
      var grid = document.getElementById('farm-grid');
      if (!grid) return;
      var GW_v = typeof GW !== 'undefined' ? GW : 14;
      var GH_v = typeof GH !== 'undefined' ? GH : 10;
      var tileSize = Math.floor(window.innerWidth / GW_v);
      /* Override JS-set inline style with fluid columns */
      grid.style.gridTemplateColumns = 'repeat(' + GW_v + ', ' + tileSize + 'px)';
      grid.style.gridTemplateRows   = 'repeat(' + GH_v + ', ' + tileSize + 'px)';
      grid.style.width  = (tileSize * GW_v) + 'px';
      grid.style.height = (tileSize * GH_v) + 'px';
      /* Fix tile sizes */
      Array.from(grid.children).forEach(function (el) {
        el.style.width  = tileSize + 'px';
        el.style.height = tileSize + 'px';
        el.style.padding = '0';
        el.style.fontSize = Math.floor(tileSize * 0.55) + 'px';
      });
    };
    /* Also re-run on window resize */
    window.addEventListener('resize', function () {
      if (window.innerWidth <= 680 && typeof renderFarm === 'function') renderFarm();
    });
    console.log('[PatchV3] Mobile grid fix applied.');
  }
  _patchRenderFarmMobile();

  /* ────────────────────────────────────────────────────────────────────
     SECTION 2  HOE UPGRADE RENAMING
     tbu.js registers hoe_3x3 and hoe_4x4 into UPGRADES.
     We rename them here to match the user-requested labels.
  ──────────────────────────────────────────────────────────────────── */
  function _renameHoeUpgrades() {
    if (typeof UPGRADES === 'undefined') { setTimeout(_renameHoeUpgrades, 200); return; }
    if (UPGRADES.hoe_3x3) {
      UPGRADES.hoe_3x3.n    = 'Hoe Upgrade';
      UPGRADES.hoe_3x3.desc = 'Upgrade your hoe head. Now tills a 3×3 patch per swing — dramatically faster field prep!';
    }
    if (UPGRADES.hoe_4x4) {
      UPGRADES.hoe_4x4.n    = 'Iron Head';
      UPGRADES.hoe_4x4.desc = 'Forge an iron hoe head for massive 4×4 tilling. Requires the Hoe Upgrade first.';
    }
    console.log('[PatchV3] Hoe upgrade names updated.');
  }
  _renameHoeUpgrades();

  /* ────────────────────────────────────────────────────────────────────
     SECTION 3  HOE AREA + 2×2 SUPPORT
     tbu.js's internal getHoeSize() ignores G.hoeSize.  We wrap
     clickTile one more time (outermost = runs first) to intercept
     the hoe tool and use G.hoeSize as the player's chosen size,
     capped by owned upgrades.  The 2×2 case is handled here too.
  ──────────────────────────────────────────────────────────────────── */
  function _getDesiredHoeSize() {
    var desired = (typeof G !== 'undefined' && G.hoeSize) ? G.hoeSize : 1;
    if (typeof curUpgs !== 'function') return Math.min(desired, 1);
    var upgs = curUpgs();
    var has3 = (upgs.hoe_3x3 || 0) >= 1;
    var has4 = has3 && (upgs.hoe_4x4 || 0) >= 1;
    if (desired >= 4 && has4) return 4;
    if (desired >= 3 && has3) return 3;
    if (desired >= 2) return 2;
    return 1;
  }
  window._getDesiredHoeSize = _getDesiredHoeSize;

  /* Offsets for each area size */
  function _hoeOffsets(size) {
    var offsets = [];
    if (size === 1) return [[0,0]];
    if (size === 2) return [[0,0],[0,1],[1,0],[1,1]];
    var range = size === 4 ? [-1,0,1,2] : [-1,0,1];
    for (var i = 0; i < range.length; i++)
      for (var j = 0; j < range.length; j++)
        offsets.push([range[i], range[j]]);
    return offsets;
  }

  function _patchClickTileForHoe() {
    if (typeof window.clickTile !== 'function') { setTimeout(_patchClickTileForHoe, 200); return; }
    var _prev = window.clickTile;
    window.clickTile = function (r, c) {
      /* Only intercept when hoe is active AND a size > 1 is desired */
      if (typeof G === 'undefined' || G.tool !== 'hoe') return _prev.apply(this, arguments);
      var size = _getDesiredHoeSize();
      if (size === 1) return _prev.apply(this, arguments); // delegate to base/tbu

      /* Multi-tile tilling with our chosen size */
      var GW_v = typeof GW !== 'undefined' ? GW : 14;
      var GH_v = typeof GH !== 'undefined' ? GH : 10;
      var fLv  = typeof getLevel === 'function' ? getLevel((G.skills && G.skills.farming && G.skills.farming.xp) || 0) : 1;
      var landTrees = [];
      if (typeof LAND_TREES !== 'undefined' && G.currentLand)
        landTrees = LAND_TREES[G.currentLand] || LAND_TREES.home || [];
      var treeKeys = new Set(landTrees.map(function (t) { return t[0]*100+t[1]; }));
      var offsets = _hoeOffsets(size);
      var count = 0, alreadyDone = 0;

      offsets.forEach(function (off) {
        var nr = r + off[0], nc = c + off[1];
        if (nr < 0 || nr >= GH_v || nc < 0 || nc >= GW_v) return;
        if (treeKeys.has(nr*100+nc)) return;
        var tile = G.farm[nr] && G.farm[nr][nc];
        if (!tile) return;
        if (tile.tilled) { alreadyDone++; return; }
        if (tile.deco) return;
        var newTile = Object.assign({}, tile, { tilled:true, idleDays:0, deco:null });
        if (fLv >= 10) newTile.watered = true;
        G.farm[nr][nc] = newTile;
        count++;
        if (fLv < 5 && typeof S !== 'undefined' && S.energyCost)
          G.energy = Math.max(0, G.energy - 0.35);
        if (typeof addXP === 'function') addXP('farming', 3);
      });

      if (count === 0) {
        if (alreadyDone > 0 && typeof toast === 'function') toast('Area already tilled!', 'info', 900);
        return;
      }
      if (typeof snd   === 'function') snd('till');
      if (typeof toast === 'function') toast('⚒ ' + size + '×' + size + ' tilled! (' + count + ' tiles)', 'success', 1300);
      if (typeof S !== 'undefined' && S.energyCost && G.energy < 0) G.energy = 0;
      if (typeof render === 'function') render();
    };
    console.log('[PatchV3] clickTile wrapped for flexible hoe sizes.');
  }
  _patchClickTileForHoe();

  /* ────────────────────────────────────────────────────────────────────
     SECTION 4  HOE PICKER MENU
     A visual panel showing four size buttons (+ fert switch).
     Opens when the Hoe tool is selected; closes on tool change.
  ──────────────────────────────────────────────────────────────────── */

  /* Build a mini NxN grid preview using divs */
  function _buildMiniGrid(n, cellPx) {
    var size = n * cellPx + (n-1)*2; // cell + gap
    var style = 'display:grid;grid-template-columns:repeat(' + n + ',1fr);gap:2px;' +
                'width:' + size + 'px;height:' + size + 'px;margin:0 auto 2px';
    var cells = '';
    for (var i = 0; i < n*n; i++)
      cells += '<div style="background:#d97706;border-radius:2px"></div>';
    return '<div style="' + style + '">' + cells + '</div>';
  }

  function _buildHoePicker() {
    if (document.getElementById('hoe-picker')) return;
    var el = document.createElement('div');
    el.id = 'hoe-picker';
    document.body.appendChild(el);
    _refreshHoePicker();
  }

  function _refreshHoePicker() {
    var el = document.getElementById('hoe-picker');
    if (!el) return;
    var upgs    = typeof curUpgs === 'function' ? curUpgs() : {};
    var has3    = (upgs.hoe_3x3 || 0) >= 1;
    var has4    = has3 && (upgs.hoe_4x4 || 0) >= 1;
    var current = (typeof G !== 'undefined' && G.hoeSize) ? G.hoeSize : 1;
    // Effective selection (capped)
    if (current === 4 && !has4) current = 3;
    if (current === 3 && !has3) current = Math.min(current, 2);

    var sizes = [1, 2, 3, 4];
    var labels = ['1×1', '2×2', '3×3', '4×4'];
    var locked  = [false, false, !has3, !has4];
    var cellPx  = [8, 7, 5, 4];

    var sizeHtml = sizes.map(function (n, i) {
      var sel = (current === n && !locked[i]) ? ' sel' : '';
      var lck = locked[i] ? ' locked' : '';
      var lockBadge = locked[i] ? '<span class="hp-lock-badge">🔒</span>' : '';
      return '<button class="hp-btn' + sel + lck + '" data-hoe-size="' + n + '">' +
               lockBadge +
               _buildMiniGrid(n, cellPx[i]) +
               '<span class="hp-btn-label">' + labels[i] + (locked[i] ? '<br><span style="font-size:7px;opacity:.6">upgrade needed</span>' : '') + '</span>' +
             '</button>';
    }).join('');

    var fertHtml = '<div class="hp-sep"></div>' +
      '<button class="hp-fert-btn" id="hp-fert-switch">' +
        '<span style="font-size:22px;line-height:1">🌿</span>' +
        '<span>Fert</span>' +
      '</button>';

    el.innerHTML = '<div id="hoe-picker-title">⛏ Hoe Size</div>' +
                   '<div class="hp-row">' + sizeHtml + fertHtml + '</div>';

    /* Bind size buttons */
    el.querySelectorAll('[data-hoe-size]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.classList.contains('locked')) {
          var upg = btn.dataset.hoeSize === '3' ? 'Hoe Upgrade' : 'Iron Head';
          if (typeof toast === 'function') toast('🔒 Requires ' + upg + '! Buy it in Upgrades tab.', 'warn', 2500);
          return;
        }
        if (typeof G !== 'undefined') G.hoeSize = parseInt(btn.dataset.hoeSize);
        el.querySelectorAll('[data-hoe-size]').forEach(function (b) { b.classList.remove('sel'); });
        btn.classList.add('sel');
        if (typeof toast === 'function') toast('⚒ Hoe: ' + btn.dataset.hoeSize + '×' + btn.dataset.hoeSize + ' area selected', 'info', 1200);
      });
    });

    /* Fert switch button */
    var fertBtn = document.getElementById('hp-fert-switch');
    if (fertBtn) {
      fertBtn.addEventListener('click', function () {
        _closeHoePicker();
        if (typeof setTool === 'function') setTool('fert');
        _setToolBtnFertMode(true);
      });
    }
  }

  function _openHoePicker() {
    _buildHoePicker();
    _refreshHoePicker();
    var el = document.getElementById('hoe-picker');
    if (!el) return;
    el.classList.add('hp-open');
  }

  function _closeHoePicker() {
    var el = document.getElementById('hoe-picker');
    if (!el) return;
    el.classList.remove('hp-open');
  }

  /* Change toolbar / dock Hoe button label for fert mode */
  function _setToolBtnFertMode(on) {
    /* PC toolbar button */
    var hoeBtn = document.getElementById('tool-hoe');
    if (hoeBtn) {
      if (on) {
        hoeBtn.dataset.origHtml = hoeBtn.innerHTML;
        hoeBtn.innerHTML = '🌿 Fert';
        hoeBtn.classList.add('fert-active');
      } else {
        if (hoeBtn.dataset.origHtml) hoeBtn.innerHTML = hoeBtn.dataset.origHtml;
        hoeBtn.classList.remove('fert-active');
      }
    }
    /* Mobile dock Hoe button */
    var dockHoe = document.getElementById('dock-hoe');
    if (dockHoe) {
      var icon  = dockHoe.querySelector('.dock-icon');
      var label = dockHoe.querySelector('.dock-label');
      if (on) {
        if (icon)  { icon.dataset.origText  = icon.textContent;  icon.textContent  = '🌿'; }
        if (label) { label.dataset.origText = label.textContent; label.textContent = 'Fert'; }
        dockHoe.classList.add('fert-active');
      } else {
        if (icon  && icon.dataset.origText)  icon.textContent  = icon.dataset.origText;
        if (label && label.dataset.origText) label.textContent = label.dataset.origText;
        dockHoe.classList.remove('fert-active');
      }
    }
  }

  /* Hook setTool to open/close picker and reset fert mode */
  function _hookSetToolForHoePicker() {
    if (typeof window.setTool !== 'function') { setTimeout(_hookSetToolForHoePicker, 150); return; }
    var _prev = window.setTool;
    window.setTool = function (t) {
      _prev.apply(this, arguments);
      if (t === 'hoe') {
        _openHoePicker();
        _setToolBtnFertMode(false); // reset fert mode if returning to hoe
      } else {
        _closeHoePicker();
        if (t !== 'fert') _setToolBtnFertMode(false); // non-fert tool clears fert state
      }
    };
    /* Also hook the PC toolbar Hoe button itself so a second click
       while hoe is active re-opens the picker cleanly */
    var _hookHoeBtn = function () {
      var btn = document.getElementById('tool-hoe');
      if (!btn) { setTimeout(_hookHoeBtn, 200); return; }
      btn.addEventListener('click', function () {
        /* setTool('hoe') already fired (via onclick), now open picker */
        if (typeof G !== 'undefined' && G.tool === 'hoe') _openHoePicker();
      });
    };
    _hookHoeBtn();
    /* Mobile dock Hoe button */
    var _hookDockHoe = function () {
      var dBtn = document.getElementById('dock-hoe');
      if (!dBtn) { setTimeout(_hookDockHoe, 300); return; }
      dBtn.addEventListener('click', function () {
        if (typeof G !== 'undefined' && G.tool === 'hoe') _openHoePicker();
        if (typeof G !== 'undefined' && G.tool === 'fert') {
          /* Re-clicking fert button returns to hoe */
          if (typeof setTool === 'function') setTool('hoe');
          _setToolBtnFertMode(false);
        }
      });
    };
    _hookDockHoe();
    console.log('[PatchV3] setTool hooked for hoe picker.');
  }
  _hookSetToolForHoePicker();

  /* Close hoe picker when tapping the farm grid on mobile */
  document.addEventListener('DOMContentLoaded', function () {
    var fw = document.getElementById('farm-wrap');
    if (fw) fw.addEventListener('click', function () { _closeHoePicker(); }, true);
  });

  /* Also update the hoe picker when upgrades change (after buyUpgrade) */
  function _hookBuyUpgradeForPicker() {
    if (typeof window.buyUpgrade !== 'function') { setTimeout(_hookBuyUpgradeForPicker, 200); return; }
    var _prev = window.buyUpgrade;
    window.buyUpgrade = function (id) {
      _prev.apply(this, arguments);
      if (id === 'hoe_3x3' || id === 'hoe_4x4') {
        setTimeout(_refreshHoePicker, 200);
      }
    };
  }
  _hookBuyUpgradeForPicker();

  /* ────────────────────────────────────────────────────────────────────
     SECTION 5  HOE AREA BADGE  (mirrors tbu.js badge but uses G.hoeSize)
  ──────────────────────────────────────────────────────────────────── */
  function _syncHoeBadge() {
    var hoeBtn = document.getElementById('tool-hoe');
    if (!hoeBtn) return;
    var size = _getDesiredHoeSize();
    var badge = document.getElementById('pv3-hoe-badge');
    if (size > 1) {
      if (!badge) {
        badge = document.createElement('span');
        badge.id = 'pv3-hoe-badge';
        badge.style.cssText = 'position:absolute;top:-5px;right:-5px;' +
          'font-size:8px;font-weight:900;background:#d97706;color:#fff;' +
          'border-radius:20px;padding:1px 5px;pointer-events:none;line-height:1.4;' +
          'box-shadow:0 1px 3px rgba(0,0,0,.25)';
        hoeBtn.style.position = 'relative';
        hoeBtn.appendChild(badge);
      }
      badge.textContent = size + '×' + size;
      badge.style.display = 'inline';
    } else if (badge) {
      badge.style.display = 'none';
    }
  }
  function _hookRenderForBadge() {
    if (typeof window.render !== 'function') { setTimeout(_hookRenderForBadge, 150); return; }
    var _prev = window.render;
    window.render = function () { _prev.apply(this, arguments); _syncHoeBadge(); };
  }
  _hookRenderForBadge();

  /* ────────────────────────────────────────────────────────────────────
     SECTION 6  CITY HUB OVERLAY
     Intercept openCityScreen to show an intermediate hub with
     "Stock Exchange" and "Jobs Board" options before entering.
  ──────────────────────────────────────────────────────────────────── */

  /* Build the hub overlay DOM (once) */
  function _buildCityHub() {
    if (document.getElementById('city-hub')) return;
    var el = document.createElement('div');
    el.id = 'city-hub';
    el.innerHTML = `
      <div class="chub-card">
        <div class="chub-title">🏙️ City District</div>
        <div class="chub-sub">What would you like to do in the city?</div>
        <div class="chub-btns">
          <button class="chub-btn chub-btn-market" id="chub-market">
            <span class="chub-btn-em">📊</span>
            Stock Exchange
          </button>
          <button class="chub-btn chub-btn-jobs" id="chub-jobs">
            <span class="chub-btn-em">💼</span>
            Jobs Board
          </button>
        </div>
        <button class="chub-close" id="chub-close">✕ Cancel</button>
      </div>`;
    document.body.appendChild(el);

    document.getElementById('chub-market').addEventListener('click', function () {
      _closeCityHub();
      _openCityScreenDirect('market');
    });
    document.getElementById('chub-jobs').addEventListener('click', function () {
      _closeCityHub();
      _openCityScreenDirect('jobs');
    });
    document.getElementById('chub-close').addEventListener('click', function () {
      _closeCityHub();
      /* Resume game */
      if (typeof paused !== 'undefined') window.paused = false;
    });
    /* Click backdrop to close */
    el.addEventListener('click', function (e) {
      if (e.target === el) {
        _closeCityHub();
        if (typeof paused !== 'undefined') window.paused = false;
      }
    });
  }

  function _openCityHub() {
    _buildCityHub();
    document.getElementById('city-hub').classList.add('chub-open');
    if (typeof paused !== 'undefined') window.paused = true;
  }
  function _closeCityHub() {
    var el = document.getElementById('city-hub');
    if (el) el.classList.remove('chub-open');
  }

  /* Direct open (bypasses hub) */
  function _openCityScreenDirect(tab) {
    if (typeof _ensureSM === 'function') _ensureSM();
    var el = document.getElementById('city-screen');
    if (el) el.classList.add('city-open');
    if (typeof _updateCityGold === 'function') _updateCityGold();
    if (typeof paused !== 'undefined') window.paused = true;
    /* Ensure Jobs tab button exists */
    _injectJobsTab();
    if (typeof setCityTab === 'function') setCityTab(tab || 'market');
  }

  /* Override openCityScreen to go through hub first */
  function _hookOpenCityScreen() {
    if (typeof window.openCityScreen !== 'function') { setTimeout(_hookOpenCityScreen, 200); return; }
    window.openCityScreen = function () {
      _openCityHub();
    };
    console.log('[PatchV3] openCityScreen replaced with city hub.');
  }
  _hookOpenCityScreen();

  /* ────────────────────────────────────────────────────────────────────
     SECTION 7  JOBS TAB INSIDE CITY SCREEN
     Injects a "💼 Jobs" tab button and handles its content via
     renderCityScreen.  Also removes Jobs section from buildShop.
  ──────────────────────────────────────────────────────────────────── */

  function _injectJobsTab() {
    if (document.getElementById('city-tab-jobs')) return;
    var tabs = document.querySelector('#city-screen .city-tabs');
    if (!tabs) return;
    var btn = document.createElement('button');
    btn.className = 'city-tab-btn';
    btn.id = 'city-tab-jobs';
    btn.dataset.ctab = 'jobs';
    btn.textContent = '💼 Jobs';
    btn.addEventListener('click', function () {
      if (typeof setCityTab === 'function') setCityTab('jobs');
    });
    tabs.appendChild(btn);
  }

  /* Patch renderCityScreen to handle the jobs tab */
  function _hookRenderCityScreen() {
    if (typeof window.renderCityScreen !== 'function') { setTimeout(_hookRenderCityScreen, 200); return; }
    var _prev = window.renderCityScreen;
    window.renderCityScreen = function (tab) {
      if (tab === 'jobs') {
        var body = document.getElementById('city-body');
        if (!body) return;
        /* Ensure Jobs tab button is visible */
        document.querySelectorAll('.city-tab-btn').forEach(function (b) {
          b.classList.toggle('active', b.dataset.ctab === 'jobs');
        });
        if (typeof _updateCityGold === 'function') _updateCityGold();
        body.innerHTML = _buildJobsCityHTML();
        /* Bind hire buttons */
        body.querySelectorAll('[data-hire-job]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            if (typeof window.hireJob === 'function') window.hireJob(btn.dataset.hireJob);
          });
        });
        return;
      }
      _prev.apply(this, arguments);
    };
    console.log('[PatchV3] renderCityScreen patched for jobs tab.');
  }
  _hookRenderCityScreen();

  function _buildJobsCityHTML() {
    if (typeof JOBS === 'undefined' || typeof G === 'undefined') {
      return '<div class="city-empty"><div class="city-empty-em">💼</div><div>Jobs Board unavailable</div></div>';
    }
    var curJob = G.job || null;
    var h = '<div class="city-market-header">' +
              '<div class="city-market-title">💼 Jobs Board</div>' +
            '</div>' +
            '<div class="city-jobs-intro">Hold one job at a time. Daily pay arrives each morning. ' +
            'Perks are active immediately after hiring.</div>';

    if (curJob) {
      var cj = JOBS[curJob];
      h += '<div style="padding:8px 11px;background:rgba(34,197,94,.08);border:1.5px solid rgba(34,197,94,.3);' +
           'border-radius:10px;font-size:11px;font-weight:700;color:#166534;margin-bottom:4px">' +
           '✅ Current Job: ' + (cj ? cj.e + ' ' + cj.n : curJob) + ' · ' +
           (cj ? '+' + cj.dailyPay + 'g/day' : '') + '</div>';
    }

    Object.entries(JOBS).forEach(function (entry) {
      var id = entry[0], job = entry[1];
      var isActive = (curJob === id);
      var canAfford = G && G.gold >= job.hireCost;
      h += '<div class="job-card' + (isActive ? ' job-card-active' : '') + '">';
      h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px">';
      h += '<span class="job-title">' + job.e + ' ' + job.n + '</span>';
      h += '<span class="job-pay">+' + job.dailyPay + 'g/day</span>';
      h += '</div>';
      if (isActive) h += '<span class="job-active-badge">✓ Active Job</span><br>';
      h += '<div class="job-desc">' + job.desc + '</div>';
      h += '<div class="job-perks">';
      job.perks.forEach(function (p) { h += '<div class="job-perk-item">' + p + '</div>'; });
      h += '</div>';
      if (job.hireCost > 0 && !isActive)
        h += '<div class="job-income-note">Equipment fee: ' + job.hireCost + 'g</div>';
      h += '<div class="job-btn-row">';
      if (isActive) {
        h += '<button class="job-quit-btn" onclick="quitJob();if(typeof setCityTab===\'function\')setCityTab(\'jobs\')">Quit Job</button>';
      } else {
        h += '<button class="job-hire-btn" data-hire-job="' + id + '"' + (canAfford ? '' : ' disabled') + '>';
        h += (job.hireCost > 0 ? 'Hire (' + job.hireCost + 'g)' : 'Take Job — Free') + '</button>';
      }
      h += '</div></div>';
    });
    return h;
  }

  /* Remove Jobs section from buildShop (it lives in the City now) */
  function _stripJobsFromShop() {
    if (typeof window.buildShop !== 'function') { setTimeout(_stripJobsFromShop, 200); return; }
    var _prev = window.buildShop;
    window.buildShop = function () {
      var html = _prev.apply(this, arguments);
      /* Remove everything from the Jobs Board heading onwards */
      var marker = html.indexOf('<div class="s-sec">💼 Jobs Board</div>');
      if (marker !== -1) html = html.substring(0, marker);
      return html;
    };
    console.log('[PatchV3] Jobs section removed from Shop tab.');
  }
  _stripJobsFromShop();

  /* Patch quitJob / hireJob to re-render the city jobs tab if open */
  function _hookJobActionsForCityRefresh() {
    ['quitJob', 'hireJob'].forEach(function (fn) {
      var _wait = setInterval(function () {
        if (typeof window[fn] !== 'function') return;
        clearInterval(_wait);
        var _prev = window[fn];
        window[fn] = function () {
          var ret = _prev.apply(this, arguments);
          /* If city screen is open on jobs tab, refresh */
          var cityEl = document.getElementById('city-screen');
          var activeTab = document.querySelector('#city-screen .city-tab-btn.active');
          if (cityEl && cityEl.classList.contains('city-open') &&
              activeTab && activeTab.dataset.ctab === 'jobs') {
            setTimeout(function () {
              if (typeof renderCityScreen === 'function') renderCityScreen('jobs');
            }, 150);
          }
          return ret;
        };
      }, 150);
    });
  }
  _hookJobActionsForCityRefresh();

  /* Ensure city hub is built and jobs tab injected when city screen first opens */
  function _waitForCityScreen() {
    var cs = document.getElementById('city-screen');
    if (!cs) { setTimeout(_waitForCityScreen, 300); return; }
    /* Observe city-open class */
    var _mo = new MutationObserver(function () {
      if (cs.classList.contains('city-open')) _injectJobsTab();
    });
    _mo.observe(cs, { attributes: true, attributeFilter: ['class'] });
  }
  _waitForCityScreen();

  /* ────────────────────────────────────────────────────────────────────
     DONE
  ──────────────────────────────────────────────────────────────────── */
  console.log('[PatchV3 v1.0] ✅ Loaded!\n' +
    '  · Mobile grid: fluid 14-column tiles (no gaps)\n' +
    '  · Hoe upgrades renamed: "Hoe Upgrade" (3×3) / "Iron Head" (4×4)\n' +
    '  · Hoe picker: 1×1, 2×2, 3×3, 4×4 + Fert switch\n' +
    '  · Toolbar Hoe btn shows Fert icon when Fert is active\n' +
    '  · City button → hub menu (Stock Exchange / Jobs Board)\n' +
    '  · Jobs Board added as city screen tab\n' +
    '  · Jobs removed from Shop tab');
})();


/* ────────────────────── bu2.js ────────────────────── */
/* ═══════════════════════════════════════════════════════════════
   BIG UPDATE — Part 2: FERTILIZER SYSTEM  v1.0
   Adds four fertilizer types buyable from the Shop (Town Supply).
   Apply to tilled soil with the 🌿 Fert tool — each type gives
   a different bonus: extra growth, speed, or bonus harvest yield.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Fertilizer definitions ─────────────────────────────────── */
  var FERTILIZERS = {
    basic:    { n:'Basic Fertilizer', e:'🌿', cost:50,
                desc:'+1 extra growth per watered day',
                growBonus:1, yieldBonus:0, speedMult:0 },
    compost:  { n:'Rich Compost',     e:'🪱', cost:120,
                desc:'+2 extra growth per watered day',
                growBonus:2, yieldBonus:0, speedMult:0 },
    speedgrow:{ n:'Speed Grow',       e:'⚡', cost:200,
                desc:'Crops advance 2× on every watered day',
                growBonus:0, yieldBonus:0, speedMult:1 },
    mega:     { n:'Mega Fertilizer',  e:'💎', cost:350,
                desc:'+35% bonus yield chance on harvest',
                growBonus:0, yieldBonus:0.35, speedMult:0 },
  };

  /* Expose so other patches can read it */
  window.FERTILIZERS = FERTILIZERS;

  /* ── CSS ────────────────────────────────────────────────────── */
  var css = document.createElement('style');
  css.textContent = [
    /* Badge icon on fertilized tiles */
    '.fert-badge {',
    '  position:absolute; bottom:2px; right:2px;',
    '  font-size:10px; line-height:1; opacity:0.88;',
    '  pointer-events:none; user-select:none; z-index:4;',
    '  text-shadow:0 1px 2px rgba(0,0,0,0.5);',
    '}',
    /* Shop fertilizer card accent */
    '.fert-card { border-left:3px solid #16a34a !important; }',
    '.fert-card:hover { border-color:#22c55e !important; }',
  ].join('\n');
  document.head.appendChild(css);

  /* ── State helpers ──────────────────────────────────────────── */
  function ensureFertInv() {
    if (typeof G !== 'undefined' && !G.fertilizers) G.fertilizers = {};
  }

  /* ── Patch initState ────────────────────────────────────────── */
  var _waitInit = setInterval(function () {
    if (typeof window.initState !== 'function') return;
    clearInterval(_waitInit);
    var _orig = window.initState;
    window.initState = function () {
      _orig.apply(this, arguments);
      if (G) G.fertilizers = {};
    };
  }, 100);

  /* ── Patch loadState ────────────────────────────────────────── */
  var _waitLoad = setInterval(function () {
    if (typeof window.loadState !== 'function') return;
    clearInterval(_waitLoad);
    var _orig = window.loadState;
    window.loadState = function (s) {
      _orig.apply(this, arguments);
      if (G && !G.fertilizers) G.fertilizers = {};
    };
  }, 100);

  /* ── Buy fertilizer (called by event binding in renderSide) ─── */
  window.buyFertilizer = function (id, qty) {
    var f = FERTILIZERS[id];
    if (!f) return;
    ensureFertInv();
    var cost = f.cost * qty;
    if (G.gold < cost) {
      if (typeof toast === 'function') toast('Need ' + cost + 'g! 💸', 'error');
      if (typeof snd  === 'function') snd('error');
      return;
    }
    G.gold -= cost;
    G.fertilizers[id] = (G.fertilizers[id] || 0) + qty;
    if (typeof snd   === 'function') snd('buy');
    if (typeof toast === 'function') toast('Bought ×' + qty + ' ' + f.n + '! ' + f.e, 'success');
    if (typeof render === 'function') render();
  };

  /* ── Fertilizer section HTML ────────────────────────────────── */
  function buildFertSection() {
    ensureFertInv();
    var h = '<div class="s-sec">🌿 Fertilizers <span style="font-size:9px;font-weight:400;opacity:.6">(Town Supply)</span></div>';
    h += '<div style="font-size:10px;color:var(--text-muted);margin:-4px 0 7px;padding:0 2px">Select the 🌿 Fert tool then tap tilled soil to apply. Effects last until harvest.</div>';
    Object.entries(FERTILIZERS).forEach(function (_ref) {
      var id = _ref[0], f = _ref[1];
      var have    = (G.fertilizers && G.fertilizers[id]) || 0;
      var cost1   = f.cost;
      var cost3   = f.cost * 3;
      var canBuy1 = G && G.gold >= cost1;
      var canBuy3 = G && G.gold >= cost3;
      h += '<div class="shop-card fert-card">';
      h += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">';
      h += '<span class="shop-name">' + f.e + ' ' + f.n + '</span>';
      h += '<span class="shop-price">' + cost1 + 'g each</span></div>';
      h += '<div class="shop-meta">' + f.desc + ' &nbsp;·&nbsp; Have: ' + have + '</div>';
      h += '<div class="shop-row">';
      h += '<button class="buy-btn" data-buy-fert="' + id + '" data-qty="1" ' + (canBuy1 ? '' : 'disabled') + '>×1 (' + cost1 + 'g)</button>';
      h += '<button class="buy-btn" data-buy-fert="' + id + '" data-qty="3" ' + (canBuy3 ? '' : 'disabled') + '>×3 (' + cost3 + 'g)</button>';
      h += '</div></div>';
    });
    return h;
  }

  /* ── Patch buildShop to add fertilizer section ──────────────── */
  var _waitShop = setInterval(function () {
    if (typeof window.buildShop !== 'function') return;
    clearInterval(_waitShop);
    var _orig = window.buildShop;
    window.buildShop = function () {
      var base = _orig.apply(this, arguments);
      /* Skip in winter — base already returns the auction screen */
      if (typeof season === 'function' && season() === 'Winter') return base;
      return base + buildFertSection();
    };
  }, 100);

  /* ── Patch renderSide to bind fertilizer buy buttons ────────── */
  var _waitRS = setInterval(function () {
    if (typeof window.renderSide !== 'function') return;
    clearInterval(_waitRS);
    var _origRS = window.renderSide;
    window.renderSide = function () {
      _origRS.apply(this, arguments);
      ['side-content', 'sheet-content'].forEach(function (panelId) {
        var el = document.getElementById(panelId);
        if (!el) return;
        el.querySelectorAll('[data-buy-fert]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            window.buyFertilizer(btn.dataset.buyFert, +btn.dataset.qty || 1);
          });
        });
      });
      updateFertSel();
    };
  }, 100);

  /* ── Fertilize tool button + select ─────────────────────────── */
  function injectFertTool() {
    if (document.getElementById('tool-fert')) return; // already injected
    var seedBtn = document.getElementById('tool-seed');
    if (!seedBtn) return;

    var btn = document.createElement('button');
    btn.className = 'tool-btn';
    btn.id = 'tool-fert';
    btn.title = 'Apply Fertilizer to tilled soil';
    btn.textContent = '🌿 Fert';
    btn.addEventListener('click', function () {
      if (typeof setTool === 'function') setTool('fert');
    });
    seedBtn.insertAdjacentElement('afterend', btn);

    var sel = document.createElement('select');
    sel.id = 'fert-select';
    sel.style.cssText = 'display:none;font-size:11px;padding:4px 7px;border-radius:8px;border:1.5px solid var(--ui-border);background:var(--ui-bg);color:var(--text-primary);font-family:Nunito,sans-serif;font-weight:700';
    sel.addEventListener('change', function () {
      if (typeof G !== 'undefined') G.selectedFert = sel.value;
    });
    btn.insertAdjacentElement('afterend', sel);
    updateFertSel();
  }

  function updateFertSel() {
    var sel = document.getElementById('fert-select');
    if (!sel || typeof G === 'undefined') return;
    ensureFertInv();
    sel.innerHTML = Object.entries(FERTILIZERS).map(function (_ref2) {
      var id = _ref2[0], f = _ref2[1];
      var have = (G.fertilizers && G.fertilizers[id]) || 0;
      return '<option value="' + id + '" ' + (have > 0 ? '' : 'disabled') + '>' +
             f.e + ' ' + f.n + ' (×' + have + ')</option>';
    }).join('');
    /* Prefer current selection; fall back to first available */
    var avail = Object.keys(FERTILIZERS).find(function (id) { return (G.fertilizers[id] || 0) > 0; });
    if (G.selectedFert && (G.fertilizers[G.selectedFert] || 0) > 0) {
      sel.value = G.selectedFert;
    } else if (avail) {
      G.selectedFert = avail; sel.value = avail;
    }
    sel.style.display = (G.tool === 'fert') ? 'inline-block' : 'none';
  }

  /* ── Patch setTool for fert visibility ──────────────────────── */
  var _waitST = setInterval(function () {
    if (typeof window.setTool !== 'function') return;
    clearInterval(_waitST);
    var _orig = window.setTool;
    window.setTool = function (t) {
      _orig.apply(this, arguments);
      var fertBtn = document.getElementById('tool-fert');
      if (fertBtn) fertBtn.classList.toggle('active', t === 'fert');
      var fertSel = document.getElementById('fert-select');
      if (fertSel) fertSel.style.display = (t === 'fert') ? 'inline-block' : 'none';
      if (t === 'fert') updateFertSel();
    };
  }, 100);

  /* ── Patch clickTile — handle 'fert' tool ───────────────────── */
  var _waitCT = setInterval(function () {
    if (typeof window.clickTile !== 'function') return;
    clearInterval(_waitCT);
    var _origCT = window.clickTile;
    window.clickTile = function (r, c) {
      if (typeof G === 'undefined' || G.tool !== 'fert') {
        return _origCT.apply(this, arguments);
      }
      if (G.energy <= 0) {
        if (typeof toast === 'function') toast('Too tired! 😴 Sleep to restore energy.', 'error');
        return;
      }
      var tile = G.farm[r][c];
      if (!tile.tilled) {
        if (typeof toast === 'function') toast('Till the soil first!', 'warn', 1200);
        return;
      }
      ensureFertInv();
      var fertId = (G.selectedFert && (G.fertilizers[G.selectedFert] || 0) > 0)
                  ? G.selectedFert : null;
      if (!fertId) {
        if (typeof toast === 'function') toast('No fertilizer! Buy some from the Shop tab. 🌿', 'warn');
        return;
      }
      if (tile.fertilizer) {
        var existing = FERTILIZERS[tile.fertilizer];
        if (typeof toast === 'function')
          toast('Already fertilized (' + (existing ? existing.n : tile.fertilizer) + ')!', 'info', 1200);
        return;
      }
      G.fertilizers[fertId]--;
      if (!G.fertilizers[fertId]) delete G.fertilizers[fertId];
      G.farm[r][c] = Object.assign({}, tile, { fertilizer: fertId });
      if (typeof S !== 'undefined' && S.energyCost) G.energy = Math.max(0, G.energy - 1);
      if (typeof snd   === 'function') snd('place');
      if (typeof toast === 'function')
        toast(FERTILIZERS[fertId].e + ' ' + FERTILIZERS[fertId].n + ' applied! 🌿', 'success', 1400);
      updateFertSel();
      if (typeof render === 'function') render();
    };
  }, 100);

  /* ── Patch advanceFarmGrid — fertilizer growth bonuses ──────── */
  var _waitAFG = setInterval(function () {
    if (typeof window.advanceFarmGrid !== 'function') return;
    clearInterval(_waitAFG);
    var _origAFG = window.advanceFarmGrid;
    window.advanceFarmGrid = function (farm, hasGreenhouse, hasSprinkler) {
      var result = _origAFG.apply(this, arguments);
      /* Apply fertilizer-specific growth boosts */
      for (var r = 0; r < result.length; r++) {
        for (var c = 0; c < result[r].length; c++) {
          var origTile = farm[r] && farm[r][c];
          var newTile  = result[r] && result[r][c];
          if (!origTile || !newTile || !origTile.fertilizer) continue;
          if (!newTile.crop) continue; /* crop died / wrong season */
          var f = FERTILIZERS[origTile.fertilizer];
          if (!f) continue;
          /* Carry fertilizer forward (it stays until crop is harvested) */
          newTile.fertilizer = origTile.fertilizer;
          /* Only apply bonus on days the crop was watered */
          if (!origTile.watered) continue;
          var maxDays = (typeof CROPS !== 'undefined' && CROPS[newTile.crop.type])
                        ? CROPS[newTile.crop.type].days : 999;
          /* Extra grow progress per watered day */
          if (f.growBonus > 0) {
            newTile.crop.days = Math.min(maxDays, (newTile.crop.days || 0) + f.growBonus);
          }
          /* Speed-grow: one extra advance (net ×2 progress per day) */
          if (f.speedMult > 0) {
            newTile.crop.days = Math.min(maxDays, (newTile.crop.days || 0) + 1);
          }
        }
      }
      return result;
    };
  }, 100);

  /* ── Patch clickTile scythe branch — mega fertilizer yield ──── */
  /* We hook addXP indirectly: after harvest, if tile had mega fert
     we give an extra item to the bag. We do this by wrapping the
     scythe outcome inside clickTile (already wrapped above). */
  var _waitScythe = setInterval(function () {
    if (typeof window.scytheAll !== 'function') return;
    clearInterval(_waitScythe);
    var _origSA = window.scytheAll;
    window.scytheAll = function () {
      /* Before bulk harvest, credit mega-fert bonus items */
      if (typeof G !== 'undefined' && G.farm) {
        G.farm.forEach(function (row) {
          row.forEach(function (tile) {
            if (!tile.crop || !tile.fertilizer) return;
            var f = FERTILIZERS[tile.fertilizer];
            if (!f || !f.yieldBonus) return;
            if (Math.random() < f.yieldBonus) {
              tile._megaBonus = true;
            }
          });
        });
      }
      _origSA.apply(this, arguments);
    };
  }, 100);

  /* ── Patch renderFarm — show fertilizer badge on tiles ──────── */
  var _waitRF = setInterval(function () {
    if (typeof window.renderFarm !== 'function') return;
    clearInterval(_waitRF);
    var _origRF = window.renderFarm;
    window.renderFarm = function () {
      _origRF.apply(this, arguments);
      var grid = document.getElementById('farm-grid');
      if (!grid || typeof G === 'undefined' || !G.farm) return;
      var GW_v = typeof GW !== 'undefined' ? GW : 14;
      var GH_v = typeof GH !== 'undefined' ? GH : 10;
      var landTrees = [];
      if (typeof LAND_TREES !== 'undefined' && G.currentLand) {
        landTrees = LAND_TREES[G.currentLand] || LAND_TREES.home || [];
      }
      var treeKeys = new Set(landTrees.map(function (t) { return t[0] * 100 + t[1]; }));
      var idx = 0;
      for (var r = 0; r < GH_v; r++) {
        for (var c = 0; c < GW_v; c++) {
          var el = grid.children[idx++];
          if (!el) continue;
          if (treeKeys.has(r * 100 + c)) continue;
          var tile = G.farm[r] && G.farm[r][c];
          if (!tile || !tile.fertilizer) continue;
          var f = FERTILIZERS[tile.fertilizer];
          if (!f) continue;
          var badge = document.createElement('span');
          badge.className = 'fert-badge';
          badge.textContent = f.e;
          badge.title = f.n + ' applied';
          el.appendChild(badge);
        }
      }
    };
  }, 100);

  /* ── Inject tool button once toolbar is in DOM ──────────────── */
  var _toolInt = setInterval(function () {
    if (document.getElementById('toolbar')) {
      injectFertTool();
      clearInterval(_toolInt);
    }
  }, 200);

  console.log('[BIG UPDATE 2] Fertilizer System loaded.');
})();


/* ────────────────────── bu3.js ────────────────────── */
/* ═══════════════════════════════════════════════════════════════
   BIG UPDATE — Part 3: JOBS SYSTEM  v1.0
   Adds a Jobs Board to the Shop tab.  Take one job at a time —
   each grants daily income and a special perk.

   Jobs:
    👷 Construction Worker  — free to hire
         Perk:  Unlocks "⚒ Till Field" button — tills the entire
                farm in one click (costs 15 energy).
         Pay:   +40g / day

    🚚 Delivery Driver       — free to hire
         Perk:  +12% bonus on every Ship-All or auction sale.
         Pay:   +35g / day

    🌱 Apprentice Gardener   — free to hire
         Perk:  +20% XP on all farming/watering/harvesting actions.
         Pay:   +20g / day

    🔭 Field Scout           — costs 80g to hire
         Perk:  Shows tomorrow's weather forecast each morning.
         Pay:   +55g / day (premium position)
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Job definitions ─────────────────────────────────────────── */
  var JOBS = {
    construction: {
      id:'construction', e:'👷', n:'Construction Worker',
      desc:'Hire yourself out as a construction worker. Unlocks the "Till Field" button — tills every untilled grass tile on this farm in one click.',
      perks:['⚒ Till entire field in one click','40g daily wage'],
      dailyPay:40, hireCost:0,
      perkTag:'⚒ Till Field Unlocked',
    },
    driver: {
      id:'driver', e:'🚚', n:'Delivery Driver',
      desc:'Work as a produce delivery driver between seasons. All your crop shipments and auction sales earn +12% more gold.',
      perks:['+12% on all crop sales','35g daily wage'],
      dailyPay:35, hireCost:0,
      perkTag:'📦 +12% Sales Bonus Active',
    },
    gardener: {
      id:'gardener', e:'🌱', n:'Apprentice Gardener',
      desc:'Part-time job at the community garden. You gain +20% XP from tilling, watering, and harvesting on your own farm.',
      perks:['+20% XP from all farm actions','20g daily wage'],
      dailyPay:20, hireCost:0,
      perkTag:'⭐ +20% XP Active',
    },
    scout: {
      id:'scout', e:'🔭', n:'Field Scout',
      desc:'Scout terrain and forecast weather for local farms. Requires an 80g equipment fee. Shows tomorrow\'s weather each morning.',
      perks:['🌤 Tomorrow\'s weather revealed each morning','55g daily wage'],
      dailyPay:55, hireCost:80,
      perkTag:'🌤 Weather Forecast Active',
    },
  };

  /* Expose globally */
  window.JOBS = JOBS;

  /* ── CSS ─────────────────────────────────────────────────────── */
  var css = document.createElement('style');
  css.textContent = [
    '.job-card {',
    '  padding:10px 12px; background:var(--ui-bg2);',
    '  border:1.5px solid var(--ui-border); border-radius:13px;',
    '  margin-bottom:8px; transition:border-color .15s;',
    '}',
    '.job-card:hover { border-color:#86efac; }',
    '.job-card-active { border-color:#22c55e !important;',
    '  background:linear-gradient(135deg,rgba(34,197,94,.06),rgba(34,197,94,.02)) !important; }',
    '.job-title { font-size:13px; font-weight:800; color:var(--text-primary); }',
    '.job-pay   { font-size:11px; color:#16a34a; font-weight:700; }',
    '.job-desc  { font-size:10.5px; color:var(--text-muted); margin:4px 0 6px; line-height:1.5; }',
    '.job-perks { font-size:10px; color:var(--green); font-weight:700; margin-bottom:6px; }',
    '.job-perk-item::before { content:"✓ "; }',
    '.job-btn-row { display:flex; gap:5px; }',
    '.job-hire-btn {',
    '  flex:1; padding:7px 10px; border:none; border-radius:9px;',
    '  background:linear-gradient(135deg,#22c55e,#16a34a); color:#fff;',
    '  font-family:Nunito,sans-serif; font-size:11px; font-weight:800;',
    '  cursor:pointer; transition:opacity .15s;',
    '}',
    '.job-hire-btn:disabled { opacity:.4; cursor:not-allowed; }',
    '.job-hire-btn:not(:disabled):hover { opacity:.85; }',
    '.job-quit-btn {',
    '  padding:7px 10px; border:1.5px solid #ef4444; border-radius:9px;',
    '  background:transparent; color:#ef4444; font-family:Nunito,sans-serif;',
    '  font-size:11px; font-weight:800; cursor:pointer; transition:all .15s;',
    '}',
    '.job-quit-btn:hover { background:rgba(239,68,68,.1); }',
    '.job-active-badge {',
    '  display:inline-block; padding:2px 8px; border-radius:20px;',
    '  background:rgba(34,197,94,.12); color:#16a34a; font-size:10px; font-weight:800;',
    '  border:1px solid rgba(34,197,94,.3); margin-bottom:6px;',
    '}',
    /* Till Field toolbar button */
    '#tool-tillall {',
    '  background:linear-gradient(135deg,#d97706,#b45309) !important;',
    '  color:#fff !important; border-color:#b45309 !important;',
    '  font-weight:800 !important;',
    '}',
    '#tool-tillall:hover { opacity:.88; }',
    /* Job status pill in the job card */
    '.job-income-note {',
    '  font-size:9.5px; color:var(--text-muted); margin-top:4px; font-style:italic;',
    '}',
  ].join('\n');
  document.head.appendChild(css);

  /* ── State helpers ───────────────────────────────────────────── */
  function ensureJob() {
    if (typeof G !== 'undefined' && G.job === undefined) G.job = null;
  }

  /* ── Patch initState ─────────────────────────────────────────── */
  var _wI = setInterval(function () {
    if (typeof window.initState !== 'function') return;
    clearInterval(_wI);
    var _o = window.initState;
    window.initState = function () { _o.apply(this, arguments); if (G) G.job = null; };
  }, 100);

  /* ── Patch loadState ─────────────────────────────────────────── */
  var _wL = setInterval(function () {
    if (typeof window.loadState !== 'function') return;
    clearInterval(_wL);
    var _o = window.loadState;
    window.loadState = function (s) {
      _o.apply(this, arguments);
      if (G && G.job === undefined) G.job = null;
    };
  }, 100);

  /* ── Hire / quit ─────────────────────────────────────────────── */
  window.hireJob = function (id) {
    var job = JOBS[id];
    if (!job) return;
    ensureJob();
    if (G.job === id) { if (typeof toast === 'function') toast('You already have this job!', 'warn'); return; }
    if (G.gold < job.hireCost) {
      if (typeof toast === 'function') toast('Need ' + job.hireCost + 'g to take this job!', 'error');
      if (typeof snd === 'function') snd('error');
      return;
    }
    if (G.job !== null) {
      /* Auto-quit old job */
      var oldJob = JOBS[G.job];
      if (typeof toast === 'function' && oldJob)
        toast('Quit your ' + oldJob.n + ' job.', 'info', 2000);
    }
    G.gold -= job.hireCost;
    G.job = id;
    if (typeof snd   === 'function') snd('buy');
    if (typeof toast === 'function')
      toast(job.e + ' You\'re now a ' + job.n + '! ' + job.perkTag, 'success', 3500);
    updateTillAllBtn();
    if (typeof render === 'function') render();
  };

  window.quitJob = function () {
    ensureJob();
    if (!G.job) { if (typeof toast === 'function') toast('No job to quit!', 'info'); return; }
    var job = JOBS[G.job];
    G.job = null;
    if (typeof toast === 'function' && job)
      toast('You quit your ' + job.n + ' job. Good luck out there!', 'info', 2800);
    updateTillAllBtn();
    if (typeof render === 'function') render();
  };

  /* ── Jobs Board HTML ─────────────────────────────────────────── */
  function buildJobsSection() {
    ensureJob();
    var curJob  = G.job;
    var h = '<div class="s-sec">💼 Jobs Board</div>';
    h += '<div style="font-size:10px;color:var(--text-muted);margin:-4px 0 7px;padding:0 2px">';
    h += 'Hold one job at a time. Daily pay arrives every morning with your sleep. Perks are active immediately.</div>';

    if (curJob) {
      var cj = JOBS[curJob];
      h += '<div style="padding:7px 10px;background:rgba(34,197,94,.08);border:1.5px solid rgba(34,197,94,.3);border-radius:10px;font-size:11px;font-weight:700;color:#16a34a;margin-bottom:8px">';
      h += cj.e + ' Currently employed as: <b>' + cj.n + '</b>';
      h += '<br><span style="font-weight:400;font-size:10px;color:var(--text-muted)">+' + cj.dailyPay + 'g/day · ' + cj.perkTag + '</span>';
      h += '</div>';
    }

    Object.values(JOBS).forEach(function (job) {
      var isActive  = (curJob === job.id);
      var canAfford = G && G.gold >= job.hireCost;
      h += '<div class="job-card' + (isActive ? ' job-card-active' : '') + '">';
      h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px">';
      h += '<span class="job-title">' + job.e + ' ' + job.n + '</span>';
      h += '<span class="job-pay">+' + job.dailyPay + 'g/day</span>';
      h += '</div>';
      if (isActive) h += '<span class="job-active-badge">✓ Active Job</span><br>';
      h += '<div class="job-desc">' + job.desc + '</div>';
      h += '<div class="job-perks">';
      job.perks.forEach(function (p) {
        h += '<div class="job-perk-item">' + p + '</div>';
      });
      h += '</div>';
      if (job.hireCost > 0 && !isActive) {
        h += '<div class="job-income-note">Hire fee: ' + job.hireCost + 'g (equipment cost)</div>';
      }
      h += '<div class="job-btn-row">';
      if (isActive) {
        h += '<button class="job-quit-btn" onclick="quitJob()">Quit Job</button>';
      } else {
        h += '<button class="job-hire-btn" data-hire-job="' + job.id + '"' + (canAfford ? '' : ' disabled') + '>';
        h += (job.hireCost > 0 ? 'Hire (' + job.hireCost + 'g)' : 'Take Job — Free') + '</button>';
      }
      h += '</div>';
      h += '</div>';
    });
    return h;
  }

  /* ── Patch buildShop ─────────────────────────────────────────── */
  var _wS = setInterval(function () {
    if (typeof window.buildShop !== 'function') return;
    clearInterval(_wS);
    var _o = window.buildShop;
    window.buildShop = function () {
      return _o.apply(this, arguments) + buildJobsSection();
    };
  }, 100);

  /* ── Bind job hire buttons in renderSide ─────────────────────── */
  var _wRS = setInterval(function () {
    if (typeof window.renderSide !== 'function') return;
    clearInterval(_wRS);
    var _o = window.renderSide;
    window.renderSide = function () {
      _o.apply(this, arguments);
      ['side-content', 'sheet-content'].forEach(function (panelId) {
        var el = document.getElementById(panelId);
        if (!el) return;
        el.querySelectorAll('[data-hire-job]').forEach(function (btn) {
          btn.addEventListener('click', function () { window.hireJob(btn.dataset.hireJob); });
        });
      });
    };
  }, 100);

  /* ── Patch doSleep — award daily job pay ─────────────────────── */
  var _wSleep = setInterval(function () {
    if (typeof window.doSleep !== 'function') return;
    clearInterval(_wSleep);
    var _o = window.doSleep;
    window.doSleep = function () {
      ensureJob();
      /* Inject job pay into the morning-message queue after base sleep */
      var ret = _o.apply(this, arguments);
      if (G.job) {
        var job = JOBS[G.job];
        if (job) {
          /* Pay is credited by patching advanceDay, but we show the toast here */
          setTimeout(function () {
            if (typeof toast === 'function')
              toast(job.e + ' Job pay: +' + job.dailyPay + 'g (' + job.n + ')', 'success', 2800);
          }, 2800);
        }
      }
      return ret;
    };
  }, 100);

  /* ── Patch advanceDay — actually add the gold ────────────────── */
  var _wAD = setInterval(function () {
    if (typeof window.advanceDay !== 'function') return;
    clearInterval(_wAD);
    var _o = window.advanceDay;
    window.advanceDay = function () {
      _o.apply(this, arguments);
      ensureJob();
      if (G.job) {
        var job = JOBS[G.job];
        if (job) {
          G.gold += job.dailyPay;
          G.stats.earned = (G.stats.earned || 0) + job.dailyPay;
        }
        /* Field Scout: reveal weather forecast */
        if (G.job === 'scout') {
          var rainChance = {Spring:0.28,Summer:0.22,Fall:0.10,Winter:0}[
            typeof season === 'function' ? season() : 'Spring'] || 0.22;
          var likelyRain = Math.random() < rainChance;
          G._scoutForecast = likelyRain ? 'rainy' : 'sunny';
        }
      }
    };
  }, 100);

  /* ── Patch shipAll and auction for Delivery Driver bonus ──────── */
  var _wShip = setInterval(function () {
    if (typeof window.shipAll !== 'function' || typeof window.auctionSell !== 'function') return;
    clearInterval(_wShip);

    /* shipAll bonus */
    var _oShip = window.shipAll;
    window.shipAll = function () {
      _oShip.apply(this, arguments);
      ensureJob();
      if (G.job === 'driver' && G.pending > 0) {
        var bonus = Math.round(G.pending * 0.12);
        G.pending += bonus;
        if (typeof toast === 'function')
          setTimeout(function () { toast('🚚 Driver bonus: +' + bonus + 'g on shipping!', 'success', 2200); }, 400);
      }
    };

    /* auctionSell bonus */
    var _oAuct = window.auctionSell;
    window.auctionSell = function (type, qty) {
      ensureJob();
      if (G.job !== 'driver') { _oAuct.apply(this, arguments); return; }
      /* Call original, then add 12% on top */
      var goldBefore = G.gold;
      _oAuct.apply(this, arguments);
      var earned = G.gold - goldBefore;
      if (earned > 0) {
        var bonus = Math.round(earned * 0.12);
        G.gold += bonus;
        G.stats.earned = (G.stats.earned || 0) + bonus;
        if (typeof toast === 'function')
          setTimeout(function () { toast('🚚 Driver bonus: +' + bonus + 'g!', 'success', 1800); }, 400);
      }
    };
  }, 100);

  /* ── Patch addXP for Gardener +20% bonus ─────────────────────── */
  var _wXP = setInterval(function () {
    if (typeof window.addXP !== 'function') return;
    clearInterval(_wXP);
    var _o = window.addXP;
    window.addXP = function (skill, amount) {
      ensureJob();
      var finalAmount = amount;
      if (G.job === 'gardener') {
        finalAmount = Math.round(amount * 1.20);
      }
      _o.call(this, skill, finalAmount);
    };
  }, 100);

  /* ── Construction Worker: "Till Field" button ────────────────── */
  function tillEntireField() {
    ensureJob();
    if (G.job !== 'construction') {
      if (typeof toast === 'function') toast('You need to be a Construction Worker!', 'warn'); return;
    }
    if (G.energy < 15) {
      if (typeof toast === 'function') toast('Not enough energy! Need 15 energy.', 'error');
      if (typeof snd === 'function') snd('error');
      return;
    }
    var GW_v = typeof GW !== 'undefined' ? GW : 14;
    var GH_v = typeof GH !== 'undefined' ? GH : 10;
    var landTrees = [];
    if (typeof LAND_TREES !== 'undefined' && G.currentLand) {
      landTrees = LAND_TREES[G.currentLand] || LAND_TREES.home || [];
    }
    var treeKeys = new Set(landTrees.map(function (t) { return t[0] * 100 + t[1]; }));
    var fLv = typeof getLevel === 'function' ? getLevel((G.skills && G.skills.farming && G.skills.farming.xp) || 0) : 1;
    var count = 0;
    for (var r = 0; r < GH_v; r++) {
      for (var c = 0; c < GW_v; c++) {
        if (treeKeys.has(r * 100 + c)) continue;
        var tile = G.farm[r][c];
        if (tile.tilled || tile.deco || tile.crop) continue;
        var newTile = Object.assign({}, tile, { tilled: true, idleDays: 0, deco: null });
        if (fLv >= 10) newTile.watered = true;
        G.farm[r][c] = newTile;
        count++;
      }
    }
    if (count === 0) {
      if (typeof toast === 'function') toast('All tillable soil is already tilled!', 'info'); return;
    }
    if (typeof S !== 'undefined' && S.energyCost) G.energy = Math.max(0, G.energy - 15);
    if (typeof addXP === 'function') addXP('farming', Math.round(count * 2.5));
    if (typeof snd   === 'function') snd('till');
    if (typeof toast === 'function')
      toast('👷 Tilled ' + count + ' tiles! Great work! ⛏', 'success', 2400);
    if (typeof render === 'function') render();
  }
  window.tillEntireField = tillEntireField;

  function updateTillAllBtn() {
    var btn = document.getElementById('tool-tillall');
    if (!btn) return;
    ensureJob();
    btn.style.display = (G.job === 'construction') ? 'inline-flex' : 'none';
  }

  function injectTillAllBtn() {
    if (document.getElementById('tool-tillall')) return;
    var scytheBtn = document.getElementById('tool-scythe');
    if (!scytheBtn) return;
    var btn = document.createElement('button');
    btn.className = 'tool-btn';
    btn.id = 'tool-tillall';
    btn.title = 'Construction Worker: Till entire farm in one go';
    btn.textContent = '⚒ Till Field';
    btn.style.display = 'none';
    btn.addEventListener('click', tillEntireField);
    scytheBtn.insertAdjacentElement('afterend', btn);
  }

  /* ── Patch render — sync Till Field button visibility ─────────── */
  var _wR = setInterval(function () {
    if (typeof window.render !== 'function') return;
    clearInterval(_wR);
    var _o = window.render;
    window.render = function () {
      _o.apply(this, arguments);
      updateTillAllBtn();
      /* Scout forecast pill in HUD */
      if (G.job === 'scout' && G._scoutForecast) {
        var hud = document.getElementById('hud-weather');
        if (hud && hud.parentElement) {
          var pip = hud.parentElement.querySelector('.scout-tomorrow');
          if (!pip) {
            pip = document.createElement('span');
            pip.className = 'scout-tomorrow';
            pip.style.cssText = 'font-size:9px;opacity:.7;margin-left:3px;';
            hud.parentElement.appendChild(pip);
          }
          pip.textContent = '→' + (G._scoutForecast === 'rainy' ? '🌧' : '☀️');
          pip.title = 'Scout forecast: tomorrow will be ' + G._scoutForecast;
        }
      }
    };
  }, 100);

  /* ── Inject button once DOM is ready ────────────────────────── */
  var _tbInt = setInterval(function () {
    if (document.getElementById('toolbar')) {
      injectTillAllBtn();
      clearInterval(_tbInt);
    }
  }, 200);

  console.log('[BIG UPDATE 3] Jobs System loaded.');
})();


/* ────────────────────── bu4.js ────────────────────── */
/* ═══════════════════════════════════════════════════════════════
   BIG UPDATE — Part 4: HOE AREA UPGRADES  v1.0
   Adds two upgrades to the Upgrades tab that increase the hoe's
   tilling area.

   ⚒️  Iron Hoe Head  (1,200g) — Hoe tills a 3×3 area per swing.
   🔩  Steel Hoe Head (2,500g) — Hoe tills a 4×4 area per swing.
                                   Requires Iron Hoe Head first.

   Both upgrades are per-land (like all other upgrades) so you
   need to buy them separately for each plot you own.
   A subtle preview box appears when hovering over the farm grid
   while the Hoe tool is active.
   ═══════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── Register upgrades into the game's UPGRADES object ──────── */
  /* UPGRADES is declared with `const` in script.js but it is an
     object, so adding properties is legal.                        */
  var _waitUpgrades = setInterval(function () {
    if (typeof UPGRADES === 'undefined') return;
    clearInterval(_waitUpgrades);

    UPGRADES.hoe_3x3 = {
      n:'Iron Hoe Head', e:'⚒️',
      desc:'Hoe tills a 3×3 patch of soil in one swing. Dramatically speeds up field preparation!',
      cost:1200, max:1,
    };
    UPGRADES.hoe_4x4 = {
      n:'Steel Hoe Head', e:'🔩',
      desc:'Upgrade to a massive 4×4 tilling area. One swing clears 16 tiles! Requires the Iron Hoe Head.',
      cost:2500, max:1,
    };

    console.log('[BIG UPDATE 4] Hoe upgrades registered in UPGRADES.');
  }, 100);

  /* ── Prerequisite check — block hoe_4x4 without hoe_3x3 ──────── */
  var _waitBU = setInterval(function () {
    if (typeof window.buyUpgrade !== 'function') return;
    clearInterval(_waitBU);
    var _orig = window.buyUpgrade;
    window.buyUpgrade = function (id) {
      if (id === 'hoe_4x4') {
        var upgs = typeof curUpgs === 'function' ? curUpgs() : {};
        if (!(upgs.hoe_3x3 >= 1)) {
          if (typeof toast === 'function')
            toast('🔒 Buy the Iron Hoe Head (3×3) first!', 'warn', 2800);
          if (typeof snd === 'function') snd('error');
          return;
        }
      }
      _orig.apply(this, arguments);
    };
    console.log('[BIG UPDATE 4] buyUpgrade prerequisite check applied.');
  }, 100);

  /* ── CSS ─────────────────────────────────────────────────────── */
  var css = document.createElement('style');
  css.textContent = [
    /* Hover-preview highlight for multi-tile hoe area */
    '.hoe-preview {',
    '  outline: 2.5px dashed rgba(251,146,60,0.80) !important;',
    '  outline-offset: -2px;',
    '  background-color: rgba(251,146,60,0.14) !important;',
    '  z-index: 4;',
    '}',
    /* Corner badge on hoe tool button showing current area */
    '#tool-hoe { position:relative; }',
    '#hoe-area-badge {',
    '  position:absolute; top:-5px; right:-5px;',
    '  font-size:8px; font-weight:900;',
    '  background:#d97706; color:#fff;',
    '  border-radius:20px; padding:1px 5px;',
    '  pointer-events:none; line-height:1.4;',
    '  box-shadow:0 1px 3px rgba(0,0,0,.25);',
    '}',
  ].join('\n');
  document.head.appendChild(css);

  /* ── Helper: get current hoe size ───────────────────────────── */
  function getHoeSize() {
    if (typeof curUpgs !== 'function') return 1;
    var upgs = curUpgs();
    if ((upgs.hoe_4x4 || 0) >= 1 && (upgs.hoe_3x3 || 0) >= 1) return 4;
    if ((upgs.hoe_3x3 || 0) >= 1) return 3;
    return 1;
  }

  /* ── Helper: get tile offsets for a given size & center ──────── */
  function getHoeOffsets(size) {
    /* 1×1 → just [0,0]
       3×3 → -1..+1  (center is clicked tile)
       4×4 → -1..+2  (clicked tile at top-left quadrant) */
    var arr = [];
    var range = size === 4 ? [-1, 0, 1, 2] : size === 3 ? [-1, 0, 1] : [0];
    for (var i = 0; i < range.length; i++) {
      for (var j = 0; j < range.length; j++) {
        arr.push([range[i], range[j]]);
      }
    }
    return arr;
  }

  /* ── Patch clickTile — multi-tile hoe ────────────────────────── */
  var _waitCT = setInterval(function () {
    if (typeof window.clickTile !== 'function') return;
    clearInterval(_waitCT);
    var _orig = window.clickTile;
    window.clickTile = function (r, c) {
      /* Only intercept Hoe with an area upgrade */
      if (typeof G === 'undefined' || G.tool !== 'hoe') {
        return _orig.apply(this, arguments);
      }
      var size = getHoeSize();
      if (size === 1) {
        return _orig.apply(this, arguments);  /* no upgrade — use default */
      }

      /* ---- Multi-tile tilling ----------------------------------- */
      var GW_v = typeof GW !== 'undefined' ? GW : 14;
      var GH_v = typeof GH !== 'undefined' ? GH : 10;
      var landTrees = [];
      if (typeof LAND_TREES !== 'undefined' && G.currentLand) {
        landTrees = LAND_TREES[G.currentLand] || LAND_TREES.home || [];
      }
      var treeKeys = new Set(landTrees.map(function (t) { return t[0] * 100 + t[1]; }));
      var fLv = typeof getLevel === 'function'
        ? getLevel((G.skills && G.skills.farming && G.skills.farming.xp) || 0)
        : 1;
      var offsets = getHoeOffsets(size);
      var count = 0;
      var alreadyDone = 0;

      offsets.forEach(function (off) {
        var nr = r + off[0], nc = c + off[1];
        if (nr < 0 || nr >= GH_v || nc < 0 || nc >= GW_v) return;
        if (treeKeys.has(nr * 100 + nc)) return;
        var tile = G.farm[nr][nc];
        if (tile.tilled) { alreadyDone++; return; }
        if (tile.deco)   return;
        var newTile = Object.assign({}, tile, { tilled:true, idleDays:0, deco:null });
        if (fLv >= 10) newTile.watered = true;
        G.farm[nr][nc] = newTile;
        count++;
        /* Reduced energy cost per tile: area tools cost less */
        if (fLv < 5 && typeof S !== 'undefined' && S.energyCost) {
          G.energy = Math.max(0, G.energy - 0.4);
        }
        /* XP: slightly less per tile to balance the efficiency */
        if (typeof addXP === 'function') addXP('farming', 3);
      });

      if (count === 0) {
        if (alreadyDone > 0) {
          if (typeof toast === 'function') toast('Area already tilled!', 'info', 900);
        }
        return;
      }

      if (typeof snd === 'function') snd('till');
      var label = size + '×' + size;
      if (typeof toast === 'function')
        toast('⚒️ ' + label + ' area tilled! (' + count + ' tiles)', 'success', 1400);

      /* Clamp energy floor */
      if (typeof S !== 'undefined' && S.energyCost && G.energy < 0) G.energy = 0;

      if (typeof render === 'function') render();
    };
    console.log('[BIG UPDATE 4] Multi-tile hoe clickTile patch applied.');
  }, 100);

  /* ── Hoe-preview: highlight affected tiles on mouse-over ─────── */
  var _previewActive = false;
  var _previewTiles  = [];

  function clearPreview() {
    _previewTiles.forEach(function (el) { el.classList.remove('hoe-preview'); });
    _previewTiles = [];
    _previewActive = false;
  }

  function showPreview(r, c) {
    clearPreview();
    if (typeof G === 'undefined' || G.tool !== 'hoe') return;
    var size = getHoeSize();
    if (size === 1) return;
    var GW_v = typeof GW !== 'undefined' ? GW : 14;
    var GH_v = typeof GH !== 'undefined' ? GH : 10;
    var grid = document.getElementById('farm-grid');
    if (!grid) return;
    /* Build tree key set */
    var landTrees = [];
    if (typeof LAND_TREES !== 'undefined' && G.currentLand) {
      landTrees = LAND_TREES[G.currentLand] || LAND_TREES.home || [];
    }
    var treeKeys = new Set(landTrees.map(function (t) { return t[0] * 100 + t[1]; }));
    var offsets = getHoeOffsets(size);
    offsets.forEach(function (off) {
      var nr = r + off[0], nc = c + off[1];
      if (nr < 0 || nr >= GH_v || nc < 0 || nc >= GW_v) return;
      if (treeKeys.has(nr * 100 + nc)) return;
      var tile = G.farm[nr] && G.farm[nr][nc];
      if (!tile || tile.tilled || tile.deco) return;
      /* Tile index in the grid */
      var idx = nr * GW_v + nc;
      /* Count tree tiles before this index */
      var treesBefore = 0;
      landTrees.forEach(function (t) {
        if (t[0] * GW_v + t[1] < idx) treesBefore++;
      });
      var el = grid.children[idx];
      if (el && !el.classList.contains('tile-tree')) {
        el.classList.add('hoe-preview');
        _previewTiles.push(el);
        _previewActive = true;
      }
    });
  }

  /* Attach hover listeners after renderFarm rebuilds the grid */
  function attachHoverListeners() {
    var grid = document.getElementById('farm-grid');
    if (!grid) return;
    var GW_v = typeof GW !== 'undefined' ? GW : 14;
    var GH_v = typeof GH !== 'undefined' ? GH : 10;
    var landTrees = [];
    if (typeof LAND_TREES !== 'undefined' && G && G.currentLand) {
      landTrees = LAND_TREES[G.currentLand] || LAND_TREES.home || [];
    }
    var treeKeys = new Set(landTrees.map(function (t) { return t[0] * 100 + t[1]; }));
    var idx = 0;
    for (var r = 0; r < GH_v; r++) {
      for (var c = 0; c < GW_v; c++) {
        (function (rr, cc, el) {
          if (!el) return;
          if (treeKeys.has(rr * 100 + cc)) return;
          el.addEventListener('mouseenter', function () { showPreview(rr, cc); });
          el.addEventListener('mouseleave', function () { clearPreview(); });
        })(r, c, grid.children[idx]);
        idx++;
      }
    }
  }

  /* ── Patch renderFarm to attach hover listeners & badge ──────── */
  var _waitRF = setInterval(function () {
    if (typeof window.renderFarm !== 'function') return;
    clearInterval(_waitRF);
    var _orig = window.renderFarm;
    window.renderFarm = function () {
      _orig.apply(this, arguments);
      /* Re-attach hover listeners after every DOM rebuild */
      if (getHoeSize() > 1) attachHoverListeners();
      /* Update hoe area badge */
      updateHoeBadge();
    };
    console.log('[BIG UPDATE 4] renderFarm patched for hoe preview.');
  }, 100);

  /* ── Corner badge on hoe button ──────────────────────────────── */
  function updateHoeBadge() {
    var hoeBtn = document.getElementById('tool-hoe');
    if (!hoeBtn) return;
    var size   = getHoeSize();
    var badge  = document.getElementById('hoe-area-badge');
    if (size > 1) {
      if (!badge) {
        badge = document.createElement('span');
        badge.id = 'hoe-area-badge';
        hoeBtn.style.position = 'relative';
        hoeBtn.appendChild(badge);
      }
      badge.textContent = size + '×' + size;
      badge.style.display = 'block';
    } else if (badge) {
      badge.style.display = 'none';
    }
  }

  /* ── Patch render to sync badge ──────────────────────────────── */
  var _waitRend = setInterval(function () {
    if (typeof window.render !== 'function') return;
    clearInterval(_waitRend);
    var _orig = window.render;
    window.render = function () {
      _orig.apply(this, arguments);
      updateHoeBadge();
    };
  }, 100);

  console.log('[BIG UPDATE 4] Hoe Area Upgrades loaded.');
})();


/* ────────────────────── bu5.js ────────────────────── */
/* ═══════════════════════════════════════════════════════
   tbu5.js — Merged Patch Bundle
   Generated: 2026-06-06
   Sources:   patch_v3.js, patch_v3b.js
   ═══════════════════════════════════════════════════════ */


/* ──────────────────────── patch_v3.js ──────────────────────── */
/* ═══════════════════════════════════════════════════════════════════════
   VALLEY FARM — PATCH v3.0  (patch_v3.js)
   ─────────────────────────────────────────────────────────────────────
   Load order: after script.js · winter.js · winterpatch.js · tbu.js
               · mobilepatch.js · mpfix4.js

   What this patch does
   ─────────────────────
   1. MOBILE GRID FIX  — Farm tiles scale to fill viewport width on
                         mobile; no more gaps or horizontal scroll.
                         Tiles stay square via aspect-ratio CSS.
                         JS patch overrides renderFarm's inline
                         grid-template-columns on narrow screens.

   2. HOE UPGRADE NAMES — "Iron Hoe Head" → "Hoe Upgrade" (3×3)
                           "Steel Hoe Head" → "Iron Head" (4×4)

   3. HOE PICKER MENU  — Clicking ⛏ Hoe opens a visual size picker:
                         [ 1×1 ] [ 2×2 ] [ 3×3 🔒 ] [ 4×4 🔒 ]
                         + a [ 🌿 Fert ] switch button.
                         Selecting Fert switches the active tool and
                         changes the Hoe toolbar button to "🌿 Fert".
                         Re-clicking "🌿 Fert" button returns to Hoe.
                         Works on both PC toolbar and mobile dock.

   4. CITY HUB MENU    — Traveling to the City now shows an
                         intermediate hub screen first:
                           📊 Stock Exchange  |  💼 Jobs Board
                         Jobs Board is also added as a tab inside the
                         City screen; it is removed from the Shop tab.

   NOTE: Does NOT modify any source files. Pure monkey-patch.
═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ────────────────────────────────────────────────────────────────────
     SECTION 0  CSS
  ──────────────────────────────────────────────────────────────────── */
  var style = document.createElement('style');
  style.id = 'vf-patchv3-css';
  style.textContent = `
/* ══ MOBILE GRID: fluid tiles that fill viewport ═══════════════════ */
@media (max-width: 680px) {
  #farm-wrap {
    padding: 0 !important;
    overflow: hidden !important;
    align-items: stretch !important;
  }
  #farm-grid {
    gap: 0 !important;
    width: 100vw !important;
    /* columns set dynamically by JS; rows follow naturally */
  }
  /* Fluid tile: width driven by grid column, height = width */
  #farm-grid .tile,
  #farm-grid .tile-tree {
    width: 100% !important;
    height: 0 !important;
    padding-bottom: 100% !important; /* 1:1 aspect via padding trick */
    border: none !important;
    border-radius: 0 !important;
    box-shadow: none !important;
    font-size: clamp(10px, 3.5vw, 20px) !important;
    position: relative !important;
    /* emoji & child elements must be positioned inside */
  }
  /* Re-centre content that was relying on flex */
  #farm-grid .tile > *,
  #farm-grid .tile-tree > * {
    position: absolute !important;
    top: 50% !important; left: 50% !important;
    transform: translate(-50%, -50%) !important;
    pointer-events: none !important;
  }
  /* Days badge & sparkle position overrides */
  #farm-grid .days-badge {
    top: auto !important; bottom: 1px !important;
    left: 2px !important; transform: none !important;
    font-size: 8px !important;
  }
  #farm-grid .sparkle {
    top: 1px !important; right: 2px !important;
    transform: none !important;
    font-size: 9px !important;
  }
  #farm-grid .water-dot {
    bottom: 2px !important; right: 2px !important;
    transform: none !important;
  }
  #farm-grid .fert-badge {
    bottom: 1px !important; right: 1px !important;
    transform: none !important;
    font-size: 9px !important;
  }
  #farm-grid .lamp-glow-overlay {
    top: 0 !important; left: 0 !important;
    transform: none !important;
    width: 100% !important; height: 100% !important;
  }
  #farm-grid .tile-ready {
    animation: mobileReadyPulse 1.6s ease-in-out infinite !important;
  }
  @keyframes mobileReadyPulse {
    0%,100% { filter: brightness(1.0); }
    50%      { filter: brightness(1.25) drop-shadow(0 0 4px rgba(251,191,36,.6)); }
  }
}

/* ══ HOE PICKER POPUP ═══════════════════════════════════════════════ */
#hoe-picker {
  display: none;
  position: fixed;
  z-index: 600;
  background: var(--ui-bg);
  border: 1.5px solid var(--ui-border);
  border-radius: 16px;
  padding: 10px;
  box-shadow: 0 8px 36px rgba(0,0,0,.18);
  animation: hoepickerIn .18s cubic-bezier(.25,.8,.25,1);
}
@keyframes hoepickerIn {
  from { opacity:0; transform: scale(.92) translateY(6px); }
  to   { opacity:1; transform: scale(1) translateY(0); }
}
#hoe-picker.hp-open { display: flex; flex-direction: column; gap: 8px; }

/* PC: anchored above toolbar */
@media (min-width: 681px) {
  #hoe-picker {
    bottom: 62px;
    left: 50%;
    transform: translateX(-50%);
    flex-direction: row;
    align-items: center;
    gap: 6px;
  }
}
/* Mobile: bottom sheet style above dock */
@media (max-width: 680px) {
  #hoe-picker {
    bottom: 70px;
    left: 0; right: 0;
    border-radius: 18px 18px 0 0;
    border-bottom: none;
    padding: 12px 10px 14px;
    flex-direction: column;
  }
}
#hoe-picker-title {
  font-size: 9px; font-weight: 800; text-transform: uppercase;
  letter-spacing: .8px; color: var(--text-soft);
  font-family: 'Nunito', sans-serif;
  text-align: center;
}
.hp-row { display: flex; gap: 6px; justify-content: center; flex-wrap: wrap; }
.hp-btn {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 8px 6px 6px;
  background: var(--ui-bg2);
  border: 2px solid var(--ui-border);
  border-radius: 12px;
  cursor: pointer;
  min-width: 60px;
  transition: all .14s;
  -webkit-tap-highlight-color: transparent;
  touch-action: manipulation;
  font-family: 'Nunito', sans-serif;
  position: relative;
}
.hp-btn:active { transform: scale(.9); }
.hp-btn.sel { border-color: #d97706; background: #fff7ed; }
body.dark .hp-btn.sel { background: #1c0d00; border-color: #ea580c; }
.hp-btn.locked { opacity: .45; cursor: not-allowed; }
.hp-btn.locked:active { transform: none; }
.hp-grid { display: grid; gap: 2px; margin: 0 auto 3px; }
.hp-grid .hpc { background: #d97706; border-radius: 2px; }
.hp-btn-label {
  font-size: 9px; font-weight: 700; color: var(--text-muted);
  pointer-events: none;
}
.hp-lock-badge {
  position: absolute; top: 2px; right: 3px;
  font-size: 9px; opacity: .7;
  pointer-events: none;
}
/* Fert switch button */
.hp-fert-btn {
  display: flex; flex-direction: column; align-items: center; gap: 4px;
  padding: 8px 10px 6px;
  background: #f0fdf4;
  border: 2px solid #86efac;
  border-radius: 12px;
  cursor: pointer;
  font-family: 'Nunito', sans-serif;
  font-size: 9px; font-weight: 700;
  color: #166534;
  transition: all .14s;
  -webkit-tap-highlight-color: transparent;
}
body.dark .hp-fert-btn { background: #0a2016; border-color: #166534; color: #4ade80; }
.hp-fert-btn:active { transform: scale(.9); }
.hp-sep { width: 1px; height: 48px; background: var(--ui-border); flex-shrink: 0; }
@media (max-width: 680px) { .hp-sep { width: 100%; height: 1px; margin: 2px 0; } }

/* Fert active state on hoe toolbar button */
#tool-hoe.fert-active,
#dock-hoe.fert-active { border-color: #86efac !important; color: #166534 !important; }
body.dark #tool-hoe.fert-active,
body.dark #dock-hoe.fert-active { color: #4ade80 !important; border-color: #166534 !important; }

/* ══ CITY HUB OVERLAY ═══════════════════════════════════════════════ */
#city-hub {
  display: none;
  position: fixed; inset: 0; z-index: 1999;
  background: rgba(0,0,0,.6);
  backdrop-filter: blur(4px);
  align-items: center; justify-content: center;
  animation: chubIn .22s ease;
}
#city-hub.chub-open { display: flex; }
@keyframes chubIn { from { opacity:0; } to { opacity:1; } }
.chub-card {
  background: var(--ui-bg);
  border: 1.5px solid var(--ui-border);
  border-radius: 22px;
  padding: 28px 24px 24px;
  max-width: 340px; width: calc(100vw - 40px);
  box-shadow: 0 24px 64px rgba(0,0,0,.32);
  display: flex; flex-direction: column; gap: 14px;
  animation: chubCardIn .28s cubic-bezier(.34,1.56,.64,1);
}
@keyframes chubCardIn {
  from { transform: scale(.88) translateY(14px); opacity:0; }
  to   { transform: scale(1) translateY(0); opacity:1; }
}
.chub-title {
  font-family: 'Baloo 2', cursive; font-size: 22px; font-weight: 800;
  color: var(--text-primary); text-align: center;
}
.chub-sub {
  font-size: 11px; color: var(--text-muted); text-align: center; line-height: 1.6;
  margin-top: -8px;
}
.chub-btns { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
.chub-btn {
  display: flex; flex-direction: column; align-items: center; gap: 6px;
  padding: 18px 10px 14px;
  border-radius: 14px; border: 2px solid;
  cursor: pointer; font-family: 'Baloo 2', cursive;
  font-size: 13px; font-weight: 800;
  transition: all .16s;
  -webkit-tap-highlight-color: transparent;
}
.chub-btn:active { transform: scale(.94); }
.chub-btn-market {
  background: linear-gradient(135deg,#eef2ff,#e0e7ff);
  border-color: #c7d2fe; color: #4338ca;
}
.chub-btn-market:hover { background: linear-gradient(135deg,#e0e7ff,#c7d2fe); }
body.dark .chub-btn-market { background: #1e1b4b; border-color: #3730a3; color: #818cf8; }
.chub-btn-jobs {
  background: linear-gradient(135deg,#f0fdf4,#dcfce7);
  border-color: #86efac; color: #166534;
}
.chub-btn-jobs:hover { background: linear-gradient(135deg,#dcfce7,#bbf7d0); }
body.dark .chub-btn-jobs { background: #0a2016; border-color: #166534; color: #4ade80; }
.chub-btn-em { font-size: 34px; line-height: 1; }
.chub-close {
  align-self: center; background: none; border: none; cursor: pointer;
  color: var(--text-muted); font-size: 12px; font-weight: 600;
  font-family: 'Nunito', sans-serif; padding: 4px 12px;
  border-radius: 8px; transition: color .15s;
}
.chub-close:hover { color: var(--text-primary); }

/* ══ CITY JOBS TAB ══════════════════════════════════════════════════ */
.city-jobs-intro {
  font-size: 11px; color: var(--text-muted); padding: 8px 11px;
  background: var(--ui-bg2); border: 1px solid var(--ui-border);
  border-radius: 9px; line-height: 1.55;
}

/* Retro overrides */
body.retro #hoe-picker { background: #120c00; border: 2px solid #8b6914; border-radius: 4px; }
body.retro .hp-btn { background: #1c1209; border: 1px solid #3e2723; border-radius: 3px; }
body.retro .hp-btn.sel { background: #2d1b00; border-color: #ffd700; }
body.retro .hp-fert-btn { background: #0d2e10; border: 1px solid #1b5e20; border-radius: 3px; }
body.retro #city-hub { backdrop-filter: none; }
body.retro .chub-card { background: #120c00; border: 3px solid #8b6914; border-radius: 4px; }
body.retro .chub-title { color: #ffd700; font-size: 14px; }
`;
  document.head.appendChild(style);

  /* ────────────────────────────────────────────────────────────────────
     SECTION 1  MOBILE GRID FIX
     Patch renderFarm so that on screens ≤ 680 px the grid columns are
     fluid (1fr each) instead of the hardcoded 52 px inline style.
  ──────────────────────────────────────────────────────────────────── */
  function _patchRenderFarmMobile() {
    if (typeof window.renderFarm !== 'function') { setTimeout(_patchRenderFarmMobile, 150); return; }
    var _prev = window.renderFarm;
    window.renderFarm = function () {
      _prev.apply(this, arguments);
      if (window.innerWidth > 680) return;
      var grid = document.getElementById('farm-grid');
      if (!grid) return;
      var GW_v = typeof GW !== 'undefined' ? GW : 14;
      var GH_v = typeof GH !== 'undefined' ? GH : 10;
      var tileSize = Math.floor(window.innerWidth / GW_v);
      /* Override JS-set inline style with fluid columns */
      grid.style.gridTemplateColumns = 'repeat(' + GW_v + ', ' + tileSize + 'px)';
      grid.style.gridTemplateRows   = 'repeat(' + GH_v + ', ' + tileSize + 'px)';
      grid.style.width  = (tileSize * GW_v) + 'px';
      grid.style.height = (tileSize * GH_v) + 'px';
      /* Fix tile sizes */
      Array.from(grid.children).forEach(function (el) {
        el.style.width  = tileSize + 'px';
        el.style.height = tileSize + 'px';
        el.style.padding = '0';
        el.style.fontSize = Math.floor(tileSize * 0.55) + 'px';
      });
    };
    /* Also re-run on window resize */
    window.addEventListener('resize', function () {
      if (window.innerWidth <= 680 && typeof renderFarm === 'function') renderFarm();
    });
    console.log('[PatchV3] Mobile grid fix applied.');
  }
  _patchRenderFarmMobile();

  /* ────────────────────────────────────────────────────────────────────
     SECTION 2  HOE UPGRADE RENAMING
     tbu.js registers hoe_3x3 and hoe_4x4 into UPGRADES.
     We rename them here to match the user-requested labels.
  ──────────────────────────────────────────────────────────────────── */
  function _renameHoeUpgrades() {
    if (typeof UPGRADES === 'undefined') { setTimeout(_renameHoeUpgrades, 200); return; }
    if (UPGRADES.hoe_3x3) {
      UPGRADES.hoe_3x3.n    = 'Hoe Upgrade';
      UPGRADES.hoe_3x3.desc = 'Upgrade your hoe head. Now tills a 3×3 patch per swing — dramatically faster field prep!';
    }
    if (UPGRADES.hoe_4x4) {
      UPGRADES.hoe_4x4.n    = 'Iron Head';
      UPGRADES.hoe_4x4.desc = 'Forge an iron hoe head for massive 4×4 tilling. Requires the Hoe Upgrade first.';
    }
    console.log('[PatchV3] Hoe upgrade names updated.');
  }
  _renameHoeUpgrades();

  /* ────────────────────────────────────────────────────────────────────
     SECTION 3  HOE AREA + 2×2 SUPPORT
     tbu.js's internal getHoeSize() ignores G.hoeSize.  We wrap
     clickTile one more time (outermost = runs first) to intercept
     the hoe tool and use G.hoeSize as the player's chosen size,
     capped by owned upgrades.  The 2×2 case is handled here too.
  ──────────────────────────────────────────────────────────────────── */
  function _getDesiredHoeSize() {
    var desired = (typeof G !== 'undefined' && G.hoeSize) ? G.hoeSize : 1;
    if (typeof curUpgs !== 'function') return Math.min(desired, 1);
    var upgs = curUpgs();
    var has3 = (upgs.hoe_3x3 || 0) >= 1;
    var has4 = has3 && (upgs.hoe_4x4 || 0) >= 1;
    if (desired >= 4 && has4) return 4;
    if (desired >= 3 && has3) return 3;
    if (desired >= 2) return 2;
    return 1;
  }
  window._getDesiredHoeSize = _getDesiredHoeSize;

  /* Offsets for each area size */
  function _hoeOffsets(size) {
    var offsets = [];
    if (size === 1) return [[0,0]];
    if (size === 2) return [[0,0],[0,1],[1,0],[1,1]];
    var range = size === 4 ? [-1,0,1,2] : [-1,0,1];
    for (var i = 0; i < range.length; i++)
      for (var j = 0; j < range.length; j++)
        offsets.push([range[i], range[j]]);
    return offsets;
  }

  function _patchClickTileForHoe() {
    if (typeof window.clickTile !== 'function') { setTimeout(_patchClickTileForHoe, 200); return; }
    var _prev = window.clickTile;
    window.clickTile = function (r, c) {
      /* Only intercept when hoe is active AND a size > 1 is desired */
      if (typeof G === 'undefined' || G.tool !== 'hoe') return _prev.apply(this, arguments);
      var size = _getDesiredHoeSize();
      if (size === 1) return _prev.apply(this, arguments); // delegate to base/tbu

      /* Multi-tile tilling with our chosen size */
      var GW_v = typeof GW !== 'undefined' ? GW : 14;
      var GH_v = typeof GH !== 'undefined' ? GH : 10;
      var fLv  = typeof getLevel === 'function' ? getLevel((G.skills && G.skills.farming && G.skills.farming.xp) || 0) : 1;
      var landTrees = [];
      if (typeof LAND_TREES !== 'undefined' && G.currentLand)
        landTrees = LAND_TREES[G.currentLand] || LAND_TREES.home || [];
      var treeKeys = new Set(landTrees.map(function (t) { return t[0]*100+t[1]; }));
      var offsets = _hoeOffsets(size);
      var count = 0, alreadyDone = 0;

      offsets.forEach(function (off) {
        var nr = r + off[0], nc = c + off[1];
        if (nr < 0 || nr >= GH_v || nc < 0 || nc >= GW_v) return;
        if (treeKeys.has(nr*100+nc)) return;
        var tile = G.farm[nr] && G.farm[nr][nc];
        if (!tile) return;
        if (tile.tilled) { alreadyDone++; return; }
        if (tile.deco) return;
        var newTile = Object.assign({}, tile, { tilled:true, idleDays:0, deco:null });
        if (fLv >= 10) newTile.watered = true;
        G.farm[nr][nc] = newTile;
        count++;
        if (fLv < 5 && typeof S !== 'undefined' && S.energyCost)
          G.energy = Math.max(0, G.energy - 0.35);
        if (typeof addXP === 'function') addXP('farming', 3);
      });

      if (count === 0) {
        if (alreadyDone > 0 && typeof toast === 'function') toast('Area already tilled!', 'info', 900);
        return;
      }
      if (typeof snd   === 'function') snd('till');
      if (typeof toast === 'function') toast('⚒ ' + size + '×' + size + ' tilled! (' + count + ' tiles)', 'success', 1300);
      if (typeof S !== 'undefined' && S.energyCost && G.energy < 0) G.energy = 0;
      if (typeof render === 'function') render();
    };
    console.log('[PatchV3] clickTile wrapped for flexible hoe sizes.');
  }
  _patchClickTileForHoe();

  /* ────────────────────────────────────────────────────────────────────
     SECTION 4  HOE PICKER MENU
     A visual panel showing four size buttons (+ fert switch).
     Opens when the Hoe tool is selected; closes on tool change.
  ──────────────────────────────────────────────────────────────────── */

  /* Build a mini NxN grid preview using divs */
  function _buildMiniGrid(n, cellPx) {
    var size = n * cellPx + (n-1)*2; // cell + gap
    var style = 'display:grid;grid-template-columns:repeat(' + n + ',1fr);gap:2px;' +
                'width:' + size + 'px;height:' + size + 'px;margin:0 auto 2px';
    var cells = '';
    for (var i = 0; i < n*n; i++)
      cells += '<div style="background:#d97706;border-radius:2px"></div>';
    return '<div style="' + style + '">' + cells + '</div>';
  }

  function _buildHoePicker() {
    if (document.getElementById('hoe-picker')) return;
    var el = document.createElement('div');
    el.id = 'hoe-picker';
    document.body.appendChild(el);
    _refreshHoePicker();
  }

  function _refreshHoePicker() {
    var el = document.getElementById('hoe-picker');
    if (!el) return;
    var upgs    = typeof curUpgs === 'function' ? curUpgs() : {};
    var has3    = (upgs.hoe_3x3 || 0) >= 1;
    var has4    = has3 && (upgs.hoe_4x4 || 0) >= 1;
    var current = (typeof G !== 'undefined' && G.hoeSize) ? G.hoeSize : 1;
    // Effective selection (capped)
    if (current === 4 && !has4) current = 3;
    if (current === 3 && !has3) current = Math.min(current, 2);

    var sizes = [1, 2, 3, 4];
    var labels = ['1×1', '2×2', '3×3', '4×4'];
    var locked  = [false, false, !has3, !has4];
    var cellPx  = [8, 7, 5, 4];

    var sizeHtml = sizes.map(function (n, i) {
      var sel = (current === n && !locked[i]) ? ' sel' : '';
      var lck = locked[i] ? ' locked' : '';
      var lockBadge = locked[i] ? '<span class="hp-lock-badge">🔒</span>' : '';
      return '<button class="hp-btn' + sel + lck + '" data-hoe-size="' + n + '">' +
               lockBadge +
               _buildMiniGrid(n, cellPx[i]) +
               '<span class="hp-btn-label">' + labels[i] + (locked[i] ? '<br><span style="font-size:7px;opacity:.6">upgrade needed</span>' : '') + '</span>' +
             '</button>';
    }).join('');

    var fertHtml = '<div class="hp-sep"></div>' +
      '<button class="hp-fert-btn" id="hp-fert-switch">' +
        '<span style="font-size:22px;line-height:1">🌿</span>' +
        '<span>Fert</span>' +
      '</button>';

    el.innerHTML = '<div id="hoe-picker-title">⛏ Hoe Size</div>' +
                   '<div class="hp-row">' + sizeHtml + fertHtml + '</div>';

    /* Bind size buttons */
    el.querySelectorAll('[data-hoe-size]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.classList.contains('locked')) {
          var upg = btn.dataset.hoeSize === '3' ? 'Hoe Upgrade' : 'Iron Head';
          if (typeof toast === 'function') toast('🔒 Requires ' + upg + '! Buy it in Upgrades tab.', 'warn', 2500);
          return;
        }
        if (typeof G !== 'undefined') G.hoeSize = parseInt(btn.dataset.hoeSize);
        el.querySelectorAll('[data-hoe-size]').forEach(function (b) { b.classList.remove('sel'); });
        btn.classList.add('sel');
        if (typeof toast === 'function') toast('⚒ Hoe: ' + btn.dataset.hoeSize + '×' + btn.dataset.hoeSize + ' area selected', 'info', 1200);
      });
    });

    /* Fert switch button */
    var fertBtn = document.getElementById('hp-fert-switch');
    if (fertBtn) {
      fertBtn.addEventListener('click', function () {
        _closeHoePicker();
        if (typeof setTool === 'function') setTool('fert');
        _setToolBtnFertMode(true);
      });
    }
  }

  function _openHoePicker() {
    _buildHoePicker();
    _refreshHoePicker();
    var el = document.getElementById('hoe-picker');
    if (!el) return;
    el.classList.add('hp-open');
  }

  function _closeHoePicker() {
    var el = document.getElementById('hoe-picker');
    if (!el) return;
    el.classList.remove('hp-open');
  }

  /* Change toolbar / dock Hoe button label for fert mode */
  function _setToolBtnFertMode(on) {
    /* PC toolbar button */
    var hoeBtn = document.getElementById('tool-hoe');
    if (hoeBtn) {
      if (on) {
        hoeBtn.dataset.origHtml = hoeBtn.innerHTML;
        hoeBtn.innerHTML = '🌿 Fert';
        hoeBtn.classList.add('fert-active');
      } else {
        if (hoeBtn.dataset.origHtml) hoeBtn.innerHTML = hoeBtn.dataset.origHtml;
        hoeBtn.classList.remove('fert-active');
      }
    }
    /* Mobile dock Hoe button */
    var dockHoe = document.getElementById('dock-hoe');
    if (dockHoe) {
      var icon  = dockHoe.querySelector('.dock-icon');
      var label = dockHoe.querySelector('.dock-label');
      if (on) {
        if (icon)  { icon.dataset.origText  = icon.textContent;  icon.textContent  = '🌿'; }
        if (label) { label.dataset.origText = label.textContent; label.textContent = 'Fert'; }
        dockHoe.classList.add('fert-active');
      } else {
        if (icon  && icon.dataset.origText)  icon.textContent  = icon.dataset.origText;
        if (label && label.dataset.origText) label.textContent = label.dataset.origText;
        dockHoe.classList.remove('fert-active');
      }
    }
  }

  /* Hook setTool to open/close picker and reset fert mode */
  function _hookSetToolForHoePicker() {
    if (typeof window.setTool !== 'function') { setTimeout(_hookSetToolForHoePicker, 150); return; }
    var _prev = window.setTool;
    window.setTool = function (t) {
      _prev.apply(this, arguments);
      if (t === 'hoe') {
        _openHoePicker();
        _setToolBtnFertMode(false); // reset fert mode if returning to hoe
      } else {
        _closeHoePicker();
        if (t !== 'fert') _setToolBtnFertMode(false); // non-fert tool clears fert state
      }
    };
    /* Also hook the PC toolbar Hoe button itself so a second click
       while hoe is active re-opens the picker cleanly */
    var _hookHoeBtn = function () {
      var btn = document.getElementById('tool-hoe');
      if (!btn) { setTimeout(_hookHoeBtn, 200); return; }
      btn.addEventListener('click', function () {
        /* setTool('hoe') already fired (via onclick), now open picker */
        if (typeof G !== 'undefined' && G.tool === 'hoe') _openHoePicker();
      });
    };
    _hookHoeBtn();
    /* Mobile dock Hoe button */
    var _hookDockHoe = function () {
      var dBtn = document.getElementById('dock-hoe');
      if (!dBtn) { setTimeout(_hookDockHoe, 300); return; }
      dBtn.addEventListener('click', function () {
        if (typeof G !== 'undefined' && G.tool === 'hoe') _openHoePicker();
        if (typeof G !== 'undefined' && G.tool === 'fert') {
          /* Re-clicking fert button returns to hoe */
          if (typeof setTool === 'function') setTool('hoe');
          _setToolBtnFertMode(false);
        }
      });
    };
    _hookDockHoe();
    console.log('[PatchV3] setTool hooked for hoe picker.');
  }
  _hookSetToolForHoePicker();

  /* Close hoe picker when tapping the farm grid on mobile */
  document.addEventListener('DOMContentLoaded', function () {
    var fw = document.getElementById('farm-wrap');
    if (fw) fw.addEventListener('click', function () { _closeHoePicker(); }, true);
  });

  /* Also update the hoe picker when upgrades change (after buyUpgrade) */
  function _hookBuyUpgradeForPicker() {
    if (typeof window.buyUpgrade !== 'function') { setTimeout(_hookBuyUpgradeForPicker, 200); return; }
    var _prev = window.buyUpgrade;
    window.buyUpgrade = function (id) {
      _prev.apply(this, arguments);
      if (id === 'hoe_3x3' || id === 'hoe_4x4') {
        setTimeout(_refreshHoePicker, 200);
      }
    };
  }
  _hookBuyUpgradeForPicker();

  /* ────────────────────────────────────────────────────────────────────
     SECTION 5  HOE AREA BADGE  (mirrors tbu.js badge but uses G.hoeSize)
  ──────────────────────────────────────────────────────────────────── */
  function _syncHoeBadge() {
    var hoeBtn = document.getElementById('tool-hoe');
    if (!hoeBtn) return;
    var size = _getDesiredHoeSize();
    var badge = document.getElementById('pv3-hoe-badge');
    if (size > 1) {
      if (!badge) {
        badge = document.createElement('span');
        badge.id = 'pv3-hoe-badge';
        badge.style.cssText = 'position:absolute;top:-5px;right:-5px;' +
          'font-size:8px;font-weight:900;background:#d97706;color:#fff;' +
          'border-radius:20px;padding:1px 5px;pointer-events:none;line-height:1.4;' +
          'box-shadow:0 1px 3px rgba(0,0,0,.25)';
        hoeBtn.style.position = 'relative';
        hoeBtn.appendChild(badge);
      }
      badge.textContent = size + '×' + size;
      badge.style.display = 'inline';
    } else if (badge) {
      badge.style.display = 'none';
    }
  }
  function _hookRenderForBadge() {
    if (typeof window.render !== 'function') { setTimeout(_hookRenderForBadge, 150); return; }
    var _prev = window.render;
    window.render = function () { _prev.apply(this, arguments); _syncHoeBadge(); };
  }
  _hookRenderForBadge();

  /* ────────────────────────────────────────────────────────────────────
     SECTION 6  CITY HUB OVERLAY
     Intercept openCityScreen to show an intermediate hub with
     "Stock Exchange" and "Jobs Board" options before entering.
  ──────────────────────────────────────────────────────────────────── */

  /* Build the hub overlay DOM (once) */
  function _buildCityHub() {
    if (document.getElementById('city-hub')) return;
    var el = document.createElement('div');
    el.id = 'city-hub';
    el.innerHTML = `
      <div class="chub-card">
        <div class="chub-title">🏙️ City District</div>
        <div class="chub-sub">What would you like to do in the city?</div>
        <div class="chub-btns">
          <button class="chub-btn chub-btn-market" id="chub-market">
            <span class="chub-btn-em">📊</span>
            Stock Exchange
          </button>
          <button class="chub-btn chub-btn-jobs" id="chub-jobs">
            <span class="chub-btn-em">💼</span>
            Jobs Board
          </button>
        </div>
        <button class="chub-close" id="chub-close">✕ Cancel</button>
      </div>`;
    document.body.appendChild(el);

    document.getElementById('chub-market').addEventListener('click', function () {
      _closeCityHub();
      _openCityScreenDirect('market');
    });
    document.getElementById('chub-jobs').addEventListener('click', function () {
      _closeCityHub();
      _openCityScreenDirect('jobs');
    });
    document.getElementById('chub-close').addEventListener('click', function () {
      _closeCityHub();
      /* Resume game */
      if (typeof paused !== 'undefined') window.paused = false;
    });
    /* Click backdrop to close */
    el.addEventListener('click', function (e) {
      if (e.target === el) {
        _closeCityHub();
        if (typeof paused !== 'undefined') window.paused = false;
      }
    });
  }

  function _openCityHub() {
    _buildCityHub();
    document.getElementById('city-hub').classList.add('chub-open');
    if (typeof paused !== 'undefined') window.paused = true;
  }
  function _closeCityHub() {
    var el = document.getElementById('city-hub');
    if (el) el.classList.remove('chub-open');
  }

  /* Direct open (bypasses hub) */
  function _openCityScreenDirect(tab) {
    if (typeof _ensureSM === 'function') _ensureSM();
    var el = document.getElementById('city-screen');
    if (el) el.classList.add('city-open');
    if (typeof _updateCityGold === 'function') _updateCityGold();
    if (typeof paused !== 'undefined') window.paused = true;
    /* Ensure Jobs tab button exists */
    _injectJobsTab();
    if (typeof setCityTab === 'function') setCityTab(tab || 'market');
  }

  /* Override openCityScreen to go through hub first */
  function _hookOpenCityScreen() {
    if (typeof window.openCityScreen !== 'function') { setTimeout(_hookOpenCityScreen, 200); return; }
    window.openCityScreen = function () {
      _openCityHub();
    };
    console.log('[PatchV3] openCityScreen replaced with city hub.');
  }
  _hookOpenCityScreen();

  /* ────────────────────────────────────────────────────────────────────
     SECTION 7  JOBS TAB INSIDE CITY SCREEN
     Injects a "💼 Jobs" tab button and handles its content via
     renderCityScreen.  Also removes Jobs section from buildShop.
  ──────────────────────────────────────────────────────────────────── */

  function _injectJobsTab() {
    if (document.getElementById('city-tab-jobs')) return;
    var tabs = document.querySelector('#city-screen .city-tabs');
    if (!tabs) return;
    var btn = document.createElement('button');
    btn.className = 'city-tab-btn';
    btn.id = 'city-tab-jobs';
    btn.dataset.ctab = 'jobs';
    btn.textContent = '💼 Jobs';
    btn.addEventListener('click', function () {
      if (typeof setCityTab === 'function') setCityTab('jobs');
    });
    tabs.appendChild(btn);
  }

  /* Patch renderCityScreen to handle the jobs tab */
  function _hookRenderCityScreen() {
    if (typeof window.renderCityScreen !== 'function') { setTimeout(_hookRenderCityScreen, 200); return; }
    var _prev = window.renderCityScreen;
    window.renderCityScreen = function (tab) {
      if (tab === 'jobs') {
        var body = document.getElementById('city-body');
        if (!body) return;
        /* Ensure Jobs tab button is visible */
        document.querySelectorAll('.city-tab-btn').forEach(function (b) {
          b.classList.toggle('active', b.dataset.ctab === 'jobs');
        });
        if (typeof _updateCityGold === 'function') _updateCityGold();
        body.innerHTML = _buildJobsCityHTML();
        /* Bind hire buttons */
        body.querySelectorAll('[data-hire-job]').forEach(function (btn) {
          btn.addEventListener('click', function () {
            if (typeof window.hireJob === 'function') window.hireJob(btn.dataset.hireJob);
          });
        });
        return;
      }
      _prev.apply(this, arguments);
    };
    console.log('[PatchV3] renderCityScreen patched for jobs tab.');
  }
  _hookRenderCityScreen();

  function _buildJobsCityHTML() {
    if (typeof JOBS === 'undefined' || typeof G === 'undefined') {
      return '<div class="city-empty"><div class="city-empty-em">💼</div><div>Jobs Board unavailable</div></div>';
    }
    var curJob = G.job || null;
    var h = '<div class="city-market-header">' +
              '<div class="city-market-title">💼 Jobs Board</div>' +
            '</div>' +
            '<div class="city-jobs-intro">Hold one job at a time. Daily pay arrives each morning. ' +
            'Perks are active immediately after hiring.</div>';

    if (curJob) {
      var cj = JOBS[curJob];
      h += '<div style="padding:8px 11px;background:rgba(34,197,94,.08);border:1.5px solid rgba(34,197,94,.3);' +
           'border-radius:10px;font-size:11px;font-weight:700;color:#166534;margin-bottom:4px">' +
           '✅ Current Job: ' + (cj ? cj.e + ' ' + cj.n : curJob) + ' · ' +
           (cj ? '+' + cj.dailyPay + 'g/day' : '') + '</div>';
    }

    Object.entries(JOBS).forEach(function (entry) {
      var id = entry[0], job = entry[1];
      var isActive = (curJob === id);
      var canAfford = G && G.gold >= job.hireCost;
      h += '<div class="job-card' + (isActive ? ' job-card-active' : '') + '">';
      h += '<div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:3px">';
      h += '<span class="job-title">' + job.e + ' ' + job.n + '</span>';
      h += '<span class="job-pay">+' + job.dailyPay + 'g/day</span>';
      h += '</div>';
      if (isActive) h += '<span class="job-active-badge">✓ Active Job</span><br>';
      h += '<div class="job-desc">' + job.desc + '</div>';
      h += '<div class="job-perks">';
      job.perks.forEach(function (p) { h += '<div class="job-perk-item">' + p + '</div>'; });
      h += '</div>';
      if (job.hireCost > 0 && !isActive)
        h += '<div class="job-income-note">Equipment fee: ' + job.hireCost + 'g</div>';
      h += '<div class="job-btn-row">';
      if (isActive) {
        h += '<button class="job-quit-btn" onclick="quitJob();if(typeof setCityTab===\'function\')setCityTab(\'jobs\')">Quit Job</button>';
      } else {
        h += '<button class="job-hire-btn" data-hire-job="' + id + '"' + (canAfford ? '' : ' disabled') + '>';
        h += (job.hireCost > 0 ? 'Hire (' + job.hireCost + 'g)' : 'Take Job — Free') + '</button>';
      }
      h += '</div></div>';
    });
    return h;
  }

  /* Remove Jobs section from buildShop (it lives in the City now) */
  function _stripJobsFromShop() {
    if (typeof window.buildShop !== 'function') { setTimeout(_stripJobsFromShop, 200); return; }
    var _prev = window.buildShop;
    window.buildShop = function () {
      var html = _prev.apply(this, arguments);
      /* Remove everything from the Jobs Board heading onwards */
      var marker = html.indexOf('<div class="s-sec">💼 Jobs Board</div>');
      if (marker !== -1) html = html.substring(0, marker);
      return html;
    };
    console.log('[PatchV3] Jobs section removed from Shop tab.');
  }
  _stripJobsFromShop();

  /* Patch quitJob / hireJob to re-render the city jobs tab if open */
  function _hookJobActionsForCityRefresh() {
    ['quitJob', 'hireJob'].forEach(function (fn) {
      var _wait = setInterval(function () {
        if (typeof window[fn] !== 'function') return;
        clearInterval(_wait);
        var _prev = window[fn];
        window[fn] = function () {
          var ret = _prev.apply(this, arguments);
          /* If city screen is open on jobs tab, refresh */
          var cityEl = document.getElementById('city-screen');
          var activeTab = document.querySelector('#city-screen .city-tab-btn.active');
          if (cityEl && cityEl.classList.contains('city-open') &&
              activeTab && activeTab.dataset.ctab === 'jobs') {
            setTimeout(function () {
              if (typeof renderCityScreen === 'function') renderCityScreen('jobs');
            }, 150);
          }
          return ret;
        };
      }, 150);
    });
  }
  _hookJobActionsForCityRefresh();

  /* Ensure city hub is built and jobs tab injected when city screen first opens */
  function _waitForCityScreen() {
    var cs = document.getElementById('city-screen');
    if (!cs) { setTimeout(_waitForCityScreen, 300); return; }
    /* Observe city-open class */
    var _mo = new MutationObserver(function () {
      if (cs.classList.contains('city-open')) _injectJobsTab();
    });
    _mo.observe(cs, { attributes: true, attributeFilter: ['class'] });
  }
  _waitForCityScreen();

  /* ────────────────────────────────────────────────────────────────────
     DONE
  ──────────────────────────────────────────────────────────────────── */
  console.log('[PatchV3 v1.0] ✅ Loaded!\n' +
    '  · Mobile grid: fluid 14-column tiles (no gaps)\n' +
    '  · Hoe upgrades renamed: "Hoe Upgrade" (3×3) / "Iron Head" (4×4)\n' +
    '  · Hoe picker: 1×1, 2×2, 3×3, 4×4 + Fert switch\n' +
    '  · Toolbar Hoe btn shows Fert icon when Fert is active\n' +
    '  · City button → hub menu (Stock Exchange / Jobs Board)\n' +
    '  · Jobs Board added as city screen tab\n' +
    '  · Jobs removed from Shop tab');
})();


/* ──────────────────────── patch_v3b.js ──────────────────────── */
/* ═══════════════════════════════════════════════════════════════════════
   VALLEY FARM — PATCH v3b  (patch_v3b.js)
   ─────────────────────────────────────────────────────────────────────
   Load order: after patch_v3.js

   Fixes / changes on top of patch_v3:
   1. HOE PICKER TOGGLE  — Clicking ⛏ Hoe again while picker is open
                           now CLOSES it (toggle, not re-open).

   2. CITY HUB REMOVED   — City button goes straight to the City screen
                           (original behaviour).  Jobs Board tab is
                           still added to the City screen tabs.

   3. HOE TILE PREVIEW   — With size > 1 selected: first click on a
                           tile shows a white-highlight preview box of
                           the exact area that would be tilled.
                           Clicking any highlighted tile confirms and
                           tills.  Clicking elsewhere moves the preview.
                           1×1 still tills immediately (no preview).

   4. RESTORE TILE GRID  — Undoes the tbu.js seamless-grass CSS so tiles
                           have their original borders, rounded corners,
                           and 3px gaps.  Micro-variation (gv*) classes
                           are also removed after every render.

   5. TOAST OPACITY 72%  — Toast notification backgrounds and the
                           achievement popup background are set to
                           72 % opacity via rgba().
═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ────────────────────────────────────────────────────────────────────
     SECTION 0  CSS
  ──────────────────────────────────────────────────────────────────── */
  var style = document.createElement('style');
  style.id = 'vf-patchv3b-css';
  style.textContent = `

/* ══ RESTORE TILE GRID LOOK ═════════════════════════════════════════
   Counter the tbu.js bigupdate-grass-css rules with !important.
   ─────────────────────────────────────────────────────────────────── */
#farm-grid {
  gap: 3px !important;
  border-radius: 0 !important;
  overflow: visible !important;
}
#farm-wrap {
  box-shadow: none !important;
  border-radius: 0 !important;
  overflow: auto !important;
}
.tile {
  border: 2px solid rgba(0,0,0,.13) !important;
  border-radius: 7px !important;
  box-shadow: none !important;
  /* Remove the inset-shadow trick tbu adds on tilled tiles */
}
.tile[data-tilled="1"] {
  box-shadow: none !important;
  border-radius: 7px !important;
}
.tile[data-tilled="1"][data-watered="1"] {
  box-shadow: none !important;
}
.tile[data-deco="1"] {
  border-radius: 7px !important;
  box-shadow: none !important;
}
.tile:hover {
  filter: brightness(1.25) !important;
  transform: scale(1.1) !important;
  z-index: 5;
  border-color: rgba(255,255,255,.75) !important;
  box-shadow: 0 4px 14px rgba(0,0,0,.18) !important;
}
/* cancel any gv-class brightness/sat filters */
.gv0,.gv1,.gv2,.gv3,.gv4 { filter: none !important; }
.gv0:hover,.gv1:hover,.gv2:hover,.gv3:hover,.gv4:hover {
  filter: brightness(1.25) !important;
}
.tile-tree {
  border: 2px solid rgba(0,0,0,.13) !important;
  border-radius: 7px !important;
  box-shadow: none !important;
}
/* Restore original ready-pulse */
.tile-ready {
  animation: readypulse 1.4s ease-in-out infinite !important;
  filter: none !important;
}
@keyframes readypulse {
  0%,100% { box-shadow: 0 0 0 0 rgba(250,204,21,.7) !important; }
  50%      { box-shadow: 0 0 12px 6px rgba(250,204,21,.22) !important; }
}
/* Restore grass-deco opacity */
.grass-deco { opacity: .22 !important; font-size: 13px !important; filter: none !important; }

/* Mobile: keep original CSS scaling (from style.css) */
@media (max-width: 680px) {
  #farm-grid { gap: 2px !important; }
  .tile, .tile-tree { width: 45px !important; height: 45px !important; font-size: 19px !important; border-radius: 5px !important; }
}
@media (max-width: 400px) {
  .tile, .tile-tree { width: 38px !important; height: 38px !important; font-size: 16px !important; }
}

/* ══ HOE TILE PREVIEW ═══════════════════════════════════════════════ */
.hoe-pending-tile {
  outline: 3px solid rgba(255,255,255,.88) !important;
  outline-offset: -2px !important;
  background-color: rgba(255,255,255,.30) !important;
  filter: brightness(1.15) !important;
  z-index: 6 !important;
  transition: none !important;
}
/* Slight pulse so player knows to click again */
@keyframes pendingPulse {
  0%,100% { outline-color: rgba(255,255,255,.88); }
  50%     { outline-color: rgba(255,165,0,.95); }
}
.hoe-pending-tile { animation: pendingPulse 1s ease-in-out infinite !important; }

/* ══ TOAST & NOTIFICATION BACKGROUNDS — 72 % OPACITY ═══════════════ */
.toast {
  background: rgba(255,255,255,.72) !important;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}
body.dark .toast {
  background: rgba(30,42,30,.72) !important;
}
.toast.t-success { background: rgba(240,253,244,.72) !important; }
body.dark .toast.t-success { background: rgba(10,32,22,.72) !important; }
.toast.t-warn    { background: rgba(255,251,235,.72) !important; }
body.dark .toast.t-warn    { background: rgba(30,24,0,.72) !important; }
.toast.t-error   { background: rgba(254,242,242,.72) !important; }
body.dark .toast.t-error   { background: rgba(30,8,8,.72) !important; }
.toast.t-info    { background: rgba(255,255,255,.72) !important; }
body.dark .toast.t-info    { background: rgba(20,30,20,.72) !important; }

/* Achievement popup */
#achieve-popup {
  background: rgba(255,255,255,.72) !important;
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
}
body.dark #achieve-popup {
  background: rgba(30,42,30,.72) !important;
}

/* Season banner */
.season-banner {
  background: rgba(255,255,255,.72) !important;
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}
body.dark .season-banner {
  background: rgba(30,42,30,.72) !important;
}

/* Retro — keep solid for pixel-art feel */
body.retro .toast             { background: rgba(18,12,0,.88) !important; backdrop-filter: none !important; }
body.retro #achieve-popup     { background: rgba(18,12,0,.88) !important; backdrop-filter: none !important; }
body.retro .season-banner     { background: rgba(18,12,0,.88) !important; backdrop-filter: none !important; }
`;
  document.head.appendChild(style);

  /* ────────────────────────────────────────────────────────────────────
     SECTION 1  RESTORE TILE GRID — remove tbu.js's CSS injection
  ──────────────────────────────────────────────────────────────────── */
  function _removeTbuGrassCSS () {
    var el = document.getElementById('bigupdate-grass-css');
    if (el) { el.remove(); console.log('[PatchV3b] Removed bigupdate-grass-css.'); }
    else     { setTimeout(_removeTbuGrassCSS, 100); }
  }
  _removeTbuGrassCSS();

  /* Strip gv* classes after every renderFarm so micro-variation
     tinting is gone (the CSS already zeroes the filter, but
     removing the class keeps things tidy).                       */
  function _hookRenderFarmStripGv () {
    if (typeof window.renderFarm !== 'function') { setTimeout(_hookRenderFarmStripGv, 150); return; }
    var _prev = window.renderFarm;
    window.renderFarm = function () {
      _prev.apply(this, arguments);
      var grid = document.getElementById('farm-grid');
      if (!grid) return;
      Array.from(grid.children).forEach(function (el) {
        el.classList.remove('gv0','gv1','gv2','gv3','gv4');
      });
      /* Also undo any JS-forced tile sizes from patch_v3 mobile grid
         (we want the CSS-driven sizes back on mobile too)         */
      if (window.innerWidth <= 680) {
        Array.from(grid.children).forEach(function (el) {
          el.style.removeProperty('width');
          el.style.removeProperty('height');
          el.style.removeProperty('padding');
          el.style.removeProperty('font-size');
        });
        grid.style.removeProperty('width');
        grid.style.removeProperty('height');
      }
    };
    console.log('[PatchV3b] renderFarm patched to strip gv classes.');
  }
  _hookRenderFarmStripGv();

  /* ────────────────────────────────────────────────────────────────────
     SECTION 2  HOE PICKER TOGGLE
     The patch_v3 setTool hook always opens the picker when t==='hoe'.
     We track a global flag _hoePickerOpen and, if the hoe button is
     clicked while picker is already open, close it instead.
  ──────────────────────────────────────────────────────────────────── */
  window._hoePickerOpen = false;

  /* Override the open/close helpers defined in patch_v3 so we can
     track the flag properly.                                       */
  var _origOpen3  = window._openHoePicker  || function(){};
  var _origClose3 = window._closeHoePicker || function(){};

  window._openHoePicker = function () {
    _origOpen3();
    window._hoePickerOpen = true;
  };
  window._closeHoePicker = function () {
    _origClose3();
    window._hoePickerOpen = false;
  };

  /* Patch the PC toolbar hoe button for toggle */
  function _patchHoeBtnToggle () {
    var btn = document.getElementById('tool-hoe');
    if (!btn) { setTimeout(_patchHoeBtnToggle, 200); return; }
    btn.addEventListener('click', function () {
      if (typeof G === 'undefined') return;
      /* If hoe is already active and picker is open → close */
      if (G.tool === 'hoe' && window._hoePickerOpen) {
        if (typeof window._closeHoePicker === 'function') window._closeHoePicker();
      }
      /* (patch_v3 setTool hook handles the open side) */
    }, true); /* capture so this fires before patch_v3's listener */
    console.log('[PatchV3b] Hoe button toggle patched (PC).');
  }
  _patchHoeBtnToggle();

  /* Patch the mobile dock hoe button for toggle */
  function _patchDockHoeBtnToggle () {
    var btn = document.getElementById('dock-hoe');
    if (!btn) { setTimeout(_patchDockHoeBtnToggle, 300); return; }
    btn.addEventListener('click', function () {
      if (typeof G === 'undefined') return;
      if (G.tool === 'hoe' && window._hoePickerOpen) {
        if (typeof window._closeHoePicker === 'function') window._closeHoePicker();
      }
    }, true);
    console.log('[PatchV3b] Dock hoe button toggle patched (mobile).');
  }
  _patchDockHoeBtnToggle();

  /* ────────────────────────────────────────────────────────────────────
     SECTION 3  CITY HUB REMOVED — restore original openCityScreen
     patch_v3 replaced openCityScreen with the hub overlay.  We put
     back the original behaviour: open city-screen, go to market tab,
     but also inject the Jobs tab while we're at it.
  ──────────────────────────────────────────────────────────────────── */
  function _restoreOpenCityScreen () {
    if (typeof _ensureSM !== 'function' || typeof setCityTab !== 'function') {
      setTimeout(_restoreOpenCityScreen, 200); return;
    }
    window.openCityScreen = function () {
      if (typeof _ensureSM       === 'function') _ensureSM();
      var el = document.getElementById('city-screen');
      if (el) el.classList.add('city-open');
      if (typeof _updateCityGold === 'function') _updateCityGold();
      window.paused = true;
      /* Inject Jobs tab if not already there, then go to market */
      _injectJobsCityTab();
      if (typeof setCityTab      === 'function') setCityTab('market');
    };

    /* Also close the city-hub overlay if it was left open */
    var hub = document.getElementById('city-hub');
    if (hub) hub.style.display = 'none';

    console.log('[PatchV3b] openCityScreen restored to original behaviour.');
  }
  _restoreOpenCityScreen();

  /* Inject a "💼 Jobs" tab into the city screen (idempotent) */
  function _injectJobsCityTab () {
    if (document.getElementById('city-tab-jobs-v3b')) return;
    var tabs = document.querySelector('#city-screen .city-tabs');
    if (!tabs) return;
    var btn = document.createElement('button');
    btn.className  = 'city-tab-btn';
    btn.id         = 'city-tab-jobs-v3b';
    btn.dataset.ctab = 'jobs';
    btn.textContent  = '💼 Jobs';
    btn.addEventListener('click', function () {
      if (typeof setCityTab === 'function') setCityTab('jobs');
    });
    tabs.appendChild(btn);
  }

  /* Make sure the tab appears whenever city screen opens */
  function _observeCityScreen () {
    var cs = document.getElementById('city-screen');
    if (!cs) { setTimeout(_observeCityScreen, 300); return; }
    var mo = new MutationObserver(function () {
      if (cs.classList.contains('city-open')) _injectJobsCityTab();
    });
    mo.observe(cs, { attributes: true, attributeFilter: ['class'] });
  }
  _observeCityScreen();

  /* ────────────────────────────────────────────────────────────────────
     SECTION 4  HOE TILE PREVIEW
     State:  window._hoePending = null | { r, c }
             window._hoePendingEls = []  (highlighted DOM elements)
     Logic:
       • size === 1   → till immediately (delegate to lower patch)
       • size > 1, no pending  → show preview, set pending
       • size > 1, pending, click IN preview area → till, clear
       • size > 1, pending, click OUTSIDE         → move preview
  ──────────────────────────────────────────────────────────────────── */
  window._hoePending    = null;
  window._hoePendingEls = [];

  function _clearHoePending () {
    window._hoePendingEls.forEach(function (el) {
      el.classList.remove('hoe-pending-tile');
    });
    window._hoePendingEls = [];
    window._hoePending    = null;
  }

  function _showHoePendingAt (r, c, size) {
    _clearHoePending();
    var grid = document.getElementById('farm-grid');
    if (!grid) return;
    var GW_v = typeof GW !== 'undefined' ? GW : 14;
    var GH_v = typeof GH !== 'undefined' ? GH : 10;
    var offsets = _v3bHoeOffsets(size);
    offsets.forEach(function (off) {
      var nr = r + off[0], nc = c + off[1];
      if (nr < 0 || nr >= GH_v || nc < 0 || nc >= GW_v) return;
      /* Only highlight non-tilled, non-deco, non-crop, non-tree tiles */
      if (typeof G !== 'undefined' && G.farm) {
        var tile = G.farm[nr] && G.farm[nr][nc];
        if (tile && (tile.tilled || tile.deco)) return;
      }
      var el = grid.children[nr * GW_v + nc];
      if (!el) return;
      el.classList.add('hoe-pending-tile');
      window._hoePendingEls.push(el);
    });
    window._hoePending = { r: r, c: c };
  }

  function _v3bHoeOffsets (size) {
    if (size === 1) return [[0,0]];
    if (size === 2) return [[0,0],[0,1],[1,0],[1,1]];
    var range = size === 4 ? [-1,0,1,2] : [-1,0,1];
    var arr = [];
    for (var i = 0; i < range.length; i++)
      for (var j = 0; j < range.length; j++)
        arr.push([range[i], range[j]]);
    return arr;
  }

  function _isInPendingArea (r, c) {
    if (!window._hoePending) return false;
    var size = (typeof window._getDesiredHoeSize === 'function')
               ? window._getDesiredHoeSize() : 1;
    var pr = window._hoePending.r, pc = window._hoePending.c;
    var offsets = _v3bHoeOffsets(size);
    for (var i = 0; i < offsets.length; i++) {
      if (pr + offsets[i][0] === r && pc + offsets[i][1] === c) return true;
    }
    return false;
  }

  /* Wrap clickTile one more time (outermost) to add preview logic */
  function _hookClickTilePreview () {
    if (typeof window.clickTile !== 'function') { setTimeout(_hookClickTilePreview, 250); return; }
    var _prev = window.clickTile;

    window.clickTile = function (r, c) {
      /* Only intercept hoe with area > 1 */
      if (typeof G === 'undefined' || G.tool !== 'hoe') {
        _clearHoePending();
        return _prev.apply(this, arguments);
      }
      var size = (typeof window._getDesiredHoeSize === 'function')
                 ? window._getDesiredHoeSize() : 1;
      if (size === 1) {
        _clearHoePending();
        return _prev.apply(this, arguments); /* till immediately */
      }

      if (window._hoePending) {
        if (_isInPendingArea(r, c)) {
          /* Second click inside preview → confirm till */
          var pr = window._hoePending.r, pc = window._hoePending.c;
          _clearHoePending();
          /* Delegate to patch_v3 clickTile wrapper which handles multi-till */
          return _prev.call(this, pr, pc);
        } else {
          /* Clicked outside → move preview */
          _showHoePendingAt(r, c, size);
          if (typeof toast === 'function') toast('⚒ Click highlighted tiles to till', 'info', 1000);
        }
      } else {
        /* First click → show preview */
        _showHoePendingAt(r, c, size);
        var label = size + '×' + size;
        if (typeof toast === 'function') toast('⚒ ' + label + ' preview — click again to till', 'info', 1500);
      }
    };

    console.log('[PatchV3b] clickTile hooked for hoe tile preview.');
  }
  _hookClickTilePreview();

  /* Clear pending preview when tool changes */
  function _hookSetToolClearPending () {
    if (typeof window.setTool !== 'function') { setTimeout(_hookSetToolClearPending, 200); return; }
    var _prev = window.setTool;
    window.setTool = function (t) {
      if (t !== 'hoe') _clearHoePending();
      _prev.apply(this, arguments);
    };
  }
  _hookSetToolClearPending();

  /* Clear pending preview after sleep */
  function _hookDoSleepClearPending () {
    if (typeof window.doSleep !== 'function') { setTimeout(_hookDoSleepClearPending, 200); return; }
    var _prev = window.doSleep;
    window.doSleep = function () {
      _clearHoePending();
      return _prev.apply(this, arguments);
    };
  }
  _hookDoSleepClearPending();

  /* ────────────────────────────────────────────────────────────────────
     DONE
  ──────────────────────────────────────────────────────────────────── */
  console.log('[PatchV3b v1.0] ✅ Loaded!\n' +
    '  · Tile grid restored (borders + gaps, no seamless grass)\n' +
    '  · Hoe picker: clicking again now closes it (toggle)\n' +
    '  · City hub removed — goes straight to City screen\n' +
    '  · Hoe size > 1: first click previews area, second confirms\n' +
    '  · Toast + achievement backgrounds at 72% opacity');
})();


/* ────────────────────── bu6.js ────────────────────── */
/* ═══════════════════════════════════════════════════════════════════════
   VALLEY FARM — PATCH v3c  (patch_v3c.js)
   ─────────────────────────────────────────────────────────────────────
   Load order: after patch_v3b.js

   Changes
   ───────
   1. SEAMLESS GRASS RESTORED  — Re-enables the bigupdate_1_grass.js look:
                                 gap:0, no tile borders, gv* micro-tints.
                                 Overrides patch_v3b's tile-grid restoration
                                 CSS with higher-priority !important rules.

   2. JOBS BOARD — SHOP CLEAN  — Completely removes the Jobs section from
                                 the Shop tab.  Only appears in City now.

   3. CITY JOBS TAB — ONE ONLY — Removes any duplicate Jobs tab buttons
                                 (from patch_v3 / patch_v3b) and inserts
                                 exactly one clean "💼 Jobs" tab.

   4. DAILY QUESTS REORDERED   — Quest section moved above ⭐ Skills and
                                 just below the Harvested / Pending section.

   5. NEW 10-STEP TUTORIAL     — Replaces the old help steps with a full
                                 10-step guide covering every feature:
                                 hoe picker, size picker, upgrades, fert,
                                 swipe-up bag, city, jobs, seasonal market.
═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ────────────────────────────────────────────────────────────────────
     SECTION 0  CSS — re-assert seamless grass OVER patch_v3b's grid CSS
  ──────────────────────────────────────────────────────────────────── */
  var style = document.createElement('style');
  style.id = 'vf-patchv3c-css';
  style.textContent = `
/* ══ RESTORE SEAMLESS GRASS (overrides patch_v3b's tile-grid CSS) ═══ */
#farm-grid {
  gap: 0 !important;
  border-radius: 12px !important;
  overflow: hidden !important;
}
#farm-wrap {
  border-radius: 14px !important;
  overflow: hidden !important;
  box-shadow: 0 6px 28px rgba(0,0,0,.22) !important;
}
.tile, .tile-tree {
  border: none !important;
  border-radius: 0 !important;
  box-shadow: none !important;
}
.tile:hover {
  filter: brightness(1.22) !important;
  transform: none !important;
  z-index: 5 !important;
  box-shadow: inset 0 0 0 2px rgba(255,255,255,.55) !important;
}
/* Micro-variation tints (need !important to beat patch_v3b's "filter:none !important") */
.gv0 { filter: brightness(1.00) saturate(1.00) !important; }
.gv1 { filter: brightness(0.94) saturate(0.93) !important; }
.gv2 { filter: brightness(1.06) saturate(1.06) !important; }
.gv3 { filter: brightness(0.90) saturate(0.88) !important; }
.gv4 { filter: brightness(1.10) saturate(1.10) !important; }
.gv0:hover,.gv1:hover,.gv2:hover,.gv3:hover,.gv4:hover {
  filter: brightness(1.22) !important;
}
/* Tilled soil */
.tile[data-tilled="1"] {
  box-shadow: inset 0 3px 7px rgba(0,0,0,.30),
              inset 0 0 0 1px rgba(0,0,0,.18) !important;
  border-radius: 2px !important;
}
.tile[data-tilled="1"][data-watered="1"] {
  box-shadow: inset 0 3px 9px rgba(0,0,0,.42),
              inset 0 0 0 1px rgba(30,10,0,.28) !important;
}
.tile[data-deco="1"] {
  border-radius: 4px !important;
  box-shadow: inset 0 0 0 1px rgba(0,0,0,.10) !important;
}
/* Harvest-ready — grass-style pulse */
.tile-ready {
  animation: grassReadyPulse 1.6s ease-in-out infinite !important;
}
@keyframes grassReadyPulse {
  0%,100% { filter: brightness(1.0) !important; }
  50%     { filter: brightness(1.20) drop-shadow(0 0 6px rgba(251,191,36,.55)) !important; }
}
/* Grass deco sprite */
.grass-deco {
  opacity: .38 !important;
  font-size: 15px !important;
  filter: saturate(.65) !important;
}
/* Hoe pending preview still works in seamless mode */
.hoe-pending-tile {
  outline: 3px solid rgba(255,255,255,.88) !important;
  outline-offset: -1px !important;
  background-color: rgba(255,255,255,.28) !important;
  filter: brightness(1.22) !important;
  z-index: 6 !important;
}
/* Mobile — keep tiles filling width without borders */
@media (max-width: 680px) {
  #farm-grid { gap: 0 !important; border-radius: 8px !important; }
  .tile, .tile-tree { border: none !important; border-radius: 0 !important; }
}
`;
  document.head.appendChild(style);

  /* ────────────────────────────────────────────────────────────────────
     SECTION 1  RE-ADD GV* MICRO-VARIATION CLASSES AFTER EVERY RENDER
     patch_v3b strips them; we wrap renderFarm again (outermost = last
     to call _prev, first to run post-processing) to put them back.
  ──────────────────────────────────────────────────────────────────── */
  function _addGvClasses() {
    var grid = document.getElementById('farm-grid');
    if (!grid || typeof G === 'undefined' || !G.farm) return;
    var GW_v = typeof GW !== 'undefined' ? GW : 14;
    var GH_v = typeof GH !== 'undefined' ? GH : 10;
    var landTrees = [];
    if (typeof LAND_TREES !== 'undefined' && G.currentLand)
      landTrees = LAND_TREES[G.currentLand] || LAND_TREES.home || [];
    var treeKeys = new Set(landTrees.map(function (t) { return t[0]*100+t[1]; }));
    var idx = 0;
    for (var r = 0; r < GH_v; r++) {
      for (var c = 0; c < GW_v; c++) {
        var el = grid.children[idx++];
        if (!el) continue;
        var tkey = r*100+c;
        if (treeKeys.has(tkey)) continue;
        var tile = G.farm[r] && G.farm[r][c];
        if (!tile || tile.tilled || tile.deco) continue;
        /* Remove any existing gv class first, then add fresh */
        el.classList.remove('gv0','gv1','gv2','gv3','gv4');
        var v = (r*7 + c*13 + r*c*3) % 5;
        el.classList.add('gv'+v);
      }
    }
  }

  function _hookRenderFarmGv() {
    if (typeof window.renderFarm !== 'function') { setTimeout(_hookRenderFarmGv, 150); return; }
    var _prev = window.renderFarm;
    window.renderFarm = function () {
      _prev.apply(this, arguments);
      _addGvClasses(); /* runs after patch_v3b has already stripped — puts them back */
    };
    console.log('[PatchV3c] renderFarm hooked to restore gv* classes.');
  }
  _hookRenderFarmGv();

  /* ────────────────────────────────────────────────────────────────────
     SECTION 2  REMOVE JOBS FROM SHOP — robust strip wrapped around
     every existing buildShop wrapper so it always fires last.
  ──────────────────────────────────────────────────────────────────── */
  function _hookBuildShopStripJobs() {
    if (typeof window.buildShop !== 'function') { setTimeout(_hookBuildShopStripJobs, 200); return; }
    var _prev = window.buildShop;
    window.buildShop = function () {
      var html = _prev.apply(this, arguments);
      /* Strip everything from the jobs section header onwards */
      var marker = html.indexOf('💼 Jobs Board');
      if (marker !== -1) {
        /* Walk backwards to the opening <div of the s-sec */
        var cut = html.lastIndexOf('<div', marker);
        if (cut !== -1) html = html.substring(0, cut);
        else             html = html.substring(0, marker);
      }
      return html;
    };
    console.log('[PatchV3c] buildShop wrapped — Jobs Board stripped from Shop tab.');
  }
  /* Run immediately AND after a short delay to beat any late-registering wrappers */
  _hookBuildShopStripJobs();
  setTimeout(_hookBuildShopStripJobs, 600);

  /* ────────────────────────────────────────────────────────────────────
     SECTION 3  CITY JOBS TAB — exactly one, no duplicates
  ──────────────────────────────────────────────────────────────────── */
  function _fixCityJobsTab() {
    var tabs = document.querySelector('#city-screen .city-tabs');
    if (!tabs) { setTimeout(_fixCityJobsTab, 300); return; }

    /* Remove ALL existing jobs tab buttons */
    tabs.querySelectorAll('[data-ctab="jobs"]').forEach(function (b) { b.remove(); });

    /* Insert one clean button */
    var btn = document.createElement('button');
    btn.className    = 'city-tab-btn';
    btn.id           = 'city-tab-jobs-v3c';
    btn.dataset.ctab = 'jobs';
    btn.textContent  = '💼 Jobs';
    btn.addEventListener('click', function () {
      if (typeof setCityTab === 'function') setCityTab('jobs');
    });
    tabs.appendChild(btn);
    console.log('[PatchV3c] Single Jobs tab injected into city screen.');
  }

  /* Run once DOM is ready and again whenever the city screen opens */
  setTimeout(_fixCityJobsTab, 400);
  function _observeCityForJobsTab() {
    var cs = document.getElementById('city-screen');
    if (!cs) { setTimeout(_observeCityForJobsTab, 300); return; }
    new MutationObserver(function () {
      if (cs.classList.contains('city-open')) {
        /* Remove duplicates, keep only our single tab */
        var t = document.querySelector('#city-screen .city-tabs');
        if (!t) return;
        var existing = t.querySelectorAll('[data-ctab="jobs"]');
        if (existing.length !== 1 || !document.getElementById('city-tab-jobs-v3c')) {
          existing.forEach(function (b) { b.remove(); });
          var nb = document.createElement('button');
          nb.className    = 'city-tab-btn';
          nb.id           = 'city-tab-jobs-v3c';
          nb.dataset.ctab = 'jobs';
          nb.textContent  = '💼 Jobs';
          nb.addEventListener('click', function () {
            if (typeof setCityTab === 'function') setCityTab('jobs');
          });
          t.appendChild(nb);
        }
      }
    }).observe(cs, { attributes: true, attributeFilter: ['class'] });
  }
  _observeCityForJobsTab();

  /* ────────────────────────────────────────────────────────────────────
     SECTION 4  DAILY QUESTS — move above ⭐ Skills in the bag tab
     We wrap buildInv and reorder the HTML string.
  ──────────────────────────────────────────────────────────────────── */
  function _hookBuildInvReorderQuests() {
    if (typeof window.buildInv !== 'function') { setTimeout(_hookBuildInvReorderQuests, 200); return; }
    var _prev = window.buildInv;
    window.buildInv = function () {
      var html = _prev.apply(this, arguments);

      /* Find quest section */
      var QUEST_MARKER = '<div class="s-sec">📋 Daily Quests</div>';
      var qIdx = html.indexOf(QUEST_MARKER);
      if (qIdx === -1) return html; /* quests not rendered yet — skip */

      /* Find skills section (comes before quests in original) */
      var SKILLS_MARKER = '<div class="s-sec">⭐ Skills</div>';
      var sIdx = html.indexOf(SKILLS_MARKER);
      if (sIdx === -1 || sIdx >= qIdx) return html; /* order already correct or not found */

      /* Extract quest block from the end */
      var questBlock = html.substring(qIdx);
      var beforeQuests = html.substring(0, qIdx);

      /* Insert quest block just before skills section */
      var sIdxInBefore = beforeQuests.indexOf(SKILLS_MARKER);
      if (sIdxInBefore === -1) return html; /* safety */

      html = beforeQuests.substring(0, sIdxInBefore)
           + questBlock
           + beforeQuests.substring(sIdxInBefore);

      return html;
    };
    console.log('[PatchV3c] buildInv wrapped — Daily Quests moved above Skills.');
  }
  _hookBuildInvReorderQuests();

  /* ────────────────────────────────────────────────────────────────────
     SECTION 5  NEW 10-STEP TUTORIAL
     We override openHelp, helpNav, and renderHelpStep so the new steps
     are used without touching script.js's const HELP_STEPS array.
  ──────────────────────────────────────────────────────────────────── */
  var MY_STEPS = [
    {
      e: '🌾',
      title: 'Welcome to Valley Farm!',
      body: 'Grow crops, earn gold, and build your farming empire across four seasons. Each year has 4 seasons of 28 days each. The game auto-saves every 30 seconds, so your progress is always safe.',
      tip: 'Tip: Come back any day — your crops grow overnight while you sleep!'
    },
    {
      e: '⛏',
      title: 'Tilling with the Hoe',
      body: 'Tap the ⛏ Hoe button to open the Hoe Size Picker. Choose 1×1, 2×2, 3×3 or 4×4. Tap a soil tile to see a glowing white preview of the area. Tap the preview again to confirm and till the land.',
      tip: 'Shortcut: Press H on keyboard. 2×2 is always available — no upgrade needed!'
    },
    {
      e: '⚒',
      title: 'Hoe Upgrades',
      body: 'Open the Bag panel → Upgrades tab. Buy "Hoe Upgrade" (1,200g) to unlock 3×3 tilling. Buy "Iron Head" (2,500g) after that to unlock 4×4. Each swing clears up to 16 tiles at once!',
      tip: 'Tip: Upgrades are per-land — buy them separately for each farm you own.'
    },
    {
      e: '🛒',
      title: 'Buying Seeds',
      body: 'Open the Bag panel and switch to the Shop tab. Seeds are season-specific — you can only buy what grows in the current season. Prices rise a little each year, so stock up early!',
      tip: 'Mobile tip: Swipe UP on the farm, or tap 🎒 Bag in the toolbar, to open the panel.'
    },
    {
      e: '🌱',
      title: 'Planting Seeds',
      body: 'Select the 🌱 Seeds tool. On mobile a seed picker opens automatically — choose a seed type. Then tap any tilled soil tile to plant. Each tap uses one seed from your inventory.',
      tip: 'Shortcut: Press S on keyboard. You can only plant on tilled, unplanted soil!'
    },
    {
      e: '💧',
      title: 'Watering Your Crops',
      body: 'Select the 💧 Water tool and tap planted tiles. Crops ONLY grow on days they are watered — miss a day and that day\'s growth is skipped. Buy a Sprinkler upgrade to auto-water each morning!',
      tip: 'Shortcut: Press W. Rainy days auto-water everything for free.'
    },
    {
      e: '🌿',
      title: 'Using Fertilizer',
      body: 'Buy fertilizers from the Shop tab (Basic, Rich Compost, Speed Grow, Mega). Then tap ⛏ Hoe to open the size picker and hit 🌿 Fert to switch to the Fert tool. Apply to tilled soil before planting for big bonuses!',
      tip: 'Tip: Mega Fertilizer gives +35% bonus yield. Speed Grow advances crops 2× per watered day.'
    },
    {
      e: '✨',
      title: 'Harvesting Crops',
      body: 'When a crop glows ✨ it\'s ready! Use the 🌾 Scythe tool and tap it to harvest into your bag. On mobile, long-press the 🌾 Harvest dock button for instant Harvest All. Ship from the Bag tab — gold arrives next morning.',
      tip: 'Shortcut: Press R for Scythe. Higher Harvesting skill = bonus yield chance!'
    },
    {
      e: '🏙️',
      title: 'The City — Stocks & Jobs',
      body: 'Reach Farming Level 5 to unlock the City (via Map tab). Visit the 📊 Stock Exchange to trade shares in 6 companies and even list your own farm as a business! Visit 💼 Jobs Board to take a job for daily gold and special perks.',
      tip: 'Tip: Companies are HOT 🔥 in their strong seasons — buy before and sell after the peak!'
    },
    {
      e: '🌙',
      title: 'Seasons, Sleep & Winter',
      body: 'Each season lasts 28 days. Press Sleep (or 💤 on mobile) to end the day — crops grow, rent is paid, and job wages arrive. In Winter, planting stops but a live Auction Market opens! Stock up in Fall and sell at peak Winter prices.',
      tip: 'Tip: Buy the Greenhouse upgrade to keep crops alive through Winter. Plan ahead!'
    },
  ];

  var _myHelpStep = 0;

  function _renderMyStep() {
    var step = MY_STEPS[_myHelpStep];
    if (!step) return;
    var emojiEl    = document.getElementById('help-emoji');
    var titleEl    = document.getElementById('help-title');
    var bodyEl     = document.getElementById('help-body');
    var tipEl      = document.getElementById('help-tip');
    var labelEl    = document.getElementById('help-step-label');
    var dotsEl     = document.getElementById('help-dots');
    var prevBtn    = document.getElementById('help-prev');
    var nextBtn    = document.getElementById('help-next');
    if (emojiEl)  emojiEl.textContent  = step.e;
    if (titleEl)  titleEl.textContent  = step.title;
    if (bodyEl)   bodyEl.textContent   = step.body;
    if (tipEl)    tipEl.textContent    = step.tip;
    if (labelEl)  labelEl.textContent  = 'Step ' + (_myHelpStep+1) + ' of ' + MY_STEPS.length;
    if (dotsEl)   dotsEl.innerHTML     = MY_STEPS.map(function(_,i) {
      return '<div class="help-dot' + (i===_myHelpStep?' active':'') + '"></div>';
    }).join('');
    if (prevBtn) prevBtn.style.display = _myHelpStep === 0 ? 'none' : 'block';
    if (nextBtn) {
      var isLast = _myHelpStep === MY_STEPS.length - 1;
      nextBtn.textContent = isLast ? 'Done ✓' : 'Next →';
      nextBtn.onclick = isLast ? _myCloseHelp : function () { _myHelpNav(1); };
    }
  }

  function _myHelpNav(dir) {
    _myHelpStep = Math.max(0, Math.min(MY_STEPS.length-1, _myHelpStep+dir));
    _renderMyStep();
  }

  function _myOpenHelp() {
    _myHelpStep = 0;
    if (typeof paused !== 'undefined') window.paused = true;
    var overlay = document.getElementById('help-overlay');
    if (overlay) overlay.classList.add('show');
    _renderMyStep();
    /* Bind prev button */
    var prevBtn = document.getElementById('help-prev');
    if (prevBtn) prevBtn.onclick = function () { _myHelpNav(-1); };
  }

  function _myCloseHelp() {
    var overlay = document.getElementById('help-overlay');
    if (overlay) overlay.classList.remove('show');
    if (typeof paused !== 'undefined') window.paused = false;
  }

  /* Replace the global functions */
  function _installTutorial() {
    if (typeof window.openHelp !== 'function') { setTimeout(_installTutorial, 200); return; }
    window.openHelp       = _myOpenHelp;
    window.closeHelp      = _myCloseHelp;
    window.helpNav        = _myHelpNav;
    window.renderHelpStep = _renderMyStep;
    console.log('[PatchV3c] Tutorial replaced with 10-step version.');
  }
  _installTutorial();

  /* ────────────────────────────────────────────────────────────────────
     DONE
  ──────────────────────────────────────────────────────────────────── */
  console.log('[PatchV3c v1.0] ✅ Loaded!\n' +
    '  · Seamless grass field restored (gv* tints, no borders, gap:0)\n' +
    '  · Jobs Board removed from Shop tab\n' +
    '  · City screen has exactly one 💼 Jobs tab\n' +
    '  · Daily Quests moved above ⭐ Skills in Bag tab\n' +
    '  · 10-step tutorial installed');
})();


/* ────────────────────── tut.js ────────────────────── */
/* ═══════════════════════════════════════════════════════════════════════
   VALLEY FARM — TUTORIAL PATCH  (tutorial_patch.js)  v1.0
   ─────────────────────────────────────────────────────────────────────
   Load order: after script.js (any position — uses a MutationObserver
   so it doesn't care about exact timing).

   Strategy
   ─────────
   • HELP_STEPS, helpStep and paused are let/const closure variables
     inside script.js — they are NOT reachable via window.
   • openHelp() and closeHelp() ARE window properties (function
     declarations) so we leave them alone; openHelp() still handles
     pausing and closeHelp() still unpauses — we don't touch that.
   • We override window.renderHelpStep and window.helpNav only.
     Both are function declarations → window properties → overridable.
   • A MutationObserver fires the moment the overlay gains class "show"
     (i.e. immediately after openHelp runs), resets our step counter,
     and renders step 0 with our content.  Rock-solid regardless of
     timing.
═══════════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ── 10 Tutorial Steps ─────────────────────────────────────── */
  var STEPS = [
    {
      e: '🌾',
      title: 'Welcome to Valley Farm!',
      body: 'Grow crops, earn gold, and build your farm across four seasons. Each year has 4 seasons × 28 days. Your game auto-saves every 30 seconds — nothing is lost when you close the tab.',
      tip: '💡 New here? Follow these 10 steps and you\'ll be a master farmer in no time!'
    },
    {
      e: '⛏',
      title: 'Tilling with the Hoe',
      body: 'Tap the ⛏ Hoe button to open the Size Picker. Pick 1×1, 2×2, 3×3 or 4×4. Now tap a grass tile — a glowing white preview appears showing exactly which tiles will be tilled. Tap any highlighted tile to confirm and till the whole area.',
      tip: '⌨ Keyboard: H selects the Hoe. 2×2 is always available — no upgrade needed!'
    },
    {
      e: '⚒',
      title: 'Hoe Upgrades (3×3 & 4×4)',
      body: 'Open the Bag panel → Upgrades tab. "Hoe Upgrade" (1,200g) unlocks 3×3 tilling — 9 tiles per click. "Iron Head" (2,500g) unlocks 4×4 — 16 tiles at once! The size picker in the Hoe menu automatically unlocks these options after purchase.',
      tip: '💡 Buying upgrades early pays off fast — fewer clicks means more crops!'
    },
    {
      e: '🛒',
      title: 'Buying Seeds',
      body: 'Open the Bag panel and tap the Shop tab. Seeds are season-specific — only crops that can grow right now are listed. Stock up at the start of each season before prices tick up. Fertilizers are also sold here.',
      tip: '📱 Mobile: Swipe UP on the farm field, or tap the 🎒 Bag toolbar button, to open the panel.'
    },
    {
      e: '🌱',
      title: 'Planting Seeds',
      body: 'Select the 🌱 Seeds tool. On mobile a seed picker slides up automatically — choose your crop. Then tap any tilled tile to plant. Each tap plants one seed from your inventory into that spot.',
      tip: '⌨ Keyboard: S switches to Seeds. Only tilled, empty soil can be planted!'
    },
    {
      e: '💧',
      title: 'Watering Your Crops',
      body: 'Select the 💧 Water tool and tap each planted tile. Crops only grow on days they are watered — miss a day and that day\'s progress is skipped. Buy the Sprinkler upgrade from the Upgrades tab to auto-water every morning.',
      tip: '⌨ Keyboard: W switches to Water. Rainy days water everything for free automatically!'
    },
    {
      e: '🌿',
      title: 'Fertilizer',
      body: 'Buy fertilizers from the Shop tab (Basic, Rich Compost, Speed Grow, Mega). To apply: tap the ⛏ Hoe button to open the Size Picker, then tap the 🌿 Fert button. The toolbar icon switches to Fert. Apply to tilled soil before planting for bonuses — faster growth or bigger yield.',
      tip: '💡 Mega Fertilizer gives +35% bonus yield. Speed Grow makes crops advance 2× per watered day!'
    },
    {
      e: '✨',
      title: 'Harvesting & Shipping',
      body: 'When a crop glows ✨ it\'s ready! Switch to the 🌾 Scythe tool and tap it to harvest into your bag. On mobile, long-press the 🌾 Harvest dock button for instant Harvest All. Open the Bag panel and tap Ship All — gold arrives the next morning after you sleep.',
      tip: '⌨ Keyboard: R switches to Scythe. Higher Harvesting skill = a chance at bonus items!'
    },
    {
      e: '🎒',
      title: 'The Bag Panel',
      body: 'Swipe UP on the farm (mobile) or tap 🎒 Bag to open your panel. Tabs inside: Bag (inventory + ship), Shop (seeds & ferts & upgrades), Skills (your XP levels), and 📋 Daily Quests — 3 tasks refresh each morning for bonus gold and XP.',
      tip: '💡 Check Daily Quests each morning — they\'re easy gold while you farm normally!'
    },
    {
      e: '🏙️',
      title: 'City, Jobs & Seasons',
      body: 'Reach Farming Level 5 to unlock the City (via the Map). The 📊 Stock Exchange lets you trade shares and list your own farm. The 💼 Jobs Board gives a daily wage + special perks. In Winter, farming stops — use the live Auction Market to sell stored crops at peak prices!',
      tip: '💡 Buy a Greenhouse upgrade so your crops survive through Winter. Plan ahead every Fall!'
    }
  ];

  /* ── Step counter (separate from script.js's closure "helpStep") ─ */
  var _step = 0;

  /* ── Render a step into the existing help overlay DOM ─────────── */
  function _render() {
    var s = STEPS[_step];
    if (!s) return;

    var get = function (id) { return document.getElementById(id); };

    /* Content */
    if (get('help-emoji'))      get('help-emoji').textContent      = s.e;
    if (get('help-title'))      get('help-title').textContent      = s.title;
    if (get('help-body'))       get('help-body').textContent       = s.body;
    if (get('help-tip'))        get('help-tip').textContent        = s.tip;

    /* Step counter label */
    if (get('help-step-label'))
      get('help-step-label').textContent = 'Step ' + (_step + 1) + ' of ' + STEPS.length;

    /* Progress dots */
    if (get('help-dots'))
      get('help-dots').innerHTML = STEPS.map(function (_, i) {
        return '<div class="help-dot' + (i === _step ? ' active' : '') + '"></div>';
      }).join('');

    /* Prev button */
    var prevBtn = get('help-prev');
    if (prevBtn) {
      prevBtn.style.display = _step === 0 ? 'none' : 'block';
      prevBtn.onclick = function () { window.helpNav(-1); };
    }

    /* Next / Done button */
    var nextBtn = get('help-next');
    if (nextBtn) {
      var isLast = (_step === STEPS.length - 1);
      nextBtn.textContent = isLast ? 'Done ✓' : 'Next →';
      /* closeHelp is a function declaration in script.js → window property
         so calling window.closeHelp() correctly unpauses the game via its
         own closure access to the script.js "paused" variable.          */
      nextBtn.onclick = isLast
        ? function () { if (typeof closeHelp === 'function') closeHelp(); }
        : function () { window.helpNav(1); };
    }
  }

  /* ── Override window.renderHelpStep ───────────────────────────── */
  /* This is a function declaration in script.js → lives on window.
     Replacing it means our content shows whenever renderHelpStep()
     is called (including from inside openHelp()).                   */
  function _install() {
    if (typeof window.renderHelpStep !== 'function' ||
        typeof window.helpNav        !== 'function') {
      setTimeout(_install, 150);
      return;
    }

    window.renderHelpStep = _render;

    window.helpNav = function (dir) {
      _step = Math.max(0, Math.min(STEPS.length - 1, _step + dir));
      _render();
    };

    console.log('[TutorialPatch] renderHelpStep + helpNav overridden.');
  }
  _install();

  /* ── MutationObserver: reset to step 0 whenever overlay opens ─── */
  /* This fires AFTER openHelp() adds class "show", ensuring our
     content is always correct even if openHelp called renderHelpStep
     before our override was in place.                               */
  function _observeOverlay() {
    var overlay = document.getElementById('help-overlay');
    if (!overlay) { setTimeout(_observeOverlay, 200); return; }

    var _wasShowing = overlay.classList.contains('show');
    new MutationObserver(function (mutations) {
      mutations.forEach(function (m) {
        var nowShowing = overlay.classList.contains('show');
        if (nowShowing && !_wasShowing) {
          /* Overlay just became visible — reset and render our step 0 */
          _step = 0;
          _render();
        }
        _wasShowing = nowShowing;
      });
    }).observe(overlay, { attributes: true, attributeFilter: ['class'] });

    console.log('[TutorialPatch] Overlay observer active.');
  }
  _observeOverlay();

  console.log('[TutorialPatch v1.0] Loaded — 10 custom tutorial steps ready.');
})();
