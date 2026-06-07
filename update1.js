/* ════════════════════════════════════════════════════
   update.js — merged patch bundle
   generated : 2026-06-07
   patches   : 2
   sources   : update1.js, patch_v1.1.8.js
   ════════════════════════════════════════════════════ */


/* ────────────────────── update1.js ────────────────────── */
/* ════════════════════════════════════════════════════
   update1.js — merged patch bundle
   generated : 2026-06-07
   patches   : 4
   sources   : patcher.js, fall_town.js, winter.js, winterpatch.js
   ════════════════════════════════════════════════════ */


/* ────────────────────── patcher.js ────────────────────── */
(async () => {
  // Add any patch filenames here — all will be fetched and applied in order
  const PATCH_FILES = [
    'patch.json', 'falltownpatch.json'
  ];

  const ts = Date.now();

  async function tryFetch(file) {
    try {
      const res = await fetch(`${file}?v=${ts}`);
      if (!res.ok) return null;
      return await res.json();
    } catch {
      return null;
    }
  }

  const patches = (await Promise.all(PATCH_FILES.map(tryFetch))).filter(Boolean);
  if (!patches.length) return; // No patch files found = do nothing

  for (const patch of patches) {

    const { version, css, html, js } = patch;
    console.log(`[Patcher] Applying patch v${version}`);

    // 1. Inject CSS overrides
    if (css) {
      const style = document.createElement('style');
      style.textContent = css;
      document.head.appendChild(style);
    }

    // 2. Apply HTML patches (insert / replace / remove elements)
    if (html) {
      html.forEach(({ action, selector, content, position = 'afterend' }) => {
        const el = document.querySelector(selector);
        if (!el) return console.warn('[Patcher] Not found:', selector);
        if (action === 'replace') el.outerHTML = content;
        else if (action === 'innerHTML') el.innerHTML = content;
        else if (action === 'insert') el.insertAdjacentHTML(position, content);
        else if (action === 'remove') el.remove();
        else if (action === 'attr') {
          const [attr, val] = content.split('=');
          el.setAttribute(attr.trim(), val.trim());
        }
      });
    }

    // 3. Inject or override JS (runs after script.js is loaded)
    if (js) {
      const script = document.createElement('script');
      script.textContent = js;
      document.body.appendChild(script);
    }
  }

})();


/* ────────────────────── fall_town.js ────────────────────── */
/* ═══════════════════════════════════════════════════════════════════════
   🍂  THE FALL TOWN UPDATE  —  Valley Farm v2.0.0
   ═══════════════════════════════════════════════════════════════════════
   Self-contained patch. Add to index.html AFTER script.js:
     <script src="fall_town.js" defer></script>

   What's new:
     • Explorable Harvest Town with 9 distinct areas
     • 6 unique NPCs with schedules, dialogue & friendship system
     • Quest Board (daily + weekly quests with gold & friendship rewards)
     • Cooking System (8 recipes, energy restore, farming buffs)
     • Artisan Preservation (8 preserved goods, 2–3× sell value)
     • Museum Donations (18 unique items, milestone rewards & lore unlocks)
     • Harvest Festival + Night Market (Fall seasonal events)
     • World Lore (4 atmospheric story fragments)
     • Falling leaf particles + cozy Fall glow (season-aware)
     • Buff indicators in HUD
   ═══════════════════════════════════════════════════════════════════════ */
