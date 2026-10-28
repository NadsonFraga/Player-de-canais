# Feature Plan: Unified Global Search, Home Hero Highlight Refinement & Continue Watching Thumbnails

**Slug:** `search-and-ui-refinements`  
**Date:** 2026-10-26  
**Status:** In Execution (Phase 2)  
**Branch:** `feat/search-and-ui-refinements` (branched from `staging`)  

---

## 1. Scope & Objectives

1. **Unified Global Search ("Tudo" Tab) [P1]:**
   - In `assets/js/modules/header.js`, when searching in the "Tudo" (`searchKind === 'all'`) tab:
     - Remove categorized section headings (`Filmes`, `Séries`, `Animes`).
     - Merge all matching media titles into a single unified grid.
     - Sort results strictly by relevance / importance score using TMDB metrics: `popularity` weighted with `vote_count`.
     - Keep channel matches in a clean header row at the top (for immediate access to live TV) and persons at the bottom.
     - For specific category tabs (`movie`, `tv`, `anime`, `channel`, `person`), retain their dedicated views.

2. **Home Hero Highlight Refinement (Doraemon Exclusion) [P1]:**
   - In `assets/js/modules/home.js`, `buildHomeHeroShowcase()` currently takes `trending[0]` from the anime discovery cache, where *Doraemon* (TMDB ID 65733) ranks abnormally high in raw TMDB popularity (338.5) despite being a niche long-runner for general platform users.
   - Exclude *Doraemon* (`65733` or title match) from the home hero highlight candidates.
   - Select the featured anime by prioritizing high-engagement, fan-favorite titles (weighted by audience vote count and score among top trending items, e.g. *Demon Slayer*, *Jujutsu Kaisen*, *Solo Leveling*, *Bleach*).

3. **Cinema Notice Text Cleanup [P2]:**
   - In `index.html` (line 1797), remove technical acronyms `(CAM/TS)` and `(WEB-DL)` from the recent cinema release warning.
   - Text becomes: `Este título pode conter gravações de cinema até a disponibilização das versões digitais oficiais em alta definição.`

4. **Episode Thumbnails in "Continuar Assistindo" [P1]:**
   - In `assets/js/modules/series.js`:
     - Update `saveStoredWatchProgress()` to accept and persist `still_path` for the currently playing episode.
     - In `startEpisodePlayback()`, ensure `epData.still_path` or fetched episode match `still_path` is passed into `saveStoredWatchProgress()`.
     - In `renderHomeContinueWatching()`, prioritize `item.still_path` for episodes (series/animes), displaying the authentic episode thumbnail rather than a generic show poster/backdrop.
     - For movies, preserve the high-resolution movie backdrop alongside the exact saved timestamp and progress bar.

---

## 2. Impacted Files

| File | Purpose |
| :--- | :--- |
| `index.html` | Clean up cinema notice text (remove technical acronyms). |
| `assets/js/modules/header.js` | Unify and rank search results in the "Tudo" tab without kind dividers. |
| `assets/js/modules/home.js` | Refine anime hero showcase selection and filter out Doraemon. |
| `assets/js/modules/series.js` | Save `still_path` in watch progress and render episode thumbnails on the home rail. |

---

## 3. Implementation Steps

1. **Step 1:** Edit `index.html` to update the cinema warning notice text.
2. **Step 2:** Refactor `renderResults()` in `assets/js/modules/header.js` to build a unified ranked title grid for `searchKind === 'all'`.
3. **Step 3:** Update `buildHomeHeroShowcase()` in `assets/js/modules/home.js` with candidate filtering and vote-weighted selection.
4. **Step 4:** Update `saveStoredWatchProgress()` and `renderHomeContinueWatching()` in `assets/js/modules/series.js` for episode `still_path` support.
5. **Step 5:** Run automated verification tests, check module import integrity (`check_js.py`), and bump version (`bump_version.py`).
6. **Step 6:** Merge to `staging` with `git merge --no-ff`, push, and generate testing matrix.
