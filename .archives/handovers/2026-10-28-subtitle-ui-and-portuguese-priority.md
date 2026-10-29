# Handover: Subtitle UI Alignment & Portuguese Language Priority

**Date:** 2026-10-28  
**Branch:** `staging`  
**Deploy URL:** `https://staging.tvzinhaonline.pages.dev`  

---

## 1. What was done
1. **Portuguese Priority Enforcement (`assets/js/player/engine.js`):**
   - Created top-level helper `subtitleLanguageRank(sub)` that assigns priority rank 1 (or 2) to PT-BR, rank 3 (or 4) to PT, rank 10 (or 11) to English, and rank 12 (or 13) to Spanish.
   - Fixed `defaultSubtitleIndex`: Previously, any stream track marked with `isNative: true` was assigned `rank = 0`. Because streams like ZokoAnime list English before Portuguese, English was at index 0 and Portuguese at index 1 (`0 < 0` evaluated to false), causing English to permanently take priority over Portuguese.
   - Now, PT-BR is guaranteed to be chosen first regardless of track order or `isNative` flags.
   - Implemented dynamic language upgrade in `fetchExternalSubtitles`: When subtitles arrive asynchronously from OpenSubtitles, if the user hasn't explicitly chosen (`!session.userToggledSubtitles`) and the current track has a lower priority (e.g. English), the player automatically upgrades to the newly arrived Portuguese track.

2. **Visual Consistency & Design System Alignment (`assets/css/10-player-v3.css` & `assets/js/player/engine.js`):**
   - **Dimensions & Backdrop:** Subtitle panel width matched strictly to Artplayer's `.art-settings` (`290px`, `rgba(20, 20, 22, 0.94)`, `backdrop-filter: blur(14px)`, `border-radius: 12px`, `box-shadow: 0 12px 35px rgba(0, 0, 0, 0.75)`).
   - **Item Rows:** Aligned height (`40px`), padding (`0 14px 0 10px`), font-size (`14px`), font-weight (`500`), hover background (`rgba(255, 255, 255, 0.1)`).
   - **Selected State:** Selected subtitle item text is now `#ffffff` (white, font-weight 600) with a clean right checkmark, eliminating the neon green text that clashed with `.art-settings`.
   - **Source Badges:** Normalized `.tvz-sub-badge` ("Fonte") to subtle dark glass styling (`rgba(255, 255, 255, 0.12)`, text `rgba(255, 255, 255, 0.78)`), eliminating bright green badge blocks.
   - **Header & Navigation:** Submenu back headers strictly mirror Artplayer's `.art-setting-item-back` (`height: 40px`, inset shadow line `box-shadow: inset 0 -1px 0 rgba(255, 255, 255, 0.12);`, back arrow on left, title on left). Removed foreign `[X]` button.
   - **Menu Row Architecture:** "Configurações de Legenda" (options/delay/size) and "Enviar arquivo (.srt / .vtt)" are now native `.tvz-sub-item` rows at the bottom of the list with standard icons and chevrons, eliminating disjointed green header buttons.
   - **Customizer Subview:** Aligned header to `.art-setting-item-back` pattern (`< Configurações de Legenda`). Delay value, size pills, and background contrast pills now use standard player UI styling (white text, subtle glass borders, white active state).

3. **Language Code & Flag Coverage:**
   - Full normalization in `normLang()` and friendly Portuguese naming in `LANG_NAMES`: `IND` -> `Indonésio` (Indonesian flag), `SRP` -> `Sérvio` (Serbian flag), `POL` -> `Polonês` (Polish flag), `ARA` -> `Árabe` (Arabic flag), `RON` -> `Romeno` (Romanian flag), `ZHT` -> `Chinês` (Chinese flag), `SPL` -> `Espanhol` (Spanish flag).

4. **Verification & Tests:**
   - `python tools/check_js.py` (0 missing imports).
   - `node -c assets/js/player/engine.js` (valid JS syntax).
   - `python tools/bump_version.py` (version stamped to `20261028_2336`).
   - `python tools/test_subtitles_api.py` (7/7 passed).
   - `python tools/test_sync_api.py` (48/48 passed).
   - `node tools/test_xss_protection.mjs` (24/24 passed).
   - `python tools/test_security_headers.py` (passed).
   - `python tools/test_resolve_cors.py` (passed).
   - Pushed directly to `staging`.
