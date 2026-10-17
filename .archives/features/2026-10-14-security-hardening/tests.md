# Manual & Automated Tests - Security Hardening (D4, D5, D6, D7, D9)

## Automated Verification Suites

| Suite | Script | Coverage | Result |
| :--- | :--- | :--- | :--- |
| **Path Traversal & Secret Protection (D1)** | `tools/test_path_block.mjs` | 39 attack vectors & canonical paths | 39/39 PASSED |
| **CORS Origins & Localhost Binding (D9, D5)** | `tools/test_resolve_cors.py` | 53 unit, matrix & dispatch checks | 53/53 PASSED |
| **SRI & Security Headers (D7, D6)** | `tools/test_security_headers.py` | 24 header, directive & SRI checks | 24/24 PASSED |
| **Browser Real Runtime SRI Check** | `tools/test_browser_sri.mjs` | Headless Chromium script load | PASSED (0 violations) |
| **XSS & HTML Sanitization Suite (D4 / T15)** | `tools/test_xss_protection.mjs` | 20 injection vectors + Chromium DOM check | 24/24 PASSED |
| **Stream Proxy Strict Suite (D2, D8 / T14)** | `tools/test_stream_proxy.py --strict` | 26 parity & security test cases | 26/26 PASSED |
| **Import Integrity & Cache Busting** | `tools/check_js.py` & `bump_version.py --check` | Version stamping consistency | 0 errors |

---

## Manual Verification Matrix (Preview Deployment Checklist)

| Test ID | Area | Scenario | Expected Behavior | Status |
| :--- | :--- | :--- | :--- | :--- |
| **M1** | Filmes | Open any movie card in catalog | Title, year, rating, backdrop render cleanly without visual glitches | Ready for manual test |
| **M2** | Séries | Open "Continuar Assistindo" and catalog items | Cards, episode thumbnails and season lists render cleanly | Ready for manual test |
| **M3** | Animes | Open continuous episode drawer | Episodes list renders with episode names correctly | Ready for manual test |
| **M4** | Futebol | Open match schedule and switch favorite team | Team crests, badges and match cards render with formatted text | Ready for manual test |
| **M5** | Network / Console | Open DevTools console on live preview | 0 CSP violation errors, 0 SRI integrity errors, Hls and Artplayer functional | Verified in Chromium |
| **M6** | Dev Server | Run `python tools/local_server.py` | Binds to 127.0.0.1; `--lan` exposes Wi-Fi IP for phone testing | Verified |
