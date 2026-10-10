# Execution Plan - Stage 3: Series/Anime Episode Metadata & Mapping Logic

- **Task Name:** `stage-3-series-episodes-navigation`
- **Status:** EXECUTING (Authorized by User)
- **Author:** Antigravity Orchestrator

---

## 1. Objective & Scope

### Objective
1. **Preserve Episode Name on Navigation (Next/Prev Buttons):**
   - Retain full episode title (`Show Name • T{S}:E{E} – {Episode Title}`) when moving between episodes via "Próximo" or "Anterior" buttons, drawer selection, and continuous mode.
   - Fallback to `cachedSeasonsMap` or dynamic async metadata retrieval when `epData` is not directly provided in the caller arguments.
2. **Fix Anime/Series Relative vs Absolute Episode Mapping (One Piece MGEB Black Screen Fix):**
   - Correct the mathematical calculation in `mapAbsoluteEpisodeToSeason` so that `episode` is mapped to the relative episode of that specific season (`absoluteEp - accumulated`), rather than returning the raw absolute number.
   - Support both relative season indexing for MGEB/Iframe servers (`/embed/serie/{id}/{season}/{relEpisode}`) and absolute indexing for ZokoAnime (`/stream/mal/{mal_id}/{absEpisode}/sub`).

### Scope
- **Impacted Files:**
  - `assets/js/modules/series.js`: Update `btnNextEp`, `btnPrevEp`, `mapAbsoluteEpisodeToSeason`, and `playSeriesEpisode`.
  - `index.html`: Version increment for cache busting.

---

## 2. Step-by-Step Strategy

1. **Step 1 - Fix `mapAbsoluteEpisodeToSeason`:**
   - Update return object to calculate `relativeEp = Math.max(1, absoluteEp - accumulated)` and export both `season`, `episode: relativeEp`, and `absoluteEpisode: absoluteEp`.
2. **Step 2 - Update `renderContinuousChunk` and `goToEpisodeByAbsoluteNumber`:**
   - Pass `targetMapped.season` and `targetMapped.episode` with `absoluteEpisode`.
3. **Step 3 - Update `btnPrevEp` and `btnNextEp`:**
   - Lookup the targeted episode object in `cachedSeasonsMap` and pass it into `playSeriesEpisode` so title metadata is never lost.
4. **Step 4 - Dynamic Episode Title Resolution in `playSeriesEpisode`:**
   - Check `cachedSeasonsMap` or fetch season info if `epName` is empty, dynamically updating `series-player-current-ep`.
   - Pass absolute episode to ZokoAnime (`native_anime`) and relative season/episode to MGEB/iframes.
5. **Step 5 - Cache Busting & Verification:**
   - Bump version to `v18` in `index.html` and `main.js`.
   - Verify server and test endpoints.

---

## 3. Changelog & Micro-adjustments

### Micro-adjustment 3.1: Aggressive Cache-Busting & Robust Title Name Resolution
- **What changed:**
  1. Updated `tools/local_server.py` to inject `Cache-Control: no-cache, no-store, must-revalidate` headers on all static HTTP responses, preventing browser stale disk/memory caching during development.
  2. Updated `assets/js/main.js` to import `series.js?v=20261005_v18` with an explicit cache-busting query parameter and bumped `index.html` entrypoint to `v18`.
  3. Hardened `playSeriesEpisode` and `btnNextEp` in `assets/js/modules/series.js` so that if episode name is missing or if `cachedEpisodes` is still resolving, it automatically falls back to an asynchronous TMDB season lookup (`tv/{id}/season/{season}`), updating the title element `#series-player-current-ep` dynamically as soon as the name resolves.
- **Why:** The user observed that after clicking "Próximo", the header retained `Reacher • T1:E2` without the episode name because the browser was still executing the previous un-busted module from cache, and the lookup relied solely on existing sync cache without a robust async TMDB title fallback.
- **How:** Forced browser module reload via query params and server headers, plus decoupling synchronous cache checking from TMDB async resolution in `playSeriesEpisode`.
