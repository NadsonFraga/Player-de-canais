# Tests: player libraries on demand (B11)

**Date:** 2026-10-19 · **Branch:** none (`master`, uncommitted) · **Version:** `20261017_0211` (bump at deploy)

## Automated

| Suite | Result | Notes |
|---|---|---|
| `node --check`, `python tools/check_js.py`, `python tools/bump_version.py --check` | PASS | 0 missing imports, one version |
| `node tools/player_libs_check.mjs --browser=chrome` | 20/20 | new: CDN held, slow note, reset drops waiting mount, CDN down (movie stage and live TV) with retry, normal CDN |
| `node tools/player_libs_check.mjs --browser=firefox` | 20/20 | same, WebDriver BiDi intercepts |
| `node tools/test_browser_sri.mjs` | PASS | libraries loaded through `ensurePlayerLibs()`, 0 SRI violations |
| `node tools/player_ui_check.mjs` (Chrome) | 45/46 | the 1 failure predates this change: it expects the text "Escolha um canal", removed by the F6 redesign; the real condition (no player left, `players: 0`) passes |
| `node tools/player_touch_check.mjs` | 17/17 | |

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
