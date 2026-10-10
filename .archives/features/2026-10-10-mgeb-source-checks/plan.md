# Plan: MGEB source checks (P4, P5, P7; helps P1 and P2)

> Status: proposal, waiting for approval. Branch (only if asked): `feat/mgeb-source-checks`.
> Files: `functions/api/resolve.js` and `tools/local_server.py` (same logic, kept identical), `assets/js/player/engine.js` (P4 client part only), new `tools/test_mgeb_rules.py`.

## Measurements (2026-10-10, sequential requests, 2.5 s apart)

| Case | Result |
|---|---|
| One Piece T1E62 and T1E500 | MGEB answers 200 with title "One Piece - T1E1 - Eu Sou Luffy!..." and the E1 sources. P5 confirmed. |
| Naruto Shippuden T6E1 | Title "T6E1", 1 source: the title matches the request when the episode exists. |
| Burst of 4 simultaneous (Shippuden T6-T9 E1) | All 4 answered normally (~3-4 s). P4 did NOT reproduce today; the throttle signature is still unknown. |
| DBZ T1E1, 4 options | playercdn 1453.6 s, peliculaplay 1469.8 s, **mgeb.site 1342.4 s** (the "different video" option), fontedecanais MP4 (moov at the end, not read by the quick script). |
| DBZ T1E2, 3 options | playercdn 1453.6 s, **mgeb.site 1342.0 s**, MP4 unknown. |
| Bleach T1E1, 4 options | **noflixplayer 1475.1 s** (the Thousand-Year Blood War length the user saw), mgeb.site 1384.3 s, playercdn 1371.1 s x2. Anime player (MAL 269) is 23:14 = 1394 s. |
| Re:Zero T1E1, 3 options | 3001.9 / 3001.7 / 2950.7 s: same video, 1.7 % spread. All playlists had segments (P2 empty playlist not seen today). |

Same-video spread observed: 1.1-1.7 %. Wrong-video gap: 7-8 % (98-119 s).

## P5: refuse an answer for another episode (server)

- MGEB titles carry `T{season}E{episode}`. For series/anime lookups, parse it; when it exists and differs from the requested season/episode, drop that lookup (same place as `isTvCollision`).
- When every lookup is dropped, the answer is the existing 404 `no_sources` (client already shows "Fontes diretas indisponíveis para este episódio..."). Response field `reason: "episode_mismatch"` for diagnosis only.
- No title pattern: keep the lookup (no false refusals on hosts that omit it).
- Risk: a show whose MGEB numbering differs from ours (season-relative after P6) would lose valid sources. Verify with the title matrix below before enabling.

## P7 (+ P1, P2): measure each option's duration in the existing probe (server)

- Duration comes free from data the probe already downloads: HLS = sum of `#EXTINF` of the media playlist (the master's top variant is already fetched); MP4 = `mvhd` in the `moov` box (already located, including moov-at-end via the existing hop).
- An HLS playlist with zero segments or 0 s is marked `alive = false` (covers the P2 "empty playlist" case generally).
- Outlier rule: with 3 or more known durations, take the median; a source that differs by more than max(5 %, 45 s) gets `duration_mismatch = true` and is ranked after every non-mismatched live source (never removed: still a fallback). With exactly 2 known durations that disagree, nothing changes (no majority; the TMDB runtime was checked and is too coarse: for Bleach it would pick the wrong one).
- Early exit: today ranking stops as soon as a trusted 1080p HLS is measured, which can leave the others unmeasured (mgeb.site is ranked first in production). New condition: stop early only when at least one other measured duration agrees with the top source; otherwise wait for the rest within the existing 2.5 s budget.
- Applied to the measurements: DBZ E1 mgeb.site demoted (-8.1 %), Bleach noflixplayer demoted (+7.1 %), Re:Zero untouched (1.7 %). DBZ E2 (2 known) untouched unless the MP4 duration is read (it will be, in the real probe).
- `duration` (seconds) is added to each source in the response (useful for later P1 cross-check with the anime player).

## P4: avoid MGEB bursts (server + client)

- Server: when no lookup returned a page with sources AND the MGEB answers were fast (< 1.5 s) or not OK, wait 2.5 s and retry once (IMDb lookup only, sequential). A lookup dropped by P5 does not trigger the retry. Each try records `mgeb_try` in `Server-Timing` and the raw status/"sources present" flag, so the real throttle signature can be confirmed in production.
- Client (`engine.js`): background prefetch (`prefetchDirectStream`) waits while a user-started resolve is in flight, and runs one at a time, so prefetch and a click never hit MGEB together.
- Cost: a real "no source" fast answer costs about +3 s before the error. Because P4 did not reproduce today, the retry is a guarded best effort.

## Verification

1. `tools/test_mgeb_rules.py`: pure-function cases in Python and the same cases in Node against `resolve.js` (title match, EXTINF sum, mvhd duration, median/outlier with the measured numbers above, early-exit rule).
2. Live matrix through `/api/resolve` on the local server, sequential with 2.5 s gaps: One Piece T1E1 / E62 / E500, Naruto Shippuden T2E1 and T6E1, DBZ T1E1-E3, Bleach T1E1, Re:Zero T1E1, Friends T1E1, Breaking Bad T1E1, two movies (Avatar, Zootopia 2). Expected: E62/E500 -> 404; DBZ/Bleach outliers ranked last; every other title keeps a playable primary; no added time on the normal path beyond the early-exit change (report median before/after).
3. Parity: same outputs from `local_server.py` and `resolve.js` for the matrix.
4. `node --check` / `python tools/check_js.py` on changed files; `python tools/bump_version.py` (engine.js changes); `tools/player_ui_check.mjs` only if the reviewer asks (change is server-side plus one client helper).

## Phase 1 result (2026-10-10, not committed)

- Approved by the user: Phase 1 (P5 + P7); P4 later, with the retry delay only for episodes without a source.
- Change after the live matrix: the length rule applies to **episodes only**. On movies it flagged legitimate cuts (Avatar theatrical 9722 s vs extended 10690 s; a Zootopia 2 copy 5 min shorter), so movies keep the previous ranking and early stop unchanged.
- `tools/test_mgeb_rules.py`: 21 rule cases pass in Python and in Node against `resolve.js` (loaded in memory), same answers in both.
- Live matrix (14 titles, sequential), old code (HEAD) vs new: One Piece E62/E500 went from HTTP 200 (would play E1) to 404 `episode_mismatch` in 2.6-2.7 s; every other title keeps a primary; movie order identical. Source-check step (`probe`): median 1383 -> 1409 ms, worst 2515 -> 2502 ms. Total resolve median 7.2 -> 8.0 s, within MGEB's own run-to-run variation (+-2 s).
- Not verifiable locally: mgeb.site fails the probe from this machine (it passes on Cloudflare), so the DBZ and Bleach demotions only happen where mgeb.site is measured. Covered by the rule cases; confirm on a preview deploy.

## Phases

1. P5 + P7 (server only, both files) and unit tests. Stop and report.
2. P4 (server retry + client prefetch queue). Stop and report.
3. Manual test table for the user, preview deploy only when asked.
