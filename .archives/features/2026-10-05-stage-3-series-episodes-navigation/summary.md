# Stage 3 Summary: Series & Anime Episode Navigation, Retention, and Mapping

## Overview
This stage addresses episode navigation defects, episode title loss when stepping through Next/Previous episodes in the theater player, and season/episode index mismatch when navigating long-running animes (such as One Piece) across continuous blocks and external provider iframes.

## Changes Implemented

### 1. Title Retention on Next / Previous Navigation
- **File**: `assets/js/modules/series.js`
- **Issue**: Clicking Next or Previous episode in the theater player invoked `playSeriesEpisode(show, season, nextEp)` without passing episode metadata (`epData`), causing the top bar header `#series-player-current-ep` to revert to a generic title (e.g., `Reacher • T1:E2`) instead of displaying the actual episode name.
- **Fix**:
  - `btnPrevEp` and `btnNextEp` handlers now inspect `cachedSeasonsMap` to retrieve the next/previous episode object (`targetEpData` / `nextEpData`) before calling `playSeriesEpisode`.
  - In `playSeriesEpisode`, if episode metadata is missing or generic, the system checks `cachedSeasonsMap` synchronously. If still not cached, it triggers an asynchronous fetch to TMDB (`tv/{id}/season/{season}`), updating the title dynamically as soon as the episode title resolves without blocking stream playback.

### 2. Relative vs. Absolute Episode Mapping for Long-Running Shows & Animes
- **File**: `assets/js/modules/series.js`
- **Issue**:
  - `mapAbsoluteEpisodeToSeason(seasons, absoluteEp)` previously returned `{ season: s.season_number, episode: absoluteEp }`. When navigating to episode 1050 (e.g., One Piece), passing `season: 21, episode: 1050` resulted in 404 / black screens on embed servers (such as MGEB/Superflix), because Season 21 only has ~50 episodes.
  - ZokoAnime (`native_anime`), in contrast, requires the global absolute episode number (`1050`).
- **Fix**:
  - `mapAbsoluteEpisodeToSeason` now returns:
    ```javascript
    return {
        season: targetSeason.season_number,
        episode: relativeEp,          // Season-relative number for MGEB/warezcdn/embeds
        absoluteEpisode: absoluteEp   // Global absolute number for native_anime (ZokoAnime)
    };
    ```
  - `renderContinuousChunk` and `goToEpisodeByAbsoluteNumber` now pass `targetMapped.season`, `targetMapped.episode` (relative), and `currentEpNum` (absolute).
  - Provider dispatch routes the relative episode to MGEB/warezcdn/iframes and routes the absolute episode to `native_anime`.

### 3. Version Bump & Zero-Cache Guarantee
- **Files**: `index.html`, `assets/js/main.js`, `tools/local_server.py`
- Updated modular entrypoint script query to `assets/js/main.js?v=20261005_v18`.
- Updated `main.js` to explicitly import `series.js?v=20261005_v18`.
- Configured local Python development server to send `Cache-Control: no-cache, no-store, must-revalidate` on all static assets to eliminate stale browser module caching.

## Verification & Validation
- Verified syntax and imports across all modules with `python tools/check_js.py` (0 errors, 0 missing imports).
- Verified local development & resolver server (`http://localhost:8787/health` & `http://192.168.0.107:8787/health`) running smoothly.
