# One entry point for opening an episode

Status: proposal, waiting for approval. Branch `feat/introdb` (no separate branch or commit, user decision 2026-10-09). Comes before wiring series skip segments.

## Problem

An episode reaches the player through 12 call sites of `playSeriesEpisode` plus the home "Continuar assistindo" card, and each builds its own input: some pass a thin item (`{id, name, poster}`), some pass `epData`, some pass the show-wide number, the history stores whatever numbering was current. Features that read that input (anime detection, episode numbering, AniSkip, MGEB request, series skip bases) break on some paths and not on others. Seen: resume card opened anime as non-anime (no AniSkip, wrong server); history saved with TMDB continuous numbering (Naruto) opens the wrong episode.

Entry points today (`series.js`): details "Assistir/Continuar" (L1744, L1746), modal autoplay used by the resume card (L1881), season list (L2049), continuous list (L2278), go to episode N (L2324), player episode drawer (L2679), previous/next buttons (L1623, L1656, L1691), next-episode card and autoplay (L1710, L2587), `main.js` test hook `playEpisode`.

## Design

1. `openEpisode(showRef, target, options)`: the only way to start an episode.
   - `showRef`: any item with an `id` (thin or full).
   - `target`: `{ season, episode }` (season-relative, our numbering), or `{ absolute }`, or `{ season, tmdbEpisode }`.
   - Steps: load the show details once per show (`append_to_response=external_ids`, cached by id); load the season episodes (normalized, cached); resolve the target; build the context; start playback.
2. **Episode context** (one object, read by everything downstream):
   `{ show (details merged with the item), isAnime, tmdbId, imdbId, season, episode, tmdbEpisode, absolute, totalEpisodes, epData, malId }`.
   `isAnime` comes from the details (`genres`, `original_language`, `origin_country`), never from the thin item.
3. Downstream uses only the context: header text, MGEB / anime resolve request, AniSkip, series skip bases (TMDB numbering), next/previous, history.
4. **History** stores `{ season, episode, absolute, mediaType }` in our numbering. Old entries are read through the same resolver: an episode number missing from its season but equal to a `tmdb_episode_number` there is mapped to the relative number (fixes the Naruto entries saved before the numbering fix).
5. `playSeriesEpisode` stays exported as a thin wrapper over `openEpisode` (used by `main.js`).
6. **Rule** added to `CLAUDE.md`: every way of opening an episode goes through `openEpisode`; new features read the episode context, never the raw call arguments.

## Tests

- Unit: target resolution for `{season, episode}`, `{absolute}`, `{season, tmdbEpisode}`, old history entries, last/first episode across seasons.
- Browser (Edge and Firefox, muted): the same episode opened from every entry point (resume card, details button, season list, continuous list, go to N, player drawer, previous/next, next-episode card) must produce the same context (resolve request, header, AniSkip key). Shows: Dragon Ball Z (anime, whole-show MAL entry), Naruto Shippuden (continuous TMDB numbering), JoJo (anime, resume card), Breaking Bad (series).
- Existing suites: `player_ui_check.mjs`, `player_touch_check.mjs`.

## Then (separate approval)

Wire the series skip segments (phase 2 of `series-skip-segments.md`) on top of the context. Countdown without ending data stays fixed at 30 s (user decision).

## Result (2026-10-09, uncommitted)

- `openEpisode` / `resolveEpisodeContext` / `getCurrentEpisodeContext` in `series.js`; all 13 entry points use `openEpisode`; `playSeriesEpisode` is a wrapper. Previous now crosses into the previous season through the show-wide number. History stores `absolute` and `mediaType` ('anime'/'tv'). Rule added to `CLAUDE.md`.
- New `tools/episode_entry_check.mjs` (Edge CDP and Firefox BiDi, muted, resolve stubbed): Dragon Ball Z T9E31, Naruto Shippuden T2E1 (history saved as TMDB T2E33), JoJo T1E2 (resume card), Breaking Bad T3E5 through 8 entry points each: 40/40 Edge, 40/40 Firefox. `player_ui_check.mjs` 43/43, `player_touch_check.mjs` 12/12. Cache version `20261009_l`.
