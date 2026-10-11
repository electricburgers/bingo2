"use strict";
/* Theme presets */
/* ---------- Themes ---------- */
const THEMES = {
  dark:        {label:'Dim Bar',     vars:{'--bg':'#15171c','--surface':'#1f232b','--surface-2':'#2a2f3a','--line':'#3a4150','--text':'#f2f5fa','--muted':'#9aa6b8','--accent':'#ffd23f'},
                letters:{B:'#ff595e',I:'#ff924c',N:'#ffca3a',G:'#8ac926',O:'#52a6f0'}},
  contrast:    {label:'High Contrast',vars:{'--bg':'#000000','--surface':'#0d0d0d','--surface-2':'#1a1a1a','--line':'#555','--text':'#ffffff','--muted':'#cfcfcf','--accent':'#ffe600'},
                letters:{B:'#4da3ff',I:'#ff5c5c',N:'#ffffff',G:'#5cff8f',O:'#ffd24d'}},
  classic:     {label:'Bingo Hall',  vars:{'--bg':'#102a43','--surface':'#1b3a5c','--surface-2':'#244a73','--line':'#3a5e85','--text':'#f5f7fb','--muted':'#a8c0db','--accent':'#ffcf33'},
                letters:{B:'#36b3ff',I:'#ff5b6e',N:'#ffffff',G:'#46d27a',O:'#ffc24d'}},
  velvetNight: {label:'Velvet Night (AAA)', vars:{'--bg':'#160f1e','--surface':'#211527','--surface-2':'#2d1e38','--line':'#4a3660','--text':'#f7eefc','--muted':'#b9a8ce','--accent':'#ffb84d'},
                letters:{B:'#ff6b81',I:'#ffa94d',N:'#ffe066',G:'#69db7c',O:'#66d9ef'}},
  light:       {label:'Daylight',    vars:{'--bg':'#f4f6fb','--surface':'#ffffff','--surface-2':'#e9eef6','--line':'#cfd8e6','--text':'#15202b','--muted':'#5c6b7e','--accent':'#f59e0b'},
                letters:{B:'#1d6fd1',I:'#d1411d','N':'#7a4ed1',G:'#1d9d4e',O:'#c98a00'}},
  parchment:   {label:'Parchment (AAA)', vars:{'--bg':'#faf3e6','--surface':'#fffdf8','--surface-2':'#f1e6cf','--line':'#ddcda3','--text':'#2b2013','--muted':'#6b5c42','--accent':'#b5432b'},
                letters:{B:'#1f6f8b',I:'#b5432b',N:'#6a4c93',G:'#2e7d4f',O:'#a8791b'}},
  cbDeuteran:  {label:'Colorblind · Deuteranopia', vars:{'--bg':'#13161c','--surface':'#1e222b','--surface-2':'#282d39','--line':'#3c4252','--text':'#f2f5fa','--muted':'#9aa6b8','--accent':'#f0e442'},
                letters:{B:'#0072b2',I:'#e69f00',N:'#f0e442',G:'#009e73',O:'#cc79a7'}},
  cbProtan:    {label:'Colorblind · Protanopia', vars:{'--bg':'#13161c','--surface':'#1e222b','--surface-2':'#282d39','--line':'#3c4252','--text':'#f2f5fa','--muted':'#9aa6b8','--accent':'#f0e442'},
                letters:{B:'#0072b2',I:'#e69f00',N:'#f0e442',G:'#009e73',O:'#cc79a7'}},
  cbTritan:    {label:'Colorblind · Tritanopia', vars:{'--bg':'#13161c','--surface':'#1e222b','--surface-2':'#282d39','--line':'#3c4252','--text':'#f2f5fa','--muted':'#9aa6b8','--accent':'#d55e00'},
                letters:{B:'#d55e00',I:'#cc79a7',N:'#ffffff',G:'#009e73',O:'#0072b2'}},
};
