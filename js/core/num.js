"use strict";
/* Clamp a stored number back into its valid range — guards against a
   corrupted/hand-edited localStorage value producing an unusable layout. */
function clampNum(v,min,max,fallback){ v=+v; return Number.isFinite(v) ? Math.min(max,Math.max(min,v)) : fallback; }
