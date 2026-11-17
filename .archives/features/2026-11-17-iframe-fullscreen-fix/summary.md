# Summary: Alternative Iframe Player Fullscreen Fix

- **Branch:** `feat/fix-iframe-fullscreen`
- **Target:** `staging`
- **Date:** 2026-11-17
- **Version Stamp:** `20261117_1140`

---

## 1. Executive Summary

Diagnosed and fixed the issue where the fullscreen button inside external iframe players (e.g. Servidor 2 SuperFlix) was unresponsive or failed to open fullscreen. The failure was caused by the browser's Permissions Policy restricting fullscreen permissions to the literal initial `src` URL (`allow="fullscreen"`), which immediately revoked fullscreen permissions when embeds redirected across domains (e.g., `superflixapi.bond` -> `superflixapi.boats`) or loaded inner video players inside nested child iframes.

---

## 2. Root Cause Analysis

1. **Restricted Feature Policy (`allow="fullscreen"`):**
   - In modern browsers, `allow="fullscreen"` implicitly evaluates to `allow="fullscreen 'src'"`.
   - If the player redirects cross-origin or embeds its playback engine inside a child iframe (which embed aggregators like SuperFlix, WarezCDN, and MyEmbed do), the nested context is barred from using the fullscreen API (`document.fullscreenEnabled = false`).
   - Clicking the player's internal fullscreen button threw an unhandled browser permissions exception or failed silently.

2. **Missing Vendor Attributes & IDL Flag:**
   - `allowfullscreen` was defined as an empty string without explicitly setting `allowfullscreen="true"`, `webkitallowfullscreen="true"`, `mozallowfullscreen="true"`, and `iframe.allowFullscreen = true`. Certain third-party player skins require `getAttribute('allowfullscreen') === 'true'` to render or bind their fullscreen button.

3. **Missing Top-Level Permissions-Policy Header:**
   - Neither `_headers` nor `tools/local_server.py` had `fullscreen=*` declared in `Permissions-Policy`, restricting cross-origin delegation in strict browser environments and WebViews.

---

## 3. Implementation Details

1. **Permissions Policy Wildcard Delegation:**
   - Updated `movies.js` (`getOrCreateMovieIframe`), `series.js` (`getOrCreateSeriesIframe`), `channels.js` (`#stream-iframe`), and `engine.js` (`mountTvContingencyIframe`) to:
     ```javascript
     iframe.allow = "autoplay *; encrypted-media *; picture-in-picture *; fullscreen *";
     iframe.allowFullscreen = true;
     iframe.setAttribute("allowfullscreen", "true");
     iframe.setAttribute("webkitallowfullscreen", "true");
     iframe.setAttribute("mozallowfullscreen", "true");
     ```
   - Updated `titlePage.js` (trailer modal) to follow the identical robust pattern.

2. **HTTP Headers Synchronization:**
   - Added `fullscreen=*` to `Permissions-Policy` in `_headers` and `tools/local_server.py`.

3. **Automated Verification:**
   - Ran `tools/check_js.py` (0 missing imports).
   - Ran `tools/bump_version.py` (version `20261117_1140`).
   - Ran `tools/test_security_headers.py` (0 failures).
   - Ran `tools/test_resolve_cors.py` (0 failures).
   - Ran `tools/test_xss_protection.mjs` (24 passed, 0 failed).
   - Validated real headless Chromium CDP execution proving `document.fullscreenEnabled = true` and `topFullscreenElement: IFRAME` on click.
