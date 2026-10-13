/* Banter row: left-aligned text, a speech-bubble + shuffle button on the right. Test-first. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, html } from './helpers.mjs';

const css = read('styles.css');
const rule = sel => { const m = css.match(new RegExp('(?:^|\\n)\\s*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\{([^}]*)\\}')); return m ? m[1] : ''; };
const btn = () => html.match(/<button[^>]*id="cycleBtn"[\s\S]*?<\/button>/)[0];

test('B1. banter text is left-aligned', () => {
  assert.match(rule('.callout'), /text-align:left/);
  assert.doesNotMatch(rule('.callout'), /text-align:center/);
});
test('B2. banter lines start at the left edge of the slot (not centred horizontally)', () => {
  assert.match(rule('.callout'), /justify-content:flex-start/);
});
test('B3. the banter slot keeps its fixed height', () => {
  assert.match(rule('.callout'), /(?:^|;)\s*height:[\d.]+em/);
});
test('B4. the button is in the right-hand grid column, a proper touch target (>= 44px)', () => {
  const col = +rule('.callout-row').match(/grid-template-columns:1fr (\d+)px/)[1];
  assert.ok(col >= 44, 'column ' + col);
  const b = rule('.cyclebtn');
  assert.ok(+b.match(/width:(\d+)px/)[1] >= 44);
  assert.ok(+b.match(/height:(\d+)px/)[1] >= 44);
});
test('B5. the button is vertically centred beside the banter', () => {
  assert.match(rule('.cyclebtn'), /align-self:center/);
});
test('B6. the button shows an SVG icon, not the old ↻ text arrow', () => {
  assert.match(btn(), /<svg/);
  assert.doesNotMatch(btn(), /↻/);
});
test('B7. the icon is a speech bubble with a shuffle inside it', () => {
  assert.match(btn(), /class="i-bubble"/);
  assert.match(btn(), /class="i-shuffle"/);
  // the shuffle sits inside the bubble: it is drawn after it, in the same svg
  assert.ok(btn().indexOf('i-shuffle') > btn().indexOf('i-bubble'));
});
test('B8. the shuffle has two crossing arrows (two lines + two arrowheads)', () => {
  const shuffle = btn().match(/<g class="i-shuffle"[\s\S]*?<\/g>/)[0];
  assert.equal((shuffle.match(/<path/g) || []).length, 4);
});
test('B9. the icon takes the button colour (currentColor), hidden from screen readers', () => {
  assert.match(btn(), /<svg[^>]*aria-hidden="true"/);
  assert.match(btn(), /stroke="currentColor"/);
  assert.match(btn(), /fill="none"/);
});
test('B10. the button keeps its accessible name and tooltip', () => {
  assert.match(btn(), /aria-label="Try another call-out for this number"/);
  assert.match(btn(), /title="Try another call-out for this number"/);
});
test('B11. the icon scales with the button (fixed size in CSS, viewBox in the markup)', () => {
  assert.match(btn(), /viewBox="0 0 24 24"/);
  assert.match(rule('.cyclebtn svg'), /width:\d+px/);
});
test('B12. changelog documents the banter alignment and new icon', () => {
  const top = read('CHANGELOG.md').split('## [2.42]')[0];
  assert.match(top, /left-align/i);
  assert.match(top, /speech bubble/i);
});
