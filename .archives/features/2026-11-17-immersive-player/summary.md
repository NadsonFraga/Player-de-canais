# Feature Summary: Immersive Player - Settings Menu & Cleanup

## 1. Overview
In accordance with user feedback and the Atlantic reference standard:
1. **Server Switcher Consolidation:**
   - Removed the duplicate server switcher from inside the player control bar. The server selector is exclusively and cleanly positioned in the top bar (`.btn-player-servers`), functioning across both native player sessions and external iframes.
2. **Player Loader Cleanup:**
   - Removed the redundant quick-server chips during player startup (`#movie-loader-servers` and `#series-loader-servers`), leaving a clean, minimalist loader with spinner and label.
3. **Atlantic-Inspired Settings Flyout (`.tvz-settings-panel`):**
   - Replaced Artplayer's generic vertical settings list with a custom frosted glass popup.
   - **Top 2x2 Grid:** Quick-action tiles for `HQ QUALIDADE`, `ÁUDIO`, `LEGENDAS`, and `VELOCIDADE`, displaying the currently active values.
   - **Bottom List:**
     - `Ativar Legendas`: Smooth iOS-style toggle slider.
     - `Configurações de Legenda`: Drilldown to subtitle font size, text color, and background contrast.
     - `Ajuste de Tela`: Drilldown to `Ajustar (Original)` and `Preencher tela`.
     - `Transmissão (Cast)`: Intent trigger for Web Video Caster on supported mobile devices.
   - **Drilldown Subviews:** Clear `< Voltar` navigation headers and checkmarks (`✓`) on selected options with immediate reactive updates.
4. **Artplayer Bug Fixes:**
   - Hidden `.art-notice` with `display: none !important;` to eliminate the top-left "Reproduzir" overlay text over the `< Voltar` button.
   - Neutralized `.art-settings` to ensure the old Artplayer menu never clashes with the new TVZ settings panel.
   - Fixed desktop mask click behavior so clicking the screen while paused reliably unpauses and plays immediately, instead of eating clicks just to dismiss UI.
   - Obra card is tied to `.is-paused.is-ui-visible`, ensuring it remains hidden during playback and can be dismissed to view a clean paused frame.

## 2. Automated Tests Passing
- `python tools/check_js.py` (0 missing imports)
- `python tools/bump_version.py --check` (Synchronized version stamp)
- `python tools/test_security_headers.py` (0 failures)
- `python tools/test_resolve_cors.py` (0 failures)
- `node tools/test_xss_protection.mjs` (24/24 passing)
