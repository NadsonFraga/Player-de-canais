# Handover: Alternative Iframe Player Fullscreen Hotfix (Production)

- **Branch:** `master` (merged from `hotfix/iframe-fullscreen`)
- **Date:** 2026-11-17
- **Version:** `20261117_1156`
- **Objective:** Fix unresponsive fullscreen button on alternative iframe player in production (`tvzinhaonline.pages.dev`) while keeping `staging` independent for ongoing larger features.

## Root Cause & Solution
- In Permissions Policy, `allow="fullscreen"` defaults to origin of initial `src`. Cross-origin redirects (`superflixapi.bond` -> `superflixapi.boats`) and nested players in child iframes had `document.fullscreenEnabled = false`.
- Updated all iframes to `allow="autoplay *; encrypted-media *; picture-in-picture *; fullscreen *"`, `allowfullscreen="true"`, `webkitallowfullscreen="true"`, `mozallowfullscreen="true"`, and `iframe.allowFullscreen = true`.
- Updated `superflix` URLs in `constants.js` to canonical `https://superflixapi.boats`.
- Added `fullscreen=*` to `Permissions-Policy` in `_headers` and `tools/local_server.py`.
- Bumped cache version to `20261117_1156`.
