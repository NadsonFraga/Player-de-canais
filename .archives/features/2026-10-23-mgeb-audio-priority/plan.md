# Feature: MGEB Dubbed Audio Priority & Player Server Selection Fix

**Slug:** `mgeb-audio-priority`  
**Date:** 2026-10-24  
**Status:** In Planning  

---

## 1. Context & Root Cause Analysis

### A. MGEB Spider-Man Audio Issue (*Homem-Aranha: Sem Volta Para Casa* / TMDB `634649`):
- **Problem:** When requesting dubbed (`lang=dub`), an unverified English 1080p MP4 from Streamtape outranked the genuine Brazilian Portuguese 720p stream from Fontedecanais.
- **Root Causes:**
  1. Verified Brazilian IPTV/VOD CDNs (`fontedecanais`, `77zzhf54vdll71.com`, `57lgoe65efxo71.com`) were not tagged with `has_pt_audio: true` in `probe_source`.
  2. In `rank_sources_by_quality`, resolution sorting `((b.quality || 0) - (a.quality || 0))` ranked the 1080p stream over the 720p stream because neither was marked with `has_pt_audio: true`.
- **Solution:** Tag native Brazilian CDNs with `has_pt_audio: true` when `is_dubbed=true`. In `rank_sources_by_quality`, `-(has_pt_audio)` ranks before pure resolution, guaranteeing confirmed Portuguese audio takes precedence on dubbed requests.

### B. Original Audio Exemption (Clarification & Verification):
- **Requirement:** As highlighted, `anime_native` (Anime Nativo / Zoko) and `movy` are dedicated to **original audio** (Japanese/English with subtitles).
- **Rule:** PT-BR audio requirements and language mismatch filtering apply **exclusively** when `is_dubbed = true` (`lang=dub`). Subtitled routes (`lang=sub`), `anime_native`, and original audio providers must **never** be penalized or blocked by PT-BR audio filters.

### C. Anime Player & Movy Failure Root Cause:
- **Problem:** The user reported that the anime player failed on multiple works (such as Jujutsu Kaisen), and Movy failed on all works.
- **Root Causes:**
  1. **Movy Network Failure:** Movy relies on `api.wecollege.net/seed`. In the user browser, Wecollege rejects CORS from any origin other than `movy.sx` with `TypeError: Failed to fetch`. On Cloudflare Pages (`functions/api/providers.js`), Cloudflare worker egress IPs are blocked by Wecollege WAF (returning 403/404).
  2. **Sticky Session Bug in `series.js`:** When the user clicked "Movy" (or any server), `activeSeriesPlaying.userSelectedServer = true` and `activeSeriesPlaying.server = 'native_movy'` were persisted in memory.
  3. In `series.js`:
     ```javascript
     if (!isAnime && activeSeriesPlaying.server === 'native_anime') {
         activeSeriesPlaying.server = 'native_direct';
     } else if (isAnime && !activeSeriesPlaying.userSelectedServer) {
         activeSeriesPlaying.server = 'native_anime';
     }
     ```
     Because `userSelectedServer` was `true`, opening subsequent animes (Jujutsu Kaisen, Demon Slayer, etc.) **never reset the server to `native_anime`**, remaining locked on `native_movy`. Movy immediately threw `TypeError: Failed to fetch`, displaying *"Movy sem fontes"* across all animes!
- **Solution:**
  1. Reset `activeSeriesPlaying.userSelectedServer = false` and `activeSeriesPlaying.server = null` whenever a show is changed or the player is closed.
  2. Ensure that whenever an anime is opened, if the selected server is not anime-capable, it automatically falls back to `native_anime`.
  3. Remove or hide Movy from `CLIENT_PROVIDERS` and server lists until an external proxy is configured.

---

## 2. Proposed Changes

### Phase 1: Fix Session State & Server Isolation in `series.js` and `clientProviders.js`
- **`assets/js/modules/series.js`:**
  - Reset `activeSeriesPlaying.userSelectedServer = false` and clear `activeSeriesPlaying.server` in `stopSeriesPlayer()` and when opening a new title.
  - When opening an anime, if the active server is not in the anime server list (e.g., `native_direct`, `native_fenix`, `native_movy`), default to `native_anime`.
  - In `SERIES_SERVER_OPTIONS`, remove/disable `native_movy` to prevent poisoning user playback with CORS-blocked hosts.
- **`assets/js/player/clientProviders.js`:**
  - Remove `movy` from `CLIENT_PROVIDERS` to prevent un-corsable direct browser requests.

### Phase 2: Brazilian CDN PT-BR Audio Tagging & Parity
- **`tools/local_server.py` and `functions/api/resolve.js`:**
  - In `probe_source` / `probeSource`: tag verified Brazilian CDN streams (`fontedecanais`, `77zzhf54vdll71.com`, `57lgoe65efxo71.com`) with `has_pt_audio = true`.
  - In `rank_sources_by_quality`: verify that `has_pt_audio` ranks above raw resolution when `is_dubbed = true`, ensuring 720p PT-BR beats 1080p English on dubbed requests.
  - Guarantee that `anime_native` and subtitled routes never apply PT-BR filtering.

### Phase 3: Automated Testing & Browser Verification
- Run `python tools/test_mgeb_rules.py` to verify unit rules and parity between local server and Cloudflare worker.
- Test Spider-Man (`634649`) via local server and verify Fontedecanais PT-BR is selected as primary.
- Test anime playback (Jujutsu Kaisen, Demon Slayer, Solo Leveling) in headless Chrome, verifying that Anime Nativo loads 1080p HLS without server lock regressions.

### Phase 4: Version Bump, Staging Deploy & Staging Test
- Run `python tools/bump_version.py`.
- Commit and push to `staging` (as explicitly requested by user in prompt 3).
- Verify playback on `https://staging.tvzinhaonline.pages.dev/`.

---

## 3. Verification Criteria
1. `python tools/test_mgeb_rules.py` passes 100%.
2. Resolving Spider-Man (`634649`, `type=movie`, `lang=dub`) selects Portuguese-audio Fontedecanais source as primary.
3. Anime Nativo (Legendado) plays Jujutsu Kaisen and Demon Slayer without error.
4. Switching titles no longer leaves the player stuck on broken servers.
5. Strict parity maintained between `functions/api/resolve.js` and `tools/local_server.py`.
