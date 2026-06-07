/* ══════════════════════════════════
   CONSTANTS & DATA
══════════════════════════════════ */
const GW=14,GH=10;
const SEASONS=['Spring','Summer','Fall','Winter'];
const SEASON_COL={Spring:'#16a34a',Summer:'#d97706',Fall:'#c2410c',Winter:'#0369a1'};
const SEASON_BG={Spring:'#dcfce7',Summer:'#fef9c3',Fall:'#ffedd5',Winter:'#e0f2fe'};
const GRASS={Spring:'#6dbf67',Summer:'#5aab40',Fall:'#c8973a',Winter:'#93b8c8'};
const SOIL_N='#a07040',SOIL_W='#5c3820';

const TREES=[
  [0,0,'🌲'],[0,1,'🌳'],[0,GW-2,'🌳'],[0,GW-1,'🌲'],
  [GH-1,0,'🌳'],[GH-1,1,'🌲'],[GH-1,GW-2,'🌲'],[GH-1,GW-1,'🌳'],
  [3,0,'🌴'],[GH-4,0,'🌵'],[3,GW-1,'🌴'],[GH-4,GW-1,'🌵'],
  [1,0,'🌿'],[GH-2,0,'🌿'],[1,GW-1,'🌿'],[GH-2,GW-1,'🌿'],
];
const TMAP=new Map(TREES.map(([r,c,e])=>[r*100+c,e]));

const CROPS={
  parsnip:    {n:'Parsnip',    e:'🥕',days:4, buy:10,  sell:35,  seasons:['Spring']},
  carrot:     {n:'Carrot',     e:'🥕',days:3, buy:15,  sell:50,  seasons:['Spring','Fall']},
  potato:     {n:'Potato',     e:'🥔',days:6, buy:50,  sell:150, seasons:['Spring']},
  cauliflower:{n:'Cauliflower',e:'🥦',days:12,buy:80,  sell:175, seasons:['Spring']},
  strawberry: {n:'Strawberry', e:'🍓',days:8, buy:100, sell:300, seasons:['Spring','Summer']},
  tulip:      {n:'Tulip',      e:'🌷',days:5, buy:30,  sell:90,  seasons:['Spring']},
  garlic:     {n:'Garlic',     e:'🧄',days:5, buy:40,  sell:100, seasons:['Spring','Fall']},
  melon:      {n:'Melon',      e:'🍈',days:12,buy:80,  sell:250, seasons:['Summer']},
  tomato:     {n:'Tomato',     e:'🍅',days:11,buy:50,  sell:180, seasons:['Summer']},
  corn:       {n:'Corn',       e:'🌽',days:14,buy:150, sell:500, seasons:['Summer','Fall']},
  sunflower:  {n:'Sunflower',  e:'🌻',days:8, buy:200, sell:350, seasons:['Summer']},
  pepper:     {n:'Pepper',     e:'🌶',days:9, buy:70,  sell:220, seasons:['Summer']},
  blueberry:  {n:'Blueberry',  e:'🫐',days:13,buy:80,  sell:125, seasons:['Summer']},
  eggplant:   {n:'Eggplant',   e:'🍆',days:9, buy:60,  sell:190, seasons:['Summer','Fall']},
  pumpkin:    {n:'Pumpkin',    e:'🎃',days:13,buy:100, sell:320, seasons:['Fall']},
  yam:        {n:'Yam',        e:'🍠',days:10,buy:60,  sell:200, seasons:['Fall']},
  cranberry:  {n:'Cranberry',  e:'🍒',days:7, buy:240, sell:550, seasons:['Fall']},
  mushroom:   {n:'Mushroom',   e:'🍄',days:6, buy:35,  sell:110, seasons:['Fall']},
};

const DECOS={
  path:  {e:'🟫',n:'Stone Path'},
  fence: {e:'🪵',n:'Fence'},
  flower:{e:'🌸',n:'Flower Bed'},
  lamp:  {e:'🏮',n:'Lamp Post'},
  sign:  {e:'🪧',n:'Sign'},
  rock:  {e:'🪨',n:'Rock'},
  scarecrow:{e:'🧍',n:'Scarecrow'},
};

/* Per-land tree/rock/decoration maps */
const LAND_TREES={
  home:[
    [0,0,'🌲'],[0,1,'🌳'],[0,GW-2,'🌳'],[0,GW-1,'🌲'],
    [GH-1,0,'🌳'],[GH-1,1,'🌲'],[GH-1,GW-2,'🌲'],[GH-1,GW-1,'🌳'],
    [3,0,'🌴'],[GH-4,0,'🌵'],[3,GW-1,'🌴'],[GH-4,GW-1,'🌵'],
    [1,0,'🌿'],[GH-2,0,'🌿'],[1,GW-1,'🌿'],[GH-2,GW-1,'🌿'],
  ],
  meadow:[
    [0,0,'🌾'],[0,1,'🌻'],[0,GW-2,'🌻'],[0,GW-1,'🌾'],
    [GH-1,0,'🌾'],[GH-1,1,'🌼'],[GH-1,GW-2,'🌼'],[GH-1,GW-1,'🌾'],
    [3,0,'🍀'],[GH-4,0,'🍀'],[3,GW-1,'🌿'],[GH-4,GW-1,'🌿'],
    [1,0,'🌱'],[GH-2,0,'🌱'],[1,GW-1,'🌱'],[GH-2,GW-1,'🌱'],
  ],
  riverbank:[
    [0,0,'🌿'],[0,1,'🎋'],[0,GW-2,'🎋'],[0,GW-1,'🌿'],
    [GH-1,0,'🌿'],[GH-1,1,'🐸'],[GH-1,GW-2,'🐸'],[GH-1,GW-1,'🌿'],
    [3,0,'🎋'],[GH-4,0,'🎋'],[3,GW-1,'🎋'],[GH-4,GW-1,'🎋'],
    [1,0,'🪸'],[GH-2,0,'🪸'],[1,GW-1,'🪸'],[GH-2,GW-1,'🪸'],
  ],
  hillfarm:[
    [0,0,'🪨'],[0,1,'⛰️'],[0,GW-2,'⛰️'],[0,GW-1,'🪨'],
    [GH-1,0,'🪨'],[GH-1,1,'🪨'],[GH-1,GW-2,'🪨'],[GH-1,GW-1,'🪨'],
    [3,0,'🌲'],[GH-4,0,'🌲'],[3,GW-1,'🌲'],[GH-4,GW-1,'🌲'],
    [1,0,'🪨'],[GH-2,0,'🪨'],[1,GW-1,'🪨'],[GH-2,GW-1,'🪨'],
  ],
  lowland:[
    [0,0,'🌳'],[0,1,'🌴'],[0,GW-2,'🌴'],[0,GW-1,'🌳'],
    [GH-1,0,'🌳'],[GH-1,1,'🌳'],[GH-1,GW-2,'🌳'],[GH-1,GW-1,'🌳'],
    [3,0,'🌺'],[GH-4,0,'🌸'],[3,GW-1,'🌺'],[GH-4,GW-1,'🌸'],
    [1,0,'🍃'],[GH-2,0,'🍃'],[1,GW-1,'🍃'],[GH-2,GW-1,'🍃'],
  ],
  volcanic:[
    [0,0,'🪨'],[0,1,'🌋'],[0,GW-2,'🌋'],[0,GW-1,'🪨'],
    [GH-1,0,'🪨'],[GH-1,1,'🪨'],[GH-1,GW-2,'🪨'],[GH-1,GW-1,'🪨'],
    [3,0,'🌵'],[GH-4,0,'🔥'],[3,GW-1,'🌵'],[GH-4,GW-1,'🔥'],
    [1,0,'🪨'],[GH-2,0,'💨'],[1,GW-1,'🪨'],[GH-2,GW-1,'💨'],
  ],
};

const UPGRADES={
  sprinkler:{n:'Sprinkler System',e:'🚿',desc:'Auto-waters all tilled soil each morning (replaces rain)',cost:1500,max:1},
  greenhouse:{n:'Greenhouse',e:'🏡',desc:'Crops survive & grow through Winter — plant in Fall & harvest in Winter!',cost:2200,max:1},
  barn:{n:'Barn Bonus',e:'🏚',desc:'+15% bonus on all sales. Stacks up to ×2',cost:1000,max:2},
  well:{n:'Deep Well',e:'🪣',desc:'+50 maximum energy per purchase',cost:800,max:2},
};
// Upgrades are per-land — buying on home does NOT affect other maps

/* Fertility multiplier: bonus harvest chance per tile on this plot */
const LAND_PLOTS={
  meadow:{n:'Meadow Plot',e:'🌿',fertility:'Poor',fertMult:0.85,
    buyPrice:900,rentDay:14,interestRate:0.10,
    desc:'Modest plains. Affordable first expansion.',col:'#8bc34a',textCol:'#33691e',
    mapX:'2%',mapY:'5%',mapW:'30%',mapH:'38%'},
  riverbank:{n:'River Bank',e:'🌊',fertility:'Average',fertMult:1.0,
    buyPrice:1800,rentDay:28,interestRate:0.10,
    desc:'Natural irrigation keeps crops moist.',col:'#4fc3f7',textCol:'#01579b',
    mapX:'68%',mapY:'5%',mapW:'30%',mapH:'38%'},
  hillfarm:{n:'Hill Farm',e:'⛰️',fertility:'Average',fertMult:1.05,
    buyPrice:2600,rentDay:40,interestRate:0.12,
    desc:'Elevated terrain with great sun exposure.',col:'#bcaaa4',textCol:'#4e342e',
    mapX:'2%',mapY:'56%',mapW:'30%',mapH:'40%'},
  lowland:{n:'Rich Lowland',e:'🌱',fertility:'Rich',fertMult:1.25,
    buyPrice:4200,rentDay:65,interestRate:0.12,
    desc:'Deep nutrient-rich alluvial soil. High yields.',col:'#66bb6a',textCol:'#1b5e20',
    mapX:'68%',mapY:'56%',mapW:'30%',mapH:'40%'},
  volcanic:{n:'Volcanic Ridge',e:'🌋',fertility:'Volcanic',fertMult:1.5,
    buyPrice:7500,rentDay:110,interestRate:0.15,
    desc:'Mineral-rich volcanic ash. Exceptional harvests.',col:'#ef5350',textCol:'#b71c1c',
    mapX:'33%',mapY:'72%',mapW:'34%',mapH:'25%'},
};

/* Per-land terrain: grass colors per season, bg, icon */
const LAND_TERRAIN={
  home:{      grass:{Spring:'#6dbf67',Summer:'#5aab40',Fall:'#c8973a',Winter:'#93b8c8'}, icon:'🏡', label:'Home Farm'},
  meadow:{    grass:{Spring:'#8fbd5a',Summer:'#7ab535',Fall:'#d4a030',Winter:'#9ec4a8'}, icon:'🌿', label:'Meadow Plot', waterTint:'rgba(96,165,250,.18)'},
  riverbank:{ grass:{Spring:'#5daa78',Summer:'#4a9465',Fall:'#b89440',Winter:'#7aacbc'}, icon:'🌊', label:'River Bank',  waterTint:'rgba(59,130,246,.28)'},
  hillfarm:{  grass:{Spring:'#7a9e5a',Summer:'#688a4a',Fall:'#a88040',Winter:'#8899aa'}, icon:'⛰️', label:'Hill Farm'},
  lowland:{   grass:{Spring:'#4ab85e',Summer:'#3aa050',Fall:'#b09030',Winter:'#88b098'}, icon:'🌱', label:'Rich Lowland'},
  volcanic:{  grass:{Spring:'#8a7040',Summer:'#7a5c30',Fall:'#b04020',Winter:'#704848'}, icon:'🌋', label:'Volcanic Ridge'},
};

/* ══ STOCK MARKET COMPANIES ══ */
const CITY_COMPANIES=[
  {ticker:'GHC',name:'GreenHarvest Corp',    icon:'🌿',desc:'Agricultural giant. Thrives in Spring & Summer.',   basePrice:120,strongSeasons:['Spring','Summer'],volatility:0.12},
  {ticker:'SGB',name:'SunGold Beverages',    icon:'🍊',desc:'Premium drinks empire. Summer demand explodes.',    basePrice:85, strongSeasons:['Summer'],           volatility:0.18},
  {ticker:'FFF',name:'FallFest Foods',       icon:'🎃',desc:'Seasonal snack powerhouse. Peak earnings in Fall.', basePrice:95, strongSeasons:['Fall'],             volatility:0.15},
  {ticker:'IPR',name:'IcePeak Retail',       icon:'❄️', desc:'Winter shopping chain. Surges every cold season.', basePrice:110,strongSeasons:['Winter'],           volatility:0.14},
  {ticker:'VTK',name:'ValleyTech Inc',       icon:'💻',desc:'Farmtech startup. High risk, high reward.',         basePrice:200,strongSeasons:[],                   volatility:0.30},
  {ticker:'RBT',name:'RiverBank Trading',    icon:'🏦',desc:'Stable finance house. Consistent, low drama.',      basePrice:160,strongSeasons:['Spring','Summer','Fall','Winter'],volatility:0.05},
];

const XP_LEVELS=[0,80,200,400,700,1100,1600,2200,3000,4000];

/* ══ SETTINGS ══ */
let S={dark:false,toasts:true,energyCost:true,weather:true,retro:false,sounds:true};
function loadS(){try{const s=JSON.parse(localStorage.getItem('vf_s'));if(s)S={...S,...s};}catch(e){}}
function saveS(){localStorage.setItem('vf_s',JSON.stringify(S));}
function applyS(){
  document.body.classList.toggle('dark',S.dark&&!S.retro);
  document.body.classList.toggle('retro',S.retro);
  const setChk=(id,val)=>{const el=document.getElementById(id);if(el)el.checked=val;};
  setChk('tog-dark',S.dark);setChk('tog-dark-start',S.dark);
  setChk('tog-toasts',S.toasts);setChk('tog-toasts-start',S.toasts);
  setChk('tog-sounds',!!S.sounds);setChk('tog-sounds-start',!!S.sounds);
  setChk('tog-energy',S.energyCost);
  setChk('tog-weather',S.weather);
  setChk('tog-retro',S.retro);setChk('tog-retro-start',S.retro);
}
function toggleDark(on){S.dark=on;if(on&&S.retro){S.retro=false;document.getElementById('tog-retro').checked=false;}document.body.classList.toggle('dark',on);document.body.classList.toggle('retro',false);saveS();}
function toggleRetro(on){S.retro=on;if(on&&S.dark){S.dark=false;document.getElementById('tog-dark').checked=false;document.body.classList.remove('dark');}document.body.classList.toggle('retro',on);saveS();}

/* ══ SOUND SYSTEM (Web Audio API) ══ */
let audioCtx=null;
function snd(type){
  if(!S.sounds)return;
  try{
    if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();
    if(audioCtx.state==='suspended')audioCtx.resume();
    const c=audioCtx,t=c.currentTime;
    const b=(f,d,w='sine',v=0.12,dl=0)=>{
      const o=c.createOscillator(),g=c.createGain();
      o.connect(g);g.connect(c.destination);
      o.type=w;o.frequency.setValueAtTime(f,t+dl);
      g.gain.setValueAtTime(v,t+dl);
      g.gain.exponentialRampToValueAtTime(0.001,t+dl+d);
      o.start(t+dl);o.stop(t+dl+d+0.06);
    };
    ({
      till:()=>{b(180,0.11,'triangle',0.18);b(110,0.09,'triangle',0.14,0.06);},
      water:()=>{b(660,0.07,'sine',0.09);b(440,0.12,'sine',0.07,0.07);b(330,0.16,'sine',0.05,0.16);},
      harvest:()=>{[440,554,659,880].forEach((f,i)=>b(f,0.18,'sine',0.1,i*0.07));},
      coin:()=>{b(880,0.05,'sine',0.13);b(1108,0.12,'sine',0.11,0.05);},
      buy:()=>{b(660,0.08,'sine',0.12);b(880,0.14,'sine',0.10,0.07);},
      error:()=>{b(110,0.18,'sawtooth',0.1);},
      sleep:()=>{[261,330,392,523].forEach((f,i)=>b(f,0.6,'sine',0.07,i*0.09));},
      levelup:()=>{[440,550,660,880,1100].forEach((f,i)=>b(f,0.2,'sine',0.13,i*0.07));},
      place:()=>{b(440,0.09,'triangle',0.1);},
      ship:()=>{b(550,0.06,'sine',0.12);b(770,0.12,'sine',0.10,0.06);b(990,0.18,'sine',0.08,0.12);},
    }[type]||(() => {}))();
  }catch(e){}
}

