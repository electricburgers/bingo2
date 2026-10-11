"use strict";
/* Full re-render + small view toggles */
function fullRender(){
  $('#intRange').value=S.settings.autoInterval||10;
  $('#intLabel').textContent=S.settings.autoInterval||10;
  renderBall(false); renderRecent(); renderPattern(); paintBoard(); renderLog();
}

function applyPatCollapsed(){
  const closed=!!S.settings.patCollapsed;
  $('#patBody').classList.toggle('closed', closed);
  $('#patHeader').classList.toggle('closed', closed);
}
