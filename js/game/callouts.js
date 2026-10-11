"use strict";
/* Combined, de-duplicated variant list for a ball: your lines first, then built-ins.
   Memoized per ball — the lists are static for the lifetime of the page. */
const _variantCache = new Map();
function callVariants(n){
  let out=_variantCache.get(n);
  if(out) return out;
  const mine=MY_CALLS[n]||[];
  const base=CALLS[n]||[];
  const seen=new Set(); out=[];
  for(const s of [...mine,...base]){ if(s && !seen.has(s)){ seen.add(s); out.push(s); } }
  _variantCache.set(n,out);
  return out;
}
