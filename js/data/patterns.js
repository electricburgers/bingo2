"use strict";
/* Pattern library (5x5 card geometry) */
/* ---------- Pattern library (5x5 card: row 0=top..4=bottom, col 0=B..4=O) ---------- */
function rowCells(r){return [0,1,2,3,4].map(c=>[r,c]);}
function colCells(c){return [0,1,2,3,4].map(r=>[r,c]);}
const ALL25 = []; for(let r=0;r<5;r++)for(let c=0;c<5;c++)ALL25.push([r,c]);
const OUTER = ALL25.filter(([r,c])=>r===0||r===4||c===0||c===4);

const PATTERNS = {
  any_line:    {name:'Any Line',          meta:'any',  cap:'Any single full row, column, or diagonal.'},
  vertical:    {name:'Vertical Line',     meta:'col',  example:colCells(0), cap:'Any one full column (B, I, N, G, or O).'},
  horizontal:  {name:'Horizontal Line',   meta:'row',  example:rowCells(2), cap:'Any one full horizontal row (1–5).'},
  diagonal:    {name:'Diagonal Line',     cells:[[0,0],[1,1],[2,2],[3,3],[4,4]], cap:'Either corner-to-corner diagonal.'},
  diagonal_stripes:{name:'Diagonal Stripes', cells:[[0,0],[1,1],[2,2],[3,3],[4,4],[0,1],[1,2],[2,3],[3,4],[1,0],[2,1],[3,2],[4,3]], cap:'Three parallel diagonals — the main one plus the two 4-cell broken diagonals beside it.'},
  picket_fence:{name:'Picket Fence',      cells:colCells(0).concat(colCells(2),colCells(4)), cap:'Three full vertical columns — B, N and O.'},
  railroad:    {name:'Railroad Tracks',   cells:colCells(0).concat(colCells(4)), cap:'The two outer columns — B and O.'},
  stripes:     {name:'Stripes',           cells:rowCells(0).concat(rowCells(2),rowCells(4)), cap:'Three full horizontal rows — the 1st, 3rd and 5th.'},
  chevron:     {name:'Chevron / Arrow',   cells:[[2,0],[1,1],[0,2],[1,3],[2,4]], cap:'A peak — two diagonals meeting at the top center.'},
  letter_z:    {name:'Letter Z',          cells:rowCells(0).concat([[1,3],[2,2],[3,1]],rowCells(4)), cap:'Top row, anti-diagonal, then bottom row — a zigzag.'},
  letter_n:    {name:'Letter N',          cells:colCells(0).concat([[1,1],[2,2],[3,3]],colCells(4)), cap:'Left column, main diagonal, right column.'},
  diamond:     {name:'Diamond',           cells:[[0,2],[1,1],[1,3],[2,0],[2,4],[3,1],[3,3],[4,2]], cap:'The ring touching the four edge midpoints.'},
  small_diamond:{name:'Small Diamond',    cells:[[1,2],[2,1],[2,3],[3,2]], cap:'The four cells hugging the free space.'},
  four_corners:{name:'Four Corners',      cells:[[0,0],[0,4],[4,0],[4,4]], cap:'The four corner cells: top & bottom of the B and O columns.'},
  x:           {name:'X (Both Diagonals)',cells:[[0,0],[1,1],[2,2],[3,3],[4,4],[0,4],[1,3],[3,1],[4,0]], cap:'Both diagonals crossing through the free center.'},
  blackout:    {name:'Blackout / Coverall',cells:ALL25.slice(), cap:'Every square on the card.'},
  postage:     {name:'Postage Stamp',     cells:[[0,3],[0,4],[1,3],[1,4]], cap:'A 2×2 block in the top-right corner (some halls allow any corner).'},
  inner_square:{name:'Inner Square',      cells:[[1,1],[1,2],[1,3],[2,1],[2,3],[3,1],[3,2],[3,3]], cap:'The square of 8 cells ringing the free space.'},
  frame:       {name:'Picture Frame',     cells:OUTER.slice(), cap:'The full outer border of the card.'},
  letter_t:    {name:'Letter T',          cells:rowCells(0).concat(colCells(2).filter(([r])=>r>0)), cap:'Top row plus the center (N) column.'},
  bird:        {name:'The Bird',           cells:rowCells(3).concat(rowCells(4),colCells(2).filter(([r])=>r<3)), cap:'The bottom two rows plus the entire N column — wings, body and tail.'},
  letter_l:    {name:'Letter L',          cells:colCells(0).concat(rowCells(4).filter(([,c])=>c>0)), cap:'Left (B) column plus the bottom row.'},
};
const CENTER = (r,c)=>r===2&&c===2;
