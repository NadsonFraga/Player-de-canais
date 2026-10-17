# Plan: Security Hardening (2026-10-14)

> Status: proposal, waiting for user approval.
> Scope: Backlog items D4, D5, D6, D7, D9, and preliminary groundwork for D3 and D11.
> Coordination: The other machine is executing F6 (Channels and Home redesign) and F1 (Live channels watchdog). This machine executes Security Hardening. Both scopes are strictly decoupled to prevent merge conflicts.

---

## 1. Context & Motivation

Security audit items D1, D2, D8, and T14 were already resolved and tested in production (path blocking middleware, stream proxy sanitization, generic 502 errors). The remaining hardening tasks address client-side injection risks, loose CORS permissions, exposure of local development servers, missing Content Security Policy (CSP), and lack of Subresource Integrity (SRI) on third-party CDNs.

---

## 2. Scope & Target Backlog Items

- **D9**: `tools/local_server.py` listens on `0.0.0.0` by default. Switch default binding to `127.0.0.1`, adding `--lan` / `--network` flag when local Wi-Fi / mobile testing is needed.
- **D5**: Restrict `/api/resolve` CORS from wildcard `*` to authorized origins (our Cloudflare Pages domains, localhost, and local network IPs). Keep `/api/stream` CORS as `*` to maintain full compatibility with TV casting receivers (Web Video Caster / Chromecast).
- **D7**: Add Subresource Integrity (`integrity="sha384-..." crossorigin="anonymous"`) for external CDN dependencies (`hls.js@1.5.8` and `artplayer@5.1.7`) in `index.html`.
- **D6**: Add comprehensive HTTP security headers in `_headers` and mirror in `tools/local_server.py`:
  - `Content-Security-Policy` (CSP) configured to permit required media streams, TMDB images, fonts, and inline styles required by Artplayer.
  - `X-Content-Type-Options: nosniff`.
  - `Referrer-Policy: strict-origin-when-cross-origin`.
  - `Permissions-Policy: camera=(), microphone=(), geolocation=()`.
  - `X-Frame-Options: SAMEORIGIN` / `frame-ancestors 'self'`.
- **D4**: Prevent XSS by eliminating raw interpolation in `innerHTML`. Create `assets/js/core/sanitize.js` (`escapeHtml`, `escapeAttr`) and sanitize dynamic API data (titles, overviews, genres, matches) across `movies.js`, `series.js`, `sports.js`, and `player/engine.js`.
- **D3 & D11**: Architectural specification and migration blueprint for TMDB proxy endpoint (`/api/tmdb`) and Cloudflare invocation quota tracking.

---

## 3. Phased Implementation Plan

### Phase 1: Local Server Binding & CORS Hardening (D9, D5, T18)
- **Local Server (`tools/local_server.py`)**:
  - Add CLI argument parsing: default host `127.0.0.1`, option `--lan` or `--host 0.0.0.0` to bind to all interfaces for mobile testing.
  - Print clear startup output indicating whether LAN access is active.
- **CORS Restriction on `/api/resolve`**:
  - In `functions/api/resolve.js` and `tools/local_server.py` (strict paridade):
    - Check incoming `Origin` header. Allow:
      - Requests without `Origin` (same-origin, browser direct navigation, curl).
      - `https://*.pages.dev` and any production domains.
      - `http://localhost:*` and `http://127.0.0.1:*`.
      - Local private IPs (`192.168.*`, `10.*`, `172.16-31.*`) when running locally.
    - If origin is unauthorized, return `403 Forbidden` with `{ "error": "CORS origin forbidden" }`.
    - `/api/stream` explicitly preserves `Access-Control-Allow-Origin: *` to avoid breaking TV cast receivers.
- **Verification**:
  - Run `python tools/test_stream_proxy.py --strict` to verify stream proxy parity.
  - Test `/api/resolve` with authorized origins (returns 200/404 with matched origin) and unauthorized origin `https://evil.com` (returns 403).

*Hard stop at Phase 1 completion.*

---

