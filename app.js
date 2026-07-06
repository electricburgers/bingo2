"use strict";
/* ==========================================================================
   Bingo Caller — single-file host console
   ========================================================================== */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
/* Escape user-supplied text before interpolating into innerHTML (winner names,
   custom pattern/theme names) to prevent stored-XSS via crafted input. */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
/* Keep the visual "on" state and the aria-pressed state of a toggle button in sync
   so screen reader users get the same on/off signal as sighted users. */
const setToggle = (el,on) => { el.classList.toggle('on',on); el.setAttribute('aria-pressed', on?'true':'false'); };
const LETTERS = ['B','I','N','G','O'];
const STORAGE_KEY = 'bingoCaller.v1';

/* ---------- Pattern library (5x5 card: row 0=top..4=bottom, col 0=B..4=O) ---------- */
function rowCells(r){return [0,1,2,3,4].map(c=>[r,c]);}
function colCells(c){return [0,1,2,3,4].map(r=>[r,c]);}
const ALL25 = []; for(let r=0;r<5;r++)for(let c=0;c<5;c++)ALL25.push([r,c]);
const OUTER = ALL25.filter(([r,c])=>r===0||r===4||c===0||c===4);

const PATTERNS = {
  any_line:    {name:'Any Line',          meta:'any',  cap:'Any single full row, column, or diagonal.'},
  vertical:    {name:'Vertical Line',     meta:'col',  example:colCells(0), cap:'Any one full column (B, I, N, G, or O).'},
  horizontal:  {name:'Horizontal Line',   meta:'row',  example:rowCells(2), cap:'Any one full horizontal row (1–5).'},
  diagonal:    {name:'Diagonal Line',     cells:[[0,0],[1,1],[2,2],[3,3],[4,4]], cap:'Either corner-to-corner diagonal.'},
  diagonal_stripes:{name:'Diagonal Stripes', cells:[[0,0],[1,1],[2,2],[3,3],[4,4],[0,1],[1,2],[2,3],[3,4],[1,0],[2,1],[3,2],[4,3]], cap:'Three parallel diagonals — the main one plus the two 4-cell broken diagonals beside it.'},
  picket_fence:{name:'Picket Fence',      cells:colCells(0).concat(colCells(2),colCells(4)), cap:'Three full vertical columns — B, N and O.'},
  railroad:    {name:'Railroad Tracks',   cells:colCells(0).concat(colCells(4)), cap:'The two outer columns — B and O.'},
  stripes:     {name:'Stripes',           cells:rowCells(0).concat(rowCells(2),rowCells(4)), cap:'Three full horizontal rows — the 1st, 3rd and 5th.'},
  chevron:     {name:'Chevron / Arrow',   cells:[[2,0],[1,1],[0,2],[1,3],[2,4]], cap:'A peak — two diagonals meeting at the top center.'},
  letter_z:    {name:'Letter Z',          cells:rowCells(0).concat([[1,3],[2,2],[3,1]],rowCells(4)), cap:'Top row, anti-diagonal, then bottom row — a zigzag.'},
  letter_n:    {name:'Letter N',          cells:colCells(0).concat([[1,1],[2,2],[3,3]],colCells(4)), cap:'Left column, main diagonal, right column.'},
  diamond:     {name:'Diamond',           cells:[[0,2],[1,1],[1,3],[2,0],[2,4],[3,1],[3,3],[4,2]], cap:'The ring touching the four edge midpoints.'},
  small_diamond:{name:'Small Diamond',    cells:[[1,2],[2,1],[2,3],[3,2]], cap:'The four cells hugging the free space.'},
  four_corners:{name:'Four Corners',      cells:[[0,0],[0,4],[4,0],[4,4]], cap:'The four corner cells: top & bottom of the B and O columns.'},
  x:           {name:'X (Both Diagonals)',cells:[[0,0],[1,1],[2,2],[3,3],[4,4],[0,4],[1,3],[3,1],[4,0]], cap:'Both diagonals crossing through the free center.'},
  blackout:    {name:'Blackout / Coverall',cells:ALL25.slice(), cap:'Every square on the card.'},
  postage:     {name:'Postage Stamp',     cells:[[0,3],[0,4],[1,3],[1,4]], cap:'A 2×2 block in the top-right corner (some halls allow any corner).'},
  inner_square:{name:'Inner Square',      cells:[[1,1],[1,2],[1,3],[2,1],[2,3],[3,1],[3,2],[3,3]], cap:'The square of 8 cells ringing the free space.'},
  frame:       {name:'Picture Frame',     cells:OUTER.slice(), cap:'The full outer border of the card.'},
  letter_t:    {name:'Letter T',          cells:rowCells(0).concat(colCells(2).filter(([r])=>r>0)), cap:'Top row plus the center (N) column.'},
  letter_l:    {name:'Letter L',          cells:colCells(0).concat(rowCells(4).filter(([,c])=>c>0)), cap:'Left (B) column plus the bottom row.'},
};
const CENTER = (r,c)=>r===2&&c===2;

/* ---------- Bingo call-outs (US 1–75), family-friendly with a wink ----------
   Each number maps to an ARRAY of call-out variants. When a ball is called,
   the first variant in the combined list (your own + built-in) is shown.
   The little ↻ button next to the call-out cycles to the next variant —
   your choice is remembered for that number for the rest of the night. */
const CALLS = {
  1:["Kelly's eye, number one","Exit One, say goodbye — hello Delaware!"],
  2:["One little duck, number two","Tie your shoe, lucky two"],
  3:["Cup of tea, number three","Route Three — to the Meadowlands we go!"],
  4:["Knock at the door, number four","Down the shore, lucky four!","Parkway Exit 4 — Wildwood, baby! Sun, sand, and funnel cake!"],
  5:["Man alive, it's a five","High five for number five"],
  6:["Pick up sticks, lucky six","Half a dozen, here come the kicks"],
  7:["Lucky seven, straight from heaven","Seventh heaven, you're gonna win"],
  8:["Garden gate, lucky eight","The Garden State — that's an eight!"],
  9:["Cut the line, it's a nine","Route Nine — ride the shoreline","Parkway Exit 9 — Shell Bay Avenue, Cape May Court House — yes, that's a real place"],
  10:["Once again, it's a ten","Cock and hen, number ten","Parkway Exit 10 — Stone Harbor! Break out the beach chairs!"],
  11:["Legs eleven","Eleven — feels like heaven","Parkway Exit 11 — Avalon! The fancy end of Seven Mile Beach!"],
  12:["One, two — buckle my shoe","A baker's dozen, minus one"],
  13:["Unlucky for some — thirteen","Sweet thirteen, nothing but green","Parkway Exit 13 — Oceanview Service Area, mile marker 18.3 — grab a Cinnabon, you've earned it!"],
  14:["Caught in between — fourteen","Fourteen, squeaky clean"],
  15:["Young and keen — fifteen","Hoboken's own, born in '15 — that's Sinatra!"],
  16:["Sweet sixteen","Sixteen — washed and clean"],
  17:["Dancing queen — seventeen","Seventeen, livin' the dream"],
  18:["Coming of age — eighteen","Eighteen — out on the scene"],
  19:["Goodbye teens — nineteen","Nineteen — last of the teens"],
  20:["Plenty to spare — that's twenty","Two perfect tens — twenty","Parkway Exit 20 — Route 50, Upper Township — is Upper Township above or below the Parkway? Nobody knows!"],
  21:["Key of the door — twenty-one","Twenty-one — that's a ton of fun"],
  22:["Two little ducks — quack quack!","Double deuce — twenty-two"],
  23:["Thee and me — twenty-three","Busy as a bee — twenty-three"],
  24:["Knock on the door — twenty-four","Route Twenty-Four — almost there!"],
  25:["Duck and dive — twenty-five","A quarter, baby — twenty-five!","Parkway Exit 25 — Ocean City! Excuse me, it's a DRY town. The bars are on the Parkway."],
  26:["Pick and mix — twenty-six","Bag of tricks — twenty-six"],
  27:["Gates of heaven — twenty-seven","Lucky twenty-seven"],
  28:["Closing the gate — twenty-eight","Twenty-eight — don't be late"],
  29:["Rise and shine — twenty-nine","Twenty-nine — shoe's lookin' fine","Parkway Exit 29 — Somers Point, the last stop before Ocean City. Party while you can."],
  30:["Dirty thirty","Flirty thirty"],
  31:["Thirty-one — having fun","Get up and run — thirty-one"],
  32:["Thirty-two — tie your shoe","Thirty-two — lookin' at you"],
  33:["Thirty-three — busy as a bee","All the threes — thirty-three"],
  34:["Ask for more — thirty-four","Thirty-four — knock once more"],
  35:["Thirty-five — still alive!","Route Thirty-Five — Seaside, here we come!"],
  36:["Three dozen — thirty-six","Thirty-six — bag of tricks","Parkway Exit 36 — Atlantic City Expressway junction. Vegas of the Jersey Shore. You already lost money getting there."],
  37:["Thirty-seven — feels like heaven","Lucky thirty-seven"],
  38:["Thirty-eight — don't make me wait","Thirty-eight — lookin' great"],
  39:["Thirty-nine — lookin' fine","Thirty-nine — toe the line"],
  40:["Life begins at forty!","Forty — ooh, that's naughty!"],
  41:["Forty-one — time for fun","Forty-one — just begun","Parkway Exit 41 — Galloway Township. Home of Stockton University, where everyone's a philosophy major!"],
  42:["Forty-two — peekaboo!","Forty-two — lookin' at you"],
  43:["Down on one knee — forty-three","Forty-three — free as can be"],
  44:["All the fours — forty-four","Forty-four — knock once more","Parkway Exit 44 — Egg Harbor City. Egg Harbor. There are two of them, because New Jersey."],
  45:["Forty-five — still alive and kickin'","Forty-five — ready to thrive"],
  46:["Route Forty-Six — let's get a diner booth!","Forty-six — bag of tricks"],
  47:["Forty-seven — close to heaven","Lucky forty-seven"],
  48:["Four dozen — forty-eight","Forty-eight — don't be late"],
  49:["Born in '49 — that's The Boss! (Long Branch, NJ)","Forty-nine — born to run"],
  50:["Fifty — nifty!","Half a century — fifty","Parkway Exit 50 — New Gretna, US 9 North. You're in the Pinelands now. No one is coming to find you."],
  51:["Fifty-one — having fun","Fifty-one — nearly done"],
  52:["Weeks in a year — fifty-two","Fifty-two — peekaboo!"],
  53:["Fifty-three — busy as a bee","Fifty-three — fancy free"],
  54:["Clean the floor — fifty-four","Fifty-four — and then some more"],
  55:["Snakes alive — fifty-five","High-fives all around — fifty-five"],
  56:["Fifty-six — bag of tricks","Fifty-six — fix it quick"],
  57:["Heinz varieties — fifty-seven","Fifty-seven — close to heaven"],
  58:["Fifty-eight — can't be late","Fifty-eight — feeling great","Parkway Exit 58 — Little Egg Harbor and Tuckerton. If you've been to Tuckerton, you've been to Tuckerton."],
  59:["Fifty-nine — lookin' fine","Fifty-nine — right on time"],
  60:["Five dozen — sixty","Grandma's getting frisky — sixty!"],
  61:["Baker's bun — sixty-one","Sixty-one — just for fun"],
  62:["Tickety-boo — sixty-two","Sixty-two — how do you do?"],
  63:["Tickle me — sixty-three","Sixty-three — tea for free"],
  64:["Almost retired — sixty-four","Sixty-four — and then some more"],
  65:["Retirement age — sixty-five","Stay alive — sixty-five!"],
  66:["Clickety-click — sixty-six","Sixty-six — pick up sticks"],
  67:["Made in heaven — sixty-seven","Sixty-seven — touch of heaven","Parkway Exit 67 — Barnegat, Route 554. Barnegat means 'breakers inlet' in Dutch. You're basically a linguist now."],
  68:["Pick a mate — sixty-eight","Sixty-eight — running late"],
  69:["Either way up — you decide! (Sixty-nine)","Sixty-nine — flip it, it's still fine","Parkway Exit 69 — Wells Mills Road, Waretown. Sixty-nine AND Wells Mills. I couldn't make this up."],
  70:["Three score and ten — seventy","Seventy — oh so heavenly"],
  71:["Seventy-one — having fun","Seventy-one — nearly done"],
  72:["Route Seventy-Two — LBI, here we come!","Seventy-two — how do you do?"],
  73:["Seventy-three — fancy free","Lucky seventy-three"],
  74:["Seventy-four — almost there","Seventy-four — one or two more","Parkway Exit 74 — Lacey Road, Forked River. There's a Forked River Service Area right here. Coffee. Gas. Stare at the Pines and question your choices."],
  75:["Top of the shop — seventy-five!","Seventy-five — the year of 'Born to Run'!"],
};

