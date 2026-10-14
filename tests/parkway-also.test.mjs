/* "Also ends in the ball number" Parkway banter: every exit whose number ends in a ball number gets a line
   on that ball. Exits were cross-checked against two sources (Wikipedia + eastcoastroads.com north/south
   lists); only exits both agree on, with a plain (unlettered, unrenumbered) number, are used. Test-first. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, loadApp } from './helpers.mjs';

const { run: ev } = loadApp();
const EXPECT = {"1": [81, 91, 131, 141, 151, 161, 171], "2": [82, 102, 132, 142, 172], "3": [83, 123, 143, 153, 163], "4": [114, 124, 144, 154], "5": [105, 125, 135, 145, 155, 165], "6": [116, 136, 156, 166], "7": [77, 117, 127, 137, 147, 157], "8": [98, 138, 148, 168], "9": [89, 109, 129, 139, 149, 159], "14": [114], "16": [116], "17": [117], "20": [120], "23": [123], "24": [124], "25": [125], "27": [127], "29": [129], "30": [130], "31": [131], "32": [132], "35": [135], "36": [136], "37": [137], "38": [138], "39": [139], "40": [140], "41": [141], "42": [142], "43": [143], "44": [144], "45": [145], "47": [147], "48": [148], "49": [149], "50": [150], "51": [151], "53": [153], "54": [154], "55": [155], "56": [156], "57": [157], "59": [159], "60": [160], "61": [161], "63": [163], "65": [165], "66": [166], "68": [168], "71": [171], "72": [172]};
const BLANK = [10,12,15,18,19,21,22,25,26,28,30,31,33,34,39,42,46,52,55,58,62,64,65,67,69,70,73,74,75];
const also = n => [...ev(`callVariants(${n})`)].filter(s => / ends in \d+ too — /.test(s));
const ALL_EXITS = [...new Set(Object.values(EXPECT).flat())].sort((a, b) => a - b);
/* Exits NOT used: entrance-only (12), renumbered (88), no ball to land on (100), or only ONE source has them (118, 128, 158). */
const EXCLUDED = [12, 88, 100, 118, 128, 158];

test('P1. every ball gets exactly the exits that end in its number, in ascending order', () => {
  for (const [b, exits] of Object.entries(EXPECT)) {
    const got = also(b).map(s => +s.match(/^Parkway Exit (\d+) ends in/)[1]);
    assert.deepEqual(got, exits, 'ball ' + b);
  }
});
test('P2. 89 lines in total across 52 exits', () => {
  const lines = Array.from({ length: 75 }, (_, i) => also(i + 1)).flat();
  assert.equal(lines.length, 89);
  assert.equal(ALL_EXITS.length, 52);
});
test('P2b. exits 1-75 stay on their own ball only: no "ends in" line uses an exit under 76', () => {
  for (let n = 1; n <= 75; n++) for (const s of also(n)) assert.ok(+s.match(/^Parkway Exit (\d+)/)[1] > 75, s);
  assert.ok(ev('Object.keys(PARKWAY_ALSO).every(k=>+k>75)'));
});
test('P2c. Exit 11 is on ball 11 only (not on ball 1); likewise 25, 38, 63, 74...', () => {
  for (const [e, b] of [[11, 1], [13, 3], [17, 7], [25, 5], [29, 9], [36, 6], [37, 7], [38, 8], [41, 1], [44, 4], [48, 8], [52, 2], [58, 8], [63, 3], [67, 7], [69, 9], [74, 4]])
    assert.ok(!also(b).some(s => s.startsWith(`Parkway Exit ${e} `)), `exit ${e} on ball ${b}`);
  assert.ok(ev('callVariants(11)').some(s => /^Parkway Exit 11 — /.test(s)));
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
test('P8. unverified exits are not used (single-source, renumbered or entrance-only)', () => {
  for (const e of EXCLUDED) assert.ok(!ALL_EXITS.includes(e), String(e));
  for (const e of EXCLUDED) assert.equal(ev(`PARKWAY_ALSO[${e}]`), undefined, String(e));
});
test('P8b. the extra 1xx exits are in: 142 on balls 2 and 42, 155 on 55, 165 on 65, 125 on 25, 131 on 31, 139 on 39, 130 on 30, 89 on 9', () => {
  for (const [e, balls] of [[142, [2, 42]], [155, [5, 55]], [165, [5, 65]], [125, [5, 25]], [131, [1, 31]], [139, [9, 39]], [130, [30]], [89, [9]]])
    for (const b of balls) assert.ok(also(b).some(s => s.startsWith(`Parkway Exit ${e} ends in ${b} too`)), `exit ${e} on ball ${b}`);
});
test('P8c. ball 66 uses Exit 166, ball 68 uses 168, ball 72 uses 172', () => {
  for (const [b, e] of [[66, 166], [68, 168], [72, 172]]) assert.ok(also(b).some(s => s.startsWith(`Parkway Exit ${e} ends in ${b} too`)));
});
test('P9. Exit 12 (entrance-only, not a real exit) no longer has its own banter', () => {
  assert.equal(ev('PARKWAY_EXITS[12]'), undefined);
  assert.equal(ev('callVariants(12).some(s=>/Parkway Exit 12\\b/.test(s))'), false);
});
test('P10. classic lingo stays first; within the Jersey pack a ball\'s own exit line comes before its "ends in" lines', () => {
  const v = [...ev('callVariants(13)')];
  assert.doesNotMatch(v[0], /Parkway/);
  const own = v.findIndex(s => /^Parkway Exit 13 —/.test(s));
  assert.ok(own > 0);
  assert.ok(v.slice(0, own).every(s => !/ ends in /.test(s)));
  const v7 = [...ev('callVariants(7)')];
  const firstEnds = v7.findIndex(s => / ends in 7 too — /.test(s));
  const ends = v7.filter(s => / ends in 7 too — /.test(s));
  assert.equal(ends.length, 6);
  assert.deepEqual(v7.slice(firstEnds, firstEnds + 6), ends);          // contiguous, ascending exits
  assert.ok(v7.slice(0, firstEnds).every(s => !/ ends in /.test(s)));
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
