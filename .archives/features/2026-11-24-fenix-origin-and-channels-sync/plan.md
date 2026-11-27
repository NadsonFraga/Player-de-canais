# Plan: Fix FenixFlix Origin Header and Restore Dynamic Live Channels Sync

## 1. Problem Statement
1. **FenixFlix / MGEB Direct Servers Failing on Staging:**
   - On Staging (`https://staging.tvzinhaonline.pages.dev`), FenixFlix 1080p FHD streams return dead or fail with HTTP 403.
   - Upstream host `hub.fenixhub.online` actively blocks requests that include `Origin: https://fenixflix.fenixhub.online` or `Referer: https://fenixflix.fenixhub.online/` returning `{"error":"Origem bloqueada"}`.
   - By clearing `Origin` and `Referer` headers when proxying or directing to Fenix streams, upstream allows full byte-range media requests (HTTP 206 Partial Content).
2. **Direct TV Channels Broken:**
   - Previous tokens in `data/canais.json` expired and EmbedTV endpoints (`w7.embedtv.cc` / `w7.embedtv.lat`) died with SSL mismatch.
   - The active embed cluster migrated to `rdembed.online` / `v1.rdembed.online` / `w1.rdembed.online` routing to `penterosa.lat`, issuing 5-minute rotating HMAC tokens.
   - Without an automated refresh workflow or dynamic resolver, static tokens expire quickly.

## 2. Architecture & Implementation Strategy
1. **Movies/Series Stream Proxy & Resolver:**
   - Update `functions/api/resolve.js`, `functions/api/stream.js`, and `tools/local_server.py` to set empty `referer` and `origin` for `fenixhub` and `fenixflix` domains.
2. **Dynamic Live Channel Resolution:**
   - Update `tools/extract_channel_stream.py` to follow the 3-step iframe resolution chain:
     1. GET `https://rdembed.online/{slug}`
     2. GET `https://rdembed.online/__play/{slug}?pt=...`
     3. GET `https://penterosa.lat/?...` -> extract `"ref"` path
     4. POST `https://penterosa.lat{ref}` -> returns `{ "src": "https://...bombrilhoso.lat/docs/.../__index.txt?token=..." }`
   - Add endpoint `/api/resolve?type=channel&id={slug}` to `functions/api/resolve.js` and `tools/local_server.py`.
   - Add dynamic auto-heal in `mountTvDirectStream()` (`assets/js/player/engine.js`) so that if a direct channel fails or has an expired token, it fetches `/api/resolve?type=channel&id={slug}` and auto-recovers on the fly.
3. **Automated Refresh Workflow:**
   - Create `.github/workflows/refresh_channels.yml` running every 2 hours via cron to update `data/canais.json` and `assets/js/core/fallbackChannels.js`.
4. **Verification & Testing:**
   - Batch extraction of all 52 channels.
   - Run import integrity, bump version, check headers and XSS protection.
   - Merge `--no-ff` into `staging`, push, and verify live.
