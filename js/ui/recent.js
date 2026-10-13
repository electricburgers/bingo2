"use strict";
/* Recent-calls chips */
/* Saved style, repaired to a known one. */
function recentStyleKey(){ return RECENT_STYLES[S.settings.recentStyle] ? S.settings.recentStyle : 'badge'; }

/* One chip. Every ball renders the same cells — letter, (shape), number — and CSS gives each cell a
   fixed width, so a narrow "I" or a 1-digit number never makes a chip narrower than a "G 52". */
function recentChipHTML(n, latest, style){
  const lt=letterFor(n);
  const vars=`--lc-bg:var(--col-${lt}-bg);--lc-text:var(--col-${lt}-text);--lc-fg:var(--col-${lt}-fg)`;
  const shape = style==='shape' ? `<span class="sh" aria-hidden="true">${LETTER_SHAPES[lt]}</span>` : '';
  return `<span class="chip s-${style}${latest?' latest':''}" style="${vars}"><span class="l">${lt}</span>${shape}<span class="n">${n}</span></span>`;
}

function renderRecent(){
  const box=$('#recent'); const bs=$('#bsRecent'); const label=$('#recentLabel');
  const recent=S.called.slice(-5).reverse();
  if(!recent.length){
    box.innerHTML='<span class="muted">Recent calls appear here…</span>'; bs.innerHTML='';
    label.classList.add('hide');
    return;
  }
  const style=recentStyleKey();
  const chips=recent.map((n,i)=>recentChipHTML(n, i===0, style)).join('');
  box.innerHTML=chips; bs.innerHTML=chips;
  label.classList.remove('hide');
}

/* Settings → Recent calls: pick one of the three styles, each shown as a live sample. */
function buildRecentStyleRow(){
  const row=$('#recentStyleRow'); row.innerHTML='';
  const cur=recentStyleKey();
  Object.entries(RECENT_STYLES).forEach(([k,st])=>{
    const b=document.createElement('button'); b.type='button'; b.className='style-opt'; b.dataset.key=k;
    setToggle(b, k===cur);
    b.innerHTML=`<span class="so-demo">${recentChipHTML(33,false,k)}</span><b>${esc(st.name)}</b><small>${esc(st.desc)}</small>`;
    b.onclick=()=>{ S.settings.recentStyle=k; save(); buildRecentStyleRow(); renderRecent(); };
    row.appendChild(b);
  });
}
