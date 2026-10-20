# Summary: movies in "Continuar assistindo" and a remove button (B19)

**Branch:** `feat/continue-movies` · **Dates:** 2026-10-19 to 2026-10-20 · **Version:** `20261019_1817`
**Preview:** https://feat-continue-movies.tvzinhaonline.pages.dev
**Status:** approved by the user after manual tests on the preview (all items OK).

## Problem

Movies saved nothing: they always started from the beginning and never showed on "Continuar assistindo". No card on the rail could be removed.

## Change

- `core/watchProgress.js` (new): one store for everything the viewer watches (`tvzinha_watch_progress_v1`). Movies live under `movie:<tmdbId>` (TMDB movie and TV ids overlap) with `mediaType: 'movie'`, position, duration, finished, server and timestamps. An event (`tvzinha:progress`) redraws the rail, so `movies.js` does not import `series.js`.
- `movies.js`: opening a movie with any server puts it on the rail; the Player Principal saves its time (`onProgress`) and resumes it with "Continuando de / Começar do início" (`core/resume.js` rules). A finished movie (credits or 95 %) leaves the rail and keeps `finished: true` for the future "Assistidos".
- `series.js` (rail): series, anime and movies together, newest first; movie cards show "Filme", the bar and "Faltam X min" and reopen the movie playing. Every card has a small round "x" (hover or focus on desktop, always on touch screens, reachable with the remote): it hides the title without erasing its time (`hidden` + `hiddenAt`), comes back when watched again, and is a marked change ready for the account sync. No confirmation, a toast (user's choice).
- `09-series-animes.css`: the remove button, neutral colors. `remote.js`: the button is reachable.

## Results

New `tools/continue_watching_check.mjs`: Chrome 9/9, Firefox 9/9, and 9/9 on the preview (Divertida Mente 2 saved at 40 %, card "Faltam 58 min", reopened at 38:33 with "Continuando de", off the rail when finished, remove hides a movie and a series card without opening them and keeps the time, back when watched again). `episode_entry_check.mjs` 52/52, `player_touch_check.mjs` 17/17, `player_ui_check.mjs` 45/46 (B21). Manual: all items OK.

## Next

The store is the base for the Coleção (F10: Assistindo, Quero assistir, Assistidos, Avaliados) and for the account sync (G7).
