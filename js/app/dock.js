"use strict";
/* Mobile bottom dock: Undo · Pattern · CALL · Auto · Winner.
   The center slot is the only primary button; Winner sits in the far corner so it isn't hit by
   accident (it also opens a confirm dialog). Shown by CSS only below the two-column breakpoint. */
const DOCK_ACTIONS = [
  {key:'undo',    id:'dockUndo',    icon:'↩',  label:'Undo',    aria:'Undo last call',        fn:'undo'},
  {key:'pattern', id:'dockPattern', icon:'▦',  label:'Pattern', aria:'Show play style full screen', fn:'togglePatternView'},
  {key:'call',    id:'dockCall',    icon:'🎱', label:'Call',    aria:'Call next ball',        fn:'callNext', primary:true},
  {key:'auto',    id:'dockAuto',    icon:'▶',  label:'Auto',    aria:'Auto call',             fn:'toggleAuto'},
  {key:'winner',  id:'dockWinner',  icon:'🏆', label:'Winner',  aria:'Declare a winner',      fn:'markWinner'},
];

/* What the Auto button should show, from the auto-call state. */
function dockAutoState(){
  if(!autoOn)    return {icon:'▶',  label:'Auto',   pressed:false};
  if(autoPaused) return {icon:'▶',  label:'Resume', pressed:false};
  return               {icon:'⏸', label:'Pause',  pressed:true};
}

function syncDock(){
  const btn=$('#dockAuto'); if(!btn) return;
  const st=dockAutoState();
  btn.querySelector('.d-icon').textContent=st.icon;
  btn.querySelector('.d-label').textContent=st.label;
  setToggle(btn, st.pressed);
}

function wireDock(){
  DOCK_ACTIONS.forEach(a=>{ $('#'+a.id).onclick=()=>window[a.fn](); });
  syncDock();
}
