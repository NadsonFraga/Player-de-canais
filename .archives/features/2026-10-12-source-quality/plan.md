# Plan: "Buscar qualidade melhor" in the quality menu

> Branch `feat/source-quality`. Approved by the user on 2026-10-12 (their idea). Shipped to production (merge ebd3362).

## Why

- Avengers: Endgame (and Robo Selvagem, Zootopia 2, Deadpool & Wolverine) start in 360p in production. The resolver probes sources from Cloudflare, and the direct MP4 host (fontedecanais) blocks datacenters, so those MP4s stay "unmeasured" there and rank below a measured 360p re-hosting mirror. Measured from a home connection, the same MP4s are 1080p (3h01, 4.05 GB) and 720p.
- The host is slow: in the browser, the 1080p file took 13-17 s to start in Chrome and Firefox (once not within 30 s) and ~20 s per seek; the 720p 1-23 s. Ranking those MP4s first (tried and dropped) would trade a fast 360p start for long waits, and measuring before the start cannot fit a short budget.

## Decision (the user's)

- The automatic choice stays exactly as today (fast start).
- The quality menu offers "Buscar qualidade melhor" when there are live MP4 sources the server could not measure and what plays is below 1080p. On request the browser reads their real frame size (metadata only, in parallel, up to 30 s) while the video keeps playing; the qualities found join the menu; when one beats what plays, the player moves to it at the same position, with a 45 s start budget for that source (slow host); otherwise "Não encontramos uma qualidade melhor para este título.". If the better source then does not start, the viewer is told and playback goes back.
- The anime player has a single (measured) source, so the option never shows there.

## Result

- `engine.js`: `qualitySearchCandidates`, `readFrameSize`, `searchBetterQuality`; the menu item; `slowStartIndex` (45 s start budget for the requested source); a toast when that source fails and playback goes back. Cache version `20261012_1641`.
- `tools/quality_search_check.mjs` (real Endgame files, the answer reshaped in the page as the edge sees it): Chrome 9/9 and Firefox 9/9. 720p plays first (no measuring before the start); the search finds the 1080p (18 s Chrome, 42 s Firefox until 1920x804 plays) and resumes at 5:05-5:07 after 5:00; toasts "Procurando..." and "Fonte em 1080p encontrada. Carregando..."; menu then lists 1080p and drops the search; a broken unmeasured MP4 gives "Não encontramos..." and playback stays; a measured 1080p first offers no search. An earlier Firefox run hit the slow host (1080p not started in 45 s): playback went back to 720p at the same point, which is why the "não respondeu" toast was added (that path was not reproduced in the final runs).
- Regression: `player_ui_check.mjs` Chrome 46/46; `cast_check.mjs` Chrome 7/7 (a first run failed before the player opened: MGEB slow; the resolve answered normally right after).

## Preview round 1 (commit `bb461a5`) and fixes

- User test on the preview, Vingadores: Guerra Infinita: the menu showed only "Automático (480p) / 480p". Cause: source 1 was the unmeasured MP4 on the slow host; it ran out of start time (20 s) and the player moved on to source 2 (480p); the search excluded failed sources, so nothing was left to search.
- Fix: a source that failed only by running out of start time counts again for the search (`failReasons`); the one chosen is taken out of `failed` before switching. Sources that failed with a real error stay out.
- Also: `upsertSetting` redraws the settings when the entries of a list change (Artplayer keeps drawn panels). A no-fix run still drew the item, so this is a safeguard, not the cause.
- The test now clicks through the screen (gear, Qualidade, the item must be drawn and visible inside the panel) instead of calling the handler, picks the MP4s by role (the MGEB list rotates), and has a case with a first MP4 that never answers (local socket): Chrome 15/15 (+1 skip: no measured 1080p MP4 in that run's answer); Firefox: the never-answering first source and the broken source cases pass (6/6); the "find and switch" case could not run because the playing 720p MP4 itself ran out of start time and the player moved on to the 1080p (correct: no search offered at 1080p). The switch in Firefox was confirmed on the preview before (Vingadores 360p -> 1080p, Robo Selvagem 720p -> 1080p in Chrome).
- Cache version `20261012_1755`.
