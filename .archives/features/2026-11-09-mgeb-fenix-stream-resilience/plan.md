# Feature Plan: FenixFlix Stream Proxy Resilience & Native Server Prioritization

> **Date:** 2026-11-09  
> **Branch:** `feat/mgeb-fenix-stream-resilience` (branched from `staging`)  
> **Target:** `staging`  
> **Status:** Implemented & Verified  

---

## 1. Problem Statement & Root Cause

### A. FenixFlix (Fenix Player BETA)
- **Problem:** Streams failed immediately with HTML5 `<video>` error `MEDIA_ELEMENT_ERROR: Format error` (Code 4).
- **Root Cause:**
  - `fenixflix.fenixhub.online/r/.../video.mp4` responds with an `HTTP 302 Redirect` to upstream storage CDN `http://dbonline.tech-cdn.top/...`.
  - The upstream CDN `dbonline.tech-cdn.top` uses an invalid/untrusted **Self-Signed SSL certificate** and/or plain HTTP.
  - Modern web browsers in an HTTPS context (`tvzinhaonline.pages.dev`) refuse self-signed certificates with `net::ERR_CERT_AUTHORITY_INVALID` or block plain HTTP as Mixed Content.
  - `assets/js/player/clientProviders.js`, `functions/api/resolve.js`, and `tools/local_server.py` previously whitelisted `fenixhub` as `isDirectMp4 = true`, bypassing the proxy (`/api/stream`).
- **Solution:**
  - Route Fenix streams through the signed proxy (`/api/stream`). The Cloudflare edge function and local server follow the 302 redirect server-side, validate the stream, and serve it over valid Cloudflare HTTPS with proper `HTTP 206 Range`, `Content-Type: video/mp4`, and open CORS headers.
  - Normalize options parameter in `clientProviders.js` to accept both `imdbId` and `imdb_id`.

### B. MGEB Infrastructure Research (Per User Directive)
- **User Instruction:** Do not alter MGEB code; instead conduct an in-depth infrastructure investigation to discover active domains and underlying services.
- **Findings:**
  - MGEB represents the "Mega Embed" / "MG Embed" network tied to PlayTV Oficial IPTV/VOD infrastructure.
  - Domain discovery revealed 5 active domains registered under Cloudflare: `mgeb.top`, `mgeb.lat`, `mgeb.space`, `mgeb.site`, `mgeb.org`.
  - All 5 domains share the same origin infrastructure. The origin web server is currently experiencing severe timeouts, throttling, and intermittent 524 timeouts.
  - Alternative Brazilian embed APIs investigated: `SuperFlixAPI` (`superflixapi.online` / `superflixapi.bond`), `MyEmbed` (`myembed.biz`), `EmbedMovies` (`embedmovies.org`), and `WarezCDN`.

### C. Native Player Prioritization
- **Problem:** `MOVIE_SERVERS` and `SERIES_SERVER_OPTIONS` previously placed `native_direct` (MGEB) as the default first option. When MGEB hangs, user playback breaks on first click.
- **Solution:**
  - Promoted `native_fenix` (Fenix Player) to position 1 for dubbed movies and series. Fenix resolves in <400ms and delivers 1080p web-optimized AAC streams.
  - Kept `native_direct` (MGEB) as position 2 (and its iframe as Servidor 1).

---

## 2. Impacted Files

1. `assets/js/player/clientProviders.js`:
   - Removed `fenixhub.online`, `fenixflix`, `fenixbot` from direct MP4 bypass (`isDirectMp4`), routing them via the signed proxy.
   - Accepted both `imdbId` and `imdb_id` in `resolveFenixFlixClient`.
2. `functions/api/resolve.js`:
   - Routed Fenix sources through `proxied()` instead of raw direct URLs.
3. `tools/local_server.py`:
   - Kept behavior strictly identical to `resolve.js` and `stream.js` by proxying Fenix streams.
4. `assets/js/core/constants.js`:
   - Ordered `MOVIE_SERVERS`: `native_fenix` first, `native_direct` second.
5. `assets/js/modules/series.js`:
   - Ordered `SERIES_SERVER_OPTIONS`: `native_fenix` ahead of `native_direct` (maintaining `native_anime` for subbed animes).
6. Cache-busting stamp updated to `20261109_1539` across 33 files via `tools/bump_version.py`.
