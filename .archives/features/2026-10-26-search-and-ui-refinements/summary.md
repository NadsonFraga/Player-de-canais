# Feature Summary: Unified Global Search, Home Hero Highlight Refinement & Continue Watching Thumbnails

**Slug:** `search-and-ui-refinements`  
**Date:** 2026-10-26  
**Branch:** `feat/search-and-ui-refinements`  
**Version:** `20261026_1520`  

---

## 1. Overview of Delivered Changes

### 1. Unified Global Search ("Tudo" Tab)
- **Problem:** When searching in the "Tudo" tab, results were strictly divided into categorical sections (`Filmes`, then `Séries`, then `Animes`). This caused relevant works (such as anime series for "Jujutsu Kaisen") to appear buried at the bottom of the page beneath lesser-known movies.
- **Solution:**
  - In `assets/js/modules/header.js`:
    - Combined all title categories (`movie`, `tv`, `anime`) into a single continuous grid without type-separation headers.
    - Added `titleScore()` ranking based on TMDB popularity weighted with audience votes: `popularity * log10(vote_count)`.
    - Channels remain pinned at the top when matching a query (e.g. "Globo"), and people remain at the bottom.
    - Preserved dedicated views when a specific tab (`movie`, `tv`, `anime`, `channel`, `person`) is explicitly selected.

### 2. Home Hero Highlight Refinement (Doraemon Exclusion)
- **Problem:** TMDB's discover API for Japanese animation returns *Doraemon* (TMDB ID `65733`) with abnormally high raw popularity (338.5), making it permanently occupy the hero carousel slot on the home screen.
- **Solution:**
  - In `assets/js/modules/home.js`:
    - Explicitly filtered out *Doraemon* (`id !== 65733` and regex `/doraemon/i`).
    - Ranked top candidates by audience engagement (`vote_count`), promoting major titles (*Demon Slayer*, *Jujutsu Kaisen*, *Solo Leveling*, *Bleach*) into the hero highlight.
  - In `assets/js/modules/series.js`:
    - Filtered out *Doraemon* from the anime tab hero carousel candidates as well.

### 3. Cinema Notice Text Cleanup
- **Problem:** The notice on title pages for recent theatrical releases displayed technical acronyms: `(CAM/TS)` and `(WEB-DL)`.
- **Solution:**
  - In `index.html` (line 1797), updated the notice to clean, user-friendly language:
    `Este título pode conter gravações de cinema até a disponibilização das versões digitais oficiais em alta definição.`

### 4. Episode Thumbnails in "Continuar Assistindo"
- **Problem:** The home screen's "Continuar assistindo" rail displayed generic show-level backdrops/posters for episodes rather than the thumbnail (`still_path`) of the specific episode being watched. Furthermore, older progress entries stored in `localStorage` lacked `still_path`.
- **Solution:**
  - In `assets/js/modules/series.js`:
    - Updated `saveStoredWatchProgress()` to persist `still_path` into `progress[show.id]`.
    - Implemented `resolveEpisodeStill(showId, seasonNumber, episodeNumber)` to asynchronously resolve missing `still_path` values from cache, show metadata, regular seasons, or anime episode groups.
    - Updated `renderHomeContinueWatching()` to prioritize `item.still_path` for episodes, providing the actual 16:9 episode thumbnail on the home rail, and automatically backfill/persist missing stills for pre-existing history cards.

---

## 2. Test Verification Matrix

| Test Suite / Script | Target / Scope | Result |
| :--- | :--- | :--- |
| `python tools/check_js.py` | ES module import integrity across all files | PASS (0 errors) |
| `python tools/bump_version.py --check` | Cache-busting version consistency (`20261026_1520`) | PASS (33 files synchronized) |
| `python tools/test_security_headers.py` | CSP, SRI, Permissions Policy, headers | PASS (0 failures) |
| `python tools/test_resolve_cors.py` | Origin verification, LAN checks, dispatch parity | PASS (0 failures) |
| `python tools/test_mgeb_rules.py` | Parity between Python and Node resolvers | PASS (43/43 rules) |
| `node scratch/test_ui_refinements.mjs` | Unit tests for search ranking, hero filter, still_path, and notice | PASS (5/5 checks) |

---

## 3. Impacted Files

- `index.html`
- `assets/js/modules/header.js`
- `assets/js/modules/home.js`
- `assets/js/modules/series.js`
- Version stamped across all ES modules
