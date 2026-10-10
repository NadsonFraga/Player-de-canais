# Player continuity: card position, fullscreen across episodes, resume position and preferences

Status: proposal, waiting for approval. Branch `feat/introdb` (same working tree as the series skip work).

## 1. Skip / next-episode card covers the progress bar

Cause: the card sits at a fixed `bottom: 72px`, but the height of Artplayer's bottom area changes (window vs fullscreen, phone vs desktop: `--art-control-height` is 38/46/60 px, plus progress and padding). In fullscreen and in the screenshot of Reacher S1E2 the card lands on the bar.

Fix: measure the real top of the controls (`.art-bottom .art-progress`) whenever the controls show, hide or the player resizes (Artplayer `control`, `resize`, `fullscreen` events) and set the card's bottom to `(player bottom - progress top) + 12 px`. Controls hidden: near the bottom edge (unchanged). Same rule for the skip card and the countdown card.

Check: screenshots with the card visible in window, fullscreen and phone layout; the card's bottom edge must be above the progress bar top (asserted in `player_ui_check.mjs` and `player_touch_check.mjs`).

## 2. Fullscreen is lost when the next episode starts

Cause: each episode creates a new Artplayer instance; the old one, which is the fullscreen element, is destroyed, so the browser leaves fullscreen. Re-entering it automatically is not allowed by browsers without a click (autoplay at the end has no click).

Fix: fullscreen targets a container that survives episode changes (the stage that holds the player), not Artplayer's own element. The fullscreen button and the keyboard shortcut call our toggle; the stage gets a fullscreen class so the player fills the screen; the phone orientation lock follows the same element. The next episode mounts inside the stage that is already fullscreen, so it stays fullscreen.

Limits: iPhone Safari only supports fullscreen on the `<video>` itself (no element fullscreen), so there the next episode still leaves fullscreen. Iframe servers keep their own fullscreen (cannot be controlled).

Check: Edge and Firefox, fullscreen on episode N, "Próximo episódio" click and countdown end: `document.fullscreenElement` stays set; phone emulation for orientation.

## 3. Resume at the exact time, keep player preferences

Position:
- Save `position` and `duration` of the episode on screen every ~10 s, on pause, on episode change and when the page is hidden, in the history entry (per show, plus a small per-episode map so the season list can show progress).
- On open (any entry point, through the episode context): if the episode has a saved position between 30 s and 95 % of its length and it is not inside the ending, start there and show a short notice "Continuando de 12:34" with "Começar do início".
- Switching between the two native players (main / anime) keeps the time; the two cuts can differ by a few seconds (dub vs subtitled), so the switch goes back ~5 s.
- Iframe servers: not possible (their video cannot be read or controlled).

Preferences (this browser only, `localStorage`):
- Volume and mute, playback speed, subtitle choice (language or off), quality (Auto or a fixed resolution, applied when the source has it), "Tela" (already saved).

Check: unit tests for the resume rule (start, middle, ending, finished); browser: play to a time, reopen from the resume card, the season list and a server switch, time and preferences restored, in Edge and Firefox.

## Order and effort

1 (small) -> 2 (medium, touches fullscreen handling for movies, series and anime) -> 3 (medium-large). One phase each, hard stop after each.

## Decisions (2026-10-09)

- Switching between the two native players goes back 10 s. Resume notice only "Continuando de 12:34" (nothing about the episode content). Preferences in their own storage record, separate from history, ready for login and a settings tab later.

## Progress

- Phase 1 done (uncommitted): `placeSideCards` measures the progress bar (on ready, resize, fullscreen, control) and sets `--tvz-side-card-bottom`; cards 6 px above the bar's clickable area in window and fullscreen. `player_ui_check.mjs` 46/46 (new gap check: 6 px window, 6 px fullscreen), touch 12/12.
- Phase 2 done (uncommitted): `routeFullscreenToStage` sends Artplayer's fullscreen request to the `.movie-player-stage` that survives episode changes; `leaveStageFullscreen` on closing the series or movie player. iPhone (no element fullscreen) never calls it, so it keeps the old video-only behaviour. `episode_entry_check.mjs`: fullscreen enters on the stage, stays through "Próximo", leaves on close (Edge 45/45).
- Found while testing phase 2 (Firefox): the series player buttons (previous, next, reload, exit, episode list) were only wired when the Séries/Animes tab was prepared, which now waits for the home screen to be idle; an episode opened from the home screen right away had dead buttons. `openEpisode` and `openSeriesModal` now call the (idempotent) `setupSeriesModalHandlers`. Headless Firefox refuses every fullscreen request (even a plain element), so fullscreen is checked in Edge and by hand in Firefox.
- Final checks (cache `20261009_q`): `episode_entry_check.mjs` Edge 45/45, Firefox 44/44; `player_ui_check.mjs` 46/46; `player_touch_check.mjs` 12/12.
- Phase 3 done (uncommitted, cache `20261009_s`): `core/playerPrefs.js` (own record `tvzinha_player_prefs_v1`: volume, muted, speed, subtitle language or off, quality, Tela; the old Tela key is folded in) and `core/resume.js` (`resumeStartTime`: 30 s minimum, under 95 %, finished/ending = start over; reload and server switch keep the time, other native player -10 s). Engine: `onProgress` every 10 s, on pause, before a reset and when the page is hidden (never before a resumed episode reached its time); "Continuando de 12:34" + "Começar do início" (7 s); preferences applied on ready and saved on change; a fixed quality picks a source that has it. Series: positions per episode in the history entry (40 newest), start time read after the previous player saved.
- Tests now default to Chrome (`--browser=chrome|edge|firefox`); CDP evaluate uses userGesture (Chrome refuses fullscreen without it). Checks: resume rule 9/9; `episode_entry_check.mjs` Chrome 52/52, Firefox 51/51 (resume, notice, restart, reload, main -> anime switch -10 s, preferences after reload); `player_ui_check.mjs` Chrome 46/46 (Edge 46/46); `player_touch_check.mjs` Chrome 13/13.
