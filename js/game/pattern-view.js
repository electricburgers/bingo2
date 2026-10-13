"use strict";
/* View model for the full-screen pattern display: everything the screen shows, as plain data.
   Kept separate from the DOM code (ui/pattern-view.js) so it can be unit-tested. */
function patternViewModel(){
  const p=currentPatternDef();
  const example=!!p.meta;                       // any line / one row / one column: a sample is drawn
  const inPattern=new Set(miniCellsFor(p).map(([r,c])=>r+'_'+c));
  let needed=0, freeUsed=false;
  const grid=[], colsUsed=new Set();
  for(let r=0;r<5;r++){
    const row=[];
    for(let c=0;c<5;c++){
      const on=inPattern.has(r+'_'+c);
      const free=S.freeSpace && CENTER(r,c);
      const kind = free ? 'free' : on ? 'on' : 'off';
      if(kind==='on'){ needed++; colsUsed.add(c); }
      if(free && on) freeUsed=true;
      row.push({kind, inPattern:on});
    }
    grid.push(row);
  }
  const columns=LETTERS.filter((_,c)=>colsUsed.has(c));
  let summary;
  if(example) summary='Just one of these — any one will do. A sample is shown.';
  else summary='Fill '+needed+' square'+(needed===1?'':'s')+(freeUsed?' — the center is free.':'.');
  return {name:p.name, cap:p.cap||'', letters:LETTERS.slice(), grid, example,
          needed: example ? null : needed, freeUsed, columns, summary};
}
