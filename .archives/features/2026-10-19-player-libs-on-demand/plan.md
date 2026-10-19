# Plan: player libraries on demand (B11)

> Approved by the user on 2026-10-19 (option (a): keep jsDelivr, load on demand). No branch requested: work happens on `master`, uncommitted.

## Problem

`index.html` loads `hls.js` 1.5.8 and `Artplayer` 5.1.7 from jsDelivr as classic blocking scripts right before `main.js`. The module only runs after both arrive, so the whole app (catalogs, channels, everything) waits for the CDN even when no video is ever played.

Measured on 2026-10-19 (Chrome headless, local server, jsDelivr requests held with CDP `Fetch`):

| CDN | App starts (DOMContentLoaded) | First catalog image | Libraries |
|---|---|---|---|
| normal | 0.6 s | 1.4 s | loaded |
| +3 s | 3.4 s | 4.2 s | loaded |
| +10 s | 10.4 s | 11.3 s | loaded |
| +20 s | 20.4 s | 21.1 s | loaded |
| down | 0.4 s | 1.4 s | missing |

Sizes: hls.js 124 KB and Artplayer 37 KB compressed, ~0.3 s on a good connection.

Two more findings:
- `defer` alone does not help: deferred and module scripts run in document order, so `main.js` would still wait.
- With the CDN down the app opens, but the players break: `mountNativeSource` writes `window.Artplayer.SETTING_ITEM_HEIGHT` outside its `try` (uncaught TypeError, player never opens), and the TV player walks every source and ends in "Transmissão direta instável" although the sources are fine.

## Change

1. `engine.js`: `ensurePlayerLibs()` injects both scripts (same URLs, same SRI hashes, `crossorigin="anonymous"`), in order, and returns one shared promise. A failed load (the browser's `onerror`, which also covers an SRI mismatch) removes the tags and clears the promise so a retry starts clean.
2. **No hard timeout.** A slow connection is never cut: after ~8 s of waiting the loader says "Conexão lenta, carregando o player..." and keeps waiting. Only a real failure (`onerror`) shows an error panel with "Tentar de novo".
3. Both entry points wait for the libraries before building a player:
   - `mountTvDirectStream` (live TV): when the libraries are missing it shows the TV loader, waits, then mounts. The 12 s source watchdog starts only after the libraries are ready.
   - `mountNativePlayer` (movies, series, anime): same, with a loader inside the player stage. The source start budget starts only after the libraries are ready.
   - When the libraries are already there, both run synchronously exactly as today.
4. Stale mounts are dropped: a counter bumped by `atomicTvPlayerReset` (also called by `atomicPlayerReset`) invalidates a mount that was waiting when the viewer closed the player, switched channel/episode or left the tab. The existing modal visibility checks stay.
5. Early start: `resolveDirectStream` kicks `ensurePlayerLibs()` so the download overlaps the source lookup, and `main.js` preloads the libraries once the browser is idle after start (any tab), so the first player normally opens as fast as today.
6. `index.html`: the two `<script>` tags are removed. CSP unchanged (`cdn.jsdelivr.net` stays in `script-src`).
7. Tests: `tools/test_browser_sri.mjs` expected `window.Hls` at page load; it now checks the libraries load through `ensurePlayerLibs()` with SRI and no violation. New `tools/player_libs_check.mjs`: app start with the CDN delayed and down, player opening after an on-demand load, error panel and retry with the CDN down.

## Part 2: slow source start on a slow connection (approved 2026-10-19, same branch)

Found in the user's preview test with Firefox "Regular 3G": the libraries loaded, but the movie ended in "Todas as fontes diretas falharam". The start budgets (since 2026-10-08: HLS 12 s, MP4 20 s, last source 90 s) are shorter than one segment on 3G (1.94 MB at ~94 KB/s is ~21 s), so every live source was dropped as dead. Production behaves the same (B11 does not touch these budgets).

Change (`engine.js`, `mountNativeSource` start monitor):
- Data signal per source: hls.js fragment byte counters (updated during the download), playlist and fragment loaded events; the media `progress` event only when the browser downloads by itself (MP4, Safari HLS), since with hls.js it keeps firing without data.
- Past its budget, a source with data arriving at least every 10 s keeps its turn only if the slowness is the viewer's connection: its speed is at least half the viewer's speed (timed jsDelivr library download, else `navigator.connection.downlink`). Much slower than the viewer is a slow host: next source at the normal budget, as before. Viewer speed unknown: keep waiting while data flows. MP4 (no byte counter): wait only when the viewer's connection is slow (< 2 Mbps) or unknown.
- Caps: 90 s, 180 s for the last source. "Conexão lenta, carregando a fonte..." on the player while waiting.
- Answered with the user: the first source is the best measured quality (server ranking: alive, matching length, quality, host trust), so waiting on it never trades quality down; starting on a lighter source on slow connections belongs to B18.

Also: `test_browser_sri.mjs` and `test_xss_protection.mjs` reuse a server already on 8787 instead of starting a second one (Windows let both bind; requests hit either at random). New `tools/slow_source_check.mjs`: slow connection, slow host, dead source, data that stops.

## Out of scope

- Self-hosting the libraries (option (b), not chosen).
- Google Fonts in `<head>` (delays first paint only, `display=swap`).

## Verification

- `python tools/check_js.py`, `node --check` on changed files, `python tools/bump_version.py --check`.
- `tools/player_libs_check.mjs` in Chrome and Firefox.
- Regression: `tools/player_ui_check.mjs` and `tools/player_touch_check.mjs` (player change), `tools/test_browser_sri.mjs`.
