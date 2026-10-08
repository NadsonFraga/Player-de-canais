# Handover: Native Player Quality & Startup Speed (2026-10-08)

> Read this first when resuming on another machine. Full plan: `.archives/plans/native-player-startup-and-quality-plan.md`. Evidence log: `.archives/plans/player-startup-speed-backlog.md`.

## Working rules agreed with the user

- Chat in Brazilian Portuguese; planning files in English (project `CLAUDE.md`).
- Always paste the full plan in chat and wait for approval. During multi-phase work, hard stop after every phase with numbers.
- **No git operations (commit, push, branch) unless the user asks.** All work lives on local branch `feat/native-player-quality`.
- Prefer general fixes over per-host patches.
- Decided: no "Cópia de cinema" badge for now; keep the "Stream nativo indisponível" message for titles without sources; no image-based CAM detection.

## Git state

- Branch `feat/native-player-quality` pushed to GitHub (user approved, 2026-10-08). `master` untouched (local master is 2 commits ahead of origin/master, not pushed).
- To resume on another machine: `git fetch && git switch feat/native-player-quality`.
- `.archives/` now lives inside the main repo (user decision, accepted that it becomes public). Its old nested `.git` (private repo `Player-de-canais-archives`) was moved to `C:\Users\nadson\Documents\CODE\TVZINHA-archives-git-backup` on the original notebook; the private GitHub repo was left as is.
- Working rules are in the project `CLAUDE.md` (loaded automatically).
- Module cache-busting version: `20261008_q7` (bump in all importers of engine.js + main.js + index.html on every frontend change).

## What is done

1. **Quality ranking** (`resolve.js` / `local_server.py`, kept identical): probes each source (HLS variants, TS SPS, MP4 tkhd), ranks alive -> quality -> low-trust (synthetic/mirror) -> kind (hls-multi, hls-single, mp4-range, mp4) -> host score. First-segment sanity check (mid-file Content-Range = broken).
2. **Unified quality menu** (`engine.js`): YouTube-like, "Automático (Xp)" first, switching source keeps position; `setting.update` by name (fixes duplicated rows).
3. **Phase 0:** `tools/player_benchmark.mjs` (Edge CDP / Firefox BiDi, `--only=`, `--browser=`, `--out=`), `Server-Timing` on resolve, `/__dev/clear-cache` on the local server.
4. **Phase 1:** start-gap jump (empty first segments on `97bf1`), stall-based start monitor (HLS 12 s, MP4 20 s, last source 90 s), status line "Conectando à fonte N de M...". Released video element on teardown (fixed `fontedecanais` ~3-connection cap stalls).
5. **Phase 3:** resolve cache 20 min in `resolveDirectStream`; next-episode prefetch when 3 min are left (`onNearEnd`); self-timed "Próximo episódio" countdown 10 s with Cancelar (`getNextUp`). `getNextEpisodeTarget()` shared with the "Próximo" button.
6. **Phase 2 (implemented, MGEB part unverified):** MGEB lookups by IMDb + TMDB id in parallel (single 25 s attempt, 1.5 s merge window); probe budget 2.5 s with early exit on trusted 1080p HLS; synthetic "FirePlayer" master detection; measured top variant replaces fake declared resolution.

## Benchmarks (local, before -> after Phase 1)

- Median TTFF 10.2 s -> 8.8 s (Edge), 9.0 s -> 9.3 s (Firefox); worst ~41 s -> ~17 s.
- Reacher E1 37 s -> 11-12 s (1080p); Avatar 41 s -> 14 s.
- Anime next episode with prefetch: 2.8-3.7 s.

## Pending / next steps

1. **MGEB is down** (every URL incl. `mgeb.top/` returns 404 since ~07:28 on 2026-10-08). When back: run `node tools/player_benchmark.mjs --browser=edge` and `--browser=firefox`, compare with Phase 1 numbers; verify Jack (slow MGEB), Mario (7 sources), Reacher episode switch. Also check whether production (Cloudflare) is also failing, to rule out a block of our IP.
2. **Anime lookups by Portuguese title fail** (MAL search with "Frieren e a Jornada para o Além"). Proposed general fix: send TMDB `original_name` and use it for the MAL lookup. Awaiting user decision.
3. AniSkip ("Pular abertura", credits-based next episode) for anime: later, separate task.
4. CAM: only partially mitigated (mirrors lose ties; MGEB source list rotates). Revisit later.
5. Nothing is committed beyond 3bc7194; ask the user before any commit/push/deploy.

## How to run locally

```bash
python tools/local_server.py        # http://localhost:8787 (and LAN IP for phones)
node tools/player_benchmark.mjs --browser=edge --only=reacher,avatar
python tools/test_live_resolve.py
```

## Pitfalls seen

- Editing JS regex through shell heredocs turned `\n`/`\b` into real characters twice; use the Edit tool or script files.
- Artplayer `setting.add` always appends (duplicates); use `setting.update` with a fixed `name`.
- `Artplayer.destroy()` only detaches `<video>`: release `src` first or MP4 connections leak.
- Some HLS never fire `ended`; do not rely on it.
- MGEB answers differently per id type and per request (rotating sources).
