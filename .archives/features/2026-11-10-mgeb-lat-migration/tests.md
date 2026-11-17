# Test Suite & Verification: MGEB Domain Migration

## Automated Tests Executed
1. **ES Module Imports:**
   - `python tools/check_js.py` -> 0 missing imports.
2. **Version Stamping Integrity:**
   - `python tools/bump_version.py` -> Version `20261110_1027` stamped across 33 files.
   - `python tools/bump_version.py --check` -> Clean single version check.
3. **Security Headers & CSP Parity:**
   - `python tools/test_security_headers.py` -> 0 failures (CSP and SRI validated).
4. **CORS & Edge Endpoint Parity:**
   - `python tools/test_resolve_cors.py` -> 0 failures across Python and Node.js checks.
5. **Direct Resolution Validation:**
   - Direct extraction against `https://mgeb.lat/embed/550` (Fight Club) returning 6 sources (including Brazilian direct CDN MP4).
   - Direct extraction against `https://mgeb.lat/embed/serie/2316/1/1` (The Office S01E01) returning 3 playable sources.
