"use strict";
/* Garden State Parkway banter. The exit number is the ball number, so Exit 13 rides along with B-13.
   Only real exits in 1–75 appear here (the Parkway runs 0–172; Exit 0 is Cape May).
   callVariants() adds these after the classic lingo, so ↻ cycles to them.
   Source for exit numbers/towns: the Garden State Parkway exit list (Wikipedia). */
const PARKWAY_EXITS = {
  4:  "Parkway Exit 4 — Wildwood, Rio Grande, Route 47! Watch the tram car, please!",
  6:  "Parkway Exit 6 — Route 147 to North Wildwood and Whitesboro. Neon motels, here we come!",
  9:  "Parkway Exit 9 — Shell Bay Avenue, Middle Township. Sounds like seashells, mostly serves Route 9.",
  10: "Parkway Exit 10 — Cape May Court House, gateway to Stone Harbor. A town named after a courthouse. Jersey's very literal.",
  11: "Parkway Exit 11 — Crest Haven Road, Cape May Court House. A crest, a haven AND a road. What a deal!",
  12: "Parkway Exit 12 — entrance only! You can get on here, but you can't get off. Story of the Parkway.",
  13: "Parkway Exit 13 — Swainton and Avalon! Unlucky for some, but the beach doesn't care.",
  17: "Parkway Exit 17 — Sea Isle City! Pack the cooler, the beach tags and your best flip-flops.",
  20: "Parkway Exit 20 — Route 50, Upper Township. Is it above or below the Parkway? Nobody knows!",
  25: "Parkway Exit 25 — Ocean City! It's a DRY town, so the party starts back on the Parkway.",
  29: "Parkway Exit 29 — Somers Point, the last stop before Ocean City. Party while you can!",
  30: "Parkway Exit 30 — West Laurel Drive, Somers Point. Two exits for one town. Somers Point likes options.",
  36: "Parkway Exit 36 — Routes 40 and 322, Pleasantville and Northfield. Atlantic City's close, hold onto your wallet!",
  37: "Parkway Exit 37 — Pleasantville, round two. Jersey likes to double-check.",
  38: "Parkway Exit 38 — Atlantic City Expressway! West to Camden, east to the casinos. Feeling lucky?",
  40: "Parkway Exit 40 — White Horse Pike to Absecon. The Frank Sinatra Service Area is close. Do it your way, grab a coffee!",
  41: "Parkway Exit 41 — Galloway and Pomona, home of Stockton University. Go Ospreys!",
  44: "Parkway Exit 44 — Smithville and Port Republic. You came for one thing and left with a candle.",
  48: "Parkway Exit 48 — Port Republic, technically a city, spiritually a quiet street.",
  50: "Parkway Exit 50 — New Gretna, US 9 north. Welcome to the Pine Barrens. Watch for the Jersey Devil!",
  52: "Parkway Exit 52 — New Gretna via Bass River. The pines get thicker and the cell bars get thinner.",
  58: "Parkway Exit 58 — Route 539 to Tuckerton and Little Egg Harbor. If you've been to Tuckerton, you've been to Tuckerton.",
  63: "Parkway Exit 63 — Route 72 to Long Beach Island! Bring bug spray and a lot of patience.",
  67: "Parkway Exit 67 — Barnegat, Dutch for 'inlet of the breakers.' You're basically a linguist now.",
  69: "Parkway Exit 69 — Wells Mills Road, Waretown. Sixty-nine AND Wells Mills. I couldn't make this up.",
  74: "Parkway Exit 74 — Lacey Road, Forked River. Grab a coffee at the Celia Cruz Service Area. ¡Azúcar!",
};
