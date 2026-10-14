/* Mobile bottom dock (option A: Undo · Pattern · CALL · Auto · Winner), written test-first. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, html, scripts, loadApp } from './helpers.mjs';

const { run: ev } = loadApp();
const css = read('styles.css');

test('D1. dock has five actions in the agreed order', () => {
  assert.equal(ev("DOCK_ACTIONS.map(a=>a.key).join(',')"), 'undo,pattern,call,auto,winner');
});
test('D2. Call is the center slot and the only primary button', () => {
  assert.equal(ev("DOCK_ACTIONS[2].key"), 'call');
  assert.equal(ev("DOCK_ACTIONS.filter(a=>a.primary).length"), 1);
  assert.equal(ev("DOCK_ACTIONS.find(a=>a.primary).key"), 'call');
});
test('D3. Winner sits in the far corner, away from Call', () => {
  assert.equal(ev("DOCK_ACTIONS[4].key"), 'winner');
});
test('D4. every action has an icon, a visible label and a spoken label', () => {
  assert.ok(ev("DOCK_ACTIONS.every(a=>a.icon&&a.label&&a.aria)"));
});
test('D5. every action is wired to an existing game function', () => {
  for (const fn of ev("DOCK_ACTIONS.map(a=>a.fn)"))
    assert.equal(ev(`typeof ${fn}`), 'function', fn);
  assert.equal(ev("DOCK_ACTIONS.map(a=>a.fn).join(',')"), 'undo,togglePatternView,callNext,toggleAuto,markWinner');
});
test('D6. index.html has a labelled nav#dock containing every button id', () => {
  assert.match(html, /<nav[^>]*id="dock"[^>]*aria-label="Quick actions"/);
  const nav = html.match(/<nav[^>]*id="dock"[\s\S]*?<\/nav>/)[0];
  for (const id of ev("DOCK_ACTIONS.map(a=>a.id)")) assert.ok(nav.includes(`id="${id}"`), id);
});
test('D7. dock buttons carry aria-labels in the markup', () => {
  const nav = html.match(/<nav[^>]*id="dock"[\s\S]*?<\/nav>/)[0];
  assert.equal((nav.match(/aria-label=/g) || []).length, 6); // nav + 5 buttons
});
test('D8. dock is hidden by default and only shown below the 700px two-column breakpoint', () => {
  assert.match(css, /\.dock\{[^}]*display:none/);
  assert.match(css, /@media[^{]*\(max-width:699px\)[^{]*\{[^@]*\.dock\{[^}]*display:flex/);
});
test('D9. dock is pinned to the bottom and clears the iPhone home bar', () => {
  assert.match(css, /\.dock\{[^}]*position:fixed[^}]*bottom:0/);
  assert.match(css, /\.dock\{[^}]*env\(safe-area-inset-bottom/);
});
test('D10. dock sits below the overlays (z-index < 60) so big screen / drawer cover it', () => {
  const z = +css.match(/\.dock\{[^}]*z-index:(\d+)/)[1];
  assert.ok(z < 60 && z > 0);
});
test('D11. page reserves room under the content so the dock never hides the last card', () => {
  assert.match(css, /@media[^{]*\(max-width:699px\)[^{]*\{[^@]*\.app\{[^}]*padding-bottom:calc\(var\(--dock-h/);
});
test('D12. touch targets are at least 48px tall and Call is larger', () => {
  const h = +css.match(/\.dock-btn\{[^}]*min-height:(\d+)px/)[1];
  assert.ok(h >= 48);
  assert.match(css, /\.dock-btn\.primary\{/);
});
test('D13. Auto button state: idle / running / paused', () => {
  assert.equal(ev("autoOn=false;autoPaused=false;dockAutoState().label"), 'Auto');
  assert.equal(ev("autoOn=true;autoPaused=false;dockAutoState().label"), 'Pause');
  assert.equal(ev("autoOn=true;autoPaused=true;dockAutoState().label"), 'Resume');
  ev('autoOn=false;autoPaused=false;');
});
test('D14. Auto is shown as pressed only while it is actively running', () => {
  assert.equal(ev("autoOn=true;autoPaused=false;dockAutoState().pressed"), true);
  assert.equal(ev("autoOn=true;autoPaused=true;dockAutoState().pressed"), false);
  assert.equal(ev("autoOn=false;dockAutoState().pressed"), false);
  ev('autoOn=false;autoPaused=false;');
});
test('D15. auto-call start/pause/resume/stop all re-sync the dock', () => {
  const src = read('js/game/auto.js');
  assert.ok((src.match(/syncDock\(\)/g) || []).length >= 4);
});
test('D16. dock.js and wire-dock are loaded by index.html, init wires the dock', () => {
  assert.ok(scripts.includes('js/app/dock.js'));
  assert.match(read('js/main.js'), /wireDock\(\)/);
});
test('D17. the dock files are precached for offline use', () => {
  ev(read('js/config/precache.js'));
  assert.ok(ev('PRECACHE_URLS').includes('./js/app/dock.js'));
});
test('D18. changelog documents the dock', () => {
  assert.match(read('CHANGELOG.md').split('## [2.31]')[0], /dock/i);
});
test('D19. toasts lift above the dock (the mobile override comes after the base .toast rule)', () => {
  const base = css.indexOf('.toast{position:fixed');
  const lift = css.lastIndexOf('.toast{bottom:calc(var(--dock-h');
  assert.ok(base > -1 && lift > base);
});

// ---- bigger, thumb-friendly Call button (v2.45) ------------------------------------------------
const pr = () => css.match(/\.dock-btn\.primary\{([^}]*)\}/)[1];
const num = (s, re) => +s.match(re)[1];

test('D20. the Call button is at least 70px tall (up from 60) for a thumb', () => {
  assert.ok(num(pr(), /min-height:(\d+)px/) >= 70);
});
test('D21. the Call button is clearly wider than the others (flex >= 1.8 vs 1)', () => {
  assert.ok(num(pr(), /flex:([\d.]+)/) >= 1.8);
});
test('D22. the Call button rises above the dock edge so it stands out (negative top margin)', () => {
  const m = num(pr(), /margin-top:-(\d+)px/);
  assert.ok(m >= 8 && m <= 20, 'rise ' + m);
});
test('D23. its icon and label are bigger than the other dock buttons', () => {
  assert.ok(num(css.match(/\.dock-btn\.primary \.d-icon\{([^}]*)\}/)[1], /font-size:([\d.]+)rem/) >= 1.7);
  assert.ok(num(pr(), /font-size:([\d.]+)rem/) >= .85);
});
test('D24. it has a soft shadow and a rounder shape so it reads as the main button', () => {
  assert.match(pr(), /box-shadow:/);
  assert.ok(num(pr(), /border-radius:(\d+)px/) >= 18);
});
test('D25. raising it does not grow the dock: effective height still fits --dock-h', () => {
  const h = num(pr(), /min-height:(\d+)px/) - num(pr(), /margin-top:-(\d+)px/);
  const dockH = num(css, /--dock-h:(\d+)px/);
  assert.ok(h + 16 <= dockH, `${h}+16 vs ${dockH}`);
});
test('D26. the other dock buttons keep their size (>= 48px) so nothing else shrinks', () => {
  assert.ok(num(css.match(/\.dock-btn\{([^}]*)\}/)[1], /min-height:(\d+)px/) >= 48);
});
test('D27. changelog documents the bigger Call button', () => {
  const top = read('CHANGELOG.md').split('## [2.44]')[0];
  assert.match(top, /Call button/i);
  assert.match(top, /dock/i);
});

// ---- dock on landscape phones (v2.46) ----------------------------------------------------------
const LAND = '\\(orientation:landscape\\)\\s+and\\s+\\(max-height:560px\\)\\s+and\\s+\\(pointer:coarse\\)';
test('D28. the dock shows on landscape phones: a media query for landscape + short + touch turns it on', () => {
  assert.match(css, new RegExp('@media[^{]*' + LAND + '[^{]*\\{[^@]*\\.dock\\{[^}]*display:flex'));
});
test('D29. the same rule still covers portrait phones (max-width 699px) in one combined query', () => {
  assert.match(css, new RegExp('@media[^{]*\\(max-width:699px\\)\\s*,\\s*' + LAND));
});
test('D30. touch is required, so a short desktop window does not get the dock', () => {
  assert.match(css, /\(pointer:coarse\)/);
  // the landscape clause always carries pointer:coarse
  for (const m of css.matchAll(/@media[^{]*\(orientation:landscape\)[^{]*\{[^@]*\.dock\{/g)) assert.match(m[0], /pointer:coarse/);
});
test('D31. content and toasts clear the dock in landscape too (same combined query)', () => {
  assert.match(css, new RegExp('@media[^{]*' + LAND + '[^{]*\\{[^@]*\\.app\\{[^}]*padding-bottom:calc\\(var\\(--dock-h'));
  assert.match(css, new RegExp('@media[^{]*' + LAND + '[^{]*\\{\\s*\\.toast\\{bottom:calc\\(var\\(--dock-h'));
});
test('D32. the landscape dock is compact: shorter --dock-h (<= 64px) and 44px+ buttons', () => {
  const m = css.match(new RegExp('@media\\s*' + LAND + '\\s*\\{([^@]*?)\\n  \\}'))[1];
  assert.ok(+m.match(/--dock-h:(\d+)px/)[1] <= 64);
  assert.ok(+m.match(/\.dock-btn\{[^}]*min-height:(\d+)px/)[1] >= 44);
  assert.ok(+m.match(/\.dock-btn\.primary\{[^}]*min-height:(\d+)px/)[1] >= 54);
});
test('D33. the compact landscape Call button still fits the dock (height minus rise + 8 <= --dock-h)', () => {
  const m = css.match(new RegExp('@media\\s*' + LAND + '\\s*\\{([^@]*?)\\n  \\}'))[1];
  const h = +m.match(/\.dock-btn\.primary\{[^}]*min-height:(\d+)px/)[1] - +m.match(/\.dock-btn\.primary\{[^}]*margin-top:-(\d+)px/)[1];
  assert.ok(h + 16 <= +m.match(/--dock-h:(\d+)px/)[1] + 8, 'effective ' + h);
});
test('D34. side safe areas are respected so the notch / home bar never hides a dock button', () => {
  assert.match(css.match(/\.dock\{[^}]*\}/)[0], /safe-area-inset-left/);
  assert.match(css.match(/\.dock\{[^}]*\}/)[0], /safe-area-inset-right/);
});
test('D35. the changelog documents the landscape dock', () => {
  assert.match(read('CHANGELOG.md').split('## [2.45]')[0], /landscape/i);
});
