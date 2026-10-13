/* iPhone safe areas (edge-to-edge) and no double-tap zoom, written test-first. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { join } from 'node:path';
import { read, html, root } from './helpers.mjs';

const css = read('styles.css');
const rule = sel => { const m = css.match(new RegExp('(?:^|\\n)\\s*' + sel.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + '\\{([^}]*)\\}')); return m ? m[1] : ''; };
const jsFiles = () => { const walk = d => readdirSync(join(root, d), { withFileTypes: true }).flatMap(e => e.isDirectory() ? walk(d + '/' + e.name) : [d + '/' + e.name]); return walk('js'); };

// ---- edge-to-edge / safe areas ---------------------------------------------------------------
test('S1. viewport-fit=cover is set so the page can draw under the notch and home bar', () => {
  assert.match(html, /<meta name="viewport"[^>]*viewport-fit=cover/);
});
test('S2. standalone web-app mode with a translucent status bar is enabled', () => {
  assert.match(html, /apple-mobile-web-app-capable" content="yes"/);
  assert.match(html, /apple-mobile-web-app-status-bar-style" content="black-translucent"/);
});
test('S3. the root element paints the theme background (fills status-bar and home-bar zones)', () => {
  assert.match(rule('html'), /background:var\(--bg\)/);
});
test('S4. root fills the full screen height with dvh (not the shrunken small viewport)', () => {
  assert.match(rule('html,body'), /min-height:100dvh/);
  assert.match(rule('html,body'), /min-height:100%/);          // fallback for older browsers
});
test('S5. only env() is used (constant() was removed in iOS 11.2)', () => {
  assert.doesNotMatch(css, /constant\(safe-area/);
  assert.match(css, /env\(safe-area-inset-top/);
  assert.match(css, /env\(safe-area-inset-bottom/);
});
test('S6. insets are applied exactly, never scaled by a multiplier', () => {
  assert.doesNotMatch(css, /safe-area-inset-\w+\s*,\s*0px\)\s*\*/);
});
test('S7. the body pads itself by the top and bottom insets', () => {
  const b = rule('body');
  assert.match(b, /padding-top:[^;]*safe-area-inset-top/);
  assert.match(b, /padding-bottom:[^;]*safe-area-inset-bottom/);
});
test('S8. every full-screen or pinned surface accounts for the insets', () => {
  for (const sel of ['.bigscreen', '.patternview', '.dock', '.drawer-head', '.drawer-body'])
    assert.match(rule(sel), /safe-area-inset/, sel);
  assert.match(rule('.bs-exit'), /safe-area-inset-top/);
  assert.match(rule('.pv-exit'), /safe-area-inset-top/);
});
test('S9. the dock keeps a minimum gap above the home indicator via max()', () => {
  assert.match(rule('.dock'), /max\([^)]*safe-area-inset-bottom/);
});
test('S10. mobile content padding does not add the bottom inset a second time', () => {
  const m = css.match(/@media \(max-width:699px\)\{\s*:root[\s\S]*?\.app\{([^}]*)\}/)[1];
  assert.doesNotMatch(m, /safe-area-inset/);
  assert.match(m, /var\(--dock-h/);
});
test('S11. status bar colour matches the app background', () => {
  assert.match(html, /name="theme-color" content="#15171c"/);
  assert.match(read('manifest.json'), /"theme_color": "#15171c"/);
});

// ---- no double-tap zoom ---------------------------------------------------------------------
test('Z1. html and body use touch-action: manipulation (WebKit: disables double-tap zoom)', () => {
  assert.match(rule('html,body'), /touch-action:manipulation/);
});
test('Z2. every element opts in, since touch-action is not inherited', () => {
  assert.match(rule('*'), /touch-action:manipulation/);
});
test('Z3. pinch-zoom stays available (no touch-action:none, viewport allows scaling)', () => {
  assert.doesNotMatch(css, /touch-action:\s*none/);
  assert.ok(+html.match(/maximum-scale=([\d.]+)/)[1] >= 2);
});
test('Z4. no script cancels touchend (that would swallow rapid second taps on Call)', () => {
  for (const f of jsFiles()) assert.doesNotMatch(read(f), /touchend/, f);
});
test('Z5. changelog documents the safe-area and double-tap changes', () => {
  const top = read('CHANGELOG.md').split('## [2.33]')[0];
  assert.match(top, /double-tap/i);
  assert.match(top, /safe area/i);
});
