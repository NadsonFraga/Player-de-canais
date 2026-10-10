# Execution Plan - Stage 4: Subtitles, Audio Tracks, Mobile Movie Player & Background Optimization

- **Task Name:** `stage-4-subtitles-and-mobile-movie-player`
- **Status:** COMPLETED
- **Author:** Antigravity Orchestrator

---

## 1. Objective & Scope

### Objective
1. **Subtitles (VTT) & Audio Tracks in Artplayer:**
   - Pass resolved subtitle tracks (`data.subtitles`) to Artplayer configuration (`subtitle: { url, type: 'vtt', ... }`).
   - Register a dedicated subtitle selector and audio track selector in the Artplayer settings menu (`art.setting.add`) so users can toggle Portuguese/English subtitles and audio tracks.
2. **Movie Player Responsiveness & Exit Controls on Mobile:**
   - Fix the movie player header (`.movie-player-top-bar`) on mobile displays so that the server title does not push action buttons out of viewport.
   - Ensure the "Fechar Player" and reload buttons are cleanly accessible on Android screens.
   - Prevent the Artplayer controls bar on mobile from clipping the fullscreen toggle button.
3. **Background Carousel Silencing & Buffer Calibration:**
   - Pause the hero carousel timers (`heroSeriesAutoRotateTimer` and `heroMoviesAutoRotateTimer`) while any theater view or player modal is active, eliminating background thumbnail requests when paused.
   - Calibrate `Hls.js` buffer parameters (`maxBufferLength: 30`, `maxMaxBufferLength: 60`) so on-demand video buffering strictly halts when paused.

### Scope
- **Impacted Files:**
  - `assets/js/player/engine.js`: Subtitle integration, audio track menu, and Hls.js buffer calibration.
  - `assets/js/modules/movies.js`: Pause hero auto-rotation during modal/player playback.
  - `assets/js/modules/series.js`: Pause hero auto-rotation during theater playback.
  - `assets/css/08-responsive-tv-movies.css`: Mobile movie player header and controls bar styling.
  - `assets/css/07-modals.css`: Layout refinements for movie player top bar.
  - `index.html`: Version bump for cache busting.

---

## 2. Step-by-Step Strategy

1. **Step 1 - Subtitle & Audio Track Integration in `engine.js`:**
   - Wire `subtitles` array to `new Artplayer({ subtitle: ... })`.
   - Add a subtitle switcher in `art.setting.add` when multiple tracks exist (or toggle off/on).
   - Hook `hls.on(Hls.Events.AUDIO_TRACKS_UPDATED)` to add an audio track switcher if multi-audio streams are detected.
2. **Step 2 - Mobile Movie Player Layout Fixes:**
   - In `08-responsive-tv-movies.css` and `07-modals.css`, style `.movie-player-top-bar` on small screens with `flex-wrap: nowrap`, truncate server title gracefully, and give high priority to action buttons.
   - Ensure the close button is prominent and touch-friendly.
3. **Step 3 - Carousel Sleep on Playback:**
   - In `movies.js` and `series.js`, clear interval when opening details/player and restart when closed.
4. **Step 4 - Verification & Cache Busting:**
   - Run `tools/check_js.py`.
   - Bump cache version to `v19`.
   - Verify on both Desktop (`localhost:8787`) and Mobile (`192.168.0.107:8787`).

---

## 3. Testing & Edge Cases
- Test a movie or series with external VTT subtitles to verify subtitle rendering and styling in Artplayer.
- Test mobile view on Android / responsive mode (<420px) to verify the movie player header, close button, and fullscreen button fit without clipping.
- Verify in DevTools Network tab that when a player is active and paused, 0 thumbnail/hero requests occur in the background.

---

## 4. Changelog & Micro-adjustments

### Micro-adjustment 4.1: Movie Player Stage Isolation & Subtitle Tag Cleaning
- **What changed:**
  1. Wrapped `#movie-artplayer-container`, `#movie-player-loader`, and `#movie-modal-iframe` inside a dedicated `<div class="movie-player-stage">` in `index.html`.
  2. In `07-modals.css` and `08-responsive-tv-movies.css`, anchored `.movie-player-top-bar` as a fixed flex header (`height: 40px; position: relative; z-index: 30`) and gave `.movie-player-stage` `height: calc(100% - 40px); overflow: hidden;`. This prevents Artplayer (`position: absolute; top: 0; z-index: 10`) from overlapping and covering the top action bar ("Fechar Player" and "Recarregar").
  3. In `tools/local_server.py`, added regex cleaning to `handle_stream` for `.vtt` responses to strip raw HTML tags like `<i>` and `</i>` from subtitle cues before sending to the client, and configured `escape: false` in Artplayer's subtitle options.
  4. Bumped assets cache query to `v20`.
- **Why:** The user reported and demonstrated via mobile screenshots that:
  - The movie player on Android was covering the entire top bar, hiding "Fechar Player" and "Recarregar".
  - The subtitle cues rendered raw literal HTML tags (`<i>...</i>`) on screen.
- **How:** Structural stage isolation in HTML/CSS and server-side VTT cue sanitization.
