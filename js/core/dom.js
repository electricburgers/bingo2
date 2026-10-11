"use strict";
/* Tiny DOM + escaping helpers */
/* #id lookups (the common case) are cached — every element with an id in index.html is static.
   Anything else (descendant selectors, dynamic content) goes straight to querySelector. */
const _idCache = new Map();
const $ = s => {
  const hit=_idCache.get(s);
  if(hit) return hit;
  if(s.charCodeAt(0)===35 && !/[\s.>\[:,]/.test(s)){
    const el=document.getElementById(s.slice(1));
    if(el) _idCache.set(s,el);
    return el;
  }
  return document.querySelector(s);
};
const $$ = s => Array.from(document.querySelectorAll(s));
/* Escape user-supplied text before interpolating into innerHTML (winner names,
   custom pattern/theme names) to prevent stored-XSS via crafted input. */
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({
  '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'
}[c]));
/* Keep the visual "on" state and the aria-pressed state of a toggle button in sync
   so screen reader users get the same on/off signal as sighted users. */
const setToggle = (el,on) => { el.classList.toggle('on',on); el.setAttribute('aria-pressed', on?'true':'false'); };
