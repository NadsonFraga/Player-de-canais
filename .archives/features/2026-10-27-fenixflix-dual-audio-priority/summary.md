# Feature Summary: FenixFlix Dual Audio Recognition & Source Tier Ranking

**Slug:** `fenixflix-dual-audio-priority`  
**Date:** 2026-10-27  
**Branch:** `feat/fenixflix-dual-audio-priority`  

---

## 1. Overview
Diagnosed and resolved an issue where requesting Lupin Part 2+ on FenixFlix (e.g. Lupin S2E1 / Episode 6) played a completely different American TV series in 480p instead of the genuine Netflix Lupin stream with Omar Sy.

---

## 2. Changes Made
1. **Audio Tag Recognition:**
   - In `assets/js/player/clientProviders.js`, `functions/api/providers.js`, and `tools/local_providers.py`, updated `isDubbed` to include `dual` (`dual áudio`, `dual audio`), `multi`, `tri áudio`, `pt-br`, `ptbr`, and `🇧🇷` (unless marked `legendado`).
   - Prevents authentic Dual Áudio streams from being discarded when the user prefers dubbed audio.
2. **Provider Priority Tier Scoring:**
   - Introduced provider trust tiers in source sorting:
     - Tier 3: `📍 FenixHub` official library streams (`fenixhub.online`, `squareweb.app`, `koyeb.app`, `fenixbot`).
     - Tier 2: `⚡ Zunder` verified mirrors (`zunderflix`).
     - Tier 1: `⭐️ Hollymovies` third-party scrapers (`embedplayer2.xyz`).
   - Sorting prioritizes `providerTier` > `quality` > `type == 'hls'`.
   - Prevents untrusted scrapers with fake 1080p tags from superseding official library streams.
3. **Direct Stream Host Whitelisting:**
   - Added `squareweb.app` and `fenixbot` to `isDirectMp4` across `clientProviders.js`, `functions/api/resolve.js`, and `tools/local_server.py`.
   - Enables direct byte-range HTML5 video playback without proxy latency.
4. **Version Stamp:**
   - Synchronized all assets and imports to version `20261027_1747`.

---

## 3. Verification
- All automated test suites (`check_js.py`, `bump_version.py --check`, `test_mgeb_rules.py`, `test_security_headers.py`, `test_resolve_cors.py`) passed with 0 errors.
- Verified Lupin S2E1, S2E2, S3E1, Breaking Bad, Stranger Things, and Avengers Endgame correctly select FenixHub streams as primary.
- Verified in headless Chrome that Lupin S2E1 direct stream reaches `readyState=4` at `1920x1080`.