### Phase 2: Subresource Integrity (SRI) & HTTP Security Headers (D7, D6, T16)
- **Subresource Integrity (`index.html`)**:
  - Add SRI attributes to jsDelivr script tags:
    - `hls.js@1.5.8`: `sha384-xLhS5rbIdhv65H3GLX+caQgMSiEK/Hkw8Z6HITolgRxvXs0omcbeYD639tkJ2Wu6`
    - `artplayer@5.1.7`: `sha384-LjKKmyj09xPIr/srcAiLFrPjAMi28Sz1pQNHGLknpHAebKxQXQb/UtuCeMBPbl2P`
    - Include `crossorigin="anonymous"`.
- **Security Headers (`_headers` and `tools/local_server.py`)**:
  - Add global headers rule in `_headers`:
    ```http
    /*
      X-Content-Type-Options: nosniff
      Referrer-Policy: strict-origin-when-cross-origin
      Permissions-Policy: camera=(), microphone=(), geolocation=()
      X-Frame-Options: SAMEORIGIN
    ```
  - Define Content-Security-Policy (CSP):
    - `default-src 'self';`
    - `script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net;` (note: head guard uses inline script)
    - `style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;` (Artplayer dynamic styles)
    - `font-src 'self' https://fonts.gstatic.com;`
    - `img-src 'self' data: blob: https://image.tmdb.org;`
    - `media-src 'self' blob: http: https:;`
    - `connect-src 'self' https://api.themoviedb.org https://api.aniskip.com;`
    - `frame-src 'self' https://embedplayer2.xyz https://superflixapi.top https://mgeb.top;`
    - `frame-ancestors 'self';`
  - Update `tools/local_server.py` to serve matching security headers for local parity.
- **Verification**:
  - Test site loading in Chrome and Firefox with DevTools console monitored: zero CSP errors, zero SRI failure alerts.
  - Verify Artplayer playback, TMDB catalog images, and AniSkip API calls continue to work seamlessly.

*Hard stop at Phase 2 completion.*

---

### Phase 3: HTML Sanitization & XSS Prevention (D4, T15)
- **Core Sanitizer (`assets/js/core/sanitize.js`)**:
  - Implement fast, safe string escaping functions:
    - `escapeHtml(value)`: escapes `&`, `<`, `>`, `"`, `'`.
    - `escapeAttr(value)`: escapes attribute values.
- **Sanitize Dynamic Data Rendering**:
  - Audit and sanitize interpolated external strings in:
    - `assets/js/modules/movies.js` (modal titles, overviews, genres, cast names).
    - `assets/js/modules/series.js` (episode names, summaries, seasons, show titles).
    - `assets/js/modules/sports.js` (team names, match titles, tournament badges).
    - `assets/js/player/engine.js` (player header info and server labels).
- **Automated XSS Test Suite (`tools/test_xss_protection.mjs`)**:
  - Test suites injecting `<img src=x onerror=alert(1)>` and `<script>` strings through `escapeHtml()` and modal builders, asserting no executable HTML slips into DOM elements.
- **Cache Busting**:
  - Run `python tools/bump_version.py` to update the import cache stamp across modified modules.

*Hard stop at Phase 3 completion.*

---

### Phase 4: Credentials Isolation & Quota Roadmap (D3, D11)
- Blueprint and documentation for `/api/tmdb` Cloudflare Pages Function.
- Audit Cloudflare Worker subrequest counts per stream session.
- Update `.archives/backlog.md` with resolved items (D4, D5, D6, D7, D9) and testing evidence (T15, T16, T18).

---

## 4. Verification & Testing Matrix

| ID | Description | Tool / Method | Expected Result |
|---|---|---|---|
| T18 | Proxy & Resolver parity | `python tools/test_stream_proxy.py --strict` | 26/26 passed |
| T18b| Resolver CORS check | `curl` with allowed & rogue origins | Allowed origin reflected; rogue gets 403 |
| T16 | SRI & CSP validation | Chrome / Firefox headless & UI check | No CSP violations in console; scripts execute |
| T15 | XSS injection verification | `node tools/test_xss_protection.mjs` | 100% of injected payloads neutralized |
| T19 | Code syntax & cache integrity | `python tools/check_js.py` & `bump_version.py --check` | Clean syntax, unified cache stamp |
