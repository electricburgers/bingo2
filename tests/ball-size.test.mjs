/* Called-ball size settings: one Small/Medium/Large control for ball + font, with separate Advanced controls. */
import test from 'node:test';
import assert from 'node:assert/strict';
import { read, html, loadApp } from './helpers.mjs';

const { run: ev } = loadApp();
const css = read('styles.css');

test('Z1. three sizes, medium is the default for both ball and font', () => {
  assert.equal(ev("Object.keys(BALL_SIZES).join(',')"), 'small,medium,large');
  assert.equal(ev('BALL_SIZES.medium'), 1);
  assert.ok(ev('BALL_SIZES.small<1 && BALL_SIZES.large>1'));
  assert.equal(ev('defaultState().settings.ballSize'), 'medium');
  assert.equal(ev('defaultState().settings.ballFontSize'), 'medium');
});

test('Z2. normalizeState repairs missing or bogus values', () => {
  ev("S.settings.ballSize='huge'; S.settings.ballFontSize=undefined; normalizeState();");
  assert.equal(ev('S.settings.ballSize'), 'medium');
  assert.equal(ev('S.settings.ballFontSize'), 'medium');
});

test('Z3. applyScale sets ball and font multipliers independently', () => {
  const got = JSON.parse(ev(`(()=>{ const g={}; const st=document.documentElement.style, old=st.setProperty;
    st.setProperty=(k,v)=>{g[k]=v}; S.settings.ballSize='large'; S.settings.ballFontSize='small'; applyScale();
    st.setProperty=old; return JSON.stringify(g); })()`));
  assert.equal(got['--ball-mult'], 1.25);
  assert.equal(got['--ball-font-mult'], 0.8);
});

test('Z4. settings drawer has the main row and an Advanced section with separate rows', () => {
  for (const id of ['ballSizeRow', 'ballOnlyRow', 'ballFontRow']) assert.match(html, new RegExp(`id="${id}"`));
  assert.ok(html.indexOf('id="ballOnlyRow"') > html.indexOf('>Advanced<'));
});

test('Z5. main row sets both; advanced rows set one', () => {
  const src = read('js/app/wire-settings.js');
  assert.match(src, /'#ballSizeRow':k=>\{ S\.settings\.ballSize=k; S\.settings\.ballFontSize=k; \}/);
  assert.match(src, /'#ballOnlyRow':k=>\{ S\.settings\.ballSize=k; \}/);
  assert.match(src, /'#ballFontRow':k=>\{ S\.settings\.ballFontSize=k; \}/);
});

test('Z6. ball CSS uses the multipliers', () => {
  assert.match(css, /--ball-mult/);
  assert.match(css, /--ball-font-mult/);
});
