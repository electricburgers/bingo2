"use strict";
/* Night report */
function generateNightReport(){
  // Collect all games: archived + current (if anything happened)
  const games = S.history.map((h,i)=>({...h, gameNum:i+1, isCurrent:false}));
  if(S.called.length || S.winners.length){
    games.push({
      gameNum: games.length+1, isCurrent:true,
      ended: new Date().toISOString(),
      calls: S.called.length, winners: S.winners.length,
      pattern: currentPatternDef().name,
      order: S.called.slice(),
      times: (S.callTimes||[]).slice(),
      winnerRecs: S.winners.slice(),
    });
  }
  if(!games.length){ toast('No games yet — call some balls first!'); return; }

  const nightDate = new Date(S.session.started).toLocaleDateString('en-US',{weekday:'long',year:'numeric',month:'long',day:'numeric'});
  const lcol = {B:'#ff595e',I:'#ff924c',N:'#ffca3a',G:'#8ac926',O:'#52a6f0'};

  // Build the visual board for a game
  function boardHTML(calledSet){
    let h='<div class="r-board">';
    ['B','I','N','G','O'].forEach((L,c)=>{
      h+=`<div class="r-col"><div class="r-head" style="color:${lcol[L]};border-bottom:3px solid ${lcol[L]}">${L}</div>`;
      for(let r=0;r<15;r++){
        const n=c*15+r+1;
        const on=calledSet.has(n);
        h+=`<div class="r-cell${on?' r-called':''}" style="${on?`background:${lcol[L]}20;color:${lcol[L]};border:1px solid ${lcol[L]}40;font-weight:800`:''}">${n}</div>`;
      }
      h+='</div>';
    });
    return h+'</div>';
  }

  // Build a game section
  function gameSection(g){
    const calledSet=new Set(g.order||[]);
    const winnerRows=(g.winnerRecs||[]).map(w=>{
      const who=w.name?`<strong style="color:#22c55e">${esc(w.name)}</strong> — `:'';
      return `<div class="r-winner">🏆 ${who}${esc(w.pattern)} · call #${w.callCount} · ${fmtTime(w.ts)}</div>`;
    }).join('');
    // index winners by call number once: O(calls + winners) instead of O(calls × winners)
    const winsByCall=new Map();
    (g.winnerRecs||[]).forEach(w=>{ (winsByCall.get(w.callCount)||winsByCall.set(w.callCount,[]).get(w.callCount)).push(w); });
    const callRows=(g.order||[]).map((n,i)=>{
      const lt=letterFor(n);
      const t=g.times&&g.times[i]?fmtTime(g.times[i]):'';
      const wins=winsByCall.get(i+1)||[];
      const winTag=wins.map(w=>`<span class="r-win-tag">🏆${w.name?' '+esc(w.name):''}</span>`).join('');
      return `<tr><td>${i+1}</td><td style="color:${lcol[lt]||'inherit'};font-weight:800">${lt} ${n}</td><td>${t}</td><td>${winTag}</td></tr>`;
    }).join('');
    return `
    <section class="r-game">
      <div class="r-game-head">
        <h2>Game ${g.gameNum}${g.isCurrent?' <span class="r-live">in progress</span>':''}</h2>
        <span class="r-game-meta">${esc(g.pattern)} · ${g.calls} ball${g.calls!==1?'s':''} · ended ${fmtTime(g.ended)}</span>
      </div>
      ${winnerRows||'<p class="r-nowin">No winners recorded for this round.</p>'}
      ${boardHTML(calledSet)}
      <details>
        <summary>Full call log (${g.calls} balls)</summary>
        <table class="r-log">
          <thead><tr><th>#</th><th>Ball</th><th>Time</th><th></th></tr></thead>
          <tbody>${callRows||'<tr><td colspan="4" style="color:#888">No calls yet</td></tr>'}</tbody>
        </table>
      </details>
    </section>`;
  }

  // Collect all winner names across the night
  const allWinners=[...S.history,...(S.called.length||S.winners.length?[{winnerRecs:S.winners}]:[])]
    .flatMap(g=>(g.winnerRecs||[]).filter(w=>w.name).map(w=>esc(w.name)));
  const nightBanner = allWinners.length
    ? `<div class="r-banner">🎉 Tonight's winners: <strong>${[...new Set(allWinners)].join(', ')}</strong></div>` : '';

  const html=`<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Bingo Night Report — ${nightDate}</title>
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:system-ui,-apple-system,'Segoe UI',sans-serif;background:#f5f7fb;color:#1a2332;font-size:15px;line-height:1.5;padding:0 0 40px}
.r-wrap{max-width:900px;margin:0 auto;padding:24px 20px}
.r-header{text-align:center;padding:28px 0 22px;border-bottom:2px solid #e2e8f0;margin-bottom:28px}
.r-header h1{font-size:2rem;font-weight:900;letter-spacing:-.02em;color:#0f172a}
.r-header .r-date{color:#64748b;font-size:1rem;margin-top:4px}
.r-header .r-sessions{margin-top:10px;font-size:.85rem;color:#94a3b8;font-weight:600}
.r-banner{background:#dcfce7;border:1px solid #86efac;border-radius:10px;padding:12px 16px;font-size:1rem;margin-bottom:24px;color:#15803d}
.r-game{background:#fff;border:1px solid #e2e8f0;border-radius:14px;padding:20px;margin-bottom:22px;box-shadow:0 1px 4px rgba(0,0,0,.06)}
.r-game-head{display:flex;align-items:baseline;justify-content:space-between;flex-wrap:wrap;gap:8px;margin-bottom:14px}
.r-game-head h2{font-size:1.15rem;font-weight:900;color:#0f172a}
.r-live{font-size:.75rem;background:#fef3c7;color:#d97706;border-radius:5px;padding:2px 6px;font-weight:700}
.r-game-meta{font-size:.82rem;color:#64748b;font-weight:600}
.r-winner{background:#f0fdf4;border:1px solid #86efac;border-radius:8px;padding:9px 12px;margin-bottom:8px;font-size:.92rem}
.r-nowin{color:#94a3b8;font-size:.88rem;font-style:italic;margin-bottom:10px}
.r-win-tag{background:#fef3c7;color:#92400e;border-radius:4px;padding:1px 5px;font-size:.75rem;font-weight:700;margin-left:4px}
/* board */
.r-board{display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:14px 0}
.r-col{display:flex;flex-direction:column;gap:3px}
.r-head{text-align:center;font-weight:900;font-size:1rem;padding:5px 0;border-radius:6px 6px 0 0;background:#f8fafc}
.r-cell{text-align:center;font-size:.78rem;padding:4px 2px;border-radius:5px;border:1px solid #e2e8f0;background:#f8fafc;color:#94a3b8;font-variant-numeric:tabular-nums}
.r-called{font-weight:900}
/* call log */
details{margin-top:14px}
summary{cursor:pointer;font-size:.85rem;font-weight:700;color:#64748b;padding:4px 0;user-select:none}
.r-log{width:100%;border-collapse:collapse;font-size:.83rem;margin-top:8px}
.r-log th{background:#f1f5f9;padding:6px 8px;text-align:left;font-size:.72rem;text-transform:uppercase;letter-spacing:.05em;color:#64748b}
.r-log td{padding:5px 8px;border-top:1px solid #f1f5f9;font-variant-numeric:tabular-nums;color:#475569}
.r-log tr:nth-child(even) td{background:#fafafa}
/* print toolbar */
.r-toolbar{position:sticky;top:0;z-index:10;background:rgba(245,247,251,.94);backdrop-filter:blur(8px);border-bottom:1px solid #e2e8f0;padding:10px 20px;display:flex;gap:10px;align-items:center;flex-wrap:wrap}
.r-toolbar button{border:1px solid #cbd5e1;background:#fff;border-radius:8px;padding:7px 14px;font-size:.88rem;font-weight:700;cursor:pointer;color:#0f172a}
.r-toolbar button:hover{background:#f1f5f9}
.r-toolbar button.primary{background:#0f172a;color:#fff;border-color:#0f172a}
.r-meta-bar{text-align:center;color:#94a3b8;font-size:.78rem;margin-top:28px;padding-top:16px;border-top:1px solid #e2e8f0}
@media print{
  .r-toolbar{display:none!important}
  body{background:#fff;padding:0}
  .r-game{break-inside:avoid;box-shadow:none;border:1px solid #ddd}
  details{display:block}
  details summary{display:none}
  .r-log{display:table}
}
</style>
</head>
<body>
<div class="r-toolbar">
  <button class="primary" onclick="window.print()">🖨 Print</button>
  <button onclick="dlReport()">⬇ Download HTML</button>
  <span style="flex:1;font-size:.82rem;color:#64748b">${nightDate} · ${games.length} game(s)</span>
  <button onclick="window.close()">✕ Close</button>
</div>
<div class="r-wrap">
  <div class="r-header">
    <h1>🎱 Bingo Night Report</h1>
    <div class="r-date">${nightDate}</div>
    <div class="r-sessions">${games.length} game(s) · ${games.reduce((a,g)=>a+g.calls,0)} total balls called · Generated ${new Date().toLocaleTimeString([],{hour:'2-digit',minute:'2-digit'})}</div>
  </div>
  ${nightBanner}
  ${games.map(gameSection).join('\n')}
  <div class="r-meta-bar">Generated by Bingo Caller v${APP_VERSION} &nbsp;·&nbsp; ${new Date().toLocaleString()}</div>
</div>
<script>
function dlReport(){
  const a=document.createElement('a');
  a.href='data:text/html;charset=utf-8,'+encodeURIComponent('<!DOCTYPE html>'+document.documentElement.outerHTML);
  a.download='bingo-night-${stamp()}.html';
  a.click();
}
<\/script>
</body>
</html>`;

  try{
    const w=window.open('','_blank','width=960,height=820');
    if(!w){ toast('Pop-up blocked — allow pop-ups and try again.'); return; }
    w.document.write(html);
    w.document.close();
  }catch(e){ toast('Could not open report: '+e.message); }
}