/* ----------------------------------------------------------------------------
   ✏️  YOUR OWN CALL-OUTS — add jokes/lines here!
   Format: ball number -> array of strings. These appear FIRST in the cycle
   for that number (before the built-in lines above). Leave an array empty,
   or omit a number entirely, if you don't want any custom lines for it.
   Example:
     42: ["Forty-two — the answer to everything!"],
     73: ["Seventy-three — Sheldon Cooper's favorite number"],
---------------------------------------------------------------------------- */
const MY_CALLS = {
  // 1: ["your line here"],
};

/* Combined, de-duplicated variant list for a ball: your lines first, then built-ins. */
function callVariants(n){
  const mine=MY_CALLS[n]||[];
  const base=CALLS[n]||[];
  const seen=new Set(); const out=[];
  for(const s of [...mine,...base]){ if(s && !seen.has(s)){ seen.add(s); out.push(s); } }
  return out;
}

/* ---------- Themes ---------- */
const THEMES = {
  dark:        {label:'Dim Bar',     vars:{'--bg':'#15171c','--surface':'#1f232b','--surface-2':'#2a2f3a','--line':'#3a4150','--text':'#f2f5fa','--muted':'#9aa6b8','--accent':'#ffd23f'},
                letters:{B:'#ff595e',I:'#ff924c',N:'#ffca3a',G:'#8ac926',O:'#52a6f0'}},
  contrast:    {label:'High Contrast',vars:{'--bg':'#000000','--surface':'#0d0d0d','--surface-2':'#1a1a1a','--line':'#555','--text':'#ffffff','--muted':'#cfcfcf','--accent':'#ffe600'},
                letters:{B:'#4da3ff',I:'#ff5c5c',N:'#ffffff',G:'#5cff8f',O:'#ffd24d'}},
  classic:     {label:'Bingo Hall',  vars:{'--bg':'#102a43','--surface':'#1b3a5c','--surface-2':'#244a73','--line':'#3a5e85','--text':'#f5f7fb','--muted':'#a8c0db','--accent':'#ffcf33'},
                letters:{B:'#36b3ff',I:'#ff5b6e',N:'#ffffff',G:'#46d27a',O:'#ffc24d'}},
  light:       {label:'Daylight',    vars:{'--bg':'#f4f6fb','--surface':'#ffffff','--surface-2':'#e9eef6','--line':'#cfd8e6','--text':'#15202b','--muted':'#5c6b7e','--accent':'#f59e0b'},
                letters:{B:'#1d6fd1',I:'#d1411d','N':'#7a4ed1',G:'#1d9d4e',O:'#c98a00'}},
  cbDeuteran:  {label:'Colorblind · Deuteranopia', vars:{'--bg':'#13161c','--surface':'#1e222b','--surface-2':'#282d39','--line':'#3c4252','--text':'#f2f5fa','--muted':'#9aa6b8','--accent':'#f0e442'},
                letters:{B:'#0072b2',I:'#e69f00',N:'#f0e442',G:'#009e73',O:'#cc79a7'}},
  cbProtan:    {label:'Colorblind · Protanopia', vars:{'--bg':'#13161c','--surface':'#1e222b','--surface-2':'#282d39','--line':'#3c4252','--text':'#f2f5fa','--muted':'#9aa6b8','--accent':'#f0e442'},
                letters:{B:'#0072b2',I:'#e69f00',N:'#f0e442',G:'#009e73',O:'#cc79a7'}},
  cbTritan:    {label:'Colorblind · Tritanopia', vars:{'--bg':'#13161c','--surface':'#1e222b','--surface-2':'#282d39','--line':'#3c4252','--text':'#f2f5fa','--muted':'#9aa6b8','--accent':'#d55e00'},
                letters:{B:'#d55e00',I:'#cc79a7',N:'#ffffff',G:'#009e73',O:'#0072b2'}},
};

/* ---------- Default state ---------- */
function defaultState(){
  return {
    pattern:'any_line',
    freeSpace:true,
    patternDim:true,
    called:[],
    callTimes:[],
    calloutIdx:{}, // { ballNumber: variantIndex } — remembers your cycled choice per number
    winners:[],
    settings:{
      theme:'dark',
      letters:{...THEMES.dark.letters},
      vars:{}, fontScale:100, boardScale:0.75,
      callouts:true,
      limitDraw:true,
      autoInterval:10,
      patCollapsed:false,
      showPreview:true,
    },
    customPatterns:[],
    customThemes:[],
    editorCells:[],
    session:{id:Date.now(), started:new Date().toISOString(), games:1},
    history:[], // archived games this "night"
  };
}

let S = load() || defaultState();

function load(){ try{const r=localStorage.getItem(STORAGE_KEY);return r?JSON.parse(r):null;}catch(e){return null;} }
let _saveTimer=null;
function flushSave(){
  if(_saveTimer){ clearTimeout(_saveTimer); _saveTimer=null; }
  try{ localStorage.setItem(STORAGE_KEY, JSON.stringify(S)); }catch(e){}
}
function save(){
  // Debounce rapid successive writes (e.g. multiple state changes in one tick)
  // into a single localStorage write to reduce main-thread/JSON-stringify overhead.
  if(_saveTimer) clearTimeout(_saveTimer);
  _saveTimer=setTimeout(flushSave, 120);
}
addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') flushSave(); });
addEventListener('pagehide', flushSave);

/* ---------- Ball helpers ---------- */
const TOTAL = 75;
function letterFor(n){ return LETTERS[Math.floor((n-1)/15)]; }
function maxBalls(){ return TOTAL; }
function colOf(n){ return Math.floor((n-1)/15); }

/* Columns the draw is restricted to, given the pattern AND the limit setting.
   Returns a Set of column indices, or null for "no restriction (all columns)". */
function activeColumns(){
  if(!S.settings.limitDraw) return null;
  return involvedColumns();
}
/* The balls that may still be drawn right now: uncalled, and (if limiting) in an active column. */
function eligibleBalls(){
  const cols=activeColumns();
  const called=new Set(S.called);
  const out=[];
  for(let n=1;n<=TOTAL;n++){
    if(called.has(n)) continue;
    if(cols && !cols.has(colOf(n))) continue;
    out.push(n);
  }
  return out;
}

/* ==========================================================================
   RENDER
   ========================================================================== */
function renderBall(pop){
  const last = S.called[S.called.length-1];
  const inPlay = eligibleBalls().length;
  const ball=$('#ball'), L=$('#ballLetter'), N=$('#ballNum');
  if(!last){
    ball.classList.add('empty'); L.textContent=''; N.textContent= inPlay? 'Ready':'Done';
    ball.style.removeProperty('--ball-color'); ball.style.removeProperty('--ball-text');
  }else{
    ball.classList.remove('empty');
    const lt=letterFor(last);
    L.textContent=lt; N.textContent=last;
    // --ball-color is the raw, saturated letter hue (decorative border/glow only).
    // --ball-text is a separately-computed AAA-safe variant for the letter glyph itself,
    // since the same bright hue that looks great as a ring often can't hit 7:1 as text.
    ball.style.setProperty('--ball-color', `var(--col-${lt})`);
    ball.style.setProperty('--ball-text', `var(--col-${lt}-fg)`);
    if(pop){ ball.classList.remove('pop'); void ball.offsetWidth; ball.classList.add('pop'); }
  }
  $('#callIdx').textContent=S.called.length;
  $('#remainCount').textContent=inPlay;
  // draw-scope hint when the pool is pattern-limited
  const cols=activeColumns();
  $('#drawScope').textContent = cols
    ? 'Drawing from '+[...cols].sort().map(i=>LETTERS[i]).join(' · ')+' only'
    : '';
  // call-out line
  let co='';
  if(last && S.settings.callouts){
    const variants=callVariants(last);
    if(variants.length){
      const idx=((S.calloutIdx[last]||0) % variants.length);
      co=variants[idx];
    }
  }
  $('#callout').textContent=co;
  $('#bsCallout').textContent=co;
  // big screen mirror
  $('#bsLetter').textContent=last?letterFor(last):'';
  $('#bsNum').textContent=last?last:'—';
  $('#bigscreen').style.setProperty('--ball-color', last?`var(--col-${letterFor(last)})`:'var(--accent)');
  $('#bigscreen').style.setProperty('--ball-text', last?`var(--col-${letterFor(last)}-fg)`:'var(--accent-fg)');
  $('#bsCount').textContent=S.called.length;
  if(last) $('#srAnnounce').textContent = `${letterFor(last)} ${last}. ${co}`;
  if(pop && last) speakCall(letterFor(last), last, co);
}

