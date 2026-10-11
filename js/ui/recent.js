"use strict";
/* Recent-calls chips */
function renderRecent(){
  const box=$('#recent'); const bs=$('#bsRecent'); const label=$('#recentLabel');
  const recent=S.called.slice(-5).reverse();
  if(!recent.length){
    box.innerHTML='<span class="muted">Recent calls appear here…</span>'; bs.innerHTML='';
    label.classList.add('hide');
    return;
  }
  const chips=recent.map((n,i)=>{
    const lt=letterFor(n);
    const col=lt?`color:var(--col-${lt}-fg)`:'';
    return `<span class="chip ${i===0?'latest':''}"><span class="l" style="${col}">${lt}</span>${n}</span>`;
  }).join('');
  box.innerHTML=chips; bs.innerHTML=chips;
  label.classList.remove('hide');
}
