# Summary: player libraries on demand (B11) and slow source start

**Branch:** `feat/player-libs-on-demand` · **Dates:** 2026-10-19 · **Version:** `20261019_1242`
**Status:** approved by the user after manual tests on the preview (all items OK); merge to `master` pending the user's go-ahead.

## Problem

1. **App start waited for the player CDN.** `hls.js` and `Artplayer` were blocking `<script>` tags right before `main.js`, so the whole app waited for jsDelivr, second by second (+20 s on the CDN meant the app started at 20.4 s). With the CDN down the app opened but the players broke: a TypeError in the movie/series player, and live TV walked every source to a misleading "Transmissão direta instável".
2. **Slow connections could not play anything** (found in the user's "Regular 3G" test of the first preview). The source start budgets (HLS 12 s, MP4 20 s, since 2026-10-08) are shorter than one segment on 3G (2 MB at ~94 KB/s is ~21 s), so every working source was dropped as dead and the movie ended in "Todas as fontes diretas falharam". Production behaves the same.

## Change

- `engine.js`: `ensurePlayerLibs()` injects both libraries with the same SRI hashes, once for every caller; TV and movie/series players wait for it. No timer cuts a slow download: after 8 s the loader says "Conexão lenta, carregando o player...", and only a real browser failure shows "Não foi possível carregar o player" with "Tentar de novo". A reset while waiting drops the pending mount (separate counters for TV and movie/series, since the TV reset runs on every tab switch). The source lookup starts the download; `main.js` preloads at idle. `index.html` lost the two tags; CSP unchanged.
- `engine.js` start monitor: past its budget, a source with data still arriving (hls.js fragment byte counters; media `progress` only when the browser downloads by itself) keeps its turn when it is about as fast as the viewer's connection (timed jsDelivr download, else `navigator.connection`), up to 90 s (180 s for the last source), with "Conexão lenta, carregando a fonte...". A source much slower than the viewer (under half) is a slow host and fails over at the normal budget; a dead source too; data that stops fails over ~10 s after the last byte. The first source stays the best measured quality (server ranking), so waiting never trades quality down; starting lighter on slow connections is left to B18.
- Tests: new `tools/player_libs_check.mjs` and `tools/slow_source_check.mjs`; `test_browser_sri.mjs` loads the libraries through the engine; `test_browser_sri.mjs` and `test_xss_protection.mjs` reuse a server already on 8787 (two servers on the same port, which Windows allows, made earlier runs fail at random).
- `CLAUDE.md`: commits and PRs never carry `Co-Authored-By` or AI attribution.

## Results

| Measure | Before | After |
|---|---|---|
| App start, CDN +20 s (Chrome, local) | 20.4 s | 0.3 s |
| App start, CDN down | 0.4 s, players broken | 0.4 s, clear error + retry |
| Movie "Hope" under emulated Regular 3G (Chrome, deployed) | production: all sources failed at 44 s | preview: playing at 94 s (~40 s of it in "Buscando fontes") |

Automated: `player_libs_check.mjs` 20/20 (Chrome, Firefox, and Chrome against the preview), `slow_source_check.mjs` 6/6, SRI 0 violations, XSS 24/24, `check_deployment.py` on the preview all passed, `player_touch_check.mjs` 17/17 (one flaky 16/17 run on a part not touched), `player_ui_check.mjs` 45/46 (the failure predates this work: it expects "Escolha um canal", text removed by F6). Manual: all items OK (see `tests.md`).

## Left open

- `player_ui_check.mjs` still looks for "Escolha um canal" (removed by F6): update the check to the new Canais start screen.
- "Buscando fontes" (`/api/resolve`) takes ~40 s on 3G: worth a look together with B7.
- Starting on a lighter source when the connection is slow ("Automático"): B18.
- Live TV keeps its fixed 12 s watchdog per source (not touched; live streams on 3G are a separate case, see F1).
