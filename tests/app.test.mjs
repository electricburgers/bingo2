/* Run with: node --test tests/
   Loads the real browser scripts (in index.html order, minus main.js) into a vm sandbox with a
   tiny DOM stub, so pure logic is tested against the shipped code, not a copy. */
import test from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = p => readFileSync(join(root, p), 'utf8');
const html = read('index.html');
const scripts = [...html.matchAll(/<script src="([^"]+)"/g)].map(m => m[1]);

function loadApp(storage = {}) {
  const noop = () => {};
  const sandbox = {
    console, Intl, Math, Date, JSON, Set, Map, Array, Object, Number, String, Promise, Error,
    localStorage: { getItem: k => storage[k] ?? null, setItem: (k, v) => { storage[k] = v; } },
    document: { getElementById: () => null, querySelector: () => null, querySelectorAll: () => [],
                addEventListener: noop, visibilityState: 'visible', documentElement: { style: { setProperty: noop } } },
    addEventListener: noop, navigator: {}, setTimeout, clearTimeout,
  };
  sandbox.self = sandbox; sandbox.window = sandbox;
  const ctx = vm.createContext(sandbox);
  for (const s of scripts.filter(s => s !== 'js/main.js')) vm.runInContext(read(s), ctx, { filename: s });
  return { run: code => vm.runInContext(code, ctx), ctx };
}

const app = loadApp();
const ev = app.run;

// ---- packaging / offline ------------------------------------------------------------------
test('1. version is MAJOR.MINOR and set in one place', () => {
  assert.match(ev('APP_VERSION'), /^\d+\.\d+$/);
  assert.doesNotMatch(html, /Bingo Caller v\d/);          // About reads the version at runtime
});
test('2. every script in index.html exists on disk', () => {
  for (const s of scripts) assert.ok(existsSync(join(root, s)), s);
});
test('3. every js file on disk is loaded by index.html (no orphans)', () => {
  const walk = d => readdirSync(join(root, d)).flatMap(n => statSync(join(root, d, n)).isDirectory() ? walk(d + '/' + n) : [d + '/' + n]);
  assert.deepEqual(walk('js').filter(f => !scripts.includes(f) && f !== 'js/config/precache.js'), []);
});
test('4. precache list covers index, styles, manifest, sw and all scripts', () => {
  ev(read('js/config/precache.js')); // loaded by sw.js, not the page
  const urls = ev('PRECACHE_URLS');
  for (const u of ['./', './index.html', './styles.css', './manifest.json', './sw.js', ...scripts.map(s => './' + s)])
    assert.ok(urls.includes(u), u);
});
test('5. page makes no external requests (no Google Fonts, CDNs)', () => {
  for (const f of ['index.html', 'styles.css', ...scripts]) {
    const refs = read(f).match(/(?:src|href)\s*=\s*["']https?:\/\/|url\(\s*["']?https?:\/\/|@import\s+["']?https?:/g);
    assert.equal(refs, null, f);
  }
  assert.doesNotMatch(read('styles.css') + html, /fonts\.(googleapis|gstatic)\.com/);
});
test('6. CSP keeps everything same-origin', () => {
  assert.match(html, /default-src 'self'/);
  assert.match(html, /connect-src 'self'/);
});
test('7. service worker imports existing files and derives cache name from version', () => {
  const sw = read('sw.js');
  for (const f of [...sw.match(/importScripts\(([^)]*)\)/)[1].matchAll(/'([^']+)'/g)].map(m => m[1]))
    assert.ok(existsSync(join(root, f)), f);
  assert.match(sw, /'bingo-caller-v' \+ self\.APP_VERSION/);
});
test('8. manifest is installable-shaped', () => {
  const m = JSON.parse(read('manifest.json'));
  assert.equal(m.display, 'standalone');
  assert.ok(m.icons.length >= 1 && m.start_url && m.name);
});
test('9. build info carries dates and two commits', () => {
  const b = ev('BUILD_INFO');
  assert.ok(!isNaN(Date.parse(b.buildDate)) && !isNaN(Date.parse(b.deployDate)));
  assert.equal(b.commits.length, 2);
  assert.ok(b.commits.every(c => c.hash && c.subject));
});
test('10. changelog has an entry for the current version', () => {
  assert.ok(read('CHANGELOG.md').includes(`## [${ev('APP_VERSION')}]`));
});

