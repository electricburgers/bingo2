"use strict";
/* Current pattern lookups.
   Both results are memoized: they're read on every render and inside per-row loops, and only
   change when S.pattern / S.customPatterns do — which always goes through save(). */
let _defCache=null, _colsCache=undefined;
function invalidatePatternCache(){ _defCache=null; _colsCache=undefined; }

/* which B/I/N/G/O columns need balls for the current pattern (null = all/any) */
function involvedColumns(){
  if(_colsCache!==undefined) return _colsCache;
  const p=currentPatternDef();
  if(!p || p.meta) return (_colsCache=null);   // any/row/col patterns span all columns
  // With the free space on, the center square needs no ball — so a pattern that touches the N column
  // only at the center (diagonals, X, ...) never needs an N ball.
  const needed=patternCells(p).filter(([r,c])=>!(S.freeSpace && CENTER(r,c)));
  const cols=new Set(needed.map(([,c])=>c));
  return (_colsCache = (cols.size>=5 || !cols.size) ? null : cols);
}

function currentPatternDef(){
  if(_defCache) return _defCache;
  if(S.pattern.startsWith('custom:')){
    const id=S.pattern.slice(7);
    const cp=S.customPatterns.find(p=>p.id===id);
    return (_defCache = cp ? {name:cp.name, cells:cp.cells.map(x=>x.slice()), cap:'Custom pattern.'} : PATTERNS.any_line);
  }
  return (_defCache = PATTERNS[S.pattern]||PATTERNS.any_line);
}
function patternCells(p){
  if(p.cells) return p.cells;
  if(p.meta==='col') return p.example;
  if(p.meta==='row') return p.example;
  if(p.meta==='any') return ALL25; // representative
  return [];
}
