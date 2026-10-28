# Feature Plan: FenixFlix Dual Audio Recognition & Source Tier Ranking

**Slug:** `fenixflix-dual-audio-priority`  
**Date:** 2026-10-27  
**Branch:** `feat/fenixflix-dual-audio-priority`  

---

## 1. Problem Statement
When requesting Lupin Part 2+ (e.g. Lupin S2E1 / Episode 6 "Capítulo 6", TMDB `96677`, IMDb `tt2531336`), FenixFlix played a completely different American TV show in 480p instead of the authentic Netflix Lupin stream with Omar Sy.

### Root Causes
1. **Audio Tag Detection Defect:**
   - In `assets/js/player/clientProviders.js`, `functions/api/providers.js`, and `tools/local_providers.py`:
     `const isDubbed = text.includes('dublado') || text.includes('nacional');`
   - Official FenixHub stream titles use:
     `🐦‍🔥 Lupin ⏸️ T02 EP01 🇧🇷🇺🇸 Dual Áudio 📍 FenixHub`
   - Because it contained `"Dual Áudio"` rather than `"dublado"`, `isDubbed` evaluated to `false`. When the client requested dubbed audio (`audio === 'dubbed'`), the authentic 1080p stream was completely discarded.
2. **Untrusted Scraper Priority over Official Library:**
   - Sorting contained: `if (a.type === 'hls' && b.type !== 'hls') return -1;`
   - Hollymovies (`embedplayer2.xyz`) provides low-bitrate 480p HLS re-encodes under a deceptive `"FenixFlix 1080p"` label, and has misindexed Lupin S2E1 with another show.
   - The HLS sort preference placed Hollymovies above official FenixHub direct streams (`squareweb.app`, `koyeb.app`, `fenixhub.online`), even when qualities matched.
3. **Direct MP4 Host Whitelist:**
   - `clientProviders.js` whitelist for `isDirectMp4` lacked `squareweb.app` and `fenixbot`, forcing direct MKV/MP4 streams to be proxied unnecessarily.

---

## 2. Solution Design
1. **Expand PT-BR Audio Recognition (`isDubbed`):**
   - In `clientProviders.js`, `providers.js`, and `local_providers.py`, recognize all Brazilian release audio markers:
     `dublado`, `nacional`, `dual`, `dual áudio`, `dual audio`, `multi`, `tri áudio`, `pt-br`, `ptbr`, and `🇧🇷` (unless marked `legendado`).
2. **Provider Priority Tier Scoring:**
   - Tier 3: `📍 FenixHub` official library uploads (`squareweb.app`, `koyeb.app`, `fenixhub.online`, `fenixbot`).
   - Tier 2: `⚡ Zunder` verified mirrors (`zunderflix`).
   - Tier 1: `⭐️ Hollymovies` untrusted third-party scraper (`embedplayer2.xyz`).
   - Rank by: Provider Tier > Resolution Quality > HLS tie-breaker within identical tier & quality.
3. **Direct Host Whitelist:**
   - Add `squareweb.app` and `fenixbot` to `isDirectMp4` whitelist across client and backend resolvers.

---

## 3. Scope
- `assets/js/player/clientProviders.js`
- `functions/api/providers.js`
- `tools/local_providers.py`
- `functions/api/resolve.js`
- `tools/local_server.py`
- Version stamping via `tools/bump_version.py`
- Verification test matrix

