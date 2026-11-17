# Handover: Live Channels Token Refresh & Direct Failover Resilience

- **Branch:** `staging` (merged from `feat/live-channels-token-refresh`)
- **Date:** 2026-11-17
- **Version:** `20261117_0941`
- **Objective:** Diagnose and fix live channels failure (spinning loader followed by "Player Principal sem resposta" error overlay on Globo, Band, etc.) and harden direct stream failover.

## Root Cause
- The direct HLS stream tokens in `data/canais.json` and `assets/js/core/fallbackChannels.js` (pointing to `s25-cloudfront-net.lat/.../error.txt`) expired, causing HTTP 404 responses across 52 of 57 channels.
- In `assets/js/player/engine.js`, the HLS `NETWORK_ERROR` handler called `hls.startLoad()` on manifest errors, stalling the player for the full 12-second watchdog timeout per source (24 seconds total wait before displaying error).
- When direct sources failed, the error overlay only had a "Tentar Reconectar" button, leaving users stranded even when functional contingency iframe servers were configured for that channel.

## Key Changes
1. **Catalog Stream Tokens Refreshed:**
   - Ran `tools/extract_channel_stream.py --all` across 52 unique channel slugs.
   - Restored direct streaming across 52 active channels (Globo, Band, SBT, Record, SporTV 1-3, Premiere 1-5, ESPN 1-5, HBO 1-4, etc.).
   - Synchronized `data/canais.json` and `assets/js/core/fallbackChannels.js`.
2. **Instant Failover on Fatal Manifest Network Errors:**
   - In `assets/js/player/engine.js` (`mountTvDirectStream`), detected early manifest load errors (`/manifest|level/i` or HTTP status >= 400) before playback starts (`!isStreamWorking`) and triggered immediate cascade without waiting for the 12-second watchdog timer.
   - Synchronized active server button states via `onSourceChanged` callback so UI reflects the active backup source immediately.
3. **Contingency Failover Action in Error Overlay:**
   - Updated `handleAllDirectSourcesFailed(onRetry, onContingency)` to render an "Usar Servidor Alternativo" action button alongside "Tentar Reconectar" when contingency options exist.
   - Added styles `.btn-error-contingency` and `.btn-error-secondary` in `assets/css/10-player-v3.css`.
   - Connected `startDirectStream` in `assets/js/modules/channels.js` to automatically wire the first contingency option as the failover action.

## Verification
- `python tools/check_js.py` (0 missing imports)
- `python tools/bump_version.py --check` (version 20261117_0941)
- `python tools/test_security_headers.py` (0 failures)
- `python tools/test_resolve_cors.py` (0 failures)
- `node tools/test_xss_protection.mjs` (24 passed, 0 failed)
- `node tools/player_ui_check.mjs --browser=chrome` (Band direct playback verified active)
- Staging deployed live at `https://staging.tvzinhaonline.pages.dev` with version `20261117_0941`.

## Next Step
- User manual test checklist on staging.
- Explicit approval required to merge `staging` into `master` for production deployment.
