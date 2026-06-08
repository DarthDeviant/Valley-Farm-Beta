/* ═══════════════════════════════════════════════════════════════════
   bugfix-patch2.js — Valley Farm  (REPLACES bugfix-patch.js)

   Changes
   ───────
   1. Arrow keys ↑↓←→ scroll the farm grid (not A/D).  D is restored
      as the Shovel shortcut.
   2. Hoe system fully redone from scratch:
      • _getDesiredHoeSize overridden so selecting 1×1 / 2×2 always
        works regardless of which upgrades you own (fixes the regression
        where 4×4 unlock made smaller sizes impossible).
      • clickTile outermost wrapper handles ALL sizes without delegating
        to bigupdate_4 or PatchV3 (source of the original bug).
      • White pulsing highlight follows the cursor on PC — single click
        tills.
      • Same highlight on mobile — first tap shows it, second tap
        (anywhere in the highlighted area) confirms and tills.
   3. Upgrade chain:
      hoe_gate  (Hoe Upgrade, 500g) → unlocks 2×2
      hoe_3x3   (Iron Head)         → unlocks 3×3 (requires hoe_gate)
      hoe_4x4   (Steel Head)        → unlocks 4×4 (requires Iron Head)
      Iron Head & Steel Head cards are hidden until Hoe Upgrade is owned.
   4. Large grid: 72 px tiles (mobile), 70 px tiles (PC). Touch-scroll
      on mobile; arrow-key scroll on PC.
   5. Pickers close on outside tap (mobile).
   6. Mobile: tapping 🌿 Fert inside the hoe picker shows a fertilizer
      selector in-panel instead of closing it.
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  var isMobile = function () { return window.innerWidth <= 680; };

  /* ─── helpers referenced before they are declared (hoisted) ─── */
  function _clearHLAll() {
    document.querySelectorAll('.hoe-hl').forEach(function (el) {
      el.classList.remove('hoe-hl');
    });
  }
  function _clearGhost() {
    _clearHLAll();
    var hint = document.getElementById('hoe-confirm-hint');
    if (hint) hint.style.display = 'none';
    _pendingTill = false; _ghostRow = -1; _ghostCol = -1;
  }
  function _reapplyGhostAfterRender() {
    if (_pendingTill && _ghostRow >= 0) _applyGhost(_ghostRow, _ghostCol);
  }

  /* ──────────────────────────────────────────────────────────────
     CSS
  ────────────────────────────────────────────────────────────── */
  var _css = document.createElement('style');
  _css.textContent = `

/* ══ HOE HIGHLIGHT — white pulsing ═══════════════════════════ */
.farm-cell.hoe-hl {
  outline: 2px solid rgba(255,255,255,.92) !important;
  background: rgba(255,255,255,.22) !important;
  animation: hoeHLPulse .85s ease-in-out infinite !important;
  position: relative; z-index: 3; box-sizing: border-box;
}
/* Override old orange .hoe-preview from bigupdate_4 so it matches */
.farm-cell.hoe-preview {
  outline: 2px solid rgba(255,255,255,.92) !important;
  background: rgba(255,255,255,.22) !important;
  animation: hoeHLPulse .85s ease-in-out infinite !important;
}
@keyframes hoeHLPulse {
  0%,100% { outline-color: rgba(255,255,255,.92); background: rgba(255,255,255,.22) !important; }
  50%      { outline-color: rgba(255,255,255,.36); background: rgba(255,255,255,.07) !important; }
}

/* "Tap again to confirm" badge */
#hoe-confirm-hint {
  display: none;
  position: fixed; z-index: 700;
  background: rgba(0,0,0,.75);
  color: #fff;
  font-family: 'Nunito', sans-serif;
  font-size: 11px; font-weight: 800;
  padding: 4px 14px;
  border-radius: 14px;
  pointer-events: none; white-space: nowrap;
  transform: translateX(-50%);
  box-shadow: 0 2px 14px rgba(0,0,0,.3);
}

/* ══ LARGE SCROLLABLE GRID ══════════════════════════════════ */
#farm-wrap {
  overflow: auto !important;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--ui-border) transparent;
}
#farm-wrap::-webkit-scrollbar { width: 5px; height: 5px; }
#farm-wrap::-webkit-scrollbar-thumb { background: var(--ui-border); border-radius: 3px; }

/* Arrow-key hint (PC only) */
#farm-arrow-hint {
  display: none;
  position: absolute; bottom: 6px; right: 8px;
  font-size: 9px; font-weight: 800;
  color: var(--text-soft); font-family: 'Nunito', sans-serif;
  pointer-events: none;
  background: var(--ui-bg2); border: 1px solid var(--ui-border);
  border-radius: 20px; padding: 2px 9px; opacity: .7; z-index: 10;
}
@media (min-width: 681px) { #farm-arrow-hint { display: block; } }
@media (max-width: 680px) { #farm-wrap { padding-bottom: 0 !important; } }

/* ══ UPGRADE GATING ═════════════════════════════════════════ */
/* Iron Head & Steel Head cards hidden by JS until Hoe Upgrade bought */

`;
  document.head.appendChild(_css);


  /* ══════════════════════════════════════════════════════════════
     §1  ARROW KEY SCROLLING  (↑ ↓ ← →)
         Capture phase — prevents page scroll AND fires before
         script.js's bubble-phase handler.
         D is NOT intercepted here so it reaches script.js → Shovel.
  ══════════════════════════════════════════════════════════════ */
  var _kL = false, _kR = false, _kU = false, _kD = false;
  var _panRAF = null;

  function _panLoop() {
    var fw = document.getElementById('farm-wrap');
    if (fw) {
      if (_kL) fw.scrollLeft = Math.max(0, fw.scrollLeft - 8);
      if (_kR) fw.scrollLeft += 8;
      if (_kU) fw.scrollTop  = Math.max(0, fw.scrollTop  - 8);
      if (_kD) fw.scrollTop  += 8;
    }
    _panRAF = (_kL || _kR || _kU || _kD) ? requestAnimationFrame(_panLoop) : null;
  }

  document.addEventListener('keydown', function (e) {
    if (isMobile()) return;
    var active = document.activeElement;
    if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' ||
                   active.tagName === 'SELECT')) return;
    if (!document.getElementById('game-screen').classList.contains('active')) return;

    var dir = e.code === 'ArrowLeft'  ? 'L' :
              e.code === 'ArrowRight' ? 'R' :
              e.code === 'ArrowUp'    ? 'U' :
              e.code === 'ArrowDown'  ? 'D' : null;
    if (!dir) return;
    e.preventDefault();   // prevent page scroll
    e.stopPropagation();  // stop other listeners (nothing listens to arrows normally, but safe)
    if (dir === 'L') _kL = true;
    if (dir === 'R') _kR = true;
    if (dir === 'U') _kU = true;
    if (dir === 'D') _kD = true;
    if (!_panRAF) _panRAF = requestAnimationFrame(_panLoop);
  }, true /* capture */);

  document.addEventListener('keyup', function (e) {
    if (e.code === 'ArrowLeft')  _kL = false;
    if (e.code === 'ArrowRight') _kR = false;
    if (e.code === 'ArrowUp')    _kU = false;
    if (e.code === 'ArrowDown')  _kD = false;
  });


  /* ══════════════════════════════════════════════════════════════
     §2  LARGE GRID TILES  (72 px mobile, 70 px PC)
  ══════════════════════════════════════════════════════════════ */
  var TILE_MOB = 72, TILE_PC = 70;

  function _patchLargeGrid() {
    if (typeof window.renderFarm !== 'function') { setTimeout(_patchLargeGrid, 200); return; }
    var _prev = window.renderFarm;
    window.renderFarm = function () {
      _prev.apply(this, arguments);
      var grid = document.getElementById('farm-grid');
      if (!grid) return;
      var GW_v = typeof GW !== 'undefined' ? GW : 14;
      var GH_v = typeof GH !== 'undefined' ? GH : 10;
      var tSz  = isMobile() ? TILE_MOB : TILE_PC;
      grid.style.gridTemplateColumns = 'repeat(' + GW_v + ',' + tSz + 'px)';
      grid.style.gridTemplateRows    = 'repeat(' + GH_v + ',' + tSz + 'px)';
      grid.style.width  = tSz * GW_v + 'px';
      grid.style.height = tSz * GH_v + 'px';
      grid.style.gap    = '2px';
      Array.from(grid.children).forEach(function (el) {
        el.style.width    = tSz + 'px';
        el.style.height   = tSz + 'px';
        el.style.padding  = '0';
        el.style.fontSize = Math.floor(tSz * .52) + 'px';
      });
      var fw = document.getElementById('farm-wrap');
      if (fw) { fw.style.overflow = 'auto'; fw.style.webkitOverflowScrolling = 'touch'; }
      _reapplyGhostAfterRender(); // restore mobile ghost after tile rebuild
      _ensureArrowHint();
    };
    console.log('[patch2] Large grid patch applied.');
  }
  _patchLargeGrid();

  function _ensureArrowHint() {
    if (isMobile() || document.getElementById('farm-arrow-hint')) return;
    var fw = document.getElementById('farm-wrap');
    if (!fw) return;
    if (getComputedStyle(fw).position === 'static') fw.style.position = 'relative';
    var h = document.createElement('div');
    h.id = 'farm-arrow-hint'; h.textContent = '↑ ↓ ← → Arrow keys to scroll';
    fw.appendChild(h);
  }
  setTimeout(_ensureArrowHint, 900);


  /* ══════════════════════════════════════════════════════════════
     §3  HOE UPGRADE CHAIN
         hoe_gate  → Hoe Upgrade (500g) — unlocks 2×2
         hoe_3x3   → Iron Head          — unlocks 3×3
         hoe_4x4   → Steel Head         — unlocks 4×4
  ══════════════════════════════════════════════════════════════ */
  function _setupHoeUpgrades() {
    if (typeof UPGRADES === 'undefined') { setTimeout(_setupHoeUpgrades, 200); return; }

    if (!UPGRADES.hoe_gate) {
      UPGRADES.hoe_gate = {
        n: 'Hoe Upgrade', e: '⛏',
        desc: 'Upgrade your basic hoe — unlocks 2×2 tilling and the Iron/Steel Head attachment slots.',
        cost: 500, max: 1,
      };
    }

    /* Rename repeatedly to beat PatchV3 which also renames at ~800 ms */
    function _doRename() {
      if (UPGRADES.hoe_3x3) {
        UPGRADES.hoe_3x3.n    = 'Iron Head';
        UPGRADES.hoe_3x3.desc = 'Forged iron hoe head — tills a 3×3 area per swing. Requires Hoe Upgrade.';
      }
      if (UPGRADES.hoe_4x4) {
        UPGRADES.hoe_4x4.n    = 'Steel Head';
        UPGRADES.hoe_4x4.desc = 'Hardened steel head — massive 4×4 tilling power. Requires Iron Head.';
      }
    }
    _doRename();
    setTimeout(_doRename, 600);
    setTimeout(_doRename, 1200); // belt-and-suspenders

    /* Prerequisite guard */
    function _hookBuyUpgrade() {
      if (typeof window.buyUpgrade !== 'function') { setTimeout(_hookBuyUpgrade, 200); return; }
      var _prev = window.buyUpgrade;
      window.buyUpgrade = function (id) {
        var u = typeof curUpgs === 'function' ? curUpgs() : {};
        if (id === 'hoe_3x3' && !(u.hoe_gate >= 1)) {
          if (typeof toast === 'function') toast('🔒 Buy the Hoe Upgrade first!', 'warn', 2200);
          return;
        }
        if (id === 'hoe_4x4' && !(u.hoe_3x3 >= 1)) {
          if (typeof toast === 'function') toast('🔒 Buy the Iron Head first!', 'warn', 2200);
          return;
        }
        _prev.apply(this, arguments);
        if (['hoe_gate','hoe_3x3','hoe_4x4'].indexOf(id) >= 0)
          setTimeout(_rebuildHoePickerIfOpen, 80);
      };
    }
    _hookBuyUpgrade();

    /* Gate renderSide: hide Iron/Steel Head cards until Hoe Upgrade owned */
    function _hookRenderSide() {
      if (typeof window.renderSide !== 'function') { setTimeout(_hookRenderSide, 200); return; }
      var _prev = window.renderSide;
      window.renderSide = function () {
        _prev.apply(this, arguments);
        _gateHoeUpgradeCards();
      };
    }
    _hookRenderSide();

    console.log('[patch2] Hoe upgrade chain ready.');
  }
  _setupHoeUpgrades();

  function _gateHoeUpgradeCards() {
    ['side-content', 'sheet-content'].forEach(function (sid) {
      var el = document.getElementById(sid);
      if (!el) return;
      var u = typeof curUpgs === 'function' ? curUpgs() : {};
      var hasGate = (u.hoe_gate || 0) >= 1;
      ['hoe_3x3', 'hoe_4x4'].forEach(function (uid) {
        var btn  = el.querySelector('[data-upgrade="' + uid + '"]');
        if (!btn) return;
        var card = btn.closest('.upg-card');
        if (card) card.style.display = hasGate ? '' : 'none';
      });
    });
  }


  /* ══════════════════════════════════════════════════════════════
     §4  CLEAN HOE SIZE  —  _getMyHoeSize()
         Reads G.hoeSize exactly (no forced upcap).
         Only BLOCKS a size if the required upgrade isn't owned.
         This fixes: "can't go back to 1×1 / 2×2 after 4×4 unlock".
  ══════════════════════════════════════════════════════════════ */
  function _getMyHoeSize() {
    var desired = (typeof G !== 'undefined' && G.hoeSize)
                  ? parseInt(G.hoeSize, 10) : 1;
    if (isNaN(desired) || desired < 1) desired = 1;
    if (typeof curUpgs !== 'function') return 1;
    var u    = curUpgs();
    var has2 = (u.hoe_gate || 0) >= 1;
    var has3 = has2 && (u.hoe_3x3 || 0) >= 1;
    var has4 = has3 && (u.hoe_4x4 || 0) >= 1;
    if (desired === 4) return has4 ? 4 : (has3 ? 3 : (has2 ? 2 : 1));
    if (desired === 3) return has3 ? 3 : (has2 ? 2 : 1);
    if (desired === 2) return has2 ? 2 : 1;
    return 1;
  }
  /* Override PatchV3's export so any code using window._getDesiredHoeSize
     also gets the correct behaviour */
  window._getDesiredHoeSize = _getMyHoeSize;

  /* Tile offsets for an N×N hoe area */
  function _hoeOffsets(size) {
    if (size === 1) return [[0, 0]];
    if (size === 2) return [[0,0],[0,1],[1,0],[1,1]]; // top-left origin
    var range = size === 4 ? [-1,0,1,2] : [-1,0,1];  // centred origin
    var o = [];
    for (var i = 0; i < range.length; i++)
      for (var j = 0; j < range.length; j++)
        o.push([range[i], range[j]]);
    return o;
  }


  /* ══════════════════════════════════════════════════════════════
     §5  TILLING ENGINE  —  replaces bigupdate_4 + PatchV3 logic
         Does the actual farm state mutation for any size.
  ══════════════════════════════════════════════════════════════ */
  function _doTillAt(r, c) {
    if (typeof G === 'undefined') return;
    var GW_v = typeof GW !== 'undefined' ? GW : 14;
    var GH_v = typeof GH !== 'undefined' ? GH : 10;
    var size    = _getMyHoeSize();
    var offsets = _hoeOffsets(size);
    var trees   = [];
    if (typeof LAND_TREES !== 'undefined' && G.currentLand)
      trees = (LAND_TREES[G.currentLand] || LAND_TREES.home || []);
    var treeSet = new Set(trees.map(function (t) { return t[0] * 100 + t[1]; }));
    var fLv = typeof getLevel === 'function'
      ? getLevel((G.skills && G.skills.farming && G.skills.farming.xp) || 0) : 1;

    /* ── Single-tile: preserve original error messages ── */
    if (size === 1) {
      if (treeSet.has(r * 100 + c)) {
        if (typeof toast === 'function') toast("Can't till here!", 'warn'); return;
      }
      var tile = G.farm[r] && G.farm[r][c];
      if (!tile) return;
      if (tile.tilled) { if (typeof toast === 'function') toast('Already tilled!', 'info', 800); return; }
      if (tile.deco)   { if (typeof toast === 'function') toast('Remove deco first!', 'warn', 900); return; }
      var nt = Object.assign({}, tile, { tilled: true, idleDays: 0, deco: null });
      if (fLv >= 10) nt.watered = true;
      G.farm[r][c] = nt;
      if (fLv < 5 && typeof S !== 'undefined' && S.energyCost)
        G.energy = Math.max(0, (G.energy || 0) - 0.35);
      if (typeof addXP  === 'function') addXP('farming', 3);
      if (typeof snd    === 'function') snd('till');
      if (typeof render === 'function') render();
      return;
    }

    /* ── Multi-tile ── */
    var count = 0, skipped = 0;
    offsets.forEach(function (off) {
      var nr = r + off[0], nc = c + off[1];
      if (nr < 0 || nr >= GH_v || nc < 0 || nc >= GW_v) return;
      if (treeSet.has(nr * 100 + nc)) return;
      var tile = G.farm[nr] && G.farm[nr][nc];
      if (!tile || tile.deco) return;
      if (tile.tilled) { skipped++; return; }
      var nt = Object.assign({}, tile, { tilled: true, idleDays: 0, deco: null });
      if (fLv >= 10) nt.watered = true;
      G.farm[nr][nc] = nt;
      count++;
      if (fLv < 5 && typeof S !== 'undefined' && S.energyCost)
        G.energy = Math.max(0, (G.energy || 0) - 0.35);
      if (typeof addXP === 'function') addXP('farming', 3);
    });

    if (count === 0) {
      if (skipped > 0 && typeof toast === 'function') toast('Area already tilled!', 'info', 900);
      return;
    }
    if (typeof S !== 'undefined' && S.energyCost && G.energy < 0) G.energy = 0;
    if (typeof snd    === 'function') snd('till');
    if (typeof toast  === 'function')
      toast('⚒ ' + size + '×' + size + ' tilled! (' + count + ' tiles)', 'success', 1300);
    if (typeof render === 'function') render();
  }


  /* ══════════════════════════════════════════════════════════════
     §6  WHITE PULSING HIGHLIGHT  (shared PC + mobile)
  ══════════════════════════════════════════════════════════════ */
  function _applyHL(r, c) {
    _clearHLAll();
    var grid = document.getElementById('farm-grid');
    if (!grid) return;
    var GW_v = typeof GW !== 'undefined' ? GW : 14;
    var GH_v = typeof GH !== 'undefined' ? GH : 10;
    _hoeOffsets(_getMyHoeSize()).forEach(function (off) {
      var nr = r + off[0], nc = c + off[1];
      if (nr < 0 || nr >= GH_v || nc < 0 || nc >= GW_v) return;
      var el = grid.children[nr * GW_v + nc];
      if (el) el.classList.add('hoe-hl');
    });
  }

  /* PC: attach mousemove to farm-grid once it exists */
  function _setupPCHover() {
    var grid = document.getElementById('farm-grid');
    if (!grid) { setTimeout(_setupPCHover, 400); return; }

    grid.addEventListener('mousemove', function (e) {
      if (isMobile()) return;
      if (typeof G === 'undefined' || G.tool !== 'hoe') { _clearHLAll(); return; }
      /* Find which child tile the mouse is over */
      var tileEl = e.target;
      if (tileEl.parentElement !== grid) tileEl = tileEl.parentElement;
      if (!tileEl || tileEl.parentElement !== grid) { _clearHLAll(); return; }
      var idx = Array.prototype.indexOf.call(grid.children, tileEl);
      if (idx < 0) { _clearHLAll(); return; }
      var GW_v = typeof GW !== 'undefined' ? GW : 14;
      _applyHL(Math.floor(idx / GW_v), idx % GW_v);
    });

    grid.addEventListener('mouseleave', _clearHLAll);
    console.log('[patch2] PC hover preview ready.');
  }
  setTimeout(_setupPCHover, 500);


  /* ══════════════════════════════════════════════════════════════
     §7  clickTile OVERRIDE  —  outermost wrapper
         PC:     shows highlight then tills on click.
         Mobile: first tap → highlight; second tap in same area → till.
  ══════════════════════════════════════════════════════════════ */
  var _pendingTill = false, _ghostRow = -1, _ghostCol = -1;

  function _applyGhost(r, c) {
    _applyHL(r, c);
    /* Position the "tap again" hint above the first highlighted tile */
    var grid = document.getElementById('farm-grid');
    var hint = _getOrCreateHint();
    if (grid && hint) {
      var GW_v  = typeof GW !== 'undefined' ? GW : 14;
      var GH_v  = typeof GH !== 'undefined' ? GH : 10;
      var offs  = _hoeOffsets(_getMyHoeSize());
      /* Find the topmost-leftmost valid tile */
      var minR = GH_v, minC = GW_v;
      offs.forEach(function (off) {
        var nr = r + off[0], nc = c + off[1];
        if (nr >= 0 && nr < GH_v && nc >= 0 && nc < GW_v) {
          if (nr < minR || (nr === minR && nc < minC)) { minR = nr; minC = nc; }
        }
      });
      var el = grid.children[minR * GW_v + minC];
      if (el) {
        var rect = el.getBoundingClientRect();
        hint.textContent   = '⛏ Tap again to till!';
        hint.style.left    = (rect.left + rect.width / 2) + 'px';
        hint.style.top     = Math.max(4, rect.top - 30) + 'px';
        hint.style.display = 'block';
      }
    }
  }

  function _getOrCreateHint() {
    var h = document.getElementById('hoe-confirm-hint');
    if (!h) { h = document.createElement('div'); h.id = 'hoe-confirm-hint'; document.body.appendChild(h); }
    return h;
  }

  function _hookClickTile() {
    if (typeof window.clickTile !== 'function') { setTimeout(_hookClickTile, 300); return; }
    var _prev = window.clickTile;

    window.clickTile = function (r, c) {
      /* Pass through for every tool except hoe */
      if (typeof G === 'undefined' || G.tool !== 'hoe') return _prev.apply(this, arguments);

      if (isMobile()) {
        /* ── MOBILE: two-tap confirm ── */
        if (_pendingTill) {
          /* Is this tap inside the currently highlighted area? */
          var inArea = _hoeOffsets(_getMyHoeSize()).some(function (off) {
            return (_ghostRow + off[0]) === r && (_ghostCol + off[1]) === c;
          });
          if (inArea) {
            var gr = _ghostRow, gc = _ghostCol;
            _clearGhost();
            _doTillAt(gr, gc);
            return;
          }
          _clearGhost(); // tapped outside → reset and start new ghost below
        }
        _ghostRow = r; _ghostCol = c; _pendingTill = true;
        _applyGhost(r, c);

      } else {
        /* ── PC: one tap tills ── */
        _clearHLAll();
        _doTillAt(r, c);
      }
    };
    console.log('[patch2] clickTile overridden for clean hoe.');
  }
  _hookClickTile();

  /* Clear ghost/highlight when switching away from hoe, or when farm re-renders */
  function _hookSetTool() {
    if (typeof window.setTool !== 'function') { setTimeout(_hookSetTool, 300); return; }
    var _prev = window.setTool;
    window.setTool = function (t) {
      _prev.apply(this, arguments);
      if (t !== 'hoe') { _clearHLAll(); _clearGhost(); }
      /* After setTool('hoe') the existing PatchV3 opens/refreshes its picker.
         We immediately overwrite the content with ours (in the microtask queue). */
      if (t === 'hoe') {
        setTimeout(function () {
          var el = document.getElementById('hoe-picker');
          if (el) _populateHoePicker(el);
        }, 0);
      }
    };
    console.log('[patch2] setTool hooked.');
  }
  _hookSetTool();


  /* ══════════════════════════════════════════════════════════════
     §8  HOE PICKER  (clean rebuild — replaces PatchV3's content)
  ══════════════════════════════════════════════════════════════ */
  var _REQS = ['', 'Hoe Upgrade', 'Iron Head', 'Steel Head'];

  function _miniGrid(n) {
    var cpx = [8, 7, 5, 4][n - 1] || 4;
    var sz  = n * cpx + (n - 1) * 2;
    var cells = '';
    for (var i = 0; i < n * n; i++) cells += '<div style="background:#d97706;border-radius:2px"></div>';
    return '<div style="display:grid;grid-template-columns:repeat(' + n +
           ',1fr);gap:2px;width:' + sz + 'px;height:' + sz + 'px;margin:0 auto 3px">' + cells + '</div>';
  }

  function _populateHoePicker(el) {
    var u    = typeof curUpgs === 'function' ? curUpgs() : {};
    var has2 = (u.hoe_gate || 0) >= 1;
    var has3 = has2 && (u.hoe_3x3 || 0) >= 1;
    var has4 = has3 && (u.hoe_4x4 || 0) >= 1;
    var unlocked  = [true, has2, has3, has4];
    var sizeNames = ['1×1', '2×2', '3×3', '4×4'];
    var current   = _getMyHoeSize();

    var row = [1, 2, 3, 4].map(function (n, i) {
      var ok  = unlocked[i];
      var sel = (current === n && ok) ? ' sel' : '';
      var lck = ok ? '' : ' locked';
      var lb  = ok ? '' : '<span class="hp-lock-badge">🔒</span>';
      var rn  = ok ? '' : '<br><span style="font-size:7px;opacity:.5">needs ' + _REQS[i] + '</span>';
      return '<button class="hp-btn' + sel + lck + '" data-p2size="' + n + '">' +
               lb + _miniGrid(n) +
               '<span class="hp-btn-label">' + sizeNames[i] + rn + '</span>' +
             '</button>';
    }).join('');

    var fertBtn =
      '<div class="hp-sep"></div>' +
      '<button class="hp-fert-btn" id="hp-fert-switch">' +
        '<span style="font-size:22px;line-height:1">🌿</span><span>Fert</span>' +
      '</button>';

    el.innerHTML =
      '<div id="hoe-picker-title">⛏ Hoe Size</div>' +
      '<div class="hp-row">' + row + fertBtn + '</div>';

    /* ── Bind size buttons ── */
    el.querySelectorAll('[data-p2size]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var n   = parseInt(btn.dataset.p2size, 10);
        var idx = n - 1;
        if (btn.classList.contains('locked')) {
          if (typeof toast === 'function')
            toast('🔒 Requires ' + _REQS[idx] + '! Buy it in Upgrades.', 'warn', 2400);
          return;
        }
        if (typeof G !== 'undefined') G.hoeSize = n;
        el.querySelectorAll('[data-p2size]').forEach(function (b) { b.classList.remove('sel'); });
        btn.classList.add('sel');
        _clearHLAll(); // refresh hover after size change
        if (typeof toast === 'function')
          toast('⚒ Hoe: ' + n + '×' + n + ' selected', 'info', 1200);
      });
    });

    /* ── Fert switch ── */
    var fsw = document.getElementById('hp-fert-switch');
    if (fsw) {
      fsw.addEventListener('click', function (e) {
        if (isMobile()) {
          e.stopImmediatePropagation();
          _showMobileFertInPicker(el);
        } else {
          /* PC: close picker, switch to fert tool */
          el.classList.remove('hp-open');
          if (typeof setTool === 'function') setTool('fert');
        }
      });
    }
  }

  function _rebuildHoePickerIfOpen() {
    var el = document.getElementById('hoe-picker');
    if (el && el.classList.contains('hp-open')) _populateHoePicker(el);
  }

  /* Also overwrite picker content on first open if hoe is already selected */
  setTimeout(function () {
    var el = document.getElementById('hoe-picker');
    if (el && el.classList.contains('hp-open')) _populateHoePicker(el);
  }, 650);

  /* Body-level capture to intercept #hp-fert-switch on mobile BEFORE
     PatchV3's listener (which would close picker and switch to fert). */
  document.body.addEventListener('click', function (e) {
    if (!isMobile()) return;
    if (!e.target.closest('#hp-fert-switch')) return;
    e.stopImmediatePropagation();
    var picker = document.getElementById('hoe-picker');
    if (picker && picker.classList.contains('hp-open')) _showMobileFertInPicker(picker);
  }, true);


  /* ══════════════════════════════════════════════════════════════
     §9  MOBILE: FERT SELECTOR INSIDE HOE PICKER
  ══════════════════════════════════════════════════════════════ */
  function _showMobileFertInPicker(pickerEl) {
    if (typeof FERTILIZERS === 'undefined' || typeof G === 'undefined') {
      pickerEl.classList.remove('hp-open');
      if (typeof setTool === 'function') setTool('fert');
      return;
    }
    /* Snapshot the current picker HTML so "Back" can restore it */
    var snap = pickerEl.innerHTML;

    var items = Object.entries(FERTILIZERS).map(function (kv) {
      var id   = kv[0], f = kv[1];
      var have = (G.fertilizers && G.fertilizers[id]) || 0;
      var sel  = G.selectedFert === id ? ' sel' : '';
      var cls  = have === 0 ? ' locked' : sel;
      return '<button class="hp-btn' + cls + '" data-fert-pick="' + id + '">' +
               '<span style="font-size:26px;line-height:1">' + f.e + '</span>' +
               '<span class="hp-btn-label">' + f.n +
                 '<br><span style="color:var(--gold);font-size:8px">×' + have + '</span></span>' +
             '</button>';
    }).join('');

    if (!items) {
      items = '<div style="padding:12px 6px;font-size:10px;color:var(--text-muted);text-align:center">' +
              'No fertilizer! Buy some in Shop 🌿</div>';
    }

    pickerEl.innerHTML =
      '<div id="hoe-picker-title">🌿 Fertilizer</div>' +
      '<div class="hp-row">' + items + '</div>' +
      '<button id="hp-fert-back" style="font-size:9px;font-weight:800;' +
        'color:var(--text-soft);background:none;border:none;cursor:pointer;' +
        'padding:4px 10px;font-family:Nunito,sans-serif;display:block;margin:2px auto 0">' +
        '← Back to Size</button>';

    pickerEl.querySelectorAll('[data-fert-pick]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.classList.contains('locked')) {
          if (typeof toast === 'function')
            toast('No ' + ((FERTILIZERS[btn.dataset.fertPick] || {}).n || 'fertilizer') +
                  '! Buy some in Shop.', 'warn', 2000);
          return;
        }
        var id = btn.dataset.fertPick;
        if (typeof G !== 'undefined') G.selectedFert = id;
        if (typeof setTool === 'function') setTool('fert');
        pickerEl.classList.remove('hp-open');
        var f = FERTILIZERS[id];
        if (f && typeof toast === 'function') toast('🌿 ' + f.n + ' selected!', 'info', 1200);
      });
    });

    var backBtn = document.getElementById('hp-fert-back');
    if (backBtn) {
      backBtn.addEventListener('click', function () {
        pickerEl.innerHTML = snap;
        _populateHoePicker(pickerEl); // re-bind fresh
      });
    }
  }


  /* ══════════════════════════════════════════════════════════════
     §10 CLOSE PICKERS ON OUTSIDE TAP  (mobile)
  ══════════════════════════════════════════════════════════════ */
  document.addEventListener('touchend', function (e) {
    if (!isMobile()) return;
    var t = e.target;

    /* Hoe picker */
    var hp   = document.getElementById('hoe-picker');
    var dhoe = document.getElementById('dock-hoe');
    if (hp && hp.classList.contains('hp-open') &&
        !hp.contains(t) && !(dhoe && dhoe.contains(t))) {
      hp.classList.remove('hp-open');
      _clearGhost();
    }

    /* Deco picker */
    var dp  = document.getElementById('dock-deco-picker');
    var dbt = document.getElementById('dock-sec-deco');
    if (dp && dp.classList.contains('picker-open') &&
        !dp.contains(t) && !(dbt && dbt.contains(t))) {
      dp.classList.remove('picker-open');
      setTimeout(function () {
        if (dp && !dp.classList.contains('picker-open')) dp.style.display = 'none';
      }, 330);
    }

    /* Seed picker */
    var sp  = document.getElementById('dock-seed-picker');
    var sbt = document.getElementById('dock-seed');
    if (sp && sp.classList.contains('picker-open') &&
        !sp.contains(t) && !(sbt && sbt.contains(t))) {
      sp.classList.remove('picker-open');
      setTimeout(function () {
        if (sp && !sp.classList.contains('picker-open')) sp.style.display = 'none';
      }, 330);
    }

    /* More / secondary drawer */
    var dock = document.getElementById('mobile-dock');
    var sec  = document.getElementById('dock-secondary');
    var mb   = document.getElementById('dock-more');
    if (dock && sec && sec.classList.contains('dock-sec-open') && !dock.contains(t)) {
      sec.classList.remove('dock-sec-open');
      if (mb) {
        mb.classList.remove('active');
        var mi = document.getElementById('dock-more-icon');
        if (mi) mi.textContent = '⋯';
      }
    }
  }, { passive: true });


  console.log('[bugfix-patch2] All patches installed ✓');

})();
