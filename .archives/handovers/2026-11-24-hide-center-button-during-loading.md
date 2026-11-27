# Handover: 2026-11-24 - Hide Center Play/Pause Button During Loading & Buffering

## 1. Context & Motivation
Following the introduction of the central play/pause state button (`.art-state`) in the Artplayer container, an overlap glitch was reported:
When a stream or server is connecting/loading (and while buffering), the central pause icon (`STATE_PAUSE_SVG`, two vertical bars) was visible directly superimposed on top of the loading spinner. Once playback began, it disappeared normally.

## 2. Root Cause Analysis
1. During player mounting in `mountNativeSource()`, `art.play()` is initiated right away to trigger autoplay.
2. In Artplayer, calling `play()` before stream data arrives temporarily marks `art.video.paused` as `false`, prompting `updateCenterStateIcon(art)` to choose `STATE_PAUSE_SVG`.
3. Concurrently, `.art-video-player.art-control-show`, `.art-hover`, or `.art-is-paused` matched CSS rules at the root level and mobile portrait media query without gating on `:not(.art-loading-show)`.
4. Artplayer's own loading spinner (`.art-loading-show` / `.art-loading`) and `.art-state` both share absolute positioning centered at `top: 50%; left: 50%; transform: translate(-50%, -50%)`.
5. Because CSS lacked global loading state overrides for `.art-state`, and JS did not inspect video readyState or Artplayer loading events, the pause symbol displayed over the spinner until `video:playing` completed.

## 3. Changes Implemented
- **`assets/css/10-player-v3.css`**:
  - Gated `.art-state` display rules in both mobile portrait (line 3817) and global desktop/landscape (line 4351) with `:not(.art-loading-show):not(.is-buffering):not(.is-loading)`.
  - Added unconditional suppression rules:
    ```css
    .player-page-card.is-loading .art-state,
    .movie-modal-card.is-loading .art-state,
    .series-modal-card.is-loading .art-state,
    .art-video-player.art-loading-show .art-state,
    .art-video-player.is-buffering .art-state,
    .art-video-player.is-loading .art-state,
    .art-video-player:has(.art-loading:not([style*="display: none"])) .art-state,
    .movie-player-stage:has(.video-loader-overlay:not(.hidden)) .art-state,
    .series-theater-stage:has(.video-loader-overlay:not(.hidden)) .art-state,
    .art-video-player:not(.art-control-show):not(.art-hover) .art-state,
    .art-video-player.art-clean-pause .art-state {
        display: none !important;
        opacity: 0 !important;
        pointer-events: none !important;
        visibility: hidden !important;
    }
    ```
- **`assets/js/player/engine.js`**:
  - Refactored `updateCenterStateIcon(art)` to check comprehensive loading states: card `.is-loading`, `art.loading.show`, player `.art-loading-show`, `.is-buffering`, `.is-loading`, and `(art.video && art.video.readyState < 3 && !art.video.paused)`.
  - Clears inline override properties when loading concludes.
  - Added event listeners for `loading`, `video:waiting`, `video:canplay`, and `video:playing` to sync loading and play/pause state icons automatically.
- **Cache Busting**:
  - Executed `python tools/bump_version.py` -> version `20261124_1350`.

## 4. Verification & Deployment
- `python tools/check_js.py`: Passed (0 missing imports).
- `python tools/bump_version.py --check`: Passed (version `20261124_1350`).
- `python tools/test_security_headers.py`, `python tools/test_resolve_cors.py`, `node tools/test_xss_protection.mjs`: All passed (0 failures).
- Merged `--no-ff` into `staging` and pushed to `origin/staging`.
- Verified live deployment at `https://staging.tvzinhaonline.pages.dev` with version `20261124_1350`.
