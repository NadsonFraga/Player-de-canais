# Feature Plan: General Series Parts & Merged Seasons Mapping

**Slug:** `general-series-parts-mapping`  
**Date:** 2026-10-27  
**Status:** In Execution (Phase 2)  
**Branch:** `feat/general-series-parts-mapping` (branched from `staging`)  

---

## 1. Scope & Objectives

1. **Client-Side Series Season Expansion (`assets/js/modules/series.js`):**
   - Update `resolveShowSeasons(details)`:
     - Remove the strict restriction that only allowed shows with exactly 1 regular season (`regular.length !== 1`).
     - Support TMDB episode group types: Type 6 ("Seasons") and Type 4 ("Parts" / Digital / Broadcast), which streaming platforms like Netflix use for series released in parts (e.g. *Lupin*, *La Casa de Papel*).
     - Trigger season expansion whenever `validGroups.length > regular.length`, restructuring the series into genuine parts (*Parte 1*, *Parte 2*, *Parte 3*).
     - Populate `details.seasons` and `cachedSeasonsMap` with correct relative episode numbering and TMDB episode mapping.

2. **Backend Resolver Parity (`functions/api/resolve.js` and `tools/local_server.py`):**
   - Update `fetchSeasonGroups(tmdbId)`:
     - Remove `if (regularSeasons.length === 1)` restriction.
     - Search candidate groups for Type 6 ("Seasons") and Type 4 ("Parts") with prioritized scoring.
   - Update fallback resolution in `onRequestGet`:
     - Trigger `mgeb2` group mapping not only on `mgebEpisodeMismatch`, but also when `lookupMgeb(season, episode)` returns zero sources (`sources.length === 0`).
     - Map `(season, episode)` to `(mapped.season, mapped.episode)` and resolve using the scraper's real part numbering.

3. **Strict Parity & Test Verification:**
   - Maintain 100% behavioral parity between Cloudflare Pages function `functions/api/resolve.js` and `tools/local_server.py`.
   - Update test suite `tools/test_mgeb_rules.py` with multi-season part mapping test cases.
   - Run automated test matrix: `tools/check_js.py`, `tools/test_security_headers.py`, `tools/test_resolve_cors.py`, `tools/test_mgeb_rules.py`.
   - Bump asset version via `tools/bump_version.py`.
   - Merge to `staging`, push, verify on Cloudflare, and test Lupin episodes.

---

## 2. Impacted Files

| File | Purpose |
| :--- | :--- |
| `assets/js/modules/series.js` | Expand `resolveShowSeasons` to support Type 4 ("Parts") groups and multi-season part expansion. |
| `functions/api/resolve.js` | Expand `fetchSeasonGroups` candidate group search and trigger group fallback on empty sources. |
| `tools/local_server.py` | Mirror `functions/api/resolve.js` changes identically in Python. |
| `tools/test_mgeb_rules.py` | Add unit tests for Type 4 multi-part series mapping. |