function cycleCallout(){
  const last=S.called[S.called.length-1];
  if(!last) return;
  const variants=callVariants(last);
  if(variants.length<2) return;
  const cur=(S.calloutIdx[last]||0);
  S.calloutIdx[last]=(cur+1)%variants.length;
  save();
  renderBall(false);
}

function renderRecent(){
  const box=$('#recent'); const bs=$('#bsRecent'); const label=$('#recentLabel');
  const recent=S.called.slice(-8).reverse();
  if(!recent.length){
    box.innerHTML='<span class="muted">Recent calls appear here…</span>'; bs.innerHTML='';
    label.classList.add('hide');
    return;
  }
  const chips=recent.map((n,i)=>{
    const lt=letterFor(n);
    const col=lt?`color:var(--col-${lt}-fg)`:'';
    return `<span class="chip ${i===0?'latest':''}"><span class="l" style="${col}">${lt}</span>${n}</span>`;
  }).join('');
  box.innerHTML=chips; bs.innerHTML=chips;
  label.classList.remove('hide');
}

/* Cached once in buildBoard() and reused by paintBoard()/flashFind() so every
   render doesn't re-run a 75-node querySelectorAll. */
let boardCells=[];
function buildBoard(){
  const board=$('#board'); board.innerHTML=''; boardCells=[];
  for(let c=0;c<5;c++){
    const col=document.createElement('div'); col.className='bcol'; col.dataset.col=c;
    const head=document.createElement('div'); head.className='bhead';
    head.textContent=LETTERS[c]; head.style.setProperty('--lc',`var(--col-${LETTERS[c]})`);
    head.style.setProperty('--lc-bg',`var(--col-${LETTERS[c]}-bg)`);
    head.style.setProperty('--lc-text',`var(--col-${LETTERS[c]}-text)`);
    col.appendChild(head);
    for(let r=0;r<15;r++){
      const n=c*15+r+1;
      const cell=document.createElement('button');
      cell.type='button';
      cell.className='cell'; cell.dataset.n=n; cell.textContent=n;
      cell.setAttribute('aria-label', `${LETTERS[c]} ${n}`);
      cell.setAttribute('aria-pressed','false');
      cell.style.setProperty('--lc',     `var(--col-${LETTERS[c]})`);
      cell.style.setProperty('--lc-bg',  `var(--col-${LETTERS[c]}-bg)`);
      cell.style.setProperty('--lc-text',`var(--col-${LETTERS[c]}-text)`);;
      col.appendChild(cell);
      boardCells.push(cell);
    }
    board.appendChild(col);
  }
  paintBoard();
}
/* Single delegated click listener for all 75 board cells, instead of one
   listener per cell — cheaper to set up and doesn't need re-binding if the
   board is ever rebuilt. */
function wireBoardClicks(){
  $('#board').addEventListener('click', e=>{
    const cell=e.target.closest('.cell');
    if(cell) flashFind(+cell.dataset.n);
  });
}

function paintBoard(){
  const calledSet=new Set(S.called);
  const last=S.called[S.called.length-1];
  boardCells.forEach(cell=>{
    const n=+cell.dataset.n;
    const isCalled=calledSet.has(n);
    cell.classList.toggle('called', isCalled);
    cell.classList.toggle('current', n===last);
    cell.setAttribute('aria-pressed', isCalled?'true':'false');
    cell.setAttribute('aria-label', `${letterFor(n)} ${n}${isCalled?', called':''}`);
  });
  // dim columns the current pattern can't use
  const cols=involvedColumns();
  $$('#board .bcol').forEach(col=>{
    const c=+col.dataset.col;
    col.classList.toggle('dim', S.patternDim && cols && !cols.has(c));
  });
  $('#boardCount').textContent=`${S.called.length} / ${TOTAL}`;
  setToggle($('#patDimBtn'), S.patternDim);
}

/* which B/I/N/G/O columns are involved in current pattern (null = all/any) */
function involvedColumns(){
  const p=currentPatternDef();
  if(!p || p.meta) return null;            // any/row/col patterns span all columns
  const cells=patternCells(p);
  const cols=new Set(cells.map(([,c])=>c));
  return cols.size>=5? null : cols;
}

function currentPatternDef(){
  if(S.pattern.startsWith('custom:')){
    const id=S.pattern.slice(7);
    const cp=S.customPatterns.find(p=>p.id===id);
    return cp? {name:cp.name, cells:cp.cells.map(x=>x.slice()), cap:'Custom pattern.'} : PATTERNS.any_line;
  }
  return PATTERNS[S.pattern]||PATTERNS.any_line;
}
function patternCells(p){
  if(p.cells) return p.cells;
  if(p.meta==='col') return p.example;
  if(p.meta==='row') return p.example;
  if(p.meta==='any') return ALL25; // representative
  return [];
}

/* ---------- pattern selector + mini diagrams ---------- */
function miniSVG(cells, opts){
  // returns a .mini element content (25 <i>)
  const set=new Set(cells.map(([r,c])=>r+'_'+c));
  let html='';
  for(let r=0;r<5;r++)for(let c=0;c<5;c++){
    let cls='';
    if(set.has(r+'_'+c)) cls='on';
    if(S.freeSpace && CENTER(r,c) && (opts&&opts.markFree)) cls='free';
    html+=`<i class="${cls}"></i>`;
  }
  return html;
}

/* representative cells for a pattern's mini diagram */
function miniCellsFor(def){
  if(def.meta==='any'){
    // asterisk through center: middle row + middle col + both diagonals
    const s=new Set(); const add=(r,c)=>s.add(r+'_'+c);
    for(let i=0;i<5;i++){add(2,i);add(i,2);add(i,i);add(i,4-i);}
    return [...s].map(k=>k.split('_').map(Number));
  }
  if(def.meta) return def.example;
  return def.cells;
}

function buildPatternTiles(){
  const wrap=$('#patTiles'); wrap.innerHTML='';
  const make=(key,def,star)=>{
    const t=document.createElement('button');
    t.className='ptile';
    t.dataset.key=key;
    setToggle(t, S.pattern===key);
    const cells=miniCellsFor(def);
    const markFree=S.freeSpace && cells.some(([r,c])=>CENTER(r,c));
    t.innerHTML=`<span class="mini">${miniSVG(cells,{markFree})}</span><span>${star?'★ ':''}${esc(def.name)}</span>`;
    t.onclick=()=>selectPattern(key);
    wrap.appendChild(t);
  };
  Object.entries(PATTERNS).forEach(([k,p])=>make(k,p,false));
  S.customPatterns.forEach(p=>make('custom:'+p.id,{name:p.name,cells:p.cells.map(x=>x.slice())},true));
  const add=document.createElement('button');
  add.className='ptile add';
  add.innerHTML='<span class="mini"></span><span>＋ Custom</span>';
  add.onclick=()=>{ S.editorCells=[]; buildEditor(); $('#customEditor').classList.remove('hide'); };
  wrap.appendChild(add);
}

function selectPattern(key){
  S.pattern=key; save();
  $('#customEditor').classList.toggle('hide', !key.startsWith('custom:'));
  buildPatternTiles(); renderPattern(); renderBall(false);
  _nextBall=null; pickNextBall(); renderPreview();
}

function renderPattern(){
  const p=currentPatternDef();
  $('#patName').textContent=p.name;
  $('#patHeaderName').textContent='— '+p.name;
  $('#patCap').textContent=p.cap||'';
  const cells=miniCellsFor(p);
  const markFree=S.freeSpace && cells.some(([r,c])=>CENTER(r,c));
  $('#patMini').innerHTML=miniSVG(cells,{markFree});
  $('#bsPattern').textContent=p.name;
  $('#freeTag').textContent = S.freeSpace?'free space on':'free space off';
  paintBoard();
}

/* custom editor */
function buildEditor(){
  const g=$('#editorGrid'); g.innerHTML='';
  const set=new Set(S.editorCells.map(([r,c])=>r+'_'+c));
  for(let r=0;r<5;r++)for(let c=0;c<5;c++){
    const b=document.createElement('button');
    b.type='button';
    const isCenter=CENTER(r,c), isOn=set.has(r+'_'+c);
    const label=`${LETTERS[c]} row ${r+1}${isCenter?', free space':''}`;
    b.setAttribute('aria-label', label+(isOn?', selected':''));
    setToggle(b, isOn);
    if(isCenter){b.classList.add('center');b.textContent='★';}
    b.addEventListener('click',()=>{
      const key=r+'_'+c;
      const idx=S.editorCells.findIndex(([rr,cc])=>rr===r&&cc===c);
      if(idx>=0)S.editorCells.splice(idx,1); else S.editorCells.push([r,c]);
      buildEditor(); save();
    });
    g.appendChild(b);
  }
}

