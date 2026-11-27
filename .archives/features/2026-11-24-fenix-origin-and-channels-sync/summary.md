# Summary: FenixFlix Origin Header Fix & Dynamic Live Channels Auto-Heal

## 1. Overview
This feature resolves two critical streaming issues reported during Staging tests:
1. **FenixFlix / MGEB Direct Servers 403 on Staging**: Upstream cluster `hub.fenixhub.online` blocked requests bearing `Origin: https://fenixflix.fenixhub.online` or `Referer: https://fenixflix.fenixhub.online/` with HTTP 403 `{"error":"Origem bloqueada"}`. Both edge functions (`functions/api/resolve.js`, `functions/api/stream.js`) and local dev server (`tools/local_server.py`) were updated to strip the origin/referer headers for Fenix streams, enabling direct HTTP 206 Partial Content byte-range streaming.
2. **Live TV Direct Channels Restored**: EmbedTV domains migrated to `rdembed.online` / `penterosa.lat` with rotating 5-minute HMAC tokens. We updated `tools/extract_channel_stream.py` to target the new embed provider chain, implemented an on-demand live channel resolution endpoint `/api/resolve?type=channel&id={slug}`, added real-time auto-healing to `mountTvDirectStream()` in `assets/js/player/engine.js`, and created `.github/workflows/refresh_channels.yml` to refresh channel tokens automatically every 2 hours.

## 2. Changes Made
- `functions/api/resolve.js`:
  - Stripped `referer` and `origin` for `fenixhub` / `fenixflix` streams.
  - Added `resolveLiveChannel(slug)` function and handle `type === "channel"` or `type === "live"`.
- `functions/api/stream.js`:
  - Stripped `customReferer` and `customOrigin` for Fenix streams so upstream direct CDN streaming works without 403.
- `tools/local_server.py`:
  - Mirrored edge function behavior for Fenix origin stripping and `/api/resolve?type=channel&id={slug}` live channel resolution.
- `tools/extract_channel_stream.py`:
  - Rewritten to navigate `rdembed.online` -> `penterosa.lat` 3-stage iframe and POST extraction chain.
- `assets/js/player/engine.js`:
  - Added dynamic auto-heal in `mountTvDirectStream()`. If a direct channel fails or has an expired token, it queries `/api/resolve?type=channel&id={slug}` to fetch a fresh token dynamically.
- `.github/workflows/refresh_channels.yml`:
  - Added automated 2-hour cron job to execute `python tools/extract_channel_stream.py --all` and push updated tokens.

## 3. Verification
- Batch extracted all channels into `data/canais.json` and `assets/js/core/fallbackChannels.js`.
- Successfully validated 1080p stream resolution and HTTP 206 byte streaming.
- Ran test verification matrix: `check_js.py`, `bump_version.py`, security and XSS checks.
