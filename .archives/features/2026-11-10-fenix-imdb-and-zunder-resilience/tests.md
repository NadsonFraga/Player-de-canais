# Test Strategy: FenixFlix IMDb Resolution & Zunder Host Header Resilience

> **Date:** 2026-11-10  
> **Branch:** `feat/fenix-imdb-and-zunder-resilience`  

---

## Automated Verification Suite

1. **Import Integrity:** `python tools/check_js.py`
2. **Version Stamping:** `python tools/bump_version.py --check`
3. **Security Headers:** `python tools/test_security_headers.py`
4. **CORS Headers:** `python tools/test_resolve_cors.py`
5. **Real-Browser Chrome CDP Check:**
   - Open a catalog movie with only TMDB ID (`Clube da Luta`, TMDB 550, no `imdb_id` pre-set).
   - Verify `fetchTmdb` resolves `tt0137523`.
   - Verify `fenixhub.online` returns `zunderflix.lat` stream.
   - Verify signed `/api/stream` URL carries `referer=https://zunderflix.lat/` and `origin=https://zunderflix.lat`.
   - Verify proxy returns `HTTP 200` (master m3u8), `HTTP 200` (sub-playlist m3u8), and `HTTP 206` (video segments).
   - Verify HTML5 `<video>` triggers `loadedmetadata`, `canplay`, and `playing`.
