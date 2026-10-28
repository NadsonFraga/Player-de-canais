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
   - Added vector SVG flag icons (BR, US, PT, ES, FR, JA, Global) adhering to the Zero Emojis rule.
   - Added a dedicated `CC` control button in Artplayer.
   - Added context-aware auto-activation: Dubbed streams start with subtitles OFF; Subtitled / Anime streams start with subtitles ON (PT-BR).
   - Added native track prioritization with `(Original da Fonte)` badge.
   - Added manual file upload contingency for `.srt` and `.vtt` files.

3. **Customizer & Preference Persistence (`assets/js/core/playerPrefs.js`, `assets/js/core/syncMerge.js`, `tools/local_sync.py`):**
   - Added timing delay offset slider (`-10.0s` to `+10.0s`) with `-0.5s`, `Zerar`, `+0.5s` step buttons, saved per title in localStorage.
   - Added typography size (75% to 150%), color swatch selection, and background mode (shadow vs semi-opaque box) controls.
   - Integrated appearance preferences into player preferences and cloud profile synchronization.

4. **Verification & Deployment:**
   - Ran `tools/bump_version.py` updating cache busting stamps across 33 files.
   - Verified tests: `check_js.py`, `bump_version.py --check`, `test_subtitles_api.py`, `test_sync_api.py`, `test_security_headers.py`, `test_resolve_cors.py`, `test_xss_protection.mjs`.
   - Merged into `staging` branch and pushed to origin.

---

## 2. Next Steps
- Await user manual testing on `staging.tvzinhaonline.pages.dev`.
- Upon user approval, merge `staging` into `master` for production deployment.
