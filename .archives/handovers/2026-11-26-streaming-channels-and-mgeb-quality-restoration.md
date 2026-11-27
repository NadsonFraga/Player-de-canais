# 2026-11-26 - Streaming Channels & MGEB Quality Restoration

## 1. Problem Statement
- Live TV direct channels failed on Staging and Master with "Player Principal sem resposta" (e.g. SporTV).
- Titles on MGEB loaded in 480p SD quality instead of 1080p/720p HD.
- Series on MGEB and Fenix showed inconsistent or missing sources compared to localhost.
- Discrepancy between localhost and Staging/Master due to IP-locking, datacenter execution timeouts, and static token expiry.

## 2. Root Cause Analysis
1. **Live TV Channels Failure:**
   - Upstream CDN (`bombrilhoso.lat` / `penterosa.lat`) tokens expire strictly in 300 seconds (5 minutes) and are IP-locked to the requester.
   - Static tokens stored in `data/canais.json` expired shortly after commit. When passed directly to client browsers (`direct_url`), requests failed with HTTP 403 Forbidden.
   - Dynamic resolution on channel mount was previously nested only within error cascade handlers after a 12s timeout.
2. **MGEB 480p Quality Root Cause:**
   - Upstream host `mgeb.space` was prioritized first with a 25s timeout; hanging requests caused Cloudflare Pages Functions to terminate after 10-15s (HTTP 504).
   - In `functions/api/resolve.js` and `tools/local_server.py`, `cache/hls` (480p SD) was classified as Tier 1 (Score 95), while `playercdn` (1080p/720p HD) was scored 60 and flagged as low trust (`isLowTrustSource`). Consequently, 480p was ranked above HD sources.
3. **FenixFlix Series vs Movies:**
   - FenixFlix's upstream Stremio addon currently indexes movies (e.g. Coraline with 8 streams in 1080p Dual Audio), but returns zero streams for TV series.
   - Client provider extraction lacked automatic fallback to server resolution (`/api/resolve`) when client extraction returned null.

## 3. Implemented Solutions
1. **Live Channel Auto-Healing & Streaming Proxy:**
   - `functions/api/resolve.js`: Wrapped `resolveLiveChannel` stream URL with signed `/api/stream` proxy (`Referer: https://penterosa.lat/`) and set `direct_url: null`.
   - `assets/js/player/engine.js`: Added immediate token auto-heal on `mountTvDirectStream` when a channel slug is present and the source URL contains static/expired tokens.
   - Reduced manifest/level loading timeout in `customType.m3u8` to prevent multi-retry hanging on network failures.
2. **MGEB High-Definition Stream Priority:**
   - `functions/api/resolve.js` & `tools/local_server.py`:
     - Prioritized `mgeb.lat` before `mgeb.space` with a 5s per-host timeout.
     - Reclassified `playercdn` and `workers.dev` to Tier 1 (Score 95) and demoted `cache/hls` to Tier 3 (Score 60).
     - Removed re-hosting mirror penalty from `isLowTrustSource`.
3. **Client Extraction & Fallback Architecture:**
   - `assets/js/player/clientProviders.js`: Implemented `resolveMgebClient` to resolve MGEB streams directly in the client browser, binding CDN tokens to the user's residential IP.
   - `assets/js/player/engine.js`: Structured `resolveDirectStream` to gracefully fall back to server resolution (`fetchServerDirectStream`) whenever client extraction yields no valid streams.
4. **Parity & Cache Busting:**
   - Full parity maintained between `functions/api/resolve.js` and `tools/local_server.py`.
   - Bumped cache version stamp (`20261126_1736`) across 33 files.
   - Automated tests validated: import check, version integrity, security headers, CORS verification, and XSS protection.

## 4. Verification & Status
- Branch `staging` synchronized with `origin/staging` (commit `1b47f39`).
- Live tests against `https://staging.tvzinhaonline.pages.dev`:
  - `GET /api/resolve?type=channel&id=sportv` -> HTTP 200 with active signed proxy stream and valid HLS chunks (`.woff`).
  - `GET /api/resolve?type=series&id=1396&season=1&episode=1` (Breaking Bad) -> HTTP 200.
  - `GET /api/resolve?type=movie&id=1084244` (Toy Story 5) -> HTTP 200 with 720p/1080p stream.
