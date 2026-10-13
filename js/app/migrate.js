"use strict";
/* Fill in defaults / clamp values on state loaded from older or hand-edited storage. */
function normalizeState(){
  ensureTimes();
  if(!S.settings.autoInterval) S.settings.autoInterval=10;
  if(S.settings.callouts===undefined) S.settings.callouts=true;
  if(S.settings.limitDraw===undefined) S.settings.limitDraw=true;
  if(S.settings.patCollapsed===undefined) S.settings.patCollapsed=false;
  delete S.settings.recentStyle; // removed in 2.36 (chips are badge-only)
  if(!S.calloutIdx) S.calloutIdx={};
  if(S.settings.boardScale===undefined) S.settings.boardScale=0.75;
  if(S.settings.speakCalls===undefined) S.settings.speakCalls=false;
  if(S.settings.vibrate===undefined) S.settings.vibrate=true;
  S.settings.autoInterval=clampNum(S.settings.autoInterval,3,60,10);
  S.settings.fontScale=clampNum(S.settings.fontScale,80,180,100);
  S.settings.boardScale=clampNum(S.settings.boardScale,0.45,1.3,0.75);
}
