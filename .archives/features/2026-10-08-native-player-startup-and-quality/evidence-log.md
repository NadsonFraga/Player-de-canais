# Backlog: Native Player Startup Speed

> **Status:** Proposed, not implemented
> **Date:** 2026-10-08
> **Context:** Follow-up to the quality-aware source ranking work (resolve.js / local_server.py probing, unified quality menu in engine.js).

---

## Problem

Some titles take ~1 minute (or fail) before the native player starts. Diagnosis showed the probing step is not the main cost:

| Step | Typical time |
|---|---|
| MGEB embed page | 2 s (some titles ~15 s, e.g. O Estranho Mundo de Jack) |
| Source probing (parallel) | 2-5 s (worst ~10 s) |
| Trying broken sources before the good one | 30 + 25 s (Avatar case) |

### Observed cases

- **Avatar Aang (TMDB 980431):** top source `97bf1` 1080p has an empty first segment (`fragParsingError: Found no media in fragment 0`). Buffer starts at 8 s, playhead stays at 0, `readyState` 1. Watchdog treats the ongoing download as progress and waits 30 s; then the `fontedecanais` MP4 waits 25 s; the 720p `onfilom` source finally plays (~63 s total).
- **O Estranho Mundo de Jack (TMDB 9479):** MGEB embed answers in ~15 s every time (by IMDb or TMDB id). `resolveMgeb` / `fetch_mgeb` time out at 12 s with 2 attempts, so resolve returns 404 after ~24 s. Pre-existing limit, not caused by probing.
- **Demon Slayer Castelo Infinito (TMDB 1311031):** user reports the CAM copy still plays after the mirror-ranking fix. Root cause: MGEB rotates its source list per request. Earlier it returned a clean `123flmsfree` 720p + a `playercdn` CAM; now both endpoints (`/embed/tt32820897` and `/embed/1311031`) return only `playercdn` mirrors (CAM).
- **Super Mario Galaxy (TMDB 1226863):** 7 sources (1 fontedecanais MP4 1080p, 2 flyfile 720p, 1 brstream MP4, 3 playercdn/powestream mirrors). Resolve took 14.3 s (MGEB 5.8 s + probing 7 sources). The user got a CAM ("1XBET" banner) after a long wait, i.e. after the MP4 failed and the chain fell to a mirror/flyfile copy. Segments from `ptbrr01r...` are disguised as `.jpeg`; several requests 404 / NS_BINDING_ABORTED.
- **A Ilha Esquecida (TMDB 1465063):** MGEB returns 0 sources on both endpoints. The 404 is correct (title not available natively).
- **Robo Selvagem (1184918) / O Lado Bom de Ser Traida (1173558):** only 2 sources each (fontedecanais MP4 + a mirror). 30-40 s waits come from the MP4 stall + watchdog chain, not from probing (resolve ~6 s).
- **Reacher (TMDB 108978, series):** ~40 s per episode locally vs ~5 s on production. Production (old ranking by host) opens `mgeb.top` 480p first, which starts fast. The new ranking opens `97bf1` 1080p first, which has the same empty first segment as Avatar (`Found no media in fragment 0`) and stalls ~30 s until the watchdog gives up. Local resolve itself takes 7.7-8.8 s (MGEB ~2 s + probing 5 sources). With a gap jump the 1080p source would start ~5 s after mount. `97bf1` empty first segment looks systematic (Avatar, Reacher).
- **Target agreed with user:** series episode switch must not exceed ~10 s; ideally ~5 s.
- **MGEB endpoints differ:** `/embed/<imdb>` and `/embed/<tmdb>` return different mirror hosts for the same title (and sometimes different sets). Merging both lists gives more chances of a clean source.

---

## Proposed changes (by impact)

### 1. Start-gap jump + smarter watchdog (engine.js)
- When buffered data starts after the playhead (first segment empty), seek to `buffered.start(0)`.
- If more than ~10 s is buffered and playback still has not started, treat the source as stuck: try the jump, then fail over immediately.
- Cap HLS sources at ~12 s each before failover; keep the longer wait for MP4 only when it is the last source.
- Expected: Avatar from ~60 s to ~5 s.

### 2. MGEB timeout (resolve.js + local_server.py)
- Single attempt with ~25 s timeout instead of 2 x 12 s.
- Cloudflare: cache the MGEB embed response so only the first viewer waits.

### 3. Early exit on a trusted good source (resolve.js + local_server.py)
- Trusted = passed the first-segment check and is not a `playercdn`/`workers.dev`/`powestream` mirror.
- Trusted 1080p HLS: return immediately.
- Trusted 720p HLS: wait a grace window for a 1080p; open question with the user whether 1.5 s is enough (2-3 s suggested, configurable).
- Nothing good: wait for full probing (current behavior).
- Remaining sources are returned unprobed as fallbacks; the quality menu fills their resolutions in the background.

### 4. Visual feedback (engine.js / movies.js / series.js)
- Loader text: "Buscando fontes…", then "Testando fonte 2 de 3…".

### 4b. Next-episode prefetch (series.js + engine.js)
- While an episode plays, resolve the next episode in the background and keep the result (sources expire, so reuse only within ~20 min).
- Episode switch then skips the resolve step entirely (~0 s instead of ~8 s).

### 5. CAM mitigation (resolve.js + local_server.py + engine.js)
- Query both MGEB endpoints (IMDb and TMDB id) in parallel and merge/dedupe the sources.
- Mirrors (`playercdn`/`workers.dev`/`powestream`) always ranked after every non-mirror source, regardless of declared quality (their 360p/720p master is synthetic).
- CAM cannot be detected reliably from metadata. Optional heuristic: TMDB `release_dates` digital release (type 4) still in the future means any copy is likely CAM; show a "Cópia de cinema" notice in the player.

### 6. Unavailable titles (movies.js / series.js)
- When resolve returns 404 (e.g. A Ilha Esquecida), keep the current message; optionally auto-select the first alternative iframe server.

---

## Verification (when implemented)
- Avatar, O Estranho Mundo de Jack, Demon Slayer, plus the regression set (Zootopia 2, Divertida Mente 2, Deadpool & Wolverine, Breaking Bad, The Last of Us, Doraemon, Frieren, One Piece, Naruto) in headless Edge and Firefox.
- Measure time-to-first-frame per title before/after.
