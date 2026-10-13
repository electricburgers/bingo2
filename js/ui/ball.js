"use strict";
/* Current ball + call-out */
function renderBall(pop){
  const last = S.called[S.called.length-1];
  const inPlay = eligibleBalls().length;
  const ball=$('#ball'), L=$('#ballLetter'), N=$('#ballNum');
  if(!last){
    ball.classList.add('empty'); L.textContent=''; N.textContent= inPlay? 'Ready':'Done';
    ball.style.removeProperty('--ball-color'); ball.style.removeProperty('--ball-text');
  }else{
    ball.classList.remove('empty');
    const lt=letterFor(last);
    L.textContent=lt; N.textContent=last;
    // --ball-color is the raw, saturated letter hue (decorative border/glow only).
    // --ball-text is a separately-computed AA-safe variant for the letter glyph itself,
    // since the same bright hue that looks great as a ring often can't hit 7:1 as text.
    ball.style.setProperty('--ball-color', `var(--col-${lt})`);
    ball.style.setProperty('--ball-text', `var(--col-${lt}-fg)`);
    if(pop){ ball.classList.remove('pop'); void ball.offsetWidth; ball.classList.add('pop'); }
  }
  $('#callIdx').textContent=S.called.length;
  $('#remainCount').textContent=inPlay;
  // draw-scope hint when the pool is pattern-limited
  const cols=activeColumns();
  $('#drawScope').textContent = cols
    ? 'Drawing from '+[...cols].sort().map(i=>LETTERS[i]).join(' · ')+' only'
    : '';
  // call-out line
  let co='';
  if(last && S.settings.callouts){
    const variants=callVariants(last);
    if(variants.length){
      const idx=((S.calloutIdx[last]||0) % variants.length);
      co=variants[idx];
    }
  }
  $('#callout').textContent=co;
  $('#bsCallout').textContent=co;
  // big screen mirror
  $('#bsLetter').textContent=last?letterFor(last):'';
  $('#bsNum').textContent=last?last:'—';
  $('#bigscreen').style.setProperty('--ball-color', last?`var(--col-${letterFor(last)})`:'var(--accent)');
  $('#bigscreen').style.setProperty('--ball-text', last?`var(--col-${letterFor(last)}-fg)`:'var(--accent-fg)');
  $('#bsCount').textContent=S.called.length;
  if(last) $('#srAnnounce').textContent = `${letterFor(last)} ${last}. ${co}`;
  if(pop && last) speakCall(letterFor(last), last, co);
}

function cycleCallout(){
  const last=S.called[S.called.length-1];
  if(!last) return;
  const variants=callVariants(last);
  if(variants.length<2) return;
  const cur=(S.calloutIdx[last]||0);
  S.calloutIdx[last]=(cur+1)%variants.length;
  save();
  renderBall(false);
}