(function FallTownUpdate() {
  'use strict';

  /* ── Wait for the game engine to be ready ── */
  /* NOTE: G is always defined (let G = {} in script.js), so we must also
     check G.si is a valid number — that only becomes true after initState()
     or loadState() runs on login. Without this, boot() fires immediately at
     page load with G = {} (season() returns undefined, openTownScreen not
     yet assigned), causing the three init bugs fixed in falltownpatch.json. */
  function whenReady(fn) {
    if (typeof G !== 'undefined' && typeof G.si === 'number' &&
        typeof toast === 'function' &&
        typeof snd === 'function' && typeof season === 'function') {
      fn();
    } else {
      setTimeout(() => whenReady(fn), 200);
    }
  }
  whenReady(boot);

  /* ══════════════════════════════════════════════════════════
     DATA — NPCS
  ══════════════════════════════════════════════════════════ */
  const TOWN_NPCS = {
    marina: {
      name: 'Marina', icon: '👩‍🍳', job: 'Baker',
      trait: 'Warm, chatty, and perpetually flour-dusted.',
      location: '☕ Cozy Café',
      gifts: ['strawberry', 'blueberry', 'melon'],
      dialogue: {
        base: [
          'Morning! Fresh honey rolls just out of the oven. 🍞',
          'You know what pairs with a rainy day? My pumpkin scones. 🎃',
          'I\'ve been testing a new jam recipe — your berries would be perfect.',
          'The smell of bread baking always makes me feel safe.',
          'I opened the café windows today. The whole square smells like cinnamon now.',
        ],
        fall: [
          'Fall is my favourite baking season. Everything tastes warmer. 🍂',
          'I need pumpkins for the Harvest Festival pie contest. Can you help me?',
          'The leaves are golden as my pastries this time of year. Almost.',
          'I\'m making cranberry scones for the Night Market. Recipe\'s a secret. 🤫',
        ],
        friend: [
          'I saved a special recipe just for you. Take it — you\'ve earned it. 🎁',
          'You\'re my favourite customer. Don\'t tell Petra I said that.',
          'Come by anytime. There\'s always something warm on the counter for you.',
        ],
      },
    },
    eli: {
      name: 'Eli', icon: '🧑‍🔧', job: 'Blacksmith',
      trait: 'Gruff but fair. Heart of gold beneath the soot.',
      location: '⚒️ Blacksmith',
      gifts: ['potato', 'corn', 'yam'],
      dialogue: {
        base: [
          'Hmph. Good tools don\'t sharpen themselves, you know.',
          'Good steel takes patience. So does good farming.',
          'I respect anyone who works with their hands.',
          'Don\'t bother me when I\'m at the forge. Come back in an hour.',
          'The fire needs tending before conversation. Give me a moment.',
        ],
        fall: [
          'I\'m forging lanterns for the festival. Finest metalwork in the valley.',
          'The chill in the air is good for tempering. Fall is my season.',
          'I fixed three ploughs this week. Harvest time is busy for everyone.',
        ],
        friend: [
          '…I made something for you. Don\'t read too much into it.',
          'I don\'t say this often. You\'re alright, farmer.',
          'I\'ll keep your tools sharp. You keep farming well. Deal.',
        ],
      },
    },
    nora: {
      name: 'Nora', icon: '🧓', job: 'Museum Curator',
      trait: 'Scholarly, dreamy, obsessed with the valley\'s hidden past.',
      location: '🏛️ Museum',
      gifts: ['mushroom', 'cranberry', 'garlic'],
      dialogue: {
        base: [
          'Every artefact tells a story. Even your vegetables!',
          'There was once a great mine in this valley. Long forgotten now…',
          'I found old journals in the cellar last week. Fascinating reading.',
          'Please — bring me anything curious you find. Even odd-shaped crops.',
          'The history of this valley goes back further than anyone realises.',
        ],
        fall: [
          'The harvest was sacred to the original settlers here. Did you know?',
          'Old records mention a lantern festival. Perhaps we can revive it.',
          'I found a journal entry about the autumn fog. It was called "the valley\'s breath."',
        ],
        friend: [
          'You\'ve helped build something real here. The museum lives because of you.',
          'I always save the most interesting finds to show you first.',
          'Come see the new display. I named one exhibit after you — quietly.',
        ],
      },
    },
    theo: {
      name: 'Theo', icon: '🎵', job: 'Wandering Musician',
      trait: 'Carefree, ageless, and impossible to predict.',
      location: '🌳 Town Square',
      gifts: ['tulip', 'strawberry', 'melon'],
      dialogue: {
        base: [
          'Every town has a song. I\'m still learning yours.',
          'The wind through the wheat — that\'s real music. 🌾',
          'I was in three different towns last week. This one has something special.',
          'The seasons change the melody of this valley. Have you noticed?',
          'I\'ll be here until the wind calls me elsewhere. Could be tomorrow. Could be years.',
        ],
        fall: [
          'In fall, everything gets quieter and deeper. Even the music.',
          'I\'m composing something for the Night Market. Come hear it. 🎶',
          'There\'s an old harvest song the villagers used to sing. I\'ve been trying to remember the words…',
          'The leaves remind me of notes falling. Strange thought, maybe.',
        ],
        friend: [
          'I wrote a song about your farm. Want to hear a few bars? 🎶',
          'You\'re one of the few people I always want to return to. That matters.',
          'I\'ll play at your farm someday. When the light is right.',
        ],
      },
    },
    petra: {
      name: 'Petra', icon: '🧑‍🌾', job: 'Rival Farmer',
      trait: 'Fiercely competitive, secretly rooting for you.',
      location: '🏪 General Store',
      gifts: ['pumpkin', 'sunflower', 'corn'],
      dialogue: {
        base: [
          'My turnips are bigger than yours. Just stating facts.',
          'Don\'t get comfortable — I\'m catching up fast.',
          'I upgraded my irrigation last week. How\'s your farm looking?',
          'Fair warning: I\'m entering the Harvest Festival contest too. 🏆',
          'I admire your work ethic. Doesn\'t mean I\'ll go easy on you.',
        ],
        fall: [
          'My pumpkins this year? Enormous. Absolutely enormous.',
          'May the best farmer win at the Harvest Festival. That\'d be me.',
          'I\'ve been drying herbs all week. The whole barn smells amazing.',
        ],
        friend: [
          'Okay, fine — your crops are impressive. Don\'t let it go to your head.',
          'I\'d rather compete against you than anyone else in the valley. You raise the bar.',
          'Friends who farm together, grow together. I think I read that on a seed packet.',
        ],
      },
    },
    sam: {
      name: 'Sam', icon: '🧑‍🎣', job: 'Fisherman',
      trait: 'Patient, philosophical, and full of tall tales.',
      location: '🐟 Fish Shop',
      gifts: ['mushroom', 'carrot', 'cranberry'],
      dialogue: {
        base: [
          'The river knows things. You just have to listen long enough.',
          'I\'ve been fishing this river for forty years. She still surprises me.',
          'A man who can wait can catch anything. Or grow anything, I suppose.',
          'Strange fog this morning. The fish go deep on days like this.',
          'The best things in life require patience. Crops, fish, and people.',
        ],
        fall: [
          'The salmon run in fall. Makes the whole river smell alive. 🐟',
          'I once caught a fish so big it capsized my boat. True story. Mostly.',
          'Fall fishing is the finest kind. Crisp air, coloured leaves, big fish.',
          'The river turns copper in autumn. I never get tired of it.',
        ],
        friend: [
          'Here — take my lucky lure. It\'s brought me forty years of good catches.',
          'I don\'t share my favourite spots with just anyone. Come find me before dawn.',
          'You remind me of myself when I was young. Except you\'re better at farming.',
        ],
      },
    },
  };

  /* ══════════════════════════════════════════════════════════
     DATA — QUEST POOL
  ══════════════════════════════════════════════════════════ */
  const QUEST_POOL = [
    // — Daily quests —
    { id:'q_parsnip_5',  npc:'marina', title:'Pie Filling Needed',     icon:'🥧', type:'daily',
      desc:'Marina needs 5 parsnips for her famous root-vegetable pie.',
      req:{ parsnip:5  }, reward:{ gold:120, friendship:{ marina:1 } } },
    { id:'q_corn_3',     npc:'petra',  title:'Corn Delivery',           icon:'🌽', type:'daily',
      desc:'Petra wants 3 corn cobs to test a new drying recipe.',
      req:{ corn:3    }, reward:{ gold:180, friendship:{ petra:1  } } },
    { id:'q_mushroom_4', npc:'nora',   title:'Museum Specimen',         icon:'🍄', type:'daily',
      desc:'Nora wants 4 mushrooms for a new natural history exhibit.',
      req:{ mushroom:4 }, reward:{ gold:150, friendship:{ nora:1   } } },
    { id:'q_carrot_6',   npc:'sam',    title:'Fish Bait Carrots',       icon:'🥕', type:'daily',
      desc:"Sam swears river trout love the smell of carrot. He needs 6.",
      req:{ carrot:6  }, reward:{ gold:140, friendship:{ sam:1    } } },
    { id:'q_blueberry_5',npc:'marina', title:'Blueberry Jam Batch',     icon:'🫐', type:'daily',
      desc:'Marina is making jam this afternoon. She needs 5 blueberries.',
      req:{ blueberry:5 }, reward:{ gold:200, friendship:{ marina:1 } } },
    { id:'q_potato_4',   npc:'eli',    title:'Forge Fuel Stew',         icon:'🥔', type:'daily',
      desc:"Eli claims potato stew keeps him going all day at the forge. 4 please.",
      req:{ potato:4  }, reward:{ gold:160, friendship:{ eli:1    } } },
    { id:'q_garlic_5',   npc:'nora',   title:'Herb Archive',            icon:'🧄', type:'daily',
      desc:'Nora is documenting old cultivar varieties. She needs 5 garlic.',
      req:{ garlic:5  }, reward:{ gold:170, friendship:{ nora:1   } } },
    { id:'q_eggplant_3', npc:'sam',    title:'Fishing Trip Snacks',     icon:'🍆', type:'daily',
      desc:"Sam's going on a long trip. 3 eggplants for the road.",
      req:{ eggplant:3 }, reward:{ gold:190, friendship:{ sam:1    } } },
    { id:'q_tulip_4',    npc:'theo',   title:'Stage Decoration',        icon:'🌷', type:'daily',
      desc:'Theo wants tulips to decorate his performance corner in the square.',
      req:{ tulip:4   }, reward:{ gold:130, friendship:{ theo:1   } } },
    { id:'q_strawberry_5',npc:'theo',  title:'Sweet Treat',             icon:'🍓', type:'daily',
      desc:'Theo found a street vendor who loves strawberries. 5 please!',
      req:{ strawberry:5 }, reward:{ gold:250, friendship:{ theo:1  } } },
    { id:'q_yam_3',      npc:'marina', title:'Candied Yam Order',       icon:'🍠', type:'daily',
      desc:'A café customer placed a special order. Marina needs 3 yams.',
      req:{ yam:3     }, reward:{ gold:165, friendship:{ marina:1 } } },
    // — Weekly quests (bigger rewards) —
    { id:'q_pumpkin_2',  npc:'marina', title:'Festival Pumpkins',       icon:'🎃', type:'weekly', seasons:['Fall'],
      desc:'Marina needs 2 pumpkins for the Harvest Festival pie contest.',
      req:{ pumpkin:2 }, reward:{ gold:280, friendship:{ marina:2 } } },
    { id:'q_sunflower_3',npc:'petra',  title:'Sunflower Oil Press',     icon:'🌻', type:'weekly',
      desc:'Petra is pressing sunflower oil for competition. 3 sunflowers.',
      req:{ sunflower:3 }, reward:{ gold:240, friendship:{ petra:2  } } },
    { id:'q_cranberry_3',npc:'sam',    title:'River Offering',          icon:'🍒', type:'weekly', seasons:['Fall'],
      desc:"Sam leaves cranberries by the river for luck. Won't say more.",
      req:{ cranberry:3 }, reward:{ gold:320, friendship:{ sam:2    } } },
    { id:'q_yam_4',      npc:'eli',    title:"Smith's Dinner",          icon:'🍠', type:'weekly',
      desc:"Eli is hosting a rare dinner for old friends. He needs 4 yams.",
      req:{ yam:4     }, reward:{ gold:220, friendship:{ eli:2    } } },
    { id:'q_pepper_4',   npc:'marina', title:'Autumn Chilli',           icon:'🌶️', type:'weekly', seasons:['Fall'],
      desc:"Marina is making a spicy autumn chilli for the Night Market. 4 peppers!",
      req:{ pepper:4  }, reward:{ gold:250, friendship:{ marina:2 } } },
    { id:'q_melon_2',    npc:'theo',   title:'Stage Refreshments',      icon:'🍈', type:'weekly',
      desc:"Theo wants to offer melon to the crowd. It's a showbiz thing.",
      req:{ melon:2   }, reward:{ gold:260, friendship:{ theo:2   } } },
  ];

  /* ══════════════════════════════════════════════════════════
     DATA — COOKING RECIPES
  ══════════════════════════════════════════════════════════ */
  const RECIPES = {
    pumpkin_soup:    { name:'Pumpkin Soup',       icon:'🎃', energy:30, buff:'growth',  buffDesc:'+20% faster crop growth today',         ingredients:{ pumpkin:1              }, sellValue:200 },
    mushroom_stew:   { name:'Mushroom Stew',       icon:'🍄', energy:25, buff:'harvest', buffDesc:'+20% chance of double harvest today',    ingredients:{ mushroom:2             }, sellValue:160 },
    berry_jam_toast: { name:'Berry Jam Toast',     icon:'🍓', energy:20, buff:'luck',    buffDesc:'+15% chance of bonus crop yield',        ingredients:{ strawberry:2,blueberry:1}, sellValue:220 },
    harvest_pie:     { name:'Harvest Pie',         icon:'🥧', energy:45, buff:'stamina', buffDesc:'+40 max energy for the day',             ingredients:{ pumpkin:1,corn:1,carrot:1}, sellValue:450 },
    corn_chowder:    { name:'Corn Chowder',        icon:'🌽', energy:30, buff:'growth',  buffDesc:'+15% faster crop growth today',          ingredients:{ corn:2,potato:1        }, sellValue:280 },
    garlic_broth:    { name:'Garlic Herb Broth',   icon:'🧄', energy:18, buff:null,      buffDesc:'Restores 18 energy, nothing more.',      ingredients:{ garlic:2               }, sellValue:120 },
    cranberry_tea:   { name:'Cranberry Tea',       icon:'🍒', energy:35, buff:'luck',    buffDesc:'+25% chance of bonus crop yield today',  ingredients:{ cranberry:2            }, sellValue:350 },
    stuffed_pepper:  { name:'Stuffed Pepper',      icon:'🌶️', energy:28, buff:'stamina', buffDesc:'+25 max energy for the day',            ingredients:{ pepper:1,tomato:1      }, sellValue:300 },
  };

  /* ══════════════════════════════════════════════════════════
     DATA — PRESERVATION RECIPES
  ══════════════════════════════════════════════════════════ */
  const PRESERVED = {
    pickled_carrot:   { name:'Pickled Carrots',         icon:'🥕', base:'carrot',    baseNeeded:3, sellMult:2.2, desc:'Sharp and tangy. Sells above the fresh price.' },
    berry_jam:        { name:'Berry Jam',               icon:'🍓', base:'strawberry', baseNeeded:4, sellMult:2.5, desc:'Sweet, spreadable, premium artisan value.' },
    pumpkin_butter:   { name:'Pumpkin Butter',          icon:'🎃', base:'pumpkin',   baseNeeded:2, sellMult:2.8, desc:'A fall delicacy. Very loved at market.' },
    dried_mushrooms:  { name:'Dried Mushrooms',         icon:'🍄', base:'mushroom',  baseNeeded:5, sellMult:2.0, desc:'Concentrated flavour. Sought-after ingredient.' },
    blueberry_jam:    { name:'Blueberry Jam',           icon:'🫐', base:'blueberry', baseNeeded:5, sellMult:2.4, desc:'Deep and sweet. A market favourite.' },
    cranberry_sauce:  { name:'Cranberry Sauce',         icon:'🍒', base:'cranberry', baseNeeded:4, sellMult:3.0, desc:'Tart and jewel-bright. Festival staple.' },
    garlic_vinegar:   { name:'Garlic Vinegar',          icon:'🧄', base:'garlic',    baseNeeded:4, sellMult:1.8, desc:"Sharp and aromatic. A chef's secret weapon." },
    candied_yam:      { name:'Candied Yam Preserve',    icon:'🍠', base:'yam',       baseNeeded:3, sellMult:2.3, desc:'Sweet and golden. Sells well in all seasons.' },
  };

  /* ══════════════════════════════════════════════════════════
     DATA — MUSEUM
  ══════════════════════════════════════════════════════════ */
  const MUSEUM_CATS = {
    crops:      { label:'Rare Crops',       icon:'🌾', items:['cauliflower','melon','strawberry','blueberry','cranberry','pumpkin','corn','sunflower'] },
    fungi:      { label:'Fungi & Herbs',    icon:'🍄', items:['mushroom','garlic','tulip'] },
    roots:      { label:'Root Vegetables',  icon:'🥕', items:['parsnip','carrot','potato','yam','eggplant'] },
    nightshades:{ label:'Nightshades',      icon:'🌶️', items:['tomato','pepper'] },
  };
  const ALL_MUSEUM_ITEMS = Object.values(MUSEUM_CATS).flatMap(c => c.items);

  const MUSEUM_MILESTONES = [
    { at:3,  gold:200,  text:'Recipe unlocked: Mushroom Stew 🍄',       lore:null },
    { at:6,  gold:400,  text:'Recipe unlocked: Harvest Pie 🥧',          lore:null },
    { at:10, gold:600,  text:'Lore discovered: The Lost Mineshaft ⛏️',    lore:'mineshaft' },
    { at:14, gold:900,  text:'Lore discovered: The River\'s Gift 🌊',     lore:'river_legend' },
    { at:18, gold:2000, text:'🏆 Museum Complete! Legendary Farmer!',     lore:'theo_mystery' },
  ];

  /* ══════════════════════════════════════════════════════════
     DATA — FESTIVALS
  ══════════════════════════════════════════════════════════ */
  const FESTIVALS = {
    harvest: {
      name:'🍂 Harvest Festival', season:'Fall', startDay:14, endDay:16,
      desc:'The whole town gathers to celebrate the harvest. Pie contests, lanterns, and warm cider.',
      activities:[
        { id:'pie_contest',   label:'🥧 Enter Pie Contest',     desc:'Bake a pumpkin pie and compete for the blue ribbon!',  cost:{ pumpkin:2 },           goldCost:0,   reward:600,  friendBonus:{} },
        { id:'lantern_walk',  label:'🏮 Join Lantern Walk',      desc:'Walk through town with glowing lanterns. Everyone loves it.', cost:{},               goldCost:0,   reward:0,    friendBonus:{ marina:2,eli:1,nora:1,theo:2,petra:1,sam:2 } },
        { id:'cider_stall',   label:'🍎 Help at Cider Stall',   desc:'Help press apple cider for the crowd. Earn your share.',  cost:{ corn:3 },            goldCost:0,   reward:300,  friendBonus:{ marina:1 } },
      ],
    },
    night_market: {
      name:'🌕 Night Market', season:'Fall', startDay:24, endDay:26,
      desc:'The last market before winter. Lanterns float, Theo plays, and rare goods change hands.',
      activities:[
        { id:'theo_concert',  label:'🎵 Listen to Theo\'s Concert', desc:'Theo performs under the moon. A moment you won\'t forget.', cost:{},             goldCost:0,   reward:80,   friendBonus:{ theo:3 } },
        { id:'rare_seeds',    label:'🌱 Buy Rare Seeds Bundle',     desc:'A traveling merchant sells a mysterious mix of seeds.',   cost:{},                goldCost:500, reward:0,    friendBonus:{} },
        { id:'help_petra',    label:'🌽 Help Petra\'s Stand',       desc:"Petra runs a corn stand. Helping her earns goodwill.",     cost:{ corn:5 },        goldCost:0,   reward:350,  friendBonus:{ petra:3 } },
      ],
    },
  };

  /* ══════════════════════════════════════════════════════════
     DATA — WORLD LORE
  ══════════════════════════════════════════════════════════ */
  const LORE = [
    { id:'festival_origin', icon:'🏮', title:'Origin of the Lantern Festival',
      text:'The Lantern Festival began as a way to guide lost harvest spirits home. Farmers lit a path from field to town — one lantern per crop harvested that year. The oldest lanterns in the museum cellar still bear faint scorch marks.',
      unlockDefault: true },
    { id:'theo_mystery',    icon:'🎵', title:'The Musician Who Never Ages',
      text:"Old-timers claim a musician matching Theo's description visited this valley fifty years ago. He plays the same songs. He looks exactly the same in photographs from 1974 that Nora found behind the museum staircase. Theo just smiles when asked.",
      unlockDefault: false },
    { id:'mineshaft',       icon:'⛏️', title:'The Lost Mineshaft',
      text:"Old records speak of a silver mine east of town, sealed after a collapse in 1887. Seventeen miners went in. Seventeen came out — but one of them refused to speak again for seven years. The shaft entrance is rumoured to be somewhere beneath the Hill Farm.",
      unlockDefault: false },
    { id:'river_legend',    icon:'🌊', title:'The River\'s Gift',
      text:"Sam's grandfather claimed the river ran gold-tinted in autumn, carrying mineral silt from an upstream source no surveyor has ever found. The local name for that reach of the river is still 'The Giving Stretch.' Sam knows where it is. He hasn't told anyone.",
      unlockDefault: false },
  ];

  /* ══════════════════════════════════════════════════════════
     STATE INITIALISATION
  ══════════════════════════════════════════════════════════ */
  function initTownState() {
    if (!G.town) G.town = {};
    const T = G.town;
    if (!T.friendship)      T.friendship      = {};
    if (!T.lastTalked)      T.lastTalked      = {};
    if (!T.questBoard)      T.questBoard      = [];
    if (!T.completedToday)  T.completedToday  = [];
    if (!T.activeBuffs)     T.activeBuffs     = {};
    if (!T.museumDonated)   T.museumDonated   = [];
    if (!T.museumMilestones)T.museumMilestones= [];
    if (!T.festivalsDone)   T.festivalsDone   = [];
    if (!T.loreDiscovered)  T.loreDiscovered  = ['festival_origin'];
    if (!T.preservedInv)    T.preservedInv    = {};
    if (!T.lastQuestDay)    T.lastQuestDay    = -1;
    // Ensure all NPCs have an entry
    Object.keys(TOWN_NPCS).forEach(k => { if (T.friendship[k] == null) T.friendship[k] = 0; });
    refreshQuestBoard(false);
  }

  /* ══════════════════════════════════════════════════════════
     CSS INJECTION
  ══════════════════════════════════════════════════════════ */
  function injectCSS() {
    if (document.getElementById('fall-town-css')) return;
    const s = document.createElement('style');
    s.id = 'fall-town-css';
    s.textContent = `
/* ─── TOWN SCREEN ─── */
#town-screen{display:none;position:fixed;inset:0;z-index:490;background:var(--bg);flex-direction:column;overflow:hidden}
#town-screen.town-open{display:flex;animation:fdIn .22s ease}
.town-header{background:var(--ui-bg);border-bottom:1.5px solid var(--ui-border);padding:10px 16px;display:flex;align-items:center;gap:10px;flex-shrink:0;box-shadow:0 2px 8px rgba(0,0,0,.06)}
.town-back-btn{background:var(--ui-bg2);border:1.5px solid var(--ui-border);color:var(--text-primary);font-family:'Nunito',sans-serif;font-size:13px;font-weight:700;cursor:pointer;border-radius:8px;padding:7px 14px;transition:all .15s;flex-shrink:0}
.town-back-btn:hover{background:var(--ui-border)}
.town-header-title{font-family:'Baloo 2',cursive;font-size:18px;font-weight:800;color:var(--text-primary);flex:1;text-align:center}
.town-season-tag{font-size:11px;font-weight:700;padding:3px 9px;border-radius:99px;border:1.5px solid;flex-shrink:0}
/* tabs */
.town-tabs{display:flex;gap:0;border-bottom:1.5px solid var(--ui-border);background:var(--ui-bg);overflow-x:auto;flex-shrink:0;scrollbar-width:none}
.town-tabs::-webkit-scrollbar{display:none}
.town-tab-btn{padding:9px 14px;background:none;border:none;border-bottom:2.5px solid transparent;color:var(--text-muted);font-family:'Nunito',sans-serif;font-size:12px;font-weight:700;cursor:pointer;white-space:nowrap;transition:all .15s}
.town-tab-btn.active{color:var(--text-primary);border-bottom-color:#c2410c}
.town-tab-btn:hover:not(.active){color:var(--text-primary)}
/* body */
.town-body{flex:1;overflow-y:auto;padding:14px 14px 80px}
.town-body::-webkit-scrollbar{width:4px}
.town-body::-webkit-scrollbar-thumb{background:var(--ui-border);border-radius:4px}
/* overview */
.town-map-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px;margin-bottom:14px}
.town-area-card{background:var(--ui-bg);border:2px solid var(--ui-border);border-radius:14px;padding:14px 10px;text-align:center;cursor:pointer;transition:all .18s;position:relative}
.town-area-card:hover{border-color:#c2410c;transform:translateY(-2px);box-shadow:0 4px 14px rgba(194,65,12,.15)}
.town-area-card:active{transform:scale(.97)}
.town-area-em{font-size:26px;display:block;margin-bottom:4px}
.town-area-name{font-size:10px;font-weight:800;color:var(--text-primary)}
.town-area-sub{font-size:9px;color:var(--text-muted);margin-top:1px}
.town-area-badge{position:absolute;top:6px;right:6px;background:#c2410c;color:#fff;border-radius:99px;font-size:9px;font-weight:800;padding:1px 5px}
.town-welcome{background:linear-gradient(135deg,#fff7f0,#fef3c7);border:1.5px solid #f97316;border-radius:14px;padding:14px 16px;margin-bottom:14px;display:flex;align-items:center;gap:10px}
body.dark .town-welcome{background:linear-gradient(135deg,#1a0800,#1a1000);border-color:#ea580c}
.town-welcome-text{font-size:12px;color:var(--text-primary);line-height:1.5;flex:1}
.town-welcome-em{font-size:28px;flex-shrink:0}
/* stat row */
.town-stat-row{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;margin-bottom:14px}
.town-stat{background:var(--ui-bg);border:1.5px solid var(--ui-border);border-radius:12px;padding:10px;text-align:center}
.town-stat-val{font-size:20px;font-weight:800;color:#c2410c}
.town-stat-lab{font-size:9px;color:var(--text-muted);font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-top:2px}
/* npc cards */
.npc-list{display:flex;flex-direction:column;gap:10px}
.npc-card{background:var(--ui-bg);border:1.5px solid var(--ui-border);border-radius:14px;padding:13px 14px;transition:border-color .15s}
.npc-card:hover{border-color:#c2410c}
.npc-top{display:flex;align-items:center;gap:12px;margin-bottom:8px}
.npc-em{font-size:32px;flex-shrink:0}
.npc-name{font-size:14px;font-weight:800;color:var(--text-primary)}
.npc-job{font-size:11px;color:var(--text-muted)}
.npc-loc{font-size:10px;color:var(--text-muted);margin-top:1px}
.npc-trait{font-size:10px;color:var(--text-muted);font-style:italic;margin-bottom:6px}
.friend-bar-wrap{display:flex;align-items:center;gap:6px;margin-bottom:8px}
.friend-bar{flex:1;height:5px;background:var(--ui-border);border-radius:99px;overflow:hidden}
.friend-fill{height:100%;background:linear-gradient(90deg,#f97316,#c2410c);border-radius:99px;transition:width .4s}
.friend-label{font-size:10px;font-weight:700;color:var(--text-muted);white-space:nowrap}
.npc-dialogue{background:var(--ui-bg2);border:1px solid var(--ui-border);border-radius:10px;padding:9px 12px;font-size:12px;color:var(--text-primary);font-style:italic;line-height:1.5;margin-bottom:8px}
.npc-actions{display:flex;gap:6px;flex-wrap:wrap}
.npc-btn{padding:6px 12px;border-radius:8px;border:1.5px solid var(--ui-border);background:var(--ui-bg2);color:var(--text-primary);font-family:'Nunito',sans-serif;font-size:11px;font-weight:700;cursor:pointer;transition:all .14s}
.npc-btn:hover:not(:disabled){border-color:#c2410c;color:#c2410c}
.npc-btn:disabled{opacity:.4;cursor:default}
.npc-btn-gift{border-color:#f97316;color:#c2410c}
body.dark .npc-btn-gift{color:#fb923c;border-color:#ea580c}
/* quest board */
.quest-list{display:flex;flex-direction:column;gap:10px}
.quest-card{background:var(--ui-bg);border:1.5px solid var(--ui-border);border-radius:14px;padding:13px 14px;transition:border-color .15s}
.quest-card.q-done{border-color:#22c55e}
.quest-top{display:flex;align-items:flex-start;gap:10px;margin-bottom:6px}
.quest-icon{font-size:24px;flex-shrink:0}
.quest-title{font-size:13px;font-weight:800;color:var(--text-primary)}
.quest-npc-label{font-size:10px;color:var(--text-muted);margin-top:1px}
.quest-desc{font-size:11px;color:var(--text-muted);line-height:1.4;margin-bottom:8px}
.quest-req{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:8px}
.q-item{display:flex;align-items:center;gap:4px;padding:3px 8px;background:var(--ui-bg2);border:1px solid var(--ui-border);border-radius:8px;font-size:11px;font-weight:700;color:var(--text-primary)}
.q-item.have{border-color:#22c55e;color:#166534;background:#f0fdf4}
.q-item.need{border-color:#ef4444;color:#991b1b;background:#fff5f5}
body.dark .q-item.have{background:#0a2016;color:#4ade80}
body.dark .q-item.need{background:#2a0a0a;color:#f87171}
.quest-reward-row{font-size:11px;color:var(--text-muted);margin-bottom:8px}
.quest-submit-btn{width:100%;padding:9px;border-radius:10px;border:none;background:linear-gradient(135deg,#f97316,#c2410c);color:#fff;font-family:'Nunito',sans-serif;font-size:13px;font-weight:800;cursor:pointer;transition:all .15s}
.quest-submit-btn:hover:not(:disabled){opacity:.9;transform:translateY(-1px)}
.quest-submit-btn:disabled{background:var(--ui-border);color:var(--text-muted);cursor:default;transform:none}
/* cooking */
.recipe-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
@media(min-width:480px){.recipe-grid{grid-template-columns:repeat(3,1fr)}}
.recipe-card{background:var(--ui-bg);border:1.5px solid var(--ui-border);border-radius:14px;padding:12px 10px;text-align:center;transition:border-color .15s}
.recipe-card.can-cook{border-color:#f97316}
.recipe-em{font-size:28px;display:block;margin-bottom:4px}
.recipe-name{font-size:10px;font-weight:800;color:var(--text-primary);margin-bottom:3px}
.recipe-energy{font-size:10px;color:#f97316;font-weight:700;margin-bottom:3px}
.recipe-buff-desc{font-size:9px;color:var(--text-muted);line-height:1.3;margin-bottom:6px;min-height:24px}
.recipe-ing{font-size:9px;color:var(--text-muted);margin-bottom:8px}
.recipe-cook-btn{width:100%;padding:7px;border-radius:8px;border:none;background:#f97316;color:#fff;font-family:'Nunito',sans-serif;font-size:10px;font-weight:800;cursor:pointer;transition:all .14s}
.recipe-cook-btn:not(:disabled):hover{background:#c2410c}
.recipe-cook-btn:disabled{background:var(--ui-border);color:var(--text-muted);cursor:default}
/* preservation */
.preserve-section-title{font-size:12px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin:14px 0 8px;display:flex;align-items:center;gap:5px}
.preserve-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px}
@media(min-width:480px){.preserve-grid{grid-template-columns:repeat(3,1fr)}}
.preserve-card{background:var(--ui-bg);border:1.5px solid var(--ui-border);border-radius:14px;padding:12px 10px;text-align:center;transition:border-color .15s}
.preserve-card.can-preserve{border-color:#c2410c}
.preserve-em{font-size:24px;display:block;margin-bottom:4px}
.preserve-name{font-size:10px;font-weight:800;color:var(--text-primary);margin-bottom:3px}
.preserve-sell{font-size:10px;color:#f59e0b;font-weight:700;margin-bottom:3px}
.preserve-desc-text{font-size:9px;color:var(--text-muted);line-height:1.3;margin-bottom:6px}
.preserve-btn{width:100%;padding:6px;border-radius:8px;border:none;background:#c2410c;color:#fff;font-family:'Nunito',sans-serif;font-size:10px;font-weight:800;cursor:pointer;transition:all .14s}
.preserve-btn:not(:disabled):hover{background:#9a3412}
.preserve-btn:disabled{background:var(--ui-border);color:var(--text-muted);cursor:default}
.preserve-inv-row{display:flex;align-items:center;justify-content:space-between;padding:8px 10px;background:var(--ui-bg);border:1px solid var(--ui-border);border-radius:10px;margin-bottom:6px;font-size:12px;font-weight:700;color:var(--text-primary)}
.p-sell-btn{padding:4px 10px;border-radius:7px;border:1.5px solid #f59e0b;background:#fffbeb;color:#92400e;font-family:'Nunito',sans-serif;font-size:10px;font-weight:700;cursor:pointer;transition:all .14s}
.p-sell-btn:hover{background:#fef3c7}
body.dark .p-sell-btn{background:#1a1000;color:#fbbf24}
/* museum */
.museum-header{background:var(--ui-bg);border:1.5px solid var(--ui-border);border-radius:14px;padding:14px;margin-bottom:12px;display:flex;align-items:center;gap:12px}
.museum-total{font-size:28px;font-weight:800;color:#c2410c}
.museum-total-lab{font-size:10px;color:var(--text-muted);font-weight:700}
.museum-prog-bar{flex:1;height:8px;background:var(--ui-border);border-radius:99px;overflow:hidden}
.museum-prog-fill{height:100%;background:linear-gradient(90deg,#f97316,#c2410c);border-radius:99px;transition:width .5s}
.museum-milestones{display:flex;flex-direction:column;gap:6px;margin-bottom:14px}
.museum-milestone{display:flex;align-items:center;gap:8px;padding:8px 12px;background:var(--ui-bg);border:1.5px solid var(--ui-border);border-radius:10px;font-size:11px;font-weight:700;color:var(--text-muted)}
.museum-milestone.done{border-color:#c2410c;color:var(--text-primary);background:#fff7f0}
body.dark .museum-milestone.done{background:#1a0800}
.museum-cat-title{font-size:11px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin:12px 0 8px}
.museum-item-grid{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:10px}
.museum-item{display:flex;flex-direction:column;align-items:center;gap:2px;padding:8px 6px;border:1.5px solid var(--ui-border);border-radius:10px;background:var(--ui-bg2);width:60px;cursor:pointer;transition:all .15s}
.museum-item.donated{border-color:#c2410c;background:#fff7f0}
body.dark .museum-item.donated{background:#1a0800}
.museum-item:not(.donated):hover{border-color:#c2410c}
.museum-item-em{font-size:20px}
.museum-item-name{font-size:8px;color:var(--text-muted);text-align:center;line-height:1.2}
.museum-item.donated .museum-item-name{color:#c2410c;font-weight:700}
.museum-donate-btn{width:100%;margin-top:2px;padding:3px;border-radius:5px;border:none;background:#c2410c;color:#fff;font-size:8px;font-weight:700;cursor:pointer}
.museum-donate-btn:disabled{background:var(--ui-border);color:var(--text-muted);cursor:default}
/* festival */
.festival-banner{background:linear-gradient(135deg,#c2410c,#9a3412);border-radius:14px;padding:16px;margin-bottom:14px;display:flex;align-items:center;gap:12px;color:#fff}
.festival-banner-em{font-size:36px;flex-shrink:0}
.festival-banner-name{font-size:16px;font-weight:800;margin-bottom:3px}
.festival-banner-desc{font-size:11px;opacity:.85;line-height:1.4}
.festival-banner-date{font-size:10px;opacity:.7;margin-top:4px}
.festival-activity{background:var(--ui-bg);border:1.5px solid var(--ui-border);border-radius:14px;padding:13px 14px;margin-bottom:10px;transition:border-color .15s}
.festival-activity:hover{border-color:#c2410c}
.fest-act-top{display:flex;align-items:center;justify-content:space-between;margin-bottom:5px}
.fest-act-label{font-size:13px;font-weight:800;color:var(--text-primary)}
.fest-act-reward{font-size:11px;font-weight:700;color:#f59e0b}
.fest-act-desc{font-size:11px;color:var(--text-muted);margin-bottom:8px}
.fest-act-btn{width:100%;padding:9px;border-radius:10px;border:none;background:linear-gradient(135deg,#f97316,#c2410c);color:#fff;font-family:'Nunito',sans-serif;font-size:12px;font-weight:800;cursor:pointer;transition:all .15s}
.fest-act-btn:hover:not(:disabled){opacity:.9;transform:translateY(-1px)}
.fest-act-btn:disabled{background:var(--ui-border);color:var(--text-muted);cursor:default;transform:none}
/* lore */
.lore-card{background:var(--ui-bg);border:1.5px solid var(--ui-border);border-radius:14px;padding:13px 14px;margin-bottom:10px}
.lore-card.locked{filter:blur(1.5px);opacity:.45;pointer-events:none}
.lore-top{display:flex;align-items:center;gap:10px;margin-bottom:6px}
.lore-icon{font-size:20px}
.lore-title{font-size:13px;font-weight:800;color:var(--text-primary)}
.lore-text{font-size:12px;color:var(--text-muted);line-height:1.55}
/* HUD town button */
#hud-town-btn{display:flex;align-items:center;gap:4px;background:linear-gradient(135deg,#c2410c,#9a3412);border:1.5px solid #9a3412;border-radius:20px;padding:4px 10px;font-size:11px;font-weight:700;color:#fff;cursor:pointer;white-space:nowrap;font-family:'Nunito',sans-serif;box-shadow:0 2px 8px rgba(194,65,12,.35);transition:opacity .15s,transform .15s;flex-shrink:0}
#hud-town-btn:hover{opacity:.88;transform:scale(1.05)}
#hud-town-btn:active{transform:scale(.95)}
body.dark #hud-town-btn{background:linear-gradient(135deg,#9a3412,#7c2d12);border-color:#7c2d12}
body.retro #hud-town-btn{background:#4a1000!important;border:2px solid #8b2500!important;border-radius:3px!important;font-family:'Press Start 2P',monospace!important;font-size:6.5px!important;box-shadow:none!important;color:#ffd0a0!important;padding:4px 7px!important}
/* Active buff pill */
.town-buff-pill{display:inline-flex;align-items:center;gap:4px;background:#fff7f0;border:1.5px solid #f97316;border-radius:99px;padding:2px 8px;font-size:10px;font-weight:700;color:#c2410c;animation:buffPulse 2s ease-in-out infinite}
body.dark .town-buff-pill{background:#1a0500;color:#fb923c;border-color:#ea580c}
@keyframes buffPulse{0%,100%{opacity:1}50%{opacity:.65}}
/* Falling leaves */
#fall-leaves{pointer-events:none;position:fixed;inset:0;z-index:50;overflow:hidden}
.fall-leaf{position:absolute;top:-30px;animation:leafFall linear infinite;will-change:transform,opacity}
@keyframes leafFall{0%{transform:translateY(0) rotate(0deg) translateX(0);opacity:1}50%{opacity:.75}90%{opacity:.3}100%{transform:translateY(100vh) rotate(380deg) translateX(35px);opacity:0}}
/* Fall atmosphere glow */
#fall-glow{pointer-events:none;position:fixed;inset:0;z-index:1;background:radial-gradient(ellipse 80% 45% at 50% 100%,rgba(194,65,12,.055) 0%,transparent 70%);transition:opacity 1.5s}
/* Section info box */
.town-section-info{font-size:11px;color:var(--text-muted);font-weight:700;margin-bottom:12px;padding:8px 12px;background:var(--ui-bg2);border-radius:10px;border:1px solid var(--ui-border)}
/* Retro overrides */
body.retro #town-screen{background:#120c00}
body.retro .town-header{background:#120c00;border-bottom:3px solid #8b6914}
body.retro .town-header-title{color:#ffd700;font-size:11px;font-family:'Press Start 2P',monospace}
body.retro .town-tab-btn{font-size:7px;font-family:'Press Start 2P',monospace;color:#a1887f}
body.retro .town-tab-btn.active{color:#ffd700;border-bottom-color:#ffd700}
body.retro .npc-card,.npc-card,.quest-card,.recipe-card,.preserve-card,.festival-activity,.lore-card{transition:border-color .15s}
body.retro .npc-name,body.retro .quest-title,body.retro .recipe-name,body.retro .fest-act-label,body.retro .lore-title{font-family:'Press Start 2P',monospace;font-size:7px}
body.retro .quest-submit-btn,body.retro .recipe-cook-btn,body.retro .preserve-btn,body.retro .fest-act-btn{border-radius:2px;font-family:'Press Start 2P',monospace;font-size:7px}
`;
    document.head.appendChild(s);
  }

  /* ══════════════════════════════════════════════════════════
     HTML INJECTION
  ══════════════════════════════════════════════════════════ */
  function injectHTML() {
    // Leaf container
    if (!document.getElementById('fall-leaves')) {
      const lv = document.createElement('div');
      lv.id = 'fall-leaves';
      document.body.appendChild(lv);
    }
    // Fall atmosphere glow
    if (!document.getElementById('fall-glow')) {
      const gw = document.createElement('div');
      gw.id = 'fall-glow';
      gw.style.opacity = '0';
      const gs = document.getElementById('game-screen');
      if (gs) gs.prepend(gw);
    }
    // Town Screen overlay
    if (!document.getElementById('town-screen')) {
      const ts = document.createElement('div');
      ts.id = 'town-screen';
      ts.innerHTML = `
        <div class="town-header">
          <button class="town-back-btn" onclick="closeTownScreen()">← Back to Farm</button>
          <div class="town-header-title">🏘️ Harvest Town</div>
          <div id="town-season-tag" class="town-season-tag" style="border-color:#c2410c;color:#c2410c">🍂 Fall</div>
        </div>
        <div class="town-tabs" id="town-tabs">
          <button class="town-tab-btn active" data-ttab="overview" onclick="setTownTab('overview')">🏘️ Town</button>
          <button class="town-tab-btn" data-ttab="npcs"     onclick="setTownTab('npcs')">👥 Villagers</button>
          <button class="town-tab-btn" data-ttab="quests"   onclick="setTownTab('quests')">📋 Quests</button>
          <button class="town-tab-btn" data-ttab="cooking"  onclick="setTownTab('cooking')">🍳 Cooking</button>
          <button class="town-tab-btn" data-ttab="preserve" onclick="setTownTab('preserve')">🫙 Preserve</button>
          <button class="town-tab-btn" data-ttab="museum"   onclick="setTownTab('museum')">🏛️ Museum</button>
          <button class="town-tab-btn" data-ttab="festival" onclick="setTownTab('festival')">🎉 Festival</button>
          <button class="town-tab-btn" data-ttab="lore"     onclick="setTownTab('lore')">📖 Lore</button>
        </div>
        <div class="town-body" id="town-body"></div>
      `;
      document.body.appendChild(ts);
    }
    // HUD button
    if (!document.getElementById('hud-town-btn')) {
      const btn = document.createElement('button');
      btn.id = 'hud-town-btn';
      btn.title = 'Visit Harvest Town';
      btn.onclick = window.openTownScreen;
      btn.textContent = '🏘️ Town';
      const hud = document.getElementById('hud');
      if (hud) hud.appendChild(btn);
    }
  }

  /* ══════════════════════════════════════════════════════════
     TOWN SCREEN CONTROLLER
  ══════════════════════════════════════════════════════════ */
  let _currentTab = 'overview';

  window.openTownScreen = function () {
    document.getElementById('town-screen').classList.add('town-open');
    _updateSeasonTag();
    setTownTab(_currentTab);
  };

  window.closeTownScreen = function () {
    document.getElementById('town-screen').classList.remove('town-open');
  };

  window.setTownTab = function (tab) {
    _currentTab = tab;
    document.querySelectorAll('.town-tab-btn').forEach(b =>
      b.classList.toggle('active', b.dataset.ttab === tab));
    const body = document.getElementById('town-body');
    if (!body) return;
    switch (tab) {
      case 'overview':  body.innerHTML = _renderOverview();    break;
      case 'npcs':      body.innerHTML = _renderNPCs();        break;
      case 'quests':    body.innerHTML = _renderQuests();      break;
      case 'cooking':   body.innerHTML = _renderCooking();     break;
      case 'preserve':  body.innerHTML = _renderPreservation();break;
      case 'museum':    body.innerHTML = _renderMuseum();      break;
      case 'festival':  body.innerHTML = _renderFestival();    break;
      case 'lore':      body.innerHTML = _renderLore();        break;
    }
  };

  function _updateSeasonTag() {
    const tag = document.getElementById('town-season-tag');
    if (!tag) return;
    const s = season();
    const icons  = { Spring:'🌸', Summer:'☀️', Fall:'🍂', Winter:'❄️' };
    const colors = { Spring:'#16a34a', Summer:'#d97706', Fall:'#c2410c', Winter:'#0369a1' };
    tag.textContent = (icons[s] || '🍂') + ' ' + s;
    tag.style.borderColor = colors[s] || '#c2410c';
    tag.style.color       = colors[s] || '#c2410c';
  }

  /* ══════════════════════════════════════════════════════════
     RENDER — OVERVIEW
  ══════════════════════════════════════════════════════════ */
  const TOWN_AREAS = [
    { em:'☕', name:'Cozy Café',    sub:'Marina bakes here',     tab:'npcs' },
    { em:'🛒', name:'Market',       sub:'Trade goods',            tab:'quests' },
    { em:'⚒️', name:'Blacksmith',   sub:"Eli's forge",            tab:'npcs' },
    { em:'🐟', name:'Fish Shop',    sub:"Sam's fresh catch",      tab:'npcs' },
    { em:'🏛️', name:'Museum',       sub:"Nora's collection",      tab:'museum' },
    { em:'📋', name:'Quest Board',  sub:'Daily requests',         tab:'quests', badgeKey:'quests' },
    { em:'🎪', name:'Festival Area',sub:'Seasonal events',        tab:'festival' },
    { em:'🌳', name:'Town Square',  sub:'Theo plays here',        tab:'npcs' },
    { em:'🫙', name:'Artisan Shop', sub:'Preserved goods',        tab:'preserve' },
  ];

  function _renderOverview() {
    const T = G.town;
    const s = season();
    const greetings = {
      Fall:   '🍂 The air smells of woodsmoke and harvest. Coloured leaves drift past. The whole valley feels golden.',
      Spring: '🌸 Blossoms float through the town square. The villagers are bright-eyed. There\'s planting in the air.',
      Summer: '☀️ The town shimmers in golden heat. Marina sells cold drinks at the café. Sam swears the fishing is exceptional.',
      Winter: '❄️ Lanterns glow warmly along cobblestones. Quieter, but no less welcoming. Cozy fires burn in every window.',
    };

    const pendingQuests = (T.questBoard || []).filter(q =>
      !T.completedToday.includes(q.id)).length;

    const areaCards = TOWN_AREAS.map(a => {
      const badge = a.badgeKey === 'quests' && pendingQuests > 0
        ? `<div class="town-area-badge">${pendingQuests}</div>` : '';
      return `<div class="town-area-card" onclick="setTownTab('${a.tab}')">
        ${badge}
        <span class="town-area-em">${a.em}</span>
        <div class="town-area-name">${a.name}</div>
        <div class="town-area-sub">${a.sub}</div>
      </div>`;
    }).join('');

    // Active buffs
    let buffHtml = '';
    const buffEntries = Object.values(T.activeBuffs || {});
    if (buffEntries.length) {
      buffHtml = `<div style="margin-bottom:12px;padding:10px 12px;background:var(--ui-bg);border:1.5px solid #f97316;border-radius:12px">
        <div style="font-size:11px;font-weight:800;color:#c2410c;margin-bottom:6px">⚡ Active Buffs</div>
        ${buffEntries.map(b => `<span class="town-buff-pill">${b.icon} ${b.name}</span> `).join('')}
      </div>`;
    }

    const donations = (T.museumDonated || []).length;
    const friendTotal = Object.values(T.friendship || {}).reduce((a,b) => a+b, 0);
    const qDone = (T.completedToday || []).length;

    return `
      <div class="town-welcome">
        <span class="town-welcome-em">${{Fall:'🍂',Spring:'🌸',Summer:'☀️',Winter:'❄️'}[s]||'🏘️'}</span>
        <div class="town-welcome-text">${greetings[s] || greetings.Fall}</div>
      </div>
      ${buffHtml}
      <div class="town-map-grid">${areaCards}</div>
      <div class="town-stat-row">
        <div class="town-stat"><div class="town-stat-val">${qDone}</div><div class="town-stat-lab">Quests Done</div></div>
        <div class="town-stat"><div class="town-stat-val">${donations}</div><div class="town-stat-lab">Museum Items</div></div>
        <div class="town-stat"><div class="town-stat-val">${Math.floor(friendTotal)}</div><div class="town-stat-lab">Friendship</div></div>
      </div>
      <div style="font-size:10px;color:var(--text-muted);text-align:center;padding:4px 0">
        💬 Talk to villagers · 📋 Complete quests · 🍳 Cook meals · 🏛️ Donate to the museum
      </div>`;
  }

  /* ══════════════════════════════════════════════════════════
     RENDER — VILLAGERS
  ══════════════════════════════════════════════════════════ */
  function _renderNPCs() {
    const T = G.town;
    const todayKey = (G.day || 1) + '_' + (G.year || 1);
    const s = season();
    return `<div class="npc-list">` + Object.entries(TOWN_NPCS).map(([key, npc]) => {
      const friendship = T.friendship[key] || 0;
      const pct = Math.min(100, (friendship / 10) * 100);
      const lvl = friendship >= 9 ? 'Best Friend ❤️' : friendship >= 6 ? 'Good Friend 💛'
                : friendship >= 3 ? 'Acquaintance 🤝' : 'Stranger 👋';

      // Pick contextual dialogue
      const pool = [
        ...(npc.dialogue.base || []),
        ...(s === 'Fall' ? (npc.dialogue.fall || []) : []),
        ...(friendship >= 6 ? (npc.dialogue.friend || []) : []),
      ];
      const line = pool[Math.floor(Math.random() * pool.length)];
      const alreadyTalked = (T.lastTalked[key] === todayKey);

      // Gift button — show best loved gift in bag
      const bestGift = npc.gifts.find(g => invCount(g) > 0);

      return `<div class="npc-card">
        <div class="npc-top">
          <span class="npc-em">${npc.icon}</span>
          <div>
            <div class="npc-name">${npc.name}</div>
            <div class="npc-job">${npc.job}</div>
            <div class="npc-loc">${npc.location}</div>
          </div>
        </div>
        <div class="npc-trait">${npc.trait}</div>
        <div class="friend-bar-wrap">
          <div class="friend-bar"><div class="friend-fill" style="width:${pct}%"></div></div>
          <div class="friend-label">${lvl} (${friendship.toFixed(1)}/10)</div>
        </div>
        <div class="npc-dialogue">"${line}"</div>
        <div class="npc-actions">
          <button class="npc-btn" onclick="townTalk('${key}')" ${alreadyTalked ? 'disabled' : ''}>
            ${alreadyTalked ? '✓ Talked Today' : '💬 Talk'}
          </button>
          ${bestGift ? `<button class="npc-btn npc-btn-gift" onclick="townGift('${key}','${bestGift}')">
            🎁 Gift ${cropEmoji(bestGift)} (×${invCount(bestGift)})
          </button>` : ''}
        </div>
        ${npc.gifts.length ? `<div style="font-size:10px;color:var(--text-muted);margin-top:6px">💛 Loves: ${npc.gifts.map(cropEmoji).join(' ')}</div>` : ''}
      </div>`;
    }).join('') + `</div>`;
  }

  /* ══════════════════════════════════════════════════════════
     NPC ACTIONS
  ══════════════════════════════════════════════════════════ */
  window.townTalk = function (key) {
    const T = G.town;
    const npc = TOWN_NPCS[key];
    if (!npc) return;
    const todayKey = (G.day || 1) + '_' + (G.year || 1);
    if (T.lastTalked[key] === todayKey) { toast('You already chatted with ' + npc.name + ' today!', 'info'); return; }
    T.lastTalked[key] = todayKey;
    T.friendship[key] = Math.min(10, (T.friendship[key] || 0) + 0.5);
    snd('coin');
    toast('💬 Had a nice chat with ' + npc.name + '! +0.5 friendship 💛', 'success', 2600);
    setTownTab('npcs');
  };

  window.townGift = function (key, cropType) {
    const T = G.town;
    const npc = TOWN_NPCS[key];
    if (!npc || invCount(cropType) < 1) { toast('You don\'t have that item!', 'error'); snd('error'); return; }
    removeInv(cropType, 1);
    const bonus = npc.gifts.includes(cropType) ? 2 : 1;
    T.friendship[key] = Math.min(10, (T.friendship[key] || 0) + bonus);
    snd('levelup');
    toast('🎁 ' + npc.name + ' loved the ' + (CROPS[cropType]?.n || cropType) + '! +' + bonus + ' friendship 💛', 'success', 3200);
    if (typeof renderHUD === 'function') renderHUD();
    setTownTab('npcs');
  };

  /* ══════════════════════════════════════════════════════════
     RENDER — QUEST BOARD
  ══════════════════════════════════════════════════════════ */
  function _renderQuests() {
    const T = G.town;
    refreshQuestBoard(false);
    if (!T.questBoard.length) return `<div style="text-align:center;padding:40px;color:var(--text-muted);font-size:13px;font-weight:700">📋 No quests available. Check back tomorrow!</div>`;

    return `<div class="town-section-info">📋 Daily quests reset each morning. Complete them for gold and friendship rewards!</div>
    <div class="quest-list">${T.questBoard.map(_renderQuestCard).join('')}</div>`;
  }

  function _renderQuestCard(q) {
    const T = G.town;
    const done = T.completedToday.includes(q.id);
    const npc  = TOWN_NPCS[q.npc];
    const canSubmit = !done && Object.entries(q.req || {}).every(([t, n]) => invCount(t) >= n);

    const reqItems = Object.entries(q.req || {}).map(([t, n]) => {
      const have = invCount(t);
      const crop = CROPS[t];
      return `<div class="q-item ${have >= n ? 'have' : 'need'}">${crop?.e || '📦'} ${crop?.n || t} ${have}/${n}</div>`;
    }).join('');

    const rewardParts = [];
    if (q.reward.gold) rewardParts.push('💰 ' + q.reward.gold + 'g');
    if (q.reward.friendship) Object.entries(q.reward.friendship).forEach(([k,p]) => {
      if (TOWN_NPCS[k]) rewardParts.push('💛 +' + p + ' with ' + TOWN_NPCS[k].name);
    });

    return `<div class="quest-card ${done ? 'q-done' : ''}">
      <div class="quest-top">
        <span class="quest-icon">${q.icon}</span>
        <div>
          <div class="quest-title">${q.title}</div>
          <div class="quest-npc-label">${npc?.icon || ''} Requested by ${npc?.name || q.npc} · ${q.type === 'weekly' ? '📅 Weekly' : '🌅 Daily'}</div>
        </div>
      </div>
      <div class="quest-desc">${q.desc}</div>
      <div class="quest-req">${reqItems}</div>
      <div class="quest-reward-row">🎁 Reward: ${rewardParts.join(' · ')}</div>
      ${done
        ? `<div style="text-align:center;font-size:12px;font-weight:800;color:#22c55e;padding:8px">✓ Quest Completed!</div>`
        : `<button class="quest-submit-btn" onclick="townSubmitQuest('${q.id}')" ${canSubmit ? '' : 'disabled'}>
            ${canSubmit ? '✓ Submit Quest' : 'Need More Items'}
          </button>`}
    </div>`;
  }

  window.townSubmitQuest = function (questId) {
    const T = G.town;
    const q = T.questBoard.find(x => x.id === questId);
    if (!q || T.completedToday.includes(q.id)) { toast('Already completed!', 'info'); return; }
    const ok = Object.entries(q.req || {}).every(([t, n]) => invCount(t) >= n);
    if (!ok) { toast('You don\'t have everything needed!', 'error'); snd('error'); return; }
    Object.entries(q.req || {}).forEach(([t, n]) => removeInv(t, n));
    if (q.reward.gold) { G.gold = (G.gold || 0) + q.reward.gold; }
    if (q.reward.friendship) {
      Object.entries(q.reward.friendship).forEach(([k, p]) => {
        T.friendship[k] = Math.min(10, (T.friendship[k] || 0) + p);
      });
    }
    T.completedToday.push(q.id);
    snd('levelup');
    toast('🎉 Quest complete! ' + (q.reward.gold ? '+' + q.reward.gold + 'g ' : '') + '💛', 'success', 3200);
    if (typeof renderHUD === 'function') renderHUD();
    setTownTab('quests');
  };

  /* ══════════════════════════════════════════════════════════
     QUEST BOARD REFRESH
  ══════════════════════════════════════════════════════════ */
  function refreshQuestBoard(force) {
    const T = G.town;
    const todayKey = (G.day || 1) + '_' + (G.year || 1);
    if (!force && T.lastQuestDay === todayKey && T.questBoard.length > 0) return;
    const s = season();
    const daily  = shuffle(QUEST_POOL.filter(q => q.type === 'daily'
      && (!q.seasons || q.seasons.includes(s)))).slice(0, 3);
    const weekly = shuffle(QUEST_POOL.filter(q => q.type === 'weekly'
      && (!q.seasons || q.seasons.includes(s)))).slice(0, 2);
    T.questBoard = [...daily, ...weekly];
    T.completedToday = [];
    T.lastQuestDay = todayKey;
  }

  /* ══════════════════════════════════════════════════════════
     RENDER — COOKING
  ══════════════════════════════════════════════════════════ */
  function _renderCooking() {
    const T = G.town;
    let buffHtml = '';
    const buffs = Object.values(T.activeBuffs || {});
    if (buffs.length) {
      buffHtml = `<div style="margin-bottom:12px;padding:10px 12px;background:#fff7f0;border:1.5px solid #f97316;border-radius:12px">
        <div style="font-size:11px;font-weight:800;color:#c2410c;margin-bottom:5px">⚡ Active Buffs Today</div>
        ${buffs.map(b => `<div style="font-size:11px;color:#c2410c;font-weight:700">${b.icon} ${b.name}: ${b.desc}</div>`).join('')}
      </div>`;
    }
    const cards = Object.entries(RECIPES).map(([key, r]) => {
      const canCook = Object.entries(r.ingredients).every(([t, n]) => invCount(t) >= n);
      const ingList = Object.entries(r.ingredients).map(([t, n]) => {
        const crop = CROPS[t];
        return `${crop?.e || '📦'} ${crop?.n || t}×${n} (have ${invCount(t)})`;
      }).join(', ');
      return `<div class="recipe-card ${canCook ? 'can-cook' : ''}">
        <span class="recipe-em">${r.icon}</span>
        <div class="recipe-name">${r.name}</div>
        <div class="recipe-energy">⚡ +${r.energy} energy</div>
        <div class="recipe-buff-desc">${r.buffDesc || ''}</div>
        <div class="recipe-ing">${ingList}</div>
        <button class="recipe-cook-btn" onclick="townCook('${key}')" ${canCook ? '' : 'disabled'}>
          ${canCook ? '🍳 Cook' : 'Need Ingredients'}
        </button>
      </div>`;
    }).join('');
    return `${buffHtml}
      <div class="town-section-info">🍳 Cook meals from your harvest to restore energy and gain day-long farming buffs!</div>
      <div class="recipe-grid">${cards}</div>`;
  }

  window.townCook = function (key) {
    const T = G.town;
    const r = RECIPES[key];
    if (!r) return;
    const ok = Object.entries(r.ingredients).every(([t, n]) => invCount(t) >= n);
    if (!ok) { toast('Missing ingredients!', 'error'); snd('error'); return; }
    Object.entries(r.ingredients).forEach(([t, n]) => removeInv(t, n));
    // Restore energy
    const me = (typeof maxEnergy === 'function') ? maxEnergy() : 100;
    G.energy = Math.min(me, (G.energy || 0) + r.energy);
    // Apply buff
    if (r.buff) {
      if (!T.activeBuffs) T.activeBuffs = {};
      T.activeBuffs[r.buff] = { icon: r.icon, name: r.name, desc: r.buffDesc, key: r.buff };
    }
    snd('levelup');
    toast('🍳 ' + r.name + ' cooked! +' + r.energy + ' energy' + (r.buff ? ' · ' + r.buffDesc : ''), 'success', 3500);
    if (typeof renderHUD === 'function') renderHUD();
    setTownTab('cooking');
  };

  /* ══════════════════════════════════════════════════════════
     RENDER — PRESERVATION
  ══════════════════════════════════════════════════════════ */
  function _renderPreservation() {
    const T = G.town;
    // Inventory of preserved goods
    const ownedEntries = Object.entries(T.preservedInv || {}).filter(([, q]) => q > 0);
    let invHtml = '';
    if (ownedEntries.length) {
      invHtml = `<div class="preserve-section-title">🫙 Your Preserved Goods</div>`;
      invHtml += ownedEntries.map(([key, qty]) => {
        const p = PRESERVED[key];
        if (!p) return '';
        const sellEach = Math.round((CROPS[p.base]?.sell || 50) * p.sellMult);
        return `<div class="preserve-inv-row">
          <span>${p.icon} ${p.name} ×${qty}</span>
          <div style="display:flex;align-items:center;gap:6px">
            <span style="font-size:10px;color:#f59e0b;font-weight:700">${sellEach}g each</span>
            <button class="p-sell-btn" onclick="townSellPreserved('${key}',1)">Sell 1</button>
            <button class="p-sell-btn" onclick="townSellPreserved('${key}',${qty})">Sell All</button>
          </div>
        </div>`;
      }).join('');
    }

    const makeCards = Object.entries(PRESERVED).map(([key, p]) => {
      const crop = CROPS[p.base];
      const have = invCount(p.base);
      const canPreserve = have >= p.baseNeeded;
      const sellFor = Math.round((crop?.sell || 50) * p.sellMult);
      return `<div class="preserve-card ${canPreserve ? 'can-preserve' : ''}">
        <span class="preserve-em">${p.icon}</span>
        <div class="preserve-name">${p.name}</div>
        <div class="preserve-sell">💰 ${sellFor}g (${p.sellMult}× value)</div>
        <div class="preserve-desc-text">${p.desc}</div>
        <div style="font-size:9px;color:var(--text-muted);margin-bottom:6px">
          Needs: ${crop?.e || '📦'} ×${p.baseNeeded} &nbsp;(have ${have})
        </div>
        <button class="preserve-btn" onclick="townPreserve('${key}')" ${canPreserve ? '' : 'disabled'}>
          ${canPreserve ? '🫙 Preserve' : 'Need ' + p.baseNeeded + '×'}
        </button>
      </div>`;
    }).join('');

    return `${invHtml}
      <div class="preserve-section-title">⚗️ Artisan Preservation</div>
      <div class="town-section-info">Transform your harvest into premium artisan goods worth 2–3× more at market!</div>
      <div class="preserve-grid">${makeCards}</div>`;
  }

  window.townPreserve = function (key) {
    const T = G.town;
    const p = PRESERVED[key];
    if (!p || invCount(p.base) < p.baseNeeded) { toast('Not enough items!', 'error'); snd('error'); return; }
    removeInv(p.base, p.baseNeeded);
    T.preservedInv[key] = (T.preservedInv[key] || 0) + 1;
    snd('levelup');
    toast('🫙 Made ' + p.name + '! Sell it for a premium price.', 'success', 3000);
    setTownTab('preserve');
  };

  window.townSellPreserved = function (key, qty) {
    const T = G.town;
    const p = PRESERVED[key];
    if (!p || !T.preservedInv[key] || T.preservedInv[key] < qty) { toast('Not enough to sell!', 'error'); return; }
    const sellEach = Math.round((CROPS[p.base]?.sell || 50) * p.sellMult);
    const total    = sellEach * qty;
    T.preservedInv[key] -= qty;
    G.gold = (G.gold || 0) + total;
    if (G.stats) G.stats.earned = (G.stats.earned || 0) + total;
    snd('coin');
    toast('💰 Sold ' + qty + '× ' + p.name + ' for ' + total + 'g!', 'success', 2800);
    if (typeof renderHUD === 'function') renderHUD();
    setTownTab('preserve');
  };

  /* ══════════════════════════════════════════════════════════
     RENDER — MUSEUM
  ══════════════════════════════════════════════════════════ */
  function _renderMuseum() {
    const T = G.town;
    const donated = T.museumDonated || [];
    const total   = ALL_MUSEUM_ITEMS.length;
    const pct     = Math.round((donated.length / total) * 100);

    const milestoneHtml = MUSEUM_MILESTONES.map(m => {
      const reached = donated.length >= m.at;
      return `<div class="museum-milestone ${reached ? 'done' : ''}">
        <span>${reached ? '✅' : '🔒'}</span>
        <span style="flex:1">${m.at} donations: ${m.text}</span>
        ${!reached ? `<span style="font-size:10px">${donated.length}/${m.at}</span>` : ''}
      </div>`;
    }).join('');

    const catsHtml = Object.entries(MUSEUM_CATS).map(([, cat]) => {
      const catDonated = cat.items.filter(t => donated.includes(t)).length;
      const itemCards  = cat.items.map(cropType => {
        const crop      = CROPS[cropType];
        const isDonated = donated.includes(cropType);
        const have      = invCount(cropType);
        return `<div class="museum-item ${isDonated ? 'donated' : ''}">
          <span class="museum-item-em">${crop?.e || '📦'}</span>
          <div class="museum-item-name">${crop?.n || cropType}</div>
          ${isDonated
            ? '<div style="font-size:8px;color:#c2410c;font-weight:700">✓ Donated</div>'
            : `<button class="museum-donate-btn" onclick="townDonate('${cropType}')" ${have > 0 ? '' : 'disabled'}>
                ${have > 0 ? 'Donate' : 'Need 1'}
              </button>`}
        </div>`;
      }).join('');
      return `<div class="museum-cat-title">${cat.icon} ${cat.label} (${catDonated}/${cat.items.length})</div>
        <div class="museum-item-grid">${itemCards}</div>`;
    }).join('');

    return `
      <div class="museum-header">
        <div>
          <div class="museum-total">${donated.length}/${total}</div>
          <div class="museum-total-lab">Donations</div>
        </div>
        <div style="flex:1;display:flex;flex-direction:column;gap:4px">
          <div class="museum-prog-bar"><div class="museum-prog-fill" style="width:${pct}%"></div></div>
          <div style="font-size:10px;color:var(--text-muted);font-weight:700">${pct}% complete</div>
        </div>
      </div>
      <div class="town-section-info">🏛️ Donate unique crops to help Nora build the Valley Museum. Each milestone unlocks gold, recipes, and lore.</div>
      <div style="font-size:11px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:.06em;margin-bottom:8px">🎁 Milestones</div>
      <div class="museum-milestones">${milestoneHtml}</div>
      ${catsHtml}`;
  }

  window.townDonate = function (cropType) {
    const T = G.town;
    if ((T.museumDonated || []).includes(cropType)) { toast('Already donated!', 'info'); return; }
    if (invCount(cropType) < 1) { toast('You don\'t have that item!', 'error'); return; }
    removeInv(cropType, 1);
    if (!T.museumDonated) T.museumDonated = [];
    T.museumDonated.push(cropType);
    T.friendship.nora = Math.min(10, (T.friendship.nora || 0) + 0.5);
    snd('levelup');
    toast('🏛️ Donated ' + (CROPS[cropType]?.n || cropType) + '! Nora is delighted.', 'success', 3000);
    // Check milestones
    MUSEUM_MILESTONES.forEach(m => {
      if (T.museumDonated.length === m.at && !(T.museumMilestones || []).includes(m.at)) {
        if (!T.museumMilestones) T.museumMilestones = [];
        T.museumMilestones.push(m.at);
        G.gold = (G.gold || 0) + m.gold;
        if (m.lore && !T.loreDiscovered.includes(m.lore)) T.loreDiscovered.push(m.lore);
        setTimeout(() => toast('🏆 Museum Milestone! ' + m.text + ' +' + m.gold + 'g', 'success', 5000), 900);
      }
    });
    if (typeof renderHUD === 'function') renderHUD();
    setTownTab('museum');
  };

  /* ══════════════════════════════════════════════════════════
     RENDER — FESTIVAL
  ══════════════════════════════════════════════════════════ */
  function _renderFestival() {
    const T  = G.town;
    const s  = season();
    const d  = G.day || 1;
    const activeFests = Object.entries(FESTIVALS).filter(([, f]) => f.season === s);

    if (!activeFests.length) {
      return `<div style="text-align:center;padding:40px 20px;color:var(--text-muted)">
        <div style="font-size:40px;margin-bottom:10px">🎪</div>
        <div style="font-size:13px;font-weight:700">No festivals this season.</div>
        <div style="font-size:11px;margin-top:8px">Festivals happen in Fall: Harvest Festival (Day 14–16) and Night Market (Day 24–26).</div>
      </div>`;
    }

    return activeFests.map(([festKey, fest]) => {
      const isActive = d >= fest.startDay && d <= fest.endDay;
      const isPast   = d > fest.endDay;
      const statusLabel = isActive ? '🎉 Active Now!' : isPast ? '✓ Season Past' : `⏳ Starts Day ${fest.startDay}`;

      const actHtml = fest.activities.map(act => {
        const doneKey = festKey + '_' + act.id;
        const done    = (T.festivalsDone || []).includes(doneKey);
        const costItems = Object.entries(act.cost || {}).map(([t,n]) => {
          const crop = CROPS[t];
          return `${crop?.e||'📦'} ${n}× ${crop?.n||t}`;
        }).join(', ');
        const canDo = !done && isActive
          && Object.entries(act.cost || {}).every(([t, n]) => invCount(t) >= n)
          && (act.goldCost === 0 || (G.gold || 0) >= act.goldCost);

        return `<div class="festival-activity">
          <div class="fest-act-top">
            <div class="fest-act-label">${act.label}</div>
            ${act.reward > 0 ? `<div class="fest-act-reward">💰 +${act.reward}g</div>` : ''}
          </div>
          <div class="fest-act-desc">${act.desc}</div>
          ${costItems ? `<div style="font-size:10px;color:var(--text-muted);margin-bottom:5px">Needs: ${costItems}</div>` : ''}
          ${act.goldCost > 0 ? `<div style="font-size:10px;color:#f59e0b;font-weight:700;margin-bottom:5px">Cost: ${act.goldCost}g</div>` : ''}
          ${done
            ? `<div style="text-align:center;font-size:12px;font-weight:800;color:#22c55e;padding:7px">✓ Done!</div>`
            : `<button class="fest-act-btn" onclick="townFestAct('${festKey}','${act.id}')" ${canDo ? '' : 'disabled'}>
                ${!isActive ? '🔒 ' + statusLabel : !canDo ? 'Not Enough Items' : 'Participate! 🎉'}
              </button>`}
        </div>`;
      }).join('');

      return `<div class="festival-banner">
          <span class="festival-banner-em">🍂</span>
          <div>
            <div class="festival-banner-name">${fest.name}</div>
            <div class="festival-banner-desc">${fest.desc}</div>
            <div class="festival-banner-date">📅 Days ${fest.startDay}–${fest.endDay} of ${fest.season} · ${statusLabel}</div>
          </div>
        </div>
        ${actHtml}`;
    }).join('');
  }

  window.townFestAct = function (festKey, actId) {
    const T    = G.town;
    const fest = FESTIVALS[festKey];
    const act  = fest && fest.activities.find(a => a.id === actId);
    if (!act) return;
    const doneKey = festKey + '_' + actId;
    if ((T.festivalsDone || []).includes(doneKey)) { toast('Already participated!', 'info'); return; }
    if (!Object.entries(act.cost || {}).every(([t, n]) => invCount(t) >= n)) { toast('Not enough items!', 'error'); snd('error'); return; }
    if (act.goldCost > 0 && (G.gold || 0) < act.goldCost) { toast('Need ' + act.goldCost + 'g!', 'error'); snd('error'); return; }
    // Spend
    Object.entries(act.cost || {}).forEach(([t, n]) => removeInv(t, n));
    if (act.goldCost > 0) G.gold = (G.gold || 0) - act.goldCost;
    // Reward
    if (act.reward > 0) G.gold = (G.gold || 0) + act.reward;
    if (act.friendBonus) {
      Object.entries(act.friendBonus).forEach(([k, p]) => {
        T.friendship[k] = Math.min(10, (T.friendship[k] || 0) + p);
      });
    }
    if (!T.festivalsDone) T.festivalsDone = [];
    T.festivalsDone.push(doneKey);
    snd('levelup');
    // Lore unlock for lantern walk
    if (actId === 'lantern_walk' && !T.loreDiscovered.includes('festival_origin'))
      T.loreDiscovered.push('festival_origin');
    const friendMsg = act.friendBonus && Object.keys(act.friendBonus).length
      ? ' 💛 Friendship gained!' : '';
    toast('🎉 ' + (act.label) + '!' + (act.reward > 0 ? ' +' + act.reward + 'g' : '') + friendMsg, 'success', 3500);
    if (typeof renderHUD === 'function') renderHUD();
    setTownTab('festival');
  };

  /* ══════════════════════════════════════════════════════════
     RENDER — LORE
  ══════════════════════════════════════════════════════════ */
  function _renderLore() {
    const T = G.town;
    const discovered = T.loreDiscovered || [];
    return `<div class="town-section-info">📖 Discover the hidden history of Harvest Valley. Unlock more entries through the museum and friendships.</div>` +
      LORE.map(l => {
        const unlocked = l.unlockDefault || discovered.includes(l.id);
        return `<div class="lore-card ${unlocked ? '' : 'locked'}">
          <div class="lore-top">
            <span class="lore-icon">${l.icon}</span>
            <div class="lore-title">${unlocked ? l.title : '🔒 Unknown Entry'}</div>
          </div>
          <div class="lore-text">${unlocked ? l.text : 'Donate more to the museum to unlock this memory.'}</div>
        </div>`;
      }).join('');
  }

  /* ══════════════════════════════════════════════════════════
     FALL ATMOSPHERE
  ══════════════════════════════════════════════════════════ */
  let _leafTimer = null;

  function updateAtmosphere() {
    const s = season();
    if (s === 'Fall') {
      startLeaves();
      setGlow(true);
    } else {
      stopLeaves();
      setGlow(false);
    }
  }

  function startLeaves() {
    const container = document.getElementById('fall-leaves');
    if (!container) return;
    container.innerHTML = '';
    const EMOJIS = ['🍂', '🍁', '🌿'];
    let live = 0;
    function spawn() {
      if (live >= 14) return;
      const el = document.createElement('div');
      el.className = 'fall-leaf';
      el.textContent = EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
      el.style.left  = Math.random() * 102 + 'vw';
      el.style.fontSize = (9 + Math.random() * 9) + 'px';
      el.style.opacity  = 0.5 + Math.random() * 0.5;
      const dur = 6 + Math.random() * 9;
      el.style.animationDuration = dur + 's';
      container.appendChild(el);
      live++;
      setTimeout(() => { el.remove(); live = Math.max(0, live - 1); }, dur * 1000 + 200);
    }
    clearInterval(_leafTimer);
    spawn(); spawn(); spawn();
    _leafTimer = setInterval(spawn, 1600);
  }

  function stopLeaves() {
    clearInterval(_leafTimer);
    const c = document.getElementById('fall-leaves');
    if (c) c.innerHTML = '';
  }

  function setGlow(on) {
    const g = document.getElementById('fall-glow');
    if (g) g.style.opacity = on ? '1' : '0';
  }

  /* ══════════════════════════════════════════════════════════
     INVENTORY HELPERS
     G.inv  = seeds  (object {type:qty})
     G.bag  = harvested crops (object {type:qty})
  ══════════════════════════════════════════════════════════ */
  function invCount(type) {
    return ((G.bag  && G.bag[type])  || 0)
         + ((G.inv  && G.inv[type])  || 0);
  }

  function removeInv(type, qty) {
    let rem = qty;
    // Remove from bag first (harvested crops)
    if (G.bag && (G.bag[type] || 0) > 0) {
      const take = Math.min(G.bag[type], rem);
      G.bag[type] -= take;
      rem -= take;
    }
    // Then seeds
    if (rem > 0 && G.inv && (G.inv[type] || 0) > 0) {
      const take = Math.min(G.inv[type], rem);
      G.inv[type] -= take;
    }
  }

  function cropEmoji(type) {
    return (typeof CROPS !== 'undefined' && CROPS[type]?.e) || '📦';
  }

  function shuffle(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  /* ══════════════════════════════════════════════════════════
     HOOKS
  ══════════════════════════════════════════════════════════ */
  function hookSleep() {
    const _orig = window.doSleep;
    if (typeof _orig !== 'function') return;
    window.doSleep = function (...args) {
      const T = G.town;
      if (T) {
        T.activeBuffs = {};          // Buffs expire on sleep
        T.lastQuestDay = -1;         // Force quest refresh next morning
      }
      const ret = _orig.apply(this, args);
      setTimeout(updateAtmosphere, 600); // Re-check season after sleep animation
      return ret;
    };
  }

  function hookRenderHUD() {
    const _orig = window.renderHUD;
    if (typeof _orig !== 'function') return;
    window.renderHUD = function (...args) {
      _orig.apply(this, args);
      // Inject/update buff pills in HUD
      const hud = document.getElementById('hud');
      if (!hud) return;
      hud.querySelectorAll('.town-hud-buff').forEach(el => el.remove());
      const buffs = Object.values((G.town && G.town.activeBuffs) || {});
      buffs.forEach(b => {
        const pill = document.createElement('div');
        pill.className = 'hud-pill town-hud-buff';
        pill.title = b.desc;
        pill.innerHTML = `<span class="town-buff-pill">${b.icon} ${b.name}</span>`;
        hud.appendChild(pill);
      });
    };
  }

  /* ══════════════════════════════════════════════════════════
     BOOT
  ══════════════════════════════════════════════════════════ */
  function boot() {
    initTownState();
    injectCSS();
    injectHTML();

    /* Hook initState & loadState so town data is always properly initialised
       on every login — not just the first one. boot() only fires once, so
       subsequent logout → new-farm flows would otherwise skip initTownState. */
    const _origInitState = window.initState;
    if (typeof _origInitState === 'function') {
      window.initState = function (...args) {
        _origInitState.apply(this, args);
        initTownState();
      };
    }
    const _origLoadState = window.loadState;
    if (typeof _origLoadState === 'function') {
      window.loadState = function (...args) {
        _origLoadState.apply(this, args);
        initTownState();
      };
    }

    hookSleep();
    hookRenderHUD();
    updateAtmosphere();

    const s = season();
    const isFirstFall = s === 'Fall';
    setTimeout(() => {
      toast(
        isFirstFall
          ? '🍂 Fall Town Update is here! Visit the 🏘️ Town button to explore.'
          : '🏘️ Fall Town Update loaded! The Town awaits you.',
        'success', 4500
      );
    }, 1800);

    console.log('[FallTownUpdate v2.0.0] 🍂 The Fall Town Update is live!');
  }

})();


/* ────────────────────── winter.js ────────────────────── */
/* ═══════════════════════════════════════════════════════════
   VALLEY FARM — WINTER EXPANSION  v2.0
   ❄️ Ice Fishing  ⛏️ Mining  🔨 Crafting  🌿 Foraging
   🐄 Animals  🌨️ Events  🔥 Survival  ✨ Atmosphere
═══════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ══════════════════════════════════════════════════════════
   1.  WINTER CROP DEFINITIONS (injected into CROPS)
══════════════════════════════════════════════════════════ */
const WINTER_CROP_DEFS={
  cabbage:       {n:'Cabbage',        e:'🥬',days:6, buy:40,  sell:120, seasons:['Fall','Winter'],winterNative:true},
  leek:          {n:'Leek',           e:'🌿',days:5, buy:35,  sell:100, seasons:['Winter'],windowNative:true},
  winter_berry:  {n:'Winter Berry',   e:'🫐',days:8, buy:60,  sell:180, seasons:['Winter'],winterNative:true},
  frost_melon:   {n:'Frost Melon',    e:'🍈',days:12,buy:90,  sell:300, seasons:['Winter'],winterNative:true},
  crystal_flower:{n:'Crystal Flower', e:'🌸',days:10,buy:120, sell:450, seasons:['Winter'],winterNative:true},
};

/* ══════════════════════════════════════════════════════════
   2.  MATERIAL DEFINITIONS (fish / ore / forage / crafted)
══════════════════════════════════════════════════════════ */
const MAT={
  // 🐟 Fish
  ice_trout:    {n:'Ice Trout',      e:'🐟',sell:45, cat:'fish'},
  frozen_carp:  {n:'Frozen Carp',    e:'🐠',sell:70, cat:'fish'},
  arctic_perch: {n:'Arctic Perch',   e:'🐡',sell:120,cat:'fish',rare:true},
  swamp_eel:    {n:'Swamp Eel',      e:'🐍',sell:55, cat:'fish'},
  mudfish:      {n:'Mudfish',        e:'🐟',sell:40, cat:'fish'},
  cave_bass:    {n:'Cave Bass',      e:'🐠',sell:90, cat:'fish',rare:true},
  lava_koi:     {n:'Lava Koi',       e:'🐡',sell:165,cat:'fish',rare:true},
  thermal_pike: {n:'Thermal Pike',   e:'🐟',sell:110,cat:'fish'},
  // ⛏️ Ore & Gems
  iron_ore:     {n:'Iron Ore',       e:'🪨',sell:60, cat:'ore'},
  coal:         {n:'Coal',           e:'⬛',sell:40, cat:'fuel'},
  gold_ore:     {n:'Gold Ore',       e:'🌕',sell:160,cat:'ore', rare:true},
  crystal:      {n:'Crystal',        e:'💎',sell:230,cat:'gem', rare:true},
  vol_shard:    {n:'Volcanic Shard', e:'🔴',sell:290,cat:'gem', rare:true},
  fossil:       {n:'Fossil',         e:'🦕',sell:420,cat:'artifact',rare:true},
  // 🌿 Forage
  winter_herb:  {n:'Winter Herb',    e:'🌿',sell:30, cat:'herb'},
  snow_shroom:  {n:'Snow Mushroom',  e:'🍄',sell:50, cat:'herb'},
  frost_berry:  {n:'Frost Berry',    e:'🍒',sell:40, cat:'herb'},
  frozen_relic: {n:'Frozen Relic',   e:'🏺',sell:180,cat:'artifact',rare:true},
  pine_branch:  {n:'Pine Branch',    e:'🌲',sell:20, cat:'wood'},
  firewood:     {n:'Firewood',       e:'🪵',sell:15, cat:'fuel'},
  // 🐄 Animal products
  egg:          {n:'Egg',            e:'🥚',sell:25, cat:'animal'},
  milk:         {n:'Milk',           e:'🥛',sell:40, cat:'animal'},
  wool:         {n:'Wool',           e:'🧶',sell:55, cat:'animal'},
  // 🔨 Crafted
  warm_meal:    {n:'Warm Meal',      e:'🍲',sell:80, cat:'crafted',consume:true,energyRestore:30},
  hot_cocoa:    {n:'Hot Cocoa',      e:'☕',sell:60, cat:'crafted',consume:true,energyRestore:20},
  crystal_gem:  {n:'Crystal Gem',    e:'✨',sell:500,cat:'crafted'},
  fossil_piece: {n:'Fossil Piece',   e:'🦴',sell:700,cat:'crafted'},
  wool_blanket: {n:'Wool Blanket',   e:'🧣',sell:120,cat:'crafted'},
};

/* ══════════════════════════════════════════════════════════
   3.  CRAFTING RECIPES
══════════════════════════════════════════════════════════ */
const RECIPES=[
  {id:'warm_meal',   n:'Warm Meal',    e:'🍲',desc:'Consume to restore +30 energy.',
   ing:{ice_trout:1,winter_herb:1},    out:'warm_meal',   outQty:1,eff:{type:'energy',val:30}},
  {id:'hot_cocoa',   n:'Hot Cocoa',    e:'☕',desc:'Consume to restore +20 energy.',
   ing:{milk:1,frost_berry:1},         out:'hot_cocoa',   outQty:1,eff:{type:'energy',val:20}},
  {id:'crystal_gem', n:'Crystal Gem',  e:'✨',desc:'Polished gem worth 500g.',
   ing:{crystal:2,coal:1},             out:'crystal_gem', outQty:1,eff:null},
  {id:'fossil_piece',n:'Fossil Piece', e:'🦴',desc:'Museum-quality fossil worth 700g.',
   ing:{fossil:1,iron_ore:2},          out:'fossil_piece',outQty:1,eff:null},
  {id:'wool_blanket',n:'Wool Blanket', e:'🧣',desc:'Adds +20 max fuel capacity.',
   ing:{wool:3},                        out:'wool_blanket',outQty:1,eff:{type:'fuel_max',val:20}},
  {id:'coal_fuel',   n:'Coal Fuel',    e:'🔥',desc:'Immediately adds +50 heating fuel.',
   ing:{coal:3},                        out:null,          outQty:0,eff:{type:'fuel',val:50}},
  {id:'fish_stew',   n:'Fish Stew',    e:'🍜',desc:'Hearty stew — restores +35 energy.',
   ing:{swamp_eel:1,snow_shroom:1},    out:'warm_meal',   outQty:1,eff:{type:'energy',val:35}},
  {id:'iron_pick',   n:'Iron Pickaxe', e:'⛏️',desc:'Upgrade: mine tiles yield 1 extra ore.',
   ing:{iron_ore:4,pine_branch:2},     out:null,          outQty:0,eff:{type:'mine_upgrade',val:1}},
];

/* ══════════════════════════════════════════════════════════
   4.  ANIMAL TYPES
══════════════════════════════════════════════════════════ */
const ANIMALS={
  chicken:{n:'Chicken',e:'🐔',cost:300,feed:10,produce:'egg',  qty:2,desc:'Lays 2 eggs when fed'},
  cow:    {n:'Cow',    e:'🐄',cost:800,feed:25,produce:'milk', qty:1,desc:'Produces 1 milk when fed'},
  sheep:  {n:'Sheep',  e:'🐑',cost:600,feed:20,produce:'wool', qty:1,desc:'Produces 1 wool when fed'},
};

/* ══════════════════════════════════════════════════════════
   5.  SEASONAL EVENTS
══════════════════════════════════════════════════════════ */
const EVENTS=[
  {id:'blizzard',   n:'❄️ Blizzard!',          w:14,
   msg:'A fierce blizzard strikes! You recover 20 less energy tonight.',
   eff:'energy_penalty'},
  {id:'merchant',   n:'🛒 Traveling Merchant',  w:10,
   msg:'A hooded merchant appeared! Visit Winter Hub → Activities.',
   eff:'merchant'},
  {id:'treasure',   n:'💰 Frozen Treasure',     w:8,
   msg:'You found a frozen chest half-buried in the snow!',
   eff:'gold'},
  {id:'aurora',     n:'🌌 Aurora Night',        w:10,
   msg:'Aurora borealis fills the sky — all skills gain bonus XP!',
   eff:'xp_boost'},
  {id:'wolf',       n:'🐺 Wolf Sighting',       w:16,
   msg:'A lone wolf was spotted near the fence. Stay close to home.',
   eff:'atmosphere'},
  {id:'cabin',      n:'🏚️ Abandoned Cabin',     w:8,
   msg:'You found an old cabin! Collected firewood and winter herbs.',
   eff:'forage_gift'},
  {id:'ice_spirit', n:'✨ Ice Spirit',          w:9,
   msg:'A glittering ice spirit visited your farm, leaving crystal gifts!',
   eff:'crystal_gift'},
  {id:'cold_snap',  n:'🥶 Cold Snap',           w:12,
   msg:'Extreme cold tonight! Heating fuel burns 10 extra.',
   eff:'fuel_drain'},
  {id:'mkt_surge',  n:'📈 Market Surge',        w:8,
   msg:'Word of your quality goods spread! All materials sell for +25% today.',
   eff:'price_boost'},
  {id:'snow_hare',  n:'🐇 Snow Hare',           w:5,
   msg:'A snow hare darted across your farm, dropping some wool!',
   eff:'wool_gift'},
];

/* ══════════════════════════════════════════════════════════
   6.  FISHING POOLS (per land)
══════════════════════════════════════════════════════════ */
const FISH_POOLS={
  riverbank:[{t:'ice_trout',w:50},{t:'frozen_carp',w:35},{t:'arctic_perch',w:15}],
  lowland:  [{t:'swamp_eel',w:45},{t:'mudfish',w:40},{t:'cave_bass',w:15}],
  volcanic: [{t:'thermal_pike',w:40},{t:'lava_koi',w:30},{t:'arctic_perch',w:30}],
  home:     [{t:'ice_trout',w:60},{t:'frozen_carp',w:40}],
  meadow:   [{t:'ice_trout',w:55},{t:'mudfish',w:45}],
  hillfarm: [{t:'ice_trout',w:60},{t:'frozen_carp',w:40}],
};

/* ══════════════════════════════════════════════════════════
   7.  MINE POOLS (per land)
══════════════════════════════════════════════════════════ */
const MINE_POOLS={
  hillfarm: [{t:'iron_ore',w:38},{t:'coal',w:33},{t:'gold_ore',w:12},{t:'crystal',w:9},{t:'fossil',w:8}],
  volcanic: [{t:'vol_shard',w:25},{t:'gold_ore',w:22},{t:'crystal',w:22},{t:'coal',w:16},{t:'iron_ore',w:15}],
  _def:     [{t:'iron_ore',w:55},{t:'coal',w:36},{t:'crystal',w:6},{t:'gold_ore',w:3}],
};

/* ══════════════════════════════════════════════════════════
   8.  FORAGE POOLS (per land)
══════════════════════════════════════════════════════════ */
const FORAGE_POOLS={
  meadow:   [{t:'winter_herb',w:40},{t:'pine_branch',w:35},{t:'frost_berry',w:20},{t:'frozen_relic',w:5}],
  riverbank:[{t:'snow_shroom',w:40},{t:'frost_berry',w:35},{t:'winter_herb',w:20},{t:'frozen_relic',w:5}],
  hillfarm: [{t:'pine_branch',w:45},{t:'winter_herb',w:30},{t:'fossil',w:15},{t:'frozen_relic',w:10}],
  lowland:  [{t:'snow_shroom',w:42},{t:'winter_herb',w:38},{t:'frost_berry',w:15},{t:'frozen_relic',w:5}],
  volcanic: [{t:'vol_shard',w:30},{t:'crystal',w:25},{t:'pine_branch',w:30},{t:'frozen_relic',w:15}],
  home:     [{t:'pine_branch',w:40},{t:'winter_herb',w:35},{t:'frost_berry',w:20},{t:'frozen_relic',w:5}],
};

/* ══════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════ */
function isWinter(){return typeof season==='function'&&season()==='Winter';}
function wdata(){if(!G.winter)G.winter={};return G.winter;}
function mats(){if(!G.materials)G.materials={};return G.materials;}

function pickPool(pool){
  const tot=pool.reduce((s,i)=>s+(i.w||1),0);
  let r=Math.random()*tot;
  for(const i of pool){r-=(i.w||1);if(r<=0)return i.t;}
  return pool[pool.length-1].t;
}
function addMat(t,q=1){mats()[t]=(mats()[t]||0)+q;}
function rmMat(t,q=1){mats()[t]=Math.max(0,(mats()[t]||0)-q);if(!mats()[t])delete mats()[t];}
function hasMat(t,q=1){return((mats()[t])||0)>=q;}

function matSellPrice(t){
  const m=MAT[t];if(!m)return 0;
  const boost=wdata().priceBoost?1.25:1;
  return Math.round(m.sell*boost);
}

function sellMat(t,q=1){
  if(!hasMat(t,q)){wToast('Not enough '+MAT[t].n+'!','error');return;}
  const earned=matSellPrice(t)*q;
  rmMat(t,q);G.gold+=earned;G.stats.earned+=earned;G.yearEarned=(G.yearEarned||0)+earned;
  wToast('Sold '+q+'× '+(MAT[t].e)+' '+(MAT[t].n)+' for '+earned+'g! 💰','success');
  if(typeof renderHUD==='function')renderHUD();
  refreshWinterHub();
}

function wToast(msg,type,dur){if(typeof toast==='function')toast(msg,type||'info',dur||2600);}

/* ══════════════════════════════════════════════════════════
   STATE INITIALIZER / MIGRATION
══════════════════════════════════════════════════════════ */
function ensureWinterState(){
  const w=wdata();
  if(w.fuel===undefined)    w.fuel=60;
  if(w.fuelMax===undefined) w.fuelMax=100;
  if(!w.animals)            w.animals={};   // {chicken:2, cow:0}
  if(!w.animalFed)          w.animalFed={}; // {chicken:false}
  if(!w.eventLog)           w.eventLog=[];
  if(w.eventToday===undefined) w.eventToday=null;
  if(w.priceBoost===undefined) w.priceBoost=false;
  if(w.priceDaysLeft===undefined) w.priceDaysLeft=0;
  if(w.merchantDay===undefined) w.merchantDay=-999;
  if(!w.merchantItems)      w.merchantItems=null;
  if(w.mineGrid===undefined) w.mineGrid=null;
  if(w.mineDepth===undefined) w.mineDepth=0;
  if(w.pickUpgrade===undefined) w.pickUpgrade=false;
  if(!w.forage)             w.forage=[];    // [{r,c,type}] placed on farm grid
  mats(); // ensure G.materials exists
}

/* ══════════════════════════════════════════════════════════
   INJECT WINTER CROPS INTO GLOBAL CROPS OBJECT
══════════════════════════════════════════════════════════ */
function injectWinterCrops(){
  if(typeof CROPS==='undefined')return;
  Object.entries(WINTER_CROP_DEFS).forEach(([k,v])=>{
    if(!CROPS[k])CROPS[k]=v;
  });
}

/* ══════════════════════════════════════════════════════════
   INJECT CSS STYLES
══════════════════════════════════════════════════════════ */
function injectStyles(){
  const css=`
/* ─── WINTER HUB OVERLAY ─── */
#winter-hub{display:none;position:fixed;inset:0;z-index:900;background:rgba(0,0,0,.55);
  align-items:flex-end;justify-content:center;backdrop-filter:blur(3px)}
#winter-hub.wh-open{display:flex;animation:wh-in .25s ease}
@keyframes wh-in{from{opacity:0}to{opacity:1}}
.wh-panel{background:var(--ui-bg);border-radius:20px 20px 0 0;width:100%;max-width:540px;
  max-height:88vh;display:flex;flex-direction:column;overflow:hidden;
  border-top:2px solid #7dd3fc;box-shadow:0 -8px 40px rgba(125,211,252,.15)}
body.retro .wh-panel{border-radius:4px 4px 0 0;border-top:3px solid #7dd3fc;background:var(--ui-bg)}
.wh-header{display:flex;align-items:center;justify-content:space-between;
  padding:14px 16px 10px;border-bottom:1.5px solid var(--ui-border);flex-shrink:0}
.wh-title{font-family:'Baloo 2',cursive;font-size:18px;font-weight:800;color:#0369a1}
body.dark .wh-title{color:#7dd3fc}
body.retro .wh-title{font-family:'Press Start 2P',monospace;font-size:10px;color:#7dd3fc}
.wh-close{background:none;border:none;font-size:20px;cursor:pointer;color:var(--text-muted);
  line-height:1;padding:4px 8px;border-radius:8px;transition:background .15s}
.wh-close:hover{background:var(--ui-bg2)}
.wh-tabs{display:flex;gap:4px;padding:8px 12px 0;flex-shrink:0;overflow-x:auto;
  -webkit-overflow-scrolling:touch}
.wh-tab{background:var(--ui-bg2);border:1.5px solid var(--ui-border);color:var(--text-muted);
  font-size:11px;font-weight:700;padding:6px 12px;border-radius:20px;cursor:pointer;
  white-space:nowrap;transition:all .15s;font-family:'Nunito',sans-serif}
.wh-tab.wh-active{background:#e0f2fe;border-color:#7dd3fc;color:#0369a1}
body.dark .wh-tab.wh-active{background:#0c2d48;border-color:#0369a1;color:#7dd3fc}
body.retro .wh-tab{font-family:'Press Start 2P',monospace;font-size:7px;border-radius:3px}
body.retro .wh-tab.wh-active{background:#0c2d48;border-color:#7dd3fc;color:#7dd3fc}
.wh-body{flex:1;overflow-y:auto;padding:12px 14px 20px}
.wh-body::-webkit-scrollbar{width:4px}
.wh-body::-webkit-scrollbar-thumb{background:var(--ui-border);border-radius:4px}

/* ─── FUEL GAUGE (HUD) ─── */
.fuel-hud-pill{display:none}
.wh-fuel-row{display:flex;align-items:center;gap:6px;margin-bottom:10px;
  background:rgba(125,211,252,.08);border:1px solid rgba(125,211,252,.25);
  border-radius:10px;padding:7px 10px}
.fuel-bar-wrap{flex:1;height:7px;background:var(--ui-bg2);border-radius:4px;overflow:hidden;border:1px solid var(--ui-border)}
.fuel-bar-fill{height:100%;border-radius:4px;transition:width .4s;background:linear-gradient(90deg,#f97316,#ef4444)}
.fuel-ok .fuel-bar-fill{background:linear-gradient(90deg,#22c55e,#16a34a)}
.fuel-warn .fuel-bar-fill{background:linear-gradient(90deg,#f59e0b,#d97706)}

/* ─── FISHING MINIGAME ─── */
.fish-scene{text-align:center;padding:10px 0 6px}
.fish-hole{font-size:48px;margin-bottom:4px;animation:fishBob 2s ease-in-out infinite}
@keyframes fishBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-4px)}}
.fish-land-tag{display:inline-block;font-size:10px;font-weight:700;background:#e0f2fe;
  color:#0369a1;border-radius:12px;padding:2px 10px;margin-bottom:8px}
body.dark .fish-land-tag{background:#0c2d48;color:#7dd3fc}
.fish-attempts{font-size:11px;color:var(--text-muted);margin-bottom:10px;font-weight:700}
.fish-bar-wrap{position:relative;height:36px;background:var(--ui-bg2);border-radius:12px;
  overflow:hidden;border:2px solid #7dd3fc;margin:0 4px 10px;cursor:pointer;touch-action:none}
.fish-zone{position:absolute;top:0;height:100%;background:rgba(34,197,94,.25);
  border-left:2px solid #22c55e;border-right:2px solid #22c55e;transition:left .2s}
.fish-indicator{position:absolute;top:50%;transform:translate(-50%,-50%);
  font-size:20px;transition:left .08s linear;pointer-events:none}
.fish-btn{width:100%;padding:12px;border:none;border-radius:12px;font-size:15px;font-weight:800;
  background:linear-gradient(135deg,#0369a1,#0ea5e9);color:#fff;cursor:pointer;
  font-family:'Baloo 2',cursive;transition:transform .1s,box-shadow .1s;
  box-shadow:0 4px 12px rgba(3,105,161,.3)}
.fish-btn:active{transform:scale(.96)}
.fish-result{font-size:28px;text-align:center;margin:6px 0;min-height:40px;animation:fishPop .4s ease}
@keyframes fishPop{from{transform:scale(0.5);opacity:0}to{transform:scale(1);opacity:1}}
.fish-pool-list{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
.fish-pool-item{font-size:11px;background:var(--ui-bg2);border:1px solid var(--ui-border);
  border-radius:8px;padding:4px 8px;color:var(--text-muted)}
.fish-pool-item.rare{border-color:#f59e0b;color:#d97706;background:#fef9c3}
body.dark .fish-pool-item.rare{background:#451a03;border-color:#b45309;color:#fbbf24}

/* ─── MINE GRID ─── */
.mine-info{display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;
  font-size:11px;font-weight:700;color:var(--text-muted)}
.mine-depth{color:#0369a1;font-weight:800}
body.dark .mine-depth{color:#7dd3fc}
.mine-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:5px;margin-bottom:10px}
.mine-tile{aspect-ratio:1;border-radius:10px;border:2px solid var(--ui-border);
  background:var(--ui-bg2);display:flex;align-items:center;justify-content:center;
  font-size:20px;cursor:pointer;transition:transform .12s,box-shadow .12s;
  user-select:none;-webkit-tap-highlight-color:transparent}
.mine-tile:hover:not(.mined){transform:scale(1.06);box-shadow:0 2px 8px rgba(0,0,0,.15)}
.mine-tile.mined{background:transparent;border-color:transparent;cursor:default}
.mine-tile.mined-ore{animation:mineReveal .3s ease}
.mine-tile.empty-rock{background:rgba(0,0,0,.04);cursor:default}
@keyframes mineReveal{from{transform:scale(1.3);opacity:0}to{transform:scale(1);opacity:1}}
.mine-refresh-btn{width:100%;padding:9px;border:none;border-radius:10px;
  background:linear-gradient(135deg,#374151,#1f2937);color:#fff;font-size:12px;
  font-weight:700;cursor:pointer;font-family:'Nunito',sans-serif;margin-top:4px}
.mine-stat-row{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px}
.mine-stat{flex:1;min-width:80px;background:var(--ui-bg2);border:1px solid var(--ui-border);
  border-radius:8px;padding:5px 8px;font-size:10px;font-weight:700;
  color:var(--text-muted);text-align:center}
.mine-stat span{display:block;font-size:14px;color:var(--text-primary)}

/* ─── CRAFTING ─── */
.craft-recipe{background:var(--ui-bg2);border:1.5px solid var(--ui-border);
  border-radius:12px;padding:10px 12px;margin-bottom:8px;transition:border-color .15s}
.craft-recipe.can-craft{border-color:#22c55e}
body.dark .craft-recipe.can-craft{border-color:#16a34a}
.craft-recipe-top{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:4px}
.craft-recipe-name{font-size:13px;font-weight:800;color:var(--text-primary)}
.craft-recipe-desc{font-size:10px;color:var(--text-muted);margin-bottom:6px;line-height:1.4}
.craft-ing{display:flex;flex-wrap:wrap;gap:4px;margin-bottom:6px}
.craft-ing-tag{font-size:10px;padding:2px 7px;border-radius:8px;font-weight:700;
  background:var(--ui-bg);border:1px solid var(--ui-border);color:var(--text-muted)}
.craft-ing-tag.have{border-color:#86efac;color:#16a34a;background:#f0fdf4}
body.dark .craft-ing-tag.have{background:#0d2a14;border-color:#166534;color:#4ade80}
.craft-ing-tag.miss{border-color:#fca5a5;color:#dc2626;background:#fef2f2}
body.dark .craft-ing-tag.miss{background:#2d0a0a;border-color:#991b1b;color:#f87171}
.craft-btn{width:100%;padding:7px;border:none;border-radius:8px;font-size:12px;font-weight:700;
  cursor:pointer;font-family:'Nunito',sans-serif;transition:transform .1s}
.craft-btn:not(:disabled){background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff}
.craft-btn:not(:disabled):active{transform:scale(.97)}
.craft-btn:disabled{background:var(--ui-bg);color:var(--text-muted);cursor:not-allowed;border:1px solid var(--ui-border)}

/* ─── ANIMALS ─── */
.animal-card{background:var(--ui-bg2);border:1.5px solid var(--ui-border);
  border-radius:12px;padding:10px 12px;margin-bottom:8px}
.animal-card.owned{border-color:#86efac}
body.dark .animal-card.owned{border-color:#166534}
.animal-header{display:flex;align-items:center;justify-content:space-between;margin-bottom:4px}
.animal-name{font-size:13px;font-weight:800}
.animal-count{font-size:20px}
.animal-desc{font-size:10px;color:var(--text-muted);margin-bottom:6px}
.animal-btn-row{display:flex;gap:6px}
.animal-btn{flex:1;padding:6px;border:none;border-radius:8px;font-size:11px;font-weight:700;
  cursor:pointer;font-family:'Nunito',sans-serif;transition:background .15s}
.animal-buy-btn{background:#0369a1;color:#fff}
.animal-buy-btn:disabled{background:var(--ui-bg);color:var(--text-muted);cursor:not-allowed;border:1px solid var(--ui-border)}
.animal-feed-btn{background:#16a34a;color:#fff}
.animal-feed-btn:disabled{background:var(--ui-bg2);color:var(--text-muted);cursor:not-allowed;border:1px solid var(--ui-border)}
.animal-fed-badge{display:inline-block;background:#dcfce7;color:#16a34a;font-size:9px;
  font-weight:700;border-radius:8px;padding:2px 7px;border:1px solid #86efac}
body.dark .animal-fed-badge{background:#0d2a14;border-color:#166534;color:#4ade80}

/* ─── ACTIVITIES (Forage / Events) ─── */
.w-section-hd{font-size:11px;font-weight:800;color:#0369a1;text-transform:uppercase;
  letter-spacing:.6px;margin:12px 0 6px;padding-bottom:4px;border-bottom:1.5px solid #e0f2fe}
body.dark .w-section-hd{color:#7dd3fc;border-color:#0c2d48}
body.retro .w-section-hd{color:#7dd3fc;font-family:'Press Start 2P',monospace;font-size:7px}
.w-event-card{background:linear-gradient(135deg,rgba(125,211,252,.08),rgba(99,102,241,.06));
  border:1.5px solid #bae6fd;border-radius:12px;padding:10px 12px;margin-bottom:8px}
body.dark .w-event-card{background:rgba(12,45,72,.4);border-color:#0369a1}
.w-event-name{font-size:13px;font-weight:800;color:var(--text-primary);margin-bottom:3px}
.w-event-msg{font-size:11px;color:var(--text-muted);line-height:1.45}

/* ─── MATERIALS INVENTORY ─── */
.mat-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(90px,1fr));gap:6px;margin-bottom:8px}
.mat-card{background:var(--ui-bg2);border:1.5px solid var(--ui-border);border-radius:10px;
  padding:6px 8px;text-align:center;font-size:10px;font-weight:700;color:var(--text-muted)}
.mat-card-em{font-size:20px;display:block;margin-bottom:2px}
.mat-card-name{color:var(--text-primary);font-size:10px;margin-bottom:2px}
.mat-card.rare-mat{border-color:#f59e0b}
.mat-sell-btn{display:block;width:100%;margin-top:4px;padding:3px;background:#0369a1;color:#fff;
  border:none;border-radius:6px;font-size:9px;font-weight:700;cursor:pointer;font-family:'Nunito',sans-serif}
body.dark .mat-sell-btn{background:#0284c7}

/* ─── MERCHANT ─── */
.merchant-item{background:linear-gradient(135deg,rgba(245,158,11,.08),rgba(239,68,68,.06));
  border:1.5px solid #fcd34d;border-radius:12px;padding:10px 12px;margin-bottom:8px;
  display:flex;justify-content:space-between;align-items:center;gap:8px}
body.dark .merchant-item{background:rgba(69,26,3,.4);border-color:#b45309}
.merchant-buy-btn{background:#f59e0b;color:#fff;border:none;border-radius:8px;padding:6px 12px;
  font-size:11px;font-weight:700;cursor:pointer;font-family:'Nunito',sans-serif;flex-shrink:0}
.merchant-buy-btn:disabled{background:var(--ui-bg2);color:var(--text-muted);cursor:not-allowed;border:1px solid var(--ui-border)}

/* ─── WINTER TOOLBAR BUTTON ─── */
#winter-hub-btn{display:none;background:linear-gradient(135deg,#0369a1,#0ea5e9);
  color:#fff;border:none;padding:8px 14px;border-radius:10px;font-size:13px;font-weight:800;
  cursor:pointer;font-family:'Baloo 2',cursive;box-shadow:0 2px 10px rgba(3,105,161,.3);
  white-space:nowrap;animation:winterPulse 2.5s ease-in-out infinite}
@keyframes winterPulse{0%,100%{box-shadow:0 2px 10px rgba(3,105,161,.3)}50%{box-shadow:0 2px 20px rgba(3,105,161,.55)}}
body.retro #winter-hub-btn{font-family:'Press Start 2P',monospace;font-size:7px;border-radius:3px}

/* ─── FORAGE TILE GLOW ─── */
.forage-tile{animation:forageGlow 1.8s ease-in-out infinite;cursor:pointer}
@keyframes forageGlow{0%,100%{filter:drop-shadow(0 0 4px rgba(125,211,252,.6))}50%{filter:drop-shadow(0 0 10px rgba(125,211,252,.9))}}

/* ─── AURORA OVERLAY ─── */
#aurora-overlay{display:none;position:fixed;inset:0;pointer-events:none;z-index:50;
  background:linear-gradient(180deg,rgba(16,185,129,.12) 0%,rgba(99,102,241,.08) 40%,transparent 70%);
  animation:auroraWave 8s ease-in-out infinite}
#aurora-overlay.aurora-on{display:block}
@keyframes auroraWave{0%,100%{opacity:.6;transform:scaleX(1)}50%{opacity:1;transform:scaleX(1.05)}}

/* ─── WINTER BG SNOWFLAKES ─── */
#snow-layer{display:none;position:fixed;inset:0;pointer-events:none;z-index:45;overflow:hidden}
#snow-layer.snow-on{display:block}

/* ─── WINTER COMPACT FUEL IN INV ─── */
.winter-fuel-block{background:linear-gradient(135deg,rgba(14,165,233,.08),rgba(99,102,241,.06));
  border:1.5px solid #7dd3fc;border-radius:12px;padding:10px 12px;margin-bottom:8px}
body.dark .winter-fuel-block{background:rgba(12,45,72,.5)}
.wfb-row{display:flex;align-items:center;gap:8px;margin-bottom:6px}
.wfb-label{font-size:11px;font-weight:800;color:#0369a1}
body.dark .wfb-label{color:#7dd3fc}
.wfb-val{font-size:11px;color:var(--text-muted);margin-left:auto}
.wfb-bar{flex:1;height:8px;background:var(--ui-bg2);border-radius:4px;overflow:hidden;border:1px solid var(--ui-border);max-width:120px}
.wfb-fill{height:100%;border-radius:4px;transition:width .4s,background .4s}
.wfb-tip{font-size:10px;color:var(--text-muted);line-height:1.4}
.wfb-add-btn{margin-top:6px;width:100%;padding:6px;border:none;border-radius:8px;
  background:#0369a1;color:#fff;font-size:11px;font-weight:700;cursor:pointer;font-family:'Nunito',sans-serif}
`;
  const el=document.createElement('style');
  el.id='winter-styles';
  el.textContent=css;
  document.head.appendChild(el);
}

/* ══════════════════════════════════════════════════════════
   INJECT HTML OVERLAYS
══════════════════════════════════════════════════════════ */
function injectHTML(){
  // Aurora
  const aurora=document.createElement('div');
  aurora.id='aurora-overlay';
  document.body.appendChild(aurora);

  // Snow layer (for dense snowflake effects)
  const snow=document.createElement('div');
  snow.id='snow-layer';
  document.body.appendChild(snow);

  // Winter Hub Modal
  const hub=document.createElement('div');
  hub.id='winter-hub';
  hub.innerHTML=`
  <div class="wh-panel" id="wh-panel">
    <div class="wh-header">
      <div class="wh-title">❄️ Winter Hub</div>
      <button class="wh-close" onclick="closeWinterHub()">✕</button>
    </div>
    <div class="wh-tabs" id="wh-tabs">
      <button class="wh-tab wh-active" onclick="setWHTab('fishing')" id="wht-fishing">🎣 Fishing</button>
      <button class="wh-tab" onclick="setWHTab('mining')" id="wht-mining">⛏️ Mining</button>
      <button class="wh-tab" onclick="setWHTab('crafting')" id="wht-crafting">🔨 Crafting</button>
      <button class="wh-tab" onclick="setWHTab('animals')" id="wht-animals">🐄 Animals</button>
      <button class="wh-tab" onclick="setWHTab('activities')" id="wht-activities">📋 Events</button>
      <button class="wh-tab" onclick="setWHTab('materials')" id="wht-materials">🎒 Stash</button>
    </div>
    <div class="wh-body" id="wh-body"></div>
  </div>`;
  hub.addEventListener('click',e=>{if(e.target===hub)closeWinterHub();});
  document.body.appendChild(hub);

  // Winter Hub Button in toolbar
  const toolbar=document.getElementById('toolbar');
  if(toolbar){
    const btn=document.createElement('button');
    btn.id='winter-hub-btn';
    btn.textContent='❄️ Winter Hub';
    btn.onclick=openWinterHub;
    // Insert before the spacer or at start
    const spacer=toolbar.querySelector('.spacer');
    if(spacer)toolbar.insertBefore(btn,spacer);
    else toolbar.prepend(btn);
  }
}

/* ══════════════════════════════════════════════════════════
   WINTER HUB UI CONTROLLER
══════════════════════════════════════════════════════════ */
let _whTab='fishing';

window.openWinterHub=function(){
  if(!isWinter()){wToast('❄️ The Winter Hub opens in Winter!','info');return;}
  ensureWinterState();
  document.getElementById('winter-hub').classList.add('wh-open');
  setWHTab(_whTab);
};
window.closeWinterHub=function(){
  document.getElementById('winter-hub').classList.remove('wh-open');
};
window.setWHTab=function(tab){
  _whTab=tab;
  document.querySelectorAll('.wh-tab').forEach(b=>b.classList.remove('wh-active'));
  const active=document.getElementById('wht-'+tab);
  if(active)active.classList.add('wh-active');
  renderWHContent(tab);
};

function refreshWinterHub(){
  if(document.getElementById('winter-hub').classList.contains('wh-open')){
    renderWHContent(_whTab);
  }
}

function renderWHContent(tab){
  const body=document.getElementById('wh-body');
  if(!body)return;
  if(tab==='fishing') body.innerHTML=buildFishingTab();
  else if(tab==='mining')   body.innerHTML=buildMiningTab();
  else if(tab==='crafting') body.innerHTML=buildCraftingTab();
  else if(tab==='animals')  body.innerHTML=buildAnimalsTab();
  else if(tab==='activities')body.innerHTML=buildActivitiesTab();
  else if(tab==='materials') body.innerHTML=buildMaterialsTab();
  // Bind interactive elements after render
  bindMineClicks();
  bindFishBar();
  bindSellBtns();
}

/* ══════════════════════════════════════════════════════════
   🎣 FISHING TAB
══════════════════════════════════════════════════════════ */
let _fishState={active:false,pos:0,dir:1,speed:1.2,zone:{start:0.35,end:0.65},
  timer:null,attempts:3,result:''};

function buildFishingTab(){
  const land=G.currentLand||'home';
  const pool=FISH_POOLS[land]||FISH_POOLS.home;
  const landName=(typeof LAND_TERRAIN!=='undefined'&&LAND_TERRAIN[land])||{label:'Home Farm',icon:'🏡'};
  const energyCost=4;

  let h=`<div class="fish-scene">
    <div class="fish-hole">🧊</div>
    <div class="fish-land-tag">${landName.icon} ${landName.label} — Ice Fishing</div>
    <div class="fish-attempts" id="fish-attempts">Attempts left: <b>${_fishState.attempts}</b> · Costs ${energyCost}⚡ each</div>
    <div style="font-size:11px;color:var(--text-muted);margin-bottom:8px">Tap the bar when 🪝 is in the green zone!</div>
    <div class="fish-bar-wrap" id="fish-bar-wrap">
      <div class="fish-zone" id="fish-zone" style="left:${_fishState.zone.start*100}%;width:${(_fishState.zone.end-_fishState.zone.start)*100}%"></div>
      <div class="fish-indicator" id="fish-indicator" style="left:${_fishState.pos*100}%">🪝</div>
    </div>
    <div class="fish-result" id="fish-result">${_fishState.result}</div>
    <button class="fish-btn" id="fish-cast-btn" onclick="doFishCast(${energyCost})">
      ${_fishState.attempts>0?'🎣 Cast Line!':'😔 Out of attempts — sleep to reset'}
    </button>
  </div>
  <div class="w-section-hd" style="margin-top:12px">Possible Catch at this location</div>
  <div class="fish-pool-list">`;

  pool.forEach(p=>{
    const m=MAT[p.t];
    if(!m)return;
    const isRare=m.rare;
    h+=`<div class="fish-pool-item${isRare?' rare':''}">${m.e} ${m.n} · ${m.sell}g${isRare?' ⭐':''}</div>`;
  });
  h+=`</div>`;

  // Show fish in stash
  const fishInStash=Object.entries(mats()).filter(([k])=>MAT[k]&&MAT[k].cat==='fish');
  if(fishInStash.length){
    h+=`<div class="w-section-hd" style="margin-top:12px">Fish in Stash</div>
    <div class="mat-grid">`;
    fishInStash.forEach(([k,q])=>{
      const m=MAT[k];
      const price=matSellPrice(k);
      h+=`<div class="mat-card${m.rare?' rare-mat':''}">
        <span class="mat-card-em">${m.e}</span>
        <div class="mat-card-name">${m.n}</div>
        <div>×${q}</div>
        <button class="mat-sell-btn" data-sell-mat="${k}" data-sell-qty="1">Sell 1 · ${price}g</button>
      </div>`;
    });
    h+=`</div>`;
  }
  return h;
}

function bindFishBar(){
  const wrap=document.getElementById('fish-bar-wrap');
  if(!wrap)return;
  wrap.addEventListener('click',()=>checkFishCatch());
  wrap.addEventListener('touchstart',e=>{e.preventDefault();checkFishCatch();},{passive:false});
}

window.doFishCast=function(energyCost){
  if(!isWinter()){wToast('❄️ Ice fishing only in Winter!','info');return;}
  if(_fishState.attempts<=0){wToast('No attempts left! Sleep to reset.','warn');return;}
  if(G.energy<energyCost){wToast('Not enough energy!','error');return;}
  if(_fishState.active)return;

  G.energy=Math.max(0,G.energy-(S.energyCost?energyCost:0));
  _fishState.attempts--;
  _fishState.active=true;
  _fishState.pos=Math.random();
  _fishState.dir=Math.random()>0.5?1:-1;
  _fishState.speed=0.8+Math.random()*1.4;
  // Randomize zone
  const zw=0.18+Math.random()*0.18;
  const zs=Math.random()*(0.85-zw);
  _fishState.zone={start:zs,end:zs+zw};
  _fishState.result='';

  const fz=document.getElementById('fish-zone');
  const fi=document.getElementById('fish-indicator');
  const attEl=document.getElementById('fish-attempts');
  const btn=document.getElementById('fish-cast-btn');
  if(fz)fz.style.cssText=`left:${_fishState.zone.start*100}%;width:${(_fishState.zone.end-_fishState.zone.start)*100}%`;
  if(btn)btn.disabled=true;
  if(attEl)attEl.innerHTML=`Attempts left: <b>${_fishState.attempts}</b> · Now — CATCH IT!`;

  clearInterval(_fishState.timer);
  _fishState.timer=setInterval(()=>{
    _fishState.pos+=_fishState.dir*_fishState.speed*0.018;
    if(_fishState.pos>=1){_fishState.pos=1;_fishState.dir=-1;}
    if(_fishState.pos<=0){_fishState.pos=0;_fishState.dir=1;}
    // small random jitter
    _fishState.speed+=((Math.random()-0.5)*0.08);
    _fishState.speed=Math.max(0.6,Math.min(2.2,_fishState.speed));
    if(fi)fi.style.left=((_fishState.pos)*100)+'%';
  },40);

  // Auto-fail after 4 seconds
  setTimeout(()=>{
    if(_fishState.active){
      _fishState.active=false;
      clearInterval(_fishState.timer);
      _fishState.result='💨 Got away!';
      if(typeof renderHUD==='function')renderHUD();
      renderWHContent('fishing');
    }
  },4000);
};

function checkFishCatch(){
  if(!_fishState.active)return;
  _fishState.active=false;
  clearInterval(_fishState.timer);

  const hit=_fishState.pos>=_fishState.zone.start&&_fishState.pos<=_fishState.zone.end;
  const res=document.getElementById('fish-result');
  if(hit){
    const land=G.currentLand||'home';
    const pool=FISH_POOLS[land]||FISH_POOLS.home;
    const caught=pickPool(pool);
    addMat(caught,1);
    const m=MAT[caught];
    _fishState.result=`${m.e} Caught ${m.n}! (+${m.sell}g value)`;
    if(typeof snd==='function')snd('harvest');
    wToast(`🎣 Caught ${m.e} ${m.n}!`,'success',2400);
    if(typeof addXP==='function')addXP('harvesting',8);
  } else {
    _fishState.result='💨 Missed! Try again.';
    if(typeof snd==='function')snd('error');
  }
  if(res)res.textContent=_fishState.result;
  if(typeof renderHUD==='function')renderHUD();
  setTimeout(()=>renderWHContent('fishing'),600);
}

/* ══════════════════════════════════════════════════════════
   ⛏️ MINING TAB
══════════════════════════════════════════════════════════ */
const MINE_ROWS=4,MINE_COLS=5;

function genMineGrid(land){
  const pool=MINE_POOLS[land]||MINE_POOLS._def;
  const grid=[];
  for(let r=0;r<MINE_ROWS;r++){
    const row=[];
    for(let c=0;c<MINE_COLS;c++){
      // 60% chance of ore, 40% empty rock
      const hasOre=Math.random()<0.62;
      row.push({type:hasOre?pickPool(pool):null,mined:false});
    }
    grid.push(row);
  }
  return grid;
}

function buildMiningTab(){
  const land=G.currentLand||'home';
  const w=wdata();
  const canMine=['hillfarm','volcanic','home','meadow','riverbank','lowland'].includes(land);
  const energyCost=3;

  if(!canMine)return`<div style="text-align:center;padding:24px;font-size:13px;color:var(--text-muted)">
    ⛏️ No cave access at this location. Travel to Hill Farm or Volcanic Ridge for the best ore!</div>`;

  if(!w.mineGrid||w.mineGrid.every(row=>row.every(t=>t.mined))){
    w.mineGrid=genMineGrid(land);
    w.mineDepth=(w.mineDepth||0)+1;
  }

  const grid=w.mineGrid;
  const remaining=grid.flat().filter(t=>!t.mined).length;
  const landLabel=(typeof LAND_TERRAIN!=='undefined'&&LAND_TERRAIN[land])||{label:'Farm',icon:'⛏️'};
  const bonusNote=w.mineBonus?'<span style="color:#22c55e;font-weight:700"> ✨ Ice Spirit Bonus!</span>':'';

  let h=`<div class="mine-info">
    <span class="mine-depth">⛏️ Depth ${w.mineDepth||1} · ${landLabel.icon} ${landLabel.label}</span>
    <span>${remaining}/${MINE_ROWS*MINE_COLS} tiles · ${energyCost}⚡ each${bonusNote}</span>
  </div>`;

  h+=`<div class="mine-stat-row">`;
  // Quick summary of ore in stash
  ['iron_ore','coal','gold_ore','crystal','vol_shard','fossil'].forEach(k=>{
    const q=mats()[k]||0;
    if(q>0||['iron_ore','coal'].includes(k)){
      const m=MAT[k];
      h+=`<div class="mine-stat">${m.e}<span>${q}</span>${m.n.split(' ')[0]}</div>`;
    }
  });
  h+=`</div>`;

  h+=`<div class="mine-grid">`;
  grid.forEach((row,r)=>{
    row.forEach((tile,c)=>{
      if(tile.mined){
        const em=tile.type?MAT[tile.type]?.e||'🪨':'·';
        h+=`<div class="mine-tile mined${tile.type?' mined-ore':' empty-rock'}">${em}</div>`;
      } else {
        h+=`<div class="mine-tile" data-mine-r="${r}" data-mine-c="${c}">🪨</div>`;
      }
    });
  });
  h+=`</div>`;

  h+=`<div style="font-size:10px;color:var(--text-muted);text-align:center;margin-bottom:8px">
    Tap a rock to mine it (costs ${energyCost}⚡). Ore goes to your Stash.</div>`;

  if(remaining===0){
    h+=`<button class="mine-refresh-btn" onclick="refreshMineGrid()">⛏️ Dig Deeper (new grid)</button>`;
  }

  // Show mineable ores in stash
  const oresInStash=Object.entries(mats()).filter(([k])=>MAT[k]&&['ore','gem','artifact','fuel'].includes(MAT[k].cat));
  if(oresInStash.length){
    h+=`<div class="w-section-hd" style="margin-top:12px">Ore & Gems in Stash</div>
    <div class="mat-grid">`;
    oresInStash.forEach(([k,q])=>{
      const m=MAT[k];if(!m)return;
      const price=matSellPrice(k);
      h+=`<div class="mat-card${m.rare?' rare-mat':''}">
        <span class="mat-card-em">${m.e}</span>
        <div class="mat-card-name">${m.n}</div>
        <div>×${q}</div>
        <button class="mat-sell-btn" data-sell-mat="${k}" data-sell-qty="1">Sell 1 · ${price}g</button>
      </div>`;
    });
    h+=`</div>`;
  }
  return h;
}

function bindMineClicks(){
  document.querySelectorAll('[data-mine-r]').forEach(el=>{
    el.addEventListener('click',()=>{
      const r=parseInt(el.dataset.mineR);
      const c=parseInt(el.dataset.mineC);
      doMineTile(r,c);
    });
  });
}

window.refreshMineGrid=function(){
  wdata().mineGrid=null;
  renderWHContent('mining');
};

function doMineTile(r,c){
  const w=wdata();
  if(!w.mineGrid||!w.mineGrid[r]||w.mineGrid[r][c].mined)return;
  const cost=3;
  if(G.energy<cost&&S.energyCost){wToast('Need '+cost+' energy!','error');return;}
  if(S.energyCost)G.energy=Math.max(0,G.energy-cost);
  const tile=w.mineGrid[r][c];
  tile.mined=true;
  if(tile.type){
    const qty=(w.pickUpgrade&&Math.random()<0.35)?2:1;
    const extraBonus=w.mineBonus&&Math.random()<0.3?1:0;
    const total=qty+extraBonus;
    addMat(tile.type,total);
    const m=MAT[tile.type];
    if(typeof snd==='function')snd('till');
    wToast(`⛏️ Found ${m.e} ${m.n}${total>1?' ×'+total:''}!`,m.rare?'success':'info',1800);
    if(typeof addXP==='function')addXP('farming',6);
  } else {
    if(typeof snd==='function')snd('till');
  }
  if(typeof renderHUD==='function')renderHUD();
  renderWHContent('mining');
}

/* ══════════════════════════════════════════════════════════
   🔨 CRAFTING TAB
══════════════════════════════════════════════════════════ */
function buildCraftingTab(){
  let h=`<div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;line-height:1.5">
    Combine materials from fishing, mining, foraging & animals to craft useful items and consumables!</div>`;

  RECIPES.forEach(recipe=>{
    const canCraft=Object.entries(recipe.ing).every(([t,q])=>hasMat(t,q));
    h+=`<div class="craft-recipe${canCraft?' can-craft':''}">
      <div class="craft-recipe-top">
        <div class="craft-recipe-name">${recipe.e} ${recipe.n}</div>
        ${recipe.out?`<div style="font-size:10px;color:var(--text-muted)">${MAT[recipe.out]?matSellPrice(recipe.out)+'g':'—'}</div>`:''}
      </div>
      <div class="craft-recipe-desc">${recipe.desc}</div>
      <div class="craft-ing">`;
    Object.entries(recipe.ing).forEach(([t,q])=>{
      const m=MAT[t];if(!m)return;
      const have=hasMat(t,q);
      const owned=(mats()[t]||0);
      h+=`<div class="craft-ing-tag ${have?'have':'miss'}">${m.e} ${m.n} ×${q} (have ${owned})</div>`;
    });
    h+=`</div>
      <button class="craft-btn" data-craft="${recipe.id}" ${canCraft?'':'disabled'}>
        ${canCraft?`🔨 Craft ${recipe.e} ${recipe.n}`:'Missing ingredients'}
      </button>
    </div>`;
  });
  return h;
}

document.addEventListener('click',e=>{
  const craftBtn=e.target.closest('[data-craft]');
  if(craftBtn)doCraft(craftBtn.dataset.craft);
});

function doCraft(recipeId){
  const recipe=RECIPES.find(r=>r.id===recipeId);
  if(!recipe)return;
  const canCraft=Object.entries(recipe.ing).every(([t,q])=>hasMat(t,q));
  if(!canCraft){wToast('Missing ingredients!','error');return;}
  // Deduct ingredients
  Object.entries(recipe.ing).forEach(([t,q])=>rmMat(t,q));
  // Apply effect
  const eff=recipe.eff;
  if(eff){
    if(eff.type==='energy'){
      G.energy=Math.min(maxEnergy(),G.energy+eff.val);
      wToast(`${recipe.e} Used! Restored +${eff.val} energy ⚡`,'success');
      if(typeof renderHUD==='function')renderHUD();
    } else if(eff.type==='fuel'){
      const w=wdata();
      w.fuel=Math.min(w.fuelMax,w.fuel+eff.val);
      wToast(`🔥 Added +${eff.val} heating fuel!`,'success');
    } else if(eff.type==='fuel_max'){
      wdata().fuelMax=(wdata().fuelMax||100)+eff.val;
      wToast(`🧣 Max fuel capacity increased to ${wdata().fuelMax}!`,'success');
    } else if(eff.type==='mine_upgrade'){
      wdata().pickUpgrade=true;
      wToast('⛏️ Iron Pickaxe crafted! Mining yields +1 ore chance!','success',3500);
    }
  }
  // Add output item
  if(recipe.out&&recipe.outQty>0){
    addMat(recipe.out,recipe.outQty);
    const m=MAT[recipe.out];
    if(m&&!eff){
      wToast(`🔨 Crafted ${m.e} ${m.n}! (${matSellPrice(recipe.out)}g)`,'success');
    }
  }
  if(typeof snd==='function')snd('levelup');
  refreshWinterHub();
}

/* ══════════════════════════════════════════════════════════
   🐄 ANIMALS TAB
══════════════════════════════════════════════════════════ */
function buildAnimalsTab(){
  const w=wdata();
  let h=`<div style="font-size:11px;color:var(--text-muted);margin-bottom:10px;line-height:1.5">
    Buy animals to produce resources daily. Feed them each morning to earn produce!</div>`;

  // Heating note if fuel low
  if(w.fuel<25){
    h+=`<div style="background:#fef2f2;border:1.5px solid #fca5a5;border-radius:10px;padding:8px 10px;
      font-size:11px;font-weight:700;color:#dc2626;margin-bottom:10px">
      🥶 Fuel is low — animals may not produce if heating fails!</div>`;
  }

  Object.entries(ANIMALS).forEach(([k,a])=>{
    const count=w.animals[k]||0;
    const fed=w.animalFed[k]||false;
    const canBuy=G.gold>=a.cost;
    h+=`<div class="animal-card${count>0?' owned':''}">
      <div class="animal-header">
        <div class="animal-name">${a.e} ${a.n}</div>
        <div class="animal-count">${count>0?'×'.repeat(count):''}</div>
      </div>
      <div class="animal-desc">${a.desc} · Costs ${a.feed}g/day to feed</div>
      ${count>0&&fed?`<div class="animal-fed-badge">✓ Fed today</div>`:
        count>0?`<div style="font-size:10px;color:#dc2626;font-weight:700">😔 Not fed today — no produce!</div>`:''}
      <div class="animal-btn-row" style="margin-top:8px">
        <button class="animal-btn animal-buy-btn" data-buy-animal="${k}" ${canBuy?'':'disabled'}>
          ${count>0?`Buy More · ${a.cost}g`:`Buy ${a.e} · ${a.cost}g`}
        </button>
        ${count>0?`<button class="animal-btn animal-feed-btn" data-feed-animal="${k}" ${fed||G.gold<a.feed?'disabled':''}>
          ${fed?'✓ Fed':'Feed · '+a.feed+'g'}
        </button>`:''}
      </div>
    </div>`;
  });

  // Animal products in stash
  const prodInStash=Object.entries(mats()).filter(([k])=>MAT[k]&&MAT[k].cat==='animal');
  if(prodInStash.length){
    h+=`<div class="w-section-hd" style="margin-top:12px">Animal Products in Stash</div>
    <div class="mat-grid">`;
    prodInStash.forEach(([k,q])=>{
      const m=MAT[k];if(!m)return;
      const price=matSellPrice(k);
      h+=`<div class="mat-card">
        <span class="mat-card-em">${m.e}</span>
        <div class="mat-card-name">${m.n}</div>
        <div>×${q}</div>
        <button class="mat-sell-btn" data-sell-mat="${k}" data-sell-qty="1">Sell 1 · ${price}g</button>
      </div>`;
    });
    h+=`</div>`;
  }
  return h;
}

document.addEventListener('click',e=>{
  const buyBtn=e.target.closest('[data-buy-animal]');
  if(buyBtn)doBuyAnimal(buyBtn.dataset.buyAnimal);
  const feedBtn=e.target.closest('[data-feed-animal]');
  if(feedBtn)doFeedAnimal(feedBtn.dataset.feedAnimal);
});

function doBuyAnimal(k){
  const a=ANIMALS[k];if(!a)return;
  if(G.gold<a.cost){wToast('Need '+a.cost+'g!','error');return;}
  G.gold-=a.cost;
  const w=wdata();
  w.animals[k]=(w.animals[k]||0)+1;
  if(typeof snd==='function')snd('buy');
  wToast(`${a.e} ${a.n} purchased! Feed them daily for produce.`,'success',3000);
  if(typeof renderHUD==='function')renderHUD();
  refreshWinterHub();
}
function doFeedAnimal(k){
  const a=ANIMALS[k];if(!a)return;
  if(G.gold<a.feed){wToast('Need '+a.feed+'g to feed!','error');return;}
  G.gold-=a.feed;
  wdata().animalFed[k]=true;
  if(typeof snd==='function')snd('buy');
  wToast(`🌾 ${ANIMALS[k].e} ${ANIMALS[k].n} fed! They'll produce tomorrow.`,'success',2200);
  if(typeof renderHUD==='function')renderHUD();
  refreshWinterHub();
}

/* ══════════════════════════════════════════════════════════
   📋 ACTIVITIES / EVENTS TAB
══════════════════════════════════════════════════════════ */
function buildActivitiesTab(){
  const w=wdata();
  let h='';

  // Fuel block
  const pct=Math.round((w.fuel/(w.fuelMax||100))*100);
  const fuelColor=pct>50?'#22c55e':pct>25?'#f59e0b':'#ef4444';
  h+=`<div class="w-section-hd">🔥 Winter Heating</div>
  <div class="winter-fuel-block">
    <div class="wfb-row">
      <span class="wfb-label">🔥 Fuel</span>
      <div class="wfb-bar" style="flex:1;height:8px;background:var(--ui-bg2);border-radius:4px;overflow:hidden;border:1px solid var(--ui-border);margin:0 8px">
        <div class="wfb-fill" style="width:${pct}%;background:${fuelColor}"></div>
      </div>
      <span class="wfb-val">${w.fuel}/${w.fuelMax||100}</span>
    </div>
    <div class="wfb-tip">Fuel depletes ${w.fuelDrain||5}/day. Below 20: energy penalty! Craft Coal Fuel to refill.
    ${(mats().coal||0)>0?`<br>💡 You have ${mats().coal||0} coal — craft Coal Fuel in Crafting tab!`:''}</div>
  </div>`;

  // Today's event
  if(w.eventToday){
    const ev=EVENTS.find(e=>e.id===w.eventToday);
    if(ev){
      h+=`<div class="w-section-hd">Today's Event</div>
      <div class="w-event-card">
        <div class="w-event-name">${ev.n}</div>
        <div class="w-event-msg">${ev.msg}</div>
      </div>`;
    }
  }

  // Merchant stock
  if(w.merchantDay===G.day&&w.merchantItems&&w.merchantItems.length){
    h+=`<div class="w-section-hd">🛒 Traveling Merchant</div>`;
    w.merchantItems.forEach((item,idx)=>{
      const m=MAT[item.type];if(!m)return;
      h+=`<div class="merchant-item">
        <div>
          <div style="font-size:14px;font-weight:800">${m.e} ${m.n}</div>
          <div style="font-size:10px;color:var(--text-muted)">×${item.qty} offered</div>
        </div>
        <button class="merchant-buy-btn" data-merch="${idx}" ${G.gold>=item.price?'':'disabled'}>
          Buy · ${item.price}g
        </button>
      </div>`;
    });
  }

  // Forageables on current farm
  h+=`<div class="w-section-hd" style="margin-top:12px">🌿 Forage (collect on farm grid)</div>`;
  const forageOnFarm=w.forage&&w.forage.filter(f=>!f.collected&&f.land===(G.currentLand||'home'));
  if(forageOnFarm&&forageOnFarm.length){
    h+=`<div style="font-size:11px;color:var(--text-muted);margin-bottom:6px">Glowing items on your farm grid — tap them to collect!</div>`;
    forageOnFarm.forEach(f=>{
      const m=MAT[f.type];if(!m)return;
      h+=`<div style="font-size:11px;font-weight:700;color:var(--text-primary);margin-bottom:3px">${m.e} ${m.n} at row ${f.r+1}, col ${f.c+1} · ${m.sell}g</div>`;
    });
  } else {
    h+=`<div style="font-size:11px;color:var(--text-muted)">No forage items right now. Sleep to find new ones each morning!</div>`;
  }

  // Event log
  if(w.eventLog&&w.eventLog.length){
    h+=`<div class="w-section-hd" style="margin-top:12px">Recent Events</div>`;
    w.eventLog.slice(-5).reverse().forEach(entry=>{
      h+=`<div style="font-size:11px;color:var(--text-muted);margin-bottom:4px;border-bottom:1px solid var(--ui-border);padding-bottom:4px">
        <b style="color:var(--text-primary)">Day ${entry.day}:</b> ${entry.n} — ${entry.msg.substring(0,60)}${entry.msg.length>60?'…':''}</div>`;
    });
  }
  return h;
}

document.addEventListener('click',e=>{
  const mb=e.target.closest('[data-merch]');
  if(mb)doMerchantBuy(parseInt(mb.dataset.merch));
});
function doMerchantBuy(idx){
  const w=wdata();
  const item=w.merchantItems&&w.merchantItems[idx];
  if(!item)return;
  if(G.gold<item.price){wToast('Need '+item.price+'g!','error');return;}
  G.gold-=item.price;
  addMat(item.type,item.qty);
  w.merchantItems.splice(idx,1);
  if(typeof snd==='function')snd('buy');
  const m=MAT[item.type];
  wToast(`Bought ${m.e} ${m.n} ×${item.qty} from merchant!`,'success',2600);
  if(typeof renderHUD==='function')renderHUD();
  refreshWinterHub();
}

/* ══════════════════════════════════════════════════════════
   🎒 MATERIALS STASH TAB
══════════════════════════════════════════════════════════ */
function buildMaterialsTab(){
  const allMats=Object.entries(mats()).filter(([,q])=>q>0);
  if(!allMats.length){
    return`<div style="text-align:center;padding:24px;font-size:13px;color:var(--text-muted)">
      Your stash is empty! Go fishing, mining, or foraging to fill it up.</div>`;
  }
  const cats={fish:'🐟 Fish',ore:'⛏️ Ore',gem:'💎 Gems',artifact:'🏺 Artifacts',
    herb:'🌿 Herbs',wood:'🪵 Wood',fuel:'🔥 Fuel',animal:'🐄 Animal Products',crafted:'🔨 Crafted'};
  let h='';
  Object.entries(cats).forEach(([cat,label])=>{
    const catMats=allMats.filter(([k])=>MAT[k]&&MAT[k].cat===cat);
    if(!catMats.length)return;
    h+=`<div class="w-section-hd">${label}</div>
    <div class="mat-grid">`;
    catMats.forEach(([k,q])=>{
      const m=MAT[k];if(!m)return;
      const price=matSellPrice(k);
      const isConsume=m.consume;
      h+=`<div class="mat-card${m.rare?' rare-mat':''}">
        <span class="mat-card-em">${m.e}</span>
        <div class="mat-card-name">${m.n}</div>
        <div>×${q}</div>
        ${isConsume
          ?`<button class="mat-sell-btn" style="background:#16a34a" data-consume-mat="${k}">Use (+${m.energyRestore}⚡)</button>`
          :`<button class="mat-sell-btn" data-sell-mat="${k}" data-sell-qty="1">Sell 1 · ${price}g</button>`
        }
      </div>`;
    });
    h+=`</div>`;
  });

  // Sell all button
  const totalVal=allMats.reduce((s,[k,q])=>{
    const m=MAT[k];
    if(!m||m.consume)return s;
    return s+matSellPrice(k)*q;
  },0);
  if(totalVal>0){
    h+=`<button onclick="sellAllMats()" style="width:100%;padding:10px;border:none;border-radius:10px;
      background:linear-gradient(135deg,#16a34a,#22c55e);color:#fff;font-size:13px;font-weight:800;
      cursor:pointer;margin-top:6px;font-family:'Baloo 2',cursive">
      💰 Sell Everything · ${totalVal}g</button>`;
  }
  return h;
}

window.sellAllMats=function(){
  const all=Object.entries(mats()).filter(([k,q])=>q>0&&MAT[k]&&!MAT[k].consume);
  let total=0;
  all.forEach(([k,q])=>{
    total+=matSellPrice(k)*q;
    delete mats()[k];
  });
  if(!total){wToast('Nothing to sell!','warn');return;}
  G.gold+=total;G.stats.earned+=total;G.yearEarned=(G.yearEarned||0)+total;
  if(typeof snd==='function')snd('coin');
  wToast(`💰 Sold all materials for ${total}g!`,'success',3200);
  if(typeof renderHUD==='function')renderHUD();
  refreshWinterHub();
};

function bindSellBtns(){
  document.querySelectorAll('[data-sell-mat]').forEach(btn=>{
    btn.addEventListener('click',()=>sellMat(btn.dataset.sellMat,parseInt(btn.dataset.sellQty)||1));
  });
  document.querySelectorAll('[data-consume-mat]').forEach(btn=>{
    btn.addEventListener('click',()=>consumeMat(btn.dataset.consumeMat));
  });
}
function consumeMat(k){
  const m=MAT[k];if(!m||!m.consume)return;
  if(!hasMat(k,1)){wToast('None left!','error');return;}
  rmMat(k,1);
  if(m.energyRestore){
    G.energy=Math.min(maxEnergy(),G.energy+m.energyRestore);
    if(typeof renderHUD==='function')renderHUD();
    wToast(`${m.e} Consumed! Restored +${m.energyRestore} energy ⚡`,'success');
  }
  refreshWinterHub();
}

/* ══════════════════════════════════════════════════════════
   🌿 FORAGE SYSTEM (tiles on farm grid)
══════════════════════════════════════════════════════════ */
function spawnForageItems(){
  if(!isWinter())return;
  const w=wdata();
  if(!w.forage)w.forage=[];
  // Remove old uncollected items (max age 2 days)
  w.forage=w.forage.filter(f=>!f.collected&&(G.day-f.day)<=1);

  const land=G.currentLand||'home';
  const pool=FORAGE_POOLS[land]||FORAGE_POOLS.home;
  const numSpawn=w.forageBonus?3:(1+Math.floor(Math.random()*2));

  for(let i=0;i<numSpawn;i++){
    // Find a random empty, non-tilled, non-tree tile
    let attempts=0;
    while(attempts<30){
      const r=1+Math.floor(Math.random()*(GH-2));
      const c=1+Math.floor(Math.random()*(GW-2));
      const tile=G.farm[r][c];
      const alreadySpawned=w.forage.some(f=>f.r===r&&f.c===c&&!f.collected&&f.land===land);
      if(!tile.tilled&&!tile.crop&&!tile.deco&&!alreadySpawned){
        w.forage.push({r,c,type:pickPool(pool),day:G.day,land,collected:false});
        break;
      }
      attempts++;
    }
  }
  w.forageBonus=false;
}

function renderForageOnGrid(){
  if(!isWinter())return;
  const w=wdata();
  if(!w.forage)return;
  const land=G.currentLand||'home';
  const grid=document.getElementById('farm-grid');
  if(!grid)return;
  w.forage.filter(f=>!f.collected&&f.land===land).forEach(f=>{
    const idx=f.r*GW+f.c;
    const el=grid.children[idx];
    if(!el||el.classList.contains('tile-tree'))return;
    const m=MAT[f.type];if(!m)return;
    // Overlay a forage emoji on top
    if(!el.querySelector('.forage-mark')){
      const mark=document.createElement('span');
      mark.className='forage-mark forage-tile';
      mark.textContent=m.e;
      mark.style.cssText='position:absolute;top:1px;right:1px;font-size:14px;pointer-events:none;z-index:5';
      el.style.position='relative';
      el.appendChild(mark);
      // On click, try to collect
      const oldClick=el.onclick;
      el._forageHandler=function(ev){
        collectForage(f.r,f.c,land);
      };
      el.addEventListener('click',el._forageHandler,{once:true});
    }
  });
}

function collectForage(r,c,land){
  const w=wdata();
  if(!w.forage)return;
  const idx=w.forage.findIndex(f=>f.r===r&&f.c===c&&f.land===land&&!f.collected);
  if(idx===-1)return;
  const item=w.forage[idx];
  item.collected=true;
  addMat(item.type,1);
  const m=MAT[item.type];
  if(typeof snd==='function')snd('harvest');
  wToast(`🌿 Found ${m.e} ${m.n}! (${m.sell}g)`,m.rare?'success':'info',2200);
  if(typeof addXP==='function')addXP('harvesting',5);
  if(typeof render==='function')render();
}

/* ══════════════════════════════════════════════════════════
   🌨️ EVENTS SYSTEM
══════════════════════════════════════════════════════════ */
function rollDailyEvent(){
  if(!isWinter())return;
  // ~60% chance of event per day in winter
  if(Math.random()>0.60)return;
  const total=EVENTS.reduce((s,e)=>s+e.w,0);
  let r=Math.random()*total;
  let ev=null;
  for(const e of EVENTS){r-=e.w;if(r<=0){ev=e;break;}}
  if(!ev)return;
  applyEvent(ev);
}

function applyEvent(ev){
  const w=wdata();
  w.eventToday=ev.id;
  if(!w.eventLog)w.eventLog=[];
  w.eventLog.push({id:ev.id,n:ev.n,msg:ev.msg,day:G.day});
  if(w.eventLog.length>10)w.eventLog.shift();

  // Delayed toast for events
  setTimeout(()=>{
    wToast(ev.n+' — '+ev.msg.substring(0,50),'warn',4500);
  },1800);

  switch(ev.eff){
    case'energy_penalty':
      w.energyPenalty=20;
      break;
    case'merchant':
      // Generate 3 random merchant items
      const pool=['iron_ore','coal','crystal','vol_shard','fossil','winter_herb','frozen_relic','pine_branch'];
      w.merchantItems=pool.sort(()=>Math.random()-.5).slice(0,3).map(t=>{
        const m=MAT[t];
        return{type:t,qty:1+Math.floor(Math.random()*2),price:Math.round(m.sell*0.7)};
      });
      w.merchantDay=G.day;
      break;
    case'gold':
      const bonus=50+Math.floor(Math.random()*120);
      setTimeout(()=>{
        G.gold+=bonus;
        if(typeof renderHUD==='function')renderHUD();
        wToast(`💰 Found ${bonus}g in the frozen chest!`,'success',3000);
      },2200);
      break;
    case'xp_boost':
      if(typeof addXP==='function'){
        addXP('farming',30);addXP('harvesting',30);addXP('watering',30);
      }
      break;
    case'forage_gift':
      addMat('firewood',2);addMat('winter_herb',1+Math.floor(Math.random()*2));
      setTimeout(()=>wToast('🏚️ Gathered 2× firewood & herbs from old cabin!','success',3000),2000);
      break;
    case'crystal_gift':
      addMat('crystal',1);if(Math.random()<0.4)addMat('vol_shard',1);
      setTimeout(()=>wToast('✨ Ice spirit left crystals on your doorstep!','success',3000),2000);
      break;
    case'fuel_drain':
      w.fuel=Math.max(0,(w.fuel||60)-10);
      break;
    case'price_boost':
      w.priceBoost=true;w.priceDaysLeft=1;
      setTimeout(()=>wToast('📈 Material prices are +25% today!','success',3000),2000);
      break;
    case'atmosphere':
      // Just a visual/flavor event
      break;
    case'wool_gift':
      addMat('wool',1);
      setTimeout(()=>wToast('🐇 Snow hare left a tuft of wool!','success',2500),1800);
      break;
  }
}

/* ══════════════════════════════════════════════════════════
   🔥 SURVIVAL: FUEL SYSTEM
══════════════════════════════════════════════════════════ */
function processFuel(){
  if(!isWinter())return;
  const w=wdata();
  const drain=w.fuelDrain||5;
  w.fuel=Math.max(0,(w.fuel||60)-drain);
  if(w.fuel<=0){
    // Energy penalty
    const penalty=w.energyPenalty||0;
    G.energy=Math.max(10,G.energy-20-penalty);
    setTimeout(()=>wToast('🥶 No heating fuel! Energy reduced overnight. Mine coal or craft fuel!','error',4000),2400);
  } else if(w.fuel<=20){
    setTimeout(()=>wToast('⚠️ Heating fuel is very low ('+w.fuel+')! Craft Coal Fuel soon.','warn',3500),2500);
  }
  // Clear blizzard energy penalty for next day
  w.energyPenalty=0;
}

function processAnimals(){
  if(!isWinter())return;
  const w=wdata();
  Object.entries(w.animals||{}).forEach(([k,count])=>{
    if(count<=0)return;
    const a=ANIMALS[k];if(!a)return;
    if(w.animalFed[k]){
      // Produce goods (only if has fuel)
      if((w.fuel||0)>0){
        const qty=a.qty*count;
        addMat(a.produce,qty);
        setTimeout(()=>wToast(`${a.e} Your ${a.n}s produced ${qty}× ${MAT[a.produce]?.e||''} ${MAT[a.produce]?.n||a.produce}!`,'info',2600),3000);
      }
    }
    // Reset fed status
    w.animalFed[k]=false;
  });
}

function processPriceBoost(){
  const w=wdata();
  if(w.priceBoost){
    w.priceDaysLeft=(w.priceDaysLeft||0)-1;
    if(w.priceDaysLeft<=0){w.priceBoost=false;w.priceDaysLeft=0;}
  }
}

/* ══════════════════════════════════════════════════════════
   AURORA & SNOWFLAKE ATMOSPHERE
══════════════════════════════════════════════════════════ */
function updateAtmosphere(){
  const auroraEl=document.getElementById('aurora-overlay');
  const snowEl=document.getElementById('snow-layer');
  const w=wdata();
  const inWinter=isWinter();
  const auroraOn=inWinter&&w.eventToday==='aurora';

  if(auroraEl)auroraEl.classList.toggle('aurora-on',auroraOn);
  if(snowEl)snowEl.classList.toggle('snow-on',inWinter);

  // Heavy snow during blizzard
  if(inWinter&&snowEl){
    if(!snowEl._spawning){
      snowEl._spawning=true;
      spawnSnowflakes(snowEl,w.eventToday==='blizzard'?12:5);
    }
  }

  // Show winter hub button
  const btn=document.getElementById('winter-hub-btn');
  if(btn)btn.style.display=inWinter?'block':'none';
}

function spawnSnowflakes(container,count){
  const flakes=['❄️','🌨','❅','❆'];
  // Clear old flakes if too many
  if(container.children.length>60)container.innerHTML='';
  for(let i=0;i<count;i++){
    const f=document.createElement('span');
    f.textContent=flakes[Math.floor(Math.random()*flakes.length)];
    f.style.cssText=`
      position:absolute;font-size:${8+Math.random()*14}px;
      left:${Math.random()*100}%;top:-20px;
      opacity:${0.2+Math.random()*0.4};
      animation:ambientFall ${6000+Math.random()*10000}ms ${Math.random()*5000}ms linear infinite;
      pointer-events:none`;
    container.appendChild(f);
  }
  // Only spawn once per day (flag will be reset on season change)
}

/* ══════════════════════════════════════════════════════════
   PATCH: advanceFarmGrid — allow native winter crops
══════════════════════════════════════════════════════════ */
(function patchFarmGrid(){
  if(typeof advanceFarmGrid==='undefined')return;
  const _orig=window.advanceFarmGrid;
  window.advanceFarmGrid=function(farm,hasGreenhouse,hasSprinkler){
    // Pre-process: tag winter-native crops so they don't die in winter
    const patched=farm.map(row=>row.map(tile=>{
      if(tile.crop&&CROPS&&CROPS[tile.crop.type]&&CROPS[tile.crop.type].winterNative){
        // Temporarily mark greenhouse true for winter native crops in winter
        return tile;
      }
      return tile;
    }));

    // Run original with adjusted logic
    const s=typeof season==='function'?season():'Spring';
    if(s!=='Winter')return _orig(farm,hasGreenhouse,hasSprinkler);

    // In winter: native winter crops grow without greenhouse; others need it
    return patched.map(row=>row.map(tile=>{
      if(!tile.crop){
        if(!tile.tilled)return{tilled:false,watered:false,crop:null,idleDays:0,deco:tile.deco||null};
        const idle=(tile.idleDays||0)+1;
        if(idle>=2)return{tilled:false,watered:false,crop:null,idleDays:0,deco:null};
        return{...tile,watered:false,idleDays:idle};
      }
      const cr=CROPS[tile.crop.type];
      if(!cr)return tile;
      const isNative=cr.winterNative;
      if(!isNative&&!hasGreenhouse)return{tilled:true,watered:false,crop:null,idleDays:0,deco:null};
      const newDays=tile.watered?tile.crop.days+1:tile.crop.days;
      return{...tile,watered:false,crop:{...tile.crop,days:newDays},idleDays:0};
    }));
  };
})();

/* ══════════════════════════════════════════════════════════
   PATCH: clickTile — allow winter crops in winter (seed tool)
══════════════════════════════════════════════════════════ */
(function patchClickTile(){
  if(typeof clickTile==='undefined')return;
  const _orig=window.clickTile;
  window.clickTile=function(r,c){
    // Intercept forage collection first
    const land=G.currentLand||'home';
    const w=wdata();
    if(w.forage){
      const forageItem=w.forage.find(f=>f.r===r&&f.c===c&&f.land===land&&!f.collected);
      if(forageItem){
        collectForage(r,c,land);
        return;
      }
    }
    // For seed tool in winter: allow planting winter-native crops
    if(G.tool==='seed'&&typeof season==='function'&&season()==='Winter'){
      const cr=CROPS&&CROPS[G.seed];
      if(cr&&cr.winterNative){
        // Allow without greenhouse check
        const tile=G.farm[r][c];
        if(!tile.tilled){wToast('Till first!','warn',1100);return;}
        if(tile.crop){wToast('Already planted!','warn',1100);return;}
        if(!(G.inv[G.seed]||0)){wToast('No '+cr.n+' seeds!','error');return;}
        G.farm[r][c]={...tile,crop:{type:G.seed,days:0},idleDays:0};
        G.inv[G.seed]--;
        if(typeof snd==='function')snd('place');
        spawnTileEffect&&spawnTileEffect(r,c,'❄️');
        wToast('Planted ❄️ '+cr.n+'!','success');
        render&&render();
        return;
      }
    }
    _orig(r,c);
  };
})();

/* ══════════════════════════════════════════════════════════
   PATCH: advanceDay — inject winter logic
══════════════════════════════════════════════════════════ */
(function patchAdvanceDay(){
  if(typeof advanceDay==='undefined')return;
  const _orig=window.advanceDay;
  window.advanceDay=function(){
    _orig();
    // Winter-specific daily logic
    if(isWinter()){
      ensureWinterState();
      processFuel();
      processAnimals();
      spawnForageItems();
      rollDailyEvent();
      processPriceBoost();
      _fishState.attempts=3; // Reset fishing attempts
    }
    // Season changed to winter? Reset state
    if(season()==='Winter'&&!wdata()._winterStarted){
      wdata()._winterStarted=true;
      wdata().fuel=wdata().fuelMax||100;
      spawnSnowflakesReset();
      setTimeout(()=>wToast('❄️ Winter is here! Use the Winter Hub for fishing, mining & crafting.','info',5000),3500);
    }
    if(season()!=='Winter'){
      if(wdata()._winterStarted)wdata()._winterStarted=false;
      wdata().eventToday=null;
      wdata().priceBoost=false;
    }
    updateAtmosphere();
  };
})();

function spawnSnowflakesReset(){
  const el=document.getElementById('snow-layer');
  if(el){el.innerHTML='';el._spawning=false;}
}

/* ══════════════════════════════════════════════════════════
   PATCH: render — add winter rendering hooks
══════════════════════════════════════════════════════════ */
(function patchRender(){
  if(typeof render==='undefined')return;
  const _orig=window.render;
  window.render=function(){
    _orig();
    updateAtmosphere();
    // Render forage items on grid after farm render
    setTimeout(renderForageOnGrid,50);
    // Update winter hub button visibility
    const btn=document.getElementById('winter-hub-btn');
    if(btn)btn.style.display=isWinter()?'block':'none';
  };
})();

/* ══════════════════════════════════════════════════════════
   PATCH: initState & loadState
══════════════════════════════════════════════════════════ */
(function patchState(){
  const patchInit=typeof initState==='function';
  const patchLoad=typeof loadState==='function';
  if(patchInit){
    const _origInit=window.initState;
    window.initState=function(){
      _origInit();
      injectWinterCrops();
      ensureWinterState();
    };
  }
  if(patchLoad){
    const _origLoad=window.loadState;
    window.loadState=function(s){
      _origLoad(s);
      injectWinterCrops();
      ensureWinterState();
    };
  }
})();

/* ══════════════════════════════════════════════════════════
   PATCH: buildWinterMarket — add crafting section & fuel
══════════════════════════════════════════════════════════ */
(function patchWinterMarket(){
  if(typeof buildWinterMarket==='undefined')return;
  const _orig=window.buildWinterMarket;
  window.buildWinterMarket=function(){
    const base=_orig();
    const w=wdata();
    const pct=Math.round((w.fuel/(w.fuelMax||100))*100);
    const fuelColor=pct>50?'#22c55e':pct>25?'#f59e0b':'#ef4444';
    const fuelBlock=`<div class="winter-fuel-block" style="margin-top:4px">
      <div class="wfb-row">
        <span class="wfb-label">🔥 Heating Fuel</span>
        <div style="flex:1;height:7px;background:var(--ui-bg);border-radius:4px;overflow:hidden;border:1px solid var(--ui-border);margin:0 8px">
          <div style="width:${pct}%;height:100%;background:${fuelColor};border-radius:4px;transition:width .4s"></div>
        </div>
        <span class="wfb-val" style="font-size:11px;color:var(--text-muted);font-weight:700">${w.fuel}/${w.fuelMax||100}</span>
      </div>
      <div class="wfb-tip">Craft <b>Coal Fuel</b> in Winter Hub to refill. Low fuel = energy penalty!</div>
    </div>`;

    // Materials sell section
    const hasMaterials=Object.keys(mats()).length>0;
    let matsSection='';
    if(hasMaterials){
      const totalMatVal=Object.entries(mats()).reduce((s,[k,q])=>{
        const m=MAT[k];if(!m||m.consume)return s;
        return s+matSellPrice(k)*q;
      },0);
      matsSection=`<div class="s-sec" style="margin-top:8px">🎒 Sell Winter Materials</div>
      <div class="market-header">Fish, ore, gems & forage — sell directly or craft first!</div>
      ${totalMatVal>0?`<button class="mkt-sell-all" onclick="sellAllMats()">💰 Sell All Materials · ${totalMatVal}g</button>`:''}`;
    }

    return fuelBlock+base+matsSection;
  };
})();

/* ══════════════════════════════════════════════════════════
   PATCH: buildInv — show crafted/consumable items
══════════════════════════════════════════════════════════ */
(function patchBuildInv(){
  if(typeof buildInv==='undefined')return;
  const _orig=window.buildInv;
  window.buildInv=function(){
    let base=_orig();
    // Append consumables in stash
    const consumables=Object.entries(mats()).filter(([k])=>MAT[k]&&MAT[k].consume&&mats()[k]>0);
    if(consumables.length){
      let h=`<div class="s-sec">🍲 Consumables</div>`;
      consumables.forEach(([k,q])=>{
        const m=MAT[k];
        h+=`<div class="inv-row"><span>${m.e} ${m.n}</span>
          <span class="inv-val">×${q}
            <button onclick="consumeMat('${k}')" style="margin-left:6px;padding:2px 7px;border:none;border-radius:5px;
              background:#16a34a;color:#fff;font-size:9px;font-weight:700;cursor:pointer">Use</button>
          </span></div>`;
      });
      base=base+h;
    }
    return base;
  };
})();

/* ══════════════════════════════════════════════════════════
   WINTER SHOP: Winter Crop Seeds Tab in Shop
══════════════════════════════════════════════════════════ */
(function patchBuildShop(){
  if(typeof buildShop==='undefined')return;
  const _orig=window.buildShop;
  window.buildShop=function(){
    const s=typeof season==='function'?season():'Spring';
    if(s!=='Winter')return _orig();
    // In winter: show winter market + winter seed shop
    const base=_orig(); // This returns buildWinterMarket()
    // Add winter crop seeds
    let seedSection=`<div class="s-sec" style="margin-top:8px">❄️ Winter Crop Seeds</div>
    <div class="market-header">Winter-native crops grow without a Greenhouse! Regular crops still need it.</div>`;
    Object.entries(WINTER_CROP_DEFS).forEach(([type,crop])=>{
      const bp=typeof seedBuyPrice==='function'?seedBuyPrice(type):crop.buy;
      const c5=bp*5,c10=bp*10,hv=G.inv[type]||0;
      seedSection+=`<div class="shop-card">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
          <span class="shop-name">${crop.e} ${crop.n}</span><span class="shop-price">${bp}g</span>
        </div>
        <div class="shop-meta">⏱ ${crop.days}d · sells ${crop.sell}g · have: ${hv} ❄️ Winter Native</div>
        <div class="shop-row">
          <button class="buy-btn" data-buy="${type}" data-qty="5" ${G.gold<c5?'disabled':''}>×5 (${c5}g)</button>
          <button class="buy-btn" data-buy="${type}" data-qty="10" ${G.gold<c10?'disabled':''}>×10 (${c10}g)</button>
        </div></div>`;
    });
    return base+seedSection;
  };
})();

/* ══════════════════════════════════════════════════════════
   ENHANCED WINTER STOCK MARKET
══════════════════════════════════════════════════════════ */
(function patchTickStockMarket(){
  if(typeof tickStockMarket==='undefined')return;
  const _orig=window.tickStockMarket;
  window.tickStockMarket=function(){
    _orig();
    if(typeof season==='function'&&season()==='Winter'){
      // Winter has higher volatility — add an extra price shock for some companies
      if(G.stockMarket&&Math.random()<0.4){
        const tickers=Object.keys(G.stockMarket);
        const target=tickers[Math.floor(Math.random()*tickers.length)];
        const mkt=G.stockMarket[target];
        if(mkt){
          const shock=(Math.random()>0.5?1:-1)*Math.round(mkt.price*(0.08+Math.random()*0.12));
          mkt.price=Math.max(10,mkt.price+shock);
          mkt.history.push(mkt.price);
          if(mkt.history.length>12)mkt.history.shift();
        }
      }
      // Winter market news event (low chance)
      if(Math.random()<0.12){
        const news=['📰 Cold weather boosts IPR stock!','📰 Supply chain freeze — markets volatile!',
          '📰 Seasonal spending surges VTK!','📰 IcePeak posts record winter sales!'];
        setTimeout(()=>wToast(news[Math.floor(Math.random()*news.length)],'info',4000),3500);
      }
    }
  };
})();

/* ══════════════════════════════════════════════════════════
   LAUNCH
══════════════════════════════════════════════════════════ */
function init(){
  injectStyles();
  injectHTML();
  injectWinterCrops();
  ensureWinterState();
  // If game is already running (rare case), run atmosphere
  updateAtmosphere();
  console.log('[Winter Expansion v2.0] ❄️ Loaded successfully!');
}

// Run on DOM ready (deferred scripts run after DOM is complete)
if(document.readyState==='loading'){
  document.addEventListener('DOMContentLoaded',init);
} else {
  init();
}

// Make consumeMat globally accessible (used in inline onclick)
window.consumeMat=consumeMat;

})(); // end IIFE


