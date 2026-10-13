# Changelog

All notable changes to Bingo Caller. Newest first. Versions before 2.29 were back-ported from the git
history; commits that didn't carry a version bump are listed under the next version that shipped them,
each tagged with its short hash and date. Format loosely follows [Keep a Changelog](https://keepachangelog.com/).

## [2.39] — 2026-10-13

### Changed
- **Static space for the bingo banter.** The banter now has a fixed four-line slot, full card width, so a long multi-line joke no longer pushes "Call N · in play", Call Next Ball, Auto and the recents up and down. (It used to reserve two lines, and the longest jokes wrapped to six on a phone.)
- **"Call N / in play" now sits right above Call Next Ball**, with the ↻ new-joke button beside it instead of beside the text (which also frees the banter to use the full width).
- Every call-out is capped at 100 characters (a test enforces it); five Parkway lines (exits 10, 30, 36, 40, 58) were tightened to fit.
- 8 more layout tests.

## [2.38] — 2026-10-13

### Changed
- **Undo and New Game moved below the recent calls**, away from Call Next Ball, so a stray tap while calling can't undo a ball or start a new game. The call card now reads Call → Auto → Recent calls → Undo / New Game. (New Game still asks to confirm; Undo is also on the phone dock and the `U` key.)
- 8 layout tests (`tests/layout.test.mjs`).

## [2.37] — 2026-10-13

### Changed
- **Recent-call chips are rounded rectangles** instead of pills, laid out in a five-column grid so all five calls always fit in one row (only four fit before). Every chip is exactly the same width; the text scales down a little on narrow phones. The big-screen strip uses the same five-column layout.
- Recent-chip tests updated for the grid layout (4 new).

## [2.36] — 2026-10-12

### Changed
- **WCAG AA, not AAA:** the contrast target drops from 7:1 to 4.5:1 (`AA_TARGET`), so the runtime color helpers nudge colors far less and the designed palettes stay bright.
- **All nine themes retuned.** Each is authored to pass AA as written (text, muted text and all five letter colors ≥ 4.5:1 on the page, card and chip backgrounds; accent ≥ 3:1 against the page) while getting more colorful: Dim Bar is now a neon indigo, Velvet Night a deep plum, Bingo Hall a rich navy with gold, Daylight and Parchment use saturated letter colors, High Contrast swaps its white N for magenta, and the color-blind themes get brighter Okabe-Ito hues on a deep blue. "(AAA)" is gone from theme names.
- **Recent-call chips are Badge-only** (letter in a colored badge, then the number). The Solid and Shapes looks and the Settings picker from 2.35 are removed; the cells keep their fixed, equal widths.
- Tests: 18 new theme-AA tests (`tests/themes-aa.test.mjs`); recent-chip tests trimmed to the badge.

## [2.35] — 2026-10-12

### Added
- **Three looks for the recent-calls chips** (Settings → Recent calls) so the letters are easier to tell apart: **Badge** (letter in a colored badge), **Solid** (whole chip in the letter color) and **Shapes** (letter plus its own shape — ● B, ▲ I, ■ N, ◆ G, ★ O — so it works without color). All use the AAA-contrast color pairs. The choice is remembered.

### Changed
- Every recent-call chip now has the same width no matter the ball: the letter, shape and number each sit in a fixed-width cell, so a narrow "I" or a 1-digit number is no narrower than "G 52". The big-screen strip uses the same chips.
- 23 more tests (`tests/recent.test.mjs`).

## [2.34] — 2026-10-12

### Fixed
- **Edge-to-edge on iPhone:** the app now reaches the very top and bottom of the screen. The page background is painted on the root element (so the status-bar and home-bar zones match the theme), the page fills `100dvh`, and every safe area is applied by its exact inset instead of being scaled up (the old 1.3×/1.6× padding left gaps, and the bottom inset was counted twice under the mobile dock). The dock keeps at least 8px above the home indicator.
- **Double-tap no longer zooms:** `touch-action: manipulation` on every element (iOS ignores `user-scalable=no`). Pinch-to-zoom still works, and quick repeated taps on Call are never swallowed.

### Changed
- Sideways scrolling stays blocked through `overflow-x: hidden` + `overscroll-behavior-x: none` rather than a `pan-y` touch-action, so it no longer conflicts with the double-tap fix.
- 16 more tests (`tests/safe-area.test.mjs`).

## [2.33] — 2026-10-12

### Changed
- The app no longer scrolls horizontally on phones: the page, the call log, the play-style tiles, the settings drawer and the full-screen pattern view are all vertical-scroll only, and sideways rubber-banding / edge-swipe chaining is off. Pinch-to-zoom still works.

## [2.32] — 2026-10-12

### Added
- **Mobile bottom dock** (phones, under 700px): Undo · Pattern · **Call** · Auto · Winner pinned to the bottom, clear of the home bar. Call is the big center button, Winner is in the far corner, and Auto shows Pause/Resume while running. Hidden on tablets and desktop.

## [2.31] — 2026-10-12

### Added
- **Garden State Parkway banter** for every real Parkway exit from 1–75 (26 exits: 4, 6, 9, 10, 11, 12, 13, 17, 20, 25, 29, 30, 36, 37, 38, 40, 41, 44, 48, 50, 52, 58, 63, 67, 69, 74). The classic bingo lingo stays the default; tap ↻ to cycle to the exit line. Lines live in `js/data/parkway-exits.js`.
- **The Bird** play style: the bottom two rows plus the entire N column.
- **Full-screen pattern view** (▦ in the top bar, or press `P`): a big 5×5 card with B-I-N-G-O headers, the squares you need highlighted, the free space marked, and a plain-English "Fill 12 squares" summary. Patterns that mean "any one of these" (Any Line, one row, one column) are labelled as an example.
- 50 more tests (`tests/features.test.mjs`), written test-first; the sandbox loader moved to `tests/helpers.mjs`.

### Changed
- **N column is skipped for diagonals and X** when the free space is on: the only N square those patterns touch is the free center, so no N ball is ever drawn. This works for any pattern (including custom ones) whose only N-column square is the center, and turning the free space off brings N back.
- Corrected Parkway call-outs that had the wrong town for their exit (e.g. 13 is Avalon/Swainton, 38 is the Atlantic City Expressway, 44 is Port Republic/Smithville).

## [2.30] — 2026-10-11

### Changed
- About now lists just each recent commit's summary, hash and date instead of every file it touched.

## [2.29] — 2026-10-11

### Changed
- Split the 1,400-line `app.js` into focused modules under `js/` (`core`, `data`, `game`, `ui`, `io`, `platform`, `app`), one responsibility per file, loaded in dependency order from `index.html`.
- The app version now lives in one place, `js/config/version.js`, shared by the page and the service worker.
- Service worker rewritten: precaches every asset (list generated from `index.html`), serves page loads straight from the cache, refreshes assets in the background, ignores cross-origin requests, and tells the host when a new version has taken over.
- About now shows the build date, deploy date, and the last two commits with the files each one changed (generated by `scripts/build-info.mjs`).

### Performance
- Board repaint is diff-based: only the 1–2 cells that changed are touched per call instead of rewriting all 75 cells.
- Eligible-ball list, current pattern and its column set are memoized and invalidated on every state save; the log no longer re-resolves the pattern for each row.
- Time formatting reuses one cached `Intl.DateTimeFormat` instead of building a locale formatter for every log row.
- WCAG color derivation (binary searches) is memoized, and the font-size / board-size sliders now update only their CSS variables instead of recomputing the whole theme on each tick.
- Switching play style re-flags existing tiles instead of rebuilding every mini diagram.
- `#id` lookups are cached; the "find" highlight clears one cell instead of scanning 75; night-report winner lookup is O(calls + winners) instead of O(calls × winners); CSV/TXT export builds with array joins.

### Added
- 25 dependency-free tests (`node --test tests/`) covering packaging/offline guarantees, ball and pattern logic, call-outs, helpers and WCAG math.
- `CHANGELOG.md` (back-ported from git history) and README layout/release notes.

### Fixed
- New Game and Clear History now also reset the per-call play-style list, which previously went stale and mislabelled later calls.
- Unbalanced `<div>` in the Play style card closed properly.

### Offline / fonts
- Confirmed the app makes no Google Fonts (or any other third-party) requests — it uses the system font stack and the CSP is `default-src 'self'` — so there is nothing to bundle. Every file the app loads is precached.

## [2.28] — 2026-07-20
- `fd4244a` Lower the two-column breakpoint to 700px so portrait iPad mini (744px) gets two columns again.

## [2.27] — 2026-07-20
- `924e59e` Raise the two-column breakpoint to 760px so iPhone-size screens get the mobile layout again.

## [2.26] — 2026-07-18
- `5f1aba6` Pin the different-joke (↻) squircle button to a fixed slot so it stops shifting when the call-out text changes length.

## [2.24] — 2026-07-18
- `fb1a271` Extend the two-column layout down to 320px so it survives narrow phone widths.

## [2.23] — 2026-07-05
- `e3153be` Removed the unused next-up preview and board search.
- `e3153be` Added per-call play-style tracking to the audit log (new "Play style" column).

## [2.22] — 2026-07-05
- `c89fc56` Verified WCAG AA across every theme with an automated DOM audit.
- `c89fc56` Added two AAA-guaranteed presets: Velvet Night and Parchment.

## [2.21] — 2026-07-05
- `36c3a49` Split the single `index.html` into `index.html`, `styles.css` and `app.js`.
- `36c3a49` Added iOS safe-area clearance for the dynamic island and home bar.
- `c14a7bb` README update.

## [2.19] — 2026-07-03
- `b645e31` Eliminated the first-call layout shift.
- `b645e31` Guaranteed WCAG AAA contrast across every theme by computing accessible color variants.
- `04db15b` Merge of remote `main`.

## [2.17] — 2026-07-02
- `1c7bb11` Hardened PWA install/offline support: static `manifest.json`, service worker, install button.
- `1c7bb11` Accessibility pass (focus management for dialogs, ARIA state on toggles).
- `1c7bb11` JSON-import validation: reject malformed ball numbers, oversized arrays and wrong types.
- `1c7bb11` Added `.claude/launch.json` for the local static server.
- `4503eae` README update.
- `2376835` (2026-06-30) Removed the unhelpful win stats; added colorblind themes (Deuteranopia, Protanopia, Tritanopia).
- `876c5f0` (2026-06-19) Updated `.gitignore`.
- `7ffb601` (2026-06-17) Made the BINGO column headers on the main board bigger with less padding and a larger font.
- `c3cb976` (2026-06-17) Added a board cell size slider in Settings so the board fits more phones.

## [2.11] — 2026-06-17
- `92e5f53` Fixed board readability in every theme to pass WCAG (black letters on bright colors were hard to read in daylight).
- `92e5f53` Version shown only in Settings, not in the title bar.
- `92e5f53` Replaced the venue credit with a Claude AI code-use disclosure.
- `92e5f53` Kept the "seconds" unit on the same line as the number in the auto-call slider to save vertical space.
- `92e5f53` Icon-only Full screen and Settings buttons so they fit on one line on mobile.

## [2.9] — 2026-06-16
- `049f881` Larger "new joke" button for mobile that no longer moves when a joke wraps to two lines.
- `049f881` Stopped accidental double-tap zoom when tapping quickly.
- `049f881` Version number displayed in Settings and the title bar.

## Before v2.9 (not versioned in git)
- `f0574d4` (2026-06-16) Moved the winner-chosen button, added the call-out ("joke") refresh button, and a full clear-all-data action.
- `820c391` (2026-06-15) Migrated the console over from the earlier bingo project (single-file `index.html`).
- `280888f` (2026-06-15) Initial commit.
