# Test Matrix: Alternative Iframe Player Fullscreen Fix

- **Branch:** `feat/fix-iframe-fullscreen`
- **Target:** `staging`
- **Date:** 2026-11-17

---

## Automated Test Cases

1. **Permissions Policy Delegation Test:**
   - Verify that an iframe configured with `allow="autoplay *; encrypted-media *; picture-in-picture *; fullscreen *"` has `document.fullscreenEnabled === true` inside nested and redirected origins.
   - Verify that user click triggers `requestFullscreen()` successfully and browser enters fullscreen mode.

2. **Security Headers Test (`python tools/test_security_headers.py`):**
   - Verify `_headers` and `local_server.py` parity with `fullscreen=*` added to `Permissions-Policy`.
   - Verify CSP and SRI checksums intact.

3. **JS Modules & Syntax Integrity:**
   - `python tools/check_js.py` (0 missing imports)
   - `python tools/bump_version.py --check`

4. **XSS Protection (`node tools/test_xss_protection.mjs`):**
   - All tests pass (24/24).

---

## Manual Test Verification Checklist (for Staging)

1. Open TVzinha on Staging: `https://staging.tvzinhaonline.pages.dev/`.
2. Navigate to any Movie (e.g., Fight Club or any recent movie).
3. Click to Play and select "Servidor 2 (SuperFlix)".
4. Once the player loads, locate the Fullscreen button (`[  ]`) on the bottom-right of the player controls.
5. Tap / click the Fullscreen button:
   - **Expected:** The player immediately expands to full screen (100% viewport width and height).
6. Press Esc or tap the exit fullscreen button:
   - **Expected:** Returns gracefully to the stage view.
7. Repeat test on Series (e.g., Game of Thrones S01E01) with "Servidor 2 (SuperFlix)" and "Servidor 3 (MyEmbed)".
8. Confirm on Mobile device / browser:
   - Tapping fullscreen rotates/expands player to full screen without error.
