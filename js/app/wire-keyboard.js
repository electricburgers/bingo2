"use strict";
/* Global keyboard shortcuts */
function wireKeyboard(){
  document.addEventListener('keydown',e=>{
    if(['INPUT','SELECT','TEXTAREA'].includes(document.activeElement.tagName)) return;
    const k=e.key.toLowerCase();
    if(e.code==='Space'){ e.preventDefault(); callNext(); }
    else if(k==='u'){ undo(); }
    else if(k==='a'){ toggleAuto(); }
    else if(k==='r'){ newGame(); }
    else if(k==='f'){ const bs=$('#bigscreen'); bs.classList.contains('show') ? closeDialog(bs) : openDialog(bs); syncWakeLock(); }
    else if(k==='escape'){ if($('#bigscreen').classList.contains('show')){ closeDialog($('#bigscreen')); syncWakeLock(); } closeDrawer(); closeModal(); }
  });
}
