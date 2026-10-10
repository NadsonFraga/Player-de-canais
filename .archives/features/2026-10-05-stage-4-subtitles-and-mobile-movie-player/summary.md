# Stage 4 Summary: Subtitles, Audio Tracks, Mobile Movie Player & Background Optimization

## Overview
This stage successfully activates VTT subtitle rendering and multi-audio track selection in the native Artplayer, fixes responsiveness and exit controls for the movie player on mobile displays, and silences background hero carousels during playback to eliminate unnecessary network traffic.

## Changes Implemented

### 1. Subtitles & Audio Track Selectors in Artplayer
- **File**: `assets/js/player/engine.js`
- **Subtitle Integration**: Connected `subtitles` array to the Artplayer instance (`subtitle: { url, type: 'vtt', style: ... }`).
- **Subtitle Switcher**: Added an interactive "Legendas" selector to `art.setting` allowing users to toggle between available subtitle tracks or turn them off completely (`art.subtitle.show = false`).
- **Multi-Audio Selector**: Attached listeners to `Hls.Events.MANIFEST_PARSED` and `Hls.Events.AUDIO_TRACKS_UPDATED` to dynamically inject an "Áudio" selector into `art.setting` whenever multiple audio streams (dubbed/subbed) are detected.
- **Hls.js Buffer Calibration**: Configured `backBufferLength: 60`, `maxBufferLength: 30`, and `maxMaxBufferLength: 60` to ensure video segment downloads strictly stop once the safe buffer horizon is filled.

### 2. Mobile Movie Player Header & Responsive Controls
- **Files**: `index.html`, `assets/css/07-modals.css`, `assets/css/08-responsive-tv-movies.css`
- Wrapped `#movie-artplayer-container`, `#movie-player-loader`, and `#movie-modal-iframe` inside a dedicated `<div class="movie-player-stage">`.
- Fixed the top bar layout: `.movie-player-top-bar` now has fixed `height: 40px; position: relative; z-index: 30`, preventing Artplayer (`position: absolute; top: 0; z-index: 10`) from ever covering "Fechar Player" and "Recarregar".
- Truncated long server titles gracefully with ellipsis so action buttons are never pushed outside mobile viewports.
- Adjusted `.art-bottom` and `.art-controls-right` padding on mobile devices to prevent the fullscreen button from overflowing the display edge on Android.

### 3. Subtitle Tag Cleaning
- **Files**: `tools/local_server.py`, `assets/js/player/engine.js`
- Cleaned VTT cues by stripping raw HTML tags like `<i>` and `</i>` in `tools/local_server.py` and set `escape: false` in Artplayer's subtitle options.

### 4. Background Carousel Silencing
- **File**: `assets/js/modules/series.js`
- Created `pauseHeroCarousels()` and connected it to `playSeriesEpisode()`.
- Halts background `setInterval` timers for hero series and anime carousels while theater view playback is active, preventing redundant TMDB backdrop thumbnail downloads while paused or playing.

### 5. Cache Busting & Verification
- **Files**: `index.html`, `assets/js/main.js`
- Bumped CSS queries and entrypoint module script tags to `v20`.
- Verified all modular dependencies and imports with `python tools/check_js.py` (0 errors, 0 missing imports).
- Verified local dev and resolver server running stably on port 8787.
