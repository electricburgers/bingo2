/* Recent-calls chips: the Badge look (letter in a colored badge) with fixed-width cells. Written test-first. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, html, scripts, loadApp } from './helpers.mjs';

const { run: ev } = loadApp();
const css = read('styles.css');
const rule = sel => { const m = css.match(new RegExp('(?:^|\\n)\\s*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\{([^}]*)\\}')); return m ? m[1] : ''; };
const chip = (n, latest = false) => ev(`recentChipHTML(${n}, ${latest})`);

// ---- the badge chip ----------------------------------------------------------------------------
test('R1. a chip shows the letter and the number', () => {
  assert.match(chip(33), />N</);
  assert.match(chip(33), />33</);
});
test('R2. the letter sits in its own badge cell, the number in its own cell', () => {
  assert.match(chip(8), /<span class="l">B<\/span><span class="n">8<\/span>/);
});
test('R3. only the newest chip is marked latest', () => {
  assert.match(chip(8, true), /latest/);
  assert.doesNotMatch(chip(8, false), /latest/);
});
test('R4. letter colours reach the badge through the AA-safe background/text pair', () => {
  const h = chip(8);
  assert.match(h, /--lc-bg:var\(--col-B-bg\)/);
  assert.match(h, /--lc-text:var\(--col-B-text\)/);
});
test('R5. the badge fills the letter cell with that pair', () => {
  assert.match(rule('.chip .l'), /background:var\(--lc-bg\)/);
  assert.match(rule('.chip .l'), /color:var\(--lc-text\)/);
});
test('R6. badge pairs are AA (4.5:1) for every theme letter colour', () => {
  const bad = ev(`Object.values(THEMES).flatMap(t=>Object.values(t.letters)).filter(h=>{const b=accessibleBadge(h,AA_TARGET);return _contrast(b.bg,b.text)<4.5;})`);
  assert.equal(bad.length, 0);
});
test('R7. the extra styles are gone: no picker, no solid/shape variants, no settings key', () => {
  assert.equal(ev('typeof RECENT_STYLES'), 'undefined');
  assert.equal(ev('typeof LETTER_SHAPES'), 'undefined');
  assert.doesNotMatch(html, /recentStyleRow/);
  assert.ok(!scripts.includes('js/data/recent-styles.js'));
  assert.doesNotMatch(css, /s-solid|s-shape|style-opt/);
  assert.doesNotMatch(chip(40), /class="sh"|s-solid|s-shape/);
  assert.equal(ev("'recentStyle' in defaultState().settings"), false);
});

// ---- equal-width cells -----------------------------------------------------------------------
test('R8. every chip has the same cell structure no matter the ball', () => {
  const skeleton = n => chip(n).replace(/>[^<]+</g, '><').replace(/--col-\w-/g, '--col-X-');
  const first = skeleton(1);
  for (let n = 1; n <= 75; n++) assert.equal(skeleton(n), first, String(n));
});
test('R9. the chip itself has a fixed width, not a content-sized one', () => {
  assert.match(rule('.chip'), /(?:^|;)\s*width:[\d.]+em/);
});
test('R10. the letter cell is a fixed-width, centred slot (I is as wide as G)', () => {
  const r = rule('.chip .l');
  assert.match(r, /width:[\d.]+em/);
  assert.match(r, /text-align:center/);
  assert.match(r, /display:inline-block|display:inline-flex|display:flex/);
});
test('R11. the number cell is a fixed-width, centred slot with tabular digits', () => {
  const r = rule('.chip .n');
  assert.match(r, /width:[\d.]+(?:em|ch)/);
  assert.match(r, /text-align:center/);
  assert.match(r, /tabular-nums/);
});
test('R12. the big-screen strip does not re-introduce content-sized padding', () => {
  assert.doesNotMatch(rule('.bs-recent .chip'), /padding/);
});
test('R13. recent chips wrap as fixed-size items (flex-wrap, not content-sized grid)', () => {
  assert.match(rule('.recent'), /display:flex/);
  assert.match(rule('.recent'), /flex-wrap:wrap/);
});
test('R14. renderRecent builds chips from recentChipHTML and flags only the first as latest', () => {
  const src = read('js/ui/recent.js');
  assert.match(src, /recentChipHTML\(n, i===0\)/);
});
test('R15. changelog documents the badge-only chip and equal-width cells', () => {
  const top = read('CHANGELOG.md').split('## [2.35]')[0];
  assert.match(top, /badge/i);
  assert.match(top, /same width|equal width|fixed width/i);
});
