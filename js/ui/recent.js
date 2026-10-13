"use strict";
/* Recent-calls chips */
/* How many recent calls the strip shows. The CSS grid (styles.css .recent / .bs-recent) has this many columns. */
const RECENT_COUNT=5;

/* One chip: the letter in a colored badge (AA text/background pair), then the number. Every ball renders
   the same two cells and CSS gives each a fixed width, so a narrow "I" or a 1-digit number never makes a
   chip narrower than "G 52". */
function recentChipHTML(n, latest){
  const lt=letterFor(n);
  const vars=`--lc-bg:var(--col-${lt}-bg);--lc-text:var(--col-${lt}-text)`;
  return `<span class="chip${latest?' latest':''}" style="${vars}"><span class="l">${lt}</span><span class="n">${n}</span></span>`;
}

function renderRecent(){
  const box=$('#recent'); const bs=$('#bsRecent'); const label=$('#recentLabel');
  const recent=S.called.slice(-RECENT_COUNT).reverse();
  if(!recent.length){
    box.innerHTML='<span class="muted">Recent calls appear here…</span>'; bs.innerHTML='';
    label.classList.add('hide');
    return;
  }
  const chips=recent.map((n,i)=>recentChipHTML(n, i===0)).join('');
  box.innerHTML=chips; bs.innerHTML=chips;
  label.classList.remove('hide');
}
