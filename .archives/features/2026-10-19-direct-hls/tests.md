# Tests: HLS straight from the host, proxy as fallback (D11)

**Date:** 2026-10-19 · **Branch:** `feat/direct-hls` · **Version:** `20261019_1624`
**Preview:** https://feat-direct-hls.tvzinhaonline.pages.dev

## Automated

| Suite | Result | Notes |
|---|---|---|
| `node --check`, `check_js.py`, `bump_version.py --check` | PASS | |
| `python tools/test_mgeb_rules.py` | all passed | Python and Node give the same answers |
| `python tools/test_stream_proxy.py --strict` | 26/26 | production and local |
| `python tools/test_resolve_cors.py` | 0 failures | |
| `node tools/player_ui_check.mjs` | 45/46 | first run 42/46 (catalog tab and DBZ S9E31 timing), rerun 45/46: only the old failure (B21) |
| `node tools/player_touch_check.mjs` | 16/17 or 17/17 | "double tap in the middle" flaky (also on master; Player Animes, not touched); noted in B21 |
| `node tools/player_libs_check.mjs` | 20/20 | |
| `node tools/slow_source_check.mjs` | 6/6 | |
| `node tools/direct_hls_check.mjs` (new) | Chrome 7/7, Firefox 7/7 | series plays with 0 proxy calls after the start (host requests 8 -> 14); with the host's playlist blocked, the same source falls back to the proxy ("Fonte 1 sem o proxy falhou (manifestLoadError). Tentando pelo proxy.") and plays in ~4 s; the Player Animes still goes through the proxy |

Function calls per hour of video (D11 script, 3 min each, local server):

| Title | Before | After |
|---|---|---|
| Movies (MP4) | 0 | 0 |
| Reacher T1E1 (MGEB HLS) | ~450 | **0** (25 requests straight to the host) |
| Dragon Ball Z T1E1 on the Player Principal (MGEB HLS) | ~340-800 | **0** (21 requests straight to the host) |
| Dragon Ball Z on the Player Animes | proxy | proxy (its host needs its Referer) |
| Live channel (Band) | 0 | 0 |

Also fixed: `tools/local_server.py` accepted only 5 pending connections (Python's default); browsers open more at once and Windows refused the rest, which made the app fail to load at random in the browser tests (6 fresh loads: 0/6 ready before, 6/6 in under 1.4 s after).

## Manual (user, on the preview)

| # | Steps | Expected | Result |
|---|---|---|---|
| 1 | Open a series episode (e.g. Reacher), let it play 1 min, skip ahead, next episode | plays, seeks and moves on as before | |
| 2 | Open an anime on the Player Principal, then on the Player Animes | both play | |
| 3 | Several movies (MP4 and HLS) | play as before | |
| 4 | DevTools > Rede, filter `api/stream`, while a series plays | after the start, no new `api/stream` lines; segments come from the host | |
| 5 | Phone (4G) and Firefox: items 1 and 2 | same | |
