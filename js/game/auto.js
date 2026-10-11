"use strict";
/* Auto-call timer */
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
