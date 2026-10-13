"use strict";
/* WCAG AA contrast + accessible color derivation */
/* WCAG 2.1 relative luminance + contrast ratio helpers. */
function _wcagLin(c){ c/=255; return c<=0.03928?c/12.92:Math.pow((c+0.055)/1.055,2.4); }
function _luminance(hex){
  hex=hex.replace(/^#/,'');
  if(hex.length===3) hex=hex.split('').map(x=>x+x).join('');
  const r=parseInt(hex.slice(0,2),16), g=parseInt(hex.slice(2,4),16), b=parseInt(hex.slice(4,6),16);
  return 0.2126*_wcagLin(r)+0.7152*_wcagLin(g)+0.0722*_wcagLin(b);
}
function _contrast(hex1,hex2){
  const l1=_luminance(hex1), l2=_luminance(hex2);
  return (Math.max(l1,l2)+0.05)/(Math.min(l1,l2)+0.05);
}
/* Returns '#000000' or '#ffffff' — whichever gives higher contrast ratio on bgHex. */
function bestTextOn(bgHex){
  if(!bgHex||bgHex.length<4) return '#000000';
  try{ return _contrast(bgHex,'#000000')>=_contrast(bgHex,'#ffffff')?'#000000':'#ffffff'; }
  catch(e){ return '#000000'; }
}

/* ---------- AA-guaranteed color derivation ----------
   WCAG AA needs 4.5:1 for normal text. A theme's hand-picked accent/muted/
   letter colors can miss that against every surface they land on
   (this is exactly why the "current ball" ring and the light theme's callout
   text were unreadable before). Rather than hand-tune 7 themes × a dozen
   color pairs, every derived color below is computed: nudge the original
   hue toward black or white by the SMALLEST amount that clears the target
   ratio against every background it's actually used on, picking whichever
   direction (toward black or toward white) needs the least nudging — that
   keeps the result as close to the designed color as accessibility allows. */
function _mix(hexFrom, hexTo, t){ // t=0 -> hexFrom, t=1 -> hexTo
  const norm=h=>{ h=h.replace(/^#/,''); return h.length===3?h.split('').map(c=>c+c).join(''):h; };
  const a=norm(hexFrom), b=norm(hexTo);
  const pa=[0,2,4].map(i=>parseInt(a.slice(i,i+2),16));
  const pb=[0,2,4].map(i=>parseInt(b.slice(i,i+2),16));
  const m=(x,y)=>Math.round(x*(1-t)+y*t);
  return '#'+pa.map((x,i)=>m(x,pb[i]).toString(16).padStart(2,'0')).join('');
}
/* Smallest mix-toward-anchor (0..1) so `hex` clears `target` contrast against every color in bgList. */
function _shiftFor(hex, anchor, bgList, target){
  const worst=c=>Math.min(...bgList.map(bg=>_contrast(c,bg)));
  if(worst(hex)>=target) return {color:hex, t:0};
  let lo=0, hi=1;
  for(let i=0;i<25;i++){
    const mid=(lo+hi)/2;
    if(worst(_mix(hex,anchor,mid))>=target) hi=mid; else lo=mid;
  }
  return {color:_mix(hex,anchor,hi), t:hi};
}
/* Shift `hex` toward whichever of black/white needs the smaller nudge to hit `target` against bgList. */
const _accCache=new Map();
function accessibleColor(hex, bgList, target){
  const key=hex+'|'+bgList.join(',')+'|'+target;
  let hit=_accCache.get(key); if(hit) return hit;
  const toBlack=_shiftFor(hex,'#000000',bgList,target);
  const toWhite=_shiftFor(hex,'#ffffff',bgList,target);
  hit=(toBlack.t<=toWhite.t ? toBlack : toWhite).color;
  _accCache.set(key,hit);
  return hit;
}
/* A colored badge (background + text) guaranteed to hit `target` contrast between the two,
   staying as close to the original hue as possible — used for letter/pattern badges. */
const _badgeCache=new Map();
function accessibleBadge(hex, target){
  const key=hex+'|'+target;
  const hit=_badgeCache.get(key); if(hit) return hit;
  const lighten=_shiftFor(hex,'#ffffff',['#000000'],target); // paired with black text
  const darken=_shiftFor(hex,'#000000',['#ffffff'],target);  // paired with white text
  const res=lighten.t<=darken.t ? {bg:lighten.color,text:'#000000'} : {bg:darken.color,text:'#ffffff'};
  _badgeCache.set(key,res);
  return res;
}

const AA_TARGET = 4.5; // WCAG AA, normal text
