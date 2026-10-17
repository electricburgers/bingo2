"use strict";
/* Entry point — loaded last. Everything it calls is defined by the scripts before it. */
function init(){
  normalizeState();
  applyTheme();
  buildBoard();
  wireBoardClicks();
  buildPatternTiles();
  buildThemeRow(); buildSwatches(); buildPackRow(); buildBallSizeRows();
  buildEditor();
  fullRender();
  reflectSettings();
  applyPatCollapsed();
  renderAbout();

  wireCalling();
  wireSettings();
  wireIO();
  wireOverlays();
  wireKeyboard();
  wireDock();
  registerPWA();
}

document.addEventListener('DOMContentLoaded',init);
