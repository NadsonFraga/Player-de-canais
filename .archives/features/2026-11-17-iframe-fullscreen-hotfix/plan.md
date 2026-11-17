# Plan: Alternative Iframe Player Fullscreen Production Hotfix

- **Branch:** `hotfix/iframe-fullscreen`
- **Target:** `master`
- **Date:** 2026-11-17
- **Version:** `20261117_1156`
- **Objective:** Apply isolated hotfix to production (`master`) resolving broken fullscreen button on alternative iframe players (e.g. Servidor 2 SuperFlix), without incorporating in-progress staging features (Movy native provider, etc.).

## Scope of Changes
1. `assets/js/core/constants.js`:
   - Updated `superflix` URLs from `superflixapi.bond` to canonical `superflixapi.boats` (eliminating cross-origin 301/302 redirects).
2. `assets/js/modules/movies.js`:
   - Enforce `allow="autoplay *; encrypted-media *; picture-in-picture *; fullscreen *"`, `allowFullscreen = true`, and vendor attributes.
3. `assets/js/modules/series.js`:
   - Enforce identical wildcard permissions and fullscreen attributes on series iframe.
4. `assets/js/modules/channels.js` & `assets/js/player/engine.js`:
   - Enforce identical wildcard permissions and fullscreen attributes on live TV contingency iframe.
5. `assets/js/modules/titlePage.js`:
   - Standardize YouTube trailer iframe.
6. `_headers` & `tools/local_server.py`:
   - Add `fullscreen=*` to top-level `Permissions-Policy`.
7. Cache stamp bumped to `20261117_1156`.
