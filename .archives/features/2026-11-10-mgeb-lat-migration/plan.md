# Feature Plan: MGEB Domain Migration to mgeb.lat and Player Server Prioritization

## Objective
Restore primary playback reliability across Tvzinha Online by migrating the MGEB upstream endpoints from `mgeb.top` to `mgeb.lat` (eliminating Cloudflare double 301 redirect loops that caused 25-second execution timeouts), and restoring `Mgeb Player (BETA)` (`native_direct`) as the #1 primary default server ahead of `Fenix Player (BETA)` (`native_fenix`), which is currently subject to upstream throttling/access blocks.

## Scope & Technical Changes
1. **MGEB Canonical Domain Migration (`functions/api/resolve.js`, `tools/local_server.py`):**
   - Query `mgeb.lat` directly for embed resolution (`https://mgeb.lat/embed/${id}` and `https://mgeb.lat/embed/serie/${id}/${season}/${episode}`) with fallback to `mgeb.top`.
   - Update normalization of relative paths to cover `mgeb.lat`, `mgeb.top`, `mgeb.site`, and `mgeb.space`.
   - Assign Referer `https://mgeb.lat/` for extracted media sources.
2. **Stream Proxy Upstream Mapping (`functions/api/stream.js`, `tools/local_server.py`):**
   - Recognize `mgeb.lat` alongside `peliculaplay.com`, `mgeb.top`, and `mgeb.space`, assigning `https://mgeb.lat/` as Referer.
3. **Server Prioritization (`assets/js/core/constants.js`, `assets/js/modules/series.js`):**
   - Place `native_direct` (Mgeb Player BETA) first in `MOVIE_SERVERS`.
   - Place `native_direct` ahead of `native_fenix` in `SERIES_SERVER_OPTIONS`.
   - Update fallback iframe URLs in `MOVIE_SERVERS` and `SERIES_SERVERS` to `https://mgeb.lat/embed/...`.
4. **Security & CSP Policies (`_headers`):**
   - Add `https://mgeb.lat` and `https://*.mgeb.lat` to `frame-src` directive in CSP.
