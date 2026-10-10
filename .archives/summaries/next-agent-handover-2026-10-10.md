# Handover: state after skip segments and player continuity (2026-10-10)

> Read this first when resuming. Working rules live in the project `CLAUDE.md` (loaded automatically); this file adds context and preferences that are not rules.

## Git state

- Only `master` and `data` exist (local and origin). Everything below is merged and deployed to production.
- Last feature commit: `5d49bad` (series skip segments, one entry point, continuity).
- Merges into `master` use `git merge --no-ff` (user wants every branch visible in the graph).
- Feature work: create `feat/<name>` only when the user asks; Cloudflare builds a preview at `feat-<name>.tvzinhaonline.pages.dev`.
- After a merge the user wants branches deleted (local and remote), leaving only `master` and `data`.
- `gh` CLI is installed and logged in; in bash add `export PATH="/c/Program Files/GitHub CLI:/c/Program Files/nodejs:$PATH"`.

## How the user likes to work

- Chat in pt-BR, short and direct; plans in English, pasted in full in the chat, then wait for "pode prosseguir".
- Before a preview deploy: run tests, report only the result (numbers), deploy the branch, then send a **manual test table** (what to test, URL, how, expected result). The user tests on PC and phone and replies item by item ("1 confere, 2 ...").
- After the user confirms: merge to production, run `python tools/check_deployment.py <url>`, clean branches.
- Local server for phone tests: `python tools/local_server.py`, then give the LAN IP URL (the user changes wifi sometimes; re-check the IP).
- General fixes over per-title patches. Do not expand MGEB/iframe scraping. Never put emojis in the site.
- Cheap analysis: avoid heavy video analysis or token-expensive sweeps unless the user allows it.
- When unsure whether a bug is new, check before blaming a change (the user corrected a wrong attribution once).
- No spoilers in player UI (resume notice shows only "Continuando de 12:34").

## What exists now (main pieces)

- **Skip segments** (`assets/js/player/skipSegments.js`): AniSkip for anime (with cut tolerance), TheIntroDB + SkipDB for series, plausibility filter, never a recap skip on S1E1 (any media). No auto-skip; side card with "x", ending card offers next episode; countdown 10 s with ending data, 30 s without. Plans: `.archives/plans/skip-segments-aniskip-introdb.md`, `series-skip-segments.md`.
- **One entry point** for episodes: `openEpisode()` in `assets/js/modules/series.js` (rule in `CLAUDE.md`). Plan: `episode-entry-standard.md`.
- **Continuity** (`player-continuity.md`): side cards fixed above the progress bar, fullscreen survives next episode (stage fullscreen), exact-time resume per episode (rewind 10 s on server switch), player preferences in `assets/js/core/playerPrefs.js` (`tvzinha_player_prefs_v1`, kept separate for a future login/settings tab).
- **Cache busting**: `python tools/bump_version.py` before any deploy touching JS/CSS (current `20261009_s`).
- **Path block**: `functions/_middleware.js` + `/*%*` in `_routes.json`.

## Tests

- `node tools/player_ui_check.mjs`, `tools/player_touch_check.mjs`, `tools/episode_entry_check.mjs` take `--browser=chrome|edge|firefox` (Chrome default). Headless Firefox denies fullscreen (that check is skipped there).
- `python tools/check_deployment.py <url>` after each deploy.
- MGEB throttles bursts: run probes sequentially or results show false "no source".

## New machine setup

The previous agent's private memory does not travel; its useful parts are here.

- Install: Git, Python 3, Node.js LTS (`winget install OpenJS.NodeJS.LTS`), GitHub CLI (`winget install GitHub.cli`, then `gh auth login`), Google Chrome (default test browser).
- Clone, then `git fetch --all` and check for remote feature branches before starting.
- The bash tool may not see Node or gh on PATH: `export PATH="/c/Program Files/nodejs:/c/Program Files/GitHub CLI:$PATH"`.
- Never kill the user's browsers by name (`taskkill /IM msedge.exe` closed their personal windows). Kill only PIDs you started or processes whose command line contains the test profile (`tvz-`). Headless browsers need a short `--user-data-dir` path and always `--mute-audio`.
- MyAnimeList prefix search is behind AWS WAF: after ~150 requests in a few hours it answers 405 + captcha. Do not bypass it; stop and rely on caches. `tools/test_anime_lookup.py` clears caches per case: prefer `--only=` subsets.
- Python clients are ~2 s slower on `localhost` than on `127.0.0.1` (IPv6 tried first): point scripts at `127.0.0.1`. Restart `tools/local_server.py` after editing it (no reload).
- Emoji check before finishing UI work: scan the diff for U+2600-27BF, U+2B00-2BFF, U+23E9-23FF, U+25B6/25C0, U+1F000-1FAFF. Pre-existing glyphs (rating stars, check marks) were left for a user decision.
- Before running a browser suite, say which risk it covers; the user once heard a test video playing from a background browser and asked why the full suite ran for a tiny change.

## Open queue

See `.archives/plans/work-queue.md`. Nothing is in progress; the user picks the next item. Main open items:

- P1 Bleach plays Thousand-Year Blood War on MGEB; P2 Re:Zero empty source; P3 Pokemon not found by MAL lookup; P4 MGEB burst throttling (retry, no parallel); P5 MGEB returns episode 1 for missing episodes; P7 MGEB options with different videos (rank by duration).
- IntroDB as a third skip source (needs a proxy: CORS restricted); left out for now.
- F1 live channels, F2 split MAL entries, F3, F6, F7, F9, B7, B11, C1, C2, D11, E3; security D2-D9 (D3, TMDB key, postponed by the user).
- Known limits accepted: dubbed MGEB cuts of Naruto/JoJo have no markers; iPhone fullscreen is video-only; iframe servers cannot resume.
