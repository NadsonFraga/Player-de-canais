# Feature Summary: FenixFlix IMDb Resolution & Zunder Host Header Resilience

> **Date:** 2026-11-10  
> **Branch:** `feat/fenix-imdb-and-zunder-resilience`  
> **Status:** Implemented & Verified  
> **Version Stamp:** `20261110_0945`  

---

## 1. Problem & Root Cause Analysis

Users reported that Fenix Player was failing with "Fenix Player (BETA) sem resposta" almost immediately across all titles.

Two critical defects were identified:
1. **Missing IMDb ID on Client Extraction:**
   - Catalog items passed only numeric TMDB `id`.
   - FenixFlix recently stopped serving streams under `tmdb:{id}` on many titles, returning `{"streams":[],"cacheMaxAge":60}`.
   - When queried with IMDb ID (`tt...`), FenixFlix returns full 1080p streams.
   - `resolveFenixFlixClient` was querying `tmdb:{id}` directly and returning 0 streams.
2. **Hardcoded Referer Breaking Zunderflix HLS Streams (`{"error":"cross_site"}`):**
   - FenixFlix serves almost all streams via `zunderflix.lat` (`/api/media/hls-proxy?token=...`).
   - `clientProviders.js` hardcoded `Referer: https://embedplayer2.xyz/` for every stream.
   - `zunderflix.lat` inspects the Referer header and rejects cross-site embedplayer2 requests with HTTP 403 `{"error":"cross_site"}`.
   - When Referer and Origin match `https://zunderflix.lat/`, streams resolve and stream in 1080p.
3. **M3U8 Type Detection:**
   - URLs with `hls-proxy` (without `.m3u8` in path) were not recognized as HLS, defaulting to `type: mp4`. This caused desktop browsers to try native MP4 decoding without Hls.js, failing instantly.

---

## 2. Changes Implemented

- **`assets/js/player/clientProviders.js`:**
  - Integrated `fetchTmdb` from `../core/tmdb.js` to resolve `imdb_id` from TMDB (`movie/${id}` or `tv/${id}/external_ids`) when not present.
  - Dual candidate queries: prioritizes IMDb ID (`tt...`) and falls back to TMDB ID (`tmdb:...`).
  - Dynamic stream headers resolver: maps `zunderflix.lat` with its matching Referer and Origin.
  - Enhanced HLS type detection to recognize `hls-proxy` and `/hls` endpoints.
- **`functions/api/providers.js` & `functions/api/resolve.js`:**
  - Synced backend resolver: dual candidate query order (`imdbId` then `tmdbId`).
  - Added IMDb ID resolution in `resolve.js` before calling `resolveFenixFlix`.
  - Added dynamic Referer and Origin headers in `resolve.js` for Fenix streams.
  - Preserved `customOrigin` in playlist rewriting and segment proxying.
- **`functions/api/stream.js` & `tools/local_server.py`:**
  - Added automatic detection for `zunderflix` domains (`customReferer = https://zunderflix.lat/`, `customOrigin = https://zunderflix.lat`).
  - Preserved `origin` across rewritten sub-playlists and segments.
  - Updated `is_m3u8` to detect `hls-proxy`.
- **`tools/local_providers.py`:**
  - Synced with `functions/api/providers.js`: dual candidate endpoints and `hls-proxy` detection.

---

## 3. Verification

- `python tools/check_js.py` (0 missing imports)
- `python tools/bump_version.py --check` (`20261110_0945`)
- `python tools/test_security_headers.py` (0 failures)
- `python tools/test_resolve_cors.py` (0 failures)
- Headless Chrome tests:
  - Fight Club (550, no `imdb_id` pre-set) -> Resolved to `tt0137523` -> Loaded Fenix stream -> `hls:manifest_parsed` -> HTTP 206 video segment streaming.
  - Breaking Bad (1396, no `imdb_id` pre-set) -> Resolved to `tt0903747` -> Loaded Fenix stream -> HTTP 206 video segment streaming.
