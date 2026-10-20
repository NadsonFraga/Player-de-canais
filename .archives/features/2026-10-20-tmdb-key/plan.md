# Plan: TMDB key out of the code, behind /api/tmdb (D3)

> Status: proposed on 2026-10-20, waiting for the user's approval. Branch `feat/tmdb-key`.

## Today

- The TMDB v3 key is written in `assets/js/core/constants.js` (sent to every browser), `functions/api/resolve.js`, `tools/local_server.py`, and in the git history. Anyone can copy it and spend its quota or get it blocked.
- Browser calls go through two helpers only: `fetchTmdbEndpoint` (`movies.js`) and `fetchSeriesEndpoint` (`series.js`); 21 call sites use them. Images come from `image.tmdb.org`, which needs no key.
- Measured on production (2026-10-20, fresh browser): opening the site makes **63 TMDB calls** (home rows, the idle preload of the three catalogs, and the logo images of the heroes: `/movie|tv/{id}/images` 36, `/discover` 23, trending/now playing 4); the tabs then reuse them (localStorage cache, 30 min); a series' details add 2. Today they cost no Cloudflare function call because the browser calls TMDB itself.

## Change

1. **`functions/api/tmdb.js`** (and the same in `tools/local_server.py`): `GET /api/tmdb?path=<TMDB path and query>` adds the key from `context.env.TMDB_API_KEY` and returns TMDB's JSON.
   - Only TMDB read paths are allowed (`/movie`, `/tv`, `/discover`, `/trending`, `/search`, `/genre`, `/collection`, `/person`, `/find`), so the route cannot be used for anything else; same CORS whitelist as `/api/resolve`.
   - `Cache-Control: public, max-age=1800`, plus the Cloudflare edge cache: the browser does not ask again for 30 min, and other viewers get TMDB's answer from the edge.
2. **Browser:** the two helpers call `/api/tmdb`; `TMDB_API_KEY` leaves `constants.js`.
3. **Server:** `resolve.js` reads `context.env.TMDB_API_KEY`; `local_server.py` reads the `TMDB_API_KEY` environment variable or a git-ignored `.env` file. No key left in the code.
4. **New key and revocation (your part):** create a new key in your TMDB account, add it as a secret in Cloudflare (Production and Preview) and in the local `.env`; after the deploy, regenerate the old key in TMDB so it stops working. The old string stays in the git history but becomes useless, so the history does not need rewriting.

## Quota cost (decision)

Behind `/api/tmdb` every TMDB call becomes a function call. Two ways:

- **(a) One call per request, with caches (recommended now):** ~63 function calls on the first visit of a browser, almost none on repeats within 30 min (browser cache). With D11 done, the 100k/day allow about 1,500 first visits a day besides the videos.
- **(b) Grouped requests:** the browser groups the calls made at the same moment into one (`POST /api/tmdb` with several paths): ~6-8 function calls on the first visit. More code; worth it if the quota gets tight (e.g. with the account and sync).

## Verification

- Route tests (Python and Node, same answers): allowed and refused paths, missing key, CORS, cache headers; no key string left in `assets/`, `functions/`, `tools/local_server.py`.
- Browser: catalogs, heroes, logos, details, seasons, search load as before (Chrome and Firefox); no `api_key=` in any browser request; `check_deployment.py` checks that the site's files carry no key.
- Count of function calls on a first and a repeat visit.
