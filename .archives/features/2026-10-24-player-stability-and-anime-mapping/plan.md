# Feature Plan: Player Stability, Teardown Integrity & Anime Season Mapping

**Slug:** `player-stability-and-anime-mapping`  
**Date:** 2026-10-24  
**Status:** In Planning (Phase 1)  

---

## 1. Objective & Scope

### In Scope
1. **Ghost Audio Elimination & Teardown Integrity (P0):**
   - Ensure that whenever a player fails, switches servers, or displays an error screen (`onAllFailed`, `resolveDirectStream.catch`), all underlying media elements (`<video>`, Artplayer, and Hls.js) are completely stopped, muted, cleared (`src=""`), and destroyed via `atomicPlayerReset()` before updating the DOM.
2. **Quality & Dubbed Ranking Overhaul (P1):**
   - Fix the ranking inversion where a 480p source was preferred over a 720p/1080p source.
   - Refactor `rankSourcesByQuality` in both `functions/api/resolve.js` and `tools/local_server.py`: resolution/quality tiers (1080p > 720p > 480p) take precedence over CDN heuristics. `has_pt_audio` acts as a tie-breaker among comparable quality tiers rather than promoting lower resolutions.
   - Fix false PT-BR audio assumption on English audio streams.
3. **Anime Season Mapping & TMDB Lumped Seasons (P1):**
   - Address the TMDB season lumping bug where animes like *Jujutsu Kaisen* (59 episodes lumped in Season 1) break MAL/ZokoAnime and MGEB.
   - In `assets/js/modules/series.js`, detect shows with episode groups (type 6 "Seasons") or split seasons, presenting genuine seasons (Season 1, Season 2) to the user.
   - Ensure the episode context calculates both the real season/episode (e.g., Season 2 Episode 17) and the absolute episode (Ep. 41), resolving correctly on Anime Nativo (MAL 51009) without 404s.
4. **Active Servers Stabilization:**
   - Focus strictly on stabilizing the 3 active native players:
     1. Player Principal (MGEB)
     2. FenixFlix (Dublado)
     3. Anime Nativo (Legendado)
   - Exclude addition of any new 3rd server for original audio in this cycle (deferred to future extraction).

### Out of Scope
- Adding new external providers or re-extracting Rive/Movy.
- Modifying Cloudflare Turnstile or user accounts.

---

## 2. Impacted Files

| File | Change Type | Purpose |
| :--- | :--- | :--- |
| `assets/js/player/engine.js` | Modification | Invoke `atomicPlayerReset()` on `onAllFailed` and ensure strict media element disposal in `releaseVideoElement()`. |
| `assets/js/modules/series.js` | Modification | Add teardown call before error templates, implement TMDB episode group season splitting for animes. |
| `assets/js/modules/movies.js` | Modification | Add teardown call before error templates in movie player. |
| `functions/api/resolve.js` | Modification | Refactor quality ranking order; prevent 480p promotion over 720p/1080p. |
| `tools/local_server.py` | Modification | Maintain 100% strict parity with `functions/api/resolve.js`. |
| `tools/test_mgeb_rules.py` | Modification | Add test assertions for quality ranking priority and anime season mappings. |
| `scratch/test_player_stability.mjs` | Creation | Automated headless browser verification for audio teardown, quality ranking, and anime season 2 playback. |

---

## 3. Step-by-Step Strategy

### Step 1: Teardown Integrity & Ghost Audio Fix
- In `assets/js/player/engine.js`:
  - In `nextPlayableIndex` fallback when `nextIdx < 0`: call `atomicPlayerReset()` before calling `session.onAllFailed()`.
  - In `releaseVideoElement(video)`: ensure explicit `video.pause()`, `video.removeAttribute('src')`, `video.load()`, and remove from parent if orphaned.
- In `assets/js/modules/series.js` and `assets/js/modules/movies.js`:
  - Inside `onAllFailed`: guarantee `atomicPlayerReset()` is called before `container.innerHTML = ...`.

### Step 2: Quality & Resolution Priority Overhaul
- In `functions/api/resolve.js` and `tools/local_server.py`:
  - In `rankSourcesByQuality`:
    - Sort order priority:
      1. Alive (`b.alive - a.alive`)
      2. No confirmed audio mismatch (`a.audio_mismatch - b.audio_mismatch`)
      3. Anti-CAM / telecine penalty (`isCamSource(a) - isCamSource(b)`)
      4. Quality Resolution Tier (`(b.quality || 0) - (a.quality || 0)`): Ensures 1080p/720p ALWAYS beats 480p!
      5. Confirmed PT Audio boost (`b.has_pt_audio - a.has_pt_audio`) to break ties within the same resolution tier.
      6. ABR multi-bitrate preference (`isHdAbr(b) - isHdAbr(a)`).
      7. Stream kind & tieBreaker.
  - This prevents low-quality 480p streams from ever taking precedence over HD streams.

### Step 3: Anime Season & Episode Mapping (MAL & TMDB Parity)
- In `assets/js/modules/series.js`:
  - When loading show details for anime/series, check if TMDB has only 1 regular season with high episode count and episode groups of type 6 ("Seasons").
  - Populate the season select dropdown using real distinct seasons (e.g. Season 1: 24 eps, Season 2: 23 eps).
  - Pass the structured `{ season: 2, episode: 17, absolute: 41, total: 47 }` to `buildNativeResolveRequest`.
- In `functions/api/resolve.js` & `tools/local_server.py`:
  - For Anime Nativo, map `{ season: 2, episode: 17 }` to Season 2 MAL entry (`51009`) and send episode `17`, returning ready stream without 404.

---

## 4. Testing & Edge Cases

1. **Ghost Audio Test:**
   - Simulate failed source (e.g. FenixFlix on an unsupported title).
   - Verify in DOM that no `<video>` or `<audio>` elements are playing audio in the background and tab audio indicator is silent.
2. **Quality Priority Test:**
   - Request title with mixed 480p and 720p sources (e.g. *Jujutsu Kaisen* Ep 2 / *Breaking Bad*).
   - Verify primary source selected is 720p/1080p, never 480p.
3. **Anime Season 2 Test:**
   - Request *Jujutsu Kaisen* Season 2 Episode 17 (Ep. 41).
   - Verify Anime Nativo resolves to MAL 51009, Episode 17, with HTTP 200 and valid HLS playback.
4. **Parity Check:**
   - Run `python tools/test_mgeb_rules.py` verifying identical behavior between Node and Python.
5. **Version Stamp Integrity:**
   - Run `python tools/bump_version.py --check`.
