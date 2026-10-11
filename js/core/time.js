"use strict";
/* Time formatting. Intl formatters are expensive to construct, and the call log
   formats one timestamp per row on every render — build it once and reuse. */
const _timeFmt = new Intl.DateTimeFormat([], {hour:'2-digit',minute:'2-digit',second:'2-digit'});
function fmtTime(iso){ return _timeFmt.format(new Date(iso)); }
function stamp(){const d=new Date();const p=x=>String(x).padStart(2,'0');return `${d.getFullYear()}${p(d.getMonth()+1)}${p(d.getDate())}-${p(d.getHours())}${p(d.getMinutes())}`;}
