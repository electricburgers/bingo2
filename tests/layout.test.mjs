/* Call card layout: Undo / New Game live below the recent calls, away from Call Next Ball. Test-first. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, html } from './helpers.mjs';

const css = read('styles.css');
const at = id => html.indexOf(`id="${id}"`);
const rule = sel => { const m = css.match(new RegExp('(?:^|\\n)\\s*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\{([^}]*)\\}')); return m ? m[1] : ''; };

test('L1. Undo and New Game come after the recent-calls strip', () => {
  assert.ok(at('undoBtn') > at('recent'));
  assert.ok(at('resetBtn') > at('recent'));
});
test('L2. order in the card is Call, Auto, Recent, then Undo and New Game', () => {
  const order = ['callBtn', 'autoBtn', 'recent', 'undoBtn', 'resetBtn'].map(at);
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  assert.ok(order.every(i => i > -1));
});
test('L3. nothing but the Auto row and recent strip sits between Call and Undo (no adjacency)', () => {
  const between = html.slice(at('callBtn'), at('undoBtn'));
  assert.match(between, /id="autoBtn"/);
  assert.match(between, /id="recentLabel"/);
});
test('L4. the Undo / New Game row has its own class with generous top spacing', () => {
  assert.match(html, /<div class="btn-row after-recent">\s*<button class="btn" id="undoBtn"/);
  const m = +rule('.btn-row.after-recent').match(/margin-top:(\d+)px/)[1];
  assert.ok(m >= 14, 'margin-top ' + m);
});
test('L5. the Undo button and New Game button keep their ids, titles and shortcuts', () => {
  assert.match(html, /id="undoBtn" title="Undo \(U\)"/);
  assert.match(html, /id="resetBtn" title="New game \(R\)"/);
  assert.match(read('js/app/wire-calling.js'), /\$\('#undoBtn'\)\.onclick=undo/);
  assert.match(read('js/app/wire-calling.js'), /\$\('#resetBtn'\)\.onclick=newGame/);
});
test('L6. New Game still asks for confirmation', () => {
  assert.match(read('js/game/actions.js'), /function newGame\(\)\{\s*confirmModal\(/);
});
test('L7. the Call button is followed by the Auto row, not by a destructive control', () => {
  const after = html.slice(at('callBtn'), at('callBtn') + 400);
  assert.ok(after.indexOf('autoBtn') > -1 && (after.indexOf('undoBtn') === -1 || after.indexOf('undoBtn') > after.indexOf('autoBtn')));
});
test('L8. changelog documents the move', () => {
  assert.match(read('CHANGELOG.md').split('## [2.37]')[0], /Undo.*New Game|New Game.*Undo/s);
});

// ---- static banter space (v2.39) ---------------------------------------------------------------
import { loadApp } from './helpers.mjs';
const { run: ev } = loadApp();

test('L9. every banter line is at most 95 characters, so it always fits the reserved four-line space', () => {
  const long = ev(`Array.from({length:75},(_,i)=>callVariants(i+1)).flat().filter(s=>s.length>95)`);
  assert.deepEqual([...long], []);
});
test('L10. the banter slot has a FIXED four-line height (not just a minimum)', () => {
  const r = rule('.callout');
  assert.match(r, /(?:^|;)\s*height:5\.4em/);
  assert.doesNotMatch(r, /min-height/);
  assert.match(r, /line-height:1\.35/);
});
test('L11. the banter row is a grid: the text takes the remaining width, a fixed column on the right holds the button', () => {
  assert.match(rule('.callout-row'), /grid-template-columns:1fr \d+px/);
});
test('L12. the cycle button sits in the banter row, to the right of the banter text', () => {
  const row = html.slice(html.indexOf('id="calloutRow"'), html.indexOf('class="callmeta"'));
  assert.ok(row.indexOf('id="callout"') > -1 && row.indexOf('id="cycleBtn"') > row.indexOf('id="callout"'));
  const meta = html.slice(html.indexOf('class="callmeta"'), html.indexOf('id="drawScope"'));
  assert.doesNotMatch(meta, /id="cycleBtn"/);
});
test('L13. order is ball, banter, Call/in-play, draw scope, Call Next Ball with nothing between', () => {
  const order = ['ball', 'callout', 'callIdx', 'drawScope', 'callBtn'].map(at);
  assert.deepEqual([...order].sort((a, b) => a - b), order);
  const from = html.indexOf('</div>', at('drawScope')) + 6;
  const gap = html.slice(from, html.indexOf('<button class="call-btn"')).replace(/<\/?div[^>]*>/g, '').trim();
  assert.equal(gap, '');
});
test('L14. the Call / in-play row hugs the button: tight margins, no empty draw-scope line in between', () => {
  assert.ok(+rule('.callmeta').match(/margin-top:(\d+)px/)[1] <= 4);
  assert.match(css, /\.drawscope:empty\{display:none\}/);
  assert.doesNotMatch(rule('.drawscope'), /min-height/);
});
test('L15. the cycle button hides (but keeps its space) while there is no banter', () => {
  assert.match(css, /\.ball-wrap:has\(\.callout:empty\) \.cyclebtn\{visibility:hidden\}/);
});
test('L16. changelog documents the static banter space', () => {
  assert.match(read('CHANGELOG.md').split('## [2.38]')[0], /static|fixed/i);
});
