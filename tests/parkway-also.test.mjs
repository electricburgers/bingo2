/* "Also ends in the ball number" Parkway banter: every exit whose number ends in a ball number gets a line
   on that ball. Exits were cross-checked against two sources (Wikipedia + eastcoastroads.com north/south
   lists); only exits both agree on, with a plain (unlettered, unrenumbered) number, are used. Test-first. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, loadApp } from './helpers.mjs';

const { run: ev } = loadApp();
const EXPECT = {"1": [11, 41, 81, 91, 141, 151, 161, 171], "2": [52, 82, 102, 132, 172], "3": [13, 63, 83, 123, 143, 153, 163], "4": [44, 74, 114, 124, 144, 154], "5": [25, 105, 135, 145], "6": [36, 116, 136, 156, 166], "7": [17, 37, 67, 77, 117, 127, 137, 147, 157], "8": [38, 48, 58, 98, 138, 148, 168], "9": [29, 69, 109, 129, 149, 159], "14": [114], "16": [116], "17": [117], "20": [120], "23": [123], "24": [124], "27": [127], "29": [129], "32": [132], "35": [135], "36": [136], "37": [137], "38": [138], "40": [140], "41": [141], "43": [143], "44": [144], "45": [145], "47": [147], "48": [148], "49": [149], "50": [150], "51": [151], "53": [153], "54": [154], "56": [156], "57": [157], "59": [159], "60": [160], "61": [161], "63": [163], "66": [166], "68": [168], "71": [171], "72": [172]};
const BLANK = [10,12,15,18,19,21,22,25,26,28,30,31,33,34,39,42,46,52,55,58,62,64,65,67,69,70,73,74,75];
const also = n => [...ev(`callVariants(${n})`)].filter(s => / ends in \d+ too — /.test(s));
const ALL_EXITS = [...new Set(Object.values(EXPECT).flat())].sort((a, b) => a - b);
/* Plain exits NOT used because only one source has them, or they are lettered / renumbered. */
const EXCLUDED = [12, 88, 89, 100, 118, 125, 128, 130, 131, 139, 142, 155, 158, 165];

test('P1. every ball gets exactly the exits that end in its number, in ascending order', () => {
  for (const [b, exits] of Object.entries(EXPECT)) {
    const got = also(b).map(s => +s.match(/^Parkway Exit (\d+) ends in/)[1]);
    assert.deepEqual(got, exits, 'ball ' + b);
  }
});
test('P2. 92 lines in total across 61 exits', () => {
  const lines = Array.from({ length: 75 }, (_, i) => also(i + 1)).flat();
  assert.equal(lines.length, 92);
  assert.equal(ALL_EXITS.length, 61);
});
test('P3. balls with no matching exit get no "ends in" line', () => {
  for (const b of Object.keys(Array.from({ length: 75 })).map(i => +i + 1))
    if (!(b in EXPECT)) assert.equal(also(b).length, 0, 'ball ' + b);
});
test('P4. each line names the exit and the ball it ends in, and the digits really do end that way', () => {
  for (let n = 1; n <= 75; n++) for (const s of also(n)) {
    const [, e, b] = s.match(/^Parkway Exit (\d+) ends in (\d+) too — /);
    assert.equal(+b, n);
    assert.ok(e.endsWith(b) && e !== b, s);
  }
});
test('P5. the exit with the same number as a ball is never listed as an "ends in" line on itself', () => {
  for (let n = 1; n <= 75; n++) assert.ok(!also(n).some(s => s.startsWith(`Parkway Exit ${n} ends`)), 'ball ' + n);
});
test('P6. PARKWAY_ALSO has a short blurb (<= 60 chars) for exactly the exits that land on a ball', () => {
  assert.deepEqual([...ev("Object.keys(PARKWAY_ALSO).map(Number).sort((a,b)=>a-b)")], ALL_EXITS);
  for (const e of ALL_EXITS) assert.ok(ev(`PARKWAY_ALSO[${e}]`).length <= 60, 'exit ' + e);
});
test('P7. every line fits the 100-character banter slot', () => {
  for (let n = 1; n <= 75; n++) for (const s of also(n)) assert.ok(s.length <= 100, s);
});
test('P8. unverified exits are not used (single-source, lettered or renumbered)', () => {
  for (const e of EXCLUDED) assert.ok(!ALL_EXITS.includes(e), String(e));
  for (const e of EXCLUDED) assert.equal(ev(`PARKWAY_ALSO[${e}]`), undefined, String(e));
});
test('P9. Exit 12 (entrance-only, not a real exit) no longer has its own banter', () => {
  assert.equal(ev('PARKWAY_EXITS[12]'), undefined);
  assert.equal(ev('callVariants(12).some(s=>/Parkway Exit 12\\b/.test(s))'), false);
});
test('P10. classic lingo stays first, then the ball\'s own exit line, then the "ends in" lines', () => {
  const v = [...ev('callVariants(13)')];
  assert.doesNotMatch(v[0], /Parkway/);
  assert.match(v[v.length - 2] + v[v.length - 1], /Parkway Exit 13 —/);
  const v7 = [...ev('callVariants(7)')];
  assert.ok(v7.slice(-9).every(s => / ends in 7 too — /.test(s)));
  const i = v.findIndex(s => /^Parkway Exit 13 —/.test(s));
  assert.ok(v.slice(0, i).every(s => !/ ends in /.test(s)));
});
test('P11. your own MY_CALLS still go first', () => {
  ev("MY_CALLS[7]=['Mine first']; _variantCache.clear();");
  assert.equal(ev('callVariants(7)[0]'), 'Mine first');
  ev('delete MY_CALLS[7]; _variantCache.clear();');
});
test('P12. no duplicate call-out lines anywhere', () => {
  const all = Array.from({ length: 75 }, (_, i) => [...ev(`callVariants(${i + 1})`)]).flat();
  assert.equal(new Set(all).size, all.length);
});
test('P13. a few facts: 142-style two-ball exits show up on both balls', () => {
  assert.ok(also(2).some(s => /Exit 132 ends in 2 /.test(s)) && also(32).some(s => /Exit 132 ends in 32 /.test(s)));
  assert.ok(also(5).some(s => /Exit 105 ends in 5 .*trucks/i.test(s)));
});
test('P14. the data file records its sources', () => {
  const src = read('js/data/parkway-exits.js');
  assert.match(src, /Wikipedia/);
  assert.match(src, /eastcoastroads/);
});
test('P15. changelog documents the new lines and the Exit 12 correction', () => {
  const top = read('CHANGELOG.md').split('## [2.40]')[0];
  assert.match(top, /ends in/i);
  assert.match(top, /Exit 12/);
});
