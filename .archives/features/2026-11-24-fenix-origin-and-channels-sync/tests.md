# Test Verification: FenixFlix Origin Header and Dynamic Live Channels Sync

## 1. Import Integrity Test
- Command: `python tools/check_js.py`
- Expectation: Zero missing imports, zero broken relative paths across all ES modules.

## 2. Version Stamp Check
- Command: `python tools/bump_version.py --check`
- Expectation: All ES module imports and HTML assets share a single synchronized timestamp.

## 3. Security & Header Tests
- `python tools/test_security_headers.py`: Security headers conform to CSP/CORS standards.
- `python tools/test_resolve_cors.py`: Ensure `/api/resolve` endpoints return compliant CORS headers.
- `node tools/test_xss_protection.mjs`: Verify DOM rendering sanitization.

## 4. Upstream FenixFlix 1080p Stream Resolution
- Verify `/api/resolve?id=550&type=movie&source=fenixflix` returns `primary_source` with 1080p FHD.
- Verify byte-range stream proxy returns HTTP 206 Partial Content without 403 `Origem bloqueada`.

## 5. Live TV Channel Resolution & Auto-Heal
- Verify `rdembed.online` -> `penterosa.lat` dynamic live stream extraction.
- Verify `/api/resolve?type=channel&id=globosp` returns 200 with dynamic `m3u8` stream.
- Verify player auto-heals expired tokens in `mountTvDirectStream`.
- Verify GitHub Actions workflow syntax for `.github/workflows/refresh_channels.yml`.
