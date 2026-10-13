/* No sideways scrolling in the phone PWA, written test-first. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, html } from './helpers.mjs';

const css = read('styles.css');
const rule = sel => { const m = css.match(new RegExp('(?:^|\\n)\\s*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\{([^}]*)\\}')); return m ? m[1] : ''; };

test('H1. html and body clip horizontal overflow', () => {
  assert.match(rule('html,body'), /overflow-x:hidden/);
});
test('H2. body blocks sideways rubber-banding / edge-swipe chaining', () => {
  assert.match(rule('body'), /overscroll-behavior-x:none/);
});
test('H3. body only allows vertical panning, but pinch-zoom still works', () => {
  assert.match(rule('body'), /touch-action:pan-y pinch-zoom/);
});
test('H4. no scroller uses bare "overflow:auto" (that allows sideways scrolling)', () => {
  assert.doesNotMatch(css, /overflow:\s*auto/);
});
test('H5. the log, pattern tiles and settings drawer scroll vertically only', () => {
  for (const sel of ['.log', '.pat-tiles', '.drawer-body']) {
    assert.match(rule(sel), /overflow-y:auto/, sel);
    assert.match(rule(sel), /overflow-x:hidden/, sel);
  }
});
test('H6. full-screen pattern view cannot scroll sideways', () => {
  assert.match(rule('.patternview'), /overflow-x:hidden/);
});
test('H7. zooming is still allowed (viewport maximum-scale >= 2)', () => {
  assert.ok(+html.match(/maximum-scale=([\d.]+)/)[1] >= 2);
});
test('H8. changelog documents the change', () => {
  assert.match(read('CHANGELOG.md').split('## [2.32]')[0], /horizontal|sideways/i);
});
