/* v2.31 features, written test-first: NJ Parkway banter, free-space-aware N column,
   The Bird pattern, and the full-screen pattern view.  Run with: node --test tests/ */
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, html, scripts, loadApp } from './helpers.mjs';

const { run: ev } = loadApp();
const reset = () => ev("S.pattern='any_line'; S.freeSpace=true; S.settings.limitDraw=true; S.called=[]; S.customPatterns=[]; save();");
const pat = (key, free = true) => { ev(`S.pattern='${key}'; S.freeSpace=${free}; S.settings.limitDraw=true; save();`); };

/* Real Garden State Parkway exits numbered 1-75 (Wikipedia exit list; exit number = milepost). */
const EXITS = [4, 6, 9, 10, 11, 12, 13, 17, 20, 25, 29, 30, 36, 37, 38, 40, 41, 44, 48, 50, 52, 58, 63, 67, 69, 74];
const parkwayLines = n => ev(`callVariants(${n})`).filter(s => /^Parkway Exit \d+/.test(s));

// ---- NJ Parkway banter (F1-F14) ----------------------------------------------------------
test('F1. PARKWAY_EXITS covers exactly the real exits in 1-75', () => {
  assert.deepEqual(ev('Object.keys(PARKWAY_EXITS).map(Number).sort((a,b)=>a-b)'), EXITS);
});
test('F2. every real exit number has a Parkway line in its call-outs', () => {
  for (const n of EXITS) assert.ok(parkwayLines(n).length >= 1, 'exit ' + n);
});
test('F3. numbers with no real exit get no Parkway line', () => {
  for (let n = 1; n <= 75; n++) if (!EXITS.includes(n)) assert.equal(parkwayLines(n).length, 0, 'ball ' + n);
});
test('F4. each Parkway line names its own exit number', () => {
  for (const n of EXITS) for (const s of parkwayLines(n)) assert.match(s, new RegExp(`^Parkway Exit ${n}\\b`));
});
test('F5. Parkway lines are short enough to read aloud (<= 170 chars)', () => {
  for (const n of EXITS) for (const s of parkwayLines(n)) assert.ok(s.length <= 170, s);
});
test('F6. no duplicate call-out lines anywhere', () => {
  const all = Array.from({ length: 75 }, (_, i) => ev(`callVariants(${i + 1})`)).flat();
  assert.equal(new Set(all).size, all.length);
});
test('F7. classic bingo lingo stays the default; Parkway line comes later in the cycle', () => {
  for (const n of EXITS) assert.doesNotMatch(ev(`callVariants(${n})`)[0], /^Parkway Exit/);
});
test('F8. your own MY_CALLS still go first when an exit line exists', () => {
  ev("MY_CALLS[13]=['Mine first']; _variantCache.clear();");
  const v = ev('callVariants(13)');
  assert.equal(v[0], 'Mine first');
  assert.ok(v.some(s => /^Parkway Exit 13/.test(s)));
  ev('delete MY_CALLS[13]; _variantCache.clear();');
});
test('F9. exit 38 is the Atlantic City Expressway junction', () => {
  assert.match(parkwayLines(38).join(' '), /Expressway/);
});
test('F10. exit 13 is Avalon (CR 601), exit 25 is Ocean City, exit 63 is Long Beach Island', () => {
  assert.match(parkwayLines(13).join(' '), /Avalon/);
  assert.match(parkwayLines(25).join(' '), /Ocean City/);
  assert.match(parkwayLines(63).join(' '), /Long Beach Island|LBI/);
});
test('F11. exit 69 is Waretown, exit 74 is Forked River, exit 4 is Wildwood', () => {
  assert.match(parkwayLines(69).join(' '), /Waretown/);
  assert.match(parkwayLines(74).join(' '), /Forked River/);
  assert.match(parkwayLines(4).join(' '), /Wildwood/);
});
test('F12. exit 0 is not a ball, and nothing above 75 sneaks in', () => {
  assert.ok(ev('Object.keys(PARKWAY_EXITS).every(k=>k>=1&&k<=75)'));
});
test('F13. parkway-exits.js is loaded by index.html before the call-out merge runs', () => {
  assert.ok(scripts.includes('js/data/parkway-exits.js'));
  assert.ok(scripts.indexOf('js/data/parkway-exits.js') < scripts.indexOf('js/game/callouts.js'));
});
test('F14. parkway-exits.js is precached for offline use', () => {
  ev(read('js/config/precache.js'));
  assert.ok(ev('PRECACHE_URLS').includes('./js/data/parkway-exits.js'));
});

