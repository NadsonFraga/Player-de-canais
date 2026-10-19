# Tests: server groups, naming and card hover

**Date:** 2026-10-19 · **Branch:** `feat/server-groups-and-card-hover` · **Version:** `20261019_1409`
**Preview:** https://feat-server-groups-and-card.tvzinhaonline.pages.dev (Cloudflare cuts the branch alias at 28 characters)

## Automated

| Suite | Result | Notes |
|---|---|---|
| `node --check`, `python tools/check_js.py`, `python tools/bump_version.py --check` | PASS | |
| `node tools/player_ui_check.mjs` | 45/46 | the old failure (text "Escolha um canal" removed by F6, B21) |
| `node tools/player_touch_check.mjs` | 17/17 | |
| `node tools/player_libs_check.mjs` | 20/20 | first run stopped at "app starts with jsDelivr down" (flaky), second run 20/20 |
| `node tools/server_groups_check.mjs` (new, Chrome) | 12/12 | hovered first card not clipped in Home, Filmes and Canais (0 px on every side), no sideways page scroll; movie: "Players" (Player Principal) + "Servidores externos" (6), no "BETA"; anime: Player Principal + Player Animes, "Servidor 1 (MGEB)" first; live TV: "Player Principal" with "Fonte 1 · SP (Principal)"... and "Servidores externos" |

## Manual (user, on the preview)

The user reported every item OK on 2026-10-19 ("Considere tudo certo"). During item 3 the player looked smaller with black side bars: measured identical on production and preview (718x404 at a 604 px tall window, 832x468 at 900 px); the stage follows the window height (`100vh - 200px`), and the window was short (DevTools open). Not changed, at the user's request.

| # | Steps | Expected | Result |
|---|---|---|---|
| 1 | PC: Filmes, pass the mouse over the first card of a row, then others | the card grows with its rounded corners and border whole, nothing cut flat | OK (user, 2026-10-19) |
| 2 | Same on Séries, Animes, the home screen rows and Canais | same | OK (user, 2026-10-19) |
| 3 | Compare the rows with production | cards, titles and arrows in the same place as before | OK (user, 2026-10-19) |
| 4 | Open a movie | "Escolha um player ou servidor:", group "Players" (Player Principal) and group "Servidores externos" (Servidor 1 (MGEB)...), discreet gray tags, no "BETA" | OK (user, 2026-10-19) |
| 5 | Click Player Principal, then a servidor externo | both play; the active button keeps today's colors | OK (user, 2026-10-19) |
| 6 | Open an anime episode, then a series episode | anime: Player Principal and Player Animes; series: only Player Principal | OK (user, 2026-10-19) |
| 7 | Canais: open Band | "Players e servidores"; block "Player Principal" with "Fonte 1 · SP (Principal)", "Fonte 2 · SP (Backup)"...; block "Servidores externos" | OK (user, 2026-10-19) |
| 8 | Canais: player settings | "Fonte ativa" instead of "Servidor Ativo" | OK (user, 2026-10-19) |
| 9 | Phone | server groups in 2 columns; rows unchanged (no hover on phones) | OK (user, 2026-10-19) |
| 10 | Firefox: items 1, 4 and 7 | same as Chrome | OK (user, 2026-10-19) |
