# Plan: title pages, new header, Coleção and accounts (big feature)

> **Status:** phase 1 approved on staging on 2026-10-20 (not in production: `master` gets the whole feature at the end). Next: phase 2.
> Replaces the separate backlog items F10 (Coleção and header), F11 (global search) and G7 (account); the 2026-10-19 draft in `features/2026-10-19-user-accounts-and-cloud-sync/plan.md` is reference only.
> References: FlyStream (title page, header pill, search overlay, settings menu), 7Movies and Stremio (Coleção tabs), Trakt and Letterboxd (ratings 1 to 10).

## Goal

1. Every movie, series and anime opens a **full-screen title page** (the "entretela") with all its information and a big "Assistir" button. The player also becomes a full-screen page; what happens inside the player stays as it is today.
2. A **new header**: one pill with the brand icon (goes to Início), the tabs, the profile avatar, global search and a settings (gear) menu.
3. **Coleção**: "Quero assistir", "Assistido" and "Avaliar" (5 stars with halves = 1 to 10) on the title page, and a Coleção screen with tabs.
4. **Account** without e-mail (nickname, password, recovery code) that syncs everything across devices. Later, outside this feature: Trakt/AniList, IMDb/Rotten Tomatoes scores, background trailer, Google sign-in, TV sign-in.

## Delivery flow

- One branch per phase, from `staging`: `feat/title-page`, `feat/new-header`, `feat/collection`, `feat/accounts`.
- Each phase: automated tests, merge into `staging`, push, checks on the staging URL, then a **hard stop** with the manual test list. The next phase starts only after the user's go-ahead.
- `master` (production) receives the **whole feature at once**, after the last phase is approved on staging.
- While `staging` is ahead of production, an urgent production fix goes on its own branch from `master`, is merged into `master`, and `master` is merged back into `staging`.

## Current state (what the code does today)

- Movies: `openMovieDetailsModal()` (`modules/movies.js`) opens `#movie-modal`, a dialog over the catalog. The player opens **inside the same card** (`#movie-modal-player-container`, the server groups below it). Only the list item is shown (poster, overview, TMDB score, title logo); no extra details request.
- Series and animes: `openSeriesModal()` (`modules/series.js`) opens `#series-modal` (details, seasons, arc/continuous modes, go to episode N) and fetches `tv/{id}?append_to_response=external_ids`; episodes play in a separate dialog `#series-player-view` (player, server groups, previous/next, episode drawer), always through `openEpisode()`.
- Entry points: catalog cards, hero "Assistir", Início rows, "Continuar assistindo", studio/director collections, search results (13 call sites).
- Back: `navigation/historyManager.js` keeps a layer stack (`modal-movie`, `player-movie`, `modal-series`...) and closes the top layer; the URL never changes.
- Stored data: `tvzinha_watch_progress_v1` (series by id, movies `movie:<id>`), `tvzinha_favorites` (channels), player preferences.
- `/api/tmdb` already allows every path this needs (`movie`, `tv`, `collection`, `person`, `discover`).

## Phase 1: title page and full-screen player (`feat/title-page`)

### Title page (movies, series and animes)

Top area, over the backdrop image (no trailer in the background for now):
- Title logo (PNG from TMDB, as today; the name in text when there is none), genres.
- Actions: big **Assistir** button ("Continuar de 12:34" for movies, "Continuar T2:E5" for series when there is progress), **+ Quero assistir**, **eye: Assistido**, **star: Avaliar** (5 stars with halves). Line icons only.
- Meta line: year, runtime (movies) or seasons and episodes (series), Brazilian age rating badge (L, 10, 12, 14, 16, 18), TMDB score.
- Director (movies) or creators (series), clickable to their titles. Overview with "Ler mais".
- Info card on the right (below the overview on phones): status, original language, release date, runtime with "termina às 16:38" (computed in the browser); for series: network, next episode date when announced.
- Production company logos, clickable to a list of that company's titles.

Below:
- Series and animes: seasons and episodes (the current panel: season select, arc and continuous modes, go to episode N), moved from the dialog to the page.
- Trailers: YouTube thumbnails; a click opens a small player over the page (youtube-nocookie embed). Shown only when TMDB has videos (pt-BR first, then English).
- Cast: photo, name and character; a click opens that person's titles.
- Collection (movies in a TMDB collection, e.g. "Homem-Aranha (MCU)").
- "Você pode gostar" (TMDB recommendations).
- The site footer.

Data: one request per page through `/api/tmdb`, with `append_to_response` (movies: credits, videos, recommendations, release_dates, images; series: aggregate_credits, videos, recommendations, content_ratings, images, external_ids), plus `collection/{id}` when the movie belongs to one. The series request replaces the current `tv/{id}?append_to_response=external_ids`, and `rememberShowDetails` keeps it, so `openEpisode()` reuses it with no extra request. Edge cache of 30 min as today.

### Full-screen player

- "Assistir" opens the player page in full screen. Movies get the same layout the series player has today (title bar, player, server groups below); what plays and how does not change.
- Back from the player returns to the title page; Back from the title page returns to where the user was (catalog, Início, search, Coleção).
- Episodes keep the single entry point `openEpisode()`; hero "Assistir" and "Continuar assistindo" open the title page and start playback right away, so Back lands on the page.

### Navigation and links

