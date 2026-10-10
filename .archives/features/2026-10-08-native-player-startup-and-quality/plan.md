# Plan: Native Player Startup Speed & Source Quality (general fix)

> **Status:** Proposed, awaiting approval
> **Date:** 2026-10-08
> **Supersedes:** `player-startup-speed-backlog.md` (kept as the evidence log)

---

## Context

The quality-aware ranking (probing in `resolve.js` / `local_server.py`, unified quality menu in `engine.js`) picks better resolutions but made startup slow and fragile:

- Series episode switch: ~40 s locally (Reacher) vs ~5 s on production. Cause: the new ranking opens `97bf1` 1080p first; its first segment is empty, playback stalls at 0:00 and the watchdog waits 30 s.
- Movies: 40 s to 2 min (Avatar, Super Mario Galaxy, Robo Selvagem, O Lado Bom de Ser Traida) from chained waits on broken sources.
- MGEB slow pages (~15 s, O Estranho Mundo de Jack) hit a 12 s timeout -> 404.
- CAM copies (Demon Slayer, Super Mario Galaxy) come from re-hosting mirrors whose masters announce a synthetic 360p/720p.
- Friends: ~10 s locally, 10-15 s on production (fast case, to keep in the test matrix).

The user wants general fixes, not per-host patches. Targets: episode switch ~5 s, never above 10 s; first open of a title <= 10 s; no CAM when a clean source exists.

---

## Phase 0 - Measurement first (prerequisite)

1. `tools/player_benchmark.mjs` (Node, headless Edge + Firefox via CDP/BiDi, no new dependencies): fixed title matrix, measures time-to-first-frame (TTFF), chosen source, resolution, failovers, console errors. Outputs a before/after table.
2. `Server-Timing` header on `/api/resolve` (MGEB fetch, probing, total) in both servers, so every slow case shows where the time went.
3. Title matrix: Reacher E1->E2->E3, Friends E1->E2, O Mentalista E1, Avatar, Super Mario Galaxy, Robo Selvagem, O Lado Bom de Ser Traida, O Estranho Mundo de Jack, Demon Slayer, A Ilha Esquecida, plus the previous 9 (Zootopia 2, Divertida Mente 2, Deadpool & Wolverine, Breaking Bad, The Last of Us, Doraemon, Frieren, One Piece, Naruto).

## Phase 1 - Playback start robustness (engine.js, generic)

1. **Start-gap jump:** whenever the buffered range starts after the playhead before first play, seek to `buffered.start(0)`. Covers any host with an empty or missing first segment.
2. **Stall-based watchdog** replacing "still downloading = wait":
   - "Stuck" = enough buffered ahead (>= ~10 s) but not playing -> try the gap jump once, then fail over immediately.
   - Per-source budget: HLS ~12 s, MP4 ~20 s; the last remaining source keeps waiting (up to 90 s).
   - Failover keeps the playback position (already in place).
3. **Loader feedback:** "Buscando fontes..." -> "Conectando à fonte 1 de 4..." -> "Trocando de fonte..." in the existing loaders (`movies.js`, `series.js`).

## Phase 2 - Time-budgeted resolve pipeline (resolve.js + local_server.py)

1. **MGEB:** query `/embed/<imdb>` and `/embed/<tmdb>` in parallel (single attempt, ~25 s timeout each); use the first with sources, merge the second if it arrives within ~1.5 s; dedupe by URL path.
2. **Probing with a global budget (~2.5 s):** sources not probed in time are returned as `unknown`, ranked by kind/host score after the probed ones.
3. **Early exit:** a trusted 1080p (passes the first-segment check, not synthetic) returns immediately; a trusted 720p waits a configurable grace (default 2.5 s) for a 1080p.
4. **Synthetic master detection:** a master is synthetic when its body carries the `FirePlayer` signature or the fixed 276000/2048000 bandwidth pair. Revised during implementation: mirrors sometimes carry a real 720p, so instead of always ranking them last, the top variant's first segment is measured (SPS) and replaces a fake declared resolution; synthetic/mirror sources still lose ties at equal quality.
5. Keep: first-segment sanity check (mid-file Content-Range), mp4 tkhd / TS SPS resolution reads, bounded body reads.

