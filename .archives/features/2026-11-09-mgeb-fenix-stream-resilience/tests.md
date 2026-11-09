# Tests: FenixFlix Stream Proxy Resilience & Native Server Prioritization

> **Date:** 2026-11-09  
> **Branch:** `feat/mgeb-fenix-stream-resilience`  

---

## 1. Automated Test Suites

1. **Import Integrity:**
   - Command: `python tools/check_js.py`
   - Result: Passed (0 missing imports).
2. **Version Stamp Check:**
   - Command: `python tools/bump_version.py --check`
   - Result: Passed (`20261109_1539`).
3. **Security Headers Parity:**
   - Command: `python tools/test_security_headers.py`
   - Result: Passed (0 failures).
4. **Resolve CORS & Permissions:**
   - Command: `python tools/test_resolve_cors.py`
   - Result: Passed (0 failures).

---

## 2. Real Browser Playback Verification (Chrome Headless CDP)

- Script: `scratch/verify_fenix_playback.mjs`
- Test Target: `http://127.0.0.1:8787`
- Title Tested: *Clube da Luta* (TMDB ID 550) via FenixFlix.
- Outcome:
  - Resolution succeeded in 320ms.
  - Video stream proxied via `/api/stream?url=https%3A%2F%2Ffenixflix.fenixhub.online...`.
  - Upstream 302 redirect to `dbonline.tech-cdn.top` cleanly absorbed by the proxy.
  - Native HTML5 `<video>` events:
    - `loadedmetadata: 1920x800, dur=8346s`
    - `canplay`
    - `playing at t=0.000314`
  - Zero `ERR_CERT_AUTHORITY_INVALID` errors.
  - Zero `MEDIA_ELEMENT_ERROR: Format error` failures.
