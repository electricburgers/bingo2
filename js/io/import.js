"use strict";
/* JSON import + validation */
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
function sanitizeStrings(arr,len,fallback){
  if(!Array.isArray(arr)) return [];
  return arr.slice(0,len).map(s=>typeof s==='string' ? s.slice(0,120) : fallback);
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
      patterns: sanitizeStrings(h.patterns, h.order.length, typeof h.pattern==='string' ? h.pattern : 'Unknown'),
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
        S.callPatterns=sanitizeStrings(cur.callPatterns, S.called.length, currentPatternDef().name);
        S.winners=sanitizeWinners(cur.winners);
        if(data.games){ S.history=sanitizeHistory(data.games); }
        save(); fullRender(); toast('Session loaded.');
      });
    }catch(e){ toast('Could not read that file.'); }
  };
  reader.readAsText(file);
}
