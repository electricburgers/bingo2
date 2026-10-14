"use strict";
/* Banter lines for a ball, and which one to show.
   A ball's list is: your own MY_CALLS, then the lines of every ENABLED pack in PACK_ORDER (classic, jersey, nerd,
   sports). If no enabled pack has anything for the ball it falls back to its Classic lines, so the banner never goes
   blank. Lists are memoized per ball per pack selection; toggling a pack clears the memo (togglePack). */
const _variantCache = new Map();

/* Parkway exits ABOVE 75 whose number ENDS in this ball's number, e.g. ball 2 ← Exit 132. (Exits 1–75 only ever
   go with their own ball — see PARKWAY_EXITS — so Exit 11 never shows up on ball 1.) */
function parkwayAlso(n){
  const tail=String(n);
  return Object.keys(PARKWAY_ALSO).map(Number)
    .filter(e=>e!==n && String(e).endsWith(tail))
    .sort((a,b)=>a-b)
    .map(e=>`Parkway Exit ${e} ends in ${n} too — ${PARKWAY_ALSO[e]}`);
}

/* Which packs are on (always at least one; unknown/missing = on). */
function enabledPacks(){
  const p=(S.settings&&S.settings.packs)||{};
  const on=PACK_ORDER.filter(k=>p[k]!==false);
  return on.length ? on : PACK_ORDER.slice();
}

/* The lines one pack contributes to a ball. */
function packLines(pack,n){
  if(pack==='classic') return CALLS[n]||[];
  if(pack==='jersey')  return [...(JERSEY_LINES[n]||[]), ...(PARKWAY_EXITS[n]?[PARKWAY_EXITS[n]]:[]), ...parkwayAlso(n)];
  if(pack==='nerd')    return NERD_LINES[n]||[];
  if(pack==='sports')  return SPORTS_LINES[n]||[];
  return [];
}

function callVariants(n){
  const packs=enabledPacks();
  const key=packs.join(',')+'|'+n;
  let out=_variantCache.get(key);
  if(out) return out;
  const mine=MY_CALLS[n]||[];
  let base=packs.flatMap(p=>packLines(p,n));
  if(!base.length) base=packLines('classic',n);
  const seen=new Set(); out=[];
  for(const s of [...mine,...base]){ if(s && !seen.has(s)){ seen.add(s); out.push(s); } }
  _variantCache.set(key,out);
  return out;
}

/* Turn one pack on or off. Refuses (returns false) for an unknown pack or if it would leave every pack off. */
function togglePack(key,on){
  if(!PACKS[key]) return false;
  S.settings.packs=S.settings.packs||{};
  const next={...S.settings.packs,[key]:!!on};
  if(!PACK_ORDER.some(k=>next[k]!==false && next[k])) return false;
  S.settings.packs=next;
  _variantCache.clear();
  save();
  return true;
}

/* Random banter, shuffled like a bag: each ball shows every one of its lines once before any repeats, and a new round
   never starts with the line it just showed. What has been shown lives in S.calloutSeen[n] as TEXT, so switching packs
   mid-game cannot confuse it. Returns the index into callVariants(n). */
function pickVariantIndex(n, rand){
  rand=rand||Math.random;
  const v=callVariants(n);
  if(v.length<2) return 0;
  S.calloutSeen=S.calloutSeen||{};
  let seen=(S.calloutSeen[n]||[]).filter(t=>v.includes(t));
  let pool=v.map((_,i)=>i).filter(i=>!seen.includes(v[i]));
  if(!pool.length){                                   // everything shown: new round, but not the same line twice in a row
    const last=seen[seen.length-1];
    seen=[];
    pool=v.map((_,i)=>i).filter(i=>v[i]!==last);
  }
  const i=pool[Math.min(pool.length-1,Math.floor(rand()*pool.length))];
  S.calloutSeen[n]=[...seen,v[i]];
  return i;
}
