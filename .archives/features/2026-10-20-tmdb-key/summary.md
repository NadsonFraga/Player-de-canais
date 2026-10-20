# Summary: TMDB key out of the code, behind /api/tmdb (D3)

**Branch:** `feat/tmdb-key` · **Date:** 2026-10-20 · **Version:** `20261020_1139`
**Preview:** https://feat-tmdb-key.tvzinhaonline.pages.dev
**Status:** approved by the user after tests on the preview. Key rotation pending (after the merge).

## Problem

The TMDB v3 key was written in `assets/js/core/constants.js` (sent to every browser), `functions/api/resolve.js`, `tools/local_server.py` and the git history: anyone could copy it, spend its quota or get it blocked.

## Change

- `functions/api/tmdb.js` (new): `GET /api/tmdb?path=...` adds the key from the `TMDB_API_KEY` secret; read paths only (movie, tv, discover, trending, search, genre, collection, person, find), same origins as `/api/resolve`, 30 min cache in the browser and at the edge (keyed by the path, never the key). 503 when the secret is missing, 400 for any other path.
- Browser: the two identical helpers (`fetchTmdbEndpoint`, `fetchSeriesEndpoint`) go through `core/tmdb.js`; `TMDB_API_KEY` and `TMDB_BASE_URL` left `constants.js`.
- `resolve.js` reads the secret per request (and exports `isAllowedOrigin` for `tmdb.js`); `local_server.py` mirrors the route and reads `TMDB_API_KEY` from the environment or a git-ignored `.env`.
- Cloudflare: the user added `TMDB_API_KEY` as a Secret in Production and Preview (still the current key).
- Tests: new `tools/test_tmdb_route.py`; `check_deployment.py` checks the route and that the site's files carry no key; `test_resolve_cors.py`, `player_ui_check.mjs` and `feed_rows_check.mjs` updated for the route.

## Results

Preview: 63 TMDB requests on a first visit, all through `/api/tmdb`, none with `api_key`; 383 catalog images; `check_deployment.py` all passed. Locally: route rules identical in Python and Node, rows of 20, `episode_entry_check` 52/52, `player_ui_check` 45/46 (B21). Cost: ~63 function calls on a first visit, almost none on repeats within 30 min.

## Left to do

1. Generate a new key in TMDB (this invalidates the old one at once).
2. Replace the `TMDB_API_KEY` secret in Cloudflare (Production and Preview) and the local `.env`.
3. Redeploy (a secret change only applies to a new deployment). The old key stays in the git history but no longer works.
