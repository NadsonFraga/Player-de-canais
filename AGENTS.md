# TVzinha Online — Agent Guidelines & Project Architecture

> **Inheritance:** This repository strictly inherits and complies with the universal operational standards defined in `docs/00_GOVERNANCE/AGENTS_GLOBAL.md` (Language rules, Zero AI attribution, Four-Phase protocol, Hard stop, and Clean code).

---

## 1. Project Context & Stack

- **Architecture:** Static ESM SPA (native ES modules, zero build step, no bundler) hosted on Cloudflare Pages.
- **Edge Endpoints:** Cloudflare Pages Functions located in `functions/api/` (`resolve.js`, `stream.js`).
- **Local Dev Server:** `python tools/local_server.py` -> `http://localhost:8787` (mirrors edge functions for local & LAN testing). Keep edge functions and `local_server.py` strictly identical in behavior.
- **Player Engine:** Artplayer (`.art-video-player`) combined with HLS.js for `.m3u8` adaptive streaming.

---

## 2. Git & Staging Workflow (Pre-Production)

- **Branches:**
  - `master`: Production branch, deployed live at `https://tvzinhaonline.pages.dev`.
  - `staging`: Permanent pre-production branch (established 2026-10-20), deployed at `https://staging.tvzinhaonline.pages.dev`.
- **Feature Lifecycle:**
  1. Approved features branch from `staging`: `git checkout -b feat/<slug> staging`.
  2. Implement changes following the four-phase protocol.
  3. Run `python tools/bump_version.py` before merging into `staging` (stamps unique `?v=` on imports and assets).
  4. Run automated test suites against the branch.
  5. When automated checks pass: merge into `staging` with `git merge --no-ff` and push **without asking**, triggering the Cloudflare staging preview.
  6. Run verification checks against the staging URL, then hand the manual test checklist to the user.
  7. **Production Gate:** Only the user's explicit approval merges `staging` into `master`.
  8. If a feature in `staging` is rejected, revert it on `staging` before the next `master` merge. If `master` receives an independent commit, merge `master` back into `staging`.
- **Multi-Machine Sync:** Work alternates between two machines. Always run `git fetch && git pull` before starting any work and inspect incoming commits.

---

## 3. Domain & Architecture Red Lines

1. **Single Entry Point for Episodes:**
   - Every episode activation (resume card, details button, season list, drawer, next/previous buttons) MUST call `openEpisode()` in `assets/js/modules/series.js`.
   - Features must consume the structured context from `resolveEpisodeContext` (anime flag, TMDB/IMDb/MAL IDs, episode numbering), never raw call arguments.
2. **Visual Standards & Zero Emojis:**
   - Never render emojis or pictograph glyphs anywhere in the application. Use inline SVG line icons matching the site's design system, or no icon at all.
   - Artplayer paints all SVGs inside `.art-video-player` white; player line icons must have `fill: none; stroke: currentColor` in CSS.
3. **Cache Busting Mandatory:**
   - Before deploying or testing any changes touching `assets/js` or `assets/css`, run `python tools/bump_version.py`.
   - Never version import statements manually (`?v=`), as version mismatches cause duplicate module execution.
4. **General Fixes over Patches:**
   - Prefer robust, general fixes over per-host or per-title patches; apply point fixes only when strictly necessary.

---

## 4. Test Verification Matrix

Run tests proportionally and silently (`--mute-audio`):

- **Import Integrity:** `python tools/check_js.py` (validates all ES module import paths).
- **Version Integrity:** `python tools/bump_version.py --check` (ensures single synchronized version stamp).
- **Player & Touch Checks:**
  - `node tools/player_ui_check.mjs --browser=chrome`
  - `node tools/player_touch_check.mjs`
  - `node tools/player_benchmark.mjs` (benchmarks stream resolution across titles)
- **Security & Headers:**
  - `python tools/test_security_headers.py`
  - `python tools/test_resolve_cors.py`
  - `node tools/test_xss_protection.mjs`

---

## 5. Documentation & Living Memory

- **Obsidian Living State (SSOT):** `docs/02_CURRENT_STATE/ACTIVE_CONTEXT.md` is the primary anti-amnesia state document. Must be reviewed on check-in and updated on check-out.
- **Repository Archives (`.archives/`):**
  - `backlog.md`: Open task queue and priority items.
  - `features/YYYY-MM-DD-<slug>/`: Feature folders containing `plan.md`, `tests.md`, and `summary.md`.
  - `handovers/`: Chronological inter-session handovers. Start with the newest file when resuming work.
