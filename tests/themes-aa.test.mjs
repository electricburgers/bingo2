/* Every theme meets WCAG AA (4.5:1 text, 3:1 graphics) and stays colourful. Written test-first. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, loadApp } from './helpers.mjs';

const { run: ev } = loadApp();
const KEYS = ev("Object.keys(THEMES).join(',')").split(',');
const theme = k => JSON.parse(ev(`JSON.stringify(THEMES['${k}'])`));
const contrast = (a, b) => ev(`_contrast('${a}','${b}')`);
const surfaces = t => [t.vars['--bg'], t.vars['--surface'], t.vars['--surface-2']];
const rgb = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const sat = h => { const [r, g, b] = rgb(h).map(x => x / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2; return mx === mn ? 0 : (mx - mn) / (1 - Math.abs(2 * l - 1)); };
const each = fn => KEYS.forEach(k => fn(k, theme(k)));

test('A1. the contrast target is WCAG AA (4.5:1) and the AAA constant is gone', () => {
  assert.equal(ev('AA_TARGET'), 4.5);
  assert.equal(ev("typeof AAA_TARGET"), 'undefined');
});
test('A2. no source file still refers to AAA_TARGET', () => {
  for (const f of ['js/util/color.js', 'js/ui/theme.js']) assert.doesNotMatch(read(f), /AAA_TARGET/, f);
});
test('A3. theme names no longer advertise AAA', () => {
  each((k, t) => assert.doesNotMatch(t.label, /AAA/, k));
});
test('A4. all nine themes are present, each with 7 variables and 5 letter colours', () => {
  assert.equal(KEYS.length, 9);
  each((k, t) => { assert.equal(Object.keys(t.vars).length, 7, k); assert.equal(Object.keys(t.letters).join(''), 'BINGO', k); });
});
test('A5. body text is AA on the page, card and chip backgrounds in every theme', () => {
  each((k, t) => surfaces(t).forEach(s => assert.ok(contrast(t.vars['--text'], s) >= 4.5, `${k} text on ${s}`)));
});
test('A6. secondary (muted) text is AA on every surface as authored — no runtime rescue needed', () => {
  each((k, t) => surfaces(t).forEach(s => assert.ok(contrast(t.vars['--muted'], s) >= 4.5, `${k} muted on ${s}`)));
});
test('A7. the accent colour is at least 3:1 against the page (graphics / focus rings)', () => {
  each((k, t) => assert.ok(contrast(t.vars['--accent'], t.vars['--bg']) >= 3, k));
});
test('A8. every letter colour is AA on every surface as authored', () => {
  each((k, t) => Object.entries(t.letters).forEach(([L, h]) => surfaces(t).forEach(s => assert.ok(contrast(h, s) >= 4.5, `${k} ${L} ${h} on ${s}`))));
});
test('A9. AA keeps the designed colours: the derived letter text colour equals the letter colour', () => {
  each((k, t) => Object.entries(t.letters).forEach(([L, h]) => {
    assert.equal(ev(`accessibleColor('${h}', ${JSON.stringify(surfaces(t))}, AA_TARGET)`), h, `${k} ${L}`);
  }));
});
test('A10. letter badges are AA and keep the exact letter colour as their fill', () => {
  each((k, t) => Object.entries(t.letters).forEach(([L, h]) => {
    const b = ev(`accessibleBadge('${h}', AA_TARGET)`);
    assert.equal(b.bg, h, `${k} ${L}`);
    assert.ok(contrast(b.bg, b.text) >= 4.5, `${k} ${L}`);
  }));
});
test('A11. derived accent text, success and warning colours are AA on every surface', () => {
  each((k, t) => {
    const ss = surfaces(t);
    assert.ok(ev(`accessibleColor('${t.vars['--accent']}', ${JSON.stringify(ss)}, AA_TARGET)`) && ss.every(s => contrast(ev(`accessibleColor('${t.vars['--accent']}', ${JSON.stringify(ss)}, AA_TARGET)`), s) >= 4.5), k);
    assert.ok(ss.every(s => contrast(ev(`accessibleColor('#ff6b6b', ${JSON.stringify(ss)}, AA_TARGET)`), s) >= 4.5), k + ' warn');
    assert.ok(ss.every(s => contrast(ev(`accessibleColor('#3ddc84', ${JSON.stringify(ss)}, AA_TARGET)`), s) >= 4.5), k + ' good');
  });
});
test('A12. not drab: every letter colour is vivid (saturation >= 0.5)', () => {
  each((k, t) => Object.entries(t.letters).forEach(([L, h]) => {
    if (k === 'cbTritan' && L === 'N') return; // white is the one tritanopia-safe separator for N
    assert.ok(sat(h) >= 0.5, `${k} ${L} ${h} sat ${sat(h).toFixed(2)}`);
  }));
});
test('A13. not drab: every accent is vivid (saturation >= 0.6)', () => {
  each((k, t) => assert.ok(sat(t.vars['--accent']) >= 0.6, k));
});
test('A14. not drab: backgrounds carry colour instead of neutral grey (except High Contrast)', () => {
  each((k, t) => {
    if (k === 'contrast') return;
    const c = rgb(t.vars['--bg']); assert.ok(Math.max(...c) - Math.min(...c) >= 12, k);
  });
});
test('A15. the five letters of a theme are clearly different colours', () => {
  each((k, t) => {
    const cs = Object.values(t.letters).map(rgb);
    for (let i = 0; i < 5; i++) for (let j = i + 1; j < 5; j++)
      assert.ok(Math.hypot(...cs[i].map((v, n) => v - cs[j][n])) >= 55, `${k} ${i}-${j}`);
  });
});
test('A16. High Contrast stays maximum contrast (pure black / white)', () => {
  const t = theme('contrast');
  assert.equal(t.vars['--bg'], '#000000');
  assert.ok(contrast(t.vars['--text'], t.vars['--bg']) >= 19);
});
test('A17. the light themes still use a dark text colour on a light page', () => {
  for (const k of ['light', 'parchment']) assert.ok(ev(`_luminance(THEMES['${k}'].vars['--bg'])`) > 0.8 && ev(`_luminance(THEMES['${k}'].vars['--text'])`) < 0.05, k);
});
test('A18. changelog documents the AA switch', () => {
  assert.match(read('CHANGELOG.md').split('## [2.35]')[0], /WCAG AA/);
});
