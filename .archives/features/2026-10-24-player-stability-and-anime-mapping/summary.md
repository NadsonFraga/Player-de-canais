# Feature Summary: Player Stability, Teardown Integrity & Anime Season Mapping

**Slug:** `player-stability-and-anime-mapping`  
**Date:** 2026-10-25  
**Branch:** `feat/player-stability-and-anime-mapping`  
**Version:** `20261025_1152`  

---

## 1. Overview of Delivered Changes

### 1. Ghost Audio & Teardown Integrity (P0)
- **Problem:** When a player failed (e.g., FenixFlix "sem resposta"), audio continued playing in the background while the UI showed the error state. In browser DOM architectures, replacing container `innerHTML` without unmounting, pausing, clearing `.src`, and invoking `.load()` leaves the underlying audio decoder running in memory.
- **Solution:**
  - In `assets/js/player/engine.js`:
    - Updated `releaseVideoElement(video)` to explicitly mute, pause, clear `src`, remove all child `<source>` tags, and call `video.load()`.
    - Updated `failoverNativeSource()` to invoke `atomicPlayerReset()` immediately before firing `session.onAllFailed()`.
  - In `assets/js/modules/series.js` and `assets/js/modules/movies.js`:
    - Ensured `atomicPlayerReset()` is called in both `onAllFailed()` and `.catch(err => ...)` error fallbacks before replacing DOM content.

### 2. Quality & Dubbed Ranking Overhaul (P1)
- **Problem:** Low-resolution (480p) streams were taking precedence over clean HD (720p/1080p) streams on MGEB because `has_pt_audio = true` heuristic ranked above resolution comparison.
- **Solution:**
  - In `functions/api/resolve.js` and `tools/local_server.py`:
    - Introduced `isHd = (s) => (s.quality || 0) >= 720` tiering in `rankSourcesByQuality()`.
    - Placed `isHd` comparison above `has_pt_audio` and ABR bitrates.
    - Verified: HD sources (>=720p) strictly rank above SD (<720p) sources, while `has_pt_audio` reliably breaks ties within the same quality tier.

### 3. TMDB Lumped Anime Season Splitting (P1)
- **Problem:** TMDB often lumps animes (such as *Jujutsu Kaisen* with 59 episodes) into a single Season 1. Selecting Ep 41 sent `season: 1, episode: 41` to `/api/resolve`, causing Anime Nativo (ZokoAnime) to return 404 (Season 1 MAL 40748 only has 24 episodes), MGEB to fall back to 480p, and FenixFlix to play an unexpected episode.
- **Solution:**
  - In `assets/js/modules/series.js`:
    - Added `episode_groups` to `SHOW_DETAILS_APPEND`.
    - Implemented `resolveShowSeasons(details)`: detects shows where TMDB returns 1 season but provides Type 6 ("Seasons") episode groups (e.g. Group 1: 24 eps, Group 2: 23 eps).
    - Populates `details.seasons` with genuine seasons ("Temporada 1", "Temporada 2") and pre-caches `cachedSeasonsMap` with relative numbering (1..23), absolute numbering (25..47), and TMDB numbering (25..47).
    - In `resolveEpisodeContext`: automatically maps legacy or out-of-bounds episode requests (e.g. `season: 1, episode: 41`) to `season: 2, episode: 17`.
    - Passes structured `{ season: 2, episode: 17, absolute: 41, total: 47 }` to `/api/resolve`, which successfully matches MAL 51009 (*Jujutsu Kaisen 2nd Season*) and streams Season 2 Episode 17 in HD with Japanese audio and PT subtitles.

---

## 2. Test Verification Matrix

| Test Suite / Script | Target / Scope | Result |
| :--- | :--- | :--- |
| `tools/check_js.py` | ES module import integrity across all JS files | PASS (0 errors) |
| `tools/bump_version.py --check` | Asset version cache-busting consistency (`20261025_1152`) | PASS |
| `tools/test_mgeb_rules.py` | Full rule parity (43 Python rules / 43 Node rules) | PASS (100% Parity) |
| `tools/test_security_headers.py` | CSP, SRI, Permissions Policy, and frame headers | PASS (0 failures) |
| `tools/test_resolve_cors.py` | Origin verification, LAN checks, and dispatch parity | PASS (0 failures) |
| `scratch/test_player_stability.mjs` | Unit verification for ranking, teardown, and JJK splitting | PASS |

---

## 3. Impacted Files

- `assets/js/player/engine.js`
- `assets/js/modules/series.js`
- `assets/js/modules/movies.js`
- `functions/api/resolve.js`
- `tools/local_server.py`
- `tools/test_mgeb_rules.py`
- Version bumped across: `index.html`, all `assets/js/**/*.js`
