# Tests: title pages, new header, Coleção and accounts

## Phase 1: title page and full-screen player (`feat/title-page` -> `staging`)

**Date:** 2026-10-20 · **Staging:** https://staging.tvzinhaonline.pages.dev

### Automated

Filled in at the end of the phase (see the phase 1 report in the chat).

### Manual (user, on staging)

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
| 14 | The banner "Assistir" on Início, Filmes, Séries and Animes | Opens the title page (Filmes: and starts playing) | |
