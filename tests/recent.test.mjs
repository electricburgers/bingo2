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
test('R9. every chip fills one equal column (width:100%), so all chips are exactly the same width', () => {
  assert.match(rule('.chip'), /(?:^|;)\s*width:100%/);
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
test('R13. the strip is a grid of exactly RECENT_COUNT (5) equal columns, so five always fit in one row', () => {
  assert.equal(ev('RECENT_COUNT'), 5);
  assert.match(rule('.recent'), /display:grid/);
  assert.match(rule('.recent'), /grid-template-columns:repeat\(5,minmax\(0,1fr\)\)/);
});
test('R14. renderRecent builds chips from recentChipHTML and flags only the first as latest', () => {
  const src = read('js/ui/recent.js');
  assert.match(src, /recentChipHTML\(n, i===0\)/);
});
test('R16. renderRecent shows RECENT_COUNT chips (the last five calls)', () => {
  assert.match(read('js/ui/recent.js'), /slice\(-RECENT_COUNT\)/);
});
test('R17. chips are rounded rectangles, not pills', () => {
  const r = rule('.chip');
  assert.doesNotMatch(r, /border-radius:\s*999px/);
  const px = +r.match(/border-radius:(\d+)px/)[1];
  assert.ok(px >= 6 && px <= 14, 'radius ' + px);
});
test('R18. chip text scales down on narrow phones so five still fit (clamp on font-size)', () => {
  assert.match(rule('.chip'), /font-size:clamp\(/);
});
test('R19. the big-screen strip keeps five fixed-size chips too', () => {
  assert.match(rule('.bs-recent'), /display:grid/);
  assert.match(rule('.bs-recent'), /repeat\(5,/);
});
test('R15. changelog documents the badge-only chip and equal-width cells', () => {
  const top = read('CHANGELOG.md').split('## [2.35]')[0];
  assert.match(top, /badge/i);
  assert.match(top, /same width|equal width|fixed width/i);
  assert.match(read('CHANGELOG.md').split('## [2.36]')[0], /rounded rectangle/i);
});
