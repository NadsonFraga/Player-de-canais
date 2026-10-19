# Tests: player libraries on demand (B11) and slow source start

**Date:** 2026-10-19 · **Branch:** `feat/player-libs-on-demand` · **Version:** `20261019_1242`
**Preview:** https://feat-player-libs-on-demand.tvzinhaonline.pages.dev

## Automated

| Suite | Result | Notes |
|---|---|---|
| `node --check`, `python tools/check_js.py`, `python tools/bump_version.py --check` | PASS | 0 missing imports, one version |
| `node tools/player_libs_check.mjs --browser=chrome` | 20/20 | new: CDN held, slow note, reset drops waiting mount, CDN down (movie stage and live TV) with retry, normal CDN |
| `node tools/player_libs_check.mjs --browser=firefox` | 20/20 | same, WebDriver BiDi intercepts |
| same check against the preview URL (real Cloudflare headers), Chrome and Firefox | 20/20 each | the first preview run found a shared reset counter (a TV reset could drop a waiting movie/episode); fixed in `26cbbad` |
| `python tools/check_deployment.py <preview>` | ALL PASSED | |
| `node tools/test_browser_sri.mjs` | PASS | libraries loaded through `ensurePlayerLibs()`, 0 SRI violations |
| `node tools/player_ui_check.mjs` (Chrome) | 45/46 | the 1 failure predates this change: it expects the text "Escolha um canal", removed by the F6 redesign; the real condition (no player left, `players: 0`) passes |
| `node tools/player_touch_check.mjs` | 17/17 | part 2: one run 16/17 ("double tap in the middle toggles play/pause"), then 17/17 twice: flaky, code not touched |
| `node tools/slow_source_check.mjs` (part 2, Chrome) | 6/6 | slow connection 400 kbps: source 51 KB/s vs connection 43 KB/s, waits, plays at 38.8 s with no failover; slow host 37 KB/s vs connection 1268 KB/s: next source at 12 s; dead source: next at 20 s; data stops at 23 s: next at 33 s |
| `node tools/test_xss_protection.mjs` | 24/24 | now reuses the running server |

App start (DOMContentLoaded), Chrome, local server, jsDelivr held by CDP:

| CDN | Before | After |
|---|---|---|
| normal | 0.6 s | 0.4 s |
| +3 s | 3.4 s | 0.3 s |
| +10 s | 10.4 s | 0.4 s |
| +20 s | 20.4 s | 0.3 s |
| down | 0.4 s (players broken) | 0.4 s (clear error + retry) |

## Manual (for the user, on the preview or localhost)

| # | Steps | Expected | Result |
|---|---|---|---|
| 1 | Open the site (PC, Chrome), wait 5 s, open a channel (Band) | plays as before, no extra wait | |
| 2 | Open a movie right after the site opens, before 2 s | "Buscando fontes..." then plays normally | |
| 3 | Series and anime episodes: next/previous, continuous list, resume card | plays as before | |
| 4 | Phone (LAN IP), 4G: open the site, then a channel and an episode | site opens at once; players as before | |
| 5 | DevTools > Network > block `cdn.jsdelivr.net`, reload, open a channel | site opens; "Não foi possível carregar o player" with "Tentar de novo" | |
| 6 | Same as 5, then unblock and click "Tentar de novo" | player opens | |
| 7 | DevTools > Network throttling "3G", reload, open a movie at once | "Carregando o player..." then, after 8 s if still loading, "Conexão lenta, carregando o player..."; it opens when ready | |
| 8 | Firefox: items 1 and 3 | same as Chrome | |
| 9 | Item 7 again (Firefox or Chrome, "Regular 3G"), same movie (Hope: O Primeiro Impacto) | first try (before part 2): libraries OK, then "Todas as fontes diretas falharam". Now: after ~12 s "Conexão lenta, carregando a fonte..." and the movie starts (may take 30-60 s) | libraries OK, sources failed (before part 2) |
| 10 | Without throttling: a movie, a series episode and an anime episode | they start as fast as before (no extra wait) | |
