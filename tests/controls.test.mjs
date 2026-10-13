/* Touch ergonomics: tight gap above Call Next Ball and a bigger, easier-to-grab slider. Test-first. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { read } from './helpers.mjs';

const css = read('styles.css');
const rule = sel => { const m = css.match(new RegExp('(?:^|\\n)\\s*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\{([^}]*)\\}')); return m ? m[1] : ''; };
const px = (r, prop) => +r.match(new RegExp(prop + ':(-?[\\d.]+)px'))[1];

// ---- gap above Call Next Ball ------------------------------------------------------------------
test('C1. the Call button sits at most 8px below the content above it', () => {
  assert.ok(px(rule('.call-btn'), 'margin-top') <= 8);
});
test('C2. the empty draw-scope line takes no space', () => {
  assert.match(css, /\.drawscope:empty\{display:none\}/);
});
test('C3. the ball-wrap gap stays small (<= 6px)', () => {
  assert.ok(px(rule('.ball-wrap'), 'gap') <= 6);
});
test('C4. the draw-scope hint is tight when it is shown', () => {
  assert.ok(px(rule('.drawscope'), 'margin-top') <= 2);
});

// ---- bigger slider ---------------------------------------------------------------------------
test('C5. sliders are custom-drawn (appearance:none) so the thumb size is ours', () => {
  assert.match(rule('input[type=range]'), /appearance:none/);
});
test('C6. the touch target is tall: slider height >= 40px', () => {
  assert.ok(px(rule('input[type=range]'), 'height') >= 40);
});
test('C7. the thumb is at least 30px wide and tall in WebKit (iOS Safari / Chrome)', () => {
  const r = rule('input[type=range]::-webkit-slider-thumb');
  assert.ok(px(r, 'width') >= 30); assert.ok(px(r, 'height') >= 30);
  assert.match(r, /border-radius:50%/);
});
test('C8. the thumb is at least 30px wide and tall in Firefox', () => {
  const r = rule('input[type=range]::-moz-range-thumb');
  assert.ok(px(r, 'width') >= 30); assert.ok(px(r, 'height') >= 30);
});
test('C9. the thumb is vertically centred on the track (negative margin-top in WebKit)', () => {
  const thumb = rule('input[type=range]::-webkit-slider-thumb');
  const track = rule('input[type=range]::-webkit-slider-runnable-track');
  const th = px(thumb, 'height'), tr = px(track, 'height') + 2; // + 1px border each side
  assert.ok(Math.abs(px(thumb, 'margin-top') + (th - tr) / 2) <= 1);
});
test('C10. the track is a visible, thicker bar (>= 8px) in both engines', () => {
  assert.ok(px(rule('input[type=range]::-webkit-slider-runnable-track'), 'height') >= 8);
  assert.ok(px(rule('input[type=range]::-moz-range-track'), 'height') >= 8);
});
test('C11. the thumb stands out: accent fill with a ring, in both engines', () => {
  for (const sel of ['input[type=range]::-webkit-slider-thumb', 'input[type=range]::-moz-range-thumb']) {
    const r = rule(sel);
    assert.match(r, /background:var\(--accent\)/, sel);
    assert.match(r, /box-shadow:/, sel);
  }
});
test('C12. changelog documents the tighter gap and bigger slider', () => {
  const top = read('CHANGELOG.md').split('## [2.39]')[0];
  assert.match(top, /slider/i);
  assert.match(top, /gap/i);
});