- One module `modules/titlePage.js` with `openTitle(kind, item, options)`; the 13 call sites switch to it, and `#movie-modal` and `#series-modal` (and their dead code and CSS) are removed.
- History layers `title` and `player` in `historyManager.js`; TV remote focus list (`navigation/remote.js`) updated.
- The URL reflects the open title (`?filme=ID`, `?serie=ID`, `?anime=ID`): reload keeps the page, and the link can be shared. The path stays `/`, so Cloudflare needs no routing change.

### Local library (base for Coleção and sync)

- `core/library.js`, key `tvzinha_library_v1`: one entry per title (`movie:<id>`, `tv:<id>`) with title and poster, and three fields, each with its own change time: `watchlist`, `watched`, `rating` (1 to 10). Removing sets the field off with a time instead of deleting it, so a later sync can tell "removed" from "never set".
- The buttons on the title page read and write it in this phase; the Coleção screen comes in phase 3.

### Tests

- New `tools/title_page_check.mjs`: a movie, a series and an anime; desktop and phone; every section rendered or hidden when empty; Assistir, Back chain (player, page, catalog); URL reload; buttons persist after reload.
- Update the scripts that use `#movie-modal` and `#series-modal` (`player_ui_check`, `episode_entry_check`, `continue_watching_check`, `tab_reset_check`, `server_groups_check` and others); Chrome and Firefox; several titles.

## Phase 2: new header and global search (`feat/new-header`)

- One pill: brand icon only, no name (goes to Início), Canais, Filmes, Séries, Animes, Esportes ("em breve"), a thin divider, profile avatar, search, gear. Phones: icons only, as today.
- Avatar: until the account exists, a default avatar with a menu (Coleção, Entrar / Criar conta marked "em breve"). Profiles (Netflix style) come with the account in phase 4.
- Search (F11): an overlay over the page, results while typing (short pause so TMDB is not flooded), category selector (Tudo, Filmes, Séries, Animes, Canais, Pessoas); a result opens the title page.
- Gear menu, grouped: Coleção and Continuar assistindo; player preferences; ad-block and DNS tips; Privacidade and Termos. Account items come in phase 4.

### Phase 2 decisions (user, 2026-10-20)

- The "Início" tab leaves the pill: the brand icon (TV, no name) takes you home.
- Order of the icons after the tabs: search, profile, settings.
- Phones (revised the same day after testing on staging): one row with the tab icons and a single round profile button at the right that opens one menu (Buscar, Continuar assistindo, Entrar, tips, legal panels). The pill stays fixed: hiding it on scroll looked buggy on a real phone and was removed. The title page gets a dark band at the top on phones, like the catalog tabs, so the pill does not cover the picture.
- Profile before the account exists: a neutral line avatar; its menu has "Continuar assistindo" and "Entrar ou criar conta" (marked em breve); Coleção joins in phase 3.
- Settings menu: Continuar assistindo, ad-block and DNS tips, Privacidade, Termos de uso, DMCA.
- Global search: overlay, results from 2 letters after a 0.35 s pause, categories Tudo, Filmes, Séries, Animes, Canais, Pessoas; one /api/tmdb call per search (channels searched locally); the tab searches with filters stay.

## Phase 3: Coleção (`feat/collection`)

- New "Coleção" screen (from the avatar and gear menus) with tabs: Assistindo (from the watch progress), Quero assistir, Assistidos, Avaliados, Canais favoritos; filter Filmes / Séries / Animes.
- "Gostou? Avalie" card: at the end of a movie (when the credits start, if known, or when it ends) and at the end of the last episode of a series; 5 stars with halves and "Agora não".
- Reaching the end marks the title as Assistido and removes it from "Continuar assistindo".

## Phase 4: account and sync (`feat/accounts`)

Gets its **own detailed plan before any code** (security and data), built on the 2026-10-19 decisions and the review points in the backlog (G7):
- Optional account: nickname, password (hashed, never stored as text), recovery code shown once. No e-mail. Login attempt limits.
- Cloudflare D1 database; a separate database for previews; local mirror in `tools/local_server.py`.
- Sync per item using the per-field change times from phase 1, merged on the server; removals and "Começar do início" propagate.
- What syncs: library (Quero assistir, Assistidos, notas), watch progress, channel favorites, preferences.
- Profiles per account (Netflix style): profile picker screen, create, rename and remove profiles; each profile has its own library, progress and favorites.
- Avatar menu: Entrar / Criar conta, Sair, Trocar perfil.
- Rewrite Privacidade and Termos (what the account stores, where, how to delete it).

## Out of this feature (later)

Trakt and AniList (send Quero assistir, Assistidos, notas and progress; import), IMDb and Rotten Tomatoes scores (needs another service, OMDb or MDBList, with its own key), background trailer, Google sign-in, TV sign-in with a code.

## Decisions (user, 2026-10-20)

1. Brand inside the pill, icon only (no name), replacing the 7Movies layout chosen on 2026-10-19.
2. Netflix-style profiles: yes, in phase 4 with the account (each account has its own profiles). The phase 1 library must allow a profile id later.
3. Trailers: small player inside the site (youtube-nocookie) with an "Abrir no YouTube" link; when a video refuses embedding (YouTube errors 101/150/153) or the embed gives trouble, open YouTube in a new tab instead.
4. Reaching the end marks the title as Assistido automatically.
5. The address shows the open title (`?filme=ID`, `?serie=ID`, `?anime=ID`).
