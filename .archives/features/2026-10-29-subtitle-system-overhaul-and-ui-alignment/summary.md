# Feature Summary: Subtitle System Overhaul & UI Visual Refinement

**Branch:** `feat/subtitle-system-overhaul-and-ui-alignment`  
**Date:** 2026-10-29  
**Version:** `20261029_1949`  

---

## 1. Accomplishments

1. **Resolution of Subtitle Centering & Left-Alignment Bug:**
   - Redesigned `.art-video-player .art-subtitle` to span the full viewport width (`left: 0 !important; right: 0 !important; width: 100% !important; margin: 0 !important; box-sizing: border-box !important; display: none; align-items: center; justify-content: center;`).
   - Moved the safety margin and line wrap constraints (`max-width: 85% !important; margin: 2px auto !important; text-align: center !important;`) to `.art-subtitle-line`. Subtitles now center reliably across any aspect ratio or resolution.
   - Added native `::cue` CSS fallback so that any browser or HLS default track renders with dark semi-translucent background and crisp text shadow instead of raw browser defaults.

2. **Decoupled Track Binding & Artplayer 5.1.7 Patch:**
   - Implemented `patchArtplayerSubtitleEngine(art)` to eliminate Artplayer's hardcoded lock on `this.art.template.$video.textTracks[0]`. The engine now resolves to `art.template.$track.track` directly.
   - Added `disableEmbeddedTextTracks(art)` to mute conflicting embedded HLS text tracks when external subtitles are active, preventing duplicate or phantom on-screen captions.

3. **IMDb & TMDB Parameter Normalization:**
   - Resolved the snake_case vs camelCase discrepancy: `let imdbId = ctx.imdbId || ctx.imdb_id;`.
   - Canonical season and episode resolution (`ctx.tmdb_season` / `ctx.tmdb_episode`) passed into `/api/subtitles` so anime and split-season shows match OpenSubtitles indices.

4. **Explicit Track Type & Resilient Failover:**
   - Guaranteed `type: 'vtt'` in all calls to `art.subtitle.switch()`, ensuring Artplayer converts proxy responses into standard WebVTT blob URLs instead of passing raw URLs to `<track>`.
   - Built an automatic failover mechanism: if an external subtitle from `subs5.strem.io` fails (404/502), the player catches the error and immediately attempts the next candidate in the same language.

5. **Aesthetic Enhancements:**
   - Refined `data-bg="box"` mode: now styles `.art-subtitle-line` with rounded black pill padding (`rgba(0,0,0,0.82)`), matching Netflix/Prime aesthetics without darkening the entire bottom of the video.
   - Enhanced scrollbar styling for the subtitle flyout panel (`.tvz-sub-list` and `.tvz-sub-custom-body`).

---

## 2. Verification Matrix
- `python tools/check_js.py`: Passed (0 missing imports).
- `python tools/bump_version.py --check`: Passed (`20261029_1949`).
- `python tools/test_subtitles_api.py`: Passed (8/8 OK).
- `python tools/test_resolve_cors.py`: Passed (0 failures).
- `python tools/test_security_headers.py`: Passed (0 failures).
