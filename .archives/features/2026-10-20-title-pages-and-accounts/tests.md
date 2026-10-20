# Tests: title pages, new header, Coleção and accounts

## Phase 1: title page and full-screen player (`feat/title-page` -> `staging`)

**Date:** 2026-10-20 · **Staging:** https://staging.tvzinhaonline.pages.dev

### Automated

Version `20261020_1520`, commit `8e6ad58`, merged into `staging` as `bb44405`.

| Check | Result |
|---|---|
| `node --check`, `check_js.py`, `bump_version.py --check`, tag balance of `index.html` | PASS |
| `title_page_check.mjs` (new): movie, series, anime, Back chain, stacked titles, cast list, library buttons after reload, title link, tab switch, phone width | 27/27 Chrome, 27/27 Firefox, 27/27 against staging |
| `episode_entry_check.mjs` | 52/52 |
| `continue_watching_check.mjs` | 9/9 |
| `server_groups_check.mjs` | 12/12 |
| `tab_reset_check.mjs` | all passed |
| `player_ui_check.mjs` | 45/46: only the outdated "Escolha um canal" check (B21), same as before the phase |
| `player_touch_check.mjs` | 16/17: only the flaky double tap (B21) |
| `check_deployment.py` on staging | ALL PASSED |

Fixed during the phase: a tab switch right after Back could be undone by the grouped history step (batches now count inside the 60 ms window after a popstate, and tab switches wait for a pending grouped step).

### Manual (user, on staging)

**Result:** approved by the user on 2026-10-20 ("tudo certo"), after these adjustments on staging: sideways rows for trailers, cast (directors look), collection and recommendations; smooth loading of the top; upcoming episodes greyed out with their release date; facts card without original language and network; banner "Assistir Agora" opens the title page everywhere.

| # | Steps | Expected | Result |
|---|---|---|---|
| 1 | Filmes: open any movie from a row | Full page: title logo, genres, Assistir, +, eye, star, year / duration / age rating / score, Direção, overview with "Ler mais", facts card on the right ("termina às"), company logos | |
| 2 | Scroll down the same movie | Trailers, Elenco, the movie's collection (try a Marvel or Harry Potter movie), "Você pode gostar"; empty sections do not show | |
| 3 | Click a trailer | Small player over the page; "Abrir no YouTube" opens it in a new tab; Back or X closes it | |
| 4 | Click an actor, then a company logo | A list of their titles; "Carregar mais" on companies; Back returns to the movie | |
| 5 | Click a movie in "Você pode gostar", then Back | The new movie opens on the page; Back returns to the first one | |
| 6 | Assistir on a movie | Player in full screen, Player Principal starts; the arrow returns to the page; X goes to Filmes | |
| 7 | A series (Friends) and an anime (One Piece, Naruto) | Episodes on the page: seasons, continuous list, "ir para N"; an episode opens the full-screen player; previous / next work; Back returns to the page | |
| 8 | Início: a "Continuar assistindo" card (movie and series) | The page opens and playback starts; Back lands on the page | |
| 9 | +, eye and star (try half a star) on a title, then reload the page | The buttons keep their state after the reload | |
| 10 | Copy the address of an open title (`?filme=...`) and open it in another tab | The same page opens | |
| 11 | With a page open, click a tab on the pill (Filmes, Séries, Início) | The page closes and the tab shows | |
| 12 | Phone (Chrome Android): items 1, 6, 7 and the phone's Back button | Layout fits the screen; Back closes player, then page | |
| 13 | Firefox: items 1, 6 and 7 | Same as Chrome | |
| 14 | The banner "Assistir Agora" on Início, Filmes, Séries and Animes | Always opens the title page (decided on 2026-10-20: same behavior everywhere); a live channel on the Início banner still opens the channel | |

## Phase 2: new header and global search (`feat/new-header` -> `staging`)

**Date:** 2026-10-20 · **Staging:** https://staging.tvzinhaonline.pages.dev

### Automated

Version `20261020_1704`, commit `42c7180`, merged into `staging` as `52163e1`.

| Check | Result |
|---|---|
| `node --check`, `check_js.py`, `bump_version.py --check`, tag balance of `index.html` | PASS |
| `header_check.mjs` (new): brand, Esportes, tool order, menus and Back, Privacidade and tips from the menu, "/" shortcut, one request per search, category filter without a new request, result opens the title page, channels first and opening, phone tools pill (under the tabs, tucks on scroll, clear of the title page back button) | 21/21 Chrome, 21/21 Firefox, 21/21 against staging |
| `title_page_check.mjs` | 28/28 |
| `tab_reset_check.mjs` | all passed |
| `channels_redesign_check.mjs` | 10/10 |
| `player_touch_check.mjs` | 17/17 |
| `player_ui_check.mjs` | 43/46: "Escolha um canal" (B21), DBZ T9E31 fixed waits (B21, now failing more often), and once "opening movies right after the app starts" (start-up race, noted in B21) |
| `check_deployment.py` on staging | ALL PASSED |

### Manual (user, on staging)

| # | Steps | Expected | Result |
|---|---|---|---|
| 1 | Look at the pill on the computer | TV icon (no "Início" tab), Canais, Filmes, Séries, Animes, Esportes dimmed with no badge, then search, profile, settings; everything centered | |
| 2 | Click the TV icon from another tab; click Esportes | Goes to Início; Esportes shows "em breve" and stays | |
| 3 | Profile icon | Menu: Visitante, "Continuar assistindo" (goes to the row on Início), "Entrar ou criar conta" (em breve) | |
| 4 | Settings icon | Menu: ad-block tips, Privacidade, Termos de uso, DMCA; each opens its panel | |
| 5 | Search icon, or "/" on the keyboard | Search opens with the cursor in the field; results while typing; Tudo / Filmes / Séries / Animes / Canais / Pessoas | |
| 6 | Search a movie, a series, an anime, a person ("Tom Hanks") and a channel ("globo", "espn") | Each kind shows; a title opens its page; a person opens their titles; a channel opens the channel | |
| 7 | Back (or Esc) with a menu or the search open | Closes it and nothing else | |
| 8 | Phone: the pill | One row: TV icon, tab icons and a round profile button at the right (option B, decided 2026-10-20); the pill stays fixed (hiding it on scroll was removed on 2026-10-20) | |
| 9 | Phone: the profile button, the search, Canais and a title page | One menu with Buscar, Continuar assistindo, Entrar (em breve), tips and the legal panels; search fills the screen; nothing covered | |
| 10 | Firefox: items 1, 5 and 6 | Same as Chrome | |
| 11 | A movie collection with titles not out yet (Vingadores) | Those cards are dimmed with an "Em breve" tag and still open their page; there, the button reads "Em breve · estreia em ..." and does not play; the search does not list them | |