/* ══ START MENU ══ */
let _passCheckTarget=null;

function goLayer(id){
  document.querySelectorAll('.menu-layer').forEach(l=>l.classList.remove('ml-active'));
  const el=document.getElementById(id);
  if(!el)return;
  el.classList.add('ml-active');
  // Special init per layer
  if(id==='layer-farm')renderRecentFarms();
  if(id==='layer-load')renderLoadList();
  if(id==='layer-options-menu')syncStartOptions();
}

function syncStartOptions(){
  const setChk=(id,val)=>{const el=document.getElementById(id);if(el)el.checked=val;};
  setChk('tog-dark-start',S.dark);
  setChk('tog-retro-start',S.retro);
  setChk('tog-toasts-start',S.toasts);
  setChk('tog-sounds-start',!!S.sounds);
}

function exitToTitle(){
  // In a browser, just scroll to top or close tab if possible
  if(window.history&&window.history.length>1)window.history.back();
  else window.close();
}

function renderRecentFarms(){
  const saves=getSaves();
  const entries=Object.entries(saves).sort(([,a],[,b])=>(b._ts||0)-(a._ts||0)).slice(0,3);
  const wrap=document.getElementById('recent-farms-wrap');
  if(!wrap)return;
  if(!entries.length){wrap.innerHTML='';return;}
  wrap.innerHTML=`<div class="recent-label">⏱ Recently Played</div>`+entries.map(([nm,d])=>`
    <div class="save-entry" onclick="loadFarmEntry('${nm}')">
      <div class="save-entry-left">
        <div class="save-entry-name">🧑‍🌾 ${nm}</div>
        <div class="save-entry-info">Day ${d.day||1} · Yr.${d.year||1} · ${d.gold||0}g · ${_timeAgo(d._ts)}</div>
      </div>
    </div>`).join('');
}

function renderLoadList(){
  const saves=getSaves();
  const entries=Object.entries(saves).sort(([,a],[,b])=>(b._ts||0)-(a._ts||0));
  const list=document.getElementById('load-list');
  const empty=document.getElementById('load-empty');
  if(!entries.length){
    list.innerHTML='';empty.style.display='block';return;
  }
  empty.style.display='none';
  list.innerHTML=entries.map(([nm,d])=>`
    <div class="save-entry" onclick="loadFarmEntry('${nm}')">
      <div class="save-entry-left">
        <div class="save-entry-name">🧑‍🌾 ${nm}</div>
        <div class="save-entry-info">Day ${d.day||1} · Yr.${d.year||1} · ${d.gold||0}g · ${_timeAgo(d._ts)}</div>
      </div>
      <button class="save-entry-del" onclick="event.stopPropagation();delSave('${nm}')" title="Delete">✕</button>
    </div>`).join('');
}

function _timeAgo(ts){
  if(!ts)return'';
  const diff=Date.now()-ts;
  if(diff<60000)return'just now';
  if(diff<3600000)return Math.floor(diff/60000)+'m ago';
  if(diff<86400000)return Math.floor(diff/3600000)+'h ago';
  return Math.floor(diff/86400000)+'d ago';
}

function loadFarmEntry(nm){
  const users=getUsers();
  // If user has a password, prompt for it
  if(users[nm]&&users[nm].length>=4){
    _passCheckTarget=nm;
    document.getElementById('passcheck-title').textContent='🔐 '+nm;
    document.getElementById('passcheck-sub').textContent='Enter password to continue';
    document.getElementById('pass-check-input').value='';
    document.getElementById('pass-check-error').style.display='none';
    goLayer('layer-passcheck');
  } else {
    // No password — load directly
    CU=nm;
    const sv=getSaves()[nm];
    sv?loadState(sv):initState();
    launchGame();
  }
}

function submitPassCheck(){
  const pw=document.getElementById('pass-check-input').value;
  const errEl=document.getElementById('pass-check-error');
  errEl.style.display='none';
  const nm=_passCheckTarget;
  if(!nm)return;
  const users=getUsers();
  if(users[nm]&&pw!==users[nm]){
    errEl.textContent='Wrong password!';errEl.style.display='block';return;
  }
  CU=nm;
  const sv=getSaves()[nm];
  sv?loadState(sv):initState();
  launchGame();
}

function createFarm(){
  const nm=document.getElementById('new-name').value.trim();
  const pw=document.getElementById('new-pass').value;
  const err=document.getElementById('new-error');
  err.style.display='none';
  if(!nm){err.textContent='Enter a farmer name!';err.style.display='block';return;}
  if(nm.length>24){err.textContent='Name too long (max 24 chars).';err.style.display='block';return;}
  if(pw&&pw.length<4){err.textContent='Password must be 4+ characters.';err.style.display='block';return;}
  const users=getUsers();
  if(users[nm]){err.textContent='Farmer "'+nm+'" already exists! Load it instead.';err.style.display='block';return;}
  users[nm]=pw||'';setUsers(users);
  CU=nm;initState();saveAll();
  launchGame();
}

function delSave(nm){
  const s=getSaves();delete s[nm];setSaves(s);
  const u=getUsers();delete u[nm];setUsers(u);
  renderLoadList();renderRecentFarms();
}

/* ══ AUTH ══ */
let CU=null;
function getUsers(){return JSON.parse(localStorage.getItem('vf_u')||'{}')}
function setUsers(u){localStorage.setItem('vf_u',JSON.stringify(u))}
function getSaves(){return JSON.parse(localStorage.getItem('vf_sv')||'{}')}
function setSaves(s){localStorage.setItem('vf_sv',JSON.stringify(s))}

function saveAll(){
  if(!CU)return;
  // Sync active farm back into farms map
  if(!G.farms)G.farms={};
  G.farms[G.currentLand||'home']=G.farm;
  const sv=getSaves();sv[CU]={...G,_ts:Date.now()};setSaves(sv);saveS();
}

function doLogout(){
  saveAll();closePause();
  clearInterval(clockInt);clearInterval(asInt);
  CU=null;
  document.getElementById('game-screen').classList.remove('active');
  document.getElementById('map-fullscreen').classList.remove('mf-open');
  document.getElementById('auth-screen').classList.add('active');
  goLayer('layer-start');
}

/* ══ STATE ══ */
let G={};
let clockInt=null,asInt=null,paused=false,currentTab='upgrades';

function mkFarm(){
  return Array.from({length:GH},()=>Array.from({length:GW},()=>({tilled:false,watered:false,crop:null,idleDays:0,deco:null})));
}
function initState(){
  const homeFarm=mkFarm();
  G={day:1,si:0,year:1,weather:'sunny',time:360,gold:500,energy:100,
     farm:homeFarm,inv:{parsnip:5,carrot:3},bag:{},pending:0,
     tool:'hoe',seed:'parsnip',deco:'path',
     stats:{crops:0,earned:0,days:0},
     yearEarned:0,achievements:[],market:{prices:{},history:{}},
     skills:{farming:{xp:0},watering:{xp:0},harvesting:{xp:0}},
     upgrades:{},landUpgrades:{home:{}},lands:{},cactusRain:false,
     farms:{home:homeFarm},currentLand:'home',
     company:null,stocks:{},stockMarket:{}};
}
function loadState(s){
  G=s;
  if(!G.stats)G.stats={crops:0,earned:0,days:0};
  if(!G.achievements)G.achievements=[];
  if(G.yearEarned===undefined)G.yearEarned=0;
  if(!G.market)G.market={prices:{},history:{}};
  if(!G.skills)G.skills={farming:{xp:0},watering:{xp:0},harvesting:{xp:0}};
  if(!G.skills.farming)G.skills.farming={xp:0};
  if(!G.skills.watering)G.skills.watering={xp:0};
  if(!G.skills.harvesting)G.skills.harvesting={xp:0};
  if(!G.upgrades)G.upgrades={};
  if(!G.lands)G.lands={};
  if(G.cactusRain===undefined)G.cactusRain=false;
  if(G.deco===undefined)G.deco='path';
  // Migrate: ensure landUpgrades (per-land upgrade system)
  if(!G.landUpgrades){
    // Copy old global upgrades to home land upgrades for backward compat
    G.landUpgrades={home:{...G.upgrades}};
  }
  if(!G.landUpgrades.home)G.landUpgrades.home={...G.upgrades};
  // Migrate: ensure farms & currentLand
  if(!G.farms)G.farms={home:G.farm};
  if(!G.currentLand)G.currentLand='home';
  // Ensure home farm is in farms
  if(!G.farms.home)G.farms.home=G.farm;
  // Ensure active farm is in sync with farms
  G.farms[G.currentLand]=G.farm;
  G.farm=G.farms[G.currentLand];
  G.farm=G.farm.map(row=>row.map(t=>({deco:null,idleDays:0,...t})));
  G.farms[G.currentLand]=G.farm;
  // Normalize other farm grids & ensure debtDays
  Object.keys(G.farms).forEach(id=>{
    if(id===G.currentLand)return;
    G.farms[id]=G.farms[id].map(row=>row.map(t=>({deco:null,idleDays:0,...t})));
  });
  // Ensure debtDays on all rented lands
  Object.values(G.lands||{}).forEach(l=>{if(l.debtDays===undefined)l.debtDays=0;});
  if(!G.company&&G.company!==null)G.company=null;
  if(!G.stocks)G.stocks={};
  if(!G.stockMarket)G.stockMarket={};
}

/* ══ HELPERS ══ */
function season(){return SEASONS[G.si];}
function sCrops(){return Object.entries(CROPS).filter(([,c])=>c.seasons.includes(season()));}
function fmtTime(t){const h=Math.floor(t/60)%24,m=t%60,ap=h>=12?'PM':'AM';const h12=h===0?12:h>12?h-12:h;return`${h12}:${String(m).padStart(2,'0')} ${ap}`;}
function cropStage(c){if(!c)return -1;const d=CROPS[c.type].days;if(c.days>=d)return 3;if(c.days>=Math.ceil(d*0.66))return 2;if(c.days>=Math.ceil(d*0.33))return 1;return 0;}
function dnIcon(t){if(t<420)return'🌅';if(t<780)return'☀️';if(t<1020)return'🌤️';if(t<1140)return'🌆';return'🌙';}
// Per-land upgrade helpers
function landUpgs(id){return(G.landUpgrades&&G.landUpgrades[id])||{};}
function curUpgs(){return landUpgs(G.currentLand||'home');}
function maxEnergy(){return 100+(curUpgs().well||0)*50;}
function barnMult(){return 1+(curUpgs().barn||0)*0.15;}
// Seed prices inflate slightly each year (~4% per year)
function seedBuyPrice(type){return Math.round(CROPS[type].buy*(1+(G.year-1)*0.04));}
function getLevel(xp){let lv=1;for(let i=1;i<XP_LEVELS.length;i++){if(xp>=XP_LEVELS[i])lv=i+1;else break;}return Math.min(10,lv);}
function getXPPct(xp){const lv=getLevel(xp);if(lv>=10)return 100;return Math.round(((xp-XP_LEVELS[lv-1])/(XP_LEVELS[lv]-XP_LEVELS[lv-1]))*100);}

/* ══ HARVEST ALL ══ */
function allCropsReady(){
  let hasCrop=false,allReady=true;
  for(let r=0;r<GH;r++)for(let c=0;c<GW;c++){const cr=G.farm[r][c].crop;if(cr){hasCrop=true;if(cropStage(cr)!==3)allReady=false;}}
  return hasCrop&&allReady;
}
function scytheAll(){
  if(!allCropsReady()){toast('Not all crops are ready yet!','warn');return;}
  const hLv=getLevel(G.skills?.harvesting?.xp||0);
  const bonusChance=hLv>=10?0.25:hLv>=5?0.15:0;
  let total=0;
  G.farm=G.farm.map(row=>row.map(tile=>{
    if(!tile.crop||cropStage(tile.crop)!==3)return tile;
    let qty=1;
    if(bonusChance>0&&Math.random()<bonusChance)qty=2;
    G.bag[tile.crop.type]=(G.bag[tile.crop.type]||0)+qty;
    total+=qty;G.stats.crops+=qty;
    addXP('harvesting',10);
    if(S.energyCost)G.energy=Math.max(0,G.energy-1);
    return{...tile,crop:null,watered:false,idleDays:0};
  }));
  snd('harvest');
  toast('🌾 Harvested all '+total+' crops!','success',3200);
  render();
}

/* ══ TOOL VISUAL EFFECT ══ */
function spawnTileEffect(r,c,emoji){
  const grid=document.getElementById('farm-grid');
  const idx=r*GW+c;
  const el=grid.children[idx];
  if(!el)return;
  const rect=el.getBoundingClientRect();
  const fx=document.createElement('div');
  fx.className='tile-effect';fx.textContent=emoji;
  fx.style.left=(rect.left+rect.width/2-12)+'px';
  fx.style.top=(rect.top+rect.height/2-12)+'px';
  document.body.appendChild(fx);
  setTimeout(()=>fx.remove(),700);
}

/* ══ XP SYSTEM ══ */
function addXP(skill,amount){
  if(!G.skills[skill])G.skills[skill]={xp:0};
  const sk=G.skills[skill];
  const prevLv=getLevel(sk.xp);
  sk.xp+=amount;
  const newLv=getLevel(sk.xp);
  if(newLv>prevLv){
    snd('levelup');
    const names={farming:'Farming',watering:'Watering',harvesting:'Harvesting'};
    const bonuses={
      farming:{5:'Tilling costs 0 energy!',10:'Tilled tiles auto-water!'},
      watering:{5:'Watering costs 0 energy!',10:'Double water power!'},
      harvesting:{5:'+15% double harvest chance!',10:'+25% double harvest chance!'},
    };
    const bonus=bonuses[skill]?.[newLv]||'';
    setTimeout(()=>showAchievement('⭐',`${names[skill]} Lv.${newLv}!`,bonus||`${names[skill]} skill up!`),800);
    toast(`⭐ ${names[skill]} Level ${newLv}!`,'success',3000);
  }
}

/* ══ TOAST ══ */
let tid=0;
function toast(msg,type,dur){
  type=type||'info';dur=dur||2600;
  if(!S.toasts&&type!=='success')return;
  const id=++tid,el=document.createElement('div');
  el.className='toast t-'+type;el.id='t'+id;el.textContent=msg;
  document.getElementById('toast-wrap').appendChild(el);
  setTimeout(()=>{el.classList.add('toast-out');setTimeout(()=>el.remove(),220);},dur);
}

/* ══ RENDER HUD ══ */
function renderHUD(){
  const s=season();
  document.getElementById('hud-day').textContent='Day '+G.day;
  document.getElementById('hud-season').textContent=s;
  const sp=document.getElementById('season-pill');
  sp.style.background=S.retro?'transparent':SEASON_BG[s];
  sp.style.borderColor=S.retro?'transparent':SEASON_COL[s]+'55';
  sp.style.color=S.retro?'#f5deb3':SEASON_COL[s];
  document.getElementById('hud-year').textContent='Yr.'+G.year;
  const rainy=G.weather==='rainy';
  document.getElementById('weather-em').textContent=rainy?'🌧️':'☀️';
  document.getElementById('hud-weather').textContent=rainy?'Rainy':'Sunny';
  document.getElementById('hud-time').textContent=fmtTime(G.time);
  document.getElementById('dn-icon').textContent=dnIcon(G.time);
  const tPct=Math.min(100,((G.time-360)/(1320-360))*100);
  const tb=document.getElementById('time-bar');
  tb.style.width=tPct+'%';tb.style.background=tPct>80?'#ef4444':'#f59e0b';
  const eb=document.getElementById('energy-bar');
  eb.style.width=(G.energy/maxEnergy()*100)+'%';
  eb.style.background=G.energy>maxEnergy()*0.5?'#22c55e':G.energy>maxEnergy()*0.25?'#f59e0b':'#ef4444';
  document.getElementById('hud-energy').textContent=G.energy;
  document.getElementById('hud-gold').textContent=G.gold+'g';
  document.getElementById('hud-pending').textContent=G.pending>0?'(+'+G.pending+'g tmrw)':'';
  // Current land pill
  const cl=G.currentLand||'home';
  const landPill=document.getElementById('hud-land-pill');
  if(landPill){
    if(cl!=='home'){
      const t=LAND_TERRAIN[cl]||LAND_TERRAIN.home;
      document.getElementById('hud-land-name').textContent=t.label;
      landPill.style.display='flex';
    } else {
      landPill.style.display='none';
    }
  }
}

