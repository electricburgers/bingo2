"use strict";
/* Audit log */
function renderLog(){
  const body=$('#logBody');
  // Build a map of callCount → winner records for that call index
  const winAtCall={};
  S.winners.forEach(w=>{ (winAtCall[w.callCount]=winAtCall[w.callCount]||[]).push(w); });

  // Interleave winner rows into the call log (newest first)
  const rows=[];
  const patName=currentPatternDef().name; // hoisted: was re-resolved for every row
  S.called.forEach((n,i)=>{
    const callNum=i+1;
    const lt=letterFor(n);
    // Older saved sessions won't have a recorded play style for every call \u2014
    // fall back to the currently-selected pattern rather than a blank cell.
    const style=(S.callPatterns&&S.callPatterns[i])||patName;
    rows.push(`<tr><td>${callNum}</td><td><b style="color:${lt?`var(--col-${lt}-fg)`:'inherit'}">${lt}\u00a0${n}</b></td><td class="mono">${S.callTimes?fmtTime(S.callTimes[i]):''}</td><td>${esc(style)}</td></tr>`);
    // Insert winner row(s) AFTER the ball that triggered the win
    if(winAtCall[callNum]){
      winAtCall[callNum].forEach(w=>{
        const label=w.name ? `<b class="winner-name">${esc(w.name)}</b> · ${esc(w.pattern)}` : `<b>${esc(w.pattern)}</b>`;
        rows.push(`<tr class="win"><td>🏆</td><td colspan="3">${label} · <span class="mono">${fmtTime(w.ts)}</span></td></tr>`);
      });
    }
  });
  body.innerHTML=rows.reverse().join('')||'<tr><td colspan="4" class="muted" style="padding:14px">No balls called yet.</td></tr>';

  $('#sCalled').textContent=S.called.length;
  $('#sLeft').textContent=TOTAL - S.called.length;
  $('#sWins').textContent=S.winners.length;
  $('#sGames').textContent=S.session.games;

  // Winners panel — always same format: name (if any) · pattern · call # · time
  const allNames=S.winners.filter(w=>w.name).map(w=>esc(w.name));
  const banner=allNames.length
    ? `<div class="congrats-banner">🎉 Tonight's winners: <b>${allNames.join(', ')}</b></div>` : '';
  $('#winList').innerHTML=banner+S.winners.map(w=>{
    const who=w.name?`<b class="winner-name">${esc(w.name)}</b> · `:''
    return `<div class="winrec">🏆 ${who}${esc(w.pattern)} · call #${w.callCount} · <span class="mono">${fmtTime(w.ts)}</span></div>`;
  }).join('');

  // history
  $('#historyList').innerHTML = S.history.length
    ? S.history.map((h,i)=>{
        const names=h.winnerRecs?h.winnerRecs.filter(w=>w.name).map(w=>esc(w.name)):[];
        return `Game ${i+1}: ${h.calls} calls · ${h.winners} winner(s)${names.length?' ('+names.join(', ')+')':''} · ${fmtTime(h.ended)}`;
      }).join('<br>')
    : '<span class="muted">No archived games this session.</span>';
}
