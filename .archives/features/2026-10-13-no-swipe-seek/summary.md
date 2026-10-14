# Summary: no swipe-to-seek on the phone (2026-10-13)

Small fix, approved in chat without a plan file.

## Problem

In fullscreen on Android, dragging from the screen edge to reveal the system controls (back, home, app switcher) moved the episode back. Artplayer 5.1.7 seeks when a finger drags sideways over the video (`gestureInit`: half the duration per screen width, on any phone, except live). The option does not exist in this version.

## Change

- `assets/js/player/engine.js`: `installNoSwipeSeek(art)` stops `touchmove` events aimed at the `<video>` in the capture phase on `$player`, so Artplayer's listener never sees them. Called next to `installDoubleTapSeek` in `mountNativePlayer` (movies, series, anime). Double tap (+/-10 s), the progress bar, the skip cards and taps that show the controls are unchanged. `fastForward` (long press) is off in our options, so nothing else used that event.
- `tools/player_touch_check.mjs`: two drag checks (from the right edge, across the middle) and a fullscreen check on the phone (button fullscreen goes to the stage and stays through the next episode).

## Verification

- `node tools/player_touch_check.mjs` (Chrome, Android emulation): 17/17. With the call commented out, the edge drag moved 8.9 s -> 0.0 s (fails).
- In emulation a drag to the right triggers the browser's own back navigation (popstate) and closes the player; that matches the real Android back gesture, so the test only drags left.
- User confirmed on the phone (LAN server) before the deploy.

## Open

- Fullscreen lost when changing episode on the phone (Rick and Morty): not reproduced; see backlog B17.
