# Handover: Live Channels Direct Player Repair and Stream Security Overhaul

> **Date:** 2026-11-27
> **Branch:** `staging`
> **Version Stamp:** `20261127_1500`
> **Deployment:** `https://staging.tvzinhaonline.pages.dev`

---

## 1. Context & Diagnosed Root Causes

The user reported that on Staging (`https://staging.tvzinhaonline.pages.dev`), all live TV channels failed to load on the direct player (including SporTV, F1 TV, open TV, and movies).

An exhaustive investigation uncovered two critical root causes:

1. **Frontend Direct Player Insecure URL Handling (`assets/js/player/engine.js`):**
   - In `mountTvDirectStream`, raw source URLs were passed directly into Artplayer / Hls.js (`new window.Artplayer({ url: currentSource.url })`).
   - On HTTPS (`https://staging.tvzinhaonline.pages.dev`), modern browsers block insecure HTTP requests (`http://...`) immediately as **Mixed Content**, terminating the stream before network transport.
   - External HTTPS URLs without CORS headers were rejected by the browser's Cross-Origin Resource Sharing policy.
   - The auto-heal logic in `engine.js` was gated behind restrictive string matching (`bombrilhoso.lat`, `__index.txt`, `penterosa.lat`). When sources contained other hosts, dynamic token resolution was bypassed.

2. **Catalog Slug & Source Desynchronization (`data/canais.json` & `fallbackChannels.js`):**
   - Channels had outdated or mismatched slugs (`band` instead of `bandsp`, `f1tv` instead of `bandsports`, `premiereclubes` instead of `premiere`, `premiere2` instead of `premiere-2`).
   - Upstream live IPTV panels (`rfc-infinite.top`, `apontaaimeupatrao.lat`, `governosptx.org`) reject foreign web referrers (`https://tvzinhaonline.pages.dev/`) with HTTP 403 Forbidden.

---

## 2. Implemented Architecture & Solutions

### A. Async & Secure Direct Player Engine (`assets/js/player/engine.js`)
- Refactored `mountTvDirectStream` to be fully asynchronous.
- Added a mount concurrency guard (`window.tvMountCounter`) to discard superseded requests during rapid channel switching.
- **Dynamic Live Token Resolution:** Automatically calls `/api/resolve?type=channel&id=<slug>` to acquire clean, authenticated 1080p HLS stream URLs with active tokens.
- **HTTPS & CORS Proxy Signing:** Any raw external HTTP/HTTPS stream URL is signed through `signStreamUrl(url)`, routing it through Cloudflare Pages Function `/api/stream` with full HTTPS, open CORS (`*`), and internal segment rewriting.
- Stream watchdog and fatal error handling cascade smoothly across available direct sources without falling back to iframes automatically.

### B. Referer & Origin Sanitization for Live IPTV (`functions/api/stream.js` & `tools/local_server.py`)
- Added selective referrer stripping for IPTV upstream servers (`rfc-infinite.top`, `apontaaimeupatrao.lat`, `governosptx.org`, `logicahost.com.br`, etc.), preventing 403 Forbidden rejections from upstream panels.
- Maintained exact behavioral parity between Cloudflare Pages Functions and `tools/local_server.py`.

### C. Channel Catalog & Fallbacks Optimization (`data/canais.json` & `fallbackChannels.js`)
- Corrected slugs for `Band` (`bandsp`), `F1 TV` (`bandsports`), `Premiere` (`premiere`), and `Premiere 2` through `Premiere 8` (`premiere-2` .. `premiere-8`).
- Integrated official Pluto TV 24h HLS master feeds for `South Park 24h`, `Naruto 24h`, `MasterChef Brasil 24h`, `Star Trek 24h`, `Os Trapalhões 24h`, `Pluto TV Anime 24h`, `Turma da Mônica 24h`, and `Bob Esponja 24h`.
- Synchronized `assets/js/core/fallbackChannels.js` 1:1.

---

## 3. Automated & Live Verification

- **Import Integrity:** `python tools/check_js.py` (0 missing imports).
- **Version Integrity:** `python tools/bump_version.py --check` (synchronized at `20261127_1500`).
- **Security Headers & SRI:** `python tools/test_security_headers.py` (0 failures).
- **CORS & Origin Validation:** `python tools/test_resolve_cors.py` (0 failures).
- **XSS Protection:** `node tools/test_xss_protection.mjs` (24/24 passed).
- **Stream Proxy Parity:** `python tools/test_stream_proxy.py` (29/29 positive/negative cases passed on both prod and local).
- **End-to-End Live Staging Playback Checks:** Verified against `https://staging.tvzinhaonline.pages.dev`:
  - `SporTV`: HTTP 200, valid HLS manifest
  - `F1 TV`: HTTP 200, valid HLS manifest
  - `Band`: HTTP 200, valid HLS manifest
  - `Globo`: HTTP 200, valid HLS manifest
  - `SBT`: HTTP 200, valid HLS manifest
  - `Premiere`: HTTP 200, valid HLS manifest
  - `Premiere 2`: HTTP 200, valid HLS manifest
  - `ESPN`: HTTP 200, valid HLS manifest
  - `Telecine Premium`: HTTP 200, valid HLS manifest
  - `South Park 24h`: HTTP 200, valid HLS manifest
  - `Naruto 24h`: HTTP 200, valid HLS manifest
