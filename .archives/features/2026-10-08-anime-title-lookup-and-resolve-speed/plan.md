# Plan: Anime Title Lookup (pt-BR) & Resolve Speed

> **Status:** IN PROGRESS (Phase 0 and Phase 1 done, awaiting review; Phases 2-4 not started)
> **Date:** 2026-10-08
> **Follow-up to:** `handovers/2026-10-08-native-player.md` (pending item 2)

---

## Context

Measured on the local server (2026-10-08) for `type=anime&lang=sub`:

- With the original title or a `mal_id`: 3.0-4.1 s total (mal 0.4-0.7 s, zoko 0.7-0.9 s, probe 2.0-3.1 s), 1080p HLS.
- With the pt-BR TMDB title ("Frieren e a Jornada para o Além", "Ataque dos Titãs"): 404 after 11.7-12.0 s. MyAnimeList finds nothing (about 10.5 s spent in `getMalIdFromTitle`, sequential queries plus the Jikan fallback), then the route falls through to the MGEB branch (down).
- Cause: `buildNativeResolveRequest` (series.js) sends only `showItem.name`; no `original_name`, no `mal_id`. `resolveDirectStream` (engine.js) has no parameter for them.

Goal: anime opened from the pt-BR catalog resolves like the original-title case, and failures are fast.

## Scope

In: MAL id lookup (title choice, caching, time budget), request parameters, failure message.
Out: AniSkip button (separate task), dubbed anime, new sources, MGEB.

## Phase 0 - Baseline

1. Add an anime matrix to `tools/player_benchmark.mjs` / `tools/test_live_resolve.py`: pt-BR titles (Frieren, Ataque dos Titãs, Jujutsu Kaisen, Demon Slayer, Naruto, One Piece, Death Note, Fullmetal Alchemist: Brotherhood), season > 1 cases (Jujutsu Kaisen S2, Attack on Titan S4, JoJo Stone Ocean as regression for the seasonality fix).
2. Record before-numbers (mal ms, total ms, success, resolved mal_id) in Edge and Firefox.

## Phase 1 - Send the original title (general fix)

1. `series.js`: `buildNativeResolveRequest` adds `original_title: showItem.original_name || showItem.original_title`. When missing (items restored from "continue watching"), fetch TMDB details once and reuse.
2. `engine.js`: `resolveDirectStream` forwards `original_title` as a query param (part of the resolve cache key).
3. `resolve.js` + `local_server.py` (kept identical): `getMalIdFromTitle` / `fetch_mal_id_from_title` tries the original title first, then the pt-BR title; scoring unchanged.
4. Bump the cache-busting `?v=` in `index.html`, `main.js` and every importer of `engine.js`.

## Phase 2 - Cache the MAL id

1. Server: cache `title+original_title+season+season_name -> mal_id` (24 h positive; short negative TTL, proposed 5 min). In-memory per isolate/process; Cloudflare Cache API for the edge (needs user OK).
2. Client: keep the `mal_id` returned by the first resolve (`aniskip.mal_id`) per show+season and send it on later episodes, so the `mal` step disappears and next-episode prefetch stays at ~3 s.

## Phase 3 - Time budget for failures

1. Run the MAL queries in parallel with a global budget of about 3 s; Jikan fallback inside the same budget.
2. On timeout or no match, return the 404 immediately (no MGEB detour for `lang=sub` anime when the title lookup failed).
3. Target: failure in <= 4 s (was 11.7-12.0 s).

## Phase 4 - Failure message

When the native anime player cannot resolve, show a specific message ("Anime não encontrado no player nativo. Tente outro servidor.") instead of the generic one. No automatic server switch (earlier decision: keep messages explicit).

## Verification (every phase)

- Edge and Firefox via `tools/player_benchmark.mjs`; `python tools/check_js.py`; `python tools/test_live_resolve.py`.
- `resolve.js` and `local_server.py` diffed for parity.
- Zero console errors; the Phase 0 matrix compared before/after, with numbers.

## Acceptance criteria

- pt-BR catalog titles resolve with the same result as the original-title case (>= 90% of the matrix, no wrong season).
- First open <= 5 s, next episode <= 3.5 s, failure <= 4 s.
- No regression on the 5 titles measured today (3.0-4.1 s).

## Rollout

Work on the current branch. No commit, push or deploy unless the user asks.

## Progress (2026-10-08)

### Phase 0 - done
`tools/test_anime_lookup.py` (28 cases; flags `--original`, `--mal`, `--warm`, `--only=`). Baseline, title only: 9/11 original cases correct, median 6.7 s, worst failure 12.8 s. Extended baseline: Frieren (no MAL match), One Piece S1 (wrong entry 36215), Naruto S3/S4 (404, matched a Boruto entry).

### Phase 1 - done
- TMDB `original_name` is Japanese script, not romaji; MAL prefix search matches it directly (no extra TMDB call needed).
- `original_title` and first air `year` flow series.js -> engine.js -> /api/resolve (resolve.js and local_server.py kept identical).
- Lookup: pt-BR and original title searched in parallel; "Season N" suffixes only for Latin text.
- Scoring: specials/OVAs/movies -100 (was -35); spin-off names ("Boruto: Naruto ...") -50; explicit season marker of another season -30; season 1 first-air-year match +30 / gap >= 3 years -30 (separates remakes such as Hunter x Hunter 1999/2011).
- Fallback entries: only exact score ties are tried (`MAL_RUNNER_UP_MARGIN = 0`); a lower-ranked entry is a different show.
- Results with `--original`: Python 28/28 (before the margin change), JS 28/28 (after, run in Node). Title only (old frontend): Frieren and Zodiaco fail.

### Findings for the next phases
- Total resolve is ~5.5-6 s cold (MAL ~0.5 s, zoko ~0.8 s, probe is the rest); the MAL step is not the bottleneck.
- Failed lookups are still slow (10-14 s) and fall through to the id-based route; Phase 3 should return immediately for `lang=sub` anime.
- MAL (AWS WAF) answered 405 + captcha to this machine after ~150 test requests. The parallel queries in Phase 1 raise the burst rate per resolve (up to ~7 requests), so Phase 2 (cache) matters more than planned.
- Not verified: Python side after the margin change; 3 extra held-out anime (blocked by the MAL captcha).
