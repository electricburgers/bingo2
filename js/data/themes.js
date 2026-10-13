"use strict";
/* Theme presets */
/* ---------- Themes ----------
   Every theme is authored to WCAG AA as written: body text, muted text and all five letter colors clear
   4.5:1 on the page, card and chip backgrounds, and the accent clears 3:1 against the page. Because they
   already pass, the runtime contrast helpers (util/color.js) leave the designed colors untouched, so the
   palettes stay bright and playful instead of being washed out to reach a higher bar. */
const THEMES = {
  dark:        {label:'Dim Bar',     vars:{'--bg':'#14122b','--surface':'#221e45','--surface-2':'#2f2a5c','--line':'#6a62b8','--text':'#f6f3ff','--muted':'#c4bbec','--accent':'#ffd23f'},
                letters:{B:'#ff6b8a',I:'#ff9d3d',N:'#ffe14d',G:'#7bed6b',O:'#4dc8ff'}},
  contrast:    {label:'High Contrast',vars:{'--bg':'#000000','--surface':'#0d0d0d','--surface-2':'#1a1a1a','--line':'#777777','--text':'#ffffff','--muted':'#d8d8d8','--accent':'#ffe600'},
                letters:{B:'#4da3ff',I:'#ff5c5c',N:'#ff5cff',G:'#5cff8f',O:'#ffd24d'}},
  classic:     {label:'Bingo Hall',  vars:{'--bg':'#071a36','--surface':'#0c2850','--surface-2':'#123564','--line':'#4d7fc0','--text':'#fffdf5','--muted':'#c2d8f7','--accent':'#ffcf33'},
                letters:{B:'#3db8ff',I:'#ff7186',N:'#ffe14d',G:'#4ade80',O:'#ff9f43'}},
  velvetNight: {label:'Velvet Night', vars:{'--bg':'#2a0d2e','--surface':'#3a1540','--surface-2':'#4b1d52','--line':'#9a58a6','--text':'#fff0fb','--muted':'#e6c2ec','--accent':'#ffb84d'},
                letters:{B:'#ff7aa8',I:'#ffa94d',N:'#ffe066',G:'#6ee787',O:'#5ad8f5'}},
  light:       {label:'Daylight',    vars:{'--bg':'#f3f7ff','--surface':'#ffffff','--surface-2':'#e6eefc','--line':'#8fa6d6','--text':'#14213d','--muted':'#46567a','--accent':'#e65c00'},
                letters:{B:'#1255c4',I:'#c42618',N:'#7a2fe6',G:'#0d7a3b',O:'#9c5800'}},
  parchment:   {label:'Parchment',   vars:{'--bg':'#fff4dc','--surface':'#fffdf6','--surface-2':'#ffe9bd','--line':'#c99a3a','--text':'#2b1d0e','--muted':'#654a26','--accent':'#d9381e'},
                letters:{B:'#0b6a8f',I:'#c42e14',N:'#7b3fc4',G:'#16793c',O:'#9c5800'}},
  cbDeuteran:  {label:'Colorblind · Deuteranopia', vars:{'--bg':'#0e1628','--surface':'#16213b','--surface-2':'#1f2d4d','--line':'#4a5d8f','--text':'#f4f7ff','--muted':'#b4c2e0','--accent':'#f0e442'},
                letters:{B:'#56b4e9',I:'#e69f00',N:'#f0e442',G:'#00c08b',O:'#e58fc0'}},
  cbProtan:    {label:'Colorblind · Protanopia', vars:{'--bg':'#0e1628','--surface':'#16213b','--surface-2':'#1f2d4d','--line':'#4a5d8f','--text':'#f4f7ff','--muted':'#b4c2e0','--accent':'#f0e442'},
                letters:{B:'#56b4e9',I:'#e69f00',N:'#f0e442',G:'#00c08b',O:'#e58fc0'}},
  cbTritan:    {label:'Colorblind · Tritanopia', vars:{'--bg':'#0e1628','--surface':'#16213b','--surface-2':'#1f2d4d','--line':'#4a5d8f','--text':'#f4f7ff','--muted':'#b4c2e0','--accent':'#ff7a2e'},
                letters:{B:'#ff7a2e',I:'#ff7fbf',N:'#ffffff',G:'#00c08b',O:'#4aa8f5'}},
};
