"use strict";
/* Big screen, settings drawer and confirm modal */
const openDrawer=()=>{ openDialog($('#drawer')); $('#scrim').classList.add('show'); };
const closeDrawer=()=>{ closeDialog($('#drawer')); $('#scrim').classList.remove('show'); };

function wireOverlays(){
  /* big screen */
  $('#bigBtn').onclick=()=>{ openDialog($('#bigscreen')); syncWakeLock(); };
  $('#bsExit').onclick=()=>{ closeDialog($('#bigscreen')); syncWakeLock(); };
  $('#bigscreen').addEventListener('keydown', e=>trapTabKey($('#bigscreen'), e));

  /* pattern full screen */
  $('#patViewBtn').onclick=openPatternView;
  $('#pvClose').onclick=closePatternView;
  $('#patternview').addEventListener('keydown', e=>trapTabKey($('#patternview'), e));
  $('#patternview').addEventListener('click', e=>{ if(e.target===$('#patternview')) closePatternView(); });

  /* settings drawer */
  $('#settingsBtn').onclick=openDrawer; $('#closeDrawer').onclick=closeDrawer; $('#scrim').onclick=closeDrawer;
  $('#drawer').addEventListener('keydown', e=>trapTabKey($('#drawer'), e));
  $('#modal').addEventListener('keydown', e=>trapTabKey($('#modal'), e));

  /* modal — capture extra inputs BEFORE closeModal wipes #modalExtra */
  $('#modalOk').onclick=()=>{
    const captured={};
    $$('#modalExtra input,#modalExtra textarea,#modalExtra select').forEach(el=>{captured[el.id]=el.value;});
    const f=modalOk; closeModal(); if(f)f(captured);
  };
  $('#modalCancel').onclick=()=>{ const f=modalCancelFn; closeModal(); if(f)f(); };
  // Enter submits; Escape cancels
  $('#modal').addEventListener('keydown',e=>{
    if(e.key==='Enter'&&document.activeElement.tagName==='INPUT'){ e.preventDefault(); $('#modalOk').click(); }
    if(e.key==='Escape'){ e.preventDefault(); const f=modalCancelFn; closeModal(); if(f)f(); }
  });
}
