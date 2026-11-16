# Feature Summary: Multi-Season Episode Group Guard

- **Branch:** `feat/season-group-guard`
- **Date:** 2026-11-16
- **Status:** Complete & Verified

## Overview
Resolved a structural season expansion issue where arbitrary digital platform episode groups (such as Crunchyroll's 16 digital parts for Dragon Ball Z) overrode canonical TMDB multi-season structures, causing Season 9 Episode 31 to misalign to Season 1 Episode 31.

## Changes
- `assets/js/modules/series.js`: Enforced `scoreEpisodeGroupCandidate(cand) >= 65` when `regular.length > 1` in `resolveShowSeasons`.
- `functions/api/resolve.js`: Maintained parity by requiring `scoreSeasonGroupCandidate(candidate) >= 65` when expanding multi-season series groups.
- `tools/local_server.py`: Mirrored the score guard parity in `fetch_season_groups`.
- `tools/player_ui_check.mjs`: Corrected screenshot directory argument parsing and defensive directory creation.
- Stamped version `20261116_1602`.
