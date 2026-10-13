"use strict";
/* Combined, de-duplicated variant list for a ball: your lines first, then built-ins, then the Garden State Parkway exit line (if that number is a real exit), then every other Parkway exit whose number ends in this one.
   Memoized per ball — the lists are static for the lifetime of the page. */
const _variantCache = new Map();

/* Parkway exits (any number, 4–172) whose number ENDS in this ball's number, e.g. ball 2 ← Exit 132. */
function parkwayAlso(n){
  const tail=String(n);
  return Object.keys(PARKWAY_ALSO).map(Number)
    .filter(e=>e!==n && String(e).endsWith(tail))
    .sort((a,b)=>a-b)
    .map(e=>`Parkway Exit ${e} ends in ${n} too — ${PARKWAY_ALSO[e]}`);
}
function callVariants(n){
  let out=_variantCache.get(n);
  if(out) return out;
  const mine=MY_CALLS[n]||[];
  const base=CALLS[n]||[];
  const exit=PARKWAY_EXITS[n]?[PARKWAY_EXITS[n]]:[];
  const seen=new Set(); out=[];
  for(const s of [...mine,...base,...exit,...parkwayAlso(n)]){ if(s && !seen.has(s)){ seen.add(s); out.push(s); } }
  _variantCache.set(n,out);
  return out;
}
