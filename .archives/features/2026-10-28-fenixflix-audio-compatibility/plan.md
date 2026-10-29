# Feature Plan: FenixFlix Audio Compatibility & Stream Tier Ranking

**Slug:** `fenixflix-audio-compatibility`  
**Date:** 2026-10-28  
**Branch:** `feat/fenixflix-audio-compatibility`  

---

## 1. Problem Statement
When viewing *Rick and Morty* (S08E04 / Ep. 75 "The Last Temptation of Jerry") on FenixFlix, video playback started normally but was completely silent (no audio).

### Root Cause
1. **Audio Codec Incompatibility:**
   - Stream #1 returned by FenixFlix was `https://fenixbot.squareweb.app/stream/58761?hash=...` (`video/x-matroska`).
   - The stream contained dual audio tracks encoded in `A_EAC3` (Dolby Digital Plus / E-AC-3 5.1).
   - Standard web browsers (Chrome, Edge, Firefox, Android Chrome) lack Dolby E-AC-3 software decoders in HTML5 `<video>` / MSE due to proprietary licensing fees.
   - The browser decodes H.264 video cleanly while silently discarding E-AC-3 audio packets, producing completely silent playback.
2. **Suboptimal Tier Classification:**
   - Both `squareweb.app` and `fenixbot` were previously classified in `providerTier = 4`, placing un-transcoded bot torrent streams on the same level as dedicated VOD web masters (`fenixhub.online`).
   - Consequently, when sorting matching 1080p streams, the raw torrent proxy took precedence over web-optimized MP4s (Zeus and Badger) and HLS streams (Hollymovies), both of which have universal `mp4a` (AAC) stereo audio.

---

## 2. Solution Design
1. **Differentiate Web VOD Masters from Bot Torrent Streams:**
   - **Tier 4 (Official VOD Web Masters):** `fenixhub.online` (Zeus, Badger) — dedicated web MP4 files with universal AAC stereo audio and fast CDN delivery.
   - **Tier 3 (Verified Mirrors / Direct CDNs):** `zunder`, `zunderflix`.
   - **Tier 2 (Third-party Web Scrapers / Adaptive HLS):** `hollymovies`, `embedplayer2.xyz` — adaptive HLS with AAC stereo audio.
   - **Tier 1 (Bot Torrent Proxies):** `squareweb.app`, `koyeb.app`, `fenixbot`, or any `/stream/` endpoint — raw MKVs with E-AC-3 audio and sleep-prone cloud containers, retained as last-resort fallback.
2. **Synchronization across Stack:**
   - Update `assets/js/player/clientProviders.js`
   - Update `functions/api/providers.js`
   - Update `tools/local_providers.py`
3. **Cache Busting & Staging Deployment:**
   - Stamp unique version `20261028_2242` via `tools/bump_version.py`.
   - Run verification test matrix.
   - Merge into `staging` and push.

---

## 3. Scope
- `assets/js/player/clientProviders.js`
- `functions/api/providers.js`
- `tools/local_providers.py`
- Version stamping across `index.html` and ES modules.

