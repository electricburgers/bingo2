"use strict";
/* Export / save */
function buildSessionObject(whole){
  const cur={
    pattern:currentPatternDef().name,
    calledOrder:S.called.slice(),
    callTimes:(S.callTimes||[]).slice(),
    callPatterns:(S.callPatterns||[]).slice(),
    winners:S.winners.slice(),
  };
  if(!whole) return {kind:'bingo-session', exported:new Date().toISOString(), session:S.session, current:cur};
  return {kind:'bingo-night', exported:new Date().toISOString(), session:S.session, games:S.history.slice(), current:cur};
}
function download(name, text, type){
  const blob=new Blob([text],{type:type||'text/plain'});
  const a=document.createElement('a');
  a.href=URL.createObjectURL(blob); a.download=name; a.click();
  setTimeout(()=>URL.revokeObjectURL(a.href),1500);
}
function saveJSON(){
  confirmModal('Save backup','Save the current game only, or the whole night (all archived games + current)?',
    ()=>{ download(`bingo-night-${stamp()}.json`, JSON.stringify(buildSessionObject(true),null,2),'application/json'); },
    {okText:'Whole night', cancelText:'Current game', onCancel:()=>{
      download(`bingo-game-${stamp()}.json`, JSON.stringify(buildSessionObject(false),null,2),'application/json');
    }});
}
function exportData(){
  confirmModal('Export log','Choose a format for the call log + winners.',
    ()=>{ download(`bingo-log-${stamp()}.csv`, toCSV(),'text/csv'); },
    {okText:'CSV', cancelText:'Plain text', onCancel:()=>{ download(`bingo-log-${stamp()}.txt`, toTXT(),'text/plain'); }});
}
function toCSV(){
  const patName=currentPatternDef().name;
  const out=['call_number,letter,ball,time,play_style'];
  S.called.forEach((n,i)=>{
    const style=(S.callPatterns&&S.callPatterns[i])||patName;
    out.push(`${i+1},${letterFor(n)},${n},${S.callTimes&&S.callTimes[i]?fmtTime(S.callTimes[i]):''},"${style}"`);
  });
  out.push('','winner_pattern,call_count,last_ball,time');
  S.winners.forEach(w=>{ out.push(`"${w.pattern}",${w.callCount},${w.lastBall},${fmtTime(w.ts)}`); });
  return out.join('\n')+'\n';
}
function toTXT(){
  const patName=currentPatternDef().name;
  const out=[`BINGO SESSION LOG\nExported ${new Date().toLocaleString()}\nPattern: ${patName}\n\nCALLS (${S.called.length}):`];
  S.called.forEach((n,i)=>{
    const style=(S.callPatterns&&S.callPatterns[i])||patName;
    out.push(`  ${String(i+1).padStart(2)}. ${letterFor(n)} ${n}   ${S.callTimes&&S.callTimes[i]?fmtTime(S.callTimes[i]):''}   [${style}]`);
  });
  out.push('',`WINNERS (${S.winners.length}):`);
  if(!S.winners.length)out.push('  (none)');
  S.winners.forEach(w=>{ out.push(`  🏆 ${w.pattern} — call #${w.callCount} (${letterFor(w.lastBall)} ${w.lastBall}) at ${fmtTime(w.ts)}`); });
  return out.join('\n')+'\n';
}
