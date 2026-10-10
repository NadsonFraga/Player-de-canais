# Summary: Clean Console & Dynamic On-Demand Iframes

> **Status:** Complete  
> **Date:** 2026-10-07

---

## Changes Applied

### Problem Solved
Static idle `<iframe>` elements declared in `index.html` were triggering cascading browser console warnings (`Permissions-Policy: autoplay/encrypted-media` and Quirks Mode `[blank]`) on every tab switch, because the router was resetting them via `iframe.src = "about:blank"`.

### Strategy Adopted
- **Removed** static iframes from `index.html`.
- **Added** `getOrCreateMovieIframe()` / `removeMovieIframe()` helpers in `movies.js`.
- **Added** `getOrCreateSeriesIframe()` / `removeSeriesIframe()` helpers in `series.js`.
- **Updated** `router.js` to call `.remove()` instead of setting `src = "about:blank"`.
- Iframes are now **injected exactly when the user triggers a third-party server**, and **destroyed** when the player closes or the view switches.

---

## Files Modified

| File | Change |
|---|---|
| `index.html` | Removed `#movie-modal-iframe` and `#series-modal-iframe` static tags |
| `assets/js/navigation/router.js` | `teardownAllMedia()` and `switchAppView()`: replaced `src = "about:blank"` with `iframe.remove()` |
| `assets/js/modules/movies.js` | Added `getOrCreateMovieIframe()` / `removeMovieIframe()`; updated all touch points |
| `assets/js/modules/series.js` | Added `getOrCreateSeriesIframe()` / `removeSeriesIframe()`; updated all touch points (Route A, Route B, `closeSeriesModal`, `stopSeriesPlayer`, `teardownMedia`) |

---

## Expected Result
- Console F12 shows **zero** Permissions Policy or Quirks Mode warnings on page load or tab switching.
- All player functionality (native HLS/ArtPlayer, third-party Superflix/MGEB/etc. iframes) continues to work as before.
- Memory and browser resource usage reduced (no idle iframes in standby).

---

## Testing Checklist
- [ ] Open app — console F12 shows only init logs, no yellow warnings
- [ ] Navigate between Início → Filmes → Séries → Animes → Canais — no `about:blank` warnings
- [ ] Open a movie modal → click a third-party server → iframe loads and plays
- [ ] Close the movie modal → reopen → plays again normally
- [ ] Open series → play an episode (MGEB or Superflix) → plays correctly
- [ ] Navigate away mid-playback → player stops cleanly, no zombie iframes