/* ══ RENDER FARM ══ */
function renderFarm(){
  const grid=document.getElementById('farm-grid');
  grid.style.gridTemplateColumns=`repeat(${GW},52px)`;
  grid.style.gridTemplateRows=`repeat(${GH},52px)`;

  // Use land-specific grass colors
  const terrain=LAND_TERRAIN[G.currentLand||'home']||LAND_TERRAIN.home;
  const gc=terrain.grass[season()]||GRASS[season()];

  // Apply optional water tint for riverbank
  const wrap=document.getElementById('farm-wrap');
  if(terrain.waterTint){
    wrap.style.backgroundImage=`linear-gradient(180deg,${terrain.waterTint} 0%,transparent 35%)`;
  } else {
    wrap.style.backgroundImage='';
  }

  // Per-land tree/decoration map
  const landTreeList=LAND_TREES[G.currentLand||'home']||LAND_TREES.home;
  const currentTMAP=new Map(landTreeList.map(([r,c,e])=>[r*100+c,e]));

  // Collect lamp positions for glow rendering
  const lampPositions=new Set();
  for(let r=0;r<GH;r++)for(let c=0;c<GW;c++){
    if(G.farm[r][c].deco==='lamp')lampPositions.add(r*100+c);
  }
  // Build lit tile set (all tiles within radius 2 of a lamp)
  const litTiles=new Map(); // key -> intensity 0-1
  lampPositions.forEach(key=>{
    const lr=Math.floor(key/100),lc=key%100;
    for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++){
      const r2=lr+dr,c2=lc+dc;
      if(r2<0||r2>=GH||c2<0||c2>=GW)continue;
      const dist=Math.sqrt(dr*dr+dc*dc);
      const intensity=Math.max(0,1-dist/2.8);
      const k=r2*100+c2;
      if(!litTiles.has(k)||litTiles.get(k)<intensity)litTiles.set(k,intensity);
    }
  });

  grid.innerHTML='';

  for(let r=0;r<GH;r++){
    for(let c=0;c<GW;c++){
      const tkey=r*100+c;
      if(currentTMAP.has(tkey)){
        const div=document.createElement('div');
        div.className='tile-tree';div.style.background=gc;
        let em=currentTMAP.get(tkey);
        const s=season();
        // Season changes for tree-like emojis
        if(s==='Fall'&&(em==='🌳'||em==='🌲'||em==='🌴'))em='🍂';
        else if(s==='Winter'&&em==='🌳')em='🪨';
        else if(s==='Winter'&&em==='🌲')em='❄️';
        else if(s==='Winter'&&em==='🌴')em='🌵';
        else if(s==='Fall'&&em==='🌺')em='🍁';
        else if(s==='Winter'&&em==='🌸')em='❄️';
        div.textContent=em;
        if(em==='🌵'&&(G.currentLand||'home')==='home'){div.classList.add('tile-cactus');div.addEventListener('click',cactusClick);}
        grid.appendChild(div);continue;
      }

      const tile=G.farm[r][c];
      const div=document.createElement('div');
      div.className='tile';
      const isLit=litTiles.has(tkey);
      const isLampSrc=lampPositions.has(tkey);

      if(tile.tilled){
        div.style.background=tile.watered?SOIL_W:SOIL_N;
        div.style.borderColor='rgba(0,0,0,0.20)';
        if(!tile.crop&&(tile.idleDays||0)>=1)div.classList.add('tile-idle');
      } else if(tile.deco){
        div.style.background=gc;
        if(tile.deco==='path')div.style.background='#b8a890';
        const decoEl=document.createElement('span');
        decoEl.className='tile-deco';
        decoEl.textContent=DECOS[tile.deco]?.e||'';
        div.appendChild(decoEl);
        if(tile.deco==='scarecrow')div.classList.add('tile-scarecrow');
        if(isLampSrc)div.classList.add('tile-lamp-src');
      } else {
        div.style.background=gc;
      }

      // Lamp glow overlay for nearby tiles
      if(isLit&&!isLampSrc){
        const glow=document.createElement('div');
        glow.className='lamp-glow-overlay';
        glow.style.opacity=litTiles.get(tkey).toFixed(2);
        div.appendChild(glow);
      }

      if(!tile.tilled&&!tile.deco){
        const g2=document.createElement('span');g2.className='grass-deco';g2.textContent='🌾';div.appendChild(g2);
      }

      const st=cropStage(tile.crop);
      const ready=st===3;
      if(ready)div.classList.add('tile-ready');
      if(tile.crop)div.classList.add('tile-s'+st);

      if(tile.crop){
        const ci=document.createElement('span');ci.className='crop-em';
        ci.textContent=['🌱','🌿','🪴',CROPS[tile.crop.type].e][st];
        div.appendChild(ci);
        if(ready){
          const sp=document.createElement('span');sp.className='sparkle';sp.textContent='✨';div.appendChild(sp);
        } else {
          const db=document.createElement('span');db.className='days-badge';
          db.textContent=(CROPS[tile.crop.type].days-tile.crop.days)+'d';div.appendChild(db);
        }
      }
      if(tile.watered&&!tile.crop){const wd=document.createElement('div');wd.className='water-dot';div.appendChild(wd);}
      div.addEventListener('click',()=>clickTile(r,c));
      grid.appendChild(div);
    }
  }
}

/* ══ RENDER SIDE ══ */
function renderSide(){
  let html;
  if(currentTab==='inv')html=buildInv();
  else if(currentTab==='shop')html=buildShop();
  else if(currentTab==='map')html=buildMap();
  else html=buildUpgrades();

  ['side-content','sheet-content'].forEach(id=>{
    const el=document.getElementById(id);
    if(!el)return;
    el.innerHTML=html;
    el.querySelectorAll('[data-sell]').forEach(b=>b.addEventListener('click',shipAll));
    el.querySelectorAll('[data-buy]').forEach(b=>b.addEventListener('click',()=>buySeed(b.dataset.buy,+b.dataset.qty)));
    el.querySelectorAll('[data-upgrade]').forEach(b=>b.addEventListener('click',()=>buyUpgrade(b.dataset.upgrade)));
    el.querySelectorAll('[data-auction]').forEach(b=>b.addEventListener('click',()=>auctionSell(b.dataset.auction,+b.dataset.qty)));
    el.querySelectorAll('[data-buy-land]').forEach(b=>b.addEventListener('click',()=>buyLand(b.dataset.buyLand)));
    el.querySelectorAll('[data-rent-land]').forEach(b=>b.addEventListener('click',()=>rentLand(b.dataset.rentLand)));
    el.querySelectorAll('[data-leave-land]').forEach(b=>b.addEventListener('click',()=>leaveLand(b.dataset.leaveLand)));
    el.querySelectorAll('[data-travel]').forEach(b=>b.addEventListener('click',()=>travelTo(b.dataset.travel)));
  });
}

/* ══ BUILD INVENTORY ══ */
function buildSkillSection(){
  const skillMeta={
    farming:{e:'⛏',n:'Farming',col:'#a16207'},
    watering:{e:'💧',n:'Watering',col:'#2563eb'},
    harvesting:{e:'🌾',n:'Harvesting',col:'#16a34a'},
  };
  const bonuses={
    farming:{5:'Tilling costs 0 energy',10:'Tilled tiles auto-water'},
    watering:{5:'Watering costs 0 energy',10:'Watering costs 0 energy'},
    harvesting:{5:'+15% double harvest',10:'+25% double harvest'},
  };
  let h='<div class="s-sec">⭐ Skills</div>';
  Object.entries(skillMeta).forEach(([key,meta])=>{
    const sk=G.skills?.[key]||{xp:0};
    const lv=getLevel(sk.xp);
    const pct=getXPPct(sk.xp);
    const bonus=bonuses[key]?.[lv];
    h+=`<div class="skill-item">
      <div class="skill-header">
        <span class="skill-name">${meta.e} ${meta.n}</span>
        <span class="skill-level">Lv.${lv}${lv>=10?'★':''}</span>
      </div>
      <div class="skill-bar-outer"><div class="skill-bar-inner" style="width:${pct}%;background:${meta.col}"></div></div>
      ${bonus?`<span class="skill-bonus-tag">✓ ${bonus}</span>`:''}
    </div>`;
  });
  return h;
}

function buildInv(){
  const isWinter=season()==='Winter';
  const m=ensureMarket();
  const seeds=Object.entries(G.inv).filter(([,q])=>q>0);
  const bag=Object.entries(G.bag).filter(([,q])=>q>0);
  const hasBarn=(G.upgrades?.barn||0)>0;
  const barnTag=hasBarn?`<span class="barn-bonus-tag">🏚+${Math.round((barnMult()-1)*100)}%</span>`:'';

  const getVal=(t,q)=>{
    const basePrice=isWinter?(m.prices[t]||CROPS[t].sell):CROPS[t].sell;
    return Math.round(basePrice*q*barnMult());
  };
  const total=bag.reduce((s,[t,q])=>s+getVal(t,q),0);

  let h='<div class="s-sec">🌱 Seeds</div>';
  if(!seeds.length)h+='<p class="empty-msg">No seeds.<br>Visit the shop!</p>';
  seeds.forEach(([t,q])=>{h+=`<div class="inv-row"><span>${CROPS[t].e} ${CROPS[t].n}</span><span class="inv-qty">×${q}</span></div>`;});
  h+='<div class="s-sec">🧺 Harvested</div>';
  if(!bag.length)h+='<p class="empty-msg">Harvest ready crops<br>with the scythe!</p>';
  if(isWinter){
    bag.forEach(([t,q])=>{
      const mktPrice=m.prices[t]||CROPS[t].sell;
      const val=Math.round(mktPrice*q*barnMult());
      h+=`<div class="inv-row"><span>${CROPS[t].e} ${CROPS[t].n}</span><span class="inv-val">×${q} · ${val}g ❄️</span></div>`;
    });
    if(bag.length){
      h+=`<div class="winter-bag-note" onclick="setTab('shop')">❄️ <b>Winter Auction Active!</b><br>Go to <b>Market tab</b> to sell at live prices<br>Total value: <b>~${total}g</b>${barnTag}</div>`;
    }
  } else {
    bag.forEach(([t,q])=>{
      const val=getVal(t,q);
      h+=`<div class="inv-row"><span>${CROPS[t].e} ${CROPS[t].n}</span><span class="inv-val">×${q} · ${val}g${barnTag}</span></div>`;
    });
    if(bag.length)h+=`<button class="ship-btn" data-sell="1">📦 Ship All · ${total}g${barnTag}</button>`;
  }
  if(G.pending>0)h+=`<div class="pending-box">📮 Shipping<br><b>${G.pending}g</b> arrives tomorrow</div>`;
  h+=buildSkillSection();
  h+=`<div class="stats-box"><b>📊 Stats</b><br>🌾 Harvested: ${G.stats.crops}<br>💰 Earned: ${G.stats.earned}g<br>📅 Days: ${G.stats.days}<br>📆 Year: ${G.year}</div>`;
  return h;
}

/* ══ BUILD SHOP ══ */
function buildShop(){
  const s=season();
  if(s==='Winter')return buildWinterMarket();
  const yearNote=G.year>1?`<div class="market-header">Year ${G.year} prices · Seeds cost ~${Math.round((G.year-1)*4)}% more than Year 1</div>`:'';
  let h=`<div class="s-sec">🌞 ${s} Seeds</div>${yearNote}`;
  sCrops().forEach(([type,crop])=>{
    const bp=seedBuyPrice(type);
    const c5=bp*5,c10=bp*10,hv=G.inv[type]||0;
    h+=`<div class="shop-card">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:2px">
        <span class="shop-name">${crop.e} ${crop.n}</span><span class="shop-price">${bp}g</span>
      </div>
      <div class="shop-meta">⏱ ${crop.days}d · sells ${crop.sell}g · have: ${hv}</div>
      <div class="shop-row">
        <button class="buy-btn" data-buy="${type}" data-qty="5" ${G.gold<c5?'disabled':''}>×5 (${c5}g)</button>
        <button class="buy-btn" data-buy="${type}" data-qty="10" ${G.gold<c10?'disabled':''}>×10 (${c10}g)</button>
      </div></div>`;
  });
  return h;
}

/* ══ BUILD WINTER MARKET (AUCTION) ══ */
function ensureMarket(){
  if(!G.market)G.market={prices:{},history:{}};
  return G.market;
}

function tickMarket(){
  const m=ensureMarket();
  const yearMult=1+(G.year-1)*0.06;
  Object.entries(CROPS).forEach(([type,crop])=>{
    const base=crop.sell*yearMult;
    const prev=m.prices[type]||base;
    const revert=(base-prev)*0.12;
    const noise=(Math.random()-0.47)*0.28*prev;
    const newPrice=Math.round(Math.max(Math.floor(base*0.35),Math.min(Math.ceil(base*2.4),prev+revert+noise)));
    if(!m.history[type])m.history[type]=[];
    m.history[type].push(newPrice);
    if(m.history[type].length>6)m.history[type].shift();
    m.prices[type]=newPrice;
  });
}

function sparkline(hist){
  if(!hist||hist.length<2)return'';
  const min=Math.min(...hist),max=Math.max(...hist),range=max-min||1;
  return hist.map((v,i)=>{
    const h=Math.round(((v-min)/range)*13)+3;
    const isLast=i===hist.length-1;
    const col=isLast?(v>=(hist[i-1]||v)?'#22c55e':'#ef4444'):'#d1d5db';
    return`<div style="width:4px;height:${h}px;background:${col};border-radius:1px;display:inline-block;margin:0 1px;vertical-align:bottom"></div>`;
  }).join('');
}

function buildWinterMarket(){
  const m=ensureMarket();
  const hasBag=Object.entries(G.bag).some(([,q])=>q>0);
  const yearMult=1+(G.year-1)*0.06;
  const marketDir=G.year>1?(yearMult>1.1?'bull':'bear'):'bull';
  const hasBarn=(G.upgrades?.barn||0)>0;

  // Total value if selling everything
  const bagTotal=Object.entries(G.bag).reduce((s,[t,q])=>s+Math.round((m.prices[t]||CROPS[t].sell)*q*barnMult()),0);

  let h=`<div class="s-sec">❄️ Winter Auction <span class="market-yr-badge ${marketDir}">${marketDir==='bull'?'📈 Bull':'📉 Bear'} Yr.${G.year}</span></div>`;
  h+=`<div class="market-header">Prices shift every day · Best crops command premium · ${hasBarn?`🏚 Barn +${Math.round((barnMult()-1)*100)}% active`:'Buy Barn upgrade for sales bonus!'}</div>`;

  if(hasBag){
    h+=`<button class="mkt-sell-all" onclick="sellAllAtAuction()">💰 Sell Everything · ${bagTotal}g</button>`;
  }

  const sorted=Object.entries(CROPS).sort(([ta],[tb])=>{
    const aHas=(G.bag[ta]||0)>0,bHas=(G.bag[tb]||0)>0;
    if(aHas&&!bHas)return -1;if(!aHas&&bHas)return 1;return 0;
  });

  sorted.forEach(([type,crop])=>{
    const price=m.prices[type]||Math.round(crop.sell*yearMult);
    const hist=m.history[type]||[price];
    const prev=hist.length>1?hist[hist.length-2]:crop.sell;
    const diff=price-prev;
    const pct=prev>0?Math.round(Math.abs(diff/prev)*100):0;
    const up=diff>=0;
    const trendCol=up?'#22c55e':'#ef4444';
    const trendSym=up?'▲':'▼';
    const qty=G.bag[type]||0;
    const hasIt=qty>0;
    const sellPrice1=Math.round(price*barnMult());
    const sellPriceAll=Math.round(price*qty*barnMult());

    h+=`<div class="market-row${hasIt?' market-row-has':''}">
      <div class="market-top">
        <div class="market-left">
          <span class="market-em">${crop.e}</span>
          <div>
            <div class="market-name">${crop.n}</div>
            ${hasIt
              ?`<div class="market-qty">In bag: ×${qty}</div>`
              :`<div class="market-qty market-qty-base">base: ${crop.sell}g</div>`
            }
          </div>
        </div>
        <div class="market-price-block">
          <div class="market-mini">${sparkline(hist)}</div>
          <div class="market-price">${price}g</div>
          <div class="market-trend" style="color:${trendCol}">${trendSym}${pct}%</div>
        </div>
      </div>
      ${hasIt?`<div class="market-sell-row">
        <button class="sell-mkt-btn" data-auction="${type}" data-qty="1">×1 · ${sellPrice1}g</button>
        ${qty>1?`<button class="sell-mkt-btn sell-all" data-auction="${type}" data-qty="${qty}">×${qty} All · ${sellPriceAll}g</button>`:''}
      </div>`:''}
    </div>`;
  });

  if(!hasBag){
    h+=`<div class="market-note">💡 You have no crops to sell.<br>Stock up in Fall before Winter arrives!<br><br>Watch the prices — plan your harvest timing!</div>`;
  }
  return h;
}

