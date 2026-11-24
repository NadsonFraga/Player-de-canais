# Handover: FenixFlix Origin Header Fix & Dynamic Live Channels Sync

- **Date:** 2026-11-24
- **Branch:** `feat/fix-fenix-origin-and-channels-sync`
- **Target:** `staging`

## 1. Context & Motivation
- Staging was failing to load FenixFlix 1080p FHD streams for movies and series, reporting dead sources or HTTP 403.
- Upstream host `hub.fenixhub.online` actively blocks incoming requests carrying `Origin: https://fenixflix.fenixhub.online` or `Referer: https://fenixflix.fenixhub.online/` with HTTP 403 `{"error":"Origem bloqueada"}`.
- Direct TV channels stopped working because EmbedTV domains moved to `rdembed.online` / `penterosa.lat` with rotating 5-minute HMAC tokens, and the GitHub Actions refresh workflow had not been merged into the active branch.

## 2. Key Changes
- **FenixFlix Proxy & Resolver (`functions/api/resolve.js`, `functions/api/stream.js`, `tools/local_server.py`)**:
  - Stripped `Origin` and `Referer` headers when proxying or directly requesting Fenix streams. This permits direct upstream CDN streaming with HTTP 206 Partial Content.
- **Dynamic Live Channel Resolution (`functions/api/resolve.js`, `tools/local_server.py`)**:
  - Implemented `resolveLiveChannel(slug)` following the `rdembed.online` -> `penterosa.lat` extraction sequence.
  - Added on-demand resolution via `/api/resolve?type=channel&id={slug}`.
- **Player Auto-Heal (`assets/js/player/engine.js`)**:
  - Enhanced `mountTvDirectStream()` to automatically attempt dynamic auto-heal on failure by querying `/api/resolve?type=channel&id={slug}` before cascading to fallback options.
- **Extractor & Automated Refresh (`tools/extract_channel_stream.py`, `.github/workflows/refresh_channels.yml`)**:
  - Rewrote extraction logic for `rdembed.online` -> `penterosa.lat`.
  - Added GitHub Actions workflow scheduled every 2 hours to update `data/canais.json` and `assets/js/core/fallbackChannels.js`.
  - Ran batch extraction across all channels (34 live channels directly updated).

## 3. Verification & Results
- Verified movie stream resolution on Fight Club (550): resolves Fenix 1080p Dual Áudio, streams with HTTP 206 without 403 blocks.
- Verified dynamic live channel extraction on Globo, SporTV, ESPN, HBO, Combate, etc.
- Checked import integrity, bumped version stamp, passed security tests.
