# Feature Plan: Multi-Season Episode Group Guard

- **Slug:** `season-group-guard`
- **Branch:** `feat/season-group-guard`
- **Date:** 2026-11-16
- **Objective:** Prevent arbitrary digital streaming provider episode groups (such as Crunchyroll's 16-part grouping on Dragon Ball Z) from overriding canonical multi-season structures on shows that already possess established granular seasons (`regular.length > 1`), while preserving genuine parts restructuring for collapsed/multi-part shows (e.g. Lupin, La Casa de Papel, Jujutsu Kaisen).

## Scope
1. Update `resolveShowSeasons(details)` in `assets/js/modules/series.js` to require `scoreEpisodeGroupCandidate(cand) >= 65` when `regular.length > 1`.
2. Update backend resolver candidate evaluation in `functions/api/resolve.js` and `tools/local_server.py` with identical score guard parity (`cand_score >= 65`).
3. Fix CLI screenshot argument parsing in `tools/player_ui_check.mjs`.
4. Bump version and verify with full test matrix.
