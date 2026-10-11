"use strict";
/* Game actions */
function ensureTimes(){ if(!S.callTimes) S.callTimes=[]; if(!S.callPatterns) S.callPatterns=[]; }

/* Shared post-mutation refresh for callNext()/undo() — both change S.called
   and need the same set of views refreshed. */
function renderAfterCallChange(pop){
  renderBall(pop); renderRecent(); paintBoard(); renderLog();
}

function callNext(){
  const elig=eligibleBalls();
  if(!elig.length){
    toast(S.called.length>=TOTAL ? 'Every ball has been called.' : 'No balls left for this pattern.');
    stopAuto(); return;
  }
  ensureTimes();
  const n = elig[Math.floor(Math.random()*elig.length)];
  S.called.push(n);
  S.callTimes.push(new Date().toISOString());
  S.callPatterns.push(currentPatternDef().name);
  save();
  renderAfterCallChange(true);
  if(S.settings.vibrate && navigator.vibrate) navigator.vibrate(40);
  if(!eligibleBalls().length){ toast('Last ball in play for this pattern.'); stopAuto(); }
}

function undo(){
  if(!S.called.length){ toast('Nothing to undo.'); return; }
  ensureTimes();
  S.called.pop(); S.callTimes.pop(); S.callPatterns.pop();
  save();
  renderAfterCallChange(false);
}

function newGame(){
  confirmModal('New game?','Clears all called balls and the current call log. Winners and history are kept. Tip: “Archive game” first to save this round to the night log.',()=>{
    S.called=[]; S.callTimes=[]; S.callPatterns=[];
    save(); fullRender(); toast('New game ready.');
  });
}

function markWinner(){
  if(!S.called.length){ toast('Call some balls first.'); return; }
  const p=currentPatternDef();
  confirmModal(
    '🏆 Mark winner!',
    'Pattern: '+p.name+' · call #'+S.called.length,
    (captured)=>{
      const name=((captured&&captured.modalNameInput)||'').trim();
      S.winners.push({
        name, pattern:p.name, ts:new Date().toISOString(),
        callCount:S.called.length, lastBall:S.called[S.called.length-1]
      });
      save(); renderLog();
      toast('🏆 '+(name?name+' wins!':'Winner recorded!')+' — '+p.name);
    },
    {okText:'Record winner', cancelText:'Cancel',
     extra:'<label class="fld" style="font-size:.85rem;font-weight:700">Winner\'s name (optional)<input type="text" id="modalNameInput" placeholder="e.g. Table 4, or María" autocomplete="off" style="margin-top:6px"></label>'}
  );
}

function archiveGame(){
  if(!S.called.length && !S.winners.length){ toast('Nothing to archive yet.'); return; }
  S.history.push({
    ended:new Date().toISOString(),
    calls:S.called.length,
    winners:S.winners.length,
    pattern:currentPatternDef().name,
    order:S.called.slice(),
    times:(S.callTimes||[]).slice(),
    patterns:(S.callPatterns||[]).slice(),
    winnerRecs:S.winners.slice(),
  });
  S.session.games++;
  S.called=[]; S.callTimes=[]; S.callPatterns=[]; S.winners=[];
  save(); fullRender(); toast('Game archived. Fresh board ready.');
}
