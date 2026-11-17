# Feature Plan: FenixFlix IMDb Resolution & Zunder Host Header Resilience

> **Date:** 2026-11-10  
> **Branch:** `feat/fenix-imdb-and-zunder-resilience`  
> **Status:** In Progress  

---

## 1. Context & Problem Statement

Users reported that Fenix Player was failing with "Fenix Player (BETA) sem resposta" almost instantaneously on all movies and series.

Investigation revealed two root causes:
1. **Missing IMDb ID on Client Extraction:** Catalog items (discovery feed, carousel, search) contain only numeric TMDB `id`. FenixFlix recently stopped serving streams under `tmdb:{id}` on many titles, returning empty streams `{"streams":[],"cacheMaxAge":60}`. When queried with IMDb ID (`tt...`), FenixFlix returns full 1080p streams. `resolveFenixFlixClient` was not querying TMDB for `imdb_id`.
2. **Hardcoded Referer Breaking Zunderflix HLS Streams (`{"error":"cross_site"}`):** FenixFlix now serves almost all streams via `zunderflix.lat`. `clientProviders.js` hardcoded `Referer: https://embedplayer2.xyz/` for every stream. `zunderflix.lat` inspects the Referer header and rejects cross-site embedplayer2 requests with HTTP 403 `{"error":"cross_site"}`. When Referer and Origin match `https://zunderflix.lat/`, streams resolve and play in 1080p.

---

## 2. Proposed Architecture & Fixes

1. **Client-Side IMDb Resolution & Dual-Query Fallback (`assets/js/player/clientProviders.js`):**
   - Import `fetchTmdb` from `../core/tmdb.js`.
   - If no `imdbId` is present and numeric `id` is provided, fetch `imdb_id` from TMDB (`movie/${id}` or `tv/${id}/external_ids`).
   - Query candidate endpoints prioritizing IMDb ID (`tt...`), falling back to `tmdb:{id}`.
2. **Host-Specific Dynamic Referer & Origin Mapping:**
   - In `clientProviders.js`, map stream URL domains:
     - `zunderflix` / `zunder` -> Referer: `https://zunderflix.lat/`, Origin: `https://zunderflix.lat`
     - `hollymovies` -> Referer: `https://hollymovies.org/`, Origin: `https://hollymovies.org`
     - `fenixhub` / `fenixflix` / `embedplayer2` -> Referer: `https://embedplayer2.xyz/`, Origin: `https://embedplayer2.xyz`
     - Generic: stream URL origin.
3. **Edge Proxy Alignment (`functions/api/stream.js` & `tools/local_server.py`):**
   - Update automatic referer/origin detection to detect `zunderflix.lat`.
   - Preserve `customOrigin` when rewriting HLS playlists and segments.
4. **Backend Server Resolver Alignment (`functions/api/resolve.js` & `functions/api/providers.js`):**
   - Resolve IMDb ID if missing before calling `resolveFenixFlix`.
   - Dynamic referer mapping for Fenix sources.

---

## 3. Verification Plan

- `python tools/check_js.py`
- `python tools/bump_version.py`
- Test suite verification (`test_security_headers.py`, `test_resolve_cors.py`).
- Automated Chrome CDP end-to-end playback test.
