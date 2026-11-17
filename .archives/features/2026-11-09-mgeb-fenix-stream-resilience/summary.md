# Feature Summary: FenixFlix Stream Proxy Resilience & Native Server Prioritization

> **Date:** 2026-11-09  
> **Branch:** `feat/mgeb-fenix-stream-resilience`  
> **Merged into:** `staging`  
> **Version Stamp:** `20261109_1539`  

---

## 1. Summary of Changes

- **FenixFlix Proxy Routing:**
  - Removed direct MP4 bypass for `fenixhub.online`, `fenixflix`, and `fenixbot` in `clientProviders.js`, `resolve.js`, and `local_server.py`.
  - Upstream 302 redirects to `dbonline.tech-cdn.top` (which serves a self-signed SSL certificate) are now safely followed by `/api/stream` edge proxy, delivering valid HTTPS, HTTP 206 Range, and open CORS to browser clients.
  - Normalized `imdbId` and `imdb_id` options resolution in `clientProviders.js`.
- **Native Player Prioritization:**
  - Placed `native_fenix` (Fenix Player BETA) as the default primary option in `MOVIE_SERVERS` and `SERIES_SERVER_OPTIONS` (ahead of MGEB), offering instantaneous sub-second playback and 1080p AAC streams.
- **MGEB Deep Research:**
  - Conducted comprehensive infrastructure mapping identifying 5 active domains (`mgeb.top`, `mgeb.lat`, `mgeb.space`, `mgeb.site`, `mgeb.org`) sharing the same origin web infrastructure currently subject to severe origin latency/timeouts.
- **Cache Busting & Testing:**
  - Stamped version `20261109_1539`.
  - All automated test suites green.
  - Verified in Chrome CDP headless browser.
