"use strict";
/* Entry point — loaded last. Everything it calls is defined by the scripts before it. */
function init(){
  normalizeState();
  applyTheme();
  buildBoard();
  wireBoardClicks();
  buildPatternTiles();
  buildThemeRow(); buildSwatches();
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
  registerPWA();
}

document.addEventListener('DOMContentLoaded',init);
