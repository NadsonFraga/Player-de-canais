# Handover: FenixFlix Optimization, Channel Stream Refresh & National Sources Evaluation

- **Date:** 2026-11-18
- **Branch:** `staging` (merged from `feat/fenix-optimization-and-redecanais` and `fix/channels-token-refresh-nov18`)
- **Version:** `20261118_1124`

---

## 1. Summary of Changes

### A. FenixFlix Parallel Resolution & Quality Preservation
- **Parallel Lookups:** Refactored `resolveFenixFlix` in `functions/api/providers.js` and `tools/local_providers.py` to query candidate IDs (`imdbId` and `tmdbId`) simultaneously using `Promise.allSettled` and `ThreadPoolExecutor`. Resolution latency decreased from 6-12s down to 0.3s - 2.5s.
- **Probe Quality Preservation:** Fixed issue in `probeSource` (`functions/api/resolve.js` and `tools/local_server.py`) where declared quality for MP4 video files was reset to null if the `moov` atom was at the end of the file.
- **Tier 4 Descriptors:** Streamlined `providerTier` tie-breaking for dedicated VOD masters (`fenixhub.online` / Zeus / Badger) to prioritize fast streams with native AAC audio.
- **Proxy Routing:** Added automatic Referer and Origin header routing in `/api/stream` for `fenixhub.online` and `fenixflix`.

### B. Channels Direct Stream Token Batch Refresh
- **Root Cause of Globo & Band Outages:** The upstream EmbedTV CDN periodically rotates dynamic token hashes in `/stream/<token>/error.txt`. The old tokens in `data/canais.json` expired and returned HTTP 404. Note: `/error.txt` is an obfuscated naming convention used by the CDN for standard HLS `.m3u8` playlists with `.ts` segments disguised as `.js`.
- **Global Batch Update:** Executed `tools/extract_channel_stream.py --all`, successfully updating all 52 channel slugs with live tokens returning HTTP 200 across `data/canais.json` and `assets/js/core/fallbackChannels.js`.

### C. Movy Removal
- Purged Movy resolvers and `mvm1` PRNG cipher from `functions/api/providers.js`, `functions/api/resolve.js`, `tools/local_providers.py`, and `tools/local_server.py` per direction to focus on native national providers.

### D. RedeCanais Evaluation
- Catalog text endpoints identified: `https://redecanais.by/final_mapafilmes.txt` (~19.6k movies) and `https://redecanais.by/final_mapa.txt` (~6.1k series).
- Embed endpoint `https://redecanais.by/embed.php?vid=<ID>` has no framing restrictions (`X-Frame-Options: None`), making it suitable as an external iframe server option.
- Direct stream scraping is protected by an obfuscated 1.34MB script with anti-debugging measures. Kept on hold per user decision.

---

## 2. Verification & Automated Test Status

- `python tools/check_js.py` -> 0 missing imports.
- `python tools/bump_version.py --check` -> versions in use: `['20261118_1124']`.
- `python tools/test_security_headers.py` -> 0 failures.
- `python tools/test_resolve_cors.py` -> 0 failures.
- `node tools/test_xss_protection.mjs` -> 24 passed, 0 failed.
- Live verification against `staging.tvzinhaonline.pages.dev`:
  - Deadpool & Wolverine (TMDB 533535): resolved 17 streams, 4K Dublado primary.
  - Stranger Things (TMDB 66732 S1E1): resolved 4 streams in 2.67s.
  - Globo & Band: live streams verified with HTTP 200.

---

## 3. Next Steps & Open Items

- Monitor upstream token longevity for live channels.
- Keep staging deployed and ready for user manual testing.
- Awaiting user greenlight before considering merging staging into master.
