# Plan: movies in "Continuar assistindo" and a remove button (B19)

> Status: proposed on 2026-10-19, waiting for the user's approval. Branch `feat/continue-movies`.

## Today

- `tvzinha_watch_progress_v1` holds series/anime only: one entry per show (`progress[show.id]`), with the last episode, `timestamp`, and the time of its last 40 episodes (`positions["S:E"] = { position, duration, finished, server, at }`). The entry is created when an episode is opened (any server); positions come from the native players every ~10 s, on pause and on close.
- Movies save nothing: the movie player has no `onProgress`, a movie always starts from the beginning and never shows on the rail.
- The rail (`renderHomeContinueWatching`, `series.js`) shows the 10 newest shows; a card cannot be removed.

## Change

1. **Movies in the same store**, key `movie:<tmdbId>` (TMDB movie and TV ids overlap, so a plain id could collide with a show), `mediaType: 'movie'`, `{ id, title, poster_path, backdrop_path, position, duration, finished, server, at, timestamp }`. One store for everything keeps the future Coleção and account sync simple. Helpers in a new `core/watchProgress.js` (read, save a movie, hide/show an entry).
2. **Saving a movie:** opened with any server = enters the rail (like a series episode today); the Player Principal reports its time (`onProgress`, same rhythm as episodes). Finished (credits or 95 %) = it leaves the rail and keeps `finished: true` (the future "Assistidos").
3. **Resuming a movie:** reopening on the Player Principal starts at the saved time with "Continuando de 12:34 / Começar do início" (same rules as episodes, `core/resume.js`).
4. **The rail:** series, anime and movies together, newest first. A movie card shows the title, "Filme", the progress bar and "Faltam X min"; clicking opens the movie and plays it from where it stopped.
5. **Remove button** on every card: a small circle with an "x" line icon in the top corner, visible on hover on desktop and always visible on phones, reachable with the remote (D-pad). It hides the title from the rail without erasing its times (`hidden` + `hiddenAt`): watching it again later brings it back, and a removal is a marked change ready for the account sync (instead of a deletion that sync could not propagate). Toast "Removido de Continuar assistindo".
6. The rail re-renders through an event (`tvzinha:progress`) so `movies.js` does not import `series.js`.

## Out of scope

The Coleção page, "Quero assistir", ratings, sync: later items (F10, G7). Series behavior stays the same apart from the remove button.

## Verification

- New `tools/continue_watching_check.mjs` (Chrome and Firefox): a movie played on the Player Principal shows on the rail with progress and "Faltam X min"; reopening it resumes near the saved time with the notice; "Começar do início" works; a finished movie leaves the rail; the remove button hides a movie and a series card and they come back when watched again; nothing changes for series cards otherwise.
- Regression: `player_ui_check.mjs`, `player_touch_check.mjs`, `episode_entry_check.mjs` (resume card of episodes).
- Manual: several movies, series and anime; desktop, phone and the remote.