/* ══ BUILD UPGRADES ══ */
function buildUpgrades(){
  const cl=G.currentLand||'home';
  const terrain=LAND_TERRAIN[cl]||LAND_TERRAIN.home;
  const upgs=landUpgs(cl);
  let h=`<div class="s-sec">⚒ ${terrain.icon} ${terrain.label} Upgrades</div>`;
  h+=`<div class="market-header">Upgrades are <b>per-land</b> — each farm has its own. Home upgrades don't apply to other plots!</div>`;
  Object.entries(UPGRADES).forEach(([id,upg])=>{
    const owned=upgs[id]||0;
    const maxed=owned>=upg.max;
    const canBuy=G.gold>=upg.cost&&!maxed;
    const stackNote=upg.max>1?` (${owned}/${upg.max} owned)`:'';
    h+=`<div class="upg-card">
      <div class="upg-header">
        <span class="upg-name">${upg.e} ${upg.n}</span>
        <span class="upg-cost">${maxed?'MAXED':upg.cost+'g'}</span>
      </div>
      <div class="upg-desc">${upg.desc}</div>
      ${owned>0?`<span class="upg-owned-tag">✓ Active on this farm${stackNote}</span>`:''}
      <button class="upg-buy-btn" data-upgrade="${id}" ${canBuy?'':'disabled'}>
        ${maxed?'✓ Fully Upgraded':canBuy?`Buy · ${upg.cost}g`:`Need ${upg.cost}g`}
      </button>
    </div>`;
  });
  h+=`<div class="market-note" style="margin-top:4px">💡 <b>Tips:</b><br>Sprinkler auto-waters this farm only.<br>Greenhouse only protects crops on this farm.<br>Barn bonus applies to all sales from any farm.<br>Well increases energy for this land's sessions!</div>`;
  return h;
}

/* ══ AUCTION / SHIP ══ */
function auctionSell(type,qty){
  const m=ensureMarket();
  const have=G.bag[type]||0;
  qty=Math.min(qty,have);
  if(qty<=0){toast('Nothing to sell!','warn');snd('error');return;}
  const price=m.prices[type]||CROPS[type].sell;
  const total=Math.round(price*qty*barnMult());
  G.bag[type]=(G.bag[type]||0)-qty;
  if(G.bag[type]<=0)delete G.bag[type];
  G.gold+=total;
  G.stats.earned+=total;
  G.yearEarned=(G.yearEarned||0)+total;
  checkAchievements();
  snd('coin');
  toast('Sold ×'+qty+' '+CROPS[type].n+' for '+total+'g! 💰','success');
  render();
}

function sellAllAtAuction(){
  const m=ensureMarket();
  const entries=Object.entries(G.bag).filter(([,q])=>q>0);
  if(!entries.length){toast('Nothing to sell!','error');snd('error');return;}
  let total=0;
  entries.forEach(([type,qty])=>{
    const price=m.prices[type]||CROPS[type].sell;
    const earned=Math.round(price*qty*barnMult());
    total+=earned;
    G.stats.earned+=earned;
    G.yearEarned=(G.yearEarned||0)+earned;
  });
  G.bag={};G.gold+=total;
  checkAchievements();
  snd('coin');
  toast('Auction sold everything for '+total+'g! 💰','success',3200);
  render();
}

function shipAll(){
  if(season()==='Winter'){toast('❄️ Use the Market tab to sell in Winter!','warn');return;}
  const ent=Object.entries(G.bag).filter(([,q])=>q>0);
  if(!ent.length){toast('Nothing to ship!','error');return;}
  let total=0;ent.forEach(([t,q])=>{total+=Math.round(CROPS[t].sell*q*barnMult());});
  G.bag={};G.pending+=total;G.stats.earned+=total;
  snd('ship');
  toast('📦 Shipped '+total+'g — arrives tomorrow!','success');render();
}

function buySeed(type,qty){
  const cr=CROPS[type],cost=seedBuyPrice(type)*qty;
  if(G.gold<cost){toast('Need '+cost+'g! 💸','error');snd('error');return;}
  G.gold-=cost;G.inv[type]=(G.inv[type]||0)+qty;
  snd('buy');
  toast('Bought ×'+qty+' '+cr.n+'!','success');render();
}

function buyUpgrade(id){
  const upg=UPGRADES[id];
  if(!upg)return;
  const cl=G.currentLand||'home';
  if(!G.landUpgrades)G.landUpgrades={};
  if(!G.landUpgrades[cl])G.landUpgrades[cl]={};
  const upgs=G.landUpgrades[cl];
  const owned=upgs[id]||0;
  if(owned>=upg.max){toast('Already maxed out on this farm!','warn');return;}
  if(G.gold<upg.cost){toast('Need '+upg.cost+'g! 💸','error');snd('error');return;}
  G.gold-=upg.cost;
  upgs[id]=(upgs[id]||0)+1;
  snd('buy');
  const terrain=LAND_TERRAIN[cl]||LAND_TERRAIN.home;
  toast(upg.e+' '+upg.n+' purchased for '+terrain.label+'!','success',3000);
  const msgs={
    sprinkler:'🚿 This farm\'s crops will be auto-watered each morning!',
    greenhouse:'🏡 Crops on this farm can now survive through Winter!',
    barn:'🏚 All sales now earn +15% bonus!',
    well:'🪣 Max energy increased to '+maxEnergy()+'!',
  };
  if(msgs[id])setTimeout(()=>toast(msgs[id],'info',3500),1200);
  render();
}

/* ══ BUILD MAP ══ */
function buildMapSVG(owned,small){
  const W=small?300:520,H=small?190:320;
  const sc=small?0.58:1;
  // Terrain SVG background + overlaid land plots
  return`<svg viewBox="0 0 ${W} ${H}" xmlns="http://www.w3.org/2000/svg" style="position:absolute;inset:0;width:100%;height:100%;display:block">
    <defs>
      <filter id="shadow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="1" dy="2" stdDeviation="2" flood-color="rgba(0,0,0,0.35)"/>
      </filter>
      <filter id="glow">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <pattern id="hatch" width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
        <line x1="0" y1="0" x2="0" y2="6" stroke="rgba(0,0,0,0.08)" stroke-width="1"/>
      </pattern>
      <radialGradient id="grd-center" cx="50%" cy="45%" r="55%">
        <stop offset="0%" stop-color="#3d8b5e"/>
        <stop offset="100%" stop-color="#1a4530"/>
      </radialGradient>
      <linearGradient id="river-grad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#38bdf8" stop-opacity="1"/>
        <stop offset="100%" stop-color="#0ea5e9" stop-opacity="1"/>
      </linearGradient>
      <linearGradient id="river-glow" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="#7dd3fc" stop-opacity="0.5"/>
        <stop offset="100%" stop-color="#38bdf8" stop-opacity="0.5"/>
      </linearGradient>
    </defs>
    <!-- Base terrain -->
    <rect width="${W}" height="${H}" fill="url(#grd-center)"/>
    <!-- Texture overlay -->
    <rect width="${W}" height="${H}" fill="url(#hatch)" opacity="0.4"/>
    <!-- Mountain ridges top-right -->
    <ellipse cx="${W*0.82}" cy="${H*0.22}" rx="${W*0.12}" ry="${H*0.14}" fill="#557a6a" opacity="0.6"/>
    <ellipse cx="${W*0.88}" cy="${H*0.18}" rx="${W*0.09}" ry="${H*0.11}" fill="#4a6e5e" opacity="0.5"/>
    <!-- Forest blobs top-left -->
    <ellipse cx="${W*0.12}" cy="${H*0.18}" rx="${W*0.1}" ry="${H*0.12}" fill="#2d6b45" opacity="0.55"/>
    <ellipse cx="${W*0.08}" cy="${H*0.28}" rx="${W*0.07}" ry="${H*0.09}" fill="#2d6b45" opacity="0.45"/>
    <!-- River: outer glow (wide, soft blue) -->
    <path d="M${W*0.72},0 Q${W*0.68},${H*0.25} ${W*0.62},${H*0.42} Q${W*0.56},${H*0.58} ${W*0.5},${H*0.72} Q${W*0.44},${H*0.86} ${W*0.4},${H}" 
          fill="none" stroke="url(#river-glow)" stroke-width="${small?16:24}" stroke-linecap="round" opacity="0.45"/>
    <!-- River: water body fill (medium, saturated blue) -->
    <path d="M${W*0.72},0 Q${W*0.68},${H*0.25} ${W*0.62},${H*0.42} Q${W*0.56},${H*0.58} ${W*0.5},${H*0.72} Q${W*0.44},${H*0.86} ${W*0.4},${H}" 
          fill="none" stroke="url(#river-grad)" stroke-width="${small?7:11}" stroke-linecap="round" opacity="0.95"/>
    <!-- River: shimmer highlights -->
    <path d="M${W*0.72},0 Q${W*0.68},${H*0.25} ${W*0.62},${H*0.42} Q${W*0.56},${H*0.58} ${W*0.5},${H*0.72} Q${W*0.44},${H*0.86} ${W*0.4},${H}" 
          fill="none" stroke="rgba(224,242,254,0.7)" stroke-width="${small?2.5:4}" stroke-linecap="round" stroke-dasharray="${small?'6,8':'10,12'}"/>
    <!-- Dotted roads -->
    <path d="M${W*0.15},${H*0.5} Q${W*0.32},${H*0.48} ${W*0.48},${H*0.47} Q${W*0.6},${H*0.46} ${W*0.78},${H*0.48}"
          fill="none" stroke="rgba(230,200,140,0.7)" stroke-width="${small?1.5:2.5}" stroke-dasharray="${small?'5,4':'8,6'}" stroke-linecap="round"/>
    <path d="M${W*0.48},${H*0.47} L${W*0.48},${H*0.12}"
          fill="none" stroke="rgba(230,200,140,0.6)" stroke-width="${small?1.2:2}" stroke-dasharray="${small?'4,3':'6,5'}" stroke-linecap="round"/>
    <!-- Land plot: Meadow (top-left) -->
    ${_mapPlot(owned,'meadow',W*0.03,H*0.05,W*0.28,H*0.36,small)}
    <!-- Land plot: Riverbank (top-right) -->
    ${_mapPlot(owned,'riverbank',W*0.67,H*0.05,W*0.29,H*0.36,small)}
    <!-- Starter Farm (center) -->
    <rect x="${W*0.36}" y="${H*0.1}" width="${W*0.28}" height="${H*0.35}" rx="7" ry="7"
          fill="#5aab40" stroke="#22c55e" stroke-width="2.5" filter="url(#shadow)"/>
    <rect x="${W*0.36}" y="${H*0.1}" width="${W*0.28}" height="${H*0.35}" rx="7" fill="none"
          stroke="rgba(34,197,94,0.5)" stroke-width="5"/>
    <text x="${W*0.5}" y="${H*0.26}" text-anchor="middle" font-size="${small?12:18}" dominant-baseline="middle">🏡</text>
    <text x="${W*0.5}" y="${H*0.36}" text-anchor="middle" fill="white" font-size="${small?5:7.5}" font-weight="800" font-family="Nunito,sans-serif"
          style="text-shadow:0 1px 2px rgba(0,0,0,0.8)">YOUR FARM</text>
    <text x="${W*0.5}" y="${H*0.41}" text-anchor="middle" fill="rgba(255,255,255,0.7)" font-size="${small?4:6}" font-family="Nunito,sans-serif">Starter Plot</text>
    <!-- Land plot: Hill Farm (bottom-left) -->
    ${_mapPlot(owned,'hillfarm',W*0.03,H*0.54,W*0.28,H*0.38,small)}
    <!-- Land plot: Rich Lowland (bottom-right) -->
    ${_mapPlot(owned,'lowland',W*0.67,H*0.54,W*0.29,H*0.38,small)}
    <!-- Land plot: Volcanic (bottom-center) -->
    ${_mapPlot(owned,'volcanic',W*0.33,H*0.7,W*0.31,H*0.27,small)}
    <!-- Compass rose (top-right corner) -->
    <g transform="translate(${W-(small?28:42)},${small?18:24}) scale(${small?0.65:0.9})">
      <circle r="13" fill="rgba(0,0,0,0.35)" cx="0" cy="0"/>
      <polygon points="0,-12 -4,-2 4,-2" fill="white" opacity="0.95"/>
      <polygon points="0,12 -4,2 4,2" fill="rgba(255,255,255,0.45)"/>
      <polygon points="-12,0 -2,-4 -2,4" fill="rgba(255,255,255,0.45)"/>
      <polygon points="12,0 2,-4 2,4" fill="rgba(255,255,255,0.45)"/>
      <text x="0" y="-15" text-anchor="middle" fill="white" font-size="7" font-weight="800" font-family="sans-serif">N</text>
    </g>
    <!-- Legend -->
    <g transform="translate(${small?5:8},${H-(small?14:20)})">
      <circle cx="5" cy="0" r="4" fill="#22c55e" stroke="rgba(255,255,255,0.4)" stroke-width="0.8"/>
      <text x="12" y="4" fill="rgba(255,255,255,0.9)" font-size="${small?5:7}" font-weight="800" font-family="Nunito,sans-serif">Owned</text>
      <circle cx="${small?42:58}" cy="0" r="4" fill="#f59e0b" stroke="rgba(255,255,255,0.4)" stroke-width="0.8"/>
      <text x="${small?49:65}" y="4" fill="rgba(255,255,255,0.9)" font-size="${small?5:7}" font-weight="800" font-family="Nunito,sans-serif">Rented</text>
      <circle cx="${small?80:108}" cy="0" r="4" fill="rgba(255,255,255,0.25)" stroke="rgba(255,255,255,0.4)" stroke-width="0.8"/>
      <text x="${small?87:115}" y="4" fill="rgba(255,255,255,0.9)" font-size="${small?5:7}" font-weight="800" font-family="Nunito,sans-serif">Available</text>
    </g>
    <!-- Map title banner -->
    <rect x="${W*0.25}" y="${H-(small?19:26)}" width="${W*0.5}" height="${small?13:18}" rx="3" fill="rgba(0,0,0,0.45)"/>
    <text x="${W*0.5}" y="${H-(small?10:12)}" text-anchor="middle" fill="rgba(255,220,100,0.95)" font-size="${small?6:9}" font-weight="800" font-family="Nunito,sans-serif" letter-spacing="1">VALLEY FARM — LAND MAP</text>
  </svg>`;
}
function _mapPlot(owned,id,x,y,w,h,small){
  const plot=LAND_PLOTS[id];if(!plot)return'';
  const land=owned[id];
  const isOwned=land?.owned;
  const isRented=land?.rented&&!land?.owned;
  const fillCol=isOwned?plot.col:isRented?plot.col:'rgba(80,80,80,0.4)';
  const strokeCol=isOwned?'#22c55e':isRented?'#f59e0b':'rgba(255,255,255,0.22)';
  const strokeW=isOwned||isRented?2.5:1.5;
  const glowColor=isOwned?'rgba(34,197,94,0.5)':isRented?'rgba(245,158,11,0.5)':'none';
  const statusLbl=isOwned?'✓ Owned':isRented?'⏳ Rented':'For Sale';
  const opacity=isOwned||isRented?1:0.72;
  // Slightly organic shape with different rounded corners per plot
  const rx=id==='volcanic'?10:8;
  const cx=x+w/2,cy=y+h/2;
  const fs=small?5:7.5,fsSmall=small?4:6.5,fsEm=small?11:17;
  return`<g opacity="${opacity}" filter="url(#shadow)">
    <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" ry="${rx}"
          fill="${fillCol}" stroke="${strokeCol}" stroke-width="${strokeW}"/>
    ${isOwned||isRented?`<rect x="${x-3}" y="${y-3}" width="${w+6}" height="${h+6}" rx="${rx+3}" fill="none" stroke="${glowColor}" stroke-width="4"/>`:''}
    <text x="${cx}" y="${cy-h*0.1}" text-anchor="middle" font-size="${fsEm}" dominant-baseline="middle">${plot.e}</text>
    <text x="${cx}" y="${cy+h*0.18}" text-anchor="middle" fill="white" font-size="${fs}" font-weight="800" font-family="Nunito,sans-serif">${plot.n.split(' ')[0]}</text>
    <text x="${cx}" y="${cy+h*0.36}" text-anchor="middle" fill="rgba(255,255,255,0.85)" font-size="${fsSmall}" font-family="Nunito,sans-serif">${statusLbl}</text>
  </g>`;
}

