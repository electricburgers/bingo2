/* Themed banter packs (Classic / Jersey / Nerd / Sports): which lines a ball can show depends on the packs that
   are switched on in Settings. Written test-first. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, html, scripts, loadApp } from './helpers.mjs';

const { run: ev } = loadApp();
const css = read('styles.css');
const setPacks = on => ev(`S.settings.packs=${JSON.stringify(on)}; _variantCache.clear();`);
const ALL = { classic: true, jersey: true, nerd: true, sports: true };
const only = k => Object.fromEntries(Object.keys(ALL).map(p => [p, p === k]));
const lines = n => [...ev(`callVariants(${n})`)];
const reset = () => setPacks(ALL);

test('K1. there are four packs in a fixed order: classic, jersey, nerd, sports', () => {
  assert.equal(ev("PACK_ORDER.join(',')"), 'classic,jersey,nerd,sports');
  assert.equal(ev("Object.keys(PACKS).join(',')"), 'classic,jersey,nerd,sports');
});
test('K2. every pack has a name and a description for Settings', () => {
  assert.ok(ev('Object.values(PACKS).every(p=>p.name&&p.desc)'));
});
test('K3. new games start with every pack on', () => {
  assert.equal(ev("JSON.stringify(defaultState().settings.packs)"), JSON.stringify(ALL));
});
test('K4. normalizeState fills missing packs, repairs junk and never leaves all packs off', () => {
  ev('delete S.settings.packs; normalizeState();');
  assert.equal(ev('JSON.stringify(S.settings.packs)'), JSON.stringify(ALL));
  ev("S.settings.packs={classic:'x',jersey:false,nerd:0}; normalizeState();");
  assert.equal(ev('PACK_ORDER.every(k=>typeof S.settings.packs[k]==="boolean")'), true);
  ev('S.settings.packs={classic:false,jersey:false,nerd:false,sports:false}; normalizeState();');
  assert.equal(ev('PACK_ORDER.some(k=>S.settings.packs[k])'), true);
  reset();
});
test('K5. with every pack on, a ball lists classic lines first, then Jersey, Nerd, Sports', () => {
  reset();
  const v = lines(12);                       // classic, Jersey (Wawa), Nerd (B-12), Sports (Namath)
  assert.match(v[0], /buckle my shoe/);
  const iJ = v.findIndex(s => /Wawa/.test(s)), iN = v.findIndex(s => /B-12/.test(s)), iS = v.findIndex(s => /Namath/.test(s));
  assert.ok(iJ > 1 && iJ < iN && iN < iS, [iJ, iN, iS].join());
});
test('K6. switching Jersey off removes the Parkway lines', () => {
  setPacks({ ...ALL, jersey: false });
  assert.equal(lines(13).filter(s => /Parkway/.test(s)).length, 0);
  assert.equal(lines(142 > 75 ? 42 : 42).filter(s => /Parkway/.test(s)).length, 0);
  reset();
  assert.ok(lines(13).some(s => /Parkway Exit 13 —/.test(s)));
});
test('K7. switching Nerd off removes the vitamin lines', () => {
  setPacks({ ...ALL, nerd: false });
  assert.equal(lines(6).filter(s => /B-6/.test(s)).length, 0);
  reset();
  assert.ok(lines(6).some(s => /B-6/.test(s)));
});
test('K8. switching Sports off removes the team-number lines', () => {
  setPacks({ ...ALL, sports: false });
  assert.equal(lines(12).filter(s => /Namath/.test(s)).length, 0);
  reset();
  assert.ok(lines(12).some(s => /Namath/.test(s)));
});
test('K9. Classic only: the traditional lingo and nothing from the other packs', () => {
  setPacks(only('classic'));
  for (let n = 1; n <= 75; n++) {
    const v = lines(n);
    assert.ok(v.length >= 1, 'ball ' + n);
    assert.ok(!v.some(s => /Parkway|Turnpike|B-6|B-12| retired by |Super Bowl|Element/.test(s)), 'ball ' + n + ': ' + v.join(' | '));
  }
  reset();
});
test('K10. a ball with no lines in the enabled packs falls back to its classic lines (banter never goes blank)', () => {
  setPacks(only('sports'));
  for (let n = 1; n <= 75; n++) assert.ok(lines(n).length >= 1, 'ball ' + n);
  assert.match(lines(8)[0], /./);               // ball 8 has no sports line: falls back to classic
  reset();
});
test('K11. your own MY_CALLS always come first, whatever the packs', () => {
  ev("MY_CALLS[12]=['Mine first']; _variantCache.clear();");
  setPacks(only('sports'));
  assert.equal(lines(12)[0], 'Mine first');
  ev('delete MY_CALLS[12];'); reset();
});
test('K12. the line cache follows the packs (toggle on, off, on)', () => {
  reset();
  const a = lines(12).length;
  setPacks({ ...ALL, nerd: false });
  const b = lines(12).length;
  reset();
  assert.ok(b < a && lines(12).length === a);
});
test('K13. togglePack turns a pack off and on, saves, and refreshes the line cache', () => {
  reset();
  assert.equal(ev("togglePack('nerd', false)"), true);
  assert.equal(ev('S.settings.packs.nerd'), false);
  assert.equal(lines(6).filter(s => /B-6/.test(s)).length, 0);
  assert.equal(ev("togglePack('nerd', true)"), true);
  assert.ok(lines(6).some(s => /B-6/.test(s)));
});
test('K14. the last pack that is on cannot be switched off', () => {
  setPacks(only('jersey'));
  assert.equal(ev("togglePack('jersey', false)"), false);
  assert.equal(ev('S.settings.packs.jersey'), true);
  reset();
});
test('K15. an unknown pack name is refused', () => {
  assert.equal(ev("togglePack('bogus', true)"), false);
});
test('K16. Settings has a labelled group of pack switches and the code that builds them', () => {
  assert.match(html, /id="packRow"[^>]*role="group"[^>]*aria-label="Banter packs"/);
  assert.match(read('js/ui/packs.js'), /function buildPackRow/);
  assert.match(read('js/main.js'), /buildPackRow\(\)/);
});
test('K17. every pack switch is a real checkbox with its own accessible name', () => {
  const src = read('js/ui/packs.js');
  assert.match(src, /type="checkbox"/);
  assert.match(src, /aria-label=/);
});
test('K18. the new pack scripts are loaded in dependency order and precached', () => {
  for (const f of ['js/data/packs.js', 'js/data/jersey-banter.js', 'js/data/nerd-banter.js', 'js/data/sports-banter.js', 'js/ui/packs.js'])
    assert.ok(scripts.includes(f), f);
  const idx = f => scripts.indexOf(f);
  assert.ok(idx('js/data/packs.js') < idx('js/core/state.js'));
  assert.ok(idx('js/data/sports-banter.js') < idx('js/game/callouts.js'));
  ev(read('js/config/precache.js'));
  for (const f of ['packs', 'jersey-banter', 'nerd-banter', 'sports-banter']) assert.ok(ev('PRECACHE_URLS').includes(`./js/data/${f}.js`), f);
});
test('K19. the classic pack no longer contains the NJ-flavoured lines (they moved to Jersey)', () => {
  const classic = ev('Object.values(CALLS).flat()').join(' | ');
  assert.doesNotMatch(classic, /Route Three|Meadowlands|Hoboken|Exit One|Garden State|Born to Run|born to run|Route Seventy-Two/);
});
test('K20. every pack contributes lines, and every line is at most 95 characters', () => {
  for (const [name, obj] of [['jersey', 'JERSEY_LINES'], ['nerd', 'NERD_LINES'], ['sports', 'SPORTS_LINES']]) {
    const all = ev(`Object.values(${obj}).flat()`);
    assert.ok(all.length >= 20, name + ' has ' + all.length);
    for (const s of all) assert.ok(s.length <= 95, s);
  }
});
test('K21. no duplicate lines across all packs', () => {
  const all = ['CALLS', 'JERSEY_LINES', 'NERD_LINES', 'SPORTS_LINES'].flatMap(o => [...ev(`Object.values(${o}).flat()`)]);
  assert.equal(new Set(all).size, all.length);
});
test('K22. pack rows are styled', () => {
  assert.match(css, /\.pack-opt/);
});
test('K23. clearing history keeps the pack choice (it is a setting, not game data)', () => {
  assert.doesNotMatch(read('js/app/wire-settings.js').split('clearHistoryBtn')[1] || '', /packs/);
});
