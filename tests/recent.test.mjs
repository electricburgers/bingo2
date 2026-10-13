/* Recent-calls chips: three letter-discernibility styles + fixed-width cells, written test-first. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, html, scripts, loadApp } from './helpers.mjs';

const { run: ev } = loadApp();
const css = read('styles.css');
const rule = sel => { const m = css.match(new RegExp('(?:^|\\n)\\s*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\{([^}]*)\\}')); return m ? m[1] : ''; };
const chip = (n, style, latest = false) => ev(`recentChipHTML(${n}, ${latest}, '${style}')`);
const STYLES = ['badge', 'solid', 'shape'];

// ---- three versions ----------------------------------------------------------------------------
test('R1. exactly three recent-call styles: badge, solid, shape, each named and described', () => {
  assert.equal(ev("Object.keys(RECENT_STYLES).join(',')"), 'badge,solid,shape');
  assert.ok(ev('Object.values(RECENT_STYLES).every(s=>s.name&&s.desc)'));
});
test('R2. new games default to the badge style', () => {
  assert.equal(ev('defaultState().settings.recentStyle'), 'badge');
});
test('R3. normalizeState fills a missing style and repairs an invalid one', () => {
  ev('delete S.settings.recentStyle; normalizeState();');
  assert.equal(ev('S.settings.recentStyle'), 'badge');
  ev("S.settings.recentStyle='bogus'; normalizeState();");
  assert.equal(ev('S.settings.recentStyle'), 'badge');
  ev("S.settings.recentStyle='shape'; normalizeState();");
  assert.equal(ev('S.settings.recentStyle'), 'shape');
  ev("S.settings.recentStyle='badge';");
});
test('R4. every style shows the letter and the number', () => {
  for (const st of STYLES) { const h = chip(33, st); assert.match(h, />N</); assert.match(h, />33</); }
});
test('R5. each chip carries its style class', () => {
  for (const st of STYLES) assert.match(chip(8, st), new RegExp(`class="chip s-${st}`));
});
test('R6. only the newest chip is marked latest', () => {
  assert.match(chip(8, 'badge', true), /latest/);
  assert.doesNotMatch(chip(8, 'badge', false), /latest/);
});
test('R7. each letter has its own distinct shape (readable without colour)', () => {
  assert.equal(ev("Object.keys(LETTER_SHAPES).join('')"), 'BINGO');
  assert.equal(ev('new Set(Object.values(LETTER_SHAPES)).size'), 5);
});
test('R8. only the shape style draws the shape, and it is hidden from screen readers', () => {
  assert.match(chip(8, 'shape'), /class="sh" aria-hidden="true">●</);
  assert.doesNotMatch(chip(8, 'badge'), /class="sh"/);
  assert.doesNotMatch(chip(8, 'solid'), /class="sh"/);
  assert.match(chip(40, 'shape'), /■/);
});
test('R9. letter colours reach the chip through the AAA-safe pairs', () => {
  const h = chip(8, 'badge');
  assert.match(h, /--lc-bg:var\(--col-B-bg\)/);
  assert.match(h, /--lc-text:var\(--col-B-text\)/);
  assert.match(h, /--lc-fg:var\(--col-B-fg\)/);
});
test('R10. solid and badge pairs are AAA (7:1) for every theme letter colour', () => {
  const bad = ev(`Object.values(THEMES).flatMap(t=>Object.values(t.letters)).filter(h=>{const b=accessibleBadge(h,7);return _contrast(b.bg,b.text)<7;})`);
  assert.equal(bad.length, 0);
});
test('R11. styles are CSS-distinct: badge fills the letter slot, solid fills the whole chip, shape colours text', () => {
  assert.match(rule('.chip.s-badge .l'), /background:var\(--lc-bg\)/);
  assert.match(rule('.chip.s-solid'), /background:var\(--lc-bg\)/);
  assert.match(rule('.chip.s-solid'), /color:var\(--lc-text\)/);
  assert.match(rule('.chip.s-shape .l'), /color:var\(--lc-fg\)/);
  assert.match(rule('.chip.s-shape .sh'), /color:var\(--lc-fg\)/);
});

// ---- equal-width cells -----------------------------------------------------------------------
test('R12. every chip has the same cell structure no matter the ball', () => {
  for (const st of STYLES) {
    const skeleton = n => chip(n, st).replace(/>[^<]+</g, '><').replace(/--col-\w-/g, '--col-X-');
    const first = skeleton(1);
    for (let n = 1; n <= 75; n++) assert.equal(skeleton(n), first, `${st} ${n}`);
  }
});
test('R13. the chip itself has a fixed width, not a content-sized one', () => {
  assert.match(rule('.chip'), /(?:^|;)\s*width:var\(--chip-w\)/);
  assert.match(css, /\.chip\.s-(?:badge|solid)\{[^}]*--chip-w:[\d.]+em/);
  assert.match(css, /\.chip\.s-shape\{[^}]*--chip-w:[\d.]+em/);
});
test('R14. the letter cell is a fixed-width, centred slot (I is as wide as G)', () => {
  const r = rule('.chip .l');
  assert.match(r, /width:[\d.]+em/);
  assert.match(r, /text-align:center/);
  assert.match(r, /display:inline-block|display:inline-flex|display:flex/);
});
test('R15. the number cell is a fixed-width, centred slot with tabular digits', () => {
  const r = rule('.chip .n');
  assert.match(r, /width:[\d.]+(?:em|ch)/);
  assert.match(r, /text-align:center/);
  assert.match(r, /tabular-nums/);
});
test('R16. the shape cell is a fixed-width, centred slot', () => {
  const r = rule('.chip .sh');
  assert.match(r, /width:[\d.]+em/);
  assert.match(r, /text-align:center/);
});
test('R17. the big-screen strip does not re-introduce content-sized padding', () => {
  assert.doesNotMatch(rule('.bs-recent .chip'), /padding/);
});
test('R18. recent chips wrap as fixed-size items (flex-wrap, not content-sized grid)', () => {
  assert.match(rule('.recent'), /display:flex/);
  assert.match(rule('.recent'), /flex-wrap:wrap/);
});

// ---- wiring ------------------------------------------------------------------------------------
test('R19. renderRecent builds chips from recentChipHTML using the saved style', () => {
  const src = read('js/ui/recent.js');
  assert.match(src, /recentChipHTML\(/);
  assert.match(src, /S\.settings\.recentStyle/);
});
test('R20. settings has a labelled picker for the recent-call style', () => {
  assert.match(html, /id="recentStyleRow"[^>]*role="group"[^>]*aria-label="Recent calls style"/);
  assert.match(read('js/ui/recent.js'), /buildRecentStyleRow/);
  assert.match(read('js/main.js'), /buildRecentStyleRow\(\)/);
});
test('R21. choosing a style saves it and repaints', () => {
  ev("S.settings.recentStyle='badge';");
  assert.equal(ev("recentStyleKey()"), 'badge');
  ev("S.settings.recentStyle='solid';");
  assert.equal(ev("recentStyleKey()"), 'solid');
  ev("S.settings.recentStyle='nope';");
  assert.equal(ev("recentStyleKey()"), 'badge');
  ev("S.settings.recentStyle='badge';");
});
test('R22. recent-styles.js is loaded before recent.js and precached', () => {
  assert.ok(scripts.includes('js/data/recent-styles.js'));
  assert.ok(scripts.indexOf('js/data/recent-styles.js') < scripts.indexOf('js/ui/recent.js'));
  ev(read('js/config/precache.js'));
  assert.ok(ev('PRECACHE_URLS').includes('./js/data/recent-styles.js'));
});
test('R23. changelog documents the recent-call styles and equal-width cells', () => {
  const top = read('CHANGELOG.md').split('## [2.34]')[0];
  assert.match(top, /recent/i);
  assert.match(top, /same width|equal width|fixed width/i);
});