function buildMap(){
  const owned=G.lands||{};
  const totalRentPerDay=Object.entries(owned).reduce((s,[id,l])=>{
    if(l.rented&&!l.owned){const p=LAND_PLOTS[id];return s+(p?Math.round(p.rentDay*(1+(l.interestAccrued||0))):0);}
    return s;
  },0);

  // Visual map
  let mapHtml=`<div class="map-visual" style="position:relative;width:100%;min-height:170px;border-radius:12px;overflow:hidden;border:2px solid var(--ui-border);margin-bottom:10px">`;
  mapHtml+=buildMapSVG(owned,true);
  mapHtml+='</div>';

  let h=`<div class="map-wrap">`;
  // Return home button when on another land
  if((G.currentLand||'home')!=='home'){
    h+=`<button class="map-return-btn" data-travel="home">🏡 Return to Home Farm</button>`;
  }
  h+=mapHtml;

  if(totalRentPerDay>0){
    h+=`<div style="padding:7px 10px;background:#fef9c3;border:1px solid #fde68a;border-radius:10px;font-size:10px;font-weight:700;color:#92400e;margin-bottom:6px">⏳ Active rent: <b>${totalRentPerDay}g/day</b> — deducted each night</div>`;
  }

  h+=`<div class="s-sec">🗺 Available Land</div>`;

  Object.entries(LAND_PLOTS).forEach(([id,plot])=>{
    const land=owned[id]||{};
    const isOwned=land.owned;
    const isRented=land.rented&&!land.owned;
    const effectiveRent=isRented?Math.round(plot.rentDay*(1+(land.interestAccrued||0))):plot.rentDay;
    const hasDebt=(land.debtG||0)>0;
    const fertClass=plot.fertility.toLowerCase();

    h+=`<div class="land-card">
      <div class="land-card-top">
        <div class="land-card-left">
          <span class="land-em">${plot.e}</span>
          <div>
            <div class="land-name">${plot.n} <span class="land-fert ${fertClass}">${plot.fertility}</span></div>
          </div>
        </div>
      </div>
      <div class="land-desc">${plot.desc}</div>
      <div class="land-price-row">
        <span class="land-price-tag">💰 Buy: ${plot.buyPrice}g</span>
        <span class="land-rent-tag">· Rent: ${plot.rentDay}g/day</span>
        <span class="land-interest-tag">(+${Math.round(plot.interestRate*100)}% interest/season)</span>
      </div>`;

    if(isOwned){
      h+=`<span class="land-owned-badge">✓ You own this land</span>`;
      h+=`<div class="land-btn-row">
        <button class="land-btn map-travel-btn" data-travel="${id}">🚀 Go to Farm</button>
      </div>`;
    } else if(isRented){
      const debtDays=land.debtDays||0;
      const debtWarning=debtDays>0?` · ⏰ ${7-debtDays}d left`:'';
      h+=`<span class="land-rented-badge">⏳ Renting · ${effectiveRent}g/day${hasDebt?` · ⚠️ Debt: ${Math.round(land.debtG)}g${debtWarning}`:''}</span>`;
      h+=`<div class="land-btn-row">
        <button class="land-btn land-btn-buy" data-buy-land="${id}" ${G.gold>=plot.buyPrice?'':'disabled'}>Buy Out ${plot.buyPrice}g</button>
        <button class="land-btn land-btn-leave" data-leave-land="${id}">Leave Plot</button>
        <button class="land-btn map-travel-btn" data-travel="${id}">🚀 Go Here</button>
      </div>`;
    } else {
      h+=`<div class="land-btn-row">
        <button class="land-btn land-btn-buy" data-buy-land="${id}" ${G.gold>=plot.buyPrice?'':'disabled'}>Buy ${plot.buyPrice}g</button>
        <button class="land-btn land-btn-rent" data-rent-land="${id}" ${G.gold>=plot.rentDay?'':'disabled'}>Rent ${plot.rentDay}g/day</button>
      </div>`;
    }
    h+='</div>';
    // ── City Card ──
  const _fLvMap=getLevel(G.skills?.farming?.xp||0);
  h+=`<div class="land-card city-card" style="margin-top:6px">
    <div class="land-card-top">
      <div class="land-card-left">
        <span class="land-em">🏙️</span>
        <div><div class="land-name">City District <span class="land-fert" style="background:#6366f1;color:#fff;border-color:#4f46e5">FREE</span></div></div>
      </div>
    </div>
    <div class="land-desc">The big city! Visit the Stock Exchange, create your own company, and trade shares every season.</div>
    ${_fLvMap>=5
      ?`<div class="land-btn-row"><button class="land-btn map-travel-btn city-travel-btn" onclick="travelTo('city')">🏙️ Visit City</button></div>`
      :`<div class="city-lock-notice">🔒 Requires Farming Level 5 — you are Lv.${_fLvMap}</div>`
    }
  </div>`;
  });

  h+=`<div class="market-note" style="margin-top:4px">💡 <b>Land Tips:</b><br>Owned land is yours permanently. Rented land charges daily — miss 7 days' rent and all crops are seized by the landlord! Leave a rented plot anytime, debt forgiven.</div>`;
  h+='</div>';
  return h;
}

