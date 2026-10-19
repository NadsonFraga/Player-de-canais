# Plan: server groups in movies/series/anime and card hover clipping

> Status: approved on 2026-10-19 with the user's changes below. Branch `feat/server-groups-and-card-hover`.

## User's decisions (2026-10-19)

- Colors: no new colors per server type; anything colored stays discreet and inside each tab's concept. The group tags are neutral; the active buttons keep today's colors.
- Remove "(BETA)" from the main players: they count as stable.
- Card hover: check Canais too (same clipping: `.channels-row-scroller`); search/explore grids are fine (no scroller).
- One hierarchy of names, the same in the UI and in what the code shows the viewer (never "player" for an inner link):

| Level | Name | Examples |
|---|---|---|
| Group | Players (sem anúncios) / Servidores externos (iframe) | the two blocks of the selector |
| Player | Player Principal, Player Animes (anime only) | our own players |
| Fonte | each link a player tries | "Conectando à fonte 2 de 5", live TV "Fonte 1 (Principal)" |
| Qualidade | resolutions of a fonte | 1080p, 720p |
| Servidor externo | another site's player in an iframe | "Servidor 1 (MGEB)" |

  Live TV follows it: its direct block is "Player Principal" listing fontes (names from `data/canais.json` shown as "Fonte N ..." by `liveSourceLabel`, data untouched), its iframes are "Servidores externos"; the player setting "Servidor Ativo" becomes "Fonte ativa". Messages: "O Player Principal não encontrou fontes...", "Nenhuma fonte do Player Principal respondeu...", "Fonte 1 não respondeu. Tentando a Fonte 2 (Backup)...". Internal ids (`native_direct`, `mgeb`...) are unchanged.

## 1. Direct players and iframes as separate groups (movies, series, anime)

**Today.** The movie modal (`movies.js`, `MOVIE_SERVERS` in `core/constants.js`) and the series/anime player (`series.js`, `SERIES_SERVER_OPTIONS`) list every server in one grid under "Selecione um Servidor para Reproduzir:". The native players ("Player Nativo - Sem Anúncios (BETA)", "Player Nativo Animes", anime only) sit next to the iframe servers (MGEB, SuperFlix, MyEmbed...), told apart only by the green active color. Live TV already splits them: "Transmissão Direta" with a green "Nativo • Sem Anúncios" badge, and "Servidores de Contingência" with an amber "Iframe Web" badge (`channels.js`, `.server-group-block`, `.servers-section-title`, `.badge-server-native`, `.badge-server-contingency` in `10-player-v3.css`).

**Change.**
- One shared helper (`core/serverGroups.js`) renders two groups inside the existing `#movie-servers-grid` / `#series-servers-grid` containers, reusing the TV section title and badges:
  - "Player Direto" + green badge "Nativo • Sem Anúncios": the native players.
  - "Servidores Externos" + amber badge "Iframe Web": the iframe servers, keeping their "Reproduzir" hint.
- Buttons keep the class `btn-movie-server` (existing active-state code and tests keep working); iframe buttons get an amber border and an amber active state, like the TV contingency buttons. Native keeps green.
- A group with no servers is not rendered. Phone: each group keeps the current 2-column grid.
- `movies.js` and `series.js` call the helper; no change to what each button does.
- D-pad: `remote.js` lists `.btn-movie-server-pill`, a class that does not exist, so the remote cannot reach these buttons today. Replace it with `.btn-movie-server`.

## 2. Poster card hover is clipped (square corners)

**Cause.** On hover `.movie-poster-card` grows (`scale(1.06) translateY(-4px)`: ~12 px above, ~5 px on each side) inside a horizontal scroller. A scroller with `overflow-x: auto` also clips vertically, and the room it leaves is smaller than the growth: `.movies-carousel-track` has 6 px on top and 4 px on the sides; `.home-row-scroller` (Home rows, also channel cards and continue cards) has none on top. So the top and the first card's left side are cut flat, losing the rounded corners and part of the border and glow.

**Change (general, every poster/channel row).** Give the scrollers room for the hover (about 14 px top, 10 px sides, 24 px bottom for the shadow) and cancel it with negative margins of the same size, so cards, titles and arrows stay exactly where they are. Applies to `.movies-carousel-track` (Filmes, Séries, Animes rows) and `.home-row-scroller` (Home). The phone rules (no hover there) keep their current spacing. No change to the zoom itself.

## Verification

- `node --check`, `check_js.py`, `bump_version.py --check`.
- Browser check (new, small): hover the first card of a row in Filmes and Home and compare the card box with the scroller box (no clipping); the server section of a movie and of an anime shows the two groups with the right buttons; click a native and an iframe server.
- Regression: `player_ui_check.mjs` (it clicks `#movie-servers-grid .btn-movie-server:not(.native-direct)`), `player_touch_check.mjs`.
- Manual: Chrome and Firefox, desktop and phone.
