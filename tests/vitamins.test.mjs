/* Vitamin banter for B-6 and B-12 (the two B-column balls that are also vitamins). Written test-first. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, loadApp } from './helpers.mjs';

const { run: ev } = loadApp();
const lines = (n, re) => [...ev(`callVariants(${n})`)].filter(s => re.test(s));
const B6 = () => lines(6, /vitamin|pyridoxine/i);
const B12 = () => lines(12, /vitamin|cobalamin|cobalt/i);

test('V1. ball 6 (B-6) has at least three vitamin lines', () => { assert.ok(B6().length >= 3, String(B6().length)); });
test('V2. ball 12 (B-12) has at least three vitamin lines', () => { assert.ok(B12().length >= 3, String(B12().length)); });
test('V3. every vitamin line names its own ball (B-6 or B-12)', () => {
  for (const s of B6()) assert.match(s, /B-6/);
  for (const s of B12()) assert.match(s, /B-12/);
});
test('V4. B-6 banter uses the real facts: pyridoxine, and foods like bananas or chickpeas', () => {
  const all = B6().join(' ');
  assert.match(all, /pyridoxine/i);
  assert.match(all, /banana|chickpea/i);
});
test('V5. B-12 banter uses the real facts: cobalamin / cobalt, and foods like fish, eggs or dairy', () => {
  const all = B12().join(' ');
  assert.match(all, /cobalt/i);
  assert.match(all, /fish|egg|dairy|tuna/i);
});
test('V6. the original classic call-outs stay first, vitamin lines are added after', () => {
  assert.doesNotMatch(ev('callVariants(6)[0]'), /vitamin|pyridoxine/i);
  assert.doesNotMatch(ev('callVariants(12)[0]'), /vitamin|cobalamin|cobalt/i);
});
test('V7. every line fits the 100-character banter slot', () => {
  for (const s of [...B6(), ...B12()]) assert.ok(s.length <= 100, s);
});
test('V8. only balls 6 and 12 get vitamin banter', () => {
  for (let n = 1; n <= 75; n++) if (n !== 6 && n !== 12)
    assert.equal(lines(n, /vitamin|pyridoxine|cobalamin|cobalt/i).length, 0, 'ball ' + n);
});
test('V9. 6 and 12 are B-column balls', () => {
  assert.equal(ev('letterFor(6)'), 'B');
  assert.equal(ev('letterFor(12)'), 'B');
});
test('V10. no duplicate call-out lines anywhere', () => {
  const all = Array.from({ length: 75 }, (_, i) => [...ev(`callVariants(${i + 1})`)]).flat();
  assert.equal(new Set(all).size, all.length);
});
test('V11. changelog documents the vitamin banter', () => {
  assert.match(read('CHANGELOG.md').split('## [2.42]')[0], /B-6|B6/);
});