/* ══ BUY / RENT / LEAVE LAND ══ */
function buyLand(id){
  const plot=LAND_PLOTS[id];if(!plot)return;
  const _fLvB=getLevel(G.skills?.farming?.xp||0);
  if(_fLvB<5){toast('🔒 Farming Level 5 required to buy land! (You are Lv.'+_fLvB+')','error',3200);snd('error');return;}
  const land=G.lands[id]||{};
  if(land.owned){toast('You already own this land!','warn');return;}
  if(G.gold<plot.buyPrice){toast('Need '+plot.buyPrice+'g to buy!','error');snd('error');return;}
  G.gold-=plot.buyPrice;
  G.lands[id]={owned:true,rented:false,rentDays:0,interestAccrued:0,debtG:0};
  snd('coin');
  toast(plot.e+' '+plot.n+' purchased! It\'s yours! 🎉','success',3200);
  setTimeout(()=>toast('🚀 Open the Map tab and click "Go to Farm" to visit!','info',3500),1500);
  render();
}
function rentLand(id){
  const plot=LAND_PLOTS[id];if(!plot)return;
  const _fLvR=getLevel(G.skills?.farming?.xp||0);
  if(_fLvR<5){toast('🔒 Farming Level 5 required to rent land! (You are Lv.'+_fLvR+')','error',3200);snd('error');return;}
  const land=G.lands[id]||{};
  if(land.owned||land.rented){toast('Already acquired!','warn');return;}
  if(G.gold<plot.rentDay){toast('Need '+plot.rentDay+'g for first day\'s rent!','error');snd('error');return;}
  G.gold-=plot.rentDay;
  G.lands[id]={owned:false,rented:true,rentDays:1,interestAccrued:0,debtG:0};
  snd('buy');
  toast(plot.e+' '+plot.n+' rented! Rent of '+plot.rentDay+'g/day deducted each night.','success',3500);
  setTimeout(()=>toast('🚀 Open the Map tab and click "Go Here" to visit your plot!','info',3000),1800);
  render();
}
function leaveLand(id){
  const plot=LAND_PLOTS[id];if(!plot)return;
  const land=G.lands[id];
  if(!land||!land.rented||land.owned)return;
  land.rented=false;land.debtG=0;
  toast(plot.e+' Left '+plot.n+'. Debt cleared. Goodbye! 👋','info',3000);
  render();
}
function exportSave(){
  if(!G.day){toast('No save to export!','warn');return;}
  const data={...G,_user:CU,_vf_version:6,_ts:Date.now()};
  try{
    const json=JSON.stringify(data,null,2);
    const blob=new Blob([json],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url;
    a.download=`valley-farm-${CU||'save'}-yr${G.year}-day${G.day}.json`;
    document.body.appendChild(a);a.click();document.body.removeChild(a);
    URL.revokeObjectURL(url);
    snd('coin');
    toast('💾 Save exported!','success',2500);
  }catch(e){
    // Fallback: copy to clipboard or show in textarea
    toast('Export failed — try another browser','error');
  }
}

function importSave(){
  const input=document.createElement('input');
  input.type='file';input.accept='.json,application/json';
  input.onchange=e=>{
    const file=e.target.files?.[0];
    if(!file)return;
    const reader=new FileReader();
    reader.onload=evt=>{
      try{
        const data=JSON.parse(evt.target.result);
        if(!data.day||!data.farm){toast('Invalid save file!','error');return;}
        loadState(data);
        saveAll();
        render();
        closePause();
        snd('levelup');
        toast('📥 Save imported! Welcome back, '+(data._user||CU)+'!','success',3500);
      }catch(err){
        toast('Failed to load save: '+err.message,'error');
      }
    };
    reader.readAsText(file);
  };
  document.body.appendChild(input);input.click();document.body.removeChild(input);
}

/* ══ SLEEP / DAY ADVANCE ══ */
function doSleep(){
  if(paused)return;
  clearInterval(clockInt);
  snd('sleep');
  document.getElementById('sleep-overlay').classList.add('show');
  const earned=G.pending,prevSi=G.si;
  setTimeout(()=>{
    advanceDay();
    checkAchievements();
    document.getElementById('sleep-overlay').classList.remove('show');
    saveAll();
    const msgs=[];
    if(earned>0)msgs.push({m:'💰 Received '+earned+'g from shipping!',t:'success'});
    if(G.weather==='rainy')msgs.push({m:'🌧️ It\'s raining! Crops watered.',t:'info'});
    const curU=curUpgs();
    if((curU.sprinkler||0)>0&&G.weather!=='rainy')msgs.push({m:'🚿 Sprinkler watered all your crops!',t:'info'});
    // Rent notifications
    const debtPlots=Object.entries(G.lands||{}).filter(([,l])=>l.rented&&!l.owned&&(l.debtG||0)>0);
    if(debtPlots.length){
      const debtDaysMax=Math.max(...debtPlots.map(([,l])=>l.debtDays||0));
      const daysLeft=7-debtDaysMax;
      if(daysLeft>0)msgs.push({m:'⚠️ Missed rent on '+debtPlots.length+' plot(s)! '+daysLeft+'d before crops seized!','t':'error'});
    }
    // Seizure notifications
    if(G._seizedPlots&&G._seizedPlots.length){
      G._seizedPlots.forEach(name=>{
        msgs.push({m:'🚨 CROPS SEIZED on '+name+'! Unpaid rent for 7 days. Farm cleared by landlord!','t':'error'});
      });
      delete G._seizedPlots;
    }
    if(G.si!==prevSi){msgs.push({m:['🌸','☀️','🍂','❄️'][G.si]+' '+season()+' has arrived!',t:'warn'});showSeasonBanner();if(season()==='Winter')tickMarket();tickStockMarket();}
    msgs.push({m:'🌅 Good morning, '+CU+'! Day '+G.day,t:'info'});
    msgs.forEach(({m,t},i)=>setTimeout(()=>toast(m,t,3200),i*600));
    startClock();render();
  },1800);
}

function advanceFarmGrid(farm, hasGreenhouse, hasSprinkler){
  return farm.map(row=>row.map(tile=>{
    if(!tile.crop){
      if(!tile.tilled)return{tilled:false,watered:false,crop:null,idleDays:0,deco:tile.deco||null};
      const idle=(tile.idleDays||0)+1;
      if(idle>=2)return{tilled:false,watered:false,crop:null,idleDays:0,deco:null};
      return{...tile,watered:false,idleDays:idle};
    }
    const cr=CROPS[tile.crop.type],s=season();
    const isWinter=s==='Winter';
    const wrongSeason=!cr.seasons.includes(s)&&!isWinter;
    if(wrongSeason)return{tilled:true,watered:false,crop:null,idleDays:0,deco:null};
    if(isWinter&&!hasGreenhouse)return{tilled:true,watered:false,crop:null,idleDays:0,deco:null};
    const newDays=tile.watered?tile.crop.days+1:tile.crop.days;
    return{...tile,watered:false,crop:{...tile.crop,days:newDays},idleDays:0};
  }));
}

function advanceDay(){
  const curUpgsObj=curUpgs();
  const hasGreenhouse=(curUpgsObj.greenhouse||0)>0;
  const hasSprinkler=(curUpgsObj.sprinkler||0)>0;

  // Advance current (active) farm
  G.farm=advanceFarmGrid(G.farm,hasGreenhouse,hasSprinkler);
  if(hasSprinkler||G.weather==='rainy'){
    G.farm=G.farm.map(row=>row.map(t=>t.tilled?{...t,watered:true}:t));
  }
  G.farms[G.currentLand]=G.farm;

  // Advance all other owned/rented farms too (using their own upgrades)
  if(G.farms){
    Object.keys(G.farms).forEach(landId=>{
      if(landId===G.currentLand)return;
      const isHome=landId==='home';
      if(!isHome){const l=G.lands[landId];if(!l||(!l.owned&&!l.rented))return;}
      const lUpgs=landUpgs(landId);
      const lGreenhouse=(lUpgs.greenhouse||0)>0;
      const lSprinkler=(lUpgs.sprinkler||0)>0;
      let f=advanceFarmGrid(G.farms[landId],lGreenhouse,lSprinkler);
      if(lSprinkler||G.weather==='rainy'){
        f=f.map(row=>row.map(t=>t.tilled?{...t,watered:true}:t));
      }
      G.farms[landId]=f;
    });
  }

  G.yearEarned=(G.yearEarned||0)+G.pending;
  G.gold+=G.pending;G.pending=0;
  G.day++;
  if(G.day>28){G.day=1;G.si=(G.si+1)%4;if(G.si===0){G.year++;G.yearEarned=0;}}

  const rainChance={Spring:0.28,Summer:0.22,Fall:0.10,Winter:0}[season()]||0.22;
  G.weather=(S.weather&&Math.random()<rainChance)?'rainy':'sunny';
  if(G.cactusRain){G.weather='rainy';G.cactusRain=false;}

  if(season()==='Winter')tickMarket();
  G.time=360;
  G.energy=maxEnergy();
  G.stats.days++;

  // Deduct rent and handle 7-day debt seizure
  const seizedPlots=[];
  if(G.lands){
    Object.entries(G.lands).forEach(([id,land])=>{
      if(land.rented&&!land.owned){
        const plot=LAND_PLOTS[id];if(!plot)return;
        const effectiveRent=Math.round(plot.rentDay*(1+(land.interestAccrued||0)));
        if(G.gold>=effectiveRent){
          G.gold-=effectiveRent;
          land.rentDays=(land.rentDays||0)+1;
          land.debtDays=0; // reset debt streak on successful payment
          if(land.debtG>0){land.debtG=Math.max(0,land.debtG-Math.round(effectiveRent*0.5));}// partial debt relief
          if(land.rentDays>0&&land.rentDays%28===0){
            land.interestAccrued=(land.interestAccrued||0)+plot.interestRate;
          }
        } else {
          const shortfall=effectiveRent-G.gold;
          G.gold=0;
          land.debtG=(land.debtG||0)+shortfall+Math.round(shortfall*plot.interestRate);
          land.debtDays=(land.debtDays||0)+1;
          // Seize crops after 7 consecutive days of missed rent
          if(land.debtDays>=7){
            if(G.farms[id]){
              G.farms[id]=G.farms[id].map(row=>row.map(tile=>({
                ...tile,crop:null,tilled:false,watered:false,idleDays:0
              })));
              if(id===G.currentLand)G.farm=G.farms[id];
            }
            land.debtDays=0;
            land.debtG=0;
            seizedPlots.push(plot.n);
          }
        }
      }
    });
  }
  // Show seizure notifications after sleep resolves
  if(seizedPlots.length){
    G._seizedPlots=seizedPlots;
  }
}

function showSeasonBanner(){
  const b=document.createElement('div');b.className='season-banner';
  b.textContent=['🌸','☀️','🍂','❄️'][G.si]+' '+season()+' has arrived!';
  document.body.appendChild(b);setTimeout(()=>b.remove(),2800);
}

/* ══ CLOCK ══ */
function startClock(){
  clearInterval(clockInt);
  clockInt=setInterval(()=>{
    if(paused)return;
    G.time+=2;
    if(G.time>=1320){clearInterval(clockInt);toast('💤 Fell asleep — it\'s late!','info',2500);setTimeout(doSleep,1000);return;}
    renderHUD();
  },300);
}

/* ══ PAUSE ══ */
function openPause(){
  paused=true;
  document.getElementById('pause-sub').textContent='Valley Farm · Day '+G.day+' · Yr.'+G.year;
  document.getElementById('pause-overlay').classList.add('show');
}
function closePause(){
  paused=false;
  document.getElementById('pause-overlay').classList.remove('show');
}
document.getElementById('pause-overlay').addEventListener('click',e=>{
  if(e.target===document.getElementById('pause-overlay'))closePause();
});
document.getElementById('help-overlay').addEventListener('click',e=>{
  if(e.target===document.getElementById('help-overlay'))closeHelp();
});

/* ══ TOOLS / TABS ══ */
function setTab(t){
  currentTab=t;
  document.querySelectorAll('.tab-btn[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===t));
  if(t==='map'){openMapScreen();return;}
  renderSide();
}

/* ══ MAP FULLSCREEN ══ */
function openMapScreen(){
  const el=document.getElementById('map-fullscreen');
  el.classList.add('mf-open');
  buildMapFullscreen();
}
function closeMapScreen(){
  document.getElementById('map-fullscreen').classList.remove('mf-open');
  document.querySelectorAll('.tab-btn[data-tab="map"]').forEach(b=>b.classList.remove('active'));
  currentTab=currentTab==='map'?'upgrades':currentTab;
  document.querySelectorAll('.tab-btn[data-tab]').forEach(b=>b.classList.toggle('active',b.dataset.tab===currentTab));
  renderSide();
}

/* ══ TRAVEL / TELEPORT ══ */
function travelTo(landId){
  if(landId===G.currentLand){closeMapScreen();toast('You\'re already here! 🏡','info');return;}
  // City is a special non-farm destination
  if(landId==='city'){
    const _fLvC=getLevel(G.skills?.farming?.xp||0);
    if(_fLvC<5){toast('🔒 Farming Level 5 required to visit the City! (You are Lv.'+_fLvC+')','error',3200);snd('error');return;}
    closeMapScreen();
    _travelAnimThenCity();
    return;
  }
  // Regular farm lands — verify access and farming level
  if(landId!=='home'){
    const _fLvT=getLevel(G.skills?.farming?.xp||0);
    if(_fLvT<5){toast('🔒 Farming Level 5 required to travel to other lands! (You are Lv.'+_fLvT+')','error',3200);snd('error');return;}
    const l=G.lands?.[landId];
    if(!l||(!l.owned&&!l.rented)){toast('You don\'t own or rent this land!','error');snd('error');return;}
  }
  const terrain=LAND_TERRAIN[landId]||LAND_TERRAIN.home;
  const overlay=document.getElementById('teleport-overlay');
  document.getElementById('tp-em').textContent=terrain.icon;
  document.getElementById('tp-title').textContent='Traveling to '+terrain.label+'...';
  const tips=['Each plot has its own farm grid!','All your farms grow overnight!','Different soil = different crop bonuses!'];
  document.getElementById('tp-tip').textContent=tips[Math.floor(Math.random()*tips.length)];
  document.getElementById('tp-sub').textContent='📦 Packing your tools...';

  // Save current farm grid
  if(!G.farms)G.farms={};
  G.farms[G.currentLand]=G.farm;

  // Show teleport
  overlay.classList.add('tp-show');
  const bar=document.getElementById('tp-bar');
  bar.style.width='0%';bar.style.transition='none';
  requestAnimationFrame(()=>{
    requestAnimationFrame(()=>{
      bar.style.transition='width 1.55s cubic-bezier(.4,0,.2,1)';
      bar.style.width='100%';
    });
  });

  // Mid-point update
  setTimeout(()=>{document.getElementById('tp-sub').textContent='🌱 Preparing your new plot...';},700);

  setTimeout(()=>{
    // Switch land
    G.currentLand=landId;
    if(!G.farms[landId])G.farms[landId]=mkFarm();
    G.farm=G.farms[landId];
    closeMapScreen();
    overlay.classList.remove('tp-show');
    render();
    renderLandBanner();
    snd('levelup');
    toast(terrain.icon+' Welcome to '+terrain.label+'!','success',3200);
  },1900);
}

function renderLandBanner(){
  const banner=document.getElementById('land-banner');
  if(!banner)return;
  const cl=G.currentLand||'home';
  if(cl==='home'){banner.classList.remove('show');banner.style.display='none';return;}
  const terrain=LAND_TERRAIN[cl]||LAND_TERRAIN.home;
  const plot=LAND_PLOTS[cl];
  banner.textContent=terrain.icon+' '+terrain.label+(plot?' · '+plot.fertility+' Soil':'');
  banner.style.display='block';
  banner.classList.add('show');
}
function buildMapFullscreen(){
  const body=document.getElementById('mf-body');
  const owned=G.lands||{};
  const totalRentPerDay=Object.entries(owned).reduce((s,[id,l])=>{
    if(l.rented&&!l.owned){const p=LAND_PLOTS[id];return s+(p?Math.round(p.rentDay*(1+(l.interestAccrued||0))):0);}
    return s;
  },0);
  const rentEl=document.getElementById('mf-rent-info');
  if(rentEl)rentEl.textContent=totalRentPerDay>0?'⏳ Rent: '+totalRentPerDay+'g/day':'';

  // Build land cards HTML
  let landHtml='';
  if((G.currentLand||'home')!=='home'){
    landHtml+=`<button class="map-return-btn" onclick="travelTo('home')">🏡 Return to Home Farm</button>`;
  }
  landHtml+=`<div class="s-sec" style="margin-top:4px">🗺 Available Land</div>`;
  if(totalRentPerDay>0){
    landHtml+=`<div style="padding:7px 10px;background:#fef9c3;border:1px solid #fde68a;border-radius:10px;font-size:10px;font-weight:700;color:#92400e;margin-bottom:8px">⏳ Active rent: <b>${totalRentPerDay}g/day</b> deducted each night</div>`;
  }

  // Check for debt warning (debt for 5+ days = danger zone)
  const dangerPlots=Object.entries(owned).filter(([,l])=>l.rented&&!l.owned&&(l.debtDays||0)>=5);
  if(dangerPlots.length){
    landHtml+=`<div class="mf-debt-warning">🚨 <b>DANGER!</b> ${dangerPlots.length} plot(s) have missed rent for 5+ days! Pay up before day 7 or crops will be seized!</div>`;
  }

  Object.entries(LAND_PLOTS).forEach(([id,plot])=>{
    const land=owned[id]||{};
    const isOwned=land.owned;
    const isRented=land.rented&&!land.owned;
    const effectiveRent=isRented?Math.round(plot.rentDay*(1+(land.interestAccrued||0))):plot.rentDay;
    const hasDebt=(land.debtG||0)>0;
    const debtDays=land.debtDays||0;
    const fertClass=plot.fertility.toLowerCase();
    landHtml+=`<div class="land-card">
      <div class="land-card-top">
        <div class="land-card-left">
          <span class="land-em">${plot.e}</span>
          <div><div class="land-name">${plot.n} <span class="land-fert ${fertClass}">${plot.fertility}</span></div></div>
        </div>
      </div>
      <div class="land-desc">${plot.desc}</div>
      <div class="land-price-row">
        <span class="land-price-tag">💰 Buy: ${plot.buyPrice}g</span>
        <span class="land-rent-tag">· Rent: ${plot.rentDay}g/day</span>
        <span class="land-interest-tag">(+${Math.round(plot.interestRate*100)}% interest/season)</span>
      </div>`;
    if(isOwned){
      landHtml+=`<span class="land-owned-badge">✓ You own this land</span>`;
      landHtml+=`<div class="land-btn-row">
        <button class="land-btn map-travel-btn" onclick="travelTo('${id}')">🚀 Go to this Farm</button>
      </div>`;
    } else if(isRented){
      const debtWarning=debtDays>0?` · ⏰ ${7-debtDays}d left`:'';
      landHtml+=`<span class="land-rented-badge">⏳ Renting · ${effectiveRent}g/day${hasDebt?` · ⚠️ Debt: ${Math.round(land.debtG)}g${debtWarning}`:''}</span>`;
      landHtml+=`<div class="land-btn-row">
        <button class="land-btn land-btn-buy" id="mfbl-${id}" ${G.gold>=plot.buyPrice?'':'disabled'}>Buy Out ${plot.buyPrice}g</button>
        <button class="land-btn land-btn-leave" id="mfll-${id}">Leave Plot</button>
        <button class="land-btn map-travel-btn" onclick="travelTo('${id}')">🚀 Go Here</button>
      </div>`;
    } else {
      landHtml+=`<div class="land-btn-row">
        <button class="land-btn land-btn-buy" id="mfbl-${id}" ${G.gold>=plot.buyPrice?'':'disabled'}>Buy ${plot.buyPrice}g</button>
        <button class="land-btn land-btn-rent" id="mfrl-${id}" ${G.gold>=plot.rentDay?'':'disabled'}>Rent ${plot.rentDay}g/day</button>
      </div>`;
    }
    landHtml+='</div>';
    const _fLvMF=getLevel(G.skills?.farming?.xp||0);
  landHtml+=`<div class="land-card city-card" style="margin-top:6px">
    <div class="land-card-top">
      <div class="land-card-left">
        <span class="land-em">🏙️</span>
        <div><div class="land-name">City District <span class="land-fert" style="background:#6366f1;color:#fff;border-color:#4f46e5">FREE</span></div></div>
      </div>
    </div>
    <div class="land-desc">Visit the Valley Stock Exchange. Invest in companies, launch your own, and collect dividends every season change.</div>
    ${_fLvMF>=5
      ?`<div class="land-btn-row"><button class="land-btn map-travel-btn city-travel-btn" id="mfbl-city">🏙️ Visit City</button></div>`
      :`<div class="city-lock-notice">🔒 Requires Farming Level 5 — you are Lv.${_fLvMF}</div>`
    }
  </div>`;
  });
  landHtml+=`<div class="market-note" style="margin-top:8px;margin-bottom:16px">💡 <b>Land Tips:</b><br>Owned land is yours permanently. Rented land charges daily — miss 7 days' rent and crops get seized by the landlord! Leave a rented plot anytime, debt forgiven.</div>`;

  // Big map visual HTML
  const mapVisualHtml=`<div class="mf-map-visual-pc" style="position:relative;aspect-ratio:5/3">${buildMapSVG(owned,false)}</div>`;

  // PC two-column layout: land cards on left, map on right
  body.innerHTML=`<div class="mf-pc-wrap">
    <div class="mf-land-col">${landHtml}</div>
    <div class="mf-map-sticky">
      <div style="font-size:11px;font-weight:800;color:var(--text-soft);text-transform:uppercase;letter-spacing:.8px;margin-bottom:4px">🗺 Valley Farm Map</div>
      ${mapVisualHtml}
      <div class="map-legend" style="justify-content:center;gap:12px">
        <span><span class="map-legend-dot" style="background:#22c55e"></span>Owned</span>
        <span><span class="map-legend-dot" style="background:#f59e0b"></span>Rented</span>
        <span><span class="map-legend-dot" style="background:rgba(120,120,120,0.5)"></span>Available</span>
      </div>
      ${totalRentPerDay>0?`<div style="width:100%;text-align:center;font-size:11px;font-weight:700;color:var(--gold)">⏳ Total rent: ${totalRentPerDay}g/day</div>`:''}
    </div>
  </div>`;

  // Bind land buttons
  Object.keys(LAND_PLOTS).forEach(id=>{
    const bl=document.getElementById('mfbl-'+id);
    const rl=document.getElementById('mfrl-'+id);
    const ll=document.getElementById('mfll-'+id);
    if(bl)bl.addEventListener('click',()=>{buyLand(id);buildMapFullscreen();});
    if(rl)rl.addEventListener('click',()=>{rentLand(id);buildMapFullscreen();});
    if(ll)ll.addEventListener('click',()=>{leaveLand(id);buildMapFullscreen();});
    const cityBtn=document.getElementById('mfbl-city');
    if(cityBtn)cityBtn.addEventListener('click',()=>travelTo('city'));
  });
}
function setTool(t){
  G.tool=t;
  document.querySelectorAll('.tool-btn').forEach(b=>b.classList.remove('active'));
  const el=document.getElementById('tool-'+t);if(el)el.classList.add('active');
  updateSeedSel();
  const ds=document.getElementById('deco-select');
  if(ds)ds.style.display=t==='deco'?'block':'none';
}
function updateSeedSel(){
  const sel=document.getElementById('seed-select');
  sel.style.display=G.tool==='seed'?'block':'none';
  if(G.tool!=='seed')return;
  const av=sCrops();
  sel.innerHTML=av.map(([t,c])=>`<option value="${t}"${t===G.seed?' selected':''}${!(G.inv[t]||0)?' disabled':''}>${c.e} ${c.n} (×${G.inv[t]||0})</option>`).join('');
  if(!(G.inv[G.seed]||0)){const alt=av.find(([t])=>(G.inv[t]||0)>0);if(alt)G.seed=alt[0];}
  sel.value=G.seed;
}
function render(){
  renderHUD();renderFarm();renderSide();updateSeedSel();updateTabLabels();renderLandBanner();
  const ha=document.getElementById('tool-harvestall');
  if(ha)ha.style.display=allCropsReady()?'block':'none';
}
function updateTabLabels(){
  const lbl=season()==='Winter'?'🏪 Market':'🛒 Shop';
  document.querySelectorAll('.tab-btn[data-tab="shop"]').forEach(b=>{b.textContent=lbl;});
}

/* ══ TILE CLICK ══ */
function clickTile(r,c){
  if(paused)return;
  if(G.energy<=0){toast('Too tired! 😴 Sleep to restore energy.','error');snd('error');return;}
  const tile=G.farm[r][c];let changed=false;
  const useE=()=>{if(S.energyCost)G.energy=Math.max(0,G.energy-1);};
  const fLv=getLevel(G.skills?.farming?.xp||0);
  const wLv=getLevel(G.skills?.watering?.xp||0);
  const hLv=getLevel(G.skills?.harvesting?.xp||0);

  if(G.tool==='hoe'){
    if(tile.deco){
      G.farm[r][c]={...tile,deco:null};
      useE();snd('till');spawnTileEffect(r,c,'💨');
      toast('Cleared '+DECOS[tile.deco].n,'info',1200);changed=true;
    } else if(!tile.tilled){
      const newTile={...tile,tilled:true,idleDays:0,deco:null};
      if(fLv>=10)newTile.watered=true;
      G.farm[r][c]=newTile;
      if(fLv<5)useE();
      snd('till');
      addXP('farming',5);
      toast(fLv>=10?'Tilled & watered! 🌱💧':'Tilled! 🌱','success');changed=true;
    } else toast('Already tilled!','info',1100);
  }
  else if(G.tool==='water'){
    if(!tile.tilled){toast('Till the soil first!','warn',1100);return;}
    if(tile.watered){toast('Already watered!','info',1100);return;}
    G.farm[r][c]={...tile,watered:true};
    if(wLv<5)useE();
    snd('water');spawnTileEffect(r,c,'💦');
    addXP('watering',3);
    toast('Watered! 💧','info');changed=true;
  }
  else if(G.tool==='seed'){
    if(season()==='Winter'&&!(G.upgrades?.greenhouse)){toast('❄️ No planting in Winter!<br>Buy the Greenhouse upgrade.','warn');return;}
    if(!tile.tilled){toast('Till first!','warn',1100);return;}
    if(tile.crop){toast('Already planted!','warn',1100);return;}
    const cr=CROPS[G.seed];
    if(!cr.seasons.includes(season())&&season()!=='Winter'){toast(cr.n+' won\'t grow in '+season()+'!','error');return;}
    if(!(G.inv[G.seed]||0)){toast('No '+cr.n+' seeds!','error');return;}
    G.farm[r][c]={...tile,crop:{type:G.seed,days:0},idleDays:0};
    G.inv[G.seed]--;
    snd('place');spawnTileEffect(r,c,'🌱');
    toast('Planted '+cr.n+'! 🌱','success');changed=true;
  }
  else if(G.tool==='shovel'){
    if(!tile.tilled){toast('Nothing to dig here!','info',1100);return;}
    if(!tile.crop){toast('No crop planted here!','info',1100);return;}
    if(cropStage(tile.crop)===3){toast('Crop is ready! Harvest it with the Scythe.','warn');return;}
    const cr=CROPS[tile.crop.type];
    G.inv[tile.crop.type]=(G.inv[tile.crop.type]||0)+1;
    G.farm[r][c]={...tile,crop:null,watered:false,idleDays:0};
    useE();snd('till');spawnTileEffect(r,c,'🪱');
    toast('Dug up '+cr.n+'! Seed returned.','success');changed=true;
  }
  else if(G.tool==='scythe'){
    if(!tile.crop){toast('No crop here!','warn',1100);return;}
    if(cropStage(tile.crop)!==3){toast('Not ready! '+(CROPS[tile.crop.type].days-tile.crop.days)+'d left.','warn');return;}
    const cr=CROPS[tile.crop.type];
    let qty=1;
    const bonusChance=hLv>=10?0.25:hLv>=5?0.15:0;
    if(bonusChance>0&&Math.random()<bonusChance)qty=2;
    G.bag[tile.crop.type]=(G.bag[tile.crop.type]||0)+qty;
    G.farm[r][c]={...tile,crop:null,watered:false,idleDays:0};
    useE();G.stats.crops+=qty;
    snd('harvest');spawnTileEffect(r,c,qty>1?'🎉':'⭐');
    addXP('harvesting',10);
    toast('Harvested '+cr.n+(qty>1?' ×2 Bonus! 🎉':' '+cr.e),'success');changed=true;
  }
  else if(G.tool==='deco'){
    if(tile.tilled||tile.crop){toast('Can only decorate untilled grass!','warn',1200);return;}
    const landTreeList2=LAND_TREES[G.currentLand||'home']||LAND_TREES.home;
    const curTMAP=new Map(landTreeList2.map(([r,c,e])=>[r*100+c,e]));
    if(curTMAP.has(r*100+c)){return;}
    if(tile.deco===G.deco){
      G.farm[r][c]={...tile,deco:null};
      toast('Removed '+DECOS[G.deco].n,'info',1100);
    } else {
      G.farm[r][c]={...tile,deco:G.deco};
      snd('place');
      toast('Placed '+DECOS[G.deco].n+'! 🎨','success',1100);
    }
    changed=true;
  }

  if(changed)render();
}

/* ══ BAG TOGGLE ══ */
function toggleBag(){
  if(window.innerWidth>680){
    const side=document.getElementById('side');
    const collapsed=side.classList.toggle('side-collapsed');
    if(!collapsed)renderSide();
  } else {
    sheetOpen?closeSheet():openSheet();
  }
}

/* ══ BOTTOM SHEET ══ */
let sheetOpen=false;
function openSheet(){
  if(sheetOpen)return;
  sheetOpen=true;
  renderSide();
  document.getElementById('bottom-sheet').classList.add('sheet-open');
  document.getElementById('sheet-bg').classList.add('sheet-open');
  document.getElementById('swipe-hint').style.display='none';
}
function closeSheet(){
  if(!sheetOpen)return;
  sheetOpen=false;
  document.getElementById('bottom-sheet').classList.remove('sheet-open');
  document.getElementById('sheet-bg').classList.remove('sheet-open');
}

/* ══ SWIPE GESTURE ══ */
(function(){
  let touchStartY=0,touchStartX=0,tracking=false;
  const SWIPE_THRESHOLD=55;
  document.getElementById('farm-wrap').addEventListener('touchstart',e=>{
    touchStartY=e.touches[0].clientY;touchStartX=e.touches[0].clientX;tracking=true;
  },{passive:true});
  document.getElementById('farm-wrap').addEventListener('touchend',e=>{
    if(!tracking)return;tracking=false;
    const dy=touchStartY-e.changedTouches[0].clientY;
    const dx=Math.abs(touchStartX-e.changedTouches[0].clientX);
    if(dx>60)return;
    if(dy>SWIPE_THRESHOLD&&!sheetOpen)openSheet();
  },{passive:true});
  const sheet=document.getElementById('bottom-sheet');
  let sheetTouchStartY=0;
  sheet.addEventListener('touchstart',e=>{sheetTouchStartY=e.touches[0].clientY;},{passive:true});
  sheet.addEventListener('touchend',e=>{
    const dy=sheetTouchStartY-e.changedTouches[0].clientY;
    const content=document.getElementById('sheet-content');
    const atTop=content.scrollTop<=2;
    if(dy<-SWIPE_THRESHOLD&&(sheetTouchStartY<sheet.getBoundingClientRect().top+80||atTop)){closeSheet();}
  },{passive:true});
})();

/* ══ CACTUS CHEAT ══ */
let cactusClicks=0,cactusTimer=null;
function cactusClick(){
  if(paused)return;
  cactusClicks++;
  clearTimeout(cactusTimer);
  cactusTimer=setTimeout(()=>{cactusClicks=0;},2200);
  if(cactusClicks>=3){
    cactusClicks=0;clearTimeout(cactusTimer);
    G.cactusRain=true;
    showCactusHmm();
  }
  // No feedback for clicks 1 or 2 — silent
}
function showCactusHmm(){
  toast('hmmm','info',2200);
}

/* ══ ACHIEVEMENTS ══ */
function checkAchievements(){
  if(!G.achievements)G.achievements=[];
  const key='rich_yr'+G.year;
  if((G.yearEarned||0)>=20000&&!G.achievements.includes(key)){
    G.achievements.push(key);
    setTimeout(()=>showAchievement('💰','Tycoon Farmer!','Earned 20,000g in Year '+G.year+'!'),1600);
  }
}
function showAchievement(icon,name,desc){
  const p=document.getElementById('achieve-popup');
  document.getElementById('achieve-icon').textContent=icon;
  document.getElementById('achieve-name').textContent=name;
  document.getElementById('achieve-desc').textContent=desc;
  p.classList.remove('show');
  void p.offsetWidth;
  p.classList.add('show');
  clearTimeout(p._hideTimer);
  p._hideTimer=setTimeout(()=>p.classList.remove('show'),4800);
}

/* ══ HELP ══ */
const HELP_STEPS=[
  {e:'🌾',title:'Welcome to Valley Farm!',body:'Grow crops, earn gold, and build your farming empire. Each year has 4 seasons of 28 days. The game auto-saves every 30 seconds.',tip:'Tip: Your farm persists — come back any time!'},
  {e:'⛏',title:'Tilling the Soil',body:'Select the Hoe tool, then tap any green grass tile to till it. Tilled soil left empty for 2 days will revert back to grass!',tip:'Shortcut: Press H to switch to the Hoe.'},
  {e:'🛒',title:'Buying Seeds',body:'Open the Bag panel and switch to the Shop tab. Seeds are season-specific — you can only buy what grows now!',tip:'Tip: Different seasons have different crops.'},
  {e:'🌱',title:'Planting Seeds',body:'Select the Seeds tool, choose a seed from the dropdown, then tap a tilled tile. Each planting uses one seed from your inventory.',tip:'Shortcut: Press S to switch to Seeds.'},
  {e:'💧',title:'Watering Your Crops',body:'Select the Water tool and tap any planted tile. Crops only grow on days they are watered. Miss a day and that growth is lost!',tip:'Shortcut: Press W to switch to Water.'},
  {e:'✨',title:'Harvesting Crops',body:'When a crop is fully grown it glows with ✨. Select the Scythe tool and tap it to harvest it into your bag.',tip:'Shortcut: Press R to switch to Scythe.'},
  {e:'📦',title:'Shipping for Gold',body:'Open the Bag panel and press Ship All to send your harvested crops. Gold arrives the next morning after sleeping!',tip:'Tip: Ship at night so gold arrives first thing.'},
  {e:'⚒',title:'Upgrades Shop',body:'Visit the Upgrades tab to buy permanent farm improvements! The Sprinkler auto-waters crops, Greenhouse lets crops survive Winter, Barn boosts sales by 15%, and the Well increases max energy.',tip:'💡 Upgrades persist forever — invest early!'},
  {e:'⭐',title:'Skills & Leveling',body:'Tilling, watering, and harvesting all grant XP. Level up to unlock bonuses: free energy actions, better yield chance, and more! Check your skills in the Bag tab.',tip:'💡 Harvesting gives the most XP per action!'},
  {e:'🎨',title:'Farm Customization',body:'Use the Deco tool to place paths, fences, flowers, lamps, signs, and rocks on untilled grass tiles. Use the Hoe on a decoration to remove it.',tip:'Tip: Decos are free and purely aesthetic!'},
  {e:'🍂',title:'Seasons & Winter Market',body:'Spring, Summer, Fall, Winter — each lasts 28 days. In Winter no crops grow (unless you have the Greenhouse!) — instead the Shop becomes a live Auction House with fluctuating prices!',tip:'💡 Save Fall crops to sell at peak Winter prices!'},
  {e:'💾',title:'Save & Export',body:'The game auto-saves every 30 seconds. In the ⏸ Menu you can also Export your save to a JSON file and Import it back later — great for backups!',tip:'🌵 Psst… the cacti are hiding a secret. Click carefully…'},
];
let helpStep=0;
function openHelp(){
  helpStep=0;paused=true;renderHelpStep();
  document.getElementById('help-overlay').classList.add('show');
}
function closeHelp(){
  document.getElementById('help-overlay').classList.remove('show');paused=false;
}
function helpNav(dir){
  helpStep=Math.max(0,Math.min(HELP_STEPS.length-1,helpStep+dir));
  if(dir>0&&helpStep===HELP_STEPS.length-1){renderHelpStep();document.getElementById('help-next').textContent='Done ✓';document.getElementById('help-next').onclick=closeHelp;return;}
  document.getElementById('help-next').textContent='Next →';
  document.getElementById('help-next').onclick=()=>helpNav(1);
  renderHelpStep();
}
function renderHelpStep(){
  const step=HELP_STEPS[helpStep];
  document.getElementById('help-emoji').textContent=step.e;
  document.getElementById('help-title').textContent=step.title;
  document.getElementById('help-body').textContent=step.body;
  document.getElementById('help-tip').textContent=step.tip;
  document.getElementById('help-step-label').textContent='Step '+(helpStep+1)+' of '+HELP_STEPS.length;
  document.getElementById('help-dots').innerHTML=HELP_STEPS.map((_,i)=>`<div class="help-dot${i===helpStep?' active':''}"></div>`).join('');
  const prevBtn=document.getElementById('help-prev');
  prevBtn.style.display=helpStep===0?'none':'block';
  const nextBtn=document.getElementById('help-next');
  nextBtn.textContent=helpStep===HELP_STEPS.length-1?'Done ✓':'Next →';
  nextBtn.onclick=helpStep===HELP_STEPS.length-1?closeHelp:()=>helpNav(1);
}

/* ══ AMBIENT PARTICLES ══ */
const AMBIENT_CFG={
  Spring:{emojis:['🌸','🌺','🌷'],dir:'rise'},
  Summer:{emojis:['✨','🌟','💛'],dir:'rise'},
  Fall:  {emojis:['🍂','🍁','🍃'],dir:'fall'},
  Winter:{emojis:['❄️','🌨️','❅'],dir:'fall'},
};
let ambientInt=null;
function spawnAmbientParticle(){
  const s=season();const cfg=AMBIENT_CFG[s];if(!cfg)return;
  const layer=document.getElementById('ambient-layer');if(!layer)return;
  const em=cfg.emojis[Math.floor(Math.random()*cfg.emojis.length)];
  const p=document.createElement('div');
  p.className='ambient-particle';p.textContent=em;
  const sz=12+Math.random()*8;
  const x=Math.random()*window.innerWidth;
  const dur=9000+Math.random()*8000;
  p.style.fontSize=sz+'px';
  p.style.opacity=0.3+Math.random()*0.35;
  p.style.animationDuration=dur+'ms';
  p.style.animationName=cfg.dir==='fall'?'ambientFall':'ambientRise';
  if(cfg.dir==='fall'){p.style.left=x+'px';p.style.top='-30px';}
  else{p.style.left=x+'px';p.style.bottom='-30px';}
  layer.appendChild(p);
  setTimeout(()=>p.remove(),dur+200);
}
function startAmbient(){
  clearInterval(ambientInt);
  ambientInt=setInterval(spawnAmbientParticle,1600);
}

/* ══ CITY / STOCK EXCHANGE ══ */

function _travelAnimThenCity(){
  const overlay=document.getElementById('teleport-overlay');
  document.getElementById('tp-em').textContent='🏙️';
  document.getElementById('tp-title').textContent='Heading to the City...';
  document.getElementById('tp-sub').textContent='📈 Checking the markets...';
  document.getElementById('tp-tip').textContent='Buy low, sell high — and maybe list your own company!';
  overlay.classList.add('tp-show');
  const bar=document.getElementById('tp-bar');
  bar.style.width='0%';bar.style.transition='none';
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    bar.style.transition='width 1.55s cubic-bezier(.4,0,.2,1)';
    bar.style.width='100%';
  }));
  setTimeout(()=>{
    bar.style.transition='none';
    overlay.classList.remove('tp-show');
    openCityScreen();
  },1900);
}

