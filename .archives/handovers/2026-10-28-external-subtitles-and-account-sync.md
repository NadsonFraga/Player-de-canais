# Handover: External Subtitles & Account Sync

**Date:** 2026-10-28  
**Branch:** `feat/external-subtitles-and-account-sync` -> `staging`  
**Deploy URL:** `https://staging.tvzinhaonline.pages.dev`  

---

## 1. What was done
1. **Subtitle Search & Conversion Edge API (`functions/api/subtitles.js`, mirrored in `tools/local_server.py`):**
   - Implemented `GET /api/subtitles` endpoint for Stremio OpenSubtitles v3 subtitle discovery.
   - Handled TMDB -> IMDb ID lookup via TMDB API when IMDb ID is missing.
   - Built a WebVTT streaming proxy (`action=proxy&url=...`) with server-side SRT to WebVTT conversion, XSS sanitization (`cleanVtt`), and anti-SSRF protections.
   - Built complete unit and integration tests (`tools/test_subtitles_api.py`).

2. **Player Subtitle Engine (`assets/js/player/flags.js`, `assets/js/player/engine.js`, `assets/css/10-player-v3.css`):**
   - Vector SVG flags with protected inline styles and `!important`.
   - Unified language flyout grouping with version drilldowns (`Original da Fonte` prioritized at top).
   - Context-aware auto-activation: Dubbed streams start with subtitles OFF; Subtitled / Anime streams start with subtitles ON (PT-BR).
   - Manual file upload contingency for `.srt` and `.vtt` files.

3. **Synchronous Controls & Button Lifecycle:**
   - Moved `tvz-subtitles-btn` declaration directly into the Artplayer constructor options (`controls: [...]`).
   - The CC button now renders in the initial DOM together with volume, play, and settings, eliminating layout jump or late pop-in.

4. **Mobile UX, Backdrop Overlay & Touch Bleed Elimination:**
   - Added `.tvz-subtitles-backdrop` overlay covering the entire stage while the flyout is open.
   - Added full event capture and `stopPropagation()` on the panel and backdrop, completely eliminating click-throughs to the underlying video and progress bar (which previously caused accidental seeks to the end of the video).
   - Added an explicit Close (`[X]`) button across all views (Main list, Language Drilldown, and Customizer).
   - Added mobile-specific bottom-sheet positioning and responsive sizing for portrait and landscape modes.
   - Added smooth auto-close (220ms) upon selecting a subtitle track or turning off subtitles on mobile.

5. **Cross-Server Subtitle Persistence & Cache:**
   - Implemented `mediaSubtitlesCache` in `engine.js` keyed by media context (`series:${id}:${season}:${episode}` or `movie:${id}`).
   - Subtitle tracks remain available across server switches for the same episode/movie.

6. **Responsive Fullscreen Font Sizing:**
   - Replaced fixed inline `20px` font size with responsive CSS `clamp()` rules driven by `--tvz-sub-scale` CSS variable:
     - Windowed mode: `clamp(17px, 2.2vw, 22px) * scale`
     - Desktop / TV Fullscreen: `clamp(26px, 2.0vw, 40px) * scale`
     - Mobile portrait: `clamp(15px, 3.8vw, 19px) * scale`
     - Mobile landscape: `clamp(16px, 4.2vh, 23px) * scale`
     - Subtitle elevation adjusts automatically (`bottom: 100px` in fullscreen) when player controls appear.

7. **Verification & Deployment:**
   - Verified tests: `check_js.py`, `bump_version.py --check`, `test_subtitles_api.py`, `test_sync_api.py`, `test_security_headers.py`, `test_resolve_cors.py`, `test_xss_protection.mjs`.
   - Merged into `staging` branch and pushed to origin.

---

## 2. Next Steps
- Await user manual testing on `staging.tvzinhaonline.pages.dev`.
- Upon user approval, merge `staging` into `master` for production deployment.
