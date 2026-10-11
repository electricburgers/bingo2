"use strict";
/* Screen wake lock */
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
