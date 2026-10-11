"use strict";
/* Dialog focus management */
/* ==========================================================================
   DIALOG FOCUS MANAGEMENT (drawer / modal / big screen)
   Keeps keyboard focus trapped inside whichever overlay is open, and returns
   it to the element that opened the overlay on close — standard WAI-ARIA
   dialog behavior that screen reader and keyboard-only users depend on.
   ========================================================================== */
let _lastFocused=null;
function focusableIn(container){
  return Array.from(container.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
    .filter(el=>!el.disabled && el.offsetParent!==null);
}
function trapTabKey(container, e){
  if(e.key!=='Tab') return;
  const list=focusableIn(container);
  if(!list.length) return;
  const first=list[0], last=list[list.length-1];
  if(e.shiftKey && document.activeElement===first){ e.preventDefault(); last.focus(); }
  else if(!e.shiftKey && document.activeElement===last){ e.preventDefault(); first.focus(); }
}
function openDialog(container){
  _lastFocused=document.activeElement;
  container.classList.add('show');
  const list=focusableIn(container);
  (list[0]||container).focus();
}
function closeDialog(container){
  container.classList.remove('show');
  if(_lastFocused && typeof _lastFocused.focus==='function') _lastFocused.focus();
  _lastFocused=null;
}
