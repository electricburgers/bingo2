"use strict";
/* Settings drawer controls: toggles, sliders, custom theme, clear history */
function reflectSettings(){
  $('#fontRange').value=S.settings.fontScale; $('#fsLabel').textContent=S.settings.fontScale+'%';
  $('#boardScaleRange').value=Math.round(S.settings.boardScale*100); $('#boardScaleLabel').textContent=Math.round(S.settings.boardScale*100)+'%';
  $('#freeChk').checked=S.freeSpace;
  $('#limitChk').checked=S.settings.limitDraw;
  $('#calloutChk').checked=S.settings.callouts;
  $('#speakChk').checked=S.settings.speakCalls;
  $('#vibrateChk').checked=S.settings.vibrate;
  $('#intRange').value=S.settings.autoInterval; $('#intLabel').textContent=S.settings.autoInterval;
}

function wireSettings(){
  $('#calloutChk').onchange=e=>{ S.settings.callouts=e.target.checked; save(); renderBall(false); };
  $('#limitChk').onchange=e=>{ S.settings.limitDraw=e.target.checked; save(); renderBall(false); paintBoard(); };
  $('#speakChk').onchange=e=>{ S.settings.speakCalls=e.target.checked; save(); if(!e.target.checked && 'speechSynthesis' in window) speechSynthesis.cancel(); };
  $('#vibrateChk').onchange=e=>{ S.settings.vibrate=e.target.checked; save(); };
  $('#freeChk').onchange=e=>{ S.freeSpace=e.target.checked; save(); renderPattern(); renderBall(false); };

  // Size sliders only change two CSS variables, so skip the full color derivation.
  $('#fontRange').oninput=e=>{ S.settings.fontScale=+e.target.value; $('#fsLabel').textContent=e.target.value+'%'; save(); applyScale(); };
  $('#boardScaleRange').oninput=e=>{ S.settings.boardScale=+e.target.value/100; $('#boardScaleLabel').textContent=e.target.value+'%'; save(); applyScale(); };

  $('#cBg').oninput=e=>{ S.settings.vars=S.settings.vars||{}; S.settings.vars['--bg']=e.target.value; save(); applyTheme(); };
  $('#cText').oninput=e=>{ S.settings.vars=S.settings.vars||{}; S.settings.vars['--text']=e.target.value; save(); applyTheme(); };
  $('#saveTheme').onclick=()=>{
    const name=$('#themeName').value.trim()||('Theme '+((S.customThemes||[]).length+1));
    S.customThemes=S.customThemes||[];
    S.customThemes.push({name, vars:{...(S.settings.vars||{})}, letters:{...S.settings.letters}});
    $('#themeName').value=''; save(); buildThemeRow(); toast('Saved theme: '+name);
  };

  $('#clearHistoryBtn').onclick=()=>{
    confirmModal(
      '🗑 Clear all history?',
      'This erases every called ball, winner record, and archived game on this device — a true clean slate. Your settings, themes, and custom patterns are kept.',
      ()=>{
        S.called=[]; S.callTimes=[]; S.callPatterns=[]; S.winners=[]; S.calloutIdx={}; S.calloutSeen={};
        S.history=[];
        S.session={id:Date.now(), started:new Date().toISOString(), games:1};
        save(); fullRender();
        closeDrawer();
        toast('Clean slate — all history cleared.');
      },
      {okText:'Yes, clear everything', cancelText:'Cancel'}
    );
  };
}
