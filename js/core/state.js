"use strict";
/* App state + persistence */
/* ---------- Default state ---------- */
function defaultState(){
  return {
    pattern:'any_line',
    freeSpace:true,
    patternDim:true,
    called:[],
    callTimes:[],
    callPatterns:[], // play-style name active at the moment each ball was called
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
  invalidateEligible(); // every state mutation saves, so this keeps the eligible-ball memo honest
  invalidatePatternCache();
  // Debounce rapid successive writes (e.g. multiple state changes in one tick)
  // into a single localStorage write to reduce main-thread/JSON-stringify overhead.
  if(_saveTimer) clearTimeout(_saveTimer);
  _saveTimer=setTimeout(flushSave, 120);
}
addEventListener('visibilitychange', ()=>{ if(document.visibilityState==='hidden') flushSave(); });
addEventListener('pagehide', flushSave);
