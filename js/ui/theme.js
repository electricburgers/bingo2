"use strict";
/* Theme application + pickers */
function applyTheme(){
  const root=document.documentElement;
  const themeKey=THEMES[S.settings.theme]?S.settings.theme:'dark';
  const base=THEMES[themeKey].vars;
  // base theme vars
  Object.entries(base).forEach(([k,v])=>root.style.setProperty(k,v));
  // custom theme overrides (bg/text only — surface/muted/accent aren't user-editable)
  const customVars=S.settings.vars||{};
  Object.entries(customVars).forEach(([k,v])=>{ if(v)root.style.setProperty(k,v); });

  const effBg=customVars['--bg']||base['--bg'];
  const effText=customVars['--text']||base['--text'];
  const effSurface=base['--surface'];
  const effSurface2=base['--surface-2'];
  const surfaces=[effBg, effSurface, effSurface2];

  // Secondary/"muted" text — shift toward the theme's own text color (not black/white)
  // just enough to clear AAA against every surface it sits on (bg, card, chip/button fills).
  root.style.setProperty('--muted', _shiftFor(base['--muted'], effText, surfaces, AAA_TARGET).color);

  // Accent used AS TEXT (callouts, badges, "on" states) needs its own AAA-safe variant —
  // the raw --accent stays untouched for borders/fills/progress bars, which only need the
  // much looser 3:1 non-text bar and should keep the theme's intended punchy color.
  root.style.setProperty('--accent-fg', accessibleColor(base['--accent'], surfaces, AAA_TARGET));
  // Icon/dot drawn ON TOP of a solid --accent fill (switch thumb, editor "on" tile).
  root.style.setProperty('--accent-on', bestTextOn(base['--accent']));
  // Solid accent badge (host-only tag) — was a low-opacity tint that vanished in several themes.
  const accentBadge=accessibleBadge(base['--accent'], AAA_TARGET);
  root.style.setProperty('--accent-badge-bg', accentBadge.bg);
  root.style.setProperty('--accent-badge-text', accentBadge.text);

  // "good"/"warn" text (winner names, danger buttons, find results). --good itself stays
  // fixed for the Call button gradient, which already pairs with a fixed dark label everywhere.
  root.style.setProperty('--good', '#3ddc84');
  // good-fg also has to survive the low-opacity green tints those "win" backgrounds actually
  // render as (log row / winrec / congrats banner / winner button) — checking the raw
  // surfaces alone under-shifts it since the tint pulls the effective bg toward green.
  const goodTints=[_mix(effBg,'#3ddc84',0.12), _mix(effSurface,'#3ddc84',0.07),
                    _mix(effSurface,'#3ddc84',0.13), _mix(effSurface2,'#3ddc84',0.12)];
  root.style.setProperty('--good-fg', accessibleColor('#3ddc84', [...surfaces, ...goodTints], AAA_TARGET));
  root.style.setProperty('--warn', accessibleColor('#ff6b6b', [effSurface, effSurface2], AAA_TARGET));

  // Per-letter badge: background + text chosen together so a called cell (and the column
  // header, which reuses the same pair) always hits AAA, regardless of how saturated or
  // pale the theme's letter color is. --col-L-fg is a separate AAA-safe text-only variant
  // for places that show the raw letter color as text on an existing surface (the current
  // ball, its big-screen mirror, the next-up preview, recent-call chips) rather than as a
  // matching badge — --col-L itself stays untouched for decorative uses (the ball's ring).
  LETTERS.forEach(L=>{
    const hex=S.settings.letters[L]||'#888888';
    root.style.setProperty('--col-'+L, hex);
    const badge=accessibleBadge(hex, AAA_TARGET);
    root.style.setProperty('--col-'+L+'-bg', badge.bg);
    root.style.setProperty('--col-'+L+'-text', badge.text);
    root.style.setProperty('--col-'+L+'-fg', accessibleColor(hex, surfaces, AAA_TARGET));
  });
  applyScale();
}
/* Font / board-size sliders only need these two custom properties — no color math. */
function applyScale(){
  const root=document.documentElement;
  root.style.setProperty('--font-scale', (S.settings.fontScale/100));
  root.style.setProperty('--board-scale', S.settings.boardScale??0.75);
}
function buildThemeRow(){
  const row=$('#themeRow'); row.innerHTML='';
  Object.entries(THEMES).forEach(([k,t])=>{
    const b=document.createElement('button'); b.className='theme-chip'; b.textContent=t.label;
    setToggle(b, S.settings.theme===k);
    b.onclick=()=>{ S.settings.theme=k; S.settings.letters={...t.letters}; S.settings.vars={}; save(); applyTheme(); buildThemeRow(); buildSwatches(); renderRecent(); paintBoard(); };
    row.appendChild(b);
  });
  (S.customThemes||[]).forEach((t,i)=>{
    const b=document.createElement('button'); b.className='theme-chip'; b.textContent='★ '+t.name;
    b.onclick=()=>{ Object.assign(S.settings.vars, t.vars); S.settings.letters={...t.letters}; save(); applyTheme(); renderRecent(); paintBoard(); };
    row.appendChild(b);
  });
}
function buildSwatches(){
  const row=$('#swatchRow'); row.innerHTML='';
  LETTERS.forEach(L=>{
    const wrap=document.createElement('label'); wrap.className='swatch'; wrap.style.color=`var(--col-${L}-fg)`;
    wrap.innerHTML=`${L}<input type="color" value="${rgbToHex(S.settings.letters[L])}">`;
    wrap.querySelector('input').addEventListener('input',e=>{
      S.settings.letters[L]=e.target.value; save(); applyTheme(); renderBall(false); renderRecent(); paintBoard();
    });
    row.appendChild(wrap);
  });
}
function rgbToHex(c){ if(!c)return '#ffffff'; c=c.trim(); if(c[0]==='#')return c; const m=c.match(/\d+/g); if(!m)return '#ffffff'; return '#'+m.slice(0,3).map(x=>(+x).toString(16).padStart(2,'0')).join(''); }
