"use strict";
/* Recent-calls chip styles. All three keep the same cells (letter · number, plus a shape in "shape"),
   so they differ only in how the letters are told apart. */
const RECENT_STYLES = {
  badge: {name:'Badge',  desc:'Letter in a colored badge'},
  solid: {name:'Solid',  desc:'Whole chip in the letter color'},
  shape: {name:'Shapes', desc:'Letter plus its own shape — works without color'},
};
/* One distinct silhouette per column, so B/I/N/G/O can be told apart without relying on color. */
const LETTER_SHAPES = {B:'●', I:'▲', N:'■', G:'◆', O:'★'};