/* ---------- audit / log ---------- */
function fmtTime(iso){const d=new Date(iso);return d.toLocaleTimeString([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});}
function renderLog(){
  const body=$('#logBody');
  // Build a map of callCount → winner records for that call index
  const winAtCall={};
  S.winners.forEach(w=>{ (winAtCall[w.callCount]=winAtCall[w.callCount]||[]).push(w); });

  // Interleave winner rows into the call log (newest first)
  const rows=[];
  S.called.forEach((n,i)=>{
    const callNum=i+1;
    const lt=letterFor(n);
    rows.push(`<tr><td>${callNum}</td><td><b style="color:${lt?`var(--col-${lt}-fg)`:'inherit'}">${lt}\u00a0${n}</b></td><td class="mono">${S.callTimes?fmtTime(S.callTimes[i]):''}</td></tr>`);
    // Insert winner row(s) AFTER the ball that triggered the win
    if(winAtCall[callNum]){
      winAtCall[callNum].forEach(w=>{
        const label=w.name ? `<b class="winner-name">${esc(w.name)}</b> · ${esc(w.pattern)}` : `<b>${esc(w.pattern)}</b>`;
        rows.push(`<tr class="win"><td>🏆</td><td colspan="2">${label} · <span class="mono">${fmtTime(w.ts)}</span></td></tr>`);
      });
    }
  });
  body.innerHTML=rows.reverse().join('')||'<tr><td colspan="3" class="muted" style="padding:14px">No balls called yet.</td></tr>';

  $('#sCalled').textContent=S.called.length;
  $('#sLeft').textContent=TOTAL - S.called.length;
  $('#sWins').textContent=S.winners.length;
  $('#sGames').textContent=S.session.games;

  // Winners panel — always same format: name (if any) · pattern · call # · time
  const allNames=S.winners.filter(w=>w.name).map(w=>esc(w.name));
  const banner=allNames.length
    ? `<div class="congrats-banner">🎉 Tonight's winners: <b>${allNames.join(', ')}</b></div>` : '';
  $('#winList').innerHTML=banner+S.winners.map(w=>{
    const who=w.name?`<b class="winner-name">${esc(w.name)}</b> · `:''
    return `<div class="winrec">🏆 ${who}${esc(w.pattern)} · call #${w.callCount} · <span class="mono">${fmtTime(w.ts)}</span></div>`;
  }).join('');

  // history
  $('#historyList').innerHTML = S.history.length
    ? S.history.map((h,i)=>{
        const names=h.winnerRecs?h.winnerRecs.filter(w=>w.name).map(w=>esc(w.name)):[];
        return `Game ${i+1}: ${h.calls} calls · ${h.winners} winner(s)${names.length?' ('+names.join(', ')+')':''} · ${fmtTime(h.ended)}`;
      }).join('<br>')
    : '<span class="muted">No archived games this session.</span>';
}

/* ==========================================================================
   ACTIONS
   ========================================================================== */
function ensureTimes(){ if(!S.callTimes) S.callTimes=[]; }

/* ---------- Live call-out preview ---------- */
let _nextBall = null; // pre-selected ball — host-only, not persisted

function pickNextBall(){
  const elig = eligibleBalls();
  if(!elig.length){ _nextBall = null; return; }
  // Try to pick something other than whatever was just called
  const last = S.called[S.called.length-1];
  const pool = elig.length > 1 ? elig.filter(n=>n!==last) : elig;
  _nextBall = pool[Math.floor(Math.random()*pool.length)];
}

function renderPreview(){
  const panel = $('#previewPanel');
  if(!S.settings.showPreview){ panel.classList.add('hidden'); return; }
  panel.classList.remove('hidden');

  if(!_nextBall || !eligibleBalls().includes(_nextBall)){
    pickNextBall();
  }

  if(!_nextBall){
    panel.classList.add('empty');
    $('#previewLetter').textContent = '';
    $('#previewNum').textContent = '—';
    $('#previewCalloutTxt').textContent = 'No more balls to call';
    panel.style.removeProperty('--preview-col');
    return;
  }
  panel.classList.remove('empty');
  const lt = letterFor(_nextBall);
  const variants = callVariants(_nextBall);
  const idx = S.calloutIdx[_nextBall] || 0;
  const co = S.settings.callouts && variants.length ? variants[idx % variants.length] : '';
  $('#previewLetter').textContent = lt;
  $('#previewNum').textContent = _nextBall;
  $('#previewCalloutTxt').textContent = co || '';
  panel.style.setProperty('--preview-col', `var(--col-${lt}-fg)`);
}

/* Shared post-mutation refresh for callNext()/undo() — both change S.called
   and need the same set of views (and the next-ball preview) refreshed. */
function renderAfterCallChange(pop){
  renderBall(pop); renderRecent(); paintBoard(); renderLog();
  _nextBall=null; pickNextBall(); renderPreview();
}

function callNext(){
  const elig=eligibleBalls();
  if(!elig.length){
    toast(S.called.length>=TOTAL ? 'Every ball has been called.' : 'No balls left for this pattern.');
    stopAuto(); return;
  }
  ensureTimes();
  // Use pre-selected preview ball if still valid; otherwise random
  const n = (_nextBall && elig.includes(_nextBall)) ? _nextBall : elig[Math.floor(Math.random()*elig.length)];
  S.called.push(n);
  S.callTimes.push(new Date().toISOString());
  save();
  renderAfterCallChange(true);
  if(S.settings.vibrate && navigator.vibrate) navigator.vibrate(40);
  if(!eligibleBalls().length){ toast('Last ball in play for this pattern.'); stopAuto(); }
}

function undo(){
  if(!S.called.length){ toast('Nothing to undo.'); return; }
  ensureTimes();
  S.called.pop(); S.callTimes.pop();
  save();
  renderAfterCallChange(false);
}

function newGame(){
  confirmModal('New game?','Clears all called balls and the current call log. Winners and history are kept. Tip: “Archive game” first to save this round to the night log.',()=>{
    S.called=[]; S.callTimes=[];
    save(); fullRender(); toast('New game ready.');
  });
}

function markWinner(){
  if(!S.called.length){ toast('Call some balls first.'); return; }
  const p=currentPatternDef();
  confirmModal(
    '🏆 Mark winner!',
    'Pattern: '+p.name+' · call #'+S.called.length,
    (captured)=>{
      const name=((captured&&captured.modalNameInput)||'').trim();
      S.winners.push({
        name, pattern:p.name, ts:new Date().toISOString(),
        callCount:S.called.length, lastBall:S.called[S.called.length-1]
      });
      save(); renderLog();
      toast('🏆 '+(name?name+' wins!':'Winner recorded!')+' — '+p.name);
    },
    {okText:'Record winner', cancelText:'Cancel',
     extra:'<label class="fld" style="font-size:.85rem;font-weight:700">Winner\'s name (optional)<input type="text" id="modalNameInput" placeholder="e.g. Table 4, or María" autocomplete="off" style="margin-top:6px"></label>'}
  );
}

function archiveGame(){
  if(!S.called.length && !S.winners.length){ toast('Nothing to archive yet.'); return; }
  S.history.push({
    ended:new Date().toISOString(),
    calls:S.called.length,
    winners:S.winners.length,
    pattern:currentPatternDef().name,
    order:S.called.slice(),
    times:(S.callTimes||[]).slice(),
    winnerRecs:S.winners.slice(),
  });
  S.session.games++;
  S.called=[]; S.callTimes=[]; S.winners=[];
  save(); fullRender(); toast('Game archived. Fresh board ready.');
}

/* ---------- auto-call ---------- */
let autoTimer=null, autoRAF=null, autoEnd=0, autoRemain=0, autoOn=false, autoPaused=false;
function startAuto(){
  if(!eligibleBalls().length){ toast('No balls left to call.'); return; }
  autoOn=true; autoPaused=false;
  $('#autoBtn').textContent='⏸ Pause'; setToggle($('#autoBtn'), true);
  scheduleAuto((S.settings.autoInterval||+$('#intRange').value)*1000);
  syncWakeLock();
}
function scheduleAuto(ms){
  clearTimeout(autoTimer); cancelAnimationFrame(autoRAF);
  autoEnd=performance.now()+ms; autoRemain=ms;
  tickCountdown();
  autoTimer=setTimeout(()=>{
    if(!autoOn||autoPaused) return;
    callNext();
    if(eligibleBalls().length && autoOn) scheduleAuto(((S.settings.autoInterval)|| +$('#intRange').value)*1000);
    else stopAuto();
  },ms);
}
function tickCountdown(){
  const total=((S.settings.autoInterval)|| +$('#intRange').value)*1000;
  const left = autoPaused? autoRemain : Math.max(0,autoEnd-performance.now());
  $('#cdFill').style.width=(100*(1-left/total))+'%';
  if(autoOn && !autoPaused) autoRAF=requestAnimationFrame(tickCountdown);
}
function pauseAuto(){
  autoPaused=true; autoRemain=Math.max(0,autoEnd-performance.now());
  clearTimeout(autoTimer); cancelAnimationFrame(autoRAF);
  $('#autoBtn').textContent='▶ Resume';
}
function resumeAuto(){
  if(!eligibleBalls().length){ stopAuto(); return; }
  autoPaused=false; $('#autoBtn').textContent='⏸ Pause';
  scheduleAuto(autoRemain>200?autoRemain:200);
}
function stopAuto(){
  autoOn=false; autoPaused=false;
  clearTimeout(autoTimer); cancelAnimationFrame(autoRAF);
  $('#autoBtn').textContent='▶ Auto Call'; setToggle($('#autoBtn'), false);
  $('#cdFill').style.width='0%';
  syncWakeLock();
}
function toggleAuto(){
  if(!autoOn) startAuto();
  else if(autoPaused) resumeAuto();
  else pauseAuto();
}

