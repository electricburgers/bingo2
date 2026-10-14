/* A random banter line on every call, without repeats until a ball has used them all. Written test-first. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, loadApp } from './helpers.mjs';

const { run: ev } = loadApp();
const ALL = '{classic:true,jersey:true,nerd:true,sports:true}';
const fresh = () => ev(`S.settings.packs=${ALL}; S.calloutIdx={}; S.calloutSeen={}; _variantCache.clear();`);
/* deterministic "random": a counter-based sequence in [0,1) */
const seq = () => ev('(()=>{let i=0; return ()=>((i++*0.6180339887)%1);})()');

test('R1. pickVariantIndex returns a valid index into the ball\'s lines', () => {
  fresh();
  for (let n = 1; n <= 75; n++) { const i = ev(`pickVariantIndex(${n})`), len = ev(`callVariants(${n}).length`); assert.ok(i >= 0 && i < len, `${n}: ${i}/${len}`); }
});
test('R2. a ball with a single line always returns index 0', () => {
  fresh();
  const one = ev('Array.from({length:75},(_,i)=>i+1).filter(n=>callVariants(n).length===1)');
  for (const n of one) assert.equal(ev(`pickVariantIndex(${n})`), 0);
});
test('R3. it takes an injectable random function (so behaviour is testable)', () => {
  fresh();
  assert.equal(ev('pickVariantIndex(7, ()=>0)'), 0);
  fresh();
  const len = ev('callVariants(7).length');
  assert.equal(ev('pickVariantIndex(7, ()=>0.9999)'), len - 1);
});
test('R4. no line repeats for a ball until it has shown every line once (a shuffle bag)', () => {
  fresh();
  const n = 7, len = ev(`callVariants(${n}).length`);
  const seen = new Set();
  for (let k = 0; k < len; k++) seen.add(ev(`callVariants(${n})[pickVariantIndex(${n})]`));
  assert.equal(seen.size, len);
});
test('R5. after a full round it starts again without repeating the line it just showed', () => {
  fresh();
  const n = 7, len = ev(`callVariants(${n})`).length;
  let last;
  for (let k = 0; k < len; k++) last = ev(`callVariants(${n})[pickVariantIndex(${n})]`);
  for (let k = 0; k < 5; k++) {
    const next = ev(`callVariants(${n})[pickVariantIndex(${n})]`);
    assert.notEqual(next, last);
    last = next;
  }
});
test('R6. over many calls every line gets shown (nothing is starved)', () => {
  fresh();
  const n = 4, seen = new Set();
  for (let k = 0; k < 200; k++) seen.add(ev(`callVariants(${n})[pickVariantIndex(${n})]`));
  assert.equal(seen.size, ev(`callVariants(${n}).length`));
});
test('R7. it remembers what it showed in S.calloutSeen (text, so pack toggles cannot confuse it)', () => {
  fresh();
  const line = ev('callVariants(7)[pickVariantIndex(7)]');
  assert.ok([...ev('S.calloutSeen[7]')].includes(line));
});
test('R8. changing packs mid-game does not break the bag', () => {
  fresh();
  for (let k = 0; k < 3; k++) ev('pickVariantIndex(12)');
  ev("S.settings.packs={classic:true,jersey:false,nerd:false,sports:false}; _variantCache.clear();");
  const i = ev('pickVariantIndex(12)');
  assert.ok(i >= 0 && i < ev('callVariants(12).length'));
  fresh();
});
test('R9. different balls keep separate bags', () => {
  fresh();
  const a = ev('callVariants(6)[pickVariantIndex(6)]');
  const seen7 = ev('S.calloutSeen[7]');
  assert.ok(!seen7 || seen7.length === 0);
  assert.ok(a);
});
test('R10. callNext picks a random banter line for the ball it just drew', () => {
  const src = read('js/game/actions.js');
  assert.match(src, /S\.calloutIdx\[n\]=pickVariantIndex\(n\)/);
});
test('R11. the ↻ button still cycles sequentially from the random starting line', () => {
  const src = read('js/ui/ball.js');
  assert.match(src, /S\.calloutIdx\[last\]=\(cur\+1\)%variants\.length/);
});
test('R12. normalizeState makes sure calloutSeen exists', () => {
  ev('delete S.calloutSeen; normalizeState();');
  assert.equal(ev('typeof S.calloutSeen'), 'object');
  fresh();
});
test('R13. clearing all history also clears the shuffle memory', () => {
  const src = read('js/app/wire-settings.js');
  assert.match(src, /S\.calloutSeen=\{\}/);
});
test('R14. a new default state has an empty shuffle memory', () => {
  assert.equal(ev('JSON.stringify(defaultState().calloutSeen)'), '{}');
});
test('R15. the shuffle memory stays small (bounded by the number of lines per ball)', () => {
  fresh();
  for (let k = 0; k < 500; k++) ev('pickVariantIndex(7)');
  assert.ok(ev('S.calloutSeen[7].length') <= ev('callVariants(7).length'));
});
