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
