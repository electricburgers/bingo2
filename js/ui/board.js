"use strict";
/* Main board + find */
/* Cached once in buildBoard() and reused by paintBoard()/flashFind() so every
   render doesn't re-run a 75-node querySelectorAll. */
let boardCells=[];
function buildBoard(){
  const board=$('#board'); board.innerHTML=''; boardCells=[]; _cellShown=[]; _boardCols=[]; _foundCell=null;
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
      cell.style.setProperty('--lc-text',`var(--col-${LETTERS[c]}-text)`);
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

/* Diff-based repaint: remember what each cell last showed and only touch the DOM for cells
   that actually changed (usually 1–2 per call, instead of 75 cells × 4 DOM writes). */
let _cellShown=[], _boardCols=[], _foundCell=null;
function paintBoard(){
  const calledSet=new Set(S.called);
  const last=S.called[S.called.length-1];
  if(_cellShown.length!==boardCells.length) _cellShown=new Array(boardCells.length).fill(0);
  for(let i=0;i<boardCells.length;i++){
    const n=i+1;
    const isCalled=calledSet.has(n);
    const state=(isCalled?1:0)|(n===last?2:0);
    if(state===_cellShown[i]) continue;
    const cell=boardCells[i];
    if((state&1)!==(_cellShown[i]&1)){
      cell.classList.toggle('called', isCalled);
      cell.setAttribute('aria-pressed', isCalled?'true':'false');
      cell.setAttribute('aria-label', `${letterFor(n)} ${n}${isCalled?', called':''}`);
    }
    if((state&2)!==(_cellShown[i]&2)) cell.classList.toggle('current', n===last);
    _cellShown[i]=state;
  }
  // dim columns the current pattern can't use
  const cols=involvedColumns();
  if(!_boardCols.length) _boardCols=$$('#board .bcol');
  _boardCols.forEach((col,c)=>col.classList.toggle('dim', !!(S.patternDim && cols && !cols.has(c))));
  $('#boardCount').textContent=`${S.called.length} / ${TOTAL}`;
  setToggle($('#patDimBtn'), S.patternDim);
}

/* ---------- find / search ---------- */
function flashFind(n){
  if(_foundCell) _foundCell.classList.remove('found');
  const cell=boardCells[n-1]; if(cell)cell.classList.add('found');
  _foundCell=cell||null;
  const idx=S.called.indexOf(n);
  if(idx>=0){ ensureTimes(); $('#findNote').innerHTML=`<b style="color:var(--good-fg)">${letterFor(n)} ${n}</b> — call #${idx+1}${S.callTimes&&S.callTimes[idx]?' at '+fmtTime(S.callTimes[idx]):''}`; }
  else $('#findNote').innerHTML=`<b style="color:var(--warn)">${n}</b> — not called yet`;
  if(cell) cell.scrollIntoView({block:'nearest',behavior:'smooth'});
}
