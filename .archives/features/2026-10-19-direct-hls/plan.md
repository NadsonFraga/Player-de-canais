# Plan: HLS straight from the host, proxy as fallback (D11)

> Approved by the user on 2026-10-19 ("pode prosseguir com esse ajuste, eliminando código morto"). Branch `feat/direct-hls`.

## Problem (D11 measurement, 2026-10-19)

Cloudflare's free plan allows 100k function calls a day. Movies in MP4 and live channels cost nothing (the browser fetches the host directly), but every HLS segment goes through `/api/stream`: ~450 calls per hour of a series (Reacher, MGEB) and ~340-800 per hour of an anime (DBZ). Capacity today: ~125-220 hours of HLS a day for everyone together.

The MGEB HLS host works without the proxy: its playlist and segments answer without a Referer and with `Access-Control-Allow-Origin: *` (playlist on mgeb.space, segments on stream-limit-vid.321moviesfree.com, 206 with our Origin). The anime host does not (segments 403 without zokoanime's Referer), so anime stays on the proxy.

## Change

- `functions/api/resolve.js` and `tools/local_server.py` (same logic): every MGEB HLS source on `https` also gets `direct_url` (the host address). `stream_url` stays the proxy address. The anime route gets none.
- `engine.js`:
  - `normalizeNativeSources` keeps `directUrl`.
  - `mountNativeSource` plays `directUrl` when there is one and the source is not marked `useProxy`.
  - `failoverNativeSource`: when the address that failed was the direct one (error, start budget, stuck, or a fatal segment error during playback), the same source is mounted again through the proxy at the same time, before any other source. Only then the source counts as failed.
  - hls.js fatal network errors on a direct address switch to the proxy (today a fatal segment error retries the same address forever).
  - Cast ("Transmitir") keeps the proxy address (it adds the Referer for hosts that need it).
- Dead code: the legacy `fallbackSources` parameter of `mountNativePlayer` (no caller; `streamUrl` stays, the tests use it).

## Verification

- `node --check`, `check_js.py`, `bump_version.py --check`; Python/JS parity of the new field.
- Browser (new `tools/direct_hls_check.mjs`): a series episode plays with segments from the host and zero `/api/stream` calls after the start; a direct address that fails (blocked by the test) falls back to the proxy of the same source and plays; an anime still uses the proxy.
- Function calls per hour, before/after, with the D11 script: Reacher ~450/h -> ~0.
- Regression: `player_ui_check.mjs`, `player_touch_check.mjs`, `slow_source_check.mjs`, `player_libs_check.mjs`; several titles (movies, series, anime) in Chrome and Firefox.
