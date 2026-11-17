# Summary: MGEB Domain Migration and Server Prioritization

## Overview
- Identified that `mgeb.top` was issuing double 301 redirects (`mgeb.top` -> `mgeb.site` -> `mgeb.lat`). When queried through Cloudflare Pages Functions, this added round-trip latency that collided with cold scraper execution and caused 25s timeout failures.
- Directly migrated MGEB endpoints to `https://mgeb.lat` with fallback to `mgeb.top`.
- Reprioritized `Mgeb Player (BETA)` (`native_direct`) to 1st place in both `MOVIE_SERVERS` and `SERIES_SERVER_OPTIONS`, demoting `Fenix Player (BETA)` to 2nd position due to upstream throttling/access blocks on `fenixhub.online`.
- Maintained exact parity between edge functions (`functions/api/resolve.js`, `functions/api/stream.js`) and dev server (`tools/local_server.py`).
- Updated CSP `frame-src` in `_headers` to allow `mgeb.lat`.
