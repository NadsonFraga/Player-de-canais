# Plan: Live Channels Dynamic Auto-Heal & High-Frequency Refresh

- **Branch:** `hotfix/channels-dynamic-autoheal`
- **Target:** `master`
- **Date:** 2026-11-18
- **Version:** `20261118_1505`
- **Objective:** Eliminate live channel dropouts caused by aggressive 2-3 hour token expiration upstream at EmbedTV by implementing on-the-fly dynamic auto-heal in the player and shortening the scheduled refresh interval.

## Scope of Changes
1. **Dynamic Stream Auto-Heal (`assets/js/player/engine.js`):**
   - In `triggerDirectCascade`, before escalating to fallback sources or displaying the "Player Principal sem resposta" error overlay, inspect if the failed source carries a valid EmbedTV `slug`.
   - If present and not previously auto-healed in the current activation, query `https://w7.embedtv.cc/{slug}` and `https://w7.embedtv.lat/{slug}` with `{ cache: 'no-store' }`.
   - Extract the live `const src = "..."` HLS manifest URL in real time (~200ms latency), update the source URL in memory, and immediately retry playback.
2. **Fresh Token Extraction Across All 52 Slugs:**
   - Executed `tools/extract_channel_stream.py --all` to stamp the latest tokens into `data/canais.json` and `assets/js/core/fallbackChannels.js`.
3. **Automated Refresh Frequency Adjusted:**
   - Updated `.github/workflows/refresh_channels.yml` schedule from 6 hours to 2 hours (`0 */2 * * *`).
4. **Cache Busting:**
   - Bumped version to `20261118_1505`.