function openCityScreen(){
  _ensureSM();
  const el=document.getElementById('city-screen');
  if(el)el.classList.add('city-open');
  _updateCityGold();
  setCityTab('market');
  paused=true;
}

function closeCityScreen(){
  const el=document.getElementById('city-screen');
  if(el)el.classList.remove('city-open');
  paused=false;
}

function setCityTab(tab){
  document.querySelectorAll('.city-tab-btn').forEach(b=>b.classList.toggle('active',b.dataset.ctab===tab));
  renderCityScreen(tab);
}

function _updateCityGold(){
  const el=document.getElementById('city-gold-disp');
  if(el)el.textContent='💰 '+G.gold+'g';
}

function _ensureSM(){
  if(!G.stockMarket)G.stockMarket={};
  CITY_COMPANIES.forEach(c=>{
    if(!G.stockMarket[c.ticker])
      G.stockMarket[c.ticker]={price:c.basePrice,history:[c.basePrice],lastSeason:season()};
  });
  if(G.company&&!G.stockMarket[G.company.ticker])
    G.stockMarket[G.company.ticker]={price:G.company.sharePrice,history:[G.company.sharePrice],lastSeason:season()};
}

function tickStockMarket(){
  _ensureSM();
  const s=season();
  CITY_COMPANIES.forEach(c=>{
    const mkt=G.stockMarket[c.ticker];if(!mkt)return;
    if(mkt.lastSeason===s)return; // only tick once per season
    let chg=((Math.random()-0.47)*c.volatility*2);
    if(c.strongSeasons.includes(s))chg+=0.07+Math.random()*0.09;
    else if(c.strongSeasons.length>0)chg-=0.02+Math.random()*0.04;
    const np=Math.max(8,Math.round(mkt.price*(1+chg)));
    mkt.history.push(np);if(mkt.history.length>10)mkt.history.shift();
    mkt.price=np;mkt.lastSeason=s;
  });
  if(G.company){
    const mkt=G.stockMarket[G.company.ticker];
    if(mkt&&mkt.lastSeason!==s){
      const bonus=Math.min(0.20,(G.yearEarned||0)/60000);
      const chg=((Math.random()-0.42)*0.16)+bonus;
      const np=Math.max(5,Math.round(mkt.price*(1+chg)));
      mkt.history.push(np);if(mkt.history.length>10)mkt.history.shift();
      mkt.price=np;mkt.lastSeason=s;
      G.company.sharePrice=np;
      if(!G.company.history)G.company.history=[];
      G.company.history.push({season:s,year:G.year,price:np,earned:G.yearEarned||0});
    }
  }
  toast('📊 Stock markets updated for '+s+'!','info',2800);
}

function _miniChart(history){
  if(!history||history.length<2)return'';
  const max=Math.max(...history),min=Math.min(...history),range=max-min||1;
  const W=64,H=24;
  const pts=history.map((v,i)=>{
    const x=Math.round((i/(history.length-1))*W);
    const y=Math.round(H-((v-min)/range)*(H-2)+1);
    return x+','+y;
  }).join(' ');
  const up=history[history.length-1]>=history[0];
  const col=up?'#22c55e':'#ef4444';
  const last=pts.split(' ').pop().split(',');
  return`<svg viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" style="overflow:visible;display:block">
    <polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    <circle cx="${last[0]}" cy="${last[1]}" r="2.5" fill="${col}"/>
  </svg>`;
}

function renderCityScreen(tab){
  const body=document.getElementById('city-body');if(!body)return;
  _ensureSM();_updateCityGold();
  if(tab==='market')body.innerHTML=_renderMarket();
  else if(tab==='portfolio')body.innerHTML=_renderPortfolio();
  else if(tab==='company')body.innerHTML=_renderCompany();
  // Bind trade buttons via event delegation
  body.querySelectorAll('[data-buy-ticker]').forEach(btn=>
    btn.addEventListener('click',()=>buyStock(btn.dataset.buyTicker,+btn.dataset.qty||1)));
  body.querySelectorAll('[data-sell-ticker]').forEach(btn=>
    btn.addEventListener('click',()=>sellStock(btn.dataset.sellTicker,+btn.dataset.qty||1)));
}

