"use strict";
/* Pattern selector + mini diagrams */
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
  // Re-flag the existing tiles instead of rebuilding ~25 of them (each 25 <i> cells);
  // only a brand-new custom pattern needs a rebuild.
  const tiles=$$('#patTiles .ptile[data-key]');
  if(tiles.some(t=>t.dataset.key===key)) tiles.forEach(t=>setToggle(t, t.dataset.key===key));
  else buildPatternTiles();
  renderPattern(); renderBall(false);
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
  if($('#patternview').classList.contains('show')) renderPatternView();
}