/* ────────────────────── winterpatch.js ────────────────────── */
/* ═══════════════════════════════════════════════════════════
   VALLEY FARM — SKILLS PATCH  v1.0
   Adds Fishing, Mining, Crafting, Foraging skills to the
   Skill menu — visible only during Winter (Winter Hub season).
   Farming / Watering / Harvesting remain year-round.
═══════════════════════════════════════════════════════════ */
(function(){
'use strict';

/* ── WINTER SKILL DEFINITIONS ────────────────────────────── */
const WINTER_SKILL_META = {
  fishing:  { e:'🎣', n:'Fishing',  col:'#0369a1',
    bonuses:{ 5:'Fishing zone widens +10%', 10:'Always catch on zone hit!' } },
  mining:   { e:'⛏️', n:'Mining',   col:'#78716c',
    bonuses:{ 5:'Mine tiles cost 1 less energy', 10:'+30% chance of double ore' } },
  crafting: { e:'🔨', n:'Crafting', col:'#b45309',
    bonuses:{ 5:'Crafting restores +5 energy', 10:'Unlock advanced recipes' } },
  foraging: { e:'🌿', n:'Foraging', col:'#16a34a',
    bonuses:{ 5:'Forage yields +1 extra item', 10:'Rare items appear +20% more' } },
};

/* ── XP TABLE (mirrors the main game's XP_LEVELS) ──────── */
// We reuse the global XP_LEVELS / getLevel / getXPPct from script.js

/* ── ENSURE STATE ────────────────────────────────────────── */
function ensureWinterSkills() {
  if (!G || !G.skills) return;
  Object.keys(WINTER_SKILL_META).forEach(k => {
    if (!G.skills[k]) G.skills[k] = { xp: 0 };
  });
}

/* ── PATCH initState ─────────────────────────────────────── */
if (typeof window.initState === 'function') {
  const _origInit = window.initState;
  window.initState = function() {
    _origInit();
    ensureWinterSkills();
  };
}

/* ── PATCH loadState ─────────────────────────────────────── */
if (typeof window.loadState === 'function') {
  const _origLoad = window.loadState;
  window.loadState = function(s) {
    _origLoad(s);
    ensureWinterSkills();
  };
}

/* ── PATCH buildSkillSection ─────────────────────────────── */
if (typeof window.buildSkillSection === 'function') {
  const _origBSS = window.buildSkillSection;
  window.buildSkillSection = function() {
    let base = _origBSS();

    // Only inject winter skills section during Winter
    if (typeof season !== 'function' || season() !== 'Winter') return base;

    ensureWinterSkills();

    let h = '<div class="s-sec" style="color:#0369a1;border-color:#7dd3fc">❄️ Winter Skills</div>';
    h += '<div style="font-size:10px;color:var(--text-muted);margin:-4px 0 6px;padding:0 2px">Available while the Winter Hub is open</div>';

    Object.entries(WINTER_SKILL_META).forEach(([key, meta]) => {
      const sk = (G.skills && G.skills[key]) || { xp: 0 };
      const lv = (typeof getLevel === 'function') ? getLevel(sk.xp) : 1;
      const pct = (typeof getXPPct === 'function') ? getXPPct(sk.xp) : 0;
      const bonus = meta.bonuses[lv];
      h += `<div class="skill-item">
        <div class="skill-header">
          <span class="skill-name">${meta.e} ${meta.n}</span>
          <span class="skill-level">Lv.${lv}${lv >= 10 ? '★' : ''}</span>
        </div>
        <div class="skill-bar-outer">
          <div class="skill-bar-inner" style="width:${pct}%;background:${meta.col}"></div>
        </div>
        ${bonus ? `<span class="skill-bonus-tag">✓ ${bonus}</span>` : ''}
      </div>`;
    });

    return base + h;
  };
}

/* ── PATCH checkFishCatch → award fishing XP ─────────────── */
// winter.js currently calls addXP('harvesting', 8) on a catch.
// We intercept the global addXP only for fishing context by
// patching checkFishCatch after winter.js has defined it.
function patchFishCatch() {
  if (typeof window.checkFishCatch === 'undefined') return;
  // checkFishCatch is a module-level closure inside winter.js IIFE,
  // so it isn't directly on window. Instead we hook addXP during the
  // window.doFishCast flow by temporarily redirecting harvesting XP.
  // A cleaner approach: wrap the entire fishing outcome via a
  // MutationObserver on the fish-result element.
  const resultObserver = new MutationObserver(() => {
    const res = document.getElementById('fish-result');
    if (!res) return;
    const text = res.textContent || '';
    // A successful catch always contains "Caught" in the result text
    if (text.includes('Caught')) {
      ensureWinterSkills();
      if (typeof addXP === 'function') addXP('fishing', 10);
    }
  });
  // Observe once the DOM node exists
  const tryObserve = setInterval(() => {
    const el = document.getElementById('fish-result');
    if (el) {
      resultObserver.observe(el, { childList: true, characterData: true, subtree: true });
      clearInterval(tryObserve);
    }
  }, 500);
}

/* ── PATCH doMineTile → award mining XP ─────────────────── */
// doMineTile is also inside winter.js's IIFE. We wrap addXP at the
// game level: whenever addXP('farming', 6) is called from inside
// a mine action, we also credit mining XP.
// Strategy: patch addXP itself and detect the mining context by
// checking whether the winter hub mining tab is visible/active.
function patchMiningXP() {
  if (typeof window.addXP !== 'function') return;
  const _origAddXP = window.addXP;
  window.addXP = function(skill, amount) {
    _origAddXP(skill, amount);
    // When addXP('farming',6) is called AND the mining tab is the
    // active Winter Hub tab, also credit mining skill.
    if (skill === 'farming' && amount === 6) {
      const hub = document.getElementById('winter-hub');
      const miningTabActive = hub &&
        hub.classList.contains('wh-open') &&
        document.getElementById('wht-mining') &&
        document.getElementById('wht-mining').classList.contains('wh-active');
      if (miningTabActive) {
        ensureWinterSkills();
        _origAddXP('mining', 8);
      }
    }
    // When addXP('harvesting',8) is called AND fishing tab active, credit fishing
    if (skill === 'harvesting' && amount === 8) {
      const hub = document.getElementById('winter-hub');
      const fishingTabActive = hub &&
        hub.classList.contains('wh-open') &&
        document.getElementById('wht-fishing') &&
        document.getElementById('wht-fishing').classList.contains('wh-active');
      if (fishingTabActive) {
        ensureWinterSkills();
        _origAddXP('fishing', 10);
      }
    }
  };
}

/* ── PATCH doCraft → award crafting XP ──────────────────── */
// doCraft calls snd('levelup') after every successful craft.
// We wrap snd to detect this context.
function patchCraftingXP() {
  if (typeof window.snd !== 'function') return;
  const _origSnd = window.snd;
  window.snd = function(type) {
    _origSnd(type);
    if (type === 'levelup') {
      const hub = document.getElementById('winter-hub');
      const craftTabActive = hub &&
        hub.classList.contains('wh-open') &&
        document.getElementById('wht-crafting') &&
        document.getElementById('wht-crafting').classList.contains('wh-active');
      if (craftTabActive) {
        ensureWinterSkills();
        if (typeof addXP === 'function') addXP('crafting', 12);
      }
    }
  };
}

/* ── PATCH foraging → award foraging XP ─────────────────── */
// Foraging gives toast messages. Hook via addMat being called
// inside the foraging tab context.
function patchForagingXP() {
  if (typeof window.addMat !== 'function') return;
  // addMat is inside the winter.js IIFE so not on window directly.
  // Instead we watch the activities tab (Events) for forage_gift, or
  // use the buildActivitiesTab forage btn.
  // Best approach: monitor wh-body for forage action results.
  document.addEventListener('click', e => {
    const btn = e.target.closest('[data-forage]');
    if (!btn) return;
    const hub = document.getElementById('winter-hub');
    if (!hub || !hub.classList.contains('wh-open')) return;
    // Forage action — award XP after a short delay (after outcome)
    setTimeout(() => {
      ensureWinterSkills();
      if (typeof addXP === 'function') addXP('foraging', 8);
    }, 300);
  });
}

/* ── LEVEL-UP NOTIFICATIONS FOR WINTER SKILLS ────────────── */
// The main addXP already handles level-up toasts for known skills
// (farming/watering/harvesting) but will fall back to a generic
// message for winter skills — that's fine and intentional.
// We enrich the bonuses map so the toast message is meaningful.
function patchAddXPNames() {
  // After patchMiningXP wraps addXP, the inner _origAddXP reference
  // points to the original. We just need the names/bonuses tables
  // inside addXP to know about winter skills.
  // addXP in script.js does:
  //   const names = {farming:'Farming', watering:'Watering', harvesting:'Harvesting'}
  //   const bonuses = { farming:{...}, watering:{...}, harvesting:{...} }
  // Since those are local variables, we can't patch them directly.
  // The fallback branch already says "${names[skill]} skill up!" which
  // will render as "undefined skill up!" for unknown keys.
  // To fix that without touching script.js, we intercept at the
  // showAchievement level.
  if (typeof window.showAchievement !== 'function') return;
  const _origShow = window.showAchievement;
  window.showAchievement = function(icon, name, desc) {
    // Replace "undefined Lv.X!" with the proper winter skill name
    if (typeof name === 'string' && name.startsWith('undefined Lv.')) {
      const lvMatch = name.match(/Lv\.(\d+)/);
      const lv = lvMatch ? parseInt(lvMatch[1]) : 1;
      // Determine which winter skill just levelled by checking which
      // skills' XP changed most recently — we track via a side-channel.
      const key = window._lastWinterSkillUp;
      if (key && WINTER_SKILL_META[key]) {
        const meta = WINTER_SKILL_META[key];
        name = `${meta.e} ${meta.n} Lv.${lv}!`;
        desc = meta.bonuses[lv] || `${meta.n} skill up!`;
      }
    }
    _origShow(icon, name, desc);
  };

  // Track which winter skill is levelling up
  if (typeof window.addXP === 'function') {
    const _wrappedAddXP = window.addXP;
    window.addXP = function(skill, amount) {
      if (WINTER_SKILL_META[skill]) window._lastWinterSkillUp = skill;
      _wrappedAddXP(skill, amount);
    };
  }
}

/* ── INIT ────────────────────────────────────────────────── */
function init() {
  // Run after both script.js and winter.js are fully loaded
  ensureWinterSkills();
  patchFishCatch();
  patchMiningXP();
  patchCraftingXP();
  patchForagingXP();
  patchAddXPNames();
  console.log('[Skills Patch v1.0] ✅ Winter skills injected!');
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

})();


/* ────────────────────── patch_v1.1.8.js ────────────────────── */
(function () {
  'use strict';
  console.log('[Patch v1.1.8] Applying...');

  /* ─────────────────────────────────────────────────────────────
   * 1. INJECT CSS
   *    · Toast opacity → 70%
   *    · Bag/menu side panel wider on PC only (min-width: 681px)
   *      calc(100vw - 791px) leaves exactly the farm grid width
   *      (14 × 52px tiles + 13 × 3px gaps = 767px + 24px padding)
   *      untouched. Mobile (#side is display:none ≤680px) unchanged.
   * ───────────────────────────────────────────────────────────── */
  var style = document.createElement('style');
  style.id = 'patch-v1-1-8-css';
  style.textContent = [
    '/* PATCH v1.1.8 — Toast opacity 70% */',
    '.toast { opacity: 0.7; }',
    '',
    '/* PATCH v1.1.8 — Wider bag panel (PC only) */',
    '@media (min-width: 681px) {',
    '  #side {',
    '    width: calc(100vw - 791px) !important;',
    '    min-width: 290px;',
    '    max-width: 560px;',
    '  }',
    '}'
  ].join('\n');
  document.head.appendChild(style);

  /* ─────────────────────────────────────────────────────────────
   * 2. SUPPRESS FALL TOWN INIT TOAST
   *    FallTownUpdate fires its welcome toast after 1 800 ms.
   *    We wrap window.toast now, drop anything containing
   *    'Fall Town Update', then restore the real function at 3 s
   *    so all subsequent in-game toasts work normally.
   * ───────────────────────────────────────────────────────────── */
  var _origToast = window.toast;
  if (typeof _origToast === 'function') {
    window.toast = function (msg, type, dur) {
      if (typeof msg === 'string' && msg.indexOf('Fall Town Update') !== -1) {
        return; // silently drop fall-town init toast
      }
      return _origToast.apply(this, arguments);
    };

    setTimeout(function () {
      window.toast = _origToast;
    }, 3000);

    console.log('[Patch v1.1.8] Fall Town init toast suppressed.');
  } else {
    console.warn('[Patch v1.1.8] window.toast not ready — toast suppression skipped.');
  }

  console.log('[Patch v1.1.8] Done.');
})();