/* ---------- find / search ---------- */
function flashFind(n){
  boardCells.forEach(c=>c.classList.remove('found'));
  const cell=boardCells[n-1]; if(cell)cell.classList.add('found');
  const idx=S.called.indexOf(n);
  if(idx>=0){ ensureTimes(); $('#findNote').innerHTML=`<b style="color:var(--good-fg)">${letterFor(n)} ${n}</b> — call #${idx+1}${S.callTimes&&S.callTimes[idx]?' at '+fmtTime(S.callTimes[idx]):''}`; }
  else $('#findNote').innerHTML=`<b style="color:var(--warn)">${n}</b> — not called yet`;
  if(cell) cell.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function doFind(){
  const v=parseInt($('#findInput').value,10);
  if(isNaN(v)||v<1||v>maxBalls()){ $('#findNote').textContent='Enter 1–'+maxBalls(); return; }
  flashFind(v);
}

/* ==========================================================================
   EXPORT / SAVE
   ========================================================================== */
function buildSessionObject(whole){
  const cur={
    pattern:currentPatternDef().name,
    calledOrder:S.called.slice(),
    callTimes:(S.callTimes||[]).slice(),
    winners:S.winners.slice(),
  };
  if(!whole) return {kind:'bingo-session', exported:new Date().toISOString(), session:S.session, current:cur};
  return {kind:'bingo-night', exported:new Date().toISOString(), session:S.session, games:S.history.slice(), current:cur};
}
function download(name, text, type){
  const blob=new Blob([text],{type:type||'text/plain'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=name; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1500);
}
function saveJSON(){
  confirmModal('Save backup','Save the current game only, or the whole night (all archived games + current)?',
    ()=>{ download(`bingo-night-${stamp()}.json`, JSON.stringify(buildSessionObject(true),null,2),'application/json'); },
    {okText:'Whole night', cancelText:'Current game', onCancel:()=>{
      download(`bingo-game-${stamp()}.json`, JSON.stringify(buildSessionObject(false),null,2),'application/json');
    }});
}
function exportData(){
  confirmModal('Export log','Choose a format for the call log + winners.',
    ()=>{ download(`bingo-log-${stamp()}.csv`, toCSV(),'text/csv'); },
    {okText:'CSV', cancelText:'Plain text', onCancel:()=>{ download(`bingo-log-${stamp()}.txt`, toTXT(),'text/plain'); }});
}
function toCSV(){
  let out='call_number,letter,ball,time\n';
  S.called.forEach((n,i)=>{ out+=`${i+1},${letterFor(n)},${n},${S.callTimes&&S.callTimes[i]?fmtTime(S.callTimes[i]):''}\n`; });
  out+='\nwinner_pattern,call_count,last_ball,time\n';
  S.winners.forEach(w=>{ out+=`"${w.pattern}",${w.callCount},${w.lastBall},${fmtTime(w.ts)}\n`; });
  return out;
}
function toTXT(){
  let out=`BINGO SESSION LOG\nExported ${new Date().toLocaleString()}\nPattern: ${currentPatternDef().name}\n\nCALLS (${S.called.length}):\n`;
  S.called.forEach((n,i)=>{ out+=`  ${String(i+1).padStart(2)}. ${letterFor(n)} ${n}   ${S.callTimes&&S.callTimes[i]?fmtTime(S.callTimes[i]):''}\n`; });
  out+=`\nWINNERS (${S.winners.length}):\n`;
  if(!S.winners.length)out+='  (none)\n';
  S.winners.forEach(w=>{ out+=`  🏆 ${w.pattern} — call #${w.callCount} (${letterFor(w.lastBall)} ${w.lastBall}) at ${fmtTime(w.ts)}\n`; });
  return out;
}
function stamp(){const d=new Date();const p=x=>String(x).padStart(2,'0');return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;}

/* ---------- Import validation ----------
   Loaded JSON comes from a file on disk, not a trusted source — never assume
   its shape. Reject anything that isn't a plausible bingo session before it
   touches app state (bad ball numbers, oversized arrays, wrong types). */
const MAX_IMPORT_ITEMS = 5000;
function isValidBallArray(a){
  return Array.isArray(a) && a.length<=MAX_IMPORT_ITEMS &&
    a.every(n=>Number.isInteger(n) && n>=1 && n<=TOTAL);
}
function sanitizeWinners(arr){
  if(!Array.isArray(arr)) return [];
  return arr.slice(0,MAX_IMPORT_ITEMS)
    .filter(w=>w && typeof w==='object')
    .map(w=>({
      name: typeof w.name==='string' ? w.name.slice(0,120) : '',
      pattern: typeof w.pattern==='string' ? w.pattern.slice(0,120) : 'Unknown',
      ts: typeof w.ts==='string' ? w.ts : new Date().toISOString(),
      callCount: Number.isFinite(w.callCount) ? w.callCount : 0,
      lastBall: Number.isInteger(w.lastBall) && w.lastBall>=1 && w.lastBall<=TOTAL ? w.lastBall : null,
    }));
}
function sanitizeTimes(arr,len){
  if(!Array.isArray(arr)) return [];
  return arr.slice(0,len).map(t=>typeof t==='string' ? t : new Date().toISOString());
}
function sanitizeHistory(arr){
  if(!Array.isArray(arr)) return [];
  return arr.slice(0,MAX_IMPORT_ITEMS)
    .filter(h=>h && typeof h==='object' && isValidBallArray(h.order))
    .map(h=>({
      ended: typeof h.ended==='string' ? h.ended : new Date().toISOString(),
      calls: h.order.length,
      winners: sanitizeWinners(h.winnerRecs).length,
      pattern: typeof h.pattern==='string' ? h.pattern.slice(0,120) : 'Unknown',
      order: h.order.slice(),
      times: sanitizeTimes(h.times, h.order.length),
      winnerRecs: sanitizeWinners(h.winnerRecs),
    }));
}
function loadJSON(file){
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      const cur=(data&&data.current)||data;
      if(!cur||!isValidBallArray(cur.calledOrder)){ toast('Not a recognized bingo file.'); return; }
      confirmModal('Load this file?','This replaces the current board and call log with the saved data. Winners load too.',()=>{
        S.called=cur.calledOrder.slice();
        S.callTimes=sanitizeTimes(cur.callTimes, S.called.length);
        S.winners=sanitizeWinners(cur.winners);
        if(data.games){ S.history=sanitizeHistory(data.games); }
        save(); fullRender(); toast('Session loaded.');
      });
    }catch(e){ toast('Could not read that file.'); }
  };
  reader.readAsText(file);
}

/* ==========================================================================
   THEME / SETTINGS
   ========================================================================== */

/* WCAG 2.1 relative luminance + contrast ratio helpers. */
function _wcagLin(c){ c/=255; return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4); }
function _luminance(hex){
  hex=hex.replace(/^#/,'');
  if(hex.length===3) hex=hex.split('').map(x=>x+x).join('');
  const r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16);
  return 0.2126*_wcagLin(r)+0.7152*_wcagLin(g)+0.0722*_wcagLin(b);
}
function _contrast(hex1,hex2){
  const l1=_luminance(hex1), l2=_luminance(hex2);
  return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
}
/* Returns '#000000' or '#ffffff' — whichever gives higher contrast ratio on bgHex. */
function bestTextOn(bgHex){
  if(!bgHex||bgHex.length<4) return '#000000';
  try{ return _contrast(bgHex,'#000000')>=_contrast(bgHex,'#ffffff')?'#000000':'#ffffff'; }
  catch(e){ return '#000000'; }
}

/* ---------- AAA-guaranteed color derivation ----------
   WCAG AAA needs 7:1 for normal text. A theme's hand-picked accent/muted/
   letter colors often don't hit that against every surface they land on
   (this is exactly why the "current ball" ring and the light theme's callout
   text were unreadable before). Rather than hand-tune 7 themes × a dozen
   color pairs, every derived color below is computed: nudge the original
   hue toward black or white by the SMALLEST amount that clears the target
   ratio against every background it's actually used on, picking whichever
   direction (toward black or toward white) needs the least nudging — that
   keeps the result as close to the designed color as accessibility allows. */
