# Feature Summary: General Series Parts & Merged Seasons Mapping

**Slug:** `general-series-parts-mapping`  
**Date:** 2026-10-27  
**Branch:** `feat/general-series-parts-mapping`  
**Author:** AI Agent (Antigravity)  
**Status:** Completed & Ready for Staging Merge  

---

## 1. Summary of Changes

1. **Client-Side Series Season Expansion (`assets/js/modules/series.js`):**
   - Generalized `resolveShowSeasons(details)` beyond single-season anime:
     - Supports TMDB episode group candidates of Type 6 ("Seasons") and Type 4 ("Parts" / Digital / Broadcast).
     - Ranks candidates by group type and descriptive names (`Parte`, `Part`, `Season`, `Temporada`).
     - Activates group restructuring whenever `validGroups.length > regular.length`, turning shows released in parts (such as Netflix's *Lupin*, *La Casa de Papel*, etc.) into clearly numbered parts (*Parte 1*, *Parte 2*, *Parte 3*).
     - Formats parts automatically: `Parte 1`, `Parte 2`, `Parte 3` for multi-part releases.
     - Preserves `tmdb_season_number` and relative episode numbering so episode activation passes the proper context to `openEpisode()`.

2. **Backend Resolver Parity (`functions/api/resolve.js` & `tools/local_server.py`):**
   - Added candidate scoring `scoreSeasonGroupCandidate` (favoring Type 6, Type 4, and keyword matches).
   - Removed single-season limitation in `fetchSeasonGroups(tmdbId)`: accepts episode group mapping when `regularSeasons.length === 1 || parsed.length > regularSeasons.length`.
   - Updated MGEB fallback resolution: when direct lookup `lookupMgeb(season, episode)` returns zero sources or has an episode title mismatch, the backend checks for group mapping `mapMergedEpisode(seasonGroups, season, episode)` and re-queries MGEB with the mapped season/episode (`mapped.season`, `mapped.episode`).

3. **Test Suite Updates (`tools/test_mgeb_rules.py`):**
   - Added `LUPIN` test cases validating multi-part mapping:
     - Lupin T1E5 (Part 1) -> (1, 5)
     - Lupin T1E6 (Part 2) -> (2, 1)
     - Lupin T1E7 (Part 2) -> (2, 2)
     - Lupin T1E10 (Part 2) -> (2, 5)
     - Lupin T2E1 (Part 3) -> (3, 1)
     - Lupin T2E7 (Part 3) -> (3, 7)
     - Lupin T2E8 -> None (out of bounds)
   - Tested 100% parity across Python (`local_server.py`) and Node (`resolve.js`).

4. **Asset Versioning (`tools/bump_version.py`):**
   - Cache-busting stamp updated to `20261027_1439`.

---

## 2. Verification Matrix Results

- `python tools/check_js.py`: Passed (0 missing imports).
- `python tools/bump_version.py --check`: Passed (single synchronized version `20261027_1439`).
- `python tools/test_mgeb_rules.py`: Passed (Python & Node 100% parity).
- `python tools/test_security_headers.py`: Passed (0 failures).
- `python tools/test_resolve_cors.py`: Passed (0 failures).
