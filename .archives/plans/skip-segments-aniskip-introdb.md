# Skip segments (AniSkip + IntroDB) in the native player

Status: proposal, waiting for approval. Queue item A8.

## Findings (2026-10-08)

- **AniSkip** (`api.aniskip.com/v2/skip-times/{malId}/{episode}`): open CORS (`Access-Control-Allow-Origin: *`), 120 requests/min, no key. Keyed by MyAnimeList id + episode number inside that entry, the same pair `/api/resolve` already returns in `aniskip: {mal_id, episode}`. Returns `op`, `ed`, `mixed-op`, `mixed-ed`, `recap` with `episodeLength`. Samples: DBZ (813/284), Frieren (52991/1), FMAB (5114/10) all have opening and ending.
- **IntroDB** (`api.introdb.app/segments?imdb_id=&season=&episode=`): no key, "fair usage" rate limit (no number), commercial and non-commercial use allowed, attribution optional. CORS only allows `https://introdb.app`, so the browser cannot call it: it needs a small proxy function. Keyed by IMDb id + TMDB-style season/episode. Returns `intro`, `recap`, `outro`, `post_credits` with `confidence` and `submission_count`. Sample of 7 popular shows (S1E1): 6 with intro, 7 with outro, 0 recap. Movie data looks unreliable (sample had an "intro" at 2 h 5 min): movies are left out.
- The series detail call (`tv/{id}`) can carry `append_to_response=external_ids` to get the IMDb id with no extra request.
- Iframe players (MGEB, contingency servers, live channels) are cross-origin: nothing can be marked or skipped there. This only applies to the native player.

## Design

1. **Data**
   - Anime in the native player: browser calls AniSkip directly after the video duration is known, passing `episodeLength` so AniSkip filters out timings recorded on a different cut. Zero Cloudflare invocations.
   - Series (and anime when AniSkip has nothing): new `GET /api/skip?imdb_id=&season=&episode=` in `functions/api/skip.js`, mirrored in `tools/local_server.py`. Returns a normalized list, sets `Cache-Control` so Cloudflare's edge cache serves repeats (one invocation per new episode). Rejects bad ids; only calls `api.introdb.app`.
   - Normalized shape for both: `[{ type: 'intro'|'recap'|'outro', start, end }]`. Segments outside the video duration, shorter than 5 s or overlapping are dropped.
2. **Engine** (`assets/js/player/engine.js`): `setSkipSegments(session, segments)`. Loads async and never blocks playback; a failure is silent.
3. **UI**
   - Colored ranges drawn inside the progress bar (one tone per type, theme colors, no emojis).
   - Button "Pular abertura" / "Pular recapitulação" / "Pular encerramento" with an inline SVG line icon, bottom right above the controls, visible while inside the segment; also reachable with the keyboard on desktop.
   - Optional automatic skip: decision below.
4. **Next episode**: when the outro start is known, the "Próximo episódio" card and countdown start there (cancelable); if nothing follows the outro but a short preview, same. Without data the lead grows from 10 s to a fixed value (decision below).

## Phases (hard stop after each)

1. Data layer: AniSkip client, `/api/skip` + local mirror, IMDb id from `external_ids`. Check: 4 anime (DBZ, Frieren, FMAB, One Piece) and 4 series return segments that match the actual video (spot-check 2 timestamps each); a show with no data returns an empty list.
2. Markers and skip button in the native player. Check: `tools/player_ui_check.mjs` extended (markers drawn, button appears inside the segment and jumps to its end), Edge and Firefox, phone layout.
3. Next-episode card at the outro start, larger lead without data. Check: anime and series, cancel works, no double trigger with the existing countdown.

Each phase: `python tools/bump_version.py`, targeted checks, browser suite muted.

## Risks

- Crowd data may not match our sources (different cuts, extra intro on some hosts). Mitigation: AniSkip `episodeLength` filter, IntroDB `confidence`, and a button by default (the viewer decides).
- IntroDB rate limit is unspecified: edge cache per episode and one request per episode played.
- Cloudflare quota: only the series path costs invocations (one per new episode).

## Decisions (user, 2026-10-08)

1. No automatic skip for now. A future settings tab (with the home screen redesign) may add it.
2. Skip button on the side, in the same style as the existing "Próximo episódio" card. Every button and card can be dismissed in a clean way.
3. Timeline ranges: plain and discreet, in the progress bar colors; opening, recap and ending.
4. When the ending starts, offer the next episode; at the end of the video it still plays automatically if nothing was chosen.
5. AniSkip first (this plan). IntroDB for series comes right after this plan, before the general queue.

## Progress

- Phase 1 done (uncommitted): `assets/js/player/skipSegments.js` (AniSkip lookup + normalizer), session wiring in `engine.js` (`aniskip` option, lookup on first `loadedmetadata`), anime path in `series.js` passes `data.aniskip` only for `native_anime`. Check: our video length vs AniSkip for DBZ 284, FMAB 10, Frieren 1, Jujutsu 5, Naruto 50, One Piece 1000: all six return segments that fit the video; 9/9 unit checks. Cache version `20261009_b`.
- Phase 2 done (uncommitted): ranges inside `.art-control-progress-inner` (`renderSkipRanges`, redrawn after a source switch), "Pular abertura/recapitulação/encerramento" layer with a dismiss (x) button (`updateSkipButton`, one dismissal per type per session, fades after 8 s untouched and comes back with the controls, hidden while the next-episode card runs). `tools/player_ui_check.mjs`: 40/40 (3 new AniSkip checks on DBZ 284). Cache version `20261009_c`.
- Phase 3 done (uncommitted): ending card (`skipCardState`): ending followed by more than 10 s offers "Pular encerramento" + "Próximo episódio" (after skipping, "Próximo episódio" stays offered); ending that runs to the end offers "Próximo episódio" only; the x only hides the offer (the next episode still plays at the end). Countdown lead 10 s when the ending is known, 30 s when it is not (`NATIVE_UP_NEXT_NO_DATA_S`). Anime played on the main host ("Player Nativo") get skip data too: `/api/resolve?aniskip_only=1` (resolve.js and local_server.py) returns only `{mal_id, episode}`, looked up in the background. The lookup also retries until the video length is known. `tools/player_ui_check.mjs`: 42/42. Cache version `20261009_d`. Not browser-tested: the "skip + next" card (ending with a scene after) and the main-host path; user tests them.
- Next: IntroDB for series (before the general queue).
- Plausibility filter (2026-10-09): opening must start in the first 40% of the video, recap in the first 25%, ending after 60%; opening/ending 20 s to 4 min (DBZ 284 has a 3:23 opening that includes the recap). Fixes One Piece ep 1 and 3 (wrong "ending" submissions). Side cards sit 72 px from the bottom with the controls shown and 20 px when they hide. 8/8 filter unit checks, `player_ui_check.mjs` 42/42. Cache version `20261009_f`.
