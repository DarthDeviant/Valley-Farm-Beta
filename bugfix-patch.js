/* ═══════════════════════════════════════════════════════════════════
   bugfix-patch.js  — Valley Farm fix bundle
   Fixes
   ─────
   1. Hoe picker / Deco picker / More drawer close on outside tap  [mobile]
   2. Fert selection shown inside hoe picker panel instead of closing  [mobile]
   3. Hoe gate upgrade — "Hoe Upgrade" must be bought before
      Iron Head (3×3) and Steel Head (4×4) appear in Upgrades tab
   4. Large farming grid (tiles bigger) — swipe on mobile, A/D pan on PC
   5. Hoe area ghost preview — mobile: two-tap confirm; PC: hover+click
   ═══════════════════════════════════════════════════════════════════ */
(function () {
  'use strict';

  /* ─── Tiny helper ─────────────────────────────────────────────── */
  const isMobile = () => window.innerWidth <= 680;

  /* ─── CSS ─────────────────────────────────────────────────────── */
  const style = document.createElement('style');
  style.textContent = `

/* ══ PATCH 1 — no extra CSS needed (uses existing classes) ════════ */

/* ══ PATCH 4 — large scrollable farm ══════════════════════════════ */
/* Remove the old max-width cap on farm-wrap so the big grid shows  */
#farm-wrap {
  overflow: auto !important;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: thin;
  scrollbar-color: var(--ui-border) transparent;
}
/* Smooth scrollbar on WebKit (desktop) */
#farm-wrap::-webkit-scrollbar { width: 5px; height: 5px; }
#farm-wrap::-webkit-scrollbar-thumb { background: var(--ui-border); border-radius: 3px; }

/* PC panning hint */
#farm-pan-hint {
  display: none;
  position: absolute;
  bottom: 6px; left: 50%;
  transform: translateX(-50%);
  font-size: 9px; font-weight: 800;
  color: var(--text-soft);
  font-family: 'Nunito', sans-serif;
  pointer-events: none;
  background: var(--ui-bg2);
  border: 1px solid var(--ui-border);
  border-radius: 20px;
  padding: 2px 10px;
  white-space: nowrap;
  opacity: 0.75;
  z-index: 10;
}
@media (min-width: 681px) {
  #farm-pan-hint { display: block; }
}
@media (max-width: 680px) {
  /* Disable the old fixed-width calc from mobilepatch — override below */
  #farm-wrap { padding-bottom: 0 !important; }
}

/* ══ PATCH 5 — hoe area ghost (mobile two-tap confirm) ════════════ */
/* Highlight tiles waiting for second-tap confirmation */
.hoe-ghost-mobile {
  outline: 3px solid #f59e0b !important;
  background: rgba(245, 158, 11, 0.38) !important;
  animation: hoeMobileFlash 0.75s ease-in-out infinite;
  position: relative;
  z-index: 5;
}
@keyframes hoeMobileFlash {
  0%,100% { opacity: 1; }
  50%      { opacity: 0.55; }
}
/* "Tap again to till" hint badge */
#hoe-mobile-hint {
  display: none;
  position: fixed;
  z-index: 600;
  background: rgba(217, 119, 6, 0.92);
  color: #fff;
  font-family: 'Nunito', sans-serif;
  font-size: 11px; font-weight: 800;
  padding: 4px 12px;
  border-radius: 14px;
  pointer-events: none;
  white-space: nowrap;
  transform: translateX(-50%);
  box-shadow: 0 2px 12px rgba(0,0,0,0.2);
}
/* PC hover ghost already handled by existing .hoe-preview from bigupdate_4 */

/* ══ PATCH 3 — upgrade card hidden until gate unlocked ════════════ */
.upg-card-gated { display: none !important; }

`;
  document.head.appendChild(style);

  /* ═══════════════════════════════════════════════════════════════
     PATCH 1  Close hoe picker / deco picker / More drawer
              on any outside tap — MOBILE ONLY
  ═══════════════════════════════════════════════════════════════ */
  document.addEventListener('touchend', function (e) {
    if (!isMobile()) return;
    var target = e.target;

    /* 1a. Hoe size/fert picker */
    var hoePicker = document.getElementById('hoe-picker');
    var dockHoe   = document.getElementById('dock-hoe');
    if (hoePicker && hoePicker.classList.contains('hp-open')) {
      if (!hoePicker.contains(target) &&
          !(dockHoe && dockHoe.contains(target))) {
        hoePicker.classList.remove('hp-open');
      }
    }

    /* 1b. Deco type picker */
    var decoPicker = document.getElementById('dock-deco-picker');
    var decoBtn    = document.getElementById('dock-sec-deco');
    if (decoPicker && decoPicker.classList.contains('picker-open')) {
      if (!decoPicker.contains(target) &&
          !(decoBtn && decoBtn.contains(target))) {
        decoPicker.classList.remove('picker-open');
        /* hide after css transition */
        setTimeout(function () {
          if (decoPicker && !decoPicker.classList.contains('picker-open'))
            decoPicker.style.display = 'none';
        }, 330);
      }
    }

    /* 1c. Seed picker */
    var seedPicker  = document.getElementById('dock-seed-picker');
    var seedBtn     = document.getElementById('dock-seed');
    if (seedPicker && seedPicker.classList.contains('picker-open')) {
      if (!seedPicker.contains(target) &&
          !(seedBtn && seedBtn.contains(target))) {
        seedPicker.classList.remove('picker-open');
        setTimeout(function () {
          if (seedPicker && !seedPicker.classList.contains('picker-open'))
            seedPicker.style.display = 'none';
        }, 330);
      }
    }

    /* 1d. More / secondary drawer — close when tapping outside the dock */
    var dock    = document.getElementById('mobile-dock');
    var dockSec = document.getElementById('dock-secondary');
    var moreBtn = document.getElementById('dock-more');
    if (dock && dockSec && dockSec.classList.contains('dock-sec-open')) {
      if (!dock.contains(target)) {
        dockSec.classList.remove('dock-sec-open');
        if (moreBtn) {
          moreBtn.classList.remove('active');
          var mi = document.getElementById('dock-more-icon');
          if (mi) mi.textContent = '⋯';
        }
      }
    }
  }, { passive: true });


  /* ═══════════════════════════════════════════════════════════════
     PATCH 2  Mobile: tapping "Fert" inside the hoe picker shows
              available fertilisers instead of closing the panel.
              Selecting one activates the fert tool with that type.
  ═══════════════════════════════════════════════════════════════ */

  /* Helper — build the fert content inside the already-open hoe picker */
  function _showMobileFertOptions() {
    var picker = document.getElementById('hoe-picker');
    if (!picker) return;

    /* If FERTILIZERS not loaded yet, fall back to old behaviour */
    if (typeof FERTILIZERS === 'undefined' || typeof G === 'undefined') {
      picker.classList.remove('hp-open');
      if (typeof setTool === 'function') setTool('fert');
      return;
    }

    /* Snapshot current HTML so "Back" can restore it */
    var _savedHTML = picker.innerHTML;

    function _restoreHoePicker() {
      picker.innerHTML = _savedHTML;
      /* Re-bind size buttons */
      picker.querySelectorAll('[data-hoe-size]').forEach(function (btn) {
        btn.addEventListener('click', function () {
          if (btn.classList.contains('locked')) {
            var upg = btn.dataset.hoeSize === '3' ? 'Iron Head' : 'Steel Head';
            if (typeof toast === 'function')
              toast('🔒 Requires ' + upg + '! Buy it in Upgrades.', 'warn', 2500);
            return;
          }
          if (typeof G !== 'undefined') G.hoeSize = parseInt(btn.dataset.hoeSize, 10);
          picker.querySelectorAll('[data-hoe-size]').forEach(function (b) {
            b.classList.remove('sel');
          });
          btn.classList.add('sel');
          if (typeof toast === 'function')
            toast('⚒ Hoe: ' + btn.dataset.hoeSize + '×' + btn.dataset.hoeSize + ' selected', 'info', 1200);
        });
      });
      /* Re-bind fert switch button */
      var fsw = document.getElementById('hp-fert-switch');
      if (fsw) fsw.addEventListener('click', function (e) {
        if (isMobile()) { e.stopImmediatePropagation(); _showMobileFertOptions(); }
      }, true);
    }

    /* Build fert entry list */
    var entries = Object.entries(FERTILIZERS);
    var hasAny  = entries.some(function (kv) {
      return (G.fertilizers && (G.fertilizers[kv[0]] || 0)) > 0;
    });

    var html = '<div id="hoe-picker-title">🌿 Choose Fertilizer</div><div class="hp-row">';
    entries.forEach(function (kv) {
      var id   = kv[0];
      var f    = kv[1];
      var have = (G.fertilizers && G.fertilizers[id]) || 0;
      var sel  = (G.selectedFert === id) ? ' sel' : '';
      var cls  = have === 0 ? ' locked' : sel;
      html +=
        '<button class="hp-btn' + cls + '" data-fert-pick="' + id + '">' +
          '<span style="font-size:26px;line-height:1">' + f.e + '</span>' +
          '<span class="hp-btn-label">' + f.n +
            '<br><span style="color:var(--gold);font-size:8px">×' + have + '</span>' +
          '</span>' +
        '</button>';
    });
    if (!hasAny) {
      html +=
        '<div style="padding:12px 6px;font-size:10px;color:var(--text-muted);text-align:center;">' +
        'No fertilizer!<br>Buy some in the Shop 🌿</div>';
    }
    html += '</div>';
    html +=
      '<button id="hp-back-to-size" style="' +
        'font-size:9px;font-weight:800;color:var(--text-soft);background:none;' +
        'border:none;cursor:pointer;padding:4px 10px;font-family:Nunito,sans-serif;' +
        'display:block;margin:2px auto 0;">← Back to Size</button>';

    picker.innerHTML = html;

    /* Bind fert selection buttons */
    picker.querySelectorAll('[data-fert-pick]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        if (btn.classList.contains('locked')) {
          if (typeof toast === 'function')
            toast('No ' + (FERTILIZERS[btn.dataset.fertPick] || {}).n + '! Buy some in the Shop.', 'warn', 2000);
          return;
        }
        var id = btn.dataset.fertPick;
        if (typeof G !== 'undefined') G.selectedFert = id;
        if (typeof setTool === 'function') setTool('fert');
        picker.classList.remove('hp-open');
        if (typeof toast === 'function')
          toast('🌿 ' + FERTILIZERS[id].n + ' selected!', 'info', 1200);
      });
    });

    /* Back button */
    var backBtn = document.getElementById('hp-back-to-size');
    if (backBtn) backBtn.addEventListener('click', _restoreHoePicker);
  }

  /* Intercept the fert-switch button click in the hoe picker
     using capture phase so it runs before greatestupdateever's handler */
  document.body.addEventListener('click', function (e) {
    if (!isMobile()) return;
    var btn = e.target.closest('#hp-fert-switch');
    if (!btn) return;
    e.stopImmediatePropagation();
    e.preventDefault();
    _showMobileFertOptions();
  }, true /* capture */);


  /* ═══════════════════════════════════════════════════════════════
     PATCH 3  Gate upgrade — "Hoe Upgrade" must be bought first.
              Iron Head (3×3) and Steel Head (4×4) are hidden until
              the gate is owned.
  ═══════════════════════════════════════════════════════════════ */

  function _patchHoeGateUpgrade() {
    if (typeof UPGRADES === 'undefined') {
      setTimeout(_patchHoeGateUpgrade, 200);
      return;
    }

    /* ── 3a. Add the gate upgrade ─────────────────────────────── */
    if (!UPGRADES.hoe_gate) {
      UPGRADES.hoe_gate = {
        n:    'Hoe Upgrade',
        e:    '⛏',
        desc: 'Upgrade your basic hoe — unlocks the Iron Head (3×3) and Steel Head (4×4) attachments!',
        cost: 500,
        max:  1,
      };
    }

    /* ── 3b. Rename the child upgrades ───────────────────────── */
    /* PatchV3 inside greatestupdateever already renamed:
       hoe_3x3 → "Hoe Upgrade", hoe_4x4 → "Iron Head"
       We rename them again to the final desired names. */
    function _applyRenames() {
      if (UPGRADES.hoe_3x3) {
        UPGRADES.hoe_3x3.n    = 'Iron Head';
        UPGRADES.hoe_3x3.desc = 'Forged iron attachment — tills a 3×3 patch per swing. Requires Hoe Upgrade.';
      }
      if (UPGRADES.hoe_4x4) {
        UPGRADES.hoe_4x4.n    = 'Steel Head';
        UPGRADES.hoe_4x4.desc = 'Hardened steel attachment — massive 4×4 tilling power. Requires Iron Head.';
      }
    }
    _applyRenames();
    /* Re-apply after a short delay in case PatchV3 runs after us */
    setTimeout(_applyRenames, 800);

    /* ── 3c. Gate: hide Iron Head & Steel Head until gate owned ─ */
    function _applyGating() {
      ['side-content', 'sheet-content'].forEach(function (sid) {
        var el = document.getElementById(sid);
        if (!el) return;
        var upgs = typeof curUpgs === 'function' ? curUpgs() : {};
        var hasGate = (upgs.hoe_gate || 0) >= 1;
        ['hoe_3x3', 'hoe_4x4'].forEach(function (uid) {
          var btn = el.querySelector('[data-upgrade="' + uid + '"]');
          if (!btn) return;
          var card = btn.closest('.upg-card');
          if (card) card.style.display = hasGate ? '' : 'none';
        });
      });
    }

    /* ── 3d. Hook renderSide to apply gating every time ──────── */
    function _hookRenderSide() {
      if (typeof window.renderSide !== 'function') {
        setTimeout(_hookRenderSide, 200);
        return;
      }
      var _prev = window.renderSide;
      window.renderSide = function () {
        _prev.apply(this, arguments);
        _applyGating();
      };
    }
    _hookRenderSide();

    /* ── 3e. Prerequisite guard in buyUpgrade ────────────────── */
    function _hookBuyUpgrade() {
      if (typeof window.buyUpgrade !== 'function') {
        setTimeout(_hookBuyUpgrade, 200);
        return;
      }
      var _prev = window.buyUpgrade;
      window.buyUpgrade = function (id) {
        var upgs = typeof curUpgs === 'function' ? curUpgs() : {};
        if (id === 'hoe_3x3' && !(upgs.hoe_gate >= 1)) {
          if (typeof toast === 'function')
            toast('🔒 Buy the Hoe Upgrade first!', 'warn', 2200);
          return;
        }
        if (id === 'hoe_4x4' && !(upgs.hoe_3x3 >= 1)) {
          if (typeof toast === 'function')
            toast('🔒 Buy the Iron Head first!', 'warn', 2200);
          return;
        }
        _prev.apply(this, arguments);
      };
    }
    _hookBuyUpgrade();

    console.log('[bugfix-patch] Hoe gate upgrade applied.');
  }
  _patchHoeGateUpgrade();


  /* ═══════════════════════════════════════════════════════════════
     PATCH 4  Large farming grid
              • Mobile — 72 px tiles (14 cols = 1008 px), touch-scroll
              • PC     — 70 px tiles (14 cols = 980 px), A/D key pan
  ═══════════════════════════════════════════════════════════════ */

  var TILE_MOBILE = 72;   /* px */
  var TILE_PC     = 70;   /* px */

  function _patchLargeGrid() {
    if (typeof window.renderFarm !== 'function') {
      setTimeout(_patchLargeGrid, 200);
      return;
    }

    var _prev = window.renderFarm;
    window.renderFarm = function () {
      _prev.apply(this, arguments);

      var grid = document.getElementById('farm-grid');
      if (!grid) return;
      var GW_v = typeof GW !== 'undefined' ? GW : 14;
      var GH_v = typeof GH !== 'undefined' ? GH : 10;
      var tSz  = isMobile() ? TILE_MOBILE : TILE_PC;

      /* Override whatever previous patches set */
      grid.style.gridTemplateColumns = 'repeat(' + GW_v + ',' + tSz + 'px)';
      grid.style.gridTemplateRows    = 'repeat(' + GH_v + ',' + tSz + 'px)';
      grid.style.width  = (tSz * GW_v) + 'px';
      grid.style.height = (tSz * GH_v) + 'px';
      grid.style.gap    = '2px';

      Array.from(grid.children).forEach(function (el) {
        el.style.width    = tSz + 'px';
        el.style.height   = tSz + 'px';
        el.style.padding  = '0';
        el.style.fontSize = Math.floor(tSz * 0.52) + 'px';
      });

      /* Ensure farm-wrap is scrollable */
      var fw = document.getElementById('farm-wrap');
      if (fw) {
        fw.style.overflow = 'auto';
        fw.style.webkitOverflowScrolling = 'touch';
      }

      /* Re-apply mobile ghost highlights if a pending preview exists */
      if (_mobileGhostR >= 0 && _mobileGhostC >= 0 && _pendingMobileTill) {
        _applyMobileGhost(_mobileGhostR, _mobileGhostC);
      }

      /* Re-inject pan hint on PC */
      _ensurePanHint();
    };

    console.log('[bugfix-patch] Large grid patch applied.');
  }
  _patchLargeGrid();

  /* ── A / D key panning (PC only) ──────────────────────────── */
  /*  We run in the capture phase so we intercept BEFORE
      the script.js handler that maps D → shovel.            */
  var _panLeft  = false;
  var _panRight = false;
  var _panRAF   = null;

  function _doScroll() {
    var fw = document.getElementById('farm-wrap');
    if (!fw) { _panRAF = null; return; }
    var delta = _panLeft ? -7 : _panRight ? 7 : 0;
    if (delta !== 0) {
      fw.scrollLeft = Math.max(0, fw.scrollLeft + delta);
      _panRAF = requestAnimationFrame(_doScroll);
    } else {
      _panRAF = null;
    }
  }

  /* Capture phase — fires before the bubble-phase handler in script.js */
  document.addEventListener('keydown', function (e) {
    if (isMobile()) return;
    if (document.activeElement && (
        document.activeElement.tagName === 'INPUT' ||
        document.activeElement.tagName === 'TEXTAREA' ||
        document.activeElement.tagName === 'SELECT')) return;
    if (!document.getElementById('game-screen').classList.contains('active')) return;

    if (e.code === 'KeyA') {
      _panLeft = true;
      e.stopPropagation(); /* prevent the bubble-phase handler */
      if (!_panRAF) _panRAF = requestAnimationFrame(_doScroll);
    }
    if (e.code === 'KeyD') {
      _panRight = true;
      e.stopPropagation();
      if (!_panRAF) _panRAF = requestAnimationFrame(_doScroll);
    }
  }, true /* capture */);

  document.addEventListener('keyup', function (e) {
    if (e.code === 'KeyA') _panLeft  = false;
    if (e.code === 'KeyD') _panRight = false;
  });

  /* ── Pan hint pill ─────────────────────────────────────────── */
  function _ensurePanHint() {
    if (isMobile()) return;
    if (document.getElementById('farm-pan-hint')) return;
    var fw = document.getElementById('farm-wrap');
    if (!fw) return;
    fw.style.position = 'relative';
    var hint = document.createElement('div');
    hint.id = 'farm-pan-hint';
    hint.textContent = '← A / D → to pan';
    fw.appendChild(hint);
  }
  setTimeout(_ensurePanHint, 800);


  /* ═══════════════════════════════════════════════════════════════
     PATCH 5  Hoe area ghost preview
     PC:     existing hover .hoe-preview already works; nothing to do.
     Mobile: First tap → highlight ghost tiles + hint.
             Second tap on same area → actually till.
             Tap elsewhere → move pending ghost.
  ═══════════════════════════════════════════════════════════════ */

  var _pendingMobileTill = false;
  var _mobileGhostR      = -1;
  var _mobileGhostC      = -1;

  /* ── Get hoe offsets (mirrors bigupdate_4 logic) ─────────────── */
  function _hoeOffsets(size) {
    if (size === 1) return [[0, 0]];
    if (size === 2) return [[0,0],[0,1],[1,0],[1,1]];
    var range = size === 4 ? [-1, 0, 1, 2] : [-1, 0, 1];
    var out = [];
    for (var i = 0; i < range.length; i++)
      for (var j = 0; j < range.length; j++)
        out.push([range[i], range[j]]);
    return out;
  }

  function _getHoeSize() {
    if (typeof window._getDesiredHoeSize === 'function')
      return window._getDesiredHoeSize();
    if (typeof G !== 'undefined' && G.hoeSize) return G.hoeSize;
    return 1;
  }

  /* ── Apply / remove ghost class on grid tiles ─────────────────── */
  function _applyMobileGhost(r, c) {
    _clearMobileGhost(false /* don't reset state vars */);
    var grid = document.getElementById('farm-grid');
    if (!grid) return;
    var GW_v = typeof GW !== 'undefined' ? GW : 14;
    var GH_v = typeof GH !== 'undefined' ? GH : 10;
    var size    = _getHoeSize();
    var offsets = _hoeOffsets(size);

    var firstTileEl = null;
    offsets.forEach(function (off) {
      var nr = r + off[0];
      var nc = c + off[1];
      if (nr < 0 || nr >= GH_v || nc < 0 || nc >= GW_v) return;
      var tileEl = grid.children[nr * GW_v + nc];
      if (!tileEl) return;
      tileEl.classList.add('hoe-ghost-mobile');
      if (!firstTileEl) firstTileEl = tileEl;
    });

    /* Position the hint label above the top-left affected tile */
    var hint = _getOrCreateHint();
    if (hint && firstTileEl) {
      var rect = firstTileEl.getBoundingClientRect();
      hint.textContent = '⛏ Tap again to till!';
      hint.style.left  = (rect.left + rect.width / 2) + 'px';
      hint.style.top   = Math.max(4, rect.top - 28) + 'px';
      hint.style.display = 'block';
    }
  }

  function _clearMobileGhost(resetState) {
    document.querySelectorAll('.hoe-ghost-mobile').forEach(function (el) {
      el.classList.remove('hoe-ghost-mobile');
    });
    var hint = document.getElementById('hoe-mobile-hint');
    if (hint) hint.style.display = 'none';
    if (resetState !== false) {
      _pendingMobileTill = false;
      _mobileGhostR = -1;
      _mobileGhostC = -1;
    }
  }

  function _getOrCreateHint() {
    var h = document.getElementById('hoe-mobile-hint');
    if (!h) {
      h = document.createElement('div');
      h.id = 'hoe-mobile-hint';
      document.body.appendChild(h);
    }
    return h;
  }

  /* ── Hook clickTile for mobile two-tap confirm ─────────────────── */
  function _hookClickTileForGhost() {
    if (typeof window.clickTile !== 'function') {
      setTimeout(_hookClickTileForGhost, 300);
      return;
    }
    var _prev = window.clickTile;

    window.clickTile = function (r, c) {
      /* Only intercept on mobile when Hoe is active */
      if (!isMobile() || typeof G === 'undefined' || G.tool !== 'hoe') {
        return _prev.apply(this, arguments);
      }

      /* If a pending ghost exists AND the new tap is within the same
         affected area, confirm-till it.  Otherwise start new ghost.  */
      if (_pendingMobileTill) {
        var size    = _getHoeSize();
        var offsets = _hoeOffsets(size);
        var GW_v    = typeof GW !== 'undefined' ? GW : 14;
        var GH_v    = typeof GH !== 'undefined' ? GH : 10;

        /* Check if (r,c) falls inside the current ghost area */
        var inArea = offsets.some(function (off) {
          var nr = _mobileGhostR + off[0];
          var nc = _mobileGhostC + off[1];
          return nr === r && nc === c;
        });

        if (inArea) {
          /* Second tap inside same area → confirm and till */
          _clearMobileGhost(true);
          _prev.apply(this, [_mobileGhostR, _mobileGhostC]);
          return;
        }
        /* Tapped outside current area — move ghost to new position */
        _clearMobileGhost(false);
      }

      /* Show new ghost at (r, c) */
      _mobileGhostR = r;
      _mobileGhostC = c;
      _pendingMobileTill = true;
      _applyMobileGhost(r, c);
    };

    console.log('[bugfix-patch] clickTile hooked for mobile hoe ghost.');
  }
  _hookClickTileForGhost();

  /* ── Clear ghost when tool changes ──────────────────────────────── */
  function _hookSetToolClearGhost() {
    if (typeof window.setTool !== 'function') {
      setTimeout(_hookSetToolClearGhost, 300);
      return;
    }
    var _prev = window.setTool;
    window.setTool = function (t) {
      if (t !== 'hoe') _clearMobileGhost(true);
      _prev.apply(this, arguments);
    };
  }
  _hookSetToolClearGhost();

  /* ── Re-apply ghost after any renderFarm call ────────────────────
     (tiles are replaced during re-render, so classes are lost)
     We hook renderFarm one more time — this runs after the
     large-grid patch above so state vars are already in place.   */
  function _hookRenderFarmGhost() {
    if (typeof window.renderFarm !== 'function') {
      setTimeout(_hookRenderFarmGhost, 350);
      return;
    }
    var _prev = window.renderFarm;
    window.renderFarm = function () {
      _prev.apply(this, arguments);
      if (_pendingMobileTill && _mobileGhostR >= 0) {
        _applyMobileGhost(_mobileGhostR, _mobileGhostC);
      }
    };
  }
  _hookRenderFarmGhost();

  console.log('[bugfix-patch] All patches installed ✓');

})();