// ---- N column is free-space only on diagonals / X (F15-F26) -------------------------------
test('F15. diagonal + free space: no N balls (31-45) are eligible', () => {
  reset(); pat('diagonal');
  const el = ev('eligibleBalls()');
  assert.equal(el.length, 60);
  assert.ok(el.every(n => n < 31 || n > 45));
});
test('F16. X + free space: no N balls are eligible', () => {
  reset(); pat('x');
  const el = ev('eligibleBalls()');
  assert.equal(el.length, 60);
  assert.ok(!el.some(n => n >= 31 && n <= 45));
});
test('F17. X involves B, I, G, O only', () => {
  reset(); pat('x');
  assert.deepEqual([...ev('involvedColumns()')].sort(), [0, 1, 3, 4]);
});
test('F18. diagonal involves B, I, G, O only', () => {
  reset(); pat('diagonal');
  assert.deepEqual([...ev('involvedColumns()')].sort(), [0, 1, 3, 4]);
});
test('F19. free space OFF: diagonal needs the N column again (all 75 eligible)', () => {
  reset(); pat('diagonal', false);
  assert.equal(ev('involvedColumns()'), null);
  assert.equal(ev('eligibleBalls().length'), 75);
});
test('F20. free space OFF: X needs the N column again', () => {
  reset(); pat('x', false);
  assert.equal(ev('eligibleBalls().length'), 75);
});
test('F21. toggling free space re-opens the N column after save()', () => {
  reset(); pat('x');
  assert.equal(ev('eligibleBalls().length'), 60);
  ev('S.freeSpace=false; save();');
  assert.equal(ev('eligibleBalls().length'), 75);
  ev('S.freeSpace=true; save();');
  assert.equal(ev('eligibleBalls().length'), 60);
});
test('F22. Any Line is untouched by the rule (all 75)', () => {
  reset();
  assert.equal(ev('eligibleBalls().length'), 75);
});
test('F23. Diagonal Stripes still needs N (it has non-center N cells)', () => {
  reset(); pat('diagonal_stripes');
  assert.equal(ev('involvedColumns()'), null);
  assert.equal(ev('eligibleBalls().length'), 75);
});
test('F24. Four Corners and Letter T are unchanged (corners {B,O}; T keeps N)', () => {
  reset(); pat('four_corners');
  assert.deepEqual([...ev('involvedColumns()')].sort(), [0, 4]);
  pat('letter_t');
  assert.equal(ev('involvedColumns()'), null);
});
test('F25. a custom pattern that touches N only at the center skips N', () => {
  reset();
  ev("S.customPatterns=[{id:'q',name:'Q',cells:[[0,0],[2,2],[4,4]]}]; S.pattern='custom:q'; save();");
  assert.deepEqual([...ev('involvedColumns()')].sort(), [0, 4]);
  reset();
});
test('F26. a pattern that is only the free space never empties the draw pool', () => {
  reset();
  ev("S.customPatterns=[{id:'f',name:'F',cells:[[2,2]]}]; S.pattern='custom:f'; save();");
  assert.equal(ev('eligibleBalls().length'), 75);
  reset();
});

// ---- The Bird (F27-F36) --------------------------------------------------------------------
const birdCells = () => ev('PATTERNS.bird.cells').map(([r, c]) => r + '_' + c);
test('F27. PATTERNS.bird exists and is called The Bird', () => {
  assert.equal(ev('PATTERNS.bird.name'), 'The Bird');
});
test('F28. the bird is 13 distinct cells (2 rows + the rest of the N column)', () => {
  assert.equal(new Set(birdCells()).size, 13);
  assert.equal(birdCells().length, 13);
});
test('F29. both bottom rows are completely filled', () => {
  const s = new Set(birdCells());
  for (const r of [3, 4]) for (let c = 0; c < 5; c++) assert.ok(s.has(r + '_' + c), r + '_' + c);
});
test('F30. the entire N column is filled', () => {
  const s = new Set(birdCells());
  for (let r = 0; r < 5; r++) assert.ok(s.has(r + '_2'), 'row ' + r);
});
test('F31. the bird has nothing else (top rows only touch column N)', () => {
  assert.ok(birdCells().filter(k => +k[0] < 3).every(k => k.endsWith('_2')));
});
test('F32. every bird cell is inside the 5x5 card', () => {
  assert.ok(ev('PATTERNS.bird.cells.every(([r,c])=>r>=0&&r<=4&&c>=0&&c<=4)'));
});
test('F33. the bird needs every column, so the whole 75-ball pool is eligible', () => {
  reset(); pat('bird');
  assert.equal(ev('involvedColumns()'), null);
  assert.equal(ev('eligibleBalls().length'), 75);
});
test('F34. selecting the bird resolves through currentPatternDef', () => {
  reset(); pat('bird');
  assert.equal(ev('currentPatternDef().name'), 'The Bird');
  reset();
});
test('F35. the bird has a plain-English caption and a mini diagram', () => {
  assert.match(ev('PATTERNS.bird.cap'), /bottom two rows/i);
  assert.equal(ev('miniCellsFor(PATTERNS.bird).length'), 13);
});
test('F36. the bird appears in the pattern library alongside the others', () => {
  assert.ok(ev("Object.keys(PATTERNS).includes('bird')"));
  assert.ok(ev('Object.keys(PATTERNS).length') >= 21);
});

