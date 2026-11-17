# Handover: MGEB Domain Migration and Server Prioritization

**Date:** 2026-11-10
**Branch:** `feat/mgeb-lat-migration` -> merging to `staging`
**Version:** `20261110_1027`

### Summary of Completed Work
1. **MGEB Upstream Relocation:** Migrated upstream queries from `mgeb.top` to `mgeb.lat` (with fallback to `mgeb.top`) across `functions/api/resolve.js`, `functions/api/stream.js`, and `tools/local_server.py`.
2. **Server Priority Inversion:** Placed `Mgeb Player (BETA)` (`native_direct`) as Option #1 in `MOVIE_SERVERS` and `SERIES_SERVER_OPTIONS`. Fenix moved to Option #2.
3. **CSP Whitelist:** Added `https://mgeb.lat` and `https://*.mgeb.lat` to `_headers`.
4. **All Tests Green:** SRI, CSP, CORS, ES module imports, and version checks pass.
