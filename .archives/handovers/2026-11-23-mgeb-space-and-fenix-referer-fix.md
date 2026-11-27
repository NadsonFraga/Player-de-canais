# Handover: 2026-11-23 - MGEB Migration to mgeb.space & Fenix Proxy Referer Fix

## 1. Context & Problem Summary
- **Reported Issue:** "Diferente do localhost, na staging não está encontrando os servidores diretos. nem mgeb nem o outro"
- **Root Cause 1 (MGEB):** Domain `mgeb.lat` had its DNS record removed/expired (`DNS_ERROR_RCODE_NAME_ERROR`). MGEB migrated upstream to `mgeb.space`. `mgeb.lat` queries were failing with address resolution errors or timeouts.
- **Root Cause 2 (FenixFlix):** Client-side extraction in `clientProviders.js` was passing `Referer: https://embedplayer2.xyz/` to `/api/resolve?action=sign_batch` for all streams. Upstream CDN hosts (notably `hubfenixflix.duckdns.org` and mirrors) return HTTP 403 Forbidden when requested with `embedplayer2.xyz` or `fenixhub.online` referers, but succeed (HTTP 206) with `https://tvzinhaonline.pages.dev/` or empty referer.

---

## 2. Changes Made
1. **MGEB Upstream Host Migration:**
   - `functions/api/resolve.js`: Updated `resolveMgeb()` to prioritize `mgeb.space` with fallback to `mgeb.lat`. Updated referer handling to `https://mgeb.space/`.
   - `functions/api/stream.js`: Set `customReferer = "https://mgeb.space/"` when URL contains `mgeb.space` or `mgeb.lat`.
   - `tools/local_server.py`: Mirrored `functions/api/resolve.js` and `stream.js` behavior for `mgeb.space` lookup and referer handling.
   - `assets/js/core/constants.js`: Updated external embed URLs to `https://mgeb.space/embed/...`.
   - `_headers`: Added `https://mgeb.space https://*.mgeb.space` to `frame-src`.

2. **FenixFlix DuckDNS & Mirror Referer Routing:**
   - `assets/js/player/clientProviders.js`: Updated `getStreamHeaders()` to return `referer: 'https://tvzinhaonline.pages.dev/'` and empty `origin` for `duckdns.org`, `megafonte`, and `koyeb` endpoints.
   - `functions/api/stream.js`: Added explicit routing for `duckdns.org`, `megafonte`, and `koyeb.app` before the `fenixflix` check to forward `Referer: https://tvzinhaonline.pages.dev/` without an incompatible custom Origin header.
   - `tools/local_server.py`: Mirrored stream referer logic for local development.

3. **Versioning:**
   - Stamped version `20261123_1850` across all modules and HTML assets via `tools/bump_version.py`.

---

## 3. Verification & Deployment
- Automated test matrix passed:
  - `python tools/check_js.py`: 0 missing imports.
  - `python tools/bump_version.py --check`: single synchronized version `20261123_1850`.
  - `python tools/test_security_headers.py`: 0 failures.
  - `python tools/test_resolve_cors.py`: 0 failures.
  - `node tools/test_xss_protection.mjs`: 24/24 passed.
  - `python tools/test_mgeb_rules.py`: all checks passed with 100% Python/Node parity.
- Branch `fix/direct-servers-mgeb-fenix` merged with `--no-ff` into `staging`.
- Pushed to `origin/staging` (`e99fdb1`). Live deployment verified on `https://staging.tvzinhaonline.pages.dev` (HTTP 200, version stamp `20261123_1850`).
- Direct resolution on live staging confirmed:
  - Breaking Bad S1E1: HTTP 200 (MGEB resolved to `mgeb.space`, HLS adaptive 480p).
  - Deadpool & Wolverine: HTTP 200 (MGEB resolved to `mgeb.space`, HLS adaptive 720p).
