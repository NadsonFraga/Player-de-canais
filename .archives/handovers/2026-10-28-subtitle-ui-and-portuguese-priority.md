# Handover: Subtitle UI Alignment & Portuguese Language Priority

**Date:** 2026-10-29  
**Branch:** `staging`  
**Deploy URL:** `https://staging.tvzinhaonline.pages.dev`  

---

## 1. What was done
1. **SSOT Unified Native Subtitle Architecture (`assets/js/player/engine.js`, `assets/css/10-player-v3.css`):**
   - Eliminated the parallel custom `.tvz-subtitles-panel` and `.tvz-subtitles-backdrop` completely (net removal of 277 lines of complex boilerplate and 180 lines of CSS media query hacks).
   - Unified the subtitle UX into Artplayer's native `art.setting` subtitle submenu:
     - `Desativada` at index 0.
     - Grouped, prioritized language tracks with vector SVG flags and human-friendly Portuguese labels.
     - Subtle "Sincronia e tamanho" customization submenu rendered with Artplayer's native sub-selector.
     - "Enviar arquivo (.srt / .vtt)" row in the footer with native file upload support.
   - Connected the `[CC]` control bar button directly to the native settings menu (`toggleNativeSubtitlesMenu`): clicking `[CC]` opens the settings directly into the `< Legendas` panel, and clicking it again toggles it off.
   - Eliminated mobile screen stretch, touch bleed, and z-index anomalies: mobile portrait and landscape now render the native compact floating panel on the right side.

2. **Portuguese Priority Enforcement (`assets/js/player/engine.js`):**
   - Created top-level helper `subtitleLanguageRank(sub)` that assigns priority rank 1 (or 2) to PT-BR, rank 3 (or 4) to PT, rank 10 (or 11) to English, and rank 12 (or 13) to Spanish.
   - Fixed `defaultSubtitleIndex`: PT-BR is guaranteed to be chosen first regardless of stream track order or `isNative` flags.
   - Implemented dynamic language upgrade in `fetchExternalSubtitles`: Automatically upgrades to PT-BR as soon as external subtitles arrive from OpenSubtitles if the user hasn't manually chosen another language.

3. **Verification & Tests:**
   - `python tools/check_js.py` (0 missing imports).
   - `node -c assets/js/player/engine.js` (valid JS syntax).
   - `python tools/bump_version.py` (version stamped to `20261029_0012`).
   - `python tools/test_subtitles_api.py` (7/7 passed).
   - `python tools/test_sync_api.py` (48/48 passed).
   - `node tools/test_xss_protection.mjs` (24/24 passed).
   - `python tools/test_security_headers.py` (passed).
   - `python tools/test_resolve_cors.py` (passed).
   - Pushed directly to `staging`.