// ---- Full-screen pattern view (F37-F46) ---------------------------------------------------
test('F37. view model is a 5x5 grid', () => {
  reset(); pat('bird');
  const g = ev('patternViewModel().grid');
  assert.equal(g.length, 5);
  assert.ok(g.every(row => row.length === 5));
});
test('F38. view model exposes the B-I-N-G-O header and the pattern name', () => {
  reset(); pat('bird');
  assert.equal(ev("patternViewModel().letters.join('')"), 'BINGO');
  assert.equal(ev('patternViewModel().name'), 'The Bird');
});
test('F39. bird: 12 squares to call, the center is the free star', () => {
  reset(); pat('bird');
  assert.equal(ev('patternViewModel().needed'), 12);
  assert.equal(ev('patternViewModel().grid[2][2].kind'), 'free');
  assert.equal(ev('patternViewModel().grid[4][0].kind'), 'on');
  assert.equal(ev('patternViewModel().grid[0][0].kind'), 'off');
});
test('F40. free space off: the center is an ordinary square and counts', () => {
  reset(); pat('bird', false);
  assert.equal(ev('patternViewModel().needed'), 13);
  assert.equal(ev('patternViewModel().grid[2][2].kind'), 'on');
});
test('F41. X: 8 squares to call, columns B I G O', () => {
  reset(); pat('x');
  assert.equal(ev('patternViewModel().needed'), 8);
  assert.equal(ev("patternViewModel().columns.join('')"), 'BIGO');
});
test('F42. Any Line and one-row/one-column patterns are flagged as examples', () => {
  reset();
  assert.equal(ev('patternViewModel().example'), true);
  assert.equal(ev('patternViewModel().needed'), null);
  pat('horizontal');
  assert.equal(ev('patternViewModel().example'), true);
  pat('four_corners');
  assert.equal(ev('patternViewModel().example'), false);
  reset();
});
test('F43. summary is plain English (count, plural, free-space note)', () => {
  reset(); pat('bird');
  assert.match(ev('patternViewModel().summary'), /12 squares/);
  assert.match(ev('patternViewModel().summary'), /free/i);
  pat('small_diamond');
  assert.match(ev('patternViewModel().summary'), /4 squares/);
  reset();
});
test('F44. custom patterns work in the view', () => {
  reset();
  ev("S.customPatterns=[{id:'z',name:'Zig',cells:[[0,0],[1,1]]}]; S.pattern='custom:z'; save();");
  assert.equal(ev('patternViewModel().name'), 'Zig');
  assert.equal(ev('patternViewModel().needed'), 2);
  reset();
});
test('F45. index.html has an accessible full-screen pattern dialog with a close button', () => {
  assert.match(html, /id="patternview"[^>]*role="dialog"/);
  assert.match(html, /id="patternview"[^>]*aria-modal="true"/);
  assert.match(html, /id="pvClose"/);
  assert.match(html, /id="pvGrid"/);
});
test('F46. there is a button to open it, and P is its keyboard shortcut', () => {
  assert.match(html, /id="patViewBtn"/);
  assert.match(read('js/app/wire-keyboard.js'), /k==='p'/);
});

// ---- Release housekeeping (F47-F50) ---------------------------------------------------------
test('F47. version was bumped to at least 2.31', () => {
  const [maj, min] = ev('APP_VERSION').split('.').map(Number);
  assert.ok(maj > 2 || (maj === 2 && min >= 31));
});
test('F48. changelog mentions the new features under the current version', () => {
  const v = ev('APP_VERSION');
  const entry = read('CHANGELOG.md').split('## [').find(s => s.startsWith(v + ']'));
  assert.ok(entry, 'entry for ' + v);
  for (const w of [/Parkway/i, /N column/i, /Bird/i, /full-screen/i]) assert.match(entry, w);
});
test('F49. styles define the pattern view overlay', () => {
  assert.match(read('styles.css'), /\.patternview\.show/);
});
test('F50. README test count matches the real number of tests', () => {
  const n = [read('tests/app.test.mjs'), read('tests/features.test.mjs')]
    .reduce((a, s) => a + (s.match(/^test\(/gm) || []).length, 0);
  assert.match(read('README.md'), new RegExp(`${n} tests`));
});
