# Plan: Alternative Iframe Player Fullscreen Fix

- **Feature Branch:** `feat/fix-iframe-fullscreen`
- **Target:** `staging`
- **Date:** 2026-11-17
- **Reporter / User Feedback:** User reported that the fullscreen button inside the alternative iframe player ("Servidor 2 (SuperFlix)") is unresponsive / not opening fullscreen ("esse botao nao ta funfano, nao consigo abrir em tela cheia :(").

---

## 1. Problem Diagnosis & Root Cause

1. **Permissions-Policy Delegation Scope (`allow` attribute on `<iframe>`):**
   - In `assets/js/modules/movies.js`, `assets/js/modules/series.js`, and `assets/js/modules/channels.js`, iframes were mounted with:
     ```javascript
     iframe.allow = "autoplay; encrypted-media; picture-in-picture; fullscreen";
     ```
   - In standard Permissions Policy, `fullscreen` without an explicit allowlist defaults to `'src'` (the initial origin).
   - Embedded players (e.g. SuperFlix, WarezCDN, EmbedPlay, MyEmbed, etc.) frequently:
     a) Undergo domain redirects (e.g., `superflixapi.bond` -> `superflixapi.boats`), or
     b) Embed third-party video engines within nested child iframes (`embed69.org`, `warezcdn.net`, CDNs).
   - Under `allow="fullscreen"`, cross-origin redirects and nested child frames fail the permissions policy check (`document.fullscreenEnabled = false`), silently blocking `requestFullscreen()` when the user clicks the fullscreen button inside the player.

2. **Attribute & IDL Property Standardization:**
   - The boolean `allowfullscreen` was previously set as an empty string (`iframe.setAttribute("allowfullscreen", "")`).
   - Several third-party player frameworks check `getAttribute('allowfullscreen') === 'true'` or test `iframe.allowFullscreen`.
   - Explicit `allowfullscreen="true"`, `webkitallowfullscreen="true"`, `mozallowfullscreen="true"`, and `iframe.allowFullscreen = true` ensure cross-browser compatibility across Chrome, Safari, Edge, Firefox, and WebViews.

3. **HTTP Response Header `Permissions-Policy`:**
   - Both `_headers` and `tools/local_server.py` lacked explicit declaration of `fullscreen=*` in their top-level `Permissions-Policy` response header.
   - Setting `fullscreen=*` ensures the top-level document has permission to delegate fullscreen to any child context in all browsing environments.

4. **Canonical Direct Domains in Catalog:**
   - In `assets/js/core/constants.js`, ensuring direct canonical URLs (`https://superflixapi.boats`, `https://embed.warezcdn.net`) avoids unnecessary redirects that could complicate origin matching.

---

## 2. Proposed Changes

1. **`assets/js/modules/movies.js` (`getOrCreateMovieIframe`):**
   - Set `iframe.allow = "autoplay *; encrypted-media *; picture-in-picture *; fullscreen *"`.
   - Set `iframe.allowFullscreen = true`.
   - Set `allowfullscreen="true"`, `webkitallowfullscreen="true"`, `mozallowfullscreen="true"`.
   - Update existing iframes idempotently if reused.

2. **`assets/js/modules/series.js` (`getOrCreateSeriesIframe`):**
   - Set `iframe.allow = "autoplay *; encrypted-media *; picture-in-picture *; fullscreen *"`.
   - Set `iframe.allowFullscreen = true`.
   - Set `allowfullscreen="true"`, `webkitallowfullscreen="true"`, `mozallowfullscreen="true"`.
   - Update existing iframes idempotently if reused.

3. **`assets/js/modules/channels.js` (DOM template for `#stream-iframe`):**
   - Update `allow` to `"autoplay *; encrypted-media *; picture-in-picture *; fullscreen *"`.
   - Set `allowfullscreen="true"`, `webkitallowfullscreen="true"`, `mozallowfullscreen="true"`.

4. **`assets/js/player/engine.js` (`mountTvContingencyIframe`):**
   - Enforce the full permission policy and fullscreen attributes on `#stream-iframe` during contingency mount.

5. **`assets/js/modules/titlePage.js` (Trailer modal):**
   - Standardize YouTube trailer iframe attributes with `allowfullscreen="true"` and wildcard permissions.

6. **`_headers` and `tools/local_server.py`:**
   - Add `fullscreen=*` to `Permissions-Policy`.

---

## 3. Verification Protocol

- `python tools/check_js.py` (Import integrity)
- `python tools/test_security_headers.py` (Headers and SRI integrity)
- `python tools/test_resolve_cors.py` (Edge resolver CORS)
- `node tools/test_xss_protection.mjs` (XSS sanitization)
- Real browser CDP verification of `document.fullscreenEnabled` inside redirected and nested iframes with user gesture simulation.
- `python tools/bump_version.py` (Stamp cache version)
- Merge to `staging` and push.
