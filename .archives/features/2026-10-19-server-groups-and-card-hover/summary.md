# Summary: server groups, one naming hierarchy and unclipped card hover (B22)

**Branch:** `feat/server-groups-and-card-hover` · **Date:** 2026-10-19 · **Version:** `20261019_1409`
**Preview:** https://feat-server-groups-and-card.tvzinhaonline.pages.dev (Cloudflare cuts the branch alias at 28 characters)
**Status:** approved by the user after manual tests on the preview (all items OK).

## Problem

1. The movie and series/anime selectors listed our own players and the iframe servers in one grid; live TV already split them.
2. Names mixed levels ("Player Nativo - Sem Anúncios (BETA)", "Servidor 1 (MGEB - Principal)", "Alternando para servidor reserva", "Servidor Ativo" for a link of the TV player), so the viewer could not tell a player from a link inside it.
3. Hovering the first card of a row cut its top and side flat (rounded corners lost): a horizontal scroller also clips vertically, and its padding (6/4 px, none on Home and Canais rows) was smaller than the zoom (~12 px up, ~5 px each side).

## Change

- `core/serverGroups.js`: `renderServerGroups` builds "Players" (tag "Sem anúncios") and "Servidores externos" (tag "Iframe") for `movies.js` and `series.js`; neutral tags, active buttons keep their colors (the user asked for no new colors). `liveSourceLabel` shows a TV direct link as a fonte of its Player Principal ("Fonte 1 · SP (Principal)", "Fonte 2 (Backup)"); `data/canais.json` untouched.
- Names: Group (Players / Servidores externos) > Player (Player Principal, Player Animes) > Fonte > Qualidade; Servidor externo for iframes. "(BETA)" removed. TV: "Players e servidores", "Player Principal" block, "Servidores externos" block, "Fonte ativa" setting, "Fonte 1 não respondeu. Tentando a Fonte 2 (Backup)...". Playback messages in movies, series/anime and TV use the same words. Internal ids unchanged.
- `remote.js`: the D-pad looked for `.btn-movie-server-pill`, a class that does not exist; now `.btn-movie-server`.
- CSS: on desktop with a mouse, `.movies-carousel-track`, `.home-row-scroller` and `.channels-row-scroller` get room for the zoom, cancelled by negative margins (nothing moves). Phones unchanged.
- `channels.js` escapes the source and server names it renders.

## Results

New `tools/server_groups_check.mjs`: 12/12 locally and on the preview (0 px clipped in Home, Filmes and Canais, no sideways scroll; groups and names in a movie, an anime and live TV). `player_touch_check.mjs` 17/17, `player_libs_check.mjs` 20/20 (one flaky first run), `player_ui_check.mjs` 45/46 (old failure, B21). Manual: all items OK.

Noted during the tests, not changed (user's decision): with a short window (DevTools open) the movie player shrinks with black side bars, because the stage follows the window height (`100vh - 200px`); same on production.
