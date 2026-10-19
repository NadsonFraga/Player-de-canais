# Summary: HLS straight from the host, proxy as fallback (D11)

**Branch:** `feat/direct-hls` · **Date:** 2026-10-19 · **Version:** `20261019_1657`
**Preview:** https://feat-direct-hls.tvzinhaonline.pages.dev
**Status:** approved by the user after manual tests on the preview.

## Problem

Cloudflare's free plan allows 100k function calls a day, and every HLS segment went through `/api/stream`: ~450 calls per hour of a series and up to ~800 of an anime (movies in MP4 and live channels cost nothing). Capacity: ~125-220 hours of HLS a day for everyone together. The MGEB host serves its playlists and segments without a Referer and with CORS, so the proxy was not needed for it.

## Change

- `resolve.js` / `local_server.py`: MGEB HLS sources on `https` also carry `direct_url`; `stream_url` stays the proxy address. The anime host (Player Animes) needs its Referer and keeps the proxy only.
- `engine.js`: the Player Principal plays `direct_url` first. A network error on the host's own address (CORS, a 403, a separate audio track) moves the same source to the proxy at once, at the same time, and the host is remembered for the visit. Only then the source counts as failed. Dead code removed: the unused `fallbackSources` parameter.
- Fixed on the way (all already in production):
  - Reacher's first source on Cloudflare (97bf1, 1080p) has an audio track that loads neither way. The B20 slow-start wait kept it up to 90 s because its video segments kept arriving, and a fatal `audioTrackLoadError` was retried forever while the video alone reported "can play": production did not start Reacher in 2 of 3 opens. Two segments with nothing buffered now mean broken (not slow), and an audio track error fails over.
  - `tools/local_server.py` accepted 5 pending connections (Python's default); Windows refused a browser's parallel connections and the app failed to load at random in the tests. Now 128.

## Results

| | Before | After |
|---|---|---|
| Function calls per hour, series and anime on the Player Principal | ~450-800 | **0** |
| Player Animes | proxy | proxy (its host needs its Referer) |
| Reacher T1E1, time to play (Chrome, deployed) | did not start in 2 of 3 | 17-21 s, 4 of 4 |
| Breaking Bad T1E1 | 12-15 s through the proxy | 13-14 s, 0 proxy calls |

New `tools/direct_hls_check.mjs`: Chrome 7/7, Firefox 7/7, also on the preview. Regression: `slow_source_check` 6/6, `player_libs_check` 20/20, `player_ui_check` 45/46 (B21), `player_touch_check` 16/17 (flaky item, B21). Manual: done; one "no audio" report on "Homem-Aranha: Um Novo Dia" went away after clearing the browser cache (audio measured on both environments here).

## Left open

- The probe on the server does not check a separate audio track: a source like Reacher's 97bf1 still costs ~8 s (direct, then proxy) before the next source. Checking the audio rendition while probing would rank it lower.
- B21: two flaky or outdated items in the browser suites.
