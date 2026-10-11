"use strict";
/* Ball helpers */
function letterFor(n){ return LETTERS[Math.floor((n-1)/15)]; }
function colOf(n){ return Math.floor((n-1)/15); }

/* Columns the draw is restricted to, given the pattern AND the limit setting.
   Returns a Set of column indices, or null for "no restriction (all columns)". */
function activeColumns(){
  if(!S.settings.limitDraw) return null;
  return involvedColumns();
}
/* The balls that may still be drawn right now: uncalled, and (if limiting) in an active column.
   Memoized — renderBall, callNext and the auto-caller each ask several times per call. Every state
   mutation goes through save(), which marks the memo dirty (see invalidateEligible). */
let _eligDirty=true, _eligCache=[];
function eligibleBalls(){
  if(!_eligDirty) return _eligCache;
  const cols=activeColumns();
  const called=new Set(S.called);
  const out=[];
  for(let n=1;n<=TOTAL;n++){
    if(called.has(n)) continue;
    if(cols && !cols.has(colOf(n))) continue;
    out.push(n);
  }
  _eligCache=out; _eligDirty=false;
  return out;
}
function invalidateEligible(){ _eligDirty=true; }
