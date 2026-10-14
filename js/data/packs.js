"use strict";
/* Themed banter packs. A host can switch each on or off in Settings → Banter packs.
   A ball's lines are (your own MY_CALLS) then each ENABLED pack's lines in this order. If the enabled packs have
   nothing for a ball, it falls back to its Classic lines so the banner never goes blank. */
const PACK_ORDER = ['classic','jersey','nerd','sports'];
const PACKS = {
  classic: {name:'Classic', desc:'Traditional bingo lingo'},
  jersey:  {name:'Jersey',  desc:'Garden State history, people, exits and trivia'},
  nerd:    {name:'Nerd',    desc:'Elements, math and vitamins'},
  sports:  {name:'Sports',  desc:'NJ team numbers and big games'},
};
