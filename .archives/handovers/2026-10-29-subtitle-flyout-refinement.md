# Handover: Subtitle Flyout Refinement, Language Grouping & Direct Access

**Date:** 2026-10-29  
**Branch:** `staging`  
**Deploy URL:** `https://staging.tvzinhaonline.pages.dev`  

---

## 1. What was done
1. **Restored Dedicated Subtitle Panel with Artplayer Aesthetic Parity (`assets/js/player/engine.js`, `assets/css/10-player-v3.css`):**
   - Re-architected `.tvz-subtitles-panel` to strictly match the exact dimensions, position, and styling of Artplayer's native settings panel (`.art-settings`):
     - Desktop & Mobile Portrait: contained on the right (`width: 290px; right: 12px; bottom: 65px; max-width: calc(100% - 24px);`).
     - Mobile Landscape: compact floating right box (`width: 300px; right: 12px; bottom: 8px; top: 8px;`).
     - Fixed previous mobile bug by completely removing `left: 8px !important; width: auto !important;` so the panel never expands across the full screen.
   - Restored header layout:
     - Left: Subtitle icon + "Legendas".
     - Right: Direct "Customizar" action button (in `#22c55e` green), matching the user-preferred layout.
   - Restored drilldown language grouping:
     - Languages with 1 version render as direct row with flag, Portuguese name, and native badge (`Original da Fonte`).
     - Languages with multiple versions render cleanly grouped (e.g., `Inglês 4 >`, `Polonês 2 >`), drilling down into `< [Idioma]` with all individual releases.
   - Maintained online search indicator (`🔘 Buscando legendas online...`) and footer upload trigger (`Enviar arquivo (.srt / .vtt)`).

2. **Reliable Dual-Entry Access (`[CC]` Control Button & Settings Row):**
   - Direct `[CC]` button in the player control bar now toggles `.tvz-subtitles-panel` instantly (eliminating fragile DOM scraping timers).
   - `[CC]` button displays clean active indicator (subtle green dot) whenever subtitles are turned on.
   - Clicking `Legendas` inside Artplayer's settings menu closes the settings flyout and opens this same subtitle panel.
   - Global keyboard shortcut `C` / `c` toggles the subtitle menu.

3. **Subtitle Customizer (Sync & Styling):**
   - Tapping "Customizar" in the header opens the full customizer view:
     - Sync offset (-0.5s, Zerar, +0.5s, range slider).
     - Font size pills (75%, 100%, 125%, 150%).
     - Font color swatches (white, yellow, cyan, green).
     - Contrast background (shadow vs box).

4. **Mojibake Repair & Expanded Language Normalization (`functions/api/subtitles.js`, `tools/local_server.py`, `assets/js/player/flags.js`):**
   - Added `fixMojibake` to repair double-encoded UTF-8 and ISO-8859-1 corruption (e.g. `legiÃµes` -> `legiões`, `contÃ©m` -> `contém`).
   - Expanded `LANG_MAP`, `normLang`, and vector SVG flags for Greek (`el`), Czech (`cs`), Hungarian (`hu`), Malay (`ms`), Thai (`th`), and Hindi (`hi`).

5. **Verification & Tests:**
   - `python tools/check_js.py` (0 missing imports).
   - `python tools/bump_version.py` (stamped `20261029_0112`).
   - `python tools/test_subtitles_api.py` (7/7 passed).
   - `node tools/test_xss_protection.mjs` (24/24 passed).
   - `python tools/test_security_headers.py` (passed).
   - `python tools/test_resolve_cors.py` (passed).
   - Merged and pushed to `staging` (`https://staging.tvzinhaonline.pages.dev`).