// ---- ball logic ---------------------------------------------------------------------------
test('11. letterFor / colOf cover column boundaries', () => {
  assert.deepEqual([1, 15, 16, 30, 31, 45, 46, 60, 61, 75].map(n => ev(`letterFor(${n})`)), 'BBIINNGGOO'.split(''));
  assert.equal(ev('colOf(75)'), 4);
});
test('12. fresh game has all 75 balls eligible', () => {
  assert.equal(ev('eligibleBalls().length'), 75);
});
test('13. eligibleBalls drops called balls once state is saved', () => {
  ev('S.called=[1,2,3]; save();');
  const el = ev('eligibleBalls()');
  assert.equal(el.length, 72);
  assert.ok(![1, 2, 3].some(n => el.includes(n)));
  ev('S.called=[]; save();');
});
test('14. limitDraw restricts Four Corners to the B and O columns', () => {
  ev("S.pattern='four_corners'; S.settings.limitDraw=true; save();");
  const el = ev('eligibleBalls()');
  assert.equal(el.length, 30);
  assert.ok(el.every(n => n <= 15 || n >= 61));
  ev("S.settings.limitDraw=false; save();");
  assert.equal(ev('eligibleBalls().length'), 75);
  ev("S.pattern='any_line'; S.settings.limitDraw=true; save();");
});
test('15. pattern memo follows S.pattern changes', () => {
  ev("S.pattern='blackout'; save();");
  assert.equal(ev('currentPatternDef().name'), 'Blackout / Coverall');
  ev("S.pattern='any_line'; save();");
  assert.equal(ev('currentPatternDef().name'), 'Any Line');
});
test('16. involvedColumns: corners = {0,4}, any line = all', () => {
  ev("S.pattern='four_corners'; save();");
  assert.deepEqual([...ev('involvedColumns()')].sort(), [0, 4]);
  ev("S.pattern='any_line'; save();");
  assert.equal(ev('involvedColumns()'), null);
});
test('17. custom patterns resolve and fall back to Any Line when missing', () => {
  ev("S.customPatterns=[{id:'c1',name:'Mine',cells:[[0,0],[0,1]]}]; S.pattern='custom:c1'; save();");
  assert.equal(ev('currentPatternDef().name'), 'Mine');
  assert.deepEqual([...ev('involvedColumns()')].sort(), [0, 1]);
  ev("S.pattern='custom:gone'; save();");
  assert.equal(ev('currentPatternDef().name'), 'Any Line');
  ev("S.customPatterns=[]; S.pattern='any_line'; save();");
});
test('18. every pattern uses only in-range 5x5 cells', () => {
  const bad = ev(`Object.values(PATTERNS).flatMap(p=>(p.cells||p.example||[])).filter(([r,c])=>r<0||r>4||c<0||c>4).length`);
  assert.equal(bad, 0);
});

// ---- call-outs ----------------------------------------------------------------------------
test('19. every ball 1-75 has at least one call-out', () => {
  assert.deepEqual(ev('Array.from({length:75},(_,i)=>i+1).filter(n=>!callVariants(n).length)'), []);
});
test('20. callVariants puts your lines first and de-duplicates', () => {
  ev("MY_CALLS[7]=['Mine','Mine', CALLS[7][0]]; _variantCache.clear();");
  const v = ev('callVariants(7)');
  assert.equal(v[0], 'Mine');
  assert.equal(new Set(v).size, v.length);
});

// ---- helpers ------------------------------------------------------------------------------
test('21. esc neutralises HTML', () => {
  assert.equal(ev(`esc('<img src=x onerror="a">&\\'')`), '&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;');
  assert.equal(ev('esc(null)'), '');
});
test('22. clampNum clamps and falls back', () => {
  assert.equal(ev('clampNum(500,80,180,100)'), 180);
  assert.equal(ev('clampNum(-1,3,60,10)'), 3);
  assert.equal(ev("clampNum('abc',3,60,10)"), 10);
});
test('23. time helpers format as expected', () => {
  assert.match(ev("fmtTime('2026-01-01T13:05:09')"), /\d{1,2}:05:09/);
  assert.match(ev('stamp()'), /^\d{8}-\d{4}$/);
});

// ---- accessibility math -------------------------------------------------------------------
test('24. contrast: black on white is 21:1; accessibleColor/Badge reach AAA (7:1)', () => {
  assert.ok(Math.abs(ev("_contrast('#000000','#ffffff')") - 21) < 1e-9);
  assert.ok(ev("_contrast(accessibleColor('#ffd23f',['#15171c','#1f232b'],7),'#15171c')") >= 7);
  const b = ev("accessibleBadge('#52a6f0',7)");
  assert.ok(ev(`_contrast('${b.bg}','${b.text}')`) >= 7);
});
test('25. every theme letter color yields an AAA-safe foreground on its surfaces', () => {
  const fails = ev(`Object.values(THEMES).flatMap(t=>{
    const s=[t.vars['--bg'],t.vars['--surface'],t.vars['--surface-2']];
    return Object.values(t.letters).filter(h=>Math.min(...s.map(bg=>_contrast(accessibleColor(h,s,7),bg)))<7);
  })`);
  assert.deepEqual(fails, []);
});
