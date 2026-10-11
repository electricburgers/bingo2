"use strict";
/* Call controls, auto-call, winner/archive, pattern collapse + custom pattern save */
function wireCalling(){
  /* play-style collapse caret */
  const togglePat=()=>{ S.settings.patCollapsed=!S.settings.patCollapsed; save(); applyPatCollapsed(); };
  $('#patHeader').onclick=togglePat;
  $('#patHeader').addEventListener('keydown',e=>{ if(e.key==='Enter'||e.code==='Space'){ e.preventDefault(); togglePat(); } });

  $('#cycleBtn').onclick=cycleCallout;
  $('#callBtn').onclick=callNext;
  $('#undoBtn').onclick=undo;
  $('#resetBtn').onclick=newGame;
  $('#autoBtn').onclick=toggleAuto;
  $('#markWinner').onclick=markWinner;
  $('#bsTap').onclick=callNext;
  $('#archiveBtn').onclick=archiveGame;
  $('#intRange').oninput=e=>{ S.settings.autoInterval=+e.target.value; $('#intLabel').textContent=e.target.value; save(); };

  /* save custom pattern */
  $('#saveCustom').onclick=()=>{
    const name=$('#customName').value.trim()||('Custom '+(S.customPatterns.length+1));
    if(!S.editorCells.length){ toast('Tap some cells first.'); return; }
    const id='c'+Date.now();
    S.customPatterns.push({id,name,cells:S.editorCells.slice()});
    S.editorCells=[]; $('#customName').value='';
    save(); selectPattern('custom:'+id); buildEditor();
    $('#customEditor').classList.add('hide');
    toast('Saved pattern: '+name);
  };
  $('#patDimBtn').onclick=()=>{ S.patternDim=!S.patternDim; save(); paintBoard(); };
}