function _renderMarket(){
  const s=season();
  const all=[...CITY_COMPANIES];
  if(G.company&&!all.find(c=>c.ticker===G.company.ticker))
    all.push({ticker:G.company.ticker,name:G.company.name,icon:G.company.icon||'🏢',
              desc:G.company.desc||'',basePrice:G.company.sharePrice,strongSeasons:[],volatility:0.15});

  let h=`<div class="city-market-header">
    <div class="city-market-title">📊 Stock Exchange</div>
    <div class="city-season-badge">${['🌸','☀️','🍂','❄️'][G.si]} ${s}</div>
  </div>
  <div class="city-market-note">📈 Markets refresh every season. Strong seasons boost a company's stock — weak ones hurt it. Your company grows with your crop earnings!</div>`;

  all.forEach(c=>{
    const mkt=G.stockMarket[c.ticker]||{price:c.basePrice,history:[c.basePrice]};
    const held=(G.stocks&&G.stocks[c.ticker]?.shares)||0;
    const prev=mkt.history.length>=2?mkt.history[mkt.history.length-2]:mkt.price;
    const rawPct=((mkt.price-prev)/prev)*100;
    const pct=Math.abs(rawPct)<0.5?0:Math.round(rawPct);
    const up=rawPct>=0;
    const strong=c.strongSeasons&&c.strongSeasons.includes(s);
    const isMine=G.company&&G.company.ticker===c.ticker;
    const seasonTags=SEASONS.map(se=>`<span class="season-perf-tag${c.strongSeasons?.includes(se)?' strong':''}">${['🌸','☀️','🍂','❄️'][SEASONS.indexOf(se)]} ${se}</span>`).join('');
    h+=`<div class="stock-card${isMine?' stock-card-mine':''}">
      <div class="stock-top">
        <div class="stock-left">
          <span class="stock-icon">${c.icon}</span>
          <div>
            <div class="stock-name">${c.name}${strong?' <span class="stock-hot">🔥 HOT</span>':''}${isMine?' <span class="stock-mine-tag">YOUR CO.</span>':''}</div>
            <div class="stock-ticker">${c.ticker}</div>
            <div class="stock-desc">${c.desc}</div>
            <div class="season-perf-row">${seasonTags}</div>
          </div>
        </div>
        <div class="stock-right">
          ${_miniChart(mkt.history)}
          <div class="stock-price">${mkt.price}g</div>
          <div class="stock-pct ${up?'up':'down'}">${pct===0?'—':((up?'▲':'▼')+Math.abs(pct)+'%')}</div>
        </div>
      </div>
      <div class="stock-held">Holding: <b>${held}</b> share${held!==1?'s':''}${held>0?' · Value: <b>'+(held*mkt.price)+'g</b>':''}</div>
      <div class="stock-actions">
        <button class="stock-btn stock-btn-buy" data-buy-ticker="${c.ticker}" data-qty="1" ${G.gold>=mkt.price?'':'disabled'}>Buy 1 · ${mkt.price}g</button>
        <button class="stock-btn stock-btn-buy" data-buy-ticker="${c.ticker}" data-qty="5" ${G.gold>=mkt.price*5?'':'disabled'}>Buy 5 · ${mkt.price*5}g</button>
        <button class="stock-btn stock-btn-sell" data-sell-ticker="${c.ticker}" data-qty="1" ${held>=1?'':'disabled'}>Sell 1 · ${mkt.price}g</button>
        <button class="stock-btn stock-btn-sell" data-sell-ticker="${c.ticker}" data-qty="${held}" ${held>0?'':'disabled'}>Sell All${held>0?' · '+(held*mkt.price)+'g':''}</button>
      </div>
    </div>`;
  });
  return h;
}

function _renderPortfolio(){
  if(!G.stocks)G.stocks={};
  const held=Object.entries(G.stocks).filter(([,p])=>p.shares>0);
  if(!held.length)return`<div class="city-empty"><div class="city-empty-em">📭</div><div>No shares yet</div><div style="font-size:11px;margin-top:4px;font-weight:400">Go to the Market tab and start investing!</div></div>`;
  const all=[...CITY_COMPANIES];
  if(G.company&&!all.find(c=>c.ticker===G.company.ticker))
    all.push({ticker:G.company.ticker,name:G.company.name,icon:G.company.icon||'🏢'});
  let totalVal=0,totalCost=0;
  let h=`<div class="city-market-header"><div class="city-market-title">🎒 My Portfolio</div></div><div class="portfolio-list">`;
  held.forEach(([ticker,pos])=>{
    const mkt=G.stockMarket[ticker];if(!mkt)return;
    const co=all.find(c=>c.ticker===ticker)||{name:ticker,icon:'📈'};
    const curVal=pos.shares*mkt.price,cost=pos.shares*(pos.avgPrice||mkt.price);
    const pnl=curVal-cost,pct=cost>0?Math.round((pnl/cost)*100):0;
    totalVal+=curVal;totalCost+=cost;
    h+=`<div class="portfolio-card">
      <div class="port-top">
        <span class="stock-icon">${co.icon}</span>
        <div style="flex:1;min-width:0">
          <div class="stock-name">${co.name}</div>
          <div class="stock-ticker">${ticker} · ${pos.shares} share${pos.shares!==1?'s':''}</div>
        </div>
        <div style="text-align:right;flex-shrink:0">
          <div class="stock-price">${curVal}g</div>
          <div class="stock-pct ${pnl>=0?'up':'down'}">${pnl>=0?'▲':'▼'}${Math.abs(pct)}% (${pnl>=0?'+':''}${Math.round(pnl)}g)</div>
        </div>
      </div>
      <div class="stock-held">Avg buy price: ${pos.avgPrice||mkt.price}g · Now: ${mkt.price}g/share</div>
      <div class="stock-actions">
        <button class="stock-btn stock-btn-sell" data-sell-ticker="${ticker}" data-qty="1">Sell 1 · ${mkt.price}g</button>
        <button class="stock-btn stock-btn-sell" data-sell-ticker="${ticker}" data-qty="${pos.shares}">Sell All · ${pos.shares*mkt.price}g</button>
      </div>
    </div>`;
  });
  h+=`</div>`;
  const totalPnl=totalVal-totalCost,totalPct=totalCost>0?Math.round((totalPnl/totalCost)*100):0;
  h+=`<div class="portfolio-summary">
    <div class="port-sum-row"><span>Portfolio Value</span><span class="stock-price">${totalVal}g</span></div>
    <div class="port-sum-row"><span>Total Invested</span><span>${totalCost}g</span></div>
    <div class="port-sum-row"><span>Total P&amp;L</span><span class="stock-pct ${totalPnl>=0?'up':'down'}">${totalPnl>=0?'+':''}${Math.round(totalPnl)}g (${totalPct}%)</span></div>
  </div>`;
  return h;
}

function _renderCompany(){
  if(!G.company){
    return`<div class="city-company-form">
      <div class="city-market-header"><div class="city-market-title">🏢 Launch Your Company</div></div>
      <div class="city-market-note">List your farming empire on the Valley Stock Exchange! Your share price rises automatically with your crop earnings every season. Others can buy into your success!</div>
      <div class="city-form-group">
        <label class="city-form-label">Company Name</label>
        <input class="city-form-input" id="co-name" placeholder="e.g. MacDonald Farms Ltd." maxlength="32">
      </div>
      <div class="city-form-group">
        <label class="city-form-label">Ticker Symbol (2–4 capital letters)</label>
        <input class="city-form-input" id="co-ticker" placeholder="e.g. MDF" maxlength="4" oninput="this.value=this.value.toUpperCase().replace(/[^A-Z]/g,'')">
      </div>
      <div class="city-form-group">
        <label class="city-form-label">Company Icon</label>
        <div class="city-icon-pick" id="co-icon-pick">
          ${['🏢','🌾','🚜','🌿','🍎','🧑‍🌾','🌻','🏚️','🌽','🥕','🏆','🌱'].map((em,i)=>`<button class="icon-pick-btn${i===0?' sel':''}" onclick="document.querySelectorAll('.icon-pick-btn').forEach(b=>b.classList.remove('sel'));this.classList.add('sel');document.getElementById('co-icon').value='${em}'">${em}</button>`).join('')}
          <input type="hidden" id="co-icon" value="🏢">
        </div>
      </div>
      <div class="city-form-group">
        <label class="city-form-label">Tagline / Description</label>
        <input class="city-form-input" id="co-desc" placeholder="e.g. Premium organic Valley produce" maxlength="60">
      </div>
      <div class="city-form-group">
        <label class="city-form-label">Initial Share Price (10 – 500g)</label>
        <input class="city-form-input" id="co-price" type="number" min="10" max="500" value="100">
      </div>
      <div id="co-error" class="city-form-error" style="display:none"></div>
      <button class="city-form-submit" onclick="createCompany()">📈 List on Exchange</button>
    </div>`;
  }
  const mkt=G.stockMarket[G.company.ticker]||{price:G.company.sharePrice,history:[G.company.sharePrice]};
  const prev=mkt.history.length>=2?mkt.history[mkt.history.length-2]:mkt.price;
  const pct=Math.round(((mkt.price-prev)/prev)*100);
  const up=pct>=0;
  const hist=G.company.history||[];
  return`<div class="city-market-header">
    <div class="city-market-title">${G.company.icon||'🏢'} ${G.company.name}</div>
    <div class="city-season-badge">${G.company.ticker}</div>
  </div>
  <div class="company-dashboard">
    <div class="co-stat-row">
      <div class="co-stat"><div class="co-stat-val">${mkt.price}g</div><div class="co-stat-lab">Share Price</div></div>
      <div class="co-stat"><div class="co-stat-val ${up?'up':'down'}">${up?'▲':'▼'}${Math.abs(pct)}%</div><div class="co-stat-lab">This Season</div></div>
      <div class="co-stat"><div class="co-stat-val">${G.company.sharesIssued||1000}</div><div class="co-stat-lab">Shares Issued</div></div>
      <div class="co-stat"><div class="co-stat-val">${Math.round((G.company.sharesIssued||1000)*mkt.price/1000)}k g</div><div class="co-stat-lab">Mkt Cap</div></div>
    </div>
    <div class="co-chart-wrap">
      <svg viewBox="0 0 200 40" width="200" height="40" style="overflow:visible;width:100%;height:50px">
        ${(()=>{const h=mkt.history;if(h.length<2)return'';const max=Math.max(...h),min=Math.min(...h),range=max-min||1;const pts=h.map((v,i)=>`${Math.round((i/(h.length-1))*198)+1},${Math.round(38-((v-min)/range)*36+1)}`).join(' ');const col=h[h.length-1]>=h[0]?'#22c55e':'#ef4444';const last=pts.split(' ').pop().split(',');return`<polyline points="${pts}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="${last[0]}" cy="${last[1]}" r="3.5" fill="${col}"/>`})()}
      </svg>
      <div class="co-chart-label">Share price history (last ${mkt.history.length} seasons)</div>
    </div>
    <div class="co-history">
      <div class="co-hist-title">📜 Seasonal Record</div>
      ${hist.length===0
        ?'<div style="font-size:11px;color:var(--text-muted);padding:6px 0">Sleep through a season change to record your first entry!</div>'
        :hist.slice(-6).reverse().map(entry=>{
          const si=SEASONS.indexOf(entry.season);
          return`<div class="co-hist-row">
            <span>${['🌸','☀️','🍂','❄️'][si]||'📅'} ${entry.season} Yr.${entry.year||G.year}</span>
            <span>${entry.price}g/share</span>
            <span style="font-size:10px;color:var(--text-muted)">Earnings: ${entry.earned}g</span>
          </div>`;}).join('')}
    </div>
    <div class="city-market-note">💡 Farm more crops to boost earnings — your share price grows with your seasonal profits!</div>
  </div>`;
}

function buyStock(ticker,qty){
  if(!G.stocks)G.stocks={};
  const mkt=G.stockMarket?.[ticker];
  if(!mkt){toast('Unknown ticker!','error');return;}
  const cost=mkt.price*qty;
  if(G.gold<cost){toast('Need '+cost+'g to buy '+qty+' share'+(qty!==1?'s':'')+'!','error');snd('error');return;}
  G.gold-=cost;
  if(!G.stocks[ticker])G.stocks[ticker]={shares:0,avgPrice:mkt.price};
  const pos=G.stocks[ticker];
  const total=pos.shares+qty;
  pos.avgPrice=Math.round((pos.avgPrice*pos.shares+mkt.price*qty)/total);
  pos.shares=total;
  snd('buy');
  toast('📈 Bought '+qty+'× '+ticker+' for '+cost+'g!','success',2800);
  const ct=document.querySelector('.city-tab-btn.active');
  renderCityScreen(ct?ct.dataset.ctab:'market');
}

function sellStock(ticker,qty){
  if(!G.stocks||!G.stocks[ticker]||G.stocks[ticker].shares<qty){
    toast('Not enough shares to sell!','error');snd('error');return;
  }
  const mkt=G.stockMarket?.[ticker];
  if(!mkt){toast('Unknown ticker!','error');return;}
  const earned=mkt.price*qty;
  G.stocks[ticker].shares-=qty;
  G.gold+=earned;
  G.stats.earned=(G.stats.earned||0)+earned;
  snd('coin');
  toast('💰 Sold '+qty+'× '+ticker+' for '+earned+'g!','success',2800);
  const ct=document.querySelector('.city-tab-btn.active');
  renderCityScreen(ct?ct.dataset.ctab:'market');
  renderHUD();
}

function createCompany(){
  const name=(document.getElementById('co-name')?.value||'').trim();
  const ticker=(document.getElementById('co-ticker')?.value||'').trim().toUpperCase();
  const icon=document.getElementById('co-icon')?.value||'🏢';
  const desc=(document.getElementById('co-desc')?.value||'').trim()||'A proud Valley Farm enterprise.';
  const price=parseInt(document.getElementById('co-price')?.value)||100;
  const errEl=document.getElementById('co-error');
  errEl.style.display='none';
  if(!name){errEl.textContent='Enter a company name!';errEl.style.display='block';return;}
  if(ticker.length<2||ticker.length>4||!/^[A-Z]+$/.test(ticker)){errEl.textContent='Ticker must be 2–4 capital letters (e.g. MDF).';errEl.style.display='block';return;}
  if(CITY_COMPANIES.find(c=>c.ticker===ticker)){errEl.textContent='That ticker is already used by an NPC company!';errEl.style.display='block';return;}
  if(price<10||price>500){errEl.textContent='Share price must be between 10 and 500g.';errEl.style.display='block';return;}
  G.company={name,ticker,icon,desc,sharePrice:price,sharesIssued:1000,founded:season()+' Yr.'+G.year,history:[]};
  if(!G.stockMarket)G.stockMarket={};
  G.stockMarket[ticker]={price,history:[price],lastSeason:season()};
  snd('levelup');
  toast('🎉 '+name+' ('+ticker+') is now listed on the Valley Stock Exchange!','success',4000);
  setTimeout(()=>toast('💡 Your share price rises automatically with your crop earnings each season!','info',4000),2000);
  renderCityScreen('company');
}

/* ══ LAUNCH ══ */
function launchGame(){
  document.getElementById('auth-screen').classList.remove('active');
  document.getElementById('game-screen').classList.add('active');
  render();startClock();startAmbient();
  clearInterval(asInt);
  asInt=setInterval(saveAll,30000);
  toast('Welcome back, '+CU+'! 🌾','success',2800);
}

/* ══ KEYBOARD ══ */
window.addEventListener('keydown',e=>{
  if(!document.getElementById('game-screen').classList.contains('active'))return;
  if(e.code==='Escape'){
    if(document.getElementById('help-overlay').classList.contains('show')){closeHelp();return;}
    if(sheetOpen){closeSheet();return;}
    paused?closePause():openPause();return;
  }
  if(e.key==='?'||e.code==='Slash'){openHelp();return;}
  if(paused||sheetOpen)return;
  const map={KeyH:'hoe',KeyW:'water',KeyS:'seed',KeyR:'scythe',KeyD:'shovel'};
  if(map[e.code])setTool(map[e.code]);
  if(e.code==='Space'){e.preventDefault();doSleep();}
});

/* ══ INIT ══ */
loadS();applyS();
// Spawn animated background stars on start menu
(function(){
  const layer=document.getElementById('auth-bg-stars');
  if(!layer)return;
  for(let i=0;i<55;i++){
    const s=document.createElement('div');
    const sz=1+Math.random()*2;
    const op=0.06+Math.random()*0.22;
    const x=Math.random()*100,y=Math.random()*100;
    const dur=4+Math.random()*8;
    const del=Math.random()*8;
    s.style.cssText=`position:absolute;left:${x}%;top:${y}%;width:${sz}px;height:${sz}px;border-radius:50%;background:#fff;opacity:${op};animation:savepulse ${dur}s ${del}s ease-in-out infinite`;
    layer.appendChild(s);
  }
})();
