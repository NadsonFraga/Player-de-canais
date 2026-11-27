# Handover: 2026-11-25 - Player Destruction Fix and Channels Auto-Contingency

## Context & Objectives
Investigation and resolution of two critical issues on Cloudflare Pages Staging (`https://staging.tvzinhaonline.pages.dev`):
1. **Direct Player Crash (Mgeb Player & Fenix Player):** Switching servers or playing movies caused all direct sources to cascade fail with "Nenhuma fonte do Mgeb/Fenix Player respondeu".
2. **Live TV Direct Channels:** Channels stalled with "Player Principal sem resposta" overlay requiring manual action when upstream tokens expired or were rejected.

## Root Cause Analysis
1. **`controlsHideTimer` Scope ReferenceError:**
   - In `assets/js/player/engine.js`, `let controlsHideTimer = null;` was declared inside `art.on('ready')`.
   - `syncPauseUi` was defined in the outer scope and called when destroying an Artplayer instance (`art.on('destroy')` / `art.pause()`).
   - Calling `syncPauseUi` during destruction threw an unhandled `ReferenceError: controlsHideTimer is not defined`.
   - The unhandled exception crashed Artplayer's teardown midway, leaving the existing instance stuck in `Artplayer.instances`.
   - Any subsequent instantiation immediately failed with `ArtPlayerError: Cannot mount multiple instances on the same dom element`, causing every subsequent source (Fonte 1, 2, ..., 8) to fail immediately.
2. **Channel Stream Tokens & Origin Restrictions:**
   - Live stream tokens from `extract_channel_stream.py` carry a short 5-minute TTL (`exp`).
   - The upstream CDN `bombrilhoso.lat` strictly forbids cross-origin requests from `staging.tvzinhaonline.pages.dev` with `HTTP 403 Forbidden` (`developer-by: ReiDosEmbeds.com`).
   - When all direct sources failed, the UI froze on a blocking error overlay instead of smoothly utilizing the functional contingency iframe servers (`meuplayeronlinehd.com`).

## Changes Implemented
1. **Scope and Teardown Hardening (`assets/js/player/engine.js`):**
   - Hoisted `let controlsHideTimer = null;` to the enclosing scope of `mountNativeSource`.
   - Replaced inner declarations with assignments and wrapped all calls in defensive checks `if (controlsHideTimer) clearTimeout(controlsHideTimer);`.
   - Hardened `atomicPlayerReset()` and `atomicTvPlayerReset()` to catch errors during `art.destroy()` and forcefully purge `window.Artplayer.instances`.
2. **Automatic Channel Contingency Fallback (`assets/js/modules/channels.js`):**
   - In `startDirectStream()`, if all direct sources fail and a contingency server is available, the player now automatically falls back to `fallbackContingency()` with a toast notification: `"Player Principal sem resposta. Alternando para servidor alternativo..."`.
   - The user is never left stuck on a blocking error card.
3. **Cache Busting & Version Stamp:**
   - Bumped asset version to `20261124_1806` via `tools/bump_version.py`.
   - Merged and deployed to branch `staging`.

## Verification Results
- `python tools/check_js.py`: 0 missing imports.
- `python tools/bump_version.py --check`: version `20261124_1806` synchronized across all 33 files.
- `python tools/test_security_headers.py`: 0 failures.
- `python tools/test_resolve_cors.py`: 0 failures.
- Live headless Chrome verification against `https://staging.tvzinhaonline.pages.dev`:
  - Switching to Fenix Player: 0 ReferenceErrors, 0 `Cannot mount multiple instances` errors.
  - Opening SporTV: 0 blocking error overlays.
