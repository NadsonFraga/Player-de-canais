# Handover: Subtitle UI Back Button, Settings Row Interception, Dot Removal, and Fullscreen Positioning

**Date:** 2026-10-29  
**Branch:** `feat/subtitle-ui-back-and-positioning` -> `staging`  
**Deploy URL:** `https://staging.tvzinhaonline.pages.dev`

---

## 1. Summary of Changes

This release addresses 4 specific UX and layout issues reported by the user regarding subtitle presentation:

1. **Removed Green Active Indicator Dot under `[CC]` Button:**
   - Removed `.art-video-player .art-control-subtitle-btn.is-active::after` in `assets/css/10-player-v3.css`.
   - The subtitle button now adheres cleanly to the user's visual preference without the active dot.

2. **Fixed Subtitle Option inside Artplayer Settings (`.art-settings`):**
   - In `assets/js/player/engine.js`, `refreshSubtitleMenu(session)` now constructs the canonical `selector` array and passes it to `upsertSetting(art, { name: 'subtitle', selector, ... })`.
   - Artplayer previously treated the entry as a boolean checkbox/switch (replacing the icon with `<i class="art-icon-check">` and omitting the right chevron `>`) because `selector` was missing. With `selector` restored, it renders the standard CC icon (`NATIVE_ICONS.subtitle`), tooltip with active language, and right chevron `>`.
   - Added `installSettingSubtitleInterceptor(art, session)` on `art.template.$setting` (capture phase). When the user clicks "Legendas" inside Settings, it intercepts the click, sets `session.openedFromSettings = true`, closes the settings menu, and opens the dedicated subtitle panel.

3. **Added Back Button (`< Legendas`) and Explicit Close (`✕`):**
   - In the subtitle main view header: `< Legendas` on the left is now clickable. When opened from settings, clicking `< Legendas` closes the subtitle panel and re-opens the settings menu (`art.setting.show = true`). When opened from the `[CC]` control button, clicking `< Legendas` closes the panel.
   - Added an explicit `✕` close button in all views (main list, drilldown, customizer).
   - In language drilldown: `< [Language]` returns to the main subtitle list, with `✕` to close.
   - In customizer: `< Configurações de Legenda` returns to the main subtitle list, with `✕` to close.

4. **Fixed Fullscreen and Mobile Landscape Overlap:**
   - In `assets/css/10-player-v3.css`, removed `bottom: 8px !important; top: 8px !important;` from the `@media (max-height: 520px) and (orientation: landscape)` media query.
   - Positioned the subtitle panel strictly above the player control bar in fullscreen and landscape (`bottom: 55px` to `75px`, `top: auto`, `max-height: calc(100% - 68px)`).
   - Adjusted `.tvz-subtitles-backdrop` to `bottom: 55px` and `z-index: 140`, ensuring the bottom control bar (`z-index: 150`) is always unobstructed, allowing the user to click the `[CC]` button or any controls to toggle the panel directly.

---

## 2. Verification Matrix

- `python tools/check_js.py`: Passed (0 missing imports).
- `node tools/test_xss_protection.mjs`: Passed (24 tests OK).
- `python tools/test_subtitles_api.py`: Passed (7 tests OK).
- `python tools/test_resolve_cors.py`: Passed (0 failures).
- `python tools/test_security_headers.py`: Passed (0 failures).
- `python tools/bump_version.py --check`: Passed (`20261029_0156`).
- Merged to `staging` via `--no-ff` and pushed to `origin/staging`.
