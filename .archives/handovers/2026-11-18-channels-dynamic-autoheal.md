# Handover: Live Channels Dynamic Auto-Heal & High-Frequency Refresh

- **Branch:** `master` (merged from `hotfix/channels-dynamic-autoheal`)
- **Date:** 2026-11-18
- **Version:** `20261118_1505`
- **Objective:** Prevent live channels from ever stalling due to upstream token expiration by adding client-side auto-healing and increasing scheduled token renewal.

## Key Changes
1. **Engine Dynamic Auto-Heal (`assets/js/player/engine.js`):**
   - Automatically catches 404/manifestLoadError, queries EmbedTV endpoint (`w7.embedtv.cc/{slug}` with CORS `*`), parses `const src = "..."`, and restarts playback with the newly issued token.
2. **Channel Data Refresh:**
   - Updated all 52 channels in `data/canais.json` and `assets/js/core/fallbackChannels.js`.
3. **Cron Interval Shortened:**
   - Scheduled workflow runs every 2 hours (`0 */2 * * *`) instead of every 6 hours.
