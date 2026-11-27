# Handover: 3rd Direct Native Streaming Source (Movy Player)

- **Branch:** `staging` (merged from `feat/native-movy-provider`)
- **Date:** 2026-11-17
- **Version:** `20261117_1121`
- **Objective:** Implement and activate Movy (`wecollege.net` / `movy.sx`) as the 3rd direct native streaming source in TVzinha (`Movy Player (BETA)`) alongside MGEB and Fenix.

## Context & Architecture
- Prior to this implementation, TVzinha had two direct native players:
  1. `Mgeb Player (BETA)`: primary Brazilian dubbed source (100% movies, ~70% series).
  2. `Fenix Player (BETA)`: Stremio addon scraper (`fenixhub.online`), currently starved because upstream bot scrapers are offline.
- To guarantee redundancy, high availability, and multi-resolution streaming (4K 2160p, 1080p, 720p, 480p), Movy was integrated as a 3rd native provider with sub-400ms resolution times.

## Key Changes
1. **Providers & Resolution Pipeline (`functions/api/providers.js`, `functions/api/resolve.js`):**
   - Implemented detailed diagnostic debug logging in `resolveMovy` (`endpoint`, `status`, `statusText`, `error`, `streams`, `body`).
   - Wired `providerDebug = movyData?.debug` in `functions/api/resolve.js` for observability.
   - Verified Movy `mvm1` PRNG cipher decryption against upstream `api.wecollege.net` API.
2. **Stream Proxy & Automatic Origin Resolution (`functions/api/stream.js`, `tools/local_server.py`):**
   - Added automatic header routing for `goldenkite.top`, `movy.sx`, and `wecollege.net` in `/api/stream`, forwarding `Referer: https://www.movy.sx/` and `Origin: https://www.movy.sx` with full HLS manifest segment rewriting.
3. **UI & Server Selection (`assets/js/core/constants.js`, `assets/js/modules/series.js`):**
   - Added `{ id: 'native_movy', name: 'Movy Player (BETA)', isNative: true, source: 'movy' }` to `MOVIE_SERVERS` in `constants.js`.
   - Added `{ id: 'native_movy', name: 'Movy Player (BETA)', isNative: true, source: 'movy' }` to `SERIES_SERVER_OPTIONS` in `series.js`.
   - Updated SuperFlix fallback domain in `MOVIE_SERVERS` and `SERIES_SERVERS` from `.bond` to `.boats`.
4. **Client Extractors (`assets/js/player/clientProviders.js`):**
   - Fixed URL parameter encoding in `resolveMovyClient` to prevent double-encoding.
5. **Version Stamp & Cache Busting:**
   - Ran `python tools/bump_version.py`, stamping version `20261117_1121` across 33 project files.

## Verification
- `python tools/check_js.py` (0 missing imports)
- `python tools/bump_version.py --check` (version 20261117_1121)
- `python tools/test_security_headers.py` (0 failures)
- `python tools/test_resolve_cors.py` (0 failures)
- `node tools/test_xss_protection.mjs` (24 passed, 0 failed)
- Live staging endpoint verification:
  - `GET https://staging.tvzinhaonline.pages.dev/api/resolve?id=550&type=movie&source=movy` -> HTTP 200 with 4 HLS streams (2160p 4K, 1080p, 720p, 480p).
  - `GET https://staging.tvzinhaonline.pages.dev/api/resolve?id=1396&type=serie&season=1&episode=1&source=movy` -> HTTP 200 with 4 HLS streams.
  - `GET https://staging.tvzinhaonline.pages.dev/api/stream?...` -> HTTP 200 `#EXTM3U` manifest streaming verified.
- Staging deployed live at `https://staging.tvzinhaonline.pages.dev`.

## Next Step
- User manual test checklist on staging.
- Explicit approval required to merge `staging` into `master` for production deployment.