function _mix(hexFrom, hexTo, t){ // t=0 -> hexFrom, t=1 -> hexTo
  const norm=h=>{ h=h.replace(/^#/,''); return h.length===3?h.split('').map(c=>c+c).join(''):h; };
  const a=norm(hexFrom), b=norm(hexTo);
  const pa=[0,2,4].map(i=>parseInt(a.slice(i,i+2),16));
  const pb=[0,2,4].map(i=>parseInt(b.slice(i,i+2),16));
  const m=(x,y)=>Math.round(x*(1-t)+y*t);
  return '#'+pa.map((x,i)=>m(x,pb[i]).toString(16).padStart(2,'0')).join('');
}
/* Smallest mix-toward-anchor (0..1) so `hex` clears `target` contrast against every color in bgList. */
function _shiftFor(hex, anchor, bgList, target){
  const worst=c=>Math.min(...bgList.map(bg=>_contrast(c,bg)));
  if(worst(hex)>=target) return {color:hex, t:0};
  let lo=0, hi=1;
  for(let i=0;i<25;i++){
    const mid=(lo+hi)/2;
    if(worst(_mix(hex,anchor,mid))>=target) hi=mid; else lo=mid;
  }
  return {color:_mix(hex,anchor,hi), t:hi};
}
/* Shift `hex` toward whichever of black/white needs the smaller nudge to hit `target` against bgList. */
function accessibleColor(hex, bgList, target){
  const toBlack=_shiftFor(hex,'#000000',bgList,target);
  const toWhite=_shiftFor(hex,'#ffffff',bgList,target);
  return (toBlack.t<=toWhite.t ? toBlack : toWhite).color;
}
/* A colored badge (background + text) guaranteed to hit `target` contrast between the two,
   staying as close to the original hue as possible — used for letter/pattern badges. */
function accessibleBadge(hex, target){
  const lighten=_shiftFor(hex,'#ffffff',['#000000'],target); // paired with black text
  const darken=_shiftFor(hex,'#000000',['#ffffff'],target);  // paired with white text
  return lighten.t<=darken.t ? {bg:lighten.color,text:'#000000'} : {bg:darken.color,text:'#ffffff'};
}

const AAA_TARGET = 7; // WCAG AAA, normal text

function applyTheme(){
  const root=document.documentElement;
  const themeKey=THEMES[S.settings.theme]?S.settings.theme:'dark';
  const base=THEMES[themeKey].vars;
  // base theme vars
  Object.entries(base).forEach(([k,v])=>root.style.setProperty(k,v));
  // custom theme overrides (bg/text only — surface/muted/accent aren't user-editable)
  const customVars=S.settings.vars||{};
  Object.entries(customVars).forEach(([k,v])=>{ if(v)root.style.setProperty(k,v); });

  const effBg=customVars['--bg']||base['--bg'];
  const effText=customVars['--text']||base['--text'];
  const effSurface=base['--surface'];
  const effSurface2=base['--surface-2'];
  const surfaces=[effBg, effSurface, effSurface2];

  // Secondary/"muted" text — shift toward the theme's own text color (not black/white)
  // just enough to clear AAA against every surface it sits on (bg, card, chip/button fills).
  root.style.setProperty('--muted', _shiftFor(base['--muted'], effText, surfaces, AAA_TARGET).color);

  // Accent used AS TEXT (callouts, badges, "on" states) needs its own AAA-safe variant —
  // the raw --accent stays untouched for borders/fills/progress bars, which only need the
  // much looser 3:1 non-text bar and should keep the theme's intended punchy color.
  root.style.setProperty('--accent-fg', accessibleColor(base['--accent'], surfaces, AAA_TARGET));
  // Icon/dot drawn ON TOP of a solid --accent fill (switch thumb, editor "on" tile).
  root.style.setProperty('--accent-on', bestTextOn(base['--accent']));
  // Solid accent badge (host-only tag) — was a low-opacity tint that vanished in several themes.
  const accentBadge=accessibleBadge(base['--accent'], AAA_TARGET);
  root.style.setProperty('--accent-badge-bg', accentBadge.bg);
  root.style.setProperty('--accent-badge-text', accentBadge.text);

  // "good"/"warn" text (winner names, danger buttons, find results). --good itself stays
  // fixed for the Call button gradient, which already pairs with a fixed dark label everywhere.
  root.style.setProperty('--good', '#3ddc84');
  // good-fg also has to survive the low-opacity green tints those "win" backgrounds actually
  // render as (log row / winrec / congrats banner / winner button) — checking the raw
  // surfaces alone under-shifts it since the tint pulls the effective bg toward green.
  const goodTints=[_mix(effBg,'#3ddc84',0.12), _mix(effSurface,'#3ddc84',0.07),
                    _mix(effSurface,'#3ddc84',0.13), _mix(effSurface2,'#3ddc84',0.12)];
  root.style.setProperty('--good-fg', accessibleColor('#3ddc84', [...surfaces, ...goodTints], AAA_TARGET));
  root.style.setProperty('--warn', accessibleColor('#ff6b6b', [effSurface, effSurface2], AAA_TARGET));

  // Per-letter badge: background + text chosen together so a called cell (and the column
  // header, which reuses the same pair) always hits AAA, regardless of how saturated or
  // pale the theme's letter color is. --col-L-fg is a separate AAA-safe text-only variant
  // for places that show the raw letter color as text on an existing surface (the current
  // ball, its big-screen mirror, the next-up preview, recent-call chips) rather than as a
  // matching badge — --col-L itself stays untouched for decorative uses (the ball's ring).
  LETTERS.forEach(L=>{
    const hex=S.settings.letters[L]||'#888888';
    root.style.setProperty('--col-'+L, hex);
    const badge=accessibleBadge(hex, AAA_TARGET);
    root.style.setProperty('--col-'+L+'-bg', badge.bg);
    root.style.setProperty('--col-'+L+'-text', badge.text);
    root.style.setProperty('--col-'+L+'-fg', accessibleColor(hex, surfaces, AAA_TARGET));
  });
  root.style.setProperty('--font-scale', (S.settings.fontScale/100));
  root.style.setProperty('--board-scale', S.settings.boardScale??0.75);
  $('#themeName');
}
function buildThemeRow(){
  const row=$('#themeRow'); row.innerHTML='';
  Object.entries(THEMES).forEach(([k,t])=>{
    const b=document.createElement('button'); b.className='theme-chip'; b.textContent=t.label;
    setToggle(b, S.settings.theme===k);
    b.onclick=()=>{ S.settings.theme=k; S.settings.letters={...t.letters}; S.settings.vars={}; save(); applyTheme(); buildThemeRow(); buildSwatches(); renderRecent(); paintBoard(); };
    row.appendChild(b);
  });
  (S.customThemes||[]).forEach((t,i)=>{
    const b=document.createElement('button'); b.className='theme-chip'; b.textContent='★ '+t.name;
    b.onclick=()=>{ Object.assign(S.settings.vars, t.vars); S.settings.letters={...t.letters}; save(); applyTheme(); renderRecent(); paintBoard(); };
    row.appendChild(b);
  });
}
function buildSwatches(){
  const row=$('#swatchRow'); row.innerHTML='';
  LETTERS.forEach(L=>{
    const wrap=document.createElement('label'); wrap.className='swatch'; wrap.style.color=`var(--col-${L}-fg)`;
    wrap.innerHTML=`${L}<input type="color" value="${rgbToHex(S.settings.letters[L])}">`;
    wrap.querySelector('input').addEventListener('input',e=>{
      S.settings.letters[L]=e.target.value; save(); applyTheme(); renderBall(false); renderRecent(); paintBoard();
    });
    row.appendChild(wrap);
  });
}
function rgbToHex(c){ if(!c)return '#ffffff'; c=c.trim(); if(c[0]==='#')return c; const m=c.match(/\d+/g); if(!m)return '#ffffff'; return '#'+m.slice(0,3).map(x=>(+x).toString(16).padStart(2,'0')).join(''); }

/* ==========================================================================
   DIALOG FOCUS MANAGEMENT (drawer / modal / big screen)
   Keeps keyboard focus trapped inside whichever overlay is open, and returns
   it to the element that opened the overlay on close — standard WAI-ARIA
   dialog behavior that screen reader and keyboard-only users depend on.
   ========================================================================== */
let _lastFocused=null;
function focusableIn(container){
  return Array.from(container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
    .filter(el=>!el.disabled && el.offsetParent!==null);
}
function trapTabKey(container, e){
  if(e.key!=='Tab') return;
  const list=focusableIn(container);
  if(!list.length) return;
  const first=list[0], last=list[list.length-1];
  if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
}
function openDialog(container){
  _lastFocused=document.activeElement;
  container.classList.add('show');
  const list=focusableIn(container);
  (list[0]||container).focus();
}
function closeDialog(container){
  container.classList.remove('show');
  if(_lastFocused && typeof _lastFocused.focus==='function') _lastFocused.focus();
  _lastFocused=null;
}

/* ==========================================================================
   MODAL / TOAST
   ========================================================================== */
let modalOk=null, modalCancelFn=null;
function confirmModal(title,text,onOk,opts){
  opts=opts||{};
  $('#modalTitle').textContent=title; $('#modalText').textContent=text;
  $('#modalExtra').innerHTML=opts.extra||'';
  $('#modalOk').textContent=opts.okText||'Confirm';
  $('#modalCancel').textContent=opts.cancelText||'Cancel';
  modalOk=onOk; modalCancelFn=opts.onCancel||null;
  openDialog($('#modal'));
  // Prefer the first input in the extra section, once it's rendered
  setTimeout(()=>{ const inp=$('#modalExtra input'); if(inp) inp.focus(); }, 60);
}
function closeModal(){ closeDialog($('#modal')); $('#modalExtra').innerHTML=''; modalOk=null; modalCancelFn=null; }
let toastT=null;
function toast(msg){ const t=$('#toast'); t.textContent=msg; t.classList.add('show'); clearTimeout(toastT); toastT=setTimeout(()=>t.classList.remove('show'),2600); }

/* ==========================================================================
   FULL RENDER + WIRING
   ========================================================================== */
function fullRender(){
  $('#intRange').value=S.settings.autoInterval||10;
  $('#intLabel').textContent=S.settings.autoInterval||10;
  renderBall(false); renderRecent(); renderPattern(); paintBoard(); renderLog();
  _nextBall=null; pickNextBall(); renderPreview();
}

function applyPatCollapsed(){
  const closed=!!S.settings.patCollapsed;
  $('#patBody').classList.toggle('closed', closed);
  $('#patHeader').classList.toggle('closed', closed);
}

/* Clamp a stored number back into its valid range — guards against a
   corrupted/hand-edited localStorage value producing an unusable layout. */
function clampNum(v,min,max,fallback){ v=+v; return Number.isFinite(v) ? Math.min(max,Math.max(min,v)) : fallback; }

function init(){
  ensureTimes();
  if(!S.settings.autoInterval) S.settings.autoInterval=10;
  if(S.settings.callouts===undefined) S.settings.callouts=true;
  if(S.settings.limitDraw===undefined) S.settings.limitDraw=true;
  if(S.settings.showPreview===undefined) S.settings.showPreview=true;
  if(S.settings.patCollapsed===undefined) S.settings.patCollapsed=false;
  if(!S.calloutIdx) S.calloutIdx={};
  if(S.settings.boardScale===undefined) S.settings.boardScale=0.75;
  if(S.settings.speakCalls===undefined) S.settings.speakCalls=false;
  if(S.settings.vibrate===undefined) S.settings.vibrate=true;
  S.settings.autoInterval=clampNum(S.settings.autoInterval,3,60,10);
  S.settings.fontScale=clampNum(S.settings.fontScale,80,180,100);
  S.settings.boardScale=clampNum(S.settings.boardScale,0.45,1.3,0.75);
  applyTheme();
  buildBoard();
  wireBoardClicks();
  buildPatternTiles();
  buildThemeRow(); buildSwatches();
  buildEditor();
  fullRender(); // fullRender now calls pickNextBall + renderPreview internally

  // settings reflect
  $('#fontRange').value=S.settings.fontScale; $('#fsLabel').textContent=S.settings.fontScale+'%';
  $('#boardScaleRange').value=Math.round(S.settings.boardScale*100); $('#boardScaleLabel').textContent=Math.round(S.settings.boardScale*100)+'%';
  $('#freeChk').checked=S.freeSpace;
  $('#limitChk').checked=S.settings.limitDraw;
  $('#previewChk').checked=S.settings.showPreview;
  $('#calloutChk').checked=S.settings.callouts;
  $('#speakChk').checked=S.settings.speakCalls;
  $('#vibrateChk').checked=S.settings.vibrate;
  $('#intRange').value=S.settings.autoInterval; $('#intLabel').textContent=S.settings.autoInterval;
  applyPatCollapsed();

  /* play-style collapse caret */
  const togglePat=()=>{ S.settings.patCollapsed=!S.settings.patCollapsed; save(); applyPatCollapsed(); };
  $('#patHeader').onclick=togglePat;
  $('#patHeader').addEventListener('keydown',e=>{ if(e.key==='Enter'||e.code==='Space'){ e.preventDefault(); togglePat(); } });

  $('#calloutChk').onchange=e=>{ S.settings.callouts=e.target.checked; save(); renderBall(false); };
  $('#cycleBtn').onclick=cycleCallout;
  $('#redrawBtn').onclick=()=>{ _nextBall=null; pickNextBall(); renderPreview(); };
  $('#reportBtn').onclick=generateNightReport;
  $('#limitChk').onchange=e=>{ S.settings.limitDraw=e.target.checked; save(); renderBall(false); paintBoard(); _nextBall=null; pickNextBall(); renderPreview(); };
  $('#previewChk').onchange=e=>{ S.settings.showPreview=e.target.checked; save(); renderPreview(); };
  $('#speakChk').onchange=e=>{ S.settings.speakCalls=e.target.checked; save(); if(!e.target.checked && 'speechSynthesis' in window) speechSynthesis.cancel(); };
  $('#vibrateChk').onchange=e=>{ S.settings.vibrate=e.target.checked; save(); };

  /* core buttons */
  $('#callBtn').onclick=callNext;
  $('#undoBtn').onclick=undo;
  $('#resetBtn').onclick=newGame;
  $('#autoBtn').onclick=toggleAuto;
  $('#markWinner').onclick=markWinner;
  $('#bsTap').onclick=callNext;
  $('#archiveBtn').onclick=archiveGame;

  $('#intRange').oninput=e=>{ S.settings.autoInterval=+e.target.value; $('#intLabel').textContent=e.target.value; save(); };

  /* save custom pattern */
  $('#saveCustom').onclick=()=>{
    const name=$('#customName').value.trim()||('Custom '+(S.customPatterns.length+1));
    if(!S.editorCells.length){ toast('Tap some cells first.'); return; }
    const id='c'+Date.now();
    S.customPatterns.push({id,name,cells:S.editorCells.slice()});
    S.editorCells=[]; $('#customName').value='';
    save(); selectPattern('custom:'+id); buildEditor();
    $('#customEditor').classList.add('hide');
    toast('Saved pattern: '+name);
  };

  $('#patDimBtn').onclick=()=>{ S.patternDim=!S.patternDim; save(); paintBoard(); };

  /* find */
  $('#findBtn').onclick=doFind;
  $('#findInput').addEventListener('keydown',e=>{ if(e.key==='Enter')doFind(); });

  /* export / save / load */
  $('#saveJsonBtn').onclick=saveJSON;
  $('#exportBtn').onclick=exportData;
  $('#loadJsonBtn').onclick=()=>$('#fileInput').click();
  $('#fileInput').onchange=e=>{ if(e.target.files[0])loadJSON(e.target.files[0]); e.target.value=''; };

  /* big screen */
  $('#bigBtn').onclick=()=>{ openDialog($('#bigscreen')); syncWakeLock(); };
  $('#bsExit').onclick=()=>{ closeDialog($('#bigscreen')); syncWakeLock(); };
  $('#bigscreen').addEventListener('keydown', e=>trapTabKey($('#bigscreen'), e));

  /* settings drawer */
  const openDrawer=()=>{ openDialog($('#drawer')); $('#scrim').classList.add('show'); };
  const closeDrawer=()=>{ closeDialog($('#drawer')); $('#scrim').classList.remove('show'); };
  $('#settingsBtn').onclick=openDrawer; $('#closeDrawer').onclick=closeDrawer; $('#scrim').onclick=closeDrawer;
  $('#drawer').addEventListener('keydown', e=>trapTabKey($('#drawer'), e));
  $('#modal').addEventListener('keydown', e=>trapTabKey($('#modal'), e));

  $('#clearHistoryBtn').onclick=()=>{
    confirmModal(
      '🗑 Clear all history?',
      'This erases every called ball, winner record, and archived game on this device — a true clean slate. Your settings, themes, and custom patterns are kept.',
      ()=>{
        S.called=[]; S.callTimes=[]; S.winners=[]; S.calloutIdx={};
        S.history=[];
        S.session={id:Date.now(), started:new Date().toISOString(), games:1};
        save(); fullRender();
        closeDrawer();
        toast('Clean slate — all history cleared.');
      },
      {okText:'Yes, clear everything', cancelText:'Cancel'}
    );
  };

  $('#fontRange').oninput=e=>{ S.settings.fontScale=+e.target.value; $('#fsLabel').textContent=e.target.value+'%'; save(); applyTheme(); };
  $('#boardScaleRange').oninput=e=>{ S.settings.boardScale=+e.target.value/100; $('#boardScaleLabel').textContent=e.target.value+'%'; save(); applyTheme(); };
  $('#freeChk').onchange=e=>{ S.freeSpace=e.target.checked; save(); renderPattern(); };

  $('#cBg').oninput=e=>{ S.settings.vars=S.settings.vars||{}; S.settings.vars['--bg']=e.target.value; save(); applyTheme(); };
  $('#cText').oninput=e=>{ S.settings.vars=S.settings.vars||{}; S.settings.vars['--text']=e.target.value; save(); applyTheme(); };
  $('#saveTheme').onclick=()=>{
    const name=$('#themeName').value.trim()||('Theme '+((S.customThemes||[]).length+1));
    S.customThemes=S.customThemes||[];
    S.customThemes.push({name, vars:{...(S.settings.vars||{})}, letters:{...S.settings.letters}});
    $('#themeName').value=''; save(); buildThemeRow(); toast('Saved theme: '+name);
  };

  /* modal — capture extra inputs BEFORE closeModal wipes #modalExtra */
  $('#modalOk').onclick=()=>{
    const captured={};
    $$('#modalExtra input,#modalExtra textarea,#modalExtra select').forEach(el=>{captured[el.id]=el.value;});
    const f=modalOk; closeModal(); if(f)f(captured);
  };
  $('#modalCancel').onclick=()=>{ const f=modalCancelFn; closeModal(); if(f)f(); };
  // Enter submits; Escape cancels
  $('#modal').addEventListener('keydown',e=>{
    if(e.key==='Enter'&&document.activeElement.tagName==='INPUT'){ e.preventDefault(); $('#modalOk').click(); }
    if(e.key==='Escape'){ e.preventDefault(); const f=modalCancelFn; closeModal(); if(f)f(); }
  });

  /* keyboard shortcuts */
  document.addEventListener('keydown',e=>{
    if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    const k=e.key.toLowerCase();
    if(e.code==='Space'){ e.preventDefault(); callNext(); }
    else if(k==='u'){ undo(); }
    else if(k==='a'){ toggleAuto(); }
    else if(k==='r'){ newGame(); }
    else if(k==='f'){ const bs=$('#bigscreen'); bs.classList.contains('show') ? closeDialog(bs) : openDialog(bs); syncWakeLock(); }
    else if(k==='escape'){ if($('#bigscreen').classList.contains('show')){ closeDialog($('#bigscreen')); syncWakeLock(); } closeDrawer(); closeModal(); }
  });

  registerPWA();
}

/* ==========================================================================
   PWA — inline manifest + best-effort service worker
   ========================================================================== */
/* ==========================================================================
   NIGHT REPORT — generates a self-contained printable/shareable HTML page
   ========================================================================== */
function generateNightReport(){
  // Collect all games: archived + current (if anything happened)
  const games = S.history.map((h,i)=>({...h, gameNum:i+1, isCurrent:false}));
  if(S.called.length || S.winners.length){
    games.push({
      gameNum: games.length+1, isCurrent:true,
      ended: new Date().toISOString(),
      calls: S.called.length, winners: S.winners.length,
      pattern: currentPatternDef().name,
      order: S.called.slice(),
      times: (S.callTimes||[]).slice(),
      winnerRecs: S.winners.slice(),
    });
  }
  if(!games.length){ toast('No games yet — call some balls first!'); return; }

  const nightDate = new Date(S.session.started).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  const lcol = {B:'#ff595e',I:'#ff924c',N:'#ffca3a',G:'#8ac926',O:'#52a6f0'};

  // Build the visual board for a game
  function boardHTML(calledSet){
    let h='<div class="r-board">';
    ['B','I','N','G','O'].forEach((L,c)=>{
      h+=`<div class="r-col"><div class="r-head" style="color:${lcol[L]};border-bottom:3px solid ${lcol[L]}">${L}</div>`;
      for(let r=0;r<15;r++){
        const n=c*15+r+1;
        const on=calledSet.has(n);
        h+=`<div class="r-cell${on?' r-called':''}" style="${on?`background:${lcol[L]}20;color:${lcol[L]};border:1px solid ${lcol[L]}40;font-weight:800`:''}">${n}</div>`;
      }
      h+='</div>';
    });
    return h+'</div>';
  }

  // Build a game section
  function gameSection(g){
    const calledSet=new Set(g.order||[]);
    const winnerRows=(g.winnerRecs||[]).map(w=>{
      const who=w.name?`<strong style="color:#22c55e">${esc(w.name)}</strong> — `:'';
      return `<div class="r-winner">🏆 ${who}${esc(w.pattern)} · call #${w.callCount} · ${fmtTime(w.ts)}</div>`;
    }).join('');
    const callRows=(g.order||[]).map((n,i)=>{
      const lt=letterFor(n);
      const t=g.times&&g.times[i]?fmtTime(g.times[i]):'';
      const wins=(g.winnerRecs||[]).filter(w=>w.callCount===i+1);
      const winTag=wins.map(w=>`<span class="r-win-tag">🏆${w.name?' '+esc(w.name):''}</span>`).join('');
      return `<tr><td>${i+1}</td><td style="color:${lcol[lt]||'inherit'};font-weight:800">${lt} ${n}</td><td>${t}</td><td>${winTag}</td></tr>`;
    }).join('');
    return `
    <section class="r-game">
      <div class="r-game-head">
        <h2>Game ${g.gameNum}${g.isCurrent?' <span class="r-live">in progress</span>':''}</h2>
        <span class="r-game-meta">${esc(g.pattern)} · ${g.calls} ball${g.calls!==1?'s':''} · ended ${fmtTime(g.ended)}</span>
      </div>
      ${winnerRows||'<p class="r-nowin">No winners recorded for this round.</p>'}
      ${boardHTML(calledSet)}
      <details>
        <summary>Full call log (${g.calls} balls)</summary>
        <table class="r-log">
          <thead><tr><th>#</th><th>Ball</th><th>Time</th><th></th></tr></thead>
          <tbody>${callRows||'<tr><td colspan="4" style="color:#888">No calls yet</td></tr>'}</tbody>
        </table>
      </details>
    </section>`;
  }

  // Collect all winner names across the night
  const allWinners=[...S.history,...(S.called.length||S.winners.length?[{winnerRecs:S.winners}]:[])]
    .flatMap(g=>(g.winnerRecs||[]).filter(w=>w.name).map(w=>esc(w.name)));
  const nightBanner = allWinners.length
    ? `<div class="r-banner">🎉 Tonight's winners: <strong>${[...new Set(allWinners)].join(', ')}</strong></div>` : '';

  const html=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bingo Night Report — ${nightDate}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#f5f7fb;color:#1a2332;font-size:15px;line-height:1.5;padding:0 0 40px}
.r-wrap{max-width:900px;margin:0 auto;padding:24px 20px}
.r-header{text-align:center;padding:28px 0 22px;border-bottom:2px solid #e2e8f0;margin-bottom:28px}
.r-header h1{font-size:2rem;font-weight:900;letter-spacing:-.02em;color:#0f172a}
.r-header .r-date{color:#64748b;font-size:1rem;margin-top:4px}
.r-header .r-sessions{margin-top:10px;font-size:.85rem;color:#94a3b8;font-weight:600}
.r-banner{background:#dcfce7;border:1px solid #86efac;border-radius:10px;padding:12px 16px;font-size:1rem;margin-bottom:24px;color:#15803d}
.r-game{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin-bottom:22px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.r-game-head{display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.r-game-head h2{font-size:1.15rem;font-weight:900;color:#0f172a}
.r-live{font-size:.75rem;background:#fef3c7;color:#d97706;border-radius:5px;padding:2px 6px;font-weight:700}
.r-game-meta{font-size:.82rem;color:#64748b;font-weight:600}
.r-winner{background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:9px 12px;margin-bottom:8px;font-size:.92rem}
.r-nowin{color:#94a3b8;font-size:.88rem;font-style:italic;margin-bottom:10px}
.r-win-tag{background:#fef3c7;color:#92400e;border-radius:4px;padding:1px 5px;font-size:.75rem;font-weight:700;margin-left:4px}
/* board */
.r-board{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:14px 0}
.r-col{display:flex;flex-direction:column;gap:3px}
.r-head{text-align:center;font-weight:900;font-size:1rem;padding:5px 0;border-radius:6px 6px 0 0;background:#f8fafc}
.r-cell{text-align:center;font-size:.78rem;padding:4px 2px;border-radius:5px;border:1px solid #e2e8f0;background:#f8fafc;color:#94a3b8;font-variant-numeric:tabular-nums}
.r-called{font-weight:900}
/* call log */
details{margin-top:14px}
summary{cursor:pointer;font-size:.85rem;font-weight:700;color:#64748b;padding:4px 0;user-select:none}
.r-log{width:100%;border-collapse:collapse;font-size:.83rem;margin-top:8px}
.r-log th{background:#f1f5f9;padding:6px 8px;text-align:left;font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:#64748b}
.r-log td{padding:5px 8px;border-top:1px solid #f1f5f9;font-variant-numeric:tabular-nums;color:#475569}
.r-log tr:nth-child(even) td{background:#fafafa}
/* print toolbar */
.r-toolbar{position:sticky;top:0;z-index:10;background:rgba(245,247,251,.94);backdrop-filter:blur(8px);border-bottom:1px solid #e2e8f0;padding:10px 20px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.r-toolbar button{border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:7px 14px;font-size:.88rem;font-weight:700;cursor:pointer;color:#0f172a}
.r-toolbar button:hover{background:#f1f5f9}
.r-toolbar button.primary{background:#0f172a;color:#fff;border-color:#0f172a}
.r-meta-bar{text-align:center;color:#94a3b8;font-size:.78rem;margin-top:28px;padding-top:16px;border-top:1px solid #e2e8f0}
@media print{
  .r-toolbar{display:none!important}
  body{background:#fff;padding:0}
  .r-game{break-inside:avoid;box-shadow:none;border:1px solid #ddd}
  details{display:block}
  details summary{display:none}
  .r-log{display:table}
}
</style>
</head>
<body>
<div class="r-toolbar">
  <button class="primary" onclick="window.print()">🖨 Print</button>
  <button onclick="dlReport()">⬇ Download HTML</button>
  <span style="flex:1;font-size:.82rem;color:#64748b">${nightDate} · ${games.length} game(s)</span>
  <button onclick="window.close()">✕ Close</button>
</div>
<div class="r-wrap">
  <div class="r-header">
    <h1>🎱 Bingo Night Report</h1>
    <div class="r-date">${nightDate}</div>
    <div class="r-sessions">${games.length} game(s) · ${games.reduce((a,g)=>a+g.calls,0)} total balls called · Generated ${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
  </div>
  ${nightBanner}
  ${games.map(gameSection).join('\n')}
  <div class="r-meta-bar">Generated by Bingo Caller v2.21 &nbsp;·&nbsp; ${new Date().toLocaleString()}</div>
</div>
<script>
function dlReport(){
  const a=document.createElement('a');
  a.href='data:text/html;charset=utf-8,'+encodeURIComponent('<!DOCTYPE html>'+document.documentElement.outerHTML);
  a.download='bingo-night-${stamp()}.html';
  a.click();
}
<\/script>
</body>
</html>`;

  try{
    const w=window.open('','_blank','width=960,height=820');
    if(!w){ toast('Pop-up blocked — allow pop-ups and try again.'); return; }
    w.document.write(html);
    w.document.close();
  }catch(e){ toast('Could not open report: '+e.message); }
}

/* iOS ignores manifest.json icons for "Add to Home Screen" — it only reads a
   real <link rel="apple-touch-icon"> image, and is picky about SVG there.
   Draw the same logo to a canvas and hand iOS an actual PNG, generated at
   runtime so the repo doesn't need a binary icon asset. */
function addAppleTouchIcon(){
  try{
    const size=180;
    const canvas=document.createElement('canvas');
    canvas.width=size; canvas.height=size;
    const ctx=canvas.getContext('2d');
    const grad=ctx.createRadialGradient(size*.34,size*.30,4,size*.5,size*.5,size*.5);
    grad.addColorStop(0,'#ffffff'); grad.addColorStop(.15,'#52a6f0'); grad.addColorStop(1,'#ff595e');
    ctx.fillStyle=grad;
    ctx.beginPath(); ctx.arc(size/2,size/2,size/2-4,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#15171c';
    ctx.font='900 '+Math.round(size*.42)+'px Arial, sans-serif';
    ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText('B', size/2, size/2+size*.05);
    const link=document.createElement('link');
    link.rel='apple-touch-icon'; link.href=canvas.toDataURL('image/png');
    document.head.appendChild(link);
  }catch(e){}
}

function registerPWA(){
  addAppleTouchIcon();
  // manifest.json is a real static file (see <link rel="manifest"> in <head>) so
  // Chrome/Android can evaluate install criteria reliably across reloads.
  // Service worker gives real offline support — cache the app shell on first
  // load so the console keeps working with no signal after that.
  if('serviceWorker' in navigator && (location.protocol==='https:' || location.hostname==='localhost')){
    navigator.serviceWorker.register('sw.js').catch(()=>{/* no sw.js reachable — app still works online */});
  }
  wireInstallPrompt();
}

/* Chrome/Edge/Android fire beforeinstallprompt instead of showing their own
   install UI reliably — capture it and expose our own "Install" button so
   hosts notice they can put this on a home screen before they lose signal. */
let _deferredInstallPrompt=null;
function wireInstallPrompt(){
  const btn=$('#installBtn');
  const isStandalone=()=>window.matchMedia('(display-mode: standalone)').matches || navigator.standalone===true;
  if(isStandalone()) return;
  addEventListener('beforeinstallprompt', e=>{
    e.preventDefault();
    _deferredInstallPrompt=e;
    btn.classList.remove('hide');
  });
  btn.onclick=async ()=>{
    if(!_deferredInstallPrompt) return;
    btn.classList.add('hide');
    _deferredInstallPrompt.prompt();
    await _deferredInstallPrompt.userChoice.catch(()=>{});
    _deferredInstallPrompt=null;
  };
  addEventListener('appinstalled', ()=>btn.classList.add('hide'));
}

/* ---------- Screen Wake Lock ----------
   Keeps the display on while auto-call or big-screen mode is running, so a
   phone/tablet acting as the caller or the venue display doesn't sleep
   mid-game. Best-effort: silently no-ops on browsers without the API. */
let _wakeLock=null;
async function requestWakeLock(){
  try{
    if('wakeLock' in navigator) _wakeLock=await navigator.wakeLock.request('screen');
  }catch(e){ _wakeLock=null; }
}
function releaseWakeLock(){
  if(_wakeLock){ _wakeLock.release().catch(()=>{}); _wakeLock=null; }
}
function wakeLockWanted(){ return autoOn || $('#bigscreen').classList.contains('show'); }
function syncWakeLock(){ if(wakeLockWanted()) requestWakeLock(); else releaseWakeLock(); }
document.addEventListener('visibilitychange', ()=>{
  if(document.visibilityState==='visible' && wakeLockWanted()) requestWakeLock();
});

/* ---------- Speak calls aloud (SpeechSynthesis) ---------- */
function speakCall(letter,num,calloutText){
  if(!S.settings.speakCalls || !('speechSynthesis' in window)) return;
  try{
    speechSynthesis.cancel(); // don't let calls queue up during fast auto-play
    const text=calloutText ? `${letter} ${num}. ${calloutText}` : `${letter} ${num}`;
    speechSynthesis.speak(new SpeechSynthesisUtterance(text));
  }catch(e){}
}

document.addEventListener('DOMContentLoaded',init);
