# bingo2

For live hosting bingo games. A host-only bingo caller that works fully offline once installed.

## Layout

```
index.html            page shell (loads js/ in dependency order)
styles.css            all styles
manifest.json, sw.js  PWA manifest + offline service worker
js/config/            version.js (single source of truth) + generated build-info.js / precache.js
js/core|data|game|ui|io|platform|app/   one responsibility per file
js/main.js            entry point
scripts/build-info.mjs  generates build date, last-two-commits and the precache list
CHANGELOG.md
```

## Run

`python3 -m http.server 8934` and open <http://localhost:8934>.

## Tests

`node --test tests/` — 416 tests that load the real scripts into a sandbox (no dependencies).

## Releasing

1. Bump `js/config/version.js` and add a `CHANGELOG.md` entry.
2. `git add -A && node scripts/build-info.mjs --pending "<commit message>" && git add -A`
3. `git commit -m "<commit message>"`

Step 2 regenerates `js/config/build-info.js` (build/deploy dates, last two commits) and
`js/config/precache.js` (the offline file list, read from `index.html`). Add a new script to
`index.html` and it is precached automatically.
