# Skip segments for series (TheIntroDB + SkipDB)

Status: proposal, waiting for approval. Branch `feat/introdb`. Research: `.archives/scopes/Pular abertura em séries gerais.md`.

## Live checks (2026-10-09)

- **TheIntroDB v3** `GET api.theintrodb.org/v3/media?tmdb_id=&season=&episode=&duration_ms=`: works, CORS echoes our origin (browser can call it, no Cloudflare cost), rate limit 30 per 10 s. Keyed by TMDB id (we have it). `duration_ms` has no visible effect (same answer for 3500 s and 3440 s). Lists per type; `end_ms: null` = to the end of the file. 404 = no data (Squid Game). Friends S1E1 returns a degenerate intro (`start null, end 0`): must be dropped.
- **SkipDB** `GET skipdb.tv/api/segments?imdb_id=&season=&episode=&duration=`: works, `Access-Control-Allow-Origin: *`, 120 GET/min. Needs the IMDb id. With `duration` it labels each segment `exact` / `shifted` / `out-of-range` with `offset_ms` (Breaking Bad: exact at 3500 s, out-of-range -30 s at 3470 s). Data is ODbL.
- **IntroDB**: CORS only for introdb.app, so it needs our own proxy (one Cloudflare invocation per episode). Smallest coverage of the three.
- Breaking Bad S1E1: TheIntroDB and SkipDB agree within ~1 s (intro ~229 s, credits 3431/3434 s).

## Design

1. **Identity**: TMDB id (already known), IMDb id from `append_to_response=external_ids` on the show details call (no extra request), season and episode in **TMDB numbering** (`tmdb_episode_number` when the season was shifted to start at 1).
2. **Sources, called in parallel from the browser, cached per episode**:
   - SkipDB with `duration` (seconds of our video). Segments with `match` `exact` or `shifted` are trusted (the cut is ours); `agnostic`/`out-of-range` count as approximate.
   - TheIntroDB v3. No version check is possible: its credits are approximate unless SkipDB confirms the same start within 5 s.
   - Merge per type, one source per type (never mixed): a trusted SkipDB segment first, then TheIntroDB, then an approximate SkipDB segment.
3. **Normalization** (same module as AniSkip): `credits`/`outro` -> outro, `null` = file edge, drop degenerate and implausible ranges (existing position filter), clamp to the video.
4. **Card rules** (reuse the AniSkip card): opening/recap -> "Pular abertura/recapitulação"; ending that runs to the end -> "Próximo episódio"; ending followed by more than 10 s (a second credits block, a scene) -> "Pular encerramento" + "Próximo episódio"; approximate ending -> "Próximo episódio" only. Autoplay only by real position at the end of the file (unchanged).
5. **Countdown without ending data**: 30 s, 35 s for episodes of 40 min or more, 40 s for 50 min or more (Jellyfin Web).
6. **Anime**: AniSkip stays first; when AniSkip returns nothing for a part, TheIntroDB/SkipDB fill it (same rules).

## Out of scope (queue)

- IntroDB through a proxy (optional third source, post-credits flag).
- Local detection of credits on the video (frames at ~1 fps, black/text cards): heavy, later if coverage is poor.
- Automatic skip (future settings tab), "Ainda está assistindo?", sending corrections back to the bases.
- Movies (no next episode; credits only).

## Phases (hard stop after each)

1. **Data**: providers + merge + IMDb id + TMDB numbering. Check: Breaking Bad, Game of Thrones, Friends, The Office, Stranger Things, a K-drama (Squid Game, expected empty), one Naruto episode (continuous numbering); log segments and sources, no video analysis. Unit checks for the merge rules.
2. **Player**: series path passes the lookup to the engine; countdown lead by duration; anime fallback. Check: `player_ui_check.mjs` with one series case added, touch suite, Edge and Firefox.
3. **Deploy** to a preview branch on request, with a test list.

## Progress

- Decisions (2026-10-09): IntroDB stays out until the tests show whether the two direct bases are enough; anime complement yes if no overlap or slowness; countdown lead pending explanation.
- Phase 1 done (uncommitted): `skipSegments.js` gains `readTheIntroDb`, `readSkipDb`, `mergeTvSources`, `fetchTvSkipSegments`, `complementSegments`; show details now carry `external_ids`. Filters: opening minimum 5 s (Breaking Bad's is ~17 s), ending minimum 5 s (Friends: 6 s), endings that run to the end of the file may last up to 15 min (Game of Thrones S8E3), others 4 min. 19 real episodes (7 shows, distinct seasons, real durations of our videos): 17 with opening and ending, Naruto Shippuden none (no TV data; AniSkip covers it). Rule checks 4/4.
- Fix: "Continuar assistindo" opened anime as non-anime (the card keeps only id and name): `isAnimeShow` now also reads the loaded show details; both inline checks use it. Browser check in phase 2.
- Phase 2 done (uncommitted, 2026-10-09): engine `tvskip` + `noRecap` options; AniSkip first, series bases complement (`complementSegments`); no recap in S1E1 (anime too); a range much shorter than the other base's (< 50 %) loses (GoT S1E1 13 s vs 100 s); credits "to the end" over 5 min are dropped (GoT S8E3); SkipDB's own shift for near-length cuts is undone (it assumed the extra seconds at the start; frames of Breaking Bad S1E1 and The Office S2E3 showed them at the end) and such ranges are approximate. Countdown without ending data stays 30 s.
- Checks: rule unit checks 10/10; `player_ui_check.mjs` 45/45 (GoT S1E1 case); `player_touch_check.mjs` 12/12; `episode_entry_check.mjs` 42/42 Edge and 42/42 Firefox (incl. real markers for GoT S1E1 and JoJo E2 resumed); frame montages (GoT S1E1, GoT S8E3, Breaking Bad S1E1, The Office S2E3, Reacher S1E1, The Bear S1E2, Friends S2E7). Cache version `20261009_n`.
