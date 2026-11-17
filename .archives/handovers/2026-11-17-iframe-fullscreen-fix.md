# Handover: Alternative Iframe Player Fullscreen Fix

- **Branch:** `staging` (merged from `feat/fix-iframe-fullscreen`)
- **Date:** 2026-11-17
- **Version:** `20261117_1140`
- **Objective:** Fix the unresponsive fullscreen button on alternative iframe players (e.g. Servidor 2 SuperFlix) across movies, series, channels, and trailers.

## Root Cause
- `<iframe>` elements were created with `allow="autoplay; encrypted-media; picture-in-picture; fullscreen"`. In standard Permissions Policy, `fullscreen` without an allowlist defaults to `'src'`.
- Whenever a provider underwent cross-origin redirect (e.g., `superflixapi.bond` -> `superflixapi.boats`) or loaded inner playback frames from secondary CDNs/hosts, the browser stripped fullscreen permissions (`document.fullscreenEnabled = false`), blocking `requestFullscreen()`.
- Legacy boolean `allowfullscreen` was defined as `""` rather than explicitly `"true"`, and the IDL property `iframe.allowFullscreen = true` was omitted.
- `_headers` and `tools/local_server.py` lacked `fullscreen=*` in their top-level `Permissions-Policy` header.

## Key Changes
1. **Permissions Policy Wildcard Delegation:**
   - In `assets/js/modules/movies.js`, `assets/js/modules/series.js`, `assets/js/modules/channels.js`, `assets/js/player/engine.js`, and `assets/js/modules/titlePage.js`, updated all iframe creation and mount routines to:
     ```javascript
     iframe.allow = "autoplay *; encrypted-media *; picture-in-picture *; fullscreen *";
     iframe.allowFullscreen = true;
     iframe.setAttribute("allowfullscreen", "true");
     iframe.setAttribute("webkitallowfullscreen", "true");
     iframe.setAttribute("mozallowfullscreen", "true");
     ```
2. **Top-Level Security Headers:**
   - Added `fullscreen=*` to `Permissions-Policy` in `_headers` and `tools/local_server.py`.
3. **Cache Version Bump:**
   - Stamped version `20261117_1140` via `python tools/bump_version.py`.

## Verification
- `python tools/check_js.py` (0 missing imports)
- `python tools/bump_version.py --check` (version 20261117_1140 verified)
- `python tools/test_security_headers.py` (0 failures)
- `python tools/test_resolve_cors.py` (0 failures)
- `node tools/test_xss_protection.mjs` (24 passed, 0 failed)
- Headless Chromium CDP tests verifying `document.fullscreenEnabled = true` and `topFullscreenElement: IFRAME` upon user click.

## Next Steps
- Verify on Staging: `https://staging.tvzinhaonline.pages.dev/`.
- User approval required before merging `staging` into `master`.
