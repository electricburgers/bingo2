"use strict";
/* Settings → Banter packs: one switch per pack. At least one pack always stays on. */
function buildPackRow(){
  const row=$('#packRow'); row.innerHTML='';
  const on=enabledPacks();
  PACK_ORDER.forEach(k=>{
    const item=document.createElement('div'); item.className='toggle pack-opt';
    item.innerHTML=`<span class="pack-txt"><b>${esc(PACKS[k].name)}</b><small>${esc(PACKS[k].desc)}</small></span>`+
      `<label class="switch"><input type="checkbox" data-pack="${k}" aria-label="${esc(PACKS[k].name)} banter pack"${on.includes(k)?' checked':''}><span class="slider"></span></label>`;
    item.querySelector('input').onchange=e=>{
      if(!togglePack(k,e.target.checked)){ e.target.checked=true; toast('Keep at least one pack on.'); return; }
      renderBall(false);
    };
    row.appendChild(item);
  });
}
