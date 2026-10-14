/* New banter content: NJ history dates (day of month = ball) and years (last two digits = ball), NJ people by birth
   year, Einstein in Princeton, Turnpike service areas, chemistry/maths, and NJ team numbers. Written test-first.
   Facts were checked against sources (see CHANGELOG); anything unverified is deliberately absent (see N-tests). */
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, loadApp } from './helpers.mjs';

const { run: ev } = loadApp();
const pack = (name, n) => [...ev(`(${name}[${n}]||[])`)];
const J = n => pack('JERSEY_LINES', n), N = n => pack('NERD_LINES', n), S = n => pack('SPORTS_LINES', n);
const has = (fn, n, re) => fn(n).some(s => re.test(s));

/* [ball, regex] — a Jersey-pack line on that ball must match */
const JERSEY = [
  [2, /July 2, 1776/], [2, /1702/], [3, /3rd state/], [3, /January 3, 1777/], [4, /Count Basie/], [4, /Asbury Park/],
  [5, /Five New Jerseyans/], [6, /June 6, 1933/], [6, /November 6, 1869/], [7, /September 7, 1921/],
  [10, /November 10, 1766/], [11, /June 11, 1764/], [13, /Jersey Devil/], [13, /Lombardi/], [15, /Cooper/],
  [18, /December 18, 1787/], [18, /Gandolfini/], [19, /June 19, 1846/], [19, /Whitman/],
  [21, /21 counties/], [21, /1921/], [21, /Clara Barton/], [22, /Streep/], [22, /October 22, 1746/],
  [25, /Christmas/], [26, /December 26, 1776/], [26, /June 26, 1870/], [26, /Lauryn Hill/], [27, /Holland Tunnel/],
  [28, /Monmouth/], [28, /Newark Airport/], [28, /Wilson/], [30, /Grover's Mill/], [30, /Aldrin/], [30, /Stockton/],
  [31, /Edison/], [32, /Pulaski/], [33, /drive-in/], [34, /Valli/], [35, /Monopoly/], [37, /Nicholson/], [37, /Cleveland/],
  [38, /telegraph/], [40, /Warwick/], [41, /Paul Simon/], [46, /1746/], [46, /1846/], [46, /1946/], [47, /transistor/],
  [47, /1947/], [47, /Edison/], [51, /1951/], [55, /Willis/], [55, /Hamilton/], [58, /1858/], [61, /Gandolfini/],
  [62, /Bon Jovi/], [63, /Whitney/], [64, /1764/], [64, /1664/], [66, /1766/], [69, /1869/], [69, /Campbell/],
  [70, /1870/], [70, /Latifah/], [73, /Glover/], [74, /1974/], [75, /Prudential/], [75, /Lauryn/], [75, /Fenwick/],
];
/* Einstein in Princeton (all Jersey pack) */
const EINSTEIN = [
  [14, /March 14.*Pi Day.*Einstein|Einstein.*Pi Day/], [17, /October 17, 1933.*Einstein|Einstein.*October 17, 1933/],
  [18, /April 18, 1955.*Einstein|Einstein.*April 18, 1955/], [21, /1921.*Einstein.*Nobel|Einstein.*Nobel.*1921/],
  [33, /1933.*Einstein.*Institute for Advanced Study/], [35, /1935.*Einstein.*112 Mercer Street/],
  [40, /1940.*Einstein.*Trenton/], [52, /1952.*Israel.*Einstein|Einstein.*Israel/], [55, /1955.*Einstein/],
];
const SPORTS = [
  [1, /Giants.*#1|#1.*Giants/], [3, /Daneyko/], [3, /Super Bowl III/], [4, /Stevens/], [4, /Leemans/], [5, /Kidd/], [7, /Hein/],
  [9, /Gotham.*2009|2009.*Gotham/], [10, /Eli Manning/], [10, /Fillier.*Newark|Newark.*Fillier/], [10, /MetLife/], [11, /Simms/],
  [12, /Namath/], [12, /January 12, 1969/], [13, /Maynard/], [14, /Tittle/], [15, /Davidson/], [16, /Gifford/], [16, /Lavelle/],
  [21, /Super Bowl XXI/], [23, /Gotham.*2023|2023.*Gotham/], [25, /Super Bowl XXV/], [25, /Gotham.*2025|2025.*Gotham/],
  [26, /Eli.š/], [27, /Niedermayer/], [28, /Curtis Martin/], [30, /Brodeur/], [32, /Blozis/], [40, /Morrison/],
  [42, /Conerly/], [42, /Super Bowl XLII/], [46, /Super Bowl XLVI/], [48, /Super Bowl XLVIII.*MetLife|MetLife.*Super Bowl XLVIII/],
  [50, /Ken Strong/], [56, /Lawrence Taylor/], [73, /Klecko/],
];
const NERD = [
  [1, /hydrogen/i], [2, /helium/i], [6, /carbon/i], [7, /nitrogen/i], [8, /oxygen/i], [11, /sodium/i], [13, /Fibonacci/i],
  [14, /Pi Day|3\.14/i], [26, /iron/i], [29, /copper/i], [47, /silver/i], [74, /tungsten/i], [4, /squared/i], [9, /squared/i],
  [16, /squared/i], [25, /squared/i], [36, /squared/i], [49, /squared/i], [64, /squared/i], [32, /freez/i],
];

for (const [n, re] of JERSEY) test(`N-J${n}. ball ${n} has a Jersey line matching ${re}`, () => assert.ok(has(J, n, re)));
for (const [n, re] of EINSTEIN) test(`N-E${n}. ball ${n} has an Einstein line matching ${re}`, () => assert.ok(has(J, n, re)));
for (const [n, re] of SPORTS) test(`N-S${n}. ball ${n} has a Sports line matching ${re}`, () => assert.ok(has(S, n, re)));
for (const [n, re] of NERD) test(`N-N${n}. ball ${n} has a Nerd line matching ${re}`, () => assert.ok(has(N, n, re)));

test('N-1. Einstein has at least nine lines and they are all about New Jersey / Princeton', () => {
  const e = Array.from({ length: 75 }, (_, i) => J(i + 1)).flat().filter(s => /Einstein/.test(s));
  assert.ok(e.length >= 9, String(e.length));
  assert.ok(e.every(s => /Princeton|Trenton|New Jersey|Mercer Street|Pi Day/.test(s)), e.join('\n'));
});
test('N-2. the women\'s hockey team is described as New York-based, playing in Newark', () => {
  const l = S(10).find(s => /Fillier/.test(s));
  assert.match(l, /New York Sirens/);
  assert.match(l, /Newark/);
  assert.match(l, /#10/);
});
test('N-3. unverified claims are absent: no Krieger #11 or Lloyd #10 line', () => {
  const all = Array.from({ length: 75 }, (_, i) => [...J(i + 1), ...S(i + 1), ...N(i + 1)]).flat().join('\n');
  assert.doesNotMatch(all, /Krieger|Lloyd/);
});
test('N-4. every Turnpike service-area honoree line says "service area" or "rest stop"', () => {
  const all = Array.from({ length: 75 }, (_, i) => J(i + 1)).flat();
  const honorees = all.filter(s => /Lombardi|Barton|Whitman|Stockton|Cleveland|Cooper|Fenwick|Hamilton|Pitcher|Wilson|Edison.*Woodbridge/.test(s) && /Turnpike/.test(s));
  assert.ok(honorees.length >= 8, String(honorees.length));
  assert.ok(honorees.every(s => /service area|rest stop|service stop/i.test(s)), honorees.join('\n'));
});
test('N-5. Molly Pitcher is tied to the Battle of Monmouth on ball 28', () => {
  assert.ok(J(28).some(s => /Molly Pitcher/.test(s) && /Monmouth/.test(s)));
});
test('N-6. date lines use the ball as the day of the month, year lines use its last two digits', () => {
  const day = { 3: 'January 3', 6: 'June 6', 10: 'November 10', 11: 'June 11', 18: 'December 18', 19: 'June 19', 22: 'October 22', 26: 'December 26', 28: 'June 28', 30: 'October 30', 31: 'December 31' };
  for (const [n, d] of Object.entries(day)) assert.ok(J(n).some(s => s.includes(d)), `${n} ${d}`);
  const yr = { 21: '1921', 33: '1933', 35: '1935', 40: '1940', 46: '1946', 47: '1947', 51: '1951', 58: '1858', 64: '1764', 66: '1766', 69: '1869', 70: '1870', 74: '1974', 75: '1875' };
  for (const [n, y] of Object.entries(yr)) assert.ok(J(n).some(s => s.includes(y)), `${n} ${y}`);
});
test('N-7. every new line is at most 95 characters and unique across packs', () => {
  const all = [];
  for (let n = 1; n <= 75; n++) all.push(...J(n), ...N(n), ...S(n));
  for (const s of all) assert.ok(s.length <= 95, `${s.length}: ${s}`);
  assert.equal(new Set(all).size, all.length);
});
test('N-8. the vitamin banter now lives in the Nerd pack', () => {
  assert.ok(N(6).filter(s => /B-6/.test(s)).length >= 3);
  assert.ok(N(12).filter(s => /B-12/.test(s)).length >= 3);
  assert.equal(ev('Object.values(CALLS).flat().some(s=>/B-6|B-12/.test(s))'), false);
});
test('N-9. the Jersey pack also holds the old NJ-flavoured classics and the Parkway lines', () => {
  assert.ok(J(1).some(s => /Delaware/.test(s)));
  assert.ok(J(3).some(s => /Meadowlands/.test(s)));
  assert.ok(J(15).some(s => /Sinatra/.test(s)));
  assert.ok(J(75).some(s => /Born to Run/.test(s)));
});
test('N-10. changelog documents history, Einstein, people, sports, nerd lines, packs and the random pick', () => {
  const top = read('CHANGELOG.md').split('## [2.43]')[0];
  for (const w of [/Einstein/, /Gotham/, /Monopoly|chemistry|Fibonacci/i, /packs?/i, /random/i, /day of (the )?month|last two digits/i]) assert.match(top, w);
});