## Phase 3 - Client-side latency (series.js, movies.js, engine.js)

1. **Next-episode prefetch:** while an episode plays (after ~10 s of playback), resolve the next one in the background; reuse within 20 min. Episode switch skips the resolve step.
2. **Session cache of resolve results** (in memory, 20 min) for reopening the same title/episode.

## Phase 4 - CAM reduction (resolve.js + engine.js)

1. Phase 2 item 4 already demotes the mirrors that carried every CAM seen so far.
2. Optional notice: when TMDB `release_dates` shows no digital release (type 4) yet, show a "Cópia de cinema" badge in the player. Needs the user's decision.

## Phase 5 - Titles without native sources

- A Ilha Esquecida type (MGEB returns 0 sources): keep the message, or auto-open the first alternative iframe server. Needs the user's decision.

## Rollout

1. All work lives on branch `feat/native-player-quality` (pushed to GitHub with user approval: 3bc7194, b52f021 and later). No further commits, pushes or deploys unless the user asks.
2. Benchmarks run against the local server; the local Python proxy is slower than the Cloudflare edge, so a preview deployment may be proposed later, only with the user's approval.

## Progress (2026-10-08)
- Phase 0 done: `tools/player_benchmark.mjs`, `Server-Timing`, `/__dev/clear-cache`. Baseline median 10.2 s (Edge) / 9.0 s (Firefox), worst ~41 s.
- Phase 1 done: start-gap jump, stall-based start monitor (HLS 12 s, MP4 20 s, last source 90 s), source status line. Reacher E1 37 s -> 11-12 s (now 1080p), Avatar 41 s -> 14 s. Median 8.8 / 9.3 s, worst ~17 s.
- Phase 3 done (ahead of Phase 2): resolve cache (20 min) + next-episode prefetch. Changed after user review: prefetch fires when 3 min are left (fresh links on long episodes), plus a self-timed "Próximo episódio" countdown (10 s, cancelable; some HLS never fire "ended"). Anime route: next episode 2.8-3.7 s.
- Phase 2 implemented, MGEB-dependent parts not yet verified (MGEB returns 404 for every URL since ~07:28): parallel IMDb+TMDB lookups (single 25 s attempt, 1.5 s merge window), probe budget 2.5 s with early exit on a trusted 1080p HLS, synthetic master detection, measured top variant replaces fake declared resolutions. Merge logic unit-tested in JS and Python.
- Found (pre-existing, not fixed): anime lookups by Portuguese title fail on MAL ("Frieren e a Jornada para o Além"); proposal: send TMDB `original_name` too.

## Decisions (2026-10-08)
- "Cópia de cinema" badge: postponed.
- Titles without native sources: keep the current message (a search bug could otherwise look like "no source").
- Image-based CAM detection: not doing it.
- Focus now: startup time and picking the right quality.

## Not recommended

- Racing several sources at once in the browser: doubles bandwidth and hits the ~3 connection cap of `fontedecanais`.
- Visual/ML CAM detection: heavy and unreliable.
- Dropping probing and going back to host order: fast but returns to 480p/360p picks.
- Proxying MP4s through `/api/stream`: Cloudflare bandwidth/WAF issues.
- More per-host special cases beyond the generic rules above.

## Acceptance criteria

- Episode switch with prefetch: median <= 5 s, worst <= 10 s.
- First open (movie or first episode): <= 10 s for every title with a playable source.
- No CAM when a non-synthetic source exists.
- Quality menu: single entry, sorted, starts in Automático (no regression).
- Zero console errors in the matrix, Edge and Firefox.
