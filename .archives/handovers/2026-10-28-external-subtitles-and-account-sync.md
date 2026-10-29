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
   - Added vector SVG flag icons (BR, US, PT, ES, FR, IT, DE, JA, KO, ZH, RU, PL, ID, AR, SR, TR, VI, RO, NL, SV, Global) with inline styles and `!important` to prevent player CSS overrides.
   - Added a dedicated `CC` control button in Artplayer with clean styling, transparent background, and green active indicator dot.
   - Unified language flyout grouping: tracks with the same language are merged under one entry with a version drilldown (`Original da Fonte` prioritized at top).
   - Added context-aware auto-activation: Dubbed streams start with subtitles OFF; Subtitled / Anime streams start with subtitles ON (PT-BR).
   - Added manual file upload contingency for `.srt` and `.vtt` files.

3. **Cross-Server Subtitle Persistence & Cache:**
   - Implemented `mediaSubtitlesCache` in `engine.js` keyed by media context (`series:${id}:${season}:${episode}` or `movie:${id}`).
   - Subtitle tracks (both native from stream hosts and external from OpenSubtitles) are retained in memory across server switches for the current episode/movie.
   - When switching from anime player (or any host with native subtitles) to other servers like `mgeb`, the previously discovered subtitles remain immediately available.

4. **Responsive Fullscreen Font Sizing:**
   - Replaced fixed inline `20px` font size with responsive CSS `clamp()` rules driven by `--tvz-sub-scale` CSS variable:
     - Windowed mode: `clamp(17px, 2.2vw, 22px) * scale`
     - Desktop / TV Fullscreen: `clamp(26px, 2.0vw, 40px) * scale` (scales up ~50% for optimal readability at 1080p, 1440p, 4K)
     - Mobile portrait: `clamp(15px, 3.8vw, 19px) * scale`
     - Mobile landscape: `clamp(16px, 4.2vh, 23px) * scale`
     - Subtitle elevation adjusts automatically (`bottom: 100px` in fullscreen) when player controls appear to avoid covering text.

5. **Customizer & Preference Persistence (`assets/js/core/playerPrefs.js`, `assets/js/core/syncMerge.js`, `tools/local_sync.py`):**
   - Added timing delay offset slider (`-10.0s` to `+10.0s`) with `-0.5s`, `Zerar`, `+0.5s` step buttons, saved per title in localStorage.
   - Added typography size (75% to 150%), color swatch selection, and background mode (shadow vs semi-opaque box) controls.
   - Integrated appearance preferences into player preferences and cloud profile synchronization.

6. **Verification & Deployment:**
   - Ran `tools/bump_version.py` updating cache busting stamps across 33 files.
   - Verified tests: `check_js.py`, `bump_version.py --check`, `test_subtitles_api.py`, `test_sync_api.py`, `test_security_headers.py`, `test_resolve_cors.py`, `test_xss_protection.mjs`.
   - Merged into `staging` branch and pushed to origin.

---

## 2. Next Steps
- Await user manual testing on `staging.tvzinhaonline.pages.dev`.
- Upon user approval, merge `staging` into `master` for production deployment.
