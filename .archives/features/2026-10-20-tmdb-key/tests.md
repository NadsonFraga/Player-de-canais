# Tests: TMDB key out of the code, behind /api/tmdb (D3)

**Date:** 2026-10-20 · **Branch:** `feat/tmdb-key` · **Version:** `20261020_1139`
**Preview:** https://feat-tmdb-key.tvzinhaonline.pages.dev

Setup: the user added `TMDB_API_KEY` as a Secret in Cloudflare (Production and Preview) on 2026-10-20, still with the current key; the local `.env` (git-ignored) holds it for development. The new key comes after the merge.

## Automated

| Suite | Result | Notes |
|---|---|---|
| `node --check`, `check_js.py`, `bump_version.py --check` | PASS | |
| `python tools/test_tmdb_route.py` (new) | 0 failures | same allowed/refused paths in Python and Node (13 cases); handler: 200 with TMDB's body and 30 min cache, 403 other origin, 503 without a key, 400 refused path without calling TMDB, key added from the secret; no 32-hex key left in `assets/`, `functions/` or `local_server.py` |
| `python tools/test_resolve_cors.py` | 0 failures | now imports `isAllowedOrigin`, exported by `resolve.js` for `tmdb.js` |
| `python tools/test_mgeb_rules.py` | all passed | |
| Browser, first visit (local) | 63 TMDB requests, all through `/api/tmdb`, **0 carrying `api_key`**; 383 catalog images | |
| `node tools/feed_rows_check.mjs` | all passed | rows of 20, now counting the route (8 / 9 / 10 row requests) |
| `node tools/tab_reset_check.mjs`, `catalog_split_check.mjs` | all passed | |
| `node tools/episode_entry_check.mjs` | 52/52 | |
| `node tools/player_ui_check.mjs` | 45/46 twice | B21 only (one earlier run 43/46: the flaky DBZ T9E31 item) |

## Manual (user, on the preview)

| # | Steps | Expected | Result |
|---|---|---|---|
| 1 | Open the site; Início, Filmes, Séries, Animes | heroes, logos and every row load as before | |
| 2 | Search in Filmes and in Animes; open the explore filters | results as before | |
| 3 | Open a movie, a series (seasons and episodes) and an anime | details, seasons and episode names load; they play | |
| 4 | DevTools > Rede, filter `api_key` | no request carries `api_key` | |
