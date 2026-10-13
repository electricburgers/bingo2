"use strict";
/* Full-screen, easy-to-read view of the current play style */
function renderPatternView(){
  const m=patternViewModel();
  $('#pvName').textContent=m.name;
  $('#pvSummary').textContent=m.summary;
  $('#pvCap').textContent=m.cap;
  $('#pvNote').textContent=m.example ? 'Example only' : (m.columns.length ? 'Balls used: '+m.columns.join(' · ') : '');
  let html=m.letters.map(l=>`<div class="pv-head" style="--lc:var(--col-${l}-fg)">${l}</div>`).join('');
  m.grid.forEach(row=>row.forEach(cell=>{
    html+= cell.kind==='free' ? `<div class="pv-cell free${cell.inPattern?' on':''}"><span>★</span><small>FREE</small></div>`
         : `<div class="pv-cell ${cell.kind}"></div>`;
  }));
  const grid=$('#pvGrid');
  grid.innerHTML=html;
  grid.setAttribute('aria-label', m.name+'. '+m.summary);
}
function openPatternView(){ renderPatternView(); openDialog($('#patternview')); }
function closePatternView(){ closeDialog($('#patternview')); }
function togglePatternView(){ $('#patternview').classList.contains('show') ? closePatternView() : openPatternView(); }
